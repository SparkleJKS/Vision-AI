import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeId, ThemeTokens } from './tokens';
import { THEMES, THEME_ACCESSIBILITY } from './tokens';

const STORAGE_KEY = '@visionai/theme';

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemeTokens;
  setTheme: (id: ThemeId) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LEGACY_MIGRATION: Record<string, ThemeId> = {
  original: 'accessibility',
  classic: 'accessibility',
  overhaul: 'neon',
  modern: 'neon',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>('accessibility');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'accessibility' || stored === 'neon') {
          setThemeIdState(stored);
        } else if (stored && LEGACY_MIGRATION[stored]) {
          const migrated = LEGACY_MIGRATION[stored];
          setThemeIdState(migrated);
          AsyncStorage.setItem(STORAGE_KEY, migrated);
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback(async (id: ThemeId) => {
    setThemeIdState(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const safeThemeId = themeId ?? 'accessibility';
  const theme = (THEMES && THEMES[safeThemeId]) ?? THEME_ACCESSIBILITY;

  const value: ThemeContextValue = {
    themeId: safeThemeId,
    theme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
