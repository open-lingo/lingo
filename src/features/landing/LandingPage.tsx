import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { Icon } from "@/shared/components/Icon";
import { GitHubBadge } from "@/shared/components/GitHubBadge";
import { LandingFundingBlock } from "./LandingFundingBlock";
import { supportedLngs } from "@/shared/i18n/i18n";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";
import { BUILT_IN_THEMES } from "@/shared/theme/presets";
import { MOCK_COMMUNITY_THEMES } from "@/shared/theme/community-mock";

const LOCALE_NAMES: Record<string, string> = { en: "English", ko: "한국어" };
const THEME_COUNT = Object.keys(BUILT_IN_THEMES).length + MOCK_COMMUNITY_THEMES.length;
/** Placeholder until API; reflects community deck growth. */
const COMMUNITY_DECK_COUNT = 20;

const FEATURES: { icon: "graduationCap" | "bookOpen" | "bookText" | "globe" | "layers" | "video" | "copy" | "star" | "pencil" | "headphones"; key: string; descKey: string }[] = [
  { icon: "graduationCap", key: "featureCourses", descKey: "featureCoursesDesc" },
  { icon: "bookOpen", key: "featureFlashcards", descKey: "featureFlashcardsDesc" },
  { icon: "bookText", key: "featureStories", descKey: "featureStoriesDesc" },
  { icon: "pencil", key: "featureLetterPractice", descKey: "featureLetterPracticeDesc" },
  { icon: "layers", key: "featureParticles", descKey: "featureParticlesDesc" },
  { icon: "video", key: "featureVideos", descKey: "featureVideosDesc" },
  { icon: "copy", key: "featureAnkiImport", descKey: "featureAnkiImportDesc" },
  { icon: "star", key: "featureCommunityDecks", descKey: "featureCommunityDecksDesc" },
  { icon: "headphones", key: "featureForum", descKey: "featureForumDesc" },
  { icon: "globe", key: "featureOpenSource", descKey: "featureOpenSourceDesc" },
];

export function LandingPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <section className="py-16 text-center sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          {t("landing.heroTitle", "Learn languages with spaced repetition")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
          {t(
            "landing.heroSubtitle",
            "Open Lingo is a free, open-source language learning app. Courses, flashcards, stories, community decks, and more—all in one place."
          )}
        </p>
        <div className="mt-6 flex justify-center">
          <GitHubBadge />
        </div>
        <ul className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-2 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <Icon name="check" size={16} className="shrink-0 text-success" />
            {t("landing.heroBullet1", "Import Anki decks · Share with the community")}
          </li>
          <li className="flex items-center gap-2">
            <Icon name="check" size={16} className="shrink-0 text-success" />
            {t("landing.heroBullet2", "Letter practice, particle drills, videos with transcript")}
          </li>
          <li className="flex items-center gap-2">
            <Icon name="check" size={16} className="shrink-0 text-success" />
            {t("landing.heroBullet3", "Customize themes, fonts, and flashcards")}
          </li>
        </ul>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to={langPath("learn")}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition hover:bg-accent-hover"
          >
            {t("landing.getStarted", "Get started")}
            <Icon name="arrowRight" size={18} />
          </Link>
          <Link
            to={langPath("community")}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-text-primary transition hover:bg-surface-muted"
          >
            {t("landing.browseCommunity", "Browse community")}
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-text-primary transition hover:bg-surface-muted"
          >
            {t("auth.logIn")}
          </Link>
        </div>

        {/* Platform stats & languages */}
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("landing.localesLabel", "UI languages")}
              </p>
              <p className="mt-1 text-sm text-text-primary">
                {supportedLngs.map((lng) => LOCALE_NAMES[lng] ?? lng).join(" · ")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("landing.learningLanguagesLabel", "Learning languages")}
              </p>
              <p className="mt-1 text-sm text-text-primary">
                {AVAILABLE_LEARNING_LANGUAGES.map((l) => l.name).join(" · ")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-2xl font-bold text-accent">
                {COMMUNITY_DECK_COUNT}+
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {t("landing.statsDecksLabel", "community decks")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-2xl font-bold text-accent">
                {THEME_COUNT}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {t("landing.statsThemesLabel", "themes")}
              </p>
            </div>
          </div>

          {/* Funding / revenue model */}
          <div className="mt-6">
            <LandingFundingBlock />
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-border py-16">
        <h2 className="text-center text-2xl font-semibold text-text-primary">
          {t("landing.featuresTitle", "Everything you need")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-text-secondary">
          {t("landing.featuresSubtitle", "Structured courses, SRS flashcards, stories, and practice tools—plus community decks, forums, and Anki import.")}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, key, descKey }) => (
            <div key={key} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted text-accent">
                <Icon name={icon} size={22} />
              </div>
              <h3 className="mt-4 font-semibold text-text-primary">
                {t(`landing.${key}`)}
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                {t(`landing.${descKey}`)}
              </p>
              {key === "featureOpenSource" && (
                <div className="mt-4">
                  <GitHubBadge />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16 text-center">
        <h2 className="text-xl font-semibold text-text-primary">
          {t("landing.ctaTitle", "Ready to start learning?")}
        </h2>
        <p className="mt-2 text-text-secondary">
          {t("landing.ctaSubtitle", "Sign in or create an account to sync your progress across devices.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to={langPath("learn")}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition hover:bg-accent-hover"
          >
            {t("landing.getStarted", "Get started")}
            <Icon name="arrowRight" size={18} />
          </Link>
          <Link
            to={langPath("community")}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-text-primary transition hover:bg-surface-muted"
          >
            {t("landing.browseCommunity", "Browse community")}
          </Link>
        </div>
      </section>
    </div>
  );
}
