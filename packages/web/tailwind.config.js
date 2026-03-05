/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════════
        // SENTRY TERMINAL THEME - 2026 Developer Terminal
        // ═══════════════════════════════════════════════════════════════════

        // Core Zinc Scale (Primary)
        terminal: {
          950: "#09090b", // Deepest background
          900: "#18181b", // Primary background
          850: "#1f1f23", // Secondary background
          800: "#27272a", // Elevated surfaces
          700: "#3f3f46", // Borders
          600: "#52525b", // Muted borders
          500: "#82828c", // Muted text (Custom brightened for better a11y contrast)
          400: "#a1a1aa", // Secondary text
          300: "#d4d4d8", // Primary text
          200: "#e4e4e7", // Bright text
          100: "#f4f4f5", // Brightest text
          50: "#fafafa", // Pure white text
        },

        // Semantic Colors
        success: {
          DEFAULT: "#10b981", // Emerald-500
          muted: "#064e3b",
        },
        warning: {
          DEFAULT: "#f59e0b", // Amber-500
          muted: "#451a03",
        },
        error: {
          DEFAULT: "#ef4444", // Red-500
          muted: "#450a0a",
        },
        info: {
          DEFAULT: "#3b82f6", // Blue-500
          muted: "#172554",
        },

        // Accent (Primary Action Color)
        accent: {
          DEFAULT: "#7c9eff",
          hover: "#98b3ff",
          muted: "#1e2a4a",
        },
      },

      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "monospace",
        ],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }], // 10px
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.8125rem", { lineHeight: "1.25rem" }], // 13px - Terminal default
        base: ["0.875rem", { lineHeight: "1.5rem" }], // 14px
        lg: ["1rem", { lineHeight: "1.75rem" }], // 16px
        xl: ["1.125rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.25rem", { lineHeight: "2rem" }],
        "3xl": ["1.5rem", { lineHeight: "2rem" }],
      },

      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },

      boxShadow: {
        none: "none",
        glow: "0 0 0 1px rgba(124, 158, 255, 0.3)",
        "glow-lg":
          "0 0 0 2px rgba(124, 158, 255, 0.2), 0 0 20px rgba(124, 158, 255, 0.1)",
      },

      animation: {
        blink: "blink 1s step-end infinite",
        "fade-in": "fadeIn 150ms ease-out",
        "slide-up": "slideUp 150ms ease-out",
        "slide-down": "slideDown 150ms ease-out",
        "slide-left": "slideLeft 200ms ease-out",
      },

      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideLeft: {
          "0%": { opacity: "0", transform: "translateX(8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },

      spacing: {
        18: "4.5rem",
        88: "22rem",
        100: "25rem",
        120: "30rem",
      },

      transitionDuration: {
        150: "150ms",
        200: "200ms",
      },
    },
  },
  plugins: [],
};
