/**
 * Meu Canga Design System — Animation Utilities
 * Reusable animation classes and keyframe helpers.
 */

export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideDown: `
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  slideOutRight: `
    @keyframes slideOutRight {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100%); }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      from { background-position: -200% 0; }
      to { background-position: 200% 0; }
    }
  `,
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `,
  bounce: `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `,
  countUp: `
    @keyframes countUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
} as const

// Tailwind-compatible animation class names
export const animationClasses = {
  fadeIn: 'animate-[fadeIn_200ms_ease-out_forwards]',
  fadeOut: 'animate-[fadeOut_200ms_ease-in_forwards]',
  slideUp: 'animate-[slideUp_300ms_cubic-bezier(0,0,0.2,1)_forwards]',
  slideDown: 'animate-[slideDown_300ms_cubic-bezier(0,0,0.2,1)_forwards]',
  slideInRight: 'animate-[slideInRight_300ms_cubic-bezier(0,0,0.2,1)_forwards]',
  slideOutRight: 'animate-[slideOutRight_300ms_cubic-bezier(0.4,0,1,1)_forwards]',
  scaleIn: 'animate-[scaleIn_150ms_cubic-bezier(0,0,0.2,1)_forwards]',
  shimmer: 'animate-[shimmer_2s_linear_infinite]',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
} as const

// Staggered animation delays for lists
export const staggerDelays = ['0ms', '75ms', '150ms', '225ms', '300ms', '375ms', '450ms', '525ms'] as const
