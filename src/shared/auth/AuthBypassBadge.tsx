import { AUTH_BYPASS } from "@/shared/auth/bypass";

/**
 * Permanent on-screen marker that this build is running with auth bypassed.
 *
 * Not decoration — it is control #3 of the three fencing the native bypass
 * (see `shared/auth/bypass.ts`). A bypassed build looks *exactly* like a real
 * signed-in one: same home screen, same lessons, same streak. Without a marker,
 * a screenshot from one is indistinguishable from the other, and "wait, was
 * that build authed?" is not a question anyone should have to answer from
 * memory a week later.
 *
 * `pointer-events-none` so it can never eat a tap, `fixed` so it doesn't
 * participate in the lesson shell's fixed-height layout, and bottom-LEFT
 * because the lesson CTA and the streak chip both live right.
 *
 * ⚠️ `bottom-safe-2` / `left-safe-2` OFFSET the badge past the home indicator.
 * The first cut instead added `env(safe-area-inset-bottom)` as bottom PADDING,
 * which on a notched iPhone is ~34px — the badge rendered as a big red slab
 * roughly 8× its intended height (caught in the iOS 26.5 simulator, 2026-08-06).
 * Safe-area insets belong in position, not padding, for a floating element.
 */
export function AuthBypassBadge() {
  // The bypass marker (control #3) moved onto the account avatar as a small red
  // ✕ (see AuthMenu) — the fixed bottom-left "NO AUTH" slab overlapped the new
  // bottom tab bar. Kept as a mounted no-op so main.tsx and the fencing story
  // stay intact; flip this back on if the avatar marker ever isn't rendered
  // (e.g. a signed-out surface with no AuthMenu).
  void AUTH_BYPASS;
  return null;
}
