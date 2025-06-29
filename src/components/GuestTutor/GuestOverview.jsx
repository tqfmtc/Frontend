import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiCheck, FiX } from 'react-icons/fi';

// Fix leaflet marker path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const createCustomIcon = (color) => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const redIcon = createCustomIcon('red');
const blueIcon = createCustomIcon('blue');

const LocationMarker = ({ onLocationUpdate, onError }) => {
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(true);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      onError('Geolocation is not supported by this browser.');
      setLocating(false);
      return;
    }

    const handleSuccess = (latlng) => {
      onError(null);
      setPosition(latlng);
      map.flyTo(latlng, map.getZoom());
      onLocationUpdate(latlng);
      setLocating(false);
    };

    const handleError = (err) => {
      let message = 'Unable to retrieve your location.';
      if (err.code === 1) {
        message = 'Permission denied. Enable location for this site in browser settings.';
      } else if (err.code === 2) {
        message = 'Location unavailable. Ensure GPS is turned on.';
      } else if (err.code === 3) {
        message = 'Location request timed out. Try again.';
      }
      onError(message);
      setLocating(false);
    };

    // Primary: browser API
    navigator.geolocation.getCurrentPosition(
      pos => handleSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      handleError,
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Fallback: Leaflet locate (some browsers handle better)
    map.locate({ enableHighAccuracy: true, timeout: 10000 })
      .on('locationfound', (e) => handleSuccess(e.latlng))
      .on('locationerror', handleError);
  }, [map]);

  if (locating) return null;
  return position === null ? null : <Marker position={position} icon={redIcon} />;
};

const GuestOverview = () => {
  const guestData = JSON.parse(localStorage.getItem('guestData') || '{}');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationMatch, setLocationMatch] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  const centerLocation = guestData.centerCoordinates ? {
    lat: parseFloat(guestData.centerCoordinates[0]),
    lng: parseFloat(guestData.centerCoordinates[1])
  } : null;

  const calculateDistance = (loc1, loc2) => {
    const R = 6371e3; // metres
    const φ1 = loc1.lat * Math.PI/180; // φ, λ in radians
    const φ2 = loc2.lat * Math.PI/180;
    const Δφ = (loc2.lat-loc1.lat) * Math.PI/180;
    const Δλ = (loc2.lng-loc1.lng) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in metres
  };

  const handleLocationUpdate = (loc) => {
    setError(null);
    setCurrentLocation(loc);
    if (centerLocation) {
      const distance = calculateDistance(loc, centerLocation);
      setLocationMatch(distance <= 1300);
    }
  };

  const handleMarkAttendance = async () => {
    if (!locationMatch || attendanceMarked) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/guest/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${guestData.token}`
        },
        body: JSON.stringify({ currentLocation: [currentLocation.lat, currentLocation.lng] })
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceMarked(true);
        setError(null);
      } else if (res.status === 409) {
        // Already marked
        setAttendanceMarked(true);
        setError('Attendance already marked for today');
      } else if (res.status === 400) {
        setError(data.message || 'You must be near the center to mark attendance');
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    }
  };

  if (!centerLocation) {
    return <p className="text-center text-red-600">Center location not found.</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center"><FiX className="mr-2" />{error}</div>
      )}
      {attendanceMarked && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center"><FiCheck className="mr-2" />Attendance marked.</div>
      )}
      <div className="h-80 rounded-2xl overflow-hidden shadow-xl">
        <MapContainer center={[centerLocation.lat, centerLocation.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker onLocationUpdate={handleLocationUpdate} onError={(msg)=>setError(msg)} />
          <Marker position={[centerLocation.lat, centerLocation.lng]} icon={blueIcon} />
          <Circle center={[centerLocation.lat, centerLocation.lng]} radius={1300} pathOptions={{ color: '#4F46E5', fillOpacity: 0.1 }} />
        </MapContainer>
      </div>
      <button onClick={handleMarkAttendance} disabled={!locationMatch || attendanceMarked} className={`px-6 py-3 rounded-lg text-white font-medium ${locationMatch && !attendanceMarked ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>Mark Attendance</button>
    </div>
  );
};

export default GuestOverview;
