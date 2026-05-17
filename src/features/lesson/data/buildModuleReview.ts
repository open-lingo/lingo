/**
 * Module-review lesson factory (M3 restructure, 2026-05-16).
 *
 * Builds a triplet of inter-module review lessons that cycle the prior
 * 1-3 modules' grammar via particle clozes + sentence builds + dialogue
 * snippets. Composes ONLY existing step primitives (no new step types):
 * `info`, `particle_cloze`, `build_sentence`, `multiple_choice`,
 * `phrase_card`. Each lesson runs ~4 min; three lessons + a row-test
 * mastery lesson per review cycle (~15 min total).
 *
 * Per Spencer's spec:
 *   - 3 review lessons per cycle
 *   - ~6 cloze + 4 build + 2 dialogue snippets per lesson, drawn from the
 *     prior modules' content pool
 *   - Coverage scales with the cycle: R1 = M3 only, R2 = M3+M4, etc.
 *   - The review module earns its own mastery ★ at SRS stage 5
 *
 * The content pool is hand-curated per source module (REVIEW_POOLS). When a
 * cycle covers multiple modules we sample across them so every lesson
 * exercises material from all included modules — not three lessons of M3
 * followed by zero of M4.
 */
import type {
  BuildSentenceStep,
  InfoStep,
  LessonContent,
  ParticleClozeStep,
  PhraseCardStep,
  RowTestItem,
  RowTestStep,
  MultipleChoiceStep,
  MatchPairsStep,
} from "../types";

export type ReviewClozeSpec = {
  before: string;
  after: string;
  correctParticle: string;
  options: string[];
  meaningEn: string;
  audioText: string;
  explanation?: string;
};

export type ReviewBuildSpec = {
  prompt: string;
  target: string;
  tiles: string[];
  correctOrder: string[];
};

export type ReviewDialogueSpec = {
  speaker: string;
  meaningEn: string;
  romaji: string;
  kana: string;
  cultureNote?: string;
};

export type ReviewPool = {
  /** Source module id, e.g. "m3". */
  moduleId: string;
  clozes: ReviewClozeSpec[];
  builds: ReviewBuildSpec[];
  dialogue: ReviewDialogueSpec[];
};

// ----- Factory ------------------------------------------------------------

function info(id: string, title: string, body: string, variant: InfoStep["variant"] = "default"): InfoStep {
  return { id, type: "info", title, body, variant };
}

function clozeOf(idPrefix: string, n: number, spec: ReviewClozeSpec): ParticleClozeStep {
  return {
    id: `${idPrefix}-cloze-${n}`,
    type: "particle_cloze",
    prompt: { before: spec.before, after: spec.after },
    correctParticle: spec.correctParticle,
    options: spec.options,
    meaningEn: spec.meaningEn,
    audioText: spec.audioText,
    explanation: spec.explanation,
  };
}

function buildOf(idPrefix: string, n: number, spec: ReviewBuildSpec): BuildSentenceStep {
  return {
    id: `${idPrefix}-build-${n}`,
    type: "build_sentence",
    prompt: spec.prompt,
    targetSentence: spec.target,
    tiles: spec.tiles,
    correctOrder: spec.correctOrder,
    granularity: "word",
    audioKey: spec.target,
    targetAnnotation: [{ surface: spec.target, reading: spec.target }],
  };
}

function dialogueLineOf(idPrefix: string, n: number, spec: ReviewDialogueSpec): PhraseCardStep {
  return {
    id: `${idPrefix}-dlg-${n}`,
    type: "phrase_card",
    meaningEn: `${spec.speaker}: ${spec.meaningEn}`,
    romaji: spec.romaji,
    kana: spec.kana,
    cultureNote: spec.cultureNote,
  };
}

/**
 * Round-robin sample N items from each pool's `arr` getter, drawn evenly
 * across pools. Indices wrap so callers can request more items than any
 * single pool has — items repeat across lessons in long review cycles.
 *
 * `offset` shifts the starting index per lesson so the three lessons in a
 * cycle don't show the same items in the same order.
 */
function interleave<T>(
  pools: ReviewPool[],
  pick: (p: ReviewPool) => T[],
  count: number,
  offset: number,
): T[] {
  const out: T[] = [];
  const arrays = pools.map(pick).filter((a) => a.length > 0);
  if (arrays.length === 0) return out;
  let i = 0;
  while (out.length < count) {
    const arr = arrays[i % arrays.length];
    out.push(arr[(Math.floor(i / arrays.length) + offset) % arr.length]);
    i++;
    // Safety: bail if we've cycled the full set without growing (pool empty).
    if (i > count * arrays.length * 2) break;
  }
  return out;
}

export type BuildModuleReviewOpts = {
  /** Review-module id, e.g. "m3-review". */
  reviewModuleId: string;
  /** Pretty title for the review module ("Review · M3"). */
  reviewTitle: string;
  /** Pools the cycle covers, in module order. */
  pools: ReviewPool[];
  /** courseId on every lesson — typically the live course. */
  courseId: string;
  /** Language id — typically "ja". */
  languageId: string;
};

/**
 * Emits the 3 content lessons + 1 row-test mastery lesson for one review
 * cycle. The 4 lessons together cycle the supplied modules' material.
 */
export function buildModuleReviewLessons(opts: BuildModuleReviewOpts): LessonContent[] {
  const { reviewModuleId, reviewTitle, pools, courseId, languageId } = opts;
  const lessons: LessonContent[] = [];

  for (let lessonNum = 1; lessonNum <= 3; lessonNum++) {
    const idPrefix = `ja-${reviewModuleId}-${lessonNum}`;
    const clozes = interleave(pools, (p) => p.clozes, 6, (lessonNum - 1) * 2);
    const builds = interleave(pools, (p) => p.builds, 4, (lessonNum - 1) * 2);
    const dialogue = interleave(pools, (p) => p.dialogue, 2, (lessonNum - 1));

    const steps = [
      info(
        `${idPrefix}-info-open`,
        `${reviewTitle} · ${lessonNum} of 3`,
        "Quick review. No new grammar — just cycling what you already learned so it sticks. Particle picks first, then sentence builds, then a couple of dialogue lines.",
        "default",
      ),
      ...clozes.map((c, i) => clozeOf(idPrefix, i + 1, c)),
      ...builds.map((b, i) => buildOf(idPrefix, i + 1, b)),
      ...dialogue.map((d, i) => dialogueLineOf(idPrefix, i + 1, d)),
      info(
        `${idPrefix}-info-end`,
        "Cycle complete",
        "Each pass strengthens the pattern. Two more lessons in this review, then the mastery test for ★.",
        "win",
      ),
    ];

    lessons.push({
      id: idPrefix,
      moduleId: reviewModuleId,
      courseId,
      languageId,
      title: `${reviewTitle} · ${lessonNum} of 3`,
      description: "Spaced review. Cycle prior modules' grammar in context.",
      estimatedMinutes: 4,
      xpReward: 12,
      kind: "module_review",
      steps,
    });
  }

  // Test lesson — reuses MC + build + match adapters in TestRunner.
  const testId = `ja-${reviewModuleId}-test`;
  const items: RowTestItem[] = [];
  const allClozes = pools.flatMap((p) => p.clozes);
  const allBuilds = pools.flatMap((p) => p.builds);
  const allDialogue = pools.flatMap((p) => p.dialogue);
  // 5 MC particle items from the cloze pool.
  for (let i = 0; i < Math.min(5, allClozes.length); i++) {
    const c = allClozes[i % allClozes.length];
    const mc: MultipleChoiceStep = {
      id: `${testId}-mc-${i + 1}`,
      type: "multiple_choice",
      prompt: `${c.before}___${c.after} (${c.meaningEn})`,
      promptAudioText: c.audioText,
      options: [
        { id: "correct", text: c.correctParticle },
        ...c.options
          .filter((o) => o !== c.correctParticle)
          .slice(0, 3)
          .map((text, idx) => ({ id: `opt-${idx + 1}`, text })),
      ],
      correctOptionId: "correct",
      explanation: c.explanation,
      optionsHideRomaji: true,
    };
    items.push({ kind: "mc", payload: mc });
  }
  // 2 build items.
  for (let i = 0; i < Math.min(2, allBuilds.length); i++) {
    const b = allBuilds[i % allBuilds.length];
    const buildStep: BuildSentenceStep = {
      id: `${testId}-build-${i + 1}`,
      type: "build_sentence",
      prompt: b.prompt,
      targetSentence: b.target,
      tiles: b.tiles,
      correctOrder: b.correctOrder,
      granularity: "word",
      audioKey: b.target,
      targetAnnotation: [{ surface: b.target, reading: b.target }],
    };
    items.push({ kind: "build", payload: buildStep });
  }
  // 1 match-pairs item: pair each dialogue romaji to meaning.
  if (allDialogue.length >= 4) {
    const matchPairs: MatchPairsStep = {
      id: `${testId}-match-1`,
      type: "match_pairs",
      prompt: "Match each phrase to its meaning",
      pairs: allDialogue.slice(0, 6).map((d, i) => ({
        id: `p${i + 1}`,
        source: d.kana,
        target: d.meaningEn,
        sourceAnnotation: [{ surface: d.kana, reading: d.kana }],
      })),
    };
    items.push({ kind: "match", payload: matchPairs });
  }

  const rowTest: RowTestStep = {
    id: `${testId}-rowtest`,
    type: "row_test",
    rowId: reviewModuleId,
    items,
    passThreshold: 0.7,
    maxRetries: 3,
  };

  lessons.push({
    id: testId,
    moduleId: reviewModuleId,
    courseId,
    languageId,
    title: `${reviewTitle} · Mastery`,
    description: "Cumulative test across the review modules. Wrong answers re-queue.",
    estimatedMinutes: 5,
    xpReward: 20,
    kind: "module_review",
    steps: [
      info(
        `${testId}-info-open`,
        `${reviewTitle} mastery`,
        "Pass this and the review cycle for these modules levels up. After enough cycles, this review earns its own ★.",
        "default",
      ),
      rowTest,
      info(
        `${testId}-info-end`,
        "Review cleared",
        "Memory stays sharp through cycles like this. Each completion advances the SRS interval — next time you'll see this review further out.",
        "win",
      ),
    ],
  });

  return lessons;
}
