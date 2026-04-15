// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';

// ── Styles globaux (ordre important) ──
import './index.css';          // 1. Reset + base body
import './css/themes.css';     // 2. Variables CSS (couleurs, ombres, transitions)
import './css/components.css'; // 3. Classes partagées entre pages
import "./css/Mentafact.css";
import "./css/Dashboard.css";
import "./css/Navbar.css";
import "./css/dark-mode-overrides.css";
import "./css/DocumentSection.css";

import App from './App';
import { AppProvider } from './contexts/AppContext';

// Initialiser le thème avant le rendu
// Valeurs possibles : 'light' | 'dark' | 'auto'
const savedTheme = localStorage.getItem('theme') || 'auto';
document.documentElement.classList.add(`theme-${savedTheme}`);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);