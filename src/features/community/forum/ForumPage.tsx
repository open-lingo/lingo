import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api";
import type {
  CommunityAddon,
  CommunityCategory,
  CommunityTag,
  CommunityThread,
} from "@/shared/api/community";
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

  // Popular content rail — pulls top addons by upvote regardless of language.
  // Limit 5 since the rail only shows 5 rows.
  const popularAddonsQuery = useQuery<CommunityAddon[]>({
    queryKey: ["community", "addons", "popular-rail"],
    queryFn: ({ signal }) => community.listAddons({ limit: 25 }, signal),
    staleTime: 5 * 60_000,
  });

  // Bucket recent threads by author for "top contributors" rail. There is
  // no backend aggregate yet — see ContributorsPage TODO. Pull a larger
  // window than the table needs so the bucket is meaningful.
  const recentThreadsQuery = useQuery<CommunityThread[]>({
    queryKey: ["community", "threads", "recent-for-contributors"],
    queryFn: ({ signal }) =>
      community.listThreads({ sort: "new", limit: 200 }, signal),
    staleTime: 5 * 60_000,
  });

  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const threads = threadsQuery.data ?? [];

  const tagById = new Map(tags.map((tag) => [tag.id, tag]));

  const popularAddons = useMemo(() => {
    const list = popularAddonsQuery.data ?? [];
    return [...list]
      .sort((a, b) => b.upvoteCount - a.upvoteCount)
      .slice(0, 5);
  }, [popularAddonsQuery.data]);

  const topContributors = useMemo(() => {
    const list = recentThreadsQuery.data ?? [];
    const bucket = new Map<string, { id: string; name: string; postCount: number }>();
    for (const th of list) {
      const entry = bucket.get(th.authorId);
      if (entry) entry.postCount += 1;
      else
        bucket.set(th.authorId, {
          id: th.authorId,
          name: th.authorName,
          postCount: 1,
        });
    }
    return Array.from(bucket.values())
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5);
  }, [recentThreadsQuery.data]);

  return (
    <PageShell variant="wide">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Main - 70% */}
        <section className="min-w-0 flex-1 space-y-6 lg:flex-[7]">
          <div>
            <Link
              to={langPath("community/explore")}
              className="text-sm text-text-secondary hover:text-text-primary"
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
                      ? "bg-accent text-white"
                      : "border border-border text-text-secondary hover:bg-surface-muted"
                  }`}
                >
                  {t("forum.hot")}
                </button>
                <button
                  type="button"
                  onClick={() => setSort("new")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    sort === "new"
                      ? "bg-accent text-white"
                      : "border border-border text-text-secondary hover:bg-surface-muted"
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
          <div className="rounded-md border border-border p-4">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("community.popularContent")}
            </h2>
            {popularAddons.length === 0 ? (
              <p className="mt-2 text-xs text-text-muted">
                {t("community.popularContentEmpty", "No content yet.")}
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {popularAddons.map((addon) => (
                  <li key={addon.id}>
                    <Link
                      to={langPath("community/explore")}
                      className="block truncate text-sm text-text-secondary hover:text-green-600"
                    >
                      {addon.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-md border border-border p-4">
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
                      ? "bg-surface-muted font-medium text-text-primary"
                      : "text-text-secondary hover:bg-surface-muted"
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
                        ? "bg-surface-muted font-medium text-text-primary"
                        : "text-text-secondary hover:bg-surface-muted"
                    }`}
                  >
                    {t(cat.nameKey, { defaultValue: cat.slug })}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* TODO: backend doesn't expose a top-contributors aggregate yet; */}
          {/* bucketing recent threads by author until /community/contributors lands. */}
          <div className="rounded-md border border-border p-4">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("forum.topContributors")}
            </h2>
            {topContributors.length === 0 ? (
              <p className="mt-2 text-xs text-text-muted">
                {t("forum.topContributorsEmpty", "No contributors yet.")}
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {topContributors.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-text-secondary">{c.name}</span>
                    <span className="text-text-muted tabular-nums">
                      {c.postCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
