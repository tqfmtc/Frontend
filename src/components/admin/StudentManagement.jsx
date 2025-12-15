import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiEdit2, FiTrash2, FiSearch, FiPlus, FiX, FiDownload, FiCalendar, FiBook, FiMapPin, FiFileText, FiBarChart2 } from 'react-icons/fi';
import { BiIdCard } from 'react-icons/bi';
import useGet from '../CustomHooks/useGet';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

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

const StudentManagement = ({ permissions }) => {
  const [students, setStudents] = useState([]);
  const [addedStudents, setAddedStudents] = useState([]); // For write-only mode
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [centers, setCenters] = useState([]);
  const [tutors, setTutors] = useState([]); // All tutors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null); // For details/profile view
  
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
    schoolAddress: ''
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
  }, []);

  const fetchStudents = async () => {
    if (!permissions?.read) {
      if (permissions?.write) {
        setStudents(addedStudents);
        setFilteredStudents(addedStudents);
      }
      setLoading(false);
      return;
    }

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
      schoolAddress: ''
    });
    setCenterTutors([]);
    setIsEditing(false);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (student, e) => {
    e.stopPropagation();
    const centerId = student.assignedCenter?._id || student.assignedCenter || '';
    
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
      schoolAddress: student.schoolAddress || ''
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
        schoolAddress: formData.schoolAddress.trim()
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
      
      if (!isEditing && !permissions?.read && permissions?.write) {
        const newStudent = data.student || data;
        setAddedStudents(prev => [...prev, newStudent]);
        setStudents(prev => [...prev, newStudent]);
        setFilteredStudents(prev => [...prev, newStudent]);
      } else {
        fetchStudents();
      }
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
          {permissions?.write && (
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <FiPlus className="mr-2" />
            Add Student
          </button>
          )}
        </div>

        {/* Write Only Disclaimer */}
        {!permissions?.read && permissions?.write && (
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md">
            <p className="font-bold">Write Only Access</p>
            <p>You can only add new entries. You cannot view existing entries except for the ones you just added. Refreshing the page will clear the list.</p>
          </div>
        )}
        
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

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                              <div className="text-xs text-gray-400">{student.assignedTutor.phone}</div>
                            </div>
                          ) : 'Not Assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-3" onClick={(e) => e.stopPropagation()}>
                          {permissions?.write && (
                            <>
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
                  <div><label className="block text-sm font-medium text-gray-700">Contact</label><p className="mt-1">{selectedStudent.contact}</p></div>
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
                      <div><label className="block text-sm font-medium text-gray-700">Guardian Contact</label><p className="mt-1">{selectedStudent.guardianInfo?.contact}</p></div>
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

              {/* Student Marks Section */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Academic Performance</h3>
                <StudentMarksDisplay student={selectedStudent} />
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={(e) => openEditModal(selectedStudent, e)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FiEdit2 className="mr-2" /> Edit
                </button>
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">Home Address</label>
                    <textarea name="homeAddress" value={formData.homeAddress} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="2" required maxLength="200"></textarea>
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500">School Address</label>
                        <textarea name="schoolAddress" value={formData.schoolAddress} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="2" required></textarea>
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
    </div>
  );
};

export default StudentManagement;