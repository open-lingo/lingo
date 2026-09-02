import { useTranslation } from "react-i18next";
import { getEffectiveState, reviewCard } from "../engine";
import type { GradingLayout } from "../engine";
import type { SRSRating, SRSModality } from "@/features/flashcards/data/types";

const RATING_BUTTONS: Array<{ rating: SRSRating; label: string; color: string }> = [
  { rating: "again", label: "Again", color: "bg-error text-white hover:bg-error/90" },
  { rating: "hard", label: "Hard", color: "bg-warning text-white hover:bg-warning/90" },
  { rating: "good", label: "Good", color: "bg-success text-white hover:bg-success/90" },
  { rating: "easy", label: "Easy", color: "bg-accent text-white hover:bg-accent-hover" },
];

// Simple 2-button layout — "Didn't know" grades `again`, "Knew it" grades
// `good`. Both go through the same `onRate` path as the full row so undo,
// requeue and sync behave identically. This is the DEFAULT for everyone.
const SIMPLE_BUTTONS: Array<{
  rating: SRSRating;
  labelKey: string;
  labelDefault: string;
  color: string;
}> = [
  {
    rating: "again",
    labelKey: "flashcards.simpleDidntKnow",
    labelDefault: "Didn't know",
    color: "bg-error text-white hover:bg-error/90",
  },
  {
    rating: "good",
    labelKey: "flashcards.simpleKnewIt",
    labelDefault: "Knew it",
    color: "bg-success text-white hover:bg-success/90",
  },
];

function IntervalHint({
  cardId,
  rating,
  defaultEase,
  modality,
}: {
  cardId: string;
  rating: SRSRating;
  defaultEase?: number;
  modality: SRSModality;
}) {
  // Preview the interval for the TESTED modality only.
  const state = getEffectiveState(cardId, defaultEase);
  const after = reviewCard(state, modality, rating);
  const interval = after[modality].interval;
  if (interval === 0) return <span className="text-[10px]">&lt;1d</span>;
  if (interval === 1) return <span className="text-[10px]">1d</span>;
  if (interval < 30) return <span className="text-[10px]">{interval}d</span>;
  const months = Math.round(interval / 30);
  return <span className="text-[10px]">{months}mo</span>;
}

/**
 * The action row: one "Show Answer" button before the reveal, the grade grid
 * after it.
 *
 * The row is a FIXED-HEIGHT box so the reveal swap never changes the control
 * area's height and shoves the layout (Spencer QA — the buttons were jumping on
 * reveal). Two-button mode is 64px. Four-button mode wraps to 2×2 below `sm`,
 * and its box is 104px rather than the old 96px so each of the two rows clears
 * 48px after the 8px gap — the spec's phone floor, in px, because `--font-base`
 * clamps to 15px on short laptops and a rem floor would measure 44px there.
 * At `sm`+ the grid is 1×4 at the historical 64px: desktop does not move.
 */
type Props = {
  flipped: boolean;
  onReveal: () => void;
  onRate: (rating: SRSRating) => void;
  gradingLayout: GradingLayout;
  cardId: string;
  defaultEase?: number;
  modality: SRSModality;
  showIntervalPreviews: boolean;
};

export function GradeRow({
  flipped,
  onReveal,
  onRate,
  gradingLayout,
  cardId,
  defaultEase,
  modality,
  showIntervalPreviews,
}: Props) {
  const { t } = useTranslation();
  const buttonBase =
    "relative flex h-full min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-sm font-semibold transition";

  return (
    <div
      className={`flex shrink-0 items-stretch ${
        gradingLayout === "simple" ? "h-16" : "h-[104px] sm:h-16"
      }`}
    >
      {flipped ? (
        gradingLayout === "simple" ? (
          <div className="grid w-full grid-cols-2 gap-2">
            {SIMPLE_BUTTONS.map(({ rating, labelKey, labelDefault, color }, i) => (
              <button
                key={rating}
                type="button"
                onClick={() => onRate(rating)}
                className={`${buttonBase} ${color}`}
                title={t("flashcards.ratingShortcut", "Shortcut: {{key}}", {
                  key: i + 1,
                })}
              >
                {/* Keyboard shortcut keycap (lg:+ — keeps mobile clean). */}
                <span
                  className="absolute right-1.5 top-1.5 hidden h-4 w-4 items-center justify-center rounded bg-black/15 text-[10px] font-bold leading-none lg:flex"
                  aria-hidden
                >
                  {i + 1}
                </span>
                {t(labelKey, labelDefault)}
                {showIntervalPreviews && (
                  <IntervalHint
                    cardId={cardId}
                    rating={rating}
                    defaultEase={defaultEase}
                    modality={modality}
                  />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {RATING_BUTTONS.map(({ rating, label, color }, i) => (
              <button
                key={rating}
                type="button"
                onClick={() => onRate(rating)}
                className={`${buttonBase} ${color}`}
                title={t("flashcards.ratingShortcut", "Shortcut: {{key}}", {
                  key: i + 1,
                })}
              >
                <span
                  className="absolute right-1.5 top-1.5 hidden h-4 w-4 items-center justify-center rounded bg-black/15 text-[10px] font-bold leading-none lg:flex"
                  aria-hidden
                >
                  {i + 1}
                </span>
                {label}
                {showIntervalPreviews && (
                  <IntervalHint
                    cardId={cardId}
                    rating={rating}
                    defaultEase={defaultEase}
                    modality={modality}
                  />
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={onReveal}
          className="flex h-full w-full items-center justify-center rounded-xl bg-accent px-6 text-base font-semibold text-white transition hover:bg-accent-hover"
        >
          {t("flashcards.showAnswer", "Show Answer")}
        </button>
      )}
    </div>
  );
}
