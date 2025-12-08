import React, { useState, useEffect } from 'react';
import API from '../../config/axios.js';
import AddTutorForm from './tutors/AddTutorForm';
import UpdateTutorForm from './tutors/UpdateTutorForm';
import TutorProfile from './tutors/TutorProfile';
import TutorList from './tutors/TutorList';
import Popover from '../common/Popover';
import useGet from '../CustomHooks/useGet';

const TutorManagement = () => {
  const [mode, setMode] = useState('list'); // 'list' | 'add' | 'update' | 'profile'
  const [selectedTutor, setSelectedTutor] = useState(null);
  const { response: tutors } = useGet('/tutors');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // State for form data, errors, etc.
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to trigger list refresh
  
  // Popover states
  const [showErrorPopover, setShowErrorPopover] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLoginPopover, setShowLoginPopover] = useState(false);

  // Handlers for switching modes
  const handleAdd = () => {
    setFormData({});
    setMode('add');
  };

  // Handle filter clicks
  const handleFilterClick = (filter) => {
    setStatusFilter(filter);
  };

  // Password validation helper
  function isValidPassword(password) {
    // No whitespace, no single/double quotes, at least 8 characters
    const forbiddenChars = /['"\s]/;
    return (
      typeof password === 'string' &&
      password.length >= 8 &&
      !forbiddenChars.test(password)
    );
  }

  // Handle Add Tutor API
  const handleAddTutor = async (formData) => {
    setIsSubmitting(true);
    try {
      // Get admin JWT
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token;
        } catch (e) {
          token = null;
        }
      }
      if (!token) {
        setErrorMessage('You are not logged in as admin. Please log in.');
        setShowLoginPopover(true);
        setIsSubmitting(false);
        return;
      }
      
      // Define proper JSON data for API
      const jsonData = {};
      
      // Convert form data to JSON object, ensuring subjects is always an array
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'subjects') {
          // Always ensure subjects is an array, even if empty
          jsonData[key] = Array.isArray(value) ? value : (value ? [value] : []);
        } else if (value !== undefined && value !== null) {
          jsonData[key] = value;
        }
      });
      
      console.log('Sending JSON data to API:', jsonData);
      
      // Password validation
      if ('password' in formData && !isValidPassword(formData.password)) {
        setErrorMessage(
          'Password must be at least 8 characters, contain no spaces, and not include quotes (\" or \\\').'
        );
        setShowErrorPopover(true);
        setIsSubmitting(false);
        return;
      }
      
      try {
        // POST to backend using axios instance
        const response = await API.post('/tutors', jsonData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = response.data;
        // With axios, successful responses come to this point
        setIsSubmitting(false);
        // Don't immediately reset - let the form show its success message first
      } catch (apiError) {
        // Detailed error handling for API errors
        console.error('API Error:', apiError);
        
        // Get detailed error message from the response if available
        let errorMsg = 'Failed to add tutor';
        
        if (apiError.response) {
          // The server responded with a status code outside of 2xx range
          console.error('Error Response Data:', apiError.response.data);
          console.error('Error Response Status:', apiError.response.status);
          
          const responseData = apiError.response.data;
          
          // Handle validation errors from backend (express-validator)
          if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
            const validationErrors = responseData.errors.map(err => `${err.path}: ${err.msg}`).join('\n');
            errorMsg = `Validation Error:\n${validationErrors}`;
          } else if (responseData.error) {
            // Check error field first (contains detailed errors like duplicate key)
            let errorText = responseData.error;
            
            // Format duplicate key errors to be user-friendly
            if (errorText.includes('E11000 duplicate key')) {
              if (errorText.includes('email')) {
                const emailMatch = errorText.match(/email: "([^"]+)"/);
                const email = emailMatch ? emailMatch[1] : 'This email';
                errorMsg = `Email Already Registered: "${email}" is already in use. Please use a different email address.`;
              } else if (errorText.includes('phone')) {
                const phoneMatch = errorText.match(/phone: "([^"]+)"/);
                const phone = phoneMatch ? phoneMatch[1] : 'This phone number';
                errorMsg = `Phone Already Registered: "${phone}" is already in use. Please use a different phone number.`;
              } else {
                errorMsg = 'Duplicate Entry: This information is already registered in the system. Please check your input.';
              }
            } else {
              errorMsg = errorText;
            }
          } else if (responseData.message) {
            errorMsg = responseData.message;
          } else if (apiError.response.status === 400) {
            errorMsg = 'Invalid request data. Please check your input.';
          } else {
            errorMsg = `Server Error ${apiError.response.status}: ${apiError.message}`;
          }
        } else if (apiError.request) {
          // Request was made but no response was received
          errorMsg = 'No response from server. Please check your network connection.';
        }
        
        setErrorMessage(errorMsg);
        setIsSubmitting(false);
        return; // Don't throw, just return to prevent outer catch from overwriting
      }
    } catch (err) {
      console.error('Add Tutor Error:', err);
      // This catch is for any other unexpected errors
      let detailedError = 'An unexpected error occurred';
      
      if (err.response && err.response.status === 500) {
        console.error('500 Server Error Details:', {
          data: err.response.data,
          headers: err.response.headers,
          url: err.response.config?.url,
          method: err.response.config?.method,
          requestData: err.response.config?.data,
        });
        
        detailedError = 'Server Error (500): The server encountered an unexpected condition.';
        
        // Check for specific known errors
        const errorText = err.response.data?.error || '';
        
        // Handle duplicate email error
        if (errorText.includes('duplicate key error') && errorText.includes('email')) {
          const email = formData.email || 'This email';
          detailedError = `Email already in use: "${email}" is already registered for another tutor. Please use a different email address.`;
        }
        // Handle duplicate phone error
        else if (errorText.includes('duplicate key error') && errorText.includes('phone')) {
          const phone = formData.phone || 'This phone number';
          detailedError = `Phone number already in use: "${phone}" is already registered for another tutor. Please use a different phone number.`;
        }
        // Generic error handling if not one of the above specific cases
        else if (err.response.data) {
          if (typeof err.response.data === 'string') {
            detailedError += '\n\nServer message: ' + err.response.data;
          } else if (err.response.data.message) {
            detailedError += '\n\nServer message: ' + err.response.data.message;
          } else if (err.response.data.error) {
            detailedError += '\n\nServer error: ' + err.response.data.error;
          }
        }
        
        // Add timestamp to help identify patterns
        const timestamp = new Date().toISOString();
        detailedError += `\n\nError Timestamp: ${timestamp}`;
      } else {
        detailedError = err.message || 'Failed to add tutor';
      }
      
      setErrorMessage(detailedError);
      setIsSubmitting(false);
    }
  };
  
  // Handle Update Tutor API
  const handleUpdateTutor = async (updatedData) => {
    if (!selectedTutor || !selectedTutor._id) {
      setErrorMessage('No tutor selected for update');
      setShowErrorPopover(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Get admin JWT
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token;
        } catch (e) {
          token = null;
        }
      }
      if (!token) {
        setErrorMessage('You are not logged in as admin. Please log in.');
        setShowLoginPopover(true);
        setIsSubmitting(false);
        return;
      }
      
      // Prepare FormData for file uploads
      const fd = new FormData();

      // Compute updatedFields for logger by comparing with current selectedTutor
      const updatedFields = [];
      try {
        const comparableFields = [
          'name','email','phone','address','qualificationType','qualificationOther','qualificationStatus','yearOfCompletion','madarsahName','collegeName','specialization','assignedCenter','subjects','sessionType','sessionTiming','assignedHadiyaAmount','aadharNumber','bankName','bankBranch','accountNumber','ifscCode','status'
        ];
        comparableFields.forEach((key) => {
          const newVal = updatedData[key];
          const oldVal = selectedTutor[key];
          if (typeof newVal === 'undefined') return;
          if (Array.isArray(newVal)) {
            const oldArr = Array.isArray(oldVal) ? oldVal : (typeof oldVal === 'undefined' ? [] : [oldVal]);
            if (JSON.stringify(newVal) !== JSON.stringify(oldArr)) updatedFields.push(key);
          } else if (newVal !== oldVal) {
            updatedFields.push(key);
          }
        });
        if (updatedData.password) updatedFields.push('password');
      } catch {}
      Object.entries(updatedData).forEach(([key, value]) => {
        if (key === 'documents' && typeof value === 'object' && value !== null) {
          // Nested documents
          Object.entries(value).forEach(([docKey, docValue]) => {
            if (docKey === 'bankAccount' && typeof docValue === 'object' && docValue !== null) {
              Object.entries(docValue).forEach(([bankKey, bankValue]) => {
                if (bankValue instanceof File) {
                  fd.append(`documents.bankAccount.${bankKey}`, bankValue);
                } else if (bankValue) {
                  fd.append(`documents.bankAccount.${bankKey}`, bankValue);
                }
              });
            } else if (Array.isArray(docValue)) {
              docValue.forEach((file, idx) => {
                if (file instanceof File) {
                  fd.append(`documents.${docKey}`, file);
                }
              });
            } else if (docValue instanceof File) {
              fd.append(`documents.${docKey}`, docValue);
            } else if (docValue) {
              fd.append(`documents.${docKey}`, docValue);
            }
          });
        } else if (Array.isArray(value)) {
          value.forEach((v) => fd.append(key, v));
        } else if (value !== undefined && value !== null) {
          fd.append(key, value);
        }
      });
      
      // Define proper JSON data instead of FormData
      const jsonData = {};
      
      // Convert FormData to JSON object
      Object.entries(updatedData).forEach(([key, value]) => {
        if (key === 'subjects' && Array.isArray(value)) {
          jsonData[key] = value;
        } else if (value !== undefined && value !== null) {
          jsonData[key] = value;
        }
      });
      // Include updatedFields array for backend logger
      jsonData.updatedFields = updatedFields;
      
      console.log('Sending JSON data to API for update:', jsonData);
      
      // Password validation
      if ('password' in updatedData && updatedData.password && !isValidPassword(updatedData.password)) {
        setErrorMessage(
            'Password must be at least 8 characters, contain no spaces, and not include quotes (" or \').'
          );
        setShowErrorPopover(true);
        setIsSubmitting(false);
        return;
      }
      
      // PUT to backend using axios instance
      const response = await API.put(`/tutors/${selectedTutor._id}`, jsonData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = response.data;
      // With axios, successful responses come to this point - no need to check response.ok
      
      // This is a critical fix - we need to set these values but NOT redirect immediately
      // Let the form show its own success message first
      setIsSubmitting(false);
      
      // This is needed for the popover in UpdateTutorForm to work correctly
      // Don't navigate away immediately - let the form handle it
      // We'll still update these values so they're ready when the form redirects
      setFormData({});
      setSelectedTutor(null);
      // Trigger refresh of tutor list for when we return to it
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      let errorMsg = 'Failed to update tutor';
      
      if (err.response) {
        const responseData = err.response.data;
        
        // Handle validation errors from backend (express-validator)
        if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          const validationErrors = responseData.errors.map(e => `${e.path}: ${e.msg}`).join('\n');
          errorMsg = `Validation Error:\n${validationErrors}`;
        } else if (responseData.error) {
          // Check error field first (contains detailed errors like duplicate key)
          let errorText = responseData.error;
          
          // Format duplicate key errors to be user-friendly
          if (errorText.includes('E11000 duplicate key')) {
            if (errorText.includes('email')) {
              const emailMatch = errorText.match(/email: "([^"]+)"/);
              const email = emailMatch ? emailMatch[1] : 'This email';
              errorMsg = `Email Already Registered: "${email}" is already in use. Please use a different email address.`;
            } else if (errorText.includes('phone')) {
              const phoneMatch = errorText.match(/phone: "([^"]+)"/);
              const phone = phoneMatch ? phoneMatch[1] : 'This phone number';
              errorMsg = `Phone Already Registered: "${phone}" is already in use. Please use a different phone number.`;
            } else {
              errorMsg = 'Duplicate Entry: This information is already registered in the system. Please check your input.';
            }
          } else {
            errorMsg = errorText;
          }
        } else if (responseData.message) {
          errorMsg = responseData.message;
        } else if (err.response.status === 400) {
          errorMsg = 'Invalid request data. Please check your input.';
        } else {
          errorMsg = `Server Error ${err.response.status}: ${err.message}`;
        }
      } else {
        errorMsg = err.message || 'Failed to update tutor';
      }
      
      setErrorMessage(errorMsg);
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tutor) => {
    setSelectedTutor(tutor);
    setFormData(tutor);
    setMode('update');
  };
  const handleProfile = (tutor) => {
    setSelectedTutor(tutor);
    setMode('profile');
  };
  const handleBackToList = () => {
    setSelectedTutor(null);
    setFormData({});
    setMode('list');
    // Trigger refresh when returning to list
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle delete tutor (if needed at this level)
  const handleDeleteTutor = (tutorId) => {
    // The actual deletion is handled in TutorList component
    // Just refresh the list after deletion
    setRefreshTrigger(prev => prev + 1);
  };

  // Export tutors to CSV
  const handleExportToExcel = () => {
    if (!tutors || tutors.length === 0) {
      setErrorMessage('No tutor data available to export');
      setShowErrorPopover(true);
      return;
    }

    // Filter tutors based on current status filter
    let filteredData = tutors;
    if (statusFilter !== 'all') {
      filteredData = tutors.filter(t => t.status === statusFilter);
    }

    if (filteredData.length === 0) {
      setErrorMessage('No tutors match the current filter');
      setShowErrorPopover(true);
      return;
    }

    // Define CSV headers
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Address',
      'Qualification Type',
      'Qualification Other',
      'Qualification Status',
      'Year of Completion',
      'Madarsah Name',
      'College Name',
      'Specialization',
      'Assigned Center',
      'Subjects',
      'Session Type',
      'Session Timing',
      'Assigned Hadiya Amount',
      'Aadhar Number',
      'Bank Name',
      'Bank Branch',
      'Account Number',
      'IFSC Code',
      'Status'
    ];

    // Convert tutors data to CSV rows
    const rows = filteredData.map(tutor => [
      tutor.name || '',
      tutor.email || '',
      tutor.phone || '',
      tutor.address || '',
      tutor.qualificationType || '',
      tutor.qualificationOther || '',
      tutor.qualificationStatus || '',
      tutor.yearOfCompletion || '',
      tutor.madarsahName || '',
      tutor.collegeName || '',
      tutor.specialization || '',
      tutor.assignedCenter?.name || '',
      Array.isArray(tutor.subjects) ? tutor.subjects.join('; ') : (tutor.subjects || ''),
      tutor.sessionType || '',
      tutor.sessionTiming || '',
      tutor.assignedHadiyaAmount || '',
      tutor.aadharNumber || '',
      tutor.bankName || '',
      tutor.bankBranch || '',
      tutor.accountNumber || '',
      tutor.ifscCode || '',
      tutor.status || ''
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tutors_${statusFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate tutor stats
  const tutorStats = React.useMemo(() => {
    if (!tutors) return { total: 0, active: 0, inactive: 0 };
    return {
      total: tutors.length,
      active: tutors.filter(t => t.status === 'active').length,
      inactive: tutors.filter(t => t.status === 'inactive').length
    };
  }, [tutors]);

  // Render based on mode
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {mode === 'list' && (
        <>
          <div style={{ 
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
            borderRadius: '10px', 
            padding: '20px', 
            marginBottom: '24px',
            color: 'white',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: '1' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0' }}>Tutor Management</h1>
                <p style={{ fontSize: '14px', margin: '0', opacity: '0.9' }}>Manage all tutors, their profiles, and assignments</p>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '24px', 
                alignItems: 'center', 
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '12px 24px',
                borderRadius: '8px',
                margin: '0 24px'
              }}>
                <div 
                  style={{ 
                    textAlign: 'center', 
                    paddingRight: '24px', 
                    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: statusFilter === 'all' ? 1 : 0.7,
                    position: 'relative'
                  }}
                  onClick={() => handleFilterClick('all')}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = statusFilter === 'all' ? 1 : 0.7}
                >
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0' }}>{tutorStats.total}</h3>
                  <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Total Tutors</p>
                  {statusFilter === 'all' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '20px',
                      height: '3px',
                      backgroundColor: 'white',
                      borderRadius: '2px'
                    }}></div>
                  )}
                </div>
                <div 
                  style={{ 
                    textAlign: 'center', 
                    paddingRight: '24px', 
                    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: statusFilter === 'active' ? 1 : 0.7,
                    position: 'relative'
                  }}
                  onClick={() => handleFilterClick('active')}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = statusFilter === 'active' ? 1 : 0.7}
                >
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: '#4ade80' }}>{tutorStats.active}</h3>
                  <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Active Tutors</p>
                  {statusFilter === 'active' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '20px',
                      height: '3px',
                      backgroundColor: '#4ade80',
                      borderRadius: '2px'
                    }}></div>
                  )}
                </div>
                <div 
                  style={{ 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: statusFilter === 'inactive' ? 1 : 0.7,
                    position: 'relative'
                  }}
                  onClick={() => handleFilterClick('inactive')}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = statusFilter === 'inactive' ? 1 : 0.7}
                >
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: '#f87171' }}>{tutorStats.inactive}</h3>
                  <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Inactive Tutors</p>
                  {statusFilter === 'inactive' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '20px',
                      height: '3px',
                      backgroundColor: '#f87171',
                      borderRadius: '2px'
                    }}></div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  style={{ 
                    padding: '8px 20px', 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white', 
                    border: '1px solid rgba(255, 255, 255, 0.3)', 
                    borderRadius: '6px', 
                    fontWeight: '600', 
                    fontSize: '16px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={handleExportToExcel}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export to Excel
                </button>
                <button
                  style={{ 
                    padding: '8px 20px', 
                    background: 'white', 
                    color: '#1e3a8a', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontWeight: '600', 
                    fontSize: '16px', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={handleAdd}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Tutor
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>
            <TutorList 
              onEdit={handleEdit} 
              onDelete={handleDeleteTutor} 
              onProfile={handleProfile} 
              statusFilter={statusFilter}
              key={refreshTrigger} // Force re-render on refresh
            />
          </div>
        </>
      )}
      {mode === 'add' && (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={handleBackToList}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '16px',
                color: '#4b5563',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                marginRight: '16px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
          </div>
          <AddTutorForm 
            onSubmit={handleAddTutor} 
            onCancel={handleBackToList}
            formData={formData} 
            setFormData={setFormData} 
            fieldErrors={fieldErrors} 
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            onErrorClose={() => setErrorMessage('')}
          />
        </div>
      )}
      {mode === 'update' && (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={handleBackToList}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '16px',
                color: '#4b5563',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                marginRight: '16px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Edit Tutor: {selectedTutor?.name}</h2>
          </div>
          <UpdateTutorForm 
            onSubmit={handleUpdateTutor} 
            formData={formData} 
            setFormData={setFormData} 
            fieldErrors={fieldErrors} 
            isSubmitting={isSubmitting} 
            tutorId={selectedTutor?._id}
            onCancel={handleBackToList}
            errorMessage={errorMessage}
            onErrorClose={() => setErrorMessage('')}
          />
        </div>
      )}
      {mode === 'profile' && selectedTutor && (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}>
          <TutorProfile tutor={selectedTutor} onClose={handleBackToList} />
        </div>
      )}
      
      {/* Error Popover */}
      <Popover
        isOpen={showErrorPopover}
        onClose={() => setShowErrorPopover(false)}
        title="Error"
        message={errorMessage}
        type="error"
        actions={errorMessage.includes('Server Error (500)') ? [
          {
            label: 'Retry',
            onClick: () => {
              setShowErrorPopover(false);
              // Retry the last submission with the same data
              if (mode === 'add' && formData) {
                console.log('Retrying submission with:', formData);
                handleAddTutor(formData);
              }
            }
          }
        ] : undefined}
      />
      
      {/* Login Required Popover */}
      <Popover
        isOpen={showLoginPopover}
        onClose={() => setShowLoginPopover(false)}
        title="Authentication Required"
        message={errorMessage}
        type="warning"
      />
    </div>
  );
};

export default TutorManagement;