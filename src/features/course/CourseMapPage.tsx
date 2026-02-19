import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getMockCourse } from "@/features/course/mockCourse";
import { getMockCompletedLessonIds } from "@/features/course/mockProgress";
import type { Course, Lesson } from "@/shared/domain/course";

/** Flatten course into ordered lessons with module info for path rendering. */
function flattenLessons(course: Course): { lesson: Lesson; moduleTitle: string; moduleId: string }[] {
  const out: { lesson: Lesson; moduleTitle: string; moduleId: string }[] = [];
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      out.push({ lesson, moduleTitle: mod.title, moduleId: mod.id });
    }
  }
  return out;
}

const NODE_R = 20;
const STEP_X = 72;
const STEP_Y = 64;
const PATH_PADDING = 40;

export function CourseMapPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const completedIds = new Set(getMockCompletedLessonIds());

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-gray-500 dark:text-gray-400">
          Select a learning language in Settings to see your course path.
        </p>
        <Link to="/settings" className="text-sm text-blue-600 dark:text-blue-400">
          → Settings
        </Link>
      </div>
    );
  }

  const items = flattenLessons(course);
  const totalWidth = Math.min(3, items.length) * STEP_X + PATH_PADDING * 2;
  const totalHeight = items.length * STEP_Y + PATH_PADDING * 2;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {course.title}
        </h1>
        <Link
          to="/"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("common.backToHome")}
        </Link>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Your path. Completed lessons are filled; tap a lesson to practice.
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="mx-auto block w-full max-w-md"
          style={{ minHeight: Math.max(400, items.length * 56) }}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" />
              <stop offset="100%" stopColor="rgb(22, 163, 74)" />
            </linearGradient>
          </defs>
          {/* Winding path: zigzag down (right, down, left, down, right, ...) */}
          {items.length > 0 && (
            <path
              d={items
                .map((_, i) => {
                  const row = Math.floor(i / 3);
                  const col = i % 3;
                  const x = PATH_PADDING + col * STEP_X;
                  const y = PATH_PADDING + row * STEP_Y;
                  return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.4}
            />
          )}
          {items.map(({ lesson, moduleTitle }, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = PATH_PADDING + col * STEP_X;
            const y = PATH_PADDING + row * STEP_Y;
            const done = completedIds.has(lesson.id);
            const locked = lesson.status === "locked";
            return (
              <g key={lesson.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_R}
                  fill={done ? "rgb(34, 197, 94)" : locked ? "rgb(156, 163, 175)" : "rgb(255, 255, 255)"}
                  stroke={done ? "rgb(22, 163, 74)" : locked ? "rgb(107, 114, 128)" : "rgb(34, 197, 94)"}
                  strokeWidth={2}
                />
                {done && (
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    ✓
                  </text>
                )}
                <title>
                  {moduleTitle} · {lesson.title}
                  {done ? " (completed)" : locked ? " (locked)" : ""}
                </title>
              </g>
            );
          })}
        </svg>

        {/* Legend: lesson labels below the path */}
        <ul className="mt-8 space-y-2">
          {items.map(({ lesson, moduleTitle }) => {
            const done = completedIds.has(lesson.id);
            const locked = lesson.status === "locked";
            return (
              <li
                key={lesson.id}
                className="flex items-center gap-3 text-sm"
              >
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-green-500 bg-green-500 text-white"
                      : locked
                        ? "border-gray-400 bg-gray-300 text-gray-500 dark:border-gray-500 dark:bg-gray-600"
                        : "border-green-500 bg-white text-green-600 dark:bg-gray-800 dark:text-green-400"
                  }`}
                >
                  {done ? "✓" : locked ? "🔒" : "·"}
                </span>
                <span className="text-gray-600 dark:text-gray-400">{moduleTitle}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {lesson.title}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
