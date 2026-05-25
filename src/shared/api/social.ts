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

export interface ActivityFeedResponse {
  items: unknown[];
  cursor: string | null;
}

export interface SendFriendRequestPayload {
  toUsername?: string;
  toUserId?: string;
}

export interface FriendRequestStatus {
  status: "pending" | "accepted" | "exists";
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
      `${PREFIX}/leaderboards/${encodeURIComponent(lang)}/weekly`,
      {
        params: params as Record<string, number | undefined>,
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
      `${PREFIX}/leaderboards/${encodeURIComponent(lang)}/monthly`,
      {
        params: params as Record<string, number | undefined>,
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

  // ── Activity feed (stub) ───────────────────────────────────

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
}
