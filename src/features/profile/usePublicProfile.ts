/**
 * usePublicProfile — read a user's public profile for the `/u/:username` route.
 *
 * Combines two endpoints to keep concerns separate on the backend:
 *
 * 1) ``GET /api/core/v1/users/u/{username}`` — basic user fields (display name,
 *    profile picture, bio). Public, no auth required.
 *
 * 2) ``GET /api/core/v1/social/profiles/{username}`` — enriched profile that
 *    layers in ``friendship_status``, learning language, and visibility
 *    enforcement. May 404 when the target's profile is private or
 *    friends-only and the viewer can't see it.
 *
 * The combined result exposes ``isPrivate`` so the page can render the
 * "This profile is private" state without inspecting raw HTTP codes.
 */

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";
import type { User } from "@/shared/api/users";
import type { PublicProfile } from "@/shared/api/social";
import { ApiError } from "@/shared/api/client";

export type PublicProfileBundle = {
  user: User | null;
  social: PublicProfile | null;
  isPrivate: boolean;
  isLoading: boolean;
  isError: boolean;
  notFound: boolean;
  refetch: () => Promise<unknown>;
};

export function usePublicProfile(username: string | undefined): PublicProfileBundle {
  const { users, social } = useApi();

  const userQuery = useQuery({
    queryKey: ["users", "profile", username ?? ""],
    queryFn: () => users.getByUsername(username!),
    enabled: !!username,
    retry: (_, err) => !(err instanceof ApiError && err.status === 404),
  });

  const socialQuery = useQuery({
    queryKey: ["social", "profile", username ?? ""],
    queryFn: () => social.getPublicProfile(username!),
    enabled: !!username,
    // 404 here means "private profile or visibility blocks the viewer" —
    // a domain signal, not a transient error. Don't retry.
    retry: (_, err) => !(err instanceof ApiError && err.status === 404),
  });

  // Visibility 404 on the social endpoint while the users endpoint succeeded
  // means the basic record exists but the viewer can't see the enriched data.
  const socialIsHidden404 =
    socialQuery.isError &&
    socialQuery.error instanceof ApiError &&
    socialQuery.error.status === 404;

  const userNotFound =
    userQuery.isError &&
    userQuery.error instanceof ApiError &&
    userQuery.error.status === 404;

  const isPrivate = socialIsHidden404 && !userNotFound;

  return {
    user: userQuery.data ?? null,
    social: socialQuery.data ?? null,
    isPrivate,
    notFound: userNotFound,
    isLoading: userQuery.isLoading || socialQuery.isLoading,
    isError: (userQuery.isError && !userNotFound) || (socialQuery.isError && !socialIsHidden404),
    refetch: async () => {
      await Promise.all([userQuery.refetch(), socialQuery.refetch()]);
    },
  };
}
