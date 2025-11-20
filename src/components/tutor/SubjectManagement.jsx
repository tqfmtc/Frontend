import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBook, 
  FiUsers, 
  FiSearch, 
  FiX,
  FiLoader,
  FiSave
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import useGet from '../CustomHooks/useGet';

// Array of colors for random book icons
const BOOK_COLORS = [
  'from-red-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-pink-500',
  'from-yellow-500 to-orange-500',
  'from-indigo-500 to-blue-500',
  'from-rose-500 to-pink-500',
  'from-teal-500 to-green-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-purple-500'
];

// Function to get consistent color for a subject based on its ID
const getColorForSubject = (subjectId) => {
  const charCode = subjectId.charCodeAt(subjectId.length - 1);
  return BOOK_COLORS[charCode % BOOK_COLORS.length];
};

const SubjectManagement = () => {
  // State management
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [tutorCenterId, setTutorCenterId] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

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

  useEffect(() => {
    if (subjectsData) setSubjects(subjectsData);
    if (studentsData) setStudents(studentsData);
    setLoading(subjectsLoading);

    // Get tutor's center ID from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData.assignedCenter?._id) {
          setTutorCenterId(parsedData.assignedCenter._id);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [subjectsData, studentsData, subjectsLoading]);

  // Filter subjects based on search
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    return subjects.filter(subject =>
      subject.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subjects, searchQuery]);

  // Handle adding students to subject
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

      const requestBody = {
        subjectId: selectedSubject._id,
        studentIds: selectedStudents.filter(id => 
          !selectedSubject.students?.some(student => student._id === id)
        )
      };

      // Don't proceed if no new students to add
      if (requestBody.studentIds.length === 0) {
        toast.info('No new students to add');
        return;
      }

      console.log('Adding students with payload:', requestBody);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/subjects/add-students`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.message || errorData || errorMessage;
        } catch (e) {
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

      toast.success('Students added to subject successfully!');
      refetchSubjects();
      closeModal();
    } catch (error) {
      console.error('Error details:', error);
      toast.error(error.message ? `Failed to add students: ${error.message}` : 'Failed to add students');
    } finally {
      setFormLoading(false);
    }
  };

  // Modal handlers
  const openModal = (subject) => {
    setSelectedSubject(subject);
    setSelectedStudents([]);
    // Pre-select already enrolled students from center
    if (subject.students && subject.students.length > 0) {
      setSelectedStudents(subject.students.map(s => s._id || s));
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubject(null);
    setSelectedStudents([]);
  };

  // View modal handlers
  const openViewModal = (subject) => {
    setSelectedSubject(subject);
    setIsViewModalOpen(true);
    fetchSubjectByCenter(subject._id);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedSubject(null);
  };

  // Fetch subject details filtered by center
  const fetchSubjectByCenter = async (subjectId) => {
    try {
      if (!tutorCenterId) {
        toast.error('Center information not found');
        return;
      }

      setViewLoading(true);
      const token = getToken();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/subjects/${subjectId}/${tutorCenterId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subject details');
      }

      const data = await response.json();
      setSelectedSubject(data);
    } catch (error) {
      console.error('Error fetching subject by center:', error);
      toast.error(error.message || 'Failed to load subject details');
    } finally {
      setViewLoading(false);
    }
  };

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
            <FiBook className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subject Management</h1>
            <p className="text-gray-600 text-sm">Manage subjects and add students</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
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

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {filteredSubjects.map((subject, index) => {
            const gradient = getColorForSubject(subject._id);
            return (
              <motion.div
                key={subject._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => openViewModal(subject)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-200"
              >
                {/* Card Header with Icon */}
                <div className={`bg-gradient-to-br ${gradient} p-6 flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-white/20 group-hover:scale-110 transition-transform duration-300"></div>
                  </div>
                  <div className="relative z-10">
                    <FiBook className="w-16 h-16 text-white drop-shadow-lg" />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{subject.subjectName}</h3>
                  
                  {/* Students Count
                  <div className="flex items-center text-gray-600 mb-4">
                    <FiUsers className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm">
                      {subject.students?.length || 0} student{(subject.students?.length || 0) !== 1 ? 's' : ''} enrolled
                    </span>
                  </div> */}

                  {/* Add Students Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(subject);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <FiUsers className="w-4 h-4" />
                    Add Students
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <FiBook className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try a different search query.' : 'No subjects available at the moment.'}
          </p>
        </div>
      )}

      {/* View Students Modal */}
      {isViewModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-lg font-semibold text-gray-800">
                <span className="text-blue-600">{selectedSubject.subjectName}</span> - Enrolled Students
              </h2>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {viewLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading students...</span>
                </div>
              ) : selectedSubject.students && selectedSubject.students.length > 0 ? (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      Total: <span className="font-bold">{selectedSubject.students.length}</span> student{selectedSubject.students.length !== 1 ? 's' : ''} from your center enrolled
                    </p>
                  </div>
                  <div className="space-y-2">
                    {selectedSubject.students.map((student, idx) => (
                      <div
                        key={student._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm mr-3 flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{student.name}</div>
                            <div className="text-sm text-gray-500 truncate">{student.email}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h3 className="text-sm font-medium text-gray-900">No students enrolled</h3>
                  <p className="mt-1 text-sm text-gray-500">Add students from your center to this subject using the Add Students button.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Students Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Add Students to <span className="text-blue-600">{selectedSubject?.subjectName}</span>
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Students Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Students to Add *
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                  {students.length > 0 ? (
                    <div className="space-y-2">
                      {students.map(student => {
                        const isAlreadyEnrolled = selectedSubject?.students?.some(s => s._id === student._id);
                        return (
                          <label
                            key={student._id}
                            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              isAlreadyEnrolled 
                                ? 'bg-green-50 border border-green-200' 
                                : 'hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={() => handleStudentSelect(student._id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {student.name}
                                {isAlreadyEnrolled && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full inline-block">
                                    Already enrolled
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 truncate">{student.email}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No students available</p>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || selectedStudents.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {formLoading ? (
                    <>
                      <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 mr-2" />
                      Add Students
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
