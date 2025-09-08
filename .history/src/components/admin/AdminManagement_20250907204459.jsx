import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiUser, FiMail, FiPhone, FiEye, FiEyeOff, FiActivity, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import useGet from '../../hooks/useGet';
import { toast } from 'react-hot-toast';
import Popover from '../common/Popover';

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' or 'activities'
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Activity logs states
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);
  
  // Popover states
  const [showErrorPopover, setShowErrorPopover] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirmPopover, setShowDeleteConfirmPopover] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [showFormPopover, setShowFormPopover] = useState(false);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: admins, loading, error: fetchError, refetch } = useGet('/admin');

  // Fetch activities function
  const fetchActivities = async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
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
      setActivitiesError(error.message || 'Failed to fetch activities');
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch activities when tab is switched to activities
  useEffect(() => {
    if (activeTab === 'activities') {
      fetchActivities();
    }
  }, [activeTab]);

  // Helper functions for activity logs
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

  // Handle click on Add Admin button
  const handleAddClick = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
    setEditingAdmin(null);
    setShowFormPopover(true);
  };
  
  const handleEditClick = (admin) => {
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      confirmPassword: '',
      phone: admin.phone || ''
    });
    setEditingAdmin(admin);
    setShowFormPopover(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate password length before submitting
    if (!editingAdmin && formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setShowErrorPopover(true);
      setIsLoading(false);
      return;
    }

    // Only check password match if password is being changed
    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setShowErrorPopover(true);
      setIsLoading(false);
      return;
    }

    try {
      const url = editingAdmin
        ? `${import.meta.env.VITE_API_URL}/admin/${editingAdmin._id}`
        : `${import.meta.env.VITE_API_URL}/auth/admin/register`;
      
      // Prepare request body
      let requestBody = {};
      
      if (editingAdmin) {
        // For updates, only include fields that have changed
        if (formData.name !== editingAdmin.name) {
          requestBody.name = formData.name;
        }
        if (formData.email !== editingAdmin.email) {
          requestBody.email = formData.email;
        }
        if (formData.phone !== editingAdmin.phone) {
          requestBody.phone = formData.phone;
        }
        if (formData.password) {
          requestBody.password = formData.password;
        }
      } else {
        // For new admin, include all required fields
        requestBody = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password
        };
      }

      console.log('Sending request:', {
        url,
        method: editingAdmin ? 'PUT' : 'POST',
        body: requestBody
      });

      const response = await fetch(
        url,
        {
          method: editingAdmin ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();
      console.log('Response:', data);
      
      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMsg = data.errors.join(', ');
          setErrorMessage(errorMsg);
          throw new Error(errorMsg);
        }
        if (data.message) {
          setErrorMessage(data.message);
          throw new Error(data.message);
        }
        const errorMsg = 'Failed to save admin';
        setErrorMessage(errorMsg);
        throw new Error(errorMsg);
      }

      // Show success message via popover
      setSuccessMessage(editingAdmin ? 'Admin updated successfully' : 'Admin created successfully');
      setShowSuccessPopover(true);
      
      // Close the form popover
      setShowFormPopover(false);
      
      // These will happen after the success popover is closed
      setEditingAdmin(null);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
    } catch (err) {
      console.error('Error:', err);
      const errorMsg = err.message || 'An error occurred while saving the admin';
      setErrorMessage(errorMsg);
      setShowErrorPopover(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Add password change handler (no inline validation popover)
  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, password }));
  };

  // Show delete confirmation popover
  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteConfirmPopover(true);
  };

  // Handle the actual delete operation
  const handleDelete = async () => {
    if (!adminToDelete) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/${adminToDelete._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete admin');
      }
      
      // Just use toast for success and close the confirmation popover
      toast.success('Admin deleted successfully');
      setShowDeleteConfirmPopover(false);
      setAdminToDelete(null);
      refetch();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete admin');
      setShowErrorPopover(true);
      setShowDeleteConfirmPopover(false); // Close delete popover if an error occurs
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAdmins = admins?.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary-700">Admin Management</h1>
        {activeTab === 'admins' && (
          <button
            onClick={handleAddClick}
            className="flex items-center bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FiPlus className="mr-2" /> Add New Admin
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('admins')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admins'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiUser className="inline mr-2" />
              Admins
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activities'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiActivity className="inline mr-2" />
              Activity Logs
            </button>
          </nav>
        </div>
      </div>
      {/* Admins Tab Content */}
      {activeTab === 'admins' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div className="relative w-full md:w-1/2">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search admins by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                ) : fetchError ? (
                  <tr><td colSpan={4} className="text-center text-red-500 py-8">Error loading admins: {fetchError}</td></tr>
                ) : paginatedAdmins.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">No admins found.</td></tr>
                ) : paginatedAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                          {admin.name?.charAt(0)?.toUpperCase() || <FiUser />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{admin.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <FiMail className="mr-2 text-primary-600" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <FiPhone className="mr-2 text-primary-600" />
                        {admin.phone || 'Not provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditClick(admin)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <FiEdit2 className="inline-block" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(admin)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FiTrash2 className="inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Activity Logs Tab Content */}
      {activeTab === 'activities' && (
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
                {activitiesLoading ? (
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
                ) : activitiesError ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-red-500">
                      <div>
                        <p className="font-medium">Error loading activities</p>
                        <p className="text-sm">{activitiesError}</p>
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
      )}
      {/* Admin Form Popover */}
      <Popover
        isOpen={showFormPopover}
        onClose={() => {
          setShowFormPopover(false);
          setEditingAdmin(null);
        }}
        title={editingAdmin ? 'Edit Admin' : 'Add New Admin'}
        type="info"
        message={
          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => {
                        const value = e.target.value.replace(/[^a-zA-Z ]/g, '').slice(0, 20);
                        setFormData(prev => ({ ...prev, name: value }));
                      }}
                      maxLength={20}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required={!editingAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => {
                        let value = e.target.value.replace(/[^a-zA-Z0-9@._]/g, '').slice(0, 30);
                        // Enforce domain part (after @) max 15 chars
                        const atIdx = value.indexOf('@');
                        if (atIdx !== -1) {
                          const before = value.slice(0, atIdx + 1);
                          let after = value.slice(atIdx + 1, atIdx + 16); // max 15 chars after @
                          value = before + after;
                        }
                        setFormData(prev => ({ ...prev, email: value }));
                      }}
                      maxLength={30}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required={!editingAdmin}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        setFormData(prev => ({ ...prev, phone: value }));
                      }}
                      maxLength={10}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit phone number"
                      required={!editingAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {editingAdmin ? 'New Password (leave blank to keep current)' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={e => {
                          const value = e.target.value.slice(0, 15);
                          setFormData(prev => ({ ...prev, password: value }));
                        }}
                        maxLength={15}
                        className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10 border-gray-300"
                        required={!editingAdmin}
                        minLength={6}
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 mt-1 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none" 
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {editingAdmin ? 'Confirm New Password' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={e => {
                          const value = e.target.value.slice(0, 15);
                          setFormData(prev => ({ ...prev, confirmPassword: value }));
                        }}
                        maxLength={15}
                        className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10 border-gray-300"
                        required={!editingAdmin}
                        minLength={6}
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 mt-1 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFormPopover(false);
                      setEditingAdmin(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : editingAdmin ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
          }
      />

      {/* Error Popover */}
      <Popover
        isOpen={showErrorPopover}
        onClose={() => setShowErrorPopover(false)}
        title="Error"
        message={errorMessage}
        type="error"
      />

      {/* Success Popover */}
      <Popover
        isOpen={showSuccessPopover}
        onClose={() => {
          setShowSuccessPopover(false);
          // Refresh data after success popover is closed
          refetch();
        }}
        title="Success"
        message={successMessage}
        type="success"
      />

      {/* Delete Confirmation Popover */}
      <Popover
        isOpen={showDeleteConfirmPopover}
        onClose={() => {
          setShowDeleteConfirmPopover(false);
          setAdminToDelete(null);
        }}
        title="Confirm Delete"
        message={adminToDelete ? `Are you sure you want to delete admin ${adminToDelete.name}?` : 'Are you sure you want to delete this admin?'}
        type="confirm"
        onConfirm={handleDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />


    </div>
  );
};

export default AdminManagement;