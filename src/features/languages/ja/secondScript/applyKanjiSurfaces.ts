/**
 * KANJI SURFACE POST-PASS (v1, LIVE — spec docs/kanji-implementation-spec-
 * 2026-07-16.md §2, owner policy in ./kanjiRollout.ts).
 *
 * Runs on the SHAPED lesson inside `getMockLessonContent`, beside the
 * `padBuildTileFloor` / `padMatchPairsFloor` precedents. It rewrites the
 * *display* of single-atom Japanese surfaces from kana to their kanji form
 * (with furigana while inside the rolling window), and TOUCHES NOTHING ELSE.
 *
 * WHY A POST-PASS, KEYED ON atomId (not kana):
 *   - It has the shaped lesson's `moduleId`, so the eligibility gate
 *     `unlockModule <= learnerModule` needs zero new plumbing.
 *   - It edits ONLY `*Annotation` fields (the ruby display data). It never
 *     visits `audioKey` / `audioText` / `targetPhrase` / `pair.source` /
 *     tiles / `correctOrder` / `acceptedAnswers`, so a kanji display can never
 *     desync the TTS key or the grader. The audio + grading invariants are
 *     STRUCTURAL, not disciplinary (property test proves it).
 *   - It keys on the annotation's authored `atomId`, never on re-deriving from
 *     kana. Homograph kana collapse in `JA_COURSE_ATOMS_BY_KANA` (に → number
 *     "two" OR particle `p-ni`, whichever inserted last), so a kana-keyed pass
 *     would render the particle に as 二. atomId avoids that entirely.
 *
 * SCOPE (v1 + sentence layer):
 *   - PER-SEGMENT, atomId-gated. Historically single-atom only
 *     (`buildSingletonAnnotation` wraps a one-element array). Sentence
 *     factories now emit MULTI-segment annotations — one segment per token,
 *     with an `atomId` attached only on unambiguously-resolvable eligible
 *     words (grammarHelpers.buildSentenceAnnotation). This pass maps over
 *     every segment and rewrites each independently; a segment with no
 *     `atomId` (kana filler / particle / conjugated form / ambiguous
 *     homograph) is left untouched, so a sentence kanji-fies only its safe,
 *     eligible words and everything else stays kana. Adding atomIds happens in
 *     the FACTORY (pre-pass), so the atomId multiset is identical pre/post here.
 *   - DICTIONARY-FORM only. The 6 polite `-ます` anchorVocab forms carry no
 *     stored kanji (their dictionary siblings do) → naturally skipped here.
 *     Routing them through `writtenForms.writtenSegments` is v1.1.
 *   - MULTI-KANJI words gate on the MAX of their component kanji unlock
 *     modules (電車 waits for BOTH 電 and 車), and are excluded entirely if any
 *     component kanji is absent from the `N5_KANJI` catalog (post the
 *     2026-07-18 m23‑27 backfill that's non-N5 glyphs: 時計's 計, 友達's 達).
 *
 * FURIGANA CONVENTION (Spencer 2026-07-17 — window floor OR unmastered):
 *   A substituted segment sets `surface = <kanji>` and ALWAYS keeps
 *   `reading = <kana>` (the furigana), plus `furiganaWindowOpen` — whether the
 *   lesson module still sits inside the kanji's unlock+FURIGANA_WINDOW grace
 *   window. The RENDERER (AnnotatedText's kanji branch) decides visibility:
 *   in-window ⇒ furigana shows regardless of SRS state (the floor — newly
 *   appeared kanji keep furigana even for long-mastered atoms), past the
 *   window ⇒ furigana stays until the atom is FSRS-mastered. The historical
 *   v1 convention encoded the window IN DATA (`reading = surface` past the
 *   window ⇒ "nothing to float", permanently bare) — that shape is still
 *   honored by the renderer for segments WITHOUT `furiganaWindowOpen`, which
 *   is exactly how `kanji_reading` prompts keep suppressing their answer
 *   (surface === reading === kanji, authored in the factory, never rewritten
 *   here because the surface already carries Han).
 */
import type { LessonContent, LessonStep } from "../../../lesson/types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";
import {
  JA_COURSE_ATOMS_BY_ID,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";
import { N5_KANJI } from "./n5Kanji";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";
import {
  KANJI_RECOGNITION_MODULE,
  furiganaVisibleAt,
} from "./kanjiRollout";

// TODO: unify with containsKanji (shared/readingAnnotation, landing in a
// concurrent workstream). Local Han detector until that helper is exported;
// mirrors the audit test's `/\p{Script=Han}/u`.
const HAS_HAN = /\p{Script=Han}/u;
function hasHan(s: string): boolean {
  return HAS_HAN.test(s);
}

/**
 * The dictionary-form kanji surface for an atom: the FIRST Han-bearing token
 * of `CourseAtom.kanji`. The field may hold alternates ("川 / 河", "見る  観る")
 * or be pure kana ("いい / よい"); we take the first token that contains Han,
 * else null (atom is not kanji-substitutable). Identical to the audit's
 * `kanjiSurface` so v1's firing set matches the dry-run numbers.
 */
function dictionaryKanjiSurface(atom: CourseAtom | undefined): string | null {
  if (!atom?.kanji) return null;
  const first = atom.kanji.split(/[\s/]+/).find((t) => hasHan(t));
  return first ?? null;
}

/** Distinct Han characters in a surface (multi-kanji component set). */
function hanComponents(surface: string): string[] {
  const set = new Set<string>();
  for (const ch of surface) if (hasHan(ch)) set.add(ch);
  return [...set];
}

export type KanjiEligibleEntry = {
  /** Dictionary-form kanji surface to display, e.g. 駅 / 食べる / 電車. */
  kanji: string;
  /**
   * Module at/after which this surface may show as kanji. MAX over the
   * surface's component kanji `introducedAtModule` (a multi-kanji word waits
   * for its LAST component), floored at `KANJI_RECOGNITION_MODULE`.
   */
  unlockModule: number;
};

/**
 * atomId → eligibility, built once at module load from the `N5_KANJI`
 * schedule. An atom is eligible iff:
 *   1. it appears in some `N5_KANJI[i].anchorVocab` (the curated allowlist),
 *   2. it resolves to a CourseAtom carrying a kanji surface (skips the 6 `-ます`
 *      forms), and
 *   3. EVERY component kanji of that surface has an `N5_KANJI` catalog entry
 *      (so a word is never shown before all its kanji are teachable — this
 *      excluded the m23‑27 catalog-gap words until the 2026-07-18 backfill;
 *      it still excludes non-N5 glyphs like 計 in 時計 and 達 in 友達).
 *
 * `unlockModule` is the MAX of the component kanji modules (the spec's correct
 * multi-kanji gate), floored at the m8 recognition start.
 */
export const KANJI_ELIGIBLE_ATOMS: ReadonlyMap<string, KanjiEligibleEntry> =
  buildEligibleMap();

function buildEligibleMap(): Map<string, KanjiEligibleEntry> {
  // component kanji character → earliest module it is taught
  const moduleOfKanji = new Map<string, number>();
  for (const k of N5_KANJI) {
    const prev = moduleOfKanji.get(k.character);
    if (prev === undefined || k.introducedAtModule < prev) {
      moduleOfKanji.set(k.character, k.introducedAtModule);
    }
  }

  // curated allowlist: every atom id any kanji entry anchors
  const allowlist = new Set<string>();
  for (const k of N5_KANJI) for (const id of k.anchorVocab) allowlist.add(id);

  const out = new Map<string, KanjiEligibleEntry>();
  for (const atomId of allowlist) {
    const atom = JA_COURSE_ATOMS_BY_ID.get(atomId);
    const surface = dictionaryKanjiSurface(atom);
    if (!surface) continue; // no kanji form (e.g. -ます forms) — skip in v1
    const components = hanComponents(surface);
    // Every component kanji must be in the catalog; else we can't guarantee
    // the learner has met each glyph — skip (non-N5 glyphs, e.g. 計/達).
    let maxModule = 0;
    let allKnown = true;
    for (const ch of components) {
      const m = moduleOfKanji.get(ch);
      if (m === undefined) {
        allKnown = false;
        break;
      }
      if (m > maxModule) maxModule = m;
    }
    if (!allKnown) continue;
    out.set(atomId, {
      kanji: surface,
      unlockModule: Math.max(maxModule, KANJI_RECOGNITION_MODULE),
    });
  }
  return out;
}

/** Module number for the lesson: prefer the canonical `moduleId` ("m8"),
 *  fall back to parsing the lesson id ("ja-m10-review-1" → 10). Returns 0 for
 *  anything unrecognized (placement, sidequests) → below the m8 floor → no-op.
 */
function lessonModuleNumber(lesson: LessonContent): number {
  const m = /^m(\d+)$/.exec(lesson.moduleId);
  if (m) return parseInt(m[1], 10);
  return parseModuleIndex(lesson.id);
}

/**
 * Rewrite one annotation segment if its atom is kanji-eligible AND unlocked at
 * `learnerModule`. Only un-substituted pure-kana surfaces (`surface ===
 * reading`) are touched — never a segment already carrying kanji or a
 * mismatched reading. Returns the SAME reference when unchanged.
 */
function rewriteSegment(
  seg: JapaneseAnnotation,
  learnerModule: number,
): JapaneseAnnotation {
  if (!seg.atomId) return seg;
  const entry = KANJI_ELIGIBLE_ATOMS.get(seg.atomId);
  if (!entry) return seg;
  if (learnerModule < entry.unlockModule) return seg;
  // Only substitute a clean, un-substituted KANA surface: surface === reading
  // AND still pure kana. This skips segments already carrying kanji — both a
  // substituted segment (surface !== reading, kana kept as furigana) and the
  // kanji_reading suppression shape (surface === reading === kanji, which has
  // Han — the factory's deliberate "answer never floats" prompt) — so the
  // pass is idempotent and can never re-attach a reading to a tested kanji.
  if (seg.surface !== seg.reading || hasHan(seg.surface)) return seg;
  return {
    ...seg,
    surface: entry.kanji,
    // ALWAYS keep the kana as the reading — visibility is the renderer's
    // call (window floor OR unmastered), so the data must never destroy the
    // furigana. `furiganaWindowOpen` tells the renderer the window state.
    reading: seg.reading,
    furiganaWindowOpen: furiganaVisibleAt(learnerModule, entry.unlockModule),
  };
}

/** Rewrite a single annotation array (JapaneseAnnotation[]). Each segment is
 *  rewritten INDEPENDENTLY: `rewriteSegment` gates every segment on its own
 *  `atomId` + eligibility + furigana window, so this is safe for both the
 *  historical single-atom arrays (length 1) AND the multi-segment sentence
 *  annotations the sentence factories now emit (one segment per token, with an
 *  atomId only on unambiguously-resolvable eligible words — see
 *  grammarHelpers.buildSentenceAnnotation). Segments without an atomId (kana
 *  fillers, particles, conjugated forms, ambiguous homographs) return
 *  themselves from `rewriteSegment` and stay kana. Same reference when nothing
 *  in the array changed. */
function rewriteAnnotationArray(
  arr: JapaneseAnnotation[],
  learnerModule: number,
): JapaneseAnnotation[] {
  let changed = false;
  const next = arr.map((seg) => {
    const r = rewriteSegment(seg, learnerModule);
    if (r !== seg) changed = true;
    return r;
  });
  return changed ? next : arr;
}

/**
 * Rewrite the value at a `*Annotation` key. Two shapes occur:
 *   - `JapaneseAnnotation[]`            (promptAnnotation, sourceAnnotation, …)
 *   - `(JapaneseAnnotation[]|undefined)[]` (optionAnnotations — a list of them)
 * Distinguished by whether the elements are themselves arrays.
 */
function rewriteAnnotationValue(value: unknown, learnerModule: number): unknown {
  if (!Array.isArray(value) || value.length === 0) return value;
  const listOfArrays = value.some((el) => Array.isArray(el));
  if (listOfArrays) {
    let changed = false;
    const next = value.map((el) => {
      if (!Array.isArray(el)) return el;
      const r = rewriteAnnotationArray(el as JapaneseAnnotation[], learnerModule);
      if (r !== el) changed = true;
      return r;
    });
    return changed ? next : value;
  }
  return rewriteAnnotationArray(value as JapaneseAnnotation[], learnerModule);
}

/** A key holds annotation display data iff it ends in "Annotation" (a single
 *  array, e.g. promptAnnotation/sourceAnnotation) or its plural "Annotations"
 *  (a list of arrays, e.g. optionAnnotations — the shape `rewriteAnnotationValue`'s
 *  listOfArrays branch was written for). Both are display-only; audio/grading
 *  keys match neither. The plural was previously missed, which left the
 *  listOfArrays branch unreachable and MCQ option surfaces stuck as kana. */
function isAnnotationKey(key: string): boolean {
  return key.endsWith("Annotation") || key.endsWith("Annotations");
}

/**
 * Deep-walk a node, rewriting ONLY values under annotation keys (see
 * `isAnnotationKey` — the spec's display-fields-only discipline; audio/grading
 * keys never match). Recurses into arrays + plain objects so nested step
 * structures (row_test items[].payload) are covered. Returns the SAME reference
 * when nothing beneath it changed, keeping every untouched field referentially
 * identical (audio/grading immutability is then trivially deep-equal).
 */
function processNode(node: unknown, learnerModule: number): unknown {
  if (Array.isArray(node)) {
    let changed = false;
    const next = node.map((el) => {
      const r = processNode(el, learnerModule);
      if (r !== el) changed = true;
      return r;
    });
    return changed ? next : node;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const r = isAnnotationKey(key)
        ? rewriteAnnotationValue(val, learnerModule)
        : processNode(val, learnerModule);
      if (r !== val) changed = true;
      next[key] = r;
    }
    return changed ? next : node;
  }
  return node;
}

/**
 * Post-pass entry point. Substitutes eligible single-atom kana surfaces with
 * their kanji form (furigana per the rolling window) across every `*Annotation`
 * field in the lesson. No-op (same reference) for non-JA lessons, lessons below
 * the m8 recognition floor, and lessons with no eligible surface.
 */
export function applyKanjiSurfaces(lesson: LessonContent): LessonContent {
  if (lesson.languageId !== "ja") return lesson;
  const learnerModule = lessonModuleNumber(lesson);
  if (learnerModule < KANJI_RECOGNITION_MODULE) return lesson; // m1‑7 hard floor
  const steps = processNode(lesson.steps, learnerModule) as LessonStep[];
  return steps === lesson.steps ? lesson : { ...lesson, steps };
}
