/**
 * Mutation hooks for the social surface.
 *
 * Each hook wraps a `useMutation` over a `SocialApi` call, surfaces a
 * `mutate()` callback the caller can fire from a button click, and runs
 * `queryClient.invalidateQueries` for the affected query keys on success.
 *
 * The optimistic-update hooks (`useAcceptFriendRequest`,
 * `useDeclineFriendRequest`, `useReactToActivity`) snapshot the relevant
 * cache slot in `onMutate`, write a predicted next state immediately, and
 * roll back to the snapshot in `onError`. The mutations also call
 * `onSuccess` toasts via the shared toast context so consumers don't have
 * to duplicate the "Friend request accepted!" / "Reacted" copy at every
 * call site.
 */
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useApiOptional } from "@/shared/api";
import type { SocialApi } from "@/shared/api/social";
import { ApiError } from "@/shared/api/client";
import type {
  ActivityFeedResponse,
  FriendRequestsBundle,
  Friend as ApiFriend,
  InviteRedeemResult,
  ReactionToggleResult,
} from "@/shared/api/social";
import { useToast } from "@/shared/contexts/ToastContext";
import { SOCIAL_QUERY_KEYS } from "./useSocial";

/** Resolve the SocialApi client. Throws if a mutation actually fires while
 *  no `<ApiProvider>` is mounted — for the mock/preview environments the
 *  mutations are never fired by user action, so this never trips. */
function useSocialClient(): SocialApi {
  const api = useApiOptional();
  if (!api) {
    // Returns a proxy that throws on access — preserves Rules-of-Hooks
    // ordering at render time while still failing loudly on a real click.
    const target = {} as SocialApi;
    return new Proxy(target, {
      get() {
        throw new Error(
          "SocialApi not available: a social mutation was triggered outside <ApiProvider>.",
        );
      },
    });
  }
  return api.social;
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body;
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail?: unknown }).detail;
      if (typeof detail === "string") return detail;
    }
    return `Request failed (${err.status}).`;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

// ────────────────────────────────────────────────────────────────────────────
// Friend requests
// ────────────────────────────────────────────────────────────────────────────

export function useSendFriendRequest() {
  const social = useSocialClient();
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (vars: { toUsername?: string; toUserId?: string }) =>
      // Backend (FastAPI/Pydantic) expects snake_case body fields
      // `to_username` / `to_user_id`. The legacy SocialApi type aliases the
      // payload as camelCase; without this translation the body lands as
      // `{toUsername:"…"}` and Pydantic ignores it, resulting in a 422 because
      // both target fields are unset on the server. Sending both spellings is
      // safe — Pydantic ignores the unknown camelCase keys.
      social.sendFriendRequest({
        ...vars,
        ...(vars.toUsername !== undefined
          ? ({ to_username: vars.toUsername } as Record<string, string>)
          : {}),
        ...(vars.toUserId !== undefined
          ? ({ to_user_id: vars.toUserId } as Record<string, string>)
          : {}),
      } as Parameters<typeof social.sendFriendRequest>[0]),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.friendRequests });
      void qc.invalidateQueries({ queryKey: ["social", "profile"] });
      showToast("Friend request sent.", "success");
    },
    onError: (err) => showToast(describeError(err), "error"),
  });
}

/** Optimistic accept: remove the request from the incoming list immediately,
 *  add a placeholder to the friends list, then invalidate on settle so the
 *  server response wins. Rolls back snapshots on error. */
export function useAcceptFriendRequest() {
  const social = useSocialClient();
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (requesterId: string) => social.acceptFriendRequest(requesterId),
    onMutate: async (requesterId) => {
      await qc.cancelQueries({ queryKey: SOCIAL_QUERY_KEYS.friendRequests });
      await qc.cancelQueries({ queryKey: SOCIAL_QUERY_KEYS.friends });

      const prevRequests = qc.getQueryData<FriendRequestsBundle>(
        SOCIAL_QUERY_KEYS.friendRequests,
      );
      const prevFriends = qc.getQueryData<ApiFriend[]>(SOCIAL_QUERY_KEYS.friends);

      // Optimistic friend-requests update: drop the incoming request.
      if (prevRequests) {
        const accepted = prevRequests.incoming.find((r) => r.user_id === requesterId);
        qc.setQueryData<FriendRequestsBundle>(SOCIAL_QUERY_KEYS.friendRequests, {
          incoming: prevRequests.incoming.filter((r) => r.user_id !== requesterId),
          outgoing: prevRequests.outgoing,
        });
        // Add a placeholder friend row if we know the requester.
        if (accepted && prevFriends) {
          const stub: ApiFriend = {
            user_id: accepted.user_id,
            username: accepted.username,
            display_name: accepted.display_name,
            profile_picture_key: null,
            xp: 0,
            streak: 0,
            lastActiveAt: null,
            friendedAt: new Date().toISOString(),
          };
          qc.setQueryData<ApiFriend[]>(SOCIAL_QUERY_KEYS.friends, [stub, ...prevFriends]);
        }
      }
      return { prevRequests, prevFriends };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevRequests) {
        qc.setQueryData(SOCIAL_QUERY_KEYS.friendRequests, ctx.prevRequests);
      }
      if (ctx?.prevFriends) {
        qc.setQueryData(SOCIAL_QUERY_KEYS.friends, ctx.prevFriends);
      }
      showToast(describeError(err), "error");
    },
    onSuccess: () => {
      showToast("Friend request accepted.", "success");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.friendRequests });
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.friends });
      void qc.invalidateQueries({ queryKey: ["social", "leaderboard"] });
    },
  });
}

/** Optimistic decline: remove the request from the incoming list immediately. */
export function useDeclineFriendRequest() {
  const social = useSocialClient();
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (otherId: string) => social.deleteFriendRequest(otherId),
    onMutate: async (otherId) => {
      await qc.cancelQueries({ queryKey: SOCIAL_QUERY_KEYS.friendRequests });
      const prev = qc.getQueryData<FriendRequestsBundle>(SOCIAL_QUERY_KEYS.friendRequests);
      if (prev) {
        qc.setQueryData<FriendRequestsBundle>(SOCIAL_QUERY_KEYS.friendRequests, {
          incoming: prev.incoming.filter((r) => r.user_id !== otherId),
          outgoing: prev.outgoing.filter((r) => r.user_id !== otherId),
        });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(SOCIAL_QUERY_KEYS.friendRequests, ctx.prev);
      showToast(describeError(err), "error");
    },
    onSuccess: () => showToast("Request dismissed.", "success"),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.friendRequests });
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Unfriend / Block
// ────────────────────────────────────────────────────────────────────────────

export function useUnfriend() {
  const social = useSocialClient();
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (friendId: string) => social.unfriend(friendId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.friends });
      void qc.invalidateQueries({ queryKey: ["social", "leaderboard"] });
      void qc.invalidateQueries({ queryKey: ["social", "profile"] });
      showToast("Removed from friends.", "success");
    },
    onError: (err) => showToast(describeError(err), "error"),
  });
}

export function useBlockUser() {
  const social = useSocialClient();
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (userId: string) => social.blockUser(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.friends });
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.blocks });
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.friendRequests });
      void qc.invalidateQueries({ queryKey: ["social", "profile"] });
      showToast("User blocked.", "success");
    },
    onError: (err) => showToast(describeError(err), "error"),
  });
}

export function useUnblockUser() {
  const social = useSocialClient();
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (userId: string) => social.unblockUser(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.blocks });
      void qc.invalidateQueries({ queryKey: ["social", "profile"] });
      showToast("User unblocked.", "success");
    },
    onError: (err) => showToast(describeError(err), "error"),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Activity reactions — optimistic
// ────────────────────────────────────────────────────────────────────────────

/** Optimistic reaction toggle. Looks up the activity feed in cache, mutates
 *  the count + `mine` flag for the affected `(activityId, kind)` pair, then
 *  rolls back if the server rejects. Server response (count) overrides the
 *  optimistic value on success. */
export function useReactToActivity() {
  const social = useSocialClient();
  const qc = useQueryClient();
  const { showToast } = useToast();

  type Vars = { activityId: string; kind: string };
  type Ctx = { prev: ActivityFeedResponse | undefined };

  return useMutation<ReactionToggleResult, Error, Vars, Ctx>({
    mutationFn: ({ activityId, kind }) => social.reactToActivity(activityId, kind),
    onMutate: async ({ activityId, kind }) => {
      await qc.cancelQueries({ queryKey: SOCIAL_QUERY_KEYS.activity });
      const prev = qc.getQueryData<ActivityFeedResponse>(SOCIAL_QUERY_KEYS.activity);
      if (prev) {
        const next: ActivityFeedResponse = {
          ...prev,
          items: prev.items.map((it) => {
            if (it.id !== activityId) return it;
            const existing = it.reactions ?? [];
            const found = existing.find((r) => r.kind === kind);
            if (found) {
              const wasMine = found.mine === true;
              return {
                ...it,
                reactions: existing.map((r) =>
                  r.kind === kind
                    ? {
                        ...r,
                        mine: !wasMine,
                        count: wasMine ? Math.max(0, r.count - 1) : r.count + 1,
                      }
                    : r,
                ),
              };
            }
            // No existing bucket — add one set to mine.
            return {
              ...it,
              reactions: [...existing, { kind, count: 1, mine: true }],
            };
          }),
        };
        qc.setQueryData(SOCIAL_QUERY_KEYS.activity, next);
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(SOCIAL_QUERY_KEYS.activity, ctx.prev);
      showToast(describeError(err), "error");
    },
    onSuccess: (result, vars) => {
      // Reconcile with server count.
      const cached = qc.getQueryData<ActivityFeedResponse>(SOCIAL_QUERY_KEYS.activity);
      if (cached) {
        qc.setQueryData<ActivityFeedResponse>(SOCIAL_QUERY_KEYS.activity, {
          ...cached,
          items: cached.items.map((it) => {
            if (it.id !== vars.activityId) return it;
            const reactions = (it.reactions ?? []).map((r) =>
              r.kind === result.kind
                ? { kind: r.kind, count: result.count, mine: result.mine }
                : r,
            );
            return { ...it, reactions };
          }),
        });
      }
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Invites
// ────────────────────────────────────────────────────────────────────────────

export function useRedeemInvite() {
  const social = useSocialClient();
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation<InviteRedeemResult, Error, string>({
    mutationFn: (code) => social.redeemInvite(code),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.inviteOffer });
      void qc.invalidateQueries({ queryKey: ["progress", "me"] });
      if (result.status === "ok") {
        showToast(
          `Invite redeemed: +${result.lingot_reward} lingots, +${result.ad_free_minutes}m ad-free.`,
          "success",
        );
      } else {
        showToast(`Invite ${result.status.replace("_", " ")}.`, "info");
      }
    },
    onError: (err) => showToast(describeError(err), "error"),
  });
}

// Shared key util re-export for external test helpers.
export const SOCIAL_KEYS = SOCIAL_QUERY_KEYS;

// Export the query-key constants for tests that need to seed cache.
export type SocialQueryKey = QueryKey;
