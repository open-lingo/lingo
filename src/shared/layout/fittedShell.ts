/**
 * Geometry for the app's FITTED surfaces — the ones where the window never
 * scrolls and a single inner scroller owns all the overflow.
 *
 * There are two: the lesson / placement / test-out player
 * (`features/lesson/components/LessonShell`) and, below `md`, the flashcard
 * review session (`features/flashcards/components/ReviewShell`). They must
 * agree on the height budget or one of them silently overflows the viewport,
 * so the number lives here instead of in either feature.
 *
 * Why not just import `LessonShell` from flashcards: `features/lesson` already
 * imports the flashcards SRS engine (`LessonPage.tsx:74-77`). A UI import back
 * the other way would close a feature-to-feature cycle, and the piece that
 * actually must not drift is this string, not the JSX.
 *
 * `1.5rem` is exactly `routes/Layout.tsx`'s focused-flow `<main>` padding
 * (`py-3` = 12px + 12px), so a shell of this height fills the viewport with
 * nothing left to scroll. `--cookie-consent-height` is published by the consent
 * banner so the shell SHORTENS rather than hiding its bottom row behind it.
 */
export const FITTED_SHELL_HEIGHT =
  "h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))]";

/**
 * The lesson measure — header, stage and footer all use it. The review session
 * has its own narrower measure (`max-w-md`, matching the reviewer's historical
 * card column), so it deliberately does not consume this.
 */
export const FITTED_SHELL_COLUMN = "mx-auto w-full max-w-2xl";
