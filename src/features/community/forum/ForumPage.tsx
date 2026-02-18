import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FORUM_CATEGORIES,
  getThreadsByCategory,
  getThreadsHot,
  getTagById,
} from "./mockForum";
import { Badge } from "../components/Badge";
import { Avatar } from "../components/Avatar";
import { Tag } from "../components/Tag";

type SortMode = "hot" | "new";

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 60000;
  if (diff < 60) return "< 1h";
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  if (diff < 43200) return `${Math.floor(diff / 1440)}d`;
  return d.toLocaleDateString();
}

export function ForumPage() {
  const { t } = useTranslation();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("hot");

  const threads = sort === "hot" ? getThreadsHot() : getThreadsByCategory(null);
  const filteredThreads = categoryId
    ? threads.filter((th) => th.categoryId === categoryId)
    : threads;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Main - 70% */}
        <main className="min-w-0 flex-1 space-y-6 lg:flex-[7]">
          <div>
            <Link
              to="/community"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ← {t("community.title")}
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              {t("forum.title")}
            </h1>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              {t("forum.subtitle")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/community/forum/new"
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {t("forum.newThread")}
              </Link>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSort("hot")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    sort === "hot"
                      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {t("forum.hot")}
                </button>
                <button
                  type="button"
                  onClick={() => setSort("new")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    sort === "new"
                      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {t("forum.new")}
                </button>
              </div>
            </div>
          </div>

          {/* Dense thread list - table */}
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
                  <th className="w-12 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                    ↑
                  </th>
                  <th className="w-14 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                    {t("forum.replies")}
                  </th>
                  <th className="hidden w-14 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 md:table-cell">
                    {t("forum.views")}
                  </th>
                  <th className="w-16 px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                    {t("forum.activity")}
                  </th>
                  <th className="w-12 px-3 py-2" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {filteredThreads.map((thread) => {
                  const tags = thread.tagIds.map((tid) => getTagById(tid)).filter(Boolean);
                  const score = thread.upvoteCount - thread.downvoteCount;
                  return (
                    <tr
                      key={thread.id}
                      className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-800/50"
                    >
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
                        {score}
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
        </main>

        {/* Sidebar - 30% */}
        <aside className="space-y-4 lg:w-80 lg:shrink-0 lg:flex-[3]">
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("forum.categories")}
            </h2>
            <ul className="mt-2 space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => setCategoryId(null)}
                  className={`block w-full rounded px-2 py-1.5 text-left text-sm ${
                    !categoryId
                      ? "bg-gray-200 font-medium text-gray-900 dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {t("forum.allCategories")}
                </button>
              </li>
              {FORUM_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm ${
                      categoryId === cat.id
                        ? "bg-gray-200 font-medium text-gray-900 dark:bg-gray-700 dark:text-white"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    {t(cat.nameKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
