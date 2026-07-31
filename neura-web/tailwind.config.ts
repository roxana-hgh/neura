// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your brand colors
        primary: {
          DEFAULT: "#0d59f2",
          50: "#e7efff",
          100: "#cddfff",
          200: "#9abfff",
          300: "#669fff",
          400: "#337fff",
          500: "#0d59f2",
          600: "#0b4dd9",
          700: "#093fb0",
          800: "#073287",
          900: "#05245e",
        },

        "accent-teal": "#14b8a6",
        "accent-purple": "#a855f7",

        background: {
          light: "#f5f6f8",
          dark: "#101622",
        },

        // shadcn semantic tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        background: "hsl(var(--background))",

        
        destructive: "hsl(var(--destructive))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
