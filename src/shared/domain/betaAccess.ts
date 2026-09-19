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
 *   - `allowlist` matches an identity string (email OR internal user id —
 *     see below) case-insensitively against
 *     `FeatureFlags.courses.ptBeta.allowlist`. A disabled flag or an empty/
 *     null identity is always `false` — this never defaults open.
 *
 * LEAD ADDITION (2026-09-18, mid-lane): a user record does not always
 * carry an email client-side, so every caller here passes BOTH the
 * signed-in Auth0/bypass user's email AND their internal user id (the
 * `id` field from `GET /users/me`, e.g.
 * `"e651cc3e-d8c3-4649-aca2-d014d8edd13a"` — `shared/api/users.ts`'s
 * `User.id`) as a single identity list; a match on EITHER admits. The
 * allowlist itself is one flat array holding a mix of emails and ids —
 * `["spencer@lichfieldfamily.com", "e651cc3e-d8c3-4649-aca2-d014d8edd13a"]`
 * is a valid two-person allowlist (Spencer by email, a second person by
 * id) — there is no separate id/email field, `mergeFeatureFlags` doesn't
 * care which kind of string each entry is, and the compare is
 * case-insensitive either way (a UUID's case never matters, an email's
 * never should).
 *
 * UPDATE (lane/PTBETA, 2026-09-18): the PTINFRA lane that wrote this file
 * deliberately left it unwired — every UI surface read
 * `AVAILABLE_LEARNING_LANGUAGE_IDS` directly. That wiring is now done:
 * `isCourseVisible` below is the single predicate, and
 * `shared/hooks/useVisibleLearningLanguageIds.ts` is the one React seam
 * (feature flags + the signed-in Auth0/bypass user's email) every
 * consumer — `LanguageContext`'s `languages` (feeds `LanguageSelector` /
 * `FloatingLanguagePill`), `LanguagePickerGrid` (feeds the Switch-language
 * modal + landing page), `useLang`/`LangLayout` (the `:lang` route guard,
 * which is also what gates `/pt/learn/placement-test`) — now calls,
 * instead of re-implementing the allow-list compare per component. This
 * file itself stays pure/hook-free by design; only the new hook file
 * touches React.
 */
import type { FeatureFlags } from "@/shared/config/featureFlags";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "./languageConfig";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** One identity token (email or user id), or several — e.g.
 *  `[user?.email, me?.id]`, where either may be missing while the other
 *  resolves first. `null`/`undefined` entries (and a bare `null`/
 *  `undefined` identity) are simply ignored, never treated as a match. */
export type BetaIdentity =
  | string
  | null
  | undefined
  | ReadonlyArray<string | null | undefined>;

function identityList(identity: BetaIdentity): string[] {
  const raw = Array.isArray(identity) ? identity : [identity];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

/** True when ANY of `identity`'s tokens (an email, a user id, or a list
 *  of either) is on the `ptBeta` allow-list AND the flag itself is
 *  enabled. Never throws; a missing/disabled flag or an identity with no
 *  usable tokens is always `false`. */
export function isPtBetaUser(
  flags: FeatureFlags,
  identity: BetaIdentity,
): boolean {
  const flag = flags.courses.ptBeta;
  if (!flag?.enabled) return false;
  const needles = identityList(identity).map(normalize);
  if (needles.length === 0) return false;
  const allow = flag.allowlist.map(normalize);
  return needles.some((needle) => allow.includes(needle));
}

/** `AVAILABLE_LEARNING_LANGUAGE_IDS` plus `"pt"` when `identity` is a
 *  `ptBeta` allow-listed user. Returns the SAME array reference (not a
 *  copy) when nothing is added, so a caller doing identity comparisons on
 *  the base list is unaffected either way. */
export function getVisibleLearningLanguageIds(
  flags: FeatureFlags,
  identity: BetaIdentity,
): readonly string[] {
  if (!isPtBetaUser(flags, identity)) return AVAILABLE_LEARNING_LANGUAGE_IDS;
  return [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"];
}

/**
 * `isCourseVisible(langId, user)` — the lead's decision (docs/pt-course-
 * design-2026-09-18.md §5 follow-up): registry visibility AND (not a beta
 * course OR (its flag is enabled AND the user is allow-listed)). Today
 * "registry visibility" for a non-beta id is `AVAILABLE_LEARNING_
 * LANGUAGE_IDS` membership and the only beta course is `pt`, so this is a
 * thin, literal wrapper over `getVisibleLearningLanguageIds` — same
 * identity/flags contract, single source of truth so no call site
 * re-implements the allow-list compare. THE seam every UI surface (lang
 * switcher, course/Learn pickers, placement's language resolution, the
 * `:lang` route guard) is meant to call — see
 * `shared/hooks/useVisibleLearningLanguageIds.ts` for the live (React)
 * wiring of this pure function. */
export function isCourseVisible(
  langId: string,
  flags: FeatureFlags,
  identity: BetaIdentity,
): boolean {
  return getVisibleLearningLanguageIds(flags, identity).includes(langId);
}
