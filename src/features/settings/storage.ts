import type { UserSettings } from "@/shared/settings/types";

const SETTINGS_KEY = "open-lingo-settings";
export const LAST_USER_KEY = "open-lingo-last-user-id";

/** Auth0 sub when signed in, otherwise `"anonymous"`. Drives per-user local caches. */
export function getActiveUserStorageId(): string {
  if (typeof window === "undefined") return "anonymous";
  const id = localStorage.getItem(LAST_USER_KEY);
  return id && id.length > 0 ? id : "anonymous";
}

const USER_SPECIFIC_KEYS = [
  "open-lingo-srs",
  "open-lingo-srs-last-sync",
  "open-lingo-srs-next-sync",
  "openlingo-external-content",
  "openlingo-external-content-done",
];

const ALPHABET_PREFIX = "lingo_alphabet_progress_";
const PROFILE_PREFIX = "open-lingo-profile-";

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const srcVal = source[key];
    if (srcVal !== undefined) {
      const tgtVal = result[key];
      if (
        srcVal !== null &&
        typeof srcVal === "object" &&
        !Array.isArray(srcVal) &&
        tgtVal !== null &&
        typeof tgtVal === "object" &&
        !Array.isArray(tgtVal)
      ) {
        (result as Record<string, unknown>)[key as string] = deepMerge(
          tgtVal as Record<string, unknown>,
          srcVal as Record<string, unknown>
        );
      } else {
        (result as Record<string, unknown>)[key as string] = srcVal;
      }
    }
  }
  return result;
}

/** Normalize userId for comparison (empty string for null/anonymous). */
function norm(userId: string | null): string {
  return userId ?? "";
}

/** One-time migration: copy from old user-keyed settings into single key if needed. */
export function migrateToSingleKey(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(SETTINGS_KEY)) return;
    const keys = userId
      ? [`open-lingo-settings-${userId}`, "open-lingo-settings-anonymous"]
      : ["open-lingo-settings-anonymous"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        localStorage.setItem(SETTINGS_KEY, raw);
        localStorage.removeItem(k);
        break;
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Call when auth state is known. If the current user differs from the last stored user,
 * clears user-specific localStorage keys and updates last-user-id.
 */
export function ensureUserConsistency(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const current = norm(userId);
    const last = localStorage.getItem(LAST_USER_KEY) ?? "";
    if (current === last) return;

    for (const key of USER_SPECIFIC_KEYS) {
      localStorage.removeItem(key);
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k?.startsWith(ALPHABET_PREFIX) ||
        k?.startsWith("open-lingo-lesson-attempts:") ||
        k?.startsWith("open-lingo-lesson-step-events:") ||
        k?.startsWith("open-lingo-lesson-last-sync:") ||
        k?.startsWith("open-lingo-lesson-next-sync:")
      ) {
        keys.push(k);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
    if (last) {
      localStorage.removeItem(`${PROFILE_PREFIX}${last}`);
    }

    localStorage.setItem(LAST_USER_KEY, current);
  } catch {
    /* ignore */
  }
}

export function getStoredSettings(): Partial<UserSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed as Partial<UserSettings>;
  } catch {
    return null;
  }
}

export function setStoredSettings(patch: Partial<UserSettings>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredSettings() ?? {};
    const next = deepMerge(current as Record<string, unknown>, patch as Record<string, unknown>) as Partial<UserSettings>;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Wipe local app data on this device (e.g. account deletion). Keeps cookie consent choice. */
export function clearAllLocalAppData(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SETTINGS_KEY);
    for (const key of USER_SPECIFIC_KEYS) {
      localStorage.removeItem(key);
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(ALPHABET_PREFIX) || k.startsWith(PROFILE_PREFIX)) {
        keys.push(k);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
    if (userId) {
      localStorage.removeItem(`${PROFILE_PREFIX}${userId}`);
    }
    localStorage.removeItem(LAST_USER_KEY);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("open-lingo-lesson-progress:")) {
        localStorage.removeItem(k);
      }
    }
    localStorage.removeItem("open-lingo-story-draft");
    localStorage.removeItem("open-lingo-themes");
    localStorage.removeItem("open-lingo-starred-themes");
  } catch {
    /* ignore */
  }
}
