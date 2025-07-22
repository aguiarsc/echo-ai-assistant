export interface Theme {
  id: string;
  name: string;
  description: string;
  author?: string;
  preview: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
  };
  css: {
    light: string;
    dark: string;
  };
}

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
        --border: oklch(0.14 0.01 264.05);
        --input: oklch(0.14 0.01 264.05);
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
        --sidebar-border: oklch(0.14 0.01 264.05);
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
  },
  {
    id: 'altia',
    name: 'altIA',
    description: 'The signature altIA theme with purple accents and modern aesthetics',
    author: 'altIA Team',
    preview: {
      primary: 'oklch(0.48 0.20 260.47)',
      secondary: 'oklch(0.97 0 0)',
      background: 'oklch(0.98 0 0)',
      foreground: 'oklch(0.21 0.03 263.61)'
    },
    css: {
      light: `
        --background: oklch(0.98 0 0);
        --foreground: oklch(0.21 0.03 263.61);
        --card: oklch(1.00 0 0);
        --card-foreground: oklch(0.21 0.03 263.61);
        --popover: oklch(1.00 0 0);
        --popover-foreground: oklch(0.21 0.03 263.61);
        --primary: oklch(0.48 0.20 260.47);
        --primary-foreground: oklch(1.00 0 0);
        --secondary: oklch(0.97 0 0);
        --secondary-foreground: oklch(0.37 0.03 259.73);
        --muted: oklch(0.97 0 0);
        --muted-foreground: oklch(0.55 0.02 264.41);
        --accent: oklch(0.95 0.02 260.18);
        --accent-foreground: oklch(0.48 0.20 260.47);
        --destructive: oklch(0.58 0.22 27.29);
        --border: oklch(0.93 0.01 261.82);
        --input: oklch(0.93 0.01 261.82);
        --ring: oklch(0.48 0.20 260.47);
        --chart-1: oklch(0.48 0.20 260.47);
        --chart-2: oklch(0.56 0.24 260.92);
        --chart-3: oklch(0.40 0.16 259.61);
        --chart-4: oklch(0.43 0.16 259.82);
        --chart-5: oklch(0.29 0.07 261.20);
        --sidebar: oklch(0.97 0 0);
        --sidebar-foreground: oklch(0.21 0.03 263.61);
        --sidebar-primary: oklch(0.48 0.20 260.47);
        --sidebar-primary-foreground: oklch(1.00 0 0);
        --sidebar-accent: oklch(0.95 0.02 260.18);
        --sidebar-accent-foreground: oklch(0.48 0.20 260.47);
        --sidebar-border: oklch(0.93 0.01 261.82);
        --sidebar-ring: oklch(0.48 0.20 260.47);
      `,
      dark: `
        --background: oklch(0.26 0.03 262.67);
        --foreground: oklch(0.93 0.01 261.82);
        --card: oklch(0.30 0.03 260.51);
        --card-foreground: oklch(0.93 0.01 261.82);
        --popover: oklch(0.30 0.03 260.51);
        --popover-foreground: oklch(0.93 0.01 261.82);
        --primary: oklch(0.56 0.24 260.92);
        --primary-foreground: oklch(1.00 0 0);
        --secondary: oklch(0.35 0.04 261.40);
        --secondary-foreground: oklch(0.93 0.01 261.82);
        --muted: oklch(0.30 0.03 260.51);
        --muted-foreground: oklch(0.71 0.02 261.33);
        --accent: oklch(0.33 0.04 264.63);
        --accent-foreground: oklch(0.93 0.01 261.82);
        --destructive: oklch(0.64 0.21 25.39);
        --border: oklch(0.35 0.04 261.40);
        --input: oklch(0.35 0.04 261.40);
        --ring: oklch(0.56 0.24 260.92);
        --chart-1: oklch(0.56 0.24 260.92);
        --chart-2: oklch(0.48 0.20 260.47);
        --chart-3: oklch(0.69 0.17 255.59);
        --chart-4: oklch(0.43 0.16 259.82);
        --chart-5: oklch(0.29 0.07 261.20);
        --sidebar: oklch(0.26 0.03 262.67);
        --sidebar-foreground: oklch(0.93 0.01 261.82);
        --sidebar-primary: oklch(0.56 0.24 260.92);
        --sidebar-primary-foreground: oklch(1.00 0 0);
        --sidebar-accent: oklch(0.33 0.04 264.63);
        --sidebar-accent-foreground: oklch(0.93 0.01 261.82);
        --sidebar-border: oklch(0.35 0.04 261.40);
        --sidebar-ring: oklch(0.56 0.24 260.92);
      `
    }
  },
  {
    id: 'ghibli',
    name: 'Studio Ghibli',
    description: 'Warm, earthy tones inspired by Studio Ghibli films',
    author: 'Community',
    preview: {
      primary: 'oklch(0.71 0.10 111.96)',
      secondary: 'oklch(0.88 0.05 83.32)',
      background: 'oklch(0.91 0.05 82.78)',
      foreground: 'oklch(0.41 0.08 78.86)'
    },
    css: {
      light: `
        --background: oklch(0.91 0.05 82.78);
        --foreground: oklch(0.41 0.08 78.86);
        --card: oklch(0.92 0.04 84.56);
        --card-foreground: oklch(0.41 0.08 74.04);
        --popover: oklch(0.92 0.04 84.56);
        --popover-foreground: oklch(0.41 0.08 74.04);
        --primary: oklch(0.71 0.10 111.96);
        --primary-foreground: oklch(0.98 0.01 2.18);
        --secondary: oklch(0.88 0.05 83.32);
        --secondary-foreground: oklch(0.51 0.08 78.21);
        --muted: oklch(0.86 0.06 82.94);
        --muted-foreground: oklch(0.51 0.08 74.78);
        --accent: oklch(0.86 0.05 85.12);
        --accent-foreground: oklch(0.26 0.02 356.72);
        --destructive: oklch(0.63 0.24 29.21);
        --border: oklch(0.74 0.06 79.64);
        --input: oklch(0.74 0.06 79.64);
        --ring: oklch(0.51 0.08 74.78);
        --chart-1: oklch(0.66 0.19 41.68);
        --chart-2: oklch(0.70 0.12 183.58);
        --chart-3: oklch(0.48 0.08 211.35);
        --chart-4: oklch(0.84 0.17 84.99);
        --chart-5: oklch(0.74 0.17 60.02);
        --sidebar: oklch(0.87 0.06 84.46);
        --sidebar-foreground: oklch(0.41 0.08 78.86);
        --sidebar-primary: oklch(0.26 0.02 356.72);
        --sidebar-primary-foreground: oklch(0.98 0.01 2.18);
        --sidebar-accent: oklch(0.83 0.06 84.44);
        --sidebar-accent-foreground: oklch(0.26 0.02 356.72);
        --sidebar-border: oklch(0.91 0 0);
        --sidebar-ring: oklch(0.71 0 0);
      `,
      dark: `
        --background: oklch(0.20 0.01 52.89);
        --foreground: oklch(0.88 0.05 79.11);
        --card: oklch(0.25 0.01 48.28);
        --card-foreground: oklch(0.88 0.05 79.11);
        --popover: oklch(0.25 0.01 48.28);
        --popover-foreground: oklch(0.88 0.05 79.11);
        --primary: oklch(0.64 0.05 114.58);
        --primary-foreground: oklch(0.98 0.01 2.18);
        --secondary: oklch(0.33 0.02 60.70);
        --secondary-foreground: oklch(0.88 0.05 83.32);
        --muted: oklch(0.27 0.01 39.35);
        --muted-foreground: oklch(0.74 0.06 79.64);
        --accent: oklch(0.33 0.02 60.70);
        --accent-foreground: oklch(0.86 0.05 85.12);
        --destructive: oklch(0.63 0.24 29.21);
        --border: oklch(0.33 0.02 60.70);
        --input: oklch(0.33 0.02 60.70);
        --ring: oklch(0.64 0.05 114.58);
        --chart-1: oklch(0.66 0.19 41.68);
        --chart-2: oklch(0.70 0.12 183.58);
        --chart-3: oklch(0.48 0.08 211.35);
        --chart-4: oklch(0.84 0.17 84.99);
        --chart-5: oklch(0.74 0.17 60.02);
        --sidebar: oklch(0.23 0.01 60.90);
        --sidebar-foreground: oklch(0.88 0.05 79.11);
        --sidebar-primary: oklch(0.64 0.05 114.58);
        --sidebar-primary-foreground: oklch(0.98 0.01 2.18);
        --sidebar-accent: oklch(0.33 0.02 60.70);
        --sidebar-accent-foreground: oklch(0.86 0.05 85.12);
        --sidebar-border: oklch(0.33 0.02 60.70);
        --sidebar-ring: oklch(0.64 0.05 114.58);
      `
    }
  },
  {
    id: 'material',
    name: 'Material Design',
    description: 'Google\'s Material Design principles with modern colors',
    author: 'Google',
    preview: {
      primary: 'oklch(0.51 0.21 286.50)',
      secondary: 'oklch(0.49 0.04 300.23)',
      background: 'oklch(0.98 0.01 335.69)',
      foreground: 'oklch(0.22 0 0)'
    },
    css: {
      light: `
        --background: oklch(0.98 0.01 335.69);
        --foreground: oklch(0.22 0 0);
        --card: oklch(0.96 0.01 335.69);
        --card-foreground: oklch(0.14 0 0);
        --popover: oklch(0.95 0.01 316.67);
        --popover-foreground: oklch(0.40 0.04 309.35);
        --primary: oklch(0.51 0.21 286.50);
        --primary-foreground: oklch(1.00 0 0);
        --secondary: oklch(0.49 0.04 300.23);
        --secondary-foreground: oklch(1.00 0 0);
        --muted: oklch(0.96 0.01 335.69);
        --muted-foreground: oklch(0.14 0 0);
        --accent: oklch(0.92 0.04 303.47);
        --accent-foreground: oklch(0.14 0 0);
        --destructive: oklch(0.57 0.23 29.21);
        --border: oklch(0.83 0.02 308.26);
        --input: oklch(0.57 0.02 309.68);
        --ring: oklch(0.50 0.13 293.77);
        --chart-1: oklch(0.61 0.21 279.42);
        --chart-2: oklch(0.72 0.15 157.67);
        --chart-3: oklch(0.66 0.17 324.24);
        --chart-4: oklch(0.81 0.15 127.91);
        --chart-5: oklch(0.68 0.17 258.25);
        --sidebar: oklch(0.99 0 0);
        --sidebar-foreground: oklch(0.15 0 0);
        --sidebar-primary: oklch(0.56 0.11 228.27);
        --sidebar-primary-foreground: oklch(0.98 0 0);
        --sidebar-accent: oklch(0.95 0 0);
        --sidebar-accent-foreground: oklch(0.25 0 0);
        --sidebar-border: oklch(0.90 0 0);
        --sidebar-ring: oklch(0.56 0.11 228.27);
      `,
      dark: `
        --background: oklch(0.15 0.01 317.69);
        --foreground: oklch(0.95 0.01 321.50);
        --card: oklch(0.22 0.02 322.13);
        --card-foreground: oklch(0.95 0.01 321.50);
        --popover: oklch(0.22 0.02 322.13);
        --popover-foreground: oklch(0.95 0.01 321.50);
        --primary: oklch(0.60 0.22 279.81);
        --primary-foreground: oklch(0.98 0.01 321.51);
        --secondary: oklch(0.45 0.03 294.79);
        --secondary-foreground: oklch(0.95 0.01 321.50);
        --muted: oklch(0.22 0.01 319.50);
        --muted-foreground: oklch(0.70 0.01 320.70);
        --accent: oklch(0.35 0.06 299.57);
        --accent-foreground: oklch(0.95 0.01 321.50);
        --destructive: oklch(0.57 0.23 29.21);
        --border: oklch(0.40 0.04 309.35);
        --input: oklch(0.40 0.04 309.35);
        --ring: oklch(0.50 0.15 294.97);
        --chart-1: oklch(0.50 0.25 274.99);
        --chart-2: oklch(0.60 0.15 150.16);
        --chart-3: oklch(0.65 0.20 309.96);
        --chart-4: oklch(0.60 0.17 132.98);
        --chart-5: oklch(0.60 0.20 255.25);
        --sidebar: oklch(0.20 0.01 317.74);
        --sidebar-foreground: oklch(0.95 0.01 321.50);
        --sidebar-primary: oklch(0.59 0.11 225.82);
        --sidebar-primary-foreground: oklch(0.95 0.01 321.50);
        --sidebar-accent: oklch(0.30 0.01 319.52);
        --sidebar-accent-foreground: oklch(0.95 0.01 321.50);
        --sidebar-border: oklch(0.35 0.01 319.53 / 30%);
        --sidebar-ring: oklch(0.59 0.11 225.82);
      `
    }
  }
];

export const defaultTheme = themes[0];
