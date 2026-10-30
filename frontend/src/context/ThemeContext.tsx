import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ThemePreset,
  FontOption,
  themePresets,
  fontOptions,
  THEME_STORAGE_KEY,
  FONT_STORAGE_KEY,
  DARK_MODE_STORAGE_KEY,
} from '@/lib/themes';

interface ThemeContextType {
  currentTheme: ThemePreset;
  currentFont: FontOption;
  isDarkMode: boolean;
  setTheme: (themeId: string) => void;
  setFont: (fontId: string) => void;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  themePresets: ThemePreset[];
  fontOptions: FontOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(themePresets[0]);
  const [currentFont, setCurrentFont] = useState<FontOption>(fontOptions[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    const savedFontId = localStorage.getItem(FONT_STORAGE_KEY);
    const savedDarkMode = localStorage.getItem(DARK_MODE_STORAGE_KEY);

    if (savedThemeId) {
      const theme = themePresets.find((t) => t.id === savedThemeId);
      if (theme) setCurrentTheme(theme);
    }

    if (savedFontId) {
      const font = fontOptions.find((f) => f.id === savedFontId);
      if (font) setCurrentFont(font);
    }

    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Apply theme colors when theme or dark mode changes
  useEffect(() => {
    const root = document.documentElement;
    const colors = isDarkMode ? currentTheme.colors.dark : currentTheme.colors.light;

    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--sidebar-primary', colors.sidebarPrimary);
    root.style.setProperty('--sidebar-ring', colors.sidebarRing);
  }, [currentTheme, isDarkMode]);

  // Apply dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Apply font when font changes
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', currentFont.value);
    document.body.style.fontFamily = currentFont.value;
  }, [currentFont]);

  const setTheme = (themeId: string) => {
    const theme = themePresets.find((t) => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
  };

  const setFont = (fontId: string) => {
    const font = fontOptions.find((f) => f.id === fontId);
    if (font) {
      setCurrentFont(font);
      localStorage.setItem(FONT_STORAGE_KEY, fontId);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(DARK_MODE_STORAGE_KEY, String(newValue));
      return newValue;
    });
  };

  const handleSetDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDark));
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        currentFont,
        isDarkMode,
        setTheme,
        setFont,
        toggleDarkMode,
        setDarkMode: handleSetDarkMode,
        themePresets,
        fontOptions,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
