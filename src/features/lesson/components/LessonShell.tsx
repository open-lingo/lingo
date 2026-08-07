import type { ReactNode, Ref } from "react";

/**
 * The viewport-locked exercise shell — ONE implementation shared by the lesson
 * player (`LessonPage`) and the placement / per-module test-out runner
 * (`PlacementTestPage`).
 *
 * Both surfaces render the same `StepRenderer` step views, so they must give
 * those views the same box to live in. They didn't: `PlacementTestPage`
 * hand-rolled its own shell that diverged in four ways, every one of which was
 * a visible defect at 1080p (Spencer QA 2026-08-05):
 *
 *   1. `min-h-[100dvh]` instead of a FIXED height — the shell grew with its
 *      content instead of capping it, so the bottom of the step spilled past
 *      the viewport.
 *   2. no `min-h-0` on the flex child — a flex item's default `min-height:auto`
 *      refuses to shrink below its content, which forces (1) to happen.
 *   3. no `overflow-y-auto` — with nowhere to scroll, overflow just painted
 *      off-screen. The Continue button rendered at y=1093 in a 1080px viewport
 *      and was simply unreachable.
 *   4. no `max-w-2xl` stage — step content stretched the full window, so MCQ
 *      option tiles rendered 717px wide against the lesson's ~328px.
 *
 * Keeping the contract here means a change to the lesson shell can't silently
 * skip the test-out surface again. The layout rules this encodes are the ones
 * in CLAUDE.md § "Lesson UI stability rules":
 *
 * - The shell is FIXED-height; the window never scrolls during an exercise.
 * - The stage scroller is the ONLY scroll area, and it is the `container-type:
 *   size` query container — step views size tiles against `cqh`/`cqw` (the real
 *   free space) rather than `dvh`/`vw`, so mobile chrome show/hide can't jitter
 *   or overflow them.
 * - Header, stage and footer share ONE centred `max-w-2xl` column, so the
 *   measure is identical on a phone and on a 1080p monitor and the primary CTA
 *   lands a consistent distance from the bottom edge.
 */

/**
 * Height reserved outside the shell. Keep header/stage/footer inside this box
 * and the primary CTA stays in-fold without any `dvh` arithmetic in step
 * content. `--cookie-consent-height` is published by the consent banner so the
 * shell shortens rather than hiding the CTA behind it.
 */
export const SHELL_HEIGHT =
  "h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))]";

/** The shared measure. Header, stage and footer all use it — don't fork it. */
export const SHELL_COLUMN = "mx-auto w-full max-w-2xl";

type Props = {
  /** Progress bar / exit affordance row. Rendered inside the shared column. */
  header?: ReactNode;
  /** Full-bleed strip between header and stage (e.g. the replay banner). */
  banner?: ReactNode;
  /** Below the stage, still inside the shell (e.g. the keyboard hint). */
  footer?: ReactNode;
  /** Focus/scroll target for the stage scroller. */
  scrollerRef?: Ref<HTMLDivElement>;
  /** Accessible name for the scroll region. */
  stageLabel?: string;
  /** Spread onto the inner stage — the visual-QA capture hooks. */
  stageProps?: Record<string, string | undefined>;
  /** Extra classes for the outermost box (e.g. `bg-background`). */
  className?: string;
  children: ReactNode;
};

export function LessonShell({
  header,
  banner,
  footer,
  scrollerRef,
  stageLabel,
  stageProps,
  className,
  children,
}: Props) {
  return (
    <div
      className={`mx-auto flex ${SHELL_HEIGHT} w-full flex-col${className ? ` ${className}` : ""}`}
    >
      {header && (
        <div className={`${SHELL_COLUMN} flex items-center gap-4 py-3`}>
          {header}
        </div>
      )}

      {banner}

      <div
        ref={scrollerRef}
        tabIndex={-1}
        aria-label={stageLabel}
        // `min-h-0` is load-bearing: without it this flex item keeps its
        // `min-height:auto` content floor, refuses to shrink on short windows,
        // and pushes the CTA out of the shell instead of scrolling.
        className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4 outline-none [container-type:size]"
      >
        {/* `data-lesson-stage` is the styling hook that pins each step view's
            `[data-testid="primary-cta"]` block to the bottom of this scroller
            (see index.css § "Lesson action bar"). It is set HERE so the lesson
            player and the placement/test-out runner both get it — the CTA
            behaviour must not depend on which surface mounted the step. */}
        <div
          data-lesson-stage=""
          // `min-h-0` for the same reason as the scroller above — and it was
          // missing here, which quietly capped what any step view could do.
          // A step that opts into shrinking (its own root `min-h-0`, an
          // elastic region inside it) got a wrapper stuck at content height,
          // so the shrink never happened and the step's CTA left the fold
          // anyway. Found via `dialogue_listen` 2026-08-06: its transcript
          // could not give space back, so the answer options and the Check
          // button sat 48px and 152px below the fold at 900×700.
          // Steps that do NOT opt in are unaffected: their children keep
          // `min-height: auto`, so nothing shrinks and the scroller scrolls
          // exactly as before.
          className={`${SHELL_COLUMN} flex min-h-0 flex-1 flex-col`}
          {...stageProps}
        >
          {children}
        </div>
      </div>

      {footer}
    </div>
  );
}
