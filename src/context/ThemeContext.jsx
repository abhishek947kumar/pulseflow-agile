import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight Cyber',
    description: 'Deep obsidian & electric violet neon',
    previewColor: '#8b5cf6',
    bg: '#05070f'
  },
  {
    id: 'sunset',
    name: 'Sunset Aurora',
    description: 'Warm obsidian & coral sunset glow',
    previewColor: '#f43f5e',
    bg: '#0f0c15'
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    description: 'Deep cyber-forest & mint neon',
    previewColor: '#10b981',
    bg: '#030f0b'
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    description: 'Ultra-clean executive daylight pearl',
    previewColor: '#2563eb',
    bg: '#f8fafc'
  }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pulseflow_theme') || 'midnight';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulseflow_theme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
