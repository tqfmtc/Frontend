import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiUser, FiMail, FiPhone, FiEye, FiEyeOff, FiActivity, FiInfo, FiStar, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import useGet from '../../hooks/useGet';
import { toast } from 'react-hot-toast';
import Popover from '../common/Popover';
import { hasWritePermission } from '../../utils/permissions';

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
    phone: '',
    superAdmin: false,
    permissions: {
      dashboard: { read: false, write: false },
      tutors: { read: false, write: false },
      hadiya: { read: false, write: false },
      centers: { read: false, write: false },
      students: { read: false, write: false },
      tutorAttendance: { read: false, write: false },
      guestTutors: { read: false, write: false },
      announcements: { read: false, write: false },
      supervisors: { read: false, write: false },
      subjects: { read: false, write: false },
      admins: { read: false, write: false }
    }
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
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: admins, loading, error: fetchError, refetch } = useGet('/admin');

  // Get current logged-in user
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  };

  const currentUser = getCurrentUser();

  // Permission modules
  const permissionModules = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'tutors', label: 'Tutors' },
    { key: 'hadiya', label: 'Hadiya' },
    { key: 'centers', label: 'Centers' },
    { key: 'students', label: 'Students' },
    { key: 'tutorAttendance', label: 'Attendance' },
    { key: 'guestTutors', label: 'Guest Tutors' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'supervisors', label: 'Supervisors' },
    { key: 'subjects', label: 'Subjects' },
    { key: 'admins', label: 'Admins' }
  ];

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
    setFormData({ 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '', 
      phone: '',
      superAdmin: false,
      permissions: {
        dashboard: { read: false, write: false },
        tutors: { read: false, write: false },
        hadiya: { read: false, write: false },
        centers: { read: false, write: false },
        students: { read: false, write: false },
        tutorAttendance: { read: false, write: false },
        guestTutors: { read: false, write: false },
        announcements: { read: false, write: false },
        supervisors: { read: false, write: false },
        subjects: { read: false, write: false },
        admins: { read: false, write: false }
      }
    });
    setEditingAdmin(null);
    setShowFormPopover(true);
  };
  
  const handleEditClick = (admin) => {
    // Check if trying to edit another superadmin
    if (admin.superAdmin && currentUser?._id !== admin._id) {
      setErrorMessage('Super Admins can only be edited by themselves');
      setShowErrorPopover(true);
      return;
    }

    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      confirmPassword: '',
      phone: admin.phone || '',
      superAdmin: admin.superAdmin || false,
      permissions: admin.permissions || {
        dashboard: { read: false, write: false },
        tutors: { read: false, write: false },
        hadiya: { read: false, write: false },
        centers: { read: false, write: false },
        students: { read: false, write: false },
        tutorAttendance: { read: false, write: false },
        guestTutors: { read: false, write: false },
        announcements: { read: false, write: false },
        supervisors: { read: false, write: false },
        subjects: { read: false, write: false },
        admins: { read: false, write: false }
      }
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
        // For updates, compute changed fields and include updatedFields
        const updatedFields = [];
        if (formData.name !== editingAdmin.name) {
          requestBody.name = formData.name;
          updatedFields.push('name');
        }
        if (formData.email !== editingAdmin.email) {
          requestBody.email = formData.email;
          updatedFields.push('email');
        }
        if (formData.phone !== editingAdmin.phone) {
          requestBody.phone = formData.phone;
          updatedFields.push('phone');
        }
        if (formData.password) {
          requestBody.password = formData.password;
          updatedFields.push('password');
        }
        requestBody.permissions = formData.permissions;
        requestBody.updatedFields = updatedFields;
      } else {
        // For new admin, include all required fields
        requestBody = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          permissions: formData.permissions
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
        {activeTab === 'admins' && hasWritePermission('admins') && (
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
          
          {/* Info Banner */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <FiInfo className="inline mr-2" />
              <strong>Tip:</strong> Click on any admin (except super admins) to view their permissions. You can also edit permissions from there.
            </p>
          </div>

          {/* Mobile Card View - Admins */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : fetchError ? (
              <div className="text-center text-red-500 py-8">Error loading admins: {fetchError}</div>
            ) : paginatedAdmins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No admins found.</div>
            ) : (
              paginatedAdmins.map((admin) => (
                <div
                  key={admin._id}
                  className={`rounded-xl shadow-md p-4 border-2 transition-all ${
                    currentUser?._id === admin._id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200'
                  } ${!admin.superAdmin ? 'cursor-pointer active:bg-gray-50' : ''}`}
                  onClick={() => {
                    if (!admin.superAdmin) {
                      setViewingAdmin(admin);
                      setShowPermissionsModal(true);
                    }
                  }}
                >
                  {/* Header with Avatar and Name */}
                  <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-200">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {admin.name?.charAt(0)?.toUpperCase() || <FiUser />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base truncate">
                          {admin.name}
                        </h3>
                        {currentUser?._id === admin._id && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      {admin.superAdmin ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium w-fit mt-1">
                          <FiStar size={12} fill="currentColor" />
                          Super Admin
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 mt-1 inline-block">Admin</span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FiMail className="text-blue-600 flex-shrink-0" />
                      <a 
                        href={`mailto:${admin.email}`}
                        className="text-blue-600 hover:underline truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {admin.email}
                      </a>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <FiPhone className="text-blue-600 flex-shrink-0" />
                        <a 
                          href={`tel:${admin.phone}`}
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {admin.phone}
                        </a>
                      </div>
                    )}
                    {!admin.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FiPhone className="flex-shrink-0" />
                        <span>Not provided</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {hasWritePermission('admins') && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(admin);
                        }}
                        className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                      >
                        <FiEdit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(admin);
                        }}
                        className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                      >
                        <FiTrash2 size={16} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View - Admins */}
          <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
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
                  <tr 
                    key={admin._id} 
                    className={`hover:bg-gray-50 ${currentUser?._id === admin._id ? 'bg-blue-50' : ''} ${!admin.superAdmin ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!admin.superAdmin) {
                        setViewingAdmin(admin);
                        setShowPermissionsModal(true);
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                          {admin.name?.charAt(0)?.toUpperCase() || <FiUser />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            {admin.name}
                            {currentUser?._id === admin._id && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">You</span>
                            )}
                          </div>
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
                        {admin.phone ? (
                          <a 
                            href={`tel:${admin.phone}`}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {admin.phone}
                          </a>
                        ) : (
                          <span>Not provided</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.superAdmin ? (
                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium w-fit">
                          <FiStar size={14} fill="currentColor" />
                          Super Admin
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">Admin</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                      {hasWritePermission('admins') && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(admin);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <FiEdit2 className="inline-block" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(admin);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FiTrash2 className="inline-block" />
                          </button>
                        </>
                      )}
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
        <>
          {/* Mobile Card View - Activities */}
          <div className="md:hidden space-y-4">
            {activitiesLoading ? (
              <div className="text-center py-8">
                <p>Loading activities...</p>
                <button 
                  onClick={fetchActivities}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : activitiesError ? (
              <div className="text-center text-red-500 py-8">
                <p className="font-medium">Error loading activities</p>
                <p className="text-sm">{activitiesError}</p>
                <button 
                  onClick={fetchActivities}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No activities found</div>
            ) : (
              activities.map((activity) => {
                const target = getTargetNameAndPhone(activity);
                return (
                  <div
                    key={activity._id}
                    className="rounded-xl shadow-md p-4 border-2 border-gray-200 bg-white"
                  >
                    {/* Header with Admin Info */}
                    <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-200">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                        {activity.admin?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm">
                          {activity.admin?.name || 'Unknown'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Action Badge */}
                    <div className="mb-3">
                      <span 
                        className="px-3 py-1.5 text-xs font-bold rounded-full inline-block"
                        style={{
                          backgroundColor: activity.action.toLowerCase().includes('delete') ? '#FEE2E2' :
                                        activity.action.toLowerCase().includes('create') ? '#DCFCE7' :
                                        activity.action.toLowerCase().includes('update') ? '#DBEAFE' : '#F3F4F6',
                          color: activity.action.toLowerCase().includes('delete') ? '#991B1B' :
                                 activity.action.toLowerCase().includes('create') ? '#166534' :
                                 activity.action.toLowerCase().includes('update') ? '#1E40AF' : '#374151'
                        }}
                      >
                        {activity.actionName || activity.action}
                      </span>
                    </div>

                    {/* Target Info */}
                    <div className="space-y-2 mb-3">
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Target: </span>
                        <span className="text-gray-900">{target.name}</span>
                      </div>
                      {target.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <FiPhone className="text-blue-600 flex-shrink-0" />
                          <a 
                            href={`tel:${target.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {target.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    {(() => {
                      const isUpdate = typeof activity.action === 'string' && activity.action.toLowerCase().includes('update');
                      const uf = Array.isArray(activity?.details?.updatedFields)
                        ? activity.details.updatedFields
                        : (Array.isArray(activity?.updatedFields) ? activity.updatedFields : []);
                      if (isUpdate && uf.length > 0) {
                        return (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Updated Fields:</p>
                            <p className="text-xs text-gray-900">{uf.join(', ')}</p>
                          </div>
                        );
                      }
                      if (activity.description) {
                        return (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Details:</p>
                            <p className="text-xs text-gray-900">{activity.description}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View - Activities */}
          <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
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
                        {target.phone ? (
                          <a 
                            href={`tel:${target.phone}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {target.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(activity.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          const isUpdate = typeof activity.action === 'string' && activity.action.toLowerCase().includes('update');
                          const uf = Array.isArray(activity?.details?.updatedFields)
                            ? activity.details.updatedFields
                            : (Array.isArray(activity?.updatedFields) ? activity.updatedFields : []);
                          if (isUpdate && uf.length > 0) {
                            return (
                              <span>
                                Updated fields: {uf.join(', ')}
                              </span>
                            );
                          }
                          return (
                            activity.description && (
                              <div className="group relative">
                                <FiInfo className="cursor-help text-gray-400 hover:text-gray-600" />
                                <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded p-2 shadow-lg z-10">
                                  {activity.description}
                                </div>
                              </div>
                            )
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </>
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
        size="xl"
        hideFooter={true}
        message={
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Super Admin Toggle */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-200 p-2 rounded-lg">
                    <FiStar size={24} className="text-amber-700" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">Super Admin</p>
                    <p className="text-xs text-gray-600 mt-0.5">Grant full access to all modules</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSuperAdminState = !formData.superAdmin;
                    setFormData(prev => ({
                      ...prev,
                      superAdmin: newSuperAdminState,
                      permissions: newSuperAdminState ? {
                        dashboard: { read: true, write: true },
                        tutors: { read: true, write: true },
                        hadiya: { read: true, write: true },
                        centers: { read: true, write: true },
                        students: { read: true, write: true },
                        tutorAttendance: { read: true, write: true },
                        guestTutors: { read: true, write: true },
                        announcements: { read: true, write: true },
                        supervisors: { read: true, write: true },
                        subjects: { read: true, write: true },
                        admins: { read: true, write: true }
                      } : prev.permissions
                    }));
                  }}
                  className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all shadow-inner ${
                    formData.superAdmin ? 'bg-amber-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform shadow-md ${
                    formData.superAdmin ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Two Column Layout for Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => {
                    const value = e.target.value.replace(/[^a-zA-Z ]/g, '').slice(0, 20);
                    setFormData(prev => ({ ...prev, name: value }));
                  }}
                  maxLength={20}
                  className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Enter full name"
                  required={!editingAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => {
                    let value = e.target.value.replace(/[^a-zA-Z0-9@._]/g, '').slice(0, 30);
                    const atIdx = value.indexOf('@');
                    if (atIdx !== -1) {
                      const before = value.slice(0, atIdx + 1);
                      let after = value.slice(atIdx + 1, atIdx + 16);
                      value = before + after;
                    }
                    setFormData(prev => ({ ...prev, email: value }));
                  }}
                  maxLength={30}
                  className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="admin@example.com"
                  required={!editingAdmin}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData(prev => ({ ...prev, phone: value }));
                  }}
                  maxLength={10}
                  className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  pattern="[0-9]{10}"
                  placeholder="10-digit phone number"
                  required={!editingAdmin}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 transition-all"
                    placeholder="Minimum 6 characters"
                    required={!editingAdmin}
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 transition-all"
                    placeholder="Re-enter password"
                    required={!editingAdmin}
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>
            </div>
              
              {/* Permissions Section */}
              {!formData.superAdmin && (
                <div className="border-t-2 border-gray-200 pt-6">
                  <label className="block text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 p-1.5 rounded-lg">
                      <FiActivity className="text-blue-600" size={18} />
                    </span>
                    Module Permissions
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {permissionModules.map(module => (
                      <div key={module.key} className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
                        <p className="text-sm font-bold text-gray-800 mb-3">{module.label}</p>
                        <div className="flex gap-2">
                          {/* No Access */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [module.key]: { read: false, write: false }
                                }
                              }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              !formData.permissions[module.key]?.read && !formData.permissions[module.key]?.write
                                ? 'bg-gray-500 text-white shadow-md scale-105'
                                : 'bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:shadow'
                            }`}
                          >
                            🚫 No Access
                          </button>
                          
                          {/* Read Only */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [module.key]: { read: true, write: false }
                                }
                              }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              formData.permissions[module.key]?.read && !formData.permissions[module.key]?.write
                                ? 'bg-blue-500 text-white shadow-md scale-105'
                                : 'bg-white border-2 border-blue-300 text-blue-600 hover:border-blue-400 hover:shadow'
                            }`}
                          >
                            👁️ Read Only
                          </button>
                          
                          {/* Full Access */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [module.key]: { read: true, write: true }
                                }
                              }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              formData.permissions[module.key]?.read && formData.permissions[module.key]?.write
                                ? 'bg-green-500 text-white shadow-md scale-105'
                                : 'bg-white border-2 border-green-300 text-green-600 hover:border-green-400 hover:shadow'
                            }`}
                          >
                            ✅ Full Access
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="border-t-2 border-gray-200 pt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFormPopover(false);
                  setEditingAdmin(null);
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold transition-all hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? '⏳ Saving...' : editingAdmin ? '✓ Update Admin' : '+ Create Admin'}
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

      {/* Permissions View Modal */}
      <Popover
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setViewingAdmin(null);
        }}
        title={`Permissions - ${viewingAdmin?.name || 'Admin'}`}
        type="info"
        size="lg"
        hideFooter={true}
        message={
          viewingAdmin && (
            <div className="space-y-4">
              {/* Admin Info Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {viewingAdmin.name?.charAt(0)?.toUpperCase() || <FiUser />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{viewingAdmin.name}</h3>
                    <p className="text-sm text-gray-600">{viewingAdmin.email}</p>
                    <p className="text-sm text-gray-500">{viewingAdmin.phone}</p>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {permissionModules.map(module => {
                  const permission = viewingAdmin.permissions?.[module.key] || { read: false, write: false };
                  const hasRead = permission.read;
                  const hasWrite = permission.write;
                  
                  return (
                    <div key={module.key} className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-800">{module.label}</p>
                        <div className="flex gap-2">
                          {!hasRead && !hasWrite && (
                            <span className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-bold shadow-sm">
                              🚫 No Access
                            </span>
                          )}
                          {hasRead && !hasWrite && (
                            <span className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm">
                              👁️ Read Only
                            </span>
                          )}
                          {hasRead && hasWrite && (
                            <span className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold shadow-sm">
                              ✅ Full Access
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="border-t-2 border-gray-200 pt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setViewingAdmin(null);
                  }}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold transition-all"
                >
                  Close
                </button>
                {hasWritePermission('admins') && (
                  <button
                    onClick={() => {
                      setShowPermissionsModal(false);
                      handleEditClick(viewingAdmin);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <FiEdit2 className="inline mr-2" />
                    Edit Permissions
                  </button>
                )}
              </div>
            </div>
          )
        }
      />


    </div>
  );
};

export default AdminManagement;