import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          primary: "#1B4332",       // Deep Forest Green
          primaryDark: "#081C15",   // Dark Spruce
          secondary: "#2D6A4F",     // Leaf Green
          accent: "#52B788",        // Fresh Growth Green
          lime: "#74C69D",          // Lime Accent
          mint: "#D8F3DC",          // Soft Mint Highlight
          bg: "#F8F9FA",            // Warm Off-White / Soft Cream
          surface: "#FFFFFF",       // Clean White Surface
          charcoal: "#1F2937",      // Primary Text
          slate: "#4B5563",         // Secondary Text
          muted: "#6B7280",         // Muted Slate Text
          border: "#E5E7EB",        // Clean subtle border
          positive: "#15803D",      // Green Profit
          warning: "#D97706",       // Amber Attention / Overdue
          negative: "#DC2626",      // Red Expense / Deficit
          info: "#0284C7",          // M-Pesa / Information Blue
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
