/**
 * French course atoms — the SRS-eligible vocab + function-word spine for FR.
 *
 * Per ADR-005 every atom carries its language prefix (`fr:<surface>`). The
 * shape follows `es/courseAtoms.ts`, which is the parent: Latin script, so no
 * romanization field, and `gender` on nouns so the agreement engines work.
 *
 * ONE DELIBERATE DIVERGENCE FROM ES remains live:
 *
 * ELISION IS A PROPERTY OF THE ATOM, NOT OF THE SENTENCE. `le` + `ami` →
 * `l'ami`, and a build-tile bank that hands out `le` and `ami` as separate
 * tiles teaches a form that does not exist (fr pin §1; fr guide §0.1 on ja
 * §4c). Elision is predictable from spelling — vowel-initial, including
 * accented vowels and the ligatures `œ`/`æ` (`l'œuf`, `l'œil`), or mute h —
 * EXCEPT for a closed lexical class of words that are SPELLED vowel-initial
 * but PRONOUNCED consonant-initial: h aspiré (`le héros`, never
 * `*l'héros`), glide-initial loans (`le yaourt`, `le yoga`, `la ouate`),
 * and the numerals `onze`/`huit` (`le onze`, `le huit`). These block BOTH
 * elision AND liaison, so the fact is declared ONCE on the atom
 * (`consonantOnset: true`, of which `hAspire` is the h-spelled subset) and
 * read everywhere through `isConsonantOnset()` — never re-derived at a use
 * site. Judgment goes in the inventory.
 *
 * THE IMPORT CYCLE, inherited from ES and load-bearing: curriculum files import
 * `atom` back from here and call it at import time, so `atom()` and
 * `findFrAtomBySurface()` are hoisted function declarations over a `var`-backed
 * registry, callable while this module is still evaluating.
 *
 * Content-as-data (2026-09-13): `getFrCourseAtoms()` no longer eager-globs
 * `curriculum/m*.ts` (the glob-order race fix, docs/fr-article-glob-race-
 * 2026-09-10.md, and the whole-lesson-body bundle cost it carried — see
 * docs/content-as-data-2026-09-13.md). It reads the committed
 * `curriculum/atoms.generated.json`, written by `npm run content:emit` from
 * `curriculum/atomsAggregate.eager.ts` (a static, module-order import list —
 * `es/curriculum/atomsAggregate.eager.ts` is the pattern). At runtime nothing
 * imports the curriculum modules at all, so `findFrAtomBySurface` falls back
 * to the JSON aggregate for any surface not yet in the live registry — same
 * shape as `es/courseAtoms.ts`'s `jsonAtomsBySurface`. `collectFrAtomExports`
 * stays below as the pure, tested collector `atomsAggregate.eager.ts` and
 * `atoms.generated.test.ts`'s guard tests exercise directly.
 *
 * Dedup rule mirrors ES/KO: first-write-wins by surface. A later module
 * re-teaching an earlier surface must NOT re-register it.
 */
import type { Atom, AtomId, PartOfSpeech } from "@/shared/language/types";
import frAtomsJson from "./curriculum/atoms.generated.json";

export type FrAtomKind = "vocab" | "particle" | "phrase";

/** `"m1"`, `"m2"`, … — no hand-maintained union to fall out of date. */
export type FrAtomSource = `m${number}`;

/** FR-specific atom shape — Latin script, gender, and the elision facts. */
export type FrAtom = Atom & {
  /** Atom kind, FR-internal taxonomy. Articles / prepositions / conjunctions
   *  register as "particle" so the module's particles slot is non-empty. */
  kind: FrAtomKind;
  /** Optional emoji art for word-image MCQs / vocab cards. */
  emoji?: string;
  /** Optional pronunciation nudge. French needs these far more than Spanish
   *  does — see the fr pin §1 on sound/spelling divergence. */
  hint?: string;
  /** Grammatical gender for nouns — required on gendered noun atoms. */
  gender?: "m" | "f";
  /**
   * h ASPIRÉ: this word begins with an orthographic h that BLOCKS elision and
   * liaison (`le héros`, `les | héros`). Unpredictable from spelling.
   *
   * DEPRECATION NOTE (2026-08-19): h aspiré turned out NOT to be the only
   * class with this behaviour — glide-initial loans (`le yaourt`) and
   * `onze`/`huit` block elision and liaison the same way — so the general
   * flag is `consonantOnset`, of which this is the h-spelled subset. Setting
   * `hAspire: true` still works (`isConsonantOnset()` folds it in), and it
   * stays meaningful as teaching metadata for F3's mute-h contrast, but
   * validators must read `isConsonantOnset(atom)`, never this field.
   */
  hAspire?: boolean;
  /**
   * VOWEL-SPELLED BUT CONSONANT-ONSET — the single lexical escape hatch for
   * words whose spelling says "elide/liaise into me" but whose phonology
   * refuses: h aspiré (`le héros`), glide-initial loans (`le yaourt`,
   * `le yoga`, `la ouate`), the numerals `onze`/`huit` (`le onze`). Blocks
   * BOTH elision and liaison. Unpredictable from spelling, so it is declared
   * once here and read everywhere through `isConsonantOnset()` — leaving it
   * off one of these words produces `*l'yaourt`, well-formed-looking and
   * wrong, the defect class that must be unreachable rather than detectable.
   */
  consonantOnset?: boolean;
  /**
   * WRITTEN-BUT-INAUDIBLE agreement: atoms sharing a `homophoneKey` SOUND
   * IDENTICAL (`parle`/`parles`/`parlent` are all [paʁl]). The audio-bearing
   * choice factories in grammarHelpers.ts read this to REFUSE a distractor
   * homophonous with the answer — such a step is unanswerable by ear and
   * reads as correct in every review. Any stable spelling works as the key
   * (IPA is conventional); only equality is ever tested.
   */
  homophoneKey?: string;
};

/**
 * THE single source of truth for "spelled vowel-initial but phonologically
 * consonant-initial". Both `elidesBefore()` and the liaison validators in
 * grammarHelpers.ts read this — never the fields directly, and never the
 * first letter — so h aspiré and the glide/onze class block elision and
 * liaison everywhere or nowhere.
 */
export function isConsonantOnset(
  a: Pick<FrAtom, "consonantOnset" | "hAspire">,
): boolean {
  return Boolean(a.consonantOnset ?? a.hAspire);
}

/**
 * Does a preceding `le` / `la` / `de` / `je` … elide before this atom?
 *
 * Vowel-initial or mute h → yes; the consonant-onset lexical class (h aspiré,
 * `yaourt`-type glides, `onze`/`huit`) → no. Accented vowels count (`l'été`,
 * `l'île`), and so do the ligatures œ/æ (`l'œuf`, `l'œil`, `l'æsthète`).
 * Callers must use this rather than testing the first letter themselves, so
 * the lexical exceptions are applied everywhere or nowhere.
 */
export function elidesBefore(
  a: Pick<FrAtom, "surface" | "hAspire" | "consonantOnset">,
): boolean {
  if (isConsonantOnset(a)) return false;
  return /^[aàâæeéèêëiîïoôœuùûüyh]/i.test(a.surface);
}

// Live surface → atom registry. `var` + hoisted functions so curriculum files
// can register/resolve atoms while this module is still evaluating.
// eslint-disable-next-line no-var
var _frAtomsBySurface: Map<string, FrAtom> | undefined;

function surfaceRegistry(): Map<string, FrAtom> {
  return (_frAtomsBySurface ??= new Map<string, FrAtom>());
}

export function atom(opts: {
  surface: string;
  meaningEn: string;
  partOfSpeech: PartOfSpeech;
  fromModule: FrAtomSource;
  kind: FrAtomKind;
  emoji?: string;
  hint?: string;
  gender?: "m" | "f";
  hAspire?: boolean;
  consonantOnset?: boolean;
  homophoneKey?: string;
  srsEligible?: boolean;
}): FrAtom {
  const a: FrAtom = {
    id: `fr:${opts.surface}` as AtomId,
    languageId: "fr",
    surface: opts.surface,
    gloss: opts.meaningEn,
    partOfSpeech: opts.partOfSpeech,
    fromModule: opts.fromModule,
    srsEligible: opts.srsEligible ?? true,
    kind: opts.kind,
    emoji: opts.emoji,
    hint: opts.hint,
    gender: opts.gender,
    hAspire: opts.hAspire,
    consonantOnset: opts.consonantOnset,
    homophoneKey: opts.homophoneKey,
  };
  const registry = surfaceRegistry();
  if (!registry.has(a.surface)) registry.set(a.surface, a);
  return a;
}

// eslint-disable-next-line no-var
var _jsonBySurface: Map<string, FrAtom> | undefined;
function jsonAtomsBySurface(): Map<string, FrAtom> {
  if (!_jsonBySurface) {
    _jsonBySurface = new Map<string, FrAtom>();
    for (const a of frAtomsJson as FrAtom[]) if (!_jsonBySurface.has(a.surface)) _jsonBySurface.set(a.surface, a);
  }
  return _jsonBySurface;
}

/**
 * Cycle-safe accessor — grammar helpers resolve through this (a hoisted
 * function) because curriculum files call the step factories at import time.
 * Falls back to the committed `atoms.generated.json` aggregate (same shape
 * as `es/courseAtoms.ts`'s `jsonAtomsBySurface`) for any surface not yet
 * live-registered — e.g. a test that imports a single `mN.ts` directly
 * without its predecessors, or a module referencing an EARLIER module's
 * surface (compounding review) before that module's `atom()` calls have run
 * in this evaluation. The JSON aggregate is module-order-complete
 * regardless of runtime import order, so this closes the same
 * glob-order-race class `docs/fr-article-glob-race-2026-09-10.md` fixed —
 * without needing a live glob at all.
 */
export function findFrAtomBySurface(surface: string): FrAtom | undefined {
  return surfaceRegistry().get(surface) ?? jsonAtomsBySurface().get(surface);
}

/**
 * Snapshot of every atom registered SO FAR. Mid-import this only sees earlier
 * modules — which is exactly the pool a compounding-review picker may draw
 * from. Do NOT use it for a whole-course aggregate; use `getFrCourseAtoms()`.
 */
export function getRegisteredFrAtoms(): FrAtom[] {
  return [...surfaceRegistry().values()];
}

const MODULE_NO = /\/m(\d+)\.ts$/;
const ATOMS_EXPORT = /^FR_M(\d+)_ATOMS$/;

// eslint-disable-next-line no-var
var _frCourseAtoms: FrAtom[] | undefined;

/**
 * Full FR atom registry, in module order. Content-as-data (2026-09-13): a
 * committed JSON written by `npm run content:emit` from
 * `curriculum/atomsAggregate.eager.ts` — see the header note. At runtime
 * nothing else evaluates the curriculum, so the JSON atoms are also
 * registered here: `findFrAtomBySurface` must resolve for the
 * flashcard/SRS/vocab-art surfaces. `atoms.generated.test.ts` is the stale
 * guard.
 */
export function getFrCourseAtoms(): ReadonlyArray<FrAtom> {
  if (!_frCourseAtoms) {
    _frCourseAtoms = frAtomsJson as FrAtom[];
    const registry = surfaceRegistry();
    for (const a of _frCourseAtoms) if (!registry.has(a.surface)) registry.set(a.surface, a);
  }
  return _frCourseAtoms;
}

/**
 * Pure collector, exported so its guards can be negative-control tested
 * (`frCurriculum.test.ts`) with an injected fake record — a real defective
 * curriculum file would only surface the same throw inside
 * `atomsAggregate.eager.ts` at emit time. No longer called by
 * `getFrCourseAtoms` (content-as-data migration, 2026-09-13); kept as the
 * tested contract for what "well-formed `FR_M<n>_ATOMS`" means.
 */
export function collectFrAtomExports(
  modules: Record<string, Record<string, unknown>>,
): FrAtom[] {
  const byModule: { n: number; atoms: FrAtom[] }[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const fileNo = MODULE_NO.exec(path);
    if (!fileNo) continue;
    for (const [exportName, value] of Object.entries(mod)) {
      const m = ATOMS_EXPORT.exec(exportName);
      if (!m) continue;
      if (!Array.isArray(value)) {
        // The export NAME claims to be this module's atom list. Skipping a
        // non-array value would silently drop every atom in the module — the
        // exact silent-omission class this file's header promises to close.
        throw new Error(
          `fr/courseAtoms: ${path} exports ${exportName} with a non-array ` +
            `value. FR_M<n>_ATOMS must be a flat FrAtom[] — the aggregate is ` +
            `derived here; do not export a keyed object.`,
        );
      }
      if (m[1] !== fileNo[1]) {
        // m12.ts exporting FR_M11_ATOMS is a copy-paste from the previous
        // module — silent in ES, and it mis-attributes every atom's module,
        // which is what the "introduced before reviewed" gate reads.
        throw new Error(
          `fr/courseAtoms: ${path} exports ${exportName} — the module number ` +
            `must match the file name.`,
        );
      }
      byModule.push({ n: Number(fileNo[1]), atoms: value as FrAtom[] });
    }
  }
  byModule.sort((a, b) => a.n - b.n);
  return byModule.flatMap((m) => m.atoms);
}

/** Surface → atom lookup, the LIVE registry instance. `atom()` populates it as
 *  each curriculum module evaluates; first-write-wins on duplicate surfaces. */
export const FR_ATOMS_BY_SURFACE: ReadonlyMap<string, FrAtom> = surfaceRegistry();
