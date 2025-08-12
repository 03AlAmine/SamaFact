import React, { createContext, useState, useEffect,useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Récupère la valeur depuis localStorage ou utilise 'mentafact' par défaut
  const [activeModule, setActiveModule] = useState(() => {
    const savedModule = localStorage.getItem('activeModule');
    return savedModule || 'mentafact';
  });

  // Sauvegarde dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('activeModule', activeModule);
  }, [activeModule]);

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