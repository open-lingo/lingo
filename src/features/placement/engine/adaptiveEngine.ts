import { getAllTestableModules } from "../tiers";
import type { PlacementLevelBand } from "../levelBands";
import type { PlacementItemConfig } from "../questionBank";

// "sampling" is the banded self-declared-level placement path (2026-07-15):
// the learner picks a level up front, the engine samples ~2 modules inside
// that band, and credit is bounded by the band top. "probing" is the
// evidence-based per-module test-out path (unchanged). The old 8-tier
// "screening" full-placement stage was replaced by "sampling".
export type PlacementStage = "sampling" | "probing" | "done";

/** A grammar point the learner got wrong — feeds the placement gap report. */
export type MissedSkill = {
  moduleId: string;
  grammarPointId?: string;
  skill?: string;
};

export type AdaptiveState = {
  /** Course the placement is leveling. Drives the module order. */
  languageId: string;
  stage: PlacementStage;
  /** Banded run only: the module ids being sampled (in course order), and the
   *  band's TOP module (the credit cap — the floor can never exceed it).
   *  Empty / null on a test-out run. */
  sampleModules: string[];
  bandTopModule: string | null;
  probeResults: Record<string, boolean[]>;
  probeQueue: string[];
  currentProbeModule: string | null;
  consecutiveWrong: number;
  servedItemIds: string[];
  totalServed: number;
  /** Modules the learner actually PROVED (sampled/probed to threshold). These
   *  get their lessons completed. */
  passedModules: string[];
  /** Modules credited from the placement floor but NOT directly tested. Atoms
   *  get seeded into review and lessons are marked complete (bounded by the
   *  declared band — never above the floor). Surfaced in the result so a skip
   *  is never silent. */
  assumedModules: string[];
  /** Grammar points answered wrong — named in the gap report and queued into
   *  review. */
  missedSkills: MissedSkill[];
};

const MAX_TOTAL_ITEMS = 40;
/** How many modules to sample within a chosen band (spread across it). */
const SAMPLE_MODULE_COUNT = 2;
/** Items per sampled module — a few each, capped so total ≤ ~8. */
const SAMPLE_ITEMS_PER_MODULE = 3;
const DEFAULT_LANGUAGE = "ja";

/** True for single-module test-out runs (no banded sampling). */
function isTestOutRun(state: AdaptiveState): boolean {
  return state.sampleModules.length === 0 && state.bandTopModule === null;
}

/**
 * Early-exit threshold for consecutive wrong answers. Test-outs allow 2
 * misses on their ~12-item sets, so their cutoff must sit ABOVE the miss
 * budget: cutting at 2 would end the run with results that still satisfy
 * modulePassed (2 wrong ≤ 2 allowed) — a pass on partial evidence. At 3,
 * a cutoff exit always carries 3 wrongs and fails honestly. Banded sampling
 * never early-exits (each module gets its full sample), so cutoff is
 * effectively disabled there.
 */
function wrongCutoff(state: AdaptiveState): number {
  if (state.stage === "sampling") return Infinity;
  return isTestOutRun(state) ? 3 : 2;
}

/**
 * A module is PASSED (verified) only if the learner met the bar on its probe
 * set. Short sets demand a clean sweep; longer coverage-scaled sets (one item
 * per grammar point) allow a single slip so one careless miss doesn't sink a
 * module the learner clearly knows. Never lenient enough to pass on guesses.
 */
export function moduleMaxMisses(itemCount: number): number {
  // Derived test-outs run ~12 items; demanding 11/12 (one miss) tested
  // like a memory exam, not a placement check. Placement probes stay at
  // 3 items → 0 misses, unchanged.
  if (itemCount >= 10) return 2;
  return itemCount >= 5 ? 1 : 0;
}

export function modulePassed(results: readonly boolean[]): boolean {
  if (results.length === 0) return false;
  const wrong = results.filter((r) => !r).length;
  return wrong <= moduleMaxMisses(results.length);
}

/**
 * Pick the modules to sample within a band: spread `SAMPLE_MODULE_COUNT`
 * evenly across the band's module list (so we probe the low, mid, and/or high
 * end of the band rather than clustering). Always includes the band TOP so the
 * ceiling is actually tested. Deduped, in course order.
 */
export function pickSampleModules(bandModules: readonly string[]): string[] {
  if (bandModules.length === 0) return [];
  if (bandModules.length <= SAMPLE_MODULE_COUNT) return [...bandModules];
  const picked = new Set<string>();
  // Always sample the band top (the credit ceiling) and one lower anchor.
  picked.add(bandModules[bandModules.length - 1]);
  const stride = (bandModules.length - 1) / SAMPLE_MODULE_COUNT;
  for (let i = 0; i < SAMPLE_MODULE_COUNT && picked.size < SAMPLE_MODULE_COUNT; i++) {
    const idx = Math.min(bandModules.length - 1, Math.round(i * stride));
    picked.add(bandModules[idx]);
  }
  // Restore course order.
  return bandModules.filter((m) => picked.has(m));
}

/**
 * Banded self-declared-level placement (2026-07-15). Samples ~2 modules inside
 * the chosen band and bounds credit to the band top. A "complete beginner"
 * band (no `bandModules`) yields a state that finalizes immediately with
 * nothing sampled and nothing credited (start at M1).
 */
export function createBandedState(
  band: PlacementLevelBand,
  languageId: string = DEFAULT_LANGUAGE,
): AdaptiveState {
  const sampleModules = pickSampleModules(band.bandModules);
  const bandTopModule =
    band.bandModules.length > 0
      ? band.bandModules[band.bandModules.length - 1]
      : null;
  const base: AdaptiveState = {
    languageId,
    stage: "sampling",
    sampleModules,
    bandTopModule,
    probeResults: {},
    probeQueue: sampleModules,
    currentProbeModule: sampleModules[0] ?? null,
    consecutiveWrong: 0,
    servedItemIds: [],
    totalServed: 0,
    passedModules: [],
    assumedModules: [],
    missedSkills: [],
  };
  // Complete-beginner (or a band with no testable modules) → done immediately,
  // crediting nothing.
  if (sampleModules.length === 0) {
    return finalizeState(base);
  }
  return base;
}

export function createTestOutState(
  moduleId: string,
  languageId: string = DEFAULT_LANGUAGE,
): AdaptiveState {
  return {
    languageId,
    stage: "probing",
    sampleModules: [],
    bandTopModule: null,
    probeResults: {},
    probeQueue: [moduleId],
    currentProbeModule: moduleId,
    consecutiveWrong: 0,
    servedItemIds: [],
    totalServed: 0,
    passedModules: [],
    assumedModules: [],
    missedSkills: [],
  };
}

/** Max items to serve from a single module. Banded sampling caps each module
 *  at a few questions; probing/test-out serve the whole derived set. */
function moduleItemBudget(state: AdaptiveState): number {
  return state.stage === "sampling" ? SAMPLE_ITEMS_PER_MODULE : Infinity;
}

export function selectNextItem(
  state: AdaptiveState,
  getItemsForModule: (moduleId: string) => PlacementItemConfig[],
): PlacementItemConfig | null {
  if (state.stage === "done") return null;
  if (state.totalServed >= MAX_TOTAL_ITEMS) return null;
  if (state.stage !== "sampling" && state.stage !== "probing") return null;
  if (state.consecutiveWrong >= wrongCutoff(state)) return null;

  // Both sampling and probing walk a module queue, serving unserved items
  // (bounded per-module in sampling). The stages differ only in how modules
  // are chosen and how many items each yields.
  const served = new Set(state.servedItemIds);
  const budget = moduleItemBudget(state);

  const modId = state.currentProbeModule ?? state.probeQueue[0];
  if (!modId) return null;

  const curAnswered = (state.probeResults[modId] ?? []).length;
  if (curAnswered < budget) {
    const items = getItemsForModule(modId);
    const unserved = items.filter((i) => !served.has(i.id));
    if (unserved.length > 0) return unserved[0];
  }

  const queueIdx = state.probeQueue.indexOf(modId);
  for (let i = queueIdx + 1; i < state.probeQueue.length; i++) {
    const nextMod = state.probeQueue[i];
    if ((state.probeResults[nextMod] ?? []).length >= budget) continue;
    const nextItems = getItemsForModule(nextMod);
    const nextUnserved = nextItems.filter((it) => !served.has(it.id));
    if (nextUnserved.length > 0) return nextUnserved[0];
  }

  return null;
}

export function finalizeState(state: AdaptiveState): AdaptiveState {
  if (state.stage === "done") return state;
  const done: AdaptiveState = { ...state, stage: "done" };
  markDone(done);
  return done;
}

/** Set the terminal outcome on a state being transitioned to "done". */
function markDone(next: AdaptiveState): void {
  next.stage = "done";
  const { verified, assumed } = computeOutcome(next);
  next.passedModules = verified;
  next.assumedModules = assumed;
}

export function recordAnswer(
  state: AdaptiveState,
  itemId: string,
  correct: boolean,
  getItemsForModule: (moduleId: string) => PlacementItemConfig[],
): AdaptiveState {
  if (state.stage !== "sampling" && state.stage !== "probing") return state;

  const next: AdaptiveState = {
    ...state,
    servedItemIds: [...state.servedItemIds, itemId],
    totalServed: state.totalServed + 1,
  };

  const modId = state.currentProbeModule!;

  // Record the specific grammar point behind any wrong answer, for the gap
  // report / review queue.
  if (!correct && modId) {
    const item = getItemsForModule(modId).find((i) => i.id === itemId);
    next.missedSkills = [
      ...state.missedSkills,
      {
        moduleId: modId,
        grammarPointId: item?.grammarPointId,
        skill: item?.skill,
      },
    ];
  }

  const existing = state.probeResults[modId] ?? [];
  next.probeResults = {
    ...state.probeResults,
    [modId]: [...existing, correct],
  };

  // Probing (test-out) early-exits on consecutive wrong; sampling never does
  // (wrongCutoff is Infinity there) so every sampled module gets its full set.
  next.consecutiveWrong = correct ? 0 : state.consecutiveWrong + 1;
  if (
    next.consecutiveWrong >= wrongCutoff(next) ||
    next.totalServed >= MAX_TOTAL_ITEMS
  ) {
    markDone(next);
    return next;
  }

  // Advance to the next queued module once the current one is exhausted
  // (budget reached, or no unserved items remain).
  const answered = (next.probeResults[modId] ?? []).length;
  const budget = moduleItemBudget(next);
  const served = new Set(next.servedItemIds);
  const remaining = getItemsForModule(modId).filter((i) => !served.has(i.id));

  if (answered >= budget || remaining.length === 0) {
    const queueIdx = next.probeQueue.indexOf(modId);
    let advanced = false;
    for (let i = queueIdx + 1; i < next.probeQueue.length; i++) {
      const nextMod = next.probeQueue[i];
      if ((next.probeResults[nextMod] ?? []).length >= budget) continue;
      const nextItems = getItemsForModule(nextMod);
      if (nextItems.some((it) => !served.has(it.id))) {
        next.currentProbeModule = nextMod;
        advanced = true;
        break;
      }
    }
    if (!advanced) {
      markDone(next);
    }
  }

  return next;
}

/**
 * Split the run into VERIFIED (proved to threshold — lessons completed) and
 * ASSUMED (below the placement floor, credited with no XP + seeded into
 * review). The anti-leniency + anti-runaway rules: a module is only VERIFIED
 * if the learner actually demonstrated it, and NOTHING above the floor is ever
 * returned. For a banded run the floor is bounded by the declared band top.
 */
export type PlacementOutcome = { verified: string[]; assumed: string[] };

export function computeOutcome(state: AdaptiveState): PlacementOutcome {
  const order = getAllTestableModules(state.languageId);
  const orderIdx = (m: string) => order.indexOf(m);

  if (isTestOutRun(state)) {
    // Test-out: passing a module means the learner is at least at that level,
    // so every module ORDERED BEFORE it is credited with no XP. A fail changes
    // nothing before it (verified stays empty).
    const verified: string[] = [];
    for (const [modId, results] of Object.entries(state.probeResults)) {
      if (modulePassed(results)) verified.push(modId);
    }
    const assumed: string[] = [];
    if (verified.length > 0) {
      const testedIdx = Math.min(
        ...verified.map(orderIdx).filter((i) => i >= 0),
      );
      if (testedIdx > 0) {
        const verifiedSet = new Set(verified);
        for (const m of order.slice(0, testedIdx)) {
          if (!verifiedSet.has(m)) assumed.push(m);
        }
      }
    }
    return { verified, assumed };
  }

  // Banded self-declared-level placement (2026-07-15). Verified = sampled
  // modules that passed. Floor = the highest-in-course-order sampled module
  // that passed, CAPPED at the band top. If the learner passed nothing they
  // over-declared → place at the band BOTTOM (floor = just below the lowest
  // sampled module), crediting nothing inside/above the band. Everything
  // strictly below the floor is assumed; NOTHING at/above the floor beyond the
  // verified modules themselves is ever credited.
  const verified: string[] = [];
  for (const modId of state.sampleModules) {
    const results = state.probeResults[modId];
    if (results && modulePassed(results)) verified.push(modId);
  }

  const bandTopIdx = state.bandTopModule ? orderIdx(state.bandTopModule) : -1;

  let floorIdx: number;
  if (verified.length > 0) {
    // Highest passed sampled module, capped at the band top.
    const highestPassedIdx = Math.max(
      ...verified.map(orderIdx).filter((i) => i >= 0),
    );
    floorIdx = bandTopIdx >= 0 ? Math.min(highestPassedIdx, bandTopIdx) : highestPassedIdx;
  } else {
    // Passed nothing in the band → place at the band bottom: floor sits just
    // below the lowest sampled module, so nothing in/above the band credits.
    const sampledIdxs = state.sampleModules.map(orderIdx).filter((i) => i >= 0);
    floorIdx = sampledIdxs.length > 0 ? Math.min(...sampledIdxs) - 1 : -1;
  }

  const verifiedSet = new Set(verified);
  const assumed: string[] = [];
  for (const modId of order) {
    const idx = orderIdx(modId);
    if (idx < 0 || idx > floorIdx) continue; // never credit at/above the floor
    if (verifiedSet.has(modId)) continue; // already verified
    assumed.push(modId);
  }

  return { verified, assumed };
}
