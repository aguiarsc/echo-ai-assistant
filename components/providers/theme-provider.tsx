'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/themes/store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentTheme, isDarkMode, applyTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount and when theme changes
    applyTheme(currentTheme, isDarkMode);
  }, [currentTheme, isDarkMode, applyTheme]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const store = useThemeStore.getState();
      if (!localStorage.getItem('theme-storage')) {
        store.setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Set initial theme based on system preference if no stored preference
    if (!localStorage.getItem('theme-storage')) {
      useThemeStore.getState().setDarkMode(mediaQuery.matches);
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
}
