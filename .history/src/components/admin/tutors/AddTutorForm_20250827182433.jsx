import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Popover from '../../common/Popover';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: '',
  assignedCenter: '',
  subjects: [], // Always initialize as an array
  sessionType: '',
  sessionTiming: '',
  // Educational Details
  qualificationType: '', // For tuition: graduation, intermediate, ssc, others; For arabic: alim, hafiz, others
  qualificationOther: '', // Text field for 'others' option
  qualificationStatus: '', // pursuing, completed
  yearOfCompletion: '',
  madarsahName: '', // For Arabic session type
  collegeName: '', // For Tuition session type
  specialization: '', // For graduation/intermediate
  assignedHadiyaAmount: '',
  bankName: '',
  accountNumber: '',
  bankBranch: '',
  ifscCode: '',
  aadharNumber: '',
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

// Qualification options based on session type
const tuitionQualifications = [
  { value: 'graduation', label: 'Graduation' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'ssc', label: 'SSC' },
  { value: 'others', label: 'Others' },
];

const arabicQualifications = [
  { value: 'alim', label: 'Alim' },
  { value: 'hafiz', label: 'Hafiz' },
  { value: 'others', label: 'Others' },
];

const qualificationStatuses = [
  { value: 'pursuing', label: 'Pursuing' },
  { value: 'completed', label: 'Completed' },
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
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorPopover, setShowErrorPopover] = useState(false);
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
  const [localForm, setLocalForm] = useState(initialState);
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  // Handle input changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'address') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.\-\\/|]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, address: 'Some characters were removed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.' }));
      }
    } else if (name === 'qualificationOther') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Some characters were removed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.' }));
      }
      if (newValue.length > 50) {
        newValue = newValue.substring(0, 50);
        setValidationErrors(prev => ({ ...prev, [name]: 'Qualification details cannot exceed 50 characters' }));
      }
    } else if (name === 'madarsahName') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Some characters were removed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.' }));
      }
      if (newValue.length > 50) {
        newValue = newValue.substring(0, 50);
        setValidationErrors(prev => ({ ...prev, [name]: 'Madarsah name cannot exceed 50 characters' }));
      }
    } else if (name === 'name') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z'\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, name: 'Only letters, spaces, and apostrophes are allowed' }));
      }
      if (newValue.length > 50) {
        newValue = newValue.substring(0, 50);
        setValidationErrors(prev => ({ ...prev, name: 'Name cannot exceed 50 characters' }));
      }
    } else if (name === 'bankName') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, bankName: 'Only letters and spaces are allowed' }));
      }
    } else if (name === 'bankBranch') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, bankBranch: 'Only letters, numbers, and spaces are allowed' }));
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

    else if (name === 'address') {
      if (newValue.length > 200) {
        newValue = newValue.substring(0, 200);
        errors[name] = 'Address cannot exceed 200 characters';
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
    else if (name === 'bankName') {
      if (newValue.length > 30) {
        newValue = newValue.substring(0, 30);
        errors[name] = 'Bank name cannot exceed 30 characters';
      }
    }
    else if (name === 'bankBranch') {
      if (newValue.length > 30) {
        newValue = newValue.substring(0, 30);
        errors[name] = 'Bank branch cannot exceed 30 characters';
      }
    }
    else if (name === 'accountNumber') {
      const originalValue = value;
      const digitsOnly = originalValue.replace(/\D/g, '');
      
      if (digitsOnly.length <= 20) {
        setLocalForm(prev => ({ ...prev, [name]: digitsOnly }));
        
        // Validate length
        if (digitsOnly.length > 0 && digitsOnly.length < 5) {
          setValidationErrors(prev => ({ ...prev, accountNumber: 'Account number must be at least 5 digits' }));
        } else if (digitsOnly.length > 20) {
          setValidationErrors(prev => ({ ...prev, accountNumber: 'Account number cannot exceed 20 digits' }));
        } else {
          // Clear error if length is valid
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.accountNumber;
            return newErrors;
          });
        }
      }
      
      // Set error if non-digit characters were removed
      if (digitsOnly !== originalValue) {
        setValidationErrors(prev => ({ ...prev, accountNumber: 'Only digits are allowed' }));
      }
      return;
    }
    else if (name === 'yearOfCompletion') {
      // Only allow digits and limit to 4 characters (year format)
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 4) {
        setLocalForm(prev => ({ ...prev, [name]: digitsOnly }));
      }
      
      // Validate year range
      const year = parseInt(digitsOnly);
      const currentYear = new Date().getFullYear();
      if (digitsOnly.length === 4 && (year < 1950 || year > currentYear + 10)) {
        errors[name] = `Year must be between 1950 and ${currentYear + 10}`;
      }
      
      setValidationErrors(errors);
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
    if (!localForm.password || localForm.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (!localForm.assignedCenter) {
      errs.assignedCenter = 'Assigned Center is required.';
    }
    if (!localForm.assignedHadiyaAmount || isNaN(localForm.assignedHadiyaAmount) || Number(localForm.assignedHadiyaAmount) <= 0) {
      errs.assignedHadiyaAmount = 'Valid Hadiya amount is required.';
    }

    // Specialization validation for graduation/intermediate
    if (localForm.sessionType === 'tuition' && (localForm.qualificationType === 'graduation' || localForm.qualificationType === 'intermediate')) {
      if (!localForm.specialization || localForm.specialization.trim() === '') {
        errs.specialization = 'Specialization is required for graduation or intermediate.';
      } else if (localForm.specialization.length > 50) {
        errs.specialization = 'Specialization cannot exceed 50 characters.';
      }
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
    setIsFormSubmitting(true);
  
    // Validate form
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsFormSubmitting(false);
      return;
    }
  
    // Convert subjects array to string
    const subjectsString = localForm.subjects.join(',');
  
    // Prepare form data with proper types
    const formData = {
      ...localForm,
      subjects: subjectsString,
      assignedHadiyaAmount: Number(localForm.assignedHadiyaAmount),
      yearOfCompletion: Number(localForm.yearOfCompletion)
    };

    // Remove optional fields that are empty to satisfy backend validation
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (typeof val === 'string' && val.trim() === '') {
        delete formData[key];
      }
    });
  
    try {
      // Call API to add tutor
      await onSubmit(formData);
    
      // Reset form on success
      setLocalForm(initialState);
      setValidationErrors({});
      setSuccessMessage('Tutor added successfully!');  // store success text
      setShowSuccessPopover(true);
    
      // Hide popup after 5 seconds
      setTimeout(() => setShowSuccessPopover(false), 5000);
    } catch (error) {
      // Set the error in validation state
      setValidationErrors({ general: error.message || 'Failed to add tutor' });
      setShowErrorPopover(true);
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
    <div className="w-full max-w-full mx-auto p-2 bg-white rounded shadow-md border border-blue-100 overflow-x-auto">
      <h2 className="text-xl font-bold text-white mb-3 pb-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg p-3 -mx-3 -mt-3">
        Add New Tutor
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Grid Layout - 2 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start max-w-7xl mx-auto">

          {/* Left Column - Personal & Session Info */}
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[320px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div>
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
                  maxLength={50}
                  className={`w-full px-3 py-1.5 border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm`}
                />
                {validationErrors.name && (
                  <div className="text-red-500 text-sm mt-1">{validationErrors.name}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {(localForm.name || '').length}/50 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={localForm.email || ''}
                  onChange={handleChange}
                  name="email"
                  maxLength={50}
                  className={`w-full px-3 py-1.5 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                  placeholder="Enter email"
                  required
                />
                {validationErrors.email && (
                  <div className="text-red-500 text-sm mt-1">{validationErrors.email}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {(localForm.email || '').length}/50 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-600">*</span> <span className="text-gray-500">(Login username)</span>
                </label>
                <input
                  type="tel"
                  value={localForm.phone || ''}
                  onChange={handleInputChange}
                  name="phone"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="1234567890"
                  required
                />
                <div className="text-gray-500 text-sm mt-1">
                  Enter exactly 10 digits. Currently: {localForm.phone ? localForm.phone.length : 0}/10
                </div>
                {validationErrors.phone && <div className="text-red-500 text-sm mt-1">{validationErrors.phone}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Login Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={localForm.password || ''}
                    onChange={handleChange}
                    name="password"
                    maxLength={10}
                    className={`w-full px-3 py-1.5 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
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
                  {localForm.password ? localForm.password.length : 0}/10 characters
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={localForm.address || ''}
                  onChange={(e) => handleChange(e)}
                  onKeyPress={(e) => {
                    const key = e.key;
                    if (!/^[a-zA-Z0-9\s,.\-\\/|]$/.test(key)) {
                      e.preventDefault();
                      setValidationErrors(prev => ({ ...prev, address: `Character '${key}' is not allowed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.` }));
                    }
                  }}
                  name="address"
                  maxLength={200}
                  className={`w-full px-3 py-1.5 border ${validationErrors.address ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-vertical`}
                  rows="4"
                  style={{ minHeight: '80px' }}
                  required
                />
                {validationErrors.address && <div className="text-red-500 text-sm mt-1">{validationErrors.address}</div>}
                <div className="text-xs text-gray-500 mt-1">
                  {(localForm.address || '').length}/200 characters
                </div>
              </div>
            </div>

            {/* Compact Password strength indicator */}
            {localForm.password && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <div className="flex flex-wrap gap-2">
                  <span className={passwordStrength.length ? 'text-green-600' : 'text-gray-500'}>
                    {passwordStrength.length ? '✓' : '✗'} 8+ chars
                  </span>
                  <span className={passwordStrength.uppercase || passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}>
                    {(passwordStrength.uppercase || passwordStrength.lowercase) ? '✓' : '✗'} Letter
                  </span>
                  <span className={passwordStrength.number ? 'text-green-600' : 'text-gray-500'}>
                    {passwordStrength.number ? '✓' : '✗'} Number
                  </span>
                </div>
              </div>
            )}
            </div>

            {/* Session Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[400px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Session Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type <span className="text-red-600">*</span>
                </label>
                <select
                  value={localForm.sessionType || ''}
                  onChange={handleInputChange}
                  name="sessionType"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  required
                >
                  <option value="">Select Session Type</option>
                  {sessionTypes.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timing <span className="text-red-600">*</span>
                </label>
                <select
                  value={localForm.sessionTiming || ''}
                  onChange={handleInputChange}
                  name="sessionTiming"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  required
                >
                  <option value="">Select Timing</option>
                  {sessionTimings.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

            </div>
            
            {/* Assigned Center - Full Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Center <span className="text-red-600">*</span>
              </label>
                {centersError ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm mb-2">
                    <span className="block">{centersError}</span>
                    <button type="button" onClick={handleRetryCenters} className="mt-1 px-2 py-1 bg-red-500 hover:bg-red-700 text-white text-xs rounded">Retry</button>
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
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                  {showCenterDropdown && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-auto">
                      {filteredCenters.map(center => (
                        <div
                          key={center._id}
                          className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => {
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
              {validationErrors.assignedCenter && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.assignedCenter}</div>
              )}
            </div>

            {/* Subjects - Compact */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subjects <span className="text-red-600">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">Select subjects by clicking on them</p>
              <div className="flex flex-wrap gap-2">
                {subjectsList.map(subject => (
                  <button
                    type="button"
                    key={subject.value}
                    onClick={() => {
                      let currentSubjects = [];
                      if (localForm.subjects) {
                        currentSubjects = Array.isArray(localForm.subjects)
                          ? [...localForm.subjects]
                          : [localForm.subjects];
                      }

                      const newSubjects = currentSubjects.includes(subject.value)
                        ? currentSubjects.filter(s => s !== subject.value)
                        : [...currentSubjects, subject.value];

                      setLocalForm(prev => ({ ...prev, subjects: newSubjects }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 ${
                      localForm.subjects?.includes(subject.value)
                        ? 'bg-blue-100 text-blue-700 border-blue-700'
                        : 'bg-gray-50 text-gray-700 border-black hover:bg-gray-100'
                    }`}
                  >
                    {subject.label}
                  </button>
                ))}
              </div>
              {validationErrors.subjects && <div className="text-red-500 text-sm mt-1">{validationErrors.subjects}</div>}
            </div>
            </div>
          </div>

          {/* Right Column - Educational Details & Other Info */}
          <div className="space-y-4">

            {/* Educational Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[280px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Educational Details</h3>
              
              <div className="flex-1">
              {localForm.sessionType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={localForm.qualificationType || ''}
                    onChange={handleInputChange}
                    name="qualificationType"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  >
                    <option value="">Select Qualification</option>
                    {(localForm.sessionType === 'tuition' ? tuitionQualifications : arabicQualifications).map(q => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                </div>

                {localForm.qualificationType === 'others' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specify Other Qualification <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={localForm.qualificationOther || ''}
                      onChange={handleChange}
                      name="qualificationOther"
                      maxLength={50}
                      className={`w-full px-3 py-1.5 border ${validationErrors.qualificationOther ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      placeholder="Enter qualification details"
                      required
                    />
                    {validationErrors.qualificationOther && (
                      <div className="text-red-500 text-sm mt-1">{validationErrors.qualificationOther}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {(localForm.qualificationOther || '').length}/50 characters
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={localForm.qualificationStatus || ''}
                    onChange={handleInputChange}
                    name="qualificationStatus"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  >
                    <option value="">Select Status</option>
                    {qualificationStatuses.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year of Completion <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={localForm.yearOfCompletion || ''}
                    onChange={handleChange}
                    name="yearOfCompletion"
                    className={`w-full px-3 py-1.5 border ${validationErrors.yearOfCompletion ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                    placeholder="YYYY"
                    maxLength={4}
                    required
                  />
                  {validationErrors.yearOfCompletion && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.yearOfCompletion}</div>
                  )}
                </div>

                {(localForm.sessionType === 'tuition' && (localForm.qualificationType === 'graduation' || localForm.qualificationType === 'intermediate')) && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={localForm.specialization || ''}
                      onChange={handleChange}
                      name="specialization"
                      maxLength={50}
                      className={`w-full px-3 py-1.5 border ${validationErrors.specialization ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      placeholder="e.g., Computer Science"
                      required
                    />
                    {validationErrors.specialization && (
                      <div className="text-red-500 text-sm mt-1">{validationErrors.specialization}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {(localForm.specialization || '').length}/50 characters
                    </div>
                  </div>
                )}

                {localForm.sessionType === 'tuition' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={localForm.collegeName || ''}
                      onChange={handleChange}
                      name="collegeName"
                      maxLength={50}
                      className={`w-full px-3 py-1.5 border ${validationErrors.collegeName ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      placeholder="Enter college name"
                      required
                    />
                    {validationErrors.collegeName && (
                      <div className="text-red-500 text-sm mt-1">{validationErrors.collegeName}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {(localForm.collegeName || '').length}/50 characters
                    </div>
                  </div>
                )}

                {localForm.sessionType === 'arabic' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Madarsah Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={localForm.madarsahName || ''}
                      onChange={handleChange}
                      name="madarsahName"
                      maxLength={50}
                      className={`w-full px-3 py-1.5 border ${validationErrors.madarsahName ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      placeholder="Enter madarsah name"
                      required
                    />
                    {validationErrors.madarsahName && (
                      <div className="text-red-500 text-sm mt-1">{validationErrors.madarsahName}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {(localForm.madarsahName || '').length}/50 characters
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Please select a session type first to configure educational details.</p>
              </div>
            )}
              </div>
          </div>

            {/* Hadiya Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[150px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Hadiya Information</h3>
              
              <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Hadiya Amount <span className="text-red-600">*</span> (₹)
              </label>
              <input
                type="number"
                value={localForm.assignedHadiyaAmount || ''}
                onChange={handleChange}
                name="assignedHadiyaAmount"
                max={100000}
                onKeyPress={(e) => {
                  const currentValue = e.target.value;
                  const key = e.key;
                  
                  // Prevent 'e' at the beginning
                  if (currentValue === '' && (key === 'e' || key === 'E')) {
                    e.preventDefault();
                    return;
                  }
                  
                  // Only allow digits
                  if (!/^[0-9]$/.test(key)) {
                    e.preventDefault();
                  }
                }}
                className={`w-full px-3 py-1.5 border ${validationErrors.assignedHadiyaAmount ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                required
              />
              {validationErrors.assignedHadiyaAmount && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.assignedHadiyaAmount}</div>
              )}
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[320px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Bank Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aadhar Number
              </label>
              <input 
                type="text"
                value={localForm.aadharNumber || ''}
                onChange={handleInputChange}
                name="aadharNumber"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="XXXX XXXX XXXX"
              />
              <div className="text-gray-500 text-sm mt-1">
                12 digits only. Spaces will be added automatically after every 4 digits.
              </div>
              {validationErrors.aadharNumber && <div className="text-red-500 text-sm mt-1">{validationErrors.aadharNumber}</div>}
            </div>
            
            <div>
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
                className={`w-full px-3 py-1.5 border ${validationErrors.bankName ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                placeholder="e.g., State Bank of India"
              />
              {validationErrors.bankName && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.bankName}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {(localForm.bankName || '').length}/30 characters
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Branch
              </label>
              <input 
                type="text"
                value={localForm.bankBranch || ''}
                onChange={handleChange}
                onKeyPress={(e) => {
                  const key = e.key;
                  if (!/^[a-zA-Z0-9\s]$/.test(key)) {
                    e.preventDefault();
                    setValidationErrors(prev => ({ ...prev, bankBranch: `Character '${key}' is not allowed. Only letters, numbers, and spaces are allowed.` }));
                  }
                }}
                name="bankBranch"
                maxLength={30}
                className={`w-full px-3 py-1.5 border ${validationErrors.bankBranch ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                placeholder="e.g., Main Branch"
              />
              {validationErrors.bankBranch && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.bankBranch}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {(localForm.bankBranch || '').length}/30 characters
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input 
                type="text"
                value={localForm.accountNumber || ''}
                onChange={handleInputChange}
                name="accountNumber"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="5-20 digits"
                maxLength={20}
              />
              <div className="text-xs text-gray-500 mt-1">
                {(localForm.accountNumber || '').length}/20 digits (5-20 required)
              </div>
              {validationErrors.accountNumber && <div className="text-red-500 text-sm mt-1">{validationErrors.accountNumber}</div>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
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
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., SBIN0123456"
                maxLength={11}
              />
              <div className="text-gray-500 text-sm mt-1">
                Format: XXXX0XXXXXX (e.g., SBIN0123456). First 4 letters are bank code.
              </div>
              {validationErrors.ifscCode && <div className="text-red-500 text-sm mt-1">{validationErrors.ifscCode}</div>}
            </div>
            </div>
          </div>
        </div>
        
        {/* Form error summary - Full Width */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
            <p className="font-medium">Please fix the following errors:</p>
            <ul className="list-disc pl-5 mt-2">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={`error-${field}`}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => {
              // Reset form to initial state
              setLocalForm(initialState);
              setValidationErrors({});
              // Navigate back to admin dashboard
              navigate('/admin-dashboard', { state: { activeTab: 'tutors' } });
            }}
            className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium text-sm shadow"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isFormSubmitting}
            className="px-3 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-medium text-sm shadow hover:shadow-md"
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
      
      {/* Error Popover */}
      <Popover
        isOpen={showErrorPopover}
        onClose={() => setShowErrorPopover(false)}
        title="Error!"
        message="Failed to add tutor. Please try again."
        type="error"
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
