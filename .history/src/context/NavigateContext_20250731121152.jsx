import React, { createContext, useContext } from 'react';

const NavigateContext = createContext();

export const NavigateProvider = ({ children, setActiveTab }) => {
  return (
    <NavigateContext.Provider value={{ setActiveTab }}>
      {children}
    </NavigateContext.Provider>
  );
};

export const useNavigateContext = () => {
  const context = useContext(NavigateContext);
  if (!context) {
    throw new Error('useNavigateContext must be used within a NavigateProvider');
  }
  return context;
};
