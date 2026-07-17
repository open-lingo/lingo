/**
 * BUILD-TILE KANJI DERIVATION (Spencer pedagogy ruling, 2026-07-17):
 * build-tile banks must stop being kana-only — once a word's kanji is
 * unlocked at the lesson's module, the tile DISPLAYS the kanji form
 * ("they NEED the exposure"). Furigana handling (FSRS-mastery-gated) is
 * the renderer's job — see `useBuildTileKanji` in
 * `features/lesson/components/steps/BuildTileSurface.tsx`; this module is
 * the pure, testable "may this tile kanji-fy, and into what" question.
 *
 * DISPLAY-ONLY, like every other piece of the kanji surface layer: the
 * step's `tiles` / `correctOrder` / comparison logic stay the KANA
 * strings. Callers substitute the returned `surface` at render time only.
 *
 * GATES, in order (all reused from the shipped sentence-kanji layer —
 * never reimplemented):
 *   1. `moduleIndex != null` — outside a lesson (practice decks, previews)
 *      there is no module position, so no kanji-fication. Mirrors the
 *      LessonModuleContext "null = unknown = behave as before" contract.
 *   2. `resolveEligibleKanjiAtomId(kana)` (grammarHelpers) — the SAME
 *      conservative resolver sentence substitution uses: non-homograph
 *      kana, actually taught, in the `KANJI_ELIGIBLE_ATOMS` rollout
 *      catalog, not a slice-prone number kanji, not colliding with a
 *      verb/adjective inflection. Anything ambiguous stays kana.
 *   3. `moduleIndex >= unlockModule` — the rollout schedule gate
 *      (`KANJI_ELIGIBLE_ATOMS`, MAX over component kanji, floored at the
 *      m8 recognition start). Below unlock: kana as today.
 *
 * NOT gated here: granularity. Character-granularity builds (kana
 * decoding drills) are excluded by the CALLER — kana IS their content and
 * their single-kana tiles would never resolve anyway; the caller-side
 * gate keeps that exclusion explicit rather than incidental.
 */
import { resolveEligibleKanjiAtomId } from "../grammarHelpers";
import { KANJI_ELIGIBLE_ATOMS } from "./applyKanjiSurfaces";

export type BuildTileKanji = {
  /** Kanji display surface for the tile (e.g. 店 / 食べる / 電車). */
  surface: string;
  /** The tile's kana — the furigana reading AND the grading identity. */
  reading: string;
  /** Course atom id, for the FSRS mastery lookup (furigana on/off). */
  atomId: string;
};

/**
 * The kanji display form for a build tile, or `null` when the tile must
 * stay kana (outside a lesson, ambiguous/ineligible kana, or the lesson's
 * module hasn't unlocked the kanji yet). Pure — no store reads.
 */
export function resolveBuildTileKanji(
  kana: string,
  moduleIndex: number | null,
): BuildTileKanji | null {
  if (moduleIndex == null) return null; // outside a lesson → never
  const atomId = resolveEligibleKanjiAtomId(kana);
  if (!atomId) return null; // homograph / untaught / ineligible → stay kana
  const entry = KANJI_ELIGIBLE_ATOMS.get(atomId);
  if (!entry) return null; // defensive; resolver already checked membership
  if (moduleIndex < entry.unlockModule) return null; // not unlocked yet
  return { surface: entry.kanji, reading: kana, atomId };
}
