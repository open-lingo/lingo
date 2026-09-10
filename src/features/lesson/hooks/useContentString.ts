/**
 * Shared call-site wrapper for `resolveContentString` (rung 1b — see
 * `src/shared/i18n/content/resolveContentString.ts` for the lookup
 * contract, and `src/shared/i18n/content/anchors.ts` for the anchor
 * formulas step views use to build the `anchor` argument).
 *
 * Every step view wiring KO-source content strings calls this instead of
 * `resolveContentString` directly so `uiLocale` is read from the app's real
 * i18next instance exactly once, in one place, with the defensive handling
 * a bare `useTranslation().i18n.language` read doesn't get for free:
 *
 *   - `i18n` can be `undefined` — several existing step-view test files
 *     `vi.mock("react-i18next", ...)` to return only `{ t }` (no `i18n`
 *     key at all; see `renderGate.tsx` and most `*StepView.test.tsx`
 *     files), so a bare `.i18n.language` throws under those mocks. Optional
 *     chaining here keeps this hook safe to call from ANY step view test,
 *     mocked or not.
 *   - A falsy/undefined locale (no `i18n`, or `i18n.language` unset) is
 *     treated the same as `uiLocale === "en"` — pass the English text
 *     straight through rather than attempting a lookup.
 *
 * `languageId`/`moduleId` are NOT read from `useLanguage()` (React
 * context) — several step-view unit tests mount their component with no
 * `LanguageProvider`, and `useLanguage()` throws without one (see
 * `src/shared/contexts/LanguageContext.tsx`). Instead, callers pass the
 * step's `lessonId` (or `step.id` as a fallback — every step id carries the
 * same `<languageId>-m<N>-...` prefix as its parent lesson id, per
 * `moduleCompiler.ts`'s `sid()`/`lid` construction) and this hook parses
 * `languageId`/`moduleId` out of that string via `courseIdsFromLessonId`.
 * When parsing fails (untagged/synthetic id), this safely returns `enText`
 * unchanged — same as if no catalog existed.
 */
import { useTranslation } from "react-i18next";
import { resolveContentString } from "@/shared/i18n/content/resolveContentString";
import { courseIdsFromLessonId } from "@/shared/i18n/content/anchors";

/**
 * Resolve one learner-facing string for the current UI locale.
 *
 * @param lessonId The step's lesson id (or the step's own id as a
 *   fallback) — used only to derive `languageId`/`moduleId` for the anchor
 *   lookup, never rendered.
 * @param anchor The stable content anchor, built via a helper in
 *   `anchors.ts` (e.g. `hintAnchor(moduleId, lessonId, enText)`) — pass
 *   `null` to skip resolution entirely (e.g. an optional field that isn't
 *   present), same as if no catalog existed.
 * @param enText The current English string this would otherwise render.
 *   Always the fallback / "source of truth" value.
 */
export function useContentString(
  lessonId: string | undefined | null,
  anchor: string | null,
  enText: string,
): string {
  const { i18n } = useTranslation();
  const uiLocale = i18n?.language;

  if (!uiLocale || uiLocale === "en" || !anchor) return enText;

  const ids = courseIdsFromLessonId(lessonId);
  if (!ids) return enText;

  return resolveContentString(ids.languageId, anchor, enText, uiLocale);
}

/**
 * Batch variant of `useContentString` for a list rendered via `.map()` —
 * e.g. MCQ `options[].text` — where calling the singular hook once per item
 * inside the loop would be a hooks-in-a-loop footgun. Calls
 * `useTranslation()` exactly once and resolves every item synchronously
 * against the same `uiLocale`, preserving array order/length 1:1 with
 * `items`.
 */
export function useContentStrings(
  lessonId: string | undefined | null,
  items: Array<{ anchor: string | null; enText: string }>,
): string[] {
  const { i18n } = useTranslation();
  const uiLocale = i18n?.language;

  if (!uiLocale || uiLocale === "en") return items.map((it) => it.enText);

  const ids = courseIdsFromLessonId(lessonId);
  if (!ids) return items.map((it) => it.enText);

  return items.map((it) =>
    it.anchor
      ? resolveContentString(ids.languageId, it.anchor, it.enText, uiLocale)
      : it.enText,
  );
}
