/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0c372b", // Customize as needed
        secondary: "#1a202c",
        foreground: "#ffffff",
        "primary-foreground": "#ffffff",
        "secondary-foreground": "#ffffff",
        "muted-foreground": "#a0aec0",
        ring: "#3182ce",
        input: "#e2e8f0",
        background: "#ffffff",
        popover: "#f7fafc",
        card: "#ffffff",
        "card-foreground": "#1a202c",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
