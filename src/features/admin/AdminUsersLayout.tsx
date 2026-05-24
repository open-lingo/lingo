import { Outlet } from "react-router-dom";
import { AdminUserSidebar } from "./AdminUserSidebar";

/**
 * Layout for admin user management: sidebar (user list + search) + main content.
 */
export function AdminUsersLayout() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <AdminUserSidebar />
      <section className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </section>
    </div>
  );
}
