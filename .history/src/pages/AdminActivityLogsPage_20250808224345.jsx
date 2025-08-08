import { useState, useEffect } from 'react';
import { FiActivity, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AdminActivityLogsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check admin authentication
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || userData.role !== 'admin' || !userData.token) {
      toast.error('Please login as admin to access this page');
      navigate('/admin');
      return;
    }
  }, [navigate]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/activities`,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }
      
      const data = await response.json();
      // The backend returns the activities array directly
      if (Array.isArray(data)) {
        setActivities(data);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message || 'Failed to fetch activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTargetNameAndPhone = (activity) => {
    if (!activity.targetInfo) return { name: 'N/A', phone: 'N/A' };
    
    return {
      name: activity.targetInfo.name || 'N/A',
      phone: activity.targetInfo.phone || 'N/A'
    };
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FiActivity className="text-2xl text-primary-600 mr-2" />
          <h1 className="text-2xl font-bold text-primary-700">Activity Logs</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    <div>
                      <p>Loading activities...</p>
                      <button 
                        onClick={fetchActivities}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-red-500">
                    <div>
                      <p className="font-medium">Error loading activities</p>
                      <p className="text-sm">{error}</p>
                      <button 
                        onClick={fetchActivities}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No activities found
                  </td>
                </tr>
              ) : activities.map((activity) => {
                const target = getTargetNameAndPhone(activity);
                return (
                  <tr key={activity._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 flex items-center justify-center text-white text-sm font-bold">
                          {activity.admin?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="ml-2 text-sm text-gray-900">
                          {activity.admin?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full" style={{
                        backgroundColor: activity.action.toLowerCase().includes('delete') ? '#FEE2E2' :
                                      activity.action.toLowerCase().includes('create') ? '#DCFCE7' :
                                      activity.action.toLowerCase().includes('update') ? '#DBEAFE' : '#F3F4F6',
                        color: activity.action.toLowerCase().includes('delete') ? '#991B1B' :
                               activity.action.toLowerCase().includes('create') ? '#166534' :
                               activity.action.toLowerCase().includes('update') ? '#1E40AF' : '#374151'
                      }}>
                        {activity.actionName || activity.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{target.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{target.phone}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(activity.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.description && (
                        <div className="group relative">
                          <FiInfo className="cursor-help text-gray-400 hover:text-gray-600" />
                          <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded p-2 shadow-lg z-10">
                            {activity.description}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLogsPage;
