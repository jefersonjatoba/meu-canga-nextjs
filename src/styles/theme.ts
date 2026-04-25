/**
 * Meu Canga Design System — Theme Tokens
 * Fintech 2026 standard. Single source of truth for all design decisions.
 */

export const colors = {
  // Core
  precisionBlack: '#0F0F0F',
  darkGray: '#1A1A1A',
  mediumGray: '#2D2D2D',
  borderGray: '#3A3A3A',
  mutedGray: '#6B7280',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',

  // Accent
  accentGreen: '#10B981',
  accentGreenLight: '#D1FAE5',
  accentGreenDark: '#059669',

  accentBlue: '#3B82F6',
  accentBlueLight: '#DBEAFE',
  accentBlueDark: '#1D4ED8',

  accentOrange: '#F59E0B',
  accentOrangeLight: '#FEF3C7',
  accentOrangeDark: '#D97706',

  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  successDark: '#16A34A',

  warning: '#EAB308',
  warningLight: '#FEF9C3',
  warningDark: '#CA8A04',

  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#DC2626',

  info: '#06B6D4',
  infoLight: '#CFFAFE',
  infoDark: '#0891B2',
} as const

export const spacing = {
  0: '0px',
  1: '2px',
  2: '4px',
  3: '6px',
  4: '8px',
  5: '12px',
  6: '16px',
  7: '24px',
  8: '32px',
  9: '48px',
  10: '64px',
  11: '80px',
  12: '96px',
} as const

export const typography = {
  fontFamily: {
    sans: 'var(--font-inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
    mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  // Dark variants — more visible on dark backgrounds
  'sm-dark': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  'md-dark': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
  'lg-dark': '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
  'xl-dark': '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
} as const

export const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  transition: {
    default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const

export const darkMode = {
  background: {
    primary: '#0F0F0F',   // precision-black
    secondary: '#1A1A1A', // dark-gray
    tertiary: '#2D2D2D',  // elevated surface
    card: '#1E1E1E',      // card background
  },
  border: {
    subtle: '#2D2D2D',
    default: '#3A3A3A',
    strong: '#4A4A4A',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
    muted: '#6B7280',
    disabled: '#4B5563',
  },
} as const

export const lightMode = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    card: '#FFFFFF',
  },
  border: {
    subtle: '#F3F4F6',
    default: '#E5E7EB',
    strong: '#D1D5DB',
  },
  text: {
    primary: '#0F0F0F',
    secondary: '#4B5563',
    muted: '#9CA3AF',
    disabled: '#D1D5DB',
  },
} as const

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
} as const

// Breakpoints (matching Tailwind defaults)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  darkMode,
  lightMode,
  zIndex,
  breakpoints,
} as const

export default theme
