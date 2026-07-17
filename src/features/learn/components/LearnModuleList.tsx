import { useState } from "react";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { ProgressBar } from "@/shared/components/progress/ProgressBar";
import type { Course, CourseModule, Lesson, SideQuest } from "@/shared/domain/course";
import {
  getModuleDisplay,
  getModuleStatus,
  getNextLessonIndex,
} from "../moduleProgress";

/** How many lessons an expanded module shows inline before "view all". */
const LESSON_PEEK = 5;

export type LearnModuleListProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  /** Zone labels (thirds), from the transit strings; [] disables grouping. */
  zoneLabels: string[];
  isOpen: (moduleId: string) => boolean;
  onToggle: (moduleId: string) => void;
  onLessonClick: (lesson: Lesson) => void;
  /** Open the full module outline modal (global module index). */
  onViewAll: (moduleIndex: number) => void;
  devUnlock: boolean;
  sideQuests: SideQuest[];
  isSideQuestUnlocked: (quest: SideQuest) => boolean;
  onSideQuestClick?: (quest: SideQuest) => void;
};

type ZoneGroup = { label: string | null; start: number; count: number };

function zoneGroups(total: number, zoneLabels: string[]): ZoneGroup[] {
  if (total < 9 || zoneLabels.length !== 3) {
    return [{ label: null, start: 0, count: total }];
  }
  const third = Math.ceil(total / 3);
  return [
    { label: zoneLabels[0], start: 0, count: third },
    { label: zoneLabels[1], start: third, count: Math.min(third, total - third) },
    { label: zoneLabels[2], start: 2 * third, count: Math.max(0, total - 2 * third) },
  ].filter((z) => z.count > 0);
}

/**
 * Compact module list for the learn "List" view — grouped into collapsible
 * zones with a git-tree connector down each zone, colored status circles
 * (like the pathway), and an accordion that peeks a handful of lessons
 * before a "view all" opens the full DistrictView modal. Side quests get
 * their own section at the end.
 */
export function LearnModuleList({
  course,
  completedSet,
  zoneLabels,
  isOpen,
  onToggle,
  onLessonClick,
  onViewAll,
  devUnlock,
  sideQuests,
  isSideQuestUnlocked,
  onSideQuestClick,
}: LearnModuleListProps) {
  const groups = zoneGroups(course.modules.length, zoneLabels);
  const [collapsedZones, setCollapsedZones] = useState<Set<number>>(new Set());

  const toggleZone = (z: number) =>
    setCollapsedZones((prev) => {
      const next = new Set(prev);
      if (next.has(z)) next.delete(z);
      else next.add(z);
      return next;
    });

  return (
    <div>
      {groups.map((zone, zi) => {
        const zoneCollapsed = collapsedZones.has(zi);
        const zoneModules = course.modules.slice(zone.start, zone.start + zone.count);
        return (
          <section key={zi}>
            {zone.label ? (
              <button
                type="button"
                onClick={() => toggleZone(zi)}
                aria-expanded={!zoneCollapsed}
                className="sticky top-0 z-10 flex w-full items-center gap-2 border-b border-border bg-surface-muted px-3 py-2.5 text-left"
              >
                <Icon
                  name={zoneCollapsed ? "chevronRight" : "chevronDown"}
                  size={16}
                  className="flex-none text-text-muted transition-transform"
                  aria-hidden
                />
                <span className="flex-1 truncate text-[13px] font-bold uppercase tracking-wider text-text-secondary">
                  {zone.label}
                </span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-muted">
                  {zone.count}
                </span>
              </button>
            ) : null}
            {!zoneCollapsed ? (
              <ul className="list-expand">
                {zoneModules.map((mod, li) => {
                  const globalIdx = zone.start + li;
                  return (
                    <ModuleRow
                      key={mod.id}
                      module={mod}
                      index={globalIdx}
                      modules={course.modules}
                      completedSet={completedSet}
                      open={isOpen(mod.id)}
                      isLastInZone={li === zoneModules.length - 1}
                      onToggle={() => onToggle(mod.id)}
                      onLessonClick={onLessonClick}
                      onViewAll={() => onViewAll(globalIdx)}
                      devUnlock={devUnlock}
                    />
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}

      {sideQuests.length > 0 ? (
        <SideQuestSection
          sideQuests={sideQuests}
          isSideQuestUnlocked={isSideQuestUnlocked}
          onSideQuestClick={onSideQuestClick}
        />
      ) : null}
    </div>
  );
}

function ModuleRow({
  module: mod,
  index,
  modules,
  completedSet,
  open,
  isLastInZone,
  onToggle,
  onLessonClick,
  onViewAll,
  devUnlock,
}: {
  module: CourseModule;
  index: number;
  modules: CourseModule[];
  completedSet: ReadonlySet<string>;
  open: boolean;
  isLastInZone: boolean;
  onToggle: () => void;
  onLessonClick: (lesson: Lesson) => void;
  onViewAll: () => void;
  devUnlock: boolean;
}) {
  const status = getModuleStatus(index, completedSet, modules);
  const display = getModuleDisplay(modules, index);
  const locked = status === "locked" && !devUnlock;
  const total = mod.lessons.length;
  const done = mod.lessons.filter((l) => completedSet.has(l.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextIdx = getNextLessonIndex(mod.lessons, completedSet);
  const peek = mod.lessons.slice(0, LESSON_PEEK);
  const overflow = total - peek.length;

  const circleClass =
    status === "completed"
      ? "border-accent bg-accent text-accent-foreground"
      : status === "current"
        ? "border-warning bg-surface text-warning"
        : "border-border bg-surface-muted text-text-muted";

  return (
    <li className="group/mod relative border-t border-border first:border-t-0">
      {/* module→module trunk: spans the whole row (incl. expanded lessons)
          down to the next module; the last module stops at its circle. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-4 top-0 z-[1] w-px bg-border",
          isLastInZone ? "h-[23px]" : "bottom-0",
        )}
      />
      {/* rounded elbow from the trunk into the module circle */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-[11px] z-[1] h-3 w-3.5 rounded-bl-[10px] border-b border-l border-border"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="relative flex w-full items-center gap-2.5 py-2 pl-8 pr-2.5 text-left transition hover:bg-surface-muted"
      >
        <span
          className={cn(
            "grid h-7 w-7 flex-none place-items-center rounded-full border-2 text-[11px] font-extrabold",
            circleClass,
          )}
        >
          {display.isReview ? "R" : display.contentNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "truncate text-[13px] font-semibold",
                locked ? "text-text-muted" : "text-text-primary",
              )}
            >
              {mod.title}
            </span>
            {locked ? (
              <Icon name="lock" size={11} className="flex-none text-text-muted" aria-hidden />
            ) : null}
          </span>
          {mod.eyebrow ? (
            <span className="block truncate text-[10.5px] text-text-muted">{mod.eyebrow}</span>
          ) : null}
        </span>
        <span className="hidden flex-none items-center gap-2 sm:flex">
          <ProgressBar
            percent={pct}
            size="xs"
            className="w-16"
            ariaLabel={`${done} of ${total} lessons`}
          />
          <span className="w-9 text-right text-[11px] font-semibold tabular-nums text-text-muted">
            {done}/{total}
          </span>
        </span>
        <Icon
          name={open ? "chevronDown" : "chevronRight"}
          size={15}
          className="flex-none text-text-muted"
          aria-hidden
        />
      </button>

      {/* Hover preview — a compact peek of the module's lessons, collapsed only. */}
      {!open ? (
        <div className="pointer-events-none absolute right-2 top-1 z-20 hidden w-56 rounded-card border border-border bg-surface p-2 shadow-popover group-hover/mod:block">
          <p className="mb-1 truncate text-[11px] font-bold text-text-primary">{mod.title}</p>
          <ul className="space-y-1">
            {mod.lessons.slice(0, 8).map((l, li) => (
              <li key={l.id} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 flex-none rounded-full",
                    completedSet.has(l.id)
                      ? "bg-accent"
                      : li === nextIdx && status === "current"
                        ? "bg-warning"
                        : "bg-border",
                  )}
                />
                <span className="truncate text-[11px] text-text-secondary">{l.title}</span>
              </li>
            ))}
            {total > 8 ? (
              <li className="text-[10.5px] text-text-muted">+{total - 8} more</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {open ? (
        <div className="list-expand relative bg-surface-muted/40 pb-1.5">
          {/* lesson sub-branch: a trunk descending from the module circle
              (negative top closes the gap so it starts at the circle), with
              a small elbow into each lesson bullet. */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-7 left-8 top-[-0.7rem] z-[1] w-px bg-border"
          />
          <ul>
            {peek.map((lesson, li) => {
              const isDone = completedSet.has(lesson.id);
              const isCurrent = li === nextIdx && status === "current";
              return (
                <li key={lesson.id} className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-8 top-[15px] z-[1] h-px w-3 bg-border"
                  />
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onLessonClick(lesson)}
                    className={cn(
                      "flex w-full items-center gap-2.5 py-1.5 pl-[3.25rem] pr-3 text-left text-[12.5px] transition",
                      locked
                        ? "cursor-not-allowed text-text-muted"
                        : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 flex-none place-items-center rounded-full text-[8px] font-bold",
                        isDone
                          ? "bg-accent text-accent-foreground"
                          : isCurrent
                            ? "bg-warning text-white"
                            : "border border-border bg-surface text-transparent",
                      )}
                    >
                      {isDone ? "✓" : isCurrent ? "▶" : ""}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                    {isCurrent ? (
                      <span className="flex-none rounded-sm bg-accent px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-accent-foreground">
                        Next
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={onViewAll}
            className="group/more relative block w-full pl-[3.25rem] pr-3 pt-1.5 text-left"
          >
            {/* a ghosted next lesson bleeds through behind "view all" so it's
                obvious the module continues past the peek. */}
            {overflow > 0 && mod.lessons[LESSON_PEEK] ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 truncate pl-[3.25rem] pr-3 text-[12.5px] text-text-secondary opacity-30 blur-[1.5px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
              >
                {mod.lessons[LESSON_PEEK].title}
              </span>
            ) : null}
            <span className="relative inline-flex items-center gap-1 text-[11.5px] font-semibold text-accent group-hover/more:text-accent-hover">
              {overflow > 0 ? `View all ${total} lessons` : "Open module"}
              <Icon name="arrowRight" size={13} aria-hidden />
            </span>
          </button>
        </div>
      ) : null}
    </li>
  );
}

function SideQuestSection({
  sideQuests,
  isSideQuestUnlocked,
  onSideQuestClick,
}: {
  sideQuests: SideQuest[];
  isSideQuestUnlocked: (quest: SideQuest) => boolean;
  onSideQuestClick?: (quest: SideQuest) => void;
}) {
  return (
    <section>
      <div className="sticky top-0 z-10 flex items-center gap-2 border-y border-border bg-surface-muted px-3 py-2.5">
        <Icon name="sparkles" size={15} className="flex-none text-accent" aria-hidden />
        <span className="flex-1 text-[13px] font-bold uppercase tracking-wider text-text-secondary">
          Side quests
        </span>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-muted">
          {sideQuests.length}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {sideQuests.map((quest) => {
          const soon = quest.comingSoon === true;
          const locked = !isSideQuestUnlocked(quest);
          const disabled = soon || locked;
          return (
            <li key={quest.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSideQuestClick?.(quest)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left transition",
                  disabled
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-surface-muted",
                )}
              >
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-muted text-sm">
                  {quest.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-text-primary">
                      {quest.title}
                    </span>
                    {soon ? (
                      <span className="flex-none rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                        Soon
                      </span>
                    ) : null}
                  </span>
                  {quest.meta ? (
                    <span className="block truncate text-[10.5px] text-text-muted">{quest.meta}</span>
                  ) : null}
                </span>
                {locked && !soon ? (
                  <Icon name="lock" size={12} className="flex-none text-text-muted" aria-hidden />
                ) : (
                  <Icon name="chevronRight" size={15} className="flex-none text-text-muted" aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
