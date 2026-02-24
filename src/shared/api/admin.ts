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
  created_at: string;
  updated_at: string;
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
}
