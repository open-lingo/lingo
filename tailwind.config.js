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
