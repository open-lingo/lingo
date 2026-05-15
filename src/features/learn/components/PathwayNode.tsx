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
    <div className="lingo-path-row" data-pos={positionOffset}>
      <div className="lingo-node" data-state={state}>
        {flag === "continue" && (
          <span className="lingo-continue-flag">Continue</span>
        )}
        <div className="lingo-node-disc-wrap">
          <button
            type="button"
            className="lingo-node-disc"
            onClick={handleClick}
            disabled={isLocked}
            aria-label={`${label}${isLocked ? " (locked)" : ""}`}
            title={label}
          >
            {glyph}
            {reviewCount && reviewCount > 0 ? (
              <span className="lingo-review-badge">×{reviewCount}</span>
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
        </div>
        <span className="lingo-node-label">{label}</span>
      </div>
    </div>
  );
}
