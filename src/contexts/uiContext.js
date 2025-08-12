// Créez un nouveau fichier uiContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const UiContext = createContext();

export function UiProvider({ children }) {
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem('mentafact_activeTab') || "dashboard"
  );

  useEffect(() => {
    localStorage.setItem('mentafact_activeTab', activeTab);
  }, [activeTab]);

  return (
    <UiContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  return useContext(UiContext);
}