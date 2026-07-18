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
import { HomeMain } from "./variants/HomeMain";
import { Card, Button, Skeleton } from "@/shared/components/ui";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";
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
    // /users/me drives the home banner (xp, streak, etc.). LessonProgressHydrate
    // invalidates ["progress","me"] and ["users",uid,"me"] after each lesson
    // sync, and any /users/me mutation invalidates this key too — so we cache
    // at 5 min and rely on the invalidate path for freshness. Was 60s, which
    // refired every cross-page nav after a minute idle.
    staleTime: 5 * 60_000,
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
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">{t("common.loading")}</span>
        <Skeleton shape="text" width="w-56" height="h-8" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-card border border-border bg-surface p-5">
              <Skeleton shape="circle" width="w-10" height="h-10" />
              <Skeleton shape="text" width="w-32" height="h-5" className="mt-3" />
              <Skeleton shape="text" lines={2} className="mt-2" />
            </div>
          ))}
        </div>
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
      {isCommunityEnabled(flags) ? (
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
      ) : null}
    </div>
  );

  if (isAuthenticated) {
    return (
      <>
        {!language && <LanguagePickerModal />}
        {/* Fill the shell's hub canvas (Layout <main> centers + sizes it). The
            flex-1 chain must be unbroken from main → here → HomeMain's grid. */}
        <div className="flex flex-1 flex-col">
          <HomeMain greetingName={friendlyName} />
        </div>
      </>
    );
  }

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
                {isCommunityEnabled(flags) ? (
                  <Link to={langPath("community/explore")}>
                    <Button variant="secondary">{t("home.browseDecks")}</Button>
                  </Link>
                ) : null}
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
          // disabled — the redesigned home renders for ALL signed-in users.
          // FTUE-specific empty states will land in a follow-up.
          <HomeMain greetingName={friendlyName} />
        )}
      </div>
    </>
  );
}
