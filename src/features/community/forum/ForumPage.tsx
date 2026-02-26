import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import {
  FORUM_CATEGORIES,
  getThreadsByCategory,
  getThreadsHot,
  getTagById,
} from "./mockForum";
import { getAllAddons } from "../mockCommunity";
import { Badge } from "../components/Badge";
import { Avatar } from "../components/Avatar";
import { Tag } from "../components/Tag";
import { DataTable } from "@/shared/components/data";
import { useDateFormat } from "@/shared/utils/formatDate";
import type { ForumThread } from "./types";

type SortMode = "hot" | "new";

export function ForumPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { formatDateOnly } = useDateFormat();

  function formatTimeAgo(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 60000;
    if (diff < 60) return "< 1h";
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    if (diff < 43200) return `${Math.floor(diff / 1440)}d`;
    return formatDateOnly(iso);
  }
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
              to={langPath("community/explore")}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("community.title")}
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              {t("forum.title")}
            </h1>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              {t("forum.subtitle")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={langPath("community/discuss/new")}
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
          <DataTable<ForumThread>
            columns={[
              {
                key: "title",
                label: t("forum.threadTitle"),
                render: (thread) => (
                  <Link
                    to={langPath(`community/discuss/thread/${thread.id}`)}
                    className="flex items-center gap-2 font-medium text-text-primary hover:text-accent"
                  >
                    {thread.isPinned && (
                      <span className="text-amber-500" aria-label={t("forum.pinned")}>
                        •
                      </span>
                    )}
                    <span className="truncate">{thread.title}</span>
                  </Link>
                ),
              },
              {
                key: "tags",
                label: t("forum.tags"),
                render: (thread) => {
                  const tags = thread.tagIds.map((tid) => getTagById(tid)).filter(Boolean);
                  return (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag) => (
                        <Tag key={tag!.id}>{tag!.name}</Tag>
                      ))}
                    </div>
                  );
                },
                className: "hidden sm:table-cell",
              },
              {
                key: "score",
                label: "",
                render: (thread) => (
                  <span className="tabular-nums text-text-muted">
                    {thread.upvoteCount - thread.downvoteCount}
                  </span>
                ),
              },
              {
                key: "replies",
                label: t("forum.replies"),
                render: (thread) => (
                  <span className="tabular-nums text-text-muted">{thread.replyCount}</span>
                ),
              },
              {
                key: "views",
                label: t("forum.views"),
                render: (thread) => (
                  <span className="hidden tabular-nums text-text-muted md:inline">
                    {thread.viewCount ?? 0}
                  </span>
                ),
                className: "hidden md:table-cell",
              },
              {
                key: "activity",
                label: t("forum.activity"),
                render: (thread) => (
                  <span className="text-text-muted">{formatTimeAgo(thread.updatedAt)}</span>
                ),
              },
              {
                key: "meta",
                label: "",
                render: (thread) => (
                  <div className="flex items-center justify-end gap-1">
                    <Avatar name={thread.authorName} size="xs" />
                    {thread.status && (
                      <Badge variant={thread.status}>
                        {t(`forum.status${thread.status.charAt(0).toUpperCase() + thread.status.slice(1)}`)}
                      </Badge>
                    )}
                  </div>
                ),
              },
            ]}
            rows={filteredThreads}
            getRowKey={(th) => th.id}
            emptyMessage={t("forum.noThreads") || "No threads yet"}
          />
        </main>

        {/* Sidebar - 30% */}
        <aside className="space-y-4 lg:w-80 lg:shrink-0 lg:flex-[3]">
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("community.popularContent")}
            </h2>
            <ul className="mt-2 space-y-1">
              {getAllAddons().slice(0, 5).map((addon) => (
                <li key={addon.id}>
                  <Link
                    to={langPath("community/explore")}
                    className="block truncate text-sm text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                  >
                    {addon.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
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
