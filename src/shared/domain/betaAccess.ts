/**
 * Beta-course visibility — a narrow per-user allow-list gate for a course
 * that has a feature flag but no general release yet (docs/pt-course-
 * design-2026-09-18.md §5: "no existing per-user allowlist mechanism
 * found — needs a small design decision from the infra lane"). This is
 * that decision, resolved narrowly:
 *
 *   - The flag lives in `FeatureFlags.courses` (`shared/config/
 *     featureFlags.ts`), same typed-default + runtime-JSON-override
 *     mechanism every other flag uses — NOT a bespoke JSON import. Callers
 *     pass a `FeatureFlags` value explicitly (`getCachedFeatureFlags()` for
 *     the synchronous last-resolved snapshot, same as
 *     `isLeaderboardEnabled`/`isSocialEnabled`/`isCommunityEnabled` in that
 *     file), so this file stays a pure, trivially-testable function set
 *     with no hidden global reads.
 *   - `allowlist` matches an identity string (email or user id — whichever
 *     the caller has on hand) case-insensitively against
 *     `FeatureFlags.courses.ptBeta.allowlist`. A disabled flag or an empty/
 *     null identity is always `false` — this never defaults open.
 *
 * WHAT THIS LANE DOES NOT DO: wire a real user identity into
 * Switch-language, the course map, placement, or the boot payload. Those
 * surfaces all read `AVAILABLE_LEARNING_LANGUAGE_IDS`
 * (`languageConfig.ts`) directly and are therefore completely unaffected
 * by this file's existence — which is exactly the "no-op for every
 * existing course and every user without the flag" property this lane
 * owes. `getVisibleLearningLanguageIds` below is the tested seam a future
 * lane calls once PT has lesson content worth showing to the two
 * allow-listed users; it is not called from application code yet.
 */
import type { FeatureFlags } from "@/shared/config/featureFlags";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "./languageConfig";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** True when `identity` (an email or a user id) is on the `ptBeta`
 *  allow-list AND the flag itself is enabled. Never throws; a missing/
 *  disabled flag or a falsy identity is always `false`. */
export function isPtBetaUser(
  flags: FeatureFlags,
  identity: string | null | undefined,
): boolean {
  const flag = flags.courses.ptBeta;
  if (!flag?.enabled || !identity) return false;
  const needle = normalize(identity);
  return flag.allowlist.some((entry) => normalize(entry) === needle);
}

/** `AVAILABLE_LEARNING_LANGUAGE_IDS` plus `"pt"` when `identity` is a
 *  `ptBeta` allow-listed user. Returns the SAME array reference (not a
 *  copy) when nothing is added, so a caller doing identity comparisons on
 *  the base list is unaffected either way. Not wired into any UI surface
 *  by this lane — see the file header. */
export function getVisibleLearningLanguageIds(
  flags: FeatureFlags,
  identity: string | null | undefined,
): readonly string[] {
  if (!isPtBetaUser(flags, identity)) return AVAILABLE_LEARNING_LANGUAGE_IDS;
  return [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"];
}
