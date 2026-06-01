import { useTranslation } from "react-i18next";
import { ModalBase } from "@/shared/components/ModalBase";
import { Button } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";

/**
 * Mode controls the CTA copy + footer affordances, but the body content
 * (intro + recognition/production + 4 buttons + dual due dates) is the
 * SAME in both modes — single source of truth for the explanation.
 *
 * - "onboarding": first-visit walkthrough. CTA is "Got it, let's start".
 * - "reference":  on-demand via the info icon. CTA is "Close" plus a
 *   small "Reset onboarding" link so users can re-trigger the first-time
 *   modal on their next visit.
 */
export type FlashcardsInfoModalMode = "onboarding" | "reference";

type Props = {
  mode: FlashcardsInfoModalMode;
  onClose: () => void;
  /** Reference-mode only — clears the onboarding-seen flag so the
   *  onboarding modal shows again on the next visit. */
  onResetOnboarding?: () => void;
};

export function FlashcardsInfoModal({ mode, onClose, onResetOnboarding }: Props) {
  const { t } = useTranslation();

  const title =
    mode === "onboarding"
      ? t("flashcards.info.titleOnboarding", "Welcome to flashcard review")
      : t("flashcards.info.titleReference", "How flashcard review works");

  const ctaLabel =
    mode === "onboarding"
      ? t("flashcards.info.ctaOnboarding", "Got it, let's start")
      : t("flashcards.info.ctaReference", "Close");

  const ratings: Array<{
    key: string;
    label: string;
    meaning: string;
    swatch: string;
  }> = [
    {
      key: "again",
      label: t("flashcards.info.ratingAgainLabel", "Again"),
      meaning: t(
        "flashcards.info.ratingAgainMeaning",
        "You missed it. Interval resets — you'll see it again soon.",
      ),
      swatch: "bg-error",
    },
    {
      key: "hard",
      label: t("flashcards.info.ratingHardLabel", "Hard"),
      meaning: t(
        "flashcards.info.ratingHardMeaning",
        "You got it, but it was a struggle. Counts as a success — interval grows, just slower than Good.",
      ),
      swatch: "bg-warning",
    },
    {
      key: "good",
      label: t("flashcards.info.ratingGoodLabel", "Good"),
      meaning: t(
        "flashcards.info.ratingGoodMeaning",
        "Solid recall. Standard interval growth.",
      ),
      swatch: "bg-success",
    },
    {
      key: "easy",
      label: t("flashcards.info.ratingEasyLabel", "Easy"),
      meaning: t(
        "flashcards.info.ratingEasyMeaning",
        "Trivial. Interval grows fastest — use sparingly.",
      ),
      swatch: "bg-accent",
    },
  ];

  return (
    <ModalBase onClose={onClose} title={title} maxWidth="max-w-xl">
      <div className="space-y-5 px-6 py-5 text-sm text-text-secondary">
        {/* Intro */}
        <p>
          {t(
            "flashcards.info.intro",
            "Spaced repetition shows you cards right before you'd forget them. Get a card right and the interval grows; miss it and the interval resets.",
          )}
        </p>

        {/* Recognition vs Production */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {t(
              "flashcards.info.modalitiesHeading",
              "Recognition vs production",
            )}
          </h3>
          <p>
            {t(
              "flashcards.info.modalitiesIntro",
              "Each card tracks two skills independently because they're different abilities.",
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-primary">
                <Icon name="search" size={12} aria-hidden />
                {t("flashcards.info.recognitionLabel", "Recognition")}
              </div>
              <p className="text-xs text-text-secondary">
                {t(
                  "flashcards.info.recognitionDescription",
                  "See the foreign word, recall the meaning. Example: see 안녕하세요 → recall \"hello\".",
                )}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-primary">
                <Icon name="mic" size={12} aria-hidden />
                {t("flashcards.info.productionLabel", "Production")}
              </div>
              <p className="text-xs text-text-secondary">
                {t(
                  "flashcards.info.productionDescription",
                  "See the meaning, produce the foreign word. Example: see \"hello\" → produce 안녕하세요.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 4 buttons */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">
            {t("flashcards.info.buttonsHeading", "The 4 grade buttons")}
          </h3>
          <p className="text-xs text-text-muted">
            {t(
              "flashcards.info.buttonsHint",
              "After flipping the card, rate how that recall felt.",
            )}
          </p>
          <ul className="space-y-2">
            {ratings.map((r) => (
              <li
                key={r.key}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <span
                  className={`mt-0.5 inline-flex h-6 w-14 shrink-0 items-center justify-center rounded text-xs font-semibold text-white ${r.swatch}`}
                  aria-hidden
                >
                  {r.label}
                </span>
                <span className="text-xs text-text-secondary">{r.meaning}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Why two due dates */}
        <section className="rounded-lg border border-border bg-surface-muted p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-primary">
            {t(
              "flashcards.info.dualDueHeading",
              "Why a card can be due twice",
            )}
          </h3>
          <p className="text-xs text-text-secondary">
            {t(
              "flashcards.info.dualDueBody",
              "Recognition and production each have their own interval, so a card may surface for production tomorrow even though recognition isn't due for 3 days.",
            )}
          </p>
        </section>
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        {mode === "reference" && onResetOnboarding ? (
          <button
            type="button"
            onClick={onResetOnboarding}
            className="text-xs text-text-muted underline-offset-2 hover:text-text-primary hover:underline"
          >
            {t(
              "flashcards.info.resetOnboarding",
              "Show first-time intro again on next visit",
            )}
          </button>
        ) : (
          <span aria-hidden />
        )}
        <Button
          variant="primary"
          size="md"
          onClick={onClose}
          className="sm:ml-auto"
        >
          {ctaLabel}
        </Button>
      </div>
    </ModalBase>
  );
}
