import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CommunityAddon } from "@/features/community/types";
import { getLessonWindow } from "../moduleProgress";
import { ProgressBar, LessonStatusCircle } from "@/shared/components/progress";
import { Icon } from "@/shared/components/Icon";

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
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={toggleHeader}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface-muted"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text-primary">
            {addon.name}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
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
          <Icon
            name="chevronDown"
            size={20}
            className={`text-text-muted transition ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {hasMoreBefore && !showAll && (
            <p className="px-4 pt-2 text-xs text-text-muted">
              <Icon name="chevronUp" size={12} className="inline" /> {startIndex} {t("learn.lessonsAbove")}
            </p>
          )}
          <ul>
            {lessonsToShow.map((lesson) => (
              <li key={lesson.id}>
                <span className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary">
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
            <p className="px-4 pb-2 text-xs text-text-muted">
              {lessons.length - startIndex - lessonWindow.length} {t("learn.lessonsBelow")} <Icon name="chevronDown" size={12} className="inline" />
            </p>
          )}
          {!showAll && lessons.length > SEMI_SIZE && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpansionLevel("full");
              }}
              className="w-full px-4 pb-3 text-left text-sm font-medium text-accent hover:text-accent-hover"
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
              className="w-full px-4 pb-3 text-left text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              {t("learn.showLess")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
