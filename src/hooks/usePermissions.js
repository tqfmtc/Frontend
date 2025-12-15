import { useState, useEffect } from 'react';

export const usePermissions = (section) => {
  const [permissions, setPermissions] = useState({
    canRead: false,
    canWrite: false,
    isWriteOnly: false,
    isReadOnly: false,
    hasNoAccess: true
  });

  useEffect(() => {
    const checkPermissions = () => {
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) return;

      try {
        const userData = JSON.parse(userDataStr);
        if (!userData) return;

        // If permissions object is missing, default to no access (user needs to re-login)
        if (!userData.permissions) {
             setPermissions({
                canRead: false,
                canWrite: false,
                isWriteOnly: false,
                isReadOnly: false,
                hasNoAccess: true
              });
            return;
        }

        const sectionPerms = userData.permissions[section];
        if (!sectionPerms) {
            // If section permission is missing, default to no access
             setPermissions({
                canRead: false,
                canWrite: false,
                isWriteOnly: false,
                isReadOnly: false,
                hasNoAccess: true
              });
            return;
        }

        const canRead = sectionPerms.read || false;
        const canWrite = sectionPerms.write || false;

        setPermissions({
          read: canRead,
          write: canWrite,
          canRead,
          canWrite,
          isWriteOnly: canWrite && !canRead,
          isReadOnly: canRead && !canWrite,
          hasNoAccess: !canRead && !canWrite
        });
      } catch (error) {
        console.error('Error parsing permissions:', error);
      }
    };

    checkPermissions();
    // Listen for storage changes
    window.addEventListener('storage', checkPermissions);
    return () => window.removeEventListener('storage', checkPermissions);
  }, [section]);

  return permissions;
};
