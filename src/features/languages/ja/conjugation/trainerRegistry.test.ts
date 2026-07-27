import { describe, it, expect, beforeEach } from "vitest";
import grammarPointsJson from "@/features/lesson/data/n5-grammar-points.json";
import {
  VERB_ENTRIES,
  ADJ_ENTRIES,
} from "../conjugationTables";
import {
  clearGrammarStore,
  setGrammarCardState,
  type GrammarPoint,
} from "@/features/flashcards/engine/grammarSrs";
import { createInitialState, createSeededState } from "@/features/flashcards/engine/srs";
import {
  CONJUGATION_TRAINER_TYPES,
  getTrainerType,
  unlockModuleForType,
  isTypeUnlocked,
  isSelectionAhead,
  effectivePoolModule,
  dueGrammarPointCount,
} from "./trainerRegistry";

const GRAMMAR_POINTS = grammarPointsJson as GrammarPoint[];

// The 9 points the trainer covers — a literal copy of the subset of
// POOL_GAP_EXEMPTIONS the registry claims (importing the pools TEST file is
// disallowed; this list is the contract the trainer must honour).
const TRAINER_COVERED_POINTS = [
  "te-form",
  "ta-form",
  "nai-form",
  "masu-negative",
  "masu-past-negative",
  "v-tai",
  "i-adj-negative",
  "i-adj-past",
  "i-adj-past-negative",
] as const;

describe("conjugation trainer registry", () => {
  it("every grammarPointId resolves to a real shipped GrammarPoint", () => {
    for (const type of CONJUGATION_TRAINER_TYPES) {
      for (const id of type.grammarPointIds) {
        const point = GRAMMAR_POINTS.find((p) => p.id === id);
        expect(point, `point ${id} must exist`).toBeDefined();
        expect(point!.status).toBe("shipped");
      }
    }
  });

  it("covers exactly the intended pool-exempt points", () => {
    const covered = CONJUGATION_TRAINER_TYPES.flatMap((t) => t.grammarPointIds).sort();
    expect(covered).toEqual([...TRAINER_COVERED_POINTS].sort());
  });

  it("getTrainerType resolves known ids and returns undefined otherwise", () => {
    expect(getTrainerType("te-form")?.id).toBe("te-form");
    expect(getTrainerType("nonexistent")).toBeUndefined();
  });

  it("unlockModuleForType derives the latest module across covered points", () => {
    // Asserted against the actual data, not hand-copied numbers.
    const teForm = getTrainerType("te-form")!;
    const teModule = parseInt(
      GRAMMAR_POINTS.find((p) => p.id === "te-form")!.module.slice(1),
      10,
    );
    expect(unlockModuleForType(teForm)).toBe(teModule);

    // masu spans two points; unlock = the max of the two.
    const masu = getTrainerType("masu")!;
    const masuMax = Math.max(
      ...masu.grammarPointIds.map((id) =>
        parseInt(GRAMMAR_POINTS.find((p) => p.id === id)!.module.slice(1), 10),
      ),
    );
    expect(unlockModuleForType(masu)).toBe(masuMax);

    // i-adj-forms spans m8/m10/m10 → 10.
    const iadj = getTrainerType("i-adj-forms")!;
    const iadjMax = Math.max(
      ...iadj.grammarPointIds.map((id) =>
        parseInt(GRAMMAR_POINTS.find((p) => p.id === id)!.module.slice(1), 10),
      ),
    );
    expect(unlockModuleForType(iadj)).toBe(iadjMax);
  });

  it("isTypeUnlocked gates on reached >= unlock module", () => {
    const iadj = getTrainerType("i-adj-forms")!;
    const m = unlockModuleForType(iadj);
    expect(isTypeUnlocked(iadj, m - 1)).toBe(false);
    expect(isTypeUnlocked(iadj, m)).toBe(true);
    expect(isTypeUnlocked(iadj, m + 3)).toBe(true);
  });

  describe("learn-ahead helpers (v1.5)", () => {
    it("isSelectionAhead is true when ANY selected type unlocks past reached", () => {
      const te = unlockModuleForType(getTrainerType("te-form")!);
      expect(isSelectionAhead(["te-form"], te - 1)).toBe(true);
      expect(isSelectionAhead(["te-form"], te)).toBe(false);

      // Mixed selection: under the NEO spine て-form is m8 and adjectives are
      // s09 = m12, so te unlocks FIRST (it was the other way round on the old
      // spine — 2026-07-26 registry re-key). At te's module the pair is still
      // "ahead" because i-adj has not unlocked yet.
      const iadj = unlockModuleForType(getTrainerType("i-adj-forms")!);
      expect(te).toBeLessThan(iadj);
      expect(isSelectionAhead(["i-adj-forms", "te-form"], te)).toBe(true);
      expect(isSelectionAhead(["i-adj-forms", "te-form"], iadj)).toBe(false);

      expect(isSelectionAhead([], 1)).toBe(false);
    });

    it("effectivePoolModule raises reached to the latest unlock in the selection", () => {
      const te = unlockModuleForType(getTrainerType("te-form")!);
      const iadj = unlockModuleForType(getTrainerType("i-adj-forms")!);
      expect(effectivePoolModule(["te-form"], 3)).toBe(te);
      // On-path selections are unchanged.
      expect(effectivePoolModule(["te-form"], te + 5)).toBe(te + 5);
      expect(effectivePoolModule(["i-adj-forms", "te-form"], 3)).toBe(Math.max(te, iadj));
    });
  });

  it("formation examples are real table values (except flagged literal rows)", () => {
    const verbByDict = new Map(VERB_ENTRIES.map((v) => [v.dictionary, v]));
    const adjByDict = new Map(ADJ_ENTRIES.map((a) => [a.dictionary, a]));

    for (const type of CONJUGATION_TRAINER_TYPES) {
      for (const row of type.formation) {
        if (row.exampleNotInTables) continue; // literal reference content only
        if (type.category === "verb") {
          const entry = verbByDict.get(row.exampleDict);
          expect(entry, `${type.id}: verb ${row.exampleDict} in tables`).toBeDefined();
          expect(
            Object.values(entry!.forms),
            `${type.id}: ${row.exampleDict} → ${row.exampleForm}`,
          ).toContain(row.exampleForm);
        } else {
          const entry = adjByDict.get(row.exampleDict);
          expect(entry, `${type.id}: adj ${row.exampleDict} in tables`).toBeDefined();
          expect(
            Object.values(entry!.forms),
            `${type.id}: ${row.exampleDict} → ${row.exampleForm}`,
          ).toContain(row.exampleForm);
        }
      }
    }
  });

  describe("dueGrammarPointCount", () => {
    beforeEach(() => clearGrammarStore());

    it("counts unseen (never-reviewed) points as due", () => {
      const teForm = getTrainerType("te-form")!;
      // No Track B state written → the single point is unseen-but-unlocked.
      expect(dueGrammarPointCount(teForm)).toBe(1);

      const iadj = getTrainerType("i-adj-forms")!;
      expect(dueGrammarPointCount(iadj)).toBe(3); // all three unseen
    });

    it("does not count a point scheduled into the future", () => {
      const teForm = getTrainerType("te-form")!;
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const futureStr = future.toISOString().slice(0, 10);
      setGrammarCardState("te-form", createSeededState(futureStr));
      expect(dueGrammarPointCount(teForm, new Date())).toBe(0);
    });

    it("counts a seeded (due-today) point as due", () => {
      const teForm = getTrainerType("te-form")!;
      setGrammarCardState("te-form", createInitialState()); // due today
      expect(dueGrammarPointCount(teForm)).toBe(1);
    });

    it("sums per-point across a multi-point type", () => {
      const iadj = getTrainerType("i-adj-forms")!;
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      // One point pushed to the future, the other two remain unseen.
      setGrammarCardState(
        "i-adj-negative",
        createSeededState(future.toISOString().slice(0, 10)),
      );
      expect(dueGrammarPointCount(iadj)).toBe(2);
    });
  });
});
