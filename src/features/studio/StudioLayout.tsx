import { Outlet } from "react-router-dom";

/**
 * Dedicated layout for Studio (deck editor). No Community tabs, no banner.
 * Darker background, app-like feel.
 */
export function StudioLayout() {
  return (
    <div className="min-h-[60vh] bg-gray-200/80 dark:bg-gray-950/80 -mx-4 -my-8 px-4 py-8 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 lg:-mx-8 lg:-my-8 lg:px-8 lg:py-8">
      <Outlet />
    </div>
  );
}
