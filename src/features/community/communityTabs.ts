import type { FeatureFlags } from "@/shared/config/featureFlags";

export type CommunityTabId = keyof FeatureFlags["community"]["tabs"];

export const COMMUNITY_TAB_CONFIG = [
  { path: "community/explore", key: "community.explore", flag: "explore" as const },
  {
    path: "community/external-content",
    key: "community.externalContent",
    flag: "externalContent" as const,
  },
  { path: "community/discuss", key: "community.discuss", flag: "discuss" as const },
  {
    path: "community/contribute",
    key: "community.contribute",
    flag: "contribute" as const,
  },
  {
    path: "community/leaderboard",
    key: "community.leaderboard",
    flag: "leaderboard" as const,
  },
] as const;

export function getVisibleCommunityTabs(flags: FeatureFlags) {
  return COMMUNITY_TAB_CONFIG.filter((t) => flags.community.tabs[t.flag]);
}
