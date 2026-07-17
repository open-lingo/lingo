import { useState } from "react";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { Course, CourseModule, Lesson } from "@/shared/domain/course";
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
 * zones, each module an accordion that peeks a handful of lessons before a
 * "view all" opens the full outline modal. Hover peeks lessons too. Text is
 * small so a full course fits the height-locked container.
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
                className="sticky top-0 z-10 flex w-full items-center gap-2 border-b border-border bg-surface-muted px-2.5 py-1.5 text-left"
              >
                <Icon
                  name={zoneCollapsed ? "chevronRight" : "chevronDown"}
                  size={14}
                  className="flex-none text-text-muted"
                  aria-hidden
                />
                <span className="flex-1 truncate text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  {zone.label}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-text-muted">
                  {zone.count}
                </span>
              </button>
            ) : null}
            {!zoneCollapsed ? (
              <ul className="divide-y divide-border">
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
    </div>
  );
}

function ModuleRow({
  module: mod,
  index,
  modules,
  completedSet,
  open,
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

  return (
    <li className="group/mod relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition hover:bg-surface-muted"
      >
        <span
          className={cn(
            "grid h-6 w-9 flex-none place-items-center rounded-md text-[11px] font-extrabold",
            status === "completed"
              ? "bg-accent text-accent-foreground"
              : status === "current"
                ? "bg-warning/20 text-warning"
                : "bg-surface-muted text-text-muted",
          )}
        >
          {display.badgeLabel}
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
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
            <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </span>
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
        <div className="bg-surface-muted/40 pb-1.5">
          <ul>
            {peek.map((lesson, li) => {
              const isDone = completedSet.has(lesson.id);
              const isCurrent = li === nextIdx && status === "current";
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onLessonClick(lesson)}
                    className={cn(
                      "flex w-full items-center gap-2.5 py-1.5 pl-11 pr-3 text-left text-[12.5px] transition",
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
                            : "border border-border text-transparent",
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
            className="ml-11 mt-0.5 inline-flex items-center gap-1 pr-3 text-[11.5px] font-semibold text-accent hover:text-accent-hover"
          >
            {overflow > 0 ? `View all ${total} lessons` : "Open module"}
            <Icon name="arrowRight" size={13} aria-hidden />
          </button>
        </div>
      ) : null}
    </li>
  );
}
