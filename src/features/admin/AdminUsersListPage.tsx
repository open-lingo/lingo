/**
 * AdminUsersListPage — paginated table at /admin/users.
 *
 * Filled in by task 5. Stub for the shell migration so the route resolves.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useApi } from "@/shared/api/provider";
import type { UserListItem } from "@/shared/api/admin";

import { useAdminSearch } from "./AdminLayout";

export function AdminUsersListPage() {
  const { t } = useTranslation();
  const { admin } = useApi();
  const { query } = useAdminSearch();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    admin
      .listUsers({ limit: 50 })
      .then((r) => setUsers(r.items))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [admin]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          (u.username ?? "").toLowerCase().includes(q) ||
          (u.display_name ?? "").toLowerCase().includes(q),
      )
    : users;

  if (loading) {
    return <p className="text-sm text-text-muted">{t("common.loading")}</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-left text-xs uppercase text-text-muted">
          <tr>
            <th className="px-3 py-2">{t("admin.username", "Username")}</th>
            <th className="px-3 py-2">{t("admin.displayName", "Display name")}</th>
            <th className="px-3 py-2">{t("admin.status", "Status")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.map((u) => (
            <tr key={u.id} className="hover:bg-surface-muted">
              <td className="px-3 py-2">
                <Link to={`/admin/users/${u.id}`} className="font-medium text-accent hover:underline">
                  @{u.username}
                </Link>
              </td>
              <td className="px-3 py-2 text-text-secondary">{u.display_name}</td>
              <td className="px-3 py-2 text-text-secondary">{u.status}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-text-muted">
                {t("admin.noUsers", "No users found.")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUsersListPage;
