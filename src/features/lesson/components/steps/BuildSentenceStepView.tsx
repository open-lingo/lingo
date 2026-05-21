import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BuildSentenceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedJa } from "@/shared/japanese";
import { useAutoPlayJaAudio } from "@/shared/japanese/tts";

const CELEBRATE_MS = 1100;

type Props = {
  step: BuildSentenceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function BuildSentenceStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [placed, setPlaced] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  // Tester observation 2026-05-17 (#R1-defer-G): the prompt was silent
  // until tap. Speak the target on mount so the learner gets an audio
  // cue alongside the tile bank. `targetSentence` is the canonical
  // full-form text (kana for char-granularity rows, full sentence for
  // word-granularity); the TTS manifest is keyed on it directly.
  useAutoPlayJaAudio(step.targetSentence, `build-${step.id}`);

  // Position-stable tile bar: render every original tile in `step.tiles`
  // order, never reflow. When a tile is selected, that *instance* (by
  // original index) becomes disabled — its slot stays put so the learner's
  // muscle memory of "the topic marker is in slot 3" survives the pick.
  // For duplicate tile glyphs (e.g. two は), instances are distinct by
  // original index; selecting one disables the leftmost still-active one.
  const usedCounts = new Map<string, number>();
  for (const p of placed) {
    usedCounts.set(p, (usedCounts.get(p) ?? 0) + 1);
  }
  const seenInBar = new Map<string, number>();
  const tileUsedFlags: boolean[] = step.tiles.map((tile) => {
    const seenSoFar = seenInBar.get(tile) ?? 0;
    seenInBar.set(tile, seenSoFar + 1);
    const usedTotal = usedCounts.get(tile) ?? 0;
    return seenSoFar < usedTotal;
  });

  const isCorrect = JSON.stringify(placed) === JSON.stringify(step.correctOrder);

  function addTile(tile: string, originalIndex: number) {
    if (submitted) return;
    if (tileUsedFlags[originalIndex]) return;
    setPlaced((prev) => [...prev, tile]);
  }

  function removeTile(index: number) {
    if (submitted) return;
    setPlaced((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setSubmitted(true);
    onComplete(step.id, isCorrect);
    if (isCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
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

      <div className="relative flex flex-wrap gap-2">
        {step.tiles.map((tile, i) => {
          const used = tileUsedFlags[i];
          return (
            <button
              key={`tile-${i}`}
              type="button"
              disabled={submitted || used}
              onClick={() => addTile(tile, i)}
              aria-pressed={used}
              className={
                used
                  ? "rounded-xl border-[1.5px] border-border bg-surface-muted px-3.5 py-1.5 text-base font-medium text-text-muted opacity-40"
                  : "rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-1.5 text-base font-medium text-text-primary transition-colors duration-150 hover:border-accent disabled:opacity-50"
              }
            >
              <AnnotatedJa text={tile} />
            </button>
          );
        })}
        {celebrating && <CelebrationToast text={celebrationText} />}
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
      ) : celebrating ? (
        <div className="invisible" aria-hidden>
          <ContinueButton onClick={() => {}} />
        </div>
      ) : (
        <ContinueButton
          onClick={onContinue}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}
    </div>
  );
}
