import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getAlphabetById } from "@/shared/domain/languageConfig";
import type { LessonStep } from "@/features/lesson/types";
import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { LessonProgressBar } from "@/features/lesson/components/LessonProgressBar";
import { LessonComplete } from "@/features/lesson/components/LessonComplete";
import {
  getOrCreateProgress,
  updateLetterProgress,
  markSectionTestPassed,
  markFullTestPassed,
  MIN_CORRECT_TRACES,
} from "./alphabetProgress";
import {
  buildAlphabetLearnSteps,
  buildAlphabetTestSteps,
  getAlphabetSessionTitle,
} from "./alphabetSession";

const TEST_PASS_THRESHOLD = 0.8;

function parseAlphabetStepId(stepId: string): { prefix: string; symbol: string } | null {
  const parts = stepId.split("-");
  if (parts.length < 3) return null;
  const symbol = parts[parts.length - 2];
  const prefix = parts.slice(0, -2).join("-");
  return { prefix, symbol };
}

export function AlphabetLessonPage() {
  const { alphabetId } = useParams<{ alphabetId: string }>();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") ?? "learn") as "learn" | "test";
  const sectionId = searchParams.get("section") ?? undefined;
  const { language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();

  const alphabet = useMemo(() => {
    if (!language || !alphabetId) return null;
    return getAlphabetById(language.id, alphabetId) ?? null;
  }, [language, alphabetId]);

  const progress = useMemo(() => {
    if (!language || !alphabetId) return null;
    return getOrCreateProgress(language.id, alphabetId);
  }, [language, alphabetId]);

  const steps = useMemo(() => {
    if (!alphabet || !progress || !language) return [];
    if (mode === "test") {
      return buildAlphabetTestSteps(language.id, alphabet, { sectionId });
    }
    return buildAlphabetLearnSteps(language.id, alphabet, progress, {
      sectionId,
      maxNewPerSession: 5,
      includeSymbolToSound: false,
    });
  }, [alphabet, progress, language, mode, sectionId]);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  const totalSteps = steps.length;
  const currentStep: LessonStep | undefined = steps[currentStepIdx];

  const handleStepComplete = useCallback(
    (stepId: string, correct: boolean) => {
      setResults((prev) => ({ ...prev, [stepId]: correct }));
      if (!progress || mode === "test") return;
      const parsed = parseAlphabetStepId(stepId);
      if (!parsed) return;
      const { prefix, symbol } = parsed;
      if (prefix === "intro" && correct) {
        updateLetterProgress(progress, symbol, { introduced: true });
      } else if (prefix === "trace" && correct) {
        updateLetterProgress(progress, symbol, {
          traceCount: MIN_CORRECT_TRACES,
        });
      } else if (prefix === "recog" && correct) {
        updateLetterProgress(progress, symbol, { recognitionPassed: true });
      } else if (prefix === "prod" && correct) {
        updateLetterProgress(progress, symbol, { productionPassed: true });
      } else if (prefix === "sound" && correct) {
        updateLetterProgress(progress, symbol, { symbolToSoundPassed: true });
      }
    },
    [progress, mode]
  );

  const handleContinue = useCallback(() => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((i) => i + 1);
    } else {
      setFinished(true);
    }
  }, [currentStepIdx, totalSteps]);

  useEffect(() => {
    if (!finished || mode !== "test" || !progress) return;
    const correctCount = Object.values(results).filter(Boolean).length;
    const totalGraded = Object.keys(results).length;
    const pct = totalGraded > 0 ? correctCount / totalGraded : 0;
    if (pct >= TEST_PASS_THRESHOLD) {
      if (sectionId) markSectionTestPassed(progress, sectionId);
      else markFullTestPassed(progress);
    }
  }, [finished, mode, progress, sectionId, results]);

  const handleExit = useCallback(() => {
    const base = langPath(`practice/alphabet/${alphabetId ?? ""}`);
    navigate(base);
  }, [navigate, langPath, alphabetId]);

  const virtualLesson = useMemo(
    () =>
      alphabet
        ? {
            id: `alphabet-${alphabet.id}-${mode}`,
            moduleId: "",
            courseId: "",
            languageId: language?.id ?? "",
            title: getAlphabetSessionTitle(
              alphabet,
              mode,
              sectionId
                ? alphabet.sections?.find((s) => s.id === sectionId)
                : null
            ),
            steps,
            xpReward: 10,
          }
        : null,
    [alphabet, mode, sectionId, steps, language?.id]
  );

  if (!alphabet || !language) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t("alphabet.notFound", "Alphabet not found")}
        </p>
        <button
          type="button"
          onClick={() => navigate(langPath("practice"))}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {t("lesson.backToLearn", "Back")}
        </button>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {mode === "learn"
            ? t("alphabet.noLettersToLearn", "No new letters to learn in this section. Try another section or test out.")
            : t("alphabet.noLettersToTest", "No letters to test.")}
        </p>
        <button
          type="button"
          onClick={handleExit}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {t("lesson.continue", "Continue")}
        </button>
      </div>
    );
  }

  if (finished && virtualLesson) {
    const correctCount = Object.values(results).filter(Boolean).length;
    const gradedSteps = Object.keys(results).length;
    return (
      <LessonComplete
        lesson={virtualLesson}
        correctCount={correctCount}
        totalGraded={gradedSteps}
        onContinue={handleExit}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col">
      <div className="flex items-center gap-3 py-4">
        <button
          type="button"
          onClick={handleExit}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label={t("lesson.exit", "Exit")}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
  );
}
