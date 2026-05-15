import { useState } from "react";
import type { ListeningBuildStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { AnnotatedJa } from "@/shared/japanese";
import { getTtsUrl } from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";

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

  const audioUrl = getTtsUrl(step.targetSentence);
  function handlePlay() {
    if (!audioUrl) return;
    new Audio(audioUrl).play().catch(() => {});
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]"
          aria-label="Play audio"
        >
          <Icon name="play" size={24} />
        </button>
        <p className="text-sm text-text-secondary">{step.prompt}</p>
      </div>

      <div className="min-h-[64px] rounded-2xl border-[1.5px] border-dashed border-border bg-surface-muted px-4 py-3.5">
        {placed.length === 0 ? (
          <span className="text-sm text-text-muted">
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
          Correct: <span className="font-semibold text-text-primary">{step.correctOrder.join(step.granularity === "character" ? "" : " ")}</span>
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
