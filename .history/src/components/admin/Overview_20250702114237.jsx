import { motion, AnimatePresence } from 'framer-motion'
import { FiUsers, FiMapPin, FiClock, FiUser, FiCheck, FiX } from 'react-icons/fi'
import useGet from '../CustomHooks/useGet'
import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

// Reusable Popover component for feedback
const Popover = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;
  
  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 
                  type === 'error' ? 'bg-red-50 border-red-200' : 
                  'bg-blue-50 border-blue-200';
                  
  const textColor = type === 'success' ? 'text-green-700' : 
                    type === 'error' ? 'text-red-700' : 
                    'text-blue-700';
  
  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`rounded-lg shadow-lg p-4 ${bgColor} border ${textColor} max-w-md animate-fade-in`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{title || (type === 'success' ? 'Success!' : 'Notice')}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={18} />
          </button>
        </div>
        <p>{message}</p>
      </div>
    </div>
  );
};

const Overview = () => {
  // State for clearing activity
  // const [clearingActivity, setClearingActivity] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverMessage, setPopoverMessage] = useState('');
  
  // Fetch tutors, centers, and tutor applications
  const { response: tutors, loading: tutorsLoading } = useGet('/tutors')
  const { response: centers, loading: centersLoading } = useGet('/centers')
  const { response: tutorApps, loading: appsLoading } = useGet('/tutor-applications')
  
  // Filter out inactive tutors
  const activeTutors = useMemo(() => {
    if (!tutors) return [];
    return tutors.filter(tutor => tutor.status === 'active');
  }, [tutors]);

  const activeCenters = useMemo(() => {
    if (!centers) return [];
    return centers.filter(center => center.status === 'active');
  }, [centers]);
  // Fetch recent attendance directly from Attendance collection
  const { response: recentAttendance, loading: attendanceLoading, refetch: refetchAttendance } = useGet('/attendance/today');
  
  // Local state to manage attendance display
  const [localAttendance, setLocalAttendance] = useState([]);
  
  // Update local attendance state when recentAttendance changes
  useEffect(() => {
    if (recentAttendance) {
      setLocalAttendance(recentAttendance);
    }
  }, [recentAttendance]);

  // Function to clear recent activity from the view
  const handleClearActivity = async () => {
    if (clearingActivity) return;
    
    setClearingActivity(true);
    try {
      // Get admin JWT to verify admin is logged in
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token;
        } catch (e) {
          console.error('Error parsing userData from localStorage:', e);
          token = null;
        }
      }
      
      if (!token) {
        setPopoverMessage('Authentication required. Please log in again.');
        setShowPopover(true);
        setClearingActivity(false);
        return;
      }
      
      // Clear the local state to provide visual feedback
      setLocalAttendance([]);
      
      // Show toast notification
      toast.success('Activity feed cleared!', {
        position: 'top-right',
        duration: 3000
      });
      
      // Set a flag in localStorage to persist this cleared state
      localStorage.setItem('activityLastCleared', new Date().toISOString());
      
      // Show success message
      setPopoverMessage('Activity feed cleared successfully!');
      setShowPopover(true);
      
      // Auto-hide popover after 3 seconds
      setTimeout(() => {
        setShowPopover(false);
      }, 3000);
    } catch (error) {
      console.error('Error in clear activity:', error);
      setPopoverMessage(`An error occurred. Please try again.`);
      setShowPopover(true);
    } finally {
      setClearingActivity(false);
    }
  };

  // Remove old attendanceRecords logic


  const attendancePercentage = useMemo(() => {
    if (!activeTutors || activeTutors.length === 0 || !recentAttendance) return '0%';

    const today = format(new Date(), 'yyyy-MM-dd');
    const attendedToday = new Set();

    recentAttendance.forEach(record => {
      if (
        format(new Date(record.date), 'yyyy-MM-dd') === today &&
        record.status === 'present' &&
        record.tutor && record.tutor._id
      ) {
        attendedToday.add(record.tutor._id);
      }
    });

    return `${attendedToday.size}/${activeTutors.length}`;
  }, [activeTutors, recentAttendance]);

  const stats = [
    { label: 'Active Tutors', value: tutorsLoading ? '...' : activeTutors?.length || 0, icon: FiUsers },
    { label: 'Total Centers', value: centersLoading ? '...' : activeCenters?.length || 0, icon: FiMapPin },
    { label: 'Attendance', value: attendancePercentage, icon: FiClock }
  ]

  // Format date for recent activity
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isLoading = tutorsLoading || centersLoading || appsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-100 rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm h-4 w-24 bg-gray-200 rounded"></p>
                  <p className="text-2xl font-bold mt-1 h-6 w-20 bg-gray-200 rounded"></p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-100 rounded-lg p-6 animate-pulse">
          <h2 className="text-xl font-semibold mb-4 h-6 bg-gray-200 rounded"></h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                  <div>
                    <p className="font-medium h-4 w-24 bg-gray-200 rounded"></p>
                    <p className="text-sm text-gray-600 mt-1 h-4 w-20 bg-gray-200 rounded"></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  console.log(recentAttendance)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          {/* <button
            onClick={handleClearActivity}
            disabled={clearingActivity}
            className={`px-3 py-1 rounded text-sm ${clearingActivity ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'} transition-colors duration-200`}
          >
            {clearingActivity ? 'Clearing...' : 'Clear Activity'}
          </button> */}
        </div>
        <div className="space-y-4">
          {attendanceLoading ? (
            <p>Loading recent activity...</p>
          ) : localAttendance && localAttendance.length > 0 ? (
            localAttendance.slice(0, localAttendance.length).map((record, index) => (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.3 } }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FiCheck className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">{record.tutor?.name || 'Unknown Tutor'}</p>
                    <p className="text-sm text-gray-600">Marked attendance at {record.center?.name || 'Unknown Center'}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatDate(record.createdAt)}</span>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
      
      {/* Feedback Popover */}
      <Popover
        isOpen={showPopover}
        onClose={() => setShowPopover(false)}
        message={popoverMessage}
        type={popoverMessage.includes('success') ? 'success' : 'error'}
      />
    </div>
  )
}

export default Overview