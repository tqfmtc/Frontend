import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiX, FiDownload } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [centers, setCenters] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchCenters();
    fetchTutors();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/centers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCenters(data);
    } catch (err) {
      console.error('Failed to fetch centers');
    }
  };

  const fetchTutors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tutors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTutors(data);
    } catch (err) {
      console.error('Failed to fetch tutors');
    }
  };

  useEffect(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(student => {
        // Search in student name
        if (student.name?.toLowerCase().includes(query)) return true;
        
        // Search in center name and area
        if (student.assignedCenter) {
          if (student.assignedCenter.name?.toLowerCase().includes(query)) return true;
          if (student.assignedCenter.area?.toLowerCase().includes(query)) return true;
        }
        
        // Search in tutor name
        if (student.assignedTutor?.name?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }

    // Apply center filter
    if (selectedCenter) {
      filtered = filtered.filter(student => student.assignedCenter?._id === selectedCenter);
    }

    // Apply tutor filter
    if (selectedTutor) {
      filtered = filtered.filter(student => student.assignedTutor?._id === selectedTutor);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, selectedCenter, selectedTutor, students]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCenter('');
    setSelectedTutor('');
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
  };

  const handleExportCSV = () => {
    // Prepare the data for CSV export
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
      'Remarks': student.remarks || ''
    }));

    // Convert to CSV
    const csv = Papa.unparse(csvData);

    // Create a blob and download link
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">Students</h1>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search Input */}
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

            {/* Center Filter */}
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

            {/* Tutor Filter */}
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

            {/* Clear Filters Button */}
            {(searchQuery || selectedCenter || selectedTutor) && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiX className="mr-2" />
                Clear Filters
              </button>
            )}

            {/* Export CSV Button */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredStudents.map((student) => (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleStudentClick(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {student.assignedCenter ? (
                            <div>
                              <div className="font-medium">{student.assignedCenter.name}</div>
                              <div className="text-xs text-gray-400">{student.assignedCenter.area}</div>
                            </div>
                          ) : (
                            'Not Assigned'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {student.assignedTutor ? (
                            <div>
                              <div className="font-medium">{student.assignedTutor.name}</div>
                              <div className="text-xs text-gray-400">{student.assignedTutor.phone}</div>
                            </div>
                          ) : (
                            'Not Assigned'
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student Name</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.fatherName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.contact}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medium</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.medium}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.aadharNumber}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Orphan Status</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.isOrphan ? 'Yes' : 'No'}</p>
                  </div>
                  {selectedStudent.isOrphan && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                        <p className="mt-1 text-gray-900">{selectedStudent.guardianInfo?.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Guardian Contact</label>
                        <p className="mt-1 text-gray-900">{selectedStudent.guardianInfo?.contact}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">School Going Status</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.isNonSchoolGoing ? 'Non-School Going' : 'School Going'}</p>
                  </div>
                  {!selectedStudent.isNonSchoolGoing && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">School Name</label>
                        <p className="mt-1 text-gray-900">{selectedStudent.schoolInfo?.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Class</label>
                        <p className="mt-1 text-gray-900">{selectedStudent.schoolInfo?.class}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Center</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.assignedCenter?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Tutor</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.assignedTutor?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.remarks || 'No remarks'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
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
    </div>
  );
};

export default Students; 