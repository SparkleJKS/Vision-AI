/** @deprecated Use useTheme() for theme-aware colors. */
export const colors = {
  // Backgrounds
  screenBg: '#080B10',
  cardBg: '#0F1620',
  cardBgLight: '#131C28',
  tabBarBg: '#080B10',
  darkBg: '#0A0F18',

  // Borders
  border: '#1E2D3D',

  // Text
  white: '#F1F5F9',
  grey: '#475569',
  muted: '#64748B',

  // Accents
  accentGreen: '#22C55E',
  accentIndigo: '#6366F1',
  accentAmber: '#F59E0B',
  accentCyan: '#06B6D4',
  accentRose: '#F43F5E',
  accentViolet: '#A855F7',
  accentSky: '#38BDF8',
  accentTeal: '#14B8A6',

  accentYellow: '#22C55E',
  green: '#22C55E',
  warning: '#F59E0B',
} as const;

export type Colors = typeof colors;
