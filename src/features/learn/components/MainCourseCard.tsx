import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Course } from "@/shared/domain/course";
import {
  getModuleStatus,
  getCurrentModuleIndex,
  getNextLessonIndex,
  getLessonWindow,
  isLessonLocked,
} from "../moduleProgress";
import { ProgressBar, StatusNodeStrip, LessonStatusCircle } from "@/shared/components/progress";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { Icon } from "@/shared/components/Icon";

type Props = {
  course: Course;
  completedLessonIds: string[];
  onStartOver: () => void;
};

export function MainCourseCard({
  course,
  completedLessonIds,
  onStartOver,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const completedSet = new Set(completedLessonIds);
  const currentIdx = getCurrentModuleIndex(course, completedSet);
  const currentModule = course.modules[currentIdx];

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedTotal = completedLessonIds.length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedTotal / totalLessons) * 100) : 0;

  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [lessonsExpanded, setLessonsExpanded] = useState(false);

  const nextIdx = getNextLessonIndex(currentModule.lessons, completedSet);
  const SEMI_SIZE = 5;
  const { items: lessonWindow, startIndex, hasMoreBefore, hasMoreAfter } = getLessonWindow(
    currentModule.lessons,
    nextIdx,
    SEMI_SIZE
  );
  const showAll = lessonsExpanded || currentModule.lessons.length <= SEMI_SIZE;
  const lessonsToShow = showAll ? currentModule.lessons : lessonWindow;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-3">
        <StatusNodeStrip
          nodes={course.modules.map((mod, i) => ({
            id: mod.id,
            label: mod.title,
            status: getModuleStatus(i, completedSet, course.modules),
          }))}
        />
      </div>

      <div className="border-b border-border px-5 py-4">
        <ProgressBar
          percent={progressPercent}
          label={t("learn.progressLabel")}
          valueLabel={`${progressPercent}% · ${completedTotal}/${totalLessons} ${t("learn.lessonsCompleted")}`}
          ariaLabel={`${progressPercent}% complete`}
        />
      </div>

      <div className="px-5 py-4">
        <h3 className="text-lg font-semibold text-text-primary">
          {currentModule.title}
        </h3>
        {hasMoreBefore && !showAll && (
          <p className="mt-2 text-xs text-text-muted">
            <Icon name="chevronUp" size={12} className="inline" /> {startIndex} {t("learn.lessonsAbove")}
          </p>
        )}
        <ul className="mt-3 space-y-1">
          {lessonsToShow.map((lesson) => {
            const done = completedSet.has(lesson.id);
            const locked = isLessonLocked(lesson.id, currentIdx, course, completedSet);
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    if (lesson.kind === "alphabet" && lesson.alphabetId) {
                      navigate(langPath(`practice/alphabet/${lesson.alphabetId}/learn`));
                    } else {
                      navigate(langPath(`learn/lessons/${lesson.id}`));
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LessonStatusCircle
                    status={done ? "completed" : locked ? "locked" : "available"}
                  />
                  <span
                    className={
                      done
                        ? "text-text-muted"
                        : locked
                          ? "text-text-muted"
                          : "font-medium text-text-primary"
                    }
                  >
                    {lesson.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {hasMoreAfter && !showAll && (
          <p className="mt-2 text-xs text-text-muted">
            {currentModule.lessons.length - startIndex - lessonWindow.length}{" "}
            {t("learn.lessonsBelow")} <Icon name="chevronDown" size={12} className="inline" />
          </p>
        )}
        {!showAll && currentModule.lessons.length > SEMI_SIZE && (
          <button
            type="button"
            onClick={() => setLessonsExpanded(true)}
            className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
          >
            {t("learn.showAllLessons", { count: currentModule.lessons.length })}
          </button>
        )}
        {showAll && currentModule.lessons.length > SEMI_SIZE && (
          <button
            type="button"
            onClick={() => setLessonsExpanded(false)}
            className="mt-3 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            {t("learn.showLess")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border px-5 py-4">
        <button
          type="button"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          {t("learn.testOut")}
        </button>
        <button
          type="button"
          onClick={() => setShowStartOverConfirm(true)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-muted"
        >
          {t("learn.startOver")}
        </button>
      </div>

      {showStartOverConfirm && (
        <StartOverModal
          onConfirm={() => {
            onStartOver();
            setShowStartOverConfirm(false);
          }}
          onCancel={() => setShowStartOverConfirm(false)}
        />
      )}
    </div>
  );
}

function StartOverModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-over-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2 id="start-over-title" className="text-lg font-semibold text-text-primary">
          {t("learn.startOverTitle")}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {t("learn.startOverConfirm")}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("forum.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
          >
            {t("learn.startOver")}
          </button>
        </div>
      </div>
    </div>
  );
}
