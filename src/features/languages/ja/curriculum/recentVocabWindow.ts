/**
 * THE six-module review window (Rule 3, Spencer 2026-09-15).
 *
 * TestFlight #91: an advanced test-out asked "The door opens" — an m5-level
 * intransitive drill — as a listening MCQ. *"This is a bad question to ask …
 * find something to replace this and similar 'low module short sentences'
 * with, they don't belong in more advanced course work outside of review."*
 * #116 is the same thing in review: *"いいえ has no business in advanced
 * review."* His rule, given verbatim on the same day: a six-module look-back
 * for in-lesson review and filler pools — *"yeah that should be perfect"* —
 * unless the word's FSRS card is due, in which case it may come from anywhere.
 *
 * This module answers only the CONTENT half of that ("is this word recent?").
 * The FSRS half lives with the selection code that has learner state
 * (`dynamicReviewPrefix`), because the compiler has none.
 *
 * WHY A SET DIFFERENCE, not `courseAtom.fromModule`: those tags are stale
 * old-course provenance — they both admit untaught words and reject taught
 * ones, the trap `moduleCompiler`'s `metBefore` and `taughtVocab.ts` both
 * document at length. The truthful per-module record is each IR's
 * `priorVocab` (the union of what every EARLIER module actually taught,
 * computed by `scripts/compile-ir.mjs` where the filesystem is available),
 * projected into `taughtVocab.generated.json` by `npm run content:emit`. So
 * "first taught in modules [N-W, N-1]" is exactly
 * `priorVocab(N) \ priorVocab(N-W)` — two truthful sets, no provenance tag
 * consulted. The current module's own `newAtoms` are recent by definition and
 * are added on top.
 *
 * The data only covers m6+, so the window can only be computed from m12 up
 * (it needs `priorVocab(N-6)`). `null` there means "no window" — every module
 * at or below m11 is inside its own six-module look-back anyway.
 */
import taughtVocabJson from "./taughtVocab.generated.json";

type IrProjection = { priorVocab?: string[]; newAtoms?: { kana?: string }[] };

const BY_MODULE: Readonly<Record<string, IrProjection>> =
  taughtVocabJson as Readonly<Record<string, IrProjection>>;

/** Default look-back, in modules. Spencer's number. */
export const RECENT_WINDOW_MODULES = 6;

function moduleIndex(moduleId: string): number {
  const m = /^m(\d+)$/.exec(moduleId);
  return m ? parseInt(m[1], 10) : -1;
}

const cache = new Map<string, ReadonlySet<string> | null>();

/**
 * Kana surfaces first taught within the last `windowModules` modules, plus
 * everything `moduleId` itself teaches.
 *
 * Returns `null` when the window cannot be computed truthfully (a module with
 * no IR projection, or one whose window start falls before the IR era). A
 * caller MUST treat `null` as "do not filter" — guessing a window from stale
 * tags is the exact failure this module exists to avoid.
 */
export function getJaRecentKanaWindow(
  moduleId: string,
  windowModules: number = RECENT_WINDOW_MODULES,
): ReadonlySet<string> | null {
  const cacheKey = `${moduleId}:${windowModules}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  const result = compute(moduleId, windowModules);
  cache.set(cacheKey, result);
  return result;
}

function compute(
  moduleId: string,
  windowModules: number,
): ReadonlySet<string> | null {
  const n = moduleIndex(moduleId);
  if (n < 0) return null;
  const here = BY_MODULE[moduleId];
  if (!here?.priorVocab) return null;
  const start = BY_MODULE[`m${n - windowModules}`];
  if (!start?.priorVocab) return null;
  const before = new Set(start.priorVocab);
  const out = new Set<string>();
  for (const kana of here.priorVocab) if (!before.has(kana)) out.add(kana);
  for (const a of here.newAtoms ?? []) if (a.kana) out.add(a.kana);
  return out;
}

/**
 * Hard ceiling on the widening below, in modules.
 *
 * Without a ceiling the floor eats the rule: a module whose declared review
 * vocabulary is almost all old widens until the window is the whole course,
 * which is the pre-2026-09-15 behaviour wearing the new name. Double the rule
 * is the most the floor may buy; past that the pool stays thin and the FSRS
 * half (`selectReviewHalves`, `matchPairsFloor`'s due rank) is what fills the
 * gap — which is the design, not a shortfall.
 */
export const RECENT_WINDOW_MAX_MODULES = 12;

/**
 * Choose the window WIDTH for a module: the narrowest window in
 * [`RECENT_WINDOW_MODULES`, `RECENT_WINDOW_MAX_MODULES`] under which at least
 * `minKept` of `candidates` survive.
 *
 * The floor is not a softening of the rule — it is a guard against the failure
 * the window would otherwise reintroduce. m18 declares three new atoms and
 * lists 35 older words in its review pools; windowed at six modules its filler
 * pool is SEVEN words, and a pool that small is how `m10-neo-1` once shipped
 * the same "Pick the word for 'person'" MCQ five times in one lesson (see
 * `moduleCompiler.usableKana`). Recency stays strictly preferred: the window
 * grows by the smallest number of modules that clears the floor, stops the
 * moment it does, and never passes the ceiling.
 *
 * WIDTH IS A MODULE-LEVEL DECISION, and the signature forces that: pass the
 * MODULE's whole declared pool, not one lesson's slice of it. Sizing on a
 * lesson slice is a live trap — lesson 1 of any module has almost no usable
 * prior vocabulary (its own new words are not introduced yet), so a per-lesson
 * floor widened m46's window to FORTY modules and re-admitted the entire
 * course. Caught by the sweep, 2026-09-15.
 *
 * `alwaysKeep` is the module's own vocabulary — recent by definition and never
 * subject to the window or the floor.
 *
 * Returns `null` when no truthful window exists; a caller MUST then leave its
 * pools alone rather than guess.
 */
export function chooseRecentWindow<T>(
  moduleId: string,
  candidates: readonly T[],
  kanaOf: (c: T) => string,
  minKept: number,
  alwaysKeep: ReadonlySet<string> = new Set(),
): { window: ReadonlySet<string>; modules: number } | null {
  const base = getJaRecentKanaWindow(moduleId, RECENT_WINDOW_MODULES);
  if (!base) return null;
  let modules = RECENT_WINDOW_MODULES;
  let window = base;
  for (;;) {
    const kept = candidates.filter(
      (c) => alwaysKeep.has(kanaOf(c)) || window.has(kanaOf(c)),
    );
    if (kept.length >= minKept) break;
    if (modules >= RECENT_WINDOW_MAX_MODULES) break;
    const wider = getJaRecentKanaWindow(moduleId, modules + 1);
    if (!wider || wider.size <= window.size) break;
    modules += 1;
    window = wider;
  }
  return { window, modules };
}
