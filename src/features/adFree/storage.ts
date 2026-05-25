/**
 * localStorage-backed state for the ad-free feature.
 *
 * Keys (see `config.ts`):
 *   - `AD_FREE_STORAGE_KEY`            — single number string (epoch ms)
 *   - `LINGOT_EVENTS_STORAGE_KEY`      — JSON array of { ts, amount, source }
 *   - `AD_FREE_PURCHASES_STORAGE_KEY`  — JSON array of { ts, durationMs }
 *
 * All readers are SSR-safe (return defaults when `window` is undefined).
 */
import {
  AD_FREE_PURCHASES_STORAGE_KEY,
  AD_FREE_STORAGE_KEY,
  LINGOT_EVENTS_MAX,
  LINGOT_EVENTS_STORAGE_KEY,
} from "./config";

export type LingotEvent = {
  /** epoch ms when the lingots were credited */
  ts: number;
  /** lingots earned in this event (positive integer) */
  amount: number;
  /** free-form tag for grind-analysis ("lesson", "practice", "streak", "shop-refund", etc.) */
  source: string;
};

export type AdFreePurchase = {
  ts: number;
  durationMs: number;
};

const hasWindow = (): boolean => typeof window !== "undefined";

// ─── adFreeUntil ────────────────────────────────────────────────────

export function readAdFreeUntil(): number | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(AD_FREE_STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

export function writeAdFreeUntil(value: number | null): void {
  if (!hasWindow()) return;
  try {
    if (value === null) window.localStorage.removeItem(AD_FREE_STORAGE_KEY);
    else window.localStorage.setItem(AD_FREE_STORAGE_KEY, String(value));
    // Notify other tabs / in-app subscribers without waiting for the
    // 30s tick. The status hook listens for both.
    window.dispatchEvent(new CustomEvent("lingo:ad-free-updated"));
  } catch {
    /* quota or disabled storage — silently no-op */
  }
}

/**
 * Extend the active deadline by `addMs`. If no window is active (or it
 * already expired), the new deadline is `now + addMs`. Returns the new
 * deadline.
 */
export function extendAdFreeUntil(now: number, addMs: number): number {
  const current = readAdFreeUntil();
  const base = current && current > now ? current : now;
  const next = base + addMs;
  writeAdFreeUntil(next);
  return next;
}

// ─── lingotEvents ───────────────────────────────────────────────────

export function readLingotEvents(): LingotEvent[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(LINGOT_EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is LingotEvent =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as LingotEvent).ts === "number" &&
        typeof (e as LingotEvent).amount === "number" &&
        typeof (e as LingotEvent).source === "string",
    );
  } catch {
    return [];
  }
}

export function writeLingotEvents(events: LingotEvent[]): void {
  if (!hasWindow()) return;
  try {
    // Cap at the most recent N to bound storage.
    const trimmed = events.slice(-LINGOT_EVENTS_MAX);
    window.localStorage.setItem(
      LINGOT_EVENTS_STORAGE_KEY,
      JSON.stringify(trimmed),
    );
  } catch {
    /* ignore */
  }
}

export function appendLingotEvent(event: LingotEvent): void {
  const events = readLingotEvents();
  events.push(event);
  writeLingotEvents(events);
}

// ─── adFreePurchases (24h cap log) ──────────────────────────────────

export function readAdFreePurchases(): AdFreePurchase[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(AD_FREE_PURCHASES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is AdFreePurchase =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as AdFreePurchase).ts === "number" &&
        typeof (p as AdFreePurchase).durationMs === "number",
    );
  } catch {
    return [];
  }
}

export function writeAdFreePurchases(purchases: AdFreePurchase[]): void {
  if (!hasWindow()) return;
  try {
    // Drop anything older than 48h — we only need a 24h rolling window
    // but keep a small buffer for clock skew / debugging.
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const trimmed = purchases.filter((p) => p.ts >= cutoff);
    window.localStorage.setItem(
      AD_FREE_PURCHASES_STORAGE_KEY,
      JSON.stringify(trimmed),
    );
  } catch {
    /* ignore */
  }
}

export function appendAdFreePurchase(p: AdFreePurchase): void {
  const purchases = readAdFreePurchases();
  purchases.push(p);
  writeAdFreePurchases(purchases);
}
