module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // include your source files
  ],
  darkMode: "class", 
  theme: {
    extend: {
      fontFamily: {
        sans: ['Abel', 'sans-serif'], // This will make Abel the default sans-serif font
      },
    },
  },
  plugins: [],
}
