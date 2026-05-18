import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { GitHubBadge } from "@/shared/components/GitHubBadge";
import { TabList, TabLink } from "@/shared/components/ui/Tabs";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getVisibleCommunityTabs } from "./communityTabs";

function isTabActive(path: string, pathname: string, to: string): boolean {
  if (pathname === to) return true;
  if (path === "community/explore" && (pathname.endsWith("/community") || pathname.includes("/community/explore"))) return true;
  if (path === "community/external-content" && pathname.includes("/community/external-content")) return true;
  if (path === "community/discuss" && (pathname.includes("/community/discuss") || pathname.includes("/community/forum"))) return true;
  if (path === "community/contribute" && pathname.includes("/community/contribute")) return true;
  if (path === "community/leaderboard" && pathname.includes("/community/leaderboard")) return true;
  return false;
}

export function CommunityLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const flags = useFeatureFlags();
  const visibleTabs = getVisibleCommunityTabs(flags);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    const first = visibleTabs[0].path;
    const goFirst = () => navigate(langPath(first), { replace: true });
    const { tabs } = flags.community;

    if (pathname.includes("/community/leaderboard") && !tabs.leaderboard) {
      goFirst();
      return;
    }
    if (
      (pathname.includes("/community/discuss") || pathname.includes("/community/forum")) &&
      !tabs.discuss
    ) {
      goFirst();
      return;
    }
    if (pathname.includes("/community/contribute") && !tabs.contribute) {
      goFirst();
      return;
    }
    if (pathname.includes("/community/external-content") && !tabs.externalContent) {
      goFirst();
      return;
    }
    if (
      (pathname.endsWith("/community") || pathname.includes("/community/explore")) &&
      !tabs.explore
    ) {
      goFirst();
    }
  }, [pathname, flags.community.tabs, visibleTabs, navigate, langPath]);

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

      {visibleTabs.length > 1 && (
      <TabList aria-label={t("community.tabsLabel")}>
        {visibleTabs.map(({ path, key, flag }) => {
          const to = langPath(path);
          // Leaderboard is wired but the backend isn't built; the
          // page is a "Coming soon" splash. Surface that on the tab
          // so users don't click in expecting a real ranking.
          const showSoonBadge = flag === "leaderboard";
          return (
            <TabLink key={path} to={to} isActive={isTabActive(path, pathname, to)}>
              <span className="inline-flex items-center gap-1.5">
                {t(key)}
                {showSoonBadge ? (
                  <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    {t("nav.leaderboardSoonBadge", "Soon")}
                  </span>
                ) : null}
              </span>
            </TabLink>
          );
        })}
      </TabList>
      )}

      <Outlet />
    </div>
  );
}
