import { useState } from "react";
import type { BuildSentenceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { AnnotatedJa } from "@/shared/japanese";

type Props = {
  step: BuildSentenceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function BuildSentenceStepView({ step, onComplete, onContinue }: Props) {
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
      <h2 className="text-lg font-semibold text-text-primary">
        {step.prompt}
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      <div className="min-h-[64px] rounded-2xl border-[1.5px] border-dashed border-border bg-surface-muted px-4 py-3.5">
        {placed.length === 0 ? (
          <span className="text-sm text-text-muted">
            Tap tiles to build the sentence
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {placed.map((tile, i) => (
              <button
                key={`${tile}-${i}`}
                type="button"
                disabled={submitted}
                onClick={() => removeTile(i)}
                className="rounded-xl border-[1.5px] border-accent bg-accent-muted px-3.5 py-1.5 text-base font-semibold text-accent transition-colors duration-150 hover:bg-accent hover:text-white"
              >
                <AnnotatedJa text={tile} />
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
            className="rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-1.5 text-base font-medium text-text-primary transition-colors duration-150 hover:border-accent disabled:opacity-50"
          >
            <AnnotatedJa text={tile} />
          </button>
        ))}
      </div>

      {submitted && <Feedback correct={isCorrect} />}

      {submitted && !isCorrect && (
        <p className="text-sm text-text-secondary">
          Correct answer: <span className="font-semibold text-text-primary">{step.correctOrder.join(step.granularity === "character" ? "" : " ")}</span>
        </p>
      )}

      {!submitted ? (
        <ContinueButton
          onClick={handleSubmit}
          label="Check"
          disabled={placed.length === 0}
        />
      ) : (
        <ContinueButton
          onClick={onContinue}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}
    </div>
  );
}
