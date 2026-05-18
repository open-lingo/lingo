import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { applySpeechQueryParams, setSpeechFlag } from "@/shared/speech";
import { applyDensityQueryParams } from "./data/lessonDensity";
import { getMockLessonContent } from "./data/mockLessons";
import {
  clearLessonInProgress,
  loadLessonInProgress,
  saveLessonInProgress,
} from "./data/lessonProgress";
import type { LessonContent, LessonStep } from "./types";
import { StepRenderer } from "./components/StepRenderer";
import { LessonProgressBar } from "./components/LessonProgressBar";
import { LessonComplete } from "./components/LessonComplete";
import { KanaMasteryProvider } from "@/features/japanese/kanaMastery";
import {
  getMockCompletedLessonIds,
  isLessonCompleted,
  markLessonCompleted,
} from "@/shared/domain/mockProgress";
import { useToast } from "@/shared/contexts/ToastContext";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import {
  getModuleMastery,
  isRowTestPassed,
} from "@/features/learn/moduleMastery";
import {
  markReviewCompleted,
  sourceModuleIdOf,
} from "./data/moduleReviewSchedule";
import type { LessonCompleteMastery } from "./components/LessonComplete";

/** Replays of an already-completed lesson award a fraction of the original
 *  XP — the activity is review, not a new milestone. Tweak in one place. */
const REVIEW_XP_MULTIPLIER = 0.25;

/** Step types eligible for the end-of-lesson replay tail. Info / teach /
 *  symbol_intro / phrase_card / grammar_rule are exposure chrome, not
 *  graded. Speaking is stubbed (never fails). Trace / production have
 *  their own minCorrectAttempts gate. row_test owns its own pass/fail
 *  logic and never lands in a regular lesson. Everything else is a
 *  pick-an-answer step that benefits from retry.
 */
const RETRY_ELIGIBLE_TYPES = new Set<LessonStep["type"]>([
  "multiple_choice",
  "build_sentence",
  "match_pairs",
  "fill_blank",
  "translate",
  "listening_comprehension",
  "listening_build",
  "particle_cloze",
  "word_image_mcq",
  "symbol_recognition",
  "symbol_to_sound",
]);

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const { language } = useLanguage();

  const lesson = useMemo(
    () => (lessonId ? getMockLessonContent(lessonId) : null),
    [lessonId],
  );

  // Hydrate partial-progress from localStorage on mount. We only resume
  // when a saved record exists AND the lesson hasn't already been
  // completed — replays start fresh from step 0. Curriculum drift /
  // stale-record / parse-failure handling lives in `loadLessonInProgress`.
  const hydrated = useMemo(() => {
    if (!lesson || !lessonId) return null;
    if (isLessonCompleted(lessonId)) return null;
    const stepIds = new Set(lesson.steps.map((s) => s.id));
    return loadLessonInProgress(lessonId, stepIds, lesson.steps.length);
    // We deliberately depend on lessonId only — the lesson object is
    // re-derived from the same id, and re-running this on every render
    // would cause auto-resume flapping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const [currentStepIdx, setCurrentStepIdx] = useState(
    () => hydrated?.stepIdx ?? 0,
  );
  const [results, setResults] = useState<Record<string, boolean>>(
    () => hydrated?.results ?? {},
  );
  const startedAtRef = useRef<string>(
    hydrated?.startedAt ?? new Date().toISOString(),
  );
  const [finished, setFinished] = useState(false);
  // Replay tail (2026-05-17 Spencer): after the linear pass ends, any
  // graded step that ended `correct === false` re-queues once. The
  // learner can't quit a lesson with mistakes still standing.
  const [replayQueue, setReplayQueue] = useState<string[]>([]);
  const [retryAttempted, setRetryAttempted] = useState<Set<string>>(
    () => new Set(),
  );
  const wasResumed = hydrated !== null;

  // `?speech=1` deep-links the speech-recognition feature flag on; the
  // same effect also consumes the matcher-tuning dials
  // (`?speech-perfect=`, `?speech-close=`, `?speech-strict=`,
  // `?speech-alts=`, `?speech-debug=`). Mirrors the same toggle on
  // LearnPage so users can land directly on a lesson URL and still pick
  // up the feature gate.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const v = searchParams.get("speech");
    let speechChanged = false;
    if (v === "1") {
      setSpeechFlag(true);
      speechChanged = true;
    } else if (v === "0") {
      setSpeechFlag(false);
      speechChanged = true;
    }
    const next = new URLSearchParams(searchParams);
    if (speechChanged) next.delete("speech");
    const dialsChanged = applySpeechQueryParams(next);
    // Sub-lesson density preset + per-key overrides. See
    // `lessonDensity.ts` for the full list of `?density-*` params.
    const densityChanged = applyDensityQueryParams(next);
    if (speechChanged || dialsChanged || densityChanged) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Capture review-mode once, on mount. If the lesson is already in the
  // user's completion store, this run is a replay — the LessonComplete
  // screen will show a "review" badge and award reduced XP.
  const [isReview] = useState(() =>
    lessonId ? isLessonCompleted(lessonId) : false,
  );

  // Persist partial progress on every step/result change so the user can
  // navigate away and resume. The completion-clear branch below drops the
  // record once `finished` flips true; completion itself is recorded via
  // `markLessonCompleted` in the next effect.
  useEffect(() => {
    if (!lesson || !lessonId) return;
    if (finished) return;
    saveLessonInProgress(lessonId, {
      stepIdx: currentStepIdx,
      results,
      startedAt: startedAtRef.current,
    });
  }, [lesson, lessonId, currentStepIdx, results, finished]);

  // Surface a one-shot toast when we auto-resumed from a saved record.
  // Guarded by a ref so React 19's strict-mode double-invoke + result
  // mutations don't re-fire it.
  const { showToast } = useToast();
  const resumeToastFiredRef = useRef(false);
  useEffect(() => {
    if (!wasResumed || resumeToastFiredRef.current || !lesson) return;
    resumeToastFiredRef.current = true;
    const total = lesson.steps.length;
    showToast(
      t("lesson.resumed", {
        defaultValue: "Resumed from step {{n}} of {{total}}",
        n: Math.min(currentStepIdx + 1, total),
        total,
      }),
      "info",
    );
    // Mount-only: depend on `wasResumed` so it fires once after hydration
    // settles. currentStepIdx/lesson are read at fire-time but not in deps
    // to avoid re-firing as the user progresses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasResumed]);

  // Persist completion when the user finishes the lesson. Calculation
  // mirrors the values LessonComplete shows so the XP we record matches
  // what the learner sees.
  //
  // Row-test wasSkipped detection: a lesson that contains a `row_test`
  // step records `wasSkipped: true` iff the test step's result is
  // `false`. TestRunner only emits `false` via the Skip flow — a passed
  // test always emits `true` once the queue clears. Lessons with no
  // row_test step record `wasSkipped: false`.
  useEffect(() => {
    if (!finished || !lesson) return;
    const correctCount = Object.values(results).filter(Boolean).length;
    const gradedSteps = Object.keys(results).length;
    const accuracy = gradedSteps > 0 ? correctCount / gradedSteps : 1;
    const baseXp = lesson.xpReward ?? 10;
    const xpEarned = isReview
      ? Math.max(1, Math.round(baseXp * REVIEW_XP_MULTIPLIER))
      : baseXp;
    const rowTestStep = lesson.steps.find((s) => s.type === "row_test");
    const wasSkipped = rowTestStep
      ? results[rowTestStep.id] === false
      : false;
    markLessonCompleted(lesson.id, {
      accuracy,
      xpEarned,
      isReview,
      wasSkipped,
    });
    // M3 restructure 2026-05-16: when a review module's mastery test passes
    // (id pattern `ja-{moduleId}-review-test`), bump the SRS stage on the
    // source module so the next review surfaces later. Only fire on a
    // clean (non-skipped) pass + first-completion (not on review replays).
    if (
      !wasSkipped &&
      !isReview &&
      rowTestStep &&
      lesson.id.endsWith("-review-test")
    ) {
      const reviewModuleId = lesson.moduleId; // e.g. "m3-review"
      const sourceModuleId = sourceModuleIdOf(reviewModuleId);
      if (sourceModuleId) {
        markReviewCompleted(sourceModuleId);
      }
    }
    clearLessonInProgress(lesson.id);
  }, [finished, lesson, results, isReview]);

  const totalSteps = lesson?.steps.length ?? 0;
  const inReplay = replayQueue.length > 0;
  const currentStep: LessonStep | undefined = inReplay
    ? lesson?.steps.find((s) => s.id === replayQueue[0])
    : lesson?.steps[currentStepIdx];

  const handleStepComplete = useCallback(
    (stepId: string, correct: boolean) => {
      // Last-write-wins. A retry that passes upgrades the verdict to
      // correct; a retry that fails too stays incorrect. Accuracy at
      // lesson end reflects final state.
      setResults((prev) => ({ ...prev, [stepId]: correct }));
    },
    [],
  );

  const handleContinue = useCallback(() => {
    // Replay-mode advance: shift the queue; finish when empty.
    if (inReplay) {
      const remaining = replayQueue.slice(1);
      setReplayQueue(remaining);
      if (remaining.length === 0) setFinished(true);
      return;
    }
    // Normal linear advance.
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((i) => i + 1);
      return;
    }
    // End of linear pass — build the replay queue from graded steps the
    // learner answered wrong on first attempt. Each step retries at most
    // once; the retry verdict (pass or fail) is final.
    if (!lesson) {
      setFinished(true);
      return;
    }
    const wrongIds: string[] = [];
    for (const s of lesson.steps) {
      if (
        RETRY_ELIGIBLE_TYPES.has(s.type) &&
        results[s.id] === false &&
        !retryAttempted.has(s.id)
      ) {
        wrongIds.push(s.id);
      }
    }
    if (wrongIds.length === 0) {
      setFinished(true);
    } else {
      setReplayQueue(wrongIds);
      setRetryAttempted((prev) => {
        const next = new Set(prev);
        for (const id of wrongIds) next.add(id);
        return next;
      });
    }
  }, [
    inReplay,
    replayQueue,
    currentStepIdx,
    totalSteps,
    lesson,
    results,
    retryAttempted,
  ]);

  const handleExit = useCallback(() => {
    navigate(langPath("learn"));
  }, [navigate, langPath]);

  if (!lesson) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-text-secondary">
          {t("lesson.notFound", "Lesson not found")}
        </p>
        <button
          type="button"
          onClick={handleExit}
          className="rounded-xl border-[1.5px] border-accent-hover bg-accent px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition hover:bg-accent-hover"
        >
          {t("lesson.backToLearn", "Back to Learn")}
        </button>
      </div>
    );
  }

  if (finished) {
    const correctCount = Object.values(results).filter(Boolean).length;
    const gradedSteps = Object.keys(results).length;
    const mastery = computeMasteryForCompletion(lesson, results, language?.id);
    return (
      <LessonComplete
        lesson={lesson}
        correctCount={correctCount}
        totalGraded={gradedSteps}
        onContinue={handleExit}
        isReview={isReview}
        xpMultiplier={isReview ? REVIEW_XP_MULTIPLIER : 1}
        mastery={mastery}
      />
    );
  }

  return (
    <KanaMasteryProvider>
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col">
      <div className="flex items-center gap-4 py-5">
        <button
          type="button"
          onClick={handleExit}
          className="-ml-1 rounded-xl p-2.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          aria-label={t("lesson.exit", "Exit lesson")}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <LessonProgressBar
          current={inReplay ? totalSteps : currentStepIdx}
          total={totalSteps}
        />
        <LessonMetaChips
          estimatedMinutes={lesson.estimatedMinutes}
          xpReward={lesson.xpReward}
        />
      </div>

      {inReplay && (
        <div className="mb-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-warning">
          Review · {replayQueue.length} left
        </div>
      )}

      <div className="flex flex-1 flex-col py-4">
        {currentStep && (
          <StepRenderer
            // Force remount on retry so the step view starts from a clean
            // state (no carry-over selection / submit flag from first attempt).
            key={inReplay ? `${currentStep.id}-retry-${replayQueue.length}` : currentStep.id}
            step={currentStep}
            onComplete={handleStepComplete}
            onContinue={handleContinue}
          />
        )}
      </div>
    </div>
    </KanaMasteryProvider>
  );
}

/**
 * Build the post-completion mastery callout payload for `LessonComplete`.
 *
 * Returns `undefined` when the lesson isn't a row-test lesson OR the
 * learner skipped — i.e. only show the callout on a clean row-test
 * completion. By the time the finished branch renders, the completion
 * record has already been written (the persistence effect runs before
 * the render that flips `finished` reads back), so we can read the
 * stored `wasSkipped` flag through `getModuleMastery`.
 */
function computeMasteryForCompletion(
  lesson: LessonContent,
  results: Record<string, boolean>,
  languageId: string | undefined,
): LessonCompleteMastery | undefined {
  if (!languageId) return undefined;
  const rowTestStep = lesson.steps.find((s) => s.type === "row_test");
  if (!rowTestStep) return undefined;
  const wasSkipped = results[rowTestStep.id] === false;
  if (wasSkipped) return undefined;
  const course = getMockCourse(languageId);
  const mod = course.modules.find((m) =>
    m.lessons.some((l) => l.id === lesson.id),
  );
  if (!mod) return undefined;
  // The persistence effect may not have written the new record yet by
  // the time this renders. Inject the just-finished lesson explicitly
  // and override `isRowTestPassed` for the current lesson id so the
  // mastery calc reflects the in-flight pass.
  const completed = new Set(getMockCompletedLessonIds());
  const completedAfter = new Set(completed);
  completedAfter.add(lesson.id);
  const isPassedAfter = (id: string): boolean =>
    id === lesson.id ? !wasSkipped : isRowTestPassed(id);
  const before = getModuleMastery(mod, completed);
  const after = getModuleMastery(mod, completedAfter, isPassedAfter);
  return {
    moduleTitle: mod.eyebrow ?? mod.title,
    passed: after.passed,
    total: after.total,
    justMastered: after.mastered && !before.mastered,
  };
}

function LessonMetaChips({
  estimatedMinutes,
  xpReward,
}: {
  estimatedMinutes?: number;
  xpReward?: number;
}) {
  const { t } = useTranslation();
  const hasMinutes =
    typeof estimatedMinutes === "number" && estimatedMinutes > 0;
  const hasXp = typeof xpReward === "number" && xpReward > 0;
  if (!hasMinutes && !hasXp) return null;
  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      {hasMinutes && (
        <span
          className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-border bg-surface-muted px-2.5 py-0.5 text-xs font-bold tabular-nums text-text-secondary"
          aria-label={t("lesson.estimatedMinutesLabel", {
            defaultValue: "Estimated {{n}} minute lesson",
            n: estimatedMinutes,
          })}
        >
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
          >
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7v5l3 2" />
          </svg>
          {t("lesson.minutesShort", {
            defaultValue: "{{n}} min",
            n: estimatedMinutes,
          })}
        </span>
      )}
      {hasXp && (
        <span
          className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-accent-hover bg-accent/15 px-2.5 py-0.5 text-xs font-bold tabular-nums text-accent"
          aria-label={t("lesson.xpRewardLabel", {
            defaultValue: "{{n}} XP reward on completion",
            n: xpReward,
          })}
        >
          {t("lesson.xpShort", {
            defaultValue: "+{{n}} XP",
            n: xpReward,
          })}
        </span>
      )}
    </div>
  );
}
