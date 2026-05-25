/**
 * Anti-grind heuristic for ad-free purchases.
 *
 * The user's intent (verbatim spec quote):
 *   "more ad usage than we would normally have by people grinding lingots
 *    gets no ad times"
 *
 * In other words: ad-free time is a reward for genuine learning, not an
 * arbitrage between "earn 800 lingots fast → 24h ad-free → no revenue
 * from this user". If someone is clearly farming, we deny the purchase.
 *
 * Heuristic (see `config.ts` for tunables):
 *   1. Sum lingots earned in the last 24h from `lingotEvents`.
 *   2. Sum active minutes in the last 24h from the same log
 *      (events ≤ 5 min apart count as a single continuous "active"
 *      stretch — cheap-and-cheerful active-time estimate).
 *   3. lingotsPerActiveMinute = lingots / max(active, MIN_ACTIVE).
 *   4. Trip the flag iff BOTH:
 *        - lingots > GRIND_LINGOTS_24H_THRESHOLD
 *        - lingotsPerActiveMinute > GRIND_LINGOTS_PER_MINUTE_THRESHOLD
 *
 * The dual threshold is deliberate: a user who finishes their first
 * lesson at a perfect score is fast, but won't have the volume; a
 * marathon-but-genuine learner has the volume but a normal per-minute
 * rate. Only the intersection (high volume × high rate) catches actual
 * grinding patterns.
 */
import {
  GRIND_LINGOTS_24H_THRESHOLD,
  GRIND_LINGOTS_PER_MINUTE_THRESHOLD,
  GRIND_MIN_ACTIVE_MINUTES,
  GRIND_WINDOW_MS,
} from "./config";
import { readLingotEvents, type LingotEvent } from "./storage";

/** Treat events within this gap as a single continuous activity stretch. */
const ACTIVE_GAP_MS = 5 * 60 * 1000;

export type GrindSnapshot = {
  /** lingots earned in the last 24h */
  last24hLingotsEarned: number;
  /** estimated active minutes in the last 24h */
  activeMinutes24h: number;
  /** lingots ÷ max(activeMinutes, MIN) */
  lingotsPerActiveMinute: number;
  /** the heuristic verdict */
  isGrinding: boolean;
};

/**
 * Compute active minutes by collapsing events that are ≤ ACTIVE_GAP_MS
 * apart into a single "session" and summing those session durations.
 *
 * A standalone event (no neighbour within the gap) contributes the gap
 * itself as a minimum — without this, a single fast lesson registers
 * as ~0 minutes of activity and inflates lingots/min unfairly.
 */
function computeActiveMinutes(events: LingotEvent[]): number {
  if (events.length === 0) return 0;
  const sorted = [...events].sort((a, b) => a.ts - b.ts);
  let totalMs = 0;
  let sessionStart = sorted[0].ts;
  let sessionEnd = sorted[0].ts;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].ts - sessionEnd;
    if (gap <= ACTIVE_GAP_MS) {
      sessionEnd = sorted[i].ts;
    } else {
      totalMs += Math.max(sessionEnd - sessionStart, ACTIVE_GAP_MS);
      sessionStart = sorted[i].ts;
      sessionEnd = sorted[i].ts;
    }
  }
  totalMs += Math.max(sessionEnd - sessionStart, ACTIVE_GAP_MS);
  return totalMs / 60_000;
}

export function getGrindSnapshot(
  now: number,
  events: LingotEvent[] = readLingotEvents(),
): GrindSnapshot {
  const cutoff = now - GRIND_WINDOW_MS;
  const recent = events.filter((e) => e.ts >= cutoff);
  const last24hLingotsEarned = recent.reduce((sum, e) => sum + e.amount, 0);
  const activeMinutes24h = computeActiveMinutes(recent);
  const denom = Math.max(activeMinutes24h, GRIND_MIN_ACTIVE_MINUTES);
  const lingotsPerActiveMinute = last24hLingotsEarned / denom;
  const isGrinding =
    last24hLingotsEarned > GRIND_LINGOTS_24H_THRESHOLD &&
    lingotsPerActiveMinute > GRIND_LINGOTS_PER_MINUTE_THRESHOLD;
  return {
    last24hLingotsEarned,
    activeMinutes24h,
    lingotsPerActiveMinute,
    isGrinding,
  };
}
