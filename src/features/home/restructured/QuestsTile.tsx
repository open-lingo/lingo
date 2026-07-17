import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { xpProgressToNextLevel } from "@/features/progress/leveling";
import { useQuests } from "@/features/quests/useQuests";
import { useQuestsModalUrl } from "@/features/quests/useQuestsModalUrl";
import { QuestsPanel } from "@/features/quests/components/QuestsPanel";
import { QuestProgressBar } from "@/features/quests/components/QuestProgressBar";
import { selectGoalQuests } from "./questsTileHelpers";

/**
 * Home "Goals" tile — the longer-arc motivation beat that complements
 * Today's Plan. Shows the account level/XP bar plus weekly + bonus quests,
 * each with its own progress bar and (when claimable) a one-tap reward CTA.
 * Reuses the server-authoritative `useQuests` engine and opens the full
 * `QuestsPanel` modal via the shared URL hook.
 */
export function QuestsTile() {
  const { t } = useTranslation();
  const { quests, summary, claim, isLoading } = useQuests();
  const { stats } = useUserStats();
  const { isOpen, open, close } = useQuestsModalUrl();

  const goals = useMemo(() => selectGoalQuests(quests, 4), [quests]);
  const levelProgress = useMemo(
    () => xpProgressToNextLevel(stats.xp),
    [stats.xp],
  );

  return (
    <>
      <Card as="section" padding="md" className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("home.restructured.quests.kicker", { defaultValue: "Goals" })}
            </p>
            <h2 className="mt-0.5 flex items-center gap-1.5 text-base font-semibold text-text-primary sm:text-lg">
              <Icon name="trophy" size={18} className="text-accent" aria-hidden />
              {t("home.restructured.quests.headline", { defaultValue: "Quests" })}
              {summary.badgeCount > 0 ? (
                <span className="rounded-full bg-accent/15 px-1.5 text-[0.65rem] font-bold tabular-nums text-accent">
                  {summary.badgeCount}
                </span>
              ) : null}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => open()}
            className="shrink-0 text-xs font-semibold text-accent hover:text-accent-hover"
          >
            {t("home.restructured.quests.seeAll", { defaultValue: "See all" })}
          </button>
        </div>

        {/* Level / XP strip — the always-present "how am I leveling?" anchor. */}
        <div className="mt-3 rounded-xl bg-surface-muted/60 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-text-primary">
              <Icon name="star" size={14} className="text-accent" aria-hidden />
              {t("home.restructured.quests.level", {
                defaultValue: "Level {{level}}",
                level: levelProgress.level,
              })}
            </span>
            <span className="font-medium tabular-nums text-text-muted">
              {t("home.restructured.quests.xpInto", {
                defaultValue: "{{into}} / {{next}} XP",
                into: levelProgress.intoLevel,
                next: levelProgress.toNext,
              })}
            </span>
          </div>
          <QuestProgressBar
            className="mt-2"
            percent={levelProgress.percent}
            ariaLabel={t("home.restructured.quests.levelAria", {
              defaultValue: "XP toward next level",
            })}
          />
        </div>

        {isLoading ? (
          <ul className="mt-3 flex-1 space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="animate-pulse">
                <div className="h-3.5 w-3/5 rounded bg-border" />
                <div className="mt-2 h-2 w-full rounded-full bg-border" />
              </li>
            ))}
          </ul>
        ) : goals.length === 0 ? (
          <p className="mt-4 flex-1 text-sm text-text-muted">
            {t("home.restructured.quests.empty", {
              defaultValue: "No active goals right now — new quests arrive soon.",
            })}
          </p>
        ) : (
          <ul className="mt-3 flex-1 space-y-3">
            {goals.map(({ quest, percent, isClaimable }) => (
              <li key={quest.id}>
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-muted text-lg"
                    aria-hidden
                  >
                    {quest.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {t(quest.title, { defaultValue: quest.title })}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[0.65rem] font-medium text-text-muted">
                      <span className="tabular-nums">
                        {Math.min(quest.progress.current, quest.progress.target)}/
                        {quest.progress.target} {quest.progress.unit}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
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
                    </div>
                  </div>
                </div>
                {isClaimable ? (
                  <button
                    type="button"
                    onClick={() => claim(quest.id)}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-accent-hover"
                  >
                    <Icon name="sparkles" size={12} aria-hidden />
                    {t("home.restructured.quests.claim", { defaultValue: "Claim reward" })}
                  </button>
                ) : (
                  <QuestProgressBar
                    className="mt-2"
                    percent={percent}
                    tone={quest.type === "weekly" ? "primary" : "warning"}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <QuestsPanel isOpen={isOpen} onClose={close} />
    </>
  );
}
