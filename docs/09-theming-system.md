# Theming System

## Overview

ECHO implements a flexible theming system using TailwindCSS 4 and CSS variables. The application supports both light and dark modes, with a consistent design language throughout the interface. This document explains the theming architecture, customization options, and best practices.

## Core Theming Architecture

### TailwindCSS Integration

The application uses TailwindCSS 4 with a custom configuration:

- **Extended Color Palette**: Custom colors defined for UI elements
- **CSS Variable Integration**: Theme colors mapped to CSS variables
- **Responsive Variants**: Theme adjustments based on screen size
- **Dark Mode Support**: Full dark mode implementation

```typescript
// Example tailwind.config.js structure
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        // Additional color mappings...
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
```

### CSS Variables

Theme colors are defined using CSS variables for dynamic theme switching:

```css
:root {
  /* Light mode variables */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  /* Additional variables... */
}

.dark {
  /* Dark mode variables */
  --background: 20 14.3% 4.1%;
  --foreground: 0 0% 95%;
  --primary: 142.1 70.6% 45.3%;
  --primary-foreground: 144.9 80.4% 10%;
  /* Additional variables... */
}
```

## Theme Components

### Theme Provider

The application uses a theme provider component that:

- Manages theme state (light/dark)
- Handles system preference detection
- Applies theme classes to the document
- Persists user theme preferences

```typescript
// Example ThemeProvider implementation
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  useEffect(() => {
    // Implementation for theme detection and application
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Theme Toggler

A UI component allows users to manually switch themes:

- Toggle between light and dark modes
- Option to follow system preferences
- Visual indicator of current theme

## UI Component Theming

### Buttons

Buttons follow a consistent theming pattern with variants:

- **Primary**: Main action buttons using primary colors
- **Secondary**: Alternative action buttons
- **Outline**: Bordered buttons for less emphasis
- **Ghost**: Minimal styling for subtle actions
- **Destructive**: Error/warning actions in red

```typescript
// Button component variants
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Additional variants...
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Input Elements

Form elements maintain consistent theming:

- Text inputs with consistent border styling
- Focus states with primary color highlights
- Error states with destructive color indicators
- Consistent padding and typography

### Cards and Panels

Container elements follow the theme system:

- Background colors from the theme palette
- Consistent border radius and shadow
- Proper contrast for content readability

## Dark Mode Implementation

### Detection Strategy

The theme system detects user preferences through:

1. Previously saved user preference
2. System color scheme preference
3. Default to light mode if no preference detected

```typescript
// Theme detection logic
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const userTheme = localStorage.getItem('theme');
const resolvedTheme = userTheme || systemTheme;
```

### Color Selection Principles

The dark mode color palette follows these principles:

- **Reduced Brightness**: Lower white point to reduce eye strain
- **Maintained Contrast**: Ensure text remains readable
- **Color Consistency**: Primary colors remain recognizable
- **Reduced Blue Light**: Warmer color temperature

## Component-Specific Theming

### Chat Messages

Messages use different styling based on role:

- User messages with distinct background
- AI responses with contrasting styling
- Thinking messages with subtle styling
- Code blocks with syntax highlighting adapted to theme

### File Tree

The file tree component has themed elements:

- Directory icons with folder colors
- File icons based on file type
- Selection highlights using primary colors
- Hover states for interactive elements

## Customization Options

### Theme Extension

The theme system can be extended by:

1. Adding new CSS variables in the global CSS
2. Extending the TailwindCSS configuration
3. Creating new component variants
4. Adding theme-aware utility classes

### Creating Custom Themes

To create a new theme variation:

1. Define a new set of CSS variables
2. Create a theme toggle option
3. Add the appropriate class application logic
4. Update component variants as needed

## Responsive Theming

The theme system adapts to different screen sizes:

- **Font Size Adjustments**: Larger touch targets on mobile
- **Spacing Variations**: Adjusted padding for smaller screens
- **Layout Shifts**: Different component arrangements on mobile

## Best Practices

### Theme-Aware Development

When extending the application:

1. **Use CSS Variables**: Always reference theme variables instead of hardcoded colors
2. **Test Both Themes**: Ensure components look good in both light and dark modes
3. **Maintain Contrast**: Ensure text remains readable in all themes
4. **Use Tailwind Utilities**: Leverage utility classes for theme-aware styling
5. **Follow Component Patterns**: Use established component variants for consistency

## Next Steps

Explore other aspects of the application in the following documentation sections:

- [Project Overview](01-project-overview.md) - High-level introduction and features
- [File Management System](02-file-management.md) - How the in-browser file system works
- [AI Integration](03-ai-integration.md) - How the Gemini API is integrated
- [User Interface Components](04-user-interface.md) - UI architecture and components
- [Technical Architecture](05-technical-architecture.md) - Overall technical design
- [State Management](06-state-management.md) - Zustand stores and state handling
- [API Integration](07-api-integration.md) - Details of API communication
- [Chat Features](08-chat-features.md) - Advanced chat capabilities
