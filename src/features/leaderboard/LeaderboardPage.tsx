import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { DataTable } from "@/shared/components/data";
import { useLang } from "@/shared/hooks/useLangPath";
import { useTranslation } from "react-i18next";
import {
  LEADERBOARD_PERIOD_QUERY,
  LEADERBOARD_TAB_QUERY,
} from "@/shared/hooks/usePathParams";

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

function buildLeaderboardUrl(lang: string, tab: TabId, period?: string): string {
  const params = new URLSearchParams();
  params.set(LEADERBOARD_TAB_QUERY, tab);
  if (period) params.set(LEADERBOARD_PERIOD_QUERY, period);
  return `/${lang}/community/leaderboard?${params.toString()}`;
}

export function LeaderboardPage() {
  const { t } = useTranslation();
  const lang = useLang();
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
          to={`/${lang}/community`}
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
          to={buildLeaderboardUrl(lang, "xp", period)}
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
            {t("leaderboard.viewAll")} <Icon name="arrowBigRight" size={14} className="inline" />
          </p>
        </Link>

        <Link
          to={buildLeaderboardUrl(lang, "language")}
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
            {t("leaderboard.viewAll")} <Icon name="arrowBigRight" size={14} className="inline" />
          </p>
        </Link>

        <Link
          to={buildLeaderboardUrl(lang, "flashcards")}
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
            {t("leaderboard.viewAll")} <Icon name="arrowBigRight" size={14} className="inline" />
          </p>
        </Link>

        <Link
          to={buildLeaderboardUrl(lang, "contributors")}
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
            {t("leaderboard.viewAll")} <Icon name="arrowBigRight" size={14} className="inline" />
          </p>
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t("leaderboard.fullTable")}
      </h2>

      <div className="flex flex-wrap gap-2">
        <Link
          to={buildLeaderboardUrl(lang, "xp", period)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentTab === "xp"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {t("leaderboard.tabXp")}
        </Link>
        <Link
          to={buildLeaderboardUrl(lang, "language")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentTab === "language"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {t("leaderboard.tabLanguage")}
        </Link>
        <Link
          to={buildLeaderboardUrl(lang, "flashcards")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            currentTab === "flashcards"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {t("leaderboard.tabFlashcards")}
        </Link>
        <Link
          to={buildLeaderboardUrl(lang, "contributors")}
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
            <Link to={buildLeaderboardUrl(lang, "xp", "week")} className="underline">
              {t("leaderboard.periodWeek")}
            </Link>
            {" · "}
            <Link to={buildLeaderboardUrl(lang, "xp", "month")} className="underline">
              {t("leaderboard.periodMonth")}
            </Link>
          </p>
          <DataTable
            columns={[
              { key: "rank", label: t("leaderboard.rank"), render: (r) => <>#{r.rank}</> },
              { key: "name", label: t("leaderboard.name"), render: (r) => <span className="font-medium text-text-primary">{r.name}</span> },
              { key: "xp", label: t("leaderboard.xp"), render: (r) => <span className="text-text-muted">{r.xp.toLocaleString()} XP</span> },
            ]}
            rows={MOCK_XP}
            getRowKey={(r) => String(r.rank)}
          />
        </>
      )}

      {currentTab === "language" && (
        <DataTable
          columns={[
            { key: "rank", label: t("leaderboard.rank"), render: (r) => <>#{r.rank}</> },
            { key: "name", label: t("leaderboard.name"), render: (r) => <span className="font-medium text-text-primary">{r.name}</span> },
            { key: "language", label: t("leaderboard.language"), render: (r) => <span className="text-text-muted">{r.language}</span> },
            { key: "lessons", label: t("leaderboard.lessonsCompleted"), render: (r) => <span className="text-text-muted">{r.lessonsCompleted}</span> },
          ]}
          rows={MOCK_BY_LANGUAGE}
          getRowKey={(r) => String(r.rank)}
        />
      )}

      {currentTab === "flashcards" && (
        <DataTable
          columns={[
            { key: "rank", label: t("leaderboard.rank"), render: (r) => <>#{r.rank}</> },
            { key: "name", label: t("leaderboard.name"), render: (r) => <span className="font-medium text-text-primary">{r.name}</span> },
            { key: "cards", label: t("leaderboard.cardsReviewed"), render: (r) => <span className="text-text-muted">{r.cardsReviewed.toLocaleString()}</span> },
          ]}
          rows={MOCK_FLASHCARDS}
          getRowKey={(r) => String(r.rank)}
        />
      )}

      {currentTab === "contributors" && (
        <DataTable
          columns={[
            { key: "rank", label: t("leaderboard.rank"), render: (r) => <>#{r.rank}</> },
            { key: "name", label: t("leaderboard.name"), render: (r) => <span className="font-medium text-text-primary">{r.name}</span> },
            { key: "prs", label: t("leaderboard.prs"), render: (r) => <span className="text-text-muted">{r.prs}</span> },
            { key: "reviews", label: t("leaderboard.reviews"), render: (r) => <span className="text-text-muted">{r.reviews}</span> },
          ]}
          rows={MOCK_CONTRIBUTORS}
          getRowKey={(r) => String(r.rank)}
        />
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Mock data. Real rankings with backend.
      </p>
    </div>
  );
}
