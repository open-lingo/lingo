import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { LessonContent } from "../types";

type Props = {
  lesson: LessonContent;
  correctCount: number;
  totalGraded: number;
  onContinue: () => void;
  /** True when the learner is replaying an already-completed lesson. */
  isReview?: boolean;
  /** XP multiplier — 1 for a fresh completion, < 1 for a review replay. */
  xpMultiplier?: number;
};

export function LessonComplete({
  lesson,
  correctCount,
  totalGraded,
  onContinue,
  isReview = false,
  xpMultiplier = 1,
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

      <button
        type="button"
        onClick={onContinue}
        className="mt-4 w-full rounded-xl border-[1.5px] border-accent-hover bg-accent px-8 py-3.5 text-base font-bold uppercase tracking-wide text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]"
      >
        {t("lesson.continue", "Continue")}
      </button>
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
