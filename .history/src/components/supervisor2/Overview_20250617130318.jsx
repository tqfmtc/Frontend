import { useState, useEffect } from 'react';
import { FiUsers, FiMapPin } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';

const Overview = () => {
  const { response: centers, loading: centersLoading } = useGet('/centers');
  const { response: tutors, loading: tutorsLoading } = useGet('/tutors');
  const { response: students, loading: studentsLoading } = useGet('/students');

  const assignedCentersIds=JSON.parse(localStorage.getItem('userData'))?.assignedCenters || [];
  const assignedCenters = centers?.filter(center => assignedCentersIds.includes(center._id));
  console.log(assignedCenters)
  const assignedTutors=tutors?.filter(tutor => assignedCentersIds.includes(tutor.assignedCenter._id));
  console.log(students)
  const assignedStudents=students?.filter(students=> assignedCentersIds.includes(students.assignedCenter._id));
  console.log(assignedStudents)
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

  if (centersLoading || tutorsLoading || studentsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {centers?.slice(0, 5).map((center) => (
            <div key={center._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{center.name}</p>
                <p className="text-sm text-gray-500">{center.area}</p>
              </div>
              <div className="text-sm text-gray-500">
                {center.tutors?.length || 0} Tutors • {center.students?.length || 0} Students
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview; 