import type { SymbolIntroStep } from "../../types";
import { Icon } from "@/shared/components/Icon";
import { ContinueButton } from "../ContinueButton";

type Props = {
  step: SymbolIntroStep;
  onContinue: () => void;
};

export function SymbolIntroStepView({ step, onContinue }: Props) {
  const { payload } = step;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-6 py-8 dark:border-gray-700 dark:bg-gray-800/50">
        <span
          className="text-6xl font-bold text-gray-900 dark:text-white"
          aria-hidden
        >
          {payload.symbol}
        </span>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-500 dark:text-gray-400">
            Sound (IPA):{" "}
          </span>
          {payload.ipa}
        </p>
        <p className="text-base text-gray-700 dark:text-gray-200">
          {payload.hint}
        </p>
        {payload.note && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {payload.note}
          </p>
        )}
        {payload.example && (
          <p className="text-sm italic text-gray-600 dark:text-gray-300">
            {payload.example}
          </p>
        )}
        <button
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          aria-label="Play pronunciation"
        >
          <Icon name="play" size={14} className="mr-1 inline" /> Play
        </button>
      </div>
      <ContinueButton onClick={onContinue} />
    </div>
  );
}
