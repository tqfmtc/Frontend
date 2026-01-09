import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiEdit2, FiTrash2, FiSearch, FiPlus, FiX, FiDownload, FiCalendar, FiBook, FiMapPin, FiFileText, FiBarChart2 } from 'react-icons/fi';
import { BiIdCard } from 'react-icons/bi';
import useGet from '../CustomHooks/useGet';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import { hasWritePermission } from '../../utils/permissions';

// Helper component for Student Marks
const StudentMarksDisplay = ({ student }) => {
  const [subjectRecords, setSubjectRecords] = React.useState([])
  const [marksLoading, setMarksLoading] = React.useState(true)
  const [marksError, setMarksError] = React.useState(null)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = String(date.getFullYear()).slice(-2)
      return `${day}-${month}-${year}`
    } catch {
      return dateStr
    }
  }

  // Fetch marks on mount
  React.useEffect(() => {
    const fetchMarks = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/student-subjects/student/${student._id}`, {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        })
        if (!response.ok) throw new Error('Failed to load marks')
        const data = await response.json()
        console.log('Marks data received:', data)
        setSubjectRecords(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Marks fetch error:', error)
        setMarksError(error.message)
      } finally {
        setMarksLoading(false)
      }
    }
    fetchMarks()
  }, [student._id])

  if (marksLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
  }

  if (marksError) {
    return <div className="text-center py-8 text-red-600">{marksError}</div>
  }

  if (subjectRecords.length === 0) {
    return <div className="text-center py-8 text-gray-500">No marks recorded yet</div>
  }

  return (
    <div className="space-y-6">
      {subjectRecords.map((record, idx) => {
        let subjectName = 'Unknown Subject'
        
        // Handle different subject data formats
        if (record.subject) {
          if (typeof record.subject === 'string') {
            subjectName = record.subject
          } else if (record.subject.subjectName && typeof record.subject.subjectName === 'string') {
            subjectName = record.subject.subjectName
          } else if (record.subject.name && typeof record.subject.name === 'string') {
            subjectName = record.subject.name
          } else if (record.subject._id) {
            subjectName = `Subject ${idx + 1}`
          }
        } else {
          subjectName = `Subject ${idx + 1}`
        }
        
        return (
          <div key={idx} className="border rounded-lg p-4">
            <h5 className="font-semibold text-gray-900 mb-3">{subjectName}</h5>
            {record.marksPercentage && record.marksPercentage.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Exam Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Percentage</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {record.marksPercentage.map((mark, midx) => (
                      <tr key={midx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{formatDate(mark.examDate)}</td>
                        <td className="px-4 py-2 text-sm font-medium">{mark.percentage}%</td>
                        <td className="px-4 py-2 text-sm">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${mark.percentage >= 75 ? 'bg-green-500' : mark.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${mark.percentage}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No marks recorded</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [centers, setCenters] = useState([]);
  const [tutors, setTutors] = useState([]); // All tutors
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null); // For details/profile view
  
  // Center Change Modal States
  const [showChangeCenterModal, setShowChangeCenterModal] = useState(false);
  const [studentToChangeCenter, setStudentToChangeCenter] = useState(null);
  const [changeCenterData, setChangeCenterData] = useState({
    newCenterId: '',
    newTutorId: ''
  });
  const [changeCenterTutors, setChangeCenterTutors] = useState([]);
  const [loadingChangeCenterTutors, setLoadingChangeCenterTutors] = useState(false);
  const [isChangingCenter, setIsChangingCenter] = useState(false);
  const [centerSearchQuery, setCenterSearchQuery] = useState('');
  
  // Form Data
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
    assignedCenter: '',
    assignedTutor: '',
    remarks: '',
    homeAddress: '',
    schoolAddress: '',
    subjects: []
  });
  const [centerTutors, setCenterTutors] = useState([]);
  const [loadingCenterTutors, setLoadingCenterTutors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Helpers
  const getOrdinal = (n) => {
    let s = ["th", "st", "nd", "rd"];
    let v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatAadhar = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (!match) return value;
    return [match[1], match[2], match[3]].filter(Boolean).join(' ');
  };

  const getToken = () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData).token : null;
  };

  useEffect(() => {
    fetchStudents();
    fetchCenters();
    fetchTutors();
    fetchSubjects();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch students');
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/centers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCenters(data);
    } catch (err) {
      console.error('Failed to fetch centers');
    }
  };

  const fetchTutors = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tutors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTutors(data);
    } catch (err) {
      console.error('Failed to fetch tutors');
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch subjects');
    }
  };

  const fetchTutorsForCenter = async (centerId) => {
    if (!centerId) {
      setCenterTutors([]);
      return;
    }
    try {
      setLoadingCenterTutors(true);
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tutors/center/${centerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCenterTutors(Array.isArray(data) ? data : []);
      } else {
        setCenterTutors([]);
      }
    } catch (err) {
      console.error('Failed to fetch center tutors', err);
      toast.error('Failed to load tutors for the selected center');
    } finally {
      setLoadingCenterTutors(false);
    }
  };

  useEffect(() => {
    let filtered = [...students];

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(student => {
        if (student.name?.toLowerCase().includes(query)) return true;
        if (student.assignedCenter) {
          const centerName = typeof student.assignedCenter === 'object' ? student.assignedCenter.name : '';
          if (centerName?.toLowerCase().includes(query)) return true;
        }
        if (student.assignedTutor) {
          const tutorName = typeof student.assignedTutor === 'object' ? student.assignedTutor.name : '';
          if (tutorName?.toLowerCase().includes(query)) return true;
        }
        return false;
      });
    }

    if (selectedCenter) {
      filtered = filtered.filter(student => {
        const cId = student.assignedCenter?._id || student.assignedCenter;
        return cId === selectedCenter;
      });
    }

    if (selectedTutor) {
      filtered = filtered.filter(student => {
        const tId = student.assignedTutor?._id || student.assignedTutor;
        return tId === selectedTutor;
      });
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedCenter, selectedTutor, students]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'aadharNumber') {
      finalValue = formatAadhar(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    if (name === 'assignedCenter') {
      fetchTutorsForCenter(finalValue);
      setFormData(prev => ({ ...prev, assignedTutor: '' }));
    }
  };

  const openAddModal = () => {
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
      assignedCenter: '',
      assignedTutor: '',
      remarks: '',
      homeAddress: '',
      schoolAddress: '',
      subjects: []
    });
    setCenterTutors([]);
    setIsEditing(false);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (student, e) => {
    e.stopPropagation();
    const centerId = student.assignedCenter?._id || student.assignedCenter || '';
    
    // Extract subject IDs from student.subjects array (StudentSubject records)
    const subjectIds = student.subjects?.map(subj => {
      // Handle both populated and unpopulated cases
      if (subj.subject && subj.subject._id) {
        return subj.subject._id;
      } else if (subj.subject) {
        return subj.subject;
      }
      return null;
    }).filter(Boolean) || [];
    
    setFormData({
      _id: student._id,
      name: student.name || '',
      fatherName: student.fatherName || '',
      contact: student.contact || '',
      isOrphan: student.isOrphan || false,
      guardianName: student.guardianInfo?.name || '',
      guardianContact: student.guardianInfo?.contact || '',
      isNonSchoolGoing: student.isNonSchoolGoing || false,
      schoolName: student.schoolInfo?.name || '',
      class: student.schoolInfo?.class || '',
      gender: student.gender || '',
      medium: student.medium || '',
      aadharNumber: student.aadharNumber || '',
      assignedCenter: centerId,
      assignedTutor: student.assignedTutor?._id || student.assignedTutor || '',
      remarks: student.remarks || '',
      homeAddress: student.homeAddress || '',
      schoolAddress: student.schoolAddress || '',
      subjects: subjectIds
    });
    
    if (centerId) {
      fetchTutorsForCenter(centerId);
    } else {
      setCenterTutors([]);
    }
    
    setIsEditing(true);
    setFormError('');
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      if (!formData.assignedCenter) throw new Error('Please select a center');
      
      const cleanParentContact = formData.contact.replace(/\D/g, '');
      const cleanGuardianContact = formData.guardianContact.replace(/\D/g, '');
      const cleanAadhar = formData.aadharNumber.replace(/\s/g, '');

      if (!formData.isOrphan && cleanParentContact.length !== 10) {
        throw new Error('Parent contact must be 10 digits');
      }
      if (formData.isOrphan) {
        if (!formData.guardianName.trim()) throw new Error('Guardian name is required for orphans');
        if (cleanGuardianContact.length !== 10) throw new Error('Guardian contact must be 10 digits');
      }
      if (cleanAadhar && cleanAadhar.length !== 12) {
        throw new Error('Aadhaar number must be 12 digits');
      }

      const payload = {
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        contact: formData.contact.trim(),
        isOrphan: formData.isOrphan,
        isNonSchoolGoing: formData.isNonSchoolGoing,
        gender: formData.gender,
        medium: formData.medium,
        aadharNumber: formData.aadharNumber.trim(),
        assignedCenter: formData.assignedCenter,
        assignedTutor: formData.assignedTutor || null,
        remarks: formData.remarks.trim(),
        homeAddress: formData.homeAddress.trim(),
        schoolAddress: formData.schoolAddress.trim(),
        subjects: formData.subjects || []
      };

      if (formData.isOrphan) {
        payload.guardianInfo = {
          name: formData.guardianName.trim(),
          contact: formData.guardianContact.trim()
        };
        if (!payload.contact) payload.contact = payload.guardianInfo.contact;
      }

      if (!formData.isNonSchoolGoing) {
        payload.schoolInfo = {
          name: formData.schoolName.trim(),
          class: formData.class.trim()
        };
      }

      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL}/students/${formData._id}`
        : `${import.meta.env.VITE_API_URL}/students`;
      
      const method = isEditing ? 'PUT' : 'POST';
      const token = getToken();

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Operation failed');
      }

      toast.success(isEditing ? 'Student updated successfully' : 'Student created successfully');
      setShowFormModal(false);
      fetchStudents();
    } catch (err) {
      console.error('Submit error:', err);
      setFormError(err.message || 'An error occurred');
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (student, e) => {
    e.stopPropagation();
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/students/${studentToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      toast.success('Student deleted successfully');
      setShowDeleteModal(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Center Change Functions
  const openChangeCenterModal = (student, e) => {
    if (e) e.stopPropagation();
    setStudentToChangeCenter(student);
    setChangeCenterData({
      newCenterId: '',
      newTutorId: ''
    });
    setChangeCenterTutors([]);
    setCenterSearchQuery('');
    setShowChangeCenterModal(true);
  };

  const fetchTutorsForCenterChange = async (centerId) => {
    if (!centerId) {
      setChangeCenterTutors([]);
      return;
    }
    try {
      setLoadingChangeCenterTutors(true);
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tutors/center/${centerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChangeCenterTutors(Array.isArray(data) ? data : []);
      } else {
        setChangeCenterTutors([]);
      }
    } catch (err) {
      console.error('Failed to fetch center tutors', err);
      toast.error('Failed to load tutors for the selected center');
      setChangeCenterTutors([]);
    } finally {
      setLoadingChangeCenterTutors(false);
    }
  };

  const handleCenterChangeInput = async (e) => {
    const { name, value } = e.target;
    setChangeCenterData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'newCenterId') {
      // Reset tutor selection and fetch new tutors
      setChangeCenterData(prev => ({ ...prev, newTutorId: '' }));
      await fetchTutorsForCenterChange(value);
    }
  };

  const handleChangeCenterSubmit = async (e) => {
    e.preventDefault();
    
    if (!changeCenterData.newCenterId || !changeCenterData.newTutorId) {
      toast.error('Please select both center and tutor');
      return;
    }

    setIsChangingCenter(true);

    try {
      const token = getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/students/change-center/${studentToChangeCenter._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            assignedCenterId: changeCenterData.newCenterId,
            assignedTutorId: changeCenterData.newTutorId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change center');
      }

      toast.success('Student center and tutor updated successfully');
      setShowChangeCenterModal(false);
      setStudentToChangeCenter(null);
      setChangeCenterData({ newCenterId: '', newTutorId: '' });
      
      // Refresh the students list
      await fetchStudents();
      
      // If the student details modal is open, close it and reopen with updated data
      if (selectedStudent && selectedStudent._id === studentToChangeCenter._id) {
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error('Change center error:', err);
      toast.error(err.message || 'Failed to change center');
    } finally {
      setIsChangingCenter(false);
    }
  };

  // Filter centers based on search query
  const filteredCentersForChange = centers.filter(center => {
    if (!centerSearchQuery) return true;
    const query = centerSearchQuery.toLowerCase();
    return (
      center.name.toLowerCase().includes(query) ||
      (center.area && center.area.toLowerCase().includes(query))
    );
  });

  const handleExportCSV = () => {
    const csvData = students.map(student => ({
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
      'Assigned Center': student.assignedCenter?.name || '',
      'Assigned Tutor': student.assignedTutor?.name || '',
      'Home Address': student.homeAddress || '',
      'School Address': student.schoolAddress || '',
      'Remarks': student.remarks || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination Logic
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading students...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Student Management</h1>
          {hasWritePermission('students') && (
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <FiPlus className="mr-2" />
              Add Student
            </button>
          )}
        </div>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, center, or tutor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="w-[200px]">
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Centers</option>
                {centers.map(center => (
                  <option key={center._id} value={center._id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[200px]">
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Tutors</option>
                {tutors.map(tutor => (
                  <option key={tutor._id} value={tutor._id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <FiDownload className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 bg-white rounded-lg shadow-sm p-4">
          <AnimatePresence>
            {currentStudents.map((student) => (
              <motion.div
                key={student._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.gender} • {student.medium}</p>
                  </div>
                  {hasWritePermission('students') && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => openEditModal(student, e)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(student, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FiPhone className="text-blue-600 flex-shrink-0" />
                    <a href={`tel:${student.contact}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                      {student.contact}
                    </a>
                  </div>
                  
                  {student.assignedCenter && (
                    <div className="flex items-start gap-2 text-sm">
                      <FiMapPin className="text-gray-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-700">{student.assignedCenter.name}</div>
                        {student.assignedCenter.area && <div className="text-xs text-gray-400">{student.assignedCenter.area}</div>}
                      </div>
                    </div>
                  )}

                  {student.assignedTutor && (
                    <div className="flex items-start gap-2 text-sm">
                      <FiUser className="text-gray-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-700">{student.assignedTutor.name}</div>
                        <a href={`tel:${student.assignedTutor.phone}`} className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {student.assignedTutor.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {hasWritePermission('students') && (
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        onClick={(e) => openChangeCenterModal(student, e)}
                        className="w-full px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <FiMapPin size={14} />
                        Change Center
                      </button>
                    </div>
                  )}

                  {!student.isNonSchoolGoing && student.schoolInfo?.name && (
                    <div className="flex items-start gap-2 text-sm">
                      <FiBook className="text-gray-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-700">{student.schoolInfo.name}</div>
                        {student.schoolInfo.class && <div className="text-xs text-gray-400">Class {getOrdinal(student.schoolInfo.class)}</div>}
                      </div>
                    </div>
                  )}

                  {student.isNonSchoolGoing && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      <FiFileText size={12} />
                      Non-School Going
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {currentStudents.map((student) => (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {student.assignedCenter ? (
                            <div>
                              <div className="font-medium">{student.assignedCenter.name}</div>
                              <div className="text-xs text-gray-400">{student.assignedCenter.area}</div>
                            </div>
                          ) : 'Not Assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {student.assignedTutor ? (
                            <div>
                              <div className="font-medium">{student.assignedTutor.name}</div>
                              <a href={`tel:${student.assignedTutor.phone}`} className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{student.assignedTutor.phone}</a>
                            </div>
                          ) : 'Not Assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-3" onClick={(e) => e.stopPropagation()}>
                          {hasWritePermission('students') && (
                            <>
                              <button
                                onClick={(e) => openChangeCenterModal(student, e)}
                                className="text-green-600 hover:text-green-800 transition-colors"
                                title="Change Center"
                              >
                                <FiMapPin size={18} />
                              </button>
                              <button
                                onClick={(e) => openEditModal(student, e)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 size={18} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(student, e)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredStudents.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 border-t border-gray-200 space-y-4 md:space-y-0">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{indexOfFirstStudent + 1}</span> to <span className="font-medium">{Math.min(indexOfLastStudent, filteredStudents.length)}</span> of <span className="font-medium">{filteredStudents.length}</span> students
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                        onClick={() => paginate(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && !showFormModal && !showDeleteModal && (
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
                  <p className="text-sm text-gray-500 mt-1">ID: {selectedStudent._id}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <div><label className="block text-sm font-medium text-gray-700">Name</label><p className="mt-1">{selectedStudent.name}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Father's Name</label><p className="mt-1">{selectedStudent.fatherName}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Contact</label><p className="mt-1"><a href={`tel:${selectedStudent.contact}`} className="text-blue-600 hover:underline">{selectedStudent.contact}</a></p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Gender</label><p className="mt-1">{selectedStudent.gender}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Medium</label><p className="mt-1">{selectedStudent.medium}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Aadhar</label><p className="mt-1">{selectedStudent.aadharNumber}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Home Address</label><p className="mt-1">{selectedStudent.homeAddress || '-'}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">School Address</label><p className="mt-1">{selectedStudent.schoolAddress || '-'}</p></div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                  <div><label className="block text-sm font-medium text-gray-700">Orphan</label><p className="mt-1">{selectedStudent.isOrphan ? 'Yes' : 'No'}</p></div>
                  {selectedStudent.isOrphan && (
                    <>
                      <div><label className="block text-sm font-medium text-gray-700">Guardian</label><p className="mt-1">{selectedStudent.guardianInfo?.name}</p></div>
                      <div><label className="block text-sm font-medium text-gray-700">Guardian Contact</label><p className="mt-1"><a href={`tel:${selectedStudent.guardianInfo?.contact}`} className="text-blue-600 hover:underline">{selectedStudent.guardianInfo?.contact}</a></p></div>
                    </>
                  )}
                  <div><label className="block text-sm font-medium text-gray-700">School Status</label><p className="mt-1">{selectedStudent.isNonSchoolGoing ? 'Non-School Going' : 'School Going'}</p></div>
                  {!selectedStudent.isNonSchoolGoing && (
                    <>
                      <div><label className="block text-sm font-medium text-gray-700">School</label><p className="mt-1">{selectedStudent.schoolInfo?.name}</p></div>
                      <div><label className="block text-sm font-medium text-gray-700">Class</label><p className="mt-1">{selectedStudent.schoolInfo?.class}</p></div>
                    </>
                  )}
                  <div><label className="block text-sm font-medium text-gray-700">Center</label><p className="mt-1">{selectedStudent.assignedCenter?.name}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Tutor</label><p className="mt-1">{selectedStudent.assignedTutor?.name}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Remarks</label><p className="mt-1">{selectedStudent.remarks || 'No remarks'}</p></div>
                </div>
              </div>

              {/* Subjects Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Subjects</h3>
                {selectedStudent.subjects && selectedStudent.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.subjects.map((subj, idx) => {
                      const subjectName = subj.subject?.subjectName || subj.subject?.name || 'Unknown Subject';
                      return (
                        <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {subjectName}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No subjects assigned</p>
                )}
              </div>

              {/* Student Marks Section */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Academic Performance</h3>
                <StudentMarksDisplay student={selectedStudent} />
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                {hasWritePermission('students') && (
                  <>
                    <button
                      onClick={(e) => openChangeCenterModal(selectedStudent, e)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <FiMapPin className="mr-2" /> Change Center
                    </button>
                    <button
                      onClick={(e) => openEditModal(selectedStudent, e)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FiEdit2 className="mr-2" /> Edit
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showFormModal && (
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
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isEditing ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button
                  onClick={() => setShowFormModal(false)}
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

              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Center Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">
                      Assigned Center
                    </label>
                    <select
                      name="assignedCenter"
                      value={formData.assignedCenter}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Center</option>
                      {centers.map(center => (
                        <option key={center._id} value={center._id}>
                          {center.name} ({center.area})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Student Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Father's Name</label>
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${!formData.isOrphan ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}`}>Contact Number</label>
                    <input type="tel" name="contact" value={formData.contact} onChange={handleInputChange} maxLength="10" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required={!formData.isOrphan} />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 mt-6">
                      <input type="checkbox" name="isOrphan" checked={formData.isOrphan} onChange={handleInputChange} className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Orphan</span>
                    </label>
                  </div>

                  {formData.isOrphan && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Guardian Name</label>
                        <input type="text" name="guardianName" value={formData.guardianName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Guardian Contact</label>
                        <input type="tel" name="guardianContact" value={formData.guardianContact} onChange={handleInputChange} maxLength="10" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="flex items-center space-x-2 mt-6">
                      <input type="checkbox" name="isNonSchoolGoing" checked={formData.isNonSchoolGoing} onChange={handleInputChange} className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Non-School Going</span>
                    </label>
                  </div>

                  {!formData.isNonSchoolGoing && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">School Name</label>
                        <input type="text" name="schoolName" value={formData.schoolName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Class</label>
                        <select name="class" value={formData.class} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                          <option value="">Select Class</option>
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i + 1} value={getOrdinal(i + 1)}>{getOrdinal(i + 1)}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Medium</label>
                    <select name="medium" value={formData.medium} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                      <option value="">Select Medium</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Urdu">Urdu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Aadhar Number</label>
                    <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} maxLength="14" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Home Address</label>
                    <input type="text" name="homeAddress" value={formData.homeAddress} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>

                  {!formData.isNonSchoolGoing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">School Address</label>
                      <input type="text" name="schoolAddress" value={formData.schoolAddress} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                  )}

                  {/* Tutor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Tutor</label>
                    <select
                      name="assignedTutor"
                      value={formData.assignedTutor}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      disabled={!formData.assignedCenter || loadingCenterTutors}
                    >
                      <option value="">Select Tutor</option>
                      {centerTutors.map(tutor => (
                        <option key={tutor._id} value={tutor._id}>{tutor.name}</option>
                      ))}
                    </select>
                    {loadingCenterTutors && <p className="text-xs text-gray-500 mt-1">Loading tutors...</p>}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects
                  </label>
                  {subjects.filter(s => s.isActive !== false).length === 0 ? (
                    <div className="text-sm text-gray-500">No active subjects available</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {subjects.filter(s => s.isActive !== false).map(subject => (
                        <label key={subject._id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subject._id)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                subjects: isChecked
                                  ? [...prev.subjects, subject._id]
                                  : prev.subjects.filter(id => id !== subject._id)
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{subject.subjectName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {formData.subjects.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      Selected: {formData.subjects.length} of {subjects.filter(s => s.isActive !== false).length} active subject{subjects.filter(s => s.isActive !== false).length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                </div>

                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400" disabled={isSubmitting}>
                    {isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Student' : 'Add Student')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && studentToDelete && (
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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <FiTrash2 className="text-red-600 text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Student</h3>
                <p className="text-gray-500 text-center mb-6">
                  Are you sure you want to delete {studentToDelete.name}? This action cannot be undone.
                </p>
                <div className="flex space-x-4 w-full">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Center Modal */}
      <AnimatePresence>
        {showChangeCenterModal && studentToChangeCenter && (
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
              className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Change Assigned Center
                  </h2>
                  <p className="text-base text-gray-700 mt-2">
                    Student: <span className="font-semibold">{studentToChangeCenter.name}</span>
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                    <FiMapPin className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Current: {studentToChangeCenter.assignedCenter?.name || 'None'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowChangeCenterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleChangeCenterSubmit} className="space-y-6">
                {/* Center Selection with Search */}
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3 after:content-['*'] after:ml-0.5 after:text-red-500">
                    Select New Center
                  </label>
                  <div className="relative mb-3">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search centers by name or area..."
                      value={centerSearchQuery}
                      onChange={(e) => setCenterSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                    />
                  </div>
                  
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                    {filteredCentersForChange.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-lg">No centers found</p>
                        <p className="text-sm mt-1">Try adjusting your search</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredCentersForChange.map(center => {
                          const isCurrentCenter = center._id === (studentToChangeCenter.assignedCenter?._id || studentToChangeCenter.assignedCenter);
                          const isSelected = changeCenterData.newCenterId === center._id;
                          
                          return (
                            <div
                              key={center._id}
                              onClick={() => !isCurrentCenter && handleCenterChangeInput({ target: { name: 'newCenterId', value: center._id } })}
                              className={`p-4 cursor-pointer transition-all ${
                                isCurrentCenter
                                  ? 'bg-blue-50 cursor-not-allowed opacity-60'
                                  : isSelected
                                  ? 'bg-green-50 border-l-4 border-green-600'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                      {center.name}
                                    </h4>
                                    {isCurrentCenter && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Current
                                      </span>
                                    )}
                                    {isSelected && !isCurrentCenter && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                  {center.area && (
                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                      <FiMapPin className="h-3 w-3" />
                                      {center.area}
                                    </p>
                                  )}
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isCurrentCenter
                                    ? 'border-blue-400 bg-blue-100'
                                    : isSelected
                                    ? 'border-green-600 bg-green-600'
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && !isCurrentCenter && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    Showing {filteredCentersForChange.length} of {centers.length} centers
                  </p>
                </div>

                {/* Tutor Selection */}
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3 after:content-['*'] after:ml-0.5 after:text-red-500">
                    Select New Tutor
                  </label>
                  <select
                    name="newTutorId"
                    value={changeCenterData.newTutorId}
                    onChange={handleCenterChangeInput}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                    disabled={!changeCenterData.newCenterId || loadingChangeCenterTutors}
                    required
                  >
                    <option value="">
                      {!changeCenterData.newCenterId
                        ? 'Select a center first'
                        : loadingChangeCenterTutors
                        ? 'Loading tutors...'
                        : changeCenterTutors.length === 0
                        ? 'No tutors available in this center'
                        : 'Select a tutor'}
                    </option>
                    {changeCenterTutors.map(tutor => (
                      <option key={tutor._id} value={tutor._id}>
                        {tutor.name} {tutor.phone ? `(${tutor.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  {loadingChangeCenterTutors && (
                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500"></div>
                      Loading tutors for selected center...
                    </p>
                  )}
                  {!loadingChangeCenterTutors && changeCenterData.newCenterId && changeCenterTutors.length === 0 && (
                    <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      ⚠️ No tutors found in this center. You may need to assign tutors to this center first.
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong className="font-semibold">Note:</strong> Changing the center will update both the assigned center and tutor for this student. The selected tutor must belong to the chosen center.
                  </p>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowChangeCenterModal(false)}
                    className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isChangingCenter}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-lg"
                    disabled={isChangingCenter || !changeCenterData.newCenterId || !changeCenterData.newTutorId}
                  >
                    {isChangingCenter ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiMapPin className="h-5 w-5" />
                        Change Center & Tutor
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentManagement;