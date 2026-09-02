import type { ReactNode } from "react";
import { FITTED_SHELL_HEIGHT } from "@/shared/layout/fittedShell";

/**
 * The flashcard review session's outer box.
 *
 * `fitted` is the whole feature. Below `md` the session becomes a
 * LESSON-SHAPED surface — fixed height, one inner scroller, window never
 * scrolls — because on the phone the reviewer forced a scroll to see
 * everything it had already rendered (Spencer, 2026-09-02). At `md` and up
 * `fitted={false}` reproduces the exact box the reviewer has always had, so the
 * desktop layout (centred `max-w-md` column, `space-y-4`, `relative` for the
 * `lg:` detail overlay to anchor against) does not move by a pixel.
 *
 * The mechanics are `LessonShell`'s, re-expressed rather than imported: see
 * `@/shared/layout/fittedShell` for why the dependency may not point at
 * `features/lesson`. The one value that must not drift is shared from there.
 *
 * Why `data-lesson-stage` on a flashcard surface: it is the app's existing
 * "this is a fitted stage" contract, and it buys two things. (1)
 * `tests/mobile/stage-fit.mobile.spec.ts` fires ONLY on elements carrying it,
 * so setting it here is what puts `/practice/flashcards/review` under the
 * existing gate instead of writing a second one. (2) `index.css` § "The
 * stage's bottom DEAD ZONE" gives it `padding-bottom: 10cqh` (5cqh under
 * 700px tall) — the thumb band the grade row wants anyway. It carries no
 * lesson behaviour on its own: the CTA-pinning rules in that stylesheet are
 * scoped to `[data-testid="primary-cta"]`, which this surface does not render.
 */
type Props = {
  /** Fixed-height single-scroller stage. Pass `useViewport().isMobile`. */
  fitted: boolean;
  /**
   * Slim control row. Fitted: pinned above the scroller so it never scrolls
   * away. Otherwise: rendered as the first child of the column, which is where
   * the reviewer's back link / icon row has always been.
   */
  toolbar: ReactNode;
  /** Accessible name for the scroll region (fitted only). */
  stageLabel?: string;
  children: ReactNode;
};

export function ReviewShell({ fitted, toolbar, stageLabel, children }: Props) {
  if (!fitted) {
    return (
      // `justify-center` keeps the card column horizontally centred; the detail
      // panel is an absolute overlay INSIDE the centred column, so revealing it
      // never displaces the card.
      <div className="flex min-h-0 flex-1 justify-center">
        <div className="relative flex min-w-0 max-w-md flex-1 flex-col space-y-4">
          {toolbar}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      // `*-safe` (tailwind.config.js) = `max(env(safe-area-inset-*), 0px)`: a
      // literal no-op in a browser tab and on desktop, load-bearing in the iOS
      // wrapper where the WKWebView is full-bleed (59pt top / 34pt bottom on a
      // 15 Pro Max, measured 2026-08-07).
      className={`mx-auto flex ${FITTED_SHELL_HEIGHT} w-full max-w-md flex-col pb-safe pl-safe pr-safe pt-safe`}
    >
      <div className="shrink-0 py-2">{toolbar}</div>
      <div
        aria-label={stageLabel}
        // `min-h-0` is load-bearing: without it this flex item keeps its
        // `min-height:auto` content floor, refuses to shrink on a short window,
        // and pushes the grade row out of the shell instead of scrolling.
        // `[container-type:size]` makes this the query container so the card
        // sizes against `cqh` — the real free space — and never against `dvh`,
        // which mobile chrome show/hide would jitter.
        //
        // Deliberately NOT `keep-native-scrollbar` (the lesson stage's opt-out
        // in index.css § "Touch surfaces"): this stage is supposed to FIT, so a
        // permanently painted scrollbar would be advertising a bug.
        className="flex min-h-0 flex-1 flex-col overflow-y-auto [container-type:size]"
      >
        <div
          data-lesson-stage=""
          className="relative flex min-h-0 w-full flex-1 flex-col gap-3"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
