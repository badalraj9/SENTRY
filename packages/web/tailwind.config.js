/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // SENTRY UI REWRITE - Nothing OS / Technical Brutalism / Light Mode
        canvas: {
          dark: "#000000",
          light: "#F9FAFB", // Light Mode background
        },
        brand: {
          500: "#000000", // Pure Black
          400: "#333333",
          600: "#666666",
        },
        semantic: {
          primary: "#000000", // Black Buttons
          active: "#D33E33", // Technical Crimson
          doc: "#000000",
        },
        surface: {
          raised: "#FFFFFF",
          debossed: "#F5F5F5",
        },
        terminal: {
          950: "#FFFFFF", // Flipped: 950 is now white
          900: "#F5F5F5",
          850: "#EEEEEE",
          800: "#CCCCCC",
          700: "#999999",
          600: "#666666",
          500: "#333333",
          400: "#222222",
          300: "#111111",
          200: "#0a0a0a",
          100: "#050505",
          50: "#000000", // Flipped: 50 is now black
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        header: ["VT323", "monospace"], // Display Font (Dot Matrix)
        mono: ["Space Mono", "JetBrains Mono", "monospace"], // Utility/Data
      },
      letterSpacing: {
        header: "0.05em",
        widest: "0.1em",
      },
      boxShadow: {
        brutal: "2px 2px 0px 0px rgba(255, 255, 255, 1)",
      },
      transitionTimingFunction: {
        brutal: "steps(2, end)",
        snap: "cubic-bezier(0, 0, 0, 1)",
        mechanical: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};
