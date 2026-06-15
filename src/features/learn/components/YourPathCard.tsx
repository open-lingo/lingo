import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Button } from "@/shared/components/ui";
import type { Course } from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getNextLessonIndex,
} from "../moduleProgress";

export type YourPathCardProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  /** Count of modules with reviews due — renders a chip in the header. */
  dueReviews?: number;
  /** Click the reviews-due chip — jumps into the first due review. */
  onReviewsClick?: () => void;
  /** Active module (the one currently in focus on the map). */
  onResume: () => void;
  /** Click a module row to jump the map to it. */
  onJumpToModule: (moduleId: string) => void;
  /** Show the start-over CTA when the user has progress to wipe. */
  /** Kept on the prop surface for back-compat; the actual control lives
   *  at the bottom of LearnPage now + in settings. Unused inside this
   *  card. */
  onStartOver?: () => void;
};

/**
 * Consolidated "Your Path" hero card. Replaces the standalone course-
 * progress card *and* the old plain "Your path" card in LearnPage.
 *
 * Layout:
 *   Course title
 *   Progress bar (course)
 *   [Up next: active module + next lesson]    [Resume]
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
  dueReviews = 0,
  onReviewsClick,
  onResume,
  onJumpToModule: _onJumpToModule,
  onStartOver: _onStartOver,
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
    // Bare section — the parent LearnPage wraps this PLUS the module map
    // in a single shared `<Card>` outer chrome so the path summary and
    // module list read as one block. No border/background of our own.
    <section className="pb-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-text-primary sm:text-xl">
              {course.title}
            </h2>
          </div>
          {dueReviews > 0 ? (
            <button
              type="button"
              onClick={onReviewsClick}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning transition hover:bg-warning/20"
              aria-label={t("learn.reviewsDueAria", {
                defaultValue: "{{count}} module reviews due",
                count: dueReviews,
              })}
            >
              <Icon name="refresh" size={14} aria-hidden />
              {t("learn.reviewsDue", {
                defaultValue:
                  dueReviews === 1
                    ? "{{count}} review due"
                    : "{{count}} reviews due",
                count: dueReviews,
              })}
            </button>
          ) : null}
        </div>

        {/* Course-wide progress bar. Lesson count rides next to the label so
            the block stays to two tight rows. */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
            <span className="min-w-0 truncate font-semibold uppercase tracking-wider">
              {t("learn.progressCard.overallLabel", {
                defaultValue: "Course progress",
              })}
              <span className="ml-2 font-medium normal-case tracking-normal text-text-muted">
                {stats.done}/{stats.total}{" "}
                {t("learn.progressCard.lessonsWord", { defaultValue: "lessons" })}
              </span>
            </span>
            <span className="shrink-0 tabular-nums font-bold text-accent">
              {stats.pct}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
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
                  defaultValue: "{{module}} · {{done}}/{{total}} lessons",
                  module: currentModule?.title ?? "",
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

        {/* Start-over moved to a low-key footer link at the very bottom of
            the learn page. The settings page also exposes it for clarity. */}
      </div>
    </section>
  );
}

