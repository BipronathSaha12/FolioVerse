import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Default is 'bright' as requested
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('folioverse_theme') || 'bright';
  });

  useEffect(() => {
    localStorage.setItem('folioverse_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'bright') {
      document.body.classList.remove('theme-purple');
      document.body.classList.add('theme-bright');
    } else {
      document.body.classList.remove('theme-bright');
      document.body.classList.add('theme-purple');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'bright' ? 'purple' : 'bright'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
