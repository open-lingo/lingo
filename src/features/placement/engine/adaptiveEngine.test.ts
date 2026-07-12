import { describe, it, expect } from "vitest";
import {
  createInitialState,
  createTestOutState,
  selectNextItem,
  recordAnswer,
  modulePassed,
  type AdaptiveState,
} from "./adaptiveEngine";
import {
  SKILL_TIERS,
  ALL_TESTABLE_MODULES,
  getSkillTiers,
  getAllTestableModules,
  getTierForModule,
} from "../tiers";
import type { PlacementItemConfig } from "../questionBank";

function makeItem(id: string, moduleId: string): PlacementItemConfig {
  return {
    id,
    moduleId,
    grammarPointId: `${moduleId}-gp`,
    skill: `${moduleId} skill`,
    type: "sentenceMcq",
    prompt: "test",
    correctKana: "テスト",
    distractorsKana: ["ア", "イ", "ウ"],
  };
}

const MOCK_BANK: Record<string, PlacementItemConfig[]> = {};
for (const mod of ALL_TESTABLE_MODULES) {
  MOCK_BANK[mod] = [
    makeItem(`pt-${mod}-1`, mod),
    makeItem(`pt-${mod}-2`, mod),
    makeItem(`pt-${mod}-3`, mod),
  ];
}

function getItems(moduleId: string): PlacementItemConfig[] {
  return MOCK_BANK[moduleId] ?? [];
}

function runScreening(answers: boolean[]): AdaptiveState {
  let state = createInitialState();
  for (let i = 0; i < SKILL_TIERS.length; i++) {
    const item = selectNextItem(state, getItems);
    expect(item).not.toBeNull();
    state = recordAnswer(state, item!.id, answers[i] ?? false, getItems);
  }
  return state;
}

describe("adaptiveEngine", () => {
  it("starts in screening stage", () => {
    const state = createInitialState();
    expect(state.stage).toBe("screening");
    expect(state.totalServed).toBe(0);
  });

  it("screening serves one item per tier", () => {
    let state = createInitialState();
    const seenModules: string[] = [];
    for (let i = 0; i < SKILL_TIERS.length; i++) {
      const item = selectNextItem(state, getItems);
      expect(item).not.toBeNull();
      seenModules.push(item!.moduleId);
      state = recordAnswer(state, item!.id, true, getItems);
    }
    for (let i = 0; i < SKILL_TIERS.length; i++) {
      expect(seenModules[i]).toBe(SKILL_TIERS[i].screeningModuleId);
    }
  });

  it("transitions to probing after 8 screening items", () => {
    const state = runScreening([true, true, true, true, false, false, false, false]);
    expect(state.stage).toBe("probing");
    expect(state.estimatedFloorTier).toBe(4);
    expect(state.probeQueue.length).toBeGreaterThan(0);
  });

  it("all screening correct → floor at max tier", () => {
    const allCorrect = Array(SKILL_TIERS.length).fill(true);
    const state = runScreening(allCorrect);
    expect(state.stage).toBe("probing");
    expect(state.estimatedFloorTier).toBe(SKILL_TIERS.length);
  });

  it("all screening wrong → floor at tier 0", () => {
    const allWrong = Array(SKILL_TIERS.length).fill(false);
    const state = runScreening(allWrong);
    expect(state.stage).toBe("probing");
    expect(state.estimatedFloorTier).toBe(0);
  });

  it("probing serves items from the probe window", () => {
    let state = runScreening([true, true, true, false, false, false, false, false]);
    expect(state.stage).toBe("probing");

    const item = selectNextItem(state, getItems);
    expect(item).not.toBeNull();
    expect(state.probeQueue).toContain(item!.moduleId);
  });

  it("2 consecutive wrong terminates probing", () => {
    let state = runScreening([true, true, false, false, false, false, false, false]);
    expect(state.stage).toBe("probing");

    const item1 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, item1.id, false, getItems);
    expect(state.stage).toBe("probing");

    const item2 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, item2.id, false, getItems);
    expect(state.stage).toBe("done");
  });

  it("correct answer resets consecutive wrong counter", () => {
    let state = runScreening([true, true, false, false, false, false, false, false]);

    const item1 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, item1.id, false, getItems);
    expect(state.consecutiveWrong).toBe(1);

    const item2 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, item2.id, true, getItems);
    expect(state.consecutiveWrong).toBe(0);
  });

  it("all correct → probed modules VERIFIED, lower modules ASSUMED (never silently completed)", () => {
    let state = runScreening(Array(8).fill(true));

    while (state.stage !== "done") {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, true, getItems);
    }

    // Verified = actually probed to threshold.
    expect(state.passedModules.length).toBeGreaterThan(0);
    expect(state.passedModules.every((m) => state.probeResults[m])).toBe(true);
    // The floor estimate no longer silently completes lower modules — they are
    // ASSUMED (seeded/queued) and never appear in the verified/passed list.
    expect(state.assumedModules).toContain("m3");
    expect(state.passedModules).not.toContain("m3");
  });

  it("all wrong → nothing verified, nothing assumed", () => {
    let state = runScreening(Array(8).fill(false));

    while (state.stage !== "done") {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, false, getItems);
    }

    expect(state.passedModules).toEqual([]);
    expect(state.assumedModules).toEqual([]);
  });

  it("verified modules were probed; assumed modules sit strictly below the floor", () => {
    let state = runScreening([true, true, true, false, false, false, false, false]);

    while (state.stage !== "done") {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, true, getItems);
    }

    for (const m of state.passedModules) {
      expect(state.probeResults[m]).toBeDefined();
    }
    for (const m of state.assumedModules) {
      expect(state.probeResults[m]).toBeUndefined();
      const tier = getTierForModule(m, "ja");
      expect(tier).not.toBeNull();
      expect(tier! < (state.estimatedFloorTier ?? 0)).toBe(true);
    }
  });

  it("modulePassed: short sets need a clean sweep; sets of 5+ allow one slip", () => {
    expect(modulePassed([true, true, true])).toBe(true);
    expect(modulePassed([true, true, false])).toBe(false); // 3 items, 0 allowed
    expect(modulePassed(Array(8).fill(true))).toBe(true);
    expect(modulePassed([...Array(7).fill(true), false])).toBe(true); // 7/8 ok
    expect(modulePassed([...Array(6).fill(true), false, false])).toBe(false); // 2 misses
    expect(modulePassed([])).toBe(false);
  });

  it("records the grammar point behind every wrong answer for the gap report", () => {
    let state = createTestOutState("m10");
    // 3 items, answer the 2nd wrong.
    const i1 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, i1.id, true, getItems);
    const i2 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, i2.id, false, getItems);
    const i3 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, i3.id, true, getItems);

    expect(state.missedSkills).toHaveLength(1);
    expect(state.missedSkills[0]).toMatchObject({
      moduleId: "m10",
      grammarPointId: "m10-gp",
    });
  });

  it("respects the max-items cap (40) so coverage-scaled tests still terminate", () => {
    let state = runScreening(Array(8).fill(true));
    let count = 8;

    while (state.stage !== "done" && count < 60) {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, true, getItems);
      count++;
    }

    expect(state.totalServed).toBeLessThanOrEqual(40);
  });

  describe("test-out mode", () => {
    it("starts in probing with single module", () => {
      const state = createTestOutState("m10");
      expect(state.stage).toBe("probing");
      expect(state.probeQueue).toEqual(["m10"]);
      expect(state.currentProbeModule).toBe("m10");
    });

    it("serves 3 items for the target module", () => {
      let state = createTestOutState("m10");
      const served: string[] = [];

      while (state.stage !== "done") {
        const item = selectNextItem(state, getItems);
        if (!item) break;
        served.push(item.id);
        state = recordAnswer(state, item.id, true, getItems);
      }

      expect(served).toEqual(["pt-m10-1", "pt-m10-2", "pt-m10-3"]);
    });

    it("3/3 correct → module passed", () => {
      let state = createTestOutState("m10");

      for (let i = 0; i < 3; i++) {
        const item = selectNextItem(state, getItems)!;
        state = recordAnswer(state, item.id, true, getItems);
      }

      expect(state.stage).toBe("done");
      expect(state.passedModules).toContain("m10");
    });

    it("1 wrong → module not passed", () => {
      let state = createTestOutState("m10");

      const i1 = selectNextItem(state, getItems)!;
      state = recordAnswer(state, i1.id, true, getItems);
      const i2 = selectNextItem(state, getItems)!;
      state = recordAnswer(state, i2.id, false, getItems);
      const i3 = selectNextItem(state, getItems)!;
      state = recordAnswer(state, i3.id, true, getItems);

      expect(state.stage).toBe("done");
      expect(state.passedModules).not.toContain("m10");
    });
  });

  // ── Language-aware auto-leveling (KO) ────────────────────────────────
  describe("language-aware leveling (ko)", () => {
    // A KO mock bank spanning every KO testable module.
    const KO_BANK: Record<string, PlacementItemConfig[]> = {};
    for (const mod of getAllTestableModules("ko")) {
      KO_BANK[mod] = [
        makeItem(`ko-${mod}-1`, mod),
        makeItem(`ko-${mod}-2`, mod),
        makeItem(`ko-${mod}-3`, mod),
      ];
    }
    const getKoItems = (m: string) => KO_BANK[m] ?? [];

    it("createInitialState records the language and uses KO tiers", () => {
      const state = createInitialState("ko");
      expect(state.languageId).toBe("ko");
      // KO screening serves one item per KO tier (9 tiers, m1..m27).
      const seen: string[] = [];
      let s = state;
      for (let i = 0; i < getSkillTiers("ko").length; i++) {
        const item = selectNextItem(s, getKoItems)!;
        seen.push(item.moduleId);
        s = recordAnswer(s, item.id, true, getKoItems);
      }
      // First screening item is KO tier 0's screening module (m1), proving
      // the engine is NOT using the JA tier set (which starts at m3).
      expect(seen[0]).toBe("m1");
      expect(s.stage).toBe("probing");
    });

    it("all-correct KO screening verifies probed KO modules and assumes lower ones", () => {
      let s = createInitialState("ko");
      // Drive the entire test all-correct.
      for (let guard = 0; guard < 60; guard++) {
        const item = selectNextItem(s, getKoItems);
        if (!item) break;
        s = recordAnswer(s, item.id, true, getKoItems);
        if (s.stage === "done") break;
      }
      expect(s.stage).toBe("done");
      // No silent whole-course pass anymore: split into verified + assumed,
      // and every KO module is accounted for in one bucket or the other.
      const covered = new Set([...s.passedModules, ...s.assumedModules]);
      expect(covered.has("m1")).toBe(true);
      expect(s.passedModules.length).toBeGreaterThan(0);
      expect(s.passedModules.every((m) => s.probeResults[m])).toBe(true);
    });

    it("KO test-out probes only the target module", () => {
      let s = createTestOutState("m7", "ko");
      expect(s.languageId).toBe("ko");
      for (let guard = 0; guard < 6; guard++) {
        const item = selectNextItem(s, getKoItems);
        if (!item) break;
        expect(item.moduleId).toBe("m7");
        s = recordAnswer(s, item.id, true, getKoItems);
        if (s.stage === "done") break;
      }
      expect(s.stage).toBe("done");
      expect(s.passedModules).toEqual(["m7"]);
    });
  });
});
