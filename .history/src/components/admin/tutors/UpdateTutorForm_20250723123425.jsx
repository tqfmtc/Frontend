import React, { useState, useEffect } from 'react';
import Popover from '../../common/Popover';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '', // Optional for update - only set if changing
  qualifications: '',
  assignedCenter: '',
  subjects: [],
  sessionType: '',
  sessionTiming: '',
  assignedHadiyaAmount: '',
  aadharNumber: '',
  bankName: '',
  bankBranch: '',
  accountNumber: '',
  ifscCode: ''
};

const sessionTypes = [
  { value: 'arabic', label: 'Arabic' },
  { value: 'tuition', label: 'Tuition' },
];

const sessionTimings = [
  { value: 'after_fajr', label: 'After Fajr' },
  { value: 'after_zohar', label: 'After Zohar' },
  { value: 'after_asar', label: 'After Asar' },
  { value: 'after_maghrib', label: 'After Maghrib' },
  { value: 'after_isha', label: 'After Isha' },
];

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

const UpdateTutorForm = ({ onSubmit, formData, fieldErrors, isSubmitting, tutorId, onCancel }) => {
  const [localForm, setLocalForm] = useState({ ...initialState });
  const [errors, setErrors] = useState({});
  const [centers, setCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [originalCenterName, setOriginalCenterName] = useState('');
  
  // Popover states
  const [showCancelPopover, setShowCancelPopover] = useState(false);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);

  // Initialize form data from the existing tutor data
  useEffect(() => {
    if (formData) {
      // Ensure subjects is an array
      const processedData = { ...formData };
      if (processedData.subjects && !Array.isArray(processedData.subjects)) {
        processedData.subjects = [processedData.subjects];
      }
      
      // Handle assignedCenter - preserve both ID and name
      if (processedData.assignedCenter) {
        // If assignedCenter is an object with _id and name
        if (typeof processedData.assignedCenter === 'object' && processedData.assignedCenter._id) {
          // Save the center name for display
          setOriginalCenterName(processedData.assignedCenter.name || 'Current Center');
          // Extract just the ID for the form value
          processedData.assignedCenter = processedData.assignedCenter._id;
          console.log('Center extracted from object:', {
            id: processedData.assignedCenter,
            originalName: processedData.assignedCenter.name
          });
        } else {
          // It's already an ID string, try to find the name
          console.log('Center already an ID:', processedData.assignedCenter);
        }
      }
      
      // Initialize form with existing data
      setLocalForm(processedData);
      console.log('UpdateTutorForm initialized with data:', processedData);
    }
  }, [formData]);
  
  // Set errors if provided from parent component
  useEffect(() => {
    if (fieldErrors) {
      setErrors(fieldErrors);
    }
  }, [fieldErrors]);
  
  // Fetch centers data
  useEffect(() => {
    fetchCenters();
  }, []);

  // Fetch centers function
  const fetchCenters = async () => {
    setCentersLoading(true);
    try {
      // Get admin JWT
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token;
        } catch (e) {
          console.error('Error parsing userData from localStorage:', e);
          token = null;
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/centers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCenters(data);
      
      // Verify the tutor's center exists in the fetched centers
      if (localForm.assignedCenter) {
        const centerId = typeof localForm.assignedCenter === 'object' ? 
          localForm.assignedCenter._id : localForm.assignedCenter;
        
        console.log('Current assignedCenter:', centerId);
        console.log('Available centers:', data.map(c => ({ id: c._id, name: c.name })));
        
        const centerExists = data.some(center => center._id === centerId);
        if (!centerExists) {
          console.warn(`Selected center ID ${centerId} not found in centers list. Center may have been deleted or inaccessible.`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch centers:', err);
    } finally {
      setCentersLoading(false);
    }
  };

  // Handle regular input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for Aadhar number formatting
    if (name === 'aadharNumber') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '');
      // Limit to 12 digits
      const limitedDigits = digitsOnly.slice(0, 12);
      // Add spaces after every 4 digits
      const formatted = limitedDigits.replace(/(\d{4})(?=\d)/g, '$1 ');
      setLocalForm(prev => ({ ...prev, [name]: formatted }));
    } else {
      setLocalForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle subject click selection (for button-style subject selection)
  const handleSubjectClick = (subjectValue) => {
    // Ensure we're working with an array
    const currentSubjects = Array.isArray(localForm.subjects) 
      ? [...localForm.subjects] 
      : (localForm.subjects ? [localForm.subjects] : []);
    
    // Toggle the subject
    const newSubjects = currentSubjects.includes(subjectValue)
      ? currentSubjects.filter(s => s !== subjectValue)
      : [...currentSubjects, subjectValue];
    
    setLocalForm(prev => ({ ...prev, subjects: newSubjects }));
  };

  // Form validation
  const validate = () => {
    const errs = {};
    
    // Debug log
    console.log('Validating form data:', { 
      subjects: localForm.subjects,
      isArray: Array.isArray(localForm.subjects)
    });
    
    if (!localForm.phone || !/^[0-9]{10}$/.test(localForm.phone)) {
      errs.phone = 'Valid 10-digit phone number is required.';
    }
    
    // Only validate password if provided (for updates, password is optional)
    if (localForm.password && localForm.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    
    if (!localForm.assignedCenter) {
      errs.assignedCenter = 'Assigned Center is required.';
    }
    
    if (!localForm.assignedHadiyaAmount || isNaN(localForm.assignedHadiyaAmount) || Number(localForm.assignedHadiyaAmount) <= 0) {
      errs.assignedHadiyaAmount = 'Valid Hadiya amount is required.';
    }
    
    // Process subjects to ensure it's an array
    let subjectsArray;
    
    if (!localForm.subjects) {
      subjectsArray = [];
    } else if (Array.isArray(localForm.subjects)) {
      subjectsArray = [...localForm.subjects];
    } else {
      subjectsArray = [localForm.subjects];
      setLocalForm(prev => ({
        ...prev, 
        subjects: subjectsArray
      }));
    }
    
    // Check if at least one subject is selected
    if (subjectsArray.length === 0) {
      errs.subjects = 'At least one subject must be selected.';
    }
    
    // Validate account number if provided
    if (localForm.accountNumber && (localForm.accountNumber.length < 11 || localForm.accountNumber.length > 18)) {
      errs.accountNumber = 'Account number must be between 11-18 digits.';
    }
    
    // Validate IFSC code if provided
    if (localForm.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(localForm.ifscCode)) {
      errs.ifscCode = 'IFSC code must be in the format XXXX0XXXXXX (e.g., SBIN0123456).';
    }
    
    // Validate Aadhar number if provided - must match backend format: XXXX XXXX XXXX
    if (localForm.aadharNumber) {
      if (!/^[0-9]{4}\s[0-9]{4}\s[0-9]{4}$/.test(localForm.aadharNumber)) {
        errs.aadharNumber = 'Aadhar number must be in format: XXXX XXXX XXXX (12 digits with spaces).';
      }
    }
    
    return errs;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Debug logging - log ALL fields to ensure they're all being included
    console.log('SUBMIT - Form state:', { 
      hasSubjects: !!localForm.subjects,
      subjects: localForm.subjects,
      isArray: Array.isArray(localForm.subjects),
      type: typeof localForm.subjects,
      // Log all other fields to verify they're included
      name: localForm.name,
      email: localForm.email,
      phone: localForm.phone,
      qualifications: localForm.qualifications,
      assignedCenter: localForm.assignedCenter,
      sessionType: localForm.sessionType,
      sessionTiming: localForm.sessionTiming,
      assignedHadiyaAmount: localForm.assignedHadiyaAmount,
      aadharNumber: localForm.aadharNumber,
      // Banking details - most important for our current issue
      bankName: localForm.bankName,
      bankBranch: localForm.bankBranch, // <-- This is the field that's not updating
      accountNumber: localForm.accountNumber,
      ifscCode: localForm.ifscCode
    });
    
    const errs = validate();
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      console.log('Form has validation errors:', errs);
      return;
    }
    
    // Create a deep copy of the form data
    const formToSubmit = JSON.parse(JSON.stringify(localForm));
    
    // Ensure subjects is always an array
    if (!formToSubmit.subjects) {
      formToSubmit.subjects = [];
    } else if (!Array.isArray(formToSubmit.subjects)) {
      formToSubmit.subjects = [formToSubmit.subjects];
    }
    
    // Only include password if it was changed
    if (!formToSubmit.password) {
      delete formToSubmit.password;
    }
    
    // Structure data to match backend validation expectations
    // Move banking and document fields to proper nested structure
    if (formToSubmit.aadharNumber || formToSubmit.accountNumber || formToSubmit.ifscCode) {
      formToSubmit.documents = {};
      
      // Move aadharNumber to documents.aadharNumber
      if (formToSubmit.aadharNumber) {
        formToSubmit.documents.aadharNumber = formToSubmit.aadharNumber;
        delete formToSubmit.aadharNumber;
      }
      
      // Move banking fields to documents.bankAccount
      if (formToSubmit.accountNumber || formToSubmit.ifscCode) {
        formToSubmit.documents.bankAccount = {};
        
        if (formToSubmit.accountNumber) {
          formToSubmit.documents.bankAccount.accountNumber = formToSubmit.accountNumber;
          delete formToSubmit.accountNumber;
        }
        
        if (formToSubmit.ifscCode) {
          formToSubmit.documents.bankAccount.ifscCode = formToSubmit.ifscCode;
          delete formToSubmit.ifscCode;
        }
      }
    }
    
    // Keep bankName and bankBranch as flat fields since backend expects them that way
    
    // Submit the form with processed data
    try {
      await onSubmit(formToSubmit);
      setShowSuccessPopover(true);
    } catch (error) {
      console.error('Error updating tutor:', error);
      // Handle error if needed
    }
  };
  
  // Handle cancel button click - show confirmation first
  const handleCancel = () => {
    setShowCancelPopover(true);
  };
  
  // Handle confirmed cancellation - close form after confirmation
  const handleCancelConfirmed = () => {
    // Use the onCancel prop if provided, otherwise fall back to browser history
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>Update Tutor</h2>

      {/* Personal Information */}
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
          <label>Phone Number*</label>
          <input 
            name="phone" 
            value={localForm.phone || ''} 
            onChange={handleChange} 
            type="tel" 
            pattern="[0-9]{10}" 
            placeholder="10-digit number" 
            required 
            style={inputStyle} 
          />
          {errors.phone && <div style={{ color: 'red', fontSize: 13 }}>{errors.phone}</div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Login Password <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>(Leave blank to keep current)</span></label>
          <input 
            name="password" 
            value={localForm.password || ''} 
            onChange={handleChange} 
            type="text" 
            style={inputStyle} 
            placeholder="Enter new password or leave blank" 
          />
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            <strong>Note:</strong> Only enter a password if you want to change it. Must be at least 6 characters.
          </div>
          {errors.password && <div style={{ color: 'red', fontSize: 13 }}>{errors.password}</div>}
        </div>
        <div style={{ marginBottom: 0 }}>
          <label>Qualifications</label>
          <input 
            name="qualifications" 
            value={localForm.qualifications || ''} 
            onChange={handleChange} 
            style={inputStyle} 
            placeholder="e.g., M.Sc., B.Ed., etc." 
          />
        </div>
      </div>

      {/* Center & Session Info */}
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 24, marginBottom: 28, border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 18, color: '#222' }}>Center & Session</div>
        <div style={{ marginBottom: 16 }}>
          <label>Assigned Center*</label>
          <select 
            name="assignedCenter" 
            value={localForm.assignedCenter || ''} 
            onChange={handleChange} 
            required 
            style={selectStyle} 
            disabled={centersLoading}
          >
            <option value="">Select Center</option>
            {centers.map(center => (
              <option key={center._id} value={center._id}>
                {center.name}
              </option>
            ))}
          </select>
          {errors.assignedCenter && <div style={{ color: 'red', fontSize: 13 }}>{errors.assignedCenter}</div>}
        </div>
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
                onClick={() => handleSubjectClick(subject.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]).includes(subject.value) ? '#2563eb' : '#fff',
                  color: (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]).includes(subject.value) ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]).includes(subject.value) ? '600' : '400',
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
          <input 
            name="assignedHadiyaAmount" 
            value={localForm.assignedHadiyaAmount || ''} 
            onChange={handleChange} 
            type="number" 
            required 
            style={inputStyle} 
          />
          {errors.assignedHadiyaAmount && <div style={{ color: 'red', fontSize: 13 }}>{errors.assignedHadiyaAmount}</div>}
        </div>
      </div>

      {/* Bank & Identification Details */}
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

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
        <button 
          type="button" 
          onClick={handleCancel} 
          style={{ padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          style={{ padding: '12px 48px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.10)' }}
        >
          {isSubmitting ? 'Updating...' : 'Update Tutor'}
        </button>
      </div>
      
      {/* Cancel Confirmation Popover */}
      <Popover
        isOpen={showCancelPopover}
        onClose={() => setShowCancelPopover(false)}
        title="Cancel Editing?"
        message="Are you sure you want to discard your changes?"
        type="confirm"
        onConfirm={handleCancelConfirmed}
        confirmText="Yes, Discard"
        cancelText="No, Continue Editing"
      />
      
      {/* Success Popover - auto-close after 1.5 seconds */}
      <Popover
        isOpen={showSuccessPopover}
        onClose={() => {
          setShowSuccessPopover(false);
          // Use onCancel to close the form, not history.back()
          if (onCancel) {
            onCancel();
          } else {
            window.history.back(); // Fallback if onCancel not provided
          }
        }}
        title="Success!"
        message="Tutor information has been updated successfully."
        type="success"
      />
      
      {/* Auto-redirect after success */}
      {showSuccessPopover && setTimeout(() => {
        setShowSuccessPopover(false);
        // Use onCancel to close the form correctly
        if (onCancel) {
          onCancel();
        } else {
          window.history.back(); // Fallback
        }
      }, 1500)}
    </form>
  );
};

export default UpdateTutorForm;