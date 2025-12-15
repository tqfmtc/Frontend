import React, { createContext, useContext, useState, useCallback } from 'react';

const WriteOnlyContext = createContext();

export const useWriteOnly = () => {
  const context = useContext(WriteOnlyContext);
  if (!context) {
    throw new Error('useWriteOnly must be used within a WriteOnlyProvider');
  }
  return context;
};

export const WriteOnlyProvider = ({ children }) => {
  // Store temporary entries for write-only mode
  // Structure: { [sectionName]: [entry1, entry2, ...] }
  const [tempEntries, setTempEntries] = useState({});
  
  // Track if disclaimer has been shown for a section
  const [disclaimerShown, setDisclaimerShown] = useState({});

  const initializeWriteOnly = useCallback((section) => {
    if (!tempEntries[section]) {
      setTempEntries(prev => ({ ...prev, [section]: [] }));
    }
  }, [tempEntries]);

  const addTemporaryEntry = useCallback((section, entry) => {
    setTempEntries(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), entry]
    }));
  }, []);

  const getTemporaryEntries = useCallback((section) => {
    return tempEntries[section] || [];
  }, [tempEntries]);

  const markDisclaimerShown = useCallback((section) => {
    setDisclaimerShown(prev => ({ ...prev, [section]: true }));
  }, []);

  const hasDisclaimerBeenShown = useCallback((section) => {
    return !!disclaimerShown[section];
  }, [disclaimerShown]);

  const value = {
    initializeWriteOnly,
    addTemporaryEntry,
    getTemporaryEntries,
    markDisclaimerShown,
    hasDisclaimerBeenShown
  };

  return (
    <WriteOnlyContext.Provider value={value}>
      {children}
    </WriteOnlyContext.Provider>
  );
};
