# Wave A: touch interaction + JA furigana on cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop touch devices from text-selecting the app, stop hover styles sticking after a tap, and render JA flashcard and vocab surfaces with ruby furigana instead of the `漢字 (かな)` string.

**Architecture:** One touch-scoped CSS block in the global stylesheet plus one Tailwind future flag handles interaction. For furigana, the JA atom-to-flashcard converter stops baking parens and instead carries a `reading` object; a new `CardFront` component renders the existing `KanjiRuby` when a reading is present, gated on FSRS mastery of the card, and every plain-text front call site uses it. The vocab library gets the same treatment through the same component.

**Tech Stack:** Vite 6, React 19, TypeScript strict, Tailwind 3, Vitest + Testing Library (happy-dom), Playwright mobile gate (`tests/mobile/`).

**Spec:** `docs/superpowers/specs/2026-09-02-flashcards-mobile-overhaul-design.md` (sections A and B).

## Global Constraints

- Desktop users keep normal text selection: every selection rule lives under `@media (pointer: coarse)`.
- Pixel floors in `px`, never `rem` (`--font-base` drops to 15px on short laptops).
- Stage explicit paths only; never `git add -A`. Do not commit; Spencer commits after his walk. Another session may be editing the tree.
- Never touch `~/.claude/**` or `.env*`. No MUI, no ESLint/Prettier configs.
- Sibling parity: after each content-touching task, state JA / KO / ES / FR / iOS build as inherited, ported, or N/A.
- `npm run preflight` (`tsc -b && vitest run && CI=true vite build`) must be green before reporting the wave done.

---

### Task 1: Touch-scoped selection kill + hover gating

**Files:**
- Modify: `src/index.css:54-69` (the "Native-app feel on mobile web" block)
- Modify: `tailwind.config.js:6-8` (top-level config object)
- Modify: `src/features/social/sections/InviteFriendsCard.tsx:141`
- Test: `tests/mobile/touch-select.mobile.spec.ts` (create)

**Interfaces:**
- Consumes: `activeViewports`, `activeRoutes`, `routeSlug` from `tests/mobile/_matrix`; `gotoSeeded` from `tests/mobile/_seed`.
- Produces: the utility class `select-text` as the one sanctioned carve-out for copyable text on touch.

- [ ] **Step 1: Write the failing Playwright test**

```ts
// tests/mobile/touch-select.mobile.spec.ts
/**
 * Mobile gate — touch devices must not text-select the app.
 *
 * THE BUG (Spencer, 2026-09-02): a long-press or drag on the phone selected
 * every word on screen. `src/index.css` suppressed tap-highlight and
 * overscroll but never `user-select` / `-webkit-touch-callout`. Desktop keeps
 * selection, so the rule is scoped to `(pointer: coarse)` and this spec
 * asserts BOTH directions: none when coarse, auto otherwise. Inputs keep
 * `text` so typed-answer steps still show a caret.
 */
import { test, expect } from "@playwright/test";
import { activeViewports } from "./_matrix";
import { gotoSeeded } from "./_seed";

const ROUTE = { path: "/ja/practice/flashcards/review", auth: true, lang: "ja" } as const;

for (const vp of activeViewports()) {
  test(`selection is off only for coarse pointers @ ${vp.name}`, async ({ page }) => {
    await gotoSeeded(page, ROUTE, vp);
    const probe = await page.evaluate(() => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const body = getComputedStyle(document.body);
      const input = document.createElement("input");
      document.body.appendChild(input);
      const inputSelect = getComputedStyle(input).userSelect;
      input.remove();
      return {
        coarse,
        bodySelect: body.userSelect,
        callout: body.getPropertyValue("-webkit-touch-callout"),
        inputSelect,
      };
    });
    if (probe.coarse) {
      expect(probe.bodySelect, "coarse pointer must not select body text").toBe("none");
      expect(probe.callout).toBe("none");
      expect(probe.inputSelect, "inputs stay selectable on touch").toBe("text");
    } else {
      expect(probe.bodySelect, "fine pointer keeps selection").not.toBe("none");
    }
  });
}
```

- [ ] **Step 2: Run it to verify it fails**

Run (kill anything on 5273/5274 first):
```bash
npx playwright test --project=mobile tests/mobile/touch-select.mobile.spec.ts --grep "iphone-14-promax"
```
Expected: FAIL on `bodySelect` — received `"auto"`, expected `"none"`.

- [ ] **Step 3: Add the CSS block**

In `src/index.css`, replace the block at lines 54-69 with:

```css
/* Native-app feel on mobile web:
   - overscroll-behavior: none kills pull-to-refresh + rubber-band on the
     page edges, so anchored lesson chrome feels solid.
   - tap-highlight removal: controls provide their own pressed states; the
     gray iOS flash on every tile tap reads as "web page".
   - touch-action: manipulation on the root removes the double-tap-zoom
     delay everywhere without disabling pinch zoom on content.
   - Under a coarse pointer the app is not a document: long-press and drag
     must not select text or raise the iOS callout/magnifier (Spencer,
     2026-09-02: "accidentally selecting all words on the screen"). Scoped
     to `(pointer: coarse)` so desktop keeps normal selection. Inputs,
     textareas, contenteditable and the opt-in `.select-text` utility stay
     selectable — a caret must still appear in typed-answer steps. */
html,
body {
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
@media (pointer: coarse) {
  html,
  body {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  input,
  textarea,
  [contenteditable="true"],
  .select-text {
    -webkit-user-select: text;
    user-select: text;
    -webkit-touch-callout: default;
  }
}
```

(The old `button, [role="button"] { touch-action: manipulation; }` rule is subsumed by the root rule; delete it.)

- [ ] **Step 4: Gate hover styles**

In `tailwind.config.js`, add directly under `darkMode: "class",`:

```js
  // Every `hover:` utility compiles under `@media (hover: hover)`, so a tap
  // on touch no longer leaves the hover state stuck until the next tap.
  future: { hoverOnlyWhenSupported: true },
```

- [ ] **Step 5: Carve out the invite link**

In `src/features/social/sections/InviteFriendsCard.tsx:141` change the `<code>` className to:

```tsx
<code className="select-text flex-1 truncate font-mono text-xs text-text-primary">
```

- [ ] **Step 6: Run the test to verify it passes**

Run the Step 2 command. Expected: PASS at every viewport (desktop viewports take the `else` branch).

- [ ] **Step 7: Run the existing mobile gate for regressions**

```bash
npx playwright test --project=mobile --grep "flashcards|learn|home"
```
Expected: same pass count as before the change. If `tap-targets` or `overflow` newly fail, the hover flag exposed a layout that depended on hover; report it, do not revert the flag.

- [ ] **Step 8: Sibling parity**

State: web PWA inherited · iOS Capacitor inherited (same bundle; rebuild needed to see it on the Trap Phone) · desktop N/A by construction.

---

### Task 2: Carry a reading on JA flashcards instead of baking parens

**Files:**
- Modify: `src/features/flashcards/data/types.ts:29-55` (`FlashcardBase`)
- Modify: `src/features/languages/ja/courseAtoms.ts:1757-1775` (`courseAtomToFlashcard`)
- Modify: `src/features/flashcards/FlashcardTester.tsx:316-322` (`frontAudioText`)
- Test: `src/features/languages/ja/courseAtoms.test.ts` (append)

**Interfaces:**
- Produces: `Flashcard.reading?: { surface: string; kana: string }` — present only when the atom has kanji. `front` becomes the kanji when present, else kana.
- Later tasks rely on `card.reading` existing on JA kanji cards and being absent on kana-only, KO, ES, FR, and frequency cards.

- [ ] **Step 1: Write the failing tests**

Append to `src/features/languages/ja/courseAtoms.test.ts`:

```ts
import { courseAtomToFlashcard, JA_COURSE_ATOMS_BY_KANA } from "./courseAtoms";

describe("courseAtomToFlashcard reading", () => {
  it("puts the kanji on the front and carries the kana as a reading", () => {
    const gakkou = JA_COURSE_ATOMS_BY_KANA.get("がっこう")!;
    const card = courseAtomToFlashcard(gakkou);
    expect(card.front).toBe("学校");
    expect(card.reading).toEqual({ surface: "学校", kana: "がっこう" });
    expect(card.front).not.toContain("(");
  });

  it("leaves kana-only atoms without a reading", () => {
    const kana = JA_COURSE_ATOMS_BY_KANA.get("これ")!;
    const card = courseAtomToFlashcard(kana);
    expect(card.front).toBe("これ");
    expect(card.reading).toBeUndefined();
  });

  it("never emits the old parenthesised front for any atom", () => {
    for (const atom of JA_COURSE_ATOMS_BY_KANA.values()) {
      expect(courseAtomToFlashcard(atom).front).not.toMatch(/\(.+\)$/);
    }
  });
});
```

(If `JA_COURSE_ATOMS_BY_KANA` is not exported, use `JA_COURSE_ATOMS.find((a) => a.kana === "がっこう")!` — both exist in that file; check the export list at the top of `courseAtoms.ts`.)

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/features/languages/ja/courseAtoms.test.ts -t "reading"
```
Expected: FAIL — `front` is `"学校 (がっこう)"` and `reading` is undefined.

- [ ] **Step 3: Add the type**

In `src/features/flashcards/data/types.ts`, inside `FlashcardBase` after `back: string;`:

```ts
  /**
   * JA only: the kanji surface with its whole-word kana reading, so the
   * front can render okurigana-aligned ruby (`KanjiRuby`) instead of the
   * old `漢字 (かな)` string. Absent on kana-only, KO, ES, FR and frequency
   * cards. Also the spoken text — the TTS manifest is keyed by kana.
   */
  reading?: { surface: string; kana: string };
```

- [ ] **Step 4: Change the converter**

In `courseAtomToFlashcard` (`courseAtoms.ts`), replace the `front` line and add `reading` to the returned object:

```ts
  const front = atom.kanji ?? atom.kana;
  const reading = atom.kanji
    ? { surface: atom.kanji, kana: atom.kana }
    : undefined;
  return {
    id: canonicalAtomId(atom),
    front,
    reading,
    back: atom.meaningEn,
    ...
```

- [ ] **Step 5: Speak the kana, not the front**

In `FlashcardTester.tsx:316-322`, the TTS manifest is keyed by kana (see `emitCourseVocabTtsDecks.test.ts:19`), and the old parenthesised front never matched a clip, so kanji cards were silent. Change:

```ts
  const frontAudioText =
    card &&
    testedModality === "recognition" &&
    (card.type === "word" || card.type === "sentence")
      ? (card.reading?.kana ?? card.front)
      : undefined;
```

- [ ] **Step 6: Run to verify it passes, then the neighbours**

```bash
npx vitest run src/features/languages/ja/courseAtoms.test.ts src/features/flashcards
```
Expected: the three new tests PASS. If `courseDeck.test.ts` or `reviewQueue.test.ts` assert on the parenthesised front, update those assertions to the kanji-only front (the dedupe key in `reviewQueue.ts:99` keys on `front`, so two atoms sharing a kanji but not kana would now collide; grep `JA_COURSE_ATOMS` for duplicate `kanji:` values and, if any exist, change the key to `` `${e.card.front}|${e.card.reading?.kana ?? ""}` ``).

- [ ] **Step 7: Sibling parity**

State: KO / ES / FR build cards in `courseDeck.ts:126-134` from `atom.display` with no `reading` — inherited unchanged · frequency cards (`frequencyResolver.ts:56-68`) unchanged · Anki export (`scripts/anki-export-known.py`) reads atoms, not cards — check and state.

---

### Task 3: `CardFront` component — ruby when a reading exists

**Files:**
- Create: `src/features/flashcards/components/CardFront.tsx`
- Test: `src/features/flashcards/components/CardFront.test.tsx`

**Interfaces:**
- Consumes: `KanjiRuby` from `@/shared/readingAnnotation/KanjiRuby` (`{ surface, reading, show }`); `PlainText` from `@/shared/components/PlainText`; `isMastered` from `@/features/flashcards/engine/srs`; `getCardState` from `@/features/flashcards/engine/srsStorage`; `useSRSStoreRevision` from `@/features/flashcards/SRSStoreRevisionContext`.
- Produces:
  ```ts
  export function CardFront(props: {
    text: string;
    reading?: { surface: string; kana: string };
    cardId?: string;
    /** "answer" always shows furigana; "prompt" hides it once the card is mastered. */
    face?: "prompt" | "answer";
    className?: string;
  }): JSX.Element | null
  ```

- [ ] **Step 1: Write the failing tests**

```tsx
// src/features/flashcards/components/CardFront.test.tsx
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CardFront } from "./CardFront";

const mastered = vi.hoisted(() => ({ value: false }));
vi.mock("@/features/flashcards/engine/srsStorage", () => ({
  getCardState: () => ({ recognition: { interval: 0 }, production: { interval: 0 } }),
}));
vi.mock("@/features/flashcards/engine/srs", () => ({
  isMastered: () => mastered.value,
}));

describe("CardFront", () => {
  afterEach(() => {
    cleanup();
    mastered.value = false;
  });

  it("renders plain text when there is no reading", () => {
    const { container } = render(<CardFront text="これ" />);
    expect(container.querySelector("ruby")).toBeNull();
    expect(container.textContent).toBe("これ");
  });

  it("renders okurigana-aligned ruby with visible furigana for an unmastered card", () => {
    const { container } = render(
      <CardFront text="飲む" reading={{ surface: "飲む", kana: "のむ" }} cardId="ja:nomu" face="prompt" />,
    );
    const rt = container.querySelector("rt.kana-helper")!;
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("の");
    expect(container.querySelector("ruby")!.textContent).toContain("飲");
    expect(container.textContent).not.toContain("(");
  });

  it("hides the furigana on the prompt face once the card is mastered", () => {
    mastered.value = true;
    const { container } = render(
      <CardFront text="学校" reading={{ surface: "学校", kana: "がっこう" }} cardId="ja:gakkou" face="prompt" />,
    );
    expect(container.querySelector("rt.kana-helper")!.getAttribute("data-visible")).toBe("false");
  });

  it("always shows the furigana on the answer face", () => {
    mastered.value = true;
    const { container } = render(
      <CardFront text="学校" reading={{ surface: "学校", kana: "がっこう" }} cardId="ja:gakkou" face="answer" />,
    );
    expect(container.querySelector("rt.kana-helper")!.getAttribute("data-visible")).toBe("true");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/features/flashcards/components/CardFront.test.tsx
```
Expected: FAIL — module `./CardFront` not found.

- [ ] **Step 3: Implement**

```tsx
// src/features/flashcards/components/CardFront.tsx
/**
 * The one renderer for a flashcard's word surface. JA kanji cards carry a
 * `reading` (Task 2) and render through `KanjiRuby` — okurigana-aligned
 * furigana, never the `漢字 (かな)` string (Spencer, 2026-09-02). Everything
 * else is `PlainText`.
 *
 * Furigana follows FSRS like the lesson steps do: on the PROMPT face it
 * shows until the card is mastered (both modalities past the mastery
 * interval), then the kanji stands alone. On the ANSWER face it always
 * shows — the learner is checking, not being tested. Re-renders on the SRS
 * store revision so a grade in the same session is reflected.
 */
import { KanjiRuby } from "@/shared/readingAnnotation/KanjiRuby";
import { PlainText } from "@/shared/components/PlainText";
import { isMastered } from "@/features/flashcards/engine/srs";
import { getCardState } from "@/features/flashcards/engine/srsStorage";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";

type Reading = { surface: string; kana: string };

type Props = {
  text: string;
  reading?: Reading;
  cardId?: string;
  face?: "prompt" | "answer";
  className?: string;
};

export function CardFront({ text, reading, cardId, face = "answer", className }: Props) {
  useSRSStoreRevision();
  if (!reading) return <PlainText className={className}>{text}</PlainText>;
  const show =
    face === "answer" || !cardId ? true : !isMastered(getCardState(cardId));
  return (
    <KanjiRuby
      surface={reading.surface}
      reading={reading.kana}
      show={show}
      className={className}
      lang="ja"
    />
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Same command. Expected: 4 PASS.

---

### Task 4: Route every flashcard front through `CardFront`

**Files:**
- Modify: `src/features/flashcards/FlashcardTester.tsx:98-120` (`CardFace`) and the `<CardFace … />` call at `:856-872`
- Modify: `src/features/flashcards/CardPreview.tsx:85-101` (`CardFace`)
- Modify: `src/features/flashcards/CardManagerPage.tsx:397-402` and `:679-681`
- Modify: `src/features/flashcards/FlashcardsPage.tsx:92-94`
- Test: `src/features/flashcards/components/FlashcardDetailSidebar.test.tsx` stays green; add a render assertion to `src/features/flashcards/CardManagerPage.test.tsx`

**Interfaces:**
- Consumes: `CardFront` from Task 3; `card.reading` from Task 2.

- [ ] **Step 1: Write the failing test**

Append to `src/features/flashcards/CardManagerPage.test.tsx` (follow that file's existing render helper and mock setup; the deck it seeds must contain a card with `front: "学校", reading: { surface: "学校", kana: "がっこう" }`):

```tsx
it("renders kanji fronts as ruby, not as '漢字 (かな)'", () => {
  const { container } = renderPage();
  expect(container.querySelector("ruby")).not.toBeNull();
  expect(container.textContent).not.toContain("学校 (がっこう)");
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/features/flashcards/CardManagerPage.test.tsx -t "ruby"
```
Expected: FAIL — no `<ruby>` in the document.

- [ ] **Step 3: FlashcardTester `CardFace`**

Replace the body of `CardFace` (`FlashcardTester.tsx:98-120`) so the front branch ends with:

```tsx
    return (
      <CardFront
        text={card.front}
        reading={card.reading}
        cardId={card.id}
        face={face}
      />
    );
```

and add `face: "prompt" | "answer"` to its props. At the call site (`:856-872`) pass `face={flipped ? "answer" : "prompt"}`. Import `CardFront` from `./components/CardFront`. The back branch stays `PlainText`.

- [ ] **Step 4: CardPreview `CardFace`**

Same change in `CardPreview.tsx:85-101`; that component's `flipped` state is local, so pass `face={flipped ? "answer" : "prompt"}` from `CardPreview` into `CardFace`.

- [ ] **Step 5: CardManagerPage and FlashcardsPage**

`CardManagerPage.tsx:400`: replace `{mc.card.front}` with `<CardFront text={mc.card.front} reading={mc.card.reading} />`.
`CardManagerPage.tsx:680`: replace `{card.card.front}` with `<CardFront text={card.card.front} reading={card.card.reading} />`.
`FlashcardsPage.tsx:93`: replace `{card.front}` with `<CardFront text={card.front} reading={card.reading} />`.
(Management and hub surfaces are not tests, so `face` defaults to `"answer"` and furigana always shows.)

- [ ] **Step 6: Run the flashcards suite and tsc**

```bash
npx vitest run src/features/flashcards && npx tsc -b
```
Expected: all PASS, no type errors.

- [ ] **Step 7: Screenshot check**

With `VITE_DEV_AUTH_BYPASS=true npm run dev` running on 5173:
```bash
node scripts/capture-flashcards.mjs /private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/20d27d40-49a5-46eb-966d-4c1c77fa09f2/scratchpad/fc-ruby
```
Open `fc-front--mobile.png`; a kanji card must show the kana above the kanji run and no parentheses anywhere. (`capture-flashcards.mjs` seeds atoms `ike`, `yama`, `kawa`, `tsuki` which all carry kanji.)

---

### Task 5: Vocab library gets the same ruby

**Files:**
- Modify: `src/features/vocab/VocabCardSheet.tsx:47-49`
- Modify: `src/features/vocab/VocabPage.tsx:253`
- Test: `src/features/vocab/VocabCardSheet.test.tsx` (create if absent; mirror the render helper pattern from `FlashcardDetailSidebar.test.tsx`)

**Interfaces:**
- Consumes: `CardFront` from Task 3; `VocabRow.kanji` / `VocabRow.kana` / `VocabRow.id` from `src/features/vocab/vocabData.ts:23-29`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/vocab/VocabCardSheet.test.tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import { VocabCardSheet } from "./VocabCardSheet";
import type { VocabRow } from "./vocabData";

const row: VocabRow = {
  id: "ja:gakkou", kana: "がっこう", kanji: "学校", romaji: "gakkou", meaning: "school",
  emoji: "🏫", imageUrl: null, module: "m3", kind: "vocab", tier: "learning", unlocked: true,
} as VocabRow;

describe("VocabCardSheet", () => {
  afterEach(cleanup);
  it("shows kanji with ruby, never the full-width paren string", () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <VocabCardSheet row={row} open onClose={() => {}} />
      </I18nextProvider>,
    );
    expect(container.querySelector("ruby")).not.toBeNull();
    expect(container.textContent).not.toContain("（");
  });
});
```
(Match `VocabCardSheet`'s real prop names — read its signature at the top of the file before writing the render call; if it requires more props, pass the minimal stubs and cast the row with `as VocabRow` for any field added since 2026-09-02.)

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/features/vocab/VocabCardSheet.test.tsx
```
Expected: FAIL — no `<ruby>`, text contains `（`.

- [ ] **Step 3: Implement**

`VocabCardSheet.tsx:48`:
```tsx
<CardFront
  text={row.kanji ?? row.kana}
  reading={row.kanji ? { surface: row.kanji, kana: row.kana } : undefined}
  cardId={row.id}
/>
```
`VocabPage.tsx:253` (grid row headline):
```tsx
<p className="truncate font-semibold text-text-primary">
  <CardFront
    text={row.kanji ?? row.kana}
    reading={row.kanji ? { surface: row.kanji, kana: row.kana } : undefined}
    cardId={row.id}
  />
</p>
```
Import `CardFront` from `@/features/flashcards/components/CardFront` in both. Ruby inside a `truncate` `<p>` clips vertically on some rows: add `leading-[1.9]` to that `<p>` and confirm with the screenshot in Step 5.

- [ ] **Step 4: Run to verify it passes**

Same command plus `npx vitest run src/features/vocab`. Expected: PASS.

- [ ] **Step 5: Screenshot the vocab grid on a phone**

```bash
SHOT_OUT=/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/20d27d40-49a5-46eb-966d-4c1c77fa09f2/scratchpad/vocab-ruby.png \
  node scripts/shot.mjs /ja/vocab --guest --wait=3500
```
The kana must sit above the kanji and the row height must not clip it.

- [ ] **Step 6: Sibling parity**

State: KO / ES / FR vocab rows have no `kanji` → plain path, unchanged · dictionary detail (`DictionaryEntryDetail.tsx:39-40`) stacks the reading as its own line and is out of scope; note it as a follow-up.

---

### Task 6: Wave verification

**Files:** none new.

- [ ] **Step 1: Preflight**

```bash
npm run preflight
```
Expected: tsc clean, vitest all green, `CI=true` build succeeds with no over-cap precache warning.

- [ ] **Step 2: Mobile gate on the touched routes**

```bash
npx playwright test --project=mobile --grep "flashcards|vocab|touch-select"
```
Expected: green. Record the pass count.

- [ ] **Step 3: Report**

Report to Spencer: the four screenshots (flashcard front, vocab grid, before/after not needed), the mobile-gate pass count, the tsc/vitest result, and the sibling-parity lines from Tasks 1, 2, and 5. Then stop; Spencer commits and rebuilds the phone.
