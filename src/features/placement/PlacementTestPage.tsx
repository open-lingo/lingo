import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";
import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api/provider";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  createBandedState,
  createTestOutState,
  selectNextItem,
  recordAnswer,
  finalizeState,
} from "./engine/adaptiveEngine";
import type { AdaptiveState } from "./engine/adaptiveEngine";
import { getLevelBands } from "./levelBands";
import type { PlacementLevelBand } from "./levelBands";
import { PlacementLevelSelect } from "./components/PlacementLevelSelect";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { applyPlacementResult, type PlacementResult } from "./engine/applyPlacement";
import { syncTestOutToServer } from "./engine/syncTestOutToServer";
import { getItemsForModule, instantiateItem } from "./questionBank";
import {
  getDerivedTestOutItems,
  TESTOUT_DERIVED_FLOOR,
} from "./engine/deriveModuleTestOut";
import { mulberry32 } from "@/shared/utils/seededRng";
import { dismissPlacement } from "./hooks/usePlacementDismissed";
import { useSettings } from "@/shared/contexts/SettingsContext";
import {
  parseModuleIndex,
  shouldAutoOffScriptRomaji,
  shouldAutoFadeBuildTileRomaji,
} from "@/shared/settings/romajiAutoFlip";
import { PlacementProgressBar } from "./components/PlacementProgressBar";
import { PlacementResultScreen } from "./components/PlacementResultScreen";
import { stopAllAudio } from "@/shared/tts";
import type { LessonStep } from "@/features/lesson/types";

export function PlacementTestPage() {
  const { t } = useTranslation();
  const { moduleId } = useParams<{ moduleId?: string }>();
  const isTestOut = !!moduleId;
  const navigate = useNavigate();
  const langPath = useLangPath();
  const { progress } = useApi();

  // Resolve the course from the URL ``:lang`` segment, NOT the settings
  // language. The two can diverge briefly on entry: the Learn map links to
  // ``/ja/learn/placement-test`` (URL-authoritative via ``langPath``), but the
  // account's ``learningLanguageId`` may still be hydrating to a different id
  // (or genuinely be another course). LangLayout re-syncs settings → URL in an
  // effect, but that lands AFTER this page's first render — long enough for the
  // mount effect to select against the wrong language's (empty) question bank
  // and instantly finalize to "Starting from the top". ``useLang`` reads the
  // route param first and is stable from render one, so placement always runs
  // for the language the user actually navigated to.
  const langId = useLang();
  const { settings, updateSetting } = useSettings();

  // Per-attempt PRNG seed. Fixed once per mount (a fresh attempt = a fresh
  // mount = a new seed = a different draw), so `itemsLookup` returns a
  // stable-within-attempt but varied-across-attempts test-out. This is the
  // anti-memorization mechanism: a retry can't re-serve the memorized set.
  const rngSeed = useRef<number>(Math.floor(Math.random() * 0xffffffff));

  // Test-outs serve the DERIVED sets — ~12 real lesson steps sampled from the
  // module's own lessons for section coverage (Spencer 2026-07-13/07-15) — for
  // ANY language whose module derives a workable pool: at least
  // TESTOUT_DERIVED_FLOOR items. Modules under the floor (stub courses, or
  // lessons whose steps all fall outside TESTOUT_FORMATS) fall back to the
  // authored bank — e.g. ES's 4-per-module placementBank pool. Each attempt
  // draws a seeded random subset (anti-memorization). Full placement keeps
  // the authored bank: screening/probing needs the curated per-skill items.
  const itemsLookup = useMemo(() => {
    const rng = mulberry32(rngSeed.current);
    // The engine calls the lookup many times per module (selectNextItem,
    // recordAnswer, …); the seeded draw must be computed ONCE per module per
    // attempt, or the served set would reshuffle mid-run and break grading.
    const attemptCache = new Map<string, ReturnType<typeof getItemsForModule>>();
    return (mod: string) => {
      if (!isTestOut) return getItemsForModule(mod, langId);
      const cached = attemptCache.get(mod);
      if (cached) return cached;
      const drawn = getDerivedTestOutItems(mod, langId, rng);
      // Thin derived pool → authored bank (floor semantics from the parity
      // branch), still cached per attempt so the set is stable within a run.
      const items =
        drawn.length >= TESTOUT_DERIVED_FLOOR
          ? drawn
          : getItemsForModule(mod, langId);
      attemptCache.set(mod, items);
      return items;
    };
  }, [isTestOut, langId]);

  // Modules / languages without items render an honest "no test-out
  // questions yet" message instead of running through an empty engine
  // cycle and showing a misleading "Not quite yet, you need 100%".
  const hasBank =
    !isTestOut || (moduleId != null && itemsLookup(moduleId).length > 0);

  // Test-out starts the engine immediately (single-module probe). Banded
  // placement waits for the learner to self-declare a level first — `state`
  // stays null until a band is chosen, and the level-select screen renders.
  const [state, setState] = useState<AdaptiveState | null>(() =>
    isTestOut ? createTestOutState(moduleId!, langId) : null,
  );

  const bands = useMemo(() => getLevelBands(langId), [langId]);
  const languageName = useMemo(
    () => getLanguageConfig(langId)?.name ?? langId.toUpperCase(),
    [langId],
  );

  const handleSelectBand = useCallback(
    (band: PlacementLevelBand) => {
      setState(createBandedState(band, langId));
    },
    [langId],
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

  // Progress-bar denominator: the derived set's real size (~12), NOT the old
  // hardcoded 3. itemsLookup is memoized + per-attempt cached, so this is cheap
  // and stable within the attempt.
  const testOutTotal = useMemo(
    () => (isTestOut && moduleId ? itemsLookup(moduleId).length : undefined),
    [isTestOut, moduleId, itemsLookup],
  );

  // Banded run denominator: sum the served-item budget across the sampled
  // modules (each capped at ~3), so the progress bar fills honestly.
  const samplingTotal = useMemo(() => {
    if (!state || state.sampleModules.length === 0) return undefined;
    return state.sampleModules.reduce(
      (n, mod) => n + Math.min(3, itemsLookup(mod).length),
      0,
    );
  }, [state, itemsLookup]);

  useEffect(() => {
    if (!state) return; // banded run: waiting on the level-select step
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
        // switch / fresh login carries the test-out completions over —
        // including the assumed (before-the-tested-module) auto-completions.
        // Fire-and-forget: local apply already persisted.
        void syncTestOutToServer(
          progress,
          state.passedModules,
          langId,
          state.assumedModules,
        );
      }
      return;
    }
    const nextItem = selectNextItem(state, itemsLookup);
    if (!nextItem) {
      setState((prev) => (prev ? finalizeState(prev) : prev));
      return;
    }
    // Placement auto-advances on submit, so a cloze's correct-answer clip
    // could still be playing as the next item mounts. Cut it off so audio
    // never bleeds into the next question (Spencer QA 2026-07-16).
    stopAllAudio();
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
      setState((prev) =>
        prev ? recordAnswer(prev, stepId, correct, itemsLookup) : prev,
      );
    },
    [itemsLookup],
  );

  const handleContinue = useCallback(() => {
    // State already updated in handleStepComplete — the useEffect will
    // select the next item.
  }, []);

  // Cut off any in-flight TTS when leaving placement / test-out so a
  // clip can't play on after the learner has navigated away
  // (Spencer QA 2026-07-16).
  useEffect(
    () => () => {
      stopAllAudio();
    },
    [],
  );

  if (!hasBank) {
    return (
      // LangLayout provides no themed shell, so this route paints its own
      // ``bg-background`` — otherwise the screen renders on the browser default
      // (light) while the app is in dark theme.
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background p-8 text-center">
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
      // Themed shell around the result screen — the screen itself is a
      // ``flex-1`` body that assumes a full-height ``bg-background`` parent
      // (LangLayout doesn't provide one).
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <PlacementResultScreen
          passedModules={appliedResult.passedModules}
          assumedModules={appliedResult.assumedModules}
          missedSkills={appliedResult.missedSkills}
          skippedLessonCount={appliedResult.skippedLessonCount}
          seededAtomCount={appliedResult.seededAtomCount}
          isTestOut={isTestOut}
          testOutModuleLabel={moduleLabel}
          itemResults={
            moduleId && state ? state.probeResults[moduleId] : undefined
          }
          onContinue={() => navigate(langPath("learn"))}
        />
      </div>
    );
  }

  // Banded placement step 0: self-declare a level before any sampling. Shown
  // for onboarding AND retake (test-out skips straight to probing).
  if (!isTestOut && !state) {
    return (
      <PlacementLevelSelect
        languageName={languageName}
        bands={bands}
        onSelect={handleSelectBand}
        onExit={() => navigate(langPath("learn"))}
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
          {state && (
            <PlacementProgressBar
              state={state}
              isTestOut={isTestOut}
              testOutModuleLabel={moduleLabel}
              testOutTotal={testOutTotal}
              samplingTotal={samplingTotal}
            />
          )}
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
