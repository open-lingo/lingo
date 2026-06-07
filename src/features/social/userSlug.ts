/**
 * userSlug — derive a URL-safe identifier for a SocialUser.
 *
 * Prefers `user.username` (the real backend handle). Falls back to a
 * slugified `name` for mock/legacy entries that don't have a username yet.
 *
 * Slug rule: lowercase, strip non-alphanumerics. Same rule used by Anki +
 * most identifier systems, and matches what the backend's username regex
 * accepts ([a-zA-Z0-9_-]+) for the cases that will actually resolve.
 *
 * The slug is for URL generation only. For *display* always use `name`.
 */

import type { SocialUser } from "./types";

export function userSlug(user: Pick<SocialUser, "username" | "name">): string {
  if (user.username && user.username.length > 0) return user.username;
  // Defensive: some records arrive with no name (mocks, partial backend
  // responses). Return an empty slug rather than crashing — the link will
  // 404 cleanly instead of taking down the whole render.
  if (!user.name) return "";
  return user.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
