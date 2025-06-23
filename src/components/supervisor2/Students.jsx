import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';

const Students = () => {
  const { response: students, loading, error } = useGet('/students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = students?.filter(student => {
    const matchesName = student.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCenter = student.assignedCenter?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTutor = student.assignedTutor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesName || matchesCenter || matchesTutor;
  }) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        Error loading students: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.assignedCenter?.name || 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.assignedTutor?.name || 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.grade || 'N/A'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{selectedStudent.name}</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-medium">{selectedStudent.grade || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Center</p>
                <p className="font-medium">{selectedStudent.assignedCenter?.name || 'Not assigned'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Tutor</p>
                <p className="font-medium">{selectedStudent.assignedTutor?.name || 'Not assigned'}</p>
              </div>
            </div>

            {/* Additional Information */}
            {selectedStudent.assignedCenter && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Center Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedStudent.assignedCenter.name}</p>
                  <p className="text-sm text-gray-500">{selectedStudent.assignedCenter.area}</p>
                </div>
              </div>
            )}

            {selectedStudent.assignedTutor && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Tutor Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedStudent.assignedTutor.name}</p>
                  <p className="text-sm text-gray-500">{selectedStudent.assignedTutor.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students; 