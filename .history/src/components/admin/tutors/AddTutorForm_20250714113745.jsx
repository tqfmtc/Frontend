import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Popover from '../../common/Popover';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  qualifications: '',
  assignedCenter: '',
  subjects: [], // Always initialize as an array
  sessionType: '',
  sessionTiming: '',
  assignedHadiyaAmount: '',
  bankName: '',
  accountNumber: '',
  bankBranch: '',
  ifscCode: '',
};

const sessionTypes = [
  { value: 'arabic', label: 'Arabic' },
  { value: 'tuition', label: 'Tuition' },
];
const sessionTimings = [
  { value: 'after_fajr', label: 'Post Fajr' },
  { value: 'after_zohar', label: 'Post Zohar' },
  { value: 'after_asar', label: 'Post Asar' },
  { value: 'after_maghrib', label: 'Post Maghrib' },
  { value: 'after_isha', label: 'Post Isha' },
];
// Centers will be fetched from backend API

const subjectsList = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Science', label: 'Science' },
  { value: 'English', label: 'English' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Islamic Studies', label: 'Islamic Studies' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Hindi', label: 'Hindi' },
];

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 15,
  marginTop: 4,
  marginBottom: 4,
  background: '#fff',
  boxSizing: 'border-box',
};
const selectStyle = {
  ...inputStyle,
  minHeight: 38,
};

const AddTutorForm = ({ onSubmit, formData, setFormData, fieldErrors, isSubmitting }) => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([]);
  const [centersError, setCentersError] = useState(null);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);

  useEffect(() => {
    async function fetchCenters() {
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
console.log('[AddTutorForm] JWT token from localStorage:', token);
      if (!token) {
        setCentersError(`You are not logged in or your session expired. Please log in as admin to load centers. [token: ${token}]`);
        setCenters([]);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/centers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            setCentersError('Session expired or unauthorized. Please log in as admin again to load centers.');
          } else {
            setCentersError('Failed to fetch centers. Please try again.');
          }
          setCenters([]);
          return;
        }
        const data = await res.json();
        setCenters(data);
        setCentersError(null);
      } catch (err) {
        setCentersError('Error fetching centers. Please check your connection and try again.');
        setCenters([]);
      }
    }
    fetchCenters();
    // eslint-disable-next-line
  }, []);

  // Retry handler for centers fetch
  const handleRetryCenters = () => {
    setCentersError(null);
    setCenters([]);
    // Re-run fetchCenters
    (async () => {
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
console.log('[AddTutorForm] JWT token from localStorage:', token);
      if (!token) {
        setCentersError(`You are not logged in or your session expired. Please log in as admin to load centers. [token: ${token}]`);
        setCenters([]);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/centers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            setCentersError('Session expired or unauthorized. Please log in as admin again to load centers.');
          } else {
            setCentersError('Failed to fetch centers. Please try again.');
          }
          setCenters([]);
          return;
        }
        const data = await res.json();
        setCenters(data);
        setCentersError(null);
      } catch (err) {
        setCentersError('Error fetching centers. Please check your connection and try again.');
        setCenters([]);
      }
    })();
  };

  // Initialize the form with provided data or defaults
  const safeInitialForm = {
    ...initialState,
    ...formData
  };
  const [localForm, setLocalForm] = useState(safeInitialForm);
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number - only allow digits and limit to 10
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 10) {
        setLocalForm(prev => ({ ...prev, [name]: digitsOnly }));
      }
      return;
    }
    
    // Special handling for Aadhar number - format with spaces after every 4 digits
    if (name === 'aadharNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 12) {
        // Format with spaces after every 4 digits
        let formattedValue = '';
        for (let i = 0; i < digitsOnly.length; i++) {
          if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
          }
          formattedValue += digitsOnly[i];
        }
        setLocalForm(prev => ({ ...prev, [name]: formattedValue }));
      }
      return;
    }
    
    // Default handling for other fields
    setLocalForm(prev => ({ ...prev, [name]: value }));
  };
  // Nested change handling has been simplified as documents are no longer part of the form
  // Bank details handling has been removed since it's no longer part of the form
  const handleSubjectsChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setLocalForm(prev => ({ ...prev, subjects: selected }));
  };
  // File upload handling has been removed since documents are no longer part of the form

  // Form submit
  const validate = () => {
    const errs = {};
    
    // Debug log - Initial form state
    console.log('Form validation - Initial form state:', { 
      subjects: localForm.subjects,
      isArray: Array.isArray(localForm.subjects),
      type: typeof localForm.subjects
    });
    
    if (!localForm.phone || !/^[0-9]{10}$/.test(localForm.phone)) {
      errs.phone = 'Valid 10-digit phone number is required.';
    }
    if (!localForm.password || localForm.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (!localForm.assignedCenter) {
      errs.assignedCenter = 'Assigned Center is required.';
    }
    if (!localForm.assignedHadiyaAmount || isNaN(localForm.assignedHadiyaAmount) || Number(localForm.assignedHadiyaAmount) <= 0) {
      errs.assignedHadiyaAmount = 'Valid Hadiya amount is required.';
    }
    
    // IMPORTANT: Process subjects to ensure it's ALWAYS an array
    let subjectsArray;
    
    if (!localForm.subjects) {
      // No subjects selected
      subjectsArray = [];
      console.log('No subjects selected, using empty array');
    } else if (Array.isArray(localForm.subjects)) {
      // Already an array, just use it
      subjectsArray = [...localForm.subjects];
      console.log('Subjects already an array:', subjectsArray);
    } else {
      // Not an array, convert it
      subjectsArray = [localForm.subjects];
      console.log('Converting single subject to array:', subjectsArray);
      
      // Update the form with the array version
      setLocalForm(prev => {
        const updated = { ...prev, subjects: subjectsArray };
        console.log('Updated form with array subjects:', updated.subjects);
        return updated;
      });
    }
    
    // Check if we have at least one subject
    if (subjectsArray.length === 0) {
      errs.subjects = 'At least one subject must be selected.';
      console.log('Validation error: No subjects selected');
    } else {
      console.log('Subjects validation passed with:', subjectsArray);
    }
    // Validate account number if provided
    if (localForm.accountNumber && (localForm.accountNumber.length < 11 || localForm.accountNumber.length > 18)) {
      errs.accountNumber = 'Account number must be between 11-18 digits.';
    }
    // Validate IFSC code if provided
    if (localForm.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(localForm.ifscCode)) {
      errs.ifscCode = 'IFSC code must be in the format XXXX0XXXXXX (e.g., SBIN0123456).';
    }
    // Validate Aadhar number if provided
    if (localForm.aadharNumber) {
      const digitsOnly = localForm.aadharNumber.replace(/\s/g, '');
      if (digitsOnly.length !== 12) {
        errs.aadharNumber = 'Aadhar number must be 12 digits.';
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Adding extensive debug logs to trace the subjects field
    console.log('SUBMIT - Initial form state:', { 
      hasSubjects: !!localForm.subjects,
      subjects: localForm.subjects,
      isArray: Array.isArray(localForm.subjects),
      type: typeof localForm.subjects
    });
    
    const errs = validate();
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      console.log('Form has validation errors:', errs);
      return;
    }
    
    // Create a deep copy of the form data
    const formToSubmit = JSON.parse(JSON.stringify(localForm));
    
    // CRITICAL FIX: Force subjects to be an array no matter what
    if (!formToSubmit.subjects) {
      // If no subjects, use empty array
      formToSubmit.subjects = [];
      console.log('Using empty array for subjects');
    } else if (!Array.isArray(formToSubmit.subjects)) {
      // If not an array, convert to array with single element
      formToSubmit.subjects = [formToSubmit.subjects];
      console.log('Converted single subject to array:', formToSubmit.subjects);
    } else {
      // Already an array, just log it
      console.log('Subjects already an array:', formToSubmit.subjects);
    }
    
    // Final verification
    console.log('FINAL FORM TO SUBMIT:', { 
      subjects: formToSubmit.subjects,
      isArray: Array.isArray(formToSubmit.subjects)
    });
    
    // Submit the form with processed data
    try {
      await onSubmit(formToSubmit);
      setShowSuccessPopover(true);
    } catch (error) {
      console.error('Error adding tutor:', error);
      // Handle error if needed
    }
  };

  return (

    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
      <h2 style={{ marginBottom: 32, fontWeight: 700, fontSize: 28, color: '#2563eb', textAlign: 'center' }}>Add Tutor</h2>
      {/* Show error if centers cannot be loaded due to missing/expired token */}
      {centersError && (
        <div style={{ color: '#b91c1c', marginBottom: 20, background: '#fee2e2', padding: 12, borderRadius: 6, border: '1px solid #fca5a5' }}>
          {centersError}
          {centersError.toLowerCase().includes('log in') && (
            <div style={{ marginTop: 8 }}>
              <button type="button" onClick={handleRetryCenters} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          )}
        </div>
      )}
      {/* Personal Info */}
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 24, marginBottom: 28, border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 18, color: '#222' }}>Personal Information</div>
        <div style={{ marginBottom: 16 }}>
          <label>Name*</label>
          <input name="name" value={localForm.name || ''} onChange={handleChange} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Email*</label>
          <input name="email" value={localForm.email || ''} onChange={handleChange} type="email" required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Phone* <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>(This will be the tutor's login username)</span></label>
          <input 
            name="phone" 
            value={localForm.phone || ''} 
            onChange={handleChange} 
            required 
            placeholder="10 digits only" 
            style={inputStyle} 
          />
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            Enter exactly 10 digits. Currently: {localForm.phone ? localForm.phone.length : 0}/10
          </div>
          {errors.phone && <div style={{ color: 'red', fontSize: 13 }}>{errors.phone}</div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Login Password*</label>
          <input 
            name="password" 
            value={localForm.password || ''} 
            onChange={handleChange} 
            type="text" 
            required 
            style={inputStyle} 
            placeholder="Minimum 6 characters" 
          />
          <div style={{ backgroundColor: '#e6f7ff', padding: '8px 12px', borderRadius: '6px', marginTop: '6px', borderLeft: '4px solid #1890ff' }}>
            <span style={{ fontWeight: 600, color: '#222' }}>Note:</span> Use <code style={{ backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '3px' }}>tutor123</code> as the default password for all tutors.
          </div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            <strong>Important:</strong> This password will be used by the tutor to login with their phone number.
            Must be at least 6 characters long.
          </div>
          {errors.password && <div style={{ color: 'red', fontSize: 13 }}>{errors.password}</div>}
        </div>
        <div style={{ marginBottom: 0 }}>
          <label>Qualifications</label>
          <input name="qualifications" value={localForm.qualifications || ''} onChange={handleChange} style={inputStyle} />
        </div>
      </div>

      {/* Center & Subjects */}
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 24, marginBottom: 28, border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 18, color: '#222' }}>Center Information</div>
        <div style={{ marginBottom: 16 }}>
          <label>Assigned Center* <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>(Select the center to assign this tutor. Will be stored as ObjectId.)</span></label>
          {centersError ? (
            <div style={{ color: 'red', fontSize: 14, marginBottom: 8 }}>
              {centersError}
              <button type="button" onClick={handleRetryCenters} style={{ marginLeft: 16, padding: '2px 10px', borderRadius: 4, border: '1px solid #bbb', background: '#f4f4f4', cursor: 'pointer' }}>Retry</button>
            </div>
          ) : null}
          <select name="assignedCenter" value={localForm.assignedCenter || ''} onChange={handleChange} required style={selectStyle} disabled={!!centersError}>
            <option value="">Select Center</option>
            {Array.isArray(centers) && centers.length === 0 && !centersError && (
              <option value="">No centers available</option>
            )}
            {(Array.isArray(centers) ? centers : []).map(center => (
              <option key={center && center._id ? center._id : ''} value={center && center._id ? center._id : ''}>{center && center.name ? center.name : ''}</option>
            ))}
          </select>
          {errors.assignedCenter && <div style={{ color: 'red', fontSize: 13 }}>{errors.assignedCenter}</div>}
        </div>

      </div>

      {/* Session Info */}
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 24, marginBottom: 28, border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 18, color: '#222' }}>Session Information</div>
        <div style={{ marginBottom: 16 }}>
          <label>Session Type*</label>
          <select name="sessionType" value={localForm.sessionType || ''} onChange={handleChange} required style={selectStyle}>
            <option value="">Select Session Type</option>
            {sessionTypes.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 0 }}>
          <label>Session Timing*</label>
          <select name="sessionTiming" value={localForm.sessionTiming || ''} onChange={handleChange} required style={selectStyle}>
            <option value="">Select Timing</option>
            {sessionTimings.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects */}
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 24, marginBottom: 28, border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 18, color: '#222' }}>Subjects*</div>
        <div style={{ marginBottom: 0 }}>
          <label>Select Subject(s)* <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>(Required. Click to select multiple)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {subjectsList.map(subject => (
              <div 
                key={subject.value} 
                onClick={() => {
                  // Always ensure currentSubjects is an array
                  let currentSubjects = [];
                  if (localForm.subjects) {
                    currentSubjects = Array.isArray(localForm.subjects) 
                      ? [...localForm.subjects] 
                      : [localForm.subjects];
                  }
                  
                  // Create new array based on selection/deselection
                  const newSubjects = currentSubjects.includes(subject.value)
                    ? currentSubjects.filter(s => s !== subject.value)
                    : [...currentSubjects, subject.value];
                    
                  // Update state with new array
                  setLocalForm(prev => ({ ...prev, subjects: newSubjects }));
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: (() => {
                    // Properly check if this subject is selected
                    const subjectsArr = !localForm.subjects ? [] : 
                      (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]);
                    return subjectsArr.includes(subject.value) ? '#2563eb' : '#fff';
                  })(),
                  color: (() => {
                    // Properly check if this subject is selected
                    const subjectsArr = !localForm.subjects ? [] : 
                      (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]);
                    return subjectsArr.includes(subject.value) ? '#fff' : '#333';
                  })(),
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: (() => {
                    // Properly check if this subject is selected
                    const subjectsArr = !localForm.subjects ? [] : 
                      (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]);
                    return subjectsArr.includes(subject.value) ? '600' : '400';
                  })(),
                  transition: 'all 0.2s ease'
                }}
              >
                {subject.label}
              </div>
            ))}
          </div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
            Selected subjects: {
              (() => {
                // Process subjects to ensure it's an array
                const subjectsArr = !localForm.subjects ? [] :
                  (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]);
                  
                return subjectsArr.length > 0 ? subjectsArr.join(', ') : 'None';
              })()
            }
          </div>
          {errors.subjects && <div style={{ color: 'red', fontSize: 13, marginTop: 5 }}>{errors.subjects}</div>}
        </div>
      </div>

      {/* Hadiya */}
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 24, marginBottom: 28, border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 18, color: '#222' }}>Hadiya Information</div>
        <div style={{ marginBottom: 0 }}>
          <label>Assigned Hadiya Amount* (₹)</label>
          <input name="assignedHadiyaAmount" value={localForm.assignedHadiyaAmount || ''} onChange={handleChange} type="number" required style={inputStyle} />
          {errors.assignedHadiyaAmount && <div style={{ color: 'red', fontSize: 13 }}>{errors.assignedHadiyaAmount}</div>}
        </div>
      </div>

      {/* Bank Account Fields */}
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 24, marginBottom: 28, border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 18, color: '#222' }}>Identification & Bank Details</div>
        <div style={{ marginBottom: 16 }}>
          <label>Aadhar Number</label>
          <input 
            name="aadharNumber" 
            value={localForm.aadharNumber || ''} 
            onChange={handleChange} 
            placeholder="XXXX XXXX XXXX" 
            style={inputStyle} 
          />
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            12 digits only. Spaces will be added automatically after every 4 digits.
          </div>
          {errors.aadharNumber && <div style={{ color: 'red', fontSize: 13 }}>{errors.aadharNumber}</div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Bank Name</label>
          <input 
            name="bankName" 
            value={localForm.bankName || ''} 
            onChange={handleChange} 
            style={inputStyle} 
            placeholder="e.g., State Bank of India" 
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Bank Branch</label>
          <input 
            name="bankBranch" 
            value={localForm.bankBranch || ''} 
            onChange={handleChange} 
            style={inputStyle} 
            placeholder="e.g., Hyderabad Main Branch" 
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Account Number</label>
          <input 
            name="accountNumber" 
            value={localForm.accountNumber || ''} 
            onChange={handleChange} 
            style={inputStyle} 
            placeholder="11-18 digits" 
          />
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            Account number should be between 11-18 digits.
          </div>
          {errors.accountNumber && <div style={{ color: 'red', fontSize: 13 }}>{errors.accountNumber}</div>}
        </div>
        <div style={{ marginBottom: 0 }}>
          <label>IFSC Code</label>
          <input 
            name="ifscCode" 
            value={localForm.ifscCode || ''} 
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setLocalForm(prev => ({ ...prev, ifscCode: value }));
            }} 
            style={inputStyle} 
            placeholder="e.g., SBIN0123456" 
            maxLength={11}
          />
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            Format: XXXX0XXXXXX (e.g., SBIN0123456). First 4 letters are bank code.
          </div>
          {errors.ifscCode && <div style={{ color: 'red', fontSize: 13 }}>{errors.ifscCode}</div>}
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
        <button type="submit" disabled={isSubmitting} style={{ padding: '12px 48px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.10)' }}>
          {isSubmitting ? 'Submitting...' : 'Add Tutor'}
        </button>
      </div>
      
      {/* Success Popover */}
      <Popover
        isOpen={showSuccessPopover}
        onClose={() => {
          setShowSuccessPopover(false);
          setLocalForm({ ...initialState }); // Reset form on success
          // Redirect to admin dashboard with tab parameter to show tutor management
          navigate('/admin-dashboard', { state: { activeTab: 'tutors' } }); // Use state to indicate tutor tab
        }}
        title="Success!"
        message="Tutor has been added successfully. Default password: tutor123"
        type="success"
      />
      
      {/* Auto-redirect after success - matching the UpdateTutorForm behavior */}
      {showSuccessPopover && setTimeout(() => {
        setShowSuccessPopover(false);
        setLocalForm({ ...initialState }); // Reset form on success
        navigate('/admin-dashboard', { state: { activeTab: 'tutors' } }); // Use state to indicate tutor tab
      }, 1500)}
    </form>
  );
};

export default AddTutorForm;