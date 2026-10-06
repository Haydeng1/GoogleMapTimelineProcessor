import express from 'express';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import fs from 'fs';
import bfj from 'bfj';


const app = express();
const PORT = 5000;
const corsOptions = {
    origin: [ 'http://localhost:5173'], // Allowed domains
    methods: ['GET', 'POST', 'PUT', 'DELETE'],                    // Allowed HTTP verbs
    credentials: true                                            // Allow cookies/auth headers if needed
};
app.use(cors(corsOptions));


/*path.join("./", */
const db = new sqlite3.Database("LoadedMapData.db", (err) => {
  if (err) console.error('Database connection crash:', err.message);
  else console.log('Connected natively to timeline.db');
});
/*
* Table - all Visit's -> topCandidate, placeID, and PlaceLocation saved. 
* Table - all Distance Segments -> startTime, endTime, startLatLng, endLatLng, distanceMeters saved.
* Table - all Timeline Path Segments -> startTime, endTime, and all LatLng points saved.
* 
*/
db.serialize(() => {
  db.run(` CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startTime TEXT, 
    endTime TEXT, 
    placeID TEXT,
    lat REAL, lng REAL,
    localDate TEXT, 
    minutes INTEGER, 
    dow INTEGER,
    UNIQUE(startTime, placeID)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startTime TEXT,
    endTime TEXT,
    startLat REAL, startLng REAL, 
    endLat REAL, endLng REAL,
    distanceMeters REAL,
    UNIQUE(startTime, endTime, startLat)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS timelinepoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startTime TEXT, localDate TEXT, minutes INTEGER, dow INTEGER,
    endTime TEXT,
    timeline TEXT,
    UNIQUE(startTime, endTime)
  )`);
});


async function BatchInsert(chunkSegments) {
  
  const stmt = db.prepare("INSERT OR IGNORE INTO visits (startTime,endTime, placeID, lat, lng, minutes, dow) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (err) => {
    if (err) console.error("Insert failed:", err.message);
  });
  const stmt2 = db.prepare("INSERT OR IGNORE INTO activities (startTime, endTime, startLat, startLng, endLat, endLng, distanceMeters) VALUES (?, ?, ?, ?, ?, ?, ?)", (err) => {
    if (err) console.error("Insert failed:", err.message);
  });
  const stmt3 = db.prepare("INSERT OR IGNORE INTO timelinepoints (startTime, endTime, timeline) VALUES (?, ?, ?)", (err) => {
    if (err) console.error("Insert failed:", err.message);
  });

  await db.run('BEGIN TRANSACTION;'); // Start a transaction
  try {
      if (!chunkSegments || !Array.isArray(chunkSegments) || chunkSegments.length === 0) {
        console.log('No segments to process in this batch. Skipping...');
          return resolve();
      }

      console.log(`Processing batch of ${chunkSegments.length} segments...`);

      chunkSegments.forEach(segment => {
          const startTime = segment.startTime || '';
          const endTime = segment.endTime || '';
          // console.log(`Processing segment: ${JSON.stringify(segment)}`);
          if(segment.activity) {
            const [startLat, startLng] = segment.activity.start?.latLng.replaceAll("°","").split(",") || '';
            // const startLat = startlatlng[0] || '';
            // const startLng = startlatlng[1] || '';
            const [endLat, endLng] = segment.activity.end?.latLng.replaceAll("°","").split(",") || '';
            // const endLat = endLatLng[0] || '';
            // const endLng = endLatLng[1] || '';
            const distanceMeters = segment.activity.distanceMeters || 0;
            stmt2.run(startTime, endTime, startLat, startLng, endLat, endLng, distanceMeters);
            return; 
          }

          if(Array.isArray(segment.timelinePath)) {
              const latLngPoints = "[[" +  segment.timelinePath.map(point => point.point.replaceAll("°","")).join('],[') + "]]";
              stmt3.run(segment.startTime, segment.endTime, latLngPoints);
              return;
          }

          if(segment.visit?.topCandidate?.placeId && segment.visit.topCandidate.placeLocation?.latLng) {
            const placeID = segment.visit.topCandidate.placeId;
            const placeLoc = segment.visit.topCandidate.placeLocation.latLng;
            const [lat, lng] = placeLoc.replaceAll("°","").split(",");
            stmt.run(startTime, endTime, placeID, lat, lng, );
            return;
          }
      });

      console.log(`Batch of ${chunkSegments.length} segments processed. Committing transaction...`);

      db.run("COMMIT", (err) => {
        if (err) {
          console.error('Error committing transaction:', err);
        }
      });
    } catch (err) {
      db.run("ROLLBACK;"); // Revert this chunk if it fails
      console.log('Error during batch processing:', err);
      reject(err);
    }
}

const upload = multer({ dest: 'uploads/', // Creates an 'uploads' directory automatically,
    limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB in bytes
  }  });


app.post('/api/upload-json', upload.single('json_file'), async (req, res) => {  
  if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Path where the large file is temporarily stored on disk
  const filePath = req.file.path; 

  try {
    // 3. Use bfj to parse the file line-by-line / key-by-key
    // This looks for the "semanticSegments" key and streams its items.
    const rawData = await bfj.parse(fs.createReadStream(filePath));
    const segments = rawData.semanticSegments;

    console.log('Parsed semanticSegments');
    console.log('Total segments found:', segments ? segments.length : 0);
    if (!segments || !Array.isArray(segments)) {
      // Clean up file from disk if data is invalid
      fs.unlinkSync(filePath); 
      return res.status(400).json({ error: 'No semanticSegments found in JSON.' });
    }

    let processedCount = 0;
    
    for (let i = 0; i < segments.length; i += 500) {
      console.log(`Processing batch ${i} to ${Math.min(i + 500, segments.length)} of ${segments.length}`);
      const chunk = segments.slice(i, i + 500); // Process 1000 segments at a time
      
      // Wait for the batch transaction to successfully commit before proceeding
      await BatchInsert(chunk);
      
      processedCount += chunk.length;
      console.log(`Successfully committed batch. Progress: ${processedCount}/${segments.length} segments.`);
    }

    stmt.finalize();
    stmt2.finalize();
    stmt3.finalize();
    // 5. Delete the temporary file from your server disk to save space
    fs.unlinkSync(filePath);
    res.json({ message: 'JSON file processed and data inserted into the database.' });
  } catch (e) {
    fs.unlinkSync(filePath);
    res.status(400).json({ error: 'Invalid JSON file structure.' });
  }
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// 5. Catch-all route: Routes any non-API browser requests back to React
// app.get('/*', async (req, res) => {
//    res.status(404).send('Not Found').json({ error: 'Not Found' });
// });

app.get('/api/visited-places', (req, res) => {
  try {
    let { startDate, endDate, allDay, businessDaysOnly, startTime, endTime } = req.query;
    console.log(`Received query parameters: startDate=${startDate}, endDate=${endDate}, allDay=${allDay}, businessDaysOnly=${businessDaysOnly}, startTime=${startTime}, endTime=${endTime}`);
    if (allDay === 'true') {
      startTime = "00:00";
      endTime = "23:59";
    }

    // REMOVED quotes around the ? placeholders
    const sql = `SELECT * FROM visits WHERE substr(startTime, 1, 10) >= date(?) AND substr(startTime, 1, 10) <= date(?) AND (substr(startTime, 12, 8) >= time(?) AND substr(startTime, 12, 8) <= time(?))` + (businessDaysOnly === 'true' ? ' AND strftime("%w", startTime) NOT IN ("0", "6")' : '');
    
    // Await the promise directly instead of passing a callback
    db.all(sql, [startDate, endDate, startTime, endTime], (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        throw err; // This will be caught by the outer try-catch
      }
        // db.get returns a single row object or undefined. If you expected an array, use db.all instead.
      if (!result) {
        console.log(`Query executed successfully. Retrieved 0 records.`);
        return res.json({ message: 'No records found for the given parameters.' });
      }

      console.log(`Query executed successfully - ${result.length} records retrieved.`);
      return res.status(200).json(result);
      // return result; // Return the result to the outer scope
    });
    

  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).json({ error: 'Database query failed.' });
  }
});

app.get('/api/activities', (req, res) => {
  try {
    let { startDate, businessDaysOnly, lat, lng } = req.query;

    console.log(`Received query parameters: startDate=${startDate}, businessDaysOnly=${businessDaysOnly}, lat=${lat}, lng=${lng}  `);
    lat = lat + '%';
    lng = lng + '%';
    console.log(`Modified lat/lng for SQL LIKE query: lat=${lat}, lng=${lng}`);
    // REMOVED quotes around the ? placeholders
    const sql = `SELECT * FROM activities WHERE substr(startTime, 1, 10) = date(?) and endLat like ? and endLng like ?` + (businessDaysOnly === 'true' ? ' AND strftime("%w", startTime) NOT IN ("0", "6")' : '');

    // Await the promise directly instead of passing a callback
    db.all(sql, [startDate, lat, lng], (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        throw err; // This will be caught by the outer try-catch
      }
        // db.get returns a single row object or undefined. If you expected an array, use db.all instead.
      if (!result) {
        console.log(`Query executed successfully. Retrieved 0 records.`);
        return res.json({ message: 'No records found for the given parameters.' });
      }

      console.log(`Query executed successfully - ${result.length} records retrieved.`);
      return res.status(200).json(result);
      // return result; // Return the result to the outer scope
    });
    

  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).json({ error: 'Database query failed.' });
  }
});

const server = app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));

server.timeout = 0; 
server.keepAliveTimeout = 0;