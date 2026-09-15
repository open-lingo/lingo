/**
 * RULE 3 GATE, FSRS half — the six-module window and the 50/50 split.
 *
 * Spencer, 2026-09-15 (`docs/spencer-product-sentiment.md`, Topic 3):
 *
 *   "yeah that should be perfect and THEN we can add half of the lesson as
 *    fsrs seeded reviews, the same way we do the review lesson tails, so half
 *    recent things, half fsrs learnings."
 *
 * with the exception clause that makes it safe: a word OUTSIDE the six-module
 * look-back is legal only when its card is DUE. #116 is the failure —
 * *"いいえ has no business in advanced review"* — so いいえ at m31 is the
 * canonical fixture here, in both directions.
 *
 * The content half (compiled filler/review pools) is gated in
 * `features/languages/ja/__tests__/reviewWindowFloor.test.ts`.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  buildDynamicReviewPrefix,
  placeAvoidingSameType,
} from "./dynamicReviewPrefix";
import {
  scanReviewCandidates,
  selectReviewHalves,
  type ReviewCandidate,
  type ReviewCandidateScan,
} from "./buildSrsReviewLesson";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import { unlockAtomIds } from "./unlockLessonAtoms";
import { setCardState, clearSRSStore } from "@/features/flashcards/engine/srsStorage";
import {
  createInitialState,
  addDays,
  getToday,
} from "@/features/flashcards/engine/srs";
import { clearGrammarStore } from "@/features/flashcards/engine/grammarSrs";
import { resetKanjiLatchStore } from "@/features/languages/ja/secondScript/kanjiSwitchoverLatch";
import { getJaRecentKanaWindow } from "@/features/languages/ja/curriculum/recentVocabWindow";
import { findSentenceReuse } from "./contentFloors";
import { getMockLessonContent } from "./mockLessons";
import type { LessonContent, LessonStep } from "../types";
import type { SRSCardState } from "@/features/flashcards/data/types";
import type { CourseAtom } from "@/features/languages/ja/courseAtoms";

function fakeReviewLesson(moduleId: string): LessonContent {
  return {
    id: `ja-${moduleId}-neo-review-1`,
    moduleId,
    courseId: "mock-1",
    languageId: "ja",
    title: "Review",
    description: "",
    estimatedMinutes: 5,
    xpReward: 10,
    steps: [{ id: `ja-${moduleId}-neo-review-1-s-0`, type: "match_pairs" } as LessonStep],
  };
}

/** Due today, already studied (reps > 0 → not a "new card"). */
function dueState(): SRSCardState {
  const base = createInitialState();
  const today = getToday();
  return {
    ...base,
    recognition: { ...base.recognition, reps: 3, dueDate: today, lastReviewedAt: today },
    production: { ...base.production, reps: 3, dueDate: today, lastReviewedAt: today },
  } as SRSCardState;
}

/** Studied, comfortably NOT due — the "recent half" shape. */
function restingState(): SRSCardState {
  const base = createInitialState();
  const future = addDays(getToday(), 20);
  return {
    ...base,
    recognition: { ...base.recognition, reps: 4, dueDate: future, lastReviewedAt: getToday() },
    production: { ...base.production, reps: 4, dueDate: future, lastReviewedAt: getToday() },
  } as SRSCardState;
}

beforeEach(() => {
  localStorage.clear();
  clearSRSStore();
  clearGrammarStore();
  resetKanjiLatchStore();
});

/* ── the split itself (c) and (d) ── */

function candidate(id: string, isNewCard: boolean): ReviewCandidate {
  return {
    atom: { id, kana: id, romaji: id, meaningEn: id, fromModule: "m1", kind: "vocab", pos: "noun" } as CourseAtom,
    state: createInitialState(),
    dueModalities: isNewCard ? [] : ["recognition"],
    isNewCard,
  };
}

function fakeScan(dueCount: number, recentCount: number): ReviewCandidateScan {
  return {
    unlockedIds: new Set<string>(),
    candidates: Array.from({ length: dueCount }, (_, i) => candidate(`due-${i}`, false)),
    pool: [],
    recentNotDue: Array.from({ length: recentCount }, (_, i) => candidate(`recent-${i}`, false)),
    recentWindowModules: 6,
  };
}

describe("RULE 3 — selectReviewHalves", () => {
  it("(c) 6 due cards and 10 slots → 5 due + 5 recent", () => {
    const { due, recent } = selectReviewHalves({
      scan: fakeScan(6, 40),
      slots: 10,
      seed: "seed",
    });
    expect(due).toHaveLength(5);
    expect(recent).toHaveLength(5);
    expect(due.every((c) => c.atom.id.startsWith("due-"))).toBe(true);
    expect(recent.every((c) => c.atom.id.startsWith("recent-"))).toBe(true);
  });

  it("(d) 0 due → 10 recent (the recent half backfills the whole lesson)", () => {
    const { due, recent } = selectReviewHalves({
      scan: fakeScan(0, 40),
      slots: 10,
      seed: "seed",
    });
    expect(due).toHaveLength(0);
    expect(recent).toHaveLength(10);
  });

  it("0 recent → 10 due (the backfill runs both ways)", () => {
    const { due, recent } = selectReviewHalves({
      scan: fakeScan(40, 0),
      slots: 10,
      seed: "seed",
    });
    expect(recent).toHaveLength(0);
    expect(due).toHaveLength(10);
  });

  it("a thin pool on both sides never over-fills", () => {
    const { due, recent } = selectReviewHalves({
      scan: fakeScan(2, 3),
      slots: 10,
      seed: "seed",
    });
    expect(due.length + recent.length).toBe(5);
  });

  it("is stable within a seed and varies across seeds", () => {
    const a = selectReviewHalves({ scan: fakeScan(20, 20), slots: 10, seed: "day-1" });
    const b = selectReviewHalves({ scan: fakeScan(20, 20), slots: 10, seed: "day-1" });
    const c = selectReviewHalves({ scan: fakeScan(20, 20), slots: 10, seed: "day-2" });
    const ids = (x: { due: ReviewCandidate[]; recent: ReviewCandidate[] }) =>
      [...x.due, ...x.recent].map((v) => v.atom.id).join(",");
    expect(ids(a)).toBe(ids(b));
    expect(ids(a)).not.toBe(ids(c));
  });

  it("slots ≤ 0 selects nothing", () => {
    expect(selectReviewHalves({ scan: fakeScan(9, 9), slots: 0, seed: "s" })).toEqual({
      due: [],
      recent: [],
    });
  });
});

/* ── the window, through the live prefix: (a) and (b) ── */

const IIE = "iie";

function prefixTargets(moduleId: string): string[] {
  const prefix = buildDynamicReviewPrefix(fakeReviewLesson(moduleId));
  const out: string[] = [];
  for (const s of prefix) for (const a of s.exercisedAtoms ?? []) out.push(a);
  return out;
}

describe("RULE 3 — the six-module window in the live prefix (#116)", () => {
  it("m31's window really does exclude いいえ (fixture sanity)", () => {
    const window = getJaRecentKanaWindow("m31");
    expect(window).not.toBeNull();
    expect(window!.has("いいえ")).toBe(false);
  });

  it("(a) an m31 learner with いいえ NOT due never sees it", () => {
    const atoms = getAtomsUpToModule("m31", "ja");
    expect(atoms.some((a) => a.id === IIE), "いいえ is unlocked by m31").toBe(true);
    unlockAtomIds(atoms.map((a) => a.id));
    // Everything resting: nothing is due, so the prefix must be all-recent.
    for (const a of atoms) setCardState(a.id, restingState());
    const targets = prefixTargets("m31");
    expect(targets.length, "the prefix still has material to serve").toBeGreaterThan(0);
    expect(targets, "いいえ is 30 modules stale and not due — #116").not.toContain(IIE);
  });

  it("(b) …and DOES see it the moment it is due", () => {
    const atoms = getAtomsUpToModule("m31", "ja");
    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of atoms) setCardState(a.id, restingState());
    // One due card, and it is the stale one: a due word may come from anywhere.
    setCardState(IIE, dueState());
    expect(prefixTargets("m31")).toContain(IIE);
  });

  it("the recent half only ever holds in-window atoms", () => {
    const atoms = getAtomsUpToModule("m31", "ja");
    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of atoms) setCardState(a.id, restingState());
    const scan = scanReviewCandidates("m31", "ja");
    const window = getJaRecentKanaWindow("m31")!;
    const stale = scan.recentNotDue.filter(
      (c) => !c.atom.kana.split("/").some((s) => window.has(s.trim())),
    );
    expect(
      stale.map((c) => `${c.atom.id} (${c.atom.kana})`),
      "out-of-window atoms in the recent half",
    ).toEqual([]);
    // Non-vacuity: the recent half is not simply empty.
    expect(scan.recentNotDue.length).toBeGreaterThan(10);
  });

  it("RULE 2 holds across the prefix/authored seam", () => {
    // The prefix is composed from MINED sentences and then glued in front of
    // an authored body it has never seen, so the merged lesson — the thing the
    // learner actually walks — is where the spacing rule has to hold. Heavy
    // state: everything unlocked and due, so the prefix is at its cap and has
    // the most chances to collide.
    const atoms = getAtomsUpToModule("m31", "ja");
    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of atoms) setCardState(a.id, dueState());
    for (const lessonId of [
      "ja-m31-neo-review-1",
      "ja-m31-neo-review-2",
      "ja-m22-neo-review-1",
      "ja-m16-neo-review-1",
    ]) {
      const merged = getMockLessonContent(lessonId);
      expect(merged, lessonId).toBeTruthy();
      const dyn = merged!.steps.filter((s) => s.id.includes("-dyn"));
      expect(dyn.length, `${lessonId} has a dynamic prefix`).toBeGreaterThan(0);
      const { hard } = findSentenceReuse(merged!.steps);
      expect(
        hard.map(
          (v) => `${lessonId} d=${v.distance} ${v.firstId} → ${v.secondId} :: ${v.sentence}`,
        ),
        "same-sentence pairs inside the merged review lesson",
      ).toEqual([]);
    }
  });

  it("the seam guard relocates a planted collision (proof it can fail)", () => {
    // The live fixtures' mined sentences never collide with their authored
    // bodies, so the guard is defensive there. Plant the collision instead:
    // a prefix step asking the sentence the AUTHORED body opens with.
    const step = (id: string, type: string, ja: string): LessonStep =>
      ({
        id,
        type,
        prompt: "p",
        targetSentence: ja,
        transcript: ja,
        audioKey: ja,
        tiles: ja.split(" "),
        correctOrder: ja.split(" "),
        granularity: "word",
        question: "What does this mean?",
        options: [],
        correctOptionId: "correct",
        sourceLanguage: "target",
        sourceText: ja,
      }) as unknown as LessonStep;
    const COLLIDE = "でんしゃが でる";
    // The collider is LAST, so the unguarded placement parks it right against
    // the authored body — the seam case.
    const prefix = [
      step("p1", "listening_comprehension", "ドアが あく"),
      step("p2", "build_sentence", "まどを あける"),
      step("p0", "translate", COLLIDE),
    ];
    const followerSentence = COLLIDE.replace(/\s/g, "");

    // Guard ON: the colliding step must not end up adjacent to the body.
    const guarded = placeAvoidingSameType(
      prefix,
      undefined,
      "listening_build",
      [],
      [followerSentence],
    );
    const merged = [...guarded, step("body0", "listening_build", COLLIDE)];
    expect(findSentenceReuse(merged).hard, "guarded merge").toEqual([]);

    // Guard OFF (no follower sentences passed): the same input DOES collide —
    // which is what makes the assertion above meaningful.
    const unguarded = placeAvoidingSameType(prefix, undefined, "listening_build");
    const mergedBad = [...unguarded, step("body0", "listening_build", COLLIDE)];
    expect(findSentenceReuse(mergedBad).hard.length, "unguarded merge").toBeGreaterThan(0);
  });

  it("no window below the IR era → every unlocked atom counts as recent", () => {
    const atoms = getAtomsUpToModule("m9", "ja");
    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of atoms) setCardState(a.id, restingState());
    const scan = scanReviewCandidates("m9", "ja");
    expect(scan.recentWindowModules).toBeNull();
    expect(scan.recentNotDue.length).toBeGreaterThan(0);
  });
});
