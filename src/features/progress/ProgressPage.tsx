import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CenteredLoader,
  EmptyState,
  ProgressRing,
  SegmentedControl,
} from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCompletedLessonIds } from "@/features/learn/hooks/useCompletedLessonIds";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";
import { getSRSStore } from "@/features/flashcards/engine";
import { buildEnrichedJaCourseDeck } from "@/features/flashcards/data/courseDeck";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getModuleMastery } from "@/features/learn/moduleMastery";
import { xpProgressToNextLevel } from "./leveling";
import { buildMastery } from "./journey";
import { countCardStates } from "./practiceStats";
import { conceptLabel } from "./conceptLabel";
import { JourneyHeatmap } from "./components/JourneyHeatmap";
import { JourneySidebar } from "./components/JourneySidebar";
import { XpAreaChart } from "./components/XpAreaChart";
import { MasteryGrid } from "./components/MasteryGrid";
import { ConceptDrillSheet } from "./components/ConceptDrillSheet";
import { PracticeStatsPanel } from "./components/PracticeStatsPanel";

type JourneyTab = "overview" | "lessons" | "practice";
const DEFAULT_TAB: JourneyTab = "overview";

/**
 * Journey — the learner's progress hub.
 *
 * A tabbed, sidebar-driven dashboard (Social-style two-column layout):
 *   - Overview : hero stats (streak / level / lessons / cards mastered),
 *                GitHub-style activity heatmap with a range selector, and a
 *                compact cross-tab snapshot.
 *   - Lessons  : lesson + module completion, per-concept MasteryGrid (with
 *                drill-in), and the cumulative-XP chart.
 *   - Practice : flashcard / SRS deep stats (PracticeStatsPanel).
 *
 * Every panel derives from the single `useProgressMe` payload + the local
 * SRS store + the static curriculum deck — no new endpoints.
 */
export function ProgressPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const { summary, isLoading, isError, refetch } = useProgressMe();
  const [tab, setTab] = useState<JourneyTab>(DEFAULT_TAB);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  // Re-derive card buckets when the SRS store changes (e.g. after a sync).
  useSRSStoreRevision();

  const completedIds = useCompletedLessonIds();
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const mastery = useMemo(
    () => (summary ? buildMastery(summary.concepts, conceptLabel) : []),
    [summary],
  );

  const selectedRollup = useMemo(
    () => summary?.concepts.find((c) => c.conceptId === selectedConcept) ?? null,
    [summary, selectedConcept],
  );

  const course = useMemo(
    () => (language ? getMockCourse(language.id) : null),
    [language],
  );

  const lessonTotals = useMemo(() => {
    if (!course) return { done: 0, total: 0 };
    let total = 0;
    let done = 0;
    for (const mod of course.modules) {
      total += mod.lessons.length;
      done += mod.lessons.filter((l) => completedSet.has(l.id)).length;
    }
    return { done, total };
  }, [course, completedSet]);

  const moduleTotals = useMemo(() => {
    if (!course) return { mastered: 0, total: 0 };
    const live = course.modules.filter((m) => !m.comingSoon);
    let mastered = 0;
    for (const mod of live) {
      if (getModuleMastery(mod, completedSet).mastered) mastered++;
    }
    return { mastered, total: live.length };
  }, [course, completedSet]);

  // Card-state counts off the static curriculum deck vs the local SRS store.
  const cardCounts = useMemo(() => {
    const deck = buildEnrichedJaCourseDeck();
    return countCardStates(
      deck.cards.map((c) => c.id),
      getSRSStore(),
    );
  }, []);

  if (isLoading) {
    return <CenteredLoader py="xl" message={t("journey.loading", { defaultValue: "Loading your journey…" })} />;
  }

  if (isError || !summary) {
    return (
      <EmptyState
        icon={<Icon name="activity" size={32} />}
        title={t("journey.error.title", { defaultValue: "Couldn't load your progress" })}
        description={t("journey.error.body", { defaultValue: "Give it another try in a moment." })}
        action={<Button onClick={() => refetch()}>{t("journey.error.retry", { defaultValue: "Retry" })}</Button>}
      />
    );
  }

  const { user, last30days, concepts } = summary;
  const level = xpProgressToNextLevel(user.xp);
  const noActivity = last30days.every((d) => d.xpEarned === 0 && d.lessonsCompleted === 0);

  if (noActivity && concepts.length === 0 && lessonTotals.done === 0) {
    return (
      <EmptyState
        icon={<Icon name="trendingUp" size={32} />}
        title={t("journey.empty.title", { defaultValue: "Your journey starts here" })}
        description={t("journey.empty.body", {
          defaultValue: "Finish a lesson and your streak, XP, and mastery will start charting.",
        })}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-12">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">{t("journey.title", { defaultValue: "Journey" })}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {t("journey.subtitle", { defaultValue: "Your streak, climb, and what's worth reviewing." })}
        </p>
      </header>

      <div className="mt-4">
        <SegmentedControl<JourneyTab>
          value={tab}
          onChange={setTab}
          ariaLabel={t("journey.tabs.aria", { defaultValue: "Journey view" })}
          options={[
            {
              value: "overview",
              leading: <Icon name="sparkles" size={14} aria-hidden />,
              label: t("journey.tabs.overview", { defaultValue: "Overview" }),
            },
            {
              value: "lessons",
              leading: <Icon name="bookOpen" size={14} aria-hidden />,
              label: t("journey.tabs.lessons", { defaultValue: "Lessons" }),
            },
            {
              value: "practice",
              leading: <Icon name="dumbbell" size={14} aria-hidden />,
              label: t("journey.tabs.practice", { defaultValue: "Practice" }),
            },
          ]}
        />
      </div>

      {/* Two-column: content + Social-style sidebar (stacks on mobile). */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          {tab === "overview" ? (
            <OverviewTab
              user={user}
              level={level}
              lessonsDone={lessonTotals.done}
              cardsMastered={cardCounts.review}
              cardsDue={cardCounts}
              days={last30days}
            />
          ) : null}

          {tab === "lessons" ? (
            <LessonsTab
              lessonTotals={lessonTotals}
              moduleTotals={moduleTotals}
              mastery={mastery}
              onSelectConcept={setSelectedConcept}
              days={last30days}
            />
          ) : null}

          {tab === "practice" ? <PracticeStatsPanel /> : null}
        </div>

        <aside className="w-full shrink-0 lg:w-72">
          <JourneySidebar days={last30days} user={user} level={level} />
        </aside>
      </div>

      <ConceptDrillSheet
        open={selectedConcept !== null}
        onClose={() => setSelectedConcept(null)}
        label={selectedConcept ? conceptLabel(selectedConcept) : ""}
        rollup={selectedRollup}
        practiceTo={langPath("practice/flashcards/review")}
      />
    </div>
  );
}

/* ── overview ── */

function OverviewTab({
  user,
  level,
  lessonsDone,
  cardsMastered,
  cardsDue,
  days,
}: {
  user: { streak: number; bestStreak: number; xp: number };
  level: ReturnType<typeof xpProgressToNextLevel>;
  lessonsDone: number;
  cardsMastered: number;
  cardsDue: ReturnType<typeof countCardStates>;
  days: Parameters<typeof JourneyHeatmap>[0]["days"];
}) {
  const { t } = useTranslation();
  return (
    <>
      {/* Hero stats — lingots removed (2026-06-16). */}
      <Card as="section" aria-label={t("journey.stats.title", { defaultValue: "Stats" })}>
        <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 sm:gap-6">
          <Stat
            icon="flame"
            iconClass="text-warning"
            value={String(user.streak)}
            label={t("journey.stats.streak", { defaultValue: "day streak" })}
            sub={t("journey.stats.best", { defaultValue: "best {{n}}", n: user.bestStreak })}
          />
          <div className="flex flex-col items-center">
            <ProgressRing
              percent={level.percent}
              label={`L${level.level}`}
              sublabel={t("journey.stats.level", { defaultValue: "level" })}
            />
            <span className="mt-1 text-[11px] text-text-muted">
              {t("journey.stats.xpToNext", {
                defaultValue: "{{n}} XP to next",
                n: Math.max(0, level.toNext - level.intoLevel),
              })}
            </span>
          </div>
          <Stat
            icon="bookOpen"
            iconClass="text-accent"
            value={String(lessonsDone)}
            label={t("journey.stats.lessons", { defaultValue: "lessons done" })}
            sub={t("journey.stats.totalXp", { defaultValue: "{{n}} XP", n: user.xp.toLocaleString() })}
          />
          <Stat
            icon="graduationCap"
            iconClass="text-success"
            value={String(cardsMastered)}
            label={t("journey.stats.cardsMastered", { defaultValue: "cards mastered" })}
            sub={t("journey.stats.cardsSeen", { defaultValue: "of {{n}} seen", n: cardsDue.seen })}
          />
        </div>
      </Card>

      <JourneyHeatmap days={days} />

      {/* Cross-tab snapshot. */}
      <Card as="section" aria-label={t("journey.snapshot.title", { defaultValue: "Snapshot" })}>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("journey.snapshot.title", { defaultValue: "Snapshot" })}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SnapshotStat
            icon="target"
            value={`${cardsDue.total > 0 ? Math.round((cardsDue.review / cardsDue.total) * 100) : 0}%`}
            label={t("journey.snapshot.deckMastered", { defaultValue: "Deck mastered" })}
          />
          <SnapshotStat
            icon="refresh"
            value={String(cardsDue.seen - cardsDue.review)}
            label={t("journey.snapshot.inProgress", { defaultValue: "Cards in progress" })}
          />
          <SnapshotStat
            icon="layers"
            value={String(cardsDue.total)}
            label={t("journey.snapshot.deckSize", { defaultValue: "Cards in deck" })}
          />
        </div>
      </Card>
    </>
  );
}

/* ── lessons ── */

function LessonsTab({
  lessonTotals,
  moduleTotals,
  mastery,
  onSelectConcept,
  days,
}: {
  lessonTotals: { done: number; total: number };
  moduleTotals: { mastered: number; total: number };
  mastery: ReturnType<typeof buildMastery>;
  onSelectConcept: (id: string) => void;
  days: Parameters<typeof XpAreaChart>[0]["days"];
}) {
  const { t } = useTranslation();
  const lessonPct =
    lessonTotals.total > 0 ? Math.round((lessonTotals.done / lessonTotals.total) * 100) : 0;

  return (
    <>
      <Card as="section" aria-label={t("journey.lessons.title", { defaultValue: "Lessons" })}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-center">
          <div className="flex flex-col items-center">
            <ProgressRing
              percent={lessonPct}
              label={`${lessonPct}%`}
              sublabel={t("journey.lessons.complete", { defaultValue: "complete" })}
            />
          </div>
          <Stat
            icon="bookOpen"
            iconClass="text-accent"
            value={`${lessonTotals.done}/${lessonTotals.total}`}
            label={t("journey.lessons.lessonsDone", { defaultValue: "lessons completed" })}
            sub={t("journey.lessons.keepGoing", { defaultValue: "keep climbing" })}
          />
          <Stat
            icon="trophy"
            iconClass="text-warning"
            value={`${moduleTotals.mastered}/${moduleTotals.total}`}
            label={t("journey.lessons.modulesMastered", { defaultValue: "modules mastered" })}
            sub={t("journey.lessons.modulesSub", { defaultValue: "full clears" })}
          />
        </div>
      </Card>

      <MasteryGrid cells={mastery} onSelect={onSelectConcept} />
      <XpAreaChart days={days} />
    </>
  );
}

/* ── shared bits ── */

function Stat({
  icon,
  iconClass,
  value,
  label,
  sub,
}: {
  icon: IconName;
  iconClass: string;
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon name={icon} size={24} className={iconClass} />
      <span className="mt-1 text-2xl font-bold leading-none text-text-primary">{value}</span>
      <span className="mt-1 text-xs text-text-secondary">{label}</span>
      <span className="text-[11px] text-text-muted">{sub}</span>
    </div>
  );
}

function SnapshotStat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-muted px-3 py-2.5">
      <Icon name={icon} size={18} className="shrink-0 text-text-muted" aria-hidden />
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums leading-none text-text-primary">{value}</p>
        <p className="mt-0.5 text-[0.7rem] text-text-muted">{label}</p>
      </div>
    </div>
  );
}
