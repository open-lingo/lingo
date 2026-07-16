/**
 * adminNavConfig — single source of truth for the admin console IA.
 *
 * Both the dashboard landing (`AdminHomePage`) and the persistent inner
 * sidebar (`AdminSidebar`) render from this config, so the grouping stays
 * consistent everywhere. Groups model what the surfaces actually are
 * (people, finance/ops, content/community) rather than a flat button grid.
 *
 * `pendingKey` flags a destination whose NavCard/sidebar row should show a
 * live count badge sourced from the dashboard's pending-review query.
 */
import type { IconName } from "@/shared/iconRegistry";

export type AdminNavItem = {
  to: string;
  title: string;
  description: string;
  icon: IconName;
  /** When set, wire a live count badge (currently only "pendingReview"). */
  pendingKey?: "pendingReview";
};

export type AdminNavGroup = {
  id: string;
  label: string;
  icon: IconName;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "people",
    label: "People & learning",
    icon: "users",
    items: [
      {
        to: "/admin/users",
        title: "Users",
        description: "Browse, search, and manage user accounts.",
        icon: "users",
      },
      {
        to: "/admin/lms",
        title: "Learning config",
        description: "Platform XP rate tuning and per-student learning lookups.",
        icon: "graduationCap",
      },
    ],
  },
  {
    id: "content",
    label: "Content & community",
    icon: "library",
    items: [
      {
        to: "/admin/content/lessons",
        title: "Lessons",
        description: "Author and manage course lessons.",
        icon: "bookOpen",
      },
      {
        to: "/admin/content/decks",
        title: "Decks",
        description: "Review and manage community flashcard decks.",
        icon: "decks",
      },
      {
        to: "/admin/content/stories",
        title: "Stories",
        description: "Review and manage reader stories.",
        icon: "bookText",
      },
      {
        to: "/admin/moderation",
        title: "Moderation",
        description: "Review pending decks, stories, reports, and bans.",
        icon: "shieldCheck",
        pendingKey: "pendingReview",
      },
    ],
  },
  {
    id: "ops",
    label: "Finance & operations",
    icon: "barChart",
    items: [
      {
        to: "/admin/ops",
        title: "Operations",
        description: "Costs, revenue, subscriptions, ads, and jobs.",
        icon: "trendingUp",
      },
      {
        to: "/admin/ops/audit",
        title: "Audit log",
        description: "Trace privileged admin actions across the platform.",
        icon: "fileText",
      },
      {
        to: "/admin/events",
        title: "Events",
        description: "Inspect the real-time event stream and handler outcomes.",
        icon: "activity",
      },
      {
        to: "/admin/infra",
        title: "Infrastructure",
        description: "AWS budget usage and CloudWatch alarm state.",
        icon: "gauge",
      },
    ],
  },
];

/** Flat list of every nav destination (for active-route matching). */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(
  (g) => g.items,
);
