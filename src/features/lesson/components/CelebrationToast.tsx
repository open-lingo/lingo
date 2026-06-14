/**
 * Small "rise + fade" toast shown over the step content on a correct
 * answer. Subtle gamification — prevents the page from feeling stagnant on
 * success. Non-blocking: the Continue button renders alongside it, so the
 * toast rewards pace instead of taxing it.
 *
 * Combo escalation (calm tiers): from 3 consecutive correct answers a
 * small "🔥 N in a row" pill rides under the copy; from 5 the toast scales
 * up a notch. The count comes from the lesson-run combo in `../juice` at
 * mount time, so callers keep the same `text`-only API.
 *
 * Positions absolutely; the parent should be `relative` (typically the
 * DrawingCanvas wrapper). For users with `prefers-reduced-motion: reduce`,
 * the animation class is suppressed (Tailwind `motion-safe:` variant); the
 * span still appears for the duration but without movement.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getCombo } from "../juice";

type Props = {
  text: string;
};

export function CelebrationToast({ text }: Props) {
  const { t } = useTranslation();
  // Capture once — the combo can change under us when the learner answers
  // the next step while this toast is still fading.
  const [combo] = useState(getCombo);
  const scale = combo >= 5 ? "scale-110" : "";
  return (
    // Renders ABOVE its relative parent (bottom-full), horizontally
    // centered. Overlay-centering inside the parent put the pill on top
    // of left-aligned options/tiles, where it read as a button that had
    // jumped out of place (Spencer 2026-06-13).
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-full mb-3 flex justify-center"
    >
      <div
        className={`flex flex-col items-center gap-1.5 motion-safe:animate-rise-celebrate ${scale}`}
      >
        <span className="rounded-full border-[1.5px] border-accent-hover bg-accent px-5 py-1.5 text-base font-bold uppercase tracking-wide text-white shadow-[0_3px_0_0_var(--color-accent-hover)]">
          {text}
        </span>
        {combo >= 3 && (
          <span className="rounded-full bg-warning/15 px-3 py-0.5 text-xs font-bold text-warning">
            {t("lesson.combo", {
              defaultValue: "🔥 {{n}} in a row",
              n: combo,
            })}
          </span>
        )}
      </div>
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
