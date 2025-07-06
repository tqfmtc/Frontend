// PWA Registration and Utilities
export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Check if app is running in standalone mode (installed)
export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

// Check if app can be installed
export const canInstall = () => {
  return 'BeforeInstallPromptEvent' in window;
};

// Get install prompt
export const getInstallPrompt = () => {
  return new Promise((resolve) => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      resolve(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  });
};

// Install the app
export const installApp = async () => {
  const prompt = await getInstallPrompt();
  if (prompt) {
    const result = await prompt.userChoice;
    return result.outcome === 'accepted';
  }
  return false;
};

// Check network status
export const isOnline = () => {
  return navigator.onLine;
};

// Listen for network status changes
export const onNetworkStatusChange = (callback) => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
};

// Cache management
export const clearCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
}; 