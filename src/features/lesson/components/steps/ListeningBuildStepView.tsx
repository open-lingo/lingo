import { useState } from "react";
import type { ListeningBuildStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";

type Props = {
  step: ListeningBuildStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function ListeningBuildStepView({ step, onComplete, onContinue }: Props) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const uniqueRemaining: string[] = [];
  const seen = new Map<string, number>();
  for (const tile of step.tiles) {
    const placedCount = placed.filter((p) => p === tile).length;
    const totalCount = step.tiles.filter((t) => t === tile).length;
    const leftover = totalCount - placedCount;
    const alreadyAdded = seen.get(tile) ?? 0;
    if (alreadyAdded < leftover) {
      uniqueRemaining.push(tile);
      seen.set(tile, alreadyAdded + 1);
    }
  }

  const isCorrect = JSON.stringify(placed) === JSON.stringify(step.correctOrder);

  function addTile(tile: string) {
    if (submitted) return;
    setPlaced((prev) => [...prev, tile]);
  }

  function removeTile(index: number) {
    if (submitted) return;
    setPlaced((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setSubmitted(true);
    onComplete(step.id, isCorrect);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-800/40 dark:text-emerald-300 dark:hover:bg-emerald-700/40"
          aria-label="Play audio"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">{step.prompt}</p>
      </div>

      <div className="min-h-[56px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-800/50">
        {placed.length === 0 ? (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            Tap tiles to build what you hear
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {placed.map((tile, i) => (
              <button
                key={`${tile}-${i}`}
                type="button"
                disabled={submitted}
                onClick={() => removeTile(i)}
                className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-800/40 dark:text-emerald-300 dark:hover:bg-emerald-700/40"
              >
                {tile}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {uniqueRemaining.map((tile, i) => (
          <button
            key={`${tile}-${i}`}
            type="button"
            disabled={submitted}
            onClick={() => addTile(tile)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-emerald-500 dark:hover:bg-gray-600"
          >
            {tile}
          </button>
        ))}
      </div>

      {submitted && <Feedback correct={isCorrect} />}

      {submitted && !isCorrect && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Correct: <span className="font-semibold">{step.correctOrder.join(step.granularity === "character" ? "" : " ")}</span>
        </p>
      )}

      {!submitted ? (
        <ContinueButton onClick={handleSubmit} label="Check" disabled={placed.length === 0} />
      ) : (
        <ContinueButton onClick={onContinue} variant={isCorrect ? "correct" : "incorrect"} />
      )}
    </div>
  );
}
