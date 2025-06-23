import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiMapPin, FiHome } from 'react-icons/fi';
import Sidebar from './Sidebar';
import Centers from './Centers';
import Tutors from './Tutors';
import Students from './Students';
import Overview from './Overview';

const SupervisorDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem('userData');
      if (!userData) {
        navigate('/supervisor');
        return;
      }

      try {
        const parsedData = JSON.parse(userData);
        if (!parsedData || !parsedData._id || !parsedData.token || parsedData.role !== 'supervisor') {
          localStorage.removeItem('userData');
          navigate('/supervisor');
          return;
        }
        setUser(parsedData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        navigate('/supervisor');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'centers':
        return <Centers />;
      case 'tutors':
        return <Tutors />;
      case 'students':
        return <Students />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} user={user} />
      <main className="flex-1 overflow-y-auto p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default SupervisorDashboard; 