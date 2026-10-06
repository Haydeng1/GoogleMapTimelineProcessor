import { useState } from 'react'

import './App.css'
import DayMap from './DayMap.jsx'

function App() {
  const [count, setCount] = useState(0)
// Coordinates format: [Latitude, Longitude]
  const position = [-34.9922002,138.5970421];
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState(new Date("1970-01-01T07:00"));
  const [endTime, setEndTime] = useState(new Date("1970-01-01T18:00"));
  const [businessDaysOnly, setBusinessDaysOnly] = useState(false);
  const [multiDateEnabled, setMultiDateEnabled] = useState(false);
  const [singleDate, setSingleDate] = useState(new Date());

  const [file, setFile] = useState(null);
  const [mapData, setMapData] = useState([]); // State to hold the data for the map

    const handleFileChange = (e) => {
    // Capture the first file selected by the user
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUploadSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    
    const formData = new FormData();
    formData.append('json_file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload-json', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result);
      alert("File uploaded successfully!");
    }
    catch (error) {
      console.error('Error uploading file:', error);
      alert("Error uploading file. Please check the console for details.");
    }
  };

  const handleLoadData = async () => {
    const queryParams = new URLSearchParams({
      startDate: multiDateEnabled ? startDate.toISOString().split('T')[0] : singleDate.toISOString().split('T')[0],
      endDate: multiDateEnabled ? endDate.toISOString().split('T')[0] : singleDate.toISOString().split('T')[0],
      allDay: allDay,
      businessDaysOnly: businessDaysOnly,
      startTime: startTime.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5)
    });
    try {
      // console.log(`Sending data request with parameters: ${queryParams.toString()}`);
      const response = await fetch(`http://localhost:5000/api/visited-places?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // console.log(`Data request sent with parameters, response status: ${JSON.stringify(response)}`);
      let data = await response.json();
      console.log('Data loaded successfully:', data.length, 'records retrieved.');
      // alert("Data loaded successfully! Check the console for details.");
      if(data.length === 0){
        alert("No data found for the selected date range. Please check your date and time filters.");
        setMapData(() => []);
        data = [];
      }
      setMapData(data);
    }
    catch (error) {
      console.error('Error loading data:', error);
      alert("Error loading data. Please check the console for details.");
    }
  }
  
  return (
    <>
    <div className="input-container">
      <div className="input-group">
        <form onSubmit={handleFileUploadSubmit}>
          <label htmlFor="fileupload" className="form-label">Upload File:</label>
          <input type="file" placeholder="Enter Location" className="file-input" onChange={handleFileChange} />
          <input type="submit" value="Upload" className="submit-button" />
        </form>
      </div>
      <div className="input-group">
        <label htmlFor="multiDateEnabled" className="form-label">Would you like Date Range:</label>
        <input name="multiDateEnabled" type="checkbox" className="" checked={multiDateEnabled} onChange={(e) => {setMultiDateEnabled(e.target.checked)}} />
      </div>
      {multiDateEnabled ? (
        <>
          <div className="input-group">
            <label htmlFor="startDate" className="form-label">Start Date:</label>
            <input name="startDate" type="date" className="form-control-dateselector" value={startDate.toISOString().split('T')[0]} onChange={(e) => {setStartDate(new Date(e.target.value));console.log(e.target.value)}} />
          </div>
          <div className="input-group">
            <label htmlFor="endDate" className="form-label">End Date:</label>
            <input name="endDate" type="date" className="form-control-dateselector" value={endDate.toISOString().split('T')[0]} onChange={(e) => {setEndDate(new Date(e.target.value));console.log(e.target.value)}} />
          </div>
        </>
      ): (<>
      <div className="input-group">
          <label htmlFor="singleDate" className="form-label">Start Date:</label>
          <input name="singleDate" type="date" className="form-control-dateselector" value={singleDate.toISOString().split('T')[0]} onChange={(e) => {setSingleDate(new Date(e.target.value));console.log(e.target.value)}} />
        </div>
        <button className="submit-button" onClick={() => {setSingleDate(new Date(singleDate.getTime() + 86400000)); setEndDate(new Date(singleDate.getTime() + 86400000))}}>Add 1 day</button>
      </>)}
      <div className="input-group">
        <label htmlFor="allday" className="form-label">Business Days Only:</label>
        <input name="allday" type="checkbox" className="" checked={businessDaysOnly} onChange={(e) => {setBusinessDaysOnly(e.target.checked)}} />
      </div>
      <div className="input-group">
        <label htmlFor="allday" className="form-label">All Day:</label>
        <input name="allday" type="checkbox" className="" checked={allDay} onChange={(e) => {setAllDay(e.target.checked)}} />
      </div>
      {!allDay && (<>
      <div className="input-group">
        <label htmlFor="startTime" className="form-label">Select Start Time:</label>
        <input name="startTime" type="time" className="form-control-timeselector" value={startTime.toTimeString().slice(0, 5) === '00:00' ? '' : startTime.toTimeString().slice(0, 5)} onChange={(e) => {setStartTime(new Date(`1970-01-01T${e.target.value}`));console.log(e.target.value)}} />
      </div>
      <div className="input-group">
        <label htmlFor="endTime" className="form-label">Select End Time:</label>
        <input name="endTime" type="time" className="form-control-timeselector" value={endTime.toTimeString().slice(0, 5)} onChange={(e) => {setEndTime(new Date(`1970-01-01T${e.target.value}`));console.log(e.target.value)}} />
      </div>
      </>
      )}
      <div className="input-group">
        <label htmlFor="endTime" className="form-label">submit for data:</label>
        <button className="submit-button" onClick={handleLoadData}>
          Load Data
        </button>
      </div>
    </div>
      <DayMap MapData={mapData} />
    </>
  )
}

export default App
