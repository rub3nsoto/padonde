import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Reemplaza la escala gray con slate — tinte azul-navy que combina con coral
        gray: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#1B1E2F",
        },
        // Paleta Eventure — minimalista, modo claro
        brand: {
          50:  "#fff1f3",
          100: "#ffe4e8",
          200: "#ffc9d2",
          300: "#ffa0b0",
          400: "#ff6680",
          500: "#FF385C", // coral principal (Airbnb-like)
          600: "#e8213e",
          700: "#c41530",
          800: "#a31229",
          900: "#8a1226",
        },
        surface: {
          900: "#1B1E2F", // texto principal — navy profundo
          800: "#ffffff", // fondo blanco
          700: "#f7f7f7", // fondo sutil
          600: "#f0f0f0", // hover suave
          500: "#dddddd", // bordes
          400: "#b0b0b0", // bordes secundarios
        },
        accent: {
          cyan:   "#0891b2",
          purple: "#7c3aed",
          amber:  "#d97706",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":  "linear-gradient(135deg, #FF385C 0%, #ff6680 100%)",
        "gradient-dark":   "linear-gradient(180deg, #f7f7f7 0%, #ffffff 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        brand:       "0 2px 16px rgba(255, 56, 92, 0.2)",
        "brand-lg":  "0 4px 32px rgba(255, 56, 92, 0.28)",
        card:        "0 2px 16px rgba(0, 0, 0, 0.08)",
        "card-hover":"0 4px 24px rgba(0, 0, 0, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
