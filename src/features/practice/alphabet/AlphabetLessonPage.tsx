import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  getLetterProgress,
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
import {
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
} from "./alphabetSessionStorage";

import type { InfoStep } from "@/features/lesson/types";
import { logAlphabetEvent } from "./alphabetAnalytics";
import { recordAttempt, recordStepEvent } from "@/features/lesson/engine";
import { useLessonSyncSession } from "@/features/lesson/useLessonSyncSession";

const TEST_PASS_THRESHOLD = 0.8;

function buildSectionInfoStep(
  mode: "learn" | "test",
  sectionId: string | undefined,
  t: ReturnType<typeof useTranslation>["t"],
): InfoStep | null {
  if (mode !== "learn") return null;
  const id = sectionId ?? null;
  if (!id) {
    return {
      id: "alphabet-section-intro-overview",
      type: "info",
      title: t(
        "alphabet.overviewTitle",
        "How this alphabet lesson works",
      ),
      body: t(
        "alphabet.overviewBody",
        "You’ll learn small groups of consonants and vowels. For each symbol you will hear the sound, trace it, recognize it from audio, and finally write it from memory. If a symbol is tricky, you’ll see the template again and retry it at the end of the lesson.",
      ),
      variant: "default",
    };
  }
  switch (id) {
    case "hiragana-yoon-ry":
    case "katakana-yoon-ry":
      return {
        id: "alphabet-section-intro-yoon-ry",
        type: "info",
        title: t(
          "alphabet.yoonCombosTitle",
          "Small ゃ/ゅ/ょ combinations (拗音)",
        ),
        body: t(
          "alphabet.yoonCombosBody",
          "These combinations use a normal consonant kana followed by a smaller ゃ/ゅ/ょ (or ャ/ュ/ョ) to make sounds like rya, ryu, ryo. You’ll practice writing them as a single unit and listening for the difference between り + や (riya) and りゃ (rya).",
        ),
        variant: "default",
      };
    case "consonants-plain":
      return {
        id: "alphabet-section-intro-consonants-plain",
        type: "info",
        title: t(
          "alphabet.plainConsonantsTitle",
          "Plain consonants (기본 자음)",
        ),
        body: t(
          "alphabet.plainConsonantsBody",
          "These are the basic building‑block consonants of Hangul (like g/k, n, d/t, m, b, s, ng, j, h). You’ll focus on how each shape is written and how it sounds at the beginning of a syllable.",
        ),
        variant: "default",
      };
    case "consonants-aspirated":
      return {
        id: "alphabet-section-intro-consonants-aspirated",
        type: "info",
        title: t(
          "alphabet.aspiratedConsonantsTitle",
          "Aspirated consonants (거센소리)",
        ),
        body: t(
          "alphabet.aspiratedConsonantsBody",
          "These consonants, like ㅋ, ㅌ, ㅍ, and ㅊ, are pronounced with a stronger burst of air. You’ll practice hearing the difference between plain vs. aspirated pairs (ㄱ/ㅋ, ㄷ/ㅌ, ㅂ/ㅍ, ㅈ/ㅊ) and writing each shape cleanly.",
        ),
        variant: "default",
      };
    case "consonants-tense":
      return {
        id: "alphabet-section-intro-consonants-tense",
        type: "info",
        title: t(
          "alphabet.tenseConsonantsTitle",
          "Tense consonants (쌍자음)",
        ),
        body: t(
          "alphabet.tenseConsonantsBody",
          "These ‘double’ consonants (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) are tighter and tenser than the plain ones. You’ll train your ear to hear the extra tension and your handwriting to keep their shapes distinct from their plain counterparts.",
        ),
        variant: "default",
      };
    case "vowels-basic":
      return {
        id: "alphabet-section-intro-vowels-basic",
        type: "info",
        title: t("alphabet.basicVowelsTitle", "Basic vowels (기본 모음)"),
        body: t(
          "alphabet.basicVowelsBody",
          "These are the core vowel sounds of Korean (ㅏ, ㅓ, ㅗ, ㅜ, ㅡ, ㅣ). You’ll learn how each is written (vertical vs. horizontal strokes) and how they combine with consonants to form simple syllables like 가, 더, 미.",
        ),
        variant: "default",
      };
    case "vowels-y":
      return {
        id: "alphabet-section-intro-vowels-y",
        type: "info",
        title: t("alphabet.yVowelsTitle", "Y‑vowels (y 모음)"),
        body: t(
          "alphabet.yVowelsBody",
          "These vowels add a ‘y’ sound in front of the basic vowels (ㅑ, ㅕ, ㅛ, ㅠ). You’ll see how they are built from the basic vowels you already know and practice hearing the subtle differences (ㅏ vs. ㅑ, ㅓ vs. ㅕ, etc.).",
        ),
        variant: "default",
      };
    case "vowels-compound":
      return {
        id: "alphabet-section-intro-vowels-compound",
        type: "info",
        title: t(
          "alphabet.compoundVowelsTitle",
          "Compound vowels (복합 모음)",
        ),
        body: t(
          "alphabet.compoundVowelsBody",
          "These vowels combine two sounds, like ㅘ (wa), ㅙ (wae), or ㅚ (oe). You’ll practice distinguishing similar‑sounding pairs (ㅐ/ㅔ, ㅙ/ㅚ, etc.) and keeping each complex shape consistent when you write it.",
        ),
        variant: "default",
      };
    default:
      return null;
  }
}

function parseAlphabetStepId(
  stepId: string,
): { prefix: string; symbol: string } | null {
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
  const noSymbolToSound =
    searchParams.get("alphabetNoSymbolToSound") === "1";
  const skipReview = searchParams.get("alphabetSkipReview") === "1";
  const { language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  // Background sync + force-flush on exit (mirrors useSRSyncSession).
  useLessonSyncSession();

  const alphabet = useMemo(() => {
    if (!language || !alphabetId) return null;
    return getAlphabetById(language.id, alphabetId) ?? null;
  }, [language, alphabetId]);

  const progress = useMemo(() => {
    if (!language || !alphabetId) return null;
    return getOrCreateProgress(language.id, alphabetId);
  }, [language, alphabetId]);

  const [reviewSymbols, setReviewSymbols] = useState<string[] | null>(null);
  const [inReviewRound, setInReviewRound] = useState(false);
  // First-load resume snapshot. When set, the lesson uses these exact steps
  // instead of rebuilding. Cleared once the user transitions to a review
  // round (we then rebuild from the review-mode path).
  const [restoredSteps, setRestoredSteps] = useState<LessonStep[] | null>(null);
  // One-shot guard: try to restore from localStorage exactly once after the
  // language + alphabet are resolved. Avoids loops + double-restoration.
  const restoreAttemptedRef = useRef(false);

  useEffect(() => {
    if (restoreAttemptedRef.current) return;
    if (!language || !alphabetId) return;
    restoreAttemptedRef.current = true;
    const stored = loadStoredSession(
      language.id,
      alphabetId,
      sectionId ?? null,
      mode,
    );
    if (!stored) return;
    setRestoredSteps(stored.steps);
    setCurrentStepIdx(stored.currentStepIdx);
    setResults(stored.results);
    setReviewSymbols(
      stored.reviewSymbols.length > 0 ? stored.reviewSymbols : null,
    );
    setInReviewRound(stored.inReviewRound);
  }, [language, alphabetId, sectionId, mode]);

  const steps = useMemo(() => {
    if (restoredSteps) return restoredSteps;
    if (!alphabet || !progress || !language) return [];
    if (mode === "test") {
      return buildAlphabetTestSteps(language.id, alphabet, { sectionId });
    }
    const infoStep = buildSectionInfoStep(mode, sectionId, t);
    if (reviewSymbols && reviewSymbols.length > 0) {
      const base = buildAlphabetLearnSteps(language.id, alphabet, progress, {
        sectionId,
        reviewOnlySymbols: reviewSymbols,
        reviewMode: "productionOnly",
      });
      return infoStep ? [infoStep, ...base] : base;
    }
    const base = buildAlphabetLearnSteps(language.id, alphabet, progress, {
      sectionId,
      maxNewPerSession: 5,
      includeSymbolToSound: !noSymbolToSound,
    });
    return infoStep ? [infoStep, ...base] : base;
  }, [
    restoredSteps,
    alphabet,
    progress,
    language,
    mode,
    sectionId,
    reviewSymbols,
    t,
    noSymbolToSound,
  ]);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  const totalSteps = steps.length;
  const currentStep: LessonStep | undefined = steps[currentStepIdx];

  useEffect(() => {
    if (!currentStep || !alphabet || !language) return;
    logAlphabetEvent("view_step", {
      languageId: language.id,
      alphabetId: alphabet.id,
      mode,
      sectionId,
      stepId: currentStep.id,
      stepType: currentStep.type,
      index: currentStepIdx,
      total: totalSteps,
    });
  }, [currentStep, currentStepIdx, totalSteps, alphabet, language, mode, sectionId]);

  // Per-step event buffering — ticks SyncManager dirty count as each
  // alphabet lesson step is graded.
  const recordAlphabetStep = useCallback(
    (stepId: string, correct: boolean) => {
      if (!alphabetId) return;
      const syntheticLessonId = `alphabet:${alphabetId}:${mode}${sectionId ? `:${sectionId}` : ""}`;
      recordStepEvent({
        lessonId: syntheticLessonId,
        stepId,
        stepIdx: 0,
        correct,
        conceptIds: [`alphabet:${alphabetId}`],
      });
    },
    [alphabetId, mode, sectionId],
  );

  const handleStepComplete = useCallback(
    (stepId: string, correct: boolean) => {
      setResults((prev) => ({ ...prev, [stepId]: correct }));
      recordAlphabetStep(stepId, correct);
      if (!progress || mode === "test") return;
      const parsed = parseAlphabetStepId(stepId);
      if (!parsed) return;
      const { prefix, symbol } = parsed;
       logAlphabetEvent("step_complete", {
        stepId,
        correct,
        prefix,
        symbol,
        languageId: language?.id ?? null,
        alphabetId,
        mode,
        sectionId,
      });
      if (prefix === "intro" && correct) {
        updateLetterProgress(progress, symbol, { introduced: true });
      } else if (prefix === "trace" && correct) {
        // Increment one pass at a time so partial trace progress survives a
        // mid-step exit. The trace view fires onComplete on every pass.
        const currentLetter = getLetterProgress(progress, symbol);
        updateLetterProgress(progress, symbol, {
          traceCount: Math.min(
            MIN_CORRECT_TRACES,
            currentLetter.traceCount + 1,
          ),
        });
      } else if (prefix === "recog" && correct) {
        updateLetterProgress(progress, symbol, { recognitionPassed: true });
      } else if (
        (prefix === "prod" || prefix === "prodReviewStep") &&
        correct
      ) {
        updateLetterProgress(progress, symbol, { productionPassed: true });
      } else if (prefix === "sound" && correct) {
        updateLetterProgress(progress, symbol, { symbolToSoundPassed: true });
      }
    },
    [progress, mode, language?.id, alphabetId, sectionId],
  );

  const handleContinue = useCallback(() => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((i) => i + 1);
    } else {
      if (mode === "learn" && !inReviewRound && !skipReview) {
        const needReview = new Set<string>();
        for (const [stepId] of Object.entries(results)) {
          const parsed = parseAlphabetStepId(stepId);
          if (!parsed) continue;
          // We use a synthetic "prodReview-<symbol>-0" stepId to mean:
          // user needed the template (2+ failed production attempts).
          if (parsed.prefix === "prodReview") {
            needReview.add(parsed.symbol);
          }
        }
        if (needReview.size > 0) {
          const symbols = Array.from(needReview);
          logAlphabetEvent("review_round_start", {
            languageId: language?.id ?? null,
            alphabetId,
            mode,
            sectionId,
            symbols,
          });
          setInReviewRound(true);
          setReviewSymbols(symbols);
          setCurrentStepIdx(0);
          setResults({});
          // Drop the resume snapshot so `steps` rebuilds via the review path
          // (otherwise we'd keep showing the original lesson's steps).
          setRestoredSteps(null);
          return;
        }
      }
      if (!finished) {
        logAlphabetEvent("session_end", {
          languageId: language?.id ?? null,
          alphabetId,
          mode,
          sectionId,
          totalSteps,
          results,
        });
      }
      setFinished(true);
    }
  }, [
    currentStepIdx,
    totalSteps,
    mode,
    inReviewRound,
    results,
    finished,
    skipReview,
    language?.id,
    alphabetId,
    sectionId,
  ]);

  useEffect(() => {
    if (!finished || mode !== "test" || !progress) return;
    const correctCount = Object.values(results).filter(Boolean).length;
    const totalGraded = Object.keys(results).length;
    const pct = totalGraded > 0 ? correctCount / totalGraded : 0;
    if (pct >= TEST_PASS_THRESHOLD) {
      if (sectionId) markSectionTestPassed(progress, sectionId);
      else markFullTestPassed(progress);
      // Romaji fade is governed centrally by per-script module thresholds
      // (romanizationAutoFlip.ts); passing the alphabet test no longer flips it,
      // so a katakana pass can't silently kill hiragana romaji.
    }
  }, [finished, mode, progress, sectionId, results]);

  // Buffer the alphabet lesson as a progress-tracked attempt. Mirrors the
  // recordAttempt wiring in LessonPage. The "lessonId" we send is a
  // synthetic id reflecting the alphabet + mode + section so the server
  // can distinguish reviews from tests when stats roll up later.
  const alphabetAttemptRecordedRef = useRef(false);
  useEffect(() => {
    if (!finished || alphabetAttemptRecordedRef.current) return;
    if (!alphabetId) return;
    alphabetAttemptRecordedRef.current = true;
    const correctCount = Object.values(results).filter(Boolean).length;
    const gradedSteps = Object.keys(results).length;
    const accuracy = gradedSteps > 0 ? correctCount / gradedSteps : 1;
    const stepResults = Object.values(results).map((correct, idx) => ({
      stepIdx: idx,
      conceptIds: [`alphabet:${alphabetId}`],
      correct,
      durationMs: undefined,
    }));
    const syntheticLessonId = `alphabet:${alphabetId}:${mode}${sectionId ? `:${sectionId}` : ""}`;
    recordAttempt({
      lessonId: syntheticLessonId,
      durationSec: Math.max(5, gradedSteps * 3),
      passed: accuracy >= TEST_PASS_THRESHOLD,
      score: accuracy,
      stepResults,
    });
  }, [finished, alphabetId, mode, sectionId, results]);

  // Persist session state on every meaningful change. Gated on real progress
  // so we don't overwrite a saved session with default state during the
  // initial render before the restore effect has had a chance to hydrate.
  useEffect(() => {
    if (!language || !alphabetId || finished) return;
    if (steps.length === 0) return;
    const hasProgress =
      currentStepIdx > 0 ||
      Object.keys(results).length > 0 ||
      inReviewRound;
    if (!hasProgress) return;
    saveStoredSession({
      languageId: language.id,
      alphabetId,
      sectionId: sectionId ?? null,
      mode,
      steps,
      currentStepIdx,
      results,
      inReviewRound,
      reviewSymbols: reviewSymbols ?? [],
    });
  }, [
    language,
    alphabetId,
    sectionId,
    mode,
    steps,
    currentStepIdx,
    results,
    inReviewRound,
    reviewSymbols,
    finished,
  ]);

  // Clear the resume payload once the lesson is finished. Per-letter progress
  // remains in its own localStorage key.
  useEffect(() => {
    if (!finished || !language || !alphabetId) return;
    clearStoredSession(language.id, alphabetId, sectionId ?? null, mode);
  }, [finished, language, alphabetId, sectionId, mode]);

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
                : null,
            ),
            steps,
            xpReward: 10,
          }
        : null,
    [alphabet, mode, sectionId, steps, language?.id],
  );

  if (!alphabet || !language) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-text-secondary">
          {t("alphabet.notFound", "Alphabet not found")}
        </p>
        <button
          type="button"
          onClick={() => navigate(langPath("practice"))}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          {t("lesson.backToLearn", "Back")}
        </button>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-text-secondary">
          {mode === "learn"
            ? t(
                "alphabet.noLettersToLearn",
                "No new letters to learn in this section. Try another section or test out.",
              )
            : t("alphabet.noLettersToTest", "No letters to test.")}
        </p>
        <button
          type="button"
          onClick={handleExit}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
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
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col px-4 sm:px-6">
      <div className="flex items-center gap-3 py-4">
        <button
          type="button"
          onClick={handleExit}
          className="rounded-lg p-2 text-text-muted transition hover:bg-surface-muted"
          aria-label={t("lesson.exit", "Exit")}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <LessonProgressBar current={currentStepIdx} total={totalSteps} />
      </div>

      <div className="flex flex-1 flex-col py-4 [container-type:size]">
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

