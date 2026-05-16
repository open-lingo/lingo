import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

const StudyScopeShortcuts = lazy(() => import("@/features/flashcards/StudyScopeShortcuts"));

export function FlashcardsReviewStrip() {
  const { t } = useTranslation();
  return (
    <div className="mb-6 rounded-xl border border-border bg-surface-muted p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {t("learn.flashcardsReviewStripTitle")}
      </p>
      <Suspense fallback={null}>
        <StudyScopeShortcuts compact />
      </Suspense>
    </div>
  );
}
