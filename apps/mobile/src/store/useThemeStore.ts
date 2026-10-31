import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

export type AppThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  themeMode: AppThemeMode;
  setThemeMode: (mode: AppThemeMode) => Promise<void>;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'dark',

  setThemeMode: async (mode: AppThemeMode) => {
    set({ themeMode: mode });
    try {
      await AsyncStorage.setItem('app_theme_mode', mode);
    } catch (e) {
      console.warn('Failed to save theme mode:', e);
    }
  },

  loadSavedTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem('app_theme_mode');
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        set({ themeMode: saved });
      }
    } catch (_) { }
  },
}));

/**
 * Universal hook that returns the active resolved color palette
 * based on user setting (light, dark, or system OS mode).
 */
export const useAppTheme = () => {
  const themeMode = useThemeStore((state) => state.themeMode);
  const systemColorScheme = useColorScheme();

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme !== 'light');

  const palette = isDark ? Colors.dark : Colors.light;

  return {
    isDark,
    themeMode,
    colors: {
      ...palette,
      primary: Colors.primary,
      secondary: Colors.secondary,
      ambientGlow: Colors.ambientGlow,
      status: Colors.status,
      // Adaptive surface helpers
      canvas: isDark ? '#0B0F19' : '#F8FAFC',
      surface: isDark ? '#151D2F' : '#FFFFFF',
      surfaceElevated: isDark ? '#1E293B' : '#F1F5F9',
      border: isDark ? '#2A364F' : '#E2E8F0',
      textPrimary: isDark ? '#F8FAFC' : '#0F172A',
      textSecondary: isDark ? '#94A3B8' : '#64748B',
      cardShadow: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)',
      pillBg: isDark ? '#1E293B' : '#EEF2F6',
    },
  };
};

