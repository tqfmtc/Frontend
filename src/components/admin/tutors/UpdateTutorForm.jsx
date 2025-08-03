import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Popover from '../../common/Popover';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '', // Optional for update - only set if changing
  address: '',
  assignedCenter: '',
  subjects: [],
  sessionType: '',
  sessionTiming: '',
  // Educational Details
  qualificationType: '',
  qualificationOther: '',
  qualificationStatus: '',
  yearOfCompletion: '',
  madarsahName: '',
  collegeName: '',
  specialization: '',
  assignedHadiyaAmount: '',
  aadharNumber: '',
  bankName: '',
  bankBranch: '',
  accountNumber: '',
  ifscCode: '',
  status: 'active'
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

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
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

const UpdateTutorForm = ({ onSubmit, formData, fieldErrors, isSubmitting, tutorId, onCancel }) => {
  const navigate = useNavigate();
  const [localForm, setLocalForm] = useState({ ...initialState });
  const [validationErrors, setValidationErrors] = useState({});
  const [centers, setCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [centersError, setCentersError] = useState(null);
  const [originalCenterName, setOriginalCenterName] = useState('');
  const [centerQuery, setCenterQuery] = useState('');
  const [showCenterDropdown, setShowCenterDropdown] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  
  // Popover states
  const [showCancelPopover, setShowCancelPopover] = useState(false);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [showErrorPopover, setShowErrorPopover] = useState(false);

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
          setCenterQuery(processedData.assignedCenter.name || '');
          // Extract just the ID for the form value
          processedData.assignedCenter = processedData.assignedCenter._id;
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
      setValidationErrors(fieldErrors);
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
      
      if (!token) {
        setCentersError('You are not logged in or your session expired. Please log in as admin to load centers.');
        setCenters([]);
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/centers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setCentersError('Session expired or unauthorized. Please log in as admin again to load centers.');
        } else {
          setCentersError('Failed to fetch centers. Please try again.');
        }
        setCenters([]);
        return;
      }
      
      const data = await response.json();
      setCenters(data);
      setCentersError(null);
      
      // Verify the tutor's center exists in the fetched centers
      if (localForm.assignedCenter) {
        const centerId = typeof localForm.assignedCenter === 'object' ? 
          localForm.assignedCenter._id : localForm.assignedCenter;
        
        const centerExists = data.some(center => center._id === centerId);
        if (!centerExists) {
          console.warn(`Selected center ID ${centerId} not found in centers list. Center may have been deleted or inaccessible.`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch centers:', err);
      setCentersError('Error fetching centers. Please check your connection and try again.');
      setCenters([]);
    } finally {
      setCentersLoading(false);
    }
  };

  // Retry handler for centers fetch
  const handleRetryCenters = () => {
    setCentersError(null);
    setCenters([]);
    fetchCenters();
  };

  // Handle regular input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Input validation and formatting
    if (name === 'address') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
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
    } else if (name === 'madarsahName' || name === 'collegeName' || name === 'specialization') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Some characters were removed. Only letters, numbers, spaces, commas, periods, and hyphens are allowed.' }));
      }
      if (newValue.length > 50) {
        newValue = newValue.substring(0, 50);
        setValidationErrors(prev => ({ ...prev, [name]: 'Field cannot exceed 50 characters' }));
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
      if (newValue.length > 30) {
        newValue = newValue.substring(0, 30);
      }
    } else if (name === 'bankBranch') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors(prev => ({ ...prev, bankBranch: 'Only letters, numbers, and spaces are allowed' }));
      }
      if (newValue.length > 30) {
        newValue = newValue.substring(0, 30);
      }
    } else if (name === 'yearOfCompletion') {
      // Only allow digits and limit to 4 characters (year format)
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 4) {
        newValue = digitsOnly;
      } else {
        return; // Don't update if exceeding 4 digits
      }
      
      // Validate year range
      const year = parseInt(digitsOnly);
      const currentYear = new Date().getFullYear();
      if (digitsOnly.length === 4 && (year < 1950 || year > currentYear + 10)) {
        setValidationErrors(prev => ({ ...prev, [name]: `Year must be between 1950 and ${currentYear + 10}` }));
      } else {
        // Clear error if year is valid
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (name === 'assignedHadiyaAmount') {
      // Convert to string to handle digit limit
      const stringValue = String(value);
      let numericValue = stringValue.replace(/[^0-9]/g, '');
      
      // Limit to 6 digits
      if (numericValue.length > 6) {
        numericValue = numericValue.substring(0, 6);
        setValidationErrors(prev => ({ ...prev, [name]: 'Hadiya cannot exceed 6 digits' }));
      }
      
      const num = numericValue ? parseInt(numericValue, 10) : '';
      
      if (num > 100000) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Hadiya cannot exceed ₹100,000' }));
      } else {
        // Clear error if amount is valid
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      
      setLocalForm(prev => ({ ...prev, [name]: num }));
      return;
    } else if (name === 'password') {
      // Password strength validation
      const password = value;
      setPasswordStrength({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      });

      if (value.length > 10) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Password must be 10 characters or less' }));
      } else if (value.length > 0 && value.length < 8) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Password must be at least 8 characters' }));
      } else {
        // Clear error if password is valid
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    setLocalForm(prev => ({ ...prev, [name]: newValue }));
  };

  // Handle input changes with special processing
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
    
    // Special handling for account number - only allow digits and limit to 20
    if (name === 'accountNumber') {
      const originalValue = value;
      const digitsOnly = originalValue.replace(/\D/g, '');
      if (digitsOnly.length <= 20) {
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

  // Form validation
  const validate = () => {
    const errs = {};
    
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
    if (localForm.accountNumber && (localForm.accountNumber.length < 5 || localForm.accountNumber.length > 20)) {
      errs.accountNumber = 'Account number must be between 5-20 digits.';
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

  // Form submission
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
    
    // Remove optional fields that are empty to satisfy backend validation
    Object.keys(formToSubmit).forEach((key) => {
      const val = formToSubmit[key];
      if (typeof val === 'string' && val.trim() === '') {
        delete formToSubmit[key];
      }
    });
    
    // Submit the form with processed data
    try {
      await onSubmit(formToSubmit);
      setShowSuccessPopover(true);
      // Hide popup after 1.5 seconds and navigate
      setTimeout(() => {
        setShowSuccessPopover(false);
        if (onCancel) onCancel();
      }, 1500);
    } catch (error) {
      console.error('Error updating tutor:', error);
      setValidationErrors({ general: error.message || 'Failed to update tutor' });
      setShowErrorPopover(true);
    } finally {
      setIsFormSubmitting(false);
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
      navigate('/admin-dashboard', { state: { activeTab: 'tutors' } });
    }
  };

  // Get qualification options based on session type
  const getQualificationOptions = () => {
    return localForm.sessionType === 'arabic' ? arabicQualifications : tuitionQualifications;
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
        Update Tutor
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
                    Login Password <span className="text-gray-500">(Leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={localForm.password || ''}
                      onChange={handleChange}
                      name="password"
                      maxLength={10}
                      className={`w-full px-3 py-1.5 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      placeholder="Enter new password or leave blank"
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
                      if (!/^[a-zA-Z0-9\s,.-]$/.test(key)) {
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={localForm.status || 'active'}
                    onChange={handleInputChange}
                    name="status"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium text-sm shadow"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isFormSubmitting}
            className="px-3 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-medium text-sm shadow hover:shadow-md"
          >
            {isSubmitting || isFormSubmitting ? 'Updating...' : 'Update Tutor'}
          </button>
        </div>
      </form>

      {/* Cancel Confirmation Popover */}
      <Popover
        isOpen={showCancelPopover}
        onClose={() => setShowCancelPopover(false)}
        title="Cancel Update"
        message="Are you sure you want to cancel? All unsaved changes will be lost."
        onConfirm={handleCancelConfirmed}
        confirmText="Yes, Cancel"
        cancelText="Continue Editing"
        type="warning"
      />

      {/* Success Popover */}
      <Popover
        isOpen={showSuccessPopover}
        onClose={() => {
          setShowSuccessPopover(false);
          if (onCancel) onCancel();
        }}
        title="Success!"
        message="Tutor has been updated successfully"
        type="success"
      />

      {/* Error Popover */}
      <Popover
        isOpen={showErrorPopover}
        onClose={() => setShowErrorPopover(false)}
        title="Error!"
        message="Failed to update tutor. Please try again."
        type="error"
      />
    </div>
  );
};

export default UpdateTutorForm;
