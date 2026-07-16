import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";
import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api/provider";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  createInitialState,
  createTestOutState,
  selectNextItem,
  recordAnswer,
  finalizeState,
} from "./engine/adaptiveEngine";
import type { AdaptiveState } from "./engine/adaptiveEngine";
import { applyPlacementResult, type PlacementResult } from "./engine/applyPlacement";
import { syncTestOutToServer } from "./engine/syncTestOutToServer";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getItemsForModule, instantiateItem } from "./questionBank";
import {
  getDerivedTestOutItems,
  TESTOUT_DERIVED_FLOOR,
} from "./engine/deriveModuleTestOut";
import { dismissPlacement } from "./hooks/usePlacementDismissed";
import { useSettings } from "@/shared/contexts/SettingsContext";
import {
  parseModuleIndex,
  shouldAutoOffScriptRomaji,
  shouldAutoFadeBuildTileRomaji,
} from "@/shared/settings/romajiAutoFlip";
import { PlacementProgressBar } from "./components/PlacementProgressBar";
import { PlacementResultScreen } from "./components/PlacementResultScreen";
import type { LessonStep } from "@/features/lesson/types";

export function PlacementTestPage() {
  const { t } = useTranslation();
  const { moduleId } = useParams<{ moduleId?: string }>();
  const isTestOut = !!moduleId;
  const navigate = useNavigate();
  const langPath = useLangPath();
  const { progress } = useApi();

  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const { settings, updateSetting } = useSettings();

  // Test-outs serve the DERIVED sets — ~12 real lesson steps sampled for
  // section coverage (deriveModuleTestOut) — instead of the legacy
  // thin-per-module bank (Spencer sign-off 2026-07-13), for ANY language
  // whose module derives a workable set: at least TESTOUT_DERIVED_FLOOR
  // items. Modules under the floor (stub courses, or lessons whose steps
  // all fall outside TESTOUT_FORMATS) fall back to the authored bank —
  // e.g. ES's 4-per-module placementBank pool. JA always clears the floor
  // (~12 derived), so its behavior is unchanged. Full placement keeps the
  // authored bank: screening/probing needs the curated per-skill items.
  const itemsLookup = useMemo(
    () => (mod: string) => {
      if (isTestOut) {
        const derived = getDerivedTestOutItems(mod, langId);
        if (derived.length >= TESTOUT_DERIVED_FLOOR) return derived;
      }
      return getItemsForModule(mod, langId);
    },
    [isTestOut, langId],
  );

  // Modules / languages without items render an honest "no test-out
  // questions yet" message instead of running through an empty engine
  // cycle and showing a misleading "Not quite yet, you need 100%".
  const hasBank =
    !isTestOut || (moduleId != null && itemsLookup(moduleId).length > 0);

  const [state, setState] = useState<AdaptiveState>(() =>
    isTestOut
      ? createTestOutState(moduleId!, langId)
      : createInitialState(langId),
  );

  const [currentStep, setCurrentStep] = useState<LessonStep | null>(null);
  const [resultApplied, setResultApplied] = useState(false);
  const [appliedResult, setAppliedResult] = useState<PlacementResult | null>(
    null,
  );

  const moduleLabel = useMemo(() => {
    if (!moduleId) return undefined;
    const course = getMockCourse(langId);
    const mod = course.modules.find((m) => m.id === moduleId);
    return mod?.title ?? moduleId.toUpperCase();
  }, [moduleId, langId]);

  useEffect(() => {
    if (state.stage === "done") {
      if (!resultApplied) {
        const result = applyPlacementResult(state.passedModules, langId, {
          assumedModules: state.assumedModules,
          missedSkills: state.missedSkills,
        });
        if (!isTestOut) dismissPlacement();
        setAppliedResult(result);
        setResultApplied(true);
        // Romaji auto-off is position-triggered, not completion-triggered:
        // a learner who tests OUT of m3-m9 has reached m10 without ever
        // completing an m10+ lesson, and would otherwise keep the beginner
        // romaji scaffold deep into the course (QA 2026-07-11). Position
        // after placement = highest CREDITED module + 1 — assumed modules
        // count too (assume-complete policy: they're treated as known, so
        // they place the learner just like passed ones). Same one-shot
        // guards as the LessonPage trigger, so this is idempotent.
        const creditedModules = [
          ...state.passedModules,
          ...state.assumedModules,
        ];
        const placedIndex =
          creditedModules.length > 0
            ? Math.max(
                ...creditedModules.map((m) =>
                  parseModuleIndex(`${langId}-${m}`),
                ),
              ) + 1
            : 0;
        if (
          shouldAutoOffScriptRomaji({
            settings,
            reachedModuleIndex: placedIndex,
            script: "hiragana",
          })
        ) {
          updateSetting("learning.hiraganaRomajiAutoOff", true);
        }
        if (
          shouldAutoOffScriptRomaji({
            settings,
            reachedModuleIndex: placedIndex,
            script: "katakana",
          })
        ) {
          updateSetting("learning.katakanaRomajiAutoOff", true);
        }
        if (
          shouldAutoFadeBuildTileRomaji({
            settings,
            reachedModuleIndex: placedIndex,
          })
        ) {
          updateSetting("learning.hideBuildTileRomaji", true);
          updateSetting("learning.buildTileRomajiAutoFlipped", true);
        }
        // Mirror the local mockProgress writes to the server so a device
        // switch / fresh login carries the test-out completions over.
        // Fire-and-forget: local apply already persisted.
        void syncTestOutToServer(progress, state.passedModules, langId);
      }
      return;
    }
    const nextItem = selectNextItem(state, itemsLookup);
    if (!nextItem) {
      setState((prev) => finalizeState(prev));
      return;
    }
    setCurrentStep(instantiateItem(nextItem));
  }, [
    state,
    resultApplied,
    isTestOut,
    langId,
    itemsLookup,
    progress,
    settings,
    updateSetting,
  ]);

  const handleStepComplete = useCallback(
    (stepId: string, correct: boolean) => {
      setState((prev) => recordAnswer(prev, stepId, correct, itemsLookup));
    },
    [],
  );

  const handleContinue = useCallback(() => {
    // State already updated in handleStepComplete — the useEffect will
    // select the next item.
  }, []);

  if (!hasBank) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("placement.noBankTitle", {
            defaultValue: "No test-out questions yet",
          })}
        </h2>
        <p className="max-w-md text-sm text-text-secondary">
          {t("placement.noBankDesc", {
            defaultValue:
              "The placement engine doesn't have any items for {{module}} on this language yet. The Japanese course covers M3–M27; other modules and languages need their own bank before test-out can probe them.",
            module: moduleId,
          })}
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => navigate(langPath("learn"))}
        >
          {t("placement.backToLearn", { defaultValue: "Back to Learn" })}
        </Button>
      </div>
    );
  }

  if (appliedResult) {
    return (
      <PlacementResultScreen
        passedModules={appliedResult.passedModules}
        assumedModules={appliedResult.assumedModules}
        missedSkills={appliedResult.missedSkills}
        skippedLessonCount={appliedResult.skippedLessonCount}
        seededAtomCount={appliedResult.seededAtomCount}
        isTestOut={isTestOut}
        testOutModuleLabel={moduleLabel}
        onContinue={() => navigate(langPath("learn"))}
      />
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => navigate(langPath("learn"))}
          className="ml-2 rounded-xl p-2.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          aria-label={t("placement.exit", {
            defaultValue: isTestOut ? "Exit test-out" : "Exit placement test",
          })}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.25}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <PlacementProgressBar
            state={state}
            isTestOut={isTestOut}
            testOutModuleLabel={moduleLabel}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col">
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
