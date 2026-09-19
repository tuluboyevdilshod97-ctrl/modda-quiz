/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3EC',
        ink: '#191512',
        brand: '#8A6B33',
        gold: '#E9C87E',
        logo: '#FFD21E',
        line: '#E7E0D2'
      }
    }
  },
  plugins: [],
}
