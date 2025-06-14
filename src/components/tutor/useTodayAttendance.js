import { useEffect, useState } from 'react';
import { format } from 'date-fns';

// Custom hook to check if today's attendance is already marked for the logged-in tutor
export default function useTodayAttendance() {
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Temporary fake attendance data for demo purposes
  const fakeAttendanceData = [
    { date: '2025-06-14', tutor: { _id: 'tutor1' }, status: 'Present' },
    { date: '2025-06-13', tutor: { _id: 'tutor2' }, status: 'Absent' },
    { date: '2025-06-12', tutor: { _id: 'tutor3' }, status: 'Absent' },
    { date: '2025-06-15', tutor: { _id: 'tutor1' }, status: 'Present' },
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const token = userData.token;
    const tutorId = userData._id;
    if (!token || !tutorId) {
      setLoading(false);
      setError('Not logged in');
      return;
    }
    const today = format(new Date(), 'yyyy-MM-dd');

    // Use fake data instead of fetching from server
    const found = fakeAttendanceData.some(
      r => r.tutor && (r.tutor._id === tutorId) && r.date === today
    );
    setAlreadyMarked(found);
    setLoading(false);
  }, []);

  return { alreadyMarked, loading, error };
}
