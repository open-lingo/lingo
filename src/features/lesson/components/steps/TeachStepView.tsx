import type { TeachStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedJa } from "@/shared/japanese";
import { getTtsUrl, useAutoPlayJaAudio } from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";

type Props = {
  step: TeachStep;
  onContinue: () => void;
};

export function TeachStepView({ step, onContinue }: Props) {
  const { content } = step;
  const { vocab } = content;
  const ttsUrl = vocab ? getTtsUrl(vocab.term) : null;
  useAutoPlayJaAudio(vocab?.term, `teach-${step.id}`);

  function playTerm() {
    if (!ttsUrl) return;
    new Audio(ttsUrl).play().catch(() => {});
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">
        {content.text}
      </p>

      {vocab && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-baseline gap-3 px-5 py-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {vocab.annotation ? (
                <AnnotatedJa segments={vocab.annotation} />
              ) : (
                <AnnotatedJa text={vocab.term} />
              )}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {vocab.translation}
            </span>
            {ttsUrl && (
              <button
                type="button"
                onClick={playTerm}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                aria-label="Play"
              >
                <Icon name="play" size={14} /> Play
              </button>
            )}
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
