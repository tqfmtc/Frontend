import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiEdit2, FiTrash2, FiSearch, FiPlus, FiX, FiDownload, FiCalendar, FiBook, FiMapPin, FiFileText } from 'react-icons/fi';
import { BiIdCard } from 'react-icons/bi';
import useGet from '../CustomHooks/useGet';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

const StudentManagement = () => {
  const [editingStudent, setEditingStudent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [error, setError] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10;

  const { response: students, loading, error: studentsError } = useGet("/students", refreshKey);
  const { response: centers } = useGet("/centers");

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    center: '',
    grade: '',
    subjects: []
  });
  
  // CSV Export Function
  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      toast.error('No student data to export');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for CSV with all student fields
      const data = students.map(student => {
        // Get center name regardless of format
        const centerName = student.assignedCenter?.name || 
                         (typeof student.assignedCenter === 'string' ? student.assignedCenter : 'Not Assigned');
        
        return {
          'Student Name': student.name || '',
          'Father Name': student.fatherName || '',
          'Contact': student.contact || student.phone || '',
          'Gender': student.gender || '',
          'Medium': student.medium || '',
          'Is Orphan': student.isOrphan ? 'Yes' : 'No',
          'Guardian Name': student.guardianInfo?.name || '',
          'Guardian Contact': student.guardianInfo?.contact || '',
          'Is Non-School Going': student.isNonSchoolGoing ? 'Yes' : 'No',
          'School Name': student.schoolInfo?.name || '',
          'Class/Grade': student.schoolInfo?.class || student.grade || '',
          'Aadhar Number': student.aadharNumber || '',
          'Assigned Center': centerName,
          'Remarks': student.remarks || '',
          'Created Date': student.createdAt ? new Date(student.createdAt).toLocaleString('en-GB') : ''
        };
      });
      
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Students_Data_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Student data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      center: student.center?._id || '',
      grade: student.grade,
      subjects: student.subjects || []
    });
    setShowForm(true);
  };

  const handleFormClose = () => {
    if (Object.values(formData).some(value => value !== '')) {
      setShowConfirmClose(true);
    } else {
      setShowForm(false);
      setEditingStudent(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      center: '',
      grade: '',
      subjects: []
    });
  };

  const confirmClose = () => {
    setShowForm(false);
    setShowConfirmClose(false);
    setEditingStudent(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShowErrorAlert(false);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.center || !formData.grade) {
        setError('Please fill in all required fields');
        setShowErrorAlert(true);
        setIsSubmitting(false);
        return;
      }

      const userDataString = localStorage.getItem('userData');
      const token = userDataString ? JSON.parse(userDataString).token : null;
      if (!token) {
        setError('Please login to continue');
        setShowErrorAlert(true);
        setIsSubmitting(false);
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
        return;
      }

      const url = editingStudent 
        ? `${process.env.REACT_APP_API_URL}/api/students/${editingStudent._id}`
        : `${process.env.REACT_APP_API_URL}/api/students`;

      const response = await fetch(url, {
        method: editingStudent ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save student');
      }

      toast.success(editingStudent ? 'Student updated successfully!' : 'Student added successfully!');
      setShowForm(false);
      setEditingStudent(null);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      setError(error.message);
      setShowErrorAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (student) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    
    setIsDeleting(true);
    try {
      const userDataString = localStorage.getItem('userData');
      const token = userDataString ? JSON.parse(userDataString).token : null;
      if (!token) {
        setError('Please login to continue');
        setShowErrorAlert(true);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/students/${studentToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete student');
      }

      toast.success('Student deleted successfully!');
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      setError(error.message);
      setShowErrorAlert(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStudentProfile = (student) => (
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student Profile
            </h2>
            <p className="text-sm text-gray-500 mt-1">Student ID: {student._id}</p>
          </div>
          <button
            onClick={() => setShowProfile(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Student header with photo placeholder */}
          <div className="flex flex-col sm:flex-row sm:items-center border-b pb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-medium">
              {student.name?.charAt(0) || '?'}
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6">
              <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
              <div className="mt-1 flex flex-wrap items-center text-sm text-gray-600 gap-x-4">
                {student.gender && (
                  <span className="inline-flex items-center">
                    <FiUser className="mr-1" /> {student.gender}
                  </span>
                )}
                {(student.grade || student.schoolInfo?.class) && (
                  <span className="inline-flex items-center">
                    <FiBook className="mr-1" /> Grade {student.grade || student.schoolInfo?.class}
                  </span>
                )}
                {student.medium && (
                  <span className="border border-gray-200 rounded-full px-2 py-0.5 text-xs">
                    {student.medium} Medium
                  </span>
                )}
                {student.isOrphan && (
                  <span className="bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-xs font-medium">
                    Orphan
                  </span>
                )}
                {student.isNonSchoolGoing && (
                  <span className="bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 text-xs font-medium">
                    Non-School Going
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Main information grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Personal Information */}
            <div className="md:col-span-1 space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Personal Information</h4>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 flex items-center"><FiUser className="mr-1" /> Father's Name</p>
                <p className="font-medium">{student.fatherName || 'Not provided'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 flex items-center"><FiPhone className="mr-1" /> Contact</p>
                <p className="font-medium">{student.contact || student.phone || 'Not provided'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 flex items-center"><BiIdCard className="mr-1" /> Aadhar Number</p>
                <p className="font-medium">{student.aadharNumber || 'Not provided'}</p>
              </div>
              
              {/* Guardian Info (if exists) */}
              {student.guardianInfo && (student.guardianInfo.name || student.guardianInfo.contact) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center"><FiUser className="mr-1" /> Guardian Information</p>
                  {student.guardianInfo.name && <p className="font-medium">Name: {student.guardianInfo.name}</p>}
                  {student.guardianInfo.contact && <p className="text-sm">Contact: {student.guardianInfo.contact}</p>}
                </div>
              )}
            </div>
            
            {/* Education & Center Information */}
            <div className="md:col-span-1 space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Education & Center</h4>
              
              {/* School Information */}
              {(!student.isNonSchoolGoing && student.schoolInfo) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center"><FiBook className="mr-1" /> School Information</p>
                  {student.schoolInfo.name && <p className="font-medium">School: {student.schoolInfo.name}</p>}
                  {student.schoolInfo.class && <p className="text-sm">Class: {student.schoolInfo.class}</p>}
                </div>
              )}
              
              {/* Center Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 flex items-center"><FiMapPin className="mr-1" /> Center</p>
                <p className="font-medium">
                  {student.assignedCenter?.name || 
                   (typeof student.assignedCenter === 'string' ? student.assignedCenter : 'Not assigned')}
                </p>
              </div>
              
              {/* No longer displaying tutor information as per requirements */}
            </div>
            
            {/* Additional Information */}
            <div className="md:col-span-1 space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Additional Information</h4>
              
              {/* Registration Date */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 flex items-center"><FiCalendar className="mr-1" /> Registration Date</p>
                <p className="font-medium">{student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB') : 'Unknown'}</p>
              </div>
              
              {/* Remarks */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 flex items-center"><FiFileText className="mr-1" /> Remarks</p>
                <p className="font-medium whitespace-pre-wrap">{student.remarks || 'No remarks'}</p>
              </div>
            </div>
          </div>
          
          {/* Attendance History Section */}
          {student.attendance && student.attendance.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-4">Attendance History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present Days</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {student.attendance.map((record, idx) => {
                      const percentage = record.totalDays > 0 
                        ? Math.round((record.presentDays / record.totalDays) * 100) 
                        : 0;
                        
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{record.month}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{record.presentDays}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{record.totalDays}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              <span className="mr-2">{percentage}%</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full ${percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* No footer with action buttons as requested */}
      </motion.div>
    </motion.div>
  );

  const renderDeleteConfirm = () => (
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
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this student? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading students...</span>
      </div>
    );
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
                  Please <a href="/admin" className="text-blue-600 hover:text-blue-500">login</a> to view students
                </>
              ) : (
                studentsError
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!students || !Array.isArray(students)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No students found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>There are no students in the system yet.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredStudents = students.filter(student => {
    if (!student) return false;

    const studentName = student.name || '';
    const studentEmail = student.email || '';
    const studentPhone = student.phone || '';
    const studentGrade = student.grade || '';

    const matchesSearch = searchTerm === '' ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentPhone.includes(searchTerm) ||
      studentGrade.toString().includes(searchTerm);

    // Use assignedCenter for filtering
    const matchesCenter = selectedCenter === '' ||
      (student.assignedCenter && (
        (typeof student.assignedCenter === 'string' && student.assignedCenter === selectedCenter) ||
        (typeof student.assignedCenter === 'object' && student.assignedCenter._id === selectedCenter)
      ));

    return matchesSearch && matchesCenter;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 p-6">
      {showErrorAlert && error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Student Details
        </h1>
        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !students || students.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="mr-2" />
            {isLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              {centers?.map(center => (
                <option key={center._id} value={center._id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStudents.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => !isLoading && setShowProfile(student)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium">
                        {student.name?.charAt(0) || '?'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">
                          Grade {student.grade || student.class || student.schoolInfo?.class || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.phone || student.contact || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.assignedCenter?.name || student.assignedCenter || 'Not assigned'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, filteredStudents.length)}
              </span>{' '}
              of <span className="font-medium">{filteredStudents.length}</span> results
            </span>
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showProfile && renderStudentProfile(showProfile)}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && renderDeleteConfirm()}
      </AnimatePresence>
    </div>
  );
};

export default StudentManagement; 