import { useEffect } from "react";
import type { RuleHint } from "../types";
import { SceneView } from "./steps/SceneView";

/**
 * Learner-initiated rule peek ("See the rule").
 *
 * Spencer 2026-08-18: "maybe we make a 'see the rule' button similar to our
 * conjugation lessons and they can view it for a hint. this is an amazing
 * check we allow people to do a few times that helps aid learning a little
 * more dynamically."
 *
 * The budget lives in LessonPage, not here — this component only renders what
 * a peek shows. When the point is taught by a picture the peek IS the picture,
 * fully interactive: the learner can flip the direction and watch the verb
 * follow, which is the same manipulation the rule card offered.
 *
 * Keyboard handling mirrors ReactiveGrammarTipCard: step views listen for
 * Enter on document (useLessonKeyboard), so without a capture-phase swallow a
 * habitual Enter would advance the lesson BEHIND the open modal.
 */
export function RuleHintCard({
  hint,
  remaining,
  onDismiss,
}: {
  hint: RuleHint;
  /** Peeks left AFTER this one, shown so the budget is never a surprise. */
  remaining: number;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        onDismiss();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-hint-title"
    >
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-[1.5px] border-border bg-surface p-5 shadow-popover motion-safe:animate-fade-up">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            The rule
          </p>
          {/* The counter only exists where peeks are RATIONED. Grammar review
              passes Infinity — the card is something the learner was already
              taught there, so capping it would just make them guess — and
              "Infinity peeks left" is not a sentence. */}
          {Number.isFinite(remaining) && (
            <p className="text-xs font-semibold text-text-muted">
              {remaining} {remaining === 1 ? "peek" : "peeks"} left
            </p>
          )}
        </div>
        <h2
          id="rule-hint-title"
          className="mt-1 text-xl font-bold text-text-primary"
        >
          {hint.title}
        </h2>

        {hint.scene ? (
          <div className="mt-3">
            <SceneView
              spec={hint.scene}
              scopeId={`hint-${hint.grammarPointId}`}
            />
          </div>
        ) : (
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            {hint.ruleLine}
          </p>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-xl bg-accent px-4 py-3 font-bold text-accent-foreground transition hover:bg-accent-hover"
        >
          Back to the question
        </button>
      </div>
    </div>
  );
}
