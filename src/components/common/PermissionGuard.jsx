import React from 'react';

export const NoAccessSection = ({ section }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6">
      <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
      <p className="mt-1 text-sm text-gray-500">You do not have permission to view {section ? `the ${section}` : 'this'} section.</p>
    </div>
  );
};
