/**
 * Spanish course atoms — the SRS-eligible vocab + function-word spine for ES.
 *
 * Per ADR-005, every atom carries the language prefix in its id
 * (`es:<surface>`). Surface form is the Spanish word itself (Latin script —
 * no romanization field needed); `hint` may carry a pronunciation nudge for
 * the m1–m3 tricky cases (ll, ñ, j, rr, silent h, soft c) per the spine.
 * Noun atoms carry `gender: "m" | "f"` so the agreement engines can light
 * up later (spine §Deliberately out of scope).
 *
 * Unlike KO (all atoms inline here), ES atoms live WITH their module in
 * `curriculum/m{n}.ts` so parallel authoring waves each own exactly one
 * file. That makes courseAtoms ↔ curriculum/m{n} a deliberate import cycle
 * (m{n} imports `atom` back from here). It is broken the same way the KO
 * module breaks the registry ↔ mockCourse cycle — nothing eager crosses
 * the boundary:
 *
 *   - `atom()` / `findEsAtomBySurface()` are hoisted function declarations
 *     backed by a `var` registry map, callable while this module is still
 *     mid-evaluation (curriculum files build their lessons at import time).
 *   - The aggregate atom list is a lazy getter (`getEsCourseAtoms`) instead
 *     of an eager spread — an eager `[...ES_M1_ATOMS, …]` throws a TDZ
 *     ReferenceError whenever a curriculum file is the import entry point.
 *
 * Dedup rule mirrors KO: first-write-wins by surface in the lookup map. A
 * later module re-teaching an earlier surface must NOT re-register it
 * (unique atom ids are enforced by the ES conformance test).
 */
import type { Atom, AtomId, PartOfSpeech } from "@/shared/language/types";
import { ES_REVIEW_POOL } from "./esReviewPool";

import { ES_M1_ATOMS } from "./curriculum/m1";
import { ES_M2_ATOMS } from "./curriculum/m2";
import { ES_M3_ATOMS } from "./curriculum/m3";
import { ES_M4_ATOMS } from "./curriculum/m4";
import { ES_M5_ATOMS } from "./curriculum/m5";
import { ES_M6_ATOMS } from "./curriculum/m6";
import { ES_M7_ATOMS } from "./curriculum/m7";
import { ES_M8_ATOMS } from "./curriculum/m8";
import { ES_M9_ATOMS } from "./curriculum/m9";
import { ES_M10_ATOMS } from "./curriculum/m10";
import { ES_M11_ATOMS } from "./curriculum/m11";
import { ES_M12_ATOMS } from "./curriculum/m12";
import { ES_M13_ATOMS } from "./curriculum/m13";

export type EsAtomKind = "vocab" | "particle" | "phrase";

export type EsAtomSource = "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7" | "m8" | "m9" | "m10" | "m11" | "m12" | "m13";

/** ES-specific atom shape — Latin script + gender for the agreement engines. */
export type EsAtom = Atom & {
  /** Atom kind, ES-internal taxonomy. Articles/preps/conjunctions are
   *  kind "particle" so the module's particles slot is non-empty. */
  kind: EsAtomKind;
  /** Optional emoji art for word-image MCQs / vocab cards. */
  emoji?: string;
  /** Optional pronunciation nudge (m1–m3 tricky cases only, per the spine). */
  hint?: string;
  /** Grammatical gender for nouns — required on gendered noun atoms. */
  gender?: "m" | "f";
};

// Live surface → atom registry. `var` + hoisted functions so curriculum
// files can register/resolve atoms while this module is still evaluating
// (see the cycle note in the header).
// eslint-disable-next-line no-var
var _esAtomsBySurface: Map<string, EsAtom> | undefined;

function surfaceRegistry(): Map<string, EsAtom> {
  return (_esAtomsBySurface ??= new Map<string, EsAtom>());
}

export function atom(opts: {
  surface: string;
  meaningEn: string;
  partOfSpeech: PartOfSpeech;
  fromModule: EsAtomSource;
  kind: EsAtomKind;
  emoji?: string;
  hint?: string;
  gender?: "m" | "f";
  srsEligible?: boolean;
}): EsAtom {
  const a: EsAtom = {
    id: `es:${opts.surface}` as AtomId,
    languageId: "es",
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

// Static-pool fallback for the courseAtoms↔curriculum import cycle. When a
// module builds a compounding-review step referencing a PRIOR module's surface,
// that earlier module may not have registered its atoms in the live registry
// yet (a later module's lessons can evaluate first). `ES_REVIEW_POOL` is a
// generated, import-order-independent snapshot; we synthesize an EsAtom from it
// on a registry miss so gloss/id resolution is stable at authoring time. At
// RUNTIME every atom is live-registered, so the fallback never triggers there.
// `var` (not `let`) so the hoisted `findEsAtomBySurface` can call `poolFallback`
// while this module is still mid-evaluation — a `let` would be in its TDZ.
// eslint-disable-next-line no-var
var _poolFallback: Map<string, EsAtom> | undefined;
function poolFallback(): Map<string, EsAtom> {
  if (!_poolFallback) {
    _poolFallback = new Map<string, EsAtom>();
    for (const e of ES_REVIEW_POOL) {
      _poolFallback.set(e.surface, {
        id: `es:${e.surface}` as AtomId,
        languageId: "es",
        surface: e.surface,
        gloss: e.gloss,
        partOfSpeech: e.partOfSpeech as PartOfSpeech,
        fromModule: e.fromModule as EsAtomSource,
        srsEligible: true,
        kind: e.kind,
      });
    }
  }
  return _poolFallback;
}

/**
 * Cycle-safe accessor over `ES_ATOMS_BY_SURFACE` — grammarHelpers resolves
 * through this (a hoisted function) because curriculum files call the step
 * factories at import time, before this module's consts initialize. Falls back
 * to the static `ES_REVIEW_POOL` snapshot for atoms not yet live-registered
 * (see the cycle note above).
 */
export function findEsAtomBySurface(surface: string): EsAtom | undefined {
  return surfaceRegistry().get(surface) ?? poolFallback().get(surface);
}

/**
 * Cycle-safe snapshot of every atom registered SO FAR (a hoisted function,
 * same reason as `findEsAtomBySurface`). Curriculum files import earlier
 * modules before their own factory calls run, so at the moment module N is
 * building its lessons every atom from m1…m(N-1) is already registered —
 * exactly the pool the compounding-review picker (`pickReviewSurfaces`)
 * draws from. Do NOT use this for a whole-course aggregate (use
 * `getEsCourseAtoms()`); mid-import it only sees earlier modules.
 */
export function getRegisteredEsAtoms(): EsAtom[] {
  return [...surfaceRegistry().values()];
}

// eslint-disable-next-line no-var
var _esCourseAtoms: EsAtom[] | undefined;

/**
 * Full ES atom registry, in module order. Lazy (see the cycle note in the
 * header) — first call materializes the aggregate; every curriculum module
 * has finished evaluating by the time any consumer (module.ts, tests) runs.
 *
 * EVERY authored module must appear here. This list is not decorative: it is
 * what `normalizedAtoms.ts` hands the SRS unlock index, what
 * `matchPairsFloor.ts` draws review pairs from, and what `module.ts` publishes
 * as the language's atom set. m17 shipped without being added, so its 29
 * preterite atoms existed in `ES_ATOMS_BY_SURFACE` (which `atom()` populates
 * as a side effect) and were invisible to all three — a module whose words
 * were taught and then never scheduled. Adding a module file without adding
 * its atoms here is silent, which is why the list carries this warning
 * instead of a comment naming a specific last module.
 */
export function getEsCourseAtoms(): ReadonlyArray<EsAtom> {
  return (_esCourseAtoms ??= [
    ...ES_M1_ATOMS,
    ...ES_M2_ATOMS,
    ...ES_M3_ATOMS,
    ...ES_M4_ATOMS,
    ...ES_M5_ATOMS,
    ...ES_M6_ATOMS,
    ...ES_M7_ATOMS,
    ...ES_M8_ATOMS,
    ...ES_M9_ATOMS,
    ...ES_M10_ATOMS,
    ...ES_M11_ATOMS,
    ...ES_M12_ATOMS,
    ...ES_M13_ATOMS,
  ]);
}

/** Surface → atom lookup (used by `grammarHelpers.ts` to resolve atom ids
 *  during step authoring). This is the LIVE registry instance — `atom()`
 *  populates it as each curriculum module evaluates; first-write-wins on
 *  duplicate surfaces (KO dedup rule). */
export const ES_ATOMS_BY_SURFACE: ReadonlyMap<string, EsAtom> = surfaceRegistry();
