/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          elevated: "var(--color-surface-elevated)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          muted: "var(--color-border-muted)",
        },
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          muted: "var(--color-accent-muted)",
          foreground: "var(--color-on-accent)",
        },
        error: "var(--color-error)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        overlay: "var(--color-overlay)",
        info: "var(--color-info)",
        destructive: "var(--color-destructive)",
        link: "var(--color-link)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      fontFamily: {
        japanese: ['"Noto Sans JP"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // `font-display` Tailwind class — resolves to the theme's display
        // font when set, otherwise inherits the body font. Themes opt in by
        // setting --font-display via the ThemeTokens.font.display slot
        // (e.g. the Academia community theme picks Fraunces). Default theme
        // leaves it unset so headings render in the body font — no surprise
        // serif voice on a vanilla install.
        display: ["var(--font-display, inherit)"],
        // `font-mono` — same pattern. Themes can override to a custom
        // monospace via ThemeTokens.font.mono.
        mono: ["var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        popover: "var(--shadow-popover)",
      },
      keyframes: {
        riseCelebrate: {
          "0%":   { opacity: "0", transform: "translateY(12px) scale(0.95)" },
          "15%":  { opacity: "1", transform: "translateY(0)    scale(1)"    },
          "70%":  { opacity: "1", transform: "translateY(-2px) scale(1)"    },
          "100%": { opacity: "0", transform: "translateY(-16px) scale(0.98)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)"   },
        },
      },
      animation: {
        "rise-celebrate": "riseCelebrate 1100ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-up":        "fadeUp 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
