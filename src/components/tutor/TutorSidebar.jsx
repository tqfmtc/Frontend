import { motion } from 'framer-motion'
import { FiLogOut, FiUser, FiX } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

const TutorSidebar = ({ activeTab, setActiveTab, tabs, isMobile, isOpen, onClose }) => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [tutorProfile, setTutorProfile] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData'); // Changed 'user' to 'userData'
    if (userData) {
      setTutorProfile(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userData"); // Changed to remove 'userData'
    // localStorage.removeItem("token"); // Token is usually part of userData, so this might be redundant or handled if token is stored separately
    setIsLoggedIn(false); // This state might need to be lifted if it controls parent component
    navigate("/tutor");
  };

  if (!tutorProfile) {
    return null; // or a loading spinner
  }

  // Get center name from tutor profile
  const getCenterName = () => {
    if (tutorProfile.assignedCenter?.name) {
      return tutorProfile.assignedCenter.name;
    }
    return 'Center not assigned';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={isMobile ? { x: -280 } : false}
        animate={isMobile ? { x: 0 } : false}
        exit={isMobile ? { x: -280 } : false}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`${isMobile ? 'fixed' : 'fixed'} top-0 left-0 h-screen ${isMobile ? 'z-50' : 'z-20'} ${isMobile ? 'w-[280px]' : 'w-64'} bg-gradient-to-br from-white via-white to-accent-50/10 shadow-2xl border-r border-white/20 flex flex-col`}
      >
        {/* Profile Section */}
        <div className="p-6 border-b border-accent-100/20 bg-white/50 backdrop-blur-sm">
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => setShowProfile(!showProfile)}
            aria-expanded={showProfile}
            aria-haspopup="true"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white mr-4 group-hover:shadow-lg group-hover:shadow-primary-500/20 transition-all duration-300 group-hover:-translate-y-0.5">
              <FiUser size={24} />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent truncate">
                {tutorProfile.name}
              </h2>
              <p className="text-sm text-gray-600 truncate">{getCenterName()}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.onClick) {
                    tab.onClick();
                  } else {
                    setActiveTab(tab.id);
                  }
                  if (isMobile) onClose();
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 relative group ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-gray-600 hover:bg-white/60 hover:shadow-md'}`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className={`mr-3 transition-transform duration-300 transform group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-primary-600'}`}>
                  {tab.icon}
                </span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-accent-100/20 bg-white/50 backdrop-blur-sm mt-auto">
          <button
            onClick={() => {
              handleLogout();
              if (isMobile) onClose();
            }}
            className="w-full flex items-center justify-center px-4 py-3 text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300 font-medium group"
          >
            <FiLogOut className="mr-2 text-lg group-hover:scale-110 transition-transform duration-300" />
            Logout
          </button>
        </div>

        {/* Profile Modal */}
        {showProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-24 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 z-50 border border-white/20"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Profile Details
              </h3>
              <button 
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close profile details"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gray-50/80 hover:bg-white transition-colors">
                <p className="text-sm flex flex-wrap items-center">
                  <span className="text-gray-500 w-20 flex-shrink-0 font-medium">Email:</span> 
                  <span className="flex-1 text-gray-900">{tutorProfile.email}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/80 hover:bg-white transition-colors">
                <p className="text-sm flex flex-wrap items-center">
                  <span className="text-gray-500 w-20 flex-shrink-0 font-medium">Phone:</span>
                  <span className="flex-1 text-gray-900">{tutorProfile.phone}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/80 hover:bg-white transition-colors">
                <p className="text-sm flex flex-wrap items-center">
                  <span className="text-gray-500 w-20 flex-shrink-0 font-medium">Center:</span> 
                  <span className="flex-1 text-gray-900">{getCenterName()}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200/50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300 font-medium"
              >
                <FiLogOut className="mr-2 text-lg" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

export default TutorSidebar