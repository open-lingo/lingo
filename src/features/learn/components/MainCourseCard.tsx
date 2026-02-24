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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <StatusNodeStrip
          nodes={course.modules.map((mod, i) => ({
            id: mod.id,
            label: mod.title,
            status: getModuleStatus(i, completedSet, course.modules),
          }))}
        />
      </div>

      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <ProgressBar
          percent={progressPercent}
          label={t("learn.progressLabel")}
          valueLabel={`${progressPercent}% · ${completedTotal}/${totalLessons} ${t("learn.lessonsCompleted")}`}
          ariaLabel={`${progressPercent}% complete`}
        />
      </div>

      <div className="px-5 py-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentModule.title}
        </h3>
        {hasMoreBefore && !showAll && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            ↑ {startIndex} {t("learn.lessonsAbove")}
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
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-gray-700/50"
                >
                  <LessonStatusCircle
                    status={done ? "completed" : locked ? "locked" : "available"}
                  />
                  <span
                    className={
                      done
                        ? "text-gray-600 dark:text-gray-400"
                        : locked
                          ? "text-gray-400 dark:text-gray-500"
                          : "font-medium text-gray-900 dark:text-white"
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
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {currentModule.lessons.length - startIndex - lessonWindow.length}{" "}
            {t("learn.lessonsBelow")} ↓
          </p>
        )}
        {!showAll && currentModule.lessons.length > SEMI_SIZE && (
          <button
            type="button"
            onClick={() => setLessonsExpanded(true)}
            className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {t("learn.showAllLessons", { count: currentModule.lessons.length })}
          </button>
        )}
        {showAll && currentModule.lessons.length > SEMI_SIZE && (
          <button
            type="button"
            onClick={() => setLessonsExpanded(false)}
            className="mt-3 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {t("learn.showLess")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          {t("learn.testOut")}
        </button>
        <button
          type="button"
          onClick={() => setShowStartOverConfirm(true)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <h2 id="start-over-title" className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("learn.startOverTitle")}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t("learn.startOverConfirm")}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
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
