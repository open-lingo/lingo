import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { TabList, TabLink } from "@/shared/components/ui/Tabs";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";
import { getVisibleCommunityTabs } from "./communityTabs";
import { CommunityComingSoon } from "./CommunityComingSoon";

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
  const communityEnabled = isCommunityEnabled(flags);
  const visibleTabs = getVisibleCommunityTabs(flags);

  useEffect(() => {
    if (!communityEnabled) return;
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
  }, [communityEnabled, pathname, flags.community.tabs, visibleTabs, navigate, langPath]);

  // Whole community surface gated off — show a graceful "coming soon" landing
  // for any /community/* URL (nav entry is hidden, so this is reached only by
  // direct navigation or a stale link).
  if (!communityEnabled) return <CommunityComingSoon />;

  // Banner + top-level tabs render only on the explore landing — every
  // other sub-page (subscribed, my decks, new, editor) gets just the
  // page's own chrome via CommunityDecksLayout. Keeps the heavy hero
  // surface on one canonical place.
  const isExploreLanding =
    pathname.endsWith("/community") || pathname.endsWith("/community/explore");

  // No page header — the user is already in Community per the nav + URL
  // (mirrors the Learn page). Content starts at the section tabs so the page
  // reads higher. The page CTA + search live in each sub-page's own layout.
  return (
    <div className="mx-auto max-w-screen-2xl space-y-4">
      {isExploreLanding && visibleTabs.length > 1 && (
        <TabList
          aria-label={t("community.tabsLabel")}
          variant="pill"
          className="gap-1 rounded-card border border-border bg-surface-muted p-1 shadow-sm"
        >
          {visibleTabs.map(({ path, key, flag }) => {
            const to = langPath(path);
            const showSoonBadge = flag === "leaderboard";
            return (
              <TabLink
                key={path}
                to={to}
                isActive={isTabActive(path, pathname, to)}
                variant="pill"
              >
                <span className="inline-flex items-center gap-1.5">
                  {t(key)}
                  {showSoonBadge ? (
                    <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
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
