/**
 * EuroNano Translate — Design System Theme
 *
 * Premium dark mode theme with curated color palette,
 * glassmorphism effects, and typography system.
 */

import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ──────────────────────────────────────────────────────────

export const colors = {
  // Primary backgrounds
  bg: {
    primary: '#0A0E1A',      // Deep navy
    secondary: '#111827',     // Dark slate
    tertiary: '#1A2332',      // Lighter navy
    card: '#151D2E',          // Card background
    elevated: '#1E293B',      // Elevated surfaces
    input: '#0F172A',         // Input fields
  },

  // Glass effects
  glass: {
    bg: 'rgba(255, 255, 255, 0.04)',
    bgHover: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(255, 255, 255, 0.15)',
    overlay: 'rgba(10, 14, 26, 0.85)',
  },

  // Accent colors
  accent: {
    primary: '#3B82F6',       // Electric blue
    primaryLight: '#60A5FA',  // Lighter blue
    primaryDark: '#2563EB',   // Darker blue
    secondary: '#8B5CF6',     // Purple
    success: '#10B981',       // Emerald green
    warning: '#F59E0B',       // Amber
    error: '#EF4444',         // Red
    info: '#06B6D4',          // Cyan
  },

  // Gradients
  gradient: {
    primary: ['#3B82F6', '#8B5CF6'],     // Blue → Purple
    secondary: ['#06B6D4', '#3B82F6'],   // Cyan → Blue
    success: ['#10B981', '#059669'],      // Green shades
    warm: ['#F59E0B', '#EF4444'],        // Amber → Red
    glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)'],
  },

  // Text
  text: {
    primary: '#F1F5F9',       // Almost white
    secondary: '#94A3B8',     // Slate gray
    tertiary: '#64748B',      // Muted gray
    inverse: '#0A0E1A',       // For light backgrounds
    accent: '#60A5FA',        // Blue accent text
    placeholder: '#475569',   // Placeholder text
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(59, 130, 246, 0.5)',
    error: 'rgba(239, 68, 68, 0.5)',
  },

  // Language flags / indicators
  language: {
    source: '#3B82F6',
    target: '#8B5CF6',
    pivot: '#F59E0B',
    swap: '#10B981',
  },

  // Status indicators
  status: {
    online: '#10B981',
    offline: '#EF4444',
    loading: '#F59E0B',
    ready: '#3B82F6',
  },
};

// ─── Typography ─────────────────────────────────────────────────────────────

export const typography = {
  fonts: {
    regular: Platform.select({
      ios: 'Inter_400Regular',
      android: 'Inter_400Regular',
      default: 'Inter_400Regular',
    }) as string,
    medium: Platform.select({
      ios: 'Inter_500Medium',
      android: 'Inter_500Medium',
      default: 'Inter_500Medium',
    }) as string,
    semibold: Platform.select({
      ios: 'Inter_600SemiBold',
      android: 'Inter_600SemiBold',
      default: 'Inter_600SemiBold',
    }) as string,
    bold: Platform.select({
      ios: 'Inter_700Bold',
      android: 'Inter_700Bold',
      default: 'Inter_700Bold',
    }) as string,
    display: Platform.select({
      ios: 'Outfit_700Bold',
      android: 'Outfit_700Bold',
      default: 'Outfit_700Bold',
    }) as string,
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

// ─── Spacing ────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ─── Border Radius ──────────────────────────────────────────────────────────

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// ─── Shadows ────────────────────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  }),
};

// ─── Animation Durations ────────────────────────────────────────────────────

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

// ─── Layout ─────────────────────────────────────────────────────────────────

export const layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  contentMaxWidth: 480,
  statusBarHeight: StatusBar.currentHeight || 0,
  tabBarHeight: 64,
  headerHeight: 56,
};

// ─── Glassmorphism Styles ───────────────────────────────────────────────────

export const glassStyles = {
  card: {
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.lg,
  },
  cardActive: {
    backgroundColor: colors.glass.bgHover,
    borderWidth: 1,
    borderColor: colors.glass.borderActive,
    borderRadius: borderRadius.lg,
  },
  modal: {
    backgroundColor: colors.glass.overlay,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.xl,
  },
};

// ─── Common Styles ──────────────────────────────────────────────────────────

export const commonStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  contentPadding: {
    paddingHorizontal: spacing.base,
  },
  centerContent: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.md,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  layout,
  glassStyles,
  commonStyles,
};
