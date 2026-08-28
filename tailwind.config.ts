import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        momo: {
          wave: "#1ba8f0",
          orange: "#ff7900",
          mtn: "#ffcc00",
          moov: "#005baa",
          airtel: "#e60000",
        },
        debt: {
          badge: "#ef4444",
          light: "#fee2e2",
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px 0 rgba(0, 0, 0, 0.03)",
        modern: "0 8px 30px rgba(0, 0, 0, 0.04)",
        floating: "0 10px 30px -5px rgba(37, 99, 235, 0.4)",
        emerald: "0 10px 30px -5px rgba(16, 185, 129, 0.4)",
        amber: "0 10px 30px -5px rgba(245, 158, 11, 0.35)",
        glow: "0 0 50px -10px rgba(16, 185, 129, 0.25)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 5s ease-in-out infinite',
        'float-delayed': 'float 5s ease-in-out 2.5s infinite',
        'shimmer': 'shimmer 3s infinite linear',
        'radar': 'radar 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        radar: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
