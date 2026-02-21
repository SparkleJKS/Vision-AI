export type ThemeId = 'accessibility' | 'neon';

export interface ThemeTokens {
  // Core
  id: ThemeId;
  name: string;

  // Backgrounds
  screenBg: string;
  cardBg: string;
  cardBgLight: string;
  tabBarBg: string;
  darkBg: string;

  // Borders
  border: string;

  // Text
  white: string;
  grey: string;
  muted: string;

  // Primary accent (main CTA, active states)
  primary: string;

  // Semantic
  success: string;
  warning: string;
  error: string;

  tabHome: string;
  tabExplore: string;
  tabVoice: string;
  tabAlerts: string;
  tabSettings: string;
  tabInactive: string;

  // Explore screen
  explorePanelBg: string;
  exploreSurfaceBg: string;
  exploreBorder: string;
  exploreLabel: string;
  exploreAccent: string;

  accentYellow: string;
  green: string;

  settingsProfile: string;
  settingsVoice: string;
  settingsVision: string;
  settingsDevices: string;
  settingsAccessibility: string;
}

export const THEME_ACCESSIBILITY: ThemeTokens = {
  id: 'accessibility',
  name: 'Accessibility Mode',
  screenBg: '#0f1117',
  cardBg: '#1a1d24',
  cardBgLight: '#2d3142',
  tabBarBg: '#1a1d24',
  darkBg: '#000000',
  border: '#2d3142',
  white: '#ffffff',
  grey: '#9ca3af',
  muted: '#9ca3af',
  primary: '#FFD54F',
  success: '#22c55e',
  warning: '#ef4444',
  error: '#F87171',
  tabHome: '#FFD54F',
  tabExplore: '#FFD54F',
  tabVoice: '#FFD54F',
  tabAlerts: '#FFD54F',
  tabSettings: '#FFD54F',
  tabInactive: '#ffffff',
  explorePanelBg: '#16191F',
  exploreSurfaceBg: '#0E1015',
  exploreBorder: '#2B313D',
  exploreLabel: '#9CA3AF',
  exploreAccent: '#FFD54F',
  accentYellow: '#FFD54F',
  green: '#22c55e',
  settingsProfile: '#FFD54F',
  settingsVoice: '#FFD54F',
  settingsVision: '#FFD54F',
  settingsDevices: '#FFD54F',
  settingsAccessibility: '#FFD54F',
};

export const THEME_NEON: ThemeTokens = {
  id: 'neon',
  name: 'Neon Mode',
  screenBg: '#080B10',
  cardBg: '#0F1620',
  cardBgLight: '#131C28',
  tabBarBg: '#080B10',
  darkBg: '#0A0F18',
  border: '#1E2D3D',
  white: '#F1F5F9',
  grey: '#475569',
  muted: '#64748B',
  primary: '#22C55E',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#F43F5E',
  tabHome: '#22C55E',
  tabExplore: '#22C55E',
  tabVoice: '#6366F1',
  tabAlerts: '#F59E0B',
  tabSettings: '#14B8A6',
  tabInactive: '#334155',
  explorePanelBg: '#16191F',
  exploreSurfaceBg: '#0E1015',
  exploreBorder: '#2B313D',
  exploreLabel: '#9CA3AF',
  exploreAccent: '#22C55E',
  accentYellow: '#22C55E',
  green: '#22C55E',
  settingsProfile: '#22C55E',
  settingsVoice: '#6366F1',
  settingsVision: '#38BDF8',
  settingsDevices: '#14B8A6',
  settingsAccessibility: '#A855F7',
};

export const THEMES: Record<ThemeId, ThemeTokens> = {
  accessibility: THEME_ACCESSIBILITY,
  neon: THEME_NEON,
};
