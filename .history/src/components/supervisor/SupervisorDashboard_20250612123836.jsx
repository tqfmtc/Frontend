import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Overview from './Overview';
// import Tutors from './Tutors';
import Centers from './Centers';
// import TutorApplications from './TutorApplications';
import Attendance from './Attendance';
// import Reports from './Reports';
import Settings from './Settings';

const SupervisorDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (!userData) {
          navigate('/supervisor');
          return;
        }

        const parsedData = JSON.parse(userData);
        if (!parsedData || !parsedData.token || parsedData.role !== 'supervisor') {
          localStorage.removeItem('userData');
          navigate('/supervisor');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('userData');
        navigate('/supervisor');
      }
    };

    checkAuth();
  }, [navigate]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error}</div>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'tutors':
        return <Tutors />;
      case 'centers':
        return <Centers />;
      case 'applications':
        return <TutorApplications />;
      case 'attendance':
        return <Attendance />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="flex-1 overflow-y-auto p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default SupervisorDashboard;