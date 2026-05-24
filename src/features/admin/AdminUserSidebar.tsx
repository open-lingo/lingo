import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { Button } from "@/shared/components/ui/Button";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { cn } from "@/shared/components/ui/cn";
import type { UserListItem } from "@/shared/api/admin";

export function AdminUserSidebar() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { admin } = useApi();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await admin.listUsers({ limit: 50, cursor });
      if (cursor) {
        setUsers((prev) => [...prev, ...res.items]);
      } else {
        setUsers(res.items);
      }
      setNextCursor(res.nextCursor);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load();
  }, [admin]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase().trim();
    return users.filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.display_name && u.display_name.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q))
    );
  }, [users, search]);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border p-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.searchUsers")}
          className={inputClassName}
          aria-label={t("admin.searchUsers")}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-text-muted">
            {t("common.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-muted">
            {t("admin.noUsers")}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((u) => {
              const isActive = userId === u.id;
              const avatarUrl = u.profile_picture_key?.trim() || null;
              const initials = (u.username?.[0] ?? u.display_name?.[0] ?? "?").toUpperCase();
              return (
                <li key={u.id}>
                  <Link
                    to={`/admin/users/${u.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm transition",
                      isActive
                        ? "bg-accent-muted font-medium text-accent"
                        : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-sm font-medium text-text-secondary">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">@{u.username}</span>
                      {u.display_name && (
                        <span className="block truncate text-xs text-text-muted">
                          {u.display_name}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {nextCursor && !search && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => load(nextCursor)}
              disabled={loadingMore}
            >
              {loadingMore ? t("common.loading") : t("admin.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
