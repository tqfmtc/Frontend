import React from 'react';
import GuestTutorForm from '../components/GuestTutor/GuestTutorForm';
import GuestTutorList from '../components/GuestTutor/GuestTutorList';

const GuestTutorPage = () => {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GuestTutorForm />
        <GuestTutorList />
      </div>
    </div>
  );
};

export default GuestTutorPage;
