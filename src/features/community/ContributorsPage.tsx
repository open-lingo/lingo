import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { CommunityDecksLayout } from "./CommunityDecksLayout";
import { Avatar } from "./components/Avatar";
import { DataTable, type DataTableColumn } from "@/shared/components/data";

type Contributor = {
  handle: string;
  displayName: string;
  upvotes: number;
  decksCount: number;
  followers: number;
  joinedYear: number;
  badge?: "official" | "verified";
};

// Mock — wire to backend once a contributors aggregate exists.
const MOCK_CONTRIBUTORS: Contributor[] = [
  {
    handle: "haru",
    displayName: "Haru Tanaka",
    upvotes: 1240,
    decksCount: 18,
    followers: 312,
    joinedYear: 2024,
    badge: "official",
  },
  {
    handle: "minji",
    displayName: "Minji Park",
    upvotes: 980,
    decksCount: 14,
    followers: 245,
    joinedYear: 2024,
    badge: "verified",
  },
  {
    handle: "spencer",
    displayName: "Spencer O.",
    upvotes: 620,
    decksCount: 9,
    followers: 180,
    joinedYear: 2025,
    badge: "verified",
  },
  {
    handle: "trevor",
    displayName: "Trevor L.",
    upvotes: 410,
    decksCount: 7,
    followers: 120,
    joinedYear: 2025,
  },
  {
    handle: "yuki",
    displayName: "Yuki Sato",
    upvotes: 280,
    decksCount: 6,
    followers: 88,
    joinedYear: 2025,
  },
  {
    handle: "jihoon",
    displayName: "Jihoon Kim",
    upvotes: 210,
    decksCount: 4,
    followers: 64,
    joinedYear: 2025,
  },
  {
    handle: "marie",
    displayName: "Marie Dubois",
    upvotes: 180,
    decksCount: 3,
    followers: 52,
    joinedYear: 2025,
  },
  {
    handle: "alex",
    displayName: "Alex Chen",
    upvotes: 95,
    decksCount: 2,
    followers: 31,
    joinedYear: 2026,
  },
];

type SortKey = "upvotes" | "decks" | "followers" | "name";

export function ContributorsPage() {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("upvotes");

  const rows = useMemo(() => {
    const arr = [...MOCK_CONTRIBUTORS];
    arr.sort((a, b) => {
      if (sortKey === "upvotes") return b.upvotes - a.upvotes;
      if (sortKey === "decks") return b.decksCount - a.decksCount;
      if (sortKey === "followers") return b.followers - a.followers;
      return a.displayName.localeCompare(b.displayName);
    });
    return arr;
  }, [sortKey]);

  const columns: DataTableColumn<Contributor>[] = [
    {
      key: "name",
      label: t("community.contributorName", "Contributor"),
      render: (c) => (
        <Link
          to={`/u/${c.handle}`}
          className="group flex min-w-0 items-center gap-3"
        >
          <Avatar name={c.displayName} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-text-primary group-hover:text-accent">
                {c.displayName}
              </span>
              {c.badge && <BadgePill kind={c.badge} />}
            </div>
            <div className="truncate text-xs text-text-muted">@{c.handle}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "upvotes",
      label: t("community.contributorUpvotes", "Upvotes"),
      className: "text-right",
      render: (c) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-text-secondary">
          <Icon name="star" size={12} aria-hidden />
          {c.upvotes.toLocaleString()}
        </span>
      ),
    },
    {
      key: "decks",
      label: t("community.contributorDecks", "Decks"),
      className: "hidden sm:table-cell text-right",
      render: (c) => (
        <span className="tabular-nums text-text-secondary">{c.decksCount}</span>
      ),
    },
    {
      key: "followers",
      label: t("community.contributorFollowers", "Followers"),
      className: "hidden md:table-cell text-right",
      render: (c) => (
        <span className="tabular-nums text-text-secondary">{c.followers}</span>
      ),
    },
    {
      key: "joined",
      label: t("community.contributorJoined", "Joined"),
      className: "hidden lg:table-cell text-right",
      render: (c) => <span className="text-text-muted">{c.joinedYear}</span>,
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
    <CommunityDecksLayout>
      <div className="rounded-lg border border-accent-muted bg-accent-muted/30 px-3 py-2 text-sm text-accent">
        {t("community.contributorsBanner", {
          count: MOCK_CONTRIBUTORS.length,
          defaultValue:
            "{{count}} learners building Open Lingo. Follow, learn from them, contribute back.",
        })}
      </div>

      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">
              {MOCK_CONTRIBUTORS.length}
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
              <option value="upvotes">
                {t("community.contributorSortUpvotes", "Most upvoted")}
              </option>
              <option value="decks">
                {t("community.contributorSortDecks", "Most decks")}
              </option>
              <option value="followers">
                {t("community.contributorSortFollowers", "Most followers")}
              </option>
              <option value="name">
                {t("community.contributorSortName", "Name")}
              </option>
            </select>
          </label>
        </div>

        <DataTable<Contributor>
          columns={columns}
          rows={rows}
          getRowKey={(c) => c.handle}
        />
      </section>
    </CommunityDecksLayout>
  );
}

function BadgePill({ kind }: { kind: "official" | "verified" }) {
  const cls =
    kind === "official"
      ? "bg-accent/15 text-accent"
      : "bg-info/15 text-info";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}
    >
      <Icon name={kind === "official" ? "check" : "star"} size={10} aria-hidden />
      {kind}
    </span>
  );
}
