import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { ProgressBar } from "@/shared/components/progress";
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
    <section
      className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      aria-label={t("progress.title")}
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t("progress.title")}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50/50 px-3 py-2 dark:border-orange-900/50 dark:bg-orange-950/20">
          <span className="text-xl" aria-hidden>
            🔥
          </span>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {p.streakDays}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("progress.dayStreak")}</p>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {p.lessonsCompletedThisWeek}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("progress.lessonsThisWeek")}</p>
        </div>
        <div>
          <p
            className="text-2xl font-bold text-gray-900 dark:text-white"
            aria-busy={cardsDueLoading}
          >
            {cardsDueLoading ? "…" : cardsDue}
          </p>
          <Link
            to={langPath("practice/flashcards")}
            className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            {t("progress.cardsDueToday")}
          </Link>
        </div>
        {typeof p.xpTotal === "number" && (
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {p.xpTotal}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("progress.xp")}
              {typeof p.xpEarnedToday === "number" && p.xpEarnedToday > 0 && (
                <span className="ml-1 text-green-600 dark:text-green-400">
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
    </section>
  );
}
