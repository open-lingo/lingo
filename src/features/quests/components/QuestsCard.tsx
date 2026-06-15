import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { SideQuest } from "@/shared/domain/course";
import { useQuests } from "../useQuests";
import { useQuestsModalUrl } from "../useQuestsModalUrl";
import { QuestsPanel } from "./QuestsPanel";
import { QuestProgressBar } from "./QuestProgressBar";

export type QuestsCardProps = {
  /** Course side quests (formerly rendered as their own list in LearnSidebar). */
  sideQuests: SideQuest[];
  isSideQuestUnlocked: (quest: SideQuest) => boolean;
  onSideQuestClick?: (quest: SideQuest) => void;
};

/**
 * Unified Quests sidebar card. Folds together:
 *   - Daily quest spotlight (one shown + "+N more" hint)
 *   - Side quests (one shown + "+N more" hint)
 *   - "See all" entry into the QuestsPanel modal
 *
 * Replaces the prior split of QuestsPill + QuestSpotlightCard + the
 * standalone side-quests section in LearnSidebar — they all describe
 * the same surface from the user's POV.
 */
export function QuestsCard(props: QuestsCardProps) {
  return (
    <Card as="section" padding="md" className="shadow-card">
      <QuestsCardBody {...props} />
    </Card>
  );
}

/**
 * Chrome-less body of the unified quests card (header + daily/weekly/side
 * sections + the QuestsPanel modal). Split out so it can be embedded as a
 * section inside the merged "You today" sidebar card without a nested
 * Card border. QuestsCard keeps the standalone Card wrapper for any
 * non-merged consumer.
 */
export function QuestsCardBody({
  sideQuests,
  isSideQuestUnlocked,
  onSideQuestClick,
}: QuestsCardProps) {
  const { t } = useTranslation();
  const { quests, summary, claim } = useQuests();
  const { isOpen, open, close } = useQuestsModalUrl();

  const spotlightFor = (type: "daily" | "weekly") => {
    const bucket = quests.filter((q) => q.type === type);
    const claimable = bucket.find((q) => q.status === "claimable");
    if (claimable) return claimable;
    const active = bucket
      .filter((q) => q.status === "active")
      .map((q) => ({
        q,
        pct: q.progress.target > 0 ? q.progress.current / q.progress.target : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
    return active[0]?.q ?? bucket[0] ?? null;
  };

  const dailySpotlight = useMemo(() => spotlightFor("daily"), [quests]);
  const weeklySpotlight = useMemo(() => spotlightFor("weekly"), [quests]);

  const dailyCount = quests.filter((q) => q.type === "daily").length;
  const weeklyCount = quests.filter((q) => q.type === "weekly").length;
  const moreDailies = Math.max(0, dailyCount - 1);
  const moreWeekly = Math.max(0, weeklyCount - 1);

  const visibleSideQuests = sideQuests.filter((q) => !q.comingSoon);
  const sideSpotlight = visibleSideQuests[0] ?? sideQuests[0] ?? null;
  const moreSideQuests = Math.max(0, sideQuests.length - 1);

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="m-0 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            <Icon name="trophy" size={14} className="text-accent" aria-hidden />
            {t("quests.cardTitle", { defaultValue: "Quests" })}
            {summary.badgeCount > 0 ? (
              <span className="rounded-full bg-accent/15 px-1.5 text-[0.65rem] font-bold tabular-nums text-accent">
                {summary.badgeCount}
              </span>
            ) : null}
          </h3>
          <button
            type="button"
            onClick={() => open()}
            className="text-xs font-semibold text-accent hover:text-accent-hover"
          >
            {t("quests.seeAll", { defaultValue: "See all" })}
          </button>
        </div>

        {/* Daily section */}
        {dailySpotlight ? (
          <BucketSpotlight
            kicker={t("quests.daily.kicker", { defaultValue: "Daily" })}
            quest={dailySpotlight}
            onClaim={() => claim(dailySpotlight.id)}
            moreCount={moreDailies}
            onSeeMore={() => open("daily")}
            moreLabel={t("quests.daily.moreCount", {
              defaultValue: "+{{count}} more daily",
              count: moreDailies,
            })}
          />
        ) : null}

        {/* Weekly section */}
        {weeklySpotlight ? (
          <BucketSpotlight
            className="mt-4 border-t border-border pt-3"
            kicker={t("quests.weekly.kicker", { defaultValue: "Weekly" })}
            quest={weeklySpotlight}
            onClaim={() => claim(weeklySpotlight.id)}
            moreCount={moreWeekly}
            onSeeMore={() => open("weekly")}
            moreLabel={t("quests.weekly.moreCount", {
              defaultValue: "+{{count}} more weekly",
              count: moreWeekly,
            })}
            tone="primary"
          />
        ) : null}

        {/* Side quests section */}
        {sideSpotlight ? (
          <SideSection
            quest={sideSpotlight}
            locked={!isSideQuestUnlocked(sideSpotlight)}
            onClick={() => onSideQuestClick?.(sideSpotlight)}
            moreCount={moreSideQuests}
            onSeeMore={() => open()}
          />
        ) : null}

        {!dailySpotlight && !weeklySpotlight && !sideSpotlight ? (
          <p className="text-xs text-text-muted">
            {t("quests.empty.allBuckets", {
              defaultValue: "No active quests right now.",
            })}
          </p>
        ) : null}
      </div>
      <QuestsPanel isOpen={isOpen} onClose={close} />
    </>
  );
}

type BucketProps = {
  kicker: string;
  quest: ReturnType<typeof useQuests>["quests"][number];
  onClaim: () => void;
  moreCount: number;
  onSeeMore: () => void;
  moreLabel: string;
  tone?: "warning" | "primary";
  className?: string;
};

function BucketSpotlight({
  kicker,
  quest,
  onClaim,
  moreCount,
  onSeeMore,
  moreLabel,
  tone = "warning",
  className,
}: BucketProps) {
  const { t } = useTranslation();
  const titleLabel = t(quest.title, { defaultValue: quest.title });
  const percent =
    quest.progress.target > 0
      ? Math.round((quest.progress.current / quest.progress.target) * 100)
      : 0;
  const isClaimable = quest.status === "claimable";
  return (
    <section className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
        {kicker}
      </p>
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-xl"
          aria-hidden
        >
          {quest.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {titleLabel}
          </p>
          <div className="mt-1.5">
            <QuestProgressBar percent={percent} tone={tone} />
            <p className="mt-1 flex items-center justify-between text-[0.65rem] font-medium text-text-muted">
              <span className="tabular-nums">
                {Math.min(quest.progress.current, quest.progress.target)}
                /{quest.progress.target} {quest.progress.unit}
              </span>
              <span className="inline-flex items-center gap-1">
                {quest.rewards.lingots ? (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-accent">
                    <Icon name="gem" size={11} aria-hidden />
                    {quest.rewards.lingots}
                  </span>
                ) : null}
                {quest.rewards.xp ? (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-warning">
                    <Icon name="star" size={11} aria-hidden />
                    {quest.rewards.xp}
                  </span>
                ) : null}
              </span>
            </p>
          </div>
          {isClaimable ? (
            <button
              type="button"
              onClick={onClaim}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover"
            >
              <Icon name="sparkles" size={12} aria-hidden />
              {t("quests.claim", { defaultValue: "Claim reward" })}
            </button>
          ) : null}
        </div>
      </div>
      {moreCount > 0 ? (
        <button
          type="button"
          onClick={onSeeMore}
          className="text-[0.7rem] font-medium text-text-muted hover:text-accent"
        >
          {moreLabel}
        </button>
      ) : null}
    </section>
  );
}

type SideProps = {
  quest: SideQuest;
  locked: boolean;
  onClick: () => void;
  moreCount: number;
  onSeeMore?: () => void;
};

function SideSection({ quest, locked, onClick, moreCount, onSeeMore }: SideProps) {
  const { t } = useTranslation();
  const isComingSoon = quest.comingSoon === true;
  const effectiveDisabled = locked || isComingSoon;
  const ringPct = Math.max(0, Math.min(100, quest.progress));
  return (
    <section className="mt-4 border-t border-border pt-3 space-y-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
        {t("quests.side.kicker", { defaultValue: "Side quests" })}
      </p>
      <button
        type="button"
        onClick={effectiveDisabled ? undefined : onClick}
        disabled={effectiveDisabled}
        aria-disabled={effectiveDisabled}
        className="flex w-full items-start gap-3 rounded-lg border border-border bg-surface px-2.5 py-2 text-left transition hover:border-accent/40 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-xl"
          aria-hidden
        >
          {quest.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {quest.title}
            {isComingSoon ? (
              <span className="ml-1.5 inline-block rounded-full bg-surface-muted px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("common.soon", { defaultValue: "Soon" })}
              </span>
            ) : null}
          </p>
          <p className="truncate text-[0.7rem] text-text-secondary">{quest.meta}</p>
          {!locked && !isComingSoon ? (
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${ringPct}%` }}
              />
            </div>
          ) : null}
        </div>
        {locked ? (
          <Icon name="lock" size={14} className="text-text-muted" aria-hidden />
        ) : null}
      </button>
      {moreCount > 0 && onSeeMore ? (
        <button
          type="button"
          onClick={onSeeMore}
          className="text-[0.7rem] font-medium text-text-muted hover:text-accent"
        >
          {t("quests.side.moreCount", {
            defaultValue: "+{{count}} more side quest",
            count: moreCount,
          })}
        </button>
      ) : null}
    </section>
  );
}
