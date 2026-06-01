import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useQuests } from "../useQuests";
import { useQuestsModalUrl } from "../useQuestsModalUrl";
import { QuestProgressBar } from "./QuestProgressBar";
import { QuestsPanel } from "./QuestsPanel";

/**
 * Spotlight card — shows the single closest-to-claim quest with a "See
 * all" link that opens the full QuestsPanel. Lives in any column that
 * has a sidebar-ish vertical slot (learn sidebar / future practice
 * sidebar). Replaces nothing — it's an additive surface alongside the
 * existing per-course SideQuestCard which is unrelated.
 */
export function QuestSpotlightCard() {
  const { t } = useTranslation();
  const { quests, summary, claim } = useQuests();
  const { isOpen, open, close } = useQuestsModalUrl();

  const spotlight = useMemo(() => {
    // 1. Any claimable quest — show that first.
    const claimable = quests.find((q) => q.status === "claimable");
    if (claimable) return claimable;
    // 2. Closest-to-target active quest by percent.
    const active = quests
      .filter((q) => q.status === "active")
      .map((q) => ({
        q,
        pct: q.progress.target > 0 ? q.progress.current / q.progress.target : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
    return active[0]?.q ?? null;
  }, [quests]);

  if (!spotlight) return null;

  const titleLabel = t(spotlight.title, { defaultValue: spotlight.title });
  const descLabel = t(spotlight.description, {
    defaultValue: spotlight.description,
  });
  const percent =
    spotlight.progress.target > 0
      ? Math.round(
          (spotlight.progress.current / spotlight.progress.target) * 100,
        )
      : 0;
  const isClaimable = spotlight.status === "claimable";

  return (
    <>
      <Card as="section" padding="md" className="shadow-card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="m-0 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            <Icon name="trophy" size={14} className="text-accent" aria-hidden />
            {t("quests.spotlightTitle", { defaultValue: "Quests" })}
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
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-xl"
            aria-hidden
          >
            {spotlight.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">
              {titleLabel}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">{descLabel}</p>
            <div className="mt-2">
              <QuestProgressBar
                percent={percent}
                tone={spotlight.type === "daily" ? "warning" : "primary"}
              />
              <p className="mt-1 flex items-center justify-between text-[0.65rem] font-medium text-text-muted">
                <span className="tabular-nums">
                  {Math.min(spotlight.progress.current, spotlight.progress.target)}
                  /{spotlight.progress.target} {spotlight.progress.unit}
                </span>
                <span className="inline-flex items-center gap-1">
                  {spotlight.rewards.lingots ? (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-accent">
                      <Icon name="gem" size={11} aria-hidden />
                      {spotlight.rewards.lingots}
                    </span>
                  ) : null}
                  {spotlight.rewards.xp ? (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-warning">
                      <Icon name="star" size={11} aria-hidden />
                      {spotlight.rewards.xp}
                    </span>
                  ) : null}
                </span>
              </p>
            </div>
            {isClaimable ? (
              <button
                type="button"
                onClick={() => claim(spotlight.id)}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover"
              >
                <Icon name="sparkles" size={12} aria-hidden />
                {t("quests.claim", { defaultValue: "Claim reward" })}
              </button>
            ) : null}
          </div>
        </div>
      </Card>
      <QuestsPanel isOpen={isOpen} onClose={close} />
    </>
  );
}
