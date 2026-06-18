import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import type { Course, Lesson } from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getModuleDisplay,
  getModuleStatus,
  getNextLessonIndex,
  isLessonLocked,
} from "../moduleProgress";
import { buildModuleStatusPill, buildMasteryPill } from "../utils/moduleStatusPill";
import { getModuleMastery } from "../moduleMastery";
import { ModuleCard } from "./ModuleCard";
import { ModulePathway } from "./ModulePathway";
import { ModulePreview } from "./ModulePreview";
import { Button } from "@/shared/components/ui";
import { getItemsForModule } from "@/features/placement/questionBank";

/**
 * Feature flag — test-out (diagnostic skip-ahead) is live for every course
 * that ships a placement bank (JA + KO today). The button is gated per
 * module on bank existence (``moduleHasBank``), so a learner only sees
 * "Test out" where the engine actually has questions to probe — no dead
 * buttons that bounce to the "no questions yet" screen.
 *
 * On pass, ``applyPlacementResult`` marks every lesson up to and
 * including that module complete locally; ``syncTestOutToServer``
 * mirrors the same completions to /progress/lessons/batch so the
 * state travels across devices.
 */
const TEST_OUT_ENABLED = true;

/**
 * How many locked modules past the current one stay rendered as full
 * cards (the motivating "what's next" teaser). Everything beyond
 * ``currentIdx + UPCOMING_TEASER_COUNT`` collapses behind the
 * "Upcoming modules" accordion so the far curriculum doesn't read as a
 * heavy wall.
 */
const UPCOMING_TEASER_COUNT = 2;

/**
 * Split the module list into the always-visible head (completed +
 * current + the next ``UPCOMING_TEASER_COUNT`` upcoming) and the far
 * tail that collapses behind the "Upcoming modules" accordion.
 *
 * Exported for unit coverage — the split index is `currentIdx + teaser +
 * 1` (inclusive of current), clamped so a near-end course never produces
 * a tail of a single module (not worth a collapse row).
 */
export function splitUpcomingModules<T>(
  modules: T[],
  currentIdx: number,
  teaserCount: number = UPCOMING_TEASER_COUNT,
): { visible: T[]; collapsed: T[]; splitIndex: number } {
  const splitIndex = currentIdx + teaserCount + 1;
  // A single trailing module isn't worth a collapse row — fold it into
  // the visible head instead.
  if (splitIndex >= modules.length - 1) {
    return { visible: [...modules], collapsed: [], splitIndex: modules.length };
  }
  return {
    visible: modules.slice(0, splitIndex),
    collapsed: modules.slice(splitIndex),
    splitIndex,
  };
}

/** On-the-line grouping for the module list: completed (before current) /
 *  in-progress (current) / upcoming (after current). Pure + exported for
 *  unit coverage; the map inserts a lightweight label whenever this value
 *  changes between adjacent modules. */
export type ModuleGroup = "completed" | "current" | "upcoming";
export function moduleGroup(index: number, currentIdx: number): ModuleGroup {
  return index < currentIdx
    ? "completed"
    : index === currentIdx
      ? "current"
      : "upcoming";
}

export type LearnCourseMapProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  devUnlock: boolean;
  langPath: (path: string) => string;
  isModuleOpen: (moduleId: string) => boolean;
  onToggleModule: (moduleId: string) => void;
  onLessonClick: (lesson: Lesson) => void;
  /** Set of module ids the parent wants force-revealed even if they live
   *  in the collapsed "Upcoming" group — e.g. a jump-to-module target.
   *  Bumping this prop expands the accordion. */
  revealModuleId?: string | null;
};

export function LearnCourseMap({
  course,
  completedSet,
  devUnlock,
  langPath,
  isModuleOpen,
  onToggleModule,
  onLessonClick,
}: LearnCourseMapProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const testOutEnabled = TEST_OUT_ENABLED;
  const moduleHasBank = (moduleId: string) =>
    getItemsForModule(moduleId, course.languageId).length > 0;
  const currentIdx = getCurrentModuleIndex(course, completedSet);
  const currentModule = course.modules[currentIdx] ?? course.modules[0];
  const nextIdx = getNextLessonIndex(currentModule.lessons, completedSet);
  const currentLesson: Lesson | undefined = currentModule.lessons[nextIdx];
  const hasProgress = completedSet.size > 0;

  const { visible, collapsed } = splitUpcomingModules(
    course.modules,
    currentIdx,
  );

  const resumeCurrent = () => {
    if (currentLesson) onLessonClick(currentLesson);
  };

  /** Which lightweight on-the-line group a module belongs to — drives the
   *  "Completed" / "In progress" / "Upcoming" labels that separate the
   *  three phases of the path. */
  const groupFor = (i: number): ModuleGroup => moduleGroup(i, currentIdx);

  const groupLabel = (group: ModuleGroup) =>
    group === "completed"
      ? t("learn.group.completed", { defaultValue: "Completed" })
      : group === "current"
        ? t("learn.group.inProgress", { defaultValue: "In progress" })
        : t("learn.group.upcoming", { defaultValue: "Upcoming" });

  const GroupLabel = ({
    group,
    first,
  }: {
    group: ModuleGroup;
    first: boolean;
  }) => (
    <div
      className={`flex items-center gap-2 px-0.5 ${first ? "" : "pt-3"}`}
      role="presentation"
    >
      <span
        className={`text-[0.65rem] font-bold uppercase tracking-[0.14em] ${
          group === "current" ? "text-accent" : "text-text-muted"
        }`}
      >
        {groupLabel(group)}
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );

  const renderModule = (mod: Course["modules"][number], i: number) => {
    const status = getModuleStatus(i, completedSet, course.modules);
    const open = isModuleOpen(mod.id);
    const lessonsDone = mod.lessons.filter((l) => completedSet.has(l.id)).length;
    const display = getModuleDisplay(course.modules, i);
    const pill = buildModuleStatusPill(
      display.gateAfterLabel,
      status,
      lessonsDone,
      mod.lessons.length,
      mod.comingSoon,
    );
    const mastery = mod.comingSoon ? null : getModuleMastery(mod, completedSet);
    const masteryPill = mastery?.mastered ? buildMasteryPill() : undefined;

    const isCurrent = i === currentIdx;
    // Dev unlock expands every module to its clickable pathway
    // (not just the current one) so Spencer can jump into any
    // lesson without grinding to it. Without this, non-current
    // modules render as a preview list and look "unreachable" even
    // when the per-lesson lock is bypassed.
    const showPathway = isCurrent || status === "completed" || devUnlock;

    // "Up next" banner lives INSIDE the active module (moved out of the
    // standalone hero card) so the path reads top-down: course progress →
    // your active module → exactly what's next. Only the current module,
    // mid-progress, gets it.
    const moduleDone = lessonsDone;
    const moduleTotal = mod.lessons.length;
    const upNext =
      isCurrent && currentLesson && status !== "completed" ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/30 bg-accent/5 px-3 py-2.5">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider text-accent">
              <Icon name="play" size={11} aria-hidden />
              {hasProgress
                ? t("learn.upNext.label", { defaultValue: "Up next" })
                : t("learn.upNext.startHere", { defaultValue: "Start here" })}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">
              {currentLesson.title}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {t("learn.upNext.moduleProgress", {
                defaultValue: "{{done}}/{{total}} lessons in this module",
                done: moduleDone,
                total: moduleTotal,
              })}
            </p>
          </div>
          <Button type="button" variant="primary" onClick={resumeCurrent}>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="play" size={14} aria-hidden />
              {hasProgress
                ? t("learn.upNext.resume", { defaultValue: "Resume" })
                : t("learn.upNext.start", { defaultValue: "Start" })}
            </span>
          </Button>
        </div>
      ) : null;

    const pathway = showPathway ? (
      <>
        {upNext}
        <ModulePathway
          lessons={mod.lessons}
          completedIds={completedSet}
          currentLessonId={currentLesson?.id}
          isLessonLocked={(id) =>
            isLessonLocked(id, i, course, completedSet, devUnlock)
          }
          onLessonClick={onLessonClick}
        />
      </>
    ) : undefined;

    const preview = !showPathway ? (
      <ModulePreview
        summary={mod.summary}
        lessons={mod.lessons}
        comingSoon={mod.comingSoon}
      />
    ) : undefined;

    const actions =
      isCurrent && currentLesson ? (
        <>
          {/* Resume now lives in the in-module "Up next" banner above the
              pathway, so we don't duplicate it here. */}
          {testOutEnabled && status !== "completed" && moduleHasBank(mod.id) ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(langPath(`learn/test-out/${mod.id}`))}
              >
                {t("learn.testOutModule", {
                  n: display.contentNumber ?? display.badgeLabel,
                })}
              </Button>
              <p className="lingo-test-out-note basis-full">
                {t(
                  "learn.testOutNote",
                  "Testing out marks every lesson up to here as complete and jumps you to the next module.",
                )}
              </p>
            </>
          ) : null}
          <Link
            to={langPath("practice/flashcards/review?scope=lessons")}
            className={composeButtonClasses({
              variant: "outline",
              accent: true,
              className: "basis-full w-full sm:w-auto",
            })}
          >
            {t("learn.flashcardsLessonDecksButton")}
          </Link>
        </>
      ) : testOutEnabled &&
        !isCurrent &&
        !mod.comingSoon &&
        status !== "completed" &&
        moduleHasBank(mod.id) ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(langPath(`learn/test-out/${mod.id}`))}
        >
          {t("learn.testOutModule", { n: display.contentNumber ?? i })}
        </Button>
      ) : null;

    return (
      <ModuleCard
        key={mod.id}
        module={mod}
        badgeLabel={display.badgeLabel}
        gateAfterLabel={display.gateAfterLabel}
        status={status}
        isOpen={open}
        onToggleOpen={() => onToggleModule(mod.id)}
        statusPill={pill}
        masteryPill={masteryPill}
        pathway={pathway}
        preview={preview}
        actions={actions}
      />
    );
  };

  return (
    <section className="min-w-0">
      <div className="space-y-2">
        {visible.map((mod, i) => {
          const group = groupFor(i);
          const prevGroup = i > 0 ? groupFor(i - 1) : null;
          const showLabel = group !== prevGroup;
          return (
            <div key={mod.id} className="space-y-2">
              {showLabel ? (
                <GroupLabel group={group} first={i === 0} />
              ) : null}
              {renderModule(mod, i)}
            </div>
          );
        })}

        {collapsed.length > 0 ? (
          <Link
            to={langPath("learn/course")}
            className="mt-3 flex items-center gap-2 rounded-card border border-dashed border-border bg-surface-muted/40 px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-accent/40 hover:bg-surface-muted/70 hover:text-text-primary"
          >
            <Icon name="mapPin" size={16} className="shrink-0 text-text-muted" aria-hidden />
            <span className="flex-1">
              {t("learn.upcomingModules", { defaultValue: "Upcoming modules" })}
            </span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold tabular-nums text-text-muted">
              {collapsed.length}
            </span>
            <Icon name="chevronRight" size={16} className="shrink-0 text-text-muted" aria-hidden />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
