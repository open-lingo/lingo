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
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { getNextLesson } from "@/features/course/nextLesson";
import { FlashcardsCard } from "@/features/flashcards/FlashcardsCard";
import { PracticeCard } from "@/features/practice/PracticeCard";
import { LanguagePickerModal } from "./LanguagePickerModal";
import { HomeNavCard } from "./HomeNavCard";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { EmptyActivityNotice } from "./components/EmptyActivityNotice";
import { RestructuredHome } from "./restructured/RestructuredHome";
import { Card, Button } from "@/shared/components/ui";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";

const storyCard = {
  to: "practice/stories",
  titleKey: "home.cards.stories",
  descKey: "home.cards.storiesDesc",
  iconName: "stories" as const,
};

export function HomePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const flags = useFeatureFlags();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { users } = useApi();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const nextLesson = course ? getNextLesson(course) : null;
  const langConfig = language ? getLanguageConfig(language.id) : null;

  const { data: me, error: meError, isError: meIsError } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 2;
    },
  });

  const { openProfile } = useModal();
  const hasOpenedRegistration = useRef(false);

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

  // First-name only, and never leak an email address into greetings.
  const friendlyName = (() => {
    const raw = welcomeName ?? "there";
    if (raw.includes("@")) return "there";
    return raw.split(/\s+/)[0] || "there";
  })();

  const isFirstTimeUser =
    isAuthenticated && getMockCompletedLessonIds().length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  const navCards = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {language ? (
        <HomeNavCard
          to={langPath("learn")}
          iconName="bookOpen"
          title={t("nav.learn")}
          description={t("home.cards.learnDesc")}
        />
      ) : null}
      <FlashcardsCard />
      <PracticeCard />
      {flags.practice.stories ? (
        <HomeNavCard
          to={langPath(storyCard.to)}
          iconName={storyCard.iconName}
          title={t(storyCard.titleKey)}
          description={t(storyCard.descKey)}
        />
      ) : null}
      <HomeNavCard
        to={langPath("community/explore")}
        iconName="globe"
        title={t("home.exploreDecks")}
        description={
          isAuthenticated
            ? t("home.newDecksThisWeek", { count: 3 })
            : t("home.discoverNewDecks")
        }
        iconTone="neutral"
      />
    </div>
  );

  return (
    <>
      {!language && <LanguagePickerModal />}
      <div className="space-y-8">
        {!isAuthenticated ? (
          <>
            <Card padding="lg">
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
                {t("home.welcomeGuest")}
              </h1>
              <p className="mt-2 text-lg text-text-secondary">{t("home.heroTagline")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/login">
                  <Button variant="primary">{t("home.getStarted")}</Button>
                </a>
                <Link to={langPath("community/explore")}>
                  <Button variant="secondary">{t("home.browseDecks")}</Button>
                </Link>
                {language ? (
                  <Link to={langPath("learn")}>
                    <Button variant="outline" accent>
                      {t("home.tryALesson")}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </Card>
            {navCards}
          </>
        ) : isFirstTimeUser ? (
          <>
            <WelcomeBanner
              name={friendlyName}
              language={langConfig ?? null}
              startLessonHref={langPath("learn")}
              firstLessonTitle={nextLesson?.lesson.title}
            />
            {navCards}
            <EmptyActivityNotice />
          </>
        ) : (
          <RestructuredHome greetingName={friendlyName} />
        )}
      </div>
    </>
  );
}
