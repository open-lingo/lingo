import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";
import { getSRSStore } from "@/features/flashcards/engine";
import { buildEnrichedJaCourseDeck } from "@/features/flashcards/data/courseDeck";
import {
  countCardStates,
  mockRatingDistribution,
  mockRetentionPercent,
  RATING_DISTRIBUTION_IS_MOCK,
  RETENTION_IS_MOCK,
  type CardStateCounts,
  type RatingDistribution,
} from "../practiceStats";

/** Token colour per card-state bucket (matches MasteryGrid's heat ordering). */
const STATE_COLOR: Record<keyof Omit<CardStateCounts, "total" | "seen">, string> = {
  yetToLearn: "rgb(var(--color-surface-muted))",
  new: "rgb(var(--color-info))",
  learning: "rgb(var(--color-warning))",
  review: "rgb(var(--color-success))",
};

const RATING_COLOR: Record<keyof RatingDistribution, string> = {
  again: "rgb(var(--color-error))",
  hard: "rgb(var(--color-warning))",
  good: "rgb(var(--color-accent))",
  easy: "rgb(var(--color-success))",
};

/**
 * Journey → Practice tab. Flashcard / SRS deep stats.
 *
 * REAL: card-state breakdown (deck total from the course curriculum deck vs
 * stored FSRS-6 states) + cards-due-now + total-in-deck.
 * MOCKED (centralised in `practiceStats.ts`, flagged in the UI): rating
 * distribution + retention %.
 */
export function PracticeStatsPanel() {
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const { count: cardsDue, isLoading: dueLoading } = useCardsDueCount(langId);

  // Re-derive when the SRS store changes (e.g. after a review session sync).
  useSRSStoreRevision();

  const counts = useMemo(() => {
    // Course deck = the curriculum vocab deck (static, JA today). Card ids are
    // canonical (`ja:biiru`) and match the SRS store keys.
    const deck = buildEnrichedJaCourseDeck();
    const ids = deck.cards.map((c) => c.id);
    return countCardStates(ids, getSRSStore());
  }, []);

  // MOCK volume basis: number of reviews the learner has actually banked
  // (seen cards stand in for review volume) so the mock scales with usage.
  const ratings = useMemo(() => mockRatingDistribution(counts.seen * 4), [counts.seen]);
  const retention = mockRetentionPercent();

  return (
    <div className="flex flex-col gap-4">
      <CardStateCard counts={counts} />

      <div className="grid gap-4 sm:grid-cols-2">
        <RetentionCard
          retention={retention}
          cardsDue={dueLoading ? null : cardsDue}
          total={counts.total}
        />
        <RatingCard ratings={ratings} />
      </div>
    </div>
  );
}

/* ── card-state breakdown ── */

const STATE_KEYS = ["review", "learning", "new", "yetToLearn"] as const;

function CardStateCard({ counts }: { counts: CardStateCounts }) {
  const { t } = useTranslation();
  const label: Record<(typeof STATE_KEYS)[number], string> = {
    review: t("journey.practice.state.review", { defaultValue: "Review" }),
    learning: t("journey.practice.state.learning", { defaultValue: "Learning" }),
    new: t("journey.practice.state.new", { defaultValue: "New" }),
    yetToLearn: t("journey.practice.state.yetToLearn", { defaultValue: "Yet to learn" }),
  };

  const total = Math.max(1, counts.total);

  return (
    <Card as="section" aria-label={t("journey.practice.cards.title", { defaultValue: "Your cards" })}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("journey.practice.cards.title", { defaultValue: "Your cards" })}
        </h2>
        <span className="text-sm text-text-muted">
          {t("journey.practice.cards.deck", {
            defaultValue: "{{count}} in deck",
            count: counts.total,
          })}
        </span>
      </div>

      {/* Segmented meter */}
      <div
        className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-surface-muted"
        role="img"
        aria-label={t("journey.practice.cards.meterAria", {
          defaultValue: "{{review}} review, {{learning}} learning, {{new}} new, {{yet}} yet to learn",
          review: counts.review,
          learning: counts.learning,
          new: counts.new,
          yet: counts.yetToLearn,
        })}
      >
        {STATE_KEYS.map((key) => {
          const value = counts[key];
          if (value === 0) return null;
          return (
            <span
              key={key}
              style={{ width: `${(value / total) * 100}%`, backgroundColor: STATE_COLOR[key] }}
            />
          );
        })}
      </div>

      {/* Legend / counts */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATE_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-[3px] border border-border-muted"
              style={{ backgroundColor: STATE_COLOR[key] }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-base font-bold tabular-nums leading-none text-text-primary">
                {counts[key]}
              </p>
              <p className="text-[0.7rem] text-text-muted">{label[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── retention + due ── */

function RetentionCard({
  retention,
  cardsDue,
  total,
}: {
  retention: number;
  cardsDue: number | null;
  total: number;
}) {
  const { t } = useTranslation();
  return (
    <Card as="section" aria-label={t("journey.practice.retention.title", { defaultValue: "Recall" })}>
      <h2 className="text-lg font-semibold text-text-primary">
        {t("journey.practice.retention.title", { defaultValue: "Recall" })}
      </h2>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-4xl font-bold leading-none text-text-primary">{retention}%</span>
        <span className="pb-0.5 text-xs text-text-muted">
          {t("journey.practice.retention.label", { defaultValue: "retention" })}
        </span>
      </div>
      {RETENTION_IS_MOCK ? (
        <p className="mt-1 text-[0.7rem] text-text-muted">
          {t("journey.practice.estimated", { defaultValue: "Estimated" })}
        </p>
      ) : null}

      <div className="mt-4 space-y-2.5 border-t border-border-muted pt-3">
        <MiniStat
          icon="refresh"
          value={cardsDue === null ? "—" : String(cardsDue)}
          label={t("journey.practice.dueNow", { defaultValue: "Cards due now" })}
        />
        <MiniStat
          icon="layers"
          value={String(total)}
          label={t("journey.practice.totalInDeck", { defaultValue: "Total in deck" })}
        />
      </div>
    </Card>
  );
}

function MiniStat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={16} className="shrink-0 text-text-muted" aria-hidden />
      <div className="min-w-0">
        <p className="text-base font-bold tabular-nums leading-none text-text-primary">{value}</p>
        <p className="text-[0.7rem] text-text-muted">{label}</p>
      </div>
    </div>
  );
}

/* ── rating distribution ── */

const RATING_KEYS = ["again", "hard", "good", "easy"] as const;

function RatingCard({ ratings }: { ratings: RatingDistribution }) {
  const { t } = useTranslation();
  const label: Record<(typeof RATING_KEYS)[number], string> = {
    again: t("journey.practice.rating.again", { defaultValue: "Again" }),
    hard: t("journey.practice.rating.hard", { defaultValue: "Hard" }),
    good: t("journey.practice.rating.good", { defaultValue: "Good" }),
    easy: t("journey.practice.rating.easy", { defaultValue: "Easy" }),
  };
  const max = Math.max(1, ...RATING_KEYS.map((k) => ratings[k]));

  return (
    <Card as="section" aria-label={t("journey.practice.rating.title", { defaultValue: "Rating mix" })}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("journey.practice.rating.title", { defaultValue: "Rating mix" })}
        </h2>
        {RATING_DISTRIBUTION_IS_MOCK ? (
          <span className="text-[0.7rem] text-text-muted">
            {t("journey.practice.estimated", { defaultValue: "Estimated" })}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-2.5">
        {RATING_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-xs text-text-secondary">{label[key]}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-muted">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(ratings[key] / max) * 100}%`, backgroundColor: RATING_COLOR[key] }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-muted">
              {ratings[key]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
