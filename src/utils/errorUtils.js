// Utility for extracting user-friendly messages from API/network errors
// Usage: import { getErrorMessage } from '../utils/errorUtils';

export const getErrorMessage = (error, fallback = 'An unexpected error occurred.') => {
  if (!error) return fallback;

  // Axios error object
  if (error.response) {
    // Server responded with a status outside 2xx
    if (error.response.data?.message) return error.response.data.message;
    const { status } = error.response;
    switch (status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again or check your credentials.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Requested resource was not found.';
      case 500:
        return 'Internal server error. Please try again later.';
      default:
        return `Request failed with status ${status}.`;
    }
  }

  // No response received (network error / CORS / server down)
  if (error.request) {
    return 'Unable to reach the server. Please check your internet connection or try again later.';
  }

  // Anything else (setup, code error, etc.)
  return error.message || fallback;
};
