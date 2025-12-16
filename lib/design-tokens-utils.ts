// Design Tokens Utilities
// Provides programmatic access to design tokens for components

import {
  spacing,
  typography,
  colors,
  shadows,
  borderRadius,
  breakpoints,
  components,
  animations,
  zIndex,
} from '@/lib/design-tokens';

// Utility functions for accessing tokens
export const getSpacing = (key: keyof typeof spacing) => spacing[key];
export const getFontSize = (key: keyof typeof typography.fontSize) =>
  typography.fontSize[key];
export const getFontWeight = (key: keyof typeof typography.fontWeight) =>
  typography.fontWeight[key];
export const getLineHeight = (key: keyof typeof typography.lineHeight) =>
  typography.lineHeight[key];
export const getColor = <C extends keyof typeof colors>(
  category: C,
  shade?: keyof typeof colors[C]
) => {
  const colorGroup = colors[category];
  if (typeof colorGroup === 'string') return colorGroup;
  const resolvedShade = (shade ?? 500) as keyof typeof colorGroup;
  return colorGroup[resolvedShade];
};
export const getShadow = (key: keyof typeof shadows) => shadows[key];
export const getBorderRadius = (key: keyof typeof borderRadius) =>
  borderRadius[key];
export const getBreakpoint = (key: keyof typeof breakpoints) =>
  breakpoints[key];
export const getComponentToken = (
  component: keyof typeof components,
  property: string
) => {
  const componentTokens = components[component];
  return componentTokens[property as keyof typeof componentTokens];
};
export const getAnimationDuration = (key: keyof typeof animations.duration) =>
  animations.duration[key];
export const getAnimationEasing = (key: keyof typeof animations.easing) =>
  animations.easing[key];
export const getZIndex = (key: keyof typeof zIndex) => zIndex[key];

// CSS custom property names (for dynamic styling)
export const cssVars = {
  // Colors
  background: 'var(--color-background)',
  foreground: 'var(--color-foreground)',
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  muted: 'var(--color-muted)',
  accent: 'var(--color-accent)',
  destructive: 'var(--color-destructive)',
  border: 'var(--color-border)',
  input: 'var(--color-input)',
  ring: 'var(--color-ring)',

  // Typography
  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
    '5xl': 'var(--font-size-5xl)',
    '6xl': 'var(--font-size-6xl)',
  },

  // Spacing
  spacing: {
    0: 'var(--spacing-0)',
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    3: 'var(--spacing-3)',
    4: 'var(--spacing-4)',
    5: 'var(--spacing-5)',
    6: 'var(--spacing-6)',
    8: 'var(--spacing-8)',
    10: 'var(--spacing-10)',
    12: 'var(--spacing-12)',
    16: 'var(--spacing-16)',
    20: 'var(--spacing-20)',
    24: 'var(--spacing-24)',
    32: 'var(--spacing-32)',
  },

  // Border radius
  radius: 'var(--radius)',
  radiusSm: 'var(--radius-sm)',
  radiusMd: 'var(--radius-md)',
  radiusLg: 'var(--radius-lg)',
  radiusXl: 'var(--radius-xl)',
  radius2xl: 'var(--radius-2xl)',
  radius3xl: 'var(--radius-3xl)',
  radiusFull: 'var(--radius-full)',

  // Shadows
  shadowSm: 'var(--shadow-sm)',
  shadow: 'var(--shadow-base)',
  shadowMd: 'var(--shadow-md)',
  shadowLg: 'var(--shadow-lg)',
  shadowXl: 'var(--shadow-xl)',
  shadow2xl: 'var(--shadow-2xl)',
} as const;

// Type-safe token access
export type SpacingToken = keyof typeof spacing;
export type ColorToken = keyof typeof colors;
export type TypographyToken = keyof typeof typography;
export type ShadowToken = keyof typeof shadows;
export type BorderRadiusToken = keyof typeof borderRadius;
export type BreakpointToken = keyof typeof breakpoints;

// Theme-aware color access (light/dark mode)
export const themeColors = {
  light: {
    background: colors.neutral[50],
    foreground: colors.neutral[900],
    card: colors.neutral[50],
    'card-foreground': colors.neutral[900],
    primary: colors.primary[500],
    'primary-foreground': colors.neutral[50],
    secondary: colors.secondary[100],
    'secondary-foreground': colors.neutral[900],
    muted: colors.secondary[100],
    'muted-foreground': colors.neutral[600],
    accent: colors.success[500],
    'accent-foreground': colors.neutral[50],
    destructive: colors.error[500],
    'destructive-foreground': colors.neutral[50],
    border: colors.secondary[200],
    input: colors.secondary[200],
    ring: colors.primary[500],
  },
  dark: {
    background: colors.neutral[900],
    foreground: colors.neutral[50],
    card: colors.neutral[800],
    'card-foreground': colors.neutral[50],
    primary: colors.primary[400],
    'primary-foreground': colors.neutral[900],
    secondary: colors.neutral[700],
    'secondary-foreground': colors.neutral[50],
    muted: colors.neutral[700],
    'muted-foreground': colors.neutral[300],
    accent: colors.success[400],
    'accent-foreground': colors.neutral[900],
    destructive: colors.error[400],
    'destructive-foreground': colors.neutral[50],
    border: colors.neutral[600],
    input: colors.neutral[600],
    ring: colors.primary[400],
  },
} as const;

// Export all tokens for direct access
export {
  spacing,
  typography,
  colors,
  shadows,
  borderRadius,
  breakpoints,
  components,
  animations,
  zIndex,
};
