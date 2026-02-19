import type { UserProfile } from "./profileTypes";

const PREFIX = "open-lingo-profile";

function key(userId: string | null): string {
  return `${PREFIX}-${userId ?? "anonymous"}`;
}

export function getStoredProfile(userId: string | null): Partial<UserProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as Partial<UserProfile>) : null;
  } catch {
    return null;
  }
}

export function setStoredProfile(userId: string | null, patch: Partial<UserProfile>): void {
  if (typeof window === "undefined") return;
  try {
    const k = key(userId);
    const cur = getStoredProfile(userId) ?? {};
    localStorage.setItem(k, JSON.stringify({ ...cur, ...patch }));
  } catch {
    /* noop */
  }
}
