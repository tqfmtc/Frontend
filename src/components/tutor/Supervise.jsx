import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEdit2, FiTrash2, FiDownload, FiUserPlus, FiFilter, FiX, FiCheck, FiCalendar } from 'react-icons/fi'
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useGet from '../CustomHooks/useGet';
// import { reverseGeocode } from './utils/reverseGeocode';
import { toast } from 'react-hot-toast';
import { useCenterRefetch } from '../../context/CenterRefetchContext';

const Supervise = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [filters, setFilters] = useState({
    centerName: '',
    area: '',
    status: 'active' // 'active', 'inactive', 'all'
  });
  const [formData, setFormData] = useState({
    name: '',
    tutors: '',
    students: '',
    sadarName: '',
    sadarContact: '',
    coordinates: '',
    location: '',
    area: ''
  });
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCenters, setSelectedCenters] = useState([]);

  // Get centers data with our fixed useGet hook
  const { response: centers, error, loading, refetch } = useGet("/Centers");
  const refetchContext = useCenterRefetch();

  useEffect(() => {
    if (refetchContext) {
      refetchContext.current = refetch;
    }
  }, [refetch, refetchContext]);

  const handleCoordinatesChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, coordinates: value }));
    
    if (value) {
      const parts = value.split(/[, ]+/).filter(part => part.trim() !== '');
      
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
          setMarkerPosition([lat, lng]);
          
          // Call reverse geocoding
          reverseGeocode(lat, lng)
            .then((address) => {
              setFormData(prev => ({ ...prev, location: address || '' }));
            })
            .catch((error) => {
              console.error('Error during reverse geocoding:', error);
              setFormData(prev => ({ ...prev, location: 'Could not determine location' }));
            });
          return;
        }
      }
    }
    
    // If we get here, either the input is empty or invalid
    setFormData(prev => ({ ...prev, location: '' }));
    setMarkerPosition(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Checkbox handler
  const handleCheckboxChange = (centerId) => {
    setSelectedCenters(prev =>
      prev.includes(centerId)
        ? prev.filter(id => id !== centerId)
        : [...prev, centerId]
    );
  };

  // Supervise button handler
  const handleSupervise = () => {
    // Save selected centers' IDs in an array (could be localStorage, context, or just state)
    // For now, just log or toast
    toast.success(`Supervising ${selectedCenters.length} center(s)`);
    // Example: localStorage.setItem('supervisedCenters', JSON.stringify(selectedCenters));
  };

  const filteredCenters = centers?.filter(center => {
    const matchesName = center.name?.toLowerCase().includes(filters.centerName.toLowerCase());
    const matchesArea = center.area?.toLowerCase().includes(filters.area.toLowerCase());
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && center.status !== 'inactive') || 
                         (filters.status === 'inactive' && center.status === 'inactive');
    return matchesName && matchesArea && matchesStatus;
  }) || [];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Loading Centers...</span>
    </div>
  );}
  if (error) return <p>Error loading centers: {error}</p>;
  if (!centers) return <p>No centers found.</p>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Center Management
        </h1>
        <button
          onClick={handleSupervise}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Supervise
        </button>
      </div>

      {/* Filter Panel - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
          <input
            type="text"
            name="centerName"
            value={filters.centerName}
            onChange={e => setFilters(prev => ({ ...prev, centerName: e.target.value }))}
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
            onChange={e => setFilters(prev => ({ ...prev, area: e.target.value }))}
            placeholder="Search area..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Centers</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {/* Checkbox header */}
                </th>
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
                  >
                    <td className="px-2 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCenters.includes(center._id)}
                        onChange={() => handleCheckboxChange(center._id)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Supervise