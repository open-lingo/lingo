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
      return <SpeakingStepView step={step} onContinue={onContinue} />;
    default:
      return (
        <div className="text-gray-500 dark:text-gray-400">
          Unknown step type
        </div>
      );
  }
}
