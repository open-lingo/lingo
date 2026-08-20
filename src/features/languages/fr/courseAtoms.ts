/**
 * French course atoms — the SRS-eligible vocab + function-word spine for FR.
 *
 * Per ADR-005 every atom carries its language prefix (`fr:<surface>`). The
 * shape follows `es/courseAtoms.ts`, which is the parent: Latin script, so no
 * romanization field, and `gender` on nouns so the agreement engines work.
 *
 * TWO DELIBERATE DIVERGENCES FROM ES. Both close defect classes the ES file
 * documents in its own comments, and both are cheap to take now because FR has
 * no modules yet — they would be migrations later.
 *
 * 1. THE AGGREGATE IS DERIVED, NOT HAND-MAINTAINED. ES keeps a literal list of
 *    `...ES_M17_ATOMS` spreads plus a hardcoded `EsAtomSource` union, and its
 *    own comment records what that costs: "m17 shipped without being added, so
 *    its 29 preterite atoms existed in `ES_ATOMS_BY_SURFACE` and were invisible
 *    to all three [consumers] — a module whose words were taught and then never
 *    scheduled." That is the same failure as a `MODULE_ORDER` frozen at m17
 *    silently exempting two modules from the comprehensibility gate. Here the
 *    curriculum is globbed and every `FR_M<n>_ATOMS` export is collected, so
 *    adding a module file IS adding its atoms. `import.meta.glob` is already
 *    house-idiomatic (`shared/tts/manifest.ts`), and with `eager: true` it
 *    hoists exactly like the static imports it replaces — the import-cycle
 *    semantics below are unchanged.
 *
 * 2. ELISION IS A PROPERTY OF THE ATOM, NOT OF THE SENTENCE. `le` + `ami` →
 *    `l'ami`, and a build-tile bank that hands out `le` and `ami` as separate
 *    tiles teaches a form that does not exist (fr pin §1; fr guide §0.1 on ja
 *    §4c). Elision is predictable from spelling — vowel-initial, including
 *    accented vowels and the ligatures `œ`/`æ` (`l'œuf`, `l'œil`), or mute h —
 *    EXCEPT for a closed lexical class of words that are SPELLED vowel-initial
 *    but PRONOUNCED consonant-initial: h aspiré (`le héros`, never
 *    `*l'héros`), glide-initial loans (`le yaourt`, `le yoga`, `la ouate`),
 *    and the numerals `onze`/`huit` (`le onze`, `le huit`). These block BOTH
 *    elision AND liaison, so the fact is declared ONCE on the atom
 *    (`consonantOnset: true`, of which `hAspire` is the h-spelled subset) and
 *    read everywhere through `isConsonantOnset()` — never re-derived at a use
 *    site. Judgment goes in the inventory.
 *
 * THE IMPORT CYCLE, inherited from ES and load-bearing: curriculum files import
 * `atom` back from here and call it at import time, so `atom()` and
 * `findFrAtomBySurface()` are hoisted function declarations over a `var`-backed
 * registry, callable while this module is still evaluating. The aggregate is a
 * lazy getter for the same reason — an eager spread throws a TDZ
 * ReferenceError whenever a curriculum file is the import entry point.
 *
 * Dedup rule mirrors ES/KO: first-write-wins by surface. A later module
 * re-teaching an earlier surface must NOT re-register it.
 */
import type { Atom, AtomId, PartOfSpeech } from "@/shared/language/types";

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

/**
 * Cycle-safe accessor — grammar helpers resolve through this (a hoisted
 * function) because curriculum files call the step factories at import time.
 *
 * ES additionally falls back to a generated `ES_REVIEW_POOL` snapshot for
 * surfaces not yet live-registered. FR has no such snapshot and does not need
 * one yet: that fallback exists for compounding-review steps that reference a
 * PRIOR module, and there are no prior modules. Add it when the first FR module
 * that reviews backwards is authored — and add it as a generated file, not a
 * hand-written one.
 */
export function findFrAtomBySurface(surface: string): FrAtom | undefined {
  return surfaceRegistry().get(surface);
}

/**
 * Snapshot of every atom registered SO FAR. Mid-import this only sees earlier
 * modules — which is exactly the pool a compounding-review picker may draw
 * from. Do NOT use it for a whole-course aggregate; use `getFrCourseAtoms()`.
 */
export function getRegisteredFrAtoms(): FrAtom[] {
  return [...surfaceRegistry().values()];
}

/**
 * Every `curriculum/m<n>.ts`, eagerly. See divergence 1 in the header: this is
 * what makes "authored a module but forgot to list its atoms" unrepresentable.
 */
// Negative pattern: never eagerly import the module TESTS sitting beside
// the modules (import-cycle back through mockLessons).
const CURRICULUM_MODULES = import.meta.glob<Record<string, unknown>>(
  ["./curriculum/m*.ts", "!./curriculum/m*.test.ts"],
  { eager: true },
);

const MODULE_NO = /\/m(\d+)\.ts$/;
const ATOMS_EXPORT = /^FR_M(\d+)_ATOMS$/;

// eslint-disable-next-line no-var
var _frCourseAtoms: FrAtom[] | undefined;

/**
 * Full FR atom registry, in module order. Lazy (see the cycle note in the
 * header). Returns `[]` while no module is authored, which is the honest
 * answer — not an error.
 */
export function getFrCourseAtoms(): ReadonlyArray<FrAtom> {
  return (_frCourseAtoms ??= collectFrAtomExports(CURRICULUM_MODULES));
}

/**
 * Pure collector behind `getFrCourseAtoms`, exported so its guards can be
 * negative-control tested: authoring a real defective curriculum file would
 * poison the live glob (this one, the placement glob and the pathway glob),
 * so the tests inject a fake record instead.
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
