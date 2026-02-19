import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getMockCourse } from "@/features/course/mockCourse";
import { getNextLesson } from "@/features/course/nextLesson";
import { ModuleCard } from "@/features/course/components";
import { ProgressSummary } from "@/features/progress/ProgressSummary";
import { FlashcardsCard } from "@/features/flashcards/FlashcardsCard";
import { PracticeCard } from "@/features/practice/PracticeCard";
import { LanguagePickerModal } from "./LanguagePickerModal";

const cardKeys = [
  { to: "practice/stories", titleKey: "home.cards.stories", descKey: "home.cards.storiesDesc", icon: "📖" },
] as const;

export function HomePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { users } = useApi();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const nextLesson = course ? getNextLesson(course) : null;
  const langConfig = language ? getLanguageConfig(language.id) : null;
  const hasBgImage = Boolean(langConfig?.backgroundImage);

  const { data: me } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
  });

  const welcomeName =
    me?.display_name?.trim() ??
    user?.name ??
    user?.given_name ??
    user?.email ??
    "there";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <>
      {!language && <LanguagePickerModal />}
      <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
        {isAuthenticated ? t("home.welcomeBack", { name: welcomeName }) : t("home.welcomeGuest")}
      </h1>

      {isAuthenticated && (
        <>
          {nextLesson && (
            <Link
              to={langPath("learn")}
              className="relative flex min-h-[160px] items-center justify-between overflow-hidden rounded-xl border border-gray-200 p-6 transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:hover:border-gray-600"
              style={
                langConfig?.backgroundImage
                  ? {
                      backgroundImage: `url(${langConfig.backgroundImage})`,
                      backgroundSize: langConfig.backgroundImageFit ?? "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {hasBgImage && (
                <span
                  className="absolute inset-0 bg-black/50 dark:bg-black/60"
                  aria-hidden
                />
              )}
              {!hasBgImage && (
                <span className="absolute inset-0 bg-white dark:bg-gray-800" aria-hidden />
              )}
              <div className="relative flex-1">
                <p
                  className={`text-sm font-medium ${
                    hasBgImage
                      ? "text-gray-200"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {t("home.continueLearning")}
                </p>
                <p
                  className={`mt-0.5 font-semibold ${
                    hasBgImage ? "text-white" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {nextLesson.module} · {nextLesson.lesson.title}
                </p>
              </div>
              <span
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white transition hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                aria-hidden
              >
                →
              </span>
            </Link>
          )}
          <ProgressSummary />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FlashcardsCard />
        {cardKeys.map(({ to, titleKey, descKey, icon }) => (
          <Link
            key={to}
            to={langPath(to)}
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
              to={langPath("learn")}
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
          to={langPath("practice/stories")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("home.quickLinks.startStory")}
        </Link>
        <Link
          to={langPath("grammar")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("home.quickLinks.grammarHeatmap")}
        </Link>
        <Link
          to={langPath("community/leaderboard")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("home.quickLinks.leaderboard")}
        </Link>
        <Link
          to={langPath("community")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t("home.quickLinks.community")}
        </Link>
      </section>
    </div>
    </>
  );
}
