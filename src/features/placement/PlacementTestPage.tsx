import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { getItemsForModule, instantiateItem } from "./questionBank";
import { dismissPlacement } from "./hooks/usePlacementDismissed";
import { PlacementProgressBar } from "./components/PlacementProgressBar";
import { PlacementResultScreen } from "./components/PlacementResultScreen";
import type { LessonStep } from "@/features/lesson/types";

export function PlacementTestPage() {
  const { moduleId, lang } = useParams<{ moduleId?: string; lang?: string }>();
  const isTestOut = !!moduleId;
  const navigate = useNavigate();
  const langPath = useLangPath();
  const { progress } = useApi();

  // Test-out engine + question bank are hard-coded to Japanese for now.
  // If the URL lands here for any other language, jump them back to the
  // learn page rather than serving JA prompts on a KO module id.
  if (isTestOut && lang && lang !== "ja") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold">Test-out is Japanese-only for now</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          The placement engine and question bank only ship Japanese content
          today. Korean and other languages need their own bank before
          test-out can ship there.
        </p>
        <button
          type="button"
          onClick={() => navigate(langPath("learn"))}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
        >
          Back to Learn
        </button>
      </div>
    );
  }

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
    const course = getMockCourse("ja");
    const mod = course.modules.find((m) => m.id === moduleId);
    return mod?.title ?? moduleId.toUpperCase();
  }, [moduleId]);

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
    const nextItem = selectNextItem(state, getItemsForModule);
    if (!nextItem) {
      setState((prev) => finalizeState(prev));
      return;
    }
    setCurrentStep(instantiateItem(nextItem));
  }, [state, resultApplied, isTestOut]);

  const handleStepComplete = useCallback(
    (stepId: string, correct: boolean) => {
      setState((prev) => recordAnswer(prev, stepId, correct, getItemsForModule));
    },
    [],
  );

  const handleContinue = useCallback(() => {
    // State already updated in handleStepComplete — the useEffect will
    // select the next item.
  }, []);

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
    <div className="flex min-h-[100dvh] flex-col bg-surface-primary">
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
