import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getMockLessonContent } from "./data/mockLessons";
import type { LessonStep } from "./types";
import { StepRenderer } from "./components/StepRenderer";
import { LessonProgressBar } from "./components/LessonProgressBar";
import { LessonComplete } from "./components/LessonComplete";
import { KanaMasteryProvider } from "@/features/japanese/kanaMastery";
import {
  isLessonCompleted,
  markLessonCompleted,
} from "@/shared/domain/mockProgress";

/** Replays of an already-completed lesson award a fraction of the original
 *  XP — the activity is review, not a new milestone. Tweak in one place. */
const REVIEW_XP_MULTIPLIER = 0.25;

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();

  const lesson = useMemo(
    () => (lessonId ? getMockLessonContent(lessonId) : null),
    [lessonId],
  );

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  // Capture review-mode once, on mount. If the lesson is already in the
  // user's completion store, this run is a replay — the LessonComplete
  // screen will show a "review" badge and award reduced XP.
  const [isReview] = useState(() =>
    lessonId ? isLessonCompleted(lessonId) : false,
  );

  // Persist completion when the user finishes the lesson. Calculation
  // mirrors the values LessonComplete shows so the XP we record matches
  // what the learner sees.
  useEffect(() => {
    if (!finished || !lesson) return;
    const correctCount = Object.values(results).filter(Boolean).length;
    const gradedSteps = Object.keys(results).length;
    const accuracy = gradedSteps > 0 ? correctCount / gradedSteps : 1;
    const baseXp = lesson.xpReward ?? 10;
    const xpEarned = isReview
      ? Math.max(1, Math.round(baseXp * REVIEW_XP_MULTIPLIER))
      : baseXp;
    markLessonCompleted(lesson.id, {
      accuracy,
      xpEarned,
      isReview,
    });
  }, [finished, lesson, results, isReview]);

  const totalSteps = lesson?.steps.length ?? 0;
  const currentStep: LessonStep | undefined = lesson?.steps[currentStepIdx];

  const handleStepComplete = useCallback(
    (stepId: string, correct: boolean) => {
      setResults((prev) => ({ ...prev, [stepId]: correct }));
    },
    [],
  );

  const handleContinue = useCallback(() => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((i) => i + 1);
    } else {
      setFinished(true);
    }
  }, [currentStepIdx, totalSteps]);

  const handleExit = useCallback(() => {
    navigate(langPath("learn"));
  }, [navigate, langPath]);

  if (!lesson) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t("lesson.notFound", "Lesson not found")}
        </p>
        <button
          type="button"
          onClick={handleExit}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {t("lesson.backToLearn", "Back to Learn")}
        </button>
      </div>
    );
  }

  if (finished) {
    const correctCount = Object.values(results).filter(Boolean).length;
    const gradedSteps = Object.keys(results).length;
    return (
      <LessonComplete
        lesson={lesson}
        correctCount={correctCount}
        totalGraded={gradedSteps}
        onContinue={handleExit}
        isReview={isReview}
        xpMultiplier={isReview ? REVIEW_XP_MULTIPLIER : 1}
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
          className="-ml-1 rounded-lg p-2.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label={t("lesson.exit", "Exit lesson")}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <LessonProgressBar current={currentStepIdx} total={totalSteps} />
      </div>

      <div className="flex flex-1 flex-col py-4">
        {currentStep && (
          <StepRenderer
            key={currentStep.id}
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
