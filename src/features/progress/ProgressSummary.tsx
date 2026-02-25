import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { ProgressBar } from "@/shared/components/progress";
import { Card } from "@/shared/components/ui";
import { getMockProgressSummary } from "./mockProgress";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";

export function ProgressSummary() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const p = getMockProgressSummary();
  const langId = language?.id ?? "ko";
  const { count: cardsDue, isLoading: cardsDueLoading } = useCardsDueCount(langId);

  const dailyPercent = Math.min(
    100,
    Math.round((p.dailyGoalCompletedMinutes / p.dailyGoalMinutes) * 100)
  );

  return (
    <Card as="section" aria-label={t("progress.title")}>
      <h2 className="text-lg font-semibold text-text-primary">
        {t("progress.title")}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-2 px-3 py-2">
          <span className="flex shrink-0 items-center justify-center" aria-hidden>
            <Icon name="flame" size={24} className="text-warning" />
          </span>
          <div>
            <p className="text-2xl font-bold text-text-primary">
              {p.streakDays}
            </p>
            <p className="text-sm text-text-secondary">{t("progress.dayStreak")}</p>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">
            {p.lessonsCompletedThisWeek}
          </p>
          <p className="text-sm text-text-secondary">{t("progress.lessonsThisWeek")}</p>
        </div>
        <div>
          <p
            className="text-2xl font-bold text-text-primary"
            aria-busy={cardsDueLoading}
          >
            {cardsDueLoading ? "…" : cardsDue}
          </p>
          <Link
            to={langPath("practice/flashcards")}
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            {t("progress.cardsDueToday")}
          </Link>
        </div>
        {typeof p.xpTotal === "number" && (
          <div>
            <p className="text-2xl font-bold text-text-primary">
              {p.xpTotal}
            </p>
            <p className="text-sm text-text-secondary">
              {t("progress.xp")}
              {typeof p.xpEarnedToday === "number" && p.xpEarnedToday > 0 && (
                <span className="ml-1 text-accent">
                  (+{p.xpEarnedToday} {t("progress.xpEarnedToday")})
                </span>
              )}
            </p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <ProgressBar
          percent={dailyPercent}
          label={t("progress.todaysGoal")}
          valueLabel={`${p.dailyGoalCompletedMinutes} / ${p.dailyGoalMinutes} min`}
          ariaLabel={t("progress.todaysGoal")}
          size="sm"
        />
      </div>
    </Card>
  );
}
