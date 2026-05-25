import { describe, it, expect } from "vitest";
import {
  createInitialState,
  createTestOutState,
  selectNextItem,
  recordAnswer,
  type AdaptiveState,
} from "./adaptiveEngine";
import { SKILL_TIERS, ALL_TESTABLE_MODULES } from "../tiers";
import type { PlacementItemConfig } from "../questionBank";

function makeItem(id: string, moduleId: string): PlacementItemConfig {
  return {
    id,
    moduleId,
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

  it("all correct → all modules passed", () => {
    let state = runScreening(Array(8).fill(true));

    while (state.stage !== "done") {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, true, getItems);
    }

    expect(state.passedModules.length).toBe(ALL_TESTABLE_MODULES.length);
  });

  it("all wrong → no modules passed", () => {
    let state = runScreening(Array(8).fill(false));

    while (state.stage !== "done") {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, false, getItems);
    }

    expect(state.passedModules).toEqual([]);
  });

  it("passed modules are contiguous from m3", () => {
    let state = runScreening([true, true, true, false, false, false, false, false]);

    while (state.stage !== "done") {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, true, getItems);
    }

    for (let i = 0; i < state.passedModules.length; i++) {
      expect(state.passedModules[i]).toBe(ALL_TESTABLE_MODULES[i]);
    }
  });

  it("respects max 25 items total", () => {
    let state = runScreening(Array(8).fill(true));
    let count = 8;

    while (state.stage !== "done" && count < 30) {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, true, getItems);
      count++;
    }

    expect(state.totalServed).toBeLessThanOrEqual(25);
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
});
