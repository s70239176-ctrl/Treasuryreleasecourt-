import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        court: {
          bg: "#05060a",
          panel: "#0b0e17",
          panel2: "#10131f",
          border: "#1c2130",
          blue: "#4f7dff",
          violet: "#8b5cf6",
          text: "#e6e8f0",
          muted: "#8992a8",
          done: "#34d399",
          notdone: "#f87171",
          warn: "#fbbf24",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(79,125,255,0.25), 0 0 24px rgba(79,125,255,0.15)",
        glowViolet: "0 0 0 1px rgba(139,92,246,0.25), 0 0 24px rgba(139,92,246,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
