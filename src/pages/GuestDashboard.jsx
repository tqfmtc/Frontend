import GuestOverview from '../components/GuestTutor/GuestOverview';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const GuestDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('guestData');
    navigate('/guest-login');
  };

  const guestData = JSON.parse(localStorage.getItem('guestData') || '{}');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24 p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-600">Welcome, {guestData?.name || 'Guest tutor'}</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
          <FiLogOut /> Logout
        </button>
      </header>
      <GuestOverview />
    </div>
  );
};

export default GuestDashboard;
