# Wave B: focused mobile review session shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the flashcard review session into a fitted, chrome-free, one-screen surface on phones — no window scroll, no app header, no breadcrumbs, no bottom tab bar below `md` — while the desktop reviewer renders exactly as it does today. Along the way, split the 959-line `FlashcardTester.tsx` into named pieces, give it its first render test, and make two grade buttons the default for every learner.

**Architecture:** `FlashcardTester` keeps ALL session state (queue, slots, index, flip, grade, undo, quests, sync) and becomes a composition root. Six new presentational components live in `src/features/flashcards/components/`: `ReviewShell` (the box), `ReviewToolbar` (back / progress / details / settings / undo), `ReviewCard` (the flip surface), `GradeRow` (reveal + grade buttons), `ReviewDetailsSheet` (mobile-only bottom sheet: card details + session stats + review settings), `SessionSummary` (the done screen). `ReviewShell` takes one boolean, `fitted`: `false` renders today's centred `max-w-md` column verbatim, `true` renders a LessonShell-shaped fixed-height stage carrying `data-lesson-stage` so the existing Playwright stage-fit gate covers the route. The height budget both shells share moves to `src/shared/layout/fittedShell.ts` — `features/lesson` already imports the flashcards SRS engine, so a `features/flashcards` → `features/lesson` UI import would close a feature cycle; a `shared/` constants module is the seam instead. `routes/Layout.tsx` and `features/practice/PracticeLayout.tsx` both delegate their "is this a focused flow?" decision to one pure, unit-tested predicate in `src/routes/focusedFlow.ts` that takes `(pathname, isMobile)`.

**Tech Stack:** Vite 6, React 19, TypeScript strict, Tailwind 3, Vitest + Testing Library (happy-dom), Playwright mobile gate (`tests/mobile/`).

**Spec:** `docs/superpowers/specs/2026-09-02-flashcards-mobile-overhaul-design.md` — section C ("Review session shell (Wave B)"), plus the binding "Decisions" (1 and 2) and "Current state" sections.

**Depends on Wave A** (`docs/superpowers/plans/2026-09-02-wave-a-touch-and-furigana.md`), which is assumed landed: `src/features/flashcards/components/CardFront.tsx` exists with props `{ text, reading?, cardId?, face?: "prompt" | "answer", className? }`, `Flashcard` carries `reading?: { surface, kana }`, and `CardFace` inside `FlashcardTester.tsx` already calls `CardFront` and already takes a `face` prop. Do NOT redo any of that. If `CardFront.tsx` is missing, stop and report — Task 4 moves code that assumes it.

## Global Constraints

- **Desktop must not move.** Every task states how desktop stays byte-identical. The `lg:` detail overlay (`FlashcardDetailSidebar layout="overlay"`) and the `lg:hidden` stacked panel both stay exactly as they are on `md`+; only the sub-`md` tree changes.
- **Two grade buttons are the default for everyone; four is opt-in via the existing `settings.flashcards.gradingLayout` select.** The silent flip-to-four after the first session is deleted, not disabled (Spencer, 2026-09-02).
- **Focused chrome is MOBILE ONLY** (below `md` = 768px, `BREAKPOINTS.md` in `src/shared/hooks/breakpoints.ts`). Desktop keeps header, breadcrumbs and sidebar.
- **Pixel floors in `px`, never `rem`** — `--font-base` clamps to 15px on short laptops, so a rem floor measures short. Tap targets ≥24 CSS px (WCAG 2.2 SC 2.5.8); the existing 44px review controls stay 44px.
- **No `dvh` arithmetic inside stage content.** The fixed shell owns the one `dvh` calc; everything inside it sizes in `cqh`/`cqw` against the `[container-type:size]` scroller, or in px.
- Stage explicit paths only; **never `git add -A`** — another session may be editing the tree. Commit only on the Wave B worktree branch (`wt-wave-b` / `wave-b-review-shell`), never on `main`.
- Never touch `~/.claude/**` or `.env*`. No MUI, no ESLint/Prettier configs, no back-compat shims.
- **Sibling parity line after every task**: desktop · iOS Capacitor build · KO / ES / FR decks. State each as inherited / ported / N/A.
- `npm run preflight` (`tsc -b && vitest run && CI=true vite build`) green before reporting the wave done.

---

### Task 1: Two grade buttons for everyone — delete the history-aware flip

**Files:**
- Modify: `src/features/flashcards/engine/gradingLayout.ts:1-49` (whole file)
- Modify: `src/features/flashcards/engine/index.ts:52`
- Modify: `src/features/flashcards/FlashcardTester.tsx:9-24` (engine import list) and `:200-210`
- Test: `src/features/flashcards/engine/gradingLayout.test.ts:1-59` (rewrite)

**Interfaces:**
- Produces: `resolveGradingLayout(explicitPref: GradingLayout | undefined): GradingLayout` — **one argument now**, was two.
- Removes: `hasAnyReviewedCard(): boolean` from `gradingLayout.ts` and from the engine barrel. Verified 2026-09-02 that its only callers are `FlashcardTester.tsx:23,205` and its own test — deleting it leaves no dead code behind (CLAUDE.md: no back-compat shims).
- Unchanged: `SIMPLE_RATING`, `type GradingLayout`.

- [ ] **Step 1: Rewrite the test (RED)**

Replace the entire contents of `src/features/flashcards/engine/gradingLayout.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import { resolveGradingLayout, SIMPLE_RATING } from "./gradingLayout";

describe("resolveGradingLayout", () => {
  it("honors an explicit 'simple' preference", () => {
    expect(resolveGradingLayout("simple")).toBe("simple");
  });

  it("honors an explicit 'full' preference", () => {
    expect(resolveGradingLayout("full")).toBe("full");
  });

  it("defaults to 'simple' — two buttons are the default for everyone", () => {
    expect(resolveGradingLayout(undefined)).toBe("simple");
  });

  it("is a pure function of the preference — no history can promote it", () => {
    // Regression guard for the DELETED `hasAnyReviewedCard` branch (Spencer,
    // 2026-09-02): the reviewer used to grow from two buttons to four the
    // moment the learner had graded a single card, silently, between session
    // one and session two. The resolver now takes nothing but the stored
    // preference, so there is no input that could do that again.
    expect(resolveGradingLayout.length).toBe(1);
    expect(resolveGradingLayout(undefined)).toBe("simple");
  });
});

describe("SIMPLE_RATING mapping", () => {
  it("maps 'Didn't know' to the 'again' rating", () => {
    expect(SIMPLE_RATING.didntKnow).toBe("again");
  });

  it("maps 'Knew it' to the 'good' rating", () => {
    expect(SIMPLE_RATING.knewIt).toBe("good");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/features/flashcards/engine/gradingLayout.test.ts
```
Expected: FAIL — `resolveGradingLayout.length` is `2`, and `tsc` in the editor flags the 1-arg calls.

- [ ] **Step 3: Rewrite `gradingLayout.ts`**

Replace the entire contents of `src/features/flashcards/engine/gradingLayout.ts` with:

```ts
import type { SRSRating } from "../data/types";

/**
 * Grading-button layout for the flashcard reviewer.
 *
 * - `"simple"` — two buttons: "Didn't know" (→ `again`) / "Knew it" (→ `good`).
 * - `"full"`   — the four-button Again/Hard/Good/Easy row.
 */
export type GradingLayout = "simple" | "full";

/**
 * Resolve the effective grading layout.
 *
 * TWO BUTTONS ARE THE DEFAULT FOR EVERYONE (Spencer, 2026-09-02). This used to
 * take a second argument, `hasAnyReviewedCard`, and return `"full"` for anyone
 * who had ever graded a card. That meant the reviewer changed shape between the
 * learner's first and second session with nothing announcing it — and on a
 * phone the four-button row is the widest, most cramped thing on the screen.
 * Four stays available, but only when the learner picks it in review settings
 * (`flashcards.gradingLayoutLabel`), and that choice is authoritative forever.
 */
export function resolveGradingLayout(
  explicitPref: GradingLayout | undefined,
): GradingLayout {
  return explicitPref === "full" ? "full" : "simple";
}

/** Map a simple-mode button to its FSRS rating. */
export const SIMPLE_RATING: Record<"didntKnow" | "knewIt", SRSRating> = {
  didntKnow: "again",
  knewIt: "good",
};
```

(The `import { getSRSStore } from "./srsStorage";` line goes with `hasAnyReviewedCard`.)

- [ ] **Step 4: Drop it from the engine barrel**

`src/features/flashcards/engine/index.ts:52` — change:

```ts
export { resolveGradingLayout, SIMPLE_RATING } from "./gradingLayout";
```

(Line 53, `export type { GradingLayout } from "./gradingLayout";`, is unchanged.)

- [ ] **Step 5: Update the reviewer**

In `src/features/flashcards/FlashcardTester.tsx`, delete `  hasAnyReviewedCard,` from the engine import block (line 23), then replace lines 200-210 with:

```tsx
  // Grading experience prefs (persisted via SettingsContext).
  const { settings, updateFlashcards } = useSettings();
  // Two buttons unless the learner explicitly chose four in review settings
  // (Spencer, 2026-09-02). No history-derived promotion, so nothing can change
  // the row's shape mid-learner — the `hadReviewedCardAtMount` snapshot that
  // used to freeze the old flip for the duration of a session is gone with it.
  const gradingLayout = resolveGradingLayout(settings.flashcards?.gradingLayout);
  const showIntervalPreviews = settings.flashcards?.showIntervalPreviews ?? false;
```

(This deletes the `explicitGradingLayout` const and the `hadReviewedCardAtMount` `useState`. `useState` is still imported and used elsewhere — leave the import.)

- [ ] **Step 6: Run to verify it passes**

```bash
npx vitest run src/features/flashcards && npx tsc -b
```
Expected: 6 PASS in `gradingLayout.test.ts`, the rest of the flashcards suite unchanged, no type errors. If `tsc` reports an unused import in `FlashcardTester.tsx`, remove exactly that symbol.

- [ ] **Step 7: Sibling parity**

State: desktop — inherited (a desktop learner who never touched the setting now sees two buttons; that is the decision, not a regression) · iOS Capacitor — inherited (same bundle, rebuild to see it) · KO / ES / FR decks — N/A (the setting is deck-agnostic).

---

### Task 2: Shared fitted-shell geometry + `ReviewShell` (unwired)

**Files:**
- Create: `src/shared/layout/fittedShell.ts`
- Modify: `src/features/lesson/components/LessonShell.tsx:1,38-48`
- Create: `src/features/flashcards/components/ReviewShell.tsx`
- Test: `src/features/flashcards/components/ReviewShell.test.tsx` (create)

**Interfaces:**
- Produces:
  ```ts
  // @/shared/layout/fittedShell
  export const FITTED_SHELL_HEIGHT: string; // "h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))]"
  export const FITTED_SHELL_COLUMN: string; // "mx-auto w-full max-w-2xl"
  ```
  ```ts
  // @/features/flashcards/components/ReviewShell
  export function ReviewShell(props: {
    fitted: boolean;
    toolbar: ReactNode;
    stageLabel?: string;
    children: ReactNode;
  }): JSX.Element
  ```
- Consumes: nothing new. `LessonShell` keeps exporting `SHELL_HEIGHT` and `SHELL_COLUMN` because `src/features/lesson/dev/DevStageFrame.tsx:2` imports `SHELL_COLUMN`.
- Nothing renders `ReviewShell` yet — this task cannot change any pixel on any surface.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/flashcards/components/ReviewShell.test.tsx
/**
 * The review session's box. Two shapes, one component.
 *
 * `fitted={false}` (md and up) must reproduce the DOM the reviewer has always
 * had — centred `max-w-md` column, `space-y-4`, `relative` so the `lg:` detail
 * overlay can anchor to it — because Wave B is explicitly not allowed to move
 * the desktop layout.
 *
 * `fitted` (below md) is the lesson-shaped stage: fixed height, ONE inner
 * scroller which is also the `container-type: size` query container, and
 * `data-lesson-stage` on the child so `tests/mobile/stage-fit.mobile.spec.ts`
 * starts covering `/practice/flashcards/review`. That spec measures the stage's
 * PARENT (it assumes the parent is the scroller), so the parent-child shape
 * asserted below is load-bearing for the gate, not cosmetic.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReviewShell } from "./ReviewShell";

describe("ReviewShell", () => {
  it("fitted=false keeps the historical centred column and no stage hook", () => {
    const { container } = render(
      <ReviewShell fitted={false} toolbar={<div>bar</div>}>
        <p>card</p>
      </ReviewShell>,
    );
    expect(container.querySelector("[data-lesson-stage]")).toBeNull();
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("justify-center");
    expect(root.className).toContain("min-h-0");
    const column = root.firstElementChild as HTMLElement;
    expect(column.className).toContain("relative");
    expect(column.className).toContain("max-w-md");
    expect(column.className).toContain("space-y-4");
    expect(column.firstElementChild?.textContent).toBe("bar");
  });

  it("fitted is a fixed-height shell with one size-query scroller", () => {
    const { container } = render(
      <ReviewShell fitted toolbar={<div>bar</div>} stageLabel="Review card">
        <p>card</p>
      </ReviewShell>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain(
      "h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))]",
    );
    expect(root.className).toContain("pb-safe");
    expect(root.className).toContain("pt-safe");

    const stage = container.querySelector("[data-lesson-stage]") as HTMLElement;
    expect(stage).not.toBeNull();
    expect(stage.className).toContain("min-h-0");

    const scroller = stage.parentElement as HTMLElement;
    expect(scroller.className).toContain("overflow-y-auto");
    expect(scroller.className).toContain("[container-type:size]");
    expect(scroller.className).toContain("min-h-0");
    expect(scroller.getAttribute("aria-label")).toBe("Review card");
  });

  it("shares its height budget with the lesson shell", async () => {
    const { FITTED_SHELL_HEIGHT } = await import("@/shared/layout/fittedShell");
    const { SHELL_HEIGHT } = await import(
      "@/features/lesson/components/LessonShell"
    );
    expect(SHELL_HEIGHT).toBe(FITTED_SHELL_HEIGHT);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/features/flashcards/components/ReviewShell.test.tsx
```
Expected: FAIL — cannot resolve `./ReviewShell`.

- [ ] **Step 3: Create the shared geometry module**

```ts
// src/shared/layout/fittedShell.ts
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
```

- [ ] **Step 4: Point `LessonShell` at it**

In `src/features/lesson/components/LessonShell.tsx`, add after line 1 (`import type { ReactNode, Ref } from "react";`):

```ts
import {
  FITTED_SHELL_COLUMN,
  FITTED_SHELL_HEIGHT,
} from "@/shared/layout/fittedShell";
```

then replace lines 38-48 (the `SHELL_HEIGHT` doc comment + both const declarations) with:

```ts
/**
 * Height reserved outside the shell. Keep header/stage/footer inside this box
 * and the primary CTA stays in-fold without any `dvh` arithmetic in step
 * content. The value itself lives in `@/shared/layout/fittedShell` so the
 * mobile flashcard review shell can use the identical budget without importing
 * lesson UI — see that file for why the direction matters. Re-exported here
 * because this module is where the app has always looked for it.
 */
export const SHELL_HEIGHT = FITTED_SHELL_HEIGHT;

/** The shared measure. Header, stage and footer all use it — don't fork it. */
export const SHELL_COLUMN = FITTED_SHELL_COLUMN;
```

- [ ] **Step 5: Create `ReviewShell`**

```tsx
// src/features/flashcards/components/ReviewShell.tsx
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
```

- [ ] **Step 6: Run to verify it passes**

```bash
npx vitest run src/features/flashcards/components/ReviewShell.test.tsx
```
Expected: 3 PASS.

- [ ] **Step 7: Prove the lesson player is untouched**

```bash
npx vitest run src/features/lesson && npx tsc -b
```
Expected: same pass count as before this task, no type errors. Then:
```bash
npx playwright test --project=mobile --grep "stage fit"
```
Expected: identical results to the pre-task run — `/practice/flashcards/review` still skips with "not a lesson stage surface" because nothing renders `ReviewShell` yet.

- [ ] **Step 8: Sibling parity**

State: desktop — N/A (nothing mounted) · iOS Capacitor — N/A · KO / ES / FR — N/A (pure layout scaffolding, no content).

---

### Task 3: `Sheet` gains `side="auto"` and a home-indicator inset

**Files:**
- Modify: `src/shared/components/ui/Sheet.tsx:8-20` (`SheetSide`, `sideClasses`, the `side` prop doc)
- Test: `src/shared/components/ui/Sheet.test.tsx` (append two cases)

**Interfaces:**
- Produces: `export type SheetSide = "left" | "right" | "bottom" | "top" | "auto";` — `"auto"` is a bottom sheet below `md` and a right drawer at `md`+, in one class string, so a caller does not have to hold a `useViewport()` just to pick an edge.
- Behaviour change to an existing caller: `side="bottom"` gains `pb-safe`. One caller — `src/shared/components/ui/FilterBar.tsx:172`. `pb-safe` resolves to `max(env(safe-area-inset-bottom), 0px)`, i.e. 0 everywhere except the iOS wrapper, so this is additive.
- Consumed by `ReviewDetailsSheet` in Task 5.

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe("Sheet", …)` block in `src/shared/components/ui/Sheet.test.tsx`:

```tsx
  it("side='auto' is a bottom sheet below md and a right drawer above", () => {
    render(
      <Sheet open onClose={() => {}} side="auto" title="Details">
        <p>Body</p>
      </Sheet>,
    );
    const panel = screen.getByRole("dialog");
    // Phone form: full-bleed, pinned to the bottom edge, rounded top.
    expect(panel.className).toContain("inset-x-0");
    expect(panel.className).toContain("bottom-0");
    expect(panel.className).toContain("rounded-t-2xl");
    // Home-indicator clearance in the full-bleed iOS wrapper; 0px elsewhere.
    expect(panel.className).toContain("pb-safe");
    // Desktop form on the SAME element, breakpoint-gated — no JS media query.
    expect(panel.className).toContain("md:right-0");
    expect(panel.className).toContain("md:h-full");
    expect(panel.className).toContain("md:max-w-sm");
    expect(panel.className).toContain("md:pb-0");
  });

  it("side='bottom' clears the home indicator too", () => {
    render(
      <Sheet open onClose={() => {}} side="bottom" title="Filters">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByRole("dialog").className).toContain("pb-safe");
  });
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/shared/components/ui/Sheet.test.tsx
```
Expected: FAIL — `side="auto"` is not assignable to `SheetSide`, and the bottom panel has no `pb-safe`.

- [ ] **Step 3: Implement**

In `src/shared/components/ui/Sheet.tsx`, replace lines 8-15 with:

```ts
export type SheetSide = "left" | "right" | "bottom" | "top" | "auto";

/**
 * `auto` is the responsive pairing the app kept hand-rolling: a bottom sheet on
 * a phone (thumb-reachable, and the platform idiom for secondary detail) and a
 * right drawer at `md`+ where there is horizontal room and a bottom sheet would
 * waste it. Same shape `ui/Modal` already uses for its mobile bottom-sheet
 * form, expressed as one class string so callers pick an intent, not an edge.
 *
 * `pb-safe` on both bottom-anchored variants: a panel pinned to `bottom-0` in
 * the full-bleed iOS WKWebView puts its last control under the home indicator
 * (34pt on a 15 Pro Max). `pb-safe` = `max(env(safe-area-inset-bottom), 0px)`,
 * so it is a literal no-op in a browser tab and on desktop. `md:pb-0` takes it
 * back off in the drawer form, where the panel is inset-y-0 and not on the
 * bottom edge at all.
 */
const sideClasses: Record<SheetSide, string> = {
  left: "inset-y-0 left-0 h-full w-[88vw] max-w-sm border-r rounded-r-2xl",
  right: "inset-y-0 right-0 h-full w-[88vw] max-w-sm border-l rounded-l-2xl",
  bottom: "inset-x-0 bottom-0 max-h-[88vh] border-t rounded-t-2xl pb-safe",
  top: "inset-x-0 top-0 max-h-[88vh] border-b rounded-b-2xl",
  auto:
    "inset-x-0 bottom-0 max-h-[88vh] border-t rounded-t-2xl pb-safe " +
    "md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-[88vw] " +
    "md:max-w-sm md:rounded-l-2xl md:rounded-t-none md:border-l md:border-t-0 md:pb-0",
};
```

Then update the `side` prop doc (line 20) to:

```ts
  /** Which edge the panel attaches to. Default `right` (desktop drawer). `bottom` for a mobile sheet; `auto` for bottom-below-md / right-above. */
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run src/shared/components/ui
```
Expected: all PASS, including the pre-existing `Sheet` and `FilterBar` cases.

- [ ] **Step 5: Confirm Tailwind emits the `md:` variants**

The class strings are literals in a scanned source file, so the JIT sees them. Verify rather than assume:
```bash
CI=true npx vite build && grep -c "md\\\\:rounded-l-2xl" dist/assets/*.css
```
Expected: at least `1`. If `0`, the concatenated string was broken across a template expression — put each variant on one literal line.

- [ ] **Step 6: Sibling parity**

State: desktop — inherited (`auto` renders the same drawer `right` does; `bottom` unchanged off-device) · iOS Capacitor — ported (this is the surface `pb-safe` exists for; verify on the Trap Phone in Task 8) · KO / ES / FR — N/A.

---

### Task 4: First `FlashcardTester.test.tsx`, then extract `ReviewCard` / `GradeRow` / `SessionSummary`

**Files:**
- Create: `src/features/flashcards/FlashcardTester.test.tsx`
- Create: `src/features/flashcards/components/ReviewCard.tsx`
- Create: `src/features/flashcards/components/GradeRow.tsx`
- Create: `src/features/flashcards/components/SessionSummary.tsx`
- Modify: `src/features/flashcards/FlashcardTester.tsx` — delete `HighlightedText` (54-96), `CardFace` (98-120), `RATING_BUTTONS` (122-127), `SIMPLE_BUTTONS` (129-150), `IntervalHint` (152-172), the session-done branch body (545-615), the card button (837-882) and the grade row (884-965); replace with the three components.

**Interfaces:**
- Produces:
  ```ts
  // components/ReviewCard.tsx
  export function ReviewCard(props: {
    card: Flashcard;
    flipped: boolean;
    onFlip: () => void;
    testedModality: SRSModality;
    particles: ParticleDef[] | null;
    highlightMode: boolean;
    /** Mobile fitted stage: fill the leftover space instead of reserving 360px. */
    fitted: boolean;
  }): JSX.Element
  ```
  ```ts
  // components/GradeRow.tsx
  export function GradeRow(props: {
    flipped: boolean;
    onReveal: () => void;
    onRate: (rating: SRSRating) => void;
    gradingLayout: GradingLayout;
    cardId: string;
    defaultEase?: number;
    modality: SRSModality;
    showIntervalPreviews: boolean;
  }): JSX.Element
  ```
  ```ts
  // components/SessionSummary.tsx
  export function SessionSummary(props: {
    reviewed: number;
    correct: number;
    canReviewMore: boolean;
    canFreeReview: boolean;
    freeReview: boolean;
    onRestart: () => void;
    onStartFreeReview: () => void;
    hubPath: string;
    fitted: boolean;
  }): JSX.Element
  ```
- Consumes: `CardFront` (Wave A), `CardImage` from `../CardPreview`, `getModalityTheme` from `../modalityTheme`, `getEffectiveState` + `reviewCard` from `../engine`.
- This task is a **pure move plus one measured height change** (mobile full-mode grade row `h-24` → `h-[104px]`, `sm:h-16` unchanged). Desktop DOM is otherwise identical.

- [ ] **Step 1: Write the characterization test**

This suite is expected to PASS before the extraction as well as after — that is the point of it. It is the net the extraction (and Task 7's shell swap) falls into.

```tsx
// src/features/flashcards/FlashcardTester.test.tsx
/**
 * First render test for the review session. The component was 959 lines with
 * none (spec § "Current state", 2026-09-02).
 *
 * CHARACTERIZATION suite: it pins the behaviour Wave B must not change —
 * render a prompt, reveal it, grade it, undo the grade, and the empty-session
 * summary — so the component split in this task and the shell swap in Task 7
 * are provably behaviour-preserving.
 *
 * Everything that needs a network call or a React context provider is mocked at
 * the import boundary (the `CardManagerPage.test.tsx` pattern). The SRS ENGINE
 * IS NOT MOCKED: grading really runs FSRS and really writes localStorage,
 * because "undo restores the pre-grade state" is only worth asserting against
 * the real scheduler.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import type { Flashcard } from "@/features/flashcards/data/types";
import type { ReviewQueue } from "./engine";

const CARD_ONE: Flashcard = {
  id: "ja:yama",
  type: "word",
  front: "やま",
  back: "mountain",
  note: "Also the second half of many surnames.",
};
const CARD_TWO: Flashcard = {
  id: "ja:kawa",
  type: "word",
  front: "かわ",
  back: "river",
};

function makeQueue(cards: Flashcard[]): ReviewQueue {
  return {
    review: [],
    newCards: cards,
    queue: cards,
    dueCount: 0,
    newCount: cards.length,
    notYetDueCount: 0,
    totalCount: cards.length,
    unseenTotal: cards.length,
    newCardsAllowed: 20,
    cardIdToDefaultEase: {},
  };
}

const mockQueue = vi.hoisted(() => ({ value: null as ReviewQueue | null }));
const mockViewport = vi.hoisted(() => ({ isMobile: false }));

vi.mock("@/shared/hooks/useViewport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/hooks/useViewport")>()),
  useViewport: () => ({
    isMobile: mockViewport.isMobile,
    isTablet: false,
    isDesktop: !mockViewport.isMobile,
  }),
}));
vi.mock("./useSubscriptionQueue", () => ({
  useSubscriptionQueue: () => ({
    queue: mockQueue.value,
    decks: [],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("./useReviewQueueFilter", () => ({
  useReviewQueueFilter: () => ({ kind: "all" }),
}));
vi.mock("./useSRSyncSession", () => ({
  useSRSyncSession: () => ({ dirtyCount: 0 }),
}));
vi.mock("./useFlashcardDueSummary", () => ({
  useFlashcardDueSummary: () => ({ dueCount: 0 }),
}));
vi.mock("./useImagePreload", () => ({ useImagePreload: () => {} }));
vi.mock("@/features/quests/useQuests", () => ({
  useQuests: () => ({ quests: [], complete: vi.fn(), addProgress: vi.fn() }),
}));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  // `audio.silentMode` is read by `useAutoPlayJaAudio`; keep it truthy so the
  // real hook stays silent even if the tts mock below ever stops applying.
  useSettings: () => ({
    settings: { flashcards: {}, audio: { silentMode: true } },
    updateFlashcards: vi.fn(),
  }),
}));
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));
vi.mock("@/features/flashcards/data/loadDeck", () => ({
  getParticlesForLanguage: () => null,
}));
vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  useAutoPlayJaAudio: () => {},
}));
vi.mock("@/shared/tts/prefetch", () => ({ usePrefetchAudio: () => {} }));

import { FlashcardTester } from "./FlashcardTester";
import { clearSRSStore, getEffectiveState } from "./engine";
import { FLASHCARDS_ONBOARDING_STORAGE_KEY } from "./components/FlashcardsOnboardingGate";

function renderTester() {
  return render(
    <MemoryRouter initialEntries={["/ja/practice/flashcards/review"]}>
      <I18nextProvider i18n={i18n}>
        <FlashcardTester />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe("FlashcardTester", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSRSStore();
    // The onboarding gate auto-opens a modal over a virgin store and would
    // cover every assertion here. "1" is the exact sentinel
    // `shouldSkipFlashcardsOnboarding()` looks for.
    localStorage.setItem(FLASHCARDS_ONBOARDING_STORAGE_KEY, "1");
    mockViewport.isMobile = false;
    mockQueue.value = makeQueue([CARD_ONE, CARD_TWO]);
  });

  it("shows the first card's prompt face, unrevealed", () => {
    renderTester();
    expect(screen.getByText("やま")).toBeInTheDocument();
    expect(screen.queryByText("mountain")).not.toBeInTheDocument();
    expect(screen.getByText(/tap to reveal/i)).toBeInTheDocument();
  });

  it("reveals the answer and offers exactly two grade buttons by default", () => {
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    expect(screen.getByText("mountain")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /didn't know/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /knew it/i })).toBeInTheDocument();
    // Decision 1 (Spencer, 2026-09-02): four is opt-in, never a default.
    expect(screen.queryByRole("button", { name: /^hard$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^easy$/i })).not.toBeInTheDocument();
  });

  it("grades the tested modality and advances to the next card", () => {
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /knew it/i }));
    expect(screen.getByText("かわ")).toBeInTheDocument();
    expect(getEffectiveState("ja:yama").recognition.reps).toBe(1);
    // Production is untouched — one modality per answer.
    expect(getEffectiveState("ja:yama").production.reps).toBe(0);
  });

  it("undo restores the pre-grade state and re-shows the card revealed", () => {
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /knew it/i }));
    fireEvent.click(screen.getByRole("button", { name: /undo last grade/i }));
    // Back on the graded slot, already flipped: recognition shows the MEANING.
    expect(screen.getByText("mountain")).toBeInTheDocument();
    expect(getEffectiveState("ja:yama").recognition.reps).toBe(0);
    // Depth is exactly one — the affordance is gone after using it.
    expect(
      screen.queryByRole("button", { name: /undo last grade/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the summary, not a card, when the session has no slots", () => {
    mockQueue.value = makeQueue([]);
    renderTester();
    expect(screen.getByText(/review complete/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to flashcards/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it against the CURRENT component**

```bash
npx vitest run src/features/flashcards/FlashcardTester.test.tsx
```
Expected: **5 PASS**. If any fail, stop — the extraction has no net and you are about to refactor blind. Two likely causes and their fixes: a mock path that does not match the import specifier in `FlashcardTester.tsx:1-45` (copy the specifier verbatim), or an extra provider a hook still demands (add the smallest mock that satisfies it, never a real provider tree).

- [ ] **Step 3: Create `ReviewCard`**

```tsx
// src/features/flashcards/components/ReviewCard.tsx
import { useTranslation } from "react-i18next";
import { PlainText } from "@/shared/components/PlainText";
import { CardImage } from "../CardPreview";
import { CardFront } from "./CardFront";
import { getModalityTheme } from "../modalityTheme";
import type {
  Flashcard,
  CardSegment,
  SRSModality,
} from "@/features/flashcards/data/types";
import type { ParticleDef } from "@/features/practice/data/types";

function getParticleById(
  particles: ParticleDef[] | null,
  id: string,
): ParticleDef | undefined {
  return particles?.find((p) => p.id === id);
}

function HighlightedText({
  segments,
  particles,
  highlightMode,
}: {
  segments: CardSegment[];
  particles: ParticleDef[] | null;
  highlightMode: boolean;
}) {
  if (!segments?.length) return null;
  return (
    <span>
      {segments.map((seg, i) => {
        const particle = seg.particleId
          ? getParticleById(particles, seg.particleId)
          : undefined;
        const isParticle = Boolean(seg.particleId && particle);
        const isRoot = Boolean(highlightMode && seg.meaning && !seg.particleId);
        if (highlightMode && isParticle) {
          return (
            <mark
              key={i}
              className="rounded bg-warning/30 px-0.5"
              title={particle ? `${particle.form}: ${particle.meaning}` : undefined}
            >
              {seg.segment}
            </mark>
          );
        }
        if (isRoot) {
          return (
            <mark key={i} className="rounded bg-success/30 px-0.5" title={seg.meaning}>
              {seg.segment}
            </mark>
          );
        }
        return <span key={i}>{seg.segment}</span>;
      })}
    </span>
  );
}

function CardFace({
  card,
  side,
  face,
  particles,
  highlightMode,
}: {
  card: Flashcard;
  side: "front" | "back";
  face: "prompt" | "answer";
  particles: ParticleDef[] | null;
  highlightMode: boolean;
}) {
  const isFront = side === "front";
  if (isFront) {
    if (highlightMode && card.type === "word" && card.parts?.length) {
      return (
        <HighlightedText segments={card.parts} particles={particles} highlightMode />
      );
    }
    if (highlightMode && card.type === "sentence" && card.words?.length) {
      return (
        <HighlightedText segments={card.words} particles={particles} highlightMode />
      );
    }
    return (
      <CardFront
        text={card.front}
        reading={card.reading}
        cardId={card.id}
        face={face}
      />
    );
  }
  return <PlainText>{card.back}</PlainText>;
}

/**
 * The flip surface.
 *
 * Height is the whole reason this is a component and not inline JSX. On
 * desktop it keeps the historical `min-h-[360px]` floor: EVERY card reserves
 * the same block, image or not, so the grade buttons below never shift between
 * cards and never move under a cursor mid-grade (Spencer QA 2026-07-13).
 *
 * On the fitted mobile stage that floor is wrong — 360px plus chrome plus the
 * grade row does not fit an iPhone SE, and a hard px floor inside a fitted
 * shell is exactly the overflow the shell exists to prevent. There the card is
 * `flex-1` instead: it takes precisely the space the stage has left over, which
 * gives the same guarantee (the grade row cannot jump, because the card's
 * height is a function of the stage, not of the card) with no overflow. The
 * image cap follows suit — `18cqh` of the scroller instead of a fixed 128px.
 */
type Props = {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  testedModality: SRSModality;
  particles: ParticleDef[] | null;
  highlightMode: boolean;
  /** Mobile fitted stage: fill the leftover space instead of reserving 360px. */
  fitted: boolean;
};

export function ReviewCard({
  card,
  flipped,
  onFlip,
  testedModality,
  particles,
  highlightMode,
  fitted,
}: Props) {
  const { t } = useTranslation();
  const modalityTheme = getModalityTheme(testedModality);
  return (
    <button
      type="button"
      onClick={onFlip}
      className={`flex w-full flex-col items-center justify-center rounded-card border-2 border-t-4 border-border bg-surface shadow-sm transition hover:border-accent ${
        modalityTheme.rail
      } ${
        fitted
          ? "min-h-0 flex-1 overflow-hidden px-4 py-6"
          : "min-h-[360px] py-12"
      }`}
    >
      {flipped && card.image && (
        <CardImage
          src={card.image}
          className={`mb-3 w-auto rounded object-contain ${
            fitted ? "max-h-[18cqh]" : "max-h-32"
          }`}
        />
      )}
      <p className="text-center text-3xl font-medium text-text-primary">
        <CardFace
          card={card}
          side={
            // Recognition: shown target script (front) → recall meaning (back).
            // Production:  cued English (back) → produce the target (front).
            // This mapping was INVERTED until 2026-07-02; the engine definition
            // in types.ts and every lesson/grammar grading surface use the sense
            // above, so the reviewer matches them.
            testedModality === "recognition"
              ? flipped
                ? "back"
                : "front"
              : flipped
                ? "front"
                : "back"
          }
          face={flipped ? "answer" : "prompt"}
          particles={particles}
          highlightMode={highlightMode}
        />
      </p>
      <p className="mt-3 text-sm text-text-muted">
        {flipped
          ? testedModality === "recognition"
            ? t("flashcards.meaningLabel", "Meaning")
            : t("flashcards.wordLabel", "Word")
          : t("flashcards.tapToReveal", "Tap to reveal")}
      </p>
    </button>
  );
}
```

- [ ] **Step 4: Create `GradeRow`**

```tsx
// src/features/flashcards/components/GradeRow.tsx
import { useTranslation } from "react-i18next";
import { getEffectiveState, reviewCard } from "../engine";
import type { GradingLayout } from "../engine";
import type { SRSRating, SRSModality } from "@/features/flashcards/data/types";

const RATING_BUTTONS: Array<{ rating: SRSRating; label: string; color: string }> = [
  { rating: "again", label: "Again", color: "bg-error text-white hover:bg-error/90" },
  { rating: "hard", label: "Hard", color: "bg-warning text-white hover:bg-warning/90" },
  { rating: "good", label: "Good", color: "bg-success text-white hover:bg-success/90" },
  { rating: "easy", label: "Easy", color: "bg-accent text-white hover:bg-accent-hover" },
];

// Simple 2-button layout — "Didn't know" grades `again`, "Knew it" grades
// `good`. Both go through the same `onRate` path as the full row so undo,
// requeue and sync behave identically. This is the DEFAULT for everyone.
const SIMPLE_BUTTONS: Array<{
  rating: SRSRating;
  labelKey: string;
  labelDefault: string;
  color: string;
}> = [
  {
    rating: "again",
    labelKey: "flashcards.simpleDidntKnow",
    labelDefault: "Didn't know",
    color: "bg-error text-white hover:bg-error/90",
  },
  {
    rating: "good",
    labelKey: "flashcards.simpleKnewIt",
    labelDefault: "Knew it",
    color: "bg-success text-white hover:bg-success/90",
  },
];

function IntervalHint({
  cardId,
  rating,
  defaultEase,
  modality,
}: {
  cardId: string;
  rating: SRSRating;
  defaultEase?: number;
  modality: SRSModality;
}) {
  // Preview the interval for the TESTED modality only.
  const state = getEffectiveState(cardId, defaultEase);
  const after = reviewCard(state, modality, rating);
  const interval = after[modality].interval;
  if (interval === 0) return <span className="text-[10px]">&lt;1d</span>;
  if (interval === 1) return <span className="text-[10px]">1d</span>;
  if (interval < 30) return <span className="text-[10px]">{interval}d</span>;
  const months = Math.round(interval / 30);
  return <span className="text-[10px]">{months}mo</span>;
}

/**
 * The action row: one "Show Answer" button before the reveal, the grade grid
 * after it.
 *
 * The row is a FIXED-HEIGHT box so the reveal swap never changes the control
 * area's height and shoves the layout (Spencer QA — the buttons were jumping on
 * reveal). Two-button mode is 64px. Four-button mode wraps to 2×2 below `sm`,
 * and its box is 104px rather than the old 96px so each of the two rows clears
 * 48px after the 8px gap — the spec's phone floor, in px, because `--font-base`
 * clamps to 15px on short laptops and a rem floor would measure 44px there.
 * At `sm`+ the grid is 1×4 at the historical 64px: desktop does not move.
 */
type Props = {
  flipped: boolean;
  onReveal: () => void;
  onRate: (rating: SRSRating) => void;
  gradingLayout: GradingLayout;
  cardId: string;
  defaultEase?: number;
  modality: SRSModality;
  showIntervalPreviews: boolean;
};

export function GradeRow({
  flipped,
  onReveal,
  onRate,
  gradingLayout,
  cardId,
  defaultEase,
  modality,
  showIntervalPreviews,
}: Props) {
  const { t } = useTranslation();
  const buttonBase =
    "relative flex h-full min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-sm font-semibold transition";

  return (
    <div
      className={`flex shrink-0 items-stretch ${
        gradingLayout === "simple" ? "h-16" : "h-[104px] sm:h-16"
      }`}
    >
      {flipped ? (
        gradingLayout === "simple" ? (
          <div className="grid w-full grid-cols-2 gap-2">
            {SIMPLE_BUTTONS.map(({ rating, labelKey, labelDefault, color }, i) => (
              <button
                key={rating}
                type="button"
                onClick={() => onRate(rating)}
                className={`${buttonBase} ${color}`}
                title={t("flashcards.ratingShortcut", "Shortcut: {{key}}", {
                  key: i + 1,
                })}
              >
                {/* Keyboard shortcut keycap (lg:+ — keeps mobile clean). */}
                <span
                  className="absolute right-1.5 top-1.5 hidden h-4 w-4 items-center justify-center rounded bg-black/15 text-[10px] font-bold leading-none lg:flex"
                  aria-hidden
                >
                  {i + 1}
                </span>
                {t(labelKey, labelDefault)}
                {showIntervalPreviews && (
                  <IntervalHint
                    cardId={cardId}
                    rating={rating}
                    defaultEase={defaultEase}
                    modality={modality}
                  />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {RATING_BUTTONS.map(({ rating, label, color }, i) => (
              <button
                key={rating}
                type="button"
                onClick={() => onRate(rating)}
                className={`${buttonBase} ${color}`}
                title={t("flashcards.ratingShortcut", "Shortcut: {{key}}", {
                  key: i + 1,
                })}
              >
                <span
                  className="absolute right-1.5 top-1.5 hidden h-4 w-4 items-center justify-center rounded bg-black/15 text-[10px] font-bold leading-none lg:flex"
                  aria-hidden
                >
                  {i + 1}
                </span>
                {label}
                {showIntervalPreviews && (
                  <IntervalHint
                    cardId={cardId}
                    rating={rating}
                    defaultEase={defaultEase}
                    modality={modality}
                  />
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={onReveal}
          className="flex h-full w-full items-center justify-center rounded-xl bg-accent px-6 text-base font-semibold text-white transition hover:bg-accent-hover"
        >
          {t("flashcards.showAnswer", "Show Answer")}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `SessionSummary`**

```tsx
// src/features/flashcards/components/SessionSummary.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

/**
 * The "Review Complete!" screen. Stays inline (it is the same route, not a
 * navigation) and, on the fitted mobile stage, centres itself inside the stage
 * instead of adding `py-12` the stage does not have.
 */
type Props = {
  reviewed: number;
  correct: number;
  /** There is still due/new work — offer "Review More". */
  canReviewMore: boolean;
  /**
   * There are reviewed-but-not-yet-due cards to surface — offer free review.
   * Without this the button is a silent no-op: the queue rebuilds empty and
   * re-shows this same screen.
   */
  canFreeReview: boolean;
  freeReview: boolean;
  onRestart: () => void;
  onStartFreeReview: () => void;
  hubPath: string;
  fitted: boolean;
};

export function SessionSummary({
  reviewed,
  correct,
  canReviewMore,
  canFreeReview,
  freeReview,
  onRestart,
  onStartFreeReview,
  hubPath,
  fitted,
}: Props) {
  const { t } = useTranslation();
  const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 100;
  return (
    <div
      className={`mx-auto flex max-w-md flex-col items-center gap-6 text-center ${
        fitted
          ? "min-h-0 flex-1 justify-center overflow-y-auto py-6"
          : "py-12"
      }`}
    >
      <Icon name="partyPopper" size={48} className="text-accent" />
      <h2 className="text-2xl font-bold text-text-primary">
        {t("flashcards.sessionDone", "Review Complete!")}
      </h2>
      <div className="flex gap-8">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-success">{reviewed}</span>
          <span className="text-xs text-text-muted">
            {t("flashcards.reviewed", "Reviewed")}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-success">{accuracy}%</span>
          <span className="text-xs text-text-muted">
            {t("flashcards.accuracy", "Accuracy")}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {canReviewMore ? (
          <button
            type="button"
            onClick={onRestart}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {t("flashcards.reviewMore", "Review More")}
          </button>
        ) : (
          canFreeReview && (
            <button
              type="button"
              onClick={onStartFreeReview}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Icon name="sparkles" size={16} aria-hidden />
              {t("flashcards.startFreeReview", "Start a free review")}
            </button>
          )
        )}
        <Link
          to={hubPath}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-muted"
        >
          {t("flashcards.backToHub")}
        </Link>
      </div>
      {freeReview && (
        <p className="text-xs text-text-muted">
          {t(
            "flashcards.freeReviewNote",
            "Free review shows cards before they're due. It won't change your schedule much — Good/Easy just nudge intervals.",
          )}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Rewire `FlashcardTester.tsx`**

Delete lines 54-172 (`getParticleById`, `HighlightedText`, `CardFace`, `RATING_BUTTONS`, `SIMPLE_BUTTONS`, `IntervalHint`) — all of it now lives in the two new files. Delete the now-unused imports `PlainText`, `CardImage`, `getModalityTheme`, `reviewCard`… **check each with `tsc -b` rather than by eye**: `reviewCard` and `getEffectiveState` are still used by `handleRate`, and `getModalityTheme` is still used for the modality chip. `CardSegment` and `ParticleDef` type imports stay only if still referenced.

Replace the session-done branch (lines 545-615) with:

```tsx
  if (isSessionDone) {
    return (
      <SessionSummary
        reviewed={sessionStats.reviewed}
        correct={sessionStats.correct}
        canReviewMore={queue.dueCount > 0 || queue.newCount > 0}
        canFreeReview={(queue.notYetDueCount ?? 0) > 0}
        freeReview={freeReview}
        onRestart={handleRestart}
        onStartFreeReview={handleStartFreeReview}
        hubPath={langPath("practice/flashcards")}
        fitted={false}
      />
    );
  }
```

Replace the card button (lines 837-882) with:

```tsx
      <ReviewCard
        card={currentCard}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        testedModality={testedModality}
        particles={particles}
        highlightMode={highlightMode}
        fitted={false}
      />
```

Replace the grade row (lines 884-965) with:

```tsx
      <GradeRow
        flipped={flipped}
        onReveal={() => setFlipped(true)}
        onRate={handleRate}
        gradingLayout={gradingLayout}
        cardId={currentCard.id}
        defaultEase={cardIdToDefaultEase?.[currentCard.id]}
        modality={testedModality}
        showIntervalPreviews={showIntervalPreviews}
      />
```

Add the imports:

```tsx
import { ReviewCard } from "./components/ReviewCard";
import { GradeRow } from "./components/GradeRow";
import { SessionSummary } from "./components/SessionSummary";
```

(`fitted={false}` is hardcoded here on purpose — Task 7 is the only task allowed to change the mobile tree, and this one has to end with desktop AND mobile rendering exactly what they rendered before.)

- [ ] **Step 7: Run to verify nothing changed**

```bash
npx vitest run src/features/flashcards && npx tsc -b
```
Expected: the same 5 `FlashcardTester.test.tsx` PASS as in Step 2, plus the rest of the suite green, no type errors.

- [ ] **Step 8: Prove the pixels did not move**

With `VITE_DEV_AUTH_BYPASS=true npm run dev` on 5173, capture before/after at both widths:
```bash
node scripts/capture-flashcards.mjs /private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/20d27d40-49a5-46eb-966d-4c1c77fa09f2/scratchpad/fc-t4-mobile 375 667
node scripts/capture-flashcards.mjs /private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/20d27d40-49a5-46eb-966d-4c1c77fa09f2/scratchpad/fc-t4-desktop 1280 720
```
Open `fc-front--desktop.png` and `fc-back--desktop.png`. The only permitted difference anywhere is the four-button row's height on a <640px viewport, and only if the learner opted into `full` — the default capture shows two buttons, so at the default the images should be indistinguishable.

- [ ] **Step 9: Sibling parity**

State: desktop — inherited (pure move) · iOS Capacitor — inherited · KO / ES / FR decks — inherited (`ReviewCard` is deck-agnostic; the `CardFront` ruby path only fires when `card.reading` exists, which is JA-only per Wave A).

---

### Task 5: `ReviewToolbar` + `ReviewDetailsSheet` — secondary content leaves the flow on mobile

**Files:**
- Create: `src/features/flashcards/components/ReviewSettingsPanel.tsx`
- Create: `src/features/flashcards/components/ReviewToolbar.tsx`
- Create: `src/features/flashcards/components/ReviewDetailsSheet.tsx`
- Modify: `src/features/flashcards/components/FlashcardDetailSidebar.tsx:93-169` (export the body)
- Modify: `src/features/flashcards/FlashcardTester.tsx` — replace the toolbar/settings block (661-801) and the progress row (803-823) with `<ReviewToolbar …>`; mount `<ReviewDetailsSheet …>`; gate the stats strip (988-1035) and the undo row (1038-1052) on `!isMobile`
- Test: `src/features/flashcards/FlashcardTester.test.tsx` (append two cases)

**Interfaces:**
- Produces:
  ```ts
  // components/FlashcardDetailSidebar.tsx — same file, new named export
  export function FlashcardDetailBody(props: {
    card: Flashcard;
    particles: ParticleDef[] | null;
  }): JSX.Element
  ```
  ```ts
  // components/ReviewSettingsPanel.tsx
  export function ReviewSettingsPanel(props: {
    highlightMode: boolean;
    onHighlightModeChange: (v: boolean) => void;
  }): JSX.Element
  ```
  ```ts
  // components/ReviewToolbar.tsx
  export function ReviewToolbar(props: {
    /** Below md: one slim row. Above: the historical two rows, in a fragment. */
    compact: boolean;
    hubPath: string;
    progressPct: number;
    againQueued: number;
    canUndo: boolean;
    onUndo: () => void;
    onOpenInfo: () => void;
    /** Compact: opens the sheet. Otherwise: toggles the popover. */
    onOpenSettings: () => void;
    settingsOpen: boolean;
    /** Desktop only — popover body rendered inside the control row. */
    settingsPopover?: ReactNode;
    /** Compact only — enabled once the revealed card has extras to show. */
    onOpenDetails?: () => void;
    detailsEnabled: boolean;
  }): JSX.Element
  ```
  ```ts
  // components/ReviewDetailsSheet.tsx
  export function ReviewDetailsSheet(props: {
    open: boolean;
    onClose: () => void;
    /** Which section to scroll to on open. */
    initialSection: "details" | "session";
    card: Flashcard;
    particles: ParticleDef[] | null;
    stats: {
      reviewed: number;
      newRemaining: number;
      dueRemaining: number;
      dueBreakdown: { recognition: number; production: number };
      againQueued: number;
      extraCount?: number;
    };
    settings: ReactNode;
  }): JSX.Element
  ```
- Consumes: `Sheet` with `side="auto"` (Task 3); `hasSidebarContent` (already exported, `FlashcardDetailSidebar.tsx:23`); `useViewport` from `@/shared/hooks/useViewport`.
- **Spec reading:** the spec says the details sheet is "opened by a 'Details' affordance on the revealed face". The revealed face is itself a `<button>` (the flip target), and a button inside a button is invalid HTML that browsers reparent. The affordance therefore lives in `ReviewToolbar`, which is also where the deliverable list puts it ("details/settings icons"). It is disabled until the card is revealed AND `hasSidebarContent(card)` is true, so it never opens an empty sheet.

- [ ] **Step 1: Write the failing tests**

Append to `src/features/flashcards/FlashcardTester.test.tsx`:

```tsx
  it("mobile moves card details into a sheet opened from the toolbar", async () => {
    mockViewport.isMobile = true;
    renderTester();
    // Not in flow before reveal, and the affordance is inert.
    expect(screen.queryByText(/second half of many surnames/i)).not.toBeInTheDocument();
    const details = screen.getByRole("button", { name: /card details/i });
    expect(details).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    expect(details).toBeEnabled();
    // Still not in flow — the phone screen shows card + grades and nothing else.
    expect(screen.queryByText(/second half of many surnames/i)).not.toBeInTheDocument();

    fireEvent.click(details);
    const sheet = await screen.findByRole("dialog");
    expect(sheet.className).toContain("bottom-0");
    expect(
      within(sheet).getByText(/second half of many surnames/i),
    ).toBeInTheDocument();
    // Session stats and the review settings ride in the same sheet on mobile.
    expect(within(sheet).getByText(/grading buttons/i)).toBeInTheDocument();
  });

  it("desktop keeps the detail panel in flow and the settings popover", () => {
    mockViewport.isMobile = false;
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    expect(screen.getAllByText(/second half of many surnames/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /review settings/i }));
    // The popover is a `role="dialog"` anchored in the toolbar, not a sheet.
    const popover = screen.getByRole("dialog", { name: /review settings/i });
    expect(popover.className).toContain("absolute");
  });
```

Add `within` to the Testing Library import at the top of the file:
```tsx
import { render, screen, fireEvent, within } from "@testing-library/react";
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx vitest run src/features/flashcards/FlashcardTester.test.tsx
```
Expected: FAIL — no button named "Card details"; on mobile the note renders in flow.

- [ ] **Step 3: Export the detail body**

In `src/features/flashcards/components/FlashcardDetailSidebar.tsx`, change the declaration at line 93 from `function DetailBody({` to:

```tsx
/**
 * The detail body itself (segment breakdown / note / definition / context /
 * reasoning / examples). Shared by every layout variant — and, since Wave B,
 * by the mobile bottom sheet, which needs the body WITHOUT the `<aside>` and
 * card chrome the layout variants wrap it in.
 */
export function FlashcardDetailBody({
```

then update its three internal call sites (`layout === "overlay"` branch line 215, and the shared return line 230) from `<DetailBody …/>` to `<FlashcardDetailBody …/>`. No other change to this file: `hasSidebarContent`, the three layout variants and their tests are untouched.

- [ ] **Step 4: Create `ReviewSettingsPanel`**

Move the four controls out of the popover verbatim so the popover and the sheet cannot drift:

```tsx
// src/features/flashcards/components/ReviewSettingsPanel.tsx
import { useTranslation } from "react-i18next";
import { useSettings } from "@/shared/contexts/SettingsContext";

/**
 * The review-settings controls. ONE copy, two hosts: the desktop popover
 * anchored in `ReviewToolbar`, and the mobile bottom sheet
 * (`ReviewDetailsSheet`). Extracted so the two cannot drift — a setting added
 * to one and not the other is exactly the kind of thing nobody notices for a
 * quarter.
 *
 * `highlightMode` is session-local (it lives in `FlashcardTester` state, not in
 * persisted settings) so it comes in as a prop; everything else writes straight
 * through `updateFlashcards`.
 */
type Props = {
  highlightMode: boolean;
  onHighlightModeChange: (value: boolean) => void;
};

export function ReviewSettingsPanel({
  highlightMode,
  onHighlightModeChange,
}: Props) {
  const { t } = useTranslation();
  const { settings, updateFlashcards } = useSettings();
  const gradingLayout = settings.flashcards?.gradingLayout ?? "simple";
  const showIntervalPreviews = settings.flashcards?.showIntervalPreviews ?? false;

  return (
    <div className="space-y-3">
      <label className="flex min-h-[44px] items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={highlightMode}
          onChange={(e) => onHighlightModeChange(e.target.checked)}
          className="rounded border-border accent-accent"
        />
        Highlight particles
      </label>
      <div>
        <label
          className="mb-1 block text-xs font-medium text-text-muted"
          htmlFor="fc-grading-layout"
        >
          {t("flashcards.gradingLayoutLabel", "Grading buttons")}
        </label>
        <select
          id="fc-grading-layout"
          value={gradingLayout}
          onChange={(e) =>
            updateFlashcards({ gradingLayout: e.target.value as "simple" | "full" })
          }
          className="min-h-[44px] w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="simple">
            {t("flashcards.gradingLayoutSimple", "Simple (2)")}
          </option>
          <option value="full">
            {t("flashcards.gradingLayoutFull", "Full (4)")}
          </option>
        </select>
      </div>
      <label className="flex min-h-[44px] items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={showIntervalPreviews}
          onChange={(e) =>
            updateFlashcards({ showIntervalPreviews: e.target.checked })
          }
          className="rounded border-border accent-accent"
        />
        {t("flashcards.showIntervalPreviews", "Show scheduling intervals")}
      </label>
      <div>
        <label
          className="mb-1 block text-xs font-medium text-text-muted"
          htmlFor="fc-max-new"
        >
          {t("flashcards.maxNewPerDayLabel", "New cards per session")}
        </label>
        <select
          id="fc-max-new"
          value={String(settings.flashcards?.maxNewCardsPerDay ?? "")}
          onChange={(e) =>
            updateFlashcards({
              maxNewCardsPerDay:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="min-h-[44px] w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="">
            {t("flashcards.maxNewPerDayAll", "All unlocked (default)")}
          </option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="0">
            {t("flashcards.maxNewPerDayNone", "None — reviews only")}
          </option>
        </select>
        <p className="mt-1 text-[11px] leading-snug text-text-muted">
          {t(
            "flashcards.maxNewPerDayHelp",
            "Caps how many never-studied words each session introduces. Lessons stay the natural pace — set a cap if your queue feels too long.",
          )}
        </p>
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={settings.flashcards?.frequencyVocab ?? false}
            onChange={(e) => updateFlashcards({ frequencyVocab: e.target.checked })}
            className="mt-0.5 rounded border-border accent-accent"
          />
          <span>
            {t(
              "flashcards.frequencyVocabLabel",
              "Frequency vocabulary (optional words)",
            )}
          </span>
        </label>
        <p className="mt-1 text-[11px] leading-snug text-text-muted">
          {t(
            "flashcards.frequencyVocabHelp",
            "Unlock common words beyond your lessons as you reach each module — reviewed alongside your cards.",
          )}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `ReviewToolbar`**

```tsx
// src/features/flashcards/components/ReviewToolbar.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

/**
 * The session's control row.
 *
 * `compact={false}` (md and up) renders a FRAGMENT of the two rows the reviewer
 * has always had — the back link + icon cluster + anchored settings popover,
 * then the progress bar — so they stay direct children of the column and its
 * `space-y-4` keeps spacing them exactly as before. Desktop DOM is unchanged.
 *
 * `compact` (below md) collapses both into one slim row, because below `md` the
 * app header, breadcrumbs and bottom tab bar are gone (Decision 2, Spencer
 * 2026-09-02) and this row is the ONLY chrome: exit, progress, the two sheet
 * affordances, and the undo chip when there is something to undo.
 */
type Props = {
  compact: boolean;
  hubPath: string;
  progressPct: number;
  againQueued: number;
  canUndo: boolean;
  onUndo: () => void;
  onOpenInfo: () => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
  settingsPopover?: ReactNode;
  onOpenDetails?: () => void;
  detailsEnabled: boolean;
};

export function ReviewToolbar({
  compact,
  hubPath,
  progressPct,
  againQueued,
  canUndo,
  onUndo,
  onOpenInfo,
  onOpenSettings,
  settingsOpen,
  settingsPopover,
  onOpenDetails,
  detailsEnabled,
}: Props) {
  const { t } = useTranslation();

  const progressBar = (
    <div
      className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progressPct}
      aria-label={t("flashcards.sessionProgress", "Session progress")}
    >
      <div
        className="h-full rounded-full bg-success transition-all duration-300"
        style={{ width: `${progressPct}%` }}
      />
    </div>
  );

  if (!compact) {
    return (
      <>
        <div className="relative flex items-center justify-between">
          <Link
            to={hubPath}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            {t("flashcards.backToHub")}
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenInfo}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("flashcards.info.openLabel", "How review works")}
            >
              <Icon name="info" size={20} />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("flashcards.reviewSettings", "Review settings")}
              aria-expanded={settingsOpen}
            >
              <Icon name="settings" size={20} />
            </button>
          </div>
          {settingsPopover}
        </div>
        <div className="flex items-center gap-2">
          {progressBar}
          {againQueued > 0 && (
            <span className="shrink-0 text-xs text-warning">
              +{againQueued} {t("flashcards.againCount")}
            </span>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to={hubPath}
        // 44px square, not the 24px WCAG floor: it is the exit, it sits in the
        // top-left thumb-hostile corner, and the app header that used to carry
        // the way out is hidden on this surface.
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={t("flashcards.backToHub")}
      >
        <Icon name="close" size={22} />
      </Link>
      {progressBar}
      {againQueued > 0 && (
        <span className="shrink-0 text-xs text-warning">+{againQueued}</span>
      )}
      {canUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          aria-label={t("flashcards.undo", "Undo last grade")}
        >
          <Icon name="rotateCcw" size={18} />
        </button>
      )}
      <button
        type="button"
        onClick={onOpenDetails}
        disabled={!detailsEnabled}
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
        aria-label={t("flashcards.detailsLabel", "Card details")}
      >
        <Icon name="list" size={20} />
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={t("flashcards.reviewSettings", "Review settings")}
      >
        <Icon name="settings" size={20} />
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Create `ReviewDetailsSheet`**

```tsx
// src/features/flashcards/components/ReviewDetailsSheet.tsx
import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/shared/components/ui/Sheet";
import {
  FlashcardDetailBody,
  hasSidebarContent,
} from "./FlashcardDetailSidebar";
import type { Flashcard } from "@/features/flashcards/data/types";
import type { ParticleDef } from "@/features/practice/data/types";

/**
 * Everything the phone screen used to stack below the card, in one bottom
 * sheet: the card's detail body, the session counts, and the review settings.
 *
 * One sheet, not three: on a phone each of these is a two-tap detour and three
 * separate overlays would be three separate close gestures. Both toolbar
 * affordances open this, and `initialSection` decides which heading is scrolled
 * to — details from the details icon, session from the gear.
 *
 * `side="auto"` (Task 3) means this same component is a right-hand drawer at
 * `md`+ if it is ever mounted there. Today it is not: above `md` the reviewer
 * keeps its in-flow detail panel, its stats strip and its anchored settings
 * popover, unchanged.
 */
type Props = {
  open: boolean;
  onClose: () => void;
  initialSection: "details" | "session";
  card: Flashcard;
  particles: ParticleDef[] | null;
  stats: {
    reviewed: number;
    newRemaining: number;
    dueRemaining: number;
    dueBreakdown: { recognition: number; production: number };
    againQueued: number;
    extraCount?: number;
  };
  settings: ReactNode;
};

export function ReviewDetailsSheet({
  open,
  onClose,
  initialSection,
  card,
  particles,
  stats,
  settings,
}: Props) {
  const { t } = useTranslation();
  const sessionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initialSection !== "session") return;
    sessionRef.current?.scrollIntoView({ block: "start" });
  }, [open, initialSection]);

  const showDetails = hasSidebarContent(card);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="auto"
      title={t("flashcards.detailsLabel", "Card details")}
    >
      <div className="space-y-5">
        {showDetails && (
          <section>
            <FlashcardDetailBody card={card} particles={particles} />
          </section>
        )}

        <section ref={sessionRef} className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("flashcards.sessionSectionLabel", "This session")}
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t("flashcards.reviewed")}</dt>
              <dd className="font-semibold text-text-primary">{stats.reviewed}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t("flashcards.newCount")}</dt>
              <dd className="font-semibold text-text-primary">
                {stats.newRemaining}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t("flashcards.dueCount")}</dt>
              <dd className="font-semibold text-text-primary">
                {stats.dueRemaining}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t("flashcards.againCount")}</dt>
              <dd className="font-semibold text-warning">{stats.againQueued}</dd>
            </div>
            {typeof stats.extraCount === "number" && stats.extraCount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">
                  {t("flashcards.extraCount", "Extra")}
                </dt>
                <dd className="font-semibold text-accent">{stats.extraCount}</dd>
              </div>
            )}
          </dl>
          {/* The desktop stats strip puts this split in a hover tooltip. There
              is no hover on a phone, so it becomes a line of text. */}
          <p className="mt-2 text-xs text-text-muted">
            {t("flashcards.dueBreakdownRecognition", "{{count}} due for recognition", {
              count: stats.dueBreakdown.recognition,
            })}
            {" · "}
            {t("flashcards.dueBreakdownProduction", "{{count}} due for production", {
              count: stats.dueBreakdown.production,
            })}
          </p>
        </section>

        <section className="border-t border-border pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("flashcards.reviewSettings", "Review settings")}
          </h3>
          {settings}
        </section>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 7: Rewire `FlashcardTester.tsx`**

Add near the other hooks (after `const { language } = useLanguage();`):

```tsx
  // Below `md` the session is a focused, fitted surface: secondary content
  // (details, stats, settings) moves into one bottom sheet instead of stacking
  // under the card. Above `md` nothing changes.
  const { isMobile } = useViewport();
  const [sheet, setSheet] = useState<null | "details" | "session">(null);
```

with `import { useViewport } from "@/shared/hooks/useViewport";` and the three new component imports.

Replace lines 661-823 (the control row + popover + progress row) with:

```tsx
        <ReviewToolbar
          compact={isMobile}
          hubPath={langPath("practice/flashcards")}
          progressPct={progressPct}
          againQueued={againQueued}
          canUndo={lastGrade !== null}
          onUndo={handleUndo}
          onOpenInfo={() => setInfoOpen(true)}
          onOpenSettings={() =>
            isMobile ? setSheet("session") : setSettingsOpen((o) => !o)
          }
          settingsOpen={settingsOpen}
          onOpenDetails={() => setSheet("details")}
          detailsEnabled={flipped && hasSidebarContent(currentCard)}
          settingsPopover={
            settingsOpen ? (
              <>
                <div
                  className="fixed inset-0 z-10 bg-transparent"
                  aria-hidden
                  onClick={() => setSettingsOpen(false)}
                />
                <div
                  className="absolute right-0 top-full z-20 mt-1 w-64 shrink-0 rounded-lg border border-border bg-surface p-4 shadow-popover"
                  role="dialog"
                  aria-label={t("flashcards.reviewSettings", "Review settings")}
                >
                  <ReviewSettingsPanel
                    highlightMode={highlightMode}
                    onHighlightModeChange={setHighlightMode}
                  />
                </div>
              </>
            ) : undefined
          }
        />
```

Gate the stats strip (was 988-1035) and the undo row (was 1038-1052) with `{!isMobile && (` … `)}` — on mobile the counts live in the sheet and undo lives in the toolbar. Then, next to `<FlashcardsOnboardingGate enabled />`, mount:

```tsx
      {isMobile && (
        <ReviewDetailsSheet
          open={sheet !== null}
          onClose={() => setSheet(null)}
          initialSection={sheet ?? "details"}
          card={currentCard}
          particles={particles}
          stats={{
            reviewed: sessionStats.reviewed,
            newRemaining: liveCounts.newRemaining,
            dueRemaining: liveCounts.dueRemaining,
            dueBreakdown: liveCounts.dueBreakdown,
            againQueued,
            extraCount: freeReview ? queue.extraCount : undefined,
          }}
          settings={
            <ReviewSettingsPanel
              highlightMode={highlightMode}
              onHighlightModeChange={setHighlightMode}
            />
          }
        />
      )}
```

Also gate the two `FlashcardDetailSidebar` renders on `!isMobile` — their content now lives in the sheet, and the `lg:`-only overlay would otherwise be dead weight in the mobile tree. `import { hasSidebarContent } from "./components/FlashcardDetailSidebar";` alongside the existing import.

- [ ] **Step 8: Run to verify it passes**

```bash
npx vitest run src/features/flashcards && npx tsc -b
```
Expected: 7 PASS in `FlashcardTester.test.tsx` (5 from Task 4 + 2 new), `FlashcardDetailSidebar.test.tsx` still 7 PASS, no type errors.

- [ ] **Step 9: Sibling parity**

State: desktop — inherited (`compact={false}` reproduces the two rows; the popover moved into a slot but its markup and anchoring are unchanged) · iOS Capacitor — ported (the sheet's `pb-safe` is the on-device change; verify in Task 8) · KO / ES / FR decks — inherited (`FlashcardDetailBody` is deck-agnostic; KO/ES/FR cards mostly have no extras, so `detailsEnabled` stays false and the icon stays disabled — verify one KO card in Task 8).

---

### Task 6: Focused chrome below `md` for `/practice/flashcards/review`

**Files:**
- Create: `src/routes/focusedFlow.ts`
- Create: `src/routes/focusedFlow.test.ts`
- Modify: `src/routes/Layout.tsx:45-79` (add the hook + swap the regex)
- Modify: `src/features/practice/PracticeLayout.tsx:56-80` (`isFocusedSession`)
- Create: `tests/mobile/review-chrome.mobile.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  // @/routes/focusedFlow
  export const FOCUSED_FLOW_PATTERN: RegExp;
  export const MOBILE_FOCUSED_FLOW_PATTERN: RegExp;
  export function isFocusedFlow(pathname: string, isMobile: boolean): boolean;
  ```
- Consumed by `routes/Layout.tsx` (header, `DailyWelcomeAd`, `<main>` padding, `CollapsibleAdBanner`, `BottomTabBar`, `ToastContainer` offset) and `features/practice/PracticeLayout.tsx` (breadcrumbs).
- Extracted as a pure function specifically so it is unit-testable: `Layout` needs Auth0, TanStack Query, i18n, feature flags and a router to render, and none of that is worth booting to assert a boolean.

- [ ] **Step 1: Write the failing test**

```ts
// src/routes/focusedFlow.test.ts
/**
 * Which routes drop the app chrome, and at which widths.
 *
 * Decision 2 (Spencer, 2026-09-02): the flashcard review session hides the
 * header, breadcrumbs and bottom tab bar like a lesson does — but ONLY below
 * `md`. Desktop keeps its chrome, because on desktop the chrome costs nothing
 * and the sidebar is how you leave. That makes this the app's first
 * VIEWPORT-DEPENDENT focused flow, which is exactly why it is a tested pure
 * function and not a regex inlined into two components.
 */
import { describe, it, expect } from "vitest";
import { isFocusedFlow } from "./focusedFlow";

describe("isFocusedFlow", () => {
  it("treats lessons, test-out, placement and grammar review as focused at every width", () => {
    for (const isMobile of [true, false]) {
      expect(isFocusedFlow("/ja/learn/lessons/ja-m4-neo-1", isMobile)).toBe(true);
      expect(isFocusedFlow("/ja/learn/test-out/m11", isMobile)).toBe(true);
      expect(isFocusedFlow("/ja/learn/placement-test", isMobile)).toBe(true);
      expect(isFocusedFlow("/ja/practice/grammar/review", isMobile)).toBe(true);
    }
  });

  it("focuses the flashcard review session on mobile only", () => {
    expect(isFocusedFlow("/ja/practice/flashcards/review", true)).toBe(true);
    expect(isFocusedFlow("/ja/practice/flashcards/review", false)).toBe(false);
    // Trailing slash is the same route.
    expect(isFocusedFlow("/ko/practice/flashcards/review/", true)).toBe(true);
  });

  it("does not focus the reviewer's neighbours", () => {
    for (const isMobile of [true, false]) {
      expect(isFocusedFlow("/ja/practice/flashcards", isMobile)).toBe(false);
      expect(isFocusedFlow("/ja/practice/flashcards/cards", isMobile)).toBe(false);
      expect(isFocusedFlow("/ja/practice/flashcards/decks", isMobile)).toBe(false);
      expect(isFocusedFlow("/home", isMobile)).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/routes/focusedFlow.test.ts
```
Expected: FAIL — cannot resolve `./focusedFlow`.

- [ ] **Step 3: Create the predicate**

```ts
// src/routes/focusedFlow.ts
/**
 * "Focused flow" = a surface that owns the whole screen: no app header, no
 * breadcrumbs, no bottom tab bar, no ads, and tightened `<main>` padding. The
 * session's own chrome (an exit control and a progress bar) is the only chrome,
 * so the learner's attention and the vertical budget both go to the exercise.
 *
 * Two patterns, because focus is not purely a property of the route:
 *
 * - `FOCUSED_FLOW_PATTERN` — always focused, at every width. Lessons,
 *   per-module test-out, the placement test, the grammar review session.
 * - `MOBILE_FOCUSED_FLOW_PATTERN` — focused only below `md`. Today that is the
 *   flashcard review session (Decision 2, Spencer 2026-09-02): on a phone the
 *   reviewer stacked header → breadcrumbs → its own toolbar → progress →
 *   modality chip → 360px card → grade row → detail panel → stats → undo
 *   inside a 667px viewport and forced a scroll. On desktop that chrome is
 *   free, and the sidebar is how you leave, so it stays.
 *
 * `isMobile` is `useViewport().isMobile` — true below `md` (768px), the app's
 * one documented mobile/desktop seam (`shared/hooks/breakpoints.ts`).
 */
export const FOCUSED_FLOW_PATTERN =
  /\/lessons\/|\/test-out\/|\/placement-test|\/practice\/grammar\/review/;

export const MOBILE_FOCUSED_FLOW_PATTERN = /\/practice\/flashcards\/review\/?$/;

export function isFocusedFlow(pathname: string, isMobile: boolean): boolean {
  if (FOCUSED_FLOW_PATTERN.test(pathname)) return true;
  return isMobile && MOBILE_FOCUSED_FLOW_PATTERN.test(pathname);
}
```

- [ ] **Step 4: Use it in `Layout.tsx`**

Add to the imports:

```tsx
import { useViewport } from "@/shared/hooks/useViewport";
import { isFocusedFlow } from "@/routes/focusedFlow";
```

Replace lines 74-79 (the `focusedFlow` comment + const) with:

```tsx
  // Focused flows (inside a lesson / test / review session) drop the marketing
  // footer, the header and the bottom tab bar, and tighten main padding — on
  // short laptop viewports (MacBook 14" ≈ 840px usable) the footer alone pushed
  // every lesson step below the fold. The flashcard reviewer joins them BELOW
  // `md` only; see `@/routes/focusedFlow`.
  const { isMobile } = useViewport();
  const focusedFlow = isFocusedFlow(pathname, isMobile);
```

Nothing else in `Layout.tsx` changes: the header (`:150-155`), `DailyWelcomeAd` (`:417`), `<main>` padding (`:421-439`), `CollapsibleAdBanner` (`:447`), `BottomTabBar` (`:455`) and `ToastContainer` (`:468`) already read `focusedFlow`.

- [ ] **Step 5: Use it in `PracticeLayout.tsx`**

Add the imports:

```tsx
import { useViewport } from "@/shared/hooks/useViewport";
import { isFocusedFlow } from "@/routes/focusedFlow";
```

Add `const { isMobile } = useViewport();` beside the other hooks, then replace lines 61-64 (the `isFocusedSession` comment + const) with:

```tsx
  // Focused sessions get no breadcrumbs — `Layout` has already hidden the
  // header and tab bar for them, and a crumb trail would be the one stray piece
  // of app chrome the lesson player doesn't have. The session's own exit
  // control is the way out. Flashcard review qualifies below `md` only.
  const isFocusedSession = isFocusedFlow(norm, isMobile);
```

(`isFocusedFlow` also matches `/practice/grammar/review`, which is what the old regex tested, so this is a superset and not a behaviour change for that route. It additionally matches lesson/test paths, which never render under `PracticeLayout` — harmless.)

- [ ] **Step 6: Run to verify it passes**

```bash
npx vitest run src/routes src/features/practice && npx tsc -b
```
Expected: 3 PASS in `focusedFlow.test.ts`; `PracticeBreadcrumbs.test.tsx` unchanged; no type errors.

- [ ] **Step 7: Add the Playwright chrome gate**

```ts
// tests/mobile/review-chrome.mobile.spec.ts
/**
 * Mobile gate — the review session's chrome is viewport-dependent.
 *
 * Decision 2 (Spencer, 2026-09-02): below `md` the flashcard review session
 * hides the app header, the practice breadcrumbs and the bottom tab bar;
 * at `md` and above it keeps all three. That "and above" half is the one this
 * spec exists for — a focused-flow regex is trivially easy to widen by accident
 * and nothing else in the suite would notice desktop losing its header.
 */
import { test, expect } from "@playwright/test";
import { gotoSeeded } from "./_seed";
import { VIEWPORTS } from "./routes.mjs";

const ROUTE = {
  path: "/ja/practice/flashcards/review",
  auth: true,
  lang: "ja",
} as const;

const PHONE = VIEWPORTS.find((v) => v.name === "iphone-se")!;
const TABLET = VIEWPORTS.find((v) => v.name === "tablet-portrait")!;

test("hides header, breadcrumbs and tab bar below md", async ({ page }) => {
  await gotoSeeded(page, ROUTE, PHONE);
  await expect(page.locator("header").first()).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toHaveCount(0);
  // The session must still offer a way out.
  await expect(
    page.getByRole("link", { name: /back to flashcards/i }),
  ).toBeVisible();
});

test("keeps the app chrome at md and above", async ({ page }) => {
  // tablet-portrait is 768px — exactly `md`, so `isMobile` is false here.
  await gotoSeeded(page, ROUTE, TABLET);
  await expect(page.locator("header").first()).toBeVisible();
});
```

If `getByRole("navigation", { name: /breadcrumb/i })` finds nothing even on a non-focused route, read the `<nav>` label in `src/features/practice/PracticeBreadcrumbs.tsx` and use the real one — do not delete the assertion.

- [ ] **Step 8: Run it**

```bash
npx playwright test --project=mobile tests/mobile/review-chrome.mobile.spec.ts
```
Expected: 2 PASS. Then the full flashcards slice for regressions:
```bash
npx playwright test --project=mobile --grep "flashcards"
```
Expected: `tap-targets`, `overflow`, `safe-area` and `render-errors` green on the review route. `stage-fit` still skips it ("not a lesson stage surface") — Task 7 turns that on.

- [ ] **Step 9: Sibling parity**

State: desktop — N/A by construction (`isMobile` is false at ≥768px; the tablet assertion proves it) · iOS Capacitor — inherited, and this is where the win lands (the tab bar's 56px + safe-area came back to the stage) · KO / ES / FR — inherited (the pattern is language-prefix agnostic; the KO assertion in the unit test covers it).

---

### Task 7: Mount the fitted stage below `md`

**Files:**
- Modify: `src/features/flashcards/FlashcardTester.tsx` — wrap the session in `ReviewShell`, pass `fitted={isMobile}` down to `ReviewCard` and `SessionSummary`
- Test: `src/features/flashcards/FlashcardTester.test.tsx` (append one case)

**Interfaces:** consumes `ReviewShell` (Task 2), `ReviewToolbar` (Task 5) and `useViewport` — nothing new is produced.

- [ ] **Step 1: Write the failing test**

Append to `src/features/flashcards/FlashcardTester.test.tsx`:

```tsx
  it("mounts the fitted stage on mobile and the flow column on desktop", () => {
    mockViewport.isMobile = true;
    const { container, unmount } = renderTester();
    const stage = container.querySelector("[data-lesson-stage]");
    expect(stage, "mobile must expose the stage-fit gate hook").not.toBeNull();
    // The card fills the stage rather than reserving a fixed 360px block.
    const card = screen.getByText("やま").closest("button")!;
    expect(card.className).toContain("flex-1");
    expect(card.className).not.toContain("min-h-[360px]");
    unmount();

    mockViewport.isMobile = false;
    const desktop = renderTester();
    expect(desktop.container.querySelector("[data-lesson-stage]")).toBeNull();
    expect(
      screen.getByText("やま").closest("button")!.className,
    ).toContain("min-h-[360px]");
  });
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/features/flashcards/FlashcardTester.test.tsx -t "fitted stage"
```
Expected: FAIL — no `[data-lesson-stage]` on mobile; the card still carries `min-h-[360px]`.

- [ ] **Step 3: Wrap the session in `ReviewShell`**

Replace the outer `return (` block's opening — the `<div className="flex min-h-0 flex-1 justify-center">` at line 658 and its inner `<div className="relative flex min-w-0 max-w-md flex-1 flex-col space-y-4">` at 660 — with `ReviewShell`, moving `<ReviewToolbar …/>` into its `toolbar` prop:

```tsx
  return (
    <>
      <ReviewShell
        fitted={isMobile}
        stageLabel={t("flashcards.stageLabel", "Review card")}
        toolbar={
          <ReviewToolbar
            compact={isMobile}
            /* …the props from Task 5, unchanged… */
          />
        }
      >
        {/* modality chip · card · grade row · (desktop only) detail panels,
            stats strip, undo row — all as they are today */}
      </ReviewShell>

      {/* First-time onboarding (auto, once per versioned flag). */}
      <FlashcardsOnboardingGate enabled />

      {/* On-demand reference, opened by the info icon. */}
      {infoOpen && (
        <FlashcardsInfoModal
          mode="reference"
          onClose={() => setInfoOpen(false)}
          onResetOnboarding={handleResetOnboarding}
        />
      )}

      {isMobile && (
        <ReviewDetailsSheet /* …the props from Task 5, unchanged… */ />
      )}
    </>
  );
```

(Replace the comment placeholders with the actual children and props already written in Tasks 4 and 5 — this step MOVES them, it does not rewrite them. The onboarding gate, info modal and details sheet move OUT of the column so they are not stage children; they are portals and overlays, and a `data-lesson-stage` child that is `position: fixed` would be measured by the fit gate as stage content.)

- [ ] **Step 4: Let the card and the summary fill the stage**

Change the two hardcoded `fitted={false}` props added in Task 4:

```tsx
        <ReviewCard … fitted={isMobile} />
```
```tsx
        <SessionSummary … fitted={isMobile} />
```

And move the session-done early return (Task 4, Step 6) INSIDE the shell so the summary fits the stage instead of replacing it — the branch becomes a child, not a `return`:

```tsx
        {isSessionDone ? (
          <SessionSummary
            reviewed={sessionStats.reviewed}
            correct={sessionStats.correct}
            canReviewMore={queue.dueCount > 0 || queue.newCount > 0}
            canFreeReview={(queue.notYetDueCount ?? 0) > 0}
            freeReview={freeReview}
            onRestart={handleRestart}
            onStartFreeReview={handleStartFreeReview}
            hubPath={langPath("practice/flashcards")}
            fitted={isMobile}
          />
        ) : (
          <>
            {/* modality chip, ReviewCard, GradeRow, desktop-only panels */}
          </>
        )}
```

This means `currentCard` is no longer guaranteed by an early return. Guard the non-summary branch on `card` and keep `const currentCard = card!;` inside it, or hoist `if (!card) …` — either way `tsc -b` must be clean with no new non-null assertions beyond the existing one.

- [ ] **Step 5: Keep the modality chip out of the way**

The chip row (`FlashcardTester.tsx`, the `flex items-center justify-center` block that was lines 825-835) stays a stage child but must not grow: add `shrink-0` to its wrapper div. On desktop `shrink-0` is inert — the column has no flexible sibling competing for space.

- [ ] **Step 6: Run to verify it passes**

```bash
npx vitest run src/features/flashcards && npx tsc -b
```
Expected: 8 PASS in `FlashcardTester.test.tsx`, everything else green.

- [ ] **Step 7: The stage-fit gate now covers the route**

```bash
npx playwright test --project=mobile --grep "stage fit"
```
Expected: `flashcards-review stage does not scroll vertically` now RUNS (no longer skipped) and PASSES at `iphone-se`, `pixel-7` and `iphone-14-promax`; it still skips at `tablet-portrait` (768px is `md`, so the desktop tree renders and there is no stage) and at `android-small` (`legacy`).

If it fails, the message prints `scrollHeight` vs `clientHeight` for the stage scroller. Fix in this order, and re-measure between each — do not stack guesses:
1. The chip row is not `shrink-0` (Step 5).
2. The grade row is not `shrink-0` (`GradeRow`'s wrapper, Task 4).
3. `ReviewCard` is missing `min-h-0` on its fitted branch, so its content floor is propping the column open.
4. Only then consider trimming `ReviewCard`'s fitted `py-6` to `py-4`. Do NOT reach for `dvh` arithmetic inside stage content, and do not remove `--stage-tail` — that dead zone is a product requirement (Spencer 2026-08-07, "bottom 10% maybe 15% as dead space at least").

- [ ] **Step 8: Screenshot both widths**

```bash
node scripts/capture-flashcards.mjs /private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/20d27d40-49a5-46eb-966d-4c1c77fa09f2/scratchpad/fc-t7-se 375 667
node scripts/capture-flashcards.mjs /private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/20d27d40-49a5-46eb-966d-4c1c77fa09f2/scratchpad/fc-t7-max 430 932
node scripts/capture-flashcards.mjs /private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/20d27d40-49a5-46eb-966d-4c1c77fa09f2/scratchpad/fc-t7-desktop 1280 720
```
`fc-front--mobile.png` at both phone sizes must show: slim toolbar row, modality chip, card, grade row — and nothing below the grade row. `fc-front--desktop.png` must be indistinguishable from the Task 4 desktop capture.

- [ ] **Step 9: Sibling parity**

State: desktop — inherited, unchanged (`fitted={false}` path, proven by the Step 6 test and the Step 8 capture) · iOS Capacitor — ported (the fitted shell's `pt-safe`/`pb-safe` are what keep the toolbar out of the Dynamic Island and the grade row off the home indicator) · KO / ES / FR decks — inherited (shell is content-agnostic; spot-check `/ko/practice/flashcards/review` in Task 8).

---

### Task 8: Wave verification

**Files:** none new.

- [ ] **Step 1: Preflight**

```bash
npm run preflight
```
Expected: `tsc -b` clean, all vitest projects green, `CI=true vite build` succeeds with no over-cap precache warning. Record the total test count.

- [ ] **Step 2: The mobile gate on the touched slice**

Kill anything on 5273/5274 first, then:
```bash
npx playwright test --project=mobile --grep "flashcards"
```
Expected: green, including `stage fit` on `/ja/practice/flashcards/review` at `iphone-se` and `iphone-14-promax`, plus the two `review-chrome` cases. Record the pass count and compare it to the pre-wave number — it must be HIGHER (stage-fit was skipping this route before).

- [ ] **Step 3: The window must not scroll, measured**

With the mobile dev server up (`VITE_E2E=true VITE_DEV_AUTH_BYPASS=true npm run dev -- --port 5273 --strictPort`):

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5273 \
  node scripts/ux-loop/measure.mjs /ja/practice/flashcards/review iphone-se
PLAYWRIGHT_BASE_URL=http://localhost:5273 \
  node scripts/ux-loop/measure.mjs /ja/practice/flashcards/review iphone-14-promax
```
Expected in both JSON payloads: `pageScrollHeight - pageClientHeight <= 2`, `horizontalOverflow: false`, and `smallTapTargets: []`. The ≤2px slack is the same sub-pixel tolerance `stage-fit.mobile.spec.ts` uses (fractional layout from ruby text and odd-DPR borders). Anything larger is a real scroll — go back to Task 7 Step 7's fix ladder.

- [ ] **Step 4: Sibling deck spot-check**

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5273 \
  node scripts/ux-loop/measure.mjs /ko/practice/flashcards/review iphone-se
```
Expected: same three conditions. KO cards carry no `reading` and usually no detail extras, so this is the "details icon disabled, sheet never opens empty" path.

- [ ] **Step 5: Desktop parity, measured not eyeballed**

```bash
node scripts/capture-flashcards.mjs /private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/20d27d40-49a5-46eb-966d-4c1c77fa09f2/scratchpad/fc-final-desktop 1280 720
```
Compare `fc-front--desktop.png` / `fc-back--desktop.png` against the Task 4 Step 8 captures. Any difference is a bug in this wave, not a decision — report it rather than accepting it.

- [ ] **Step 6: Manual pass on the Trap Phone**

Rebuild the iOS wrapper and check, in order: the toolbar clears the Dynamic Island; the grade row clears the home indicator; the details sheet opens from the bottom, is dismissible by backdrop and by Escape/back, and its last control is not under the home indicator; the session shows two grade buttons on a fresh account; switching the setting to "Full (4)" gives a 2×2 grid whose buttons measure ≥48px tall; nothing scrolls at rest.

- [ ] **Step 7: Report**

Report to Spencer: the preflight result, the mobile-gate pass count (before → after), the four `measure.mjs` JSON deltas, the phone/desktop screenshots, the per-task sibling-parity lines, and the two spec readings this plan resolved (the details affordance living in the toolbar rather than on the card face; the summary rendering inside the stage rather than replacing it). Then stop — Spencer commits on the `wave-b-review-shell` branch and rebuilds the phone.
