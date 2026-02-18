import { useState } from "react";
import type { CourseModule } from "@/core/course";
import { getMockCompletedLessonIds } from "./mockProgress";

type Props = {
  module: CourseModule;
  completedLessonIds?: string[];
};

export function ModuleCard({ module, completedLessonIds = getMockCompletedLessonIds() }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = module.lessons.length;
  const completed = module.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

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

      {/* Progress bar with checkpoint marks at each lesson */}
      <div className="px-5 pb-3">
        <div
          className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700"
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${module.title}: ${completed} of ${total} lessons`}
        >
          <div
            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-600 transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
          {module.lessons.map((lesson, i) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            const position = ((i + 0.5) / total) * 100;
            return (
              <span
                key={lesson.id}
                className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-gray-400 dark:bg-gray-500"
                style={{ left: `${position}%`, transform: "translate(-50%, -50%)" }}
                title={`${lesson.title}${isCompleted ? " ✓" : ""}`}
              />
            );
          })}
        </div>
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}
