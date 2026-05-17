import { lazy, type ComponentType } from "react";

const RETRY_LIMIT = 3;
const BACKOFF_MS = 400;

/**
 * Wrap `React.lazy` with finite retry. A stale chunk after a deploy is
 * the most likely failure mode; if all retries fail, reload the page
 * once so the user gets a fresh index.html with current chunk hashes.
 */
export function lazyRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): ReturnType<typeof lazy<T>> {
  return lazy(async () => {
    let lastErr: unknown;
    for (let attempt = 0; attempt < RETRY_LIMIT; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastErr = err;
        if (attempt < RETRY_LIMIT - 1) {
          await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)));
        }
      }
    }
    if (typeof window !== "undefined" && !hasReloadedThisSession()) {
      markReloaded();
      window.location.reload();
    }
    throw lastErr;
  });
}

const RELOAD_FLAG = "lingo_chunk_reload";

function hasReloadedThisSession(): boolean {
  try {
    return sessionStorage.getItem(RELOAD_FLAG) === "1";
  } catch {
    return false;
  }
}

function markReloaded(): void {
  try {
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // ignore
  }
}
