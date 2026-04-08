/**
 * Design System Tokens – Modern, premium 2026
 * Use for consistent UI across all screens.
 */

export const colors = {
  // Surfaces
  bg: '#f1f5f9',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceOverlay: 'rgba(0,0,0,0.5)',

  // Primary
  primary: '#0ea5e9',
  primaryLight: '#38bdf8',
  primaryDark: '#0284c7',
  primaryGradientStart: '#0ea5e9',
  primaryGradientEnd: '#0369a1',
  onPrimary: '#ffffff',

  // Text
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  // Semantic
  success: '#059669',
  successBg: '#d1fae5',
  warn: '#d97706',
  warnBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',

  // Status
  open: '#dc2626',
  openBg: '#fee2e2',
  closed: '#059669',
  closedBg: '#d1fae5',

  // Borders
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Skeleton / shimmer
  skeleton: '#e2e8f0',
  skeletonHighlight: '#f1f5f9',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  full: 9999,
} as const;

export const typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  titleMedium: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  titleSmall: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
} as const;

export const elevation = {
  none: 0,
  low: 2,
  medium: 4,
  high: 8,
} as const;

/** Shadow presets for cards and modals (soft, premium look) */
export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  button: {
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

/** Minimum touch target (44px per Apple HIG) */
export const minTouchTarget = 44;
