/**
 * Grammar review session state machine (Track B, practice-page surface).
 *
 * Consumes `buildGrammarReviewQueue()` once per mount, resolves one rotating
 * example step per due grammar point via the authored/harvested pools, and
 * grades into Track B (`reviewGrammarPoint`) — exactly one FSRS write per
 * scored item. Steps render through the existing `StepRenderer`; grammar never
 * renders as a flip card (Spencer 2026-07-02).
 *
 * Session semantics (spec `docs/grammar-deck-v1-spec-2026-07-02.md` §Task 3):
 *  - queue is capped at SESSION_CAP; surplus surfaces as "remaining due".
 *  - each point's pool is module-filtered (comprehensibility gate against the
 *    learner's reached modules) BEFORE rotation; empty filtered pool → skip.
 *  - new points attach their tagged `grammar_rule` card as a PEEKABLE HINT on
 *    the scored step. It used to render as a passive preface step first
 *    (teach-before-test), which Spencer cut 2026-08-18: *"grammar review should
 *    not show the card again, they can just have access to the hint button."*
 *    Review is testing; re-teaching before every first review both padded the
 *    session and gave away the answer. The card is still one tap away.
 *  - main pass grades on the single scored attempt: wrong → again, correct → good.
 *  - wrong items replay once at session end; a correct replay grades "hard"
 *    (same modality as the main-pass grade), matching LessonPage's
 *    again→hard replay-parity precedent. A wrong replay writes nothing further
 *    (the "again" from the main pass stands). Each item is graded at most once
 *    per pass (main, replay).
 *  - `{practice: true}` = the caught-up "practice anyway" session: the queue
 *    widens to not-yet-due points (`includeNotDue`) and NOTHING is written to
 *    Track B — same no-SRS semantics as the trainer's learn-ahead sessions
 *    (grading a session the schedule didn't ask for corrupts FSRS).
 */
import { useMemo, useRef, useState } from "react";
import type { GrammarRuleStep, LessonStep } from "@/features/lesson/types";
import { hintFromRule } from "@/features/lesson/data/deriveGrammarMicroSteps";
import type { SRSCardState, SRSModality } from "@/features/flashcards/data/types";
import {
  buildGrammarReviewQueue,
  reviewGrammarPoint,
  getReachedModules,
} from "@/features/flashcards/engine/grammarSrs";
import {
  getGrammarPool,
  getGrammarRuleStepForPoint,
} from "@/features/lesson/data/grammarReviewPools";

/** Max scored items surfaced in a single session; surplus shows as remaining-due. */
export const SESSION_CAP = 30;

export type GrammarSessionSummary = {
  reviewed: number;
  correct: number;
  remainingDue: number;
  /**
   * Unseen new points still waiting behind this session's new-card intake
   * throttle. Surfaced so finish-5-get-5-more never reads as random
   * (2026-07-06 audit: the engine computed this but the summary hid it).
   */
  newWaiting: number;
  /** True for a no-SRS practice session — nothing was scheduled. */
  practiceOnly: boolean;
};

export type GrammarSessionState = {
  /** "active" while there are steps to render; "summary" when finished. */
  phase: "active" | "summary";
  /** The step to render now (rule preface or scored step), or null at summary. */
  currentStep: LessonStep | null;
  /** True during the ungraded replay pass — forwarded to StepRenderer. */
  isReplayRun: boolean;
  /** Items left in the replay pass INCLUDING the current one (0 outside it). */
  replayRemaining: number;
  /** Position over the scored items of the main pass (1-based). */
  progress: { current: number; total: number };
  /** Populated once `phase === "summary"`. */
  summary: GrammarSessionSummary | null;
  /** Debug: items skipped because their module-filtered pool was empty. */
  skippedNullCount: number;
  /** Debug: pool steps dropped by the reached-module filter across all items. */
  excludedByModuleCount: number;
  /**
   * Highest module the learner has reached (`{"m3","m4"}` → 4; 0 when
   * unknown). Already computed here for the comprehensibility filter, and
   * surfaced so the page can feed `LessonStepEnvironment` — a review session
   * mixes items from many modules, and the script ladder has to follow the
   * LEARNER's position, not each item's origin. Otherwise reviewing an m4
   * sentence at m20 would hand romaji back.
   */
  maxReachedModule: number;
  onStepComplete: (stepId: string, correct: boolean, progressTicks?: number) => void;
  onContinue: () => void;
};

type SessionItem = {
  pointId: string;
  scoredStep: LessonStep;
  modality: SRSModality;
};

type BuiltSession = {
  items: SessionItem[];
  skippedNullCount: number;
  excludedByModuleCount: number;
  remainingDue: number;
  newWaiting: number;
  maxReached: number;
};

/** Max reached module number, e.g. {"m3","m4"} → 4; empty/unreachable → 0. */
function maxReachedModule(reached: ReadonlySet<string>): number {
  let max = 0;
  for (const m of reached) {
    const x = /^m(\d+)$/.exec(m);
    if (x) max = Math.max(max, Number(x[1]));
  }
  return max;
}

/**
 * Comprehensibility filter for a harvested pool step. Authored (`ja-gpool-`)
 * and synthesized (`ja-grev-`) steps are gated at the point's module when
 * authored, so they always pass. A harvested curriculum step carries its
 * source lesson id (`ja-mN-…`); keep it only if module N ≤ the learner's max
 * reached module. Steps whose id doesn't parse to a module are excluded.
 */
function keepStep(step: LessonStep, maxReached: number): boolean {
  if (/^ja-gpool-/.test(step.id) || /^ja-grev-/.test(step.id)) return true;
  const m = /^ja-m(\d+)/.exec(step.id);
  if (!m) return false;
  return Number(m[1]) <= maxReached;
}

/** Deterministic rotation over the already-filtered pool (mirrors pickPoolStep). */
function pickFiltered(
  pool: LessonStep[],
  state: SRSCardState | null,
): LessonStep | null {
  if (pool.length === 0) return null;
  if (state === null) return pool[0];
  const reps = state.recognition.reps + state.production.reps;
  return pool[reps % pool.length];
}

function buildSession(practice: boolean): BuiltSession {
  // Pool-aware: points with no renderable review steps (POOL_GAP_EXEMPTIONS)
  // never occupy a due/new-card slot in the first place. The module-filtered
  // empty-pool skip below (`keepStep`) stays as a safety net for points whose
  // full pool is non-empty but every step is beyond the learner's reached
  // modules.
  const queue = buildGrammarReviewQueue(undefined, undefined, {
    hasPool: (id) => getGrammarPool(id).length > 0,
    includeNotDue: practice,
  });
  const maxReached = maxReachedModule(getReachedModules());

  const items: SessionItem[] = [];
  let skippedNullCount = 0;
  let excludedByModuleCount = 0;

  for (const qi of queue.queue.slice(0, SESSION_CAP)) {
    const fullPool = getGrammarPool(qi.point.id);
    const filtered = fullPool.filter((s) => keepStep(s, maxReached));
    excludedByModuleCount += fullPool.length - filtered.length;

    const scoredStep = pickFiltered(filtered, qi.state);
    if (!scoredStep) {
      skippedNullCount += 1;
      continue;
    }

    // The teaching card rides along as a hint rather than as a step. Attached
    // for NEW points only — a point the learner has already reviewed does not
    // need the rule offered up front.
    const ruleCard = qi.isNew ? getGrammarRuleStepForPoint(qi.point.id) : null;
    const withHint: LessonStep = ruleCard
      ? { ...scoredStep, ruleHint: hintFromRule(ruleCard as GrammarRuleStep) }
      : scoredStep;
    const modality: SRSModality =
      scoredStep.modality === "recognition" ? "recognition" : "production";

    items.push({ pointId: qi.point.id, scoredStep: withHint, modality });
  }

  // Surplus beyond the cap + items we couldn't render both remain due.
  const surplus = Math.max(0, queue.queue.length - SESSION_CAP);
  const remainingDue = surplus + skippedNullCount;
  // Unseen points held back by the new-card intake throttle.
  const newWaiting = Math.max(0, queue.unseenTotal - queue.newCount);

  return { items, skippedNullCount, excludedByModuleCount, remainingDue, newWaiting, maxReached };
}

type Mode = "main" | "replay" | "summary";

export function useGrammarReviewSession(opts?: {
  practice?: boolean;
}): GrammarSessionState {
  const practice = opts?.practice ?? false;
  const session = useMemo(() => buildSession(practice), [practice]);
  const { items } = session;

  const [mode, setMode] = useState<Mode>(items.length === 0 ? "summary" : "main");
  const [mainIdx, setMainIdx] = useState(0);
  const [replayQueue, setReplayQueue] = useState<number[]>([]);
  const [replayIdx, setReplayIdx] = useState(0);

  // Main-pass result per item index (mainIdx). Each step view fires
  // onComplete exactly once per mount, so this is the item's single attempt.
  const attemptsRef = useRef<Map<number, boolean>>(new Map());
  // Replay-pass result per item index (keyed the same as attemptsRef).
  const replayAttemptsRef = useRef<Map<number, boolean>>(new Map());
  const gradedRef = useRef<Set<number>>(new Set());
  const replayGradedRef = useRef<Set<number>>(new Set());
  const wrongRef = useRef<number[]>([]);
  const reviewedRef = useRef(0);
  const correctRef = useRef(0);

  const onStepComplete = (_stepId: string, correct: boolean) => {
    // Rule prefaces are passive and never graded.
    if (mode === "main") {
      attemptsRef.current.set(mainIdx, correct);
    } else if (mode === "replay") {
      replayAttemptsRef.current.set(replayQueue[replayIdx], correct);
    }
  };

  const advanceMain = (nextIdx: number) => {
    if (nextIdx < items.length) {
      setMainIdx(nextIdx);
      return;
    }
    // End of the main pass → build the single replay pass from wrong items.
    if (wrongRef.current.length > 0) {
      setReplayQueue([...wrongRef.current]);
      setReplayIdx(0);
      setMode("replay");
    } else {
      setMode("summary");
    }
  };

  const onContinue = () => {
    if (mode === "main") {
      // Grade exactly once per scored item (guard double-fire re-entry).
      if (!gradedRef.current.has(mainIdx)) {
        gradedRef.current.add(mainIdx);
        const item = items[mainIdx];
        const correct = attemptsRef.current.get(mainIdx) ?? false;
        // Practice sessions never write Track B (learn-ahead parity).
        if (!practice) {
          reviewGrammarPoint(item.pointId, item.modality, correct ? "good" : "again");
        }
        reviewedRef.current += 1;
        if (correct) correctRef.current += 1;
        else wrongRef.current.push(mainIdx);
      }
      advanceMain(mainIdx + 1);
      return;
    }

    if (mode === "replay") {
      const itemIdx = replayQueue[replayIdx];
      // Grade the replay pass at most once per item. A correct replay of a
      // missed item writes "hard" (lesson-replay parity); a wrong replay
      // writes nothing further — the main pass's "again" stands, and the
      // summary's "correct" count is not retroactively adjusted.
      if (!replayGradedRef.current.has(itemIdx)) {
        replayGradedRef.current.add(itemIdx);
        const replayCorrect = replayAttemptsRef.current.get(itemIdx) ?? false;
        if (replayCorrect && !practice) {
          const item = items[itemIdx];
          reviewGrammarPoint(item.pointId, item.modality, "hard");
        }
      }
      const next = replayIdx + 1;
      if (next < replayQueue.length) setReplayIdx(next);
      else setMode("summary");
    }
  };

  let currentStep: LessonStep | null = null;
  if (mode === "main") {
    currentStep = items[mainIdx]?.scoredStep ?? null;
  } else if (mode === "replay") {
    currentStep = items[replayQueue[replayIdx]]?.scoredStep ?? null;
  }

  const summary: GrammarSessionSummary | null =
    mode === "summary"
      ? {
          reviewed: reviewedRef.current,
          correct: correctRef.current,
          remainingDue: session.remainingDue,
          newWaiting: session.newWaiting,
          practiceOnly: practice,
        }
      : null;

  return {
    phase: mode === "summary" ? "summary" : "active",
    currentStep,
    isReplayRun: mode === "replay",
    replayRemaining: mode === "replay" ? replayQueue.length - replayIdx : 0,
    progress: {
      current: mode === "main" ? Math.min(mainIdx + 1, items.length) : items.length,
      total: items.length,
    },
    summary,
    skippedNullCount: session.skippedNullCount,
    excludedByModuleCount: session.excludedByModuleCount,
    maxReachedModule: session.maxReached,
    onStepComplete,
    onContinue,
  };
}
