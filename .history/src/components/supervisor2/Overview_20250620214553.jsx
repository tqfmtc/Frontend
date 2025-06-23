import { useState, useEffect } from 'react';
import { FiUsers, FiMapPin, FiX, FiMessageSquare } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';
import { AnimatePresence, motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

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
  const [showDetails, setShowDetails] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });

  if (centersLoading || tutorsLoading || studentsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const assignedCentersIds = JSON.parse(localStorage.getItem('userData'))?.assignedCenters || [];
  const assignedCenters = centers?.filter(center => assignedCentersIds.includes(center._id));
  const assignedTutors = tutors?.filter(tutor => assignedCentersIds.includes(tutor.assignedCenter._id));
  const assignedStudents = students?.filter(students => assignedCentersIds.includes(students.assignedCenter._id));

  // Filter assigned centers based on filters
  const filteredCenters = assignedCenters?.filter(center => {
    const matchesCenterName = center.name.toLowerCase().includes(filters.centerName.toLowerCase());
    const matchesArea = center.area.toLowerCase().includes(filters.area.toLowerCase());
    const matchesSadarName = center.sadarName.toLowerCase().includes(filters.sadarName.toLowerCase());
    const matchesStatus = filters.status === 'all' || center.status === filters.status;
    
    return matchesCenterName && matchesArea && matchesSadarName && matchesStatus;
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
            <input
              type="text"
              name="centerName"
              value={filters.centerName}
              onChange={(e) => setFilters({ ...filters, centerName: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, sadarName: e.target.value })}
              placeholder="Search sadar name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div> */}
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
                  Comment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCenters?.map((center) => {
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCommentModal(center);
                          setCommentText(center.comment || '');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <FiMessageSquare className="text-blue-500 hover:text-blue-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
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
                  Add Comment for {showCommentModal.name}
                </h2>
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Enter your comment here..."
                />
                <div className="flex justify-end space-x-4 mt-4">
                  <button
                    onClick={() => setShowConfirmation('discard')}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => setShowConfirmation('submit')}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">
                {showConfirmation === 'discard' ? 'Discard Changes?' : 'Submit Comment?'}
              </h3>
              <p className="text-gray-600 mb-6">
                {showConfirmation === 'discard'
                  ? 'Are you sure you want to discard your changes?'
                  : 'Are you sure you want to submit this comment?'}
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirmation(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (showConfirmation === 'submit') {
                      try {
                        const response = await fetch(
                          `${import.meta.env.VITE_API_URL}/centers/comment/${showCommentModal._id}`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
                            },
                            body: JSON.stringify({
                              centerId: showCommentModal._id,
                              comment: commentText
                            })
                          }
                        );
                        const data = await response.json();
                        if (response.ok) {
                          setToast({ visible: true, message: 'Comment added successfully!' });
                          setTimeout(() => setToast({ visible: false, message: '' }), 2000);
                        } else {
                          throw new Error(data.message || 'Failed to submit comment');
                        }
                      } catch (error) {
                        alert(
                          error.message ||
                          'Failed to submit comment. Please try again.'
                        );
                      }
                    }
                    setShowCommentModal(null);
                    setShowConfirmation(null);
                    setCommentText('');
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showConfirmation === 'discard'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {showConfirmation === 'discard' ? 'Discard' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {/* Tutors List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Tutors</h3>
              <div className="space-y-2">
                {showDetails.tutors?.map((tutor) => (
                  <div key={tutor._id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{tutor.name}</p>
                    <p className="text-sm text-gray-500">{tutor.email}</p>
                  </div>
                ))}
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

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow z-50 text-sm opacity-90 pointer-events-none select-none transition-all">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Overview;