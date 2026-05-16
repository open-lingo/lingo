import type { MouseEventHandler } from "react";
import { Icon } from "@/shared/components/Icon";

export type PathwayNodeState = "locked" | "available" | "current" | "done";
export type PathwayNodePos = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export type PathwayNodeFlag = "continue" | "start" | null;

export type PathwayNodeProps = {
  glyph: string;
  label: string;
  state: PathwayNodeState;
  positionOffset: PathwayNodePos;
  reviewCount?: number;
  flag?: PathwayNodeFlag;
  cluster?: boolean;
  isTest?: boolean;
  isRecap?: boolean;
  subProgress?: { done: number; total: number };
  onClick?: () => void;
};

export function PathwayNode({
  glyph,
  label,
  state,
  positionOffset,
  reviewCount,
  flag,
  cluster,
  isTest,
  isRecap,
  subProgress,
  onClick,
}: PathwayNodeProps) {
  const isLocked = state === "locked";
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    if (isLocked || !onClick) return;
    onClick();
  };

  return (
    <div
      className="lingo-path-row"
      data-pos={positionOffset}
      data-cluster={cluster ? "true" : undefined}
    >
      <div
        className="lingo-node"
        data-state={state}
        data-cluster={cluster ? "true" : undefined}
        data-test={isTest ? "true" : undefined}
        data-recap={isRecap ? "true" : undefined}
      >
        {flag === "continue" && (
          <span className="lingo-continue-flag">Continue</span>
        )}
        <div className="lingo-node-disc-wrap">
          <button
            type="button"
            className="lingo-node-disc"
            onClick={handleClick}
            disabled={isLocked}
            aria-label={`${label}${isLocked ? " (locked)" : ""}${isTest ? " (test)" : ""}${isRecap ? " (recap)" : ""}`}
            title={label}
          >
            {isRecap ? (
              <Icon name="partyPopper" size={28} className="text-white" aria-hidden />
            ) : (
              glyph
            )}
            {reviewCount && reviewCount > 0 ? (
              <span className="lingo-review-badge">×{reviewCount}</span>
            ) : null}
            {isTest && !isRecap ? (
              <span className="lingo-test-badge" aria-hidden>
                T
              </span>
            ) : null}
          </button>
          {state === "locked" ? (
            <span className="lingo-node-state-badge lingo-node-state-badge--locked" aria-hidden>
              <Icon name="lock" size={12} />
            </span>
          ) : null}
          {state === "done" && !isRecap ? (
            <span className="lingo-node-state-badge lingo-node-state-badge--done" aria-hidden>
              <Icon name="check" size={12} />
            </span>
          ) : null}
          {flag === "start" && (
            <button
              type="button"
              className="lingo-start-flag"
              onClick={handleClick}
              aria-label={`Start ${label}`}
            >
              Start
            </button>
          )}
          {subProgress && subProgress.total > 1 ? (
            <span
              className="lingo-node-subdots"
              role="img"
              aria-label={`${subProgress.done} of ${subProgress.total} sub-lessons complete`}
            >
              {Array.from({ length: subProgress.total }).map((_, i) => (
                <span
                  key={i}
                  className="lingo-node-subdot"
                  data-filled={i < subProgress.done ? "true" : undefined}
                />
              ))}
            </span>
          ) : null}
        </div>
        <span className="lingo-node-label">{label}</span>
      </div>
    </div>
  );
}
