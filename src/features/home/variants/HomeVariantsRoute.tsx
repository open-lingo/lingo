/**
 * Home redesign preview route (`/home-1`).
 *
 * Gates auth once, resolves live data via `useHomeVariantData`, and renders the
 * in-progress Home redesign. Throwaway harness — delete the `variants/` folder
 * and the `home-1` route once this design is promoted to the real `/home`.
 */
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { ApiError } from "@/shared/api/client";
import { useHomeVariantData } from "./useHomeVariantData";
import { HomeVariant1 } from "./HomeVariant1";

function friendlyFirstName(raw: string | undefined): string {
  const name = raw?.trim() || "there";
  if (name.includes("@")) return "there";
  return name.split(/\s+/)[0] || "there";
}

export default function HomeVariantsRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { users } = useApi();

  const userIdKey = user?.sub ?? "anon";
  const { data: me } = useQuery({
    queryKey: ["users", userIdKey, "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 2;
    },
    staleTime: 5 * 60_000,
  });

  const data = useHomeVariantData();

  if (isLoading) {
    return <div className="flex justify-center py-16 text-text-muted">Loading…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/landing" replace />;

  const name = friendlyFirstName(me?.display_name ?? user?.name ?? user?.given_name);
  return <HomeVariant1 data={{ ...data, name }} />;
}
