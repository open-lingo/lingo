import { useState } from "react";
import type { CourseModule } from "@/shared/domain/course";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { Icon } from "@/shared/components/Icon";
import { ProgressBarWithCheckpoints } from "@/shared/components/progress";

type Props = {
  module: CourseModule;
  completedLessonIds?: string[];
};

export function ModuleCard({
  module,
  completedLessonIds = getMockCompletedLessonIds(),
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = module.lessons.length;
  const completed = module.lessons.filter((l) => completedLessonIds.includes(l.id)).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-surface-muted"
        aria-expanded={expanded}
      >
        <span className="font-semibold text-text-primary">
          {module.title}
        </span>
        <span className="text-sm text-text-muted">
          {completed}/{total} lessons
        </span>
        <Icon
          name="chevronDown"
          size={20}
          className={`text-text-muted transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div className="px-5 pb-3">
        <ProgressBarWithCheckpoints
          completed={completed}
          total={total}
          checkpoints={module.lessons.map((l) => ({
            id: l.id,
            label: l.title,
            completed: completedLessonIds.includes(l.id),
          }))}
          ariaLabel={`${module.title}: ${completed} of ${total} lessons`}
        />
      </div>

      {expanded && (
        <ul className="border-t border-border">
          {module.lessons.map((lesson) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            return (
              <li key={lesson.id}>
                <a
                  href={`#lesson-${lesson.id}`}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-text-secondary hover:bg-surface-muted"
                >
                  {isCompleted && (
                    <Icon name="check" size={14} className="shrink-0 text-accent" aria-hidden />
                  )}
                  <span
                    className={
                      lesson.status === "locked"
                        ? "text-text-muted"
                        : isCompleted
                          ? "text-text-secondary"
                          : ""
                    }
                  >
                    {lesson.title}
                  </span>
                  {lesson.status === "locked" && (
                    <Icon name="lock" size={16} className="ml-auto text-text-muted" />
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
