/**
 * AdminUsersListPage — paginated table at /admin/users.
 *
 * Columns: username, display name, tier (placeholder), xp, last active,
 * joined, community_status. Each row links to /admin/users/:id.
 *
 * - Search box sits directly above the table; debounced 250ms then sent
 *   to /admin/users?search=… (server-side substring scan). Pre-fill via
 *   the ``?q=…`` query param so /admin/home can deep-link with a value.
 * - Pagination: 20/page, cursor-based prev/next. We don't show a total
 *   or a page count — this is the "Dynamo retrieve-pages" UX: you walk
 *   the stream one chunk at a time. A cursor stack lets Prev walk back
 *   without an extra server round-trip.
 * - Sort: click a column header to cycle asc → desc → unsorted. Sort
 *   applies CLIENT-SIDE to the currently-loaded rows only (the visible
 *   page of 20). Sort state never triggers a refetch; changing search
 *   does — and that resets the cursor stack.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type { ListUsersResponse, UserListItem } from "@/shared/api/admin";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/components/ui/cn";
import { Icon } from "@/shared/components/Icon";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { ResponsiveTable } from "@/shared/components/ui/ResponsiveTable";
import { useDateFormat } from "@/shared/utils/formatDate";

const PAGE_SIZE = 20;

type SortKey = "username" | "display_name" | "xp" | "last_active_date" | "created_at";
type SortDirection = "asc" | "desc";

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export function AdminUsersListPage() {
  const { t } = useTranslation();
  const { admin } = useApi();
  const { formatDate } = useDateFormat();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input — seed from ?q= so /admin/home's quick-search deep links.
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Keep the ?q= URL param in sync so the search survives reloads /
  // back-button navigation from a user detail.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedQuery) {
      next.set("q", debouncedQuery);
    } else {
      next.delete("q");
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Client-side sort over the currently-loaded page (the "Dynamo retrieve
  // pages" vibe — sort what's on screen, don't reorder the server stream).
  // ``null`` means "use server order" (joined desc by default).
  const [sort, setSort] = useState<SortState | null>(null);

  // Cursor stack for prev/next paging.
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const currentCursor = cursorStack[cursorStack.length - 1] ?? null;
  const pageIndex = cursorStack.length - 1;

  // Changing the search filter resets pagination; sort is local so it
  // doesn't reset the cursor.
  useEffect(() => {
    setCursorStack([null]);
  }, [debouncedQuery]);

  const result = useQuery<ListUsersResponse>({
    queryKey: [
      "admin",
      "users",
      "list",
      { search: debouncedQuery, cursor: currentCursor, limit: PAGE_SIZE },
    ],
    queryFn: () =>
      admin.listUsers({
        limit: PAGE_SIZE,
        cursor: currentCursor ?? undefined,
        search: debouncedQuery || undefined,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const rows = result.data?.items ?? [];
  const nextCursor = result.data?.nextCursor ?? null;
  const isFetching = result.isFetching;

  // Sort the loaded rows in-memory. We keep a stable copy so React's
  // diffing has the same identity when sort is null.
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => compareUsers(a, b, sort.key) * dir);
  }, [rows, sort]);

  const handleNext = () => {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, nextCursor]);
  };

  const handlePrev = () => {
    if (cursorStack.length <= 1) return;
    setCursorStack((s) => s.slice(0, -1));
  };

  const handleSort = (key: SortKey) => {
    setSort((curr) => {
      if (!curr || curr.key !== key) return { key, direction: "asc" };
      if (curr.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-text-primary">
          {t("admin.nav.users", "Users")}
        </h1>
        <div className="flex items-center gap-3">
          <span
            aria-live="polite"
            className={cn(
              "text-xs",
              isFetching ? "text-text-muted" : "text-transparent",
            )}
          >
            {t("common.loading", "Loading")}…
          </span>
          <div className="relative w-full sm:w-72">
            <Icon
              name="search"
              size={14}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.searchUsers", "Search users…")}
              aria-label={t("admin.searchUsers", "Search users…")}
              className={cn(inputClassName, "pl-8")}
            />
          </div>
        </div>
      </div>

      <ResponsiveTable className="rounded-card border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-text-muted">
            <tr>
              <SortableTh
                label={t("admin.username", "Username")}
                sortKey="username"
                sort={sort}
                onSort={handleSort}
              />
              <SortableTh
                label={t("admin.displayName", "Display name")}
                sortKey="display_name"
                sort={sort}
                onSort={handleSort}
              />
              <th className="px-3 py-2">{t("admin.usersList.tier", "Tier")}</th>
              <SortableTh
                label={t("admin.usersList.xp", "XP")}
                sortKey="xp"
                sort={sort}
                onSort={handleSort}
                align="right"
              />
              <SortableTh
                label={t("admin.usersList.lastActive", "Last active")}
                sortKey="last_active_date"
                sort={sort}
                onSort={handleSort}
              />
              <SortableTh
                label={t("admin.usersList.joined", "Joined")}
                sortKey="created_at"
                sort={sort}
                onSort={handleSort}
              />
              <th className="px-3 py-2">{t("admin.usersList.community", "Community")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRows.map((u) => (
              <tr key={u.id} className="hover:bg-surface-muted">
                <td className="px-3 py-2">
                  <Link
                    to={`/admin/users/${u.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    @{u.username}
                  </Link>
                </td>
                <td className="px-3 py-2 text-text-secondary">{u.display_name}</td>
                <td className="px-3 py-2">
                  <Badge size="sm" variant="neutral">{tierFor(u)}</Badge>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-text-secondary">
                  {(u.xp ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-text-secondary">
                  {u.last_active_date
                    ? formatDate(u.last_active_date, { dateStyle: "short" })
                    : "—"}
                </td>
                <td className="px-3 py-2 text-text-secondary">
                  {formatDate(u.created_at, { dateStyle: "short" })}
                </td>
                <td className="px-3 py-2">
                  <CommunityStatusBadge user={u} />
                </td>
              </tr>
            ))}
            {!isFetching && sortedRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-text-muted">
                  {debouncedQuery
                    ? t("admin.usersList.noMatches", "No users match that search.")
                    : t("admin.noUsers", "No users found.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ResponsiveTable>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-text-muted">
          {t("admin.usersList.pageX", "Page {{n}}", { n: pageIndex + 1 })}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pageIndex === 0 || isFetching}
            onClick={handlePrev}
          >
            {t("common.previous", "Previous")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!nextCursor || isFetching}
            onClick={handleNext}
          >
            {t("common.next", "Next")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── SortableTh ────────────────────────────────────────────────────────────────

interface SortableThProps {
  label: string;
  sortKey: SortKey;
  sort: SortState | null;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}

function SortableTh({ label, sortKey, sort, onSort, align = "left" }: SortableThProps) {
  const active = sort?.key === sortKey;
  const direction = active ? sort.direction : null;
  return (
    <th className={cn("px-3 py-2", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-text-primary",
          active && "text-text-primary",
          align === "right" && "flex-row-reverse",
        )}
        aria-label={`Sort by ${label}`}
        aria-sort={
          direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"
        }
      >
        <span>{label}</span>
        {direction === "asc" ? (
          <Icon name="chevronUp" size={12} aria-hidden />
        ) : direction === "desc" ? (
          <Icon name="chevronDown" size={12} aria-hidden />
        ) : null}
      </button>
    </th>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function compareUsers(a: UserListItem, b: UserListItem, key: SortKey): number {
  switch (key) {
    case "username":
      return a.username.localeCompare(b.username);
    case "display_name":
      return (a.display_name ?? "").localeCompare(b.display_name ?? "");
    case "xp":
      return (a.xp ?? 0) - (b.xp ?? 0);
    case "last_active_date":
      // Empty/null sorts to the end of asc order.
      return compareNullableIso(a.last_active_date, b.last_active_date);
    case "created_at":
      return compareNullableIso(a.created_at, b.created_at);
  }
}

function compareNullableIso(a: string | null | undefined, b: string | null | undefined): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

function CommunityStatusBadge({ user }: { user: UserListItem }) {
  if (user.status === "banned") {
    return <Badge size="sm" variant="error">banned</Badge>;
  }
  if (user.community_status === "banned") {
    return <Badge size="sm" variant="warning">community-banned</Badge>;
  }
  return <Badge size="sm" variant="success">active</Badge>;
}

// Tier is a placeholder until the subscription source is wired through
// to the user row. Once subscriptions surface the tier on the user
// payload, replace this with a real lookup.
function tierFor(user: UserListItem): string {
  const role = user.role ?? "user";
  if (role === "trusted_creator") return "creator";
  if (role === "moderator" || role === "admin" || role === "super_admin") return role;
  return "free";
}

export default AdminUsersListPage;
