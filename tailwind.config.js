import PrimeUI from 'tailwindcss-primeui';

/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  darkMode: ['class', '.dark'], 
  theme: {
    extend: {
      colors: {
        primary: {
          // Light mode: zinc-900 as DEFAULT
          DEFAULT: '#18181b', // zinc.900
          50: '#fafafa',      // zinc.50
          100: '#f4f4f5',     // zinc.100
          200: '#e4e4e7',     // zinc.200
          300: '#d4d4d8',     // zinc.300
          400: '#a1a1aa',     // zinc.400
          500: '#71717a',     // zinc.500
          600: '#52525b',     // zinc.600
          700: '#3f3f46',     // zinc.700
          800: '#27272a',     // zinc.800
          900: '#18181b',     // zinc.900
          950: '#09090b'      // zinc.950
        },
        // Dark mode primary colors (white/very light shades)
        'primary-dark': {
          DEFAULT: '#ffffff', // pure white
          50: '#ffffff',      // pure white
          100: '#fafafa',     // zinc.50
          200: '#f4f4f5',     // zinc.100
          300: '#e4e4e7',     // zinc.200
          400: '#d4d4d8',     // zinc.300
          500: '#a1a1aa',     // zinc.400
          600: '#71717a',     // zinc.500
          700: '#52525b',     // zinc.600
          800: '#3f3f46',     // zinc.700
          900: '#27272a',     // zinc.800
          950: '#18181b'      // zinc.900
        }
      }
    },
  },
  plugins: [
    PrimeUI,
    // Custom plugin to handle dark mode primary colors
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.dark .bg-primary': {
          'background-color': theme('colors.primary-dark.DEFAULT'),
        },
        '.dark .text-primary': {
          color: theme('colors.primary-dark.DEFAULT'),
        },
        '.dark .border-primary': {
          'border-color': theme('colors.primary-dark.DEFAULT'),
        },
        '.dark .bg-primary-50': {
          'background-color': theme('colors.primary-dark.50'),
        },
        '.dark .bg-primary-100': {
          'background-color': theme('colors.primary-dark.100'),
        },
        '.dark .bg-primary-200': {
          'background-color': theme('colors.primary-dark.200'),
        },
        '.dark .bg-primary-300': {
          'background-color': theme('colors.primary-dark.300'),
        },
        '.dark .bg-primary-400': {
          'background-color': theme('colors.primary-dark.400'),
        },
        '.dark .bg-primary-500': {
          'background-color': theme('colors.primary-dark.500'),
        },
        '.dark .bg-primary-600': {
          'background-color': theme('colors.primary-dark.600'),
        },
        '.dark .bg-primary-700': {
          'background-color': theme('colors.primary-dark.700'),
        },
        '.dark .bg-primary-800': {
          'background-color': theme('colors.primary-dark.800'),
        },
        '.dark .bg-primary-900': {
          'background-color': theme('colors.primary-dark.900'),
        },
        '.dark .bg-primary-950': {
          'background-color': theme('colors.primary-dark.950'),
        },
        // Text colors
        '.dark .text-primary-50': {
          color: theme('colors.primary-dark.50'),
        },
        '.dark .text-primary-100': {
          color: theme('colors.primary-dark.100'),
        },
        '.dark .text-primary-200': {
          color: theme('colors.primary-dark.200'),
        },
        '.dark .text-primary-300': {
          color: theme('colors.primary-dark.300'),
        },
        '.dark .text-primary-400': {
          color: theme('colors.primary-dark.400'),
        },
        '.dark .text-primary-500': {
          color: theme('colors.primary-dark.500'),
        },
        '.dark .text-primary-600': {
          color: theme('colors.primary-dark.600'),
        },
        '.dark .text-primary-700': {
          color: theme('colors.primary-dark.700'),
        },
        '.dark .text-primary-800': {
          color: theme('colors.primary-dark.800'),
        },
        '.dark .text-primary-900': {
          color: theme('colors.primary-dark.900'),
        },
        '.dark .text-primary-950': {
          color: theme('colors.primary-dark.950'),
        },
        // Border colors
        '.dark .border-primary-50': {
          'border-color': theme('colors.primary-dark.50'),
        },
        '.dark .border-primary-100': {
          'border-color': theme('colors.primary-dark.100'),
        },
        '.dark .border-primary-200': {
          'border-color': theme('colors.primary-dark.200'),
        },
        '.dark .border-primary-300': {
          'border-color': theme('colors.primary-dark.300'),
        },
        '.dark .border-primary-400': {
          'border-color': theme('colors.primary-dark.400'),
        },
        '.dark .border-primary-500': {
          'border-color': theme('colors.primary-dark.500'),
        },
        '.dark .border-primary-600': {
          'border-color': theme('colors.primary-dark.600'),
        },
        '.dark .border-primary-700': {
          'border-color': theme('colors.primary-dark.700'),
        },
        '.dark .border-primary-800': {
          'border-color': theme('colors.primary-dark.800'),
        },
        '.dark .border-primary-900': {
          'border-color': theme('colors.primary-dark.900'),
        },
        '.dark .border-primary-950': {
          'border-color': theme('colors.primary-dark.950'),
        }
      }
      addUtilities(newUtilities)
    }
  ]
}