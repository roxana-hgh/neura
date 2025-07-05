import PrimeUI from 'tailwindcss-primeui';

/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  darkMode: ['class', '.app-dark'], // Use the same selector as PrimeNG
  theme: {
    extend: {
      colors: {
             primary: {
                DEFAULT: '#27272a', // zinc.800 — this will be used when you write bg-primary
                50: '#fafafa',
                100: '#f4f4f5',
                200: '#e4e4e7',
                300: '#d4d4d8',
                400: '#a1a1aa',
                500: '#71717a',
                600: '#52525b',
                700: '#3f3f46',
                800: '#27272a', // <- your primary base color
                900: '#18181b',
                950: '#09090b'
            }
        }
    },
  },
   plugins: [PrimeUI]
}

