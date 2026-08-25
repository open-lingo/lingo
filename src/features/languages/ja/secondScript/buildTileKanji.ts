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
 * Gate 2 has an INFLECTED-FORM extension (2026-07-17): kana that is a real
 * conjugated form of a kanji-eligible verb/い-adjective resolves through the
 * memoized `inflectedTileKanjiMap` (のまない → 飲まない) under the same
 * eligibility + unlock gates — see its doc comment below.
 *
 * NOT gated here: granularity. Character-granularity builds (kana
 * decoding drills) are excluded by the CALLER — kana IS their content and
 * their single-kana tiles would never resolve anyway; the caller-side
 * gate keeps that exclusion explicit rather than incidental.
 */
import { resolveEligibleKanjiAtomId } from "../grammarHelpers";
import { KANJI_ELIGIBLE_ATOMS } from "./applyKanjiSurfaces";
import {
  conjugateVerb,
  conjugateIAdj,
  CHAIN_FORM_LABELS,
  type ChainForm,
  type IAdjForm,
} from "../conjugationEngine";
import { VERB_ENTRIES, ADJ_ENTRIES } from "../conjugationTables";
import { writtenSegments } from "../writtenForms";
import { JA_COURSE_ATOMS, JA_COURSE_ATOMS_BY_KANA } from "../courseAtoms";

export type BuildTileKanji = {
  /** Kanji display surface for the tile (e.g. 店 / 食べる / 電車). */
  surface: string;
  /** The tile's kana — the furigana reading AND the grading identity. */
  reading: string;
  /** Course atom id, for the FSRS mastery lookup (furigana on/off). */
  atomId: string;
};

/**
 * INFLECTED FORMS (Spencer QA 2026-07-17, m29-3-1: のまない — the CORRECT
 * answer — stayed kana while its citation-form distractor のむ kanji-fied:
 * inconsistent AND a subtle answer leak). Citation-kana resolution alone
 * can't see conjugated tiles, so we enumerate the REAL inflected surfaces of
 * every kanji-eligible verb (and い-adjective) via the shipped conjugation
 * engine into a memoized kana → {kanji surface, atomId} map:
 * のまない → 飲まない, のみます → 飲みます, たかかった → 高かった …
 *
 * The written form derives by `writtenForms.writtenSegments` prefix
 * substitution (the same contract conjugation drills use — it survives 来る's
 * reading changes), so the surface is always kanji stem + inflected kana
 * tail; okurigana-aligned ruby then floats the reading over the stem only.
 *
 * HOMOGRAPH SAFETY, same posture as the citation resolver:
 *   - only atoms that pass the existing eligibility gates enumerate
 *     (`resolveEligibleKanjiAtomId` on the dictionary form + catalog entry);
 *   - an inflected kana that IS some course atom's kana maps ONLY when that
 *     atom is the verb's own kanji-less sibling (the 6 polite -ます anchor
 *     atoms: unambiguous kana, taught, no stored kanji) — then the display
 *     derives from the dictionary form while the SRS gate keys the REAL
 *     atom (のみます → 飲みます, mastery read on `nomimasu`). Any other
 *     real-atom kana (homographs, kanji-owning atoms) stays with the
 *     citation path;
 *   - two words colliding on the same inflected kana poison that kana to
 *     null — ambiguous stays kana, at any module.
 */
type InflectedTileKanji = {
  surface: string;
  atomId: string;
  /** From the DICTIONARY form's catalog entry — the -ます siblings aren't in
   *  `KANJI_ELIGIBLE_ATOMS` themselves, so the gate is carried here. */
  unlockModule: number;
};

let inflectedMapCache: Map<string, InflectedTileKanji | null> | null = null;

const HAS_HAN_INFLECT = /\p{Script=Han}/u;

/** atom-per-kana counts (homograph detector), mirroring the resolver's. */
let kanaCountCache: Map<string, number> | null = null;
function kanaAtomCountLocal(kana: string): number {
  if (!kanaCountCache) {
    kanaCountCache = new Map();
    for (const a of JA_COURSE_ATOMS) {
      kanaCountCache.set(a.kana, (kanaCountCache.get(a.kana) ?? 0) + 1);
    }
  }
  return kanaCountCache.get(kana) ?? 0;
}

function inflectedTileKanjiMap(): Map<string, InflectedTileKanji | null> {
  if (inflectedMapCache) return inflectedMapCache;
  const map = new Map<string, InflectedTileKanji | null>();
  const add = (
    kana: string,
    surface: string,
    atomId: string,
    unlockModule: number,
  ) => {
    if (!kana || kana === surface) return;
    const existing = JA_COURSE_ATOMS_BY_KANA.get(kana);
    let boundAtomId = atomId;
    if (existing) {
      // The kana IS a taught atom. Safe only for the verb's own kanji-less
      // sibling forms (のみます etc.): unambiguous, taught, no stored kanji.
      if (kanaAtomCountLocal(kana) !== 1) return; // homograph → never
      if (existing.fromModule === "future") return; // untaught → never
      if (existing.kanji && HAS_HAN_INFLECT.test(existing.kanji)) return; // owns kanji → citation path
      boundAtomId = existing.id; // SRS gate keys the real taught atom
    }
    const prev = map.get(kana);
    if (prev === null) return; // already poisoned
    if (prev && (prev.surface !== surface || prev.atomId !== boundAtomId)) {
      map.set(kana, null); // cross-word collision → ambiguous → kana
      return;
    }
    map.set(kana, { surface, atomId: boundAtomId, unlockModule });
  };
  const enumerate = (
    dictionary: string,
    kanaForms: Iterable<string>,
  ) => {
    const atomId = resolveEligibleKanjiAtomId(dictionary);
    if (!atomId) return; // same conservative gates as citation tiles
    const entry = KANJI_ELIGIBLE_ATOMS.get(atomId);
    if (!entry) return;
    for (const kana of new Set(kanaForms)) {
      const segs = writtenSegments(dictionary, entry.kanji, kana);
      if (segs.length !== 2 || !segs[0].ruby) continue; // degraded → skip
      add(kana, segs[0].text + segs[1].text, atomId, entry.unlockModule);
    }
  };
  const CHAIN = Object.keys(CHAIN_FORM_LABELS) as ChainForm[];
  for (const v of VERB_ENTRIES) {
    enumerate(v.dictionary, [
      ...Object.values(v.forms),
      ...CHAIN.map((cf) => conjugateVerb(v.dictionary, v.group, cf)),
    ]);
  }
  const IADJ: IAdjForm[] = ["negative", "past", "past-negative"];
  for (const a of ADJ_ENTRIES) {
    if (a.type !== "i-adj") continue; // na-adj inflects on だ/です, not the stem
    enumerate(a.dictionary, [
      ...Object.values(a.forms),
      ...IADJ.map((f) => conjugateIAdj(a.dictionary, f)),
    ]);
  }
  inflectedMapCache = map;
  return map;
}

/**
 * The kanji display form for a build tile, or `null` when the tile must
 * stay kana (outside a lesson, ambiguous/ineligible kana, or the lesson's
 * module hasn't unlocked the kanji yet). Pure — no store reads. Resolves
 * citation kana first (the original path), then real inflected forms of
 * kanji-eligible verbs/い-adjectives (see `inflectedTileKanjiMap` above).
 */
export function resolveBuildTileKanji(
  kana: string,
  moduleIndex: number | null,
): BuildTileKanji | null {
  if (moduleIndex == null) return null; // outside a lesson → never
  const atomId = resolveEligibleKanjiAtomId(kana);
  if (atomId) {
    const entry = KANJI_ELIGIBLE_ATOMS.get(atomId);
    if (!entry) return null; // defensive; resolver already checked membership
    if (moduleIndex < entry.unlockModule) return null; // not unlocked yet
    return { surface: entry.kanji, reading: kana, atomId };
  }
  // Inflected fallback: のまない → 飲まない etc. Unlock gate carried from
  // the dictionary form's catalog entry (the -ます siblings aren't in
  // KANJI_ELIGIBLE_ATOMS themselves).
  const inflected = inflectedTileKanjiMap().get(kana);
  if (!inflected) return null; // unknown or poisoned-ambiguous → stay kana
  if (moduleIndex < inflected.unlockModule) return null;
  return { surface: inflected.surface, reading: kana, atomId: inflected.atomId };
}

/**
 * AUXILIARY-POSITION SUPPRESSION (Spencer prod QA 2026-08-21: m30's build
 * banks rendered 「たべてみる」's helper tile as 見る). A verb parked behind a
 * て-form (〜てみる / 〜ておく / 〜ていく / 〜てくる / 〜てしまう / 〜てある …)
 * is an AUXILIARY — its lexical meaning is bleached and Japanese orthography
 * keeps it in kana, never its own kanji. The sentence-display path gets this
 * for free (`buildSentenceAnnotation` leaves an unspaced multi-word run
 * un-atomed), but the compiler tokenizes the closed run into separate tiles
 * (たべて · みる) and per-tile resolution cannot see the neighbour.
 *
 * The authored orthography IS the signal (m30 IR convention: every て+helper
 * surface is written CLOSED; ordinary sequenced verbs are space-separated).
 * So a tile is auxiliary-position iff its predecessor in `correctOrder` ends
 * in て/で AND the pair appears GLUED in the authored `targetSentence`:
 * 「たべてみる」 suppresses みる; 「たべて がっこうに いく」 (sequential,
 * spaced) keeps 行く.
 *
 * Deliberately NOT a helper-lemma list: a list would need every future helper
 * module (m35 てくれる, m38 てしまう/ていく, m41 てある) plus every inflected
 * form (みた/みない/みたい…), and one miss ships the bug again. Any tile glued
 * to a て-form is one predicate with it, and kana is always correct there.
 * This also keeps 〜ておく safe the day 置 enters the rollout catalog — today
 * its tiles stay kana only because oku is absent from `anchorVocab`.
 *
 * Returns the suppressed KANA strings (the bank keys tiles by kana), so an
 * identical-kana distractor renders consistently with the answer tile.
 */
export function auxiliarySuppressedTiles(
  targetSentence: string | undefined,
  correctOrder: readonly string[],
): ReadonlySet<string> {
  const suppressed = new Set<string>();
  if (!targetSentence) return suppressed;
  for (let i = 1; i < correctOrder.length; i++) {
    const prev = correctOrder[i - 1];
    if (!prev.endsWith("て") && !prev.endsWith("で")) continue;
    if (targetSentence.includes(prev + correctOrder[i])) {
      suppressed.add(correctOrder[i]);
    }
  }
  return suppressed;
}
