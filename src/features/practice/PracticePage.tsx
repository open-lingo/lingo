import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Card, NavCard, ProgressRing, WeekSparkline } from "@/shared/components/ui";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getPracticeItemsForLanguage } from "@/features/practice/practiceNavItems";
import type { PracticeNavItem } from "@/features/practice/practiceNavItems";
import { useFlashcardDueSummary } from "@/features/flashcards/useFlashcardDueSummary";
import { PracticeHubSection, type HubQuickLink } from "@/features/practice/PracticeHubSection";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { usePracticeData } from "@/features/practice/hooks/usePracticeData";
import {
  getDueReviews,
  reviewModuleIdFor,
} from "@/features/lesson/data/moduleReviewSchedule";
import { useCourseLevel } from "@/features/practice/useCourseLevel";
import { getPracticeFeatures } from "@/features/practice/practiceUnlockConfig";

// Mirror AccountOverviewCard so the level pill on Practice uses the same curve
// until the backend returns a target.
const XP_PER_LEVEL = 500;
function nextLevelXpFor(level: number) {
  return Math.max(1, level) * XP_PER_LEVEL;
}
// Pre-made course strip per learning language. Surface curated entry points
// to existing trainers/routes — no new stub pages. When real per-language
// course catalogs are wired, this constant moves into the domain layer.
const PRE_MADE_COURSES: Record<
  string,
  Array<{ id: string; emoji: string; title: string; subtitle: string; to: string }>
> = {
  ko: [
    { id: "hangul", emoji: "한", title: "Hangul basics", subtitle: "Master the Korean alphabet", to: "practice/alphabet" },
    { id: "ko-particles", emoji: "은/는", title: "Korean particles", subtitle: "은·는·이·가 and friends", to: "practice/particles" },
    { id: "ko-top100", emoji: "100", title: "Top 100 Korean words", subtitle: "Most common vocabulary", to: "vocab" },
  ],
  ja: [
    { id: "hiragana", emoji: "あ", title: "Hiragana", subtitle: "46 syllabary signs", to: "practice/alphabet/hiragana" },
    { id: "katakana", emoji: "ア", title: "Katakana", subtitle: "Loanword syllabary", to: "practice/alphabet/katakana" },
    { id: "n5-kanji", emoji: "漢", title: "JLPT N5 Kanji", subtitle: "First 100 characters", to: "practice/kanji" },
    { id: "ja-particles", emoji: "は/が", title: "Particles", subtitle: "は·が·を·に·で foundations", to: "practice/particles" },
    { id: "ja-top100", emoji: "100", title: "Top 100 Japanese words", subtitle: "Most common vocabulary", to: "vocab" },
  ],
};

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
  const { stats, isReady } = useUserStats();
  const { data: practiceData } = usePracticeData();
  const {
    todayMinutes: practiceTodayMin,
    weekMinutes: practiceWeekMinutes,
    dueModules,
    totalModules,
    lastTouchedHours,
  } = practiceData;
  const courseLevel = useCourseLevel();

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

  // Derived metrics for the hero overview card.
  const dueRingPercent = Math.round((dueModules / totalModules) * 100);
  const weekTotalMin = practiceWeekMinutes.reduce((a, b) => a + b, 0);
  const daysActiveThisWeek = practiceWeekMinutes.filter((n) => n > 0).length;

  const nextLevelXp = nextLevelXpFor(stats.level);
  const xpToNext = Math.max(0, nextLevelXp - stats.xp);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Zone 1 — Practice Overview hero */}
      <Card padding="lg">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* Left: kicker + headline + intro */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {t("practice.overview.kicker", { defaultValue: "Practice" })}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-text-primary sm:text-3xl">
              {t("nav.practice")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-snug text-text-secondary sm:text-base">
              {t("practice.intro")}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
                <Icon name="refresh" size={14} aria-hidden />
                {t("practice.overview.dueChip", {
                  defaultValue: "{{count}} modules need review",
                  count: dueModules,
                })}
              </span>
              {dueLoading ? null : dueCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
                  <Icon name="graduationCap" size={14} aria-hidden />
                  {t("practice.overview.flashChip", {
                    defaultValue: "{{count}} flashcards due",
                    count: dueCount,
                  })}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-xs font-bold text-accent">
                <Icon name="star" size={14} aria-hidden />
                {t("home.restructured.account.levelPill", {
                  defaultValue: "Level {{level}}",
                  level: stats.level,
                })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
                <Icon name="gem" size={14} aria-hidden />
                {isReady
                  ? t("practice.overview.lingotsChip", {
                      defaultValue: "{{count}} lingots",
                      count: stats.lingots,
                    })
                  : t("practice.overview.lingotsLoading", { defaultValue: "— lingots" })}
              </span>
            </div>
          </div>

          {/* Right: three visualizations */}
          <div className="flex flex-wrap items-center gap-5 sm:gap-6 lg:justify-end">
            {/* Due-ring sourced from usePracticeData. */}
            <div className="flex flex-col items-center">
              <ProgressRing
                percent={dueRingPercent}
                size={72}
                label={String(dueModules)}
                sublabel={t("practice.overview.ringSublabel", { defaultValue: "due" })}
              />
              <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
                {t("practice.overview.ringCaption", {
                  defaultValue: "of {{total}} modules",
                  total: totalModules,
                })}
              </p>
            </div>

            {/* Week sparkline sourced from usePracticeData (same signal as Home). */}
            <div className="min-w-[10rem]">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                {t("practice.overview.weekLabel", { defaultValue: "This week" })}
              </p>
              <div className="mt-1.5">
                <WeekSparkline
                  data={practiceWeekMinutes}
                  ariaLabel={t("practice.overview.weekAria", {
                    defaultValue: "Practice minutes this week",
                  })}
                />
              </div>
              <p className="mt-1.5 text-xs text-text-secondary">
                {t("practice.overview.weekCaption", {
                  defaultValue: "{{today}} min today · {{days}}/7 days active",
                  today: practiceTodayMin,
                  days: daysActiveThisWeek,
                })}
              </p>
              <p className="text-[10px] text-text-muted">
                {t("practice.overview.weekTotal", {
                  defaultValue: "{{min}} min this week",
                  min: weekTotalMin,
                })}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning">
                <Icon name="flame" size={14} aria-hidden />
                {stats.streak}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
                {t("practice.overview.streakSublabel", { defaultValue: "day streak" })}
              </span>
              {stats.bestStreak > 0 ? (
                <span className="text-[10px] text-text-muted">
                  {t("practice.overview.streakBest", {
                    defaultValue: "best {{best}}",
                    best: stats.bestStreak,
                  })}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-text-primary">
                {t("practice.overview.xpTotal", {
                  defaultValue: "{{xp}} XP",
                  xp: stats.xp.toLocaleString(),
                })}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                {t("practice.overview.xpToNext", {
                  defaultValue: "{{xp}} to L{{level}}",
                  xp: xpToNext.toLocaleString(),
                  level: stats.level + 1,
                })}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Zone 2 — Quick access grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NavCard
          to={topReviewLink}
          icon={<Icon name="refresh" size={18} />}
          title={t("practice.hub.reviewsTitle", { defaultValue: "Module reviews" })}
          description={reviewSubtitle}
          count={dueReviews.length > 0 ? dueReviews.length : undefined}
        />
        <NavCard
          to={langPath("practice/flashcards")}
          icon={<Icon name="graduationCap" size={18} />}
          title={t("flashcards.title")}
          description={flashSubtitle}
          count={!dueLoading && dueCount > 0 ? dueCount : undefined}
        />
        <NavCard
          to={langPath("practice/grammar")}
          icon={<Icon name="bookOpen" size={18} />}
          title={t("practice.hub.grammarTitle")}
          description={t("practice.hub.grammarJumpSubtitle")}
        />
        {buckets.alphabets.length > 0 ? (
          <NavCard
            to={alphabetPrimary}
            icon={<Icon name="layers" size={18} />}
            title={t("practice.hub.alphabetJumpTitle")}
            description={t("practice.overview.alphabetDescription", {
              defaultValue: "Reading, writing, and listening drills",
            })}
          />
        ) : null}
        {buckets.stories.map((s) => (
          <NavCard
            key={s.to}
            to={s.to}
            icon={<Icon name="stories" size={18} />}
            title={trainerLabel(s, t)}
            description={t("practice.hub.storiesJumpSubtitle")}
          />
        ))}
        {buckets.videos.map((v) => (
          <NavCard
            key={v.to}
            to={v.to}
            icon={<Icon name="video" size={18} />}
            title={trainerLabel(v, t)}
            description={t("practice.hub.videosJumpSubtitle")}
          />
        ))}
        {buckets.external.map((e) => (
          <NavCard
            key={e.to}
            to={e.to}
            icon={<Icon name="link" size={18} />}
            title={trainerLabel(e, t)}
            description={t("practice.hub.externalJumpSubtitle")}
          />
        ))}
      </div>

      {/* Zone 2.5 — Pre-made courses for this language */}
      {language?.id && PRE_MADE_COURSES[language.id]?.length ? (
        <section aria-labelledby="practice-courses-heading">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("practice.overview.coursesKicker", { defaultValue: "Pre-made courses" })}
              </p>
              <h2 id="practice-courses-heading" className="text-base font-semibold text-text-primary">
                {t("practice.overview.coursesHeadline", {
                  defaultValue: "Learn {{language}} step by step",
                  language: languageName,
                })}
              </h2>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PRE_MADE_COURSES[language.id].map((c) => (
              <li key={c.id}>
                <Link
                  to={langPath(c.to)}
                  className="group flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-3 transition hover:border-accent hover:bg-surface-muted"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-base text-text-muted/60">
                    {c.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{c.title}</p>
                    <p className="text-xs text-text-muted">{c.subtitle}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Zone 2.75 — Skill drills (unlock-gated by course progress) */}
      {getPracticeFeatures(langId).length > 0 && (
        <section aria-labelledby="practice-skills-heading">
          <div className="mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("practice.skills.kicker", { defaultValue: "Skill drills" })}
            </p>
            <h2 id="practice-skills-heading" className="text-base font-semibold text-text-primary">
              {t("practice.skills.headline", { defaultValue: "Targeted practice" })}
            </h2>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {getPracticeFeatures(langId).map((feat) => {
              const unlocked = courseLevel >= feat.unlockAtModule;
              return (
                <li key={feat.id}>
                  {unlocked ? (
                    <Link
                      to={langPath(feat.route)}
                      className="group flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-3 transition hover:border-accent hover:bg-surface-muted"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-base font-bold text-accent">
                        {feat.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">{feat.title}</p>
                        <p className="text-xs text-text-muted">{feat.description}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex h-full items-start gap-3 rounded-xl border border-border bg-surface-muted/50 p-3 opacity-60">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-base font-bold text-text-muted">
                        <Icon name="lock" size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-secondary">{feat.title}</p>
                        <p className="text-xs text-text-muted">
                          {t("practice.skills.unlocksAt", {
                            defaultValue: "Unlocks at Module {{module}}",
                            module: feat.unlockAtModule,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Zone 3 — Domain sections */}
      <div className="space-y-3">
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

        {/* Per-section "last touched" inset strip — sourced from usePracticeData. */}
        <Card padding="sm" className="bg-surface-muted">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t("practice.overview.recentActivity", { defaultValue: "Recent activity" })}
          </p>
          <ul className="grid gap-2 sm:grid-cols-3">
            <li className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
              <Icon name="graduationCap" size={16} className="text-accent" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-text-primary">
                  {t("flashcards.title")}
                </p>
                <p className="truncate text-[11px] text-text-muted">
                  {t("practice.overview.lastReviewed", {
                    defaultValue: "Last reviewed {{hours}}h ago",
                    hours: lastTouchedHours.flashcards,
                  })}
                </p>
              </div>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
              <Icon name="bookOpen" size={16} className="text-accent" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-text-primary">
                  {t("practice.hub.grammarTitle")}
                </p>
                <p className="truncate text-[11px] text-text-muted">
                  {t("practice.overview.lastReviewed", {
                    defaultValue: "Last reviewed {{hours}}h ago",
                    hours: lastTouchedHours.grammar,
                  })}
                </p>
              </div>
            </li>
            {buckets.alphabets.length > 0 ? (
              <li className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                <Icon name="layers" size={16} className="text-accent" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-text-primary">
                    {t("practice.hub.alphabetJumpTitle")}
                  </p>
                  <p className="truncate text-[11px] text-text-muted">
                    {t("practice.overview.lastReviewed", {
                      defaultValue: "Last reviewed {{hours}}h ago",
                      hours: lastTouchedHours.alphabet,
                    })}
                  </p>
                </div>
              </li>
            ) : null}
          </ul>
        </Card>

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
