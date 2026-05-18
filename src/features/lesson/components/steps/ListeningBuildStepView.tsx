import { useState } from "react";
import type { ListeningBuildStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { AnnotatedJa } from "@/shared/japanese";
import { getTtsUrl } from "@/shared/japanese/tts";
import { playLocalAudio } from "@/shared/audio/volume";
import { Icon } from "@/shared/components/Icon";

type Props = {
  step: ListeningBuildStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Render the prompt with any single-quoted span bolded — gives the
 * "the word for 'love'" pattern a clear emphasis without restructuring
 * the prop into separate fields. Falls back to the raw string when no
 * quoted segment exists, so prompts authored without quotes still
 * render cleanly.
 */
function PromptWithEmphasis({ text }: { text: string }) {
  const parts = text.split(/'([^']+)'/g);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-text-primary">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

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
    playLocalAudio(audioUrl);
  }

  return (
    <div className="flex flex-1 flex-col gap-7">
      {/* Prompt row — bigger play button + larger text. Quoted meanings
       *  get auto-bolded via PromptWithEmphasis. */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-accent-hover bg-accent text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]"
          aria-label="Play audio"
        >
          <Icon name="play" size={28} />
        </button>
        <p className="text-lg leading-snug text-text-secondary">
          <PromptWithEmphasis text={step.prompt} />
        </p>
      </div>

      {/* Drop area — ~20% taller. The min-h floor matters when no tiles
       *  are placed; once tiles arrive, flex-wrap handles overflow.
       *  TODO: account for long-word text wrapping when we ship phrases
       *  that exceed one line. */}
      <div className="min-h-[80px] rounded-2xl border-2 border-dashed border-border bg-surface-muted px-4 py-4">
        {placed.length === 0 ? (
          <span className="text-base text-text-muted">
            Tap tiles to build what you hear
          </span>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {placed.map((tile, i) => (
              <button
                key={`${tile}-${i}`}
                type="button"
                disabled={submitted}
                onClick={() => removeTile(i)}
                className="rounded-xl border-2 border-accent bg-accent-muted px-5 py-2.5 text-2xl font-bold text-accent transition-colors duration-150 hover:bg-accent hover:text-white"
              >
                <AnnotatedJa text={tile} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tile bank — buttons ~50% bigger font + matching padding. */}
      <div className="flex flex-wrap gap-3">
        {uniqueRemaining.map((tile, i) => (
          <button
            key={`${tile}-${i}`}
            type="button"
            disabled={submitted}
            onClick={() => addTile(tile)}
            className="rounded-xl border-2 border-border bg-surface px-5 py-3 text-2xl font-bold text-text-primary transition-colors duration-150 hover:border-accent disabled:opacity-50"
          >
            <AnnotatedJa text={tile} />
          </button>
        ))}
      </div>

      {submitted && <Feedback correct={isCorrect} />}

      {submitted && !isCorrect && (
        <p className="text-base text-text-secondary">
          Correct:{" "}
          <span className="font-bold text-text-primary">
            {step.correctOrder.join(step.granularity === "character" ? "" : " ")}
          </span>
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
