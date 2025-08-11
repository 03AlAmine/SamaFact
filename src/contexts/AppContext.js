import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeModule, setActiveModule] = useState('mentafact');
  
  // Ajout d'une fonction pour basculer entre les modules
  const toggleModule = () => {
    setActiveModule(prev => prev === 'mentafact' ? 'payroll' : 'mentafact');
  };

  return (
    <AppContext.Provider value={{ activeModule, setActiveModule, toggleModule }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);