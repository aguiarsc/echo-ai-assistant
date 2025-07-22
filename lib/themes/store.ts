import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, themes, defaultTheme } from './definitions';

interface ThemeStore {
  currentTheme: Theme;
  isDarkMode: boolean;
  setTheme: (themeId: string) => void;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  applyTheme: (theme: Theme, isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: defaultTheme,
      isDarkMode: false,

      setTheme: (themeId: string) => {
        const theme = themes.find(t => t.id === themeId) || defaultTheme;
        const { isDarkMode } = get();
        
        set({ currentTheme: theme });
        get().applyTheme(theme, isDarkMode);
      },

      toggleDarkMode: () => {
        const { isDarkMode, currentTheme } = get();
        const newDarkMode = !isDarkMode;
        
        set({ isDarkMode: newDarkMode });
        get().applyTheme(currentTheme, newDarkMode);
      },

      setDarkMode: (isDark: boolean) => {
        const { currentTheme } = get();
        
        set({ isDarkMode: isDark });
        get().applyTheme(currentTheme, isDark);
      },

      applyTheme: (theme: Theme, isDark: boolean) => {
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove('light', 'dark');
        
        // Add the appropriate mode class
        root.classList.add(isDark ? 'dark' : 'light');
        
        // Apply CSS variables
        const cssVars = isDark ? theme.css.dark : theme.css.light;
        const lines = cssVars.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('--') && trimmed.includes(':')) {
            const [property, value] = trimmed.split(':').map(s => s.trim());
            if (property && value) {
              // Remove semicolon from value if present
              const cleanValue = value.replace(';', '');
              root.style.setProperty(property, cleanValue);
            }
          }
        });

        // Apply font variables (common to both light and dark)
        const fontVars = {
          '--font-sans': theme.id === 'altia' ? 'Inter, sans-serif' : 
                        theme.id === 'ghibli' ? 'Nunito, sans-serif' :
                        theme.id === 'material' ? 'Roboto, sans-serif' :
                        'Geist, ui-sans-serif, system-ui, sans-serif',
          '--font-serif': theme.id === 'altia' ? 'Source Serif 4, serif' :
                         theme.id === 'ghibli' ? 'PT Serif, serif' :
                         theme.id === 'material' ? 'Merriweather, serif' :
                         'Geist, ui-serif, Georgia, serif',
          '--font-mono': theme.id === 'ghibli' ? 'JetBrains Mono, monospace' :
                        'Geist Mono, ui-monospace, monospace',
          '--radius': theme.id === 'ghibli' ? '0.625rem' :
                     theme.id === 'material' ? '1rem' :
                     theme.id === 'altia' ? '0.375rem' :
                     '0.5rem'
        };

        Object.entries(fontVars).forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);

// Initialize theme on store creation
if (typeof window !== 'undefined') {
  const store = useThemeStore.getState();
  store.applyTheme(store.currentTheme, store.isDarkMode);
}
