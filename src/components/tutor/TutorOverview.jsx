import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { FiUsers, FiClock, FiCheck, FiX } from 'react-icons/fi'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import useGet from '../CustomHooks/useGet'
import usePost from '../CustomHooks/usePost'
import useTodayAttendance from './useTodayAttendance'
import axios from 'axios'

// ---------------- Leaflet marker icons (1st code, robust) ----------------
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const createCustomIcon = (color) =>
  L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

const redIcon = createCustomIcon('red')      // user GPS
const blueIcon = createCustomIcon('blue')    // center
const orangeIcon = createCustomIcon('orange')// fallback approx

// ---------------- Fallback (2nd code style, OpenCage geocoding) ----------------
// Requires VITE_OPENCAGE_API_KEY and a human-readable query (e.g., center name/city).
const fetchLocationFallback = async (query) => {
  try {
    if (!query) return null
    const key = import.meta.env.VITE_OPENCAGE_API_KEY
    if (!key) return null
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`
    const response = await axios.get(url, { timeout: 8000 })
    const { results } = response.data || {}
    if (results && results.length > 0) {
      const { geometry } = results
      if (geometry && typeof geometry.lat === 'number' && typeof geometry.lng === 'number') {
        return { lat: geometry.lat, lng: geometry.lng, isIPBased: true }
      }
    }
  } catch (error) {
    console.error('OpenCage API error:', error)
  }
  return null
}

// ---------------- Android check (2nd code path) ----------------
const isAndroidDevice = () => /Android/i.test(navigator.userAgent)

// ---------------- LocationMarker ----------------
// - Uses a single watchPosition (1st code strategy) and escalates to high accuracy
// - Applies updates to UI every 5s via a throttle (satisfies "update every 5 seconds")
// - Error handling from 1st code (debounced, classify, cleanup). No fallback on denied.
// - Fallback from 2nd code (OpenCage with provided query) on timeout/unavailable.
const LocationMarker = ({ onLocationUpdate, onLocationError, fallbackQuery }) => {
  const [position, setPosition] = useState(null)
  const [isIPBased, setIsIPBased] = useState(false)
  const map = useMap()
  const watchIdRef = useRef(null)
  const escalateTimerRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const hasInitialLocationRef = useRef(false)
  const lastAppliedRef = useRef(0)
  const lastErrorTimeRef = useRef(0)

  const APPLY_INTERVAL_MS = 5000 // apply to UI every 5 seconds

  useEffect(() => {
    if (!navigator.geolocation) {
      (async () => {
        const fp = await fetchLocationFallback(fallbackQuery)
        if (fp) {
          setPosition(fp); setIsIPBased(true)
          onLocationUpdate(fp)
        } else {
          onLocationError?.('Unable to determine location.', true)
        }
      })()
      return
    }

    const applyIfDue = (latlng, ipBased = false) => {
      const now = Date.now()
      const isFirst = !hasInitialLocationRef.current
      if (isFirst || now - lastAppliedRef.current >= APPLY_INTERVAL_MS) {
        setPosition(latlng)
        setIsIPBased(ipBased)
        onLocationUpdate(latlng)

        if (!hasAnimatedRef.current) {
          map.flyTo(latlng, 17, { animate: true })
          hasAnimatedRef.current = true
        } else {
          map.setView(latlng, map.getZoom(), { animate: false })
        }

        hasInitialLocationRef.current = true
        lastAppliedRef.current = now
      }
    }

    const handleSuccess = ({ latitude, longitude }) => {
      const latlng = { lat: latitude, lng: longitude }
      applyIfDue(latlng, false)
    }

    const handleError = (error) => {
      const now = Date.now()
      if (now - lastErrorTimeRef.current < 5000) return
      lastErrorTimeRef.current = now

      let message = ''
      let shouldShowHelp = false

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Click "Get Help" to learn how to enable location permissions.'
          shouldShowHelp = true
          break
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable. Please check your GPS settings.'
          shouldShowHelp = true
          break
        case error.TIMEOUT:
          message = 'Location request timed out. Trying fallback method...'
          break
        case error.UNKNOWN_ERROR:
        default:
          message = 'An unknown error occurred while retrieving location.'
          shouldShowHelp = true
          break
      }

      onLocationError?.(message, shouldShowHelp)

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (escalateTimerRef.current) {
        clearTimeout(escalateTimerRef.current)
        escalateTimerRef.current = null
      }

      // Don’t attempt fallback if permission denied (avoid misleading approximation)
      if (error.code === error.PERMISSION_DENIED) return

      ;(async () => {
        const fp = await fetchLocationFallback(fallbackQuery)
        if (fp) {
          applyIfDue(fp, true)
          onLocationError?.(null, false)
        } else {
          onLocationError?.('Unable to determine location from any source. Please check your settings.', true)
        }
      })()
    }

    const standardOptions = {
      enableHighAccuracy: false,
      maximumAge: 60000,
      timeout: 10000,
    }

    // Initial fix
    navigator.geolocation.getCurrentPosition(
      pos => handleSuccess({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      }),
      handleError,
      standardOptions
    )

    // Single watch (no restart loop). UI updates are throttled to 5s.
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => handleSuccess({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      }),
      handleError,
      standardOptions
    )

    // Escalate to high accuracy after initial
    escalateTimerRef.current = setTimeout(() => {
      if (hasInitialLocationRef.current) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
          pos => handleSuccess({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }),
          handleError,
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
        )
      }
    }, 5000)

    return () => {
      if (escalateTimerRef.current) clearTimeout(escalateTimerRef.current)
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [map, onLocationUpdate, onLocationError, fallbackQuery])

  if (position === null) return null
  return (
    <Marker
      position={position}
      icon={isIPBased ? orangeIcon : redIcon}
      title={isIPBased ? 'Approximate location (fallback)' : 'GPS location'}
    />
  )
}

// ---------------- Main component ----------------
const TutorOverview = () => {
  const { alreadyMarked, loading: attendanceCheckLoading } = useTodayAttendance()
  const [showDeniedPopover, setShowDeniedPopover] = useState(false)

  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationMatch, setLocationMatch] = useState(null)
  const [attendanceMarked, setAttendanceMarked] = useState(false)
  const [error, setError] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [distance, setDistance] = useState(null)
  const [isLocationLoading, setIsLocationLoading] = useState(true)

  const tutorData = JSON.parse(localStorage.getItem('userData') || '{}')
  const { response: students, loading } = useGet('/students')

  const centerLocation = tutorData.assignedCenter?.coordinates
    ? {
        lat: parseFloat(tutorData.assignedCenter.coordinates),
        lng: parseFloat(tutorData.assignedCenter.coordinates[13]),
      }
    : null

  const centerStudents = students ? students.filter(s => {
    const studentCenterId = s.assignedCenter && (typeof s.assignedCenter === 'string' ? s.assignedCenter : s.assignedCenter._id)
    const tutorCenterId = tutorData.assignedCenter && (typeof tutorData.assignedCenter === 'string' ? tutorData.assignedCenter : tutorData.assignedCenter._id)
    return studentCenterId === tutorCenterId
  }).length : 0

  // Distance calc (Haversine)
  const calculateDistance = (loc1, loc2) => {
    const R = 6371
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleLocationUpdate = useCallback((location) => {
    setLocationError(null)
    setIsLocationLoading(false)
    setCurrentLocation(location)
    if (centerLocation) {
      const d = calculateDistance(location, centerLocation)
      setDistance(d)
      setLocationMatch(d <= 0.1) // 100 m threshold (1st code)
    }
  }, [centerLocation])

  const handleLocationError = useCallback((message) => {
    setLocationError(message || 'Location error')
    setIsLocationLoading(false)
  }, [])

  const handleRefreshLocation = useCallback(() => {
    setIsLocationLoading(true)
    setLocationError(null)
    setCurrentLocation(null)
    setLocationMatch(null)
    setDistance(null)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleLocationUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        (err) => {
          console.error('Manual location refresh failed:', err)
          setLocationError('Failed to refresh location. Please try again.')
          setIsLocationLoading(false)
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      )
    } else {
      const fallbackQuery = tutorData?.assignedCenter?.name || tutorData?.assignedCenter?.city || ''
      fetchLocationFallback(fallbackQuery).then(fp => {
        if (fp) handleLocationUpdate(fp)
        else {
          setLocationError('Unable to determine location.')
          setIsLocationLoading(false)
        }
      })
    }
  }, [handleLocationUpdate, tutorData])

  // Attendance gating: require verified location, disable on Sunday, handle duplicates
  const handleMarkAttendance = async () => {
    const isSunday = currentTime.getDay() === 0
    if (isSunday) return
    if (!locationMatch || !currentLocation) return
    try {
      const userDataString = localStorage.getItem('userData')
      const token = userDataString ? JSON.parse(userDataString).token : null
      if (!token) throw new Error('Authentication token not found')

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tutors/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentLocation: [currentLocation.lat, currentLocation.lng],
        }),
      })

      const data = await response.json()
      if (data?.message === 'Attendance submitted successfully') {
        setAttendanceMarked(true)
        setError(null)
      } else if (data?.code === 11000 || (data?.error && String(data.error).includes('E11000'))) {
        setShowDeniedPopover(true)
      } else if (!response.ok) {
        setError(data?.message || 'Failed to mark attendance')
      }
    } catch (err) {
      if (String(err?.message || '').includes('E11000')) {
        setShowDeniedPopover(true)
      } else {
        setError(err?.message || 'Failed to mark attendance')
      }
      console.error('Error marking attendance:', err)
    }
  }

  const isAndroid = isAndroidDevice()

  if (!centerLocation) {
    return (
      <div className="text-center text-red-600 p-4">
        Unable to load center location. Please log in again.
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-accent-50 to-primary-50 py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Tutor Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {tutorData.name || 'Tutor'}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl shadow-lg bg-gradient-to-tr from-primary-600 to-accent-600 text-white p-4 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-2 backdrop-blur-sm">
            <FiUsers className="text-xl text-white" />
          </div>
          <div className="text-2xl font-bold mb-0.5">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : centerStudents}
          </div>
          <div className="text-sm font-medium tracking-wide opacity-90">Center Students</div>
        </div>

        <div className="rounded-xl shadow-lg bg-gradient-to-tr from-blue-600 to-blue-400 text-white p-4 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-2 backdrop-blur-sm">
            <FiClock className="text-xl text-white" />
          </div>
          <div className="text-2xl font-bold mb-0.5">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm font-medium tracking-wide opacity-90">Current Time</div>
        </div>

        <div className="rounded-xl shadow-lg bg-gradient-to-tr from-green-600 to-emerald-400 text-white p-4 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-2 backdrop-blur-sm">
            {attendanceMarked || alreadyMarked ? <FiCheck className="text-xl text-white" /> : <FiClock className="text-xl text-white" />}
          </div>
          <div className="text-2xl font-bold mb-0.5 text-center">
            {attendanceMarked || alreadyMarked ? 'Marked' : 'Pending'}
          </div>
          <div className="text-sm font-medium tracking-wide opacity-90">Today's Attendance</div>
        </div>
      </div>

      {/* Duplicate popover */}
      {showDeniedPopover && (
        <motion.div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30 px-4 sm:px-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-lg shadow-xl p-5 sm:p-6 max-w-sm w-full flex flex-col items-center"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <FiX className="text-red-600 text-xl" />
            </div>
            <div className="text-red-600 text-xl font-bold mb-2">Request Denied</div>
            <div className="text-gray-700 text-center mb-4">Attendance has already been marked for today.</div>
            <button className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full sm:w-auto"
              onClick={() => setShowDeniedPopover(false)}>
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Mark attendance block */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-6">Mark Attendance</h2>

        {/* Android-specific prompt (2nd code) */}
        {isAndroid && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-700">
              Use <span className="font-bold text-primary-600">Attendance App</span> to mark attendance on Android devices.
              <a href="/attendance-app.apk" download
                 className="inline-flex items-center text-sm text-accent-600 hover:text-accent-700 font-medium ml-2 transition-colors">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download Attendance App
              </a>
            </p>
          </div>
        )}

        {attendanceCheckLoading ? (
          <div className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm text-blue-700 rounded-xl border border-blue-100 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            Checking attendance status...
          </div>
        ) : alreadyMarked ? (
          <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-sm text-green-700 rounded-xl border border-green-100 flex items-center">
            <FiCheck className="h-5 w-5 mr-3" />
            Today's attendance has already been marked.
          </div>
        ) : (
          <>
            {isAndroid ? (
              // Android: encourage using the app (no map)
              <div className="text-center py-12">
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Download Attendance App</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    For accurate location tracking on Android devices, please download and use our dedicated attendance app.
                  </p>
                  <a href="/attendance-app.apk" download
                     className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-lg font-semibold rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Download Attendance App
                  </a>
                </div>
              </div>
            ) : (
              <>
                {isLocationLoading && !currentLocation && (
                  <div className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm text-blue-700 rounded-xl border border-blue-100 flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Getting current location... Please ensure location permissions are enabled.
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-700 rounded-xl border border-red-100 flex items-center">
                    <FiX className="h-5 w-5 mr-3" />
                    {error}
                  </div>
                )}

                {locationError && (
                  <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-700 rounded-xl border border-red-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FiX className="h-5 w-5 mr-3" />
                        {locationError}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRefreshLocation}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        Retry
                      </button>
                      {/* Minimal permission help (2nd code ethos) */}
                      <a
                        href="https://support.apple.com/guide/iphone/control-app-access-to-location-iphd3f9e5c45/ios"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        Permission Help
                      </a>
                    </div>
                  </div>
                )}

                <div className="relative h-[300px] sm:h-[350px] md:h-[400px] rounded-2xl overflow-hidden mb-6 shadow-2xl border border-white/20 bg-white/5 backdrop-blur-sm">
                  <MapContainer
                    center={[centerLocation.lat, centerLocation.lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />

                    <LocationMarker
                      onLocationUpdate={handleLocationUpdate}
                      onLocationError={handleLocationError}
                      fallbackQuery={tutorData?.assignedCenter?.name || tutorData?.assignedCenter?.city || ''}
                    />

                    <Marker position={[centerLocation.lat, centerLocation.lng]} icon={blueIcon} />

                    <Circle
                      center={[centerLocation.lat, centerLocation.lng]}
                      radius={100}
                      pathOptions={{ color: '#4F46E5', fillColor: '#4F46E5', fillOpacity: 0.1 }}
                    />
                  </MapContainer>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="w-full sm:w-auto">
                    {isLocationLoading ? (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
                        <div className="flex items-center">
                          <svg className="animate-spin h-4 w-4 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                          </svg>
                          <p className="text-base sm:text-lg font-medium text-blue-600">Detecting location...</p>
                        </div>
                      </div>
                    ) : locationMatch !== null ? (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3 ${locationMatch ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}></div>
                            <div>
                              <p className={`text-base sm:text-lg font-medium ${locationMatch ? 'text-green-600' : 'text-red-600'}`}>
                                {locationMatch ? 'Location verified' : 'Location mismatch'}
                              </p>
                              {distance !== null && (
                                <p className="text-sm text-gray-500">
                                  Distance: {(distance * 1000).toFixed(0)}m from center
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleRefreshLocation}
                            disabled={isLocationLoading}
                            className="ml-3 p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Refresh location"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : currentLocation === null && !locationError ? (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full mr-3 bg-yellow-500 shadow-lg"></div>
                            <p className="text-base sm:text-lg font-medium text-yellow-600">Waiting for location...</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleRefreshLocation}
                              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Try to get location"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            <a
                              href="https://support.apple.com/guide/iphone/control-app-access-to-location-iphd3f9e5c45/ios"
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Get help with location"
                            >
                              ?
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-4 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleMarkAttendance}
                      disabled={!locationMatch || attendanceMarked || currentTime.getDay() === 0 || alreadyMarked}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 sm:flex-none text-base font-medium shadow-lg ${
                        locationMatch && !attendanceMarked && currentTime.getDay() !== 0 && !alreadyMarked
                          ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:shadow-xl hover:-translate-y-0.5'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {attendanceMarked || alreadyMarked ? <FiCheck className="mr-2 text-lg" /> : null}
                      {attendanceMarked || alreadyMarked
                        ? 'Marked'
                        : currentTime.getDay() === 0
                          ? 'Closed on Sunday'
                          : 'Mark Attendance'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default TutorOverview
