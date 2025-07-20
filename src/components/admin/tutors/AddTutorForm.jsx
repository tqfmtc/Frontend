import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Popover from '../../common/Popover';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: '',
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
  const [centerQuery, setCenterQuery] = useState('');
  const [showCenterDropdown, setShowCenterDropdown] = useState(false);
  const [centersError, setCentersError] = useState(null);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

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
    let newValue = value;

    if (name === 'address') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, address: 'Some characters were removed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.' }));
      }
    } else if (name === 'qualifications') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, qualifications: 'Some characters were removed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.' }));
      }
    } else if (name === 'name') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z'\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, name: 'Only letters, spaces, and apostrophes are allowed' }));
      }
    } else if (name === 'bankName') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, bankName: 'Only letters and spaces are allowed' }));
      }
    } else if (name === 'bankBranch') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, bankBranch: 'Only letters and spaces are allowed' }));
      }
    }

    setLocalForm(prev => ({ ...prev, [name]: newValue }));

    let errors = { ...validationErrors };
    delete errors[name];

    // Clear error when user starts typing again
    if (errors[name]) {
      delete errors[name];
      setValidationErrors(errors);
    }

    // Email validation
    if (name === 'email') {
      if (!isValidEmail(value)) {
        errors[name] = 'Invalid email address';
      }
    }
    // Password strength validation
    else if (name === 'password') {
      const password = value;
      setPasswordStrength({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      });

      if (value.length > 10) {
        errors[name] = 'Password must be 10 characters or less';
      } else if (value.length > 0 && value.length < 8) {
        errors[name] = 'Password must be at least 8 characters';
      }
    }
    else if (name === 'name' && value.length > 60) {
      errors[name] = 'Name must be 60 characters or less';
    }
    else if (name === 'address') {
      if (newValue.length > 60) {
        errors[name] = 'Address must be 60 characters or less';
      }
    }
    else if (name === 'assignedHadiyaAmount') {
      // Convert to string to handle digit limit
      const stringValue = String(value);
      let numericValue = stringValue.replace(/[^0-9]/g, '');
      
      // Limit to 6 digits
      if (numericValue.length > 6) {
        numericValue = numericValue.substring(0, 6);
        errors[name] = 'Hadiya cannot exceed 6 digits';
      }
      
      const num = numericValue ? parseInt(numericValue, 10) : '';
      
      if (num > 100000) {
        errors[name] = 'Hadiya cannot exceed ₹100,000';
      }
      
      setLocalForm(prev => ({ ...prev, [name]: num }));
      setValidationErrors(errors);
      return;
    }
    else if (name === 'bankName' && value.length > 30) {
      errors[name] = 'Bank name must be 30 characters or less';
    }
    else if (name === 'bankBranch' && value.length > 30) {
      errors[name] = 'Bank branch must be 30 characters or less';
    }
    else if (name === 'accountNumber') {
      const originalValue = value;
      const digitsOnly = originalValue.replace(/\D/g, '');
      if (digitsOnly.length <= 18) {
        setLocalForm(prev => ({ ...prev, [name]: digitsOnly }));
      }
      // Set error if non-digit characters were removed
      if (digitsOnly !== originalValue) {
        setValidationErrors(prev => ({ ...prev, accountNumber: 'Only digits are allowed' }));
      } else {
        // Clear error if no non-digit characters were present
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.accountNumber;
          return newErrors;
        });
      }
      return;
    }
    else if (name === 'ifscCode') {
      // Convert to uppercase and remove any spaces
      let cleanedValue = value.toUpperCase().replace(/\s/g, '');
      
      // If we have exactly 4 non-zero characters, automatically add a zero
      if (cleanedValue.length === 4 && cleanedValue !== '') {
        cleanedValue = cleanedValue + '0';
      }
      
      // Limit to 11 characters (4 letters + 1 zero + 6 alphanumeric)
      if (cleanedValue.length <= 11) {
        setLocalForm(prev => ({ ...prev, [name]: cleanedValue }));
      }
      
      return;
    }
    
    setValidationErrors(errors);
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
    
    // Special handling for account number - only allow digits and limit to 18
    if (name === 'accountNumber') {
      const originalValue = value;
      const digitsOnly = originalValue.replace(/\D/g, '');
      if (digitsOnly.length <= 18) {
        setLocalForm(prev => ({ ...prev, [name]: digitsOnly }));
      }
      // Set error if non-digit characters were removed
      if (digitsOnly !== originalValue) {
        setValidationErrors(prev => ({ ...prev, accountNumber: 'Only digits are allowed' }));
      } else {
        // Clear error if no non-digit characters were present
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.accountNumber;
          return newErrors;
        });
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
    
    // Check password strength if password is provided and not empty
    if (localForm.password && localForm.password.trim() !== '') {
      const isPasswordStrong = (
        passwordStrength.length &&
        passwordStrength.uppercase &&
        passwordStrength.lowercase &&
        passwordStrength.number &&
        passwordStrength.specialChar
      );
      
      if (!isPasswordStrong) {
        // Show error and prevent submission
        setValidationErrors(prev => ({
          ...prev,
          password: 'Password does not meet strength requirements'
        }));
        return;
      }
    }
    
    // Adding extensive debug logs to trace the subjects field
    console.log('SUBMIT - Initial form state:', { 
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
      
      // Update the form with the array version
      setLocalForm(prev => {
        const updated = { ...prev, subjects: formToSubmit.subjects };
        console.log('Updated form with array subjects:', updated.subjects);
        return updated;
      });
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
      setIsFormSubmitting(true);
      await onSubmit(formToSubmit);
      setShowSuccessPopover(true);
      
      // Reset password strength indicators
      setPasswordStrength({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
      });
    } catch (error) {
      console.error('Error adding tutor:', error);
      // Handle error if needed
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const filteredCenters = centers.filter(center => {
    const lowerQuery = centerQuery.toLowerCase();
    return (
      center.name.toLowerCase().includes(lowerQuery) ||
      (center.area && center.area.toLowerCase().includes(lowerQuery))
    );
  });

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-xl shadow-lg border border-blue-100">
      <h2 className="text-2xl font-bold text-white mb-4 pb-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg p-4 -mx-4 -mt-4">
        Add New Tutor
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          
          {/* Left Column */}
          <div className="space-y-3">
            
            {/* Personal Information */}
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
                  onKeyPress={(e) => {
                    const key = e.key;
                    if (!/^[a-zA-Z'\s]$/.test(key)) {
                      e.preventDefault();
                      setValidationErrors(prev => ({ ...prev, name: `Character '${key}' is not allowed. Only letters, spaces, and apostrophes are allowed.` }));
                    }
                  }}
                  name="name"
                  className={`w-full px-4 py-2 border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
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
                  Address <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={localForm.address || ''}
                  onChange={(e) => handleChange(e)}
                  onKeyPress={(e) => {
                    const key = e.key;
                    if (!/^[a-zA-Z0-9\s,.-]$/.test(key)) {
                      e.preventDefault();
                      setValidationErrors(prev => ({ ...prev, address: `Character '${key}' is not allowed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.` }));
                    }
                  }}
                  name="address"
                  className={`mt-1 block w-full px-3 py-2 border ${validationErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  rows="3"
                  required
                  maxLength={60}
                />
                {validationErrors.address && <div className="text-red-500 text-sm mt-1">{validationErrors.address}</div>}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Login Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={localForm.password || ''}
                    onChange={handleChange}
                    name="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <div className="text-red-500 text-sm mt-1">{validationErrors.password}</div>
                )}
                <div className="text-gray-500 text-sm mt-1">
                  <p>{localForm.password ? localForm.password.length : 0}/10 characters</p>
                </div>
                {/* Password strength indicator */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Password must contain:</p>
                  <ul className="text-sm text-gray-600">
                    <li className={passwordStrength.length ? 'text-green-500' : 'text-gray-500'}>
                      {passwordStrength.length ? '✓' : '✗'} At least 8 characters
                    </li>
                    <li className={passwordStrength.uppercase ? 'text-green-500' : 'text-gray-500'}>
                      {passwordStrength.uppercase ? '✓' : '✗'} At least one uppercase letter
                    </li>
                    <li className={passwordStrength.lowercase ? 'text-green-500' : 'text-gray-500'}>
                      {passwordStrength.lowercase ? '✓' : '✗'} At least one lowercase letter
                    </li>
                    <li className={passwordStrength.number ? 'text-green-500' : 'text-gray-500'}>
                      {passwordStrength.number ? '✓' : '✗'} At least one number
                    </li>
                    <li className={passwordStrength.specialChar ? 'text-green-500' : 'text-gray-500'}>
                      {passwordStrength.specialChar ? '✓' : '✗'} At least one special character
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualifications
                </label>
                <input
                  type="text"
                  value={localForm.qualifications || ''}
                  onChange={handleChange}
                  onKeyPress={(e) => {
                    const key = e.key;
                    if (!/^[a-zA-Z0-9\s,.-]$/.test(key)) {
                      e.preventDefault();
                      setValidationErrors(prev => ({ ...prev, qualifications: `Character '${key}' is not allowed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.` }));
                    }
                  }}
                  name="qualifications"
                  className={`w-full px-4 py-2 border ${validationErrors.qualifications ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                />
                {validationErrors.qualifications && (
                  <div className="text-red-500 text-sm mt-1">{validationErrors.qualifications}</div>
                )}
              </div>
            </div>
            
          </div>
          
          {/* Right Column */}
          <div className="space-y-3">
            
            {/* Center Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Center Information</h3>
              
              <div className="mb-3">
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
                <div className="relative">
                  <input
                    type="text"
                    value={centerQuery}
                    onChange={(e) => setCenterQuery(e.target.value)}
                    onFocus={() => setShowCenterDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCenterDropdown(false), 200)}
                    placeholder="Search for a center"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  {showCenterDropdown && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
                      {filteredCenters.map(center => (
                        <div 
                          key={center._id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => { // use onMouseDown to prevent onBlur from closing immediately
                            setLocalForm(prev => ({ ...prev, assignedCenter: center._id }));
                            setCenterQuery(center.name);
                            setShowCenterDropdown(false);
                          }}
                        >
                          {center.name}, {center.area}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.assignedCenter && (
                  <div className="text-red-500 text-sm mt-1">{errors.assignedCenter}</div>
                )}
              </div>
            </div>
            
            {/* Session Information */}
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
            
            {/* Subjects */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Subjects</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Subject(s) <span className="text-red-600">*</span> <span className="text-gray-500">(Required. Click to select multiple)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {subjectsList.map(subject => (
                    <label 
                      key={subject.value} 
                      className={`px-3 py-1 text-sm rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localForm.subjects && (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]).includes(subject.value) ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 text-gray-700'}`}
                      tabIndex="0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.currentTarget.querySelector('input[type="checkbox"]').click();
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        tabIndex="-1"
                        checked={localForm.subjects && (Array.isArray(localForm.subjects) ? localForm.subjects : [localForm.subjects]).includes(subject.value)}
                        onChange={() => {
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
                      />
                      {subject.label}
                    </label>
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
            
            {/* Hadiya Information */}
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
                  max={100000}
                  className={`w-full px-4 py-2 border ${validationErrors.assignedHadiyaAmount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                  required
                />
                {validationErrors.assignedHadiyaAmount && (
                  <div className="text-red-500 text-sm mt-1">{validationErrors.assignedHadiyaAmount}</div>
                )}
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Bank Details */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Bank Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                onKeyPress={(e) => {
                  const key = e.key;
                  if (!/^[a-zA-Z'\s]$/.test(key)) {
                    e.preventDefault();
                    setValidationErrors(prev => ({ ...prev, bankName: `Character '${key}' is not allowed. Only letters and spaces are allowed.` }));
                  }
                }}
                name="bankName"
                maxLength={30}
                className={`w-full px-4 py-2 border ${validationErrors.bankName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                placeholder="e.g., State Bank of India"
              />
              {validationErrors.bankName && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.bankName}</div>
              )}
              <div className="text-gray-500 text-sm mt-1">
                {localForm.bankName ? localForm.bankName.length : 0}/30 characters
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Branch
              </label>
              <input 
                type="text"
                value={localForm.bankBranch || ''}
                onChange={handleChange}
                onKeyPress={(e) => {
                  const key = e.key;
                  if (!/^[a-zA-Z'\s]$/.test(key)) {
                    e.preventDefault();
                    setValidationErrors(prev => ({ ...prev, bankBranch: `Character '${key}' is not allowed. Only letters and spaces are allowed.` }));
                  }
                }}
                name="bankBranch"
                maxLength={30}
                className={`w-full px-4 py-2 border ${validationErrors.bankBranch ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                placeholder="e.g., Main Branch"
              />
              {validationErrors.bankBranch && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.bankBranch}</div>
              )}
              <div className="text-gray-500 text-sm mt-1">
                {localForm.bankBranch ? localForm.bankBranch.length : 0}/30 characters
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
              {validationErrors.accountNumber && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.accountNumber}</div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        
        {/* Form error summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg">
            <p className="font-medium">Please fix the following errors:</p>
            <ul className="list-disc pl-5 mt-2">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
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
            disabled={isSubmitting || isFormSubmitting}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm shadow hover:shadow-md"
          >
            {isSubmitting || isFormSubmitting ? 'Submitting...' : 'Add Tutor'}
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
        message="Tutor has been added successfully"
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
