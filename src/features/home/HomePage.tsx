import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/auth/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMockCourse } from "@/features/course/mockCourse";
import { getNextLesson } from "@/features/course/nextLesson";
import { ModuleCard } from "@/features/course/ModuleCard";
import { ProgressSummary } from "@/features/progress/ProgressSummary";
import { PracticeCard } from "@/features/practice/PracticeCard";

const cardKeys = [
  { to: "/flashcards", titleKey: "home.cards.flashcards", descKey: "home.cards.flashcardsDesc", icon: "📚" },
  { to: "/stories", titleKey: "home.cards.stories", descKey: "home.cards.storiesDesc", icon: "📖" },
  { to: "/vocab", titleKey: "home.cards.vocab", descKey: "home.cards.vocabDesc", icon: "📝" },
] as const;

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const nextLesson = course ? getNextLesson(course) : null;

  const welcomeName = user?.name ?? user?.email ?? "there";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
        {isAuthenticated ? t("home.welcomeBack", { name: welcomeName }) : t("home.welcomeGuest")}
      </h1>

      {isAuthenticated && (
        <>
          {nextLesson && (
            <Link
              to="/practice"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            >
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("home.continueLearning")}
                </p>
                <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                  {nextLesson.module} · {nextLesson.lesson.title}
                </p>
              </div>
              <span className="text-gray-400 dark:text-gray-500" aria-hidden>
                →
              </span>
            </Link>
          )}
          <ProgressSummary />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardKeys.map(({ to, titleKey, descKey, icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:shadow-md"
          >
            <span className="mb-3 text-3xl" aria-hidden>
              {icon}
            </span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t(titleKey)}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t(descKey)}
            </p>
          </Link>
        ))}
        <PracticeCard />
      </div>

      {course && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("home.yourCourse")}
            </h2>
            <Link
              to="/course-map"
              className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              View path →
            </Link>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {course.title}
          </p>
          <div className="space-y-3">
            {course.modules.map((mod) => (
              <ModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-wrap gap-3">
        <Link
          to="/stories"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("home.quickLinks.startStory")}
        </Link>
        <Link
          to="/grammar"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("home.quickLinks.grammarHeatmap")}
        </Link>
        <Link
          to="/leaderboard"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("home.quickLinks.leaderboard")}
        </Link>
        <Link
          to="/community"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("home.quickLinks.community")}
        </Link>
      </section>
    </div>
  );
}
