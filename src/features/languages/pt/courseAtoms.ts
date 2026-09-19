/**
 * Portuguese (Brazilian) course atoms — the SRS-eligible vocab +
 * function-word spine for PT. Scaffolding lane (docs/pt-course-design-
 * 2026-09-18.md §5); NO CONTENT — m1 registers zero atoms, this file
 * exists so `pt/module.ts`, `pt/grammarHelpers.ts` and
 * `scripts/compile-ir-pt.mjs` (the authoring-time IR compiler) have a
 * working atom registry to build against from lesson 1.
 *
 * Per ADR-005, every atom carries its language prefix (`pt:<surface>`).
 * Shape follows `es/courseAtoms.ts`, which is the parent: Latin script, so
 * no romanization field; `gender` on nouns so the agreement engines work
 * (design doc §3 — o/a, and the -ão plural class needs its own table before
 * m1 ships real nouns).
 *
 * CURRICULUM-LOADING CHOICE (differs from FR on purpose): PT's
 * `curriculum/index.ts` uses ES's explicit named-import module list, NOT
 * an eager `import.meta.glob`. FR's glob-order race
 * (docs/fr-article-glob-race-2026-09-10.md, `src/test/frEntryGuard.ts`)
 * only exists because FR's collector's iteration order depends on which
 * file a vitest worker happens to import first. An explicit, numerically-
 * ordered import list has no such order to race on — the bug class is
 * avoided by construction rather than guarded against. If a future
 * authoring lane ever converts PT's curriculum collection to a glob (to
 * dodge the eager-import bundle cost the way FR did after 2026-09-13's
 * content-as-data pass), it MUST add a `src/test/ptEntryGuard.ts` mirroring
 * `frEntryGuard.ts` and wire it into `vite.config.ts`'s curriculum project
 * `setupFiles` BEFORE authoring past m1 — do not reintroduce the bug and
 * then discover the fix later.
 *
 * THE IMPORT CYCLE, inherited from ES/FR and load-bearing: curriculum files
 * import `atom` back from here and call it at import time, so `atom()` and
 * `findPtAtomBySurface()` are hoisted function declarations over a
 * `var`-backed registry, callable while this module is still evaluating.
 *
 * No content-as-data JSON aggregate yet (unlike ES/FR's
 * `curriculum/atoms.generated.json` + `atomsAggregate.eager.ts`) — that
 * optimization exists to keep whole lesson bodies out of the main bundle,
 * and with zero authored lessons there is nothing to keep out. Add it the
 * same way ES did (`es/curriculum/atomsAggregate.eager.ts` is the pattern)
 * once PT ships enough modules for the bundle cost to matter.
 */
import type { Atom, AtomId, PartOfSpeech } from "@/shared/language/types";
import { PT_REVIEW_POOL } from "./ptReviewPool";

export type PtAtomKind = "vocab" | "particle" | "phrase";

// Grows as modules ship. m1 is the only source today and it is empty.
export type PtAtomSource = "m1";

/** PT-specific atom shape — Latin script + gender for the agreement engines. */
export type PtAtom = Atom & {
  /** Atom kind, PT-internal taxonomy. Articles/preps/conjunctions are
   *  kind "particle" so the module's particles slot is non-empty once
   *  content lands. */
  kind: PtAtomKind;
  /** Optional emoji art for word-image MCQs / vocab cards. */
  emoji?: string;
  /** Optional pronunciation nudge (nasal vowels, ão, tricky digraphs). */
  hint?: string;
  /** Grammatical gender for nouns — required on gendered noun atoms. */
  gender?: "m" | "f";
};

// Live surface → atom registry. `var` + hoisted functions so curriculum
// files can register/resolve atoms while this module is still evaluating
// (see the cycle note in the header).
// eslint-disable-next-line no-var
var _ptAtomsBySurface: Map<string, PtAtom> | undefined;

function surfaceRegistry(): Map<string, PtAtom> {
  return (_ptAtomsBySurface ??= new Map<string, PtAtom>());
}

export function atom(opts: {
  surface: string;
  meaningEn: string;
  partOfSpeech: PartOfSpeech;
  fromModule: PtAtomSource;
  kind: PtAtomKind;
  emoji?: string;
  hint?: string;
  gender?: "m" | "f";
  srsEligible?: boolean;
}): PtAtom {
  const a: PtAtom = {
    id: `pt:${opts.surface}` as AtomId,
    languageId: "pt",
    surface: opts.surface,
    gloss: opts.meaningEn,
    partOfSpeech: opts.partOfSpeech,
    fromModule: opts.fromModule,
    srsEligible: opts.srsEligible ?? true,
    kind: opts.kind,
    emoji: opts.emoji,
    hint: opts.hint,
    gender: opts.gender,
  };
  const registry = surfaceRegistry();
  if (!registry.has(a.surface)) registry.set(a.surface, a);
  return a;
}

// Static-pool fallback for the courseAtoms↔curriculum import cycle, same
// role as `ES_REVIEW_POOL`'s fallback in `es/courseAtoms.ts` — empty today
// (`PT_REVIEW_POOL` has zero entries), populated the same way once m1+
// register real atoms.
// eslint-disable-next-line no-var
var _poolFallback: Map<string, PtAtom> | undefined;
function poolFallback(): Map<string, PtAtom> {
  if (!_poolFallback) {
    _poolFallback = new Map<string, PtAtom>();
    for (const e of PT_REVIEW_POOL) {
      _poolFallback.set(e.surface, {
        id: `pt:${e.surface}` as AtomId,
        languageId: "pt",
        surface: e.surface,
        gloss: e.gloss,
        partOfSpeech: e.partOfSpeech as PartOfSpeech,
        fromModule: e.fromModule as PtAtomSource,
        srsEligible: true,
        kind: e.kind,
      });
    }
  }
  return _poolFallback;
}

/**
 * Cycle-safe accessor over the live registry — `grammarHelpers.ts` resolves
 * through this (a hoisted function) because curriculum files call the step
 * factories at import time, before this module's consts initialize.
 */
export function findPtAtomBySurface(surface: string): PtAtom | undefined {
  return surfaceRegistry().get(surface) ?? poolFallback().get(surface);
}

/**
 * Cycle-safe snapshot of every atom registered SO FAR (a hoisted function,
 * same reason as `findPtAtomBySurface`). Do NOT use this for a whole-course
 * aggregate (use `getPtCourseAtoms()`); mid-import it only sees earlier
 * modules.
 */
export function getRegisteredPtAtoms(): PtAtom[] {
  return [...surfaceRegistry().values()];
}

// eslint-disable-next-line no-var
var _ptCourseAtoms: PtAtom[] | undefined;

/**
 * Full PT atom registry, in module order. Lazy (see the cycle note in the
 * header) — first call materializes the aggregate; every curriculum module
 * has finished evaluating by the time any consumer (module.ts, tests) runs.
 *
 * EVERY authored module must appear in `curriculum/index.ts`'s import list —
 * ES's own header warns this is silent when skipped (m17 shipped 29 atoms
 * invisible to the SRS unlock index because the module file existed but was
 * never added to the aggregate). PT inherits the same warning.
 */
export function getPtCourseAtoms(): ReadonlyArray<PtAtom> {
  if (!_ptCourseAtoms) {
    _ptCourseAtoms = getRegisteredPtAtoms();
  }
  return _ptCourseAtoms;
}

/** Surface → atom lookup (used by `grammarHelpers.ts` to resolve atom ids
 *  during step authoring). This is the LIVE registry instance — `atom()`
 *  populates it as each curriculum module evaluates; first-write-wins on
 *  duplicate surfaces (ES/KO dedup rule). */
export const PT_ATOMS_BY_SURFACE: ReadonlyMap<string, PtAtom> = surfaceRegistry();

// ─── Explicit lesson-atom-file imports (fragment authoring lanes, 2026-09-18) ───
// Each `courseAtoms.mN-lL.ts` file registers its lesson's atoms into the
// live registry above via `atom()`'s side effect at import time — same
// cycle-safe pattern `curriculum/*.ts` modules use, just one file per
// lesson instead of per module while the IR compiler is still gaining
// fragment support (docs/pt-course-design-2026-09-18.md §4, lane
// PTAUTH-L2's brief). Side-effect only; nothing is re-exported here. Every
// parallel lesson lane appends exactly ONE line to this list.
import "./courseAtoms.m1-l2";
