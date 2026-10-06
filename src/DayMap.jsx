import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
const OSMAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
import VisitItem from './VisitItem.jsx';


function DayMap({ MapData }) {
    const position = [-34.9922002,138.5970421];
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [dataProcessed, setDataProcessed] = useState({}); // State to hold the processed data grouped by placeId
    const [activityData, setActivityData] = useState([]); // State to hold the activity data

    useEffect(() => {
        let dataProcessing = {};
        if (!MapData || MapData.length <= 0) {
            return;
        }
        // Process the MapData to group by placeId
        for (const dataPoint of MapData) {
            const { placeID, startTime, endTime, lat, lng } = dataPoint;
            if (!dataProcessing[placeID]) {
                dataProcessing[placeID] = [];
            }
            dataProcessing[placeID].push(dataPoint);
        }
        console.log('Processed MapData:', dataProcessing);
        setDataProcessed(dataProcessing);
        dataProcessing = {};
    }, [MapData]);

    const handlePoppupOpen = (date) => {
        console.log(`Popup opened for date: ${date}`);
        // Fetch activity data for the specific placeID
        fetch(`http://localhost:5000/api/activity?startDate=${date}`)
            .then(response => response.json())
            .then(data => {
                console.log(`Activity data for date ${date}:`, data);
                setActivityData(data);
            })
            .catch(error => {
                console.error(`Error fetching activity data for date ${date}:`, error);
            });
    };

    return (
    <>
        <MapContainer  center={position} zoom={10} scrollWheelZoom={true}>
            <TileLayer 
            attribution={OSMAttribution}
            url={TileUrl}
            />
            {Object.entries(dataProcessed).map(([placeID, points]) => (
                <Marker key={placeID} position={[points[0].lat, points[0].lng]} >
                    <Popup>
                        <div>
                            <h3>Place ID: {placeID}</h3>
                            <ul>
                                {points.map((point) => (
                                    <VisitItem 
                                            key={point.id} 
                                            point={point} 
                                            dateStr={new Date(point.startTime).toLocaleDateString()}
                                            dayOfWeek={dayOfWeek[point.dow]} 
                                            dateClickResponse={handlePoppupOpen}
                                        />
                                ))}
                            </ul>
                        </div>
                    </Popup>
                </Marker>
            ))}
            
        </MapContainer>
    </>);
}

export default DayMap;