import {
  getSkillTiers,
  getAllTestableModules,
  getTierForModule,
} from "../tiers";
import type { PlacementItemConfig } from "../questionBank";

export type PlacementStage = "screening" | "probing" | "done";

/** A grammar point the learner got wrong — feeds the placement gap report. */
export type MissedSkill = {
  moduleId: string;
  grammarPointId?: string;
  skill?: string;
};

export type AdaptiveState = {
  /** Course the placement is leveling. Drives the tier set (which modules
   *  group together + which is the screening rep). */
  languageId: string;
  stage: PlacementStage;
  screeningResults: Record<number, boolean>;
  estimatedFloorTier: number | null;
  probeResults: Record<string, boolean[]>;
  probeQueue: string[];
  currentProbeModule: string | null;
  consecutiveWrong: number;
  servedItemIds: string[];
  totalServed: number;
  /** Modules the learner actually PROVED (probed to threshold). These get
   *  their lessons completed. */
  passedModules: string[];
  /** Modules assumed known from the floor estimate but NOT tested. Atoms get
   *  seeded into review, but lessons are NOT auto-completed — the learner can
   *  test out of each or walk it. Surfaced in the gap report so a skip is
   *  never silent. */
  assumedModules: string[];
  /** Grammar points answered wrong — named in the gap report and queued into
   *  review. */
  missedSkills: MissedSkill[];
};

const MAX_TOTAL_ITEMS = 40;
const CONSECUTIVE_WRONG_CUTOFF = 2;
const DEFAULT_LANGUAGE = "ja";

/** True for single-module test-out runs (no screening phase). */
function isTestOutRun(state: AdaptiveState): boolean {
  return (
    state.estimatedFloorTier === null &&
    Object.keys(state.screeningResults).length === 0
  );
}

/**
 * Early-exit threshold for consecutive wrong answers. Test-outs allow 2
 * misses on their ~12-item sets, so their cutoff must sit ABOVE the miss
 * budget: cutting at 2 would end the run with results that still satisfy
 * modulePassed (2 wrong ≤ 2 allowed) — a pass on partial evidence. At 3,
 * a cutoff exit always carries 3 wrongs and fails honestly.
 */
function wrongCutoff(state: AdaptiveState): number {
  return isTestOutRun(state) ? 3 : CONSECUTIVE_WRONG_CUTOFF;
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

export function createInitialState(
  languageId: string = DEFAULT_LANGUAGE,
): AdaptiveState {
  return {
    languageId,
    stage: "screening",
    screeningResults: {},
    estimatedFloorTier: null,
    probeResults: {},
    probeQueue: [],
    currentProbeModule: null,
    consecutiveWrong: 0,
    servedItemIds: [],
    totalServed: 0,
    passedModules: [],
    assumedModules: [],
    missedSkills: [],
  };
}

export function createTestOutState(
  moduleId: string,
  languageId: string = DEFAULT_LANGUAGE,
): AdaptiveState {
  return {
    languageId,
    stage: "probing",
    screeningResults: {},
    estimatedFloorTier: null,
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

export function selectNextItem(
  state: AdaptiveState,
  getItemsForModule: (moduleId: string) => PlacementItemConfig[],
): PlacementItemConfig | null {
  if (state.stage === "done") return null;
  if (state.totalServed >= MAX_TOTAL_ITEMS) return null;

  const tiers = getSkillTiers(state.languageId);
  const served = new Set(state.servedItemIds);

  if (state.stage === "screening") {
    const nextTierIdx = Object.keys(state.screeningResults).length;
    if (nextTierIdx >= tiers.length) return null;
    const tier = tiers[nextTierIdx];
    const items = getItemsForModule(tier.screeningModuleId);
    return items.find((i) => !served.has(i.id)) ?? null;
  }

  if (state.stage === "probing") {
    if (state.consecutiveWrong >= wrongCutoff(state)) return null;

    const modId = state.currentProbeModule ?? state.probeQueue[0];
    if (!modId) return null;

    const items = getItemsForModule(modId);
    const unserved = items.filter((i) => !served.has(i.id));
    if (unserved.length > 0) return unserved[0];

    const queueIdx = state.probeQueue.indexOf(modId);
    for (let i = queueIdx + 1; i < state.probeQueue.length; i++) {
      const nextItems = getItemsForModule(state.probeQueue[i]);
      const nextUnserved = nextItems.filter((it) => !served.has(it.id));
      if (nextUnserved.length > 0) return nextUnserved[0];
    }
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

function computeFloorTier(results: Record<number, boolean>): number {
  let highestPassed = -1;
  for (const [tier, passed] of Object.entries(results)) {
    if (passed && Number(tier) > highestPassed) highestPassed = Number(tier);
  }
  return highestPassed + 1;
}

function buildProbeWindow(floorTier: number, languageId: string): string[] {
  const tiers = getSkillTiers(languageId);
  const tierIdxs: number[] = [];
  if (floorTier >= tiers.length) {
    tierIdxs.push(tiers.length - 2, tiers.length - 1);
  } else {
    if (floorTier > 0) tierIdxs.push(floorTier - 1);
    tierIdxs.push(floorTier);
    if (floorTier + 1 < tiers.length) tierIdxs.push(floorTier + 1);
  }

  const modules: string[] = [];
  for (const t of tierIdxs) {
    if (t >= 0 && t < tiers.length) modules.push(...tiers[t].modules);
  }
  return modules.slice(0, 7);
}

export function recordAnswer(
  state: AdaptiveState,
  itemId: string,
  correct: boolean,
  getItemsForModule: (moduleId: string) => PlacementItemConfig[],
): AdaptiveState {
  const tiers = getSkillTiers(state.languageId);
  const next: AdaptiveState = {
    ...state,
    servedItemIds: [...state.servedItemIds, itemId],
    totalServed: state.totalServed + 1,
  };

  // Record the specific grammar point behind any wrong answer, for the gap
  // report. The module is the current probe module, or (in screening) the
  // tier's screening module.
  if (!correct) {
    const missModId =
      state.stage === "screening"
        ? tiers[Object.keys(state.screeningResults).length]?.screeningModuleId
        : state.currentProbeModule;
    if (missModId) {
      const item = getItemsForModule(missModId).find((i) => i.id === itemId);
      next.missedSkills = [
        ...state.missedSkills,
        {
          moduleId: missModId,
          grammarPointId: item?.grammarPointId,
          skill: item?.skill,
        },
      ];
    }
  }

  if (state.stage === "screening") {
    const tierIdx = Object.keys(state.screeningResults).length;
    next.screeningResults = { ...state.screeningResults, [tierIdx]: correct };

    if (Object.keys(next.screeningResults).length >= tiers.length) {
      const floor = computeFloorTier(next.screeningResults);
      next.estimatedFloorTier = floor;
      next.stage = "probing";
      next.probeQueue = buildProbeWindow(floor, state.languageId);
      next.currentProbeModule = next.probeQueue[0] ?? null;

      if (next.probeQueue.length === 0) {
        markDone(next);
      }
    }
    return next;
  }

  if (state.stage === "probing") {
    const modId = state.currentProbeModule!;
    const existing = state.probeResults[modId] ?? [];
    next.probeResults = {
      ...state.probeResults,
      [modId]: [...existing, correct],
    };

    next.consecutiveWrong = correct ? 0 : state.consecutiveWrong + 1;

    if (next.consecutiveWrong >= wrongCutoff(next) || next.totalServed >= MAX_TOTAL_ITEMS) {
      markDone(next);
      return next;
    }

    const served = new Set(next.servedItemIds);
    const modItems = getItemsForModule(modId);
    const remaining = modItems.filter((i) => !served.has(i.id));

    if (remaining.length === 0) {
      const queueIdx = next.probeQueue.indexOf(modId);
      let advanced = false;
      for (let i = queueIdx + 1; i < next.probeQueue.length; i++) {
        const nextItems = getItemsForModule(next.probeQueue[i]);
        if (nextItems.some((it) => !served.has(it.id))) {
          next.currentProbeModule = next.probeQueue[i];
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

  return next;
}

/**
 * Split the run into VERIFIED (proved by probing to threshold — get their
 * lessons completed) and ASSUMED (below the estimated floor but never tested —
 * seeded into review, NOT auto-completed, surfaced in the gap report). This is
 * the anti-leniency rule: a module is only "passed" if the learner actually
 * demonstrated it; the floor estimate can *assume* lower modules but never
 * silently completes them.
 */
export type PlacementOutcome = { verified: string[]; assumed: string[] };

export function computeOutcome(state: AdaptiveState): PlacementOutcome {
  const isTestOut =
    state.estimatedFloorTier === null &&
    Object.keys(state.screeningResults).length === 0;

  if (isTestOut) {
    const verified: string[] = [];
    for (const [modId, results] of Object.entries(state.probeResults)) {
      if (modulePassed(results)) verified.push(modId);
    }
    return { verified, assumed: [] };
  }

  const verified: string[] = [];
  const assumed: string[] = [];
  for (const modId of getAllTestableModules(state.languageId)) {
    const probed = state.probeResults[modId];
    if (probed) {
      // Probed: pass only on a real result. A probed-but-failed module is
      // neither verified nor assumed — the learner studies it.
      if (modulePassed(probed)) verified.push(modId);
    } else {
      const modTier = getTierForModule(modId, state.languageId);
      if (modTier !== null && modTier < (state.estimatedFloorTier ?? 0)) {
        assumed.push(modId);
      }
    }
  }

  return { verified, assumed };
}
