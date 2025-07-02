import React, { useState, useEffect } from 'react';
// Use VITE_API_URL for backend endpoint

import Popover from '../../common/Popover';

const TutorList = ({ onEdit, onDelete, onProfile }) => {
  // All state hooks at the top
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [filteredTutors, setFilteredTutors] = useState([]);
  
  // Popover states
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [showDeleteSuccessPopover, setShowDeleteSuccessPopover] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState(null);

  // Initial data fetch
  useEffect(() => {
    fetchTutors();
  }, []);

  // Filter tutors when search term, status filter, or tutors list changes
  useEffect(() => {
    if (!tutors) return;
    
    let filtered = [...tutors];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tutor => tutor.status === statusFilter);
    }
    
    // Apply search term filter if exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(tutor => 
        (tutor.name && tutor.name.toLowerCase().includes(term)) ||
        (tutor.email && tutor.email.toLowerCase().includes(term)) ||
        (tutor.phone && tutor.phone.includes(term)) ||
        (tutor.assignedCenter && tutor.assignedCenter.name && 
          tutor.assignedCenter.name.toLowerCase().includes(term))
      );
    }
    
    setFilteredTutors(filtered);
  }, [searchTerm, statusFilter, tutors]);

  // Fetch tutors from API
  const fetchTutors = async () => {
    setLoading(true);
    setError(null);
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
        setError('You are not logged in as admin. Please log in.');
        setLoading(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL}/tutors`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tutors: ${response.status}`);
      }

      const data = await response.json();
      setTutors(data);
      setFilteredTutors(data); // Initialize filtered tutors with all tutors
    } catch (err) {
      setError(err.message || 'Failed to fetch tutors');
    } finally {
      setLoading(false);
    }
  };

  // Show delete confirmation popover
  const confirmDeleteTutor = (tutor) => {
    setTutorToDelete(tutor);
    setShowDeletePopover(true);
  };

  const statusaction = (e) => {
    console
  }
  
  // Handle delete tutor after confirmation
  const handleDeleteTutor = async () => {
    if (!tutorToDelete) return;
    
    const tutorId = tutorToDelete._id;
    setShowDeletePopover(false); // Close confirmation popover
    
    try {
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        const userObj = JSON.parse(userStr);
        token = userObj.token;
      }
      if (!token) {
        // Show error in a better way
        setError('You are not logged in as admin. Please log in.');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL}/tutors/${tutorId}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete tutor');
      }

      // Remove the deleted tutor from the state
      const updatedTutors = tutors.filter(tutor => tutor._id !== tutorId);
      setTutors(updatedTutors);
      setFilteredTutors(updatedTutors);
      
      // Show success popover instead of alert
      setShowDeleteSuccessPopover(true);
      
      // Call the parent component's onDelete if provided
      if (onDelete) {
        onDelete(tutorId);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete tutor');
    } finally {
      setTutorToDelete(null); // Clear the tutor to delete
    }
  };

  // Get stats
  const getStats = () => {
    if (!tutors || tutors.length === 0) return { total: 0 };
    
    return {
      total: tutors.length
    };
  };
  
  // Get center name by ID
  const getCenterName = (centerId) => {
    const center = tutors.find(t => t.assignedCenter && t.assignedCenter.name);
    return center ? center.assignedCenter.name : 'Unknown';
  };

  // Calculate stats once
  const stats = getStats();

  // Loading state
  if (loading) {
    return <div>Loading tutors...</div>;
  }

  // Error state
  if (error) {
    return (
      <div>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={fetchTutors}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '16px', 
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Tutors</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{stats.total}</div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search tutors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                boxSizing: 'border-box'
              }} 
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#9ca3af" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer',
                height: '40px',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M6 9L12 15L18 9\' stroke=\'%236B7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '36px'
              }}
            >
              <option value="all">All Tutors</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Tutors Table */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Name</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Phone</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Email</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Center</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Actions</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Status</th>

            </tr>
          </thead>
          <tbody>
            {filteredTutors.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  {searchTerm ? 'No tutors match your search criteria' : 'No tutors found'}
                </td>
              </tr>
            ) : (
              filteredTutors.map((tutor) => (
                <tr 
                  key={tutor._id} 
                  style={{ 
                    borderBottom: '1px solid #e5e7eb', 
                    transition: 'all 0.2s ease',
                    backgroundColor: tutor.status === 'inactive' ? '#f3f4f6' : 'white',
                    opacity: 1
                  }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '500', color: '#111827' }}>{tutor.name}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4b5563' }}>{tutor.phone}</td>
                  <td style={{ padding: '14px 16px', color: '#4b5563' }}>{tutor.email}</td>
                  <td style={{ padding: '14px 16px', color: '#4b5563' }}>
                    {tutor.assignedCenter ? (
                      <div style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {tutor.assignedCenter.name || 'Unknown'}
                      </div>
                    ) : 'Not assigned'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => onProfile(tutor)}
                        style={{ 
                          padding: '6px 12px', 
                          background: '#f3f4f6', 
                          color: '#1f2937', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '500',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                      </button>
                      <button 
                        onClick={() => onEdit(tutor)}
                        style={{ 
                          padding: '6px 12px', 
                          background: '#dbeafe', 
                          color: '#1e40af', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '500',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                      </button>
                      <button 
                        onClick={() => tutor.status !== 'inactive' && confirmDeleteTutor(tutor)}
                        disabled={tutor.status === 'inactive'}
                        style={{ 
                          padding: '6px 12px', 
                          background: tutor.status === 'inactive' ? '#e5e7eb' : '#fee2e2', 
                          color: tutor.status === 'inactive' ? '#9ca3af' : '#b91c1c', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: tutor.status === 'inactive' ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '500',
                          fontSize: '13px',
                          transition: 'all 0.2s',
                          opacity: tutor.status === 'inactive' ? 0.7 : 1
                        }}
                        title={tutor.status === 'inactive' ? 'Cannot delete an inactive tutor' : 'Delete tutor'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                  <td onClick={statusaction} style={{ padding: '14px 16px', color: tutor.status ==="inactive"?"red":"green"}}>{tutor.status==="inactive"?"Inactive":"Active"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Delete Confirmation Popover */}
      <Popover
        isOpen={showDeletePopover}
        onClose={() => setShowDeletePopover(false)}
        title="Confirm Delete"
        message={tutorToDelete ? `Are you sure you want to delete ${tutorToDelete.name}?` : 'Are you sure you want to delete this tutor?'}
        type="confirm"
        onConfirm={handleDeleteTutor}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
      
      {/* Delete Success Popover */}
      <Popover
        isOpen={showDeleteSuccessPopover}
        onClose={() => setShowDeleteSuccessPopover(false)}
        title="Success"
        message="Tutor has been deleted successfully."
        type="success"
      />
    </div>
  );
};

export default TutorList;
