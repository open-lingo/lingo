import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { WeekSparkline } from "@/shared/components/ui";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  getDueReviews,
  reviewModuleIdFor,
} from "@/features/lesson/data/moduleReviewSchedule";
import { usePracticeStats } from "@/features/practice/hooks/usePracticeStats";
import { PracticeStatTile } from "@/features/practice/components/PracticeStatTile";
import { PracticeActionCard } from "@/features/practice/components/PracticeActionCard";
import { PillarTile } from "@/features/practice/components/PillarTile";
import { getPillarsForLanguage } from "@/features/practice/pillars";

export function PracticePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";
  const flags = useFeatureFlags();

  const stats = usePracticeStats(langId);

  // Module reviews — server/local review schedule, not mock data.
  const reviewCourse = useMemo(() => getMockCourse(langId), [langId]);
  const dueReviews = useMemo(() => getDueReviews(reviewCourse), [reviewCourse]);
  const topReviewModuleId = dueReviews[0]
    ? reviewModuleIdFor(dueReviews[0].moduleId)
    : null;
  const topReviewLink = topReviewModuleId
    ? langPath(`learn/lessons/ja-${topReviewModuleId}-1`)
    : langPath("learn");

  const pillars = getPillarsForLanguage(langId, flags);

  const hasDue = !stats.isLoading && stats.dueCount > 0;

  return (
    <div className="space-y-4">
      {/* Compact header — no contained hero box. */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t("practice.overview.kicker", { defaultValue: "Practice" })}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-extrabold leading-tight text-text-primary sm:text-2xl">
            {t("nav.practice")}
          </h1>
          {stats.total > 0 ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <Icon name="graduationCap" size={14} aria-hidden />
              {t("practice.overview.masteredCaption", {
                defaultValue: "{{mastered}} mastered · {{learning}} learning",
                mastered: stats.mastered,
                learning: stats.learning,
              })}
            </p>
          ) : null}
        </div>
        <p className="mt-1 max-w-md text-sm leading-snug text-text-secondary">
          {t("practice.intro")}
        </p>
      </div>

      {/* FSRS stat tiles — individual floating cards. */}
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

      {/* Continue learning — one row of the four learning-driving actions. */}
      <section aria-labelledby="practice-continue-heading">
        <div className="mb-2 flex items-center gap-2">
          <h2
            id="practice-continue-heading"
            className="text-sm font-semibold text-text-primary"
          >
            {t("practice.hub2.continueTitle", { defaultValue: "Continue learning" })}
          </h2>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
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

      {/* Practice pillars — the six avenues of language learning. */}
      <section aria-labelledby="practice-pillars-heading">
        <div className="mb-2 flex items-center gap-2">
          <h2
            id="practice-pillars-heading"
            className="text-sm font-semibold text-text-primary"
          >
            {t("practice.pillars.sectionTitle", { defaultValue: "Practice" })}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <PillarTile
              key={pillar.id}
              pillar={pillar}
              to={langPath(pillar.route)}
              badge={pillar.id === "vocabulary" && hasDue ? stats.dueCount : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
