/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#99edc3',
          dark: '#7dd4ab',
          mint: '#99edc3',
        },
        secondary: {
          DEFAULT: '#c2aff0',
          dark: '#ab96dd',
          lavender: '#c2aff0',
        },
        dark: '#373737',
        background: '#f8fafb',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
