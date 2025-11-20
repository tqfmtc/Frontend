import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBook, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiUsers, 
  FiUserCheck, 
  FiSearch, 
  FiX,
  FiLoader,
  FiSave,
  FiEye
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import useGet from '../CustomHooks/useGet';

const SubjectManagement = () => {
  // State management
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view', 'add-students', 'add-tutors'
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state - using 'subjectName' to match schema
  const [formData, setFormData] = useState({
    subjectName: '',
    students: [],
    tutors: []
  });

  // Get token from localStorage
  const getToken = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        return parsedData.token;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return localStorage.getItem('token');
  };

  // Fetch data using custom hook
  const { response: subjectsData, loading: subjectsLoading, error: subjectsError, refetch: refetchSubjects } = useGet('/subjects');
  const { response: studentsData } = useGet('/students');
  const { response: tutorsData } = useGet('/tutors');

  useEffect(() => {
    if (subjectsData) setSubjects(subjectsData);
    if (studentsData) setStudents(studentsData);
    if (tutorsData) setTutors(tutorsData);
    setLoading(subjectsLoading);
  }, [subjectsData, studentsData, tutorsData, subjectsLoading]);

  // Filter subjects based on search
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    return subjects.filter(subject =>
      subject.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subjects, searchQuery]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let response;
      let requestBody;
      
      if (modalMode === 'create') {
        // Create new subject
        requestBody = {
          subjectName: formData.subjectName.trim()
        };
        
        // Include students and tutors if selected
        if (formData.students.length > 0) {
          requestBody.students = formData.students;
        }
        if (formData.tutors.length > 0) {
          requestBody.tutors = formData.tutors;
        }

        console.log('Creating subject with payload:', requestBody);
        
        response = await fetch(`${import.meta.env.VITE_API_URL}/subjects`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });
      } else if (modalMode === 'edit') {
        // Update subject
        requestBody = {
          subjectName: formData.subjectName.trim(),
          students: formData.students,
          tutors: formData.tutors
        };

        console.log('Updating subject with payload:', requestBody);
        
        response = await fetch(`${import.meta.env.VITE_API_URL}/subjects/${selectedSubject._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(requestBody)
        });
      } else if (modalMode === 'add-students') {
        requestBody = {
          subjectId: selectedSubject._id,
          studentIds: formData.students
        };

        console.log('Adding students with payload:', requestBody);
        
        response = await fetch(`${import.meta.env.VITE_API_URL}/subjects/add-students`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });
      } else if (modalMode === 'add-tutors') {
        requestBody = {
          subjectId: selectedSubject._id,
          tutorIds: formData.tutors
        };

        console.log('Adding tutors with payload:', requestBody);
        
        response = await fetch(`${import.meta.env.VITE_API_URL}/subjects/add-tutors`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });
      }

      // Log response details for debugging
      console.log('Response status:', response.status);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.message || errorData || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.log('Error response text:', errorText);
            if (errorText) errorMessage = errorText;
          } catch (textError) {
            console.log('Could not parse error response');
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success response:', result);
      
      toast.success(`Subject ${modalMode === 'create' ? 'created' : modalMode === 'edit' ? 'updated' : modalMode === 'add-students' ? 'students added' : 'tutors added'} successfully!`);
      
      // Refresh subjects list
      refetchSubjects();
      closeModal();
    } catch (error) {
      console.error('Error details:', error);
      toast.error(error.message ? `Failed to ${modalMode} subject: ${error.message}` : `Failed to ${modalMode} subject`);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData || errorMessage;
        } catch (e) {
          // Ignore JSON parsing error for delete
        }
        throw new Error(errorMessage);
      }

      toast.success('Subject deleted successfully!');
      refetchSubjects();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message ? `Failed to delete subject: ${error.message}` : 'Failed to delete subject');
    }
  };

  // Modal handlers
  const openModal = (mode, subject = null) => {
    setModalMode(mode);
    setSelectedSubject(subject);
    
    if (mode === 'create') {
      setFormData({ subjectName: '', students: [], tutors: [] });
    } else if (mode === 'edit' && subject) {
      setFormData({
        subjectName: subject.subjectName || '',
        students: subject.students?.map(s => s._id) || [],
        tutors: subject.tutors?.map(t => t._id) || []
      });
    } else if (mode === 'add-students' || mode === 'add-tutors') {
      setFormData({ subjectName: '', students: [], tutors: [] });
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubject(null);
    setFormData({ subjectName: '', students: [], tutors: [] });
  };

  // Handle multi-select
  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(id => id !== value)
        : [...prev[field], value]
    }));
  };

  // Validation
  const isFormValid = () => {
    if (modalMode === 'create' || modalMode === 'edit') {
      return formData.subjectName.trim().length > 0;
    } else if (modalMode === 'add-students') {
      return formData.students.length > 0;
    } else if (modalMode === 'add-tutors') {
      return formData.tutors.length > 0;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading subjects...</span>
      </div>
    );
  }

  if (subjectsError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{subjectsError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
            <FiBook className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subject Management</h1>
            <p className="text-gray-600">Manage subjects, students, and tutors</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
        >
          <FiPlus className="mr-2" />
          Add Subject
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Subjects List */}
        {filteredSubjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutors
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubjects.map((subject) => (
                  <tr key={subject._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 mr-3">
                          <FiBook className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {subject.subjectName}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiUsers className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {subject.students?.length || 0} students
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiUserCheck className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {subject.tutors?.length || 0} tutors
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(subject.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal('view', subject)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', subject)}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                          title="Edit Subject"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal('add-students', subject)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Add Students"
                        >
                          <FiUsers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal('add-tutors', subject)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Add Tutors"
                        >
                          <FiUserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Subject"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FiBook className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new subject.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalMode === 'create' && 'Create New Subject'}
                {modalMode === 'edit' && 'Edit Subject'}
                {modalMode === 'view' && 'Subject Details'}
                {modalMode === 'add-students' && 'Add Students to Subject'}
                {modalMode === 'add-tutors' && 'Add Tutors to Subject'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Subject Name */}
              {(modalMode === 'create' || modalMode === 'edit') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter subject name"
                  />
                </div>
              )}

              {/* View Mode - Display current data */}
              {modalMode === 'view' && selectedSubject && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                    <p className="text-gray-900">{selectedSubject.subjectName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Students ({selectedSubject.students?.length || 0})</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubject.students?.map(student => (
                        <span key={student._id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {student.name}
                        </span>
                      )) || <span className="text-gray-500">No students assigned</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tutors ({selectedSubject.tutors?.length || 0})</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubject.tutors?.map(tutor => (
                        <span key={tutor._id} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {tutor.name}
                        </span>
                      )) || <span className="text-gray-500">No tutors assigned</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Students Selection */}
              {(modalMode === 'create' || modalMode === 'edit' || modalMode === 'add-students') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Students {modalMode === 'add-students' && '(Additional)'}
                    {modalMode === 'add-students' && ' *'}
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {students.length > 0 ? students.map(student => (
                      <label key={student._id} className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.students.includes(student._id)}
                          onChange={() => handleMultiSelect('students', student._id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </label>
                    )) : (
                      <p className="text-gray-500 text-sm">No students available</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.students.length} student{formData.students.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              {/* Tutors Selection */}
              {(modalMode === 'create' || modalMode === 'edit' || modalMode === 'add-tutors') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tutors {modalMode === 'add-tutors' && '(Additional)'}
                    {modalMode === 'add-tutors' && ' *'}
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {tutors.length > 0 ? tutors.map(tutor => (
                      <label key={tutor._id} className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tutors.includes(tutor._id)}
                          onChange={() => handleMultiSelect('tutors', tutor._id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{tutor.name}</div>
                          <div className="text-sm text-gray-500">{tutor.email}</div>
                        </div>
                      </label>
                    )) : (
                      <p className="text-gray-500 text-sm">No tutors available</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.tutors.length} tutor{formData.tutors.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {modalMode !== 'view' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading || !isFormValid()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? (
                      <>
                        <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4 mr-2" />
                        {modalMode === 'create' ? 'Create Subject' : 
                         modalMode === 'edit' ? 'Update Subject' :
                         modalMode === 'add-students' ? 'Add Students' : 'Add Tutors'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
