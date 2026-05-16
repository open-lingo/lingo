import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Button, Card } from "@/shared/components/ui";
import { cn } from "@/shared/components/ui/cn";
import type { Course } from "@/shared/domain/course";
import { getCurrentModuleIndex, getModuleStatus } from "../moduleProgress";

export type LearnCourseOverviewCardProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  onJumpToModule: (moduleId: string) => void;
};

export function LearnCourseOverviewCard({
  course,
  completedSet,
  onJumpToModule,
}: LearnCourseOverviewCardProps) {
  const { t } = useTranslation();
  const currentIdx = getCurrentModuleIndex(course, completedSet);
  const currentModule = course.modules[currentIdx];

  const visibleModules = useMemo(
    () =>
      course.modules
        .map((mod, index) => ({ mod, index }))
        .filter(({ mod }) => !mod.comingSoon),
    [course.modules],
  );

  const { lessonsDone, lessonsTotal } = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const mod of course.modules) {
      if (mod.comingSoon) continue;
      total += mod.lessons.length;
      done += mod.lessons.filter((l) => completedSet.has(l.id)).length;
    }
    return { lessonsDone: done, lessonsTotal: total };
  }, [course.modules, completedSet]);

  const progressPct =
    lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0;

  return (
    <Card as="section" padding="md" className="shadow-card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="m-0 text-sm font-semibold text-text-primary">
            {t("learn.courseOverviewTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            {t("learn.courseOverviewLessons", {
              done: lessonsDone,
              total: lessonsTotal,
            })}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-accent">
          {progressPct}%
        </span>
      </div>

      <div
        className="mb-4 flex items-center"
        role="list"
        aria-label={t("learn.courseOverviewModulesAria")}
      >
        {visibleModules.map(({ mod, index }, pos) => {
          const status = getModuleStatus(index, completedSet, course.modules);
          const isCurrent = index === currentIdx;
          const statusLabel =
            status === "completed"
              ? t("learn.courseOverviewStatusComplete")
              : status === "current"
                ? t("learn.courseOverviewStatusCurrent")
                : t("learn.courseOverviewStatusLocked");

          return (
            <div key={mod.id} className="flex min-w-0 flex-1 items-center">
              {pos > 0 ? (
                <span
                  className={cn(
                    "mx-0.5 h-0.5 min-w-[6px] flex-1 rounded-full",
                    status === "locked" ? "bg-border" : "bg-accent/40",
                  )}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                role="listitem"
                onClick={() => onJumpToModule(mod.id)}
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  status === "completed" &&
                    "border-success bg-success/15 text-success",
                  status === "current" &&
                    "border-accent bg-accent/15 text-accent ring-2 ring-accent/25",
                  status === "locked" &&
                    "border-border bg-surface-muted text-text-muted",
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={t("learn.courseOverviewModuleAria", {
                  n: index,
                  title: mod.title,
                  status: statusLabel,
                })}
              >
                {status === "completed" ? (
                  <Icon name="check" size={14} aria-hidden />
                ) : status === "locked" ? (
                  <Icon name="lock" size={12} aria-hidden />
                ) : (
                  `M${index}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {currentModule ? (
        <Button
          type="button"
          variant="outline"
          accent
          className="w-full"
          onClick={() => onJumpToModule(currentModule.id)}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="layers" size={18} aria-hidden />
            {t("learn.courseOverviewJump")}
          </span>
        </Button>
      ) : null}
    </Card>
  );
}
