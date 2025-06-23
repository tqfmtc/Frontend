import { useEffect, useState } from 'react';

const useGet = (endpoint) => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const userDataString = localStorage.getItem('userData');
    const token = userDataString ? JSON.parse(userDataString).token : null;

    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Handle unauthorized access
          throw new Error('Please login to access this resource');
        }
        if (res.status === 403) {
          // Handle forbidden access
          throw new Error('You do not have permission to access this resource');
        }
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch data');
      }

      const data = await res.json();
      setResponse(data);
      setError('');
    } catch (err) {
      console.error('Error in useGet:', err);
      setError(err.message || 'An unexpected error occurred');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { response, error, loading, refetch: fetchData };
};

export default useGet;
