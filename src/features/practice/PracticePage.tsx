import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getPracticeItemsForLanguage } from "@/features/practice/practiceNavItems";
import type { PracticeNavItem } from "@/features/practice/practiceNavItems";
import { useFlashcardDueSummary } from "@/features/flashcards/useFlashcardDueSummary";
import {
  PracticeHubJumpCard,
  PracticeHubSection,
  type HubQuickLink,
} from "@/features/practice/PracticeHubSection";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  getDueReviews,
  reviewModuleIdFor,
} from "@/features/lesson/data/moduleReviewSchedule";

function bucketTrainers(items: PracticeNavItem[]) {
  const alphabets: PracticeNavItem[] = [];
  const particles: PracticeNavItem[] = [];
  const kanji: PracticeNavItem[] = [];
  const components: PracticeNavItem[] = [];
  const stories: PracticeNavItem[] = [];
  const videos: PracticeNavItem[] = [];
  const external: PracticeNavItem[] = [];

  for (const item of items) {
    const u = item.to;
    if (u.includes("/practice/alphabet")) alphabets.push(item);
    else if (u.includes("/practice/particles")) particles.push(item);
    else if (u.includes("/practice/kanji")) kanji.push(item);
    else if (u.includes("/practice/components")) components.push(item);
    else if (u.includes("/practice/stories")) stories.push(item);
    else if (u.includes("/practice/videos")) videos.push(item);
    else if (u.includes("/practice/external-content")) external.push(item);
  }

  return { alphabets, particles, kanji, components, stories, videos, external };
}

function trainerLabel(item: PracticeNavItem, t: (k: string) => string): string {
  return item.labelKey ? t(item.labelKey) : (item.label ?? item.to);
}

export function PracticePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";
  const flags = useFeatureFlags();
  const languageName = getLanguageConfig(langId)?.name ?? langId;

  const { dueCount, isLoading: dueLoading } = useFlashcardDueSummary(langId);

  // Module reviews — surface a Practice-page jump card when any are due.
  const reviewCourse = useMemo(() => getMockCourse(langId), [langId]);
  const dueReviews = useMemo(() => getDueReviews(reviewCourse), [reviewCourse]);
  const reviewSubtitle =
    dueReviews.length > 0
      ? t("practice.hub.reviewsDueSummary", {
          defaultValue: "{{count}} module reviews due",
          count: dueReviews.length,
        })
      : t("practice.hub.reviewsCaughtUp", {
          defaultValue: "All caught up",
        });
  const topReviewModuleId = dueReviews[0]
    ? reviewModuleIdFor(dueReviews[0].moduleId)
    : null;
  const topReviewLink = topReviewModuleId
    ? langPath(`learn/lessons/ja-${topReviewModuleId}-1`)
    : langPath("learn");

  const navItems = getPracticeItemsForLanguage(language?.id, flags);
  const trainerItems = navItems.filter((item) => !item.to.endsWith("/practice/flashcards"));
  const buckets = bucketTrainers(trainerItems);

  const cfg = language ? getLanguageConfig(language.id) : null;
  const scriptDefs = cfg?.alphabets ?? (cfg?.alphabet ? [cfg.alphabet] : []);
  const defaultScriptId = scriptDefs[0]?.id;

  const firstAlphabet = buckets.alphabets[0];
  const alphabetPrimary = langPath("practice/alphabet");
  const firstAlphabetIdFromUrl =
    firstAlphabet?.to.match(/\/practice\/alphabet\/([^/]+)/)?.[1] ?? defaultScriptId;

  const flashSubtitle = dueLoading
    ? t("common.loading")
    : dueCount > 0
      ? t("practice.hub.dueSummary", { count: dueCount })
      : t("flashcards.noDue");

  const flashQuick: HubQuickLink[] = [];
  if (!dueLoading && dueCount > 0) {
    flashQuick.push({
      kind: "link",
      to: langPath("practice/flashcards/review"),
      label: t("practice.hub.pendingReview"),
      emphasis: "accent",
    });
  }
  flashQuick.push(
    { kind: "link", to: langPath("practice/flashcards/decks"), label: t("flashcards.deckManager.title") },
    { kind: "link", to: langPath("practice/flashcards/cards"), label: t("flashcards.cardManager.title") },
    { kind: "link", to: langPath("community/explore"), label: t("flashcards.browseDecks") },
    { kind: "link", to: langPath("practice/flashcards"), label: t("flashcards.studyShortcuts.title", "Quick study") },
  );

  const grammarQuick: HubQuickLink[] = [];
  for (const p of buckets.particles) {
    grammarQuick.push({ kind: "link", to: p.to, label: trainerLabel(p, t) });
  }
  grammarQuick.push(
    { kind: "soon", label: t("practice.hub.grammarVerb") },
    { kind: "soon", label: t("practice.hub.grammarSentence") },
    { kind: "soon", label: t("practice.hub.grammarRegister") },
  );

  const alphabetQuick: HubQuickLink[] = [];
  if (firstAlphabetIdFromUrl) {
    const base = langPath(`practice/alphabet/${firstAlphabetIdFromUrl}`);
    const learn = langPath(`practice/alphabet/${firstAlphabetIdFromUrl}/learn`);
    alphabetQuick.push(
      { kind: "link", to: learn, label: t("practice.hub.guidedLesson") },
      { kind: "link", to: learn, label: t("practice.hub.writingPractice") },
      { kind: "link", to: base, label: t("practice.hub.listeningPractice") },
    );
  }
  for (const a of buckets.alphabets) {
    const idMatch = a.to.match(/\/practice\/alphabet\/([^/]+)/)?.[1];
    if (!idMatch || idMatch === firstAlphabetIdFromUrl) continue;
    alphabetQuick.push({ kind: "link", to: a.to, label: trainerLabel(a, t) });
  }

  const moreStrip = [...buckets.kanji, ...buckets.components];

  const jumpAlphabetSubtitle =
    buckets.alphabets.length > 0
      ? buckets.alphabets
          .map((a) => trainerLabel(a, t))
          .slice(0, 3)
          .join(" · ")
      : undefined;

  return (
    <div className="space-y-3 sm:space-y-4">
      <header className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4">
        <h1 className="text-xl font-bold leading-tight text-text-primary sm:text-2xl">{t("nav.practice")}</h1>
        <p className="max-w-2xl text-xs leading-snug text-text-secondary sm:text-sm">{t("practice.intro")}</p>
      </header>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <PracticeHubJumpCard
          to={topReviewLink}
          iconName="refresh"
          title={t("practice.hub.reviewsTitle", { defaultValue: "Module reviews" })}
          subtitle={reviewSubtitle}
          footerLabel={t("practice.hub.jumpOpen")}
        />
        <PracticeHubJumpCard
          to={langPath("practice/flashcards")}
          iconName="graduationCap"
          title={t("flashcards.title")}
          subtitle={flashSubtitle}
          footerLabel={t("practice.hub.jumpOpen")}
        />
        <PracticeHubJumpCard
          to={langPath("practice/grammar")}
          iconName="bookOpen"
          title={t("practice.hub.grammarTitle")}
          subtitle={t("practice.hub.grammarJumpSubtitle")}
          footerLabel={t("practice.hub.jumpOpen")}
        />
        {buckets.alphabets.length > 0 ? (
          <PracticeHubJumpCard
            to={alphabetPrimary}
            iconName="layers"
            title={t("practice.hub.alphabetJumpTitle")}
            subtitle={jumpAlphabetSubtitle}
            footerLabel={t("practice.hub.jumpOpen")}
          />
        ) : null}
        {buckets.stories.map((s) => (
          <PracticeHubJumpCard
            key={s.to}
            to={s.to}
            iconName="stories"
            title={trainerLabel(s, t)}
            subtitle={t("practice.hub.storiesJumpSubtitle")}
            footerLabel={t("practice.hub.jumpOpen")}
          />
        ))}
        {buckets.videos.map((v) => (
          <PracticeHubJumpCard
            key={v.to}
            to={v.to}
            iconName="video"
            title={trainerLabel(v, t)}
            subtitle={t("practice.hub.videosJumpSubtitle")}
            footerLabel={t("practice.hub.jumpOpen")}
          />
        ))}
        {buckets.external.map((e) => (
          <PracticeHubJumpCard
            key={e.to}
            to={e.to}
            iconName="link"
            title={trainerLabel(e, t)}
            subtitle={t("practice.hub.externalJumpSubtitle")}
            footerLabel={t("practice.hub.jumpOpen")}
          />
        ))}
      </div>

      <div className="space-y-2.5">
        <PracticeHubSection
          ariaLabelledBy="hub-flashcards"
          iconName="graduationCap"
          title={t("flashcards.title")}
          subtitle={t("flashcards.subtitle", { language: languageName })}
          primaryTo={langPath("practice/flashcards")}
          primaryLabel={t("practice.hub.openWorkspace")}
          quickLinks={flashQuick}
        />

        <PracticeHubSection
          ariaLabelledBy="hub-grammar"
          iconName="bookOpen"
          title={t("practice.hub.grammarTitle")}
          subtitle={t("practice.hub.grammarSubtitle")}
          primaryTo={langPath("practice/grammar")}
          primaryLabel={t("practice.hub.openGrammar")}
          quickLinks={grammarQuick}
        />

        {buckets.alphabets.length > 0 ? (
          <PracticeHubSection
            ariaLabelledBy="hub-alphabet"
            iconName="layers"
            title={t("practice.hub.alphabetSectionTitle")}
            subtitle={t("practice.hub.alphabetSectionSubtitle")}
            primaryTo={alphabetPrimary}
            primaryLabel={t("practice.hub.openAlphabet")}
            quickLinks={alphabetQuick}
          />
        ) : null}

        {moreStrip.length > 0 ? (
          <section
            className="rounded-xl border border-border bg-surface p-3"
            aria-label={t("practice.hub.moreTrainers")}
          >
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("practice.hub.moreTrainers")}
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {moreStrip.map((item) => (
                <li key={item.to + (item.label ?? "")}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-xs font-medium text-text-primary hover:bg-surface"
                  >
                    {item.iconName ? <Icon name={item.iconName} size={14} aria-hidden /> : null}
                    {!item.iconName && item.sampleCharacter ? (
                      <span className="text-sm" aria-hidden>
                        {item.sampleCharacter}
                      </span>
                    ) : null}
                    {trainerLabel(item, t)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
