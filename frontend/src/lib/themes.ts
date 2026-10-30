// Theme types and presets for the application

export interface ThemeColors {
  primary: string;
  secondary: string;
  ring: string;
  sidebarPrimary: string;
  sidebarRing: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  preview: string; // Preview color for the selector
}

export interface FontOption {
  id: string;
  name: string;
  value: string;
}

// Available font options
export const fontOptions: FontOption[] = [
  { id: 'system', name: 'System Default', value: 'ui-sans-serif, system-ui, sans-serif' },
  { id: 'inter', name: 'Inter', value: '"Inter", ui-sans-serif, system-ui, sans-serif' },
  { id: 'roboto', name: 'Roboto', value: '"Roboto", ui-sans-serif, system-ui, sans-serif' },
  { id: 'opensans', name: 'Open Sans', value: '"Open Sans", ui-sans-serif, system-ui, sans-serif' },
  { id: 'poppins', name: 'Poppins', value: '"Poppins", ui-sans-serif, system-ui, sans-serif' },
];

// Color scheme presets
export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Ocean Blue',
    preview: 'hsl(196, 80%, 45%)',
    colors: {
      light: {
        primary: '196 80% 45%',
        secondary: '199 89% 60%',
        ring: '196 80% 45%',
        sidebarPrimary: '196 80% 45%',
        sidebarRing: '196 80% 45%',
      },
      dark: {
        primary: '196 80% 45%',
        secondary: '199 89% 50%',
        ring: '196 80% 45%',
        sidebarPrimary: '196 80% 45%',
        sidebarRing: '196 80% 45%',
      },
    },
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    preview: 'hsl(160, 84%, 39%)',
    colors: {
      light: {
        primary: '160 84% 39%',
        secondary: '158 64% 52%',
        ring: '160 84% 39%',
        sidebarPrimary: '160 84% 39%',
        sidebarRing: '160 84% 39%',
      },
      dark: {
        primary: '160 84% 39%',
        secondary: '158 64% 42%',
        ring: '160 84% 39%',
        sidebarPrimary: '160 84% 39%',
        sidebarRing: '160 84% 39%',
      },
    },
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    preview: 'hsl(262, 83%, 58%)',
    colors: {
      light: {
        primary: '262 83% 58%',
        secondary: '258 90% 66%',
        ring: '262 83% 58%',
        sidebarPrimary: '262 83% 58%',
        sidebarRing: '262 83% 58%',
      },
      dark: {
        primary: '262 83% 58%',
        secondary: '258 90% 56%',
        ring: '262 83% 58%',
        sidebarPrimary: '262 83% 58%',
        sidebarRing: '262 83% 58%',
      },
    },
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    preview: 'hsl(346, 77%, 50%)',
    colors: {
      light: {
        primary: '346 77% 50%',
        secondary: '340 82% 59%',
        ring: '346 77% 50%',
        sidebarPrimary: '346 77% 50%',
        sidebarRing: '346 77% 50%',
      },
      dark: {
        primary: '346 77% 50%',
        secondary: '340 82% 49%',
        ring: '346 77% 50%',
        sidebarPrimary: '346 77% 50%',
        sidebarRing: '346 77% 50%',
      },
    },
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    preview: 'hsl(38, 92%, 50%)',
    colors: {
      light: {
        primary: '38 92% 50%',
        secondary: '32 95% 44%',
        ring: '38 92% 50%',
        sidebarPrimary: '38 92% 50%',
        sidebarRing: '38 92% 50%',
      },
      dark: {
        primary: '38 92% 50%',
        secondary: '32 95% 44%',
        ring: '38 92% 50%',
        sidebarPrimary: '38 92% 50%',
        sidebarRing: '38 92% 50%',
      },
    },
  },
  {
    id: 'slate',
    name: 'Slate Gray',
    preview: 'hsl(215, 16%, 47%)',
    colors: {
      light: {
        primary: '215 16% 47%',
        secondary: '215 20% 65%',
        ring: '215 16% 47%',
        sidebarPrimary: '215 16% 47%',
        sidebarRing: '215 16% 47%',
      },
      dark: {
        primary: '215 20% 65%',
        secondary: '215 16% 47%',
        ring: '215 20% 65%',
        sidebarPrimary: '215 20% 65%',
        sidebarRing: '215 20% 65%',
      },
    },
  },
];

// Storage keys
export const THEME_STORAGE_KEY = 'app-theme-preset';
export const FONT_STORAGE_KEY = 'app-font';
export const DARK_MODE_STORAGE_KEY = 'app-dark-mode';
