import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card } from "@/shared/components/ui";
import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { LessonProgressBar } from "@/features/lesson/components/LessonProgressBar";
import { reportGradedAnswer, resetLessonJuice } from "@/features/lesson/juice";
import { useLangPath } from "@/shared/hooks/useLangPath";
import {
  buildGrammarReviewQueue,
  getActiveGrammarPoints,
  nextGrammarDue,
  type NextGrammarDue,
} from "@/features/flashcards/engine/grammarSrs";
import { getToday } from "@/features/flashcards/engine/srs";
import { getGrammarPool } from "@/features/lesson/data/grammarReviewPools";
import {
  useGrammarReviewSession,
  type GrammarSessionSummary,
} from "./useGrammarReviewSession";

/**
 * Practice-page grammar review session. Renders one rotating example step per
 * due grammar point via the shared `StepRenderer`, grading into Track B. The
 * session logic lives entirely in `useGrammarReviewSession`; this page is the
 * shell, and it mirrors the lesson player's chrome (2026-07-06 parity pass):
 * X-out exit, standard `LessonProgressBar` + explicit review count (review
 * queues keep their counts — see LessonProgressBar's doc), answer juice,
 * per-step focus management, keyboard hints. Steps render with
 * `surface="grammarReview"` so cloze views show their English gloss
 * pre-answer and rule prefaces use the compact refresher variant.
 *
 * `?practice=1` runs the no-SRS "practice anyway" variant for caught-up
 * learners: the queue widens to not-yet-due points and nothing is scheduled
 * (learn-ahead parity). The caught-up empty state offers it alongside the
 * next-due time so "no grammar due" is an answer, not a dead end.
 */
export function GrammarReviewSessionPage() {
  const [searchParams] = useSearchParams();
  const practice = searchParams.get("practice") === "1";
  // Nonce remount lets the summary's "keep going" CTA start a fresh session
  // (the hook builds its queue once per mount).
  const [runNonce, setRunNonce] = useState(0);
  return (
    <SessionRunner
      key={`${practice ? "practice" : "due"}-${runNonce}`}
      practice={practice}
      onRunAgain={() => setRunNonce((n) => n + 1)}
    />
  );
}

function SessionRunner({
  practice,
  onRunAgain,
}: {
  practice: boolean;
  onRunAgain: () => void;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const session = useGrammarReviewSession({ practice });
  const backPath = langPath("practice/grammar");

  const stepContainerRef = useRef<HTMLDivElement>(null);
  const stepMountedRef = useRef(false);

  // Fresh combo/sfx state per session (lesson parity).
  useEffect(() => {
    resetLessonJuice();
  }, []);

  const { currentStep, progress } = session;

  // Pull focus to the step container on step change (lesson parity — keeps
  // keyboard flow and screen readers anchored). Skip the initial mount.
  useEffect(() => {
    if (!stepMountedRef.current) {
      stepMountedRef.current = true;
      return;
    }
    requestAnimationFrame(() => {
      stepContainerRef.current?.focus();
      stepContainerRef.current?.scrollTo?.(0, 0);
    });
  }, [progress.current, session.isReplayRun, session.replayRemaining]);

  if (session.phase === "summary" && session.summary) {
    return (
      <SummaryView
        summary={session.summary}
        onDone={() => navigate(backPath)}
        onPracticeAnyway={() => setSearchParams({ practice: "1" })}
        onRunAgain={onRunAgain}
      />
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))] w-full max-w-2xl flex-col">
      <div className="flex w-full items-center gap-4 py-3">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="-ml-1 rounded-xl p-2.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          aria-label={t("practice.grammarReview.exit", "Exit review")}
        >
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.25}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <LessonProgressBar current={progress.current} total={progress.total} />
        {/* Review queues keep their explicit counts (unlike fixed-arc
            lessons) — the queue length is information, not busywork. */}
        <span className="tabular-nums text-xs font-semibold text-text-muted">
          {progress.current}/{progress.total}
        </span>
        {practice && (
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {t("practice.grammarReview.practiceChip", "Practice")}
          </span>
        )}
      </div>

      {session.isReplayRun && (
        <div className="mb-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-warning">
          {t("practice.grammarReview.replayCount", {
            defaultValue: "Review · {{count}} left",
            count: session.replayRemaining,
          })}
        </div>
      )}

      <div
        ref={stepContainerRef}
        tabIndex={-1}
        aria-label={t("practice.grammarReview.stepContainer", "Review step")}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2 outline-none [container-type:size]"
      >
        <div className="flex w-full flex-1 flex-col">
          {currentStep && (
            <StepRenderer
              // Force a clean remount per step (mirrors LessonPage) so no
              // carry-over selection/submit flag bleeds across items or into
              // the ungraded replay pass.
              key={
                session.isReplayRun
                  ? `${currentStep.id}-replay`
                  : `${currentStep.id}-${progress.current}`
              }
              step={currentStep}
              onComplete={(stepId, correct, progressTicks) => {
                // Rule prefaces never call onComplete, so every call here is
                // a scored attempt — safe to drive combo/sfx directly.
                reportGradedAnswer(stepId, correct);
                session.onStepComplete(stepId, correct, progressTicks);
              }}
              onContinue={session.onContinue}
              isReplayRun={session.isReplayRun}
              surface="grammarReview"
            />
          )}
        </div>
      </div>

      {/* Desktop-only keyboard hint (lesson parity — the shortcuts have
          always worked here via useLessonKeyboard in the step views). */}
      <div className="hidden items-center justify-center gap-5 py-1.5 text-xs text-text-muted sm:flex">
        <span>
          <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">
            Enter
          </kbd>{" "}
          {t("lesson.kbdHintEnter", "check / continue")}
        </span>
        <span>
          <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">
            1–9
          </kbd>{" "}
          {t("lesson.kbdHintNumbers", "choose an option")}
        </span>
      </div>
    </div>
  );
}

/** Whole days from today to a future YYYY-MM-DD (≥1; noon-UTC anchored). */
function daysUntil(dueDate: string): number {
  const ms =
    new Date(`${dueDate}T12:00:00Z`).getTime() -
    new Date(`${getToday()}T12:00:00Z`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function SummaryView({
  summary,
  onDone,
  onPracticeAnyway,
  onRunAgain,
}: {
  summary: GrammarSessionSummary;
  onDone: () => void;
  onPracticeAnyway: () => void;
  onRunAgain: () => void;
}) {
  const { t } = useTranslation();
  const nothingDue =
    !summary.practiceOnly && summary.reviewed === 0 && summary.remainingDue === 0;

  // Caught-up context, computed only when we actually show the empty state:
  // when the next point falls due, and whether a practice session would have
  // any content (reviewed-but-not-due points; a learner with NO grammar state
  // at all gets lesson guidance instead of a dead button).
  const caughtUp = useMemo<{
    nextDue: NextGrammarDue | null;
    practicable: boolean;
    anyActive: boolean;
  } | null>(() => {
    if (!nothingDue && !(summary.practiceOnly && summary.reviewed === 0)) {
      return null;
    }
    const hasPool = (id: string) => getGrammarPool(id).length > 0;
    const free = buildGrammarReviewQueue(undefined, undefined, {
      hasPool,
      includeNotDue: true,
    });
    return {
      nextDue: nextGrammarDue(undefined, { hasPool }),
      practicable: free.queue.length > 0,
      // "No grammar points unlocked yet" must be checked against the
      // ACTIVE-POINTS list, not queue length — the widened queue can be
      // legitimately empty for a learner with unlocked points (e.g. the
      // daily new-intake cap is spent but nothing carries state yet), and
      // the zero-state copy was lying in that window (QA 2026-07-11).
      anyActive:
        getActiveGrammarPoints().filter((p) => hasPool(p.id)).length > 0,
    };
  }, [nothingDue, summary.practiceOnly, summary.reviewed]);

  // A practice session that found nothing (fresh profile → deep link).
  const nothingToPractice = summary.practiceOnly && summary.reviewed === 0;

  const showMoreWaiting = !summary.practiceOnly && summary.newWaiting > 0;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 text-center">
      <Card padding="lg" className="w-full">
        <h1 className="text-2xl font-bold text-text-primary">
          {nothingDue || nothingToPractice
            ? t("practice.grammarReview.allDoneTitle", {
                defaultValue: "No grammar due",
              })
            : summary.practiceOnly
              ? t("practice.grammarReview.practiceSummaryTitle", {
                  defaultValue: "Practice complete",
                })
              : t("practice.grammarReview.summaryTitle", {
                  defaultValue: "Session complete",
                })}
        </h1>
        {nothingDue || nothingToPractice ? (
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              {caughtUp?.nextDue
                ? daysUntil(caughtUp.nextDue.dueDate) === 1
                  ? t("practice.grammarReview.nextDueTomorrow", {
                      defaultValue_one: "You're caught up — {{count}} point falls due tomorrow.",
                      defaultValue_other:
                        "You're caught up — {{count}} points fall due tomorrow.",
                      count: caughtUp.nextDue.count,
                    })
                  : t("practice.grammarReview.nextDueInDays", {
                      defaultValue_one:
                        "You're caught up — the next point falls due in {{days}} days.",
                      defaultValue_other:
                        "You're caught up — the next {{count}} points fall due in {{days}} days.",
                      count: caughtUp.nextDue.count,
                      days: daysUntil(caughtUp.nextDue.dueDate),
                    })
                : caughtUp?.practicable
                  ? t("practice.grammarReview.allDoneBody", {
                      defaultValue:
                        "Nothing to review right now. Come back after your next lesson.",
                    })
                  : caughtUp?.anyActive
                    ? t("practice.grammarReview.intakeDone", {
                        defaultValue:
                          "Nothing more to pull today — new grammar intake is paced daily. Check back tomorrow.",
                      })
                    : t("practice.grammarReview.noGrammarYet", {
                        defaultValue:
                          "No grammar points unlocked yet — complete a lesson first and they'll show up here.",
                      })}
            </p>
            {caughtUp?.practicable && (
              <div className="flex flex-col items-center gap-1">
                <Button variant="secondary" onClick={onPracticeAnyway}>
                  {t("practice.grammarReview.practiceAnyway", {
                    defaultValue: "Practice anyway",
                  })}
                </Button>
                <p className="text-xs text-text-muted">
                  {t("practice.grammarReview.practiceAnywayNote", {
                    defaultValue: "Extra practice never changes your review schedule.",
                  })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              className={`mt-4 grid gap-3 ${summary.practiceOnly ? "grid-cols-2" : "grid-cols-3"}`}
            >
              <Stat
                label={t("practice.grammarReview.reviewed", {
                  defaultValue: "Reviewed",
                })}
                value={summary.reviewed}
              />
              <Stat
                label={t("practice.grammarReview.correct", {
                  defaultValue: "Correct",
                })}
                value={summary.correct}
              />
              {!summary.practiceOnly && (
                <Stat
                  label={t("practice.grammarReview.remaining", {
                    defaultValue: "More due",
                  })}
                  value={summary.remainingDue}
                />
              )}
            </div>
            {summary.practiceOnly && (
              <p className="mt-3 text-xs text-text-muted">
                {t("practice.grammarReview.practiceOnlyNote", {
                  defaultValue:
                    "Practice only — nothing was scheduled for review.",
                })}
              </p>
            )}
            {showMoreWaiting && (
              <div className="mt-4 flex flex-col items-center gap-2 border-t border-border pt-4">
                <p className="text-sm text-text-secondary">
                  {t("practice.grammarReview.newWaiting", {
                    defaultValue_one:
                      "{{count}} new point is waiting behind today's intake.",
                    defaultValue_other:
                      "{{count}} more new points are waiting behind today's intake.",
                    count: summary.newWaiting,
                  })}
                </p>
                <Button variant="secondary" onClick={onRunAgain}>
                  {t("practice.grammarReview.keepGoing", {
                    defaultValue: "Keep going",
                  })}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
      <Button onClick={onDone}>
        {t("practice.grammarReview.back", { defaultValue: "Back to grammar" })}
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface-muted p-3">
      <div className="text-2xl font-bold tabular-nums text-text-primary">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-text-muted">{label}</div>
    </div>
  );
}
