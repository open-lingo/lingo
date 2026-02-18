import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMockCourse } from "@/features/course/mockCourse";
import { getMockCompletedLessonIds } from "@/features/course/mockProgress";
import { getTrendingCourses } from "@/features/community/mockCommunity";
import { getLanguageConfig } from "@/core/languageConfig";
import { ModuleCard } from "@/features/course/ModuleCard";

export function LearnCoursesPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const completedIds = getMockCompletedLessonIds();
  const customCourses = language ? getTrendingCourses(language.id) : [];

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-gray-500 dark:text-gray-400">
          Select a learning language in Settings to see your courses.
        </p>
        <Link to="/settings" className="text-sm text-blue-600 dark:text-blue-400">
          → Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {course.title}
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {t("learn.officialCourseDesc")}
        </p>
        <div className="space-y-3">
          {course.modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              completedLessonIds={completedIds}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {t("learn.customCourseModules")}
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {t("learn.customCourseModulesDesc")}
        </p>
        {customCourses.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("learn.noCustomModules")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {customCourses.map((addon) => {
              const lang = getLanguageConfig(addon.languageId);
              const flag = lang?.flag ?? "🌐";
              return (
                <Link
                  key={addon.id}
                  to="/community/content"
                  className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                >
                  <span className="text-2xl" role="img">
                    {flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {addon.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {addon.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Link
          to="/community/content"
          className="mt-3 inline-block text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          {t("learn.browseAllCourses")} →
        </Link>
      </section>

      <Link
        to="/"
        className="inline-block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
