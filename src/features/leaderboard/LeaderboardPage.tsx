import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LEADERBOARD_PERIOD_QUERY } from "@/hooks/usePathParams";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Alex", xp: 2450 },
  { rank: 2, name: "Sam", xp: 2100 },
  { rank: 3, name: "Jordan", xp: 1890 },
  { rank: 4, name: "Casey", xp: 1650 },
  { rank: 5, name: "Riley", xp: 1420 },
];

export function LeaderboardPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const period = searchParams.get(LEADERBOARD_PERIOD_QUERY) ?? "week";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("leaderboard.title")}</h1>
        <Link
          to="/"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("leaderboard.back")}
        </Link>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("leaderboard.topLearners", { period })}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t("leaderboard.shareable")}{" "}
        <Link to="/leaderboard?period=week" className="underline">{t("leaderboard.periodWeek")}</Link>
        {" · "}
        <Link to="/leaderboard?period=month" className="underline">{t("leaderboard.periodMonth")}</Link>
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t("leaderboard.rank")}</th>
              <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t("leaderboard.name")}</th>
              <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t("leaderboard.xp")}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LEADERBOARD.map((row) => (
              <tr
                key={row.rank}
                className="border-b border-gray-100 last:border-0 dark:border-gray-700"
              >
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  #{row.rank}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {row.xp.toLocaleString()} XP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
