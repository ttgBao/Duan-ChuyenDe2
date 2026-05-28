/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#4f46e5', // indigo-600
          secondary: '#7c3aed', // violet-600
          dark: '#0f172a', // slate-900
          light: '#f8fafc', // slate-50
        }
      }
    },
  },
  plugins: [],
}
