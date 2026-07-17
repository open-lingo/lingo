import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { Course } from "@/shared/domain/course";

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
 * "Your Path" header — course title + course-wide progress pinned at the
 * very top of the shared path card. The old "Up next" sub-card was removed
 * (it read as disconnected from the module list); next-up now lives INSIDE
 * the active module on the map below, so the path reads top-down as
 * "here's the course → here's where you are".
 */
export function YourPathCard({
  course,
  completedSet,
  dueReviews = 0,
  onReviewsClick,
  onResume: _onResume,
  onJumpToModule: _onJumpToModule,
  onStartOver: _onStartOver,
}: YourPathCardProps) {
  const { t } = useTranslation();

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

  return (
    // Bare section — the parent LearnPage wraps this PLUS the module map
    // in a single shared `<Card>` outer chrome so the path summary and
    // module list read as one block. No border/background of our own.
    <section className="pb-4">
      <div className="flex flex-col gap-3">
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
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>

        {/* Up-next moved INTO the active module on the map below — it now
            reads as "this is what you're learning" instead of a separate
            sub-card disconnected from course progress. Start-over is a
            low-key footer link + the settings page. */}
      </div>
    </section>
  );
}

