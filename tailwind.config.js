/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
    theme: {
    extend: {
      fontFamily: {
        gilroy: ['Gilroy', 'sans-serif'],
      },
      colors: {
        primary: '#ef6a36',
        black: '#000000',
        graybg: '#f7f7f7',
        white: '#ffffff',
      },
    },
  },
  plugins: [],
};
