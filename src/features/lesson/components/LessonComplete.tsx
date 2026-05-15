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
      {perfect ? <Icon name="partyPopper" size={48} className="text-accent" /> : <Icon name="check" size={48} className="text-success" strokeWidth={3} />}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {isReview
          ? t("lesson.reviewComplete", "Review Complete!")
          : t("lesson.complete", "Lesson Complete!")}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">{lesson.title}</p>
      {isReview && (
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
          Review run — reduced XP
        </span>
      )}

      <div className="flex items-center gap-8">
        <Stat
          label={t("lesson.accuracy", "Accuracy")}
          value={`${percent}%`}
          accent={percent >= 80}
        />
        <Stat label={t("lesson.xpEarned", "XP earned")} value={`+${xp}`} accent />
        <Stat
          label={t("lesson.score", "Score")}
          value={`${correctCount}/${totalGraded}`}
          accent={false}
        />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-4 rounded-xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {t("lesson.continue", "Continue")}
      </button>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`text-2xl font-bold ${accent ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}
      >
        {value}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}
