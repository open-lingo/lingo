import { describe, it, expect, beforeEach } from "vitest";
import {
  transformCellId,
  getTransformStage,
  isStreakShielded,
  getTransformCellReps,
  recordTransformResult,
} from "./transformCells";
import { clearGrammarStore, getGrammarCardState } from "@/features/flashcards/engine/grammarSrs";

const DAY1 = new Date("2026-07-20T10:00:00");
const DAY2 = new Date("2026-07-21T10:00:00");

beforeEach(() => {
  clearGrammarStore();
  localStorage.clear();
});

describe("transform cells — stage ladder", () => {
  it("fresh cell starts at stage 1 with the shield up", () => {
    expect(getTransformStage("nai", "godan")).toBe(1);
    expect(isStreakShielded("nai", "godan")).toBe(true);
    expect(getTransformCellReps("nai", "godan")).toBe(0);
  });

  it("recognition reps move 1 → 2, but NEVER 3 same-day (consolidation gate)", () => {
    recordTransformResult({ form: "nai", group: "godan", stage: 1, correct: true, peeked: false, at: DAY1 });
    recordTransformResult({ form: "nai", group: "godan", stage: 2, correct: true, peeked: false, at: DAY1 });
    expect(getTransformStage("nai", "godan", "2026-07-20")).toBe(2);
  });

  it("graduates to stage 3 only on a later day", () => {
    recordTransformResult({ form: "nai", group: "godan", stage: 1, correct: true, peeked: false, at: DAY1 });
    recordTransformResult({ form: "nai", group: "godan", stage: 2, correct: true, peeked: false, at: DAY1 });
    expect(getTransformStage("nai", "godan", "2026-07-21")).toBe(3);
  });

  it("MCQ success never advances the production modality (skill specificity)", () => {
    recordTransformResult({ form: "nai", group: "godan", stage: 2, correct: true, peeked: false, at: DAY1 });
    const card = getGrammarCardState(transformCellId("nai", "godan"));
    expect(card?.recognition.reps).toBe(1);
    expect(card?.production.reps).toBe(0);
  });

  it("typed results grade the production modality", () => {
    recordTransformResult({ form: "nai", group: "godan", stage: 3, correct: true, peeked: false, at: DAY2 });
    const card = getGrammarCardState(transformCellId("nai", "godan"));
    expect(card?.production.reps).toBe(1);
    expect(card?.recognition.reps).toBe(0);
  });

  it("a production failure demotes the cell, and a slept-on MCQ pass re-graduates it", () => {
    recordTransformResult({ form: "nai", group: "godan", stage: 1, correct: true, peeked: false, at: DAY1 });
    recordTransformResult({ form: "nai", group: "godan", stage: 2, correct: true, peeked: false, at: DAY1 });
    // graduated by DAY2…
    expect(getTransformStage("nai", "godan", "2026-07-21")).toBe(3);
    // …then fails typed production → demoted, and stays demoted next day.
    recordTransformResult({ form: "nai", group: "godan", stage: 3, correct: false, peeked: false, at: DAY2 });
    expect(getTransformStage("nai", "godan", "2026-07-22")).toBe(2);
    // A recognition rep on a LATER day than the failure is the re-entry
    // ticket: the day after that, the cell is stage 3 again.
    recordTransformResult({ form: "nai", group: "godan", stage: 2, correct: true, peeked: false, at: new Date("2026-07-22T10:00:00") });
    expect(getTransformStage("nai", "godan", "2026-07-23")).toBe(3);
    // A production pass clears the failure flag outright.
    recordTransformResult({ form: "nai", group: "godan", stage: 3, correct: true, peeked: false, at: new Date("2026-07-23T10:00:00") });
    expect(getTransformStage("nai", "godan", "2026-07-24")).toBe(3);
  });

  it("shield drops once total reps reach 5", () => {
    for (let i = 0; i < 5; i++) {
      recordTransformResult({ form: "nai", group: "godan", stage: 2, correct: true, peeked: false, at: DAY1 });
    }
    expect(isStreakShielded("nai", "godan")).toBe(false);
    expect(getTransformCellReps("nai", "godan")).toBe(5);
  });

  it("cells are per verb-class: う-verb reps leave る-verb cell untouched", () => {
    recordTransformResult({ form: "nai", group: "godan", stage: 1, correct: true, peeked: false, at: DAY1 });
    expect(getTransformStage("nai", "ichidan")).toBe(1);
  });

  it("peeked correct answers grade 'hard' (half credit), never 'good'", () => {
    recordTransformResult({ form: "nai", group: "irregular", stage: 2, correct: true, peeked: true, at: DAY1 });
    const card = getGrammarCardState(transformCellId("nai", "irregular"));
    // "hard" still counts a rep but with lower stability than "good".
    expect(card?.recognition.reps).toBe(1);
    const hardStability = card!.recognition.stability;
    clearGrammarStore();
    recordTransformResult({ form: "nai", group: "irregular", stage: 2, correct: true, peeked: false, at: DAY1 });
    const clean = getGrammarCardState(transformCellId("nai", "irregular"));
    expect(clean!.recognition.stability).toBeGreaterThan(hardStability);
  });
});
