import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Popover from '../../common/Popover';

const TutorProfile = ({ tutor, onEdit, onDelete, onClose }) => {
  const navigate = useNavigate();
  const [showDeletePopover, setShowDeletePopover] = useState(false);

  if (!tutor) {
    return (
      <div className="w-full max-w-full mx-auto p-2 bg-white rounded shadow-md border border-blue-100">
        <div className="text-center py-8 text-gray-500">
          <p>No tutor data available</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(tutor);
    }
  };

  const handleDelete = () => {
    setShowDeletePopover(true);
  };

  const handleDeleteConfirmed = () => {
    if (onDelete) {
      onDelete(tutor._id);
    }
    setShowDeletePopover(false);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/admin-dashboard', { state: { activeTab: 'tutors' } });
    }
  };

  // Helper function to format qualification type
  const formatQualificationType = (type) => {
    if (!type) return 'Not specified';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to format qualification status
  const formatQualificationStatus = (status) => {
    if (!status) return 'Not specified';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to mask account number
  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return 'Not provided';
    if (accountNumber.length <= 4) return accountNumber;
    const masked = '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
    return masked;
  };

  // Helper function to format subjects
  const formatSubjects = (subjects) => {
    if (!subjects) return 'Not specified';
    if (Array.isArray(subjects)) {
      return subjects.join(', ');
    }
    return subjects;
  };

  // Helper function to format session type
  const formatSessionType = (type) => {
    if (!type) return 'Not specified';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to format session timing
  const formatSessionTiming = (timing) => {
    if (!timing) return 'Not specified';
    const timingMap = {
      'after_fajr': 'Post Fajr',
      'after_zohar': 'Post Zohar',
      'after_asar': 'Post Asar',
      'after_maghrib': 'Post Maghrib',
      'after_isha': 'Post Isha'
    };
    return timingMap[timing] || timing;
  };

  return (
    <div className="w-full max-w-full mx-auto p-2 bg-white rounded shadow-md border border-blue-100 overflow-x-auto">
      <h2 className="text-xl font-bold text-white mb-3 pb-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg p-3 -mx-3 -mt-3">
        Tutor Profile
      </h2>

      <div className="space-y-3">
        {/* Main Grid Layout - 2 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start max-w-7xl mx-auto">

          {/* Left Column - Personal & Session Info */}
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[320px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {tutor.name || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {tutor.email || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Login Username)</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {tutor.phone || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tutor.status)}`}>
                    {formatQualificationType(tutor.status) || 'Active'}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm min-h-[80px]">
                    {tutor.address || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>

            {/* Session Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[400px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Session Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                {/* Session Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {formatSessionType(tutor.sessionType)}
                  </div>
                </div>

                {/* Session Timing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timing</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {formatSessionTiming(tutor.sessionTiming)}
                  </div>
                </div>

                {/* Assigned Center */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Center</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {tutor.assignedCenter?.name || tutor.assignedCenter || 'Not assigned'}
                  </div>
                </div>

                {/* Subjects */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tutor.subjects && (Array.isArray(tutor.subjects) ? tutor.subjects : [tutor.subjects]).map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border-2 border-blue-700"
                      >
                        {subject}
                      </span>
                    ))}
                    {(!tutor.subjects || (Array.isArray(tutor.subjects) && tutor.subjects.length === 0)) && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        No subjects assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Educational Details & Other Info */}
          <div className="space-y-4">

            {/* Educational Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[280px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Educational Details</h3>

              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualification Type</label>
                    <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                      {formatQualificationType(tutor.qualificationType)}
                    </div>
                  </div>

                  {tutor.qualificationType === 'others' && tutor.qualificationOther && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Qualification</label>
                      <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                        {tutor.qualificationOther}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualification Status</label>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      tutor.qualificationStatus === 'completed' ? 'bg-green-100 text-green-700' : 
                      tutor.qualificationStatus === 'pursuing' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {formatQualificationStatus(tutor.qualificationStatus)}
                    </div>
                  </div>

                  {tutor.qualificationStatus === 'completed' && tutor.yearOfCompletion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year of Completion</label>
                      <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                        {tutor.yearOfCompletion}
                      </div>
                    </div>
                  )}

                  {tutor.sessionType === 'tuition' && (tutor.qualificationType === 'graduation' || tutor.qualificationType === 'intermediate') && tutor.specialization && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                      <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                        {tutor.specialization}
                      </div>
                    </div>
                  )}

                  {tutor.sessionType === 'tuition' && tutor.collegeName && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                      <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                        {tutor.collegeName}
                      </div>
                    </div>
                  )}

                  {tutor.sessionType === 'arabic' && tutor.madarsahName && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Madarsah Name</label>
                      <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                        {tutor.madarsahName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hadiya Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[150px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Hadiya Information</h3>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Hadiya Amount (₹)</label>
                <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm font-medium">
                  ₹{tutor.assignedHadiyaAmount ? Number(tutor.assignedHadiyaAmount).toLocaleString('en-IN') : 'Not specified'}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[320px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Bank Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {tutor.aadharNumber || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {tutor.bankName || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm">
                    {tutor.bankBranch || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm font-mono">
                    {maskAccountNumber(tutor.accountNumber)}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <div className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-sm font-mono">
                    {tutor.ifscCode || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium text-sm shadow"
          >
            Close
          </button>


        </div>
      </div>

      {/* Delete Confirmation Popover */}
      <Popover
        isOpen={showDeletePopover}
        onClose={() => setShowDeletePopover(false)}
        title="Delete Tutor"
        message={`Are you sure you want to delete ${tutor.name}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirmed}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default TutorProfile;
