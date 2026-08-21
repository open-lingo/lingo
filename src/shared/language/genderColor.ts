/**
 * Gender color-coding — the language-agnostic visual layer (Spencer,
 * 2026-08-20: "is there any gendering indicator we can do by visual
 * coloring? … for ANY gendered language … blue, pink and some grey").
 *
 * WHAT IT IS: one palette, three grammatical genders, usable by every
 * gendered course (es/fr today: m/f; de later adds n). The registry
 * already carries the data — `EsAtom.gender` / `FrAtom.gender` exist "so
 * the agreement engines can light up" — this module is the light.
 *
 * THE PEDAGOGY (why this earns its pixels):
 *  1. Dual coding — a second, non-verbal channel for a fact learners
 *     chronically drop. Color-coding noun gender is a long-standing
 *     classroom mnemonic; we can apply it consistently, which classrooms
 *     can't.
 *  2. AGREEMENT CHAINS SHARE THE NOUN'S COLOR. That's the real teacher:
 *     when «la casa es bonita» renders with la/casa/bonita all glowing
 *     the same hue, agreement stops being a rule and becomes something
 *     you can SEE. Invariant words (es, muy, inteligente) stay untinted —
 *     the contrast between colored and neutral words is the lesson.
 *  3. Reveal, don't hint: on graded steps the tint belongs to the SOLVED
 *     or post-commit state. Pre-answer tinting would leak answers
 *     (gender_sort's whole question, for one) and train color-reading
 *     instead of word-reading.
 *
 * ACCESSIBILITY CONTRACT: color is never the only carrier. Every tinted
 * surface pairs the hue with a text marker — the language's own article
 * («el»/«la», le/la, der/die/das) or the m/f/n letter — via
 * `GENDER_STYLE[g].marker*`. Red-green confusability is avoided by
 * design (sky vs pink vs grey).
 *
 * WEANING: like romaji, the tint is scaffolding. When this graduates
 * from staging into course surfaces it should ride a per-language
 * learner setting (default on for A1, wean later), same mechanism as
 * `isRomanizationOn`.
 *
 * THEME: stock Tailwind hues with `dark:` variants (`darkMode: "class"`).
 * If this graduates to heavy reuse, promote to `--color-gender-*` tokens
 * in index.css next to the theme palette — not done now because that
 * file is mid-edit in a concurrent session (2026-08-20).
 */

/** `"m" | "f"` matches the atom registries; `"n"` is ready for de. */
export type GrammaticalGender = "m" | "f" | "n";

type GenderStyle = {
  /** Chip/card treatment: border + soft fill + text, one gender hue. */
  chip: string;
  /** Text-only treatment (glosses, dictionary rows). */
  text: string;
  /** Small round indicator (list rows, legends). Pair with a marker. */
  dot: string;
  /** Soft badge for the marker text (article or letter). */
  badge: string;
  /** Fallback marker when the language's article isn't supplied. */
  markerLetter: string;
  /** Human name for legends/tooltips. */
  label: string;
};

export const GENDER_STYLE: Record<GrammaticalGender, GenderStyle> = {
  m: {
    chip: "border-sky-500/70 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    badge:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/40",
    markerLetter: "m",
    label: "masculine",
  },
  f: {
    chip: "border-pink-500/70 bg-pink-500/10 text-pink-700 dark:text-pink-300",
    text: "text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500",
    badge:
      "bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/40",
    markerLetter: "f",
    label: "feminine",
  },
  n: {
    chip: "border-zinc-400/70 bg-zinc-400/10 text-zinc-600 dark:text-zinc-300",
    text: "text-zinc-600 dark:text-zinc-300",
    dot: "bg-zinc-400",
    badge:
      "bg-zinc-400/15 text-zinc-600 dark:text-zinc-300 border border-zinc-400/40",
    markerLetter: "n",
    label: "neuter",
  },
};
