import { motion } from 'framer-motion'
import { FiHome, FiUsers, FiMapPin, FiFileText, FiUser, FiLogOut, FiUserPlus, FiUserCheck } from 'react-icons/fi'
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
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'tutors', label: 'Tutors', icon: FiUsers },
    { id: 'hadiya', label: 'Hadiya Mgmt', icon: BiRupee }, // Using rupee icon for Hadiya
    { id: 'centers', label: 'Centers', icon: FiMapPin },
    { id: 'reports', label: 'Reports', icon: FiFileText },
    { id: 'students', label: 'Students', icon: FiUser },
    { id: 'admins', label: 'Admins', icon: FiUserPlus },
    { id: 'supervisors', label: 'Supervisors', icon: FiUsers },
    { 
      id: 'guest-requests', 
      label: 'Guest Tutors', 
      icon: FiUserCheck,
      onClick: () => navigate('/guest-requests')
    }
  ];

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
          {tabs.map((tab) => (
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