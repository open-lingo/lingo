/**
 * localStorage quota guard.
 *
 * The SRS store + lesson attempt buffers previously swallowed
 * `QuotaExceededError` silently — near the storage ceiling, writes were
 * dropped with no user signal and sync went sporadic. This module routes
 * those writes through `safeLocalStorageWrite`, which:
 *
 *  - still attempts the write (we stay on localStorage; IndexedDB is out of
 *    scope), and
 *  - surfaces a warning via the existing toast / sync-status path instead of
 *    dropping silently, both on a hard `QuotaExceededError` and proactively
 *    when the origin's storage usage crosses a near-ceiling threshold.
 *
 * Bridge: plain storage modules can't read React context, so we emit a
 * `window` CustomEvent (same pattern as `notifySRSStoreChanged`). A small
 * listener component (`StorageQuotaWatcher`) translates it into a toast and
 * an icon flag.
 *
 * Threshold: we warn proactively at 90% of the reported origin quota
 * (`navigator.storage.estimate()` where available). 90% leaves enough
 * headroom to flush a sync before writes actually start failing, while
 * staying high enough that a healthy store never trips it. A hard
 * `QuotaExceededError` always warns regardless of the estimate (some
 * browsers under-report quota, and private-mode quotas are tiny).
 */

export const STORAGE_QUOTA_EVENT = "lingo:storage-quota";

/** 90% of reported origin quota — see module doc for rationale. */
export const NEAR_QUOTA_RATIO = 0.9;

/** Don't re-run the (async) estimate more than once per this window. */
const ESTIMATE_THROTTLE_MS = 30_000;

/** Don't emit more than one quota warning event per this window. */
const WARN_THROTTLE_MS = 60_000;

export type StorageQuotaReason = "exceeded" | "near";

export type StorageQuotaDetail = {
  reason: StorageQuotaReason;
  /** Storage key that triggered the warning (best-effort, for logging). */
  key?: string;
  /** usage / quota ratio at detection time, when an estimate was available. */
  ratio?: number;
};

let lastEstimateAt = 0;
let lastWarnAt = 0;
let estimateInFlight = false;

/** Reset throttles — test-only seam. */
export function __resetStorageQuotaThrottle(): void {
  lastEstimateAt = 0;
  lastWarnAt = 0;
  estimateInFlight = false;
}

function emitQuotaWarning(detail: StorageQuotaDetail): void {
  const now = Date.now();
  if (now - lastWarnAt < WARN_THROTTLE_MS) return;
  lastWarnAt = now;

  // Always log — the warning surface is throttled, the log is the durable
  // breadcrumb for support / telemetry.
  console.warn(
    `[storage-quota] ${detail.reason}` +
      (detail.key ? ` key=${detail.key}` : "") +
      (detail.ratio != null ? ` usage=${Math.round(detail.ratio * 100)}%` : ""),
  );

  if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<StorageQuotaDetail>(STORAGE_QUOTA_EVENT, { detail }),
    );
  }
}

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  // Spec name is "QuotaExceededError"; Firefox historically used code 22 /
  // the legacy "NS_ERROR_DOM_QUOTA_REACHED" name.
  return (
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    err.code === 22 ||
    err.code === 1014
  );
}

/**
 * Opportunistic, throttled near-quota probe. Fire-and-forget: the result
 * arrives async and only matters for the *next* write, which is fine — we're
 * looking to warn before the ceiling, not to gate the current write.
 */
function maybeCheckEstimate(key: string): void {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return;
  const now = Date.now();
  if (estimateInFlight || now - lastEstimateAt < ESTIMATE_THROTTLE_MS) return;
  estimateInFlight = true;
  lastEstimateAt = now;
  navigator.storage
    .estimate()
    .then(({ usage, quota }) => {
      if (typeof usage === "number" && typeof quota === "number" && quota > 0) {
        const ratio = usage / quota;
        if (ratio >= NEAR_QUOTA_RATIO) {
          emitQuotaWarning({ reason: "near", key, ratio });
        }
      }
    })
    .catch(() => {
      /* estimate is best-effort */
    })
    .finally(() => {
      estimateInFlight = false;
    });
}

/**
 * Write to localStorage, surfacing a warning (toast + log) when near or at
 * the storage ceiling instead of dropping silently.
 *
 * Returns `true` if the value was written, `false` if a `QuotaExceededError`
 * prevented it (callers keep their in-memory copy and may retry on the next
 * mutation). Non-quota errors are re-thrown — those are real bugs, not
 * capacity signals.
 */
export function safeLocalStorageWrite(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    // Proactive probe only on success — if we just failed there's no point
    // estimating, the `exceeded` warning already fired.
    maybeCheckEstimate(key);
    return true;
  } catch (err) {
    if (isQuotaError(err)) {
      emitQuotaWarning({ reason: "exceeded", key });
      return false;
    }
    throw err;
  }
}
