import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { CommunityDiscoveryLayout } from "./CommunityDiscoveryLayout";
import { Avatar } from "./components/Avatar";
import { useCreatorDirectory } from "./hooks/useCreatorDirectory";
import { useTopContributors } from "./hooks/useTopContributors";
import { DataTable, type DataTableColumn } from "@/shared/components/data";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { UserPreviewPopover } from "@/features/social/components/UserPreviewPopover";
import { AddFriendButton } from "@/features/social/components/AddFriendButton";
import { useApi } from "@/shared/api/provider";
import type { CommunityThread } from "@/shared/api/community";

type Contributor = {
  id: string;
  handle: string;
  displayName: string;
  /** Published content (decks/stories) authored. */
  contentCount: number;
  /** Forum threads started. */
  threadCount: number;
  latestThreadAt: string;
};

type SortKey = "content" | "threads" | "recent" | "name";

const TOP_LIMIT = 20;

export function ContributorsPage() {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("content");
  const { community } = useApi();
  const { resolveCreator } = useCreatorDirectory();
  // Content-authorship contributors (decks/stories) — same signal as the home
  // rail, so "See all" doesn't dead-end into an empty page when there are no
  // forum threads.
  const { contributors: contentContributors } = useTopContributors(TOP_LIMIT);

  // Why: no backend contributors aggregate yet — supplement content authorship
  // with forum-thread authorship, bucketed by author_id. Pull a wide-enough
  // window (200) to make the bucket meaningful.
  // TODO: replace both with /community/contributors once the aggregate ships.
  const threadsQuery = useQuery<CommunityThread[]>({
    queryKey: ["community", "threads", "recent-for-contributors"],
    queryFn: ({ signal }) =>
      community.listThreads({ sort: "new", limit: 200 }, signal),
    staleTime: 5 * 60_000,
  });

  const contributors = useMemo<Contributor[]>(() => {
    const bucket = new Map<string, Contributor>();
    // Seed from content authorship (carries resolved name/handle).
    for (const c of contentContributors) {
      bucket.set(c.userId, {
        id: c.userId,
        handle: c.username,
        displayName: c.displayName,
        contentCount: c.contentCount,
        threadCount: 0,
        latestThreadAt: "",
      });
    }
    // Overlay forum-thread authorship.
    for (const th of threadsQuery.data ?? []) {
      const entry = bucket.get(th.authorId);
      if (entry) {
        entry.threadCount += 1;
        if (th.updatedAt > entry.latestThreadAt) entry.latestThreadAt = th.updatedAt;
      } else {
        bucket.set(th.authorId, {
          id: th.authorId,
          handle: th.authorId,
          displayName: th.authorName || th.authorId,
          contentCount: 0,
          threadCount: 1,
          latestThreadAt: th.updatedAt,
        });
      }
    }
    return Array.from(bucket.values()).slice(0, TOP_LIMIT);
  }, [contentContributors, threadsQuery.data]);

  const rows = useMemo(() => {
    const arr = [...contributors];
    arr.sort((a, b) => {
      if (sortKey === "content") return b.contentCount - a.contentCount || b.threadCount - a.threadCount;
      if (sortKey === "threads") return b.threadCount - a.threadCount;
      if (sortKey === "recent")
        return (
          new Date(b.latestThreadAt).getTime() -
          new Date(a.latestThreadAt).getTime()
        );
      return a.displayName.localeCompare(b.displayName);
    });
    return arr;
  }, [contributors, sortKey]);

  const columns: DataTableColumn<Contributor>[] = [
    {
      key: "name",
      label: t("community.contributorName", "Contributor"),
      render: (c) => (
        <UserPreviewPopover
          username={c.handle}
          displayName={c.displayName}
          statsLine={t("community.contributorThreadsLine", {
            threads: c.threadCount,
            defaultValue: "{{threads}} threads",
          })}
        >
          <span className="group inline-flex min-w-0 items-center gap-3">
            <Avatar
              name={c.displayName}
              src={resolveCreator(c.id)?.avatarUrl}
              size="sm"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate font-medium text-text-primary group-hover:text-accent">
                  {c.displayName}
                </span>
              </span>
              <span className="block truncate text-xs text-text-muted">
                @{c.handle}
              </span>
            </span>
          </span>
        </UserPreviewPopover>
      ),
    },
    {
      key: "content",
      label: t("community.contributorContent", "Content"),
      className: "text-right",
      render: (c) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-text-secondary">
          <Icon name="layers" size={12} aria-hidden />
          {c.contentCount}
        </span>
      ),
    },
    {
      key: "threads",
      label: t("community.contributorThreads", "Threads"),
      className: "hidden text-right sm:table-cell",
      render: (c) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-text-secondary">
          <Icon name="fileText" size={12} aria-hidden />
          {c.threadCount}
        </span>
      ),
    },
    {
      key: "recent",
      label: t("community.contributorLatest", "Latest"),
      className: "hidden md:table-cell text-right",
      render: (c) => (
        <span className="text-text-muted">
          {c.latestThreadAt ? new Date(c.latestThreadAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "addFriend",
      label: "",
      className: "text-right",
      render: (c) => <AddFriendButton targetUsername={c.handle} size="sm" />,
    },
    {
      key: "action",
      label: "",
      className: "text-right",
      render: (c) => (
        <Link
          to={`/u/${c.handle}`}
          className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary"
        >
          {t("community.contributorView", "View")}
        </Link>
      ),
    },
  ];

  return (
    <CommunityDiscoveryLayout>
      <div className="rounded-lg border border-accent-muted bg-accent-muted/30 px-3 py-2 text-sm text-accent">
        {t("community.contributorsBanner", {
          count: contributors.length,
          defaultValue:
            "{{count}} learners building Open Lingo. Follow, learn from them, contribute back.",
        })}
      </div>

      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">
              {contributors.length}
            </span>{" "}
            {t("community.contributorsLabel", "contributors")}
          </p>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="hidden sm:inline">
              {t("community.contentBrowserSortBy")}
            </span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="content">
                {t("community.contributorSortContent", "Most content")}
              </option>
              <option value="threads">
                {t("community.contributorSortThreads", "Most threads")}
              </option>
              <option value="recent">
                {t("community.contributorSortRecent", "Most recent")}
              </option>
              <option value="name">
                {t("community.contributorSortName", "Name")}
              </option>
            </select>
          </label>
        </div>

        {threadsQuery.isLoading ? (
          <CenteredLoader py="lg" label={t("common.loading")} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={t("community.contributorsEmptyTitle", "No contributors yet")}
            description={t(
              "community.contributorsEmptyDescription",
              "Start a thread to be the first contributor.",
            )}
          />
        ) : (
          <DataTable<Contributor>
            columns={columns}
            rows={rows}
            getRowKey={(c) => c.id}
          />
        )}
      </section>
    </CommunityDiscoveryLayout>
  );
}
