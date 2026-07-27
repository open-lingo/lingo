/**
 * Per-type visual identity for the Ink Tiles hub (v1.2 Task 7).
 *
 * Each trainer type owns a kana glyph (the language-honest pictogram — the glyph
 * IS the icon) and a color. Colors are defined as `--type-*` CSS custom properties
 * scoped to `.conj-hub`, light/dark-aware via the app's existing `.dark` theme
 * class. They are lifted verbatim from the mockup palette
 * (docs/archive/conjugation-trainer-mockups-2026-07-02/index.html).
 *
 * FUTURE: promote these six to real ThemeTokens slots (e.g. `theme.typeTe`, …) so
 * themes can restyle them centrally. Kept local to the feature for now — the theme
 * system is intentionally untouched (Task 7 constraint).
 */
import type { TrainerTypeId } from "./trainerRegistry";

/** The kana glyph shown big on each tile. */
export const TYPE_GLYPH: Record<TrainerTypeId, string> = {
  "i-adj-forms": "い",
  masu: "ま",
  "te-form": "て",
  "ta-form": "た",
  "nai-form": "ない",
  "v-tai": "たい",
};

/** CSS var holding the tile's color (consumed as `--tc: var(--type-*)`). */
export const TYPE_COLOR_VAR: Record<TrainerTypeId, string> = {
  "i-adj-forms": "--type-iadj",
  masu: "--type-masu",
  "te-form": "--type-te",
  "ta-form": "--type-ta",
  "nai-form": "--type-nai",
  "v-tai": "--type-tai",
};

/**
 * Fixed grid order — spatial memory does the navigation on the second visit
 * (mockup P3). Roughly unlock-module ascending; the sequence い・ま・て・た・ない・たい
 * is the owner's authoritative order (spec Task 7 + mockup Direction C).
 */
export const TILE_ORDER: TrainerTypeId[] = [
  "i-adj-forms",
  "masu",
  "te-form",
  "ta-form",
  "nai-form",
  "v-tai",
];

/**
 * Which tiles a drilled form is "made of" — the drill card renders the form
 * prompt as a glyph-chip equation ([た]+[ない] → label) instead of a small text
 * arrow, teaching the tile algebra on every question. Base forms map to their
 * own tile; combo forms mirror COMBO_MAP's tile sets (keep in sync). Forms not
 * listed (free-drill extras like `dictionary`/`present`) fall back to a plain
 * text label.
 */
export const FORM_TO_TILES: Record<string, TrainerTypeId[]> = {
  te: ["te-form"],
  ta: ["ta-form"],
  nai: ["nai-form"],
  masu: ["masu"],
  tai: ["v-tai"],
  "nai-past": ["nai-form", "ta-form"],
  "tai-neg": ["v-tai", "nai-form"],
  "tai-past": ["v-tai", "ta-form"],
  "tai-neg-past": ["v-tai", "nai-form", "ta-form"],
  "masu-neg": ["masu", "nai-form"],
  "masu-past": ["masu", "ta-form"],
  "masu-past-neg": ["masu", "nai-form", "ta-form"],
  negative: ["i-adj-forms"],
  past: ["i-adj-forms", "ta-form"],
  "past-negative": ["i-adj-forms", "nai-form", "ta-form"],
};

/**
 * The `--type-*` palette + drill-card styles, scoped to `.conj-scope` (the hub
 * and every drill view carry this class). Injected once per page via a <style>
 * tag. Light + dark variants (mockup palette).
 */
export const CONJ_TYPE_COLOR_CSS = `
.conj-scope {
  --type-te: #047857; --type-ta: #b45309; --type-nai: #b91c1c;
  --type-masu: #1d4ed8; --type-tai: #be185d; --type-iadj: #0e7490;
  --type-default: #6b7280;
}
.dark .conj-scope {
  --type-te: #34d399; --type-ta: #fbbf24; --type-nai: #f87171;
  --type-masu: #60a5fa; --type-tai: #f472b6; --type-iadj: #22d3ee;
  --type-default: #9ca3af;
}
.conj-tile-suggest { animation: conj-wobble 4s ease-in-out infinite; }
@keyframes conj-wobble {
  2% { transform: rotate(1.1deg); }
  4% { transform: rotate(-1.1deg); }
  6% { transform: rotate(0); }
}

/* Answer tiles: ink fills from the bottom on hover (the trainer's ink motif),
   colored by the drilled form (--fc, set on the options stack). */
.conj-scope .conj-opt { position: relative; overflow: hidden; }
.conj-scope .conj-opt::before {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 0;
  background: color-mix(in srgb, var(--fc, rgb(var(--color-accent))) 12%, transparent);
  transition: height 0.16s ease;
}
.conj-scope .conj-opt > * { position: relative; }
.conj-scope .conj-opt:not(:disabled):hover { border-color: var(--fc, rgb(var(--color-accent))); }
.conj-scope .conj-opt:not(:disabled):hover::before { height: 100%; }
.conj-scope .conj-opt-correct { animation: conj-pop 0.3s ease; }
.conj-scope .conj-opt-wrong { animation: conj-shake 0.3s ease; }
/* Stuck-hint nudge on the cheat-sheet button: one shake, then a gentle
   recurring wobble so it stays noticeable without nagging. */
.conj-scope .conj-cheat-nudge { animation: conj-shake 0.35s ease, conj-wobble 5s ease-in-out 1s infinite; }
@keyframes conj-pop {
  35% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
@keyframes conj-shake {
  20% { transform: translateX(-4px); }
  45% { transform: translateX(4px); }
  70% { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .conj-tile-suggest, .conj-scope .conj-opt-correct, .conj-scope .conj-opt-wrong,
  .conj-scope .conj-cheat-nudge { animation: none; }
  .conj-scope .conj-opt::before { transition: none; }
}
`.trim();
