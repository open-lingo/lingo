/**
 * Social API client — friends, blocks, leaderboards, public profiles.
 *
 * Mirrors the backend at /api/core/v1/social/. The activity feed is wired to
 * a stable endpoint that currently returns an empty list (backend stub).
 */

import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/social";

export interface Friend {
  user_id: string;
  username: string;
  display_name: string;
  profile_picture_key: string | null;
  xp: number;
  streak: number;
  lastActiveAt: string | null;
  friendedAt: string;
}

export interface FriendRequest {
  user_id: string;
  username: string;
  display_name: string;
  requestedAt: string;
}

export interface FriendRequestsBundle {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface BlockedUser {
  user_id: string;
  username: string;
  display_name: string;
  blockedAt: string;
}

export type FriendshipStatus =
  | "none"
  | "friend"
  | "request_in"
  | "request_out"
  | "blocked"
  | "self";

export interface AuthoredDeckSample {
  id: string;
  name: string;
  language: string | null;
}

export interface PublicProfileLeague {
  name: string;
  tier_index: number;
  emoji: string;
}

export interface PublicProfile {
  user_id: string;
  username: string;
  display_name: string;
  profile_picture_key: string | null;
  bio: string | null;
  learning_language: string | null;
  joined_at: string;
  streak: number;
  xp: number;
  friendship_status?: FriendshipStatus | null;
  // Enriched fields appended for PublicProfilePage. Optional so older
  // backends that don't ship them still satisfy the type.
  lingots?: number;
  level?: number;
  last_active_date?: string | null;
  authored_deck_count?: number;
  authored_decks_sample?: AuthoredDeckSample[];
  league?: PublicProfileLeague | null;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  profile_picture_key: string | null;
  xp_this_period: number;
  rank: number;
}

export interface LeaderboardResponse {
  bucket: string;
  entries: LeaderboardEntry[];
  total: number;
  my_rank: number | null;
}

export interface MyLeaderboardSlot {
  bucket: string;
  xp: number;
  rank: number | null;
  total: number;
}

export interface MyLeaderboardSummary {
  weekly: MyLeaderboardSlot | null;
  monthly: MyLeaderboardSlot | null;
  lang: string | null;
}

/** A single reaction bucket on an activity item. Mirrors the
 *  `ActivityReaction` shape in `mockSocial.ts` so cached items can be reused
 *  without a translation step. */
export interface ActivityReaction {
  kind: string;
  count: number;
  /** True if the current user has reacted with this kind. */
  mine?: boolean;
}

export interface ActivityFeedItem {
  id: string;
  actor_id: string;
  actor_username: string;
  actor_display_name: string;
  actor_profile_picture_key?: string | null;
  kind: "streak" | "module" | "league" | "joined" | "milestone";
  /** Human-rendered text from the backend. */
  text: string;
  /** ISO timestamp. */
  occurred_at: string;
  /** Per-kind reaction breakdown. */
  reactions: ActivityReaction[];
}

export interface ActivityFeedResponse {
  items: ActivityFeedItem[];
  cursor: string | null;
}

export interface ReactionToggleResult {
  kind: string;
  count: number;
  mine: boolean;
}

export interface SendFriendRequestPayload {
  toUsername?: string;
  toUserId?: string;
}

export interface FriendRequestStatus {
  status: "pending" | "accepted" | "exists";
}

// ─── Spotlight + streak snapshot ─────────────────────────────────────────────

export interface LeagueSpotlightTopUser {
  user_id: string;
  username: string;
  display_name: string;
  profile_picture_key: string | null;
  xp_this_period: number;
  rank: number;
}

export interface LeagueSpotlight {
  league: string;
  league_tier: number;
  my_row: LeaderboardEntry | null;
  rank: number | null;
  rank_yesterday: number | null;
  rank_delta_today: number;
  daily_xp: number[];
  friend_median_daily_xp: number[];
  top_three: LeagueSpotlightTopUser[];
  promotion_threshold: number;
  demotion_threshold: number;
}

export interface StreakSnapshot {
  my_streak_days: number;
  friend_median_streak_days: number;
  best_friend_streak_days: number;
  best_friend_username: string | null;
}

// ─── Invites ────────────────────────────────────────────────────────────────

export interface InviteOffer {
  code: string;
  url: string;
  lingot_reward_inviter: number;
  lingot_reward_invitee: number;
  ad_free_minutes_inviter: number;
  ad_free_minutes_invitee: number;
  monthly_cap: number;
  redeemed_count_this_month: number;
  first_lesson_required: boolean;
}

export interface InviteRedeemResult {
  status: "ok" | "already_redeemed" | "expired" | "invalid" | "self";
  lingot_reward: number;
  ad_free_minutes: number;
}

// ─── Threads + messages ─────────────────────────────────────────────────────
// Shape matches `lingo-core/app/social/schemas.py` exactly (flat fields, no
// nested `other_user`/`thread`). Earlier iterations of this file had a
// nested shape that didn't match the backend — the adapter would silently
// crash with "Cannot read properties of undefined (reading 'user_id')" when
// rendering the messages list. Keep the field names flat + snake_case.

export interface ThreadItem {
  id: string;
  other_user_id: string;
  other_username: string;
  other_display_name: string;
  other_avatar_key: string | null;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  sent_at: string;
}

export interface ThreadDetail {
  id: string;
  other_user_id: string;
  other_username: string;
  other_display_name: string;
  other_avatar_key: string | null;
  messages: Message[];
}

// ─── Quest targets ──────────────────────────────────────────────────────────

export interface QuestTargetItem {
  user_id: string;
  username: string;
  display_name: string;
  profile_picture_key: string | null;
  /** Streak gap (their streak − yours). Negative means they're behind. */
  streak_gap: number;
  /** Daily XP gap. */
  xp_gap_today: number;
  /** Short reason string from the backend (e.g. "within 50 XP today"). */
  reason: string;
}

export class SocialApi extends ApiClient {
  // ── Friends ────────────────────────────────────────────────

  getFriends(signal?: AbortSignal): Promise<Friend[]> {
    return this.get<Friend[]>(`${PREFIX}/friends`, { signal, tag: "social:friends" });
  }

  getFriendRequests(signal?: AbortSignal): Promise<FriendRequestsBundle> {
    return this.get<FriendRequestsBundle>(`${PREFIX}/friends/requests`, {
      signal,
      tag: "social:friend-requests",
    });
  }

  sendFriendRequest(
    payload: SendFriendRequestPayload,
    signal?: AbortSignal,
  ): Promise<FriendRequestStatus> {
    return this.post<FriendRequestStatus>(`${PREFIX}/friends/requests`, payload, {
      signal,
      tag: "social:send-request",
    });
  }

  acceptFriendRequest(requesterId: string, signal?: AbortSignal): Promise<FriendRequestStatus> {
    return this.post<FriendRequestStatus>(
      `${PREFIX}/friends/requests/${encodeURIComponent(requesterId)}/accept`,
      undefined,
      { signal, tag: `social:accept:${requesterId}` },
    );
  }

  deleteFriendRequest(otherId: string, signal?: AbortSignal): Promise<void> {
    return this.delete(`${PREFIX}/friends/requests/${encodeURIComponent(otherId)}`, {
      signal,
      tag: `social:delete-request:${otherId}`,
    });
  }

  unfriend(friendId: string, signal?: AbortSignal): Promise<void> {
    return this.delete(`${PREFIX}/friends/${encodeURIComponent(friendId)}`, {
      signal,
      tag: `social:unfriend:${friendId}`,
    });
  }

  // ── Blocks ─────────────────────────────────────────────────

  blockUser(userId: string, signal?: AbortSignal): Promise<{ status: string }> {
    return this.post<{ status: string }>(
      `${PREFIX}/blocks/${encodeURIComponent(userId)}`,
      undefined,
      { signal, tag: `social:block:${userId}` },
    );
  }

  unblockUser(userId: string, signal?: AbortSignal): Promise<void> {
    return this.delete(`${PREFIX}/blocks/${encodeURIComponent(userId)}`, {
      signal,
      tag: `social:unblock:${userId}`,
    });
  }

  listBlocks(signal?: AbortSignal): Promise<BlockedUser[]> {
    return this.get<BlockedUser[]>(`${PREFIX}/blocks`, { signal, tag: "social:blocks" });
  }

  // ── Leaderboards ───────────────────────────────────────────

  getWeeklyLeaderboard(
    lang: string,
    params?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<LeaderboardResponse> {
    return this.get<LeaderboardResponse>(
      `${PREFIX}/leaderboards/weekly`,
      {
        params: { lang, ...(params as Record<string, string | number | undefined>) },
        signal,
        tag: `social:leaderboard:weekly:${lang}`,
      },
    );
  }

  getMonthlyLeaderboard(
    lang: string,
    params?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<LeaderboardResponse> {
    return this.get<LeaderboardResponse>(
      `${PREFIX}/leaderboards/monthly`,
      {
        params: { lang, ...(params as Record<string, string | number | undefined>) },
        signal,
        tag: `social:leaderboard:monthly:${lang}`,
      },
    );
  }

  getFriendsLeaderboard(
    params?: { lang?: string },
    signal?: AbortSignal,
  ): Promise<LeaderboardResponse> {
    return this.get<LeaderboardResponse>(`${PREFIX}/leaderboards/friends`, {
      params: params as Record<string, string | undefined>,
      signal,
      tag: "social:leaderboard:friends",
    });
  }

  getMyLeaderboardSummary(
    params?: { lang?: string },
    signal?: AbortSignal,
  ): Promise<MyLeaderboardSummary> {
    return this.get<MyLeaderboardSummary>(`${PREFIX}/leaderboards/me`, {
      params: params as Record<string, string | undefined>,
      signal,
      tag: "social:leaderboard:me",
    });
  }

  // ── Public profile ─────────────────────────────────────────

  getPublicProfile(username: string, signal?: AbortSignal): Promise<PublicProfile> {
    return this.get<PublicProfile>(
      `${PREFIX}/profiles/${encodeURIComponent(username)}`,
      { signal, tag: `social:profile:${username}` },
    );
  }

  // ── Activity feed ──────────────────────────────────────────

  getActivity(
    params?: { cursor?: string },
    signal?: AbortSignal,
  ): Promise<ActivityFeedResponse> {
    return this.get<ActivityFeedResponse>(`${PREFIX}/activity`, {
      params: params as Record<string, string | undefined>,
      signal,
      tag: "social:activity",
    });
  }

  /** Toggle a reaction on an activity item. Returns the post-toggle state for
   *  the affected kind so the client can reconcile its optimistic update. */
  reactToActivity(
    activityId: string,
    kind: string,
    signal?: AbortSignal,
  ): Promise<ReactionToggleResult> {
    return this.post<ReactionToggleResult>(
      `${PREFIX}/activity/${encodeURIComponent(activityId)}/reactions/${encodeURIComponent(kind)}`,
      undefined,
      { signal, tag: `social:react:${activityId}:${kind}` },
    );
  }

  // ── Spotlight + streak snapshot ────────────────────────────

  getLeagueSpotlight(lang: string, signal?: AbortSignal): Promise<LeagueSpotlight> {
    return this.get<LeagueSpotlight>(`${PREFIX}/leaderboards/spotlight`, {
      params: { lang },
      signal,
      tag: `social:spotlight:${lang}`,
    });
  }

  getStreakSnapshot(signal?: AbortSignal): Promise<StreakSnapshot> {
    return this.get<StreakSnapshot>(`${PREFIX}/streak-snapshot`, {
      signal,
      tag: "social:streak-snapshot",
    });
  }

  // ── Invites ────────────────────────────────────────────────

  getInviteOffer(signal?: AbortSignal): Promise<InviteOffer> {
    return this.get<InviteOffer>(`${PREFIX}/invites/offer`, {
      signal,
      tag: "social:invite-offer",
    });
  }

  redeemInvite(code: string, signal?: AbortSignal): Promise<InviteRedeemResult> {
    return this.post<InviteRedeemResult>(
      `${PREFIX}/invites/redeem/${encodeURIComponent(code)}`,
      undefined,
      { signal, tag: `social:invite-redeem:${code}` },
    );
  }

  // ── Threads ────────────────────────────────────────────────

  getThreads(signal?: AbortSignal): Promise<ThreadItem[]> {
    return this.get<ThreadItem[]>(`${PREFIX}/threads`, {
      signal,
      tag: "social:threads",
    });
  }

  getThread(threadId: string, signal?: AbortSignal): Promise<ThreadDetail> {
    return this.get<ThreadDetail>(
      `${PREFIX}/threads/${encodeURIComponent(threadId)}`,
      { signal, tag: `social:thread:${threadId}` },
    );
  }

  // ── Quest targets ──────────────────────────────────────────

  getQuestTargets(signal?: AbortSignal): Promise<QuestTargetItem[]> {
    return this.get<QuestTargetItem[]>(`${PREFIX}/quest-targets`, {
      signal,
      tag: "social:quest-targets",
    });
  }
}
