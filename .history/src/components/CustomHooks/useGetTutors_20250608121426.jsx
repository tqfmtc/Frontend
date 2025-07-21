import React from 'react';
import useGet from './useGet'; // adjust the path as needed

const TutorsList = () => {
  const { response: tutors, loading } = useGet("http://localhost:3000/adminnoauth/alltutors");
  console.log("From the useTutors...!!!",tutors)
  if (loading) return <p>Loading tutors...</p>;

  if (!tutors || tutors.length === 0) return <p>No tutors found.</p>;

  return (
    <div>
      <h2>List of Tutors</h2>
      <ul>
        {tutors.map((tutor) => (
          <li key={tutor.id}>
            <strong>{tutor.name}</strong><br />
            Email: {tutor.email}<br />
            Phone: {tutor.phone}<br />
            Center: {tutor.center}<br />
            Subjects: {Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : 'N/A'}<br />
            {/* Status: {tutor.status} */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TutorsList;
