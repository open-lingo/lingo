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
import { ALL_TESTABLE_MODULES } from "./tiers";
import { dismissPlacement } from "./hooks/usePlacementDismissed";
import { PlacementProgressBar } from "./components/PlacementProgressBar";
import { PlacementResultScreen } from "./components/PlacementResultScreen";
import type { LessonStep } from "@/features/lesson/types";

export function PlacementTestPage() {
  const { moduleId } = useParams<{ moduleId?: string }>();
  const isTestOut = !!moduleId;
  const navigate = useNavigate();
  const langPath = useLangPath();
  const { progress } = useApi();

  // The placement question bank covers JA m3-m27. Anything else (the JA
  // alphabet modules m1/m2, or future KO/ZH modules with their own
  // module ids) has no items, so the engine would finalize immediately
  // and show a misleading "Not quite yet" result. Detect the no-bank
  // case up-front and render an honest "no test-out questions yet"
  // message instead of pretending to test.
  const hasBank =
    !isTestOut ||
    (moduleId != null && ALL_TESTABLE_MODULES.includes(moduleId) &&
      getItemsForModule(moduleId).length > 0);

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

  if (!hasBank) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold">No test-out questions yet</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          The placement engine doesn't have any items for{" "}
          <span className="font-mono">{moduleId}</span> on this language
          yet. The Japanese course covers M3–M27; other modules + other
          languages need their own bank before test-out can probe them.
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
