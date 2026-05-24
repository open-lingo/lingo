import { describe, it, expect, beforeEach } from "vitest";
import { shouldWriteSrs } from "./_stepPredicates";
import {
  createInitialState,
  gradeFromLesson,
  getCardState,
  setCardState,
} from "@/features/flashcards/engine";
import type { LessonStep } from "../types";
import type { SRSModality } from "@/features/flashcards/data/types";

/**
 * Integration test for the SRS-grading rule applied inside
 * `LessonPage.handleStepComplete`. We don't render the page (it's the
 * GOD-file warning) — we instead exercise the same logic at unit level.
 *
 * Confirms Spencer's invariant: "only review cards count toward FSRS-6."
 */

function applyHandleStepComplete(
  step: LessonStep,
  correct: boolean,
  retried = false,
) {
  if (!shouldWriteSrs(step)) return;
  const exercised = step.exercisedAtoms ?? [];
  if (exercised.length === 0) return;
  const modality = step.modality ?? "both";
  const modalities: SRSModality[] =
    modality === "both" ? ["recognition", "production"] : [modality];
  for (const atomId of exercised) {
    let state = getCardState(atomId) ?? createInitialState();
    for (const m of modalities) {
      state = gradeFromLesson(state, m, { correct, retried });
    }
    setCardState(atomId, state);
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
