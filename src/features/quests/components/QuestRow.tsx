import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { Quest } from "../types";
import { QuestProgressBar } from "./QuestProgressBar";

export type QuestRowProps = {
  quest: Quest;
  onClaim?: (id: string) => void;
};

function formatTimeRemaining(expiresAt?: number): string | null {
  if (!expiresAt) return null;
  const delta = expiresAt - Date.now();
  if (delta <= 0) return "0m";
  const hours = Math.floor(delta / (1000 * 60 * 60));
  const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, minutes)}m`;
}

/**
 * One row in the QuestsPanel — emoji + title + progress + claim CTA.
 * Visual contract:
 *   - "claimable" rows get the accent-tinted border + claim button.
 *   - "completed" rows get a subtle muted tint + a check.
 *   - "expired" rows are dimmed and not interactive.
 */
export function QuestRow({ quest, onClaim }: QuestRowProps) {
  const { t } = useTranslation();
  const { progress, status, rewards, expiresAt } = quest;
  const percent =
    progress.target > 0
      ? Math.round((progress.current / progress.target) * 100)
      : 0;
  const timeLabel = formatTimeRemaining(expiresAt);

  const isClaimable = status === "claimable";
  const isCompleted = status === "completed";
  const isExpired = status === "expired";

  const containerCls = [
    "flex flex-col gap-3 rounded-xl border p-4 transition-colors",
    isClaimable
      ? "border-accent bg-accent/5 shadow-sm"
      : isCompleted
        ? "border-border bg-surface-muted/60"
        : isExpired
          ? "border-border bg-surface-muted/40 opacity-60"
          : "border-border bg-surface",
  ].join(" ");

  // The "fallback" string after the key is shown if i18n keys haven't
  // been registered yet — production data carries keys + translations.
  const titleLabel = t(quest.title, { defaultValue: quest.title });
  const descLabel = t(quest.description, { defaultValue: quest.description });

  return (
    <div className={containerCls}>
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-muted text-2xl"
          aria-hidden
        >
          {quest.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-text-primary">
              {titleLabel}
            </p>
            {timeLabel ? (
              <span className="shrink-0 text-[0.65rem] font-medium uppercase tracking-wider text-text-muted">
                {timeLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">{descLabel}</p>
          {quest.friendDisplayName ? (
            <p className="mt-1 inline-flex items-center gap-1 text-[0.7rem] font-medium text-text-muted">
              <Icon name="users" size={12} aria-hidden />
              {quest.friendDisplayName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <QuestProgressBar
          percent={percent}
          tone={quest.type === "daily" ? "warning" : "primary"}
          ariaLabel={t("quests.progressAria", {
            defaultValue: "{{title}} progress",
            title: titleLabel,
          })}
        />
        <div className="flex items-center justify-between text-[0.7rem] font-medium text-text-muted">
          <span className="tabular-nums">
            {Math.min(progress.current, progress.target)} / {progress.target}{" "}
            {progress.unit}
          </span>
          <span className="flex items-center gap-2">
            {rewards.lingots ? (
              <span className="inline-flex items-center gap-0.5 font-semibold text-accent">
                <Icon name="gem" size={12} aria-hidden />
                {rewards.lingots}
              </span>
            ) : null}
            {rewards.xp ? (
              <span className="inline-flex items-center gap-0.5 font-semibold text-warning">
                <Icon name="star" size={12} aria-hidden />
                {rewards.xp}
              </span>
            ) : null}
            {rewards.streakShield ? (
              <span
                className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400"
                title={t("quests.shieldHint", {
                  defaultValue: "Streak shield — saves your streak once",
                })}
              >
                <Icon name="shield" size={12} aria-hidden />
              </span>
            ) : null}
            {rewards.adFreeMinutes ? (
              <span
                className="inline-flex items-center gap-0.5 font-semibold text-text-secondary"
                title={t("quests.adFreeHint", {
                  defaultValue: "{{m}} ad-free minutes",
                  m: rewards.adFreeMinutes,
                })}
              >
                {rewards.adFreeMinutes}m
              </span>
            ) : null}
          </span>
        </div>
      </div>

      {isClaimable ? (
        <Button
          type="button"
          variant="primary"
          onClick={() => onClaim?.(quest.id)}
          className="w-full"
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="sparkles" size={14} aria-hidden />
            {t("quests.claim", { defaultValue: "Claim reward" })}
          </span>
        </Button>
      ) : isCompleted ? (
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
          <Icon name="check" size={14} aria-hidden />
          {t("quests.completed", { defaultValue: "Completed" })}
        </p>
      ) : isExpired ? (
        <p className="text-xs font-medium text-text-muted">
          {t("quests.expired", { defaultValue: "Expired" })}
        </p>
      ) : null}
    </div>
  );
}
