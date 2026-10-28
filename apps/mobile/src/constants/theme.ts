/**
 * PagePulse AI — Master Design Tokens & Theme Specification
 * Source of truth: BRANDING_GUIDELINES.md
 */

export const Colors = {
  // Brand Core
  primary: '#E285C3',
  primaryHover: '#D66EB1',
  secondary: '#818CF8',
  ambientGlow: '#E0E7FF',

  // Dark Mode Palette (Default)
  dark: {
    canvas: '#0F172A',
    surface: '#1E293B',
    secondary: '#334155',
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    cardShadow: 'rgba(226, 133, 195, 0.15)',
  },

  // Light Mode Palette
  light: {
    canvas: '#F5F6FA',
    surface: '#FFFFFF',
    secondary: '#E0E7FF',
    border: '#E2E8F0',
    textPrimary: '#222222',
    textSecondary: '#64748B',
    cardShadow: 'rgba(226, 133, 195, 0.20)',
  },

  // In-App Reader Canvases
  reader: {
    day: { background: '#FFFFFF', text: '#1A1A1A', name: 'Day' },
    sepia: { background: '#FBF0D9', text: '#433422', name: 'Sepia' },
    night: { background: '#0F172A', text: '#E2E8F0', name: 'Night' },
    rose: { background: '#FFF5F9', text: '#2A1B24', name: 'Rose' },
  },

  // Status Indicators
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const Typography = {
  hero: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  bookCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};
