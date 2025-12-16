/**
 * Utility functions for checking admin permissions
 */

/**
 * Get the current admin's permissions from localStorage
 * @returns {Object|null} Permissions object or null if not found
 */
export const getAdminPermissions = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    
    const parsedData = JSON.parse(userData);
    return parsedData?.permissions || null;
  } catch (error) {
    console.error('Error getting admin permissions:', error);
    return null;
  }
};

/**
 * Check if admin has read permission for a specific module
 * @param {string} module - The module name (e.g., 'tutors', 'students', etc.)
 * @returns {boolean} True if admin has read permission
 */
export const hasReadPermission = (module) => {
  const permissions = getAdminPermissions();
  if (!permissions || !permissions[module]) return false;
  return permissions[module].read === true;
};

/**
 * Check if admin has write permission for a specific module
 * @param {string} module - The module name (e.g., 'tutors', 'students', etc.)
 * @returns {boolean} True if admin has write permission
 */
export const hasWritePermission = (module) => {
  const permissions = getAdminPermissions();
  if (!permissions || !permissions[module]) return false;
  return permissions[module].write === true;
};

/**
 * Check if admin has either read or write permission for a specific module
 * @param {string} module - The module name
 * @returns {boolean} True if admin has any access
 */
export const hasAnyPermission = (module) => {
  return hasReadPermission(module) || hasWritePermission(module);
};
