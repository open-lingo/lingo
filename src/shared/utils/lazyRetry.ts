import { lazy, type ComponentType } from "react";

const RETRY_LIMIT = 3;
const BACKOFF_MS = 400;

/** Exported so `AppErrorBoundary`'s manual Reload button can clear it. */
export const CHUNK_RELOAD_FLAG = "lingo_chunk_reload";

/**
 * Retry a dynamic-import factory up to `RETRY_LIMIT` times, then — once —
 * reload the page so the user gets a fresh index.html with current chunk
 * hashes. Factored out of `lazyRetry` (below) so the retry/reload logic is
 * testable directly, without rendering a component through Suspense.
 *
 * The reload guard is keyed on the BUILD, not just "this tab session"
 * (prod #86, 2026-09-14). A tab left open across two deploys burns its
 * reload on the first one; without a build key, the flag never clears
 * and the second deploy's failure goes straight past the reload to the
 * error boundary. `sessionStorage[CHUNK_RELOAD_FLAG]` now stores the
 * build id the reload happened for, so a NEW build id (a later deploy,
 * detected the next time this module's factory fails) gets its own
 * reload.
 */
export async function loadChunkWithRetry<M>(factory: () => Promise<M>): Promise<M> {
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
  if (typeof window !== "undefined" && !alreadyReloadedForThisBuild()) {
    markReloadedForThisBuild();
    window.location.reload();
  }
  throw lastErr;
}

/**
 * Wrap `React.lazy` with finite retry. A stale chunk after a deploy is
 * the most likely failure mode; see `loadChunkWithRetry` for the retry +
 * build-keyed reload behavior.
 */
// `any` matches React.lazy's own constraint — `unknown` rejects components
// whose props are typed (contravariance), e.g. TransitLearnPage's `preview`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): ReturnType<typeof lazy<T>> {
  return lazy(() => loadChunkWithRetry(factory));
}

function alreadyReloadedForThisBuild(): boolean {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_FLAG) === __LINGO_BUILD_ID__;
  } catch {
    return false;
  }
}

function markReloadedForThisBuild(): void {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_FLAG, __LINGO_BUILD_ID__);
  } catch {
    // ignore
  }
}
