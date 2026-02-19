import type { UserSettings } from "./types";

/**
 * User settings storage. Currently localStorage keyed by user id (or "anonymous").
 * Replace with API calls when you add a User API (e.g. GET/PATCH /api/users/me/settings).
 *
 * Options for persisting per-user across devices:
 * 1. Your own User API: store settings keyed by Auth0 sub; backend returns/persists JSON.
 * 2. Auth0 user_metadata: requires a backend that calls Auth0 Management API to patch
 *    user_metadata; the SPA cannot do this securely without a token with update:users.
 */
const STORAGE_PREFIX = "open-lingo-settings";

function storageKey(userId: string | null): string {
  return `${STORAGE_PREFIX}-${userId ?? "anonymous"}`;
}

export function getStoredSettings(userId: string | null): Partial<UserSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed as Partial<UserSettings>;
  } catch {
    return null;
  }
}

export function setStoredSettings(
  userId: string | null,
  patch: Partial<UserSettings>
): void {
  if (typeof window === "undefined") return;
  try {
    const key = storageKey(userId);
    const current = getStoredSettings(userId) ?? {};
    const next = { ...current, ...patch };
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}
