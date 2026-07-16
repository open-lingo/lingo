import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isSocialEnabled } from "@/shared/config/featureFlags";

/**
 * Route guard for the social surface. Mirrors `LeaderboardRoute` — when the
 * `social` flag is off, redirect to the home dashboard instead of rendering.
 */
export function SocialGate({ children }: { children: ReactNode }) {
  const flags = useFeatureFlags();
  if (!isSocialEnabled(flags)) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}
