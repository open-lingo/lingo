import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CommunityAddon } from "@/features/community/types";
import { getLessonWindow } from "../moduleProgress";
import { ChevronIcon } from "@/shared/components/icons";
import { ProgressBar, LessonStatusCircle } from "@/shared/components/progress";

type Props = {
  addon: CommunityAddon;
  completedCount: number;
};

const SEMI_SIZE = 3;

export function CommunityModuleCard({ addon, completedCount }: Props) {
  const { t } = useTranslation();
  const [expansionLevel, setExpansionLevel] = useState<"collapsed" | "semi" | "full">("collapsed");
  const total = addon.itemCount ?? 0;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const lessonCount = Math.max(total, 1);
  const lessons = Array.from({ length: lessonCount }, (_, i) => ({
    id: `${addon.id}-l${i}`,
    title: `Lesson ${i + 1}`,
    done: i < completedCount,
  }));

  const nextIdx = Math.min(completedCount, lessonCount - 1);
  const { items: lessonWindow, startIndex, hasMoreBefore, hasMoreAfter } = getLessonWindow(
    lessons,
    nextIdx,
    SEMI_SIZE
  );
  const showAll = expansionLevel === "full" || lessons.length <= SEMI_SIZE;
  const lessonsToShow = showAll ? lessons : lessonWindow;

  const toggleHeader = () => {
    if (expansionLevel === "collapsed") setExpansionLevel("semi");
    else setExpansionLevel("collapsed");
  };
  const isExpanded = expansionLevel !== "collapsed";

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={toggleHeader}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900 dark:text-white">
            {addon.name}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {progressPercent}% · {completedCount}/{total}{" "}
            completed
          </p>
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-2">
          <ProgressBar
            percent={progressPercent}
            size="sm"
            ariaLabel={`${progressPercent}% complete`}
            className="w-16"
          />
          <ChevronIcon
            className={`h-5 w-5 text-gray-500 transition dark:text-gray-400 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {hasMoreBefore && !showAll && (
            <p className="px-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
              ↑ {startIndex} {t("learn.lessonsAbove")}
            </p>
          )}
          <ul>
            {lessonsToShow.map((lesson) => (
              <li key={lesson.id}>
                <span className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  <LessonStatusCircle
                    status={lesson.done ? "completed" : "incomplete"}
                    size="sm"
                  />
                  {lesson.title}
                </span>
              </li>
            ))}
          </ul>
          {hasMoreAfter && !showAll && (
            <p className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400">
              {lessons.length - startIndex - lessonWindow.length} {t("learn.lessonsBelow")} ↓
            </p>
          )}
          {!showAll && lessons.length > SEMI_SIZE && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpansionLevel("full");
              }}
              className="w-full px-4 pb-3 text-left text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {t("learn.showAllLessons", { count: lessons.length })}
            </button>
          )}
          {showAll && lessons.length > SEMI_SIZE && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpansionLevel("semi");
              }}
              className="w-full px-4 pb-3 text-left text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {t("learn.showLess")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
