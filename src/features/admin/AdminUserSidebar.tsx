import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
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
    <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-3 dark:border-gray-700">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.searchUsers")}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:placeholder-gray-400"
          aria-label={t("admin.searchUsers")}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("common.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {search ? t("admin.noUsers") : t("admin.noUsers")}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((u) => {
              const isActive = userId === u.id;
              const avatarUrl = u.profile_picture_key?.trim() || null;
              const initials = (u.username?.[0] ?? u.display_name?.[0] ?? "?").toUpperCase();
              return (
                <li key={u.id}>
                  <Link
                    to={`/admin/users/${u.id}`}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "bg-green-50 font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-600 text-sm font-medium text-gray-200 dark:bg-gray-600 dark:text-gray-300">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">@{u.username}</span>
                      {u.display_name && (
                        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
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
          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
            <button
              type="button"
              onClick={() => load(nextCursor)}
              disabled={loadingMore}
              className="w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              {loadingMore ? t("common.loading") : t("admin.loadMore")}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
