import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Button } from "@/shared/components/ui";
import type { LessonContent } from "../types";

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
  onContinue: () => void;
  /** True when the learner is replaying an already-completed lesson. */
  isReview?: boolean;
  /** XP multiplier — 1 for a fresh completion, < 1 for a review replay. */
  xpMultiplier?: number;
  mastery?: LessonCompleteMastery;
};

export function LessonComplete({
  lesson,
  correctCount,
  totalGraded,
  onContinue,
  isReview = false,
  xpMultiplier = 1,
  mastery,
}: Props) {
  const { t } = useTranslation();
  const percent = totalGraded > 0 ? Math.round((correctCount / totalGraded) * 100) : 100;
  const baseXp = lesson.xpReward ?? 10;
  const xp = Math.max(1, Math.round(baseXp * xpMultiplier));
  const perfect = correctCount === totalGraded;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-accent bg-accent-muted text-accent">
        {perfect ? (
          <Icon name="partyPopper" size={40} />
        ) : (
          <Icon name="check" size={40} strokeWidth={3} />
        )}
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
        {isReview
          ? t("lesson.reviewComplete", "Review Complete!")
          : t("lesson.complete", "Lesson Complete!")}
      </h1>
      <p className="text-base text-text-secondary">{lesson.title}</p>
      {isReview && (
        <span className="rounded-full border-[1.5px] border-accent bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
          Review run — reduced XP
        </span>
      )}

      <div className="flex w-full items-center justify-around gap-4 rounded-2xl border-[1.5px] border-border bg-surface px-6 py-5 shadow-[var(--shadow-card)]">
        <Stat
          label={t("lesson.accuracy", "Accuracy")}
          value={`${percent}%`}
          accent={percent >= 80}
        />
        <div className="h-10 w-px bg-border" aria-hidden />
        <Stat label={t("lesson.xpEarned", "XP earned")} value={`+${xp}`} accent />
        <div className="h-10 w-px bg-border" aria-hidden />
        <Stat
          label={t("lesson.score", "Score")}
          value={`${correctCount}/${totalGraded}`}
          accent={false}
        />
      </div>

      {mastery ? (
        <div
          className={`w-full rounded-2xl border-[1.5px] px-5 py-4 text-sm shadow-[var(--shadow-card)] ${
            mastery.justMastered
              ? "border-warning bg-warning/10 text-warning"
              : "border-border bg-surface-muted text-text-secondary"
          }`}
        >
          {mastery.justMastered ? (
            <p className="m-0 text-base font-extrabold">
              {t("lesson.moduleMastered", {
                defaultValue: "★ Module mastered — {{module}}",
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

      <Button
        variant="primary-3d"
        onClick={onContinue}
        className="mt-4 w-full"
      >
        {t("lesson.continue", "Continue")}
      </Button>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span
        className={`text-2xl font-extrabold tracking-tight ${accent ? "text-accent" : "text-text-primary"}`}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
}
