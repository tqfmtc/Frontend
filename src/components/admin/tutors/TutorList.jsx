import React, { useState, useEffect } from 'react';
// Use VITE_API_URL for backend endpoint

import Popover from '../../common/Popover';
import { hasWritePermission } from '../../../utils/permissions';

const TutorList = ({ onEdit, onDelete, onProfile, statusFilter = 'all' }) => {
  // All state hooks at the top
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTutors, setFilteredTutors] = useState([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Popover states
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [showDeleteSuccessPopover, setShowDeleteSuccessPopover] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState(null);

  // Initial data fetch
  useEffect(() => {
    fetchTutors();
  }, []);

  // Re-filter when statusFilter prop changes
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
    setCurrentPage(1);
  }, [statusFilter]);

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
    // Reset to first page whenever filters change
    setCurrentPage(1);
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
      // Apply initial filtering based on statusFilter prop
      let filtered = [...data];
      if (statusFilter !== 'all') {
        filtered = filtered.filter(tutor => tutor.status === statusFilter);
      }
      setFilteredTutors(filtered);
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
    console.log(e);
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
  // Pagination helpers
  const totalPages = Math.ceil(filteredTutors.length / itemsPerPage);
  const indexOfLastTutor = currentPage * itemsPerPage;
  const indexOfFirstTutor = indexOfLastTutor - itemsPerPage;
  const currentTutors = filteredTutors.slice(indexOfFirstTutor, indexOfLastTutor);

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
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredTutors.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            {searchTerm ? 'No tutors match your search criteria' : 'No tutors found'}
          </div>
        ) : (
          currentTutors.map((tutor) => (
            <div 
              key={tutor._id}
              style={{
                background: tutor.status === 'inactive' ? '#f3f4f6' : 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* Header with name and status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827', marginBottom: '4px' }}>
                    {tutor.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {tutor.assignedCenter ? tutor.assignedCenter.name : 'Not assigned'}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    background: tutor.status === 'active' ? '#d1fae5' : '#fee2e2',
                    color: tutor.status === 'active' ? '#065f46' : '#991b1b',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tutor.status}
                </span>
              </div>

              {/* Contact Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <a 
                  href={`tel:${tutor.phone}`}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  {tutor.phone}
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '14px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span style={{ wordBreak: 'break-all' }}>{tutor.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '14px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {tutor.joiningDate ? new Date(tutor.joiningDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => onProfile(tutor)}
                  style={{ 
                    flex: 1,
                    minWidth: '80px',
                    padding: '8px 12px', 
                    background: '#f3f4f6', 
                    color: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View
                </button>
                {hasWritePermission('tutors') && (
                  <>
                    <button 
                      onClick={() => onEdit(tutor)}
                      style={{ 
                        flex: 1,
                        minWidth: '80px',
                        padding: '8px 12px', 
                        background: '#dbeafe', 
                        color: '#1e40af', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontWeight: '500',
                        fontSize: '14px'
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
                        flex: 1,
                        minWidth: '80px',
                        padding: '8px 12px', 
                        background: tutor.status === 'inactive' ? '#e5e7eb' : '#fee2e2', 
                        color: tutor.status === 'inactive' ? '#9ca3af' : '#b91c1c', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: tutor.status === 'inactive' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontWeight: '500',
                        fontSize: '14px',
                        opacity: tutor.status === 'inactive' ? 0.7 : 1
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block" style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            tableLayout: 'fixed'
          }}
        >
          <colgroup>
            <col style={{ width: '15%' }} /> {/* Name */}
            <col style={{ width: '10%' }} /> {/* Phone */}
            <col style={{ width: '15%' }} /> {/* Email */}
            <col style={{ width: '14%' }} /> {/* Center */}
            <col style={{ width: '10%' }} /> {/* Joining Date */}
            <col style={{ width: '20%' }} /> {/* Actions */}
            <col style={{ width: '10%' }} /> {/* Status */}
          </colgroup>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Name</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Phone</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Email</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Center</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Joining Date</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Actions</th>
              <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Status</th>

            </tr>
          </thead>
          <tbody>
            {filteredTutors.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  {searchTerm ? 'No tutors match your search criteria' : 'No tutors found'}
                </td>
              </tr>
            ) : (
              currentTutors.map((tutor) => (
                <tr 
                  key={tutor._id} 
                  style={{ 
                    borderBottom: '1px solid #e5e7eb', 
                    transition: 'all 0.2s ease',
                    backgroundColor: tutor.status === 'inactive' ? '#f3f4f6' : 'white',
                    opacity: 1
                  }}
                >
                  <td style={{ padding: '14px 16px', whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    <div style={{ fontWeight: '500', color: '#111827' }}>{tutor.name}</div>
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                    <a href={`tel:${tutor.phone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{tutor.phone}</a>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4b5563', whiteSpace: 'normal', overflowWrap: 'break-word' }}>{tutor.email}</td>
                  <td style={{ padding: '14px 16px', color: '#4b5563', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
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
                  <td style={{ padding: '14px 16px', color: '#4b5563', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                    {tutor.joiningDate ? new Date(tutor.joiningDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => onProfile(tutor)}
                        style={{ 
                          padding: '4px 8px', 
                          background: '#f3f4f6', 
                          color: '#1f2937', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '500',
                          fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                      </button>
                      {hasWritePermission('tutors') && (
                        <>
                          <button 
                            onClick={() => onEdit(tutor)}
                            style={{ 
                              padding: '4px 8px', 
                              background: '#dbeafe', 
                              color: '#1e40af', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: '500',
                              fontSize: '12px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => tutor.status !== 'inactive' && confirmDeleteTutor(tutor)}
                            disabled={tutor.status === 'inactive'}
                            style={{ 
                              padding: '4px 8px', 
                              background: tutor.status === 'inactive' ? '#e5e7eb' : '#fee2e2', 
                              color: tutor.status === 'inactive' ? '#9ca3af' : '#b91c1c', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: tutor.status === 'inactive' ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: '500',
                              fontSize: '12px',
                              transition: 'all 0.2s',
                              opacity: tutor.status === 'inactive' ? 0.7 : 1
                            }}
                            title={tutor.status === 'inactive' ? 'Cannot delete an inactive tutor' : 'Delete tutor'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        color: tutor.status === 'inactive' ? 'red' : 'green',
                        cursor: 'default',
                        userSelect: 'none',
                        fontWeight: 600,
                        minWidth: 70,
                        textAlign: 'center',
                      }}
                    >
                      {tutor.status === 'inactive' ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredTutors.length > 0 && (
          <div style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: '#f9fafb',
            borderRadius: '8px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Showing <span style={{ fontWeight: '600' }}>{indexOfFirstTutor + 1}</span> to <span style={{ fontWeight: '600' }}>{Math.min(indexOfLastTutor, filteredTutors.length)}</span> of <span style={{ fontWeight: '600' }}>{filteredTutors.length}</span> tutors
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  background: currentPage === 1 ? '#f9fafb' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Previous
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      background: currentPage === pageNum ? '#3b82f6' : 'white',
                      color: currentPage === pageNum ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  background: currentPage === totalPages ? '#f9fafb' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Next
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Page <span style={{ fontWeight: '600' }}>{currentPage}</span> of <span style={{ fontWeight: '600' }}>{totalPages}</span>
            </div>
          </div>
        )}
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
