import { describe, it, expect, beforeEach } from "vitest";
import { shouldWriteSrs } from "./_stepPredicates";
import {
  isDedicatedReviewLesson,
  shouldWriteContentReviewAtom,
} from "./reviewTailSrs";
import {
  createInitialState,
  gradeFromLesson,
  getCardState,
  setCardState,
} from "@/features/flashcards/engine";
import {
  getGrammarCardState,
  reviewGrammarPoint,
} from "@/features/flashcards/engine/grammarSrs";
import type { LessonStep } from "../types";
import type { SRSModality, SRSRating } from "@/features/flashcards/data/types";

/**
 * Integration test for the SRS-grading rule applied inside
 * `LessonPage.handleStepComplete`. We don't render the page (it's the
 * GOD-file warning) — we mirror the same orchestration at unit level, but
 * delegate the WHICH-atoms-write decision to the real gating functions
 * (`isDedicatedReviewLesson` / `shouldWriteContentReviewAtom`) so the test
 * can't drift from the shipped gate.
 *
 * `lessonId` defaults to a dedicated review lesson so the pre-D2 tests below
 * keep their original semantics (review lessons grade every exercised atom).
 */
function applyHandleStepComplete(
  step: LessonStep,
  correct: boolean,
  retried = false,
  lessonId = "ja-m4-review-1",
) {
  if (!shouldWriteSrs(step)) return;
  const exercised = step.exercisedAtoms ?? [];
  const exercisedGrammar = step.exercisedGrammar ?? [];
  if (exercised.length === 0 && exercisedGrammar.length === 0) return;
  const isReviewLesson = isDedicatedReviewLesson(lessonId);
  const modality = step.modality ?? "both";
  const modalities: SRSModality[] =
    modality === "both" ? ["recognition", "production"] : [modality];
  // Track A — vocab. Review lessons write all; content sub-lessons filter to
  // prior-atom review-tail retrieval (D2).
  for (const atomId of exercised) {
    if (!isReviewLesson && !shouldWriteContentReviewAtom(atomId, lessonId)) {
      continue;
    }
    let state = getCardState(atomId) ?? createInitialState();
    for (const m of modalities) {
      state = gradeFromLesson(state, m, { correct, retried });
    }
    setCardState(atomId, state);
  }
  // Track B — grammar. VOCAB-ONLY D2: confined to dedicated review lessons.
  if (isReviewLesson && exercisedGrammar.length > 0) {
    const rating: SRSRating = !correct ? "again" : retried ? "hard" : "good";
    for (const pointId of exercisedGrammar) {
      for (const m of modalities) {
        reviewGrammarPoint(pointId, m, rating);
      }
    }
  }
}

describe("LessonPage handleStepComplete SRS gate (Spencer's invariant)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("graded step with exercisedAtoms advances only the named modality", () => {
    const step = {
      id: "s1",
      type: "word_image_mcq",
      exercisedAtoms: ["v-neko"],
      modality: "recognition",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true);
    const state = getCardState("v-neko");
    expect(state).toBeTruthy();
    expect(state!.recognition.reps).toBe(1);
    expect(state!.production.reps).toBe(0);
  });

  it("production-modality step advances only production", () => {
    const step = {
      id: "s2",
      type: "build_sentence",
      exercisedAtoms: ["v-park"],
      modality: "production",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true);
    const state = getCardState("v-park");
    expect(state!.recognition.reps).toBe(0);
    expect(state!.production.reps).toBe(1);
  });

  it("step with modality='both' advances both", () => {
    const step = {
      id: "s3",
      type: "match_pairs",
      exercisedAtoms: ["v-cat"],
      modality: "both",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true);
    const state = getCardState("v-cat");
    expect(state!.recognition.reps).toBe(1);
    expect(state!.production.reps).toBe(1);
  });

  it("teach step (info) NEVER writes SRS — even with exercisedAtoms", () => {
    const step = {
      id: "s4",
      type: "info",
      body: "...",
      exercisedAtoms: ["v-neko"],
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true);
    expect(getCardState("v-neko")).toBeUndefined();
  });

  it("phrase_card NEVER writes SRS", () => {
    const step = {
      id: "s5",
      type: "phrase_card",
      kana: "ねこ",
      meaningEn: "cat",
      romaji: "neko",
      atomId: "v-neko",
      exercisedAtoms: ["v-neko"],
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true);
    expect(getCardState("v-neko")).toBeUndefined();
  });

  it("grammar_rule NEVER writes SRS", () => {
    const step = {
      id: "s6",
      type: "grammar_rule",
      title: "は particle",
      rule: "...",
      examples: [],
      exercisedAtoms: ["p-wa"],
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true);
    expect(getCardState("p-wa")).toBeUndefined();
  });

  it("graded step with empty exercisedAtoms is a no-op", () => {
    const step = {
      id: "s7",
      type: "multiple_choice",
      exercisedAtoms: [],
      modality: "production",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true);
    // No localStorage write happened
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it("retried wrong-then-correct: writes on both attempts; production untouched", () => {
    const step = {
      id: "s8",
      type: "multiple_choice",
      exercisedAtoms: ["v-park"],
      modality: "recognition",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, false);
    const afterWrong = getCardState("v-park")!;
    // SRS state was created and the wrong call landed (reps advanced via FSRS).
    expect(afterWrong.recognition.reps).toBeGreaterThan(0);

    applyHandleStepComplete(step, true, /* retried */ true);
    const afterRetry = getCardState("v-park")!;
    expect(afterRetry.recognition.reps).toBeGreaterThan(afterWrong.recognition.reps);
    // Production never touched — modality isolation invariant.
    expect(afterRetry.production.reps).toBe(0);
  });

  it("Suspicious tagging on info step (mistakenly carrying exercisedAtoms) is silently ignored — gate wins", () => {
    // Authoring discipline: info steps shouldn't carry exercisedAtoms.
    // If one slips through, the gate ensures FSRS state stays untouched.
    const step = {
      id: "s9",
      type: "info",
      body: "Sneak preview",
      exercisedAtoms: ["v-coffee", "v-tea"],
      modality: "recognition",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true);
    expect(getCardState("v-coffee")).toBeUndefined();
    expect(getCardState("v-tea")).toBeUndefined();
  });
});

describe("D2 — content sub-lesson review-tail writes (vocab only)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("(a) a content sub-lesson TAIL step writes Track A for a PRIOR atom", () => {
    // neko: fromModule m1, introduced ja-m3-3 → a prior atom in an m4 lesson.
    const step = {
      id: "ja-m4-1-1-rev-mcq-1",
      type: "word_image_mcq",
      exercisedAtoms: ["neko"],
      modality: "recognition",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true, false, "ja-m4-1-1");
    const state = getCardState("neko");
    expect(state).toBeTruthy();
    expect(state!.recognition.reps).toBe(1);
  });

  it("(b) a NEW-material step does NOT write a just-introduced atom", () => {
    // ペン (ja-m4-1-v-pen): m4 material introduced in ja-m4-1 — grading it in
    // ja-m4-1-1 would be same-day (D6). No write, no localStorage touch.
    const step = {
      id: "ja-m4-1-1-mcq-pen",
      type: "word_image_mcq",
      exercisedAtoms: ["ja-m4-1-v-pen"],
      modality: "recognition",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true, false, "ja-m4-1-1");
    expect(getCardState("ja-m4-1-v-pen")).toBeUndefined();
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it("(c) grammar (Track B) writes ONLY in dedicated review lessons", () => {
    // Grammar review steps carry both vocab + grammar; shouldWriteSrs needs a
    // non-empty exercisedAtoms, so pair the grammar point with a prior atom.
    const step = {
      id: "ja-m4-2-1-cloze",
      type: "particle_cloze",
      exercisedAtoms: ["neko"],
      exercisedGrammar: ["test-gp-wa"],
      modality: "production",
    } as unknown as LessonStep;
    // Content sub-lesson: vocab advances, grammar does NOT.
    applyHandleStepComplete(step, true, false, "ja-m4-2-1");
    expect(getCardState("neko")).toBeTruthy();
    expect(getGrammarCardState("test-gp-wa")).toBeUndefined();
    // Dedicated review lesson: grammar advances.
    applyHandleStepComplete(step, true, false, "ja-m4-review-1");
    expect(getGrammarCardState("test-gp-wa")).toBeTruthy();
  });

  it("(d) review-lesson behavior unchanged: grades even a current-module atom", () => {
    // The SAME atom that test (b) skips in a content lesson IS graded here —
    // dedicated review lessons stay unfiltered.
    const step = {
      id: "ja-m4-review-1-step",
      type: "word_image_mcq",
      exercisedAtoms: ["ja-m4-1-v-pen"],
      modality: "both",
    } as unknown as LessonStep;
    applyHandleStepComplete(step, true, false, "ja-m4-review-1");
    const state = getCardState("ja-m4-1-v-pen");
    expect(state).toBeTruthy();
    expect(state!.recognition.reps).toBe(1);
    expect(state!.production.reps).toBe(1);
  });
});
