/**
 * AdminUsersListPage — paginated table at /admin/users.
 *
 * Columns: username, display name, tier (placeholder), xp, last active,
 * joined, community_status. Each row links to /admin/users/:id.
 *
 * - Search box (top-right of the layout) filters by username substring.
 *   Debounced 250ms server-side via /admin/users?search=…
 * - Sort: joined desc (default), last active, xp.
 * - Pagination: 25/page, prev/next; uses TanStack Query placeholder data
 *   for snappy page changes.
 *
 * Cursor-based pagination is used (backend returns nextCursor) so the
 * pager keeps a stack of cursors to support a Prev button.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type { ListUsersResponse, UserListItem } from "@/shared/api/admin";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { cn } from "@/shared/components/ui/cn";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { useDateFormat } from "@/shared/utils/formatDate";

import { useAdminSearch } from "./AdminLayout";

type SortKey = "created_at" | "last_active_date" | "xp";

const PAGE_SIZE = 25;

export function AdminUsersListPage() {
  const { t } = useTranslation();
  const { admin } = useApi();
  const { query } = useAdminSearch();
  const { formatDate } = useDateFormat();

  // Debounce the search box so we don't fire a query on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState("");
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

  const [sort, setSort] = useState<SortKey>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Pagination — keep a stack of cursors. The first page has cursor=null;
  // each subsequent page pushes the previous response's nextCursor onto
  // the stack so Prev can walk back without an extra round-trip.
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const currentCursor = cursorStack[cursorStack.length - 1] ?? null;
  const pageIndex = cursorStack.length - 1;

  // Reset pagination whenever filters/sort change.
  useEffect(() => {
    setCursorStack([null]);
  }, [debouncedQuery, sort, order]);

  const result = useQuery<ListUsersResponse>({
    queryKey: [
      "admin",
      "users",
      "list",
      { search: debouncedQuery, sort, order, cursor: currentCursor },
    ],
    queryFn: () =>
      admin.listUsers({
        limit: PAGE_SIZE,
        cursor: currentCursor ?? undefined,
        search: debouncedQuery || undefined,
        sort,
        order,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const rows = result.data?.items ?? [];
  const nextCursor = result.data?.nextCursor ?? null;
  const isFetching = result.isFetching;

  const handleNext = () => {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, nextCursor]);
  };

  const handlePrev = () => {
    if (cursorStack.length <= 1) return;
    setCursorStack((s) => s.slice(0, -1));
  };

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase text-text-muted">
            {t("admin.usersList.sort", "Sort by")}
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={cn("py-1 text-sm", inputClassName)}
            aria-label={t("admin.usersList.sort", "Sort by")}
          >
            <option value="created_at">{t("admin.usersList.sortJoined", "Joined")}</option>
            <option value="last_active_date">
              {t("admin.usersList.sortLastActive", "Last active")}
            </option>
            <option value="xp">{t("admin.usersList.sortXp", "XP")}</option>
          </select>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
            className={cn("py-1 text-sm", inputClassName)}
            aria-label={t("admin.usersList.order", "Order")}
          >
            <option value="desc">{t("admin.usersList.desc", "Descending")}</option>
            <option value="asc">{t("admin.usersList.asc", "Ascending")}</option>
          </select>
          {debouncedQuery ? (
            <span className="text-xs text-text-muted">
              {t("admin.usersList.searchingFor", "Searching for")} “{debouncedQuery}”
            </span>
          ) : null}
          <span
            aria-live="polite"
            className={cn(
              "ml-auto text-xs",
              isFetching ? "text-text-muted" : "text-transparent",
            )}
          >
            {t("common.loading", "Loading")}…
          </span>
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-text-muted">
            <tr>
              <th className="px-3 py-2">{t("admin.username", "Username")}</th>
              <th className="px-3 py-2">{t("admin.displayName", "Display name")}</th>
              <th className="px-3 py-2">{t("admin.usersList.tier", "Tier")}</th>
              <th className="px-3 py-2 text-right">{t("admin.usersList.xp", "XP")}</th>
              <th className="px-3 py-2">{t("admin.usersList.lastActive", "Last active")}</th>
              <th className="px-3 py-2">{t("admin.usersList.joined", "Joined")}</th>
              <th className="px-3 py-2">{t("admin.usersList.community", "Community")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((u) => (
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
            {!isFetching && rows.length === 0 && (
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
      </div>

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
