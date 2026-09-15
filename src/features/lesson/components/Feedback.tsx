import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

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
  /**
   * Fourth tone: NOT-YET-correct, but one forgivable slip away — amber, and
   * critically it never reveals `correctAnswer`, because the learner is
   * about to try again in the same tray (Spencer m31 walk 2026-08-15: "one
   * missing word is forgivable by a 'so close' yellow error, allowing the
   * missing word to be slot in").
   *
   * Distinct from `flagged`, which is amber over a WIN. This one is amber
   * over an unfinished attempt: same palette, opposite verdict, so it takes
   * the warning triangle rather than the success check — icon plus text
   * carry the state, never colour alone. Wins over every other tone.
   */
  soClose?: boolean;
  /** Ready-to-render nudge for the soClose tone, e.g. "One word is missing." */
  soCloseNote?: ReactNode;
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
  soClose = false,
  soCloseNote,
}: Props) {
  const { t } = useTranslation();
  const isFlagged = !soClose && correct && flagged;
  const showNote = !soClose && correct && !isFlagged && note !== undefined;
  // On a WIN the explanation is optional reading — collapse it behind a
  // disclosure (Spencer 2026-08-20, on the micro-sim verdict: "we can just
  // say correct and have a 'view explanation' button or something inside
  // the correct bubble"). On a MISS the why stays inline: the learner
  // needs it, and it's the moment they'll actually read it.
  const [explanationShown, setExplanationShown] = useState(false);
  const explanationCollapsible = correct && !soClose;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl border-[1.5px] ${
        // TestFlight #89 (Spencer, b13 2026-09-15 — "There should be no
        // scroll here, so close should shrink text size and fix the box
        // smaller"): the so-close nudge is a one-line hint, not a verdict —
        // it stacked a 20px title over a two-line 16px note inside py-4 and
        // pushed a 15-tile build step into a scroll on a 430×932 phone.
        // Compact: title and note share one wrapped line at 14px, half the
        // padding. Measured on the 13-tile ja-m31-neo-1 build step: card
        // 118px → 63px at 390×844 (92px → 63px at 430×932), lesson-stage
        // overflow 63px → 0 at 390×844. The wrong-answer banner keeps its
        // full size (it has to show the correct sentence).
        soClose ? "mt-2 px-4 py-2.5 text-sm" : "mt-4 px-5 py-4 text-sm"
      } ${
        soClose || isFlagged
          ? "border-warning bg-warning/10 text-warning"
          : correct
            ? "border-success bg-success/15 text-success"
            : "border-error bg-error/10 text-error"
      }`}
    >
      <div className={soClose ? "flex flex-wrap items-center gap-x-2 gap-y-0.5" : "flex items-center gap-2"}>
        <svg
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          {soClose ? (
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3.5L22 20.5H2L12 3.5z"
                strokeWidth={2}
              />
              <path strokeLinecap="round" d="M12 10v4M12 17.2v.1" />
            </>
          ) : correct ? (
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
        <span className={soClose ? "text-sm font-bold" : "text-base font-bold"}>
          {soClose
            ? t("lesson.feedback.soClose", "So close")
            : correct
              ? t("lesson.feedback.correct", "Correct!")
              : t("lesson.feedback.notQuite", "Not quite")}
        </span>
        {soClose && soCloseNote !== undefined && (
          <span className="text-sm leading-snug">{soCloseNote}</span>
        )}
      </div>
      {isFlagged && flaggedNote !== undefined && (
        <p className="mt-2 text-base leading-relaxed">{flaggedNote}</p>
      )}
      {showNote && <p className="mt-2 text-base leading-relaxed">{note}</p>}
      {!soClose && !correct && correctAnswer !== undefined && (
        <p className="mt-2 text-base leading-relaxed">
          <span className="opacity-80">{t("lesson.feedback.correctAnswerLabel", "Correct answer: ")}</span>
          <span className="text-lg font-semibold text-text-primary">{correctAnswer}</span>
        </p>
      )}
      {explanation &&
        (explanationCollapsible && !explanationShown ? (
          <button
            type="button"
            onClick={() => setExplanationShown(true)}
            className="mt-1.5 block text-sm font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            {t("lesson.feedback.viewExplanation", "View explanation")}
          </button>
        ) : (
          <p className="mt-1.5 leading-relaxed opacity-90">{explanation}</p>
        ))}
    </div>
  );
}
