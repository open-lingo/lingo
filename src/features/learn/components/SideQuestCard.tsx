import type { CSSProperties } from "react";
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
  return (
    <button
      type="button"
      onClick={() => {
        if (!locked && onClick) onClick();
      }}
      disabled={locked}
      data-locked={locked}
      className={`lingo-quest-card${quest.isDaily ? " daily" : ""}`}
    >
      <div className="lingo-quest-emoji" aria-hidden="true">
        {quest.emoji}
      </div>
      <div className="lingo-quest-body">
        <p className="lingo-quest-title">{quest.title}</p>
        <p className="lingo-quest-meta">{quest.meta}</p>
      </div>
      <div
        className={`lingo-quest-progress${locked ? " locked" : ""}`}
        style={locked ? undefined : ringStyle}
        aria-label={
          locked
            ? "Locked"
            : `Progress ${Math.round(quest.progress)} percent`
        }
      />
    </button>
  );
}
