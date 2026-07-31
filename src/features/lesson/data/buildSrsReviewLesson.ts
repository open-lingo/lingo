import type { LessonContent, LessonStep } from "../types";
import {
  JA_COURSE_ATOMS_BY_KANA,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import {
  getCardState,
  canonicalizeCardId,
} from "@/features/flashcards/engine/srsStorage";
import { isDue, isNew, getDueModalities, createInitialState } from "@/features/flashcards/engine/srs";
import { getUnlockedAtomIds } from "./unlockLessonAtoms";
import { pickSwitchoverCandidates } from "@/features/languages/ja/secondScript/switchoverCandidate";
import { getLatchedKanjiIds } from "@/features/languages/ja/secondScript/kanjiSwitchoverLatch";
import { SWITCHOVER_BEAT_ENABLED } from "@/features/languages/ja/secondScript/kanjiRollout";
import { buildKanjiClozeStep } from "./kanjiClozeStep";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";
import { buildGrammarReviewQueue } from "@/features/flashcards/engine/grammarSrs";
import {
  getGrammarReviewIndex,
  sentenceVocabAtomIds,
  clozeStepSentence,
} from "./grammarReviewIndex";
import type { SRSCardState } from "@/features/flashcards/data/types";
import {
  getMinedTranslatedSentences,
  type MinedTranslatedSentence,
} from "./minedSentences";
import {
  audioImageMcq,
  audioMeaningMcq,
  translationMcq,
  vocabMcq,
  speaking,
  build,
  reviewMatchPairs,
  listeningCompSentence,
  infoStep,
  type ReviewAtom,
  withoutMcqBlocked,
} from "@/features/languages/ja/grammarHelpers";

/**
 * The kana→kanji switchover beat (B061), prepended when a word is ready.
 *
 * Two steps at the FRONT of the review, not the tail: the reveal is an
 * introduction, and an introduction that lands after eight retrieval steps is
 * competing with fatigue. It is also the only position where the learner has
 * definitely not yet met the word in kanji inside this same lesson.
 *
 * Up to `MAX_SWITCHOVER_BEATS_PER_REVIEW` (2) words per review, each adding a
 * reveal + graded cloze ON TOP of `MAX_ATOMS`. Candidate selection is
 * deliberately NOT FSRS-gated (`switchoverCandidate.ts` — curriculum-driven,
 * `RETIRED_KANJI_REVEAL_INTERVAL_DAYS` is retired), so the beat's word may not
 * be in the review's own atom set and its cloze can be an extra FSRS write on
 * an atom the review wouldn't otherwise touch. Accepted: the cloze is a genuine
 * retrieval either way. (Corrected 2026-07-29 after the independent review — an
 * earlier version of this comment claimed one word, a 14-day maturity gate, and
 * atom-set overlap; all three were wrong.)
 */
export function buildSwitchoverBeat(
  lessonId: string,
  learnerModule: number,
  unlockedIds: ReadonlySet<string>,
  mined: ReadonlyMap<string, MinedTranslatedSentence>,
): LessonStep[] {
  if (!SWITCHOVER_BEAT_ENABLED) return [];
  const out: LessonStep[] = [];
  // FIRST-EVER switchover: explain the mechanic once, then never again.
  //
  // Spencer 2026-07-29: *"maybe we give them the first kanji they learn at the
  // first intro point, insert maybe an info card, one example of this card inside
  // the lesson."* Without it the learner gets a permanent, irreversible change to
  // how a word is written off one correct answer, with nothing naming it — the
  // steady learner in the simulation called that "the scariest line in here".
  //
  // Keyed on the latch store being EMPTY rather than on a separate "seen" flag:
  // the store is the fact we already track, and a learner with nothing latched has
  // by definition never had a switchover.
  const isFirstEver = getLatchedKanjiIds().size === 0;

  for (const candidate of pickSwitchoverCandidates({
    learnerModule,
    unlockedAtomIds: unlockedIds,
  })) {
    // Beat ids are SUFFIXED per word, because the latch pairs reveal↔cloze by id
    // and two beats in one lesson would otherwise collide on `-kanji-reveal`.
    const slug = candidate.atomId.replace(/[^a-zA-Z0-9]+/g, "-");
    const cloze = buildKanjiClozeStep(
      `${lessonId}-kanji-cloze-${slug}`,
      candidate,
      mined.get(canonicalizeCardId(candidate.atomId)),
    );
    // Both halves or neither. A reveal with no retrieval is the ungraded card
    // both simulated learners tapped past (distributed spec §6c), and a cloze
    // with no introduction grades a form that was never taught. A word with no
    // mined sentence is skipped, not half-shipped.
    if (!cloze) continue;
    if (isFirstEver && out.length === 0) {
      out.push(
        infoStep(
          `${lessonId}-kanji-intro`,
          "Words start showing their kanji",
          "You already know this word by sound and meaning. From here on, words you know well will start appearing in their written form \u2014 with the reading above it until you have it down. Nothing new to memorise right now: just read along.",
          "grammar",
        ),
      );
    }
    out.push(
      {
        id: `${lessonId}-kanji-reveal-${slug}`,
        type: "kanji_reveal",
        atomId: candidate.atomId,
        kana: candidate.kana,
        kanji: candidate.kanji,
        gloss: candidate.gloss,
        parts: candidate.parts,
      } as LessonStep,
      cloze,
    );
  }
  return out;
}

const MAX_ATOMS = 18;
// Reserved new-card seats per review (B065). Raised 5 → 8 per Spencer's
// 2026-07-30 ruling on new-card intake ("more max is good, increase as
// needed") — the reviews are the course's intake valve now that the prefix
// wiring (B069 phase 1) gives this machinery live call sites.
const MAX_NEW = 8;
/** Track B grammar-point review steps appended per review lesson. Kept small
 *  so vocab still dominates; production-2 lessons lean a touch heavier. */
const MAX_GRAMMAR = 4;

/** One unlocked atom that qualifies for review (due, new, or both), plus the
 *  scheduling facts selection needs. Exported for the dynamic review prefix
 *  (B069 phase 1), which runs the same scan the full builder does. */
export type ReviewCandidate = {
  atom: CourseAtom;
  state: SRSCardState;
  dueModalities: Array<"recognition" | "production">;
  isNewCard: boolean;
};

export type ReviewCandidateScan = {
  /** Canonical (`ja:`-prefixed) unlocked atom ids. */
  unlockedIds: ReadonlySet<string>;
  /** Registry-ordered: oldest-introduced atoms first (D6 relies on this). */
  candidates: ReviewCandidate[];
  /** Distractor pool — carded atoms only, MCQ-blocklist filtered. */
  pool: ReviewAtom[];
};

/**
 * Scan the learner's live FSRS/unlock state for review material up to
 * `moduleId`. Pure read (D4): no writes, in-memory initial states only.
 * Shared by `buildSrsReviewLesson` and `buildDynamicReviewPrefix` so the two
 * surfaces can never disagree about what counts as due/new.
 */
export function scanReviewCandidates(
  moduleId: string,
  languageId: string,
): ReviewCandidateScan {
  const allAtoms = getAtomsUpToModule(moduleId, languageId);
  const unlockedIds = getUnlockedAtomIds();
  const candidates: ReviewCandidate[] = [];
  for (const atom of allAtoms) {
    // The unlock store keys are canonical (`ja:<id>`); CourseAtom ids are
    // bare. Canonicalize before the membership check or nothing matches.
    if (!unlockedIds.has(canonicalizeCardId(atom.id))) continue;
    // Pure construction (D4, scheduling-model-2026-06-15): NEVER persist
    // state at build time — that seeded due-today on every course-deck build
    // (the sentence-miner constructs every review lesson). Use an in-memory
    // initial state for selection/step-building; the real write happens on
    // grade (LessonPage) or on unlock (seedUnlockedAtomsDueNextDay).
    const state = getCardState(atom.id) ?? createInitialState();
    const isNewCard = isNew(state); // reps 0 — includes unlock-seeded atoms
    const dueModalities = isDue(state) ? getDueModalities(state) : [];
    if (dueModalities.length > 0 || isNewCard) {
      candidates.push({ atom, state, dueModalities, isNewCard });
    }
  }
  const pool: ReviewAtom[] = withoutMcqBlocked(
    allAtoms
      .filter((a) => getCardState(a.id))
      .map(atomToReviewAtom),
  );
  return { unlockedIds, candidates, pool };
}

function atomToReviewAtom(a: CourseAtom): ReviewAtom {
  return {
    kana: a.kana,
    meaningEn: a.meaningEn,
    emoji: a.emoji,
    fromModule: a.fromModule as ReviewAtom["fromModule"],
  };
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const out = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  for (let i = out.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = ((h >>> 0) % (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickRecognitionStep(
  idPrefix: string,
  target: ReviewAtom,
  pool: ReviewAtom[],
  variant: number,
): LessonStep {
  const v = variant % 3;
  if (v === 0 && target.emoji) {
    try { return audioImageMcq(idPrefix, target, pool); } catch { /* fall through */ }
  }
  if (v === 1) {
    try { return audioMeaningMcq(idPrefix, target, pool); } catch { /* fall through */ }
  }
  try { return vocabMcq(idPrefix, target, pool); } catch { /* fall through */ }
  // Last resort. The carded pool can be tiny — a fresh learner has unlocks but
  // no card state yet — and taking the FIRST three entries gave every step the
  // same distractors. Worse, an empty pool emitted textless options that still
  // wrote FSRS once steps were credited (2026-07-29 review). Shuffle per step,
  // dedupe against the answer, and pad from a fixed bank rather than emit a
  // blank-option MCQ.
  const distractorsEn = [
    ...new Set(
      seededShuffle(
        pool.filter(
          (a) => a.kana !== target.kana && a.meaningEn !== target.meaningEn,
        ),
        idPrefix,
      ).map((a) => a.meaningEn),
    ),
  ].slice(0, 3);
  for (const filler of ["water", "mountain", "teacher", "station", "blue"]) {
    if (distractorsEn.length >= 3) break;
    if (filler !== target.meaningEn && !distractorsEn.includes(filler)) {
      distractorsEn.push(filler);
    }
  }
  return listeningCompSentence({
    id: idPrefix,
    audioText: target.kana,
    correctMeaningEn: target.meaningEn,
    distractorsEn: distractorsEn as [string, string, string],
  });
}

/** Word-level production fallback (no mined sentence available).
 *  Spencer QA 2026-07-16 (ja-m28-review-2): the old v===1 branch emitted a
 *  SINGLE-TILE build (correctOrder.length 1) — pure flashcard feel, and the
 *  single-answer build render is being redesigned. This generator no longer
 *  emits single-tile builds at all; word production rotates
 *  speaking ↔ translationMcq instead. */
function pickProductionStep(
  idPrefix: string,
  target: ReviewAtom,
  pool: ReviewAtom[],
  variant: number,
): LessonStep {
  const v = variant % 2;
  if (v === 0) {
    return speaking(idPrefix, target.kana, target.meaningEn);
  }
  try { return translationMcq(idPrefix, target, pool); } catch { /* fall through */ }
  return speaking(idPrefix, target.kana, target.meaningEn);
}

/* ── sentence-context steps (Spencer QA 2026-07-16, ja-m28-review-2) ──
 * "Purely MCQ or variations of it … effectively flash cards." Review
 * lessons now put each due word back into a real authored sentence via the
 * shared sentence miner. Recognition → listen to the mined sentence, pick
 * its translation; production → rebuild or speak the mined sentence.
 * Word-level steps remain for NEW cards (citation-form intro is correct
 * there) and as fallback when no mined sentence exists. */

/** Credit the target atom AND ride-along sentence vocab — mirrors how the
 *  grammar-cloze section credits its sentence's content words. */
function withSentenceCredit(
  step: LessonStep,
  targetAtomId: string,
  sentenceText: string,
): LessonStep {
  const exercisedAtoms = Array.from(
    new Set([targetAtomId, ...sentenceVocabAtomIds(sentenceText)]),
  );
  return { ...step, exercisedAtoms } as LessonStep;
}

/** Pick 3 distinct distractor translations from the mined-sentence pool
 *  (all sentence-level, so options stay aspect-consistent). Returns null
 *  when the pool can't cover 3 — caller falls back to word-level. */
function sentenceDistractors(
  correct: string,
  translationPool: readonly string[],
  offset: number,
): [string, string, string] | null {
  const seen = new Set([correct]);
  const out: string[] = [];
  const n = translationPool.length;
  for (let k = 0; k < n && out.length < 3; k++) {
    const t = translationPool[(offset + k) % n];
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.length === 3 ? (out as [string, string, string]) : null;
}

function sentenceRecognitionStep(
  idPrefix: string,
  targetAtomId: string,
  sent: MinedTranslatedSentence,
  translationPool: readonly string[],
  variant: number,
): LessonStep | null {
  const distractors = sentenceDistractors(
    sent.translation,
    translationPool,
    variant,
  );
  if (!distractors) return null;
  return withSentenceCredit(
    listeningCompSentence({
      id: idPrefix,
      audioText: sent.text,
      correctMeaningEn: sent.translation,
      distractorsEn: distractors,
    }),
    targetAtomId,
    sent.text,
  );
}

function sentenceProductionStep(
  idPrefix: string,
  targetAtomId: string,
  targetKana: string,
  sent: MinedTranslatedSentence,
  pool: ReviewAtom[],
  variant: number,
): LessonStep {
  if (variant % 2 === 0) {
    // Multi-tile sentence build: mined sentences are space-separated
    // authored text — the standard word split the authored builds use.
    const words = sent.text.split(" ").filter(Boolean);
    const distractorWords = pool
      .filter((a) => a.kana !== targetKana && !words.includes(a.kana))
      .slice(0, 2)
      .map((a) => a.kana);
    return withSentenceCredit(
      build(
        idPrefix,
        `Build the sentence meaning "${sent.translation}"`,
        sent.text,
        [...words, ...distractorWords],
        words,
      ),
      targetAtomId,
      sent.text,
    );
  }
  return withSentenceCredit(
    speaking(idPrefix, sent.text, sent.translation),
    targetAtomId,
    sent.text,
  );
}

/** One picked atom + the scheduling facts the composer needs. Exported so
 *  tests can drive `composeAtomSteps` with an injected pick list (the live
 *  builder shuffles with a Date.now() seed — deliberate variety). */
export type ReviewPick = {
  atom: CourseAtom;
  dueModalities: Array<"recognition" | "production">;
  isNewCard: boolean;
};

/**
 * Compose the per-atom review steps. Target composition (Spencer QA
 * 2026-07-16): ≥60% of atom steps in sentence context whenever miner
 * coverage allows — due atoms with a mined translated sentence ALWAYS get a
 * sentence step; word-level MCQs survive only as new-card intros and
 * miner-less fallbacks. Same-type adjacency guard preserved. Pure
 * construction (D4): no state writes here.
 */
/**
 * Guarantee the step credits the atom it was built for (2026-07-29).
 *
 * Two ways a step could otherwise drill a word and grade the wrong thing:
 *
 *  - Steps built with NO `exercisedAtoms` graded nothing (`shouldWriteSrs`
 *    requires a non-empty list), so a new card that landed there stayed new
 *    forever, holding a reserved seat every review. Measured 2026-07-29: the
 *    `speaking` production fallback (no `exercisedAtomKanas` passed) and the
 *    last-resort `listeningCompSentence` — 133 + 104 such steps over the m30
 *    atom set with an empty miner.
 *  - The word-level generators credit `resolveAtomIds([target.kana])`, i.e.
 *    they look the atom back up BY KANA. `JA_COURSE_ATOMS_BY_KANA` is
 *    first-wins with the `JA_PRIMARY_ATOM_BY_KANA` ruling table, so for a
 *    kana collision (鼻/花, 歯/は-particle) the lookup returns the OTHER
 *    atom — a card the learner wasn't shown. Adding the target on top would
 *    leave that wrong credit in place, so it is stripped here: an existing id
 *    that is exactly the target-kana's map resolution but not the target is
 *    the mis-resolution artifact, never a legitimate ride-along.
 *
 * Otherwise additive: whatever else the generator credited stays (sentence
 * steps legitimately credit ride-along vocab).
 */
function creditTarget(step: LessonStep, atom: CourseAtom): LessonStep {
  const collision = JA_COURSE_ATOMS_BY_KANA.get(atom.kana)?.id;
  const existing = (step.exercisedAtoms ?? []).filter(
    (id) => !(id === collision && id !== atom.id),
  );
  if (existing.includes(atom.id) && existing.length === (step.exercisedAtoms?.length ?? 0)) {
    return step;
  }
  return {
    ...step,
    exercisedAtoms: existing.includes(atom.id) ? existing : [atom.id, ...existing],
  } as LessonStep;
}

export function composeAtomSteps(opts: {
  lessonId: string;
  picks: ReviewPick[];
  pool: ReviewAtom[];
  isRecognitionHeavy: boolean;
  mined: ReadonlyMap<string, MinedTranslatedSentence>;
}): LessonStep[] {
  const { lessonId, picks, pool, isRecognitionHeavy, mined } = opts;
  const translationPool = Array.from(
    new Set([...mined.values()].map((s) => s.translation)),
  );

  const pickStep = (
    stepId: string,
    pick: ReviewPick,
    useProduction: boolean,
    variant: number,
  ): LessonStep => {
    const target = atomToReviewAtom(pick.atom);
    // NEW cards keep word-level steps — citation-form intro is correct for
    // a first exposure; sentence context starts once the card has reps.
    const sent = pick.isNewCard
      ? undefined
      : mined.get(canonicalizeCardId(pick.atom.id));
    if (useProduction) {
      if (sent) {
        return sentenceProductionStep(
          stepId,
          pick.atom.id,
          target.kana,
          sent,
          pool,
          variant,
        );
      }
      return pickProductionStep(stepId, target, pool, variant);
    }
    if (sent) {
      const s = sentenceRecognitionStep(
        stepId,
        pick.atom.id,
        sent,
        translationPool,
        variant,
      );
      if (s) return s;
    }
    return pickRecognitionStep(stepId, target, pool, variant);
  };

  const steps: LessonStep[] = [];
  let lastType = "info";
  for (let i = 0; i < picks.length; i++) {
    const pick = picks[i];
    const stepId = `${lessonId}-step-${i}`;

    let useProduction: boolean;
    if (isRecognitionHeavy) {
      useProduction = i % 4 === 3;
    } else {
      useProduction = i % 4 !== 0;
    }

    if (pick.dueModalities.length === 1) {
      useProduction = pick.dueModalities[0] === "production";
    }

    if (pick.isNewCard) {
      useProduction = false;
    }

    let step = pickStep(stepId, pick, useProduction, i);

    // Same-type adjacency: re-pick with the other modality/variant. This
    // used to skip the LAST pick (`i < picks.length - 1`) — harmless when
    // the builder always appended grammar/match steps after, but the B069
    // dynamic prefix composes short pick lists whose last step sits directly
    // against other content, and a trailing same-type pair there got the
    // seat DROPPED by the prefix's adjacency placer (2026-07-30).
    if (step.type === lastType) {
      step = pickStep(stepId, pick, !useProduction, i + 7);
    }

    lastType = step.type;
    steps.push(creditTarget(step, pick.atom));
  }
  return steps;
}

export function buildSrsReviewLesson(opts: {
  moduleId: string;
  position: 1 | 2;
  courseId: string;
  languageId: string;
}): LessonContent {
  const { moduleId, position, courseId, languageId } = opts;
  const id = `${languageId}-${moduleId}-review-${position}`;
  const isRecognitionHeavy = position === 1;

  const { unlockedIds, candidates, pool } = scanReviewCandidates(
    moduleId,
    languageId,
  );

  if (candidates.length < 4) {
    return {
      id,
      moduleId,
      courseId,
      languageId,
      title: `Review ${position}`,
      description: "Complete more lessons to unlock review content.",
      estimatedMinutes: 1,
      xpReward: 0,
      steps: [
        infoStep(
          `${id}-info-empty`,
          "Nothing to review yet",
          "Complete more lessons to unlock vocabulary for review. Come back after finishing a few more sub-lessons!",
        ),
      ],
    };
  }

  // Reserved seats for never-reviewed words (B065, 2026-07-29). This used to
  // merge `due` and `newCards` into one list and shuffle it down to MAX_ATOMS,
  // which made every new word's odds 18/(due + 5): a learner with a healthy due
  // queue crowded out their OWN new-word intake. (⚠️ Scope, per the 2026-07-29
  // independent review: NOTHING on the live JA map routes here — the 73 live
  // `ja-mN-neo-review-*` lessons are static IR lessons; only the
  // `ja-mN-review-1/2` id shape reaches this builder, and no map tile carries
  // it. This fix is real but dormant until that wiring lands — see backlog.)
  //
  // `newCards` is deliberately NOT shuffled: registry order puts the OLDEST
  // never-reviewed atoms first, which is what keeps same-day just-introduced
  // words out of the seats (D6). Shuffling it would silently break that.
  // The trailing slice is the only hard cap on lesson length — keep it even
  // though MAX_NEW < MAX_ATOMS makes it look redundant today.
  const due = candidates.filter((c) => !c.isNewCard);
  const newCards = candidates.filter((c) => c.isNewCard).slice(0, MAX_NEW);
  const seed = `${id}-${Date.now()}`;
  const pickedDue = seededShuffle(due, seed).slice(
    0,
    Math.max(0, MAX_ATOMS - newCards.length),
  );
  const picked = seededShuffle([...pickedDue, ...newCards], `${seed}-order`).slice(
    0,
    MAX_ATOMS,
  );

  const mined =
    languageId === "ja"
      ? getMinedTranslatedSentences()
      : new Map<string, MinedTranslatedSentence>();

  const steps: LessonStep[] = [
    // Before the "Recognition review" intro card: the beat is the reason this
    // lesson is different today, so it leads.
    ...buildSwitchoverBeat(id, parseModuleIndex(moduleId), unlockedIds, mined),
    infoStep(
      `${id}-info-start`,
      isRecognitionHeavy ? "Recognition review" : "Production review",
      isRecognitionHeavy
        ? "Can you recognize these words? Listen, look, and pick the right answer."
        : "Time to produce! Say the words aloud and build sentences from tiles.",
    ),
  ];

  steps.push(
    ...composeAtomSteps({
      lessonId: id,
      picks: picked,
      pool,
      isRecognitionHeavy,
      mined,
    }),
  );

  // ── Track B: grammar-point review (retention 3b) ──
  // Reuse authored particle-cloze steps, tagged with the grammar point they
  // drill. Due points first, then new (seeded so completion grades them).
  // Production-2 lessons skew slightly heavier on grammar.
  const grammarIndex = getGrammarReviewIndex();
  const grammarQueue = buildGrammarReviewQueue(unlockedIds);
  const grammarCap = isRecognitionHeavy ? Math.floor(MAX_GRAMMAR / 2) : MAX_GRAMMAR;
  const grammarPicks = [...grammarQueue.review, ...grammarQueue.newItems]
    .filter((item) => grammarIndex.has(item.point.id))
    .slice(0, grammarCap);
  for (const item of grammarPicks) {
    const templates = grammarIndex.get(item.point.id);
    if (!templates || templates.length === 0) continue;
    // No build-time seed (D4: pure construction). Track B state is written on
    // grade by reviewGrammarPoint, which creates-if-missing.
    const tmpl = templates[0];
    // D4: the grammar review also gives full credit to the content vocab in
    // its sentence (not just the authored particle atom).
    const sentenceAtoms = sentenceVocabAtomIds(clozeStepSentence(tmpl));
    const exercisedAtoms = Array.from(
      new Set([...(tmpl.exercisedAtoms ?? []), ...sentenceAtoms]),
    );
    steps.push({
      ...tmpl,
      id: `${id}-grammar-${item.point.id}`,
      exercisedGrammar: [item.point.id],
      exercisedAtoms,
    });
  }

  if (picked.length >= 5) {
    const matchAtoms = picked.slice(0, Math.min(5, picked.length)).map((p) => atomToReviewAtom(p.atom));
    steps.push(reviewMatchPairs(`${id}-match`, matchAtoms));
  }

  steps.push(
    infoStep(
      `${id}-info-end`,
      "Review complete",
      `You reviewed ${picked.length} words. These are now tracked in your SRS — they'll come back at the right time via flashcards or future lessons.`,
      "win",
    ),
  );

  return {
    id,
    moduleId,
    courseId,
    languageId,
    title: isRecognitionHeavy
      ? `Module ${moduleId.replace("m", "")} — Review 1`
      : `Module ${moduleId.replace("m", "")} — Review 2`,
    description: isRecognitionHeavy
      ? "Recognition review — listen, look, and identify."
      : "Production review — speak, build, and recall.",
    estimatedMinutes: 8,
    xpReward: 20,
    steps,
  };
}
