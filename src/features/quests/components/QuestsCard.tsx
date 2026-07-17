import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { SideQuest } from "@/shared/domain/course";
import { useQuests } from "../useQuests";
import { questIcon } from "../questIcon";
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
 *   - Daily/weekly spotlights (one row each + a combined "+N more" hover preview)
 *   - Side quests (one shown + "+N more" hint)
 *   - "See all" entry into the QuestsPanel modal
 */
export function QuestsCard(props: QuestsCardProps) {
  return (
    <Card as="section" padding="md" className="shadow-card">
      <QuestsCardBody {...props} />
    </Card>
  );
}

/**
 * Chrome-less body of the unified quests card (header + daily/weekly +
 * side sections + the QuestsPanel modal). Split out so it can be embedded
 * as a section inside the merged "You today" sidebar card without a
 * nested Card border. QuestsCard keeps the standalone Card wrapper for
 * any non-merged consumer.
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

  // Everything not spotlighted, across both buckets — previewed by the
  // combined "+N more quests" hover.
  const hiddenQuests = quests.filter(
    (q) =>
      (q.type === "daily" || q.type === "weekly") &&
      q.id !== dailySpotlight?.id &&
      q.id !== weeklySpotlight?.id,
  );

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

        {/* Daily/weekly — one merged section, one row per spotlight */}
        {dailySpotlight || weeklySpotlight ? (
          <section className="space-y-1.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
              {t("quests.dailyWeekly.kicker", { defaultValue: "Daily/weekly quests" })}
            </p>
            {dailySpotlight ? (
              <QuestRow
                quest={dailySpotlight}
                tone="warning"
                onClaim={() => claim(dailySpotlight.id)}
              />
            ) : null}
            {weeklySpotlight ? (
              <QuestRow
                quest={weeklySpotlight}
                tone="primary"
                onClaim={() => claim(weeklySpotlight.id)}
              />
            ) : null}
            {hiddenQuests.length > 0 ? (
              /* inline-block wrapper: the hover target is the text itself,
                 not the full row width */
              <div className="group/more relative inline-block">
                <button
                  type="button"
                  onClick={() => open()}
                  className="text-[0.7rem] font-medium text-text-muted hover:text-accent"
                >
                  {t("quests.dailyWeekly.moreCount", {
                    defaultValue: "+{{count}} more quests",
                    count: hiddenQuests.length,
                  })}
                </button>
                <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden w-60 rounded-lg border border-border bg-surface p-2 shadow-card group-hover/more:block">
                  <ul className="space-y-1.5">
                    {hiddenQuests.map((q) => (
                      <li key={q.id} className="flex items-center gap-2">
                        <Icon
                          name={questIcon(q)}
                          size={13}
                          className="shrink-0 text-text-secondary"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-[0.7rem] font-medium text-text-primary">
                          {t(q.title, { defaultValue: q.title })}
                        </span>
                        <span className="shrink-0 text-[0.65rem] font-semibold tabular-nums text-text-muted">
                          {fraction(q)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
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

type QuestItem = ReturnType<typeof useQuests>["quests"][number];

const fraction = (q: QuestItem) =>
  `${Math.min(q.progress.current, q.progress.target)}/${q.progress.target} ${q.progress.unit}`;

/**
 * One compact quest row: icon · title · short bar (fraction on hover) ·
 * rewards. Claimable quests swap the bar+rewards for the Claim button.
 */
function QuestRow({
  quest,
  onClaim,
  tone = "warning",
  className,
}: {
  quest: QuestItem;
  onClaim: () => void;
  tone?: "warning" | "primary";
  className?: string;
}) {
  const { t } = useTranslation();
  const titleLabel = t(quest.title, { defaultValue: quest.title });
  const percent =
    quest.progress.target > 0
      ? Math.round((quest.progress.current / quest.progress.target) * 100)
      : 0;
  const isClaimable = quest.status === "claimable";
  return (
    <div className={["group relative flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <div
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-muted text-text-secondary"
        aria-hidden
      >
        <Icon name={questIcon(quest)} size={15} />
      </div>
      <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text-primary">
        {titleLabel}
      </p>
      {isClaimable ? (
        <button
          type="button"
          onClick={onClaim}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-accent-hover"
        >
          <Icon name="sparkles" size={11} aria-hidden />
          {t("quests.claim", { defaultValue: "Claim reward" })}
        </button>
      ) : (
        <>
          <div className="relative w-[72px] shrink-0">
            <QuestProgressBar
              percent={percent}
              tone={tone}
              ariaLabel={fraction(quest)}
              className="h-1.5"
            />
            {/* Progress fraction — revealed on row hover, floats above the bar */}
            <span
              className="pointer-events-none absolute -top-6 right-0 z-10 hidden whitespace-nowrap rounded-md border border-border bg-surface px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-text-primary shadow-card group-hover:block"
              aria-hidden
            >
              {fraction(quest)}
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium">
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
        </>
      )}
    </div>
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
    <section className="mt-4 space-y-2">
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
