import { useEffect, useState } from 'react';
import { format } from 'date-fns';

// Custom hook to check if today's attendance is already marked for the logged-in tutor
export default function useTodayAttendance() {
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    fetch(`${import.meta.env.VITE_API_URL}/attendance/recent`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Not authorized. Please login again.');
          } else {
            throw new Error(`Failed to fetch attendance: ${res.status}`);
          }
        }
        return res.json();
      })
      .then(records => {
        // Debug: log records
        // console.log('Attendance records:', records);
        const found = records.some(
          r => r.tutor && (r.tutor._id === tutorId) && format(new Date(r.date || r.createdAt), 'yyyy-MM-dd') === today
        );
        setAlreadyMarked(found);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { alreadyMarked, loading, error };
}
