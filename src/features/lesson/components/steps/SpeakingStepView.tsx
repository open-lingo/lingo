import type { SpeakingStep } from "../../types";
import { ContinueButton } from "../ContinueButton";

type Props = {
  step: SpeakingStep;
  onContinue: () => void;
};

export function SpeakingStepView({ step, onContinue }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Speaking practice
      </p>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 py-8 dark:border-gray-700 dark:bg-gray-800/50">
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-800/40 dark:text-emerald-300 dark:hover:bg-emerald-700/40"
          aria-label="Play audio"
        >
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {step.targetPhrase}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {step.translation}
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        🎤 Speech recognition is not yet available. Practice saying the phrase aloud, then continue.
      </div>

      <ContinueButton onClick={onContinue} label="I said it!" />
    </div>
  );
}
