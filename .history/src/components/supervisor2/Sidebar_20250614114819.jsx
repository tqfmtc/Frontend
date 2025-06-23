import { FiUsers, FiMapPin, FiHome, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/supervisor');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'centers', label: 'Centers', icon: FiMapPin },
    { id: 'tutors', label: 'Tutors', icon: FiUsers },
    { id: 'students', label: 'Students', icon: FiUsers }
  ];

  return (
    <div className="w-64 bg-white h-full shadow-lg flex flex-col">
      {/* Profile Section */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
            S
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Supervisor</h2>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeSection === tab.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="text-xl" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiLogOut className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 