import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMockProgressSummary } from "./mockProgress";

export function ProgressSummary() {
  const { t } = useTranslation();
  const p = getMockProgressSummary();
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
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {p.streakDays}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("progress.dayStreak")}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {p.lessonsCompletedThisWeek}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("progress.lessonsThisWeek")}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {p.cardsDueToday}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("progress.cardsDueToday")}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{t("progress.todaysGoal")}</span>
          <span className="text-gray-700 dark:text-gray-300">
            {p.dailyGoalCompletedMinutes} / {p.dailyGoalMinutes} min
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-600"
            style={{ width: `${dailyPercent}%` }}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to="/flashcards"
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {t("progress.reviewCards")}
        </Link>
        <Link
          to="/practice"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("progress.practice")}
        </Link>
      </div>
    </section>
  );
}
