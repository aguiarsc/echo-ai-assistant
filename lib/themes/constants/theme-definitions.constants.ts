/**
 * Theme definitions
 * Contains all available themes and their configurations
 */

import type { Theme } from '../types'

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'The classic shadcn/ui theme with clean aesthetics',
    author: 'shadcn',
    preview: {
      primary: 'oklch(0.09 0.02 264.05)',
      secondary: 'oklch(0.96 0.01 264.05)',
      background: 'oklch(1.00 0 0)',
      foreground: 'oklch(0.09 0.02 264.05)'
    },
    css: {
      light: `
        --background: oklch(1.00 0 0);
        --foreground: oklch(0.09 0.02 264.05);
        --card: oklch(1.00 0 0);
        --card-foreground: oklch(0.09 0.02 264.05);
        --popover: oklch(1.00 0 0);
        --popover-foreground: oklch(0.09 0.02 264.05);
        --primary: oklch(0.09 0.02 264.05);
        --primary-foreground: oklch(0.98 0.01 264.05);
        --secondary: oklch(0.96 0.01 264.05);
        --secondary-foreground: oklch(0.45 0.02 264.05);
        --muted: oklch(0.96 0.01 264.05);
        --muted-foreground: oklch(0.45 0.02 264.05);
        --accent: oklch(0.96 0.01 264.05);
        --accent-foreground: oklch(0.45 0.02 264.05);
        --destructive: oklch(0.63 0.24 29.21);
        --border: oklch(0.90 0.01 264.05);
        --input: oklch(0.90 0.01 264.05);
        --ring: oklch(0.09 0.02 264.05);
        --chart-1: oklch(0.56 0.13 42.95);
        --chart-2: oklch(0.69 0.16 290.29);
        --chart-3: oklch(0.88 0.03 91.64);
        --chart-4: oklch(0.88 0.04 298.21);
        --chart-5: oklch(0.56 0.13 41.94);
        --sidebar: oklch(0.97 0 0);
        --sidebar-foreground: oklch(0.36 0.01 106.85);
        --sidebar-primary: oklch(0.09 0.02 264.05);
        --sidebar-primary-foreground: oklch(0.98 0.01 264.05);
        --sidebar-accent: oklch(0.96 0.01 264.05);
        --sidebar-accent-foreground: oklch(0.45 0.02 264.05);
        --sidebar-border: oklch(0.90 0.01 264.05);
        --sidebar-ring: oklch(0.09 0.02 264.05);
      `,
      dark: `
        --background: oklch(0.04 0.01 264.05);
        --foreground: oklch(0.98 0.01 264.05);
        --card: oklch(0.04 0.01 264.05);
        --card-foreground: oklch(0.98 0.01 264.05);
        --popover: oklch(0.04 0.01 264.05);
        --popover-foreground: oklch(0.98 0.01 264.05);
        --primary: oklch(0.98 0.01 264.05);
        --primary-foreground: oklch(0.09 0.02 264.05);
        --secondary: oklch(0.14 0.01 264.05);
        --secondary-foreground: oklch(0.98 0.01 264.05);
        --muted: oklch(0.14 0.01 264.05);
        --muted-foreground: oklch(0.64 0.01 264.05);
        --accent: oklch(0.14 0.01 264.05);
        --accent-foreground: oklch(0.98 0.01 264.05);
        --destructive: oklch(0.63 0.24 29.21);
        --border: oklch(0.32 0.01 264.05);
        --input: oklch(0.32 0.01 264.05);
        --ring: oklch(0.98 0.01 264.05);
        --chart-1: oklch(0.56 0.13 42.95);
        --chart-2: oklch(0.69 0.16 290.29);
        --chart-3: oklch(0.14 0.01 264.05);
        --chart-4: oklch(0.31 0.05 289.74);
        --chart-5: oklch(0.56 0.13 41.94);
        --sidebar: oklch(0.04 0.01 264.05);
        --sidebar-foreground: oklch(0.98 0.01 264.05);
        --sidebar-primary: oklch(0.98 0.01 264.05);
        --sidebar-primary-foreground: oklch(0.09 0.02 264.05);
        --sidebar-accent: oklch(0.14 0.01 264.05);
        --sidebar-accent-foreground: oklch(0.98 0.01 264.05);
        --sidebar-border: oklch(0.32 0.01 264.05);
        --sidebar-ring: oklch(0.98 0.01 264.05);
      `
    }
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Inspired by Anthropic Claude\'s clean and professional interface',
    author: 'Anthropic',
    preview: {
      primary: 'oklch(0.62 0.14 39.15)',
      secondary: 'oklch(0.92 0.01 87.42)',
      background: 'oklch(0.98 0.01 93.48)',
      foreground: 'oklch(0.34 0.03 94.42)'
    },
    css: {
      light: `
        --background: oklch(0.98 0.01 93.48);
        --foreground: oklch(0.34 0.03 94.42);
        --card: oklch(0.98 0.01 93.48);
        --card-foreground: oklch(0.19 0 0);
        --popover: oklch(1.00 0 0);
        --popover-foreground: oklch(0.27 0.02 99.70);
        --primary: oklch(0.62 0.14 39.15);
        --primary-foreground: oklch(1.00 0 0);
        --secondary: oklch(0.92 0.01 87.42);
        --secondary-foreground: oklch(0.43 0.02 99.33);
        --muted: oklch(0.93 0.02 91.55);
        --muted-foreground: oklch(0.61 0.01 91.49);
        --accent: oklch(0.92 0.01 87.42);
        --accent-foreground: oklch(0.27 0.02 99.70);
        --destructive: oklch(0.19 0 0);
        --border: oklch(0.88 0.01 100.76);
        --input: oklch(0.76 0.02 96.91);
        --ring: oklch(0.59 0.17 252.92);
        --chart-1: oklch(0.56 0.13 42.95);
        --chart-2: oklch(0.69 0.16 290.29);
        --chart-3: oklch(0.88 0.03 91.64);
        --chart-4: oklch(0.88 0.04 298.21);
        --chart-5: oklch(0.56 0.13 41.94);
        --sidebar: oklch(0.97 0.01 93.49);
        --sidebar-foreground: oklch(0.36 0.01 106.85);
        --sidebar-primary: oklch(0.62 0.14 39.15);
        --sidebar-primary-foreground: oklch(0.99 0 0);
        --sidebar-accent: oklch(0.92 0.01 87.42);
        --sidebar-accent-foreground: oklch(0.33 0 0);
        --sidebar-border: oklch(0.94 0 0);
        --sidebar-ring: oklch(0.77 0 0);
      `,
      dark: `
        --background: oklch(0.27 0 0);
        --foreground: oklch(0.81 0.01 93.53);
        --card: oklch(0.27 0 0);
        --card-foreground: oklch(0.98 0.01 93.48);
        --popover: oklch(0.31 0 0);
        --popover-foreground: oklch(0.92 0 0);
        --primary: oklch(0.67 0.13 38.92);
        --primary-foreground: oklch(1.00 0 0);
        --secondary: oklch(0.98 0.01 93.48);
        --secondary-foreground: oklch(0.31 0 0);
        --muted: oklch(0.22 0 0);
        --muted-foreground: oklch(0.77 0.02 100.64);
        --accent: oklch(0.21 0.01 88.79);
        --accent-foreground: oklch(0.97 0.01 93.49);
        --destructive: oklch(0.64 0.21 25.39);
        --border: oklch(0.36 0.01 106.85);
        --input: oklch(0.43 0.01 99.03);
        --ring: oklch(0.59 0.17 252.92);
        --chart-1: oklch(0.56 0.13 42.95);
        --chart-2: oklch(0.69 0.16 290.29);
        --chart-3: oklch(0.21 0.01 88.79);
        --chart-4: oklch(0.31 0.05 289.74);
        --chart-5: oklch(0.56 0.13 41.94);
        --sidebar: oklch(0.24 0 0);
        --sidebar-foreground: oklch(0.81 0.01 93.53);
        --sidebar-primary: oklch(0.33 0 0);
        --sidebar-primary-foreground: oklch(0.99 0 0);
        --sidebar-accent: oklch(0.17 0 0);
        --sidebar-accent-foreground: oklch(0.81 0.01 93.53);
        --sidebar-border: oklch(0.94 0 0);
        --sidebar-ring: oklch(0.77 0 0);
      `
    }
  }
]

export const defaultTheme = themes[0]
