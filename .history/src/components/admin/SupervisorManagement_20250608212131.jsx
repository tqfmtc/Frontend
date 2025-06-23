import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiUser, FiMail, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import useGet from '../../hooks/useGet';
import { toast } from 'react-hot-toast';
import Popover from '../common/Popover';

const SupervisorManagement = () => {
  const [editingSupervisor, setEditingSupervisor] = useState(null);
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
  
  // Popover states
  const [showErrorPopover, setShowErrorPopover] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirmPopover, setShowDeleteConfirmPopover] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState(null);
  const [showFormPopover, setShowFormPopover] = useState(false);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: supervisors, loading, error: fetchError, refetch } = useGet('/supervisor');

  // Handle click on Add Supervisor button
  const handleAddClick = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '', center });
    setEditingSupervisor(null);
    setShowFormPopover(true);
  };
  
  const handleEditClick = (supervisor) => {
    setFormData({
      name: supervisor.name || '',
      email: supervisor.email || '',
      password: '',
      confirmPassword: '',
      phone: supervisor.phone || ''
    });
    setEditingSupervisor(supervisor);
    setShowFormPopover(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate password length before submitting
    if (!editingSupervisor && formData.password.length < 6) {
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
      const url = editingSupervisor
        ? `${import.meta.env.VITE_API_URL}/supervisor/${editingSupervisor._id}`
        : `${import.meta.env.VITE_API_URL}/auth/supervisor/register`;
      
      // Prepare request body
      let requestBody = {};
      
      if (editingSupervisor) {
        // For updates, only include fields that have changed
        if (formData.name !== editingSupervisor.name) {
          requestBody.name = formData.name;
        }
        if (formData.email !== editingSupervisor.email) {
          requestBody.email = formData.email;
        }
        if (formData.phone !== editingSupervisor.phone) {
          requestBody.phone = formData.phone;
        }
        if (formData.password) {
          requestBody.password = formData.password;
        }
      } else {
        // For new supervisor, include all required fields
        requestBody = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password
        };
      }

      console.log('Sending request:', {
        url,
        method: editingSupervisor ? 'PUT' : 'POST',
        body: requestBody
      });

      const response = await fetch(
        url,
        {
          method: editingSupervisor ? 'PUT' : 'POST',
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
        const errorMsg = 'Failed to save supervisor';
        setErrorMessage(errorMsg);
        throw new Error(errorMsg);
      }

      // Show success message via popover
      setSuccessMessage(editingSupervisor ? 'Supervisor updated successfully' : 'Supervisor created successfully');
      setShowSuccessPopover(true);
      
      // Close the form popover
      setShowFormPopover(false);
      
      // These will happen after the success popover is closed
      setEditingSupervisor(null);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
    } catch (err) {
      console.error('Error:', err);
      const errorMsg = err.message || 'An error occurred while saving the supervisor';
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
  const handleDeleteClick = (supervisor) => {
    setSupervisorToDelete(supervisor);
    setShowDeleteConfirmPopover(true);
  };

  // Handle the actual delete operation
  const handleDelete = async () => {
    if (!supervisorToDelete) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://mtc-backend-jn5y.onrender.com/api/supervisor/${supervisorToDelete._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete supervisor');
      }
      
      // Just use toast for success and close the confirmation popover
      toast.success('Supervisor deleted successfully');
      setShowDeleteConfirmPopover(false);
      setSupervisorToDelete(null);
      refetch();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete supervisor');
      setShowErrorPopover(true);
      setShowDeleteConfirmPopover(false); // Close delete popover if an error occurs
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSupervisors = supervisors?.filter(supervisor => 
    supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSupervisors.length / itemsPerPage);
  const paginatedSupervisors = filteredSupervisors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary-700">Supervisor Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleAddClick}
            className="flex items-center bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FiPlus className="mr-2" /> Add New Supervisor
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div className="relative w-full md:w-1/2">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search supervisors by name or email..."
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
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Supervisor Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan={4} className="text-center text-red-500 py-8">Error loading supervisors: {fetchError}</td></tr>
            ) : paginatedSupervisors.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">No supervisors found.</td></tr>
            ) : paginatedSupervisors.map((supervisor) => (
              <tr key={supervisor._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                      {supervisor.name?.charAt(0)?.toUpperCase() || <FiUser />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{supervisor.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-700">
                    <FiMail className="mr-2 text-primary-600" />
                    {supervisor.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-700">
                    <FiPhone className="mr-2 text-primary-600" />
                    {supervisor.phone || 'Not provided'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEditClick(supervisor)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <FiEdit2 className="inline-block" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(supervisor)}
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
      {/* Supervisor Form Popover */}
      <Popover
        isOpen={showFormPopover}
        onClose={() => {
          setShowFormPopover(false);
          setEditingSupervisor(null);
        }}
        title={editingSupervisor ? 'Edit Supervisor' : 'Add New Supervisor'}
        type="info"
        message={
          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required={!editingSupervisor}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required={!editingSupervisor}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit phone number"
                      required={!editingSupervisor}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {editingSupervisor ? 'New Password (leave blank to keep current)' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handlePasswordChange}
                        className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10 border-gray-300"
                        required={!editingSupervisor}
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
                      {editingSupervisor ? 'Confirm New Password' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10 border-gray-300"
                        required={!editingSupervisor}
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
                      setEditingSupervisor(null);
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
                    {isLoading ? 'Saving...' : editingSupervisor ? 'Update' : 'Create'}
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
          setSupervisorToDelete(null);
        }}
        title="Confirm Delete"
        message={supervisorToDelete ? `Are you sure you want to delete supervisor ${supervisorToDelete.name}?` : 'Are you sure you want to delete this supervisor?'}
        type="confirm"
        onConfirm={handleDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default SupervisorManagement; 