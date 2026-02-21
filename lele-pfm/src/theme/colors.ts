export type Colors = typeof lightColors;

export const lightColors = {
  // Primary
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Secondary
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#145231',
  },

  // Accent (Orange)
  accent: {
    50: '#FEF3C7',
    100: '#FED7AA',
    200: '#FDBA74',
    300: '#FB923C',
    400: '#F97316',
    500: '#EA580C',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Danger (Red)
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Warning (Amber)
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Success (Green)
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#145231',
  },

  // Neutral (Gray)
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    150: '#EFEFEF',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  // Grade Colors
  grade: {
    'A+': '#FFD700',
    'A': '#1E40AF',
    'B': '#16A34A',
    'C': '#D97706',
    'D': '#B45309',
    'E': '#DC2626',
  },

  // Transaction Type Colors
  transactionType: {
    Fixe: '#2563EB',
    Variable: '#EA580C',
    Imprévue: '#DC2626',
    'Épargne-Dette': '#16A34A',
  },

  // Waterfall Colors
  waterfall: {
    P1: '#2563EB',
    P2: '#EA580C',
    P3: '#16A34A',
    P4: '#EC4899',
  },

  // Semantic
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#171717',
  textSecondary: '#525252',
  textTertiary: '#A3A3A3',
  border: '#E5E5E5',
  borderLight: '#F5F5F5',
  divider: '#D4D4D4',

  // Status
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#2563EB',
};

export const darkColors = {
  // Primary
  primary: {
    50: '#0F172A',
    100: '#0F172A',
    200: '#1E293B',
    300: '#334155',
    400: '#475569',
    500: '#64748B',
    600: '#1E40AF',
    700: '#1D4ED8',
    800: '#2563EB',
    900: '#3B82F6',
  },

  // Secondary
  secondary: {
    50: '#020F02',
    100: '#052E05',
    200: '#0D4C0D',
    300: '#166534',
    400: '#15803D',
    500: '#16A34A',
    600: '#22C55E',
    700: '#4ADE80',
    800: '#86EFAC',
    900: '#DCFCE7',
  },

  // Accent (Orange)
  accent: {
    50: '#460E04',
    100: '#5F1E08',
    200: '#78350F',
    300: '#92400E',
    400: '#B45309',
    500: '#D97706',
    600: '#FB923C',
    700: '#FDBA74',
    800: '#FED7AA',
    900: '#FEF3C7',
  },

  // Danger (Red)
  danger: {
    50: '#450A0A',
    100: '#711C1C',
    200: '#991B1B',
    300: '#B91C1C',
    400: '#DC2626',
    500: '#EF4444',
    600: '#F87171',
    700: '#FCA5A5',
    800: '#FEE2E2',
    900: '#FEF2F2',
  },

  // Warning (Amber)
  warning: {
    50: '#451A03',
    100: '#5F3007',
    200: '#78350F',
    300: '#92400E',
    400: '#B45309',
    500: '#D97706',
    600: '#F59E0B',
    700: '#FBBF24',
    800: '#FDE68A',
    900: '#FFFBEB',
  },

  // Success (Green)
  success: {
    50: '#052E05',
    100: '#0D4C0D',
    200: '#166534',
    300: '#15803D',
    400: '#16A34A',
    500: '#22C55E',
    600: '#4ADE80',
    700: '#86EFAC',
    800: '#BBF7D0',
    900: '#DCFCE7',
  },

  // Neutral (Gray)
  neutral: {
    50: '#0A0A0A',
    100: '#171717',
    150: '#262626',
    200: '#404040',
    300: '#525252',
    400: '#737373',
    500: '#A3A3A3',
    600: '#D4D4D4',
    700: '#E5E5E5',
    800: '#EFEFEF',
    900: '#F5F5F5',
    950: '#FAFAFA',
  },

  // Grade Colors
  grade: {
    'A+': '#FFD700',
    'A': '#60A5FA',
    'B': '#4ADE80',
    'C': '#FDBA74',
    'D': '#FB923C',
    'E': '#F87171',
  },

  // Transaction Type Colors
  transactionType: {
    Fixe: '#60A5FA',
    Variable: '#FDBA74',
    Imprévue: '#F87171',
    'Épargne-Dette': '#4ADE80',
  },

  // Waterfall Colors
  waterfall: {
    P1: '#60A5FA',
    P2: '#FDBA74',
    P3: '#4ADE80',
    P4: '#F472B6',
  },

  // Neon / Stitch Gold
  neon: {
    primary: '#FBBF24',
    secondary: '#D9A11B',
    glow: 'rgba(251,189,35,0.3)',
  },

  // Semantic (aligned with Stitch gold theme)
  background: '#0F1014',
  surface: '#1A1C23',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#52525B',
  border: 'rgba(255,255,255,0.1)',
  borderLight: '#1A1C23',
  divider: 'rgba(255,255,255,0.08)',

  // Status
  success: '#4ADE80',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
};
