import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

/**
 * The "Review Complete!" screen. Stays inline (it is the same route, not a
 * navigation) and, on the fitted mobile stage, centres itself inside the stage
 * instead of adding `py-12` the stage does not have.
 */
type Props = {
  reviewed: number;
  correct: number;
  /** There is still due/new work — offer "Review More". */
  canReviewMore: boolean;
  /**
   * There are reviewed-but-not-yet-due cards to surface — offer free review.
   * Without this the button is a silent no-op: the queue rebuilds empty and
   * re-shows this same screen.
   */
  canFreeReview: boolean;
  freeReview: boolean;
  onRestart: () => void;
  onStartFreeReview: () => void;
  hubPath: string;
  fitted: boolean;
};

export function SessionSummary({
  reviewed,
  correct,
  canReviewMore,
  canFreeReview,
  freeReview,
  onRestart,
  onStartFreeReview,
  hubPath,
  fitted,
}: Props) {
  const { t } = useTranslation();
  const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 100;
  return (
    <div
      className={`mx-auto flex max-w-md flex-col items-center gap-6 text-center ${
        fitted
          ? "min-h-0 flex-1 justify-center overflow-y-auto py-6"
          : "py-12"
      }`}
    >
      <Icon name="partyPopper" size={48} className="text-accent" />
      <h2 className="text-2xl font-bold text-text-primary">
        {t("flashcards.sessionDone", "Review Complete!")}
      </h2>
      <div className="flex gap-8">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-success">{reviewed}</span>
          <span className="text-xs text-text-muted">
            {t("flashcards.reviewed", "Reviewed")}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-success">{accuracy}%</span>
          <span className="text-xs text-text-muted">
            {t("flashcards.accuracy", "Accuracy")}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {canReviewMore ? (
          <button
            type="button"
            onClick={onRestart}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {t("flashcards.reviewMore", "Review More")}
          </button>
        ) : (
          canFreeReview && (
            <button
              type="button"
              onClick={onStartFreeReview}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Icon name="sparkles" size={16} aria-hidden />
              {t("flashcards.startFreeReview", "Start a free review")}
            </button>
          )
        )}
        <Link
          to={hubPath}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-muted"
        >
          {t("flashcards.backToHub")}
        </Link>
      </div>
      {freeReview && (
        <p className="text-xs text-text-muted">
          {t(
            "flashcards.freeReviewNote",
            "Free review shows cards before they're due. It won't change your schedule much — Good/Easy just nudge intervals.",
          )}
        </p>
      )}
    </div>
  );
}
