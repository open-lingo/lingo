// Single source of truth for breakpoint pixel values — the same module backs
// the `useViewport` / `useBreakpoint` hooks, so config + JS never drift.
import { SCREENS } from "./src/shared/hooks/breakpoints";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    // Values are identical to Tailwind's stock scale — existing sm:/md:/lg:
    // utilities are unchanged; this just removes the duplicated constants.
    screens: SCREENS,
    extend: {
      colors: {
        // Color tokens are stored as RGB channel triples (see styles/tokens.css
        // + theme/web-adapter.ts) so the `<alpha-value>` slot below lets alpha
        // modifiers (`bg-accent/10`, `border-error/40`) resolve to real CSS.
        // `overlay` is the exception: it carries its own alpha (rgba) and is
        // aliased bare.
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          muted: "rgb(var(--color-surface-muted) / <alpha-value>)",
          elevated: "rgb(var(--color-surface-elevated) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          muted: "rgb(var(--color-border-muted) / <alpha-value>)",
        },
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          muted: "rgb(var(--color-accent-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-on-accent) / <alpha-value>)",
        },
        error: "rgb(var(--color-error) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        overlay: "var(--color-overlay)",
        info: "rgb(var(--color-info) / <alpha-value>)",
        destructive: "rgb(var(--color-destructive) / <alpha-value>)",
        link: "rgb(var(--color-link) / <alpha-value>)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        // User-adjustable card/modal corners (Appearance → corner style).
        // Falls back to 0.625rem so utilities resolve before the runtime var
        // is set (SSR / first paint).
        card: "var(--radius-card, 0.625rem)",
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
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)"    },
        },
        tilePop: {
          "0%":   { opacity: "0", transform: "scale(0.4)"  },
          "70%":  { opacity: "1", transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)"    },
        },
      },
      animation: {
        "rise-celebrate":  "riseCelebrate 1100ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "tile-pop":        "tilePop 160ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-up":         "fadeUp 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right":  "slideInRight 260ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // Safe-area utilities backed by env(safe-area-inset-*). Each is
    // `max(env(inset), <fallback>)` so non-notch / desktop devices (where the
    // inset is 0) fall back to the given spacing and are visually unchanged;
    // notched devices grow to clear the status bar / home indicator / rounded
    // corners. Bare `pt-safe` uses a 0px fallback (pure additive inset);
    // suffixed `bottom-safe-4` etc. pull the fallback from the spacing scale.
    // Maps to React Native's useSafeAreaInsets at RN time.
    require("tailwindcss/plugin")(function ({ matchUtilities, theme }) {
      const sides = {
        "pt-safe": ["padding-top", "top"],
        "pb-safe": ["padding-bottom", "bottom"],
        "pl-safe": ["padding-left", "left"],
        "pr-safe": ["padding-right", "right"],
        "top-safe": ["top", "top"],
        "bottom-safe": ["bottom", "bottom"],
        "left-safe": ["left", "left"],
        "right-safe": ["right", "right"],
      };
      const values = { DEFAULT: "0px", ...theme("spacing") };
      for (const [name, [prop, inset]] of Object.entries(sides)) {
        matchUtilities(
          {
            [name]: (value) => ({
              [prop]: `max(env(safe-area-inset-${inset}), ${value})`,
            }),
          },
          { values },
        );
      }
    }),
  ],
};
