/**
 * Streak-check gating for lesson batch sync.
 *
 * The server's streak-update path costs a per-attempt GetItem +
 * conditional UpdateItem on the user row. We only need it the *first*
 * time the user transacts on a given local day — every other batch sync
 * the same day can skip that work entirely.
 *
 * This module owns a tiny per-day flag in localStorage:
 *
 *   key:   "open-lingo-last-streak-sync"
 *   value: "YYYY-MM-DD" in the user's local timezone (toLocaleDateString
 *          en-CA happens to format that way without padding fuss).
 *
 * `shouldCheckStreakOnNextSync()` returns true when the flag is absent or
 * doesn't match today. The sync layer reads it, attaches `checkStreak`
 * to the batch payload, and on a successful response calls
 * `markStreakCheckedToday()` so we don't ask again until the user's
 * local clock rolls past midnight.
 *
 * NOTE: there is intentionally no server-side check. The server trusts
 * the flag — it's an optimisation hint, not a security boundary. The
 * worst case if the flag is wrong is one extra (or one skipped) cheap
 * UpdateItem on the user row, which the next sync corrects.
 */

const KEY = "open-lingo-last-streak-sync";

/** Local-date YYYY-MM-DD string. en-CA's date format is ISO-like and
 *  unambiguous across locales — good enough as a date key. */
function todayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function shouldCheckStreakOnNextSync(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return true;
    return stored !== todayLocal();
  } catch {
    // localStorage unavailable — err on the side of asking the server.
    return true;
  }
}

export function markStreakCheckedToday(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, todayLocal());
  } catch {
    /* quota / private mode — fine, we'll just re-ask on next sync */
  }
}

/** Force the next sync to re-check streak (e.g. on fresh Auth0 login). */
export function clearStreakCheckMarker(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
