import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { useImpersonation } from "@/features/admin/impersonation/ImpersonationContext";

/**
 * Single shared TanStack Query for ``GET /users/me/settings`` (the full
 * settings JSON). Every consumer of the settings blob — SettingsContext,
 * the shop state, and the three equipped-cosmetic slots — reads from this
 * one cache entry and derives its slice via the ``select`` option, so the
 * page issues ONE settings fetch instead of up to five.
 *
 * Identity dimensions (auth ``sub`` + impersonation target) are baked into
 * the key so the admin's own settings and an impersonated user's never share
 * a slot. The impersonation toggle wipes the whole cache anyway
 * (ImpersonationProvider), so this is belt-and-suspenders.
 *
 * Mutations that touch settings MUST invalidate the unified key — the
 * predicate ``k[0] === "users" && k.includes("settings")`` matches it.
 */
export const USER_SETTINGS_STALE_MS = 5 * 60_000;

/** Raw settings blob as returned by the backend (opaque, ``extra: allow``). */
export type RawUserSettings = Record<string, unknown>;

export function userSettingsQueryKey(userId: string, actingAs: string) {
  return ["users", userId, "acting", actingAs, "settings"] as const;
}

/**
 * Shared settings query. Pass a ``select`` to project the slice you need; the
 * underlying fetch + cache entry is shared across all callers regardless of
 * the selector (TanStack runs ``select`` per-observer on the shared data).
 */
export function useUserSettings<TData = RawUserSettings>(
  options?: {
    select?: (data: RawUserSettings) => TData;
    enabled?: boolean;
  },
): ReturnType<typeof useQuery<RawUserSettings, Error, TData>> {
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();
  const impersonation = useImpersonation();

  const userId = user?.sub ?? "anon";
  const actingAs = impersonation?.targetUserId ?? "self";

  return useQuery<RawUserSettings, Error, TData>({
    queryKey: userSettingsQueryKey(userId, actingAs),
    queryFn: async () => (await users.getSettings()) as RawUserSettings,
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: USER_SETTINGS_STALE_MS,
    select: options?.select as UseQueryOptions<
      RawUserSettings,
      Error,
      TData
    >["select"],
  });
}
