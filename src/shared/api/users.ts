import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/users";

export interface User {
  id: string;
  auth0_id: string;
  username: string;
  display_name: string;
  profile_picture_key: string | null;
  bio: string | null;
  status: string;
  status_expiration: string | null;
  community_status: string | null;
  community_status_expiration: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  username: string;
  display_name: string;
}

export interface UpdateUserPayload {
  username?: string;
  display_name?: string;
  profile_picture_key?: string | null;
  bio?: string | null;
}

export interface UserSettings {
  theme?: string;
  learningLanguage?: string;
  uiLocale?: string;
  [key: string]: unknown;
}

export class UsersApi extends ApiClient {
  /** Register a new user (first login). */
  register(payload: CreateUserPayload, signal?: AbortSignal): Promise<User> {
    return this.post<User>(`${PREFIX}/me`, payload, { signal, tag: "users:register" });
  }

  /** Get the current user's record. */
  getMe(signal?: AbortSignal): Promise<User> {
    return this.get<User>(`${PREFIX}/me`, { signal, tag: "users:me" });
  }

  /** Update the current user's profile. */
  updateMe(payload: UpdateUserPayload, signal?: AbortSignal): Promise<User> {
    return this.patch<User>(`${PREFIX}/me`, payload, { signal, tag: "users:update" });
  }

  /** Permanently delete the current user's account and server-side settings. */
  deleteMe(signal?: AbortSignal): Promise<void> {
    return this.delete(`${PREFIX}/me`, { signal, tag: "users:delete-me" });
  }

  /** Public profile lookup by username. */
  getByUsername(username: string, signal?: AbortSignal): Promise<User> {
    return this.get<User>(`${PREFIX}/u/${encodeURIComponent(username)}`, {
      signal,
      tag: `users:profile:${username}`,
    });
  }

  /** Get the current user's settings / preferences. */
  getSettings(signal?: AbortSignal): Promise<UserSettings> {
    return this.get<UserSettings>(`${PREFIX}/me/settings`, {
      signal,
      tag: "users:settings:get",
    });
  }

  /** Merge-patch the current user's settings. */
  updateSettings(patch: Partial<UserSettings>, signal?: AbortSignal): Promise<UserSettings> {
    return this.patch<UserSettings>(`${PREFIX}/me/settings`, patch, {
      signal,
      tag: "users:settings:update",
    });
  }

  // ── Subscriptions ────────────────────────────────────────────

  /** List the current user's subscriptions. */
  getSubscriptions(params?: { contentType?: string }, signal?: AbortSignal): Promise<Subscription[]> {
    const q = params?.contentType ? { content_type: params.contentType } : undefined;
    return this.get<Subscription[]>(`${PREFIX}/me/subscriptions`, {
      params: q as Record<string, string>,
      signal,
      tag: "users:subscriptions:list",
    });
  }

  /** Add a subscription. */
  addSubscription(
    body: { contentType: string; contentId: string },
    signal?: AbortSignal
  ): Promise<Subscription> {
    return this.post<Subscription>(`${PREFIX}/me/subscriptions`, body, {
      signal,
      tag: "users:subscriptions:add",
    });
  }

  /** Update subscription settings. */
  updateSubscription(
    contentType: string,
    contentId: string,
    patch: SubscriptionSettingsPatch,
    signal?: AbortSignal
  ): Promise<Subscription> {
    return this.patch<Subscription>(
      `${PREFIX}/me/subscriptions/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}`,
      patch,
      { signal, tag: "users:subscriptions:update" }
    );
  }

  /** Remove a subscription. */
  removeSubscription(
    contentType: string,
    contentId: string,
    signal?: AbortSignal
  ): Promise<void> {
    return this.delete(
      `${PREFIX}/me/subscriptions/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}`,
      { signal, tag: "users:subscriptions:remove" }
    );
  }
}

export interface Subscription {
  contentType: string;
  contentId: string;
  createdAt?: string;
  enabled?: boolean;
  newCardsPerDay?: number;
  newCardOrder?: "ordered" | "shuffled";
}

export interface SubscriptionSettingsPatch {
  enabled?: boolean;
  newCardsPerDay?: number;
  newCardOrder?: "ordered" | "shuffled";
}
