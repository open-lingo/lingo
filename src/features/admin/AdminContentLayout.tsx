import { Outlet } from "react-router-dom";

/**
 * Wrapper for admin content section (decks, stories). Renders breadcrumbs + outlet.
 * Breadcrumbs are in AdminLayout; content sub-tabs are in AdminBreadcrumbs when on content.
 */
export function AdminContentLayout() {
  return <Outlet />;
}
