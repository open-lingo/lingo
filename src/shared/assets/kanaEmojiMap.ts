/**
 * Kana → emoji map derived from the course-atom registry. Split out of
 * `notoEmoji.ts` (2026-09-13) so callers that only need the pure
 * codepoint/flag/art URL helpers there (e.g. the language switcher, which
 * needs nothing but `notoFlagUrl`) don't statically pull in the full JA
 * course-atom table — this is the only piece of that module that does.
 *
 * See `notoEmoji.ts` for the rest of the emoji-URL resolver family.
 */

import {
  JA_COURSE_ATOMS,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";

/** Phase 2: route through the language registry per ADR-005. */
function courseAtomsFor(languageId: string): ReadonlyArray<CourseAtom> {
  if (languageId !== "ja") return [];
  return JA_COURSE_ATOMS;
}

/**
 * Kana → emoji map derived from the course-atom registry. Every atom that
 * carries an `emoji` field contributes one entry keyed by its `kana` surface
 * form. Used by `PhraseCardStepView` to render a glyph above the meaning
 * when the lesson author hasn't overridden it via `step.emoji`.
 *
 * Built at module-eval — single source of truth is `JA_COURSE_ATOMS`. No
 * separate hand-maintained mirror to drift out of sync.
 */
export const JA_KANA_EMOJI_MAP: ReadonlyMap<string, string> = new Map(
  courseAtomsFor("ja")
    .filter((a): a is typeof a & { emoji: string } => !!a.emoji)
    .map((a) => [a.kana, a.emoji]),
);

/**
 * Look up the canonical emoji for a kana surface form. Returns `null` when
 * the kana isn't in the course atom registry or its atom has no emoji.
 */
export function lookupKanaEmoji(kana: string): string | null {
  return JA_KANA_EMOJI_MAP.get(kana) ?? null;
}
