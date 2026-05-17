import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Button, Card } from "@/shared/components/ui";
import { cn } from "@/shared/components/ui/cn";
import type { Course } from "@/shared/domain/course";
import { getCurrentModuleIndex, getModuleStatus } from "../moduleProgress";
import { getModuleMastery } from "../moduleMastery";

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

  const { lessonsDone, lessonsTotal, masteryPassed } = useMemo(() => {
    let done = 0;
    let total = 0;
    let passed = 0;
    for (const mod of course.modules) {
      if (mod.comingSoon) continue;
      total += mod.lessons.length;
      done += mod.lessons.filter((l) => completedSet.has(l.id)).length;
      passed += getModuleMastery(mod, completedSet).passed;
    }
    return { lessonsDone: done, lessonsTotal: total, masteryPassed: passed };
  }, [course.modules, completedSet]);

  const progressPct =
    lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0;

  return (
    <Card as="section" padding="md" className="h-full shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 truncate text-base font-bold text-text-primary">
            {t("learn.courseOverviewTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {t("learn.courseOverviewLessons", {
              done: lessonsDone,
              total: lessonsTotal,
            })}
            {masteryPassed > 0 ? (
              <span
                className="ml-1 inline-flex items-center font-semibold text-warning"
                title={t("learn.courseOverviewMasteryTitle", {
                  defaultValue: "{{n}} row tests aced",
                  n: masteryPassed,
                })}
              >
                · {masteryPassed} ★
              </span>
            ) : null}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-base font-extrabold tabular-nums text-accent">
          {progressPct}%
        </span>
      </div>

      <div
        className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-muted"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div
        className="mb-3 flex items-center"
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
                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  status === "completed" &&
                    "border-success bg-success/15 text-success",
                  status === "current" &&
                    "border-accent bg-accent/20 text-accent ring-2 ring-accent/30",
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
                  <Icon name="check" size={16} aria-hidden />
                ) : status === "locked" ? (
                  <Icon name="lock" size={14} aria-hidden />
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
            <Icon name="layers" size={16} aria-hidden />
            {t("learn.courseOverviewJump")}
          </span>
        </Button>
      ) : null}
    </Card>
  );
}
