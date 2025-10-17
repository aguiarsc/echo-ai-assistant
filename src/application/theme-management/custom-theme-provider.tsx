'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/application/theme-management/theme-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentTheme, isDarkMode, applyTheme } = useThemeStore();

  useEffect(() => {
    applyTheme(currentTheme, isDarkMode);
  }, [currentTheme, isDarkMode, applyTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const store = useThemeStore.getState();
      if (!localStorage.getItem('theme-storage')) {
        store.setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    if (!localStorage.getItem('theme-storage')) {
      useThemeStore.getState().setDarkMode(mediaQuery.matches);
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
}
