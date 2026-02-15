/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0B14",
        sidebarBg: "#111122",
        cardBg: "#1A1A2E",
        purplePrimary: "#8B5CF6",
        violetSoft: "#A78BFA",
        lavender: "#C4B5FD"
      },
    },
  },
  plugins: [],
}
