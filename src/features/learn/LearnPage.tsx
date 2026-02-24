import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useModal } from "@/shared/contexts/ModalContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getMockCourse, ALPHABET_LESSON_ID } from "@/features/course/mockCourse";
import { getMockCompletedLessonIds } from "@/features/course/mockProgress";
import { getAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";
import { getTrendingCourses } from "@/features/community/mockCommunity";
import { getCommunityProgressMap } from "./communityProgress";
import { MainCourseCard, CommunityModuleCard } from "./components";

export function LearnPage() {
  const { t } = useTranslation();
  const { openSettings } = useModal();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const [completedIds, setCompletedIds] = useState(() => getMockCompletedLessonIds());
  const customCourses = language ? getTrendingCourses(language.id) : [];
  const communityProgress = getCommunityProgressMap();

  const firstLesson = course?.modules[0]?.lessons[0];
  const alphabetLesson =
    firstLesson?.kind === "alphabet" && firstLesson.alphabetId ? firstLesson : null;
  const alphabetProgress =
    language && alphabetLesson && alphabetLesson.alphabetId
      ? getAlphabetProgress(language.id, alphabetLesson.alphabetId)
      : null;
  const alphabetCompleted = alphabetProgress?.fullTestPassed ?? false;
  const completedLessonIds = Array.from(
    new Set([...completedIds, ...(alphabetCompleted ? [ALPHABET_LESSON_ID] : [])])
  );

  // Filter to community course addons only
  const communityCourseAddons = customCourses.filter((a) => a.kind === "course");

  const handleStartOver = () => {
    setCompletedIds([]);
  };

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-gray-500 dark:text-gray-400">
          Select a learning language in Settings to see your course path.
        </p>
        <button
          type="button"
          onClick={openSettings}
          className="text-sm text-blue-600 dark:text-blue-400"
        >
          → Settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Sample lesson demo */}
      <section className="flex flex-wrap gap-3">
        <Link
          to={langPath("learn/lessons/m1-l1")}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          ▶ Sample Lesson: Greetings
        </Link>
        <Link
          to={langPath("learn/lessons/m1-l2")}
          className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
        >
          ▶ Sample Lesson: Introductions
        </Link>
      </section>

      {/* Main course - full card */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {course.title}
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {t("learn.officialCourseDesc")}
        </p>
        <MainCourseCard
          course={course}
          completedLessonIds={completedLessonIds}
          onStartOver={handleStartOver}
        />
      </section>

      {/* Community modules - stacked expandable cards */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {t("learn.communityModules")}
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {t("learn.communityModulesDesc")}
        </p>
        {communityCourseAddons.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("learn.noCommunityModules")}
          </p>
        ) : (
          <div className="space-y-3">
            {communityCourseAddons.map((addon) => (
              <CommunityModuleCard
                key={addon.id}
                addon={addon}
                completedCount={communityProgress.get(addon.id) ?? 0}
              />
            ))}
          </div>
        )}
        <Link
          to={langPath("community/explore")}
          className="mt-3 inline-block text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          {t("learn.browseAllCourses")} →
        </Link>
      </section>

      <Link
        to={langPath("")}
        className="inline-block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
