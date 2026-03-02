// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './css/themes.css'; // Importez le thème ici
import App from './App';
import { AppProvider } from './contexts/AppContext';

// Initialiser le thème avant le rendu - PAR DÉFAUT = AUTO
const savedTheme = localStorage.getItem('theme') || 'auto'; // Changé de 'light' à 'auto'
document.documentElement.classList.add(`theme-${savedTheme}`);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);