import { ApiClient } from "./client";

const PREFIX = "/api/core/users/v1";

export interface User {
  id: string;
  auth0_id: string;
  username: string;
  display_name: string;
  profile_picture_key: string | null;
  status: string;
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
  status?: string;
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
}
