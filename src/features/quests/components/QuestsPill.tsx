import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { useQuests } from "../useQuests";
import { useQuestsModalUrl } from "../useQuestsModalUrl";
import { QuestsPanel } from "./QuestsPanel";

export type QuestsPillProps = {
  /** Optional CSS overrides for layout. */
  className?: string;
  /** Visual size — "sm" (top bar) or "md" (in-card). */
  size?: "sm" | "md";
};

/**
 * Compact entry-point pill: "Quests N" with the badge count of active +
 * claimable quests. Click opens the QuestsPanel modal. The same
 * component is dropped into LearnTopBar (mobile + desktop sidebar) and
 * — once wider rollout lands — into HomePage / PracticePage top bars.
 */
export function QuestsPill({ className, size = "sm" }: QuestsPillProps) {
  const { t } = useTranslation();
  const { summary } = useQuests();
  const { isOpen, open, close } = useQuestsModalUrl();

  const hasClaimable = summary.claimable > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => open()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-semibold transition",
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
          hasClaimable
            ? "border-accent bg-accent text-white shadow-sm hover:bg-accent-hover"
            : "border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-text-primary",
          className,
        )}
        aria-label={t("quests.pillAria", {
          defaultValue:
            "{{count}} active quests, {{claimable}} ready to claim",
          count: summary.badgeCount,
          claimable: summary.claimable,
        })}
      >
        <Icon name="trophy" size={size === "sm" ? 14 : 16} aria-hidden />
        <span>
          {t("quests.pillLabel", { defaultValue: "Quests" })}
        </span>
        <span
          className={cn(
            "rounded-full px-1.5 text-[0.65rem] font-bold tabular-nums",
            hasClaimable
              ? "bg-white/25 text-white"
              : "bg-surface-muted text-text-primary",
          )}
        >
          {summary.badgeCount}
        </span>
        {hasClaimable ? (
          <span
            className="h-1.5 w-1.5 rounded-full bg-white"
            aria-hidden
            title={t("quests.pillClaimableHint", {
              defaultValue: "Ready to claim!",
            })}
          />
        ) : null}
      </button>
      <QuestsPanel isOpen={isOpen} onClose={close} />
    </>
  );
}
