import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { Button } from "@/shared/components/ui";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { playSfx } from "@/shared/audio/sfx";
import { expectedXp, XP_PER_LEVEL as XP_RULES_PER_LEVEL } from "@/features/progress/xpRules";
import { Confetti } from "./Confetti";
import type { LessonContent } from "../types";

const XP_PER_LEVEL = XP_RULES_PER_LEVEL;

function prefersStillness(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.reducedMotion === "true") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animate 0 → target over ~700ms with an ease-out cubic. Renders the final
 * value immediately under reduced motion (and therefore in tests).
 */
function useCountUp(target: number): number {
  const [value, setValue] = useState(() =>
    prefersStillness() ? target : 0,
  );
  useEffect(() => {
    if (prefersStillness()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const durationMs = 700;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

/**
 * Mastery context — populated by LessonPage only when the just-finished
 * lesson contained a row_test step AND was completed without skipping.
 * Drives the post-completion mastery callout.
 */
export type LessonCompleteMastery = {
  /** Display name of the module this lesson belongs to. */
  moduleTitle: string;
  /** Row tests passed (un-skipped) in the module. */
  passed: number;
  /** Total row tests in the module. */
  total: number;
  /** True iff THIS completion crossed the mastered threshold (so the
   *  callout swaps to celebratory copy). */
  justMastered: boolean;
};

type Props = {
  lesson: LessonContent;
  correctCount: number;
  totalGraded: number;
  /** Primary "Next lesson →" action. Falls through to the exit behavior
   *  when no next lesson exists (LessonPage resolves which). */
  onContinue: () => void;
  /** True when the learner is replaying an already-completed lesson. */
  isReview?: boolean;
  /** XP multiplier — 1 for a fresh completion, < 1 for a review replay. */
  xpMultiplier?: number;
  mastery?: LessonCompleteMastery;
  /** Copy for the primary CTA. LessonPage decides between "Next lesson →"
   *  and "Back to Learn" based on whether a next lesson exists. */
  primaryLabel?: string;
  /** Count of graded steps the learner got wrong on first attempt — when
   *  > 0 the "Drill what you missed" secondary renders. */
  missedCount?: number;
  /** Handler for the "Drill what you missed" secondary. Required when
   *  `missedCount > 0`; ignored otherwise. */
  onDrillMissed?: () => void;
  /** Handler for the tertiary binge-brake "I'm done — save my XP" button.
   *  When omitted, the tertiary is hidden (used by tests / previews that
   *  don't wire the side effect). */
  onSaveAndExit?: () => void;
  /** Server-award mirror: a not-passed attempt (skipped row test or
   *  sub-threshold accuracy) earns 0 XP server-side, so the screen must
   *  show +0 and say why instead of promising a burst that never lands. */
  passed?: boolean;
  /** True when a row test was failed out ("Out of attempts" skip flow) —
   *  swaps the celebratory header for honest retry copy. */
  wasSkipped?: boolean;
};

export function LessonComplete({
  lesson,
  correctCount,
  totalGraded,
  onContinue,
  isReview = false,
  xpMultiplier = 1,
  mastery,
  primaryLabel,
  missedCount = 0,
  onDrillMissed,
  onSaveAndExit,
  passed = true,
  wasSkipped = false,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const percent = totalGraded > 0 ? Math.round((correctCount / totalGraded) * 100) : 100;
  const perfect = correctCount === totalGraded;
  // Server-formula estimate (xpRules mirrors lingo-core/app/progress/xp.py)
  // — the displayed number now matches what the batch sync will award,
  // instead of the cosmetic lesson.xpReward. Not-passed attempts award 0
  // server-side, so show 0.
  const xp = passed
    ? expectedXp({
        lessonId: lesson.id,
        perfect,
        multiplier: xpMultiplier,
      })
    : 0;
  const { stats, isReady: statsReady } = useUserStats();

  const xpShown = useCountUp(xp);
  const percentShown = useCountUp(percent);

  useEffect(() => {
    playSfx("complete");
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 py-12 text-center">
      {perfect && <Confetti />}
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-accent bg-accent-muted text-accent">
        {perfect ? (
          <Icon name="partyPopper" size={40} />
        ) : (
          <Icon name="check" size={40} strokeWidth={3} />
        )}
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        {wasSkipped
          ? t("lesson.testNotPassed", "Not this time")
          : isReview
            ? t("lesson.reviewComplete", "Review Complete!")
            : t("lesson.complete", "Lesson Complete!")}
      </h1>
      <p className="text-base text-text-secondary">{lesson.title}</p>
      {wasSkipped && (
        <span className="rounded-full border-[1.5px] border-warning/60 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
          {t(
            "lesson.testRetryHint",
            "Out of attempts — replay the test any time to master this row.",
          )}
        </span>
      )}
      {!passed && !wasSkipped && (
        <span className="rounded-full border-[1.5px] border-warning/60 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
          {t(
            "lesson.passForXpHint",
            "Score 70%+ to earn XP — drill your misses and replay.",
          )}
        </span>
      )}
      {isReview && (
        <span className="rounded-full border-[1.5px] border-accent bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
          Review run — reduced XP
        </span>
      )}
      {perfect && totalGraded > 0 && (
        <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-warning">
          {t("lesson.perfectRun", "Perfect run!")}
        </span>
      )}

      <div className="flex w-full items-center justify-around gap-4 rounded-2xl border-[1.5px] border-border bg-surface px-6 py-5 shadow-[var(--shadow-card)]">
        {/* Accuracy + Score only make sense when the lesson had graded steps.
            Exposure-only lessons (phrase cards, info) have totalGraded === 0;
            showing "100% / 0/0" reads as a bug, so collapse to XP only.
            (Trevor's exposure fix + our count-up animation values.) */}
        {totalGraded > 0 && (
          <>
            <Stat
              label={t("lesson.accuracy", "Accuracy")}
              value={`${percentShown}%`}
              accent={percent >= 80}
            />
            <div className="h-10 w-px bg-border" aria-hidden />
          </>
        )}
        <Stat
          label={t("lesson.xpEarned", "XP earned")}
          value={`+${xpShown}`}
          accent
        />
        {totalGraded > 0 && (
          <>
            <div className="h-10 w-px bg-border" aria-hidden />
            <Stat
              label={t("lesson.score", "Score")}
              value={`${correctCount}/${totalGraded}`}
              accent={false}
            />
          </>
        )}
      </div>

      {statsReady && (stats.streak > 0 || stats.xp > 0) && (
        <div className="flex w-full items-center gap-4 rounded-2xl border-[1.5px] border-border bg-surface px-5 py-4 shadow-[var(--shadow-card)]">
          {stats.streak > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-warning">
              <span aria-hidden>🔥</span>
              {stats.streak % 7 === 0
                ? t("lesson.streakMilestone", {
                    defaultValue: "{{n}} days — milestone!",
                    n: stats.streak,
                  })
                : t("lesson.streakDays", {
                    defaultValue: "{{n}} day streak",
                    n: stats.streak,
                  })}
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <div className="mb-1 flex items-baseline justify-between text-xs font-semibold">
              <span className="text-text-secondary">
                {t("lesson.levelLabel", {
                  defaultValue: "Level {{n}}",
                  n: stats.level,
                })}
              </span>
              <span className="tabular-nums text-text-muted">
                {stats.xp % XP_PER_LEVEL}/{XP_PER_LEVEL}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.min(100, ((stats.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {mastery ? (
        <div
          className={`w-full rounded-2xl border-[1.5px] px-5 py-4 text-sm shadow-[var(--shadow-card)] ${
            mastery.justMastered
              ? "border-warning bg-warning/10 text-warning"
              : "border-border bg-surface-muted text-text-secondary"
          }`}
        >
          {mastery.justMastered ? (
            <p className="m-0 flex items-center justify-center gap-2 text-base font-bold">
              <Icon name="crown" size={18} aria-hidden />
              {t("lesson.moduleMastered", {
                defaultValue: "Module mastered — {{module}}",
                module: mastery.moduleTitle,
              })}
            </p>
          ) : (
            <p className="m-0">
              <span className="font-semibold text-text-primary">
                {t("lesson.masteryProgressLabel", {
                  defaultValue: "Mastery progress",
                })}
                :{" "}
              </span>
              {t("lesson.masteryProgress", {
                defaultValue:
                  "{{passed}}/{{total}} row tests done in {{module}}",
                passed: mastery.passed,
                total: mastery.total,
                module: mastery.moduleTitle,
              })}
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex w-full flex-col gap-3">
        <Button
          variant="primary-3d"
          onClick={onContinue}
          className="w-full"
        >
          {primaryLabel ?? t("lesson.nextLesson", "Next lesson →")}
        </Button>

        {missedCount > 0 && onDrillMissed && (
          <Button
            variant="outline"
            accent
            onClick={onDrillMissed}
            className="w-full"
          >
            {t("lesson.drillMissed", {
              defaultValue: "Drill what you missed ({{n}})",
              n: missedCount,
            })}
          </Button>
        )}

        {!isReview && (
          <Button
            variant="outline"
            onClick={() => navigate(langPath("practice/flashcards/review"))}
            className="w-full"
          >
            {t("lesson.reviewWords", "Review your words →")}
          </Button>
        )}

        {onSaveAndExit && (
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              onClick={onSaveAndExit}
              className="w-full text-text-secondary"
            >
              {t("lesson.saveAndExit", "I'm done — save my XP")}
            </Button>
            <span className="text-xs text-text-muted">
              {t(
                "lesson.saveAndExitHint",
                "Locked in — see you tomorrow.",
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span
        className={`text-2xl font-bold tracking-tight ${accent ? "text-accent" : "text-text-primary"}`}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
}
