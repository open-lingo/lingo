import type { LessonStep } from "../types";
import { InfoStepView } from "./steps/InfoStepView";
import { TeachStepView } from "./steps/TeachStepView";
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
import { SelfExplanationMcqStepView } from "./steps/SelfExplanationMcqStepView";
import { RowTestStepView } from "./steps/RowTestStepView";

type Props = {
  step: LessonStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function StepRenderer({ step, onComplete, onContinue }: Props) {
  switch (step.type) {
    case "info":
      return <InfoStepView step={step} onContinue={onContinue} />;
    case "teach":
      return <TeachStepView step={step} onContinue={onContinue} />;
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
      return <GrammarRuleStepView step={step} onContinue={onContinue} />;
    case "particle_cloze":
      return (
        <ParticleClozeStepView
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
