import { describe, it, expect, beforeEach } from "vitest";
import {
  withDynamicReviewPrefix,
  buildDynamicReviewPrefix,
  DYNAMIC_REVIEW_PREFIX_CAP,
} from "./dynamicReviewPrefix";
import { getMockLessonContent } from "./mockLessons";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import { unlockAtomIds } from "./unlockLessonAtoms";
import {
  setCardState,
  clearSRSStore,
} from "@/features/flashcards/engine/srsStorage";
import {
  createInitialState,
  createSeededState,
  addDays,
  getToday,
  gradeFromLesson,
  isNew,
} from "@/features/flashcards/engine/srs";
import { getCardState } from "@/features/flashcards/engine";
import {
  buildGrammarReviewQueue,
  setGrammarCardState,
  clearGrammarStore,
  getGrammarCardState,
} from "@/features/flashcards/engine/grammarSrs";
import { getGrammarReviewIndex } from "./grammarReviewIndex";
import { resetKanjiLatchStore } from "@/features/languages/ja/secondScript/kanjiSwitchoverLatch";
import { isSwitchoverAtom } from "@/features/languages/ja/secondScript/switchoverCandidate";
import { KANJI_ELIGIBLE_ATOMS } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";
import { shouldWriteSrs } from "./_stepPredicates";
import {
  isDedicatedReviewLesson,
  shouldWriteReviewLessonAtom,
} from "./reviewTailSrs";
import { getTtsUrl } from "@/shared/tts";
import type { LessonContent, LessonStep } from "../types";
import type { SRSCardState, SRSModality } from "@/features/flashcards/data/types";
import {
  JA_COURSE_ATOMS_BY_KANA,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";

/**
 * B069 phase 1 conformance — the render-time dynamic segment prepended onto
 * the STATIC dedicated review lessons (Spencer 2026-07-30, option 3).
 *
 * The first describe block is the test B069 explicitly demands: the
 * kana→kanji switchover beat must have a LIVE call site — reachable through
 * `getMockLessonContent` on a lesson the course map actually carries — so it
 * can never silently go dormant again (it already did once, verified twice
 * on 2026-07-29).
 */

const isDynStep = (s: LessonStep) => s.id.includes("-dyn-");

function switchoverIds(): string[] {
  return [...KANJI_ELIGIBLE_ATOMS.keys()].filter((id) => isSwitchoverAtom(id));
}

/** A due, NON-new state (both modalities graded and overdue). */
function dueState(): SRSCardState {
  const state = createInitialState();
  for (const sub of [state.recognition, state.production]) {
    sub.reps = 3;
    sub.state = "review";
    sub.dueDate = "2020-01-01";
    sub.lastReviewDate = "2019-12-25";
  }
  return state;
}

/** Kana→id round-trip filter — see buildSrsReviewLesson.test.ts: word-level
 *  steps resolve atoms BY KANA, so homophone fixtures measure the ruling
 *  table instead of the feature under test. */
const roundTrips = (a: CourseAtom) =>
  JA_COURSE_ATOMS_BY_KANA.get(a.kana)?.id === a.id;

function fakeReviewLesson(
  moduleId: string,
  firstStepType: LessonStep["type"] = "multiple_choice",
): LessonContent {
  return {
    id: `ja-${moduleId}-neo-review-1`,
    moduleId,
    courseId: "mock-1",
    languageId: "ja",
    title: "Review 1",
    description: "",
    estimatedMinutes: 5,
    xpReward: 20,
    steps: [
      {
        id: `ja-${moduleId}-neo-review-1-s-0`,
        type: firstStepType,
      } as LessonStep,
    ],
  };
}

beforeEach(() => {
  localStorage.clear();
  clearSRSStore();
  clearGrammarStore();
  resetKanjiLatchStore();
});

describe("switchover beat LIVE call site (the test B069 demands)", () => {
  it("reaches the shipped ja-m22-neo-review-1 through getMockLessonContent", () => {
    unlockAtomIds(switchoverIds());

    const lesson = getMockLessonContent("ja-m22-neo-review-1");
    expect(lesson, "the live map's m22 review lesson must exist").toBeTruthy();

    const reveals = lesson!.steps.filter((s) => s.type === "kanji_reveal");
    expect(
      reveals.length,
      "the beat must ship through the LIVE lesson-resolution path — if this " +
        "is 0 the switchover beat has gone dormant again (B069)",
    ).toBeGreaterThan(0);

    // Prepended, not appended: every reveal sits before the authored body.
    const firstAuthoredIdx = lesson!.steps.findIndex((s) => !isDynStep(s));
    for (const r of reveals) {
      expect(lesson!.steps.indexOf(r)).toBeLessThan(firstAuthoredIdx);
    }

    // Both halves of every beat survive the full decoration pipeline, and
    // the pair ids still match the way `latchCompletedSwitchover` pairs them.
    for (const reveal of reveals) {
      const clozeId = reveal.id.replace("-kanji-reveal-", "-kanji-cloze-");
      const cloze = lesson!.steps.find((s) => s.id === clozeId);
      expect(cloze, `no cloze for ${reveal.id}`).toBeDefined();
      expect(cloze!.type).toBe("fill_blank");
      expect(shouldWriteSrs(cloze!)).toBe(true);
    }
  });
});

describe("dynamic segment conformance", () => {
  it("empty learner state → the authored lesson object, byte-identical", () => {
    const lesson = fakeReviewLesson("m9");
    // Same reference, not a rebuilt copy — the strongest possible
    // "byte-identical" claim.
    expect(withDynamicReviewPrefix(lesson)).toBe(lesson);
  });

  it("unlocked-but-nothing-actionable → still byte-identical", () => {
    // Unlocked atoms whose cards are neither due nor new, none of them
    // switchover candidates: nothing due, nothing latched-pending, no
    // intake — the authored lesson must come back untouched.
    const atoms = getAtomsUpToModule("m9", "ja")
      .filter((a) => !isSwitchoverAtom(a.id))
      .slice(0, 5);
    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of atoms) {
      const s = dueState();
      for (const sub of [s.recognition, s.production]) {
        sub.dueDate = addDays(getToday(), 30); // not due
      }
      setCardState(a.id, s);
    }
    const lesson = fakeReviewLesson("m9");
    expect(withDynamicReviewPrefix(lesson)).toBe(lesson);
  });

  it("empty state through the LIVE pipeline: no dynamic steps at all", () => {
    const lesson = getMockLessonContent("ja-m9-neo-review-1");
    expect(lesson).toBeTruthy();
    expect(lesson!.steps.some(isDynStep)).toBe(false);
  });

  it("caps the segment and keeps it contiguous at the front (heavy-due)", () => {
    const atoms = getAtomsUpToModule("m9", "ja");
    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of atoms) setCardState(a.id, dueState());

    const lesson = getMockLessonContent("ja-m9-neo-review-1")!;
    const dyn = lesson.steps.filter(isDynStep);
    expect(dyn.length).toBeGreaterThan(0);
    expect(dyn.length).toBeLessThanOrEqual(DYNAMIC_REVIEW_PREFIX_CAP);

    // Contiguous prefix: every dynamic step sits before every authored one.
    const firstAuthoredIdx = lesson.steps.findIndex((s) => !isDynStep(s));
    expect(firstAuthoredIdx).toBe(dyn.length);
    expect(lesson.steps.slice(firstAuthoredIdx).some(isDynStep)).toBe(false);

    // The authored body is intact underneath — same authored steps, in order.
    clearSRSStore();
    localStorage.clear();
    const bare = getMockLessonContent("ja-m9-neo-review-1")!;
    expect(lesson.steps.slice(firstAuthoredIdx).map((s) => s.id)).toEqual(
      bare.steps.map((s) => s.id),
    );
  });

  it("due-first when over budget: a heavy due queue starves seats and grammar", () => {
    const atoms = getAtomsUpToModule("m9", "ja").filter(roundTrips);
    const fresh = atoms.slice(0, 8); // never-reviewed → seat candidates
    const freshIds = new Set(fresh.map((a) => a.id));
    const due = atoms.filter((a) => !freshIds.has(a.id));
    expect(due.length).toBeGreaterThan(DYNAMIC_REVIEW_PREFIX_CAP);

    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of due) setCardState(a.id, dueState());
    // fresh atoms: no card state → new, due-today by initial state.

    const prefix = buildDynamicReviewPrefix(fakeReviewLesson("m9"));
    const atomSteps = prefix.filter((s) => /-dyn-step-\d+$/.test(s.id));
    expect(atomSteps.length).toBeGreaterThan(0);
    // Every atom step's TARGET (first credit) is a due atom, never a seat.
    for (const s of atomSteps) {
      const target = (s.exercisedAtoms ?? [])[0];
      expect(freshIds.has(target), `${s.id} seated ${target} over due`).toBe(
        false,
      );
    }
    // No budget left for grammar either.
    expect(prefix.some((s) => s.id.includes("-dyn-grammar-"))).toBe(false);
  });

  it("seats new cards when the due queue is light — and D6 keeps same-day seeds out", () => {
    const atoms = getAtomsUpToModule("m9", "ja")
      .filter(roundTrips)
      .filter((a) => !isSwitchoverAtom(a.id));
    const [dueAtom, seededToday, matured] = atoms;
    unlockAtomIds([dueAtom.id, seededToday.id, matured.id]);
    setCardState(dueAtom.id, dueState());
    // Unlock-seeded TODAY: due tomorrow (exactly what seedUnlockedAtomsDueNextDay writes).
    setCardState(seededToday.id, createSeededState(addDays(getToday(), 1)));
    // Seeded YESTERDAY, matured: due today, still reps 0.
    setCardState(matured.id, createSeededState(getToday()));

    const prefix = buildDynamicReviewPrefix(fakeReviewLesson("m9"));
    const targets = prefix
      .filter((s) => /-dyn-step-\d+$/.test(s.id))
      .map((s) => (s.exercisedAtoms ?? [])[0]);

    expect(targets).toContain(dueAtom.id);
    expect(targets, "matured seed takes a reserved seat").toContain(matured.id);
    expect(
      targets,
      "D6: a card seeded today must NOT be seated (its seat session is tomorrow)",
    ).not.toContain(seededToday.id);

    // Positive control for the D6 assertion: mature the seed and the same
    // learner state DOES seat it.
    setCardState(seededToday.id, createSeededState(getToday()));
    const prefix2 = buildDynamicReviewPrefix(fakeReviewLesson("m9"));
    const targets2 = prefix2
      .filter((s) => /-dyn-step-\d+$/.test(s.id))
      .map((s) => (s.exercisedAtoms ?? [])[0]);
    expect(targets2).toContain(seededToday.id);
  });

  it("includes due Track B grammar steps when budget allows", () => {
    const atoms = getAtomsUpToModule("m9", "ja").filter(roundTrips);
    unlockAtomIds(atoms.map((a) => a.id));
    // Light vocab load: 3 due atoms.
    for (const a of atoms.slice(0, 3)) setCardState(a.id, dueState());

    // Make one active grammar point DUE (state present + overdue).
    const grammarIndex = getGrammarReviewIndex();
    const queue = buildGrammarReviewQueue();
    const point = [...queue.review, ...queue.newItems].find(
      (item) => (grammarIndex.get(item.point.id)?.length ?? 0) > 0,
    )?.point;
    expect(point, "no active grammar point with a pool — fixture broke").toBeTruthy();
    setGrammarCardState(point!.id, dueState());

    const prefix = buildDynamicReviewPrefix(fakeReviewLesson("m9"));
    const grammarSteps = prefix.filter((s) => s.id.includes("-dyn-grammar-"));
    expect(grammarSteps.length).toBeGreaterThan(0);
    expect(grammarSteps[0].id).toContain(point!.id);
    expect(grammarSteps[0].exercisedGrammar).toEqual([point!.id]);
  });

  it("never creates a same-type adjacency inside the prefix or at the authored seam", () => {
    const atoms = getAtomsUpToModule("m22", "ja");
    unlockAtomIds([...atoms.map((a) => a.id), ...switchoverIds()]);
    for (const a of atoms) setCardState(a.id, dueState());

    const lesson = getMockLessonContent("ja-m22-neo-review-1")!;
    const firstAuthoredIdx = lesson.steps.findIndex((s) => !isDynStep(s));
    expect(firstAuthoredIdx).toBeGreaterThan(0);
    // Check every adjacency from the first prefix step THROUGH the seam.
    for (let i = 0; i < firstAuthoredIdx; i++) {
      expect(
        lesson.steps[i].type,
        `same-type adjacency at ${lesson.steps[i].id} → ${lesson.steps[i + 1].id}`,
      ).not.toBe(lesson.steps[i + 1].type);
    }
  });
});

describe("write gates — the prefix grades through the SAME path as the body", () => {
  /** Mirror of LessonPage.handleStepComplete's Track A section, delegating
   *  every decision to the real shipped gates (same pattern as
   *  lessonPage-srs-wiring.test.ts — we don't render the god-file). */
  function gradeLikeLessonPage(
    step: LessonStep,
    lessonId: string,
    correct: boolean,
  ): string[] {
    const wrote: string[] = [];
    if (!shouldWriteSrs(step)) return wrote;
    const isReviewLesson = isDedicatedReviewLesson(lessonId);
    expect(isReviewLesson).toBe(true);
    const modality = step.modality ?? "both";
    const modalities: SRSModality[] =
      modality === "both" ? ["recognition", "production"] : [modality];
    for (const atomId of step.exercisedAtoms ?? []) {
      if (isReviewLesson && !shouldWriteReviewLessonAtom(atomId, lessonId)) {
        continue;
      }
      let state = getCardState(atomId) ?? createInitialState();
      for (const m of modalities) {
        state = gradeFromLesson(state, m, { correct, retried: false });
      }
      setCardState(atomId, state);
      wrote.push(atomId);
    }
    return wrote;
  }

  it("a due-atom prefix step advances its target card via the shipped gates", () => {
    const atoms = getAtomsUpToModule("m9", "ja").filter(roundTrips);
    unlockAtomIds(atoms.slice(0, 6).map((a) => a.id));
    for (const a of atoms.slice(0, 6)) setCardState(a.id, dueState());

    const lessonId = "ja-m9-neo-review-1";
    const lesson = getMockLessonContent(lessonId)!;
    const step = lesson.steps.find((s) => /-dyn-step-\d+$/.test(s.id))!;
    expect(step).toBeTruthy();
    expect(shouldWriteSrs(step)).toBe(true);

    const target = (step.exercisedAtoms ?? [])[0];
    // The collision guard admits the target (it's ≤ the lesson's module by
    // construction — the scan only draws atoms up to the module).
    expect(shouldWriteReviewLessonAtom(target, lessonId)).toBe(true);

    const before = getCardState(target)!.recognition.reps;
    const wrote = gradeLikeLessonPage(step, lessonId, true);
    expect(wrote).toContain(target);
    expect(getCardState(target)!.recognition.reps).toBeGreaterThan(before);
  });

  it("a seated NEW card grades on completion — intake becomes learning, not stuck-new", () => {
    const atoms = getAtomsUpToModule("m9", "ja")
      .filter(roundTrips)
      .filter((a) => !isSwitchoverAtom(a.id));
    const seat = atoms[0];
    unlockAtomIds([seat.id]);
    // Matured seed (yesterday's unlock): reps 0, due today.
    setCardState(seat.id, createSeededState(getToday()));

    const prefix = buildDynamicReviewPrefix(fakeReviewLesson("m9"));
    const step = prefix.find(
      (s) => (s.exercisedAtoms ?? [])[0] === seat.id,
    )!;
    expect(step, "the matured new card must hold a seat").toBeTruthy();

    expect(isNew(getCardState(seat.id))).toBe(true);
    gradeLikeLessonPage(step, "ja-m9-neo-review-1", true);
    expect(isNew(getCardState(seat.id))).toBe(false);
  });

  it("prefix grammar steps carry the point id the grammar writer needs", () => {
    // Track B write itself is reviewGrammarPoint (LessonPage, review lessons
    // only) — pin that the prefix step is shaped so that call fires.
    const atoms = getAtomsUpToModule("m9", "ja").filter(roundTrips);
    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of atoms.slice(0, 2)) setCardState(a.id, dueState());
    const grammarIndex = getGrammarReviewIndex();
    const queue = buildGrammarReviewQueue();
    const point = [...queue.review, ...queue.newItems].find(
      (item) => (grammarIndex.get(item.point.id)?.length ?? 0) > 0,
    )!.point;
    setGrammarCardState(point.id, dueState());

    const prefix = buildDynamicReviewPrefix(fakeReviewLesson("m9"));
    const g = prefix.find((s) => s.id.includes("-dyn-grammar-"))!;
    expect(g).toBeTruthy();
    expect(shouldWriteSrs(g)).toBe(true);
    expect(g.exercisedGrammar).toEqual([point.id]);
    expect(getGrammarCardState(point.id)).toBeTruthy();
  });
});

describe("TTS safety — every dynamic audio surface resolves to a clip", () => {
  // Same field list as audioCoverage.test.ts: the fields whose value is
  // spoken aloud. Pinned here so a future prefix-builder change can't ship
  // silent dynamic steps (the miner only draws authored sentences today —
  // this keeps it that way).
  const AUDIO_FIELDS = ["audioKey", "audioText", "transcript", "promptAudioText"];

  function missingClips(steps: LessonStep[]): string[] {
    const missing: string[] = [];
    const walk = (node: unknown, stepId: string): void => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const item of node) walk(item, stepId);
        return;
      }
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (AUDIO_FIELDS.includes(key) && typeof value === "string" && value) {
          if (!getTtsUrl(value, "ja")) missing.push(`${stepId}: ${value}`);
        }
        walk(value, stepId);
      }
    };
    for (const s of steps) walk(s, s.id);
    return missing;
  }

  it("heavy-due + beat + seats: all spoken text is in the ja manifest", () => {
    const atoms = getAtomsUpToModule("m22", "ja");
    unlockAtomIds([...atoms.map((a) => a.id), ...switchoverIds()]);
    // Mix: most due, some fresh (seat candidates).
    for (const a of atoms.slice(10)) setCardState(a.id, dueState());

    const lesson = getMockLessonContent("ja-m22-neo-review-1")!;
    const dyn = lesson.steps.filter(isDynStep);
    expect(dyn.length).toBeGreaterThan(0);
    expect(missingClips(dyn)).toEqual([]);
  });

  it("light state with seats and grammar: still fully voiced", () => {
    const atoms = getAtomsUpToModule("m9", "ja").filter(roundTrips);
    unlockAtomIds(atoms.slice(0, 10).map((a) => a.id));
    for (const a of atoms.slice(0, 3)) setCardState(a.id, dueState());

    const prefix = buildDynamicReviewPrefix(fakeReviewLesson("m9"));
    expect(prefix.length).toBeGreaterThan(0);
    expect(missingClips(prefix)).toEqual([]);
  });
});
