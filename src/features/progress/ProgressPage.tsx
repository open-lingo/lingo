import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CenteredLoader, EmptyState, ProgressRing } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { xpProgressToNextLevel } from "./leveling";
import { buildMastery } from "./journey";
import { conceptLabel } from "./conceptLabel";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { XpAreaChart } from "./components/XpAreaChart";
import { MasteryGrid } from "./components/MasteryGrid";
import { ConceptDrillSheet } from "./components/ConceptDrillSheet";

/**
 * Journey — the learner's progress hub. Wires the real `ProgressSummary`
 * (GET /progress/me) into an activity heatmap, a cumulative-XP chart, and a
 * per-concept mastery grid with contextual drill-ins. No new endpoints: every
 * panel derives from the single `useProgressMe` payload.
 */
export function ProgressPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { summary, isLoading, isError, refetch } = useProgressMe();
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const mastery = useMemo(
    () => (summary ? buildMastery(summary.concepts, conceptLabel) : []),
    [summary],
  );

  const selectedRollup = useMemo(
    () => summary?.concepts.find((c) => c.conceptId === selectedConcept) ?? null,
    [summary, selectedConcept],
  );

  if (isLoading) {
    return <CenteredLoader py="xl" message={t("journey.loading", "Loading your journey…")} />;
  }

  if (isError || !summary) {
    return (
      <EmptyState
        icon={<Icon name="activity" size={32} />}
        title={t("journey.error.title", "Couldn't load your progress")}
        description={t("journey.error.body", "Give it another try in a moment.")}
        action={<Button onClick={() => refetch()}>{t("journey.error.retry", "Retry")}</Button>}
      />
    );
  }

  const { user, last30days, concepts } = summary;
  const level = xpProgressToNextLevel(user.xp);
  const noActivity = last30days.every((d) => d.xpEarned === 0 && d.lessonsCompleted === 0);

  if (noActivity && concepts.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="trendingUp" size={32} />}
        title={t("journey.empty.title", "Your journey starts here")}
        description={t(
          "journey.empty.body",
          "Finish a lesson and your streak, XP, and mastery will start charting.",
        )}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-12">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">{t("journey.title", "Journey")}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {t("journey.subtitle", "Your streak, climb, and what's worth reviewing.")}
        </p>
      </header>

      {/* Hero stats */}
      <Card as="section" aria-label={t("journey.stats.title", "Stats")}>
        <div className="grid grid-cols-3 items-center gap-3 sm:gap-6">
          <Stat
            icon="flame"
            iconClass="text-warning"
            value={String(user.streak)}
            label={t("journey.stats.streak", "day streak")}
            sub={t("journey.stats.best", "best {{n}}", { n: user.bestStreak })}
          />
          <div className="flex flex-col items-center">
            <ProgressRing
              percent={level.percent}
              label={`L${level.level}`}
              sublabel={t("journey.stats.level", "level")}
            />
            <span className="mt-1 text-xs text-text-muted">
              {t("journey.stats.xpToNext", "{{n}} XP to next", { n: level.toNext - level.intoLevel })}
            </span>
          </div>
          <Stat
            icon="gem"
            iconClass="text-info"
            value={String(user.lingots)}
            label={t("journey.stats.lingots", "lingots")}
            sub={t("journey.stats.totalXp", "{{n}} XP", { n: user.xp })}
          />
        </div>
      </Card>

      <ActivityHeatmap days={last30days} />
      <XpAreaChart days={last30days} />
      <MasteryGrid cells={mastery} onSelect={setSelectedConcept} />

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
      <span className="mt-1 text-2xl font-bold text-text-primary leading-none">{value}</span>
      <span className="mt-1 text-xs text-text-secondary">{label}</span>
      <span className="text-[11px] text-text-muted">{sub}</span>
    </div>
  );
}
