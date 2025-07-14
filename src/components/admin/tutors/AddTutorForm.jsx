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

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    const [localPart, domain] = email.split('@');
    const domainParts = domain.split('.');
    
    return (
      localPart.length >= 1 && localPart.length <= 64 &&
      domain.length >= 3 && domain.length <= 255 &&
      domainParts[domainParts.length - 1].length >= 2 && 
      domainParts[domainParts.length - 1].length <= 6
    );
  };

  // Real-time validation state
  const [validationErrors, setValidationErrors] = useState({});

  // Handle input changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    const errors = { ...validationErrors };
    
    // Clear previous error
    delete errors[name];
    
    // Perform validation
    if (name === 'name' && value.length > 60) {
      errors[name] = 'Name must be 60 characters or less';
    }
    else if (name === 'email' && value) {
      // Split email into parts as user types
      const parts = value.split('@');
      let newValue = value;
      let errorMessage = '';
      
      if (parts.length > 0 && parts[0].length > 30) {
        // Truncate the local part to 30 characters
        parts[0] = parts[0].substring(0, 30);
        newValue = parts.join('@');
        errorMessage = 'Email prefix must be 30 characters or less';
      }
      
      if (parts.length > 1) {
        const domainParts = parts[1].split('.');
        
        if (domainParts.length > 0 && domainParts[0].length > 10) {
          // Truncate the domain to 10 characters
          domainParts[0] = domainParts[0].substring(0, 10);
          parts[1] = domainParts.join('.');
          newValue = parts.join('@');
          errorMessage = 'Domain name must be 10 characters or less';
        }
        
        if (domainParts.length > 1 && domainParts[1].length > 10) {
          // Truncate the TLD to 10 characters
          domainParts[1] = domainParts[1].substring(0, 10);
          parts[1] = domainParts.join('.');
          newValue = parts.join('@');
          errorMessage = 'Domain extension must be 10 characters or less';
        }
      }
      
      // If we truncated, set the truncated value and show error
      if (newValue !== value) {
        setLocalForm(prev => ({ ...prev, [name]: newValue }));
        setValidationErrors(prev => ({ ...prev, [name]: errorMessage }));
        return; // Exit early to avoid the default setLocalForm
      }
    }
    else if (name === 'password' && value.length > 10) {
      errors[name] = 'Password must be 10 characters or less';
    }
    else if (name === 'assignedHadiyaAmount' && value > 10000) {
      errors[name] = 'Hadiya cannot exceed ₹10,000';
    }
    else if (name === 'bankName' && value.length > 100) {
      errors[name] = 'Bank name must be 100 characters or less';
    }
    else if (name === 'bankBranch' && value.length > 50) {
      errors[name] = 'Bank branch must be 50 characters or less';
    }
    
    setValidationErrors(errors);
    setLocalForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle input changes
  const handleInputChange = (e) => {
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
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-xl shadow-lg border border-blue-100">
      <h2 className="text-2xl font-bold text-white mb-4 pb-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg p-4 -mx-4 -mt-4">
        Add New Tutor
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Personal Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Personal Information</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={localForm.name || ''}
                onChange={handleChange}
                name="name"
                maxLength={60}
                className={`w-full px-4 py-2 border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                required
              />
              {validationErrors.name && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.name}</div>
              )}
              <div className="text-gray-500 text-sm mt-1">
                {localForm.name ? localForm.name.length : 0}/60 characters
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                value={localForm.email || ''}
                onChange={handleChange}
                name="email"
                className={`w-full px-4 py-2 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                required
              />
              {validationErrors.email && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.email}</div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-600">*</span> <span className="text-gray-500">(This will be the tutor's login username)</span>
              </label>
              <input 
                type="tel"
                value={localForm.phone || ''}
                onChange={handleInputChange}
                name="phone"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="1234567890"
                required
              />
              <div className="text-gray-500 text-sm mt-1">
                Enter exactly 10 digits. Currently: {localForm.phone ? localForm.phone.length : 0}/10
              </div>
              {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Login Password <span className="text-red-600">*</span>
              </label>
              <input 
                type="text"
                value={localForm.password || ''}
                onChange={handleChange}
                name="password"
                maxLength={10}
                className={`w-full px-4 py-2 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                required
              />
              {validationErrors.password && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.password}</div>
              )}
              <div className="text-gray-500 text-sm mt-1">
                <p><strong>Note:</strong> Use <code>tutor123</code> as the default password for all tutors.</p>
                <p>{localForm.password ? localForm.password.length : 0}/10 characters</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualifications
              </label>
              <input
                type="text"
                value={localForm.qualifications || ''}
                onChange={handleInputChange}
                name="qualifications"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
          
          {/* Account Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Account Information</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Center <span className="text-red-600">*</span> <span className="text-gray-500">(Select the center to assign this tutor.)</span>
              </label>
              {centersError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{centersError}</span>
                  <div className="mt-2">
                    <button type="button" onClick={handleRetryCenters} className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded">Retry</button>
                  </div>
                </div>
              ) : null}
              <select
                value={localForm.assignedCenter || ''}
                onChange={handleInputChange}
                name="assignedCenter"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
                disabled={!!centersError}
              >
                <option value="">Select Center</option>
                {Array.isArray(centers) && centers.length === 0 && !centersError && (
                  <option value="">No centers available</option>
                )}
                {(Array.isArray(centers) ? centers : []).map(center => (
                  <option key={center && center._id ? center._id : ''} value={center && center._id ? center._id : ''}>{center && center.name ? center.name : ''}</option>
                ))}
              </select>
              {errors.assignedCenter && <div className="text-red-500 text-sm mt-1">{errors.assignedCenter}</div>}
            </div>
          </div>
          
          {/* Center & Subjects */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Center & Subjects</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {/* Center selection */}
              </div>
              <div>
                {/* Subjects selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Subject(s) <span className="text-gray-500">(Required. Click to select multiple)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
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
                        className={`px-4 py-2 rounded-lg cursor-pointer ${localForm.subjects && (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]).includes(subject.value) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {subject.label}
                      </div>
                    ))}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    Selected subjects: {
                      (() => {
                        // Process subjects to ensure it's an array
                        const subjectsArr = !localForm.subjects ? [] :
                          (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]);
                          
                        return subjectsArr.length > 0 ? subjectsArr.join(', ') : 'None';
                      })()
                    }
                  </div>
                  {errors.subjects && <div className="text-red-500 text-sm mt-1">{errors.subjects}</div>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Session Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Session Information</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Type <span className="text-red-600">*</span>
              </label>
              <select
                value={localForm.sessionType || ''}
                onChange={handleInputChange}
                name="sessionType"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">Select Session Type</option>
                {sessionTypes.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Timing <span className="text-red-600">*</span>
              </label>
              <select
                value={localForm.sessionTiming || ''}
                onChange={handleInputChange}
                name="sessionTiming"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">Select Timing</option>
                {sessionTimings.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Hadiya */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Hadiya Information</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Hadiya Amount <span className="text-red-600">*</span> (₹)
              </label>
              <input
                type="number"
                value={localForm.assignedHadiyaAmount || ''}
                onChange={handleChange}
                name="assignedHadiyaAmount"
                max={10000}
                className={`w-full px-4 py-2 border ${validationErrors.assignedHadiyaAmount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                required
              />
              {validationErrors.assignedHadiyaAmount && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.assignedHadiyaAmount}</div>
              )}
            </div>
          </div>
          
          {/* Bank Details */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Bank Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhar Number
                </label>
                <input 
                  type="text"
                  value={localForm.aadharNumber || ''}
                  onChange={handleInputChange}
                  name="aadharNumber"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="XXXX XXXX XXXX"
                />
                <div className="text-gray-500 text-sm mt-1">
                  12 digits only. Spaces will be added automatically after every 4 digits.
                </div>
                {errors.aadharNumber && <div className="text-red-500 text-sm mt-1">{errors.aadharNumber}</div>}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input 
                  type="text"
                  value={localForm.bankName || ''}
                  onChange={handleChange}
                  name="bankName"
                  maxLength={100}
                  className={`w-full px-4 py-2 border ${validationErrors.bankName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                  placeholder="e.g., State Bank of India"
                />
                {validationErrors.bankName && (
                  <div className="text-red-500 text-sm mt-1">{validationErrors.bankName}</div>
                )}
                <div className="text-gray-500 text-sm mt-1">
                  {localForm.bankName ? localForm.bankName.length : 0}/100 characters
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Branch
                </label>
                <input 
                  type="text"
                  value={localForm.bankBranch || ''}
                  onChange={handleChange}
                  name="bankBranch"
                  maxLength={50}
                  className={`w-full px-4 py-2 border ${validationErrors.bankBranch ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                  placeholder="e.g., Hyderabad Main Branch"
                />
                {validationErrors.bankBranch && (
                  <div className="text-red-500 text-sm mt-1">{validationErrors.bankBranch}</div>
                )}
                <div className="text-gray-500 text-sm mt-1">
                  {localForm.bankBranch ? localForm.bankBranch.length : 0}/50 characters
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input 
                  type="text"
                  value={localForm.accountNumber || ''}
                  onChange={handleInputChange}
                  name="accountNumber"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="11-18 digits"
                />
                <div className="text-gray-500 text-sm mt-1">
                  Account number should be between 11-18 digits.
                </div>
                {errors.accountNumber && <div className="text-red-500 text-sm mt-1">{errors.accountNumber}</div>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input 
                  type="text"
                  value={localForm.ifscCode || ''}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setLocalForm(prev => ({ ...prev, ifscCode: value }));
                  }}
                  name="ifscCode"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., SBIN0123456"
                  maxLength={11}
                />
                <div className="text-gray-500 text-sm mt-1">
                  Format: XXXX0XXXXXX (e.g., SBIN0123456). First 4 letters are bank code.
                </div>
                {errors.ifscCode && <div className="text-red-500 text-sm mt-1">{errors.ifscCode}</div>}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={() => navigate('/admin-dashboard', { state: { activeTab: 'tutors' } })}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm shadow"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm shadow hover:shadow-md"
          >
            {isSubmitting ? 'Submitting...' : 'Add Tutor'}
          </button>
        </div>
      </form>
      
      {/* Success Popover */}
      <Popover
        isOpen={showSuccessPopover}
        onClose={() => {
          setShowSuccessPopover(false);
          setLocalForm({ ...initialState }); // Reset form on success
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
    </div>
  );
};

export default AddTutorForm;
