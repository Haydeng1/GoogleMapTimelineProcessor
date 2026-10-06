import { useMemo, useState } from 'react';

// 1. Create a sub-component to handle the expand/collapse state of each item
function VisitItem({ point, dateStr, dayOfWeek, dateClickResponse }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activityData, setActivityData] = useState([]); // State to hold the activity data

    const activitiesData = (date, pointval) => {
        console.log(`Popup opened for date: ${date}`);
        const lat = pointval.lat.toString().slice(0, 6);
        const lng = pointval.lng.toString().slice(0, 6);
        console.log(`Fetching activity data for date: ${date}, lat: ${lat}, lng: ${lng}`);
        const queryParams = new URLSearchParams({
            startDate: date.split('T')[0],
            lat: lat,
            lng: lng
        });
        // Fetch activity data for the specific placeID
        fetch(`http://localhost:5000/api/activities?${queryParams.toString()}`)
            .then(response => response.json())
            .then(data => {
                console.log(`Activity data for date ${date}:`, data);
                setActivityData(data);
            })
            .catch(error => {
                console.error(`Error fetching activity data for date ${date}:`, error);
            });
    };
    // const dateStr = new Date(point.startTime).toLocaleDateString();

    return (
        <li style={{ marginBottom: '8px', listStyleType: 'none' }}>
            {/* The summary button always stays visible */}
            <button 
                onClick={() => {
                    // console.log(`Toggling details for ${point.startTime}`);
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        activitiesData(point.startTime, point);
                    }
                }} 
                style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
                {isOpen ? '▼' : '▶'} {dateStr} — {dayOfWeek}
            </button>

            {isOpen && (
                <div style={{ padding: '8px', background: '#f4f4f4', marginTop: '4px', borderRadius: '4px', fontSize: '0.9em' }}>
                    <strong>Start:</strong> {new Date(point.startTime).toLocaleString()}<br />
                    <strong>End:</strong> {new Date(point.endTime).toLocaleString()}<br />
                    <strong>Duration:</strong> {point.minutes} minutes<br />
                    <strong>Latitude:</strong> {point.lat}<br />
                    <strong>Longitude:</strong> {point.lng}<br />
                    { activityData.map((activity, index) => (
                        <div key={index}>
                            <strong>Activity:</strong> {activity.startTime.split('T')[1].slice(0, 5)} - {activity.endTime.split('T')[1].slice(0, 5)}<br />
                            <strong>Distance:</strong> {(activity.distanceMeters/1000).toFixed(2)} km<br />
                        </div>
                    )) }
                </div>
            )}
        </li>
    );
}

export default VisitItem;