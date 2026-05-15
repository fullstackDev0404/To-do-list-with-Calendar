/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // important
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-background": "#1f2937",
        "light-background": "#ffffff",
      },
    },
  },
  plugins: [],
}