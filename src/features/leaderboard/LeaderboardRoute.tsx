import { Navigate } from "react-router-dom";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isLeaderboardEnabled } from "@/shared/config/featureFlags";
import { LeaderboardPage } from "./LeaderboardPage";

/** /:lang/community/leaderboard — gated by `community.tabs.leaderboard` in feature flags. */
export function LeaderboardRoute() {
  const flags = useFeatureFlags();
  const langPath = useLangPath();

  if (!isLeaderboardEnabled(flags)) {
    return <Navigate to={langPath("community")} replace />;
  }

  return <LeaderboardPage />;
}
