import { describe, it, expect } from "vitest";
import {
  createBandedState,
  createTestOutState,
  selectNextItem,
  recordAnswer,
  modulePassed,
  pickSampleModules,
  computeOutcome,
  type AdaptiveState,
} from "./adaptiveEngine";
import {
  ALL_TESTABLE_MODULES,
  getAllTestableModules,
} from "../tiers";
import { getLevelBands, getLevelBand } from "../levelBands";
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

function makeBank(modules: readonly string[]): Record<string, PlacementItemConfig[]> {
  const bank: Record<string, PlacementItemConfig[]> = {};
  for (const mod of modules) {
    bank[mod] = [
      makeItem(`pt-${mod}-1`, mod),
      makeItem(`pt-${mod}-2`, mod),
      makeItem(`pt-${mod}-3`, mod),
    ];
  }
  return bank;
}

const MOCK_BANK = makeBank(ALL_TESTABLE_MODULES);
const getItems = (moduleId: string): PlacementItemConfig[] =>
  MOCK_BANK[moduleId] ?? [];

/** Drive a banded run to completion, answering `answerFor(moduleId)` for each
 *  item. Returns the terminal state. */
function runBanded(
  band: Parameters<typeof createBandedState>[0],
  answerFor: (moduleId: string) => boolean,
  langId = "ja",
  lookup = getItems,
): AdaptiveState {
  let state = createBandedState(band, langId);
  let guard = 0;
  while (state.stage !== "done" && guard++ < 60) {
    const item = selectNextItem(state, lookup);
    if (!item) {
      state = { ...state }; // finalize handled by page; here just break
      break;
    }
    state = recordAnswer(state, item.id, answerFor(item.moduleId), lookup);
  }
  return state;
}

const JA = "ja";
const jaBand = (id: string) => getLevelBand(JA, id)!;

describe("adaptiveEngine — banded placement", () => {
  it("pickSampleModules spreads across the band and always includes the top", () => {
    const band = jaBand("basic-sentences"); // m7..m14
    const sampled = pickSampleModules(band.bandModules);
    expect(sampled.length).toBeLessThanOrEqual(2);
    // Course order preserved.
    expect(sampled).toEqual([...sampled].sort((a, b) =>
      band.bandModules.indexOf(a) - band.bandModules.indexOf(b),
    ));
    // Band top is always sampled (the credit ceiling must be tested).
    expect(sampled).toContain(band.bandModules[band.bandModules.length - 1]);
  });

  it("a banded run serves at most ~8 items", () => {
    const band = jaBand("n5"); // widest band
    let state = createBandedState(band, JA);
    let count = 0;
    while (state.stage !== "done" && count < 40) {
      const item = selectNextItem(state, getItems);
      if (!item) break;
      state = recordAnswer(state, item.id, true, getItems);
      count++;
    }
    expect(count).toBeLessThanOrEqual(8);
  });

  it("complete-beginner band credits nothing and starts at M1", () => {
    const state = createBandedState(jaBand("beginner"), JA);
    expect(state.stage).toBe("done");
    expect(state.passedModules).toEqual([]);
    expect(state.assumedModules).toEqual([]);
  });

  it("passing everything places at the highest sampled module (capped at band top)", () => {
    const band = jaBand("kana"); // m3..m6, top m6
    const state = runBanded(band, () => true);
    expect(state.stage).toBe("done");
    // Verified = the sampled modules that passed.
    for (const m of state.passedModules) {
      expect(band.bandModules).toContain(m);
    }
    // Floor never exceeds the band top: no credited module is above m6.
    const order = getAllTestableModules(JA);
    const topIdx = order.indexOf("m6");
    for (const m of [...state.passedModules, ...state.assumedModules]) {
      expect(order.indexOf(m)).toBeLessThanOrEqual(topIdx);
    }
  });

  it("NEVER credits a module above the floor (reported-bug regression)", () => {
    // One-correct-answer runaway is impossible: pass only the LOW sampled
    // module, fail the top — floor must land at the low module, not the top.
    const band = jaBand("basic-sentences"); // m7..m14
    const sampled = pickSampleModules(band.bandModules);
    const low = sampled[0];
    const order = getAllTestableModules(JA);
    const lowIdx = order.indexOf(low);

    const state = runBanded(band, (mod) => mod === low);

    const credited = [...state.passedModules, ...state.assumedModules];
    for (const m of credited) {
      expect(order.indexOf(m)).toBeLessThanOrEqual(lowIdx);
    }
    // The band top (m14) must NOT be credited when only the low module passed.
    expect(credited).not.toContain("m14");
  });

  it("each band caps the max possible floor (anti-runaway)", () => {
    for (const band of getLevelBands(JA)) {
      if (band.bandModules.length === 0) continue;
      const top = band.bandModules[band.bandModules.length - 1];
      const order = getAllTestableModules(JA);
      const topIdx = order.indexOf(top);
      // Even all-correct never credits above the band top.
      const state = runBanded(band, () => true);
      for (const m of [...state.passedModules, ...state.assumedModules]) {
        expect(order.indexOf(m)).toBeLessThanOrEqual(topIdx);
      }
    }
  });

  it("passing NOTHING in a band places at the band bottom, not the top", () => {
    const band = jaBand("n5"); // m15..m27
    const state = runBanded(band, () => false);
    expect(state.passedModules).toEqual([]);
    const order = getAllTestableModules(JA);
    const bottomIdx = order.indexOf(band.bandModules[0]); // m15
    // Nothing at or above the band bottom is credited (over-declared → land
    // at the band bottom, study from there).
    for (const m of state.assumedModules) {
      expect(order.indexOf(m)).toBeLessThan(bottomIdx);
    }
    expect(state.assumedModules).not.toContain("m15");
  });

  it("the old runaway is impossible: no single-answer path completes the whole course", () => {
    // Simulate the worst old case: kana band, pass the top module only.
    const band = jaBand("kana"); // m3..m6
    const state = runBanded(band, (mod) => mod === "m6");
    const credited = new Set([...state.passedModules, ...state.assumedModules]);
    // The 20+ higher modules are never credited from a kana-band placement.
    for (const m of ["m10", "m15", "m20", "m27"]) {
      expect(credited.has(m)).toBe(false);
    }
  });

  it("records missed grammar points for the review queue", () => {
    const band = jaBand("kana");
    const state = runBanded(band, () => false);
    expect(state.missedSkills.length).toBeGreaterThan(0);
    expect(state.missedSkills[0]).toMatchObject({
      grammarPointId: expect.any(String),
    });
  });

  it("modulePassed: short sets need a clean sweep; sets of 5+ allow one slip", () => {
    expect(modulePassed([true, true, true])).toBe(true);
    expect(modulePassed([true, true, false])).toBe(false); // 3 items, 0 allowed
    expect(modulePassed(Array(8).fill(true))).toBe(true);
    expect(modulePassed([...Array(7).fill(true), false])).toBe(true); // 7/8 ok
    expect(modulePassed([...Array(6).fill(true), false, false])).toBe(false);
    expect(modulePassed([])).toBe(false);
  });

  describe("KO banded", () => {
    const KO_BANK = makeBank(getAllTestableModules("ko"));
    const getKo = (m: string) => KO_BANK[m] ?? [];
    const koBand = (id: string) => getLevelBand("ko", id)!;

    it("uses KO module order and never credits above the band top", () => {
      const band = koBand("hangul"); // m3..m6
      const state = runBanded(band, () => true, "ko", getKo);
      const order = getAllTestableModules("ko");
      const topIdx = order.indexOf("m6");
      for (const m of [...state.passedModules, ...state.assumedModules]) {
        expect(order.indexOf(m)).toBeLessThanOrEqual(topIdx);
      }
    });

    it("KO complete-beginner credits nothing", () => {
      const state = createBandedState(koBand("beginner"), "ko");
      expect(state.passedModules).toEqual([]);
      expect(state.assumedModules).toEqual([]);
    });
  });
});

describe("adaptiveEngine — test-out mode (unchanged)", () => {
  it("starts in probing with single module", () => {
    const state = createTestOutState("m10");
    expect(state.stage).toBe("probing");
    expect(state.probeQueue).toEqual(["m10"]);
    expect(state.currentProbeModule).toBe("m10");
  });

  it("serves the target module's items", () => {
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

  it("PASS ⇒ every module ordered BEFORE the tested one is assumed (no credit)", () => {
    let state = createTestOutState("m10");
    for (let i = 0; i < 3; i++) {
      const item = selectNextItem(state, getItems)!;
      state = recordAnswer(state, item.id, true, getItems);
    }
    expect(state.passedModules).toEqual(["m10"]);
    expect(state.assumedModules).toEqual([
      "m3",
      "m4",
      "m5",
      "m6",
      "m7",
      "m8",
      "m9",
    ]);
    expect(state.assumedModules).not.toContain("m10");
    expect(state.assumedModules).not.toContain("m11");
  });

  it("PASS of the first tested module ⇒ empty assumed", () => {
    let state = createTestOutState("m3");
    for (let i = 0; i < 3; i++) {
      const item = selectNextItem(state, getItems)!;
      state = recordAnswer(state, item.id, true, getItems);
    }
    expect(state.passedModules).toEqual(["m3"]);
    expect(state.assumedModules).toEqual([]);
  });

  it("FAIL ⇒ nothing before it changes (empty assumed)", () => {
    let state = createTestOutState("m10");
    const i1 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, i1.id, true, getItems);
    const i2 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, i2.id, false, getItems);
    const i3 = selectNextItem(state, getItems)!;
    state = recordAnswer(state, i3.id, true, getItems);
    expect(state.passedModules).not.toContain("m10");
    expect(state.assumedModules).toEqual([]);
  });

  it("KO PASS ⇒ before-modules assumed against KO order (m1..m6 before m7)", () => {
    let state = createTestOutState("m7", "ko");
    for (let i = 0; i < 3; i++) {
      const item = selectNextItem(state, getItems)!;
      state = recordAnswer(state, item.id, true, getItems);
    }
    expect(state.passedModules).toEqual(["m7"]);
    expect(state.assumedModules).toEqual([
      "m1",
      "m2",
      "m3",
      "m4",
      "m5",
      "m6",
    ]);
  });

  it("records the grammar point behind a wrong answer for the gap report", () => {
    let state = createTestOutState("m10");
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
});

describe("computeOutcome — bounded invariant", () => {
  it("never returns a module above the floor across every JA band + answer mix", () => {
    const order = getAllTestableModules(JA);
    for (const band of getLevelBands(JA)) {
      if (band.bandModules.length === 0) continue;
      const sampled = pickSampleModules(band.bandModules);
      // Try every pass/fail subset of the sampled modules.
      const combos = 1 << sampled.length;
      for (let mask = 0; mask < combos; mask++) {
        const passing = new Set(
          sampled.filter((_, i) => (mask >> i) & 1),
        );
        const state = runBanded(band, (mod) => passing.has(mod));
        const { verified, assumed } = computeOutcome(state);
        // Floor = highest verified index (or band-bottom-1 if none).
        const verifiedIdxs = verified.map((m) => order.indexOf(m));
        const floorIdx =
          verifiedIdxs.length > 0
            ? Math.max(...verifiedIdxs)
            : order.indexOf(band.bandModules[0]) - 1;
        for (const m of [...verified, ...assumed]) {
          expect(order.indexOf(m)).toBeLessThanOrEqual(floorIdx);
        }
      }
    }
  });
});
