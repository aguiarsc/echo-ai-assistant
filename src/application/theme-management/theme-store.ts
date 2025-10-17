import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, themes, defaultTheme } from './theme-definitions';

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
        
        root.classList.remove('light', 'dark');
        
        root.classList.add(isDark ? 'dark' : 'light');
        
        const cssVars = isDark ? theme.css.dark : theme.css.light;
        const lines = cssVars.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('--') && trimmed.includes(':')) {
            const [property, value] = trimmed.split(':').map(s => s.trim());
            if (property && value) {
              const cleanValue = value.replace(';', '');
              root.style.setProperty(property, cleanValue);
            }
          }
        });

        const fontVars = {
          '--font-sans': theme.id === 'default' ? 'Nunito, sans-serif' :
                        theme.id === 'claude' ? 'Roboto, sans-serif' :
                        'Geist, ui-sans-serif, system-ui, sans-serif',
          '--font-serif': theme.id === 'default' ? 'PT Serif, serif' :
                         theme.id === 'claude' ? 'Merriweather, serif' :
                         'Geist, ui-serif, Georgia, serif',
          '--font-mono': theme.id === 'default' ? 'JetBrains Mono, monospace' :
                        'Geist Mono, ui-monospace, monospace',
          '--radius': theme.id === 'default' ? '0.625rem' :
                     theme.id === 'claude' ? '1rem' :
                     '0.5rem'
        };

        Object.entries(fontVars).forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });
      }
    }),
    {
      name: 'theme-storage-v2',
      partialize: (state) => ({
        currentTheme: { id: state.currentTheme.id },
        isDarkMode: state.isDarkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const freshTheme = themes.find(t => t.id === state.currentTheme.id) || defaultTheme;
          state.currentTheme = freshTheme;
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  const store = useThemeStore.getState();
  store.applyTheme(store.currentTheme, store.isDarkMode);
}
