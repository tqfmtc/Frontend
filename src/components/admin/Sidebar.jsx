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

  const tabs = [
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
    { id: 'admins', label: 'Admins', icon: FiUserPlus },
    { id: 'supervisors', label: 'Supervisors', icon: FiUserCheck }, // New tab added
    { id: 'subject-management', label: 'Subject Management', icon: FiBook } // New tab for SubjectManagement
  ];

  // Permission mapping
  const permissionMapping = {
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

  // Filter tabs based on permissions
  const visibleTabs = tabs.filter(tab => {
    // If no admin profile, hide everything
    if (!adminProfile) return false;
    
    // If permissions object is missing, this is old data - need to re-login
    if (!adminProfile.permissions) {
        return false;
    }

    const permissionKey = permissionMapping[tab.id];
    if (!permissionKey) return false; // If no mapping, hide it (safety)

    const permission = adminProfile.permissions[permissionKey];
    if (!permission) return false; // If permission object missing for key

    return permission.read || permission.write;
  });

  if (isLoading) {
    return (
      <div className="w-64 bg-white h-screen shadow-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!adminProfile) {
    return null;
  }

  // If permissions are missing, show re-login message
  if (!adminProfile.permissions) {
    return (
      <div className="w-64 bg-white h-screen shadow-lg flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Outdated</h3>
          <p className="text-sm text-gray-600 mb-4">Please log out and log in again to update your permissions.</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // If no visible tabs, show no access message
  if (visibleTabs.length === 0) {
    return (
      <div className="w-64 bg-white h-screen shadow-lg flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Access</h3>
          <p className="text-sm text-gray-600 mb-4">You don't have permission to access any sections.</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`bg-white h-full shadow-lg flex flex-col ${className || ''}`}
    >
      {/* Profile Section */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
            {adminProfile.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{adminProfile.name}</h2>
            <p className="text-sm text-gray-500">{adminProfile.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleTabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => tab.onClick ? tab.onClick() : onTabChange(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
