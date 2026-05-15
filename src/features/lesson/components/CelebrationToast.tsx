/**
 * Small "rise + fade" toast shown between the final passing attempt and the
 * Continue button. Subtle gamification — prevents the page from feeling
 * stagnant on success.
 *
 * Positions absolutely; the parent should be `relative` (typically the
 * DrawingCanvas wrapper). For users with `prefers-reduced-motion: reduce`,
 * the animation class is suppressed (Tailwind `motion-safe:` variant); the
 * span still appears for the duration but without movement.
 */

import type { TFunction } from "i18next";

type Props = {
  text: string;
};

export function CelebrationToast({ text }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-base font-semibold text-white shadow-lg motion-safe:animate-rise-celebrate">
        {text}
      </span>
    </div>
  );
}

/** Pool of equally-weighted celebration copy. Add more here to vary further. */
const CELEBRATION_VARIANTS: ReadonlyArray<{ key: string; fallback: string }> = [
  { key: "alphabet.celebrate.nice",     fallback: "Nice!"      },
  { key: "alphabet.celebrate.great",    fallback: "Great!"     },
  { key: "alphabet.celebrate.gotIt",    fallback: "Got it!"    },
  { key: "alphabet.celebrate.wellDone", fallback: "Well done!" },
  { key: "alphabet.celebrate.perfect",  fallback: "Perfect!"   },
];

/**
 * Pick a random celebration message and resolve it through i18n. Call at the
 * moment of celebration trigger and store the result in state so it stays
 * stable across the animation lifetime.
 */
export function pickCelebrationText(t: TFunction): string {
  const variant =
    CELEBRATION_VARIANTS[Math.floor(Math.random() * CELEBRATION_VARIANTS.length)];
  return t(variant.key, variant.fallback);
}
