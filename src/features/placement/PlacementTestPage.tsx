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
import { applyPlacementResult } from "./engine/applyPlacement";
import { syncTestOutToServer } from "./engine/syncTestOutToServer";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getItemsForModule, instantiateItem } from "./questionBank";
import { dismissPlacement } from "./hooks/usePlacementDismissed";
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

  // The placement bank covers JA m3-m27 and KO m3. Other modules /
  // languages without items render an honest "no test-out questions
  // yet" message instead of running through an empty engine cycle and
  // showing a misleading "Not quite yet, you need 100%".
  const hasBank =
    !isTestOut ||
    (moduleId != null && getItemsForModule(moduleId, langId).length > 0);

  const itemsLookup = useMemo(
    () => (mod: string) => getItemsForModule(mod, langId),
    [langId],
  );

  const [state, setState] = useState<AdaptiveState>(() =>
    isTestOut ? createTestOutState(moduleId!) : createInitialState(),
  );

  const [currentStep, setCurrentStep] = useState<LessonStep | null>(null);
  const [resultApplied, setResultApplied] = useState(false);
  const [appliedResult, setAppliedResult] = useState<{
    passedModules: string[];
    skippedLessonCount: number;
    seededAtomCount: number;
  } | null>(null);

  const moduleLabel = useMemo(() => {
    if (!moduleId) return undefined;
    const course = getMockCourse(langId);
    const mod = course.modules.find((m) => m.id === moduleId);
    return mod?.title ?? moduleId.toUpperCase();
  }, [moduleId, langId]);

  useEffect(() => {
    if (state.stage === "done") {
      if (!resultApplied) {
        const result = applyPlacementResult(state.passedModules);
        if (!isTestOut) dismissPlacement();
        setAppliedResult(result);
        setResultApplied(true);
        // Mirror the local mockProgress writes to the server so a device
        // switch / fresh login carries the test-out completions over.
        // Fire-and-forget: local apply already persisted.
        void syncTestOutToServer(progress, state.passedModules);
      }
      return;
    }
    const nextItem = selectNextItem(state, itemsLookup);
    if (!nextItem) {
      setState((prev) => finalizeState(prev));
      return;
    }
    setCurrentStep(instantiateItem(nextItem));
  }, [state, resultApplied, isTestOut]);

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
      <PlacementProgressBar
        state={state}
        isTestOut={isTestOut}
        testOutModuleLabel={moduleLabel}
      />
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
