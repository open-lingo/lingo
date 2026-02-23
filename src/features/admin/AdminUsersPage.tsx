import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import type { UserListItem } from "@/shared/api/admin";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { admin } = useApi();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await admin.listUsers({ limit: 30, cursor });
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("admin.usersTitle")}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("admin.usersDesc")}
        </p>
      </div>

      {users.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white py-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {t("admin.noUsers")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("admin.username")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("admin.displayName")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("admin.status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("admin.createdAt")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    @{u.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {u.display_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {u.status}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link
                      to={`/admin/users/${u.id}`}
                      className="font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {nextCursor && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <button
                type="button"
                onClick={() => load(nextCursor)}
                disabled={loadingMore}
                className="text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
              >
                {loadingMore ? t("common.loading") : t("admin.loadMore")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
