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
    <div className="mb-6 rounded-xl border border-border bg-surface-muted p-3">
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

  return (
    <>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {t("learn.flashcardsReviewStripTitle")}
      </p>

      {!isLoading && cardsDue === 0 ? (
        <Link
          to={langPath("practice/flashcards")}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 transition hover:border-accent hover:bg-surface-muted"
        >
          <Icon
            name="sparkles"
            size={16}
            className="shrink-0 text-accent"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              {t("learn.flashcardsAllCaughtUp", "All caught up!")}
            </p>
            <p className="text-xs text-text-muted">
              {t("learn.flashcardsZeroDue", "0 cards due today")}
            </p>
          </div>
        </Link>
      ) : (
        <Suspense fallback={null}>
          <StudyScopeShortcuts compact />
        </Suspense>
      )}
    </>
  );
}
