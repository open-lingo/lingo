import {
  useFeatureFlagsOptional,
} from "@/shared/contexts/FeatureFlagsContext";
import { DEFAULT_FEATURE_FLAGS } from "@/shared/config/featureFlags";
import { useAuth } from "@/shared/auth/useAuth";
import { useMe } from "@/shared/hooks/useMe";
import {
  getVisibleLearningLanguageIds,
  isCourseVisible,
  type BetaIdentity,
} from "@/shared/domain/betaAccess";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { Language } from "@/shared/domain/languages";

/**
 * THE single live (React) seam every learner-facing surface reads to
 * decide which learning-language ids are selectable RIGHT NOW for the
 * signed-in user — combines the live feature flags with the live identity
 * and hands both to the pure predicate in `shared/domain/betaAccess.ts`.
 * Every consumer — `LanguageContext` (feeds `LanguageSelector` /
 * `FloatingLanguagePill`), `LanguagePickerGrid` (feeds the Switch-language
 * modal + landing page), `useLang`/`LangLayout` (the `:lang` route guard,
 * which also gates `/:lang/learn/placement-test` and every dev QA route)
 * — calls this hook (or `useVisibleLearningLanguages` below) instead of
 * reading `AVAILABLE_LEARNING_LANGUAGE_IDS` directly, so the allow-list
 * check exists in exactly one place. docs/pt-course-design-2026-09-18.md
 * §5; `shared/domain/betaAccess.ts`'s header.
 *
 * Flags: `useFeatureFlagsOptional() ?? DEFAULT_FEATURE_FLAGS` — same
 * "safe outside the provider" pattern `PracticeBreadcrumbs.tsx` already
 * uses — rather than `useFeatureFlags()`'s throw. This hook is now called
 * from nav chrome (`LanguageSelector`/`FloatingLanguagePill`) rendered by
 * a very wide set of pages; those pages' existing tests should not have
 * to grow a `<FeatureFlagsProvider>` just because this gate exists, and
 * "no override yet" correctly reads as "beta flags all off" (the code
 * default), which is the fail-safe direction anyway.
 *
 * Identity is `[user?.email, me?.id]` — the Auth0/bypass claim's email
 * AND the internal `/users/me` id (`useMe()`) — because a user record
 * does not always carry an email client-side; `isPtBetaUser` admits on a
 * match against EITHER (lead addition, 2026-09-18). The `useMe()` call is
 * wrapped defensively: it already degrades to `me: null` without an
 * `<ApiProvider>` by design (its own doc comment), but a component test
 * elsewhere in the app that mocks `@/shared/api` with a partial shape
 * (missing `useApiOptional`) would otherwise throw a `TypeError` the
 * moment this widely-rendered hook reaches it — a test-infra accident
 * having nothing to do with PT visibility. The catch only ever fires on
 * that kind of setup error; in the real app `useMe()` never throws.
 */
function useSafeMe(): { id?: string } | null {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- see doc
    // comment above: the mock shape (if any) is fixed for a render tree's
    // lifetime, so this call's hook sequence is stable across re-renders.
    return useMe().me;
  } catch {
    return null;
  }
}

function useBetaIdentity(): BetaIdentity {
  const { user } = useAuth();
  const me = useSafeMe();
  return [user?.email, me?.id];
}

export function useVisibleLearningLanguageIds(): readonly string[] {
  const flags = useFeatureFlagsOptional() ?? DEFAULT_FEATURE_FLAGS;
  const identity = useBetaIdentity();
  return getVisibleLearningLanguageIds(flags, identity);
}

/** Same seam, resolved to full `Language` configs (id/name/flag) — what
 *  `LanguageContext`'s `languages` and `LanguagePickerGrid` actually
 *  render. Order follows `useVisibleLearningLanguageIds`'s order (base
 *  list order, `pt` appended last when visible). */
export function useVisibleLearningLanguages(): Language[] {
  const ids = useVisibleLearningLanguageIds();
  const langs: Language[] = [];
  for (const id of ids) {
    const cfg = getLanguageConfig(id);
    if (cfg) langs.push(cfg);
  }
  return langs;
}

/** Convenience: is `langId` visible to the signed-in user right now?
 *  Equivalent to `useVisibleLearningLanguageIds().includes(langId)` but
 *  reads as the lead's `isCourseVisible(langId, user)` decision directly. */
export function useIsCourseVisible(langId: string | null | undefined): boolean {
  const flags = useFeatureFlagsOptional() ?? DEFAULT_FEATURE_FLAGS;
  const identity = useBetaIdentity();
  if (!langId) return false;
  return isCourseVisible(langId, flags, identity);
}
