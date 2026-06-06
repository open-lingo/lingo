import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { ApiError } from "@/shared/api/client";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { FlashcardsCard } from "@/features/flashcards/FlashcardsCard";
import { PracticeCard } from "@/features/practice/PracticeCard";
import { LanguagePickerModal } from "./LanguagePickerModal";
import { HomeNavCard } from "./HomeNavCard";
import { RestructuredHome } from "./restructured/RestructuredHome";
import { Card, Button } from "@/shared/components/ui";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { useHomePrefetch } from "./useHomePrefetch";

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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { users } = useApi();
  const { language } = useLanguage();
  const { isProgressReady, isLoading: progressLoading } = useProgressMe();
  // Idle-prefetch the most-likely next routes (learn/social/community/shop).
  useHomePrefetch();

  // Fix M8 — user-scoped key (shared with useLearnProfile).
  const userIdKey = user?.sub ?? "anon";
  const { data: me, error: meError, isError: meIsError } = useQuery({
    queryKey: ["users", userIdKey, "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 2;
    },
  });

  const navigate = useNavigate();
  const hasRedirectedToRegister = useRef(false);

  useEffect(() => {
    if (
      isAuthenticated &&
      meIsError &&
      meError instanceof ApiError &&
      meError.status === 404 &&
      !hasRedirectedToRegister.current
    ) {
      hasRedirectedToRegister.current = true;
      // No backend record yet — send them to the public profile in
      // register mode. Username is seeded from Auth0 claims and the page
      // hosts the inline register form (same surface as edit).
      const fallback =
        user?.nickname?.trim() ||
        user?.email?.split("@")[0]?.trim() ||
        "";
      if (fallback) {
        navigate(`/u/${encodeURIComponent(fallback)}?register=1`, { replace: true });
      }
    }
  }, [isAuthenticated, meIsError, meError, navigate, user]);

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

  const waitingForProgress = isAuthenticated && !isProgressReady && progressLoading;

  if (authLoading || waitingForProgress) {
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
        ) : (
          // FTUE branch (WelcomeBanner + EmptyActivityNotice) intentionally
          // disabled — restructured home renders for ALL signed-in users.
          // FTUE-specific empty states will land in a follow-up.
          <RestructuredHome greetingName={friendlyName} />
        )}
      </div>
    </>
  );
}
