import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { Course, CourseModule, Lesson } from "@/shared/domain/course";
import {
  getModuleDisplay,
  getModuleStatus,
  getNextLessonIndex,
} from "../moduleProgress";

export type LearnModuleListProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  isOpen: (moduleId: string) => boolean;
  onToggle: (moduleId: string) => void;
  onLessonClick: (lesson: Lesson) => void;
  devUnlock: boolean;
};

/**
 * Compact, raw module list for the learn "List" view — replaces the transit
 * pathway graphic with a scannable accordion. Each module row shows its
 * badge, title, and progress; expanding reveals its lessons; hovering a row
 * shows a lesson preview popover (mirrors the map's district peek). Text is
 * kept small so a full course fits in the height-locked container.
 */
export function LearnModuleList({
  course,
  completedSet,
  isOpen,
  onToggle,
  onLessonClick,
  devUnlock,
}: LearnModuleListProps) {
  return (
    <ul className="divide-y divide-border">
      {course.modules.map((mod, i) => (
        <ModuleRow
          key={mod.id}
          module={mod}
          index={i}
          modules={course.modules}
          completedSet={completedSet}
          open={isOpen(mod.id)}
          onToggle={() => onToggle(mod.id)}
          onLessonClick={onLessonClick}
          devUnlock={devUnlock}
        />
      ))}
    </ul>
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
  devUnlock,
}: {
  module: CourseModule;
  index: number;
  modules: CourseModule[];
  completedSet: ReadonlySet<string>;
  open: boolean;
  onToggle: () => void;
  onLessonClick: (lesson: Lesson) => void;
  devUnlock: boolean;
}) {
  const status = getModuleStatus(index, completedSet, modules);
  const display = getModuleDisplay(modules, index);
  const locked = status === "locked" && !devUnlock;
  const total = mod.lessons.length;
  const done = mod.lessons.filter((l) => completedSet.has(l.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextIdx = getNextLessonIndex(mod.lessons, completedSet);

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

      {/* Hover preview — a compact peek of the module's lessons, shown only
          while collapsed (expanded already lists them). */}
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
            {mod.lessons.length > 8 ? (
              <li className="text-[10.5px] text-text-muted">
                +{mod.lessons.length - 8} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {open ? (
        <ul className="bg-surface-muted/40 pb-1.5">
          {mod.lessons.map((lesson, li) => {
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
      ) : null}
    </li>
  );
}
