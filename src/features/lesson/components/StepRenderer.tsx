import type { LessonStep } from "../types";
import { InfoStepView } from "./steps/InfoStepView";
import { MultipleChoiceStepView } from "./steps/MultipleChoiceStepView";
import { BuildSentenceStepView } from "./steps/BuildSentenceStepView";
import { MatchPairsStepView } from "./steps/MatchPairsStepView";
import { FillBlankStepView } from "./steps/FillBlankStepView";
import { TranslateStepView } from "./steps/TranslateStepView";
import { ListeningComprehensionStepView } from "./steps/ListeningComprehensionStepView";
import { ListeningBuildStepView } from "./steps/ListeningBuildStepView";
import { SpeakingStepView } from "./steps/SpeakingStepView";
import { SymbolIntroStepView } from "./steps/SymbolIntroStepView";
import { SymbolTraceStepView } from "./steps/SymbolTraceStepView";
import { SymbolRecognitionStepView } from "./steps/SymbolRecognitionStepView";
import { SymbolProductionStepView } from "./steps/SymbolProductionStepView";
import { SymbolToSoundStepView } from "./steps/SymbolToSoundStepView";
import { WordImageMcqStepView } from "./steps/WordImageMcqStepView";
import { PhraseCardStepView } from "./steps/PhraseCardStepView";
import { GrammarRuleStepView } from "./steps/GrammarRuleStepView";
import { ParticleClozeStepView } from "./steps/ParticleClozeStepView";
import { AgreementClozeStepView } from "./steps/AgreementClozeStepView";
import { KanjiReadingStepView } from "./steps/KanjiReadingStepView";
import { SelfExplanationMcqStepView } from "./steps/SelfExplanationMcqStepView";
import { DialogueListenStepView } from "./steps/DialogueListenStepView";
import { RowTestStepView } from "./steps/RowTestStepView";

type Props = {
  step: LessonStep;
  /** `progressTicks` (trace steps only): cumulative successful passes,
   *  so the weighted progress bar ticks per stroke. */
  onComplete: (stepId: string, correct: boolean, progressTicks?: number) => void;
  onContinue: () => void;
  /** True when the learner is replaying an already-completed lesson —
   *  first-view pacing gates (e.g. the symbol-intro stroke animation
   *  lock) are skipped on replays. */
  isReplayRun?: boolean;
  /**
   * Where the step is rendering. Inside a lesson (default), surrounding
   * steps supply context; in the standalone grammar review deck they
   * don't, so cloze views must show their English gloss BEFORE the answer
   * (a semantic cloze with no pre-answer context is a guessing game —
   * 2026-07-06 audit) and rule cards render as compact refreshers.
   */
  surface?: "lesson" | "grammarReview";
};

export function StepRenderer({
  step,
  onComplete,
  onContinue,
  isReplayRun,
  surface = "lesson",
}: Props) {
  switch (step.type) {
    case "info":
      return <InfoStepView step={step} onContinue={onContinue} />;
    case "multiple_choice":
      return (
        <MultipleChoiceStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "build_sentence":
      return (
        <BuildSentenceStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
          isReplayRun={isReplayRun}
        />
      );
    case "match_pairs":
      return (
        <MatchPairsStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "fill_blank":
      return (
        <FillBlankStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "translate":
      return (
        <TranslateStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "listening_comprehension":
      return (
        <ListeningComprehensionStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "listening_build":
      return (
        <ListeningBuildStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "speaking":
      return (
        <SpeakingStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "symbol_intro":
      return (
        <SymbolIntroStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
          skipAnimationGate={isReplayRun}
        />
      );
    case "symbol_trace":
      return (
        <SymbolTraceStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "symbol_recognition":
      return (
        <SymbolRecognitionStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "symbol_production":
      return (
        <SymbolProductionStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "symbol_to_sound":
      return (
        <SymbolToSoundStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "word_image_mcq":
      return (
        <WordImageMcqStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "phrase_card":
      return <PhraseCardStepView step={step} onContinue={onContinue} />;
    case "grammar_rule":
      return (
        <GrammarRuleStepView
          step={step}
          onContinue={onContinue}
          // Workshop A (2026-07-12): lessons render the COMPACT card too —
          // rule + first example only. The monolith "full" treatment is
          // retired from the learner path (anti-pattern + culture are
          // delivered reactively / as flavor now).
          variant="compact"
        />
      );
    case "particle_cloze":
      return (
        <ParticleClozeStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
          showMeaningPreAnswer={surface === "grammarReview"}
        />
      );
    case "agreement_cloze":
      return (
        <AgreementClozeStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "kanji_reading":
      return (
        <KanjiReadingStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "self_explanation_mcq":
      return (
        <SelfExplanationMcqStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "dialogue_listen":
      return (
        <DialogueListenStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    case "row_test":
      return (
        <RowTestStepView
          step={step}
          onComplete={onComplete}
          onContinue={onContinue}
        />
      );
    default:
      return (
        <div className="text-text-muted">
          Unknown step type
        </div>
      );
  }
}
