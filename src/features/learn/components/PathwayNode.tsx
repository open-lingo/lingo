import type { MouseEventHandler } from "react";
import { Icon } from "@/shared/components/Icon";

export type PathwayNodeState = "locked" | "available" | "current" | "done";
export type PathwayNodePos = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export type PathwayNodeFlag = "continue" | "start" | null;

/**
 * Mastery slot rendered alongside the per-sub-lesson dots for a row
 * cluster. Replaces what used to be the "test sub-lesson dot" so the
 * cluster reads as `[• • •] ★` (three teaching sub-lessons + a mastery
 * star) instead of `[• • • •]` with no signal that the last dot is the
 * test.
 *
 * - "passed":   filled gold star — row's test completed AND not skipped.
 * - "available": hollow / outline star — sub-lessons done, test is the
 *               next available step OR has been skipped.
 * - "locked":   hidden — sub-lessons not yet complete.
 */
export type MasterySlotState = "passed" | "available" | "locked";

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
  /** Sub-lesson progress dots count NON-test sub-lessons only. */
  subProgress?: { done: number; total: number };
  /** When present, renders a star slot beside the sub-dots. Hidden when
   *  state === "locked". */
  masterySlot?: MasterySlotState;
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
  masterySlot,
  onClick,
}: PathwayNodeProps) {
  const isLocked = state === "locked";
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    if (isLocked || !onClick) return;
    onClick();
  };

  // The "current" node is the scroll target for the
  // BackToCurrentButton. We tag the row container (not the disc) so the
  // intersection observer measures the full row including the label.
  const isCurrent = state === "current";

  return (
    <div
      className="lingo-path-row"
      data-pos={positionOffset}
      data-cluster={cluster ? "true" : undefined}
      data-current={isCurrent ? "true" : undefined}
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
          {(subProgress && subProgress.total > 1) ||
          (masterySlot && masterySlot !== "locked") ? (
            <span
              className="lingo-node-subdots"
              role="img"
              aria-label={subProgress
                ? `${subProgress.done} of ${subProgress.total} sub-lessons complete${
                    masterySlot === "passed"
                      ? ", mastered"
                      : masterySlot === "available"
                        ? ", mastery test available"
                        : ""
                  }`
                : ""}
            >
              {subProgress
                ? Array.from({ length: subProgress.total }).map((_, i) => (
                    <span
                      key={i}
                      className="lingo-node-subdot"
                      data-filled={
                        i < subProgress.done ? "true" : undefined
                      }
                    />
                  ))
                : null}
              {masterySlot && masterySlot !== "locked" ? (
                <span
                  className="lingo-mastery-slot"
                  data-state={masterySlot}
                  aria-hidden
                  title={
                    masterySlot === "passed"
                      ? "Row mastered"
                      : "Row test available"
                  }
                >
                  ★
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
        <span className="lingo-node-label">{label}</span>
      </div>
    </div>
  );
}
