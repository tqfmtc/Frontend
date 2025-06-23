import { useState, useEffect } from 'react';
import { FiUsers, FiMapPin } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';

const Overview = () => {
  const { response: centers, loading: centersLoading } = useGet('/centers');
  const { response: tutors, loading: tutorsLoading } = useGet('/tutors');
  const { response: students, loading: studentsLoading } = useGet('/students');
    const [filters, setFilters] = useState({
    centerName: '',
    area: '',
    sadarName: '',
    tutorName: '',
    status: 'active' // 'active', 'inactive', 'all'
  });

    if (centersLoading || tutorsLoading || studentsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const assignedCentersIds=JSON.parse(localStorage.getItem('userData'))?.assignedCenters || [];
  const assignedCenters = centers?.filter(center => assignedCentersIds.includes(center._id));
  const assignedTutors=tutors?.filter(tutor => assignedCentersIds.includes(tutor.assignedCenter._id));
  const assignedStudents=students?.filter(students=> assignedCentersIds.includes(students.assignedCenter._id));
  const stats = [
    {
      label: 'Total Centers Assigned',
      value: centersLoading ? '...' : assignedCenters?.length || 0,
      icon: FiMapPin,
      color: 'from-blue-600 to-blue-400'
    },
    {
      label: 'Total Tutors Assigned',
      value: tutorsLoading ? '...' : assignedTutors?.length || 0,
      icon: FiUsers,
      color: 'from-purple-600 to-purple-400'
    },
    {
      label: 'Total Students Assigned',
      value: studentsLoading ? '...' : assignedStudents?.length || 0,
      icon: FiUsers,
      color: 'from-green-600 to-green-400'
    }
  ];



  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`rounded-xl shadow-lg bg-gradient-to-tr ${stat.color} text-white p-6 transition-all duration-300 hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <Icon className="text-2xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        {/* Filter Panel - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
            <input
              type="text"
              name="centerName"
              value={filters.centerName}
              onChange={handleFilterChange}
              placeholder="Search center name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
            <input
              type="text"
              name="area"
              value={filters.area}
              onChange={handleFilterChange}
              placeholder="Search area..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sadar Name</label>
            <input
              type="text"
              name="sadarName"
              value={filters.sadarName}
              onChange={handleFilterChange}
              placeholder="Search sadar name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tutor Name</label>
            <input
              type="text"
              name="tutorName"
              value={filters.tutorName}
              onChange={handleFilterChange}
              placeholder="Search tutor name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
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
                  Sadar Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCenters.map((center) => {
                const isInactive = center.status === 'inactive';
                return (
                  <tr
                    key={center._id}
                    className={`transition-all duration-200 cursor-pointer ${
                      isInactive 
                        ? 'bg-gray-100 hover:bg-gray-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setShowDetails(center)}
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
                      <div className="text-sm text-gray-900">{center.sadarContact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{center.tutors?.length || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{center.students?.length || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        center.status === 'inactive' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {center.status === 'inactive' ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(center);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(center);
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start p-6 border-b">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Center Details
                </h2>
                <button
                  onClick={() => setShowDetails(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
                    {showDetails.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">{showDetails.name}</h3>
                    <p className="text-sm text-gray-500">{showDetails.area}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{showDetails.location}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Area</p>
                    <p className="font-medium">{showDetails.area}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Sadar Name</p>
                    <p className="font-medium">{showDetails.sadarName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Sadar Contact</p>
                    <p className="font-medium">{showDetails.sadarContact}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Coordinates</p>
                    <p className="font-medium">{showDetails.coordinates?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Number of Tutors</p>
                    <p className="font-medium">{showDetails.tutors?.length || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Number of Students</p>
                    <p className="font-medium">{showDetails.students?.length || 0}</p>
                  </div>
                </div>

                {showDetails.coordinates && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Location Map</p>
                    <div className="h-[200px] rounded-lg overflow-hidden border border-gray-300">
                      <MapContainer
                        center={showDetails.coordinates}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={showDetails.coordinates} />
                      </MapContainer>
                    </div>
                  </div>
                )}

                {showDetails.images && showDetails.images.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Center Images</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {showDetails.images.map((image, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={image.url}
                            alt={`Center image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCenter && (
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
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600 mr-4">
                  <FiAlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-bold">Delete Center</h2>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the center "{deletingCenter.name}"? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeletingCenter(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Center'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Overview; 