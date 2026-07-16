import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, WeekSparkline } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFlashcardDueSummary } from "@/features/flashcards/useFlashcardDueSummary";
import { buildMemoryStrengthView } from "./memoryStrengthHelpers";

/**
 * Memory Strength — the "your knowledge is compounding" beat the home page was
 * missing. Streak answers "did I show up?", quests answer "what's worth
 * grinding?"; this answers "is any of it sticking?" using the same SRS store
 * that powers flashcards. Real data via `useFlashcardDueSummary`: mastered vs
 * learning counts, a mastery ring, and a trailing 7-day review sparkline.
 *
 * Placed under Today's Plan so the left rail mirrors the right (a compact tile
 * stacked over a richer card), keeping the bento balanced and viewport-filling.
 */
export function MemoryStrengthTile() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";
  const { learningCount, masteredCount, totalCount, weekReviews, isLoading } =
    useFlashcardDueSummary(langId);

  const view = useMemo(
    () =>
      buildMemoryStrengthView({
        learningCount,
        masteredCount,
        totalCount,
        weekReviews,
      }),
    [learningCount, masteredCount, totalCount, weekReviews],
  );

  return (
    <Card padding="md" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.memory.kicker", { defaultValue: "Memory" })}
          </p>
          <h2 className="mt-0.5 flex items-center gap-1.5 text-base font-semibold text-text-primary sm:text-lg">
            <Icon name="zap" size={18} className="text-accent" aria-hidden />
            {t("home.restructured.memory.headline", { defaultValue: "Knowledge strength" })}
          </h2>
        </div>
        {view.hasStarted ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-bold tabular-nums text-accent">
            <Icon name="award" size={13} aria-hidden />
            {t("home.restructured.memory.masteredPct", {
              defaultValue: "{{pct}}% mastered",
              pct: view.masteredPct,
            })}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-3 flex-1 animate-pulse rounded-lg bg-border" aria-hidden />
      ) : !view.hasStarted ? (
        <p className="mt-3 flex-1 text-sm text-text-muted">
          {t("home.restructured.memory.empty", {
            defaultValue:
              "Review a few cards and your memory strength shows up here.",
          })}
        </p>
      ) : (
        <>
          {/* Mastery progress: mastered out of started. */}
          <div className="mt-3">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
              role="img"
              aria-label={t("home.restructured.memory.masteryAria", {
                defaultValue: "{{mastered}} of {{started}} started cards mastered",
                mastered: view.masteredCount,
                started: view.startedCount,
              })}
            >
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${view.masteredPct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-text-secondary">
                <Icon name="graduationCap" size={13} className="text-success" aria-hidden />
                {t("home.restructured.memory.mastered", {
                  defaultValue: "{{n}} mastered",
                  n: view.masteredCount,
                })}
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-text-secondary">
                <Icon name="layers" size={13} className="text-accent" aria-hidden />
                {t("home.restructured.memory.learning", {
                  defaultValue: "{{n}} learning",
                  n: view.learningCount,
                })}
              </span>
            </div>
          </div>

          {/* Trailing 7-day review volume — the "I've been showing up" proof. */}
          <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
            <div>
              <p className="text-xs font-medium text-text-muted">
                {t("home.restructured.memory.reviewsLabel", {
                  defaultValue: "Reviews this week",
                })}
              </p>
              <p className="text-lg font-bold tabular-nums text-text-primary">
                {view.weekTotal}
                <span className="ml-1.5 text-xs font-medium text-text-muted">
                  {t("home.restructured.memory.activeDays", {
                    defaultValue: "{{days}}/7 days",
                    days: view.activeDays,
                  })}
                </span>
              </p>
            </div>
            <WeekSparkline
              data={weekReviews}
              ariaLabel={t("home.restructured.memory.sparklineAria", {
                defaultValue: "Reviews per day this week",
              })}
            />
          </div>
        </>
      )}
      {/* Bottom "Train your memory" CTA removed 2026-07-16 — flashcards are a
          tap away in Practice; a better home for this affordance is TBD. */}
    </Card>
  );
}
