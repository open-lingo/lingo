import { useState } from "react";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { ProgressBar } from "@/shared/components/progress/ProgressBar";
import type { Course, CourseModule, Lesson, SideQuest } from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getModuleDisplay,
  getModuleStatus,
  getNextLessonIndex,
} from "../moduleProgress";

/** How many lessons an expanded module shows inline before "view all". */
const LESSON_PEEK = 5;
/** How many modules a zone shows before "view all modules". */
const MODULE_PEEK = 4;

/** Rounded elbow branching a lesson off the module spine (at 2.875rem, the
 *  circle center) into its bullet. */
function LessonElbow() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-[2.875rem] top-[0.28rem] h-[0.6rem] w-[0.5rem] rounded-bl-[8px] border-b border-l border-border"
    />
  );
}

export type LearnModuleListProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  /** Zone labels (thirds), from the transit strings; [] disables grouping. */
  zoneLabels: string[];
  /** One blurb per zone, shown on hover. */
  zoneDescriptions: string[];
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
  zoneDescriptions,
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
  const currentZone = (() => {
    const idx = getCurrentModuleIndex(course, completedSet);
    return groups.findIndex((z) => idx >= z.start && idx < z.start + z.count);
  })();
  // Only the zone you're working on is open by default; the rest collapse.
  const [collapsedZones, setCollapsedZones] = useState<Set<number>>(() => {
    const s = new Set<number>();
    groups.forEach((_, zi) => {
      if (zi !== currentZone) s.add(zi);
    });
    return s;
  });
  // Zones whose full module list is shown (past the MODULE_PEEK cap).
  const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set());

  const toggleSet =
    (setter: typeof setCollapsedZones) => (z: number) =>
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(z)) next.delete(z);
        else next.add(z);
        return next;
      });
  const toggleZone = toggleSet(setCollapsedZones);
  const showAllModules = toggleSet(setExpandedZones);

  return (
    <div>
      {groups.map((zone, zi) => {
        const zoneCollapsed = collapsedZones.has(zi);
        const zoneModules = course.modules.slice(zone.start, zone.start + zone.count);
        const zoneAll = expandedZones.has(zi);
        const visible = zoneAll ? zoneModules : zoneModules.slice(0, MODULE_PEEK);
        const hiddenCount = zoneModules.length - visible.length;
        const desc = zoneDescriptions[zi];
        return (
          <section key={zi}>
            {zone.label ? (
              <div className="group/zone sticky top-0 z-20">
                <button
                  type="button"
                  onClick={() => toggleZone(zi)}
                  aria-expanded={!zoneCollapsed}
                  className="flex w-full items-center gap-2.5 border-b border-border bg-surface-muted py-3.5 pl-3 pr-5 text-left"
                >
                  <Icon
                    name={zoneCollapsed ? "chevronRight" : "chevronDown"}
                    size={17}
                    className="flex-none text-text-muted transition-transform"
                    aria-hidden
                  />
                  <span className="grid size-6 flex-none place-items-center rounded-md bg-accent/15 text-[12px] font-bold text-accent">
                    {zi + 1}
                  </span>
                  <span className="flex-1 truncate text-[14px] font-bold uppercase tracking-wider text-text-secondary">
                    {zone.label}
                  </span>
                  {desc ? (
                    <Icon name="info" size={14} className="flex-none text-text-muted" aria-hidden />
                  ) : null}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-text-muted">
                    {zone.count}
                  </span>
                </button>
                {desc ? (
                  <div className="pointer-events-none absolute left-3 top-full z-30 mt-1 hidden w-72 max-w-[calc(100%-1.5rem)] rounded-card border border-border bg-surface p-3 text-[12px] leading-relaxed text-text-secondary shadow-popover group-hover/zone:block">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      {zone.label}
                    </p>
                    {desc}
                  </div>
                ) : null}
              </div>
            ) : null}
            {!zoneCollapsed ? (
              <ul className="list-expand">
                {visible.map((mod, li) => {
                  const globalIdx = zone.start + li;
                  return (
                    <ModuleRow
                      key={mod.id}
                      module={mod}
                      index={globalIdx}
                      modules={course.modules}
                      completedSet={completedSet}
                      open={isOpen(mod.id)}
                      isLastInZone={li === visible.length - 1 && hiddenCount === 0}
                      onToggle={() => onToggle(mod.id)}
                      onLessonClick={onLessonClick}
                      onViewAll={() => onViewAll(globalIdx)}
                      devUnlock={devUnlock}
                    />
                  );
                })}
                {hiddenCount > 0 ? (
                  <>
                    {/* ghost module peek — faded so the zone visibly continues */}
                    {zoneModules[MODULE_PEEK] ? (
                      <li aria-hidden className="relative">
                        <span className="pointer-events-none absolute left-[2.875rem] top-0 h-[1.375rem] w-px bg-border" />
                        <div className="flex items-center gap-2.5 py-2 pl-8 pr-5 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]">
                          <span className="relative z-[1] size-7 flex-none rounded-full bg-surface-muted" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-text-primary">
                              {zoneModules[MODULE_PEEK].title}
                            </span>
                            {zoneModules[MODULE_PEEK].eyebrow ? (
                              <span className="block truncate text-[10.5px] text-text-muted">
                                {zoneModules[MODULE_PEEK].eyebrow}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </li>
                    ) : null}
                    <li className="border-b border-border">
                      <button
                        type="button"
                        onClick={() => showAllModules(zi)}
                        className="flex w-full items-center gap-1.5 py-2 pl-[2.6rem] pr-5 text-left text-[11.5px] font-semibold text-accent transition hover:bg-surface-muted/50"
                      >
                        View all {zoneModules.length} modules
                        <Icon name="chevronDown" size={13} aria-hidden />
                      </button>
                    </li>
                  </>
                ) : null}
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
      ? "bg-accent text-accent-foreground"
      : status === "current"
        ? "bg-warning text-white"
        : "bg-surface-muted text-text-muted";

  return (
    <li className="group/mod relative">
      {/* single spine through the module circle centers (module → module),
          continuing through the expanded lessons which branch off it. The
          last module (collapsed) stops at its circle. Sits BEHIND the circles
          (which are opaque) so it reads as nodes on a line. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-[2.875rem] top-0 w-px bg-border",
          isLastInZone && !open ? "h-[1.375rem]" : "bottom-0",
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="relative flex w-full items-center gap-2.5 py-2 pl-8 pr-5 text-left transition hover:bg-surface-muted/50"
      >
        <span
          className={cn(
            "relative z-[1] grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold",
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
        <div className="list-expand pb-1.5">
          <ul>
            {peek.map((lesson, li) => {
              const isDone = completedSet.has(lesson.id);
              const isCurrent = li === nextIdx && status === "current";
              return (
                <li key={lesson.id} className="relative">
                  <LessonElbow />
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onLessonClick(lesson)}
                    className={cn(
                      "flex w-full items-center gap-2.5 py-1.5 pl-14 pr-5 text-left text-[12.5px] transition",
                      locked
                        ? "cursor-not-allowed text-text-muted"
                        : "text-text-secondary hover:bg-surface-muted/50 hover:text-text-primary",
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
                      <span className="flex-none rounded-sm bg-accent px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-accent-foreground">
                        Next
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
            {/* ghost node: a real (faded) next lesson so the spine visibly
                continues and it's obvious the module goes on. */}
            {overflow > 0 && mod.lessons[LESSON_PEEK] ? (
              <li aria-hidden className="relative">
                <LessonElbow />
                <div className="flex items-center gap-2.5 py-1.5 pl-14 pr-5 text-[12.5px] text-text-secondary opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_92%)]">
                  <span className="size-4 flex-none rounded-full border border-border bg-surface" />
                  <span className="min-w-0 flex-1 truncate">
                    {mod.lessons[LESSON_PEEK].title}
                  </span>
                </div>
              </li>
            ) : null}
          </ul>
          <button
            type="button"
            onClick={onViewAll}
            className="ml-14 mt-0.5 inline-flex items-center gap-1 pr-5 text-[11.5px] font-semibold text-accent hover:text-accent-hover"
          >
            {overflow > 0 ? `View all ${total} lessons` : "Open module"}
            <Icon name="arrowRight" size={13} aria-hidden />
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
