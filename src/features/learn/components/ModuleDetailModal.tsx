import { Link } from "react-router-dom";
import { ModalBase } from "@/shared/components/ModalBase";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { useLangPath } from "@/shared/hooks/useLangPath";
import type { CourseModule, Lesson } from "@/shared/domain/course";
import {
  getModuleDisplay,
  getModuleStatus,
  getNextLessonIndex,
} from "../moduleProgress";

/**
 * Full module outline modal for the List view — the "view more" target that
 * lists every lesson (mirrors the map's district panel). Carries the two
 * module-level actions: Continue (into the next lesson) and Test out (skip
 * the module by passing its placement test).
 */
export function ModuleDetailModal({
  modules,
  index,
  completedSet,
  devUnlock,
  onLessonClick,
  onClose,
}: {
  modules: CourseModule[];
  index: number;
  completedSet: ReadonlySet<string>;
  devUnlock: boolean;
  onLessonClick: (lesson: Lesson) => void;
  onClose: () => void;
}) {
  const langPath = useLangPath();
  const mod = modules[index];
  const status = getModuleStatus(index, completedSet, modules);
  const display = getModuleDisplay(modules, index);
  const locked = status === "locked" && !devUnlock;
  const total = mod.lessons.length;
  const done = mod.lessons.filter((l) => completedSet.has(l.id)).length;
  const nextIdx = getNextLessonIndex(mod.lessons, completedSet);

  return (
    <ModalBase onClose={onClose} title={mod.title} maxWidth="max-w-lg">
      <div className="flex flex-col">
        {/* meta */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-[12px] text-text-muted">
          <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-extrabold text-text-secondary">
            {display.badgeLabel}
          </span>
          {mod.eyebrow ? <span>{mod.eyebrow}</span> : null}
          <span className="ml-auto font-semibold tabular-nums">
            {done}/{total} lessons
          </span>
        </div>

        {/* lessons */}
        <ul className="max-h-[52vh] overflow-y-auto py-1">
          {mod.lessons.map((lesson, li) => {
            const isDone = completedSet.has(lesson.id);
            const isCurrent = li === nextIdx && status === "current";
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    onLessonClick(lesson);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] transition",
                    locked
                      ? "cursor-not-allowed text-text-muted"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-5 flex-none place-items-center rounded-full text-[9px] font-bold",
                      isDone
                        ? "bg-accent text-accent-foreground"
                        : isCurrent
                          ? "bg-warning text-white"
                          : "border border-border text-transparent",
                    )}
                  >
                    {isDone ? "✓" : isCurrent ? "▶" : `${li + 1}`}
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

        {/* actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          {status !== "completed" ? (
            <Link
              to={langPath(`learn/test-out/${mod.id}`)}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary transition hover:border-accent hover:text-text-primary"
            >
              <Icon name="zap" size={14} aria-hidden />
              Test out
            </Link>
          ) : null}
          <div className="flex-1" />
          {!locked && mod.lessons[nextIdx] ? (
            <button
              type="button"
              onClick={() => {
                onLessonClick(mod.lessons[nextIdx]);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[12.5px] font-bold text-accent-foreground transition hover:bg-accent-hover"
            >
              {done > 0 ? "Continue" : "Start"} L{nextIdx + 1}
              <Icon name="arrowRight" size={14} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </ModalBase>
  );
}
