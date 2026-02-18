import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LEADERBOARD_PERIOD_QUERY,
  LEADERBOARD_TAB_QUERY,
} from "@/hooks/usePathParams";

type TabId = "xp" | "language" | "flashcards" | "contributors";

const MOCK_XP = [
  { rank: 1, name: "Alex", xp: 2450 },
  { rank: 2, name: "Sam", xp: 2100 },
  { rank: 3, name: "Jordan", xp: 1890 },
  { rank: 4, name: "Casey", xp: 1650 },
  { rank: 5, name: "Riley", xp: 1420 },
];

const MOCK_BY_LANGUAGE = [
  { rank: 1, name: "Jamie", language: "Korean", lessonsCompleted: 42 },
  { rank: 2, name: "Quinn", language: "Japanese", lessonsCompleted: 38 },
  { rank: 3, name: "Morgan", language: "Korean", lessonsCompleted: 35 },
  { rank: 4, name: "Taylor", language: "Chinese", lessonsCompleted: 28 },
  { rank: 5, name: "Riley", language: "Japanese", lessonsCompleted: 24 },
];

const MOCK_FLASHCARDS = [
  { rank: 1, name: "Sam", cardsReviewed: 1250 },
  { rank: 2, name: "Alex", cardsReviewed: 980 },
  { rank: 3, name: "Jordan", cardsReviewed: 876 },
  { rank: 4, name: "Casey", cardsReviewed: 654 },
  { rank: 5, name: "Quinn", cardsReviewed: 512 },
];

const MOCK_CONTRIBUTORS = [
  { rank: 1, name: "Morgan", prs: 12, reviews: 28 },
  { rank: 2, name: "Taylor", prs: 8, reviews: 15 },
  { rank: 3, name: "Jamie", prs: 5, reviews: 22 },
  { rank: 4, name: "Casey", prs: 4, reviews: 10 },
  { rank: 5, name: "Riley", prs: 2, reviews: 8 },
];

function buildLeaderboardUrl(tab: TabId, period?: string): string {
  const params = new URLSearchParams();
  params.set(LEADERBOARD_TAB_QUERY, tab);
  if (period) params.set(LEADERBOARD_PERIOD_QUERY, period);
  return `/leaderboard?${params.toString()}`;
}

export function LeaderboardPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const period = searchParams.get(LEADERBOARD_PERIOD_QUERY) ?? "week";
  const tab = (searchParams.get(LEADERBOARD_TAB_QUERY) ?? "xp") as TabId;
  const validTabs: TabId[] = ["xp", "language", "flashcards", "contributors"];
  const currentTab = validTabs.includes(tab) ? tab : "xp";

  const topN = 3;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("leaderboard.title")}
        </h1>
        <Link
          to="/"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("leaderboard.back")}
        </Link>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("leaderboard.leadersByCategory")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to={buildLeaderboardUrl("xp", period)}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
        >
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {t("leaderboard.tabXp")}
          </h2>
          <ul className="space-y-1.5 text-sm">
            {MOCK_XP.slice(0, topN).map((row) => (
              <li key={row.rank} className="flex justify-between gap-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  #{row.rank} {row.name}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {row.xp.toLocaleString()} XP
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("leaderboard.viewAll")} →
          </p>
        </Link>

        <Link
          to={buildLeaderboardUrl("language")}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
        >
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {t("leaderboard.tabLanguage")}
          </h2>
          <ul className="space-y-1.5 text-sm">
            {MOCK_BY_LANGUAGE.slice(0, topN).map((row) => (
              <li key={row.rank} className="flex justify-between gap-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  #{row.rank} {row.name}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {row.language} · {row.lessonsCompleted}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("leaderboard.viewAll")} →
          </p>
        </Link>

        <Link
          to={buildLeaderboardUrl("flashcards")}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
        >
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {t("leaderboard.tabFlashcards")}
          </h2>
          <ul className="space-y-1.5 text-sm">
            {MOCK_FLASHCARDS.slice(0, topN).map((row) => (
              <li key={row.rank} className="flex justify-between gap-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  #{row.rank} {row.name}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {row.cardsReviewed.toLocaleString()} cards
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("leaderboard.viewAll")} →
          </p>
        </Link>

        <Link
          to={buildLeaderboardUrl("contributors")}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
        >
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {t("leaderboard.tabContributors")}
          </h2>
          <ul className="space-y-1.5 text-sm">
            {MOCK_CONTRIBUTORS.slice(0, topN).map((row) => (
              <li key={row.rank} className="flex justify-between gap-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  #{row.rank} {row.name}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {row.prs} PRs · {row.reviews} {t("leaderboard.reviews")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("leaderboard.viewAll")} →
          </p>
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t("leaderboard.fullTable")}
      </h2>

      <div className="flex flex-wrap gap-2">
        <Link
          to={buildLeaderboardUrl("xp", period)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentTab === "xp"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {t("leaderboard.tabXp")}
        </Link>
        <Link
          to={buildLeaderboardUrl("language")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentTab === "language"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {t("leaderboard.tabLanguage")}
        </Link>
        <Link
          to={buildLeaderboardUrl("flashcards")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentTab === "flashcards"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {t("leaderboard.tabFlashcards")}
        </Link>
        <Link
          to={buildLeaderboardUrl("contributors")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentTab === "contributors"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {t("leaderboard.tabContributors")}
        </Link>
      </div>

      {currentTab === "xp" && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("leaderboard.topLearners", { period })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("leaderboard.shareable")}{" "}
            <Link to={buildLeaderboardUrl("xp", "week")} className="underline">
              {t("leaderboard.periodWeek")}
            </Link>
            {" · "}
            <Link to={buildLeaderboardUrl("xp", "month")} className="underline">
              {t("leaderboard.periodMonth")}
            </Link>
          </p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {t("leaderboard.rank")}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {t("leaderboard.name")}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {t("leaderboard.xp")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_XP.map((row) => (
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
        </>
      )}

      {currentTab === "language" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.rank")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.name")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.language")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.lessonsCompleted")}
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_BY_LANGUAGE.map((row) => (
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
                    {row.language}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.lessonsCompleted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentTab === "flashcards" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.rank")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.name")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.cardsReviewed")}
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_FLASHCARDS.map((row) => (
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
                    {row.cardsReviewed.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentTab === "contributors" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.rank")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.name")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.prs")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {t("leaderboard.reviews")}
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CONTRIBUTORS.map((row) => (
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
                    {row.prs}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.reviews}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Mock data. Real rankings with backend.
      </p>
    </div>
  );
}
