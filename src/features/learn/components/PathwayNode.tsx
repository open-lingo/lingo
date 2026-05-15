import type { MouseEventHandler } from "react";

export type PathwayNodeState = "locked" | "available" | "current" | "done";
export type PathwayNodePos = -3 | -2 | -1 | 0 | 1 | 2 | 3;

/** Callout flag variants for the current-lesson node:
 *  - "continue": pill above the node — mid-course resume
 *  - "start": pill to the right with arrow — first lesson, no progress yet
 *  - null/undefined: no flag */
export type PathwayNodeFlag = "continue" | "start" | null;

export type PathwayNodeProps = {
  glyph: string;
  label: string;
  state: PathwayNodeState;
  /** Snake offset bucket. */
  positionOffset: PathwayNodePos;
  reviewCount?: number;
  flag?: PathwayNodeFlag;
  /** When true, render the smaller (60px) cluster variant for row sub-lessons.
   *  @deprecated kept for back-compat; clusters now render as a single node. */
  cluster?: boolean;
  /** When true, render the row-test variant (dashed border + corner badge). */
  isTest?: boolean;
  /** When true, render the module-recap variant (amber gradient + trophy badge). */
  isRecap?: boolean;
  /** Sub-lesson progress dots shown below the label (e.g. 2/4 done). */
  subProgress?: { done: number; total: number };
  onClick?: () => void;
};

/** Single node in the winding lesson pathway. Visual styles live in
 * pathway.css under `.lingo-node` + `.lingo-node-disc`. */
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
    // Don't bubble to the module-card header (which toggles open/closed).
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
            {glyph}
            {reviewCount && reviewCount > 0 ? (
              <span className="lingo-review-badge">×{reviewCount}</span>
            ) : null}
            {isTest && !isRecap ? (
              <span className="lingo-test-badge" aria-hidden="true">
                T
              </span>
            ) : null}
            {isRecap ? (
              <span className="lingo-recap-badge" aria-hidden="true">
                🏆
              </span>
            ) : null}
          </button>
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
