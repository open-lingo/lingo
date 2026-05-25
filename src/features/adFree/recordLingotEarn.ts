/**
 * Public helper for other features (lesson, practice, streak, …) to log
 * a lingot-earn event into the rolling window the grind detector reads.
 *
 * Cheap, idempotent, side-effect-only: just appends to localStorage.
 * Callers don't need to thread state through React — call once per
 * earn event, on whatever code path actually credits lingots.
 */
import { appendLingotEvent } from "./storage";

export function recordLingotEarn(
  amount: number,
  source: string,
  now: number = Date.now(),
): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  appendLingotEvent({ ts: now, amount: Math.round(amount), source });
}
