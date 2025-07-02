/**
 * Authentication utilities for consistent token handling across the application
 */

/**
 * Utility: Decode JWT payload
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse JWT:', err);
    return null;
  }
};

/**
 * Checks if a JWT token is expired
 * @param {string} token
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

/**
 * Gets the authentication token from localStorage with error handling
 * @returns {Object} Object containing token and any error message
 */
export const getAuthToken = () => {
  try {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      return { token: null, error: 'Please login to access this resource' };
    }

    const parsedData = JSON.parse(userDataStr);
    const token = parsedData?.token;
    if (!token) {
      return { token: null, error: 'Authentication token is missing' };
    }

    if (isTokenExpired(token)) {
      // Cleanup stale credentials
      localStorage.removeItem('userData');
      return { token: null, error: 'Session expired. Please login again.' };
    }

    return { token, error: null };
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return { token: null, error: 'Authentication error occurred' };
  }
};

/**
 * Adds authentication headers to fetch options
 * @param {Object} options - Existing fetch options
 * @returns {Object} Updated fetch options with auth headers
 */
export const withAuth = (options = {}) => {
  const { token, error } = getAuthToken();
  
  if (error) {
    throw new Error(error);
  }
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': options.headers?.['Content-Type'] || 'application/json',
    }
  };
};

/**
 * Makes an authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const authFetch = async (url, options = {}) => {
  const authOptions = withAuth(options);
  
  try {
    const response = await fetch(url, authOptions);
    
    if (!response.ok) {
      // Handle common auth errors
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
