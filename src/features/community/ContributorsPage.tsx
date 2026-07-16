import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  OverflowMenu,
  type OverflowMenuItem,
} from "@/shared/components/ui/OverflowMenu";
import { UserPreviewPopover } from "@/features/social/components/UserPreviewPopover";
import { AddFriendButton } from "@/features/social/components/AddFriendButton";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api/provider";
import type { CommunityThread } from "@/shared/api/community";
import { browseCreatorPath, BROWSE_CREATOR_FACET } from "./browseFacets";

type Contributor = {
  id: string;
  handle: string;
  displayName: string;
  /** Published content (decks/stories) authored. */
  contentCount: number;
  /** Total upvotes across authored content. */
  upvotes: number;
  /** Forum threads started. NOTE: "threads" is a derived/placeholder signal —
   *  there is no real forum yet, so this is bucketed from `listThreads` which
   *  may be empty in most environments. Treat as best-effort, not load-bearing. */
  threadCount: number;
  latestThreadAt: string;
};

type SortKey = "content" | "upvotes" | "threads" | "recent" | "name";

const TOP_LIMIT = 20;

export function ContributorsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const [sortKey, setSortKey] = useState<SortKey>("content");
  const [query, setQuery] = useState("");
  const { community } = useApi();
  const { resolveCreator } = useCreatorDirectory();
  // Content-authorship contributors (decks/stories) — same signal as the home
  // rail, so "See all" doesn't dead-end into an empty page when there are no
  // forum threads. Carries contentCount + upvotes per author.
  const { contributors: contentContributors } = useTopContributors(TOP_LIMIT);

  // Why: no backend contributors aggregate yet — supplement content authorship
  // with forum-thread authorship, bucketed by author_id. Pull a wide-enough
  // window (200) to make the bucket meaningful.
  //
  // ⚠️ "threads" is effectively a placeholder concept: there is no dedicated
  // community forum surface, so `listThreads` returns an empty/near-empty set
  // in most environments and this column reads 0. Kept (rather than removed)
  // because the column is cheap and lights up the moment threads ship.
  // TODO: replace both derivations with /community/contributors once the
  // aggregate ships; that endpoint can also support real server-side
  // sort-by-content / sort-by-upvotes over the FULL contributor set (the
  // client-side sort below only orders the already-windowed top-20).
  const threadsQuery = useQuery<CommunityThread[]>({
    queryKey: ["community", "threads", "recent-for-contributors"],
    queryFn: ({ signal }) =>
      community.listThreads({ sort: "new", limit: 200 }, signal),
    staleTime: 5 * 60_000,
  });

  const contributors = useMemo<Contributor[]>(() => {
    const bucket = new Map<string, Contributor>();
    // Seed from content authorship (carries resolved name/handle/upvotes).
    for (const c of contentContributors) {
      bucket.set(c.userId, {
        id: c.userId,
        handle: c.username,
        displayName: c.displayName,
        contentCount: c.contentCount,
        upvotes: c.upvotes,
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
          upvotes: 0,
          threadCount: 1,
          latestThreadAt: th.updatedAt,
        });
      }
    }
    return Array.from(bucket.values()).slice(0, TOP_LIMIT);
  }, [contentContributors, threadsQuery.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contributors;
    return contributors.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q),
    );
  }, [contributors, query]);

  const rows = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "content") return b.contentCount - a.contentCount || b.upvotes - a.upvotes;
      if (sortKey === "upvotes") return b.upvotes - a.upvotes || b.contentCount - a.contentCount;
      if (sortKey === "threads") return b.threadCount - a.threadCount;
      if (sortKey === "recent")
        return (
          new Date(b.latestThreadAt).getTime() -
          new Date(a.latestThreadAt).getTime()
        );
      return a.displayName.localeCompare(b.displayName);
    });
    return arr;
  }, [filtered, sortKey]);

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
      key: "upvotes",
      label: t("community.contributorUpvotesCol", "Upvotes"),
      className: "hidden text-right sm:table-cell",
      render: (c) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-text-secondary">
          <Icon name="chevronUp" size={12} aria-hidden />
          {c.upvotes}
        </span>
      ),
    },
    {
      key: "threads",
      label: t("community.contributorThreads", "Threads"),
      className: "hidden text-right md:table-cell",
      render: (c) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-text-secondary">
          <Icon name="fileText" size={12} aria-hidden />
          {c.threadCount}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (c) => (
        <div className="inline-flex items-center justify-end gap-1.5">
          {/* Add-friend collapses to an icon-only affordance; everything else
              lives in the overflow menu so the row stays compact and has room
              for future per-contributor actions. */}
          <AddFriendButton targetUsername={c.handle} targetUserId={c.id} iconOnly size="sm" />
          <OverflowMenu
            ariaLabel={t("community.contributorMoreAria", "More actions for {{name}}", {
              name: c.displayName,
            })}
            items={contributorMenuItems(c)}
          />
        </div>
      ),
    },
  ];

  function contributorMenuItems(c: Contributor): OverflowMenuItem[] {
    return [
      {
        key: "view",
        label: t("community.contributorView", "View profile"),
        leading: <Icon name="user" size={14} aria-hidden />,
        onSelect: () => navigate(`/u/${c.handle}`),
      },
      {
        key: "decks",
        // Quick-search this contributor → Browse pre-filtered to their content.
        label: t("community.contributorSeeDecks", "See their decks"),
        leading: <Icon name="layers" size={14} aria-hidden />,
        onSelect: () =>
          navigate(langPath(browseCreatorPath(c.id, c.displayName))),
      },
    ];
  }

  return (
    <CommunityDiscoveryLayout>
      <div className="rounded-card border border-accent-muted bg-accent-muted/30 px-3 py-2 text-sm text-accent">
        {t("community.contributorsBanner", {
          count: contributors.length,
          defaultValue:
            "{{count}} learners building Open Lingo. Follow, learn from them, contribute back.",
        })}
      </div>

      <section className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
              <Icon name="search" size={14} aria-hidden />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "community.contributorSearchPlaceholder",
                "Search contributors…",
              )}
              aria-label={t("community.contributorSearchAria", "Search contributors")}
              className="h-9 w-full rounded-md border border-border bg-surface-muted pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface focus:outline-none"
            />
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm text-text-secondary">
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
              <option value="upvotes">
                {t("community.contributorSortUpvotes", "Most upvotes")}
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

        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{rows.length}</span>{" "}
          {t("community.contributorsLabel", "contributors")}
        </p>

        {threadsQuery.isLoading ? (
          <CenteredLoader py="lg" label={t("common.loading")} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={
              query
                ? t("community.contributorsNoMatchTitle", "No contributors match")
                : t("community.contributorsEmptyTitle", "No contributors yet")
            }
            description={
              query
                ? t(
                    "community.contributorsNoMatchDescription",
                    "Try a different name or @username.",
                  )
                : t(
                    "community.contributorsEmptyDescription",
                    "Start a thread to be the first contributor.",
                  )
            }
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

// Re-export the facet key so the Browse agent and tests share one constant.
export { BROWSE_CREATOR_FACET };
