import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import DatePicker from 'react-datepicker'
import { FiSearch, FiEdit2, FiTrash2, FiDownload, FiUserPlus, FiX, FiCalendar, FiChevronDown } from 'react-icons/fi'
import Papa from 'papaparse'
import useGet from '../CustomHooks/useGet'
import { toast } from 'react-hot-toast'
import "react-datepicker/dist/react-datepicker.css"
import { useCenterRefetch } from '../../context/CenterRefetchContext'


// Helper to get ordinal suffix
function getOrdinal(n) {
  let s = ["th", "st", "nd", "rd"];
  let v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Helper to format Aadhaar number with spaces
const formatAadhar = (value) => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
  if (!match) return '';
  return [match[1], match[2], match[3]].filter(Boolean).join(' ');
};

// Helper to format contact number to 10 digits
const formatContact = (value) => {
  return value.replace(/\D/g, '').slice(0, 10);
};

const CustomDropdown = ({ value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        className="flex items-center justify-between w-full bg-white/70 border border-gray-200 rounded-2xl px-4 py-2 pr-10 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 hover:bg-white/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        {options.find(opt => opt.value === value)?.label || 'Select'}
        <FiChevronDown className={`ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {options.map(option => (
            <button
              key={option.value}
              className={`w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 transition-colors ${value === option.value ? 'bg-accent-100' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TutorStudents = () => {
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [selectedFilter, setSelectedFilter] = useState('active')
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [attendanceData, setAttendanceData] = useState({
    month: new Date(),
    presentDays: '',
    totalDays: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Dynamically decide how many rows fit vertically based on viewport
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const tableRef = useRef(null)
  const paginationRef = useRef(null)
  const [selectedClass, setSelectedClass] = useState('all')
  const [editMode, setEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get tutor data from localStorage
  const tutorData = JSON.parse(localStorage.getItem('userData') || '{}')

  // Fetch students data
  const endpoint = `/students?status=${selectedFilter}`;
  const { response: students, error: studentsError, loading: studentsLoading, refetch } = useGet(endpoint);

  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    contact: '',
    isOrphan: false,
    guardianName: '',
    guardianContact: '',
    isNonSchoolGoing: false,
    schoolName: '',
    class: '',
    gender: '',
    medium: '',
    aadharNumber: '',
    remarks: ''
  })

  const refetchCenterContext = useCenterRefetch()

  // ---------- Pagination & Filtering ----------
  // Calculate itemsPerPage based on actual space so the page never scrolls
  useLayoutEffect(() => {
    const calcItemsPerPage = () => {
      if (!tableRef.current || !paginationRef.current) return
      const rowHeight = 56 // approximate single row height
      const top = tableRef.current.getBoundingClientRect().top
      const paginationHeight = paginationRef.current.getBoundingClientRect().height
      const EXTRA_GAP = 60 // space below pagination and OS dock
      const available = window.innerHeight - top - paginationHeight - EXTRA_GAP
      const rows = Math.max(4, Math.floor(available / rowHeight))
      setItemsPerPage(rows)
    }
    calcItemsPerPage()
    window.addEventListener('resize', calcItemsPerPage)
    return () => window.removeEventListener('resize', calcItemsPerPage)
  }, [])

  // Reset to first page whenever filters/search or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, students]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'aadharNumber') {
      finalValue = formatAadhar(value);
    } else if (name === 'contact' || name === 'guardianContact') {
      finalValue = formatContact(value).slice(0, 10);
    } else if (name === 'name') {
      finalValue = value.replace(/[^a-zA-Z ]/g, '').slice(0, 30);
    } else if (name === 'fatherName') {
      finalValue = value.replace(/[^a-zA-Z ]/g, '').slice(0, 25);
    } else if (name === 'schoolName') {
      finalValue = value.slice(0, 30);
    } else if (name === 'remarks') {
      finalValue = value.slice(0, 100);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (studentsLoading) {
      toast.error('Student list is still loading. Please wait and try again.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');

    try {
      // Get token from userData in localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const token = userData.token
      if (!token) {
        throw new Error('Please login to continue')
      }

      // Get tutor data from localStorage
      const tutorData = JSON.parse(localStorage.getItem('userData') || '{}')
      console.log('Tutor Data:', tutorData)
      console.log('Assigned Center:', tutorData.assignedCenter)
      // Robust check for assignedCenter
      const assignedCenter = tutorData.assignedCenter && (typeof tutorData.assignedCenter === 'string' ? tutorData.assignedCenter : tutorData.assignedCenter._id)
      if (!assignedCenter) {
        throw new Error('Tutor center information not found (assignedCenter is missing or invalid)')
      }

      // Format the data according to backend requirements
      const formattedData = {
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        isOrphan: formData.isOrphan,
        isNonSchoolGoing: formData.isNonSchoolGoing,
        gender: formData.gender,
        medium: formData.medium,
        aadharNumber: formData.aadharNumber.trim(),
        assignedCenter: assignedCenter,
        remarks: formData.remarks.trim()
      };

      // Conditionally add contact and guardian info.
      if (formData.isOrphan) {
        // For orphans, add guardian info.
        formattedData.guardianInfo = {
          name: formData.guardianName.trim(),
          contact: formData.guardianContact.trim()
        };
        // WORKAROUND: The backend requires a 10-digit contact number even for orphans.
        // We'll use the guardian's contact to satisfy this validation rule.
        formattedData.contact = formData.guardianContact.trim();
      } else {
        // For non-orphans, add the parent's contact.
        formattedData.contact = formData.contact.trim();
      }

      // Only add schoolInfo if isNonSchoolGoing is false
      if (!formData.isNonSchoolGoing) {
        formattedData.schoolInfo = {
          name: formData.schoolName.trim(),
          class: formData.class.trim()
        };
      }

      // ---- Additional front-end validations ----
      const cleanParentContact = (formData.contact || '').replace(/\D/g, '');
      const cleanGuardianContact = (formData.guardianContact || '').replace(/\D/g, '');
      const cleanAadhar = (formData.aadharNumber || '').replace(/\s/g, '');

      // Parent vs Orphan contact rules
      if (!formData.isOrphan && cleanParentContact.length !== 10) {
        throw new Error('Parent contact must be 10 digits');
      }
      if (formData.isOrphan) {
        if (!formData.guardianName.trim()) throw new Error('Guardian name is required for orphans');
        if (cleanGuardianContact.length !== 10) throw new Error('Guardian contact must be 10 digits');
      }

      // Aadhaar length check (if provided)
      if (cleanAadhar && cleanAadhar.length !== 12) {
        throw new Error('Aadhaar number must be 12 digits');
      }

      // Duplicate detection
      if (cleanAadhar) {
        const aadharExists = (students || []).some(s => (s.aadharNumber || '').replace(/\s/g, '') === cleanAadhar);
        if (aadharExists) {
          throw new Error('A student with this Aadhaar number already exists.');
        }
      }

      const nameExists = (students || []).some(s =>
        s.name?.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        s.fatherName?.trim().toLowerCase() === formData.fatherName.trim().toLowerCase()
      );
      if (nameExists) {
        throw new Error('A student with the same name and father\'s name already exists.');
      }

      console.log('Sending student data:', formattedData) // Debug log

      const response = await fetch(`${import.meta.env.VITE_API_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        // If backend sends { errors: [...] }
        if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          throw new Error(responseData.errors[0].msg);
        }
        // If backend sends { message: ... }
        if (responseData.message) {
          throw new Error(responseData.message);
        }
        throw new Error('Failed to add student');
      }

      toast.success('Student added successfully!')
      setShowForm(false)
      setFormData({
        name: '',
        fatherName: '',
        contact: '',
        isOrphan: false,
        guardianName: '',
        guardianContact: '',
        isNonSchoolGoing: false,
        schoolName: '',
        class: '',
        gender: '',
        medium: '',
        aadharNumber: '',
        remarks: ''
      })
      refetch() // Refresh the students list
      // Trigger center refetch for instant update
      if (refetchCenterContext && refetchCenterContext.current) {
        refetchCenterContext.current();
      }
    } catch (error) {
      // Always show a toast for any error
      let shown = false;
      let errorMsg = '';
      // Try to parse backend error if error.message is stringified JSON
      if (typeof error.message === 'string') {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed && parsed.errors && Array.isArray(parsed.errors) && parsed.errors[0]?.msg) {
            errorMsg = parsed.errors[0].msg;
            shown = true;
          } else if (parsed && parsed.message) {
            errorMsg = parsed.message;
            shown = true;
          }
        } catch (e) {
          // Not JSON, fall through
        }
      }
      if (!shown) {
        if (error.message && typeof error.message === 'string') {
          errorMsg = error.message;
        } else {
          errorMsg = 'An unexpected error occurred while adding the student.';
        }
      }
      setFormError(errorMsg);
      toast.error(errorMsg);
      console.error('Error adding student:', error);
    } finally {
      setIsSubmitting(false);
    }
  }



  const handleExportCSV = () => {
    // First, collect all unique months from all students' attendance records
    const allMonths = new Set();
    students.forEach(student => {
      if (student.attendance && student.attendance.length > 0) {
        student.attendance.forEach(record => {
          const month = format(new Date(record.month), 'MMMM yyyy');
          allMonths.add(month);
        });
      }
    });

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    // Prepare the data for CSV export with all details
    const csvData = students.map(student => {
      // Create base student data
      const studentData = {
        'Student Name': student.name,
        'Father\'s Name': student.fatherName,
        'Contact Number': student.contact,
        'Gender': student.gender,
        'Medium': student.medium,
        'Aadhar Number': student.aadharNumber,
        'Orphan Status': student.isOrphan ? 'Yes' : 'No',
        'Guardian Name': student.guardianInfo?.name || '',
        'Guardian Contact': student.guardianInfo?.contact || '',
        'School Going Status': student.isNonSchoolGoing ? 'Non-School Going' : 'School Going',
        'School Name': student.schoolInfo?.name || '',
        'Class': student.schoolInfo?.class || '',
        'Joining Date': student.joiningDate ? format(new Date(student.joiningDate), 'dd/MM/yyyy') : '',
        'Remarks': student.remarks || ''
      };

      // Create a map of attendance records for easy lookup
      const attendanceMap = new Map();
      if (student.attendance && student.attendance.length > 0) {
        student.attendance.forEach(record => {
          const month = format(new Date(record.month), 'MMMM yyyy');
          attendanceMap.set(month, `${record.presentDays}/${record.totalDays}`);
        });
      }

      // Add attendance data for all months
      sortedMonths.forEach(month => {
        studentData[month] = attendanceMap.get(month) || '-';
      });

      return studentData;
    });

    // Convert to CSV
    const csv = Papa.unparse(csvData);

    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `students_data_with_attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleMarkAttendance = (student) => {
    setSelectedStudent(student)
    setShowAttendanceModal(true)
  }

  const handleAttendanceChange = (e) => {
    const { name, value } = e.target;
    
    setAttendanceData(prev => {
      // Validate against max days in month for the selected month in state
      const daysInMonth = new Date(
        prev.month.getFullYear(),
        prev.month.getMonth() + 1,
        0
      ).getDate();

      if (name === 'totalDays') {
        if (value === '') {
          return { ...prev, totalDays: '' };
        }
        const numValue = Number(value);
        const newTotalDays = Math.min(numValue, daysInMonth);
        // Adjust presentDays only if it's a number and greater than newTotalDays
        const newPresentDays = prev.presentDays === '' ? '' : Math.min(prev.presentDays, newTotalDays);
        return { ...prev, totalDays: newTotalDays, presentDays: newPresentDays };
      } else if (name === 'presentDays') {
        if (value === '') {
          return { ...prev, presentDays: '' };
        }
        const numValue = Number(value);
        const newPresentDays = Math.min(numValue, prev.totalDays === '' ? Infinity : prev.totalDays, daysInMonth);
        return { ...prev, presentDays: newPresentDays };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  useEffect(() => {
    setAttendanceData(prev => ({
      ...prev,
      presentDays: '',
      totalDays: ''
    }));
  }, [attendanceData.month]);

  const handleAttendanceSubmit = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const token = userData.token;
      if (!token) {
        throw new Error('Please login to continue')
      }

      const response = await fetch(`https://mtc-backend-jn5y.onrender.com/api/students/${selectedStudent._id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: format(attendanceData.month, 'yyyy-MM'),
          presentDays: attendanceData.presentDays === '' ? 0 : parseInt(attendanceData.presentDays),
          totalDays: attendanceData.totalDays === '' ? 0 : parseInt(attendanceData.totalDays)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to mark attendance')
      }

      toast.success('Attendance marked successfully!')
      setShowAttendanceModal(false)
      setAttendanceData({
        month: new Date(),
        presentDays: '',
        totalDays: ''
      })
      refetch() // Refresh the students list
    } catch (error) {
      toast.error(error.message || 'Failed to mark attendance')
    }
  }

  // Filter and paginate students
  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(searchTerm.toLowerCase())
    const classValue = student.class || (student.schoolInfo && student.schoolInfo.class);
    const matchesClass = 
      selectedClass === 'all' || 
      (selectedClass === 'non-school' && !classValue) ||
      classValue === selectedClass;
    return matchesSearch && matchesClass
  }) || []

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage)

  // Edit student handler
  const handleEditStudent = (student) => {
    setEditFormData({
      name: student.name || '',
      fatherName: student.fatherName || '',
      contact: student.contact || '',
      isOrphan: student.isOrphan || false,
      guardianName: (student.guardianInfo && student.guardianInfo.name) || '',
      guardianContact: (student.guardianInfo && student.guardianInfo.contact) || '',
      isNonSchoolGoing: student.isNonSchoolGoing || false,
      schoolName: (student.schoolInfo && student.schoolInfo.name) || '',
      class: (student.schoolInfo && student.schoolInfo.class) || '',
      gender: student.gender || '',
      medium: student.medium || '',
      aadharNumber: student.aadharNumber || '',
      remarks: student.remarks || '',
      _id: student._id
    })
    setEditMode(true)
  }

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'aadharNumber') {
      finalValue = formatAadhar(value);
    } else if (name === 'contact' || name === 'guardianContact') {
      finalValue = formatContact(value);
    }

    setEditFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Get token from userData in localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const token = userData.token
      if (!token) throw new Error('Please login to continue')

      const tutorData = JSON.parse(localStorage.getItem('userData') || '{}')
      const assignedCenter = tutorData.assignedCenter && (typeof tutorData.assignedCenter === 'string' ? tutorData.assignedCenter : tutorData.assignedCenter._id)

      if (!assignedCenter) {
        throw new Error('Tutor center information not found')
      }

      // ---- Additional front-end validations for edit ----
      const cleanParentContact = editFormData.contact.replace(/\D/g, '');
      const cleanGuardianContact = editFormData.guardianContact.replace(/\D/g, '');
      const cleanAadhar = editFormData.aadharNumber.replace(/\s/g, '');

      // Parent vs Orphan contact rules
      if (!editFormData.isOrphan && cleanParentContact.length !== 10) {
        setFormError('Parent contact must be 10 digits');
        setIsSubmitting(false); return;
      }
      if (editFormData.isOrphan) {
        if (!editFormData.guardianName.trim()) {
          setFormError('Guardian name is required for orphans'); setIsSubmitting(false); return;
        }
        if (cleanGuardianContact.length !== 10) {
          setFormError('Guardian contact must be 10 digits'); setIsSubmitting(false); return;
        }
      }

      // Aadhaar length check (if provided)
      if (cleanAadhar && cleanAadhar.length !== 12) {
        setFormError('Aadhaar number must be 12 digits'); setIsSubmitting(false); return;
      }

      // Duplicate detection (exclude self)
      if (cleanAadhar) {
        const aadharExists = (students || []).some(s => s._id !== editFormData._id && (s.aadharNumber || '').replace(/\s/g, '') === cleanAadhar);
        if (aadharExists) {
          setFormError('A student with this Aadhaar number already exists.'); setIsSubmitting(false); return;
        }
      }
      const nameExists = (students || []).some(s =>
        s._id !== editFormData._id &&
        s.name?.trim().toLowerCase() === editFormData.name.trim().toLowerCase() &&
        s.fatherName?.trim().toLowerCase() === editFormData.fatherName.trim().toLowerCase()
      );
      if (nameExists) {
        setFormError('A student with the same name and father\'s name already exists.'); setIsSubmitting(false); return;
      }

      // Format the updated data
      const updatedData = {
        name: editFormData.name.trim(),
        fatherName: editFormData.fatherName.trim(),
        contact: editFormData.contact.trim(),
        isOrphan: editFormData.isOrphan,
        isNonSchoolGoing: editFormData.isNonSchoolGoing,
        gender: editFormData.gender,
        medium: editFormData.medium,
        aadharNumber: editFormData.aadharNumber.trim(),
        assignedCenter: assignedCenter,
        remarks: editFormData.remarks.trim(),
        status: 'active' // Always set to active on edit (reactivate if inactive)
      }
      // Only add guardianInfo if isOrphan is true
      if (editFormData.isOrphan) {
        updatedData.guardianInfo = {
          name: editFormData.guardianName.trim(),
          contact: editFormData.guardianContact.trim()
        }
      }
      // Only add schoolInfo if isNonSchoolGoing is false
      if (!editFormData.isNonSchoolGoing) {
        updatedData.schoolInfo = {
          name: editFormData.schoolName.trim(),
          class: editFormData.class.trim()
        }
      }
      setFormError('');
      console.log('Updating student with data:', updatedData)
      const response = await fetch(`https://mtc-backend-jn5y.onrender.com/api/students/${editFormData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })
      if (!response.ok) {
        const errorData = await response.json()
        setFormError(errorData.message || 'Failed to update student');
        throw new Error(errorData.message || 'Failed to update student')
      }
      toast.success('Student updated successfully!')
      setEditMode(false)
      setShowDetails(null)
      refetch() // Refresh the students list
      // Trigger center refetch for instant update
      if (refetchCenterContext && refetchCenterContext.current) {
        refetchCenterContext.current()
      }
    } catch (error) {
      console.error('Error updating student:', error)
      if (!formError) setFormError(error.message || 'Failed to update student')
      toast.error(error.message || 'Failed to update student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStudent = async (studentId) => {
    try {
      setIsDeleting(true);
      // Remove the alert as it might be interfering with the flow

      // Get user data and token
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Make the DELETE request
      const deleteUrl = `https://mtc-backend-jn5y.onrender.com/api/students/${studentId}`;

      // Use fetch instead of axios for consistency
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status: ${response.status}`);
      }

      // If successful
      toast.success('Student deleted successfully!');
      setShowDetails(null);
      refetch();

      // Refresh center data if needed
      if (refetchCenterContext && refetchCenterContext.current) {
        refetchCenterContext.current();
      }

    } catch (error) {
      console.error('Delete student error:', error);
      toast.error(error.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
      setShowDeletePopover(false);
      setStudentToDelete(null);
    }
  }

  if (studentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-600"></div>
      </div>
    )
  }

  if (studentsError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {studentsError.includes('login') ? (
                <>
                  Please <a href="/login" className="text-blue-600 hover:text-blue-500">login</a> to view students
                </>
              ) : (
                studentsError
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
  
    <div className="min-h-screen w-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-accent-50 to-primary-50 py-6 px-4 sm:px-6 space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
              Students Management
            </h1>
            <p className="text-gray-600">Manage your center's students</p>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-accent-600 to-primary-600 text-white rounded-xl hover:shadow-lg hover:shadow-accent-500/25 hover:-translate-y-0.5 transition-all duration-300 flex items-center font-medium"
            >
              <FiUserPlus className="mr-2 text-lg" /> Add Student
            </button>
            <button
              onClick={handleExportCSV}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5 transition-all duration-300 flex items-center font-medium"
            >
              <FiDownload className="mr-2 text-lg" /> Export CSV
            </button>
          </div>
        </div>


      </div>

      {/* Delete Confirmation Popover */}
      <AnimatePresence>
        {showDeletePopover && studentToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <FiTrash2 className="text-red-600 text-2xl" />
                </div>
                <div className="text-lg font-bold mb-2 text-red-700">Delete Student</div>
                <div className="text-gray-700 text-center mb-4">Are you sure you want to delete this student?</div>
                <div className="flex gap-4 mt-2">
                  <button
                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    onClick={() => {
                      setShowDeletePopover(false);
                      setStudentToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    onClick={() => handleDeleteStudent(studentToDelete)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Students Table with Integrated Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 flex flex-col min-w-0">
        {/* Table Header with Filters */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 mb-6">
            {/* Search Input */}
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
              />
            </div>

            {/* Class Filter Dropdown */}
            <div className="w-full">
              <CustomDropdown
                value={selectedClass}
                onChange={setSelectedClass}
                options={[
                  { value: 'all', label: 'All Classes' },
                  ...Array.from({ length: 10 }, (_, i) => ({
                    value: getOrdinal(i + 1),
                    label: `Class ${getOrdinal(i + 1)}`
                  })),
                  { value: 'non-school', label: 'Non-School Going' }
                ]}
                className="w-full"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="w-full">
              <CustomDropdown
                value={selectedFilter}
                onChange={setSelectedFilter}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'all', label: 'All Status' }
                ]}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="w-full flex flex-col h-full hidden md:flex">
          <div className="relative flex-1 overflow-x-auto">
            <table ref={tableRef} className="w-full md:min-w-[700px] table-fixed">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50">
                  <th className="px-2 py-3 sm:px-4 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-2 py-3 sm:px-4 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Father's Name
                  </th>
                  <th className="px-2 py-3 sm:px-4 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-2 py-3 sm:px-4 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-2 py-3 sm:px-4 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-3 sm:px-4 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStudents.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setShowDetails(student)}
                >
                  <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-500">{student.fatherName}</div>
                  </td>
                  <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{student.schoolInfo?.class || '-'}</div>
                  </td>
                  <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{student.schoolInfo?.name || '-'}</div>
                  </td>
                  <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold select-none cursor-default ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {student.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap">
                    <div className="flex space-x-3 justify-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMarkAttendance(student)}
                        disabled={student.status !== 'active'}
                        className={`text-blue-600 hover:text-blue-800 transition-colors ${student.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <FiCalendar size={18} />
                      </button>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setShowDeletePopover(true);
                          setStudentToDelete(student._id);
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Student"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedStudents.map((student) => (
            <div
              key={student._id}
              className="bg-white rounded-xl shadow p-4 flex flex-col"
              onClick={() => setShowDetails(student)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{student.name}</h3>
                  <p className="text-sm text-gray-500">{student.fatherName}</p>
                  <p className="text-sm text-gray-500">
                    {student.schoolInfo?.class || '-'} | {student.schoolInfo?.name || '-'}
                  </p>
                </div>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {student.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div
                className="flex justify-end space-x-4 mt-4"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleMarkAttendance(student)}
                  disabled={student.status !== 'active'}
                  className={`text-blue-600 hover:text-blue-800 transition-colors ${
                    student.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FiCalendar size={18} />
                </button>
                <button
                  onClick={() => handleEditStudent(student)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <FiEdit2 size={18} />
                </button>
                <button
                  onClick={() => {
                    setShowDeletePopover(true);
                    setStudentToDelete(student._id);
                  }}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Student"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div ref={paginationRef} className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-4 mt-4 gap-4 px-6 pb-4">
          <div className="flex items-center text-center sm:text-left">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, filteredStudents.length)}
              </span>{' '}
              of <span className="font-medium">{filteredStudents.length}</span> results
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md ${currentPage === page
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-300'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Student Form Modal */ }
  <AnimatePresence>
    {showForm && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
              Add New Student
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded bg-red-100 border border-red-400 text-red-700 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Student Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Father's Name
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${!formData.isOrphan ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  maxLength="10"
                  placeholder="10-digit number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  required={!formData.isOrphan}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isOrphan"
                    checked={formData.isOrphan}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Orphan</span>
                </label>
              </div>

              {formData.isOrphan && (
                <>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${formData.isOrphan ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required={formData.isOrphan}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${formData.isOrphan ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>
                      Guardian Contact
                    </label>
                    <input
                      type="tel"
                      name="guardianContact"
                      value={formData.guardianContact}
                      onChange={handleChange}
                      maxLength="10"
                      placeholder="10-digit number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required={formData.isOrphan}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isNonSchoolGoing"
                    checked={formData.isNonSchoolGoing}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Non-School Going</span>
                </label>
              </div>

              {!formData.isNonSchoolGoing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                      School Name
                    </label>
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                      Class
                    </label>
                    <select
                      name="class"
                      value={formData.class}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required
                    >
                      <option value="">Select Class</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i + 1} value={getOrdinal(i + 1)}>
                          {getOrdinal(i + 1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Medium
                </label>
                <select
                  name="medium"
                  value={formData.medium}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  required
                >
                  <option value="">Select Medium</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Urdu">Urdu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleChange}
                  maxLength="14"
                  placeholder="1234 5678 9012"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-accent-600 to-primary-600 text-white rounded-lg hover:from-accent-700 hover:to-primary-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting || studentsLoading}
              >
                {isSubmitting ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Student Details Modal */ }
  <AnimatePresence>
    {showDetails && !editMode && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
                Student Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">ID: {showDetails._id}</p>
            </div>
            <button
              onClick={() => setShowDetails(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Personal Information Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{showDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Father's Name</p>
                <p className="font-medium text-gray-900">{showDetails.fatherName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium text-gray-900">{showDetails.contact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium text-gray-900">{showDetails.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Medium</p>
                <p className="font-medium text-gray-900">{showDetails.medium}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Aadhar Number</p>
                <p className="font-medium text-gray-900">{showDetails.aadharNumber}</p>
              </div>
            </div>
          </div>

          {/* School Information Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">School Name</p>
                <p className="font-medium text-gray-900">{showDetails.schoolInfo?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Class</p>
                <p className="font-medium text-gray-900">{showDetails.schoolInfo?.class || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Non-School Going</p>
                <p className="font-medium text-gray-900">{showDetails.isNonSchoolGoing ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joining Date</p>
                <p className="font-medium text-gray-900">
                  {showDetails.joiningDate ? format(new Date(showDetails.joiningDate), 'dd/MM/yyyy') : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Guardian Information Section (if orphan) */}
          {showDetails.isOrphan && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Guardian Name</p>
                  <p className="font-medium text-gray-900">{showDetails.guardianInfo?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guardian Contact</p>
                  <p className="font-medium text-gray-900">{showDetails.guardianInfo?.contact || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance History Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
            </div>
            <div className="space-y-3">
              {showDetails.attendance && showDetails.attendance.length > 0 ? (
                showDetails.attendance.map((record, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <FiCalendar className="text-gray-400 mr-3" />
                      <span className="font-medium text-gray-900">
                        {format(new Date(record.month), 'MMMM yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`font-medium ${(record.presentDays / record.totalDays) * 100 >= 75
                          ? 'text-green-600'
                          : 'text-red-600'
                        }`}>
                        {record.presentDays}/{record.totalDays} days
                      </span>
                      <span className="ml-3 text-sm text-gray-500">
                        ({Math.round((record.presentDays / record.totalDays) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No attendance records found
                </div>
              )}
            </div>
          </div>

          {/* Remarks Section */}
          {showDetails.remarks && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h3>
              <p className="text-gray-700">{showDetails.remarks}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => handleEditStudent(showDetails)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center"
            >
              <FiEdit2 className="mr-2" /> Edit
            </button>
            {/*
                <button
                  onClick={() => {
                    setShowDeletePopover(true);
                    setStudentToDelete(showDetails._id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center"
                  disabled={isDeleting}
                >
                  <FiTrash2 className="mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                */}
            <button
              onClick={() => setShowDetails(null)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Edit Student Modal */ }
  <AnimatePresence>
    {editMode && editFormData && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
              Edit Student
            </h2>
            <button
              onClick={() => setEditMode(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
          {/* {formError && ()} */}
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Student Name
                </label>
                <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                  Father's Name
                </label>
                <input type="text" name="fatherName" value={editFormData.fatherName} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${!editFormData.isOrphan ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>
                  Contact Number
                </label>
                <input type="tel" name="contact" value={editFormData.contact} onChange={handleEditChange} maxLength="10" placeholder="10-digit number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required={!editFormData.isOrphan} />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isOrphan" checked={editFormData.isOrphan} onChange={handleEditChange} className="rounded border-gray-300 text-accent-600 focus:ring-accent-500" />
                  <span className="text-sm font-medium text-gray-700">Orphan</span>
                </label>
              </div>
              {editFormData.isOrphan && (
                <>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${editFormData.isOrphan ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>Guardian Name</label>
                    <input type="text" name="guardianName" value={editFormData.guardianName} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required={editFormData.isOrphan} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${editFormData.isOrphan ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>Guardian Contact</label>
                    <input type="tel" name="guardianContact" value={editFormData.guardianContact} onChange={handleEditChange} maxLength="10" placeholder="10-digit number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required={editFormData.isOrphan} />
                  </div>
                </>
              )}
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isNonSchoolGoing" checked={editFormData.isNonSchoolGoing} onChange={handleEditChange} className="rounded border-gray-300 text-accent-600 focus:ring-accent-500" />
                  <span className="text-sm font-medium text-gray-700">Non-School Going</span>
                </label>
              </div>
              {!editFormData.isNonSchoolGoing && (
                <>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${!editFormData.isNonSchoolGoing ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>School Name</label>
                    <input type="text" name="schoolName" value={editFormData.schoolName} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required={!editFormData.isNonSchoolGoing} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${!editFormData.isNonSchoolGoing ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>Class</label>
                    <select name="class" value={editFormData.class} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required={!editFormData.isNonSchoolGoing} >
                      <option value="">Select Class</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i + 1} value={getOrdinal(i + 1)}>
                          {getOrdinal(i + 1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select name="gender" value={editFormData.gender} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                <select name="medium" value={editFormData.medium} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required >
                  <option value="">Select Medium</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Urdu">Urdu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Aadhar Number</label>
                <input type="text" name="aadharNumber" value={editFormData.aadharNumber} onChange={handleEditChange} maxLength="14" placeholder="1234 5678 9012" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea name="remarks" value={editFormData.remarks} onChange={handleEditChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"></textarea>
            </div>
            {formError && (
              <div className="my-4 p-3 rounded bg-red-100 border border-red-400 text-red-700 text-sm">
                {formError}
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-accent-600 to-primary-600 text-white rounded-lg hover:from-accent-700 hover:to-primary-700 transition-all duration-300">Save Changes</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Mark Attendance Modal */ }
  <AnimatePresence>
    {showAttendanceModal && selectedStudent && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Mark Monthly Attendance - {selectedStudent.name}
            </h3>
            <button
              onClick={() => setShowAttendanceModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Month
              </label>
              <DatePicker
                selected={attendanceData.month}
                onChange={(date) => setAttendanceData(prev => ({ ...prev, month: date }))}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Present Days
              </label>
              <input
                type="number"
                min="0"
                name="presentDays"
                value={attendanceData.presentDays}
                onChange={handleAttendanceChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Days
              </label>
              <input
                type="number"
                min="0"
                name="totalDays"
                value={attendanceData.totalDays}
                onChange={handleAttendanceChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => setShowAttendanceModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAttendanceSubmit}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Save Attendance
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  </div>
  )
}

export default TutorStudents;