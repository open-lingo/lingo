import type { CSSProperties } from "react";
import { Icon } from "@/shared/components/Icon";
import type { SideQuest } from "@/shared/domain/course";
import "./pathway.css";

export type SideQuestCardProps = {
  quest: SideQuest;
  locked: boolean;
  onClick?: () => void;
};

export function SideQuestCard({ quest, locked, onClick }: SideQuestCardProps) {
  const ringStyle: CSSProperties = {
    ["--p" as never]: `${Math.max(0, Math.min(100, quest.progress))}%`,
  } as CSSProperties;
  // ``comingSoon`` outranks ``locked`` visually: dimmed, with a pill badge
  // and a hover tooltip, but never clickable. Title shows full text via
  // native ``title`` attr until/unless a richer tooltip primitive lands.
  const isComingSoon = quest.comingSoon === true;
  const effectiveDisabled = locked || isComingSoon;
  const cls = [
    "lingo-quest-card",
    quest.isDaily ? "daily" : "",
    quest.featured ? "featured" : "",
    isComingSoon ? "opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      onClick={() => {
        if (!effectiveDisabled && onClick) onClick();
      }}
      disabled={effectiveDisabled}
      aria-disabled={effectiveDisabled}
      data-locked={locked}
      data-coming-soon={isComingSoon || undefined}
      title={isComingSoon ? "Coming soon" : undefined}
      className={cls}
    >
      <div className="lingo-quest-emoji" aria-hidden>
        {quest.emoji}
      </div>
      <div className="lingo-quest-body">
        <p className="lingo-quest-title">
          {quest.title}
          {isComingSoon && (
            <span
              data-testid="coming-soon-badge"
              className="ml-1.5 inline-block rounded-full bg-surface-muted px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              Soon
            </span>
          )}
        </p>
        <p className="lingo-quest-meta">{quest.meta}</p>
      </div>
      <div
        className={`lingo-quest-progress${locked ? " locked" : ""}`}
        style={locked ? undefined : ringStyle}
        aria-label={
          locked
            ? "Locked"
            : isComingSoon
              ? "Coming soon"
              : `Progress ${Math.round(quest.progress)} percent`
        }
      >
        {locked ? <Icon name="lock" size={14} aria-hidden /> : null}
      </div>
    </button>
  );
}
