import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api/provider";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { DeckResponse } from "@/shared/api/decks";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import { useCommunityContent } from "./CommunityContentContext";
import type { CommunityAddon } from "./types";

// Status taxonomy: backend currently emits `draft` and `published` only.
// `pending` / `approved` are reserved for future moderation states — UI is
// future-proofed (handler covers them) but the chip strip only surfaces the
// states actually present in user data.
type StatusKey = "draft" | "pending" | "approved" | "published" | "other";

function normalizeStatus(s: string | undefined): StatusKey {
  const v = (s ?? "").toLowerCase();
  if (v === "draft") return "draft";
  if (v === "pending" || v === "pending_review" || v === "in_review")
    return "pending";
  if (v === "approved") return "approved";
  if (v === "published") return "published";
  return "other";
}

type TFn = (key: string, options?: string | { defaultValue?: string; count?: number }) => string;

function statusLabel(t: TFn, s: StatusKey): string {
  switch (s) {
    case "draft":
      return t("community.myDecksStatusDraft", "Draft");
    case "pending":
      return t("community.myDecksStatusPending", "Pending review");
    case "approved":
      return t("community.myDecksStatusApproved", "Approved");
    case "published":
      return t("community.myDecksStatusPublished", "Published");
    default:
      return s;
  }
}

function statusPillClass(s: StatusKey): string {
  switch (s) {
    case "draft":
      return "bg-surface-muted text-text-secondary";
    case "pending":
      return "bg-warning/10 text-warning";
    case "approved":
    case "published":
      return "bg-success/10 text-success";
    default:
      return "bg-surface-muted text-text-secondary";
  }
}

/** Lightweight relative-time formatter. Returns "x min/hour/day/etc ago". */
function relativeTime(iso: string | undefined, t: TFn): string {
  if (!iso) return t("community.myDecksUpdatedUnknown", "—");
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then) || then <= 0)
    return t("community.myDecksUpdatedUnknown", "—");
  const diffSec = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return t("community.relTimeJustNow", "just now");
  const mins = Math.floor(diffSec / 60);
  if (mins < 60)
    return t("community.relTimeMinAgo", { defaultValue: "{{count}}m ago", count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return t("community.relTimeHourAgo", { defaultValue: "{{count}}h ago", count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30)
    return t("community.relTimeDayAgo", { defaultValue: "{{count}}d ago", count: days });
  const months = Math.floor(days / 30);
  if (months < 12)
    return t("community.relTimeMonthAgo", { defaultValue: "{{count}}mo ago", count: months });
  const years = Math.floor(months / 12);
  return t("community.relTimeYearAgo", { defaultValue: "{{count}}y ago", count: years });
}

function deckResponseToFlashcardDeck(d: DeckResponse): FlashcardDeck {
  return {
    id: d.id,
    languageId: d.languageId,
    name: d.name,
    cards: d.cards ?? [],
    image: d.image,
    locale: d.locale,
  };
}

function deckToAddon(d: DeckResponse): CommunityAddon {
  return {
    id: d.id,
    kind: "flashcard-pack",
    languageId: d.languageId,
    name: d.name,
    description: d.description ?? "",
    maintainerIds: [],
    upvoteCount: 0,
    updatedAt: d.updatedAt ?? d.createdAt ?? "",
    itemCount: d.cardCount,
    image: d.image,
  };
}

type SortKey = "name" | "status" | "cards" | "updated";
type SortDir = "asc" | "desc";

/** Body of the "My decks" library tab — rendered inside CommunityLibraryLayout. */
export function MyDecksBody() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { decks: decksApi } = useApi();
  const { openDeckPreview } = useCommunityContent();

  const [myDecks, setMyDecks] = useState<DeckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [languageFilter, setLanguageFilter] = useState<string | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    decksApi
      .listMyDecks({ exclude_companion_decks: true })
      .then((decks) => setMyDecks(decks))
      .catch(() => setMyDecks([]))
      .finally(() => setLoading(false));
  }, [decksApi]);

  // Statuses + languages actually present (so chip strips only show real data)
  const presentStatuses = useMemo(() => {
    const set = new Set<StatusKey>();
    for (const d of myDecks) set.add(normalizeStatus(d.status));
    return set;
  }, [myDecks]);

  const presentLanguages = useMemo(() => {
    const set = new Set<string>();
    for (const d of myDecks) set.add(d.languageId);
    return Array.from(set).sort();
  }, [myDecks]);

  const filteredDecks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myDecks.filter((d) => {
      if (languageFilter !== "all" && d.languageId !== languageFilter)
        return false;
      if (statusFilter !== "all" && normalizeStatus(d.status) !== statusFilter)
        return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [myDecks, search, languageFilter, statusFilter]);

  const sortedDecks = useMemo(() => {
    const arr = [...filteredDecks];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "status":
          cmp = normalizeStatus(a.status).localeCompare(normalizeStatus(b.status));
          break;
        case "cards":
          cmp = (a.cardCount ?? 0) - (b.cardCount ?? 0);
          break;
        case "updated": {
          const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
          const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
          cmp = ta - tb;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredDecks, sortKey, sortDir]);

  // Authoring stats — all real
  const stats = useMemo(() => {
    const decksCount = myDecks.length;
    const cardsTotal = myDecks.reduce(
      (n, d) => n + (d.cardCount ?? 0),
      0,
    );
    const approvedCount = myDecks.filter((d) => {
      const s = normalizeStatus(d.status);
      return s === "approved" || s === "published";
    }).length;
    const hasDraft = myDecks.some((d) => normalizeStatus(d.status) === "draft");
    return { decksCount, cardsTotal, approvedCount, hasDraft };
  }, [myDecks]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir(key === "name" || key === "status" ? "asc" : "desc");
      return key;
    });
  }, []);

  return (
    <section className="min-w-0 space-y-4">
        {/* Authoring stats strip */}
        <dl className="flex flex-wrap gap-3">
          <StatPill label={t("community.myDecksStatDecks", "Decks")} value={stats.decksCount} />
          <StatPill label={t("community.myDecksStatCards", "Cards total")} value={stats.cardsTotal} />
          <StatPill label={t("community.myDecksStatApproved", "Approved")} value={stats.approvedCount} />
        </dl>

        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("community.myDecksHeader", "Your decks")}
          </h2>
          <span className="text-sm text-text-muted">
            {t("community.myDecksCount", "{{count}} decks").replace(
              "{{count}}",
              String(sortedDecks.length),
            )}
          </span>
        </div>

        {/* Filter chip strip */}
        <div className="space-y-2">
          {/* Status segmented */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("community.myDecksFilterStatus", "Status")}
            </span>
            <SegChip
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              label={t("community.myDecksFilterAll", "All")}
            />
            {(["draft", "pending", "approved", "published"] as const)
              .filter((s) => presentStatuses.has(s))
              .map((s) => (
                <SegChip
                  key={s}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                  label={statusLabel(t as TFn, s)}
                />
              ))}
          </div>

          {/* Language pills */}
          {presentLanguages.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("community.myDecksFilterLanguage", "Language")}
              </span>
              <SegChip
                active={languageFilter === "all"}
                onClick={() => setLanguageFilter("all")}
                label={t("community.myDecksFilterAll", "All")}
              />
              {presentLanguages.map((lId) => {
                const cfg = getLanguageConfig(lId);
                return (
                  <SegChip
                    key={lId}
                    active={languageFilter === lId}
                    onClick={() => setLanguageFilter(lId)}
                    label={`${cfg?.flag ?? "🌐"} ${cfg?.name ?? lId}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "community.myDecksSearchPlaceholder",
              "Search your decks…",
            )}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* List */}
        {loading ? (
          <p className="text-sm text-text-muted">{t("common.loading")}</p>
        ) : sortedDecks.length === 0 ? (
          myDecks.length === 0 ? (
            <EmptyState
              icon={<Icon name="bookOpen" size={20} />}
              title={t("community.myDecksEmptyTitle", "No decks yet")}
              description={t(
                "community.myDecksEmptyDescription",
                "Create your first deck to start sharing with the community — or just to study yourself.",
              )}
              action={
                <Link
                  to={langPath("community/decks/new")}
                  className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  {t("community.myDecksEmptyAction", "+ Create your first deck")}
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={<Icon name="bookOpen" size={20} />}
              title={t("community.contentBrowserNoResults")}
            />
          )
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {/* Column header row */}
            <div className="flex items-center gap-3 border-b border-border bg-surface-muted px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              <span className="w-10 shrink-0" aria-hidden />
              <ColumnHeader
                className="min-w-0 flex-1"
                label={t("community.myDecksColName", "Name")}
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => toggleSort("name")}
              />
              <ColumnHeader
                className="hidden w-32 sm:block"
                label={t("community.myDecksColStatus", "Status")}
                active={sortKey === "status"}
                dir={sortDir}
                onClick={() => toggleSort("status")}
              />
              <ColumnHeader
                className="hidden w-20 text-right md:block"
                label={t("community.myDecksColCards", "Cards")}
                active={sortKey === "cards"}
                dir={sortDir}
                onClick={() => toggleSort("cards")}
              />
              <ColumnHeader
                className="hidden w-24 text-right md:block"
                label={t("community.myDecksColUpdated", "Updated")}
                active={sortKey === "updated"}
                dir={sortDir}
                onClick={() => toggleSort("updated")}
              />
              <span className="w-24 shrink-0 text-right" aria-hidden>
                {t("community.myDecksColActions", "Actions")}
              </span>
            </div>

            <ul>
              {sortedDecks.map((deck) => {
                const status = normalizeStatus(deck.status);
                const cfg = getLanguageConfig(deck.languageId);
                const editTo = langPath(`community/decks/${deck.id}`);
                return (
                  <li key={deck.id} className="group relative">
                    <Link
                      to={editTo}
                      className="flex items-center gap-3 border-b border-border px-3 py-3 transition last:border-b-0 hover:bg-surface-muted"
                    >
                      {/* Thumbnail */}
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent-muted text-sm font-semibold text-accent">
                        {deck.image ? (
                          <img
                            src={deck.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          deck.name.slice(0, 1).toUpperCase() || "?"
                        )}
                      </span>

                      {/* Name + language */}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text-primary">
                          {deck.name}
                        </span>
                        <span className="block text-xs text-text-muted">
                          <span className="mr-1">{cfg?.flag ?? "🌐"}</span>
                          {cfg?.name ?? deck.languageId}
                        </span>
                      </span>

                      {/* Status pill */}
                      <span className="hidden w-32 sm:block">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusPillClass(status)}`}
                        >
                          {statusLabel(t as TFn, status)}
                        </span>
                      </span>

                      {/* Cards */}
                      <span className="hidden w-20 text-right text-xs text-text-muted md:block">
                        {t("community.myDecksCardsLabel", "{{n}} cards").replace(
                          "{{n}}",
                          String(deck.cardCount ?? 0),
                        )}
                      </span>

                      {/* Updated */}
                      <span className="hidden w-24 text-right text-xs text-text-muted md:block">
                        {relativeTime(deck.updatedAt ?? deck.createdAt, t as TFn)}
                      </span>

                      {/* Actions */}
                      <span
                        className="flex w-24 shrink-0 items-center justify-end gap-1"
                        onClick={(e) => e.preventDefault()}
                      >
                        <IconAction
                          to={editTo}
                          ariaLabel={t("community.myDecksActionEdit", "Edit")}
                          icon="pencil"
                        />
                        <button
                          type="button"
                          aria-label={t("community.myDecksActionPreview", "Preview")}
                          className="rounded-md p-1.5 text-text-muted transition hover:bg-surface hover:text-text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Fetch full deck (cards) for preview — listMyDecks
                            // returns lightweight manifests in some envs.
                            decksApi
                              .getDeck(deck.id)
                              .then((full) =>
                                openDeckPreview(
                                  deckResponseToFlashcardDeck(full),
                                  deckToAddon(full),
                                ),
                              )
                              .catch(() =>
                                openDeckPreview(
                                  deckResponseToFlashcardDeck(deck),
                                  deckToAddon(deck),
                                ),
                              );
                          }}
                        >
                          <Icon name="eye" size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={t("community.myDecksActionMore", "More")}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === deck.id}
                          className="rounded-md p-1.5 text-text-muted transition hover:bg-surface hover:text-text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId((prev) =>
                              prev === deck.id ? null : deck.id,
                            );
                          }}
                        >
                          <Icon name="moreVertical" size={16} />
                        </button>
                      </span>
                    </Link>

                    {/* Overflow menu */}
                    {openMenuId === deck.id && (
                      <>
                        <button
                          type="button"
                          aria-label={t("common.close")}
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div
                          role="menu"
                          className="absolute right-3 top-full z-20 mt-1 w-48 rounded-md border border-border bg-surface py-1 shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            disabled
                            title={t(
                              "community.myDecksDeleteUnavailable",
                              "Delete API not yet wired",
                            )}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-muted opacity-50"
                          >
                            <Icon name="trash" size={14} aria-hidden />
                            {t("community.myDecksActionDelete", "Delete")}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
    </section>
  );
}

/* -------------------------------- helpers -------------------------------- */

function SegChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex min-h-8 items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-white shadow-sm"
          : "inline-flex min-h-8 items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary transition hover:border-accent hover:text-text-primary"
      }
    >
      {label}
    </button>
  );
}

function ColumnHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-left transition hover:text-text-primary ${
        active ? "text-text-primary" : ""
      } ${className ?? ""}`}
    >
      <span>{label}</span>
      {active && (
        <Icon
          name={dir === "asc" ? "chevronUp" : "chevronDown"}
          size={12}
          aria-hidden
        />
      )}
    </button>
  );
}

function IconAction({
  to,
  ariaLabel,
  icon,
}: {
  to: string;
  ariaLabel: string;
  icon: Parameters<typeof Icon>[0]["name"];
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className="rounded-md p-1.5 text-text-muted transition hover:bg-surface hover:text-text-primary"
      onClick={(e) => e.stopPropagation()}
    >
      <Icon name={icon} size={16} />
    </Link>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-text-primary">
        {value}
      </dd>
    </div>
  );
}
