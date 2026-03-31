/**
 * usePersistentTheme - Custom hook for theme persistence
 * Stores user preference in localStorage
 * 
 * [Ver001.000]
 */
import { useState } from 'react';

type Theme = 'light' | 'valorant';

const STORAGE_KEY = 'landing-theme-preference';

export function usePersistentTheme(): [Theme, (theme: Theme) => void] {
  // Initialize from localStorage or default to 'light'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'valorant') {
        return stored;
      }
    } catch (e) {
      console.warn('Failed to read theme from localStorage:', e);
    }
    
    return 'light';
  });

  // Persist to localStorage on change
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
  };

  return [theme, setTheme];
}

export default usePersistentTheme;
