import type { ReactNode, RefObject } from "react";
import { SHELL_COLUMN } from "../components/LessonShell";

/**
 * The QA pages' lesson-shell stand-in — one copy of the REAL stage
 * contract, because the first ad-hoc frame (`flex h-full overflow-hidden`)
 * silently broke it: without an ancestor with `container-type: size`, the
 * `cqh`/`cqw` units the MCQ grids size themselves with fall back to
 * VIEWPORT units, so a step computed its budget from the monitor instead
 * of the 596px frame and overflowed by 194px (Spencer QA 2026-08-20,
 * word_image_mcq on the m1 L1 page).
 *
 * Mirrors `LessonShell` exactly where it matters:
 *   scroller — `overflow-y-auto py-4 [container-type:size]` + `min-h-0`
 *   stage    — `data-lesson-stage` (the `--stage-tail` / CTA-pinning hook)
 *              inside `SHELL_COLUMN`, `flex min-h-0 flex-1 flex-col`
 *
 * `scrollerRef` is for the pages' overflow readout — measure THIS node's
 * `scrollHeight - clientHeight` (the scroller is what the real shell lets
 * scroll; the frame itself never should).
 */
export function DevStageFrame({
  height,
  scrollerRef,
  children,
}: {
  height: number;
  scrollerRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-surface"
      style={{ height }}
    >
      <div
        ref={scrollerRef}
        className="keep-native-scrollbar flex h-full min-h-0 flex-col overflow-y-auto px-4 py-4 [container-type:size]"
      >
        <div
          data-lesson-stage=""
          className={`${SHELL_COLUMN} flex min-h-0 flex-1 flex-col`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
