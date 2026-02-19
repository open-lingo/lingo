import type { TeachStep } from "../../types";
import { ContinueButton } from "../ContinueButton";

type Props = {
  step: TeachStep;
  onContinue: () => void;
};

export function TeachStepView({ step, onContinue }: Props) {
  const { content } = step;
  const { vocab } = content;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">
        {content.text}
      </p>

      {vocab && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-baseline gap-3 px-5 py-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {vocab.term}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {vocab.translation}
            </span>
          </div>

          {vocab.breakdown && vocab.breakdown.length > 0 && (
            <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {vocab.breakdown.map((seg, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm shadow-sm dark:bg-gray-700"
                  >
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {seg.segment}
                    </span>
                    {seg.meaning && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {seg.meaning}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {content.note && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          💡 {content.note}
        </div>
      )}

      <ContinueButton onClick={onContinue} />
    </div>
  );
}
