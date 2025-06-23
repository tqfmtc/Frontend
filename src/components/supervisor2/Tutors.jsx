import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';

const Tutors = () => {
  const { response: tutors, loading, error } = useGet('/tutors');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] = useState(null);

  const filteredTutors = tutors?.filter(tutor => {
    const matchesName = tutor.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEmail = tutor.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCenter = tutor.assignedCenter?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesName || matchesEmail || matchesCenter;
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
        Error loading tutors: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tutors</h1>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or center..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tutors Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTutors.map((tutor) => (
                <tr
                  key={tutor._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTutor(tutor)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tutor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{tutor.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{tutor.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {tutor.assignedCenter?.name || 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tutor.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tutor.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tutor Details Modal */}
      {selectedTutor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{selectedTutor.name}</h2>
              <button
                onClick={() => setSelectedTutor(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedTutor.email}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{selectedTutor.phone}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Center</p>
                <p className="font-medium">{selectedTutor.assignedCenter?.name || 'Not assigned'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{selectedTutor.status}</p>
              </div>
            </div>

            {/* Additional Information */}
            {selectedTutor.assignedCenter && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Center Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedTutor.assignedCenter.name}</p>
                  <p className="text-sm text-gray-500">{selectedTutor.assignedCenter.area}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tutors; 