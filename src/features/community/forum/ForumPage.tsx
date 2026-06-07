import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api";
import type {
  CommunityCategory,
  CommunityTag,
  CommunityThread,
} from "@/shared/api/community";
import { TOP_CONTRIBUTORS } from "./mockForum";
import { getAllAddons } from "../mockCommunity";
import { Badge } from "../components/Badge";
import { Avatar } from "../components/Avatar";
import { Tag } from "../components/Tag";
import { DataTable } from "@/shared/components/data";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { formatTimeAgo } from "@/shared/utils/formatDate";
import { PageShell } from "@/shared/components/PageShell";

type SortMode = "hot" | "new";

export function ForumPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { community } = useApi();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("hot");

  const categoriesQuery = useQuery<CommunityCategory[]>({
    queryKey: ["community", "categories"],
    queryFn: ({ signal }) => community.listCategories(signal),
    staleTime: 5 * 60_000,
  });

  const tagsQuery = useQuery<CommunityTag[]>({
    queryKey: ["community", "tags"],
    queryFn: ({ signal }) => community.listTags(signal),
    staleTime: 5 * 60_000,
  });

  const threadsQuery = useQuery<CommunityThread[]>({
    queryKey: ["community", "threads", { sort, categoryId }],
    queryFn: ({ signal }) =>
      community.listThreads(
        { sort, categoryId: categoryId ?? undefined },
        signal,
      ),
    staleTime: 60_000,
  });

  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const threads = threadsQuery.data ?? [];

  const tagById = new Map(tags.map((tag) => [tag.id, tag]));

  return (
    <PageShell variant="wide">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Main - 70% */}
        <section className="min-w-0 flex-1 space-y-6 lg:flex-[7]">
          <div>
            <Link
              to={langPath("community/explore")}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("community.title")}
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-text-primary">
              {t("forum.title")}
            </h1>
            <p className="mt-0.5 text-sm text-text-muted">
              {t("forum.subtitle")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={langPath("community/discuss/new")}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                {t("forum.newThread")}
              </Link>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSort("hot")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    sort === "hot"
                      ? "bg-gray-900 text-white bg-surface text-text-primary"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t("forum.hot")}
                </button>
                <button
                  type="button"
                  onClick={() => setSort("new")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    sort === "new"
                      ? "bg-gray-900 text-white bg-surface text-text-primary"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t("forum.new")}
                </button>
              </div>
            </div>
          </div>

          {threadsQuery.isLoading ? (
            <CenteredLoader py="lg" label={t("forum.loading") ?? "Loading"} />
          ) : threads.length === 0 ? (
            <EmptyState
              title={t("forum.noThreads") ?? "No threads yet"}
              description={t("forum.noThreadsDesc") ?? undefined}
            />
          ) : (
            <DataTable<CommunityThread>
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
                    const threadTags = thread.tagIds
                      .map((tid) => tagById.get(tid))
                      .filter((tag): tag is CommunityTag => Boolean(tag));
                    return (
                      <div className="flex flex-wrap gap-1">
                        {threadTags.slice(0, 3).map((tag) => (
                          <Tag key={tag.id}>{tag.name}</Tag>
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
                      {thread.status && thread.status !== "open" && (
                        <Badge variant={badgeVariantFor(thread.status)}>
                          {t(`forum.status${capitalize(thread.status)}`, {
                            defaultValue: thread.status,
                          })}
                        </Badge>
                      )}
                    </div>
                  ),
                },
              ]}
              rows={threads}
              getRowKey={(th) => th.id}
              emptyMessage={t("forum.noThreads") || "No threads yet"}
            />
          )}
        </section>

        {/* Sidebar - 30% */}
        <aside className="space-y-4 lg:w-80 lg:shrink-0 lg:flex-[3]">
          <div className="rounded-md border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("community.popularContent")}
            </h2>
            <ul className="mt-2 space-y-1">
              {getAllAddons().slice(0, 5).map((addon) => (
                <li key={addon.id}>
                  <Link
                    to={langPath("community/explore")}
                    className="block truncate text-sm text-gray-700 hover:text-green-600"
                  >
                    {addon.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("forum.categories")}
            </h2>
            <ul className="mt-2 space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => setCategoryId(null)}
                  className={`block w-full rounded px-2 py-1.5 text-left text-sm ${
                    !categoryId
                      ? "bg-gray-200 font-medium text-gray-900"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t("forum.allCategories")}
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm ${
                      categoryId === cat.id
                        ? "bg-gray-200 font-medium text-gray-900"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {t(cat.nameKey, { defaultValue: cat.slug })}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* TODO: backend doesn't expose a top-contributors aggregate yet; */}
          {/* swap to real data once /community/contributors lands. */}
          <div className="rounded-md border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("forum.topContributors")}
            </h2>
            <ul className="mt-2 space-y-1">
              {TOP_CONTRIBUTORS.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.name}</span>
                  <span className="text-text-muted tabular-nums">{c.postCount}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Why: backend ``status`` is open|closed|locked|… but the existing Badge
// variants only know hot/solved/new. Map unknown statuses to ``new`` so
// nothing crashes when the backend ships a status the FE hasn't seen.
function badgeVariantFor(status: string): "hot" | "solved" | "new" {
  if (status === "hot" || status === "solved" || status === "new") return status;
  return "new";
}
