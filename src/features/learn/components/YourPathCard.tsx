import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Button, Card, ProgressRing } from "@/shared/components/ui";
import type { Course } from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getNextLessonIndex,
} from "../moduleProgress";

export type YourPathCardProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  streakDays: number;
  /** Active module (the one currently in focus on the map). */
  onResume: () => void;
  /** Click a module row to jump the map to it. */
  onJumpToModule: (moduleId: string) => void;
  /** Show the start-over CTA when the user has progress to wipe. */
  onStartOver: () => void;
};

/**
 * Consolidated "Your Path" hero card. Replaces the standalone course-
 * progress card *and* the old plain "Your path" card in LearnPage.
 *
 * Layout:
 *   [emoji ring]  Title + meta              [streak chip]
 *                 Progress bar (course)
 *   [Resume current lesson]    [more options]
 *
 *   ---------------------- divider ----------------------
 *   "All modules" strip — every non-coming-soon module as a row:
 *     M{n}  Module title          [fluency bar] {pct}%
 *
 * Mobile collapses the strip into a "Show all modules" toggle to keep
 * the card scannable.
 */
export function YourPathCard({
  course,
  completedSet,
  streakDays,
  onResume,
  onJumpToModule: _onJumpToModule,
  onStartOver,
}: YourPathCardProps) {
  const { t } = useTranslation();

  const currentIdx = getCurrentModuleIndex(course, completedSet);
  const currentModule = course.modules[currentIdx];

  const stats = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const mod of course.modules) {
      total += mod.lessons.length;
      done += mod.lessons.filter((l) => completedSet.has(l.id)).length;
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [course.modules, completedSet]);

  const currentModuleStats = useMemo(() => {
    if (!currentModule) return { done: 0, total: 0, pct: 0 };
    const total = currentModule.lessons.length;
    const done = currentModule.lessons.filter((l) =>
      completedSet.has(l.id),
    ).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [currentModule, completedSet]);

  const nextLessonIdx = currentModule
    ? getNextLessonIndex(currentModule.lessons, completedSet)
    : 0;
  const nextLesson = currentModule?.lessons[nextLessonIdx];

  const hasProgress = stats.done > 0;

  return (
    <Card padding="lg" className="mb-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("learn.progressCard.kicker", { defaultValue: "Your path" })}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-text-primary sm:text-xl">
              {currentModule ? currentModule.title : course.title}
            </h2>
            {currentModule?.summary ? (
              <p className="mt-0.5 text-sm text-text-secondary">
                {currentModule.summary}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ProgressRing
              percent={stats.pct}
              label={`${stats.done}/${stats.total}`}
              sublabel={t("learn.progressCard.lessonsSub", {
                defaultValue: "lessons",
              })}
            />
            {streakDays > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1.5 text-sm font-bold text-warning">
                <Icon name="flame" size={16} aria-hidden />
                {t("learn.progressCard.streakChip", {
                  defaultValue: "{{count}}-day streak",
                  count: streakDays,
                })}
              </span>
            ) : null}
          </div>
        </div>

        {/* Course-wide progress bar — was the LearnCourseOverviewCard's bar. */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-semibold uppercase tracking-wider">
              {t("learn.progressCard.overallLabel", {
                defaultValue: "Course progress",
              })}
            </span>
            <span className="tabular-nums font-bold text-accent">
              {stats.pct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          <p className="text-[0.7rem] font-medium text-text-muted">
            {t("learn.progressCard.overallSub", {
              defaultValue: "{{done}} of {{total}} lessons across the course",
              done: stats.done,
              total: stats.total,
            })}
          </p>
        </div>

        {nextLesson ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
                {hasProgress
                  ? t("learn.progressCard.upNextLabel", {
                      defaultValue: "Up next",
                    })
                  : t("learn.progressCard.startHereLabel", {
                      defaultValue: "Start here",
                    })}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">
                {nextLesson.title}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {t("learn.progressCard.moduleProgress", {
                  defaultValue: "Module · {{done}}/{{total}} lessons",
                  done: currentModuleStats.done,
                  total: currentModuleStats.total,
                })}
              </p>
            </div>
            <Button type="button" variant="primary" onClick={onResume}>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="play" size={14} aria-hidden />
                {hasProgress
                  ? t("learn.progressCard.resume", {
                      defaultValue: "Resume",
                    })
                  : t("learn.progressCard.start", {
                      defaultValue: "Start",
                    })}
              </span>
            </Button>
          </div>
        ) : null}

        {/* The per-module fluency strip used to render here; we now
            rely on the full module list directly below the card on
            the learn page — duplicating the percentages here was just
            visual clutter. */}

        {hasProgress ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-text-secondary">
              {t("learn.startOverHint", {
                defaultValue:
                  "Want a clean slate? Reset the course path on this device.",
              })}
            </p>
            <Button type="button" variant="outline" onClick={onStartOver}>
              {t("learn.startOver", { defaultValue: "Start over" })}
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

