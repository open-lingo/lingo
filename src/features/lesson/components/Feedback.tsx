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
  /**
   * Third tone: correct-but-nudge (e.g. the learner dropped the accents).
   * Renders the warning (amber) palette with the success check + "Correct!"
   * headline — it must still read as a win. Ignored when `correct` is false.
   */
  flagged?: boolean;
  /**
   * Ready-to-render nudge line for the flagged tone, e.g.
   * "Watch the accents: <b>años</b>". Callers own formatting/lang attrs,
   * same contract as `correctAnswer`. Only rendered when flagged.
   */
  flaggedNote?: ReactNode;
  /**
   * Informational line on a CORRECT answer that is NOT a correction — it
   * keeps the success palette rather than swapping to amber. The register
   * pair is the motivating case (Spencer 2026-07-24: politeness "will never
   * be a choice, we will accept either answer, show them both"): both
   * renderings are fully right, so flagging one amber would wrongly mark it
   * as the lesser answer. Ignored when `correct` is false or `flagged` won.
   */
  note?: ReactNode;
};

/**
 * Soft post-submit banner. Correct is always semantic success green — never
 * the brand accent, which can itself be red/warm (see theme presets) and
 * would then read as an error. Incorrect uses a muted error palette; never
 * blaring red. The flagged tone swaps in the warning palette but keeps the
 * success iconography. Icon + text verdict together (never color alone) so
 * the state survives color-blindness and screenshots.
 */
export function Feedback({
  correct,
  explanation,
  correctAnswer,
  flagged = false,
  flaggedNote,
  note,
}: Props) {
  const isFlagged = correct && flagged;
  const showNote = correct && !isFlagged && note !== undefined;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`mt-4 rounded-2xl border-[1.5px] px-5 py-4 text-sm ${
        isFlagged
          ? "border-warning bg-warning/10 text-warning"
          : correct
            ? "border-success bg-success/15 text-success"
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
      {isFlagged && flaggedNote !== undefined && (
        <p className="mt-2 text-base leading-relaxed">{flaggedNote}</p>
      )}
      {showNote && <p className="mt-2 text-base leading-relaxed">{note}</p>}
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
