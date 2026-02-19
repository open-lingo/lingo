import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig, LANGUAGE_CONFIGS } from "@/shared/domain/languageConfig";
import {
  getAllAddons,
  getTrendingCourses,
  getTrendingCardPacks,
  getNewStories,
} from "./mockCommunity";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import type { CommunityAddon } from "./types";
import type { AddonKind } from "./types";

const ADDON_KIND_KEYS: Record<AddonKind, string> = {
  course: "community.addonKindCourse",
  "flashcard-pack": "community.addonKindFlashcardPack",
  story: "community.addonKindStory",
  grammar: "community.addonKindGrammar",
};

/** Content Browser: courses, flashcard packs, and stories. */
type ContentType = "course" | "flashcard-pack" | "story";

function matchesSearch(addon: CommunityAddon, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase();
  const lang = getLanguageConfig(addon.languageId);
  const langName = lang?.name ?? addon.languageId;
  return (
    addon.name.toLowerCase().includes(lower) ||
    addon.description.toLowerCase().includes(lower) ||
    langName.toLowerCase().includes(lower)
  );
}

function ContentCard({
  addon,
  t,
  langPath,
}: {
  addon: CommunityAddon;
  t: (k: string) => string;
  langPath: (p: string) => string;
}) {
  const lang = getLanguageConfig(addon.languageId);
  const langName = lang?.name ?? addon.languageId;
  const flag = lang?.flag ?? "🌐";

  return (
    <div
      key={addon.id}
      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <span className="text-2xl" role="img" aria-label={langName}>
        {flag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">
            {addon.name}
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {t(ADDON_KIND_KEYS[addon.kind])}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {addon.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {addon.itemCount ?? "—"} {t("community.addonsItems")}
          </span>
          <span>↑ {addon.upvoteCount}</span>
        </div>
      </div>
      <div className="shrink-0">
        <button
          type="button"
          className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
          aria-label="Upvote"
        >
          ↑
        </button>
        <Link
          to={addon.kind === "story" ? langPath("practice/stories") : langPath("practice/flashcards")}
          className="ml-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {t("community.contentBrowserOpen")}
        </Link>
      </div>
    </div>
  );
}

export function ContentBrowserPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");

  const langId = language?.id ?? "ko";

  const trendingCourses = useMemo(
    () => getTrendingCourses(langId),
    [langId]
  );
  const trendingPacks = useMemo(
    () => getTrendingCardPacks(langId),
    [langId]
  );
  const newStories = useMemo(
    () => getNewStories(langId),
    [langId]
  );

  const langName = getLanguageConfig(langId)?.name ?? langId;

  const allContent = useMemo(() => {
    const addons = getAllAddons().filter(
      (a): a is CommunityAddon =>
        a.kind === "course" || a.kind === "flashcard-pack" || a.kind === "story"
    );
    return addons;
  }, []);

  const supportedLanguageIds = useMemo(() => {
    const ids = new Set(allContent.map((a) => a.languageId));
    return Array.from(ids).sort();
  }, [allContent]);

  const filtered = useMemo(() => {
    return allContent.filter((a) => {
      if (!matchesSearch(a, search)) return false;
      if (languageFilter && a.languageId !== languageFilter) return false;
      if (typeFilter !== "all" && a.kind !== typeFilter) return false;
      return true;
    });
  }, [allContent, search, languageFilter, typeFilter]);

  const flashcardDecks = useMemo(
    () => filtered.filter((a) => a.kind === "flashcard-pack"),
    [filtered]
  );
  const courses = useMemo(
    () => filtered.filter((a) => a.kind === "course"),
    [filtered]
  );
  const stories = useMemo(
    () => filtered.filter((a) => a.kind === "story"),
    [filtered]
  );

  const showSearchResults = search.trim().length > 0;

  function FeaturedCard({
    title,
    items,
    filterLink,
  }: {
    title: string;
    items: CommunityAddon[];
    filterLink: string;
  }) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {items.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("community.contentBrowserNoResults")}
          </p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link
                  to={a.kind === "story" ? langPath("practice/stories") : langPath("practice/flashcards")}
                  className="block truncate text-sm text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                >
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          to={filterLink}
          className="mt-2 inline-block text-xs font-medium text-green-600 hover:underline dark:text-green-400"
        >
          {t("community.contentBrowserViewAll")} →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured cards: Trending courses, card packs, new stories */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeaturedCard
          title={t("community.contentBrowserTrendingCourses", { language: langName })}
          items={trendingCourses}
          filterLink={langPath("community/content")}
        />
        <FeaturedCard
          title={t("community.contentBrowserTrendingCardPacks", { language: langName })}
          items={trendingPacks}
          filterLink={langPath("community/content")}
        />
        <FeaturedCard
          title={t("community.contentBrowserNewStories", { language: langName })}
          items={newStories}
          filterLink={langPath("community/content")}
        />
      </section>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Left sidebar: search + filters */}
      <aside className="shrink-0 space-y-4 lg:w-56">
        <div>
          <label htmlFor="content-search" className="sr-only">
            {t("community.contentBrowserSearchPlaceholder")}
          </label>
          <input
            id="content-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("community.contentBrowserSearchPlaceholder")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("forum.type")}
          </h3>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                typeFilter === "all"
                  ? "bg-green-600 text-white dark:bg-green-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {t("community.browse")}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("flashcard-pack")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                typeFilter === "flashcard-pack"
                  ? "bg-green-600 text-white dark:bg-green-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {t("community.browseFlashcards")}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("course")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                typeFilter === "course"
                  ? "bg-green-600 text-white dark:bg-green-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {t("community.browseCourses")}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("story")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                typeFilter === "story"
                  ? "bg-green-600 text-white dark:bg-green-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {t("community.addonKindStory")}
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("forum.language")}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLanguageFilter(null)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                languageFilter === null
                  ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/20"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
              }`}
              title={t("community.contentBrowserAllLanguages")}
              aria-label={t("community.contentBrowserAllLanguages")}
            >
              🌐
            </button>
            {supportedLanguageIds.map((langId) => {
              const cfg = getLanguageConfig(langId) ?? LANGUAGE_CONFIGS[langId];
              const flag = cfg?.flag ?? "🌐";
              const name = cfg?.name ?? langId;
              const active = languageFilter === langId;
              return (
                <button
                  key={langId}
                  type="button"
                  onClick={() =>
                    setLanguageFilter(active ? null : langId)
                  }
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                    active
                      ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                  }`}
                  title={name}
                  aria-label={name}
                >
                  {flag}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main: sections or search results */}
      <main className="min-w-0 flex-1 space-y-8">
        {showSearchResults ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t("community.contentBrowserSearchResults")} ({filtered.length})
            </h2>
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("community.contentBrowserNoResults")}
              </p>
            ) : (
              <ul className="space-y-3">
                {filtered.map((addon) => (
                  <li key={addon.id}>
                    <ContentCard addon={addon} t={t} langPath={langPath} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {t("community.contentBrowserFlashcardDecks")}
              </h2>
              {flashcardDecks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("community.contentBrowserNoResults")}
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {flashcardDecks.map((addon) => (
                    <li key={addon.id}>
                      <ContentCard addon={addon} t={t} langPath={langPath} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {t("community.contentBrowserAdditionalCourses")}
              </h2>
              {courses.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("community.contentBrowserNoResults")}
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {courses.map((addon) => (
                    <li key={addon.id}>
                      <ContentCard addon={addon} t={t} langPath={langPath} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {t("community.contentBrowserStoriesSection")}
              </h2>
              {stories.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("community.contentBrowserNoResults")}
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {stories.map((addon) => (
                    <li key={addon.id}>
                      <ContentCard addon={addon} t={t} langPath={langPath} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <Link
          to={langPath("")}
          className="inline-block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("community.backToHome")}
        </Link>
      </main>
      </div>
    </div>
  );
}
