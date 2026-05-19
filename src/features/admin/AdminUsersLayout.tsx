import { Outlet } from "react-router-dom";
import { AdminUserSidebar } from "./AdminUserSidebar";

/**
 * Layout for admin user management: sidebar (user list + search) + main content.
 */
export function AdminUsersLayout() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <AdminUserSidebar />
      <section className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </section>
    </div>
  );
}
