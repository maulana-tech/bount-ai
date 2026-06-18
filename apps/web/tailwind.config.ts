import type { Config } from "tailwindcss";

/**
 * Palet & token dari UI_GUIDE.md — light theme, warm paper + aksen bronze.
 * Single source of truth untuk warna. Sengaja BUKAN palet shadcn zinc default.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // surfaces (warm paper ramp)
        paper: "#FFFFFF", // page background — white
        panel: {
          DEFAULT: "#F7F5F1", // panel background — warm paper
          2: "#F0EDE7", // elevated / row hover
        },
        line: {
          DEFAULT: "#E4E0D8", // hairline 1px
          strong: "#C8C3B8", // corner brackets, dividers
        },
        // text (warm near-black)
        ink: {
          DEFAULT: "#1A1815",
          muted: "#6B675F",
          faint: "#9A958A",
        },
        // accent: gold/bronze (brand + interactive)
        gold: {
          DEFAULT: "#A86B1A",
          hover: "#8A560F",
          tint: "rgba(168,107,26,0.10)",
        },
        // semantic status — RESERVED, jangan dekoratif
        success: {
          DEFAULT: "#16A34A",
          tint: "rgba(22,163,74,0.10)",
        },
        danger: {
          DEFAULT: "#DC2626",
          tint: "rgba(220,38,38,0.08)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
