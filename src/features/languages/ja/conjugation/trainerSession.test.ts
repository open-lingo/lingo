import { describe, it, expect, beforeEach } from "vitest";
import {
  clearGrammarStore,
  getGrammarCardState,
} from "@/features/flashcards/engine/grammarSrs";
import { VERB_ENTRIES, ADJ_ENTRIES } from "../conjugationTables";
import {
  conjugateVerb,
  conjugateIAdj,
  type ChainForm,
  type IAdjForm,
} from "../conjugationEngine";
import {
  getTrainerType,
  unlockModuleForType,
  effectivePoolModule,
  type ConjugationTrainerType,
  type TrainerTypeId,
} from "./trainerRegistry";
import {
  buildTrainerSession,
  buildCombinedSession,
  sessionRating,
  gradeTrainerSession,
  gradeCombinedSession,
  gradeTrainerSessionIfOnPath,
  gradeCombinedSessionIfOnPath,
  isTypeProficient,
  getMasuDrillReps,
  clearMasuDrillReps,
  COMBO_PROFICIENCY_MIN_REPS,
  generateFormationDistractors,
  generateIAdjFormationDistractors,
} from "./trainerSession";
import { reviewGrammarPoint } from "@/features/flashcards/engine/grammarSrs";

const REACHED = 20; // well past every type's unlock module

// ─── Anti-elimination distractor invariants (Task 5) ────────────────────

const ALL_CHAIN_FORMS: ChainForm[] = [
  "masu",
  "masu-neg",
  "masu-past",
  "masu-past-neg",
  "te",
  "ta",
  "nai",
  "tai",
  "nai-past",
  "tai-neg",
  "tai-past",
  "tai-neg-past",
];

/** Regex asserting an option ends within the target form's ending family. */
function familyEnding(form: ChainForm): RegExp {
  if (form === "te") return /[てで]$/;
  if (form === "ta") return /[ただ]$/;
  if (form === "nai" || form === "nai-past") return /(ない|なかった)$/;
  if (form.startsWith("tai")) return /(たい|たくない|たかった|たくなかった)$/;
  return /(ます|ません|ました|ませんでした)$/; // masu family
}

describe("generateFormationDistractors — invariants across the full table × all forms", () => {
  for (const entry of VERB_ENTRIES) {
    for (const form of ALL_CHAIN_FORMS) {
      it(`${entry.dictionary} (${entry.group}) → ${form}: 3 valid same-verb distractors`, () => {
        const correct = conjugateVerb(entry.dictionary, entry.group, form);
        const d = generateFormationDistractors(entry.dictionary, entry.group, form, correct);
        // Never throws, never returns < 3 (catches short verbs みる/いく/する/くる).
        expect(d.length).toBe(3);
        // All distinct, none equal the correct answer.
        expect(new Set(d).size).toBe(3);
        expect(d).not.toContain(correct);
        const ending = familyEnding(form);
        for (const opt of d) {
          // Same ending family — elimination by ending shape is impossible.
          expect(opt, `${opt} in family of ${form}`).toMatch(ending);
          // Same verb: godan/ichidan options share the verb's stem (dict − last kana).
          if (entry.group !== "irregular") {
            expect(opt.startsWith(entry.dictionary.slice(0, -1)), `${opt} shares stem`).toBe(true);
          }
        }
      });
    }
  }
});

describe("generateIAdjFormationDistractors — invariants across every i-adjective", () => {
  const forms: IAdjForm[] = ["negative", "past", "past-negative"];
  for (const entry of ADJ_ENTRIES.filter((a) => a.type === "i-adj")) {
    for (const form of forms) {
      it(`${entry.dictionary} → ${form}: 3 valid same-adjective distractors`, () => {
        const correct = conjugateIAdj(entry.dictionary, form);
        const d = generateIAdjFormationDistractors(entry.dictionary, form, correct);
        expect(d.length).toBe(3);
        expect(new Set(d).size).toBe(3);
        expect(d).not.toContain(correct);
        for (const opt of d) {
          expect(opt, `${opt} in i-adj family`).toMatch(/(くない|かった|くなかった)$/);
          if (entry.dictionary !== "いい") {
            expect(opt.startsWith(entry.dictionary.slice(0, -1)), `${opt} shares stem`).toBe(true);
          }
        }
      });
    }
  }
});

describe("buildTrainerSession", () => {
  it("clamps question count to [6, 12]", () => {
    // te-form drills a single form → 2 questions raw, clamped up to 6.
    const teForm = getTrainerType("te-form")!;
    const q = buildTrainerSession(teForm, REACHED);
    expect(q.length).toBe(6);

    // A high count override is clamped down to 12.
    const many = buildTrainerSession(teForm, REACHED, { count: 100 });
    expect(many.length).toBe(12);
  });

  it("round-robins the drilled forms", () => {
    // Every REAL tile drills a single BASE form post-v1.2 (stacked chains are
    // combo-exclusive), so exercise the round-robin machinery with a synthetic
    // multi-form type. 3 forms → 6 questions.
    const synthetic: ConjugationTrainerType = {
      id: "i-adj-forms",
      title: "synthetic",
      subtitle: "",
      category: "i-adj",
      adjForms: ["negative", "past", "past-negative"],
      grammarPointIds: [],
      formation: [],
    };
    const q = buildTrainerSession(synthetic, REACHED);
    expect(q.length).toBe(6);
    // Round-robin the forms across the session (neg, past, past-neg, neg, …).
    expect(q[0].form).toBe("negative");
    expect(q[1].form).toBe("past");
    expect(q[2].form).toBe("past-negative");
    expect(q[3].form).toBe("negative");
    // All three forms represented equally.
    const counts = q.reduce<Record<string, number>>((acc, x) => {
      acc[x.form] = (acc[x.form] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts["negative"]).toBe(2);
    expect(counts["past"]).toBe(2);
    expect(counts["past-negative"]).toBe(2);
  });

  it("respects the reached-module pool (no verbs above the module)", () => {
    const teForm = getTrainerType("te-form")!;
    // Below every verb's module → empty pool → no questions.
    expect(buildTrainerSession(teForm, 6)).toEqual([]);
    // The i-adj type at M8 has adjectives available.
    const iadj = getTrainerType("i-adj-forms")!;
    expect(buildTrainerSession(iadj, 8).length).toBeGreaterThan(0);
  });

  it("i-adj sessions only use i-adjectives (never na-adjectives)", () => {
    const iadj = getTrainerType("i-adj-forms")!;
    const q = buildTrainerSession(iadj, REACHED);
    // na-adj forms carry です/じゃない endings; i-adj negative/past never do.
    for (const item of q) {
      expect(item.correct).not.toContain("です");
      expect(item.correct).not.toContain("じゃ");
    }
  });

  it("every question has 4 unique options including the correct one, never a bare duplicate", () => {
    const teForm = getTrainerType("te-form")!;
    const q = buildTrainerSession(teForm, REACHED);
    for (const question of q) {
      expect(question.options).toContain(question.correct);
      // No duplicate options (the correct answer is never also a distractor).
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(question.options.length).toBeLessThanOrEqual(4);
    }
  });

  it("avoids repeating an (item, form) pair while the pool allows", () => {
    const teForm = getTrainerType("te-form")!;
    const q = buildTrainerSession(teForm, REACHED); // 6 questions, 1 form, pool > 6
    const ids = q.map((x) => x.itemId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("sessionRating", () => {
  it("all correct → good", () => {
    expect(sessionRating([true, true, true])).toBe("good");
  });
  it("exactly half correct → hard", () => {
    expect(sessionRating([true, true, false, false])).toBe("hard");
  });
  it("above half but not all → hard", () => {
    expect(sessionRating([true, true, true, false])).toBe("hard");
  });
  it("below half correct → again", () => {
    expect(sessionRating([true, false, false, false])).toBe("again");
  });
  it("empty results → again", () => {
    expect(sessionRating([])).toBe("again");
  });

  it("half credit (cheat-sheet peek) caps a clean session at hard", () => {
    // All answers right but one was peeked → not full marks → hard, not good.
    expect(sessionRating([1, 0.5, 1])).toBe("hard");
    expect(sessionRating([0.5, 0.5])).toBe("hard"); // 1/2 = exactly 50%
    expect(sessionRating([1, 1, 1])).toBe("good");
    // Halves count toward the 50% success line.
    expect(sessionRating([0.5, 0, 0, 0])).toBe("again"); // 0.5/4 < 50%
    expect(sessionRating([0.5, 0.5, 0.5, 0.5])).toBe("hard");
  });

  it("still accepts boolean arrays (back-compat)", () => {
    expect(sessionRating([true, true])).toBe("good");
    expect(sessionRating([true, false])).toBe("hard");
    expect(sessionRating([false, false])).toBe("again");
  });
});

describe("gradeTrainerSession", () => {
  beforeEach(() => {
    clearGrammarStore();
    clearMasuDrillReps();
  });

  it("writes a production sub-state for every point graded via the type's own forms", () => {
    // i-adj drills its BASE form (negative) individually — かった/くなかった are
    // combo-exclusive, so only i-adj-negative is graded by an individual drill.
    const iadj = getTrainerType("i-adj-forms")!;
    for (const id of iadj.grammarPointIds) {
      expect(getGrammarCardState(id)).toBeUndefined();
    }
    gradeTrainerSession(iadj, [true, true, true, true, true, true]);
    const state = getGrammarCardState("i-adj-negative");
    expect(state, "i-adj-negative graded").toBeDefined();
    // production modality advanced (reps incremented), recognition untouched.
    expect(state!.production.reps).toBeGreaterThan(0);
    expect(state!.recognition.reps).toBe(0);
    // The combo-exclusive points are NOT graded by an individual drill.
    expect(getGrammarCardState("i-adj-past")).toBeUndefined();
    expect(getGrammarCardState("i-adj-past-negative")).toBeUndefined();
  });

  it("an individual masu drill writes NOTHING to Track B (its points are combo-only)", () => {
    const masu = getTrainerType("masu")!;
    gradeTrainerSession(masu, [true, true, true, true, true, true]);
    for (const id of masu.grammarPointIds) {
      // masu-negative / masu-past-negative are graded only when their combo
      // forms appear — never by an individual masu drill.
      expect(getGrammarCardState(id), `${id} not graded`).toBeUndefined();
    }
    // ...but the completed drill IS recorded for combo-proficiency gating.
    expect(getMasuDrillReps()).toBe(1);
  });

  it("is a pure grade-now primitive — a second call grades again (UI guards double-fire)", () => {
    const teForm = getTrainerType("te-form")!;
    gradeTrainerSession(teForm, [true, true, true, true, true, true]);
    const afterFirst = getGrammarCardState("te-form")!.production.reps;
    gradeTrainerSession(teForm, [true, true, true, true, true, true]);
    const afterSecond = getGrammarCardState("te-form")!.production.reps;
    expect(afterSecond).toBeGreaterThan(afterFirst);
  });
});

// ─── v1.2 addendum: proficiency + combined sessions ─────────────────────

/** Bump a type's individual grammar points to combo-proficient. */
function makeProficient(typeId: TrainerTypeId): void {
  if (typeId === "masu") {
    const masu = getTrainerType("masu")!;
    for (let i = 0; i < COMBO_PROFICIENCY_MIN_REPS; i++) {
      gradeTrainerSession(masu, [true, true, true, true, true, true]);
    }
    return;
  }
  const type = getTrainerType(typeId)!;
  for (const pid of type.grammarPointIds) {
    for (let i = 0; i < COMBO_PROFICIENCY_MIN_REPS; i++) {
      reviewGrammarPoint(pid, "production", "good");
    }
  }
}

describe("isTypeProficient", () => {
  beforeEach(() => {
    clearGrammarStore();
    clearMasuDrillReps();
  });

  it("COMBO_PROFICIENCY_MIN_REPS is 3", () => {
    expect(COMBO_PROFICIENCY_MIN_REPS).toBe(3);
  });

  it("a verb type is proficient once its point reaches the rep threshold", () => {
    expect(isTypeProficient("te-form")).toBe(false);
    reviewGrammarPoint("te-form", "production", "good");
    reviewGrammarPoint("te-form", "production", "good");
    expect(isTypeProficient("te-form")).toBe(false); // 2 reps < 3
    reviewGrammarPoint("te-form", "production", "good");
    expect(isTypeProficient("te-form")).toBe(true); // 3 reps
  });

  it("i-adj gates on its BASE point only (past points are combo-exclusive — circular to gate on)", () => {
    expect(isTypeProficient("i-adj-forms")).toBe(false);
    // Reps on the combo-exclusive points alone do NOT unlock the tile…
    for (const pid of ["i-adj-past", "i-adj-past-negative"]) {
      for (let i = 0; i < 3; i++) reviewGrammarPoint(pid, "production", "good");
    }
    expect(isTypeProficient("i-adj-forms")).toBe(false);
    // …only the base point (i-adj-negative, the tile's drilled form) does.
    for (let i = 0; i < 3; i++) reviewGrammarPoint("i-adj-negative", "production", "good");
    expect(isTypeProficient("i-adj-forms")).toBe(true);
  });

  it("masu gates on completed-drill history, not a Track B point", () => {
    expect(isTypeProficient("masu")).toBe(false);
    makeProficient("masu");
    expect(getMasuDrillReps()).toBe(3);
    expect(isTypeProficient("masu")).toBe(true);
  });
});

describe("buildCombinedSession", () => {
  beforeEach(() => {
    clearGrammarStore();
    clearMasuDrillReps();
  });

  const comboOnlyForms = new Set(["masu-neg", "masu-past", "masu-past-neg"]);
  const isComboOnly = (form: string) => comboOnlyForms.has(form);

  it("below proficiency → individuals only, no combo-only forms", () => {
    // {masu, nai-form} unlocks masu-neg (ません) — NOT an individual of either.
    const q = buildCombinedSession(["masu", "nai-form"], REACHED);
    expect(q.length).toBeGreaterThanOrEqual(8);
    expect(q.some((x) => isComboOnly(x.form))).toBe(false);
    // Only individual (base) forms of the selected tiles appear — masu drills
    // ["masu"], nai-form drills ["nai"]; nai-past is combo-only, so it must NOT
    // surface here below proficiency.
    const allowed = new Set(["masu", "nai"]);
    for (const x of q) expect(allowed.has(x.form)).toBe(true);
  });

  it("once every tile is proficient, ~40% of questions are combo forms", () => {
    makeProficient("masu");
    makeProficient("nai-form");
    const q = buildCombinedSession(["masu", "nai-form"], REACHED, { count: 12 });
    expect(q.length).toBe(12);
    const comboCount = q.filter((x) => isComboOnly(x.form)).length;
    expect(comboCount).toBe(Math.round(12 * 0.4)); // 5
  });

  it("clamps question count to [8, 14]", () => {
    expect(buildCombinedSession(["masu", "nai-form"], REACHED, { count: 1 }).length).toBe(8);
    expect(buildCombinedSession(["masu", "nai-form"], REACHED, { count: 100 }).length).toBe(14);
  });

  it("every question has the correct answer among unique options", () => {
    makeProficient("masu");
    makeProficient("nai-form");
    const q = buildCombinedSession(["masu", "nai-form"], REACHED);
    for (const question of q) {
      expect(question.options).toContain(question.correct);
      expect(new Set(question.options).size).toBe(question.options.length);
    }
  });

  it("returns [] for an empty selection", () => {
    expect(buildCombinedSession([], REACHED)).toEqual([]);
  });

  it('combos: "on" includes stacked forms WITHOUT proficiency (explicit hub toggle)', () => {
    // Fresh store, zero reps — the old silent gate would produce all-base
    // sessions that read as "no paired trainings here" (Spencer 2026-07-05).
    const q = buildCombinedSession(["masu", "nai-form"], REACHED, { count: 12, combos: "on" });
    expect(q.filter((x) => x.form === "masu-neg").length).toBe(Math.round(12 * 0.4));
  });

  it('combos: "off" excludes stacked forms even at full proficiency (mixed drill)', () => {
    makeProficient("masu");
    makeProficient("nai-form");
    const q = buildCombinedSession(["masu", "nai-form"], REACHED, { count: 12, combos: "off" });
    expect(q.some((x) => isComboOnly(x.form))).toBe(false);
    const allowed = new Set(["masu", "nai"]);
    for (const x of q) expect(allowed.has(x.form), x.form).toBe(true);
  });

  it("い + た below proficiency drills only the base forms (くない + verb た)", () => {
    const q = buildCombinedSession(["i-adj-forms", "ta-form"], REACHED);
    const allowed = new Set(["negative", "ta"]);
    for (const x of q) expect(allowed.has(x.form), x.form).toBe(true);
  });

  it("い + た proficient unlocks the adjective past combo, conjugated on adjectives", () => {
    makeProficient("i-adj-forms");
    makeProficient("ta-form");
    const q = buildCombinedSession(["i-adj-forms", "ta-form"], REACHED, { count: 12 });
    const combos = q.filter((x) => x.form === "past");
    expect(combos.length).toBe(Math.round(12 * 0.4)); // the combo share
    // The combo questions conjugate ADJECTIVES (かった), never verbs.
    for (const c of combos) expect(c.correct).toMatch(/かった$/);
  });

  it("い + ない + た proficient unlocks くなかった AND the verb なかった stack", () => {
    makeProficient("i-adj-forms");
    makeProficient("nai-form");
    makeProficient("ta-form");
    const q = buildCombinedSession(["i-adj-forms", "nai-form", "ta-form"], REACHED, {
      count: 14,
    });
    const forms = new Set(q.map((x) => x.form));
    expect(forms.has("past-negative")).toBe(true); // くなかった (adjective)
    expect(forms.has("nai-past")).toBe(true); // なかった (verb)
    for (const x of q.filter((y) => y.form === "past-negative")) {
      expect(x.correct).toMatch(/くなかった$/);
    }
  });
});

describe("gradeCombinedSession — FORM→POINT map", () => {
  beforeEach(() => clearGrammarStore());

  it("masu-neg grades masu-negative", () => {
    gradeCombinedSession(["masu-neg", "masu-neg"], [true, true]);
    expect(getGrammarCardState("masu-negative")?.production.reps).toBeGreaterThan(0);
  });

  it("masu-past-neg grades masu-past-negative", () => {
    gradeCombinedSession(["masu-past-neg"], [true]);
    expect(getGrammarCardState("masu-past-negative")?.production.reps).toBeGreaterThan(0);
  });

  it("masu and masu-past write NOTHING (pooled points — never double-grade)", () => {
    gradeCombinedSession(["masu", "masu-past"] as ChainForm[], [true, false]);
    // Neither maps to a Track B point; nothing is written.
    expect(getGrammarCardState("masu-negative")).toBeUndefined();
    expect(getGrammarCardState("masu-past-negative")).toBeUndefined();
  });

  it("nai-past grades nai-form; tai-* grade v-tai", () => {
    gradeCombinedSession(["nai-past", "tai-neg", "tai-past"], [true, true, true]);
    expect(getGrammarCardState("nai-form")?.production.reps).toBeGreaterThan(0);
    expect(getGrammarCardState("v-tai")?.production.reps).toBeGreaterThan(0);
  });

  it("the い-adjective combos grade their combo-exclusive points", () => {
    gradeCombinedSession(["past", "past-negative"], [true, true]);
    expect(getGrammarCardState("i-adj-past")?.production.reps).toBeGreaterThan(0);
    expect(getGrammarCardState("i-adj-past-negative")?.production.reps).toBeGreaterThan(0);
  });

  it("grades each point ONCE per call over only its own questions", () => {
    // masu-negative: [true,false] → hard; v-tai: [true] → good; one review each.
    gradeCombinedSession(["masu-neg", "masu-neg", "tai-neg"], [true, false, true]);
    expect(getGrammarCardState("masu-negative")!.production.reps).toBe(1);
    expect(getGrammarCardState("v-tai")!.production.reps).toBe(1);
  });
});

// ─── Learn-ahead (v1.5): grading gate + pool override ───────────────────

describe("gradeTrainerSessionIfOnPath — ahead sessions are practice-only", () => {
  beforeEach(() => {
    clearGrammarStore();
    clearMasuDrillReps();
  });

  it("skips grading entirely when the type is ahead of the learner", () => {
    const te = getTrainerType("te-form")!;
    const unlock = unlockModuleForType(te);
    const graded = gradeTrainerSessionIfOnPath(te, unlock - 1, [true, true]);
    expect(graded).toBe(false);
    expect(getGrammarCardState("te-form")).toBeUndefined();
  });

  it("grades normally at (and past) the unlock module", () => {
    const te = getTrainerType("te-form")!;
    const unlock = unlockModuleForType(te);
    const graded = gradeTrainerSessionIfOnPath(te, unlock, [true, true]);
    expect(graded).toBe(true);
    expect(getGrammarCardState("te-form")?.production.reps).toBeGreaterThan(0);
  });

  it("an ahead masu drill does not bump combo-proficiency history either", () => {
    const masu = getTrainerType("masu")!;
    const unlock = unlockModuleForType(masu);
    gradeTrainerSessionIfOnPath(masu, unlock - 1, [true]);
    expect(getMasuDrillReps()).toBe(0);
    gradeTrainerSessionIfOnPath(masu, unlock, [true]);
    expect(getMasuDrillReps()).toBe(1);
  });
});

describe("gradeCombinedSessionIfOnPath — one ahead tile → whole session no-SRS", () => {
  beforeEach(() => clearGrammarStore());

  it("writes nothing when ANY selected type is ahead", () => {
    const naiUnlock = unlockModuleForType(getTrainerType("nai-form")!);
    const teUnlock = unlockModuleForType(getTrainerType("te-form")!);
    // Guard the premise: nai unlocks before te, so this reached module has
    // nai on-path and te ahead (derived from data, not hand-coded modules).
    expect(naiUnlock).toBeLessThan(teUnlock);
    const reached = teUnlock - 1;

    const graded = gradeCombinedSessionIfOnPath(
      ["nai-form", "te-form"],
      reached,
      ["nai", "te"],
      [true, true],
    );
    expect(graded).toBe(false);
    expect(getGrammarCardState("nai-form")).toBeUndefined();
    expect(getGrammarCardState("te-form")).toBeUndefined();
  });

  it("grades normally when every selected type is on-path", () => {
    const teUnlock = unlockModuleForType(getTrainerType("te-form")!);
    const graded = gradeCombinedSessionIfOnPath(
      ["nai-form", "te-form"],
      teUnlock,
      ["nai", "te"],
      [true, true],
    );
    expect(graded).toBe(true);
    expect(getGrammarCardState("nai-form")?.production.reps).toBeGreaterThan(0);
    expect(getGrammarCardState("te-form")?.production.reps).toBeGreaterThan(0);
  });
});

describe("learn-ahead pool override — effectivePoolModule feeds the builders", () => {
  it("the reached-module pool is EMPTY for an early learner; the override fills it", () => {
    const te = getTrainerType("te-form")!;
    // Table entries start at m7 — a m3 learner has no drillable verbs at all.
    expect(buildTrainerSession(te, 3)).toHaveLength(0);
    const questions = buildTrainerSession(te, effectivePoolModule(["te-form"], 3));
    expect(questions.length).toBeGreaterThanOrEqual(6); // MIN_QUESTIONS
  });

  it("combined sessions build from the latest unlock among the selection", () => {
    expect(buildCombinedSession(["te-form", "ta-form"], 3, { combos: "off" })).toHaveLength(0);
    const questions = buildCombinedSession(
      ["te-form", "ta-form"],
      effectivePoolModule(["te-form", "ta-form"], 3),
      { combos: "off" },
    );
    expect(questions.length).toBeGreaterThan(0);
  });
});
