import { useCallback, useState } from "react";
import type { KanjiRevealStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { RevealChoreo } from "./kanjiReveal/KanjiRevealAnimation";

/**
 * Step 1 of the kana→kanji switchover beat (B061) — the introduction.
 *
 * UNGRADED by design: the retrieval is the cloze that follows. `onComplete` is
 * called with `correct: true` on continue so the lesson's accuracy is unaffected
 * — this step must not be able to lower a score, the same way an `info` step
 * cannot.
 *
 * **Continue is held until the animation finishes.** That is the one mitigation
 * this step carries for a documented risk: both learners in the simulation
 * (`docs/kanji-switchover-distributed-spec-2026-07-28.md` §6c) tapped straight
 * past an ungraded card, reporting that ungraded reads as "not going to be tested
 * on this". Gating the button costs no extra step and no grading, and it
 * guarantees the reveal is on screen for its full duration. It does NOT guarantee
 * the learner attended to it — that is why the graded cloze comes next rather
 * than instead.
 *
 * Deliberately no replay control. A reveal the learner can re-trigger invites
 * fiddling with an animation instead of moving on to the retrieval, and the word
 * is about to be shown again in the cloze anyway.
 */
export function KanjiRevealStepView({
  step,
  onComplete,
  onContinue,
}: {
  step: KanjiRevealStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
}) {
  const [done, setDone] = useState(false);

  const finish = useCallback(() => {
    if (!done) return;
    onComplete(step.id, true);
    onContinue();
  }, [done, onComplete, onContinue, step.id]);

  useLessonKeyboard({ onEnter: finish });

  return (
    <div className="relative flex flex-1 flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          You already know this word
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Here is how it’s written.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <RevealChoreo
          word={{
            kana: step.kana,
            kanji: step.kanji,
            gloss: step.gloss,
            parts: step.parts ?? [],
          }}
          replayKey={0}
          onDone={() => setDone(true)}
        />
      </div>

      {/* Bottom-anchored so the CTA sits in the same slot as every other step
          type and does not move when it enables. */}
      <div className="mt-auto flex flex-col gap-4 pt-6">
        <ContinueButton onClick={finish} disabled={!done} />
      </div>
    </div>
  );
}
