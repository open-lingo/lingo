import { useState } from "react";
import type { CourseModule } from "@/shared/domain/course";
import { getMockCompletedLessonIds } from "../mockProgress";
import { ChevronIcon, LockIcon } from "@/shared/components/icons";
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
        aria-expanded={expanded}
      >
        <span className="font-semibold text-gray-900 dark:text-white">
          {module.title}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {completed}/{total} lessons
        </span>
        <ChevronIcon
          className={`h-5 w-5 text-gray-500 transition dark:text-gray-400 ${
            expanded ? "rotate-180" : ""
          }`}
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
        <ul className="border-t border-gray-200 dark:border-gray-700">
          {module.lessons.map((lesson) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            return (
              <li key={lesson.id}>
                <a
                  href={`#lesson-${lesson.id}`}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                >
                  {isCompleted && (
                    <span className="text-emerald-500 dark:text-emerald-400" aria-hidden>
                      ✓
                    </span>
                  )}
                  <span
                    className={
                      lesson.status === "locked"
                        ? "text-gray-400 dark:text-gray-500"
                        : isCompleted
                          ? "text-gray-600 dark:text-gray-400"
                          : ""
                    }
                  >
                    {lesson.title}
                  </span>
                  {lesson.status === "locked" && (
                    <LockIcon className="ml-auto h-4 w-4 text-gray-400 dark:text-gray-500" />
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
