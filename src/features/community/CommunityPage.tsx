import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLanguageConfig } from "@/core/languageConfig";
import {
  FORUM_CATEGORIES,
  FORUM_TAGS,
  getThreadsHot,
  getTagById,
  TOP_CONTRIBUTORS,
} from "./forum/mockForum";
import { getAllAddons } from "./mockCommunity";
import { Badge } from "./components/Badge";
import { Avatar } from "./components/Avatar";
import { Tag } from "./components/Tag";
import type { CommunityAddon } from "./types";
import type { AddonKind } from "./types";

const ADDON_KIND_KEYS: Record<AddonKind, string> = {
  course: "community.addonKindCourse",
  "flashcard-pack": "community.addonKindFlashcardPack",
  story: "community.addonKindStory",
  grammar: "community.addonKindGrammar",
};

type BrowseFilter = "all" | "flashcard-pack" | "course" | "story" | "addons";

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 60000;
  if (diff < 60) return "< 1h";
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  if (diff < 43200) return `${Math.floor(diff / 1440)}d`;
  return d.toLocaleDateString();
}

export function CommunityPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [browseFilter, setBrowseFilter] = useState<BrowseFilter>("all");
  const [sortThreads] = useState<"hot" | "new">("hot");

  const threads = getThreadsHot();
  const addons = getAllAddons();
  const filteredAddons = language ? addons.filter((a) => a.languageId === language.id) : addons;

  const browseAddons =
    browseFilter === "all"
      ? filteredAddons
      : browseFilter === "addons"
        ? filteredAddons.filter((a) => a.kind === "story" || a.kind === "grammar")
        : filteredAddons.filter((a) => a.kind === browseFilter);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("community.title")}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {t("community.intro")}
        </p>
      </div>

      {/* Browse cards */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {t("community.browse")}
        </h2>
        <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
          {t("community.browseDesc")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setBrowseFilter("all")}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
              browseFilter === "all"
                ? "border-green-500 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-900/20 dark:text-green-400"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
            }`}
          >
            <span className="block text-lg" aria-hidden>📚</span>
            {t("community.browse")}
          </button>
          <button
            type="button"
            onClick={() => setBrowseFilter("flashcard-pack")}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
              browseFilter === "flashcard-pack"
                ? "border-green-500 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-900/20 dark:text-green-400"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
            }`}
          >
            <span className="block text-lg" aria-hidden>🃏</span>
            {t("community.browseFlashcards")}
          </button>
          <button
            type="button"
            onClick={() => setBrowseFilter("course")}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
              browseFilter === "course"
                ? "border-green-500 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-900/20 dark:text-green-400"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
            }`}
          >
            <span className="block text-lg" aria-hidden>📖</span>
            {t("community.browseCourses")}
          </button>
          <a
            href="https://github.com/open-lingo/lingo/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 px-4 py-3 text-left text-sm font-medium transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
          >
            <span className="block text-lg" aria-hidden>➕</span>
            {t("community.browseContribute")}
          </a>
        </div>
      </section>

      {/* Forum (main) + Sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <main className="min-w-0 flex-1 space-y-6 lg:flex-[7]">
          {/* Forum header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("forum.title")}
            </h2>
            <div className="flex gap-2">
              <Link
                to="/community/forum/new"
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {t("forum.newThread")}
              </Link>
              <Link
                to="/community/forum"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("forum.browseCategories")}
              </Link>
            </div>
          </div>

          {/* Forum Categories Table */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              {t("forum.categories")}
            </h3>
            <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      {t("forum.category")}
                    </th>
                    <th className="hidden px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 sm:table-cell">
                      {t("forum.description")}
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                      {t("forum.topics")}
                    </th>
                    <th className="hidden px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 md:table-cell">
                      {t("forum.latestActivity")}
                    </th>
                    <th className="hidden px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 lg:table-cell">
                      {t("forum.moderator")}
                    </th>
                    <th className="w-16 px-3 py-2" aria-label={t("forum.view")} />
                  </tr>
                </thead>
                <tbody>
                  {FORUM_CATEGORIES.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                        {t(cat.nameKey)}
                      </td>
                      <td className="hidden px-3 py-2 text-gray-600 dark:text-gray-400 sm:table-cell">
                        {t(cat.descriptionKey)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                        {cat.topicsCount}
                      </td>
                      <td className="hidden px-3 py-2 text-right text-gray-600 dark:text-gray-400 md:table-cell">
                        {formatTimeAgo(cat.latestActivity)}
                      </td>
                      <td className="hidden px-3 py-2 text-right text-gray-600 dark:text-gray-400 lg:table-cell">
                        {cat.moderatorName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          to={`/community/forum?category=${cat.id}`}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          {t("forum.view")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent / Hot Threads */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {sortThreads === "hot" ? t("forum.hot") : t("forum.new")} {t("forum.threads")}
              </h3>
              <Link
                to="/community/forum"
                className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                {t("forum.viewAll")}
              </Link>
            </div>
            <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      {t("forum.threadTitle")}
                    </th>
                    <th className="hidden px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 sm:table-cell">
                      {t("forum.tags")}
                    </th>
                    <th className="w-14 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                      {t("forum.replies")}
                    </th>
                    <th className="hidden w-14 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 md:table-cell">
                      {t("forum.views")}
                    </th>
                    <th className="w-20 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                      {t("forum.activity")}
                    </th>
                    <th className="w-16 px-3 py-2" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {threads.slice(0, 8).map((thread) => {
                    const tags = thread.tagIds.map((tid) => getTagById(tid)).filter(Boolean);
                    return (
                      <tr key={thread.id}>
                        <td className="group px-3 py-2">
                          <Link
                            to={`/community/forum/thread/${thread.id}`}
                            className="flex items-center gap-2 font-medium text-gray-900 hover:text-green-600 dark:text-white dark:hover:text-green-400"
                          >
                            {thread.isPinned && (
                              <span className="text-amber-500" aria-label={t("forum.pinned")}>
                                •
                              </span>
                            )}
                            <span className="truncate">{thread.title}</span>
                          </Link>
                        </td>
                        <td className="hidden px-3 py-2 sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 3).map((tag) => (
                              <Tag key={tag!.id}>{tag!.name}</Tag>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                          {thread.replyCount}
                        </td>
                        <td className="hidden px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400 md:table-cell">
                          {thread.viewCount ?? 0}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatTimeAgo(thread.updatedAt)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Avatar name={thread.authorName} size="xs" />
                            {thread.status && (
                              <Badge variant={thread.status}>
                                {t(`forum.status${thread.status.charAt(0).toUpperCase() + thread.status.slice(1)}`)}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Browse content table */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              {t("community.browse")}
            </h3>
            <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      {t("forum.name")}
                    </th>
                    <th className="hidden px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 sm:table-cell">
                      {t("forum.type")}
                    </th>
                    <th className="hidden px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 md:table-cell">
                      {t("forum.language")}
                    </th>
                    <th className="w-14 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                      {t("community.addonsItems")}
                    </th>
                    <th className="w-14 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                      ↑
                    </th>
                    <th className="w-20 px-3 py-2" aria-label={t("forum.actions")} />
                  </tr>
                </thead>
                <tbody>
                  {browseAddons.slice(0, 8).map((addon: CommunityAddon) => {
                    const langConfig = getLanguageConfig(addon.languageId);
                    const langName = langConfig?.name ?? addon.languageId;
                    return (
                      <tr
                        key={addon.id}
                        className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                          {addon.name}
                        </td>
                        <td className="hidden px-3 py-2 text-gray-600 dark:text-gray-400 sm:table-cell">
                          {t(ADDON_KIND_KEYS[addon.kind])}
                        </td>
                        <td className="hidden px-3 py-2 text-gray-600 dark:text-gray-400 md:table-cell">
                          {langName}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                          {addon.itemCount ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                          {addon.upvoteCount}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className="rounded px-2 py-0.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              ↑
                            </button>
                            <Link
                              to="/flashcards"
                              className="rounded px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                            >
                              {t("forum.open")}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("community.sectionContentDesc")}
            </p>
          </section>
        </main>

        {/* Sidebar - 30% */}
        <aside className="space-y-4 lg:w-80 lg:shrink-0 lg:flex-[3]">
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <Link
              to="/community/forum/new"
              className="block w-full rounded-md bg-green-600 py-2 text-center text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              {t("forum.newThread")}
            </Link>
          </div>

          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("forum.trendingTags")}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {FORUM_TAGS.slice(0, 8).map((tag) => (
                <Link
                  key={tag.id}
                  to={`/community/forum?tag=${tag.slug}`}
                  className="inline-block"
                >
                  <Tag>{tag.name}</Tag>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("forum.topContributors")}
            </h3>
            <ul className="mt-2 space-y-2">
              {TOP_CONTRIBUTORS.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <Avatar name={c.name} size="xs" />
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">{c.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{c.postCount}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("community.links")}
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a
                  href="https://github.com/open-lingo/lingo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline dark:text-green-400"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/open-lingo/lingo/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline dark:text-green-400"
                >
                  Issues
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("community.footer")}
      </p>

      <Link
        to="/"
        className="inline-block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        {t("community.backToHome")}
      </Link>
    </div>
  );
}
