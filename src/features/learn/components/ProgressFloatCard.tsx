import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useUserStats } from "@/shared/hooks/useUserStats";
import type { Course } from "@/shared/domain/course";

/**
 * Compact "Your progress" overlay floated in the bottom-right corner of the
 * transit map (replaces the ProgressCard from the retired tools row on the
 * map view). Translucent surface so the scenery reads through; links out to
 * the full journey page for anything deeper than the two headline numbers.
 */
export function ProgressFloatCard({
  course,
  completedSet,
}: {
  course: Course;
  completedSet: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { stats } = useUserStats();

  const pct = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const mod of course.modules) {
      total += mod.lessons.length;
      done += mod.lessons.filter((l) => completedSet.has(l.id)).length;
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [course, completedSet]);

  return (
    <div className="pointer-events-auto absolute bottom-5 right-5 z-10 hidden w-[13.5rem] rounded-card border border-border bg-surface/90 p-3 shadow-card backdrop-blur-sm md:block">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
          <Icon name="trendingUp" size={13} className="text-accent" aria-hidden />
          {t("learn.tools.progress.title", { defaultValue: "Your progress" })}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-4">
        <div>
          <p className="text-lg font-bold leading-none tabular-nums text-text-primary">
            {pct}%
          </p>
          <p className="mt-0.5 text-[0.65rem] text-text-muted">
            {t("learn.tools.progress.completion", { defaultValue: "Course complete" })}
          </p>
        </div>
        <div>
          <p className="text-lg font-bold leading-none tabular-nums text-text-primary">
            {stats.xp.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[0.65rem] text-text-muted">
            {t("learn.tools.progress.xp", { defaultValue: "Total XP" })}
          </p>
        </div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-border" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <Link
        to={langPath("practice/journey")}
        className="mt-2 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-accent hover:text-accent-hover"
      >
        {t("learn.tools.progress.cta", { defaultValue: "Track my journey" })}
        <Icon name="arrowRight" size={12} aria-hidden />
      </Link>
    </div>
  );
}
