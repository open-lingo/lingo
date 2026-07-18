import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  getDueReviews,
  reviewModuleIdFor,
} from "@/features/lesson/data/moduleReviewSchedule";
import { usePracticeStats } from "@/features/practice/hooks/usePracticeStats";
import { PillarTile } from "@/features/practice/components/PillarTile";
import { PracticeHero } from "@/features/practice/components/PracticeHero";
import {
  buildQuickStarts,
  pickSuggestion,
} from "@/features/practice/practiceSuggestion";
import { getPillarsForLanguage } from "@/features/practice/pillars";

export function PracticePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";
  const flags = useFeatureFlags();

  const stats = usePracticeStats(langId);

  const reviewCourse = useMemo(() => getMockCourse(langId), [langId]);
  const dueReviews = useMemo(() => getDueReviews(reviewCourse), [reviewCourse]);
  const pillars = useMemo(
    () => getPillarsForLanguage(langId, flags),
    [langId, flags],
  );

  const hasDue = !stats.isLoading && stats.dueCount > 0;

  const suggestion = useMemo(
    () =>
      pickSuggestion({
        dueCount: stats.dueCount,
        totalCards: stats.total,
        dueReviews,
        pillars,
        langId,
        dayIndex: Math.floor(Date.now() / 86_400_000),
        reviewModuleIdFor,
      }),
    [stats.dueCount, stats.total, dueReviews, pillars, langId],
  );

  const quickStarts = useMemo(
    () =>
      buildQuickStarts({
        suggestion,
        dueCount: stats.dueCount,
        dueReviews,
        langId,
        reviewModuleIdFor,
      }),
    [suggestion, stats.dueCount, dueReviews, langId],
  );

  return (
    // Sizing/centering owned by the app shell (Layout <main> hub canvas). This
    // column just fills it; the pillar grid absorbs the leftover height.
    <div className="flex w-full flex-1 flex-col gap-4">
      <PracticeHero
        stats={stats}
        suggestion={suggestion}
        quickStarts={quickStarts}
        langPath={langPath}
      />

      <section
        aria-label={t("practice.pillars.sectionTitle", { defaultValue: "Practice" })}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.id}
              className="h-full animate-[practice-rise_0.5s_ease_both] motion-reduce:animate-none"
              style={{ animationDelay: `${180 + i * 55}ms` }}
            >
              <PillarTile
                pillar={pillar}
                to={langPath(pillar.route)}
                badge={pillar.id === "vocabulary" && hasDue ? stats.dueCount : undefined}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
