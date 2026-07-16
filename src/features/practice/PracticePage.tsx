import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Card, WeekSparkline } from "@/shared/components/ui";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";
import { getPracticeItemsForLanguage } from "@/features/practice/practiceNavItems";
import type { PracticeNavItem } from "@/features/practice/practiceNavItems";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  getDueReviews,
  reviewModuleIdFor,
} from "@/features/lesson/data/moduleReviewSchedule";
import { useCourseLevel } from "@/features/practice/useCourseLevel";
import { getPracticeFeatures } from "@/features/practice/practiceUnlockConfig";
import { usePracticeStats } from "@/features/practice/hooks/usePracticeStats";
import { PracticeStatTile } from "@/features/practice/components/PracticeStatTile";
import { PracticeActionCard } from "@/features/practice/components/PracticeActionCard";

// Pre-made course strip per learning language. Surface curated entry points
// to existing trainers/routes — no new stub pages. When real per-language
// course catalogs are wired, this constant moves into the domain layer.
const PRE_MADE_COURSES: Record<
  string,
  Array<{ id: string; emoji: string; title: string; subtitle: string; to: string }>
> = {
  ko: [
    { id: "hangul", emoji: "한", title: "Hangul basics", subtitle: "Master the Korean alphabet", to: "practice/alphabet" },
    { id: "ko-particles", emoji: "은/는", title: "Korean particles", subtitle: "Reference guide — 은·는·이·가 and friends", to: "practice/particles" },
    { id: "ko-top100", emoji: "100", title: "Top 100 Korean words", subtitle: "Most common vocabulary", to: "vocab" },
  ],
  ja: [
    { id: "hiragana", emoji: "あ", title: "Hiragana", subtitle: "46 syllabary signs", to: "practice/alphabet/hiragana" },
    { id: "katakana", emoji: "ア", title: "Katakana", subtitle: "Loanword syllabary", to: "practice/alphabet/katakana" },
    { id: "n5-kanji", emoji: "漢", title: "JLPT N5 Kanji", subtitle: "First 100 characters", to: "practice/kanji" },
    { id: "ja-particles", emoji: "は/が", title: "Particles", subtitle: "Reference guide — は·が·を·に·で meanings", to: "practice/particles" },
    { id: "ja-top100", emoji: "100", title: "Top 100 Japanese words", subtitle: "Most common vocabulary", to: "vocab" },
  ],
};

function bucketTrainers(items: PracticeNavItem[]) {
  const alphabets: PracticeNavItem[] = [];
  const kanji: PracticeNavItem[] = [];
  const components: PracticeNavItem[] = [];

  for (const item of items) {
    const u = item.to;
    if (u.includes("/practice/alphabet")) alphabets.push(item);
    else if (u.includes("/practice/kanji")) kanji.push(item);
    else if (u.includes("/practice/components")) components.push(item);
  }

  return { alphabets, kanji, components };
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

  const stats = usePracticeStats(langId);
  const courseLevel = useCourseLevel();

  // Module reviews — server/local review schedule, not mock data.
  const reviewCourse = useMemo(() => getMockCourse(langId), [langId]);
  const dueReviews = useMemo(() => getDueReviews(reviewCourse), [reviewCourse]);
  const topReviewModuleId = dueReviews[0]
    ? reviewModuleIdFor(dueReviews[0].moduleId)
    : null;
  const topReviewLink = topReviewModuleId
    ? langPath(`learn/lessons/ja-${topReviewModuleId}-1`)
    : langPath("learn");

  const navItems = getPracticeItemsForLanguage(language?.id, flags);
  const trainerItems = navItems.filter(
    (item) => !item.to.endsWith("/practice/flashcards"),
  );
  const buckets = bucketTrainers(trainerItems);

  const cfg = language ? getLanguageConfig(language.id) : null;
  const scriptDefs = cfg?.alphabets ?? (cfg?.alphabet ? [cfg.alphabet] : []);
  const defaultScriptId = scriptDefs[0]?.id;
  const firstAlphabet = buckets.alphabets[0];
  const alphabetPrimary = langPath("practice/alphabet");
  const firstAlphabetIdFromUrl =
    firstAlphabet?.to.match(/\/practice\/alphabet\/([^/]+)/)?.[1] ?? defaultScriptId;

  const courses = (language?.id && PRE_MADE_COURSES[language.id]) || [];
  const skillFeatures = getPracticeFeatures(langId);
  const trainerStrip = [...buckets.kanji, ...buckets.components];

  const hasDue = !stats.isLoading && stats.dueCount > 0;

  return (
    <div className="space-y-4">
      {/* Overview — slim hero with real FSRS stats. */}
      <Card padding="md">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {t("practice.overview.kicker", { defaultValue: "Practice" })}
            </p>
            <h1 className="mt-1 text-xl font-extrabold leading-tight text-text-primary sm:text-2xl">
              {t("nav.practice")}
            </h1>
            <p className="mt-1.5 max-w-md text-sm leading-snug text-text-secondary">
              {t("practice.intro")}
            </p>
            {stats.total > 0 ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
                <Icon name="graduationCap" size={14} aria-hidden />
                {t("practice.overview.masteredCaption", {
                  defaultValue: "{{mastered}} mastered · {{learning}} learning",
                  mastered: stats.mastered,
                  learning: stats.learning,
                })}
              </p>
            ) : null}
          </div>

          {/* FSRS stat tiles — cards due, retention, streak, weekly reviews. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-2.5">
            <PracticeStatTile
              icon="refresh"
              tone="accent"
              value={stats.dueCount}
              label={t("practice.overview.statDueLabel", { defaultValue: "Cards due" })}
              caption={t("practice.overview.statDueCaption", { defaultValue: "ready to review" })}
            />
            <PracticeStatTile
              icon="target"
              value={
                stats.hasRetention
                  ? `${stats.retention}%`
                  : t("practice.overview.statRetentionEmpty", { defaultValue: "—" })
              }
              label={t("practice.overview.statRetentionLabel", { defaultValue: "Retention" })}
              caption={
                stats.hasRetention
                  ? t("practice.overview.statRetentionCaption", { defaultValue: "recall accuracy" })
                  : t("practice.overview.statRetentionEmptyCaption", { defaultValue: "review to build" })
              }
            />
            <PracticeStatTile
              icon="flame"
              value={stats.streak}
              label={t("practice.overview.statStreakLabel", { defaultValue: "Day streak" })}
              caption={
                stats.bestStreak > 0
                  ? t("practice.overview.statStreakCaption", { defaultValue: "best {{best}}", best: stats.bestStreak })
                  : t("practice.overview.statStreakCaptionEmpty", { defaultValue: "start today" })
              }
            />
            <PracticeStatTile
              icon="barChart"
              value={stats.weekTotalReviews}
              label={t("practice.overview.statReviewsLabel", { defaultValue: "Reviews" })}
              caption={t("practice.overview.statReviewsCaption", {
                defaultValue: "{{count}} this week · {{days}}/7 active",
                count: stats.weekTotalReviews,
                days: stats.daysActiveThisWeek,
              })}
            >
              <div className="py-0.5">
                <WeekSparkline
                  data={stats.weekReviews}
                  ariaLabel={t("practice.overview.weekReviewsAria", {
                    defaultValue: "Reviews per day this week",
                  })}
                />
              </div>
            </PracticeStatTile>
          </div>
        </div>
      </Card>

      {/* Continue learning — compact 3-up of the learning-driving actions. */}
      <section aria-labelledby="practice-continue-heading">
        <div className="mb-2 flex items-center gap-2">
          <h2
            id="practice-continue-heading"
            className="text-sm font-semibold text-text-primary"
          >
            {t("practice.hub2.continueTitle", { defaultValue: "Continue learning" })}
          </h2>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          <PracticeActionCard
            to={hasDue ? langPath("practice/flashcards/review") : langPath("practice/flashcards")}
            icon="graduationCap"
            emphasis="accent"
            count={hasDue ? stats.dueCount : undefined}
            title={
              hasDue
                ? t("practice.hub2.reviewNowTitle", { defaultValue: "Review due cards" })
                : t("practice.hub2.reviewNoneTitle", { defaultValue: "Flashcards" })
            }
            description={
              hasDue
                ? t("practice.hub2.reviewNowDesc", {
                    defaultValue: "{{count}} cards ready in your queue",
                    count: stats.dueCount,
                  })
                : t("practice.hub2.reviewNoneDesc", { defaultValue: "All caught up — get ahead" })
            }
          />
          <PracticeActionCard
            to={topReviewLink}
            icon="refresh"
            count={dueReviews.length > 0 ? dueReviews.length : undefined}
            title={t("practice.hub2.modulesTitle", { defaultValue: "Module reviews" })}
            description={
              dueReviews.length > 0
                ? t("practice.hub2.modulesDueDesc", {
                    defaultValue: "{{count}} modules need review",
                    count: dueReviews.length,
                  })
                : t("practice.hub2.modulesNoneDesc", { defaultValue: "All caught up" })
            }
          />
          <PracticeActionCard
            to={langPath("practice/grammar")}
            icon="bookOpen"
            title={t("practice.hub2.grammarTitle", { defaultValue: "Grammar practice" })}
            description={t("practice.hub2.grammarDesc", {
              defaultValue: "Targeted drills tied to lessons",
            })}
          />
          <PracticeActionCard
            to={langPath("practice/journey")}
            icon="trendingUp"
            title={t("practice.hub2.journeyTitle", { defaultValue: "Your journey" })}
            description={t("practice.hub2.journeyDesc", {
              defaultValue: "Streak, XP, and concept mastery over time",
            })}
          />
        </div>
      </section>

      {/* More ways to practice — demoted secondary catalog. */}
      <section aria-labelledby="practice-more-heading" className="space-y-2">
        <h2
          id="practice-more-heading"
          className="text-sm font-semibold text-text-primary"
        >
          {t("practice.hub2.moreTitle", { defaultValue: "More ways to practice" })}
        </h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Alphabet & scripts */}
          {buckets.alphabets.length > 0 ? (
            <Card padding="sm">
              <div className="mb-2 flex items-center gap-2">
                <Icon name="layers" size={16} className="text-accent" aria-hidden />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("practice.hub2.alphabetTitle", { defaultValue: "Alphabet & scripts" })}
                </h3>
              </div>
              <ul className="space-y-1.5">
                {firstAlphabetIdFromUrl ? (
                  <CatalogRow
                    to={langPath(`practice/alphabet/${firstAlphabetIdFromUrl}/learn`)}
                    emoji={scriptDefs[0]?.characters?.[0] ?? "あ"}
                    title={t("practice.hub.guidedLesson")}
                    subtitle={t("practice.overview.alphabetDescription", {
                      defaultValue: "Reading, writing, and listening drills",
                    })}
                  />
                ) : null}
                {buckets.alphabets.map((a) => {
                  const idMatch = a.to.match(/\/practice\/alphabet\/([^/]+)/)?.[1];
                  if (idMatch && idMatch === firstAlphabetIdFromUrl) return null;
                  return (
                    <CatalogRow
                      key={a.to}
                      to={a.to}
                      emoji={a.sampleCharacter ?? "ア"}
                      title={trainerLabel(a, t)}
                    />
                  );
                })}
              </ul>
              <Link
                to={alphabetPrimary}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent"
              >
                {t("practice.hub.openAlphabet")}
                <Icon name="arrowBigRight" size={14} className="rtl:rotate-180" aria-hidden />
              </Link>
            </Card>
          ) : null}

          {/* Pre-made courses */}
          {courses.length > 0 ? (
            <Card padding="sm">
              <div className="mb-2 flex items-center gap-2">
                <Icon name="sparkles" size={16} className="text-accent" aria-hidden />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("practice.hub2.coursesTitle", { defaultValue: "Pre-made courses" })}
                </h3>
              </div>
              <ul className="space-y-1.5">
                {courses.map((c) => (
                  <CatalogRow
                    key={c.id}
                    to={langPath(c.to)}
                    emoji={c.emoji}
                    title={c.title}
                    subtitle={c.subtitle}
                  />
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Skill drills */}
          {skillFeatures.length > 0 ? (
            <Card padding="sm">
              <div className="mb-2 flex items-center gap-2">
                <Icon name="target" size={16} className="text-accent" aria-hidden />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("practice.hub2.skillsTitle", { defaultValue: "Skill drills" })}
                </h3>
              </div>
              <ul className="space-y-1.5">
                {skillFeatures.map((feat) => {
                  const unlocked = courseLevel >= feat.unlockAtModule;
                  // Pre-threshold drills are ADVISORY, not gated: the routes
                  // have never enforced these locks, and hard-lock chrome on
                  // clickable-by-URL surfaces was dishonest (QA 2026-07-11).
                  // Adults may wander in early; the subtitle sets expectations.
                  return (
                    <CatalogRow
                      key={feat.id}
                      to={langPath(feat.route)}
                      emoji={feat.icon}
                      title={feat.title}
                      subtitle={
                        unlocked
                          ? feat.description
                          : t("practice.skills.recommendedFrom", {
                              defaultValue:
                                "Recommended from Module {{module}} — open anyway",
                              module: feat.unlockAtModule,
                            })
                      }
                      accentEmoji={unlocked}
                    />
                  );
                })}
              </ul>
            </Card>
          ) : null}

          {/* Flashcard tools + extra trainers */}
          <Card padding="sm">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="graduationCap" size={16} className="text-accent" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("flashcards.title")}
              </h3>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              <ToolChip to={langPath("practice/flashcards/decks")} label={t("flashcards.deckManager.title")} />
              <ToolChip to={langPath("practice/flashcards/cards")} label={t("flashcards.cardManager.title")} />
              {isCommunityEnabled(flags) ? (
                <ToolChip to={langPath("community/explore")} label={t("flashcards.browseDecks")} />
              ) : null}
              {trainerStrip.map((item) => (
                <ToolChip
                  key={item.to + (item.label ?? "")}
                  to={item.to}
                  label={trainerLabel(item, t)}
                  iconName={item.iconName}
                  sampleCharacter={item.sampleCharacter}
                />
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

function CatalogRow({
  to,
  emoji,
  title,
  subtitle,
  accentEmoji = false,
}: {
  to: string;
  emoji: string;
  title: string;
  subtitle?: string;
  accentEmoji?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-center gap-2.5 rounded-lg border border-border bg-surface p-2 transition hover:border-accent hover:bg-surface-muted"
      >
        <span
          className={
            accentEmoji
              ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-muted text-sm font-bold text-accent"
              : "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-sm text-text-muted/70"
          }
        >
          {emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-text-primary">{title}</p>
          {subtitle ? (
            <p className="truncate text-[11px] text-text-muted">{subtitle}</p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

function ToolChip({
  to,
  label,
  iconName,
  sampleCharacter,
}: {
  to: string;
  label: string;
  iconName?: PracticeNavItem["iconName"];
  sampleCharacter?: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-2 py-1 text-xs font-medium text-text-primary hover:bg-surface"
      >
        {iconName ? <Icon name={iconName} size={14} aria-hidden /> : null}
        {!iconName && sampleCharacter ? (
          <span className="text-sm" aria-hidden>
            {sampleCharacter}
          </span>
        ) : null}
        {label}
      </Link>
    </li>
  );
}
