import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { ApiError } from "@/shared/api/client";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useModal } from "@/shared/contexts/ModalContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getMockCourse } from "@/features/course/mockCourse";
import { getNextLesson } from "@/features/course/nextLesson";
import { ModuleCard } from "@/features/course/components";
import { ProgressSummary } from "@/features/progress/ProgressSummary";
import { FlashcardsCard } from "@/features/flashcards/FlashcardsCard";
import { PracticeCard } from "@/features/practice/PracticeCard";
import { LanguagePickerModal } from "./LanguagePickerModal";
import { Card, Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";

const cardKeys = [
  { to: "practice/stories", titleKey: "home.cards.stories", descKey: "home.cards.storiesDesc", iconName: "stories" as const },
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

  const { data: me, error: meError, isError: meIsError } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
    retry: (failureCount, err) => {
      // 404 = user not registered; no point retrying
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 2;
    },
  });

  const { openProfile } = useModal();
  const hasOpenedRegistration = useRef(false);

  // When getMe returns 404, user is authenticated but not registered — open profile so they can complete signup
  useEffect(() => {
    if (
      isAuthenticated &&
      meIsError &&
      meError instanceof ApiError &&
      meError.status === 404 &&
      !hasOpenedRegistration.current
    ) {
      hasOpenedRegistration.current = true;
      openProfile();
    }
  }, [isAuthenticated, meIsError, meError, openProfile]);

  const welcomeName =
    me?.display_name?.trim() ??
    user?.name ??
    user?.given_name ??
    user?.email ??
    "there";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <>
      {!language && <LanguagePickerModal />}
      <div className="space-y-8">
        {!isAuthenticated ? (
          /* Logged-out: hero, CTAs, simplified layout */
          <>
            <Card padding="lg">
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
                {t("home.welcomeGuest")}
              </h1>
              <p className="mt-2 text-lg text-text-secondary">
                {t("home.heroTagline")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/login">
                  <Button variant="primary">{t("home.getStarted")}</Button>
                </a>
                <Link to={langPath("community/explore")}>
                  <Button variant="secondary">{t("home.browseDecks")}</Button>
                </Link>
                {language && (
                  <Link to={langPath("learn")}>
                    <Button variant="outline" accent>
                      {t("home.tryALesson")}
                    </Button>
                  </Link>
                )}
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FlashcardsCard />
              {cardKeys.map(({ to, titleKey, descKey, iconName }) => (
                <Link key={to} to={langPath(to)} className="block">
                  <Card className="group flex h-full flex-col transition hover:shadow-md">
                    <span className="mb-3 flex h-9 w-9 items-center justify-center" aria-hidden>
                      <Icon name={iconName} size={36} />
                    </span>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {t(titleKey)}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {t(descKey)}
                    </p>
                  </Card>
                </Link>
              ))}
              <Link to={langPath("community/explore")} className="block">
                <Card className="group flex h-full flex-col transition hover:shadow-md">
                  <span className="mb-3 flex shrink-0 items-center justify-center" aria-hidden>
                    <Icon name="globe" size={36} />
                  </span>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("home.exploreDecks")}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {t("home.discoverNewDecks")}
                  </p>
                </Card>
              </Link>
            </div>
          </>
        ) : (
          /* Logged-in: full layout */
          <>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              {t("home.welcomeBack", { name: welcomeName })}
            </h1>

            {nextLesson && (
              <Link
                to={langPath("learn")}
                className="relative flex min-h-[160px] items-center justify-between overflow-hidden rounded-xl border border-border p-6 transition hover:shadow-md"
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
                  <span className="absolute inset-0 bg-surface" aria-hidden />
                )}
                <div className="relative flex-1">
                  <p
                    className={`text-sm font-medium ${
                      hasBgImage ? "text-gray-200" : "text-text-secondary"
                    }`}
                  >
                    {t("home.continueLearning")}
                  </p>
                  <p
                    className={`mt-0.5 font-semibold ${
                      hasBgImage ? "text-white" : "text-text-primary"
                    }`}
                  >
                    {nextLesson.module} · {nextLesson.lesson.title}
                  </p>
                </div>
                <span
                  className="relative flex shrink-0 items-center justify-center text-accent transition hover:text-accent-hover"
                  aria-hidden
                >
                  <Icon name="arrowBigRight" size={24} />
                </span>
              </Link>
            )}
            <ProgressSummary />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FlashcardsCard />
              {cardKeys.map(({ to, titleKey, descKey, iconName }) => (
                <Link key={to} to={langPath(to)} className="block">
                  <Card className="group flex h-full flex-col transition hover:shadow-md">
                    <span className="mb-3 flex h-9 w-9 items-center justify-center" aria-hidden>
                      <Icon name={iconName} size={36} />
                    </span>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {t(titleKey)}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {t(descKey)}
                    </p>
                  </Card>
                </Link>
              ))}
              <PracticeCard />
              <Link to={langPath("community/explore")} className="block">
                <Card className="group flex h-full flex-col transition hover:shadow-md">
                  <span className="mb-3 flex shrink-0 items-center justify-center" aria-hidden>
                    <Icon name="globe" size={36} />
                  </span>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("home.discoverNewDecks")}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {t("home.newDecksThisWeek", { count: 3 })}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    {t("home.exploreDecks")} <Icon name="arrowBigRight" size={16} />
                  </span>
                </Card>
              </Link>
            </div>

            {course && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {t("home.yourCourse")}
                  </h2>
                  <Link
                    to={langPath("learn")}
                    className="text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    {t("home.viewPath")} <Icon name="arrowBigRight" size={14} className="inline" />
                  </Link>
                </div>
                <p className="text-sm text-text-secondary">
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
              <Link to={langPath("practice/stories")}>
                <Button variant="secondary">{t("home.quickLinks.startStory")}</Button>
              </Link>
              <Link to={langPath("grammar")}>
                <Button variant="secondary">{t("home.quickLinks.grammarHeatmap")}</Button>
              </Link>
              <Link to={langPath("community/leaderboard")}>
                <Button variant="secondary">{t("home.quickLinks.leaderboard")}</Button>
              </Link>
              <Link to={langPath("community")}>
                <Button variant="secondary">{t("home.quickLinks.community")}</Button>
              </Link>
            </section>
          </>
        )}
      </div>
    </>
  );
}
