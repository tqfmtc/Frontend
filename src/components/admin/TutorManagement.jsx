import React, { useState, useEffect } from 'react';
import API from '../../config/axios.js';
import AddTutorForm from './tutors/AddTutorForm';
import UpdateTutorForm from './tutors/UpdateTutorForm';
import TutorProfile from './tutors/TutorProfile';
import TutorList from './tutors/TutorList';
import Popover from '../common/Popover';

const TutorManagement = () => {
  const [mode, setMode] = useState('list'); // 'list' | 'add' | 'update' | 'profile'
  const [selectedTutor, setSelectedTutor] = useState(null);

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
          
          if (apiError.response.data && apiError.response.data.message) {
            errorMsg = `Server Error: ${apiError.response.data.message}`;
          } else if (apiError.response.data && apiError.response.data.error) {
            errorMsg = `Server Error: ${apiError.response.data.error}`;
          } else {
            errorMsg = `Server Error ${apiError.response.status}: ${apiError.message}`;
          }
        } else if (apiError.request) {
          // Request was made but no response was received
          errorMsg = 'No response from server. Please check your network connection.';
        }
        
        setErrorMessage(errorMsg);
        setShowErrorPopover(true);
        throw apiError; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error('Add Tutor Error:', err);
      if (!showErrorPopover) { // Only set if not already set by inner catch
        // Specific handling for 500 errors
        if (err.response && err.response.status === 500) {
          console.error('500 Server Error Details:', {
            data: err.response.data,
            headers: err.response.headers,
            url: err.response.config?.url,
            method: err.response.config?.method,
            requestData: err.response.config?.data,
          });
          
          // Create a more detailed error message for 500 errors
          let detailedError = 'Server Error (500): The server encountered an unexpected condition.';
          
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
          
          setErrorMessage(detailedError);
        } else {
          setErrorMessage(err.message || 'Failed to add tutor');
        }
        setShowErrorPopover(true);
      }
    } finally {
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
      setErrorMessage(err.message || 'Failed to update tutor');
      setShowErrorPopover(true);
    } finally {
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

  // Render based on mode
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {mode === 'list' && (
        <>
          <div style={{ 
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
            borderRadius: '10px', 
            padding: '24px', 
            marginBottom: '24px',
            color: 'white',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0' }}>Tutor Management</h1>
                <p style={{ fontSize: '14px', margin: '0', opacity: '0.9' }}>Manage all tutors, their profiles, and assignments</p>
              </div>
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
                  gap: '6px'
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
          
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
            marginBottom: '32px'
          }}>
            <TutorList 
              onEdit={handleEdit} 
              onDelete={handleDeleteTutor} 
              onProfile={handleProfile} 
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
            formData={formData} 
            setFormData={setFormData} 
            fieldErrors={fieldErrors} 
            isSubmitting={isSubmitting} 
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
            onCancel={handleBackToList} /* Added to close form instead of navigating back */
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
