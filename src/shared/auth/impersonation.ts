/**
 * Admin "Act as user" impersonation — sessionStorage-backed state.
 *
 * Why sessionStorage (not localStorage): tab-scoped, clears on tab
 * close. An admin who closes their browser doesn't wake up tomorrow
 * still impersonating a user. No time-limit logic needed.
 *
 * The actual identity swap happens BE-side via the
 * ``X-Impersonate-User-Id`` request header, attached by ``ApiClient``.
 * This module owns the storage + a tiny pub/sub so the banner can
 * react to start/stop without a context re-render on every API call.
 *
 * NOT a security boundary — the BE re-validates on every request that
 * the caller is admin. A malicious user setting this key in devtools
 * just gets 401s (regular user) or 403s (their own impersonation
 * silently ignored, request proceeds as themselves).
 */

const STORAGE_KEY = "lingo.impersonation";

export interface ImpersonationState {
  targetUserId: string;
  targetUsername: string;
  targetDisplayName: string;
  /** UUID of the admin who started impersonating — purely for display
   * (e.g. "Stop and return to /admin/users/<id>"). */
  adminUserId: string;
}

type Listener = (state: ImpersonationState | null) => void;
const listeners = new Set<Listener>();

function readFromStorage(): ImpersonationState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ImpersonationState>;
    if (
      typeof parsed.targetUserId !== "string" ||
      typeof parsed.targetUsername !== "string" ||
      typeof parsed.adminUserId !== "string"
    ) {
      return null;
    }
    return {
      targetUserId: parsed.targetUserId,
      targetUsername: parsed.targetUsername,
      targetDisplayName: parsed.targetDisplayName ?? "",
      adminUserId: parsed.adminUserId,
    };
  } catch {
    return null;
  }
}

function writeToStorage(state: ImpersonationState | null): void {
  try {
    if (state === null) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // private mode / quota — surface won't function but won't crash.
  }
}

/**
 * Read the current impersonation state. Safe to call at any time
 * (sync; reads sessionStorage). ApiClient calls this on every request.
 */
export function getImpersonation(): ImpersonationState | null {
  return readFromStorage();
}

/** Pure header lookup — ApiClient calls this on every request. */
export function getImpersonationTargetId(): string | null {
  return readFromStorage()?.targetUserId ?? null;
}

export function setImpersonation(state: ImpersonationState): void {
  writeToStorage(state);
  for (const fn of listeners) fn(state);
}

export function clearImpersonation(): void {
  writeToStorage(null);
  for (const fn of listeners) fn(null);
}

/** Subscribe to start/stop. Returns an unsubscribe function. */
export function subscribeImpersonation(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
