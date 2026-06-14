import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApiOptional } from "@/shared/api";
import { ApiError } from "@/shared/api/client";
import type { User } from "@/shared/api/users";

/**
 * The current user's `/users/me` record. Shares the
 * `["users", <sub>, "me"]` query key (and 5-min staleTime) with AuthMenu,
 * HomePage, useLearnProfile, and SettingsSectionPanel so mounting this hook
 * dedupes against those rather than firing a fresh request — mutations
 * invalidate that key explicitly.
 *
 * Extracted because several surfaces (e.g. the social masthead) need the
 * server-stored `profile_picture_key` to resolve the avatar correctly;
 * reading only the Auth0 `user.picture` leaves users who uploaded an avatar
 * without an Auth0 picture rendering a blank initial.
 */
export function useMe(): { me: User | null; isLoading: boolean } {
  const { isAuthenticated, user } = useAuth();
  // Optional: in preview/test environments without an <ApiProvider> the hook
  // stays inert (no fetch) rather than throwing, so consumers can render.
  const api = useApiOptional();
  const userId = user?.sub ?? "anon";
  const { data, isLoading } = useQuery({
    queryKey: ["users", userId, "me"],
    queryFn: () => api!.users.getMe(),
    enabled: isAuthenticated && api !== null,
    retry: (_, err) => !(err instanceof ApiError && err.status === 404),
    staleTime: 5 * 60_000,
  });
  return { me: data ?? null, isLoading };
}
