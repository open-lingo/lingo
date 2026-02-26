import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { GitHubBadge } from "@/shared/components/GitHubBadge";
import { TabList, TabLink } from "@/shared/components/ui/Tabs";

const TAB_KEYS = [
  { path: "community/explore", key: "community.explore" },
  { path: "community/external-content", key: "community.externalContent" },
  { path: "community/discuss", key: "community.discuss" },
  { path: "community/contribute", key: "community.contribute" },
  { path: "community/leaderboard", key: "community.leaderboard" },
] as const;

function isTabActive(path: string, pathname: string, to: string): boolean {
  if (pathname === to) return true;
  if (path === "community/explore" && (pathname.endsWith("/community") || pathname.includes("/community/explore"))) return true;
  if (path === "community/external-content" && pathname.includes("/community/external-content")) return true;
  if (path === "community/discuss" && (pathname.includes("/community/discuss") || pathname.includes("/community/forum"))) return true;
  if (path === "community/contribute" && pathname.includes("/community/contribute")) return true;
  return false;
}

export function CommunityLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const langPath = useLangPath();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("community.title")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t("community.learnTogether")}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-muted bg-accent-muted/50 px-4 py-2 text-sm text-accent">
          <span>{t("community.banner")}</span>
          <GitHubBadge />
        </div>
      </div>

      <TabList aria-label={t("community.tabsLabel")}>
        {TAB_KEYS.map(({ path, key }) => {
          const to = langPath(path);
          return (
            <TabLink key={path} to={to} isActive={isTabActive(path, pathname, to)}>
              {t(key)}
            </TabLink>
          );
        })}
      </TabList>

      <Outlet />
    </div>
  );
}
