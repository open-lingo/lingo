import {
  getSkillTiers,
  getAllTestableModules,
  getTierForModule,
} from "../tiers";
import type { PlacementItemConfig } from "../questionBank";

export type PlacementStage = "screening" | "probing" | "done";

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
  passedModules: string[];
};

const MAX_TOTAL_ITEMS = 25;
const CONSECUTIVE_WRONG_CUTOFF = 2;
const DEFAULT_LANGUAGE = "ja";

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
    if (state.consecutiveWrong >= CONSECUTIVE_WRONG_CUTOFF) return null;

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
  return { ...state, stage: "done", passedModules: computePassedModules(state) };
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
        next.stage = "done";
        next.passedModules = computePassedModules(next);
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

    if (next.consecutiveWrong >= CONSECUTIVE_WRONG_CUTOFF || next.totalServed >= MAX_TOTAL_ITEMS) {
      next.stage = "done";
      next.passedModules = computePassedModules(next);
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
        next.stage = "done";
        next.passedModules = computePassedModules(next);
      }
    }

    return next;
  }

  return next;
}

function computePassedModules(state: AdaptiveState): string[] {
  const isTestOut = state.estimatedFloorTier === null &&
    Object.keys(state.screeningResults).length === 0;

  if (isTestOut) {
    const passed: string[] = [];
    for (const [modId, results] of Object.entries(state.probeResults)) {
      if (results.every((r) => r)) passed.push(modId);
    }
    return passed;
  }

  const passed: string[] = [];
  for (const modId of getAllTestableModules(state.languageId)) {
    const probed = state.probeResults[modId];

    if (probed) {
      if (probed.every((r) => r)) {
        passed.push(modId);
      } else {
        break;
      }
    } else {
      const modTier = getTierForModule(modId, state.languageId);
      if (modTier !== null && modTier < (state.estimatedFloorTier ?? 0)) {
        passed.push(modId);
      } else {
        break;
      }
    }
  }

  return passed;
}
