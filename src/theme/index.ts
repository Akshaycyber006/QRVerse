// QRVerse Theme System - Apple + Notion + Linear inspired

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Base
  background: string;
  backgroundElevated: string;
  backgroundGradient: [string, string, string];
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  border: string;
  borderSubtle: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Brand
  primary: string;
  primarySoft: string;
  secondary: string;
  accent: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Gradients (for cards/backgrounds)
  brandGradient: [string, string, string];
  auroraGradient: [string, string, string];
  sunsetGradient: [string, string];
  oceanGradient: [string, string];
  neonGradient: [string, string];
  goldGradient: [string, string];

  // Effects
  shadow: string;
  shadowStrong: string;
  glow: string;
  overlay: string;
}

const darkColors: ThemeColors = {
  background: '#08080F',
  backgroundElevated: '#10101A',
  backgroundGradient: ['#08080F', '#0F0A1F', '#1A0F2E'],
  surface: 'rgba(255,255,255,0.04)',
  surfaceElevated: 'rgba(255,255,255,0.08)',
  surfaceGlass: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)',
  borderSubtle: 'rgba(255,255,255,0.05)',

  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary: 'rgba(255,255,255,0.45)',
  textInverse: '#08080F',

  primary: '#8B5CF6',
  primarySoft: 'rgba(139, 92, 246, 0.20)',
  secondary: '#6366F1',
  accent: '#EC4899',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  brandGradient: ['#6366F1', '#8B5CF6', '#A855F7'],
  auroraGradient: ['#3B82F6', '#8B5CF6', '#EC4899'],
  sunsetGradient: ['#F59E0B', '#EC4899'],
  oceanGradient: ['#06B6D4', '#3B82F6'],
  neonGradient: ['#A855F7', '#06B6D4'],
  goldGradient: ['#F59E0B', '#FCD34D'],

  shadow: 'rgba(0,0,0,0.5)',
  shadowStrong: 'rgba(0,0,0,0.7)',
  glow: 'rgba(139, 92, 246, 0.5)',
  overlay: 'rgba(0,0,0,0.65)',
};

const lightColors: ThemeColors = {
  background: '#FAFAFC',
  backgroundElevated: '#FFFFFF',
  backgroundGradient: ['#FAFAFC', '#F3F0FF', '#EFE9FF'],
  surface: 'rgba(255,255,255,0.70)',
  surfaceElevated: 'rgba(255,255,255,0.90)',
  surfaceGlass: 'rgba(255,255,255,0.65)',
  border: 'rgba(0,0,0,0.06)',
  borderSubtle: 'rgba(0,0,0,0.03)',

  text: '#0A0A14',
  textSecondary: 'rgba(10,10,20,0.65)',
  textTertiary: 'rgba(10,10,20,0.40)',
  textInverse: '#FFFFFF',

  primary: '#7C3AED',
  primarySoft: 'rgba(124, 58, 237, 0.10)',
  secondary: '#4F46E5',
  accent: '#DB2777',

  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  brandGradient: ['#4F46E5', '#7C3AED', '#9333EA'],
  auroraGradient: ['#2563EB', '#7C3AED', '#DB2777'],
  sunsetGradient: ['#D97706', '#DB2777'],
  oceanGradient: ['#0891B2', '#2563EB'],
  neonGradient: ['#9333EA', '#0891B2'],
  goldGradient: ['#D97706', '#F59E0B'],

  shadow: 'rgba(20, 10, 50, 0.10)',
  shadowStrong: 'rgba(20, 10, 50, 0.20)',
  glow: 'rgba(124, 58, 237, 0.30)',
  overlay: 'rgba(20,10,50,0.45)',
};

export const themes = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  pill: 999,
};

export const typography = {
  display: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.2 },
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyRegular: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
  micro: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.6 },
};

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export const createTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: themes[mode],
  spacing,
  radius,
  typography,
});