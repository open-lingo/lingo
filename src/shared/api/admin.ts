import { ApiClient } from "./client";
import type { DeckResponse } from "./decks";
import type { Subscription } from "./users";

const PREFIX = "/api/core/v1/admin";

export interface UserListItem {
  id: string;
  auth0_id: string;
  username: string;
  display_name: string;
  profile_picture_key: string | null;
  status: string;
  status_expiration: string | null;
  community_status: string | null;
  community_status_expiration: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = "user" | "trusted_creator" | "moderator" | "admin" | "super_admin";

export interface AdminUserUpdatePayload {
  username?: string;
  display_name?: string;
  profile_picture_key?: string | null;
  status?: "active" | "banned";
  status_expiration?: string | null;
  community_status?: "active" | "banned";
  community_status_expiration?: string | null;
  role?: UserRole;
}

export interface ListUsersResponse {
  items: UserListItem[];
  nextCursor: string | null;
}

export class AdminApi extends ApiClient {
  /** List users (paginated). */
  listUsers(params?: { limit?: number; cursor?: string }): Promise<ListUsersResponse> {
    return this.get<ListUsersResponse>(`${PREFIX}/users`, {
      params: params as Record<string, string | number | undefined>,
    });
  }

  /** Get user by ID. */
  getUser(userId: string): Promise<UserListItem> {
    return this.get<UserListItem>(`${PREFIX}/users/${encodeURIComponent(userId)}`);
  }

  /** Get user's subscriptions. */
  getUserSubscriptions(
    userId: string,
    params?: { content_type?: string }
  ): Promise<Subscription[]> {
    return this.get<Subscription[]>(`${PREFIX}/users/${encodeURIComponent(userId)}/subscriptions`, {
      params: params as Record<string, string | undefined>,
    });
  }

  /** Get user's content (decks they authored). */
  getUserContent(userId: string): Promise<DeckResponse[]> {
    return this.get<DeckResponse[]>(`${PREFIX}/users/${encodeURIComponent(userId)}/content`);
  }

  /** Update a user's profile (username, display_name, profile_picture_key, ban fields). */
  updateUser(userId: string, payload: AdminUserUpdatePayload): Promise<UserListItem> {
    return this.patch<UserListItem>(`${PREFIX}/users/${encodeURIComponent(userId)}`, payload);
  }

  /** Delete a user. Cannot delete self. */
  deleteUser(userId: string): Promise<void> {
    return this.delete(`${PREFIX}/users/${encodeURIComponent(userId)}`);
  }

  /** Add a subscription for a user (admin). */
  addUserSubscription(
    userId: string,
    body: { contentType: string; contentId: string }
  ): Promise<Subscription> {
    return this.post<Subscription>(
      `${PREFIX}/users/${encodeURIComponent(userId)}/subscriptions`,
      body
    );
  }

  /** Remove a subscription for a user (admin). */
  removeUserSubscription(
    userId: string,
    contentType: string,
    contentId: string
  ): Promise<void> {
    return this.delete(
      `${PREFIX}/users/${encodeURIComponent(userId)}/subscriptions/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}`
    );
  }

  /** Unpublish (draft) or publish a deck. Admin only. */
  updateDeckStatus(
    deckId: string,
    status: "draft" | "published"
  ): Promise<import("./decks").DeckResponse> {
    return this.patch(
      `${PREFIX}/decks/${encodeURIComponent(deckId)}/status?status=${status}`
    );
  }

  /** Delete a deck permanently. Admin only. */
  deleteDeck(deckId: string): Promise<void> {
    return this.delete(`${PREFIX}/decks/${encodeURIComponent(deckId)}`);
  }

  /** List all stories (admin). */
  listStories(params?: {
    status?: string;
    language_id?: string;
  }): Promise<import("./stories").StoryResponse[]> {
    return this.get<import("./stories").StoryResponse[]>(`${PREFIX}/stories`, {
      params: params as Record<string, string | undefined>,
    });
  }

  /** Update story status. Admin only. */
  updateStoryStatus(
    storyId: string,
    status: "draft" | "published"
  ): Promise<import("./stories").StoryResponse> {
    return this.patch(
      `${PREFIX}/stories/${encodeURIComponent(storyId)}/status?status=${status}`
    );
  }

  /** Delete a story permanently. Admin only. */
  deleteStory(storyId: string): Promise<void> {
    return this.delete(`${PREFIX}/stories/${encodeURIComponent(storyId)}`);
  }

  /** Get SRS state for a user (admin). */
  getUserSrs(userId: string): Promise<{ cards: Record<string, import("./srs").SRSCardState> }> {
    return this.get(`${PREFIX}/users/${encodeURIComponent(userId)}/srs`);
  }

  /** Update SRS state for a user (admin). */
  updateUserSrs(
    userId: string,
    body: { cards: Record<string, import("./srs").SRSCardState> }
  ): Promise<{ cards: Record<string, import("./srs").SRSCardState> }> {
    return this.patch(`${PREFIX}/users/${encodeURIComponent(userId)}/srs`, body);
  }

  /** Delete SRS state for specific cards (admin). */
  deleteUserSrsCards(userId: string, cardIds: string[]): Promise<{ deleted: number }> {
    return this.delete(
      `${PREFIX}/users/${encodeURIComponent(userId)}/srs/cards`,
      { body: { cardIds } }
    );
  }

  /** Read the admin-tunable XP economy config. */
  getXpConfig(): Promise<XpEconomyConfig> {
    return this.get<XpEconomyConfig>(`${PREFIX}/platform-settings/xp`);
  }

  /** Replace the XP economy config. */
  putXpConfig(payload: XpEconomyConfig): Promise<XpEconomyConfig> {
    return this.put<XpEconomyConfig>(
      `${PREFIX}/platform-settings/xp`,
      payload,
    );
  }

  /** Award XP to any user (admin). Writes to user row + leaderboard. */
  awardXp(
    userId: string,
    body: { amount: number; reason: string },
  ): Promise<AwardXpResponse> {
    return this.post<AwardXpResponse>(
      `${PREFIX}/users/${encodeURIComponent(userId)}/award-xp`,
      body,
    );
  }

  // ── Admin social moderation ─────────────────────────────────────────────
  // Friend-request inbox/outbox + accept/decline on behalf of any user. The
  // backend mirrors the user-facing /social/friends/requests handlers but
  // takes the operand id from the URL instead of the JWT.

  /** List incoming + outgoing friend requests for any user (admin). */
  listFriendRequests(userId: string): Promise<AdminFriendRequestsResponse> {
    return this.get<AdminFriendRequestsResponse>(
      `${PREFIX}/social/users/${encodeURIComponent(userId)}/friend-requests`,
    );
  }

  /** Accept a pending request from ``requesterId`` to ``userId``. */
  acceptFriendRequest(
    userId: string,
    requesterId: string,
  ): Promise<{ status: string }> {
    return this.post<{ status: string }>(
      `${PREFIX}/social/users/${encodeURIComponent(userId)}/friend-requests/${encodeURIComponent(requesterId)}/accept`,
      {},
    );
  }

  /** Decline / cancel a pending request in either direction. */
  declineFriendRequest(userId: string, otherId: string): Promise<void> {
    return this.delete(
      `${PREFIX}/social/users/${encodeURIComponent(userId)}/friend-requests/${encodeURIComponent(otherId)}`,
    );
  }
}

export interface AdminFriendRequestItem {
  user_id: string;
  username: string;
  display_name: string;
  requested_at: string;
}

export interface AdminFriendRequestsResponse {
  incoming: AdminFriendRequestItem[];
  outgoing: AdminFriendRequestItem[];
}

export interface XpEconomyConfig {
  lesson_pass_xp: number;
  lesson_perfect_xp: number;
  review_xp: number;
  streak_milestone_xp: number;
  deck_approved_xp: number;
  first_module_finish_xp: number;
  lingots_per_lesson: number;
}

export interface AwardXpResponse {
  user_id: string;
  xp: number;
  level: number;
  awarded: number;
  reason: string;
}
