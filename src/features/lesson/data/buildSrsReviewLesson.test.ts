import { describe, expect, it, beforeEach } from "vitest";
import {
  buildSrsReviewLesson,
  composeAtomSteps,
  sentenceDistractors,
  atomToReviewAtom,
  pickRecognitionStep,
  type ReviewPick,
  type SentencePoolEntry,
} from "./buildSrsReviewLesson";
import { classifyEnShape } from "./sentenceShape";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import { unlockAtomIds } from "./unlockLessonAtoms";
import { clearSRSStore } from "@/features/flashcards/engine";
import {
  translationMcq,
  type ReviewAtom,
} from "@/features/languages/ja/grammarHelpers";
import {
  setCardState,
  canonicalizeCardId,
} from "@/features/flashcards/engine/srsStorage";
import { createInitialState } from "@/features/flashcards/engine/srs";
import {
  getMinedTranslatedSentences,
  type MinedTranslatedSentence,
} from "./minedSentences";
import type { LessonStep } from "../types";
import {
  JA_COURSE_ATOMS_BY_KANA,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";

/**
 * ES review lessons assemble once the lesson atom index is generalized
 * (2026-07-15): `getAtomsUpToModule("m3", "es")` feeds real unlocked atoms
 * into the same builder the JA course uses.
 */
describe("buildSrsReviewLesson (es)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSRSStore();
  });

  it("assembles a review lesson from unlocked ES atoms up to m2", () => {
    // 2026-08-21: es restarted at m1/m2 under the §13 doctrine.
    const atoms = getAtomsUpToModule("m2", "es");
    expect(atoms.length).toBeGreaterThan(3);
    unlockAtomIds(atoms.map((a) => a.id));

    const lesson = buildSrsReviewLesson({
      moduleId: "m2",
      position: 1,
      courseId: "mock-1",
      languageId: "es",
    });

    expect(lesson.id).toBe("es-m2-review-1");
    expect(lesson.languageId).toBe("es");
    // Real review steps, not the "Nothing to review yet" placeholder.
    const reviewSteps = lesson.steps.filter((s) => s.type !== "info");
    expect(reviewSteps.length).toBeGreaterThan(0);
  });

  it("falls back to the empty-state info step when nothing is unlocked", () => {
    const lesson = buildSrsReviewLesson({
      moduleId: "m3",
      position: 2,
      courseId: "mock-1",
      languageId: "es",
    });
    expect(lesson.steps).toHaveLength(1);
    expect(lesson.steps[0].type).toBe("info");
  });
});

/**
 * Prompt framing (Spencer QA 2026-07-16, ja-m28-review-2): a bare
 * `meaningEn` ("this") as a whole step prompt reads unfinished. The
 * `translationMcq` factory this builder's production rotation calls must
 * frame the meaning as an instruction ("Pick the word for ..."), never
 * emit it bare.
 *
 * NOTE: this is asserted at the factory level (not by driving
 * `buildSrsReviewLesson` end-to-end for "ja") because the JA path now
 * composes through the shared sentence-miner (`minedSentences.ts`, in
 * concurrent development alongside this fix), which is independently
 * unstable right now — see `cardAgnosticReviews.test.ts` for the
 * `translationMcq` prompt-shape pin this generator relies on.
 */
describe("buildSrsReviewLesson — generated prompt framing (ja)", () => {
  it("pickProductionStep's translationMcq fallback never emits a bare meaning as the whole prompt", () => {
    const target = { kana: "これ", meaningEn: "this", fromModule: "m4" as const };
    const pool = [
      { kana: "あい", meaningEn: "love", fromModule: "m4" as const },
      { kana: "いいえ", meaningEn: "no", fromModule: "m4" as const },
      { kana: "はい", meaningEn: "yes", fromModule: "m4" as const },
    ];
    const step = translationMcq("test-bare-meaning", target, pool);
    expect(step.prompt).not.toBe(target.meaningEn);
    expect(step.prompt).toBe('Pick the word for "this"');
  });
});

/* ── sentence-context composition (Spencer QA 2026-07-16, ja-m28-review-2:
 * "purely MCQ or variations of it … effectively flash cards") ──
 * Due words go back into mined authored sentences via the shared miner;
 * word-level survives only for NEW cards and miner-less fallbacks; the
 * single-tile build (correctOrder.length 1) is retired from this generator
 * outright. */

/** Seed a due, NON-new SRS state (both modalities graded and overdue). */
function seedDueState(atomId: string): void {
  const state = createInitialState();
  for (const sub of [state.recognition, state.production]) {
    sub.reps = 3;
    sub.state = "review";
    sub.dueDate = "2020-01-01";
    sub.lastReviewDate = "2019-12-25";
  }
  setCardState(atomId, state);
}

function toReviewAtom(a: CourseAtom): ReviewAtom {
  return {
    kana: a.kana,
    meaningEn: a.meaningEn,
    emoji: a.emoji,
    fromModule: a.fromModule as ReviewAtom["fromModule"],
    // Mirrors the source `atomToReviewAtom` passthrough (TestFlight #163) —
    // tests that rely on this local helper for the shared `pool` need the
    // same registry fields the real builder now carries.
    blocked: a.blocked,
    pos: a.pos,
    conjugation: a.conjugation,
  };
}

function duePick(atom: CourseAtom): ReviewPick {
  return {
    atom,
    dueModalities: ["recognition", "production"],
    isNewCard: false,
  };
}

/** A step counts as sentence-context when its target is a real multi-word
 *  sentence: sentence listening comp, multi-tile build, or sentence speak. */
function isSentenceContextStep(step: LessonStep): boolean {
  if (step.type === "listening_comprehension") {
    return Boolean(step.transcript?.includes(" "));
  }
  if (step.type === "build_sentence") {
    return step.correctOrder.length >= 2;
  }
  if (step.type === "speaking") {
    return step.targetPhrase.includes(" ");
  }
  return false;
}

function isSingleTileBuild(step: LessonStep): boolean {
  return step.type === "build_sentence" && step.correctOrder.length === 1;
}

/** Atoms up to `moduleId` that the sentence miner covers with a translated
 *  sentence — the population where the ≥60% target must hold. */
function minedCoveredAtoms(moduleId: string): CourseAtom[] {
  const mined = getMinedTranslatedSentences();
  return getAtomsUpToModule(moduleId, "ja").filter((a) =>
    mined.has(canonicalizeCardId(a.id)),
  );
}

describe("buildSrsReviewLesson — sentence-context composition (ja)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSRSStore();
  });

  it("composes ≥60% sentence-context steps for due atoms the miner covers", () => {
    const covered = minedCoveredAtoms("m6");
    expect(covered.length).toBeGreaterThanOrEqual(8);
    const picks = covered.slice(0, 12).map(duePick);
    const pool = getAtomsUpToModule("m6", "ja").map(toReviewAtom);

    for (const isRecognitionHeavy of [true, false]) {
      const steps = composeAtomSteps({
        lessonId: "ja-test-review",
        picks,
        pool,
        isRecognitionHeavy,
        mined: getMinedTranslatedSentences(),
      });
      expect(steps).toHaveLength(picks.length);
      const sentenceSteps = steps.filter(isSentenceContextStep);
      expect(sentenceSteps.length / steps.length).toBeGreaterThanOrEqual(0.6);
      expect(steps.some(isSingleTileBuild)).toBe(false);
    }
  });

  it("end-to-end lesson with seeded due states hits ≥60% sentence context, zero single-tile builds", () => {
    const covered = minedCoveredAtoms("m6");
    // Unlock + seed ONLY miner-covered atoms as due, so coverage is total —
    // the regime where the ≥60% guarantee must hold.
    unlockAtomIds(covered.map((a) => a.id));
    for (const a of covered) seedDueState(a.id);

    for (const position of [1, 2] as const) {
      const lesson = buildSrsReviewLesson({
        moduleId: "m6",
        position,
        courseId: "mock-1",
        languageId: "ja",
      });
      const atomSteps = lesson.steps.filter((s) => /-step-\d+$/.test(s.id));
      expect(atomSteps.length).toBeGreaterThanOrEqual(8);
      const sentenceSteps = atomSteps.filter(isSentenceContextStep);
      expect(
        sentenceSteps.length / atomSteps.length,
      ).toBeGreaterThanOrEqual(0.6);
      expect(lesson.steps.some(isSingleTileBuild)).toBe(false);
    }
  });

  it("keeps NEW cards word-level (citation-form intro, no sentence steps)", () => {
    const covered = minedCoveredAtoms("m6");
    const picks: ReviewPick[] = covered.slice(0, 6).map((atom) => ({
      atom,
      dueModalities: [],
      isNewCard: true,
    }));
    const pool = getAtomsUpToModule("m6", "ja").map(toReviewAtom);
    const steps = composeAtomSteps({
      lessonId: "ja-test-new",
      picks,
      pool,
      isRecognitionHeavy: true,
      mined: getMinedTranslatedSentences(),
    });
    expect(steps).toHaveLength(picks.length);
    expect(steps.some(isSentenceContextStep)).toBe(false);
    expect(steps.some(isSingleTileBuild)).toBe(false);
  });

  it("falls back gracefully to word-level when the miner has no sentence", () => {
    const atoms = getAtomsUpToModule("m6", "ja");
    const picks = atoms.slice(0, 8).map(duePick);
    const pool = atoms.map(toReviewAtom);
    const steps = composeAtomSteps({
      lessonId: "ja-test-minerless",
      picks,
      pool,
      isRecognitionHeavy: false,
      mined: new Map<string, MinedTranslatedSentence>(),
    });
    expect(steps).toHaveLength(picks.length);
    expect(steps.some(isSentenceContextStep)).toBe(false);
    // The word-level production rotation is speaking ↔ translationMcq now —
    // never the retired single-tile build.
    expect(steps.some(isSingleTileBuild)).toBe(false);
  });

  it("reserves seats for never-reviewed words even under a huge due queue", () => {
    // B065, 2026-07-29. The picker used to merge `due` and `newCards` into one
    // list and shuffle it down to MAX_ATOMS, so a new word's odds were
    // 18/(due + 5) — a learner with a healthy due queue crowded out their own
    // intake. (The builder is not yet reachable from the live map — see the
    // scope warning at the picker — but the seats are the contract this test
    // pins for when the wiring lands.)
    const atoms = getAtomsUpToModule("m20", "ja");
    // Word-level steps credit `resolveAtomIds([target.kana])`, i.e. they look the
    // atom back up BY KANA — and JA_COURSE_ATOMS_BY_KANA is first-wins with the
    // JA_PRIMARY_ATOM_BY_KANA ruling table, so a homophone's step credits
    // whichever atom the ruling gives the kana to. Pick fixtures whose kana
    // round-trips, or this test measures that quirk instead of the seats.
    const roundTrips = (a: CourseAtom) =>
      JA_COURSE_ATOMS_BY_KANA.get(a.kana)?.id === a.id;
    // A due queue far past MAX_ATOMS: under the old picker the new words would
    // be a lottery ticket, not a guarantee.
    const NEW_COUNT = 8;
    const newAtoms = atoms.filter(roundTrips).slice(0, NEW_COUNT);
    const newIds = new Set(newAtoms.map((a) => a.id));
    const dueAtoms = atoms.filter((a) => !newIds.has(a.id));
    expect(dueAtoms.length).toBeGreaterThan(40);

    unlockAtomIds(atoms.map((a) => a.id));
    for (const a of dueAtoms) seedDueState(a.id);
    // newAtoms get NO card state at all — reps 0, exactly what unlock-seeding
    // leaves behind.

    const lesson = buildSrsReviewLesson({
      moduleId: "m20",
      position: 1,
      courseId: "mock-1",
      languageId: "ja",
    });
    const atomSteps = lesson.steps.filter((s) => /-step-\d+$/.test(s.id));
    const exercised = new Set(atomSteps.flatMap((s) => s.exercisedAtoms ?? []));
    const seated = newAtoms.filter((a) => exercised.has(a.id));

    // MAX_NEW is module-private; assert the property, not the constant.
    // 8 seats since Spencer's 2026-07-30 intake ruling ("more max is good") —
    // raised from 5 alongside the B069 phase-1 wiring.
    expect(seated.length).toBeGreaterThanOrEqual(8);
    // Session length is unchanged — the seats come off the top of MAX_ATOMS,
    // they are not added to it.
    expect(atomSteps.length).toBeLessThanOrEqual(18);
    // ...and the due queue still gets the rest of the lesson.
    expect(atomSteps.length - seated.length).toBeGreaterThan(5);
  });

  it("credits the target atom on EVERY atom step, whichever generator won", () => {
    // A reserved seat is worthless if the step it produces grades nothing.
    // `listeningCompSentence` — the last-resort fallback in pickRecognitionStep —
    // emits no exercisedAtoms, and shouldWriteSrs needs a non-empty list, so a
    // new card that landed there stayed new forever and held its seat every
    // review. Verified against the whole m20 pool, not a happy-path slice.
    const atoms = getAtomsUpToModule("m20", "ja");
    const picks = atoms.slice(0, 40).map(duePick);
    const pool = atoms.map(toReviewAtom);
    for (const isRecognitionHeavy of [true, false]) {
      const steps = composeAtomSteps({
        lessonId: "ja-test-credit-all",
        picks,
        pool,
        isRecognitionHeavy,
        mined: getMinedTranslatedSentences(),
      });
      expect(steps).toHaveLength(picks.length);
      steps.forEach((step, i) => {
        expect(step.exercisedAtoms ?? [], `${step.type} @ ${i}`).toContain(
          picks[i].atom.id,
        );
      });
    }
  });

  it("credits the target atom (plus ride-along vocab) on sentence steps", () => {
    const covered = minedCoveredAtoms("m6");
    const picks = covered.slice(0, 8).map(duePick);
    const pool = getAtomsUpToModule("m6", "ja").map(toReviewAtom);
    const steps = composeAtomSteps({
      lessonId: "ja-test-credit",
      picks,
      pool,
      isRecognitionHeavy: false,
      mined: getMinedTranslatedSentences(),
    });
    const sentenceSteps = steps.filter(isSentenceContextStep);
    expect(sentenceSteps.length).toBeGreaterThan(0);
    for (let i = 0; i < steps.length; i++) {
      if (!isSentenceContextStep(steps[i])) continue;
      const exercised = steps[i].exercisedAtoms ?? [];
      expect(exercised).toContain(picks[i].atom.id);
    }
  });
});

/* ── TestFlight #150 — distractor tense leak ──────────────────────────
 * Spencer's screen: 友達がわたしにプレゼントをくれる (present, "My friend
 * gives me a present") sat next to three past-tense distractors ("I got a
 * watch...", "My friend gave me...", "I borrowed an umbrella...") — the
 * odd-one-out tense gave the answer away. `sentenceDistractors` now buckets
 * the mined-sentence pool by (tense, question) before sampling. */
describe("sentenceDistractors — tense/shape bucketing (TestFlight #150)", () => {
  const CORRECT_EN = "My friend gives me a present";
  const CORRECT_JA = "友達がわたしにプレゼントをくれる。";

  // The exact three distractors from the founder's screenshot — all past.
  const PAST_1: SentencePoolEntry = {
    translation: "I got a watch from my father for my birthday",
    text: "誕生日に父から時計をもらいました。",
  };
  const PAST_2: SentencePoolEntry = {
    translation: "My friend gave me a cell phone",
    text: "友達が携帯電話をくれました。",
  };
  const PAST_3: SentencePoolEntry = {
    translation: "I borrowed an umbrella from my friend",
    text: "友達から傘を借りました。",
  };

  const PRESENT_FILLERS: SentencePoolEntry[] = [
    { translation: "My friend gives me flowers", text: "友達がわたしに花をくれる。" },
    { translation: "The teacher gives students homework", text: "先生が学生に宿題をだす。" },
    { translation: "My mother writes me a letter", text: "母がわたしに手紙をかく。" },
    { translation: "My brother lends me a book", text: "兄がわたしに本をかす。" },
    { translation: "My friend makes me a cake", text: "友達がわたしにケーキをつくる。" },
    { translation: "The teacher teaches us Japanese", text: "先生がわたしたちに日本語をおしえる。" },
  ];

  it("the exact #150 case: distractors are all present tense when the pool has enough", () => {
    const pool = [PAST_1, PAST_2, PAST_3, ...PRESENT_FILLERS];
    const result = sentenceDistractors(CORRECT_EN, CORRECT_JA, pool, 0);
    expect(result).not.toBeNull();
    const distractors = result!;
    expect(distractors).toHaveLength(3);
    // None of the founder's past-tense distractors leaked through.
    for (const past of [PAST_1, PAST_2, PAST_3]) {
      expect(distractors).not.toContain(past.translation);
    }
    for (const d of distractors) {
      expect(classifyEnShape(d).tense).toBe("present");
    }
  });

  it("relaxes tiers when the matching bucket is too small, but still returns the full count", () => {
    // Only ONE present-tense candidate available — same-tense-same-question
    // bucket can't cover 3, so the picker must relax through the tiers
    // rather than come back short.
    const pool = [PRESENT_FILLERS[0], PAST_1, PAST_2, PAST_3];
    const result = sentenceDistractors(CORRECT_EN, CORRECT_JA, pool, 0);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
  });

  it("is deterministic for the same seed/offset", () => {
    const pool = [PAST_1, PAST_2, PAST_3, ...PRESENT_FILLERS];
    const first = sentenceDistractors(CORRECT_EN, CORRECT_JA, pool, 3);
    const second = sentenceDistractors(CORRECT_EN, CORRECT_JA, pool, 3);
    expect(second).toEqual(first);
  });

  it("still returns null (never fewer than the required count) when the pool is too thin overall", () => {
    // Only 2 candidates total, no relaxation can invent a 3rd.
    const pool = [PAST_1, PAST_2];
    const result = sentenceDistractors(CORRECT_EN, CORRECT_JA, pool, 0);
    expect(result).toBeNull();
  });
});

/* ── TestFlight #163/#164(c): registry blocked/pos passthrough ──
 * #163: れんしゅうする's 📓 collided with ノート's glyph, and ならう
 * (`blocked: true` in courseAtoms.ts) still rendered as a word_image_mcq
 * tile — `atomToReviewAtom` dropped `blocked`/`pos`, so `audioImageMcq`
 * could only see the hand-curated `WORD_IMAGE_MCQ_BLOCKLIST`.
 * #164(c): "elevator" drew "do" (a bare verb form) as a distractor — no
 * part-of-speech agreement in `audioMeaningMcq`. */
describe("pickRecognitionStep — TestFlight #163/#164(c) fixtures", () => {
  const RENSHUU: ReviewAtom = {
    kana: "れんしゅうする",
    meaningEn: "to practice",
    emoji: "📓",
    fromModule: "m30" as const,
    blocked: true,
    pos: "verb",
  };
  const NARAU: ReviewAtom = {
    kana: "ならう",
    meaningEn: "to learn",
    emoji: "🎓",
    fromModule: "m30",
    blocked: true,
    pos: "verb",
  };
  const UNBLOCKED_NOUNS: ReviewAtom[] = [
    { kana: "test-fx-noun-1", meaningEn: "chair", emoji: "🪑", fromModule: "m1", pos: "noun" },
    { kana: "test-fx-noun-2", meaningEn: "window", emoji: "🪟", fromModule: "m1", pos: "noun" },
    { kana: "test-fx-noun-3", meaningEn: "table", emoji: "🛋️", fromModule: "m1", pos: "noun" },
    { kana: "test-fx-noun-4", meaningEn: "lamp", emoji: "💡", fromModule: "m1", pos: "noun" },
    { kana: "test-fx-noun-5", meaningEn: "clock", emoji: "🕰️", fromModule: "m1", pos: "noun" },
  ];

  it("atomToReviewAtom passes registry blocked/pos through (the actual #163 root cause)", () => {
    const narauAtom = JA_COURSE_ATOMS_BY_KANA.get("ならう");
    expect(narauAtom).toBeDefined();
    const reviewAtom = atomToReviewAtom(narauAtom!);
    expect(reviewAtom.blocked).toBe(true);
    expect(reviewAtom.pos).toBe("verb");
  });

  it("never emits a word_image_mcq for a registry-blocked target, across every recognition variant", () => {
    const pool = [RENSHUU, NARAU, ...UNBLOCKED_NOUNS];
    for (const target of [RENSHUU, NARAU]) {
      for (let variant = 0; variant < 6; variant++) {
        const step = pickRecognitionStep(`t-blocked-target-${variant}`, target, pool, variant);
        expect(step.type).not.toBe("word_image_mcq");
      }
    }
  });

  it("never offers a blocked atom as a word_image_mcq distractor tile either", () => {
    const pool = [RENSHUU, NARAU, ...UNBLOCKED_NOUNS];
    for (let variant = 0; variant < 6; variant++) {
      const step = pickRecognitionStep(`t-clean-target-${variant}`, UNBLOCKED_NOUNS[0], pool, variant);
      if (step.type === "word_image_mcq") {
        const words = step.options.map((o) => o.word);
        expect(words).not.toContain(RENSHUU.kana);
        expect(words).not.toContain(NARAU.kana);
      }
    }
  });

  it("word_image_mcq never doubles an emoji glyph (the #163 れんしゅうする/ノート collision shape)", () => {
    const target: ReviewAtom = { kana: "test-fx-target", meaningEn: "target", emoji: "🍎", fromModule: "m1", pos: "noun" };
    // Same emoji as target but a different word — the collision shape.
    const collide: ReviewAtom = { kana: "test-fx-collide", meaningEn: "collide", emoji: "🍎", fromModule: "m1", pos: "noun" };
    const pool = [collide, ...UNBLOCKED_NOUNS];
    for (let variant = 0; variant < 6; variant++) {
      const step = pickRecognitionStep(`t-collide-${variant}`, target, pool, variant);
      if (step.type === "word_image_mcq") {
        const emojis = step.options.map((o) => o.emoji);
        expect(new Set(emojis).size).toBe(emojis.length);
      }
    }
  });

  it("never draws a POS-mismatched word MCQ distractor (real #164(c) shape: elevator never draws 'do')", () => {
    const elevator: ReviewAtom = { kana: "エレベーター", meaningEn: "elevator", fromModule: "m30" as const, pos: "noun" };
    const shimasu: ReviewAtom = { kana: "します", meaningEn: "do", fromModule: "m7", pos: "verb" };
    const pool = [shimasu, ...UNBLOCKED_NOUNS];
    for (let variant = 0; variant < 6; variant++) {
      const step = pickRecognitionStep(`t-elevator-${variant}`, elevator, pool, variant);
      if (step.type === "listening_comprehension") {
        const texts = step.options.map((o) => o.text);
        expect(texts).not.toContain("do");
      }
    }
  });

  it("is deterministic for the same id/target/pool/variant", () => {
    const pool = [RENSHUU, NARAU, ...UNBLOCKED_NOUNS];
    const step1 = pickRecognitionStep("t-det-fixture", UNBLOCKED_NOUNS[0], pool, 0);
    const step2 = pickRecognitionStep("t-det-fixture", UNBLOCKED_NOUNS[0], pool, 0);
    expect(step1).toEqual(step2);
  });
});
