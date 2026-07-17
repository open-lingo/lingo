import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Avatar } from "@/shared/components/ui/Avatar";
import { DataTable, type DataTableColumn } from "@/shared/components/data";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { formatTimeAgo } from "@/shared/utils/formatDate";
import type { AddonKind } from "../types";

export type CommunityContentRow = {
  id: string;
  kind: AddonKind;
  name: string;
  description?: string;
  authorName?: string;
  /** Resolved creator avatar URL (falls back to initials). */
  authorAvatarUrl?: string;
  /** Creator handle for the avatar fallback. */
  authorUsername?: string;
  languageId: string;
  itemCount?: number;
  upvoteCount?: number;
  downloadCount?: number;
  updatedAt?: string;
  image?: string | null;
  /** Destination of row click + primary action. */
  to: string;
  /**
   * When set, the row name renders as a button that fires this callback
   * instead of navigating to ``to``. Used to open an in-page preview
   * modal for decks/stories where ``to`` is a fallback only.
   */
  onRowClick?: () => void;
  /** True when current user is subscribed (drives action button label). */
  isSubscribed?: boolean;
  /** True when current user owns this deck (drives action button to "Edit"). */
  isOwned?: boolean;
  onAction?: () => void;
  actionLoading?: boolean;
  /** Skimmable sample entries surfaced on hover (loaded with the list). */
  previewSamples?: string[];
};

type CommunityContentTableProps = {
  rows: CommunityContentRow[];
  emptyMessage?: string;
  className?: string;
};

const KIND_LABEL: Record<AddonKind, string> = {
  "flashcard-pack": "Deck",
  course: "Course",
  story: "Story",
  grammar: "Grammar",
};

const KIND_TINT: Record<AddonKind, string> = {
  "flashcard-pack": "bg-accent-muted text-accent",
  course: "bg-warning/15 text-warning",
  story: "bg-info/15 text-info",
  grammar: "bg-surface-muted text-text-secondary",
};

export function CommunityContentTable({
  rows,
  emptyMessage,
  className,
}: CommunityContentTableProps) {
  const { t } = useTranslation();

  const columns: DataTableColumn<CommunityContentRow>[] = [
    {
      key: "name",
      label: t("community.tableName", "Name"),
      render: (row) => <NameCell row={row} />,
    },
    {
      key: "type",
      label: t("community.tableType", "Type"),
      className: "hidden sm:table-cell",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${KIND_TINT[row.kind]}`}
        >
          {KIND_LABEL[row.kind]}
        </span>
      ),
    },
    {
      key: "language",
      label: t("community.tableLanguage", "Lang"),
      className: "hidden md:table-cell",
      render: (row) => <LanguageCell langId={row.languageId} />,
    },
    {
      key: "items",
      label: t("community.tableItems", "Items"),
      className: "hidden lg:table-cell text-right",
      render: (row) =>
        typeof row.itemCount === "number" ? (
          <span className="tabular-nums text-text-secondary">{row.itemCount}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "votes",
      label: t("community.tableVotes", "Votes"),
      className: "hidden lg:table-cell text-right",
      render: (row) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-text-secondary">
          <Icon name="star" size={12} aria-hidden />
          {row.upvoteCount ?? 0}
        </span>
      ),
    },
    {
      key: "downloads",
      label: t("community.tableDownloads", "Subs"),
      className: "hidden xl:table-cell text-right",
      render: (row) => (
        <span className="tabular-nums text-text-secondary">
          {row.downloadCount ?? 0}
        </span>
      ),
    },
    {
      key: "updated",
      label: t("community.tableUpdated", "Updated"),
      className: "hidden md:table-cell",
      render: (row) => (
        <span className="text-text-muted">
          {row.updatedAt ? formatTimeAgo(row.updatedAt) : "—"}
        </span>
      ),
    },
    {
      key: "action",
      label: "",
      className: "text-right whitespace-nowrap",
      render: (row) => <ActionCell row={row} />,
    },
  ];

  return (
    <DataTable<CommunityContentRow>
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.id}
      emptyMessage={emptyMessage}
      className={className}
    />
  );
}

function NameCell({ row }: { row: CommunityContentRow }) {
  const cover = row.image
    ? row.kind === "flashcard-pack"
      ? getDeckImageUrl(row.image)
      : row.image
    : null;
  const inner = (
    <>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-muted text-text-muted"
        aria-hidden
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon name="bookOpen" size={18} />
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium text-text-primary group-hover:text-accent">
          {row.name}
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
          {row.authorName ? (
            <span className="inline-flex shrink-0 items-center gap-1">
              <Avatar
                src={row.authorAvatarUrl}
                name={row.authorName}
                size="xs"
                className="h-4 w-4 text-[8px]"
              />
              <span className="truncate">{row.authorName}</span>
            </span>
          ) : null}
          {row.authorName && row.description ? <span aria-hidden>·</span> : null}
          {row.description ? <span className="truncate">{row.description}</span> : null}
        </div>
      </div>
    </>
  );
  if (row.onRowClick) {
    return (
      <button
        type="button"
        onClick={row.onRowClick}
        className="flex min-w-0 w-full items-center gap-3 group text-left"
      >
        {inner}
      </button>
    );
  }
  return (
    <Link to={row.to} className="flex min-w-0 items-center gap-3 group">
      {inner}
    </Link>
  );
}

function LanguageCell({ langId }: { langId: string }) {
  const cfg = getLanguageConfig(langId);
  return (
    <span className="inline-flex items-center gap-1.5 text-text-secondary">
      <span aria-hidden>{cfg?.flag ?? "🌐"}</span>
      <span className="hidden xl:inline">{cfg?.name ?? langId}</span>
    </span>
  );
}

function ActionCell({ row }: { row: CommunityContentRow }) {
  if (row.isOwned) {
    return (
      <Link
        to={row.to}
        className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary"
      >
        Edit
      </Link>
    );
  }
  if (row.onAction) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          row.onAction?.();
        }}
        disabled={row.actionLoading}
        className={
          row.isSubscribed
            ? "inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted disabled:opacity-50"
            : "inline-flex items-center rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        }
      >
        {row.isSubscribed ? "Subscribed" : "Subscribe"}
      </button>
    );
  }
  return (
    <Link
      to={row.to}
      className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary"
    >
      Open
    </Link>
  );
}
