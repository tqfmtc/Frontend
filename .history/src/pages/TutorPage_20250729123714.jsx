import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FiPhone, FiLock, FiMapPin, FiRefreshCw, FiCheckCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import TutorDashboard from "../components/tutor/TutorDashboard";
import usePost from "../components/CustomHooks/usePost";

const TutorPage = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [centerLocation, setCenterLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [distanceFromCenter, setDistanceFromCenter] = useState(null);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [pendingLocationUpdate, setPendingLocationUpdate] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const navigate = useNavigate();
  const locationUpdateTimeoutRef = useRef(null); // Ref for the timeout ID

  // Effect for cleaning up the timeout on unmount
  useEffect(() => {
    return () => {
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
      }
    };
  }, []);
  const { post, loading } = usePost();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getCurrentLocation = (retryCount = 0) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAccuracy(position.coords.accuracy);
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          if (retryCount < 2) {
            // Retry up to 2 times
            setTimeout(() => {
              getCurrentLocation(retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, 1000);
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const refreshLocation = async () => {
    setIsRefreshingLocation(true);
    try {
      const currentLocation = await getCurrentLocation();
      const payload = {
        phone: phone,
        password: password,
        currentLocation: currentLocation
      };

      const result = await post(`${import.meta.env.VITE_API_URL}/auth/tutor/login`, payload);
      
      if (result.data.message && result.data.message.includes('within 100 meters')) {
        setError(result.data.message);
        setCenterLocation(result.data.centerLocation);
        setDistanceFromCenter(result.data.distance);
      }
    } catch (err) {
      setError("Failed to refresh location. Please try again.");
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  const sendLocationToBackend = async (token) => {
    setIsGettingLocation(true);
    setShowLocationPermission(true);
    try {
      const currentLocation = await getCurrentLocation();
      await post(`${import.meta.env.VITE_API_URL}/tutors/update-location`, { currentLocation, token });
      setPendingLocationUpdate(false);
      setShowLocationPermission(false);
    } catch (err) {
      setError("Location access is required to update your location after login. Please allow location access.");
      setPendingLocationUpdate(true);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const submitAttendance = async () => {
    setIsSubmittingAttendance(true);
    try {
      const currentLocation = await getCurrentLocation();
      const userDataString = localStorage.getItem("userData");
      const token = userDataString ? JSON.parse(userDataString).token : null;
      if (!token) throw new Error('Authentication token not found');
      
      const result = await post(`${import.meta.env.VITE_API_URL}/tutors/attendance`, {
        token,
        status: 'present',
        location: currentLocation
      });

      if (result.data.message === 'Attendance submitted successfully') {
        setAttendanceStatus('success');
        setTimeout(() => setAttendanceStatus(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit attendance. Please try again.");
      if (err.response?.data?.distance) {
        setDistanceFromCenter(err.response.data.distance);
      }
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowLocationPermission(false);
    setIsGettingLocation(false);
    setPendingLocationUpdate(false);

    try {
      const payload = {
        phone: phone,
        password: password
      };
      const result = await post(`${import.meta.env.VITE_API_URL}/auth/tutor/login`, payload);
      if (!result || !result.data) {
        setError("Server not responding or network error.");
        return;
      }
      localStorage.setItem("userData", JSON.stringify(result.data));
    localStorage.setItem("token", result.data.token);
      setIsLoggedIn(true);
      
      // Clear any existing timeout before setting a new one
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
      }
      // Call sendLocationToBackend with the token from result.data
      locationUpdateTimeoutRef.current = setTimeout(() => sendLocationToBackend(result.data.token), 500);
      
      navigate("/tutor-dashboard");
    } catch (err) {
      setError(err.message || "Network error or server not responding.");
    }
  };

  if (isLoggedIn) {
    return <TutorDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-primary-50 pt-24 pb-16 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-medium p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-100 text-accent-600 mb-4">
              <FiPhone size={32} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Tutor Login
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
                {centerLocation && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <FiMapPin className="mr-2" />
                      <a 
                        href={`https://www.google.com/maps?q=${centerLocation[1]},${centerLocation[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Center Location
                      </a>
                    </div>
                    {/* Distance to center text and refresh button removed */}
                  </div>
                )}
              </div>
            )}

            {showLocationPermission && (
              <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg text-sm">
                Please allow location access to verify your proximity to the center.
                {locationAccuracy && (
                  <div className="mt-1 text-xs">
                    Location accuracy: ±{Math.round(locationAccuracy)} meters
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiPhone size={18} />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                  placeholder="Enter your phone number"
                  required
                  pattern="[0-9]{10}"
                />
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiLock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="w-full btn bg-gradient-to-r from-accent-600 to-primary-600 text-white hover:from-accent-700 hover:to-primary-700 py-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </motion.button>
          </form>
          <div className="mt-4 text-center text-sm text-underline-blue-600">
              <a href="">forgot password?</a>
              </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Or continue as</p>
            <Link
              to="/guest-login"
              className="w-full inline-block btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 py-2.5 rounded-lg text-base font-medium transition-colors"
            >
              Guest Tutor
            </Link>
          </div>

          {isLoggedIn && (
            <div className="mt-6">
              <button
                onClick={submitAttendance}
                disabled={isSubmittingAttendance}
                className="w-full btn bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 py-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center"
              >
                {isSubmittingAttendance ? (
                  <FiRefreshCw className="animate-spin mr-2" />
                ) : attendanceStatus === 'success' ? (
                  <>
                    <FiCheckCircle className="mr-2" />
                    Attendance Submitted
                  </>
                ) : (
                  'Submit Attendance'
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TutorPage;
