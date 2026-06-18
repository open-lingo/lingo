import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";
import { useLangPath } from "@/shared/hooks/useLangPath";

const StudyScopeShortcuts = lazy(() => import("@/features/flashcards/StudyScopeShortcuts"));

export function FlashcardsReviewStrip() {
  return (
    <div className="mb-6 rounded-card border border-border bg-surface-muted p-3">
      <FlashcardsReviewBody />
    </div>
  );
}

/**
 * Chrome-less body of the due-review strip (title + caught-up state or
 * study-scope shortcuts). Split out so it can be embedded as a section
 * inside the merged "You today" sidebar card without its own border.
 */
export function FlashcardsReviewBody() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langId = language?.id ?? "";
  const { count: cardsDue, isLoading } = useCardsDueCount(langId);
  const langPath = useLangPath();

  const caughtUp = !isLoading && cardsDue === 0;

  return (
    <>
      <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <Icon name="layers" size={13} className="text-accent" aria-hidden />
        {t("learn.flashcardsReviewStripTitle", {
          defaultValue: "Review your decks",
        })}
      </p>
      <p className="mb-2 text-[0.7rem] text-text-muted">
        {caughtUp
          ? t("learn.flashcardsAllCaughtUp", "All caught up!")
          : isLoading
            ? t("learn.flashcardsChecking", {
                defaultValue: "Checking your decks…",
              })
            : t("learn.flashcardsDueCount", {
                defaultValue: "{{count}} cards due — pick a deck to review",
                count: cardsDue,
              })}
      </p>

      {/* Targeted review scopes — lesson decks vs vocabulary, not a generic
          "study now" CTA. Always shown so the learner can drill a specific
          deck even when nothing is strictly due. */}
      <Suspense fallback={null}>
        <StudyScopeShortcuts compact />
      </Suspense>

      <Link
        to={langPath("practice/flashcards")}
        className="mt-2 inline-flex items-center gap-1 text-[0.7rem] font-medium text-text-muted transition hover:text-accent"
      >
        {t("learn.flashcardsManageDecks", { defaultValue: "Manage decks" })}
        <Icon name="chevronRight" size={12} aria-hidden />
      </Link>
    </>
  );
}
