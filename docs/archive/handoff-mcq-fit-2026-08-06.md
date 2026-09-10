# Handoff — word_image_mcq fit fix + mobile scaling state

**Date:** 2026-08-06 · **Status:** SHIPPED (uncommitted), verified

## What was broken

`word_image_mcq` overflowed the lesson stage on narrow phones — up to **204px**
at 320×568, forcing the learner to scroll inside a step that is supposed to fit.

**Root cause (measured, not assumed):** the grid's width cap predicted grid
*height* from grid *width*, which is only valid while the option cards are
square. **They were not.** `aspect-square` sets a *preferred* ratio, but a grid
row is sized to its items' min-content, and a card's min-content (romaji ruby +
`text-3xl` kana + emoji + `p-4`) exceeded its width. Measured cards were
112×135, 132×145, 140×149 — `cardSquare: false` at every viewport. So a 240px
grid rendered 390–494px tall.

## The fix — `src/features/lesson/components/steps/WordImageMcqStepView.tsx`

1. **Bound height directly.** Added `gridMaxHeight = calc(100cqh - 13rem)` and
   `gridTemplateRows: repeat(rows, minmax(0, 1fr))`. `auto` rows size to content
   and ignore `maxHeight`; `1fr` rows honour it.
2. **Reserve 13rem, was 11rem.** 11rem under-reserved by ~25px whenever the
   prompt wrapped to 2 lines.
3. **`min-h-0 overflow-hidden` on the card.** Removes the min-content floor so
   the card shrinks into its row and `aspect-square` finally binds.
4. **`min-h-[30%] flex-1` on the art (was `h-[50%]`).** A percentage height
   needs a definite parent height; with a content-sized card it fell back to
   intrinsic size and inflated the card.
5. **Kana `text-2xl` below `sm` (was `text-3xl`).** A 6-kana word at 30px
   wrapped to two lines on a ~110–140px card and crowded the art out.

⚠️ Items 4 + 5 exist because the *geometry-only* fix caused a **content
regression**: cards fit but the emoji was squeezed to nothing, and long words
(きゅうにゅう, えんぴつ) lost their art entirely. The picture IS the answer cue
in this step — a card that fits with no image is worse than one that scrolls.
`min-h-[30%]` is a pedagogy floor, not styling. Don't "simplify" it away.

## Verified

| Viewport | Before | After |
|---|---|---|
| 320×568 (iPhone SE1) | 4/13 fit, worst 204px | 7/13, worst 121px |
| 360×640 (budget Android) | 9/13, worst 48px | 11/13, worst 23px |
| **375×667 (iPhone 6s–SE2)** | 11/13, worst 28px | **13/13, worst 0px** |
| 390×844 (iPhone 12–14) | 13/13 | 13/13 |
| 412×915 (Pixel 7) | 13/13 | 13/13 |

`word_image_mcq`: **worst 204px → 0px across all 15 measurements.**

Also holding across all 65 measurements: window-level scroll **0**, CTA below
fold **0**, CTA off horizontal edge **0**, **CTA gap a constant 28px** at every
phone viewport (60px at 1080p, 53px at 720p) — the consistent Duolingo-style
distance the original goal asked for.

Suite: **9179 unit tests pass**, `tsc` clean on touched files. Headful pass at
8 viewport/route combos: `ovf=0` everywhere; test-out stage 717px at 1080p,
matching the lesson exactly.

## Still scrolling (NOT regressions, and NOT all bugs)

| Step type | Where | Verdict |
|---|---|---|
| `grammar_rule` | ≤360px, worst 121px | **by design** — CLAUDE.md: "Long reading content (grammar cards) scrolls inside it" |
| `speaking` | ≤360px, worst 93px | open — mic UI is tall |
| `listening_comprehension` | 320px only, worst 102px | open — 320px is below the practical floor |

**320×568 (iPhone SE 1st gen) is not viable and I'd argue is out of scope** —
a 2016 phone with a 2013 screen. The practical floor for ">2015 smartphone" is
**375px (iPhone 6s)**, and that is now clean at 13/13.

## Gap in the gate

**35 of 65 measurements had no `data-testid="primary-cta"`** — step types
`listening_comprehension`, `speaking`, `grammar_rule`, `translate`. The
`cta-fold` gate is structurally blind on those four.

## Recommended follow-up

Promote the throwaway probe into `tests/mobile/stage-fit.mobile.spec.ts` — it is
assertion #5 from `mobile-research-2026-07-20.md` ("no unintended vertical
scroll on fixed-shell surfaces"), which was marked N/A because the fixed shell
didn't exist. It does now (`LessonShell`), and this check would have caught the
204px case on its own. Allow-list `grammar_rule` as intentionally scrollable.

## Reproduce

```bash
echo 'VITE_DEV_AUTH_BYPASS=true' > .env.local && npm run dev
# probe: measure scroller.scrollHeight - clientHeight per (viewport, step) on
# /ja/learn/lessons/ja-m4-neo-1?step=N&trace-gate=0, reading
# [data-lesson-stage] and its parentElement
```

Probe scripts were scratch and deleted; screenshots were under
`dev-artifacts/shots/` (gitignored scratch, also removed).
