const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wildr: {
          gray: {
            500: '#A2A3A9',
            900: '#343539',
            1000: '#1A1A1E',
          },
          emerald: {
            500: '#00A84E',
            1000: '#007637',
          },
          overlay: {
            DEFAULT: '#4B4B4B',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-slussen)', ...fontFamily.sans],
        body: ['var(--font-satoshi)', ...fontFamily.sans],
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
