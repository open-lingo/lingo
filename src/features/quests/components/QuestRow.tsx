import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { Quest } from "../types";
import { questIcon } from "../questIcon";
import { QuestProgressBar } from "./QuestProgressBar";

/** Per-type tile tint — fixed hues with alpha so all four themes keep
 *  contrast. One sharp colored element per card; the card itself stays
 *  neutral (dominant + sharp beats evenly-tinted). */
const TYPE_TINT: Record<Quest["type"], string> = {
  daily: "bg-amber-500/15 text-amber-600",
  weekly: "bg-indigo-500/15 text-indigo-500",
  random: "bg-violet-500/15 text-violet-500",
  friend: "bg-pink-500/15 text-pink-500",
};

/** Lucide quest glyph (gamification UI — never the raw emoji field). */
function QuestIcon({ quest, tint }: { quest: Quest; tint: string }) {
  return (
    <div
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tint}`}
      aria-hidden
    >
      <Icon name={questIcon(quest)} size={24} />
    </div>
  );
}

export type QuestRowProps = {
  quest: Quest;
  onClaim?: (id: string) => void;
  /** A claim is in flight — block re-fires. */
  claiming?: boolean;
};

function formatTimeRemaining(expiresAt?: number): string | null {
  if (!expiresAt) return null;
  const delta = expiresAt - Date.now();
  if (delta <= 0) return "0m";
  const hours = Math.floor(delta / (1000 * 60 * 60));
  const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  if (hours > 0) return `${hours}h left`;
  return `${Math.max(1, minutes)}m left`;
}

/**
 * One row in the QuestsPanel — emoji + title + progress + claim CTA.
 * Visual contract:
 *   - "claimable" rows get the accent-tinted border + claim button.
 *   - "completed" rows get a subtle muted tint + a check.
 *   - "expired" rows are dimmed and not interactive.
 */
export function QuestRow({ quest, onClaim, claiming = false }: QuestRowProps) {
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
    "flex flex-col gap-3 rounded-card border p-4 transition-colors",
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
        <QuestIcon quest={quest} tint={TYPE_TINT[quest.type] ?? TYPE_TINT.daily} />
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
          <span className="flex items-center gap-1.5">
            {rewards.lingots ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                <Icon name="gem" size={13} aria-hidden />
                {rewards.lingots}
              </span>
            ) : null}
            {rewards.xp ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">
                <Icon name="star" size={13} aria-hidden />
                {rewards.xp}
              </span>
            ) : null}
            {rewards.streakShield ? (
              <span
                className="inline-flex items-center gap-0.5 font-semibold text-success"
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
          variant="primary-3d"
          onClick={() => onClaim?.(quest.id)}
          disabled={claiming}
          className="w-full"
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="sparkles" size={16} aria-hidden />
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
