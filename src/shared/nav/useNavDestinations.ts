import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import {
  isCommunityEnabled,
  isLeaderboardEnabled,
  isSocialEnabled,
} from "@/shared/config/featureFlags";
import type { IconName } from "@/shared/iconRegistry";
import {
  prefetchCommunity,
  prefetchLearn,
  prefetchPractice,
  prefetchSocial,
} from "@/shared/utils/routePrefetch";

export type NavDestination = {
  key: string;
  to: string;
  label: string;
  icon: IconName;
  active: boolean;
  /** Optional badge text (e.g. "Soon"). */
  badge?: string;
  prefetch?: () => void;
};

/**
 * Single source of truth for the primary app destinations, shared by the
 * top-bar nav and the sidebar rail so the two layouts never drift. Active
 * state + lang-prefixing + feature gating live here, once.
 */
export function useNavDestinations(): NavDestination[] {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const langPath = useLangPath();
  const flags = useFeatureFlags();
  const leaderboardOn = isLeaderboardEnabled(flags);
  const socialOn = isSocialEnabled(flags);
  const communityOn = isCommunityEnabled(flags);

  const dests: NavDestination[] = [
    {
      key: "home",
      to: "/home",
      label: t("nav.home"),
      icon: "layoutDashboard",
      active: pathname === "/home",
    },
    {
      key: "learn",
      to: langPath("learn"),
      label: t("nav.learn"),
      icon: "graduationCap",
      active: /^\/[^/]+\/learn/.test(pathname),
      prefetch: prefetchLearn,
    },
    {
      key: "practice",
      to: langPath("practice"),
      label: t("nav.practice"),
      icon: "dumbbell",
      active: /^\/[^/]+\/practice/.test(pathname),
      prefetch: prefetchPractice,
    },
    ...(socialOn
      ? [
          {
            key: "social",
            to: langPath("social"),
            label: t("nav.social", "Social"),
            icon: "users" as IconName,
            active: /^\/[^/]+\/social/.test(pathname),
            prefetch: prefetchSocial,
          },
        ]
      : []),
    ...(communityOn
      ? [
          {
            key: "community",
            to: langPath("community"),
            label: t("nav.community"),
            icon: "globe" as IconName,
            active: /\/community/.test(pathname) && !/\/leaderboard/.test(pathname),
            prefetch: prefetchCommunity,
          },
        ]
      : []),
  ];

  if (leaderboardOn) {
    dests.push({
      key: "leaderboard",
      to: langPath("community/leaderboard"),
      label: t("nav.leaderboard"),
      icon: "trophy",
      active: /\/leaderboard/.test(pathname),
      badge: t("nav.leaderboardSoonBadge", "Soon"),
    });
  }

  return dests;
}
