/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',
        accent1: '#7C5CFC',
        accent2: '#2F80ED'
      }
    }
  },
  plugins: [],
}
