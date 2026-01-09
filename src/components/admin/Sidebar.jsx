import { motion } from 'framer-motion'
import { FiHome, FiUsers, FiMapPin, FiFileText, FiUser, FiLogOut, FiUserPlus, FiUserCheck, FiDollarSign, FiActivity, FiBook, FiBarChart } from 'react-icons/fi'
import { BiRupee } from 'react-icons/bi' // Importing rupee sign icon
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Sidebar = ({ activeTab, onTabChange, className }) => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem('userData');
      if (!userData) {
        navigate('/admin');
        return;
      }

      try {
        const parsedData = JSON.parse(userData);
        if (!parsedData || !parsedData._id || !parsedData.token || parsedData.role !== 'admin') {
          localStorage.removeItem('userData');
          navigate('/admin');
          return;
        }
        setAdminProfile(parsedData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        navigate('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/admin');
  };

  // Map tab IDs to permission keys
  const tabPermissionMap = {
    'overview': 'dashboard',
    'tutors': 'tutors',
    'hadiya': 'hadiya',
    'centers': 'centers',
    'students': 'students',
    'student-reports': 'students',
    'attendance-control': 'tutorAttendance',
    'guest-tutors': 'guestTutors',
    'announcements': 'announcements',
    'admins': 'admins',
    'supervisors': 'supervisors',
    'subject-management': 'subjects'
  };

  const allTabs = [
    { id: 'overview', label: 'Dashboard', icon: FiHome },
    { id: 'tutors', label: 'Tutors', icon: FiUsers },
    { id: 'hadiya', label: 'Hadiya', icon: FiDollarSign },
    { id: 'centers', label: 'Centers', icon: FiMapPin },
    { id: 'students', label: 'Students', icon: FiUser },
    { id: 'student-reports', label: 'Student Reports', icon: FiBarChart },
    { id: 'attendance-control', label: 'Attendance Control', icon: FiActivity },
    // { id: 'reports', label: 'Reports', icon: FiFileText },
    { id: 'guest-tutors', label: 'Guest Tutors', icon: FiUserPlus },
    { id: 'announcements', label: 'Announcements', icon: FiFileText },
    { id: 'admins', label: 'Users', icon: FiUserPlus },
    { id: 'supervisors', label: 'Supervisors', icon: FiUserCheck }, // New tab added
    { id: 'subject-management', label: 'Subject Management', icon: FiBook } // New tab for SubjectManagement
  ];

  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => {
    const permissionKey = tabPermissionMap[tab.id];
    if (!permissionKey || !adminProfile?.permissions) return false;
    
    const permission = adminProfile.permissions[permissionKey];
    // Show tab if either read or write permission is true
    return permission && (permission.read === true || permission.write === true);
  });

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-white shadow-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-sm sm:text-base text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!adminProfile) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`bg-white h-full shadow-lg flex flex-col w-full ${className || ''}`}
    >
      {/* Profile Section */}
      <div className="p-3 sm:p-4 md:p-6 border-b">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm sm:text-base md:text-xl font-medium flex-shrink-0">
            {adminProfile.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 truncate">{adminProfile.name}</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{adminProfile.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto">
        <ul className="space-y-1 sm:space-y-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => tab.onClick ? tab.onClick() : onTabChange(tab.id)}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={18} className="sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-2 sm:p-3 md:p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-sm sm:text-base text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiLogOut size={18} className="sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="truncate">Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
