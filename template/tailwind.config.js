/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic tokens only — values live as CSS variables in global.css
        // and at runtime in src/ui/theme-colors.ts. Keep all three in sync.
        surface: {
          page: "rgb(var(--color-surface-page) / <alpha-value>)",
          card: "rgb(var(--color-surface-card) / <alpha-value>)",
          sunken: "rgb(var(--color-surface-sunken) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--color-text-tertiary) / <alpha-value>)",
        },
        border: {
          hairline: "rgb(var(--color-border-hairline) / <alpha-value>)",
        },
        accent: {
          fg: "rgb(var(--color-accent-fg) / <alpha-value>)",
          on: "rgb(var(--color-accent-on) / <alpha-value>)",
        },
        danger: {
          fg: "rgb(var(--color-danger-fg) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
