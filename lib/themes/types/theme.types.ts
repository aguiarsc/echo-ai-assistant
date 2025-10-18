/**
 * Theme type definitions
 * Defines the structure of themes and theme-related data
 */

export interface Theme {
  id: string
  name: string
  description: string
  author?: string
  preview: {
    primary: string
    secondary: string
    background: string
    foreground: string
  }
  css: {
    light: string
    dark: string
  }
}

export interface ThemeStoreState {
  currentTheme: Theme
  isDarkMode: boolean
}

export interface ThemeStoreActions {
  setTheme: (themeId: string) => void
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
  applyTheme: (theme: Theme, isDark: boolean) => void
}

export type ThemeStore = ThemeStoreState & ThemeStoreActions
