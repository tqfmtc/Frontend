import { useState } from 'react';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';

const Centers = () => {
  const { response: centers, loading, error } = useGet('/centers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);

  const filteredCenters = centers?.filter(center => {
    const matchesName = center.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = center.area?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesName || matchesArea;
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
        Error loading centers: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Centers</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Centers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sadar Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCenters.map((center) => (
                <tr
                  key={center._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCenter(center)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{center.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.area}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.sadarName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.tutors?.length || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.students?.length || 0}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Center Details Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{selectedCenter.name}</h2>
              <button
                onClick={() => setSelectedCenter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Area</p>
                <p className="font-medium">{selectedCenter.area}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Sadar Name</p>
                <p className="font-medium">{selectedCenter.sadarName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Number of Tutors</p>
                <p className="font-medium">{selectedCenter.tutors?.length || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Number of Students</p>
                <p className="font-medium">{selectedCenter.students?.length || 0}</p>
              </div>
            </div>

            {/* Tutors List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Tutors</h3>
              <div className="space-y-2">
                {selectedCenter.tutors?.map((tutor) => (
                  <div key={tutor._id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{tutor.name}</p>
                    <p className="text-sm text-gray-500">{tutor.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Centers; 