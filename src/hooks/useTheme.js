import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'auto');
  const [effectiveTheme, setEffectiveTheme] = useState('light');

  // Fonction pour obtenir le thème effectif (résolu)
  const getEffectiveTheme = () => {
    if (theme !== 'auto') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Appliquer le thème au DOM
  const applyThemeToDOM = (newTheme) => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    if (newTheme === 'auto') {
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemIsDark ? 'theme-dark' : 'theme-light');
    } else {
      root.classList.add(`theme-${newTheme}`);
    }
  };

  // Mettre à jour le thème effectif
  const updateEffectiveTheme = () => {
    setEffectiveTheme(getEffectiveTheme());
  };

  useEffect(() => {
    // Initialiser le thème effectif
    updateEffectiveTheme();
    applyThemeToDOM(theme);

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemChange = (e) => {
      if (theme === 'auto') {
        // Mettre à jour la classe du DOM
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark');
        root.classList.add(e.matches ? 'theme-dark' : 'theme-light');
        
        updateEffectiveTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    
    // Écouter les changements de thème
    const handleThemeChange = (e) => {
      setTheme(e.detail.theme);
      updateEffectiveTheme();
    };

    window.addEventListener('themeChange', handleThemeChange);
    
    // Écouter les changements de thème effectif
    const handleEffectiveThemeChange = (e) => {
      setEffectiveTheme(e.detail.effectiveTheme);
    };
    
    window.addEventListener('effectiveThemeChange', handleEffectiveThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('effectiveThemeChange', handleEffectiveThemeChange);
    };
  }, [theme]);

  const setThemeManually = (newTheme) => {
    applyThemeToDOM(newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    
    // Mettre à jour le thème effectif
    if (newTheme !== 'auto') {
      setEffectiveTheme(newTheme);
    } else {
      setEffectiveTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  };

  return { 
    theme, 
    effectiveTheme,
    setTheme: setThemeManually,
    isDark: effectiveTheme === 'dark',
    isAuto: theme === 'auto'
  };
};