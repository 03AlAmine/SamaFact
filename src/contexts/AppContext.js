import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

// Dans AppContext.js
export const AppProvider = ({ children }) => {
  const [activeModule, setActiveModule] = useState('mentafact');

  // Nouvelle fonction pour gérer les changements de manière intelligente
  const setModuleBasedOnRole = (module, userRole) => {
    const allowedRoles = ['admin', 'comptable', 'superadmin', 'supadmin'];
    if (allowedRoles.includes(userRole)) {
      setActiveModule(module);
      localStorage.setItem('activeModule', module);
    } else {
      const forcedModule = userRole === 'rh_daf' ? 'payroll' : 'mentafact';
      setActiveModule(forcedModule);
      localStorage.setItem('activeModule', forcedModule);
    }
  };

  return (
    <AppContext.Provider value={{
      activeModule,
      setModuleBasedOnRole // Remplace setActiveModule
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);