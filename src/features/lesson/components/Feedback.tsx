import type { ReactNode } from "react";

type Props = {
  correct: boolean;
  explanation?: string;
  /**
   * The verbatim right answer, shown prominently inside the banner on a
   * miss. On a wrong answer this is the single most important thing on
   * screen — it belongs in the verdict banner at reading size, not in a
   * muted footnote below it. Callers pass a ready-to-render node so
   * language attributes (lang="ja") and formatting stay theirs.
   */
  correctAnswer?: ReactNode;
};

/**
 * Soft post-submit banner. Uses the accent token for correct (matching the
 * "tinted selected" treatment on option pills) and a muted error palette for
 * incorrect — never blaring red. Icon + text verdict together (never color
 * alone) so the state survives color-blindness and screenshots.
 */
export function Feedback({ correct, explanation, correctAnswer }: Props) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`mt-4 rounded-2xl border-[1.5px] px-5 py-4 text-sm ${
        correct
          ? "border-accent bg-accent-muted text-accent"
          : "border-error bg-error/10 text-error"
      }`}
    >
      <div className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          {correct ? (
            <>
              <circle cx="12" cy="12" r="9.5" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.5 2.5 4.5-5" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="9.5" strokeWidth={2} />
              <path strokeLinecap="round" d="M9 9l6 6M15 9l-6 6" />
            </>
          )}
        </svg>
        <span className="text-base font-bold">{correct ? "Correct!" : "Not quite"}</span>
      </div>
      {!correct && correctAnswer !== undefined && (
        <p className="mt-2 text-base leading-relaxed">
          <span className="opacity-80">Correct answer: </span>
          <span className="text-lg font-semibold text-text-primary">{correctAnswer}</span>
        </p>
      )}
      {explanation && <p className="mt-1.5 leading-relaxed opacity-90">{explanation}</p>}
    </div>
  );
}
