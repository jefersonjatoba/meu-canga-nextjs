/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'precision-black': '#0F0F0F',
        'dark-gray': '#1A1A1A',
        'light-gray': '#F5F5F5',
        'accent-green': '#10B981',
        'accent-blue': '#3B82F6',
        'accent-orange': '#F59E0B',
        'success': '#22C55E',
        'warning': '#EAB308',
        'error': '#EF4444',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
