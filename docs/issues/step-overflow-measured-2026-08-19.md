# The six overflowing step types, measured — and why the gate cannot see them

Filed 2026-08-19. CLAUDE.md has said "six step types still overflow this
scroller on a 375×667 phone" since B092 was opened, without per-type numbers.
Here they are, plus the reason the mobile gate reports green anyway.

## The instrument gap

`tests/mobile/routes.mjs` carries **three** lesson routes, all of them
`ja-m4-neo-1?step=1|6|8`, and between them they render **two** step types:
`build_sentence` and `word_image_mcq`. Every other step type in the course is
one the stage-fit spec has never visited. So

> `ja-learn-lessons-ja-m4-neo-1 stage does not scroll vertically` ✓

is true and says nothing about the other eighteen. The 2026-08-05 note already
in that file — routes pointing at a retired lesson id, the spec skipping with
an annotation and "staying green while covering nothing" — is the same failure
one level up: the matrix is green because of what it does not visit.

## Measured — `scrollHeight - clientHeight` of the LessonShell scroller

One route per step type, chosen from the m32 visual-QA capture contracts.
Reproduce with `node scripts/measure-step-overflow.mjs` (dev server + auth
state required).

### iPhone SE, 375×667

| overflow | step type |
|---:|---|
| 336px | grammar_rule — **scrolls by design**, the gate exempts it |
| **195px** | match_pairs |
| **136px** | kanji_reading |
| **121px** | dialogue_listen |
| **100px** | speaking |
| **67px** | listening_build |
| **55px** | listening_comprehension |
| 0px | build_sentence, particle_cloze, translate, word_image_mcq, multiple_choice |

Six genuine offenders, which is exactly the count CLAUDE.md carries — measured
independently here, and now with sizes attached. The scroller is 455px tall at
this viewport, so match_pairs is asking the learner to scroll through 143% of
a screen inside a step that is supposed to fit.

### iPhone 14 Pro Max, 430×932

| overflow | step type |
|---:|---|
| **30px** | kanji_reading |
| 19px | grammar_rule (by design) |
| 0px | everything else |

**kanji_reading overflows on a current large phone**, which rules out any
"only on old hardware" reading of the SE numbers.

And the SE numbers do not need that defence anyway. **375×667 is NOT a legacy
viewport in this repo's matrix** — `routes.mjs` says so in as many words:
"Nothing else is legacy. 375x667 is the iPhone SE, still sold and squarely in
[the support target]." The only viewport carrying `legacy: true` is
android-small at 360×640. So the stage-fit exemption Spencer granted in
2026-08-09 ("squished but functional is fine outside the ~6-year support
window") does not cover any number in the table above. All six are in-support
failures.

### Fixed same day — kanji_reading, 136px → 8px

The step's option grid was `grid-cols-1 sm:grid-cols-2`, so below the `sm`
breakpoint four options stacked into a single column: 248px of a 455px
scroller, the tallest block on the step and most of its overflow. The options
are kana readings, two to four characters, and a two-column layout at 375px
gives each one a ~170px column — not tight.

Two columns at every width. Measured after: **8px at 375×667** (was 136) and
**0px at 430×932** (was 30). Nothing else on the step was touched — the card's
padding and the gaps are the designer's, and the 8px residual is not worth
spending them on. Six unit tests pass.

That leaves five overflowing step types on the SE, none on the Pro Max.

## What is not covered here

The 12 step types above are the ones m32 happens to contain.
`conjugation_transform` (B091, structurally over budget) is not among them,
nor are the Spanish-only types. A fuller sweep means capturing a module that
contains them and rebuilding the route map — the script's header says how.

## Before turning this into a gate

Adding one route per step type to `routes.mjs` would make the mobile gate red
in six places immediately, across every viewport and every spec that walks the
matrix. Measure first, fix the step types, then extend the matrix — in that
order, or the gate stops being a gate and starts being a known-failures list.

## match_pairs (195px) is structural, not a trim

Measured the tree at 375×667, `ja-m32-neo-1?step=20`:

```
 455px  the scroller
  56px  header (h2 + progress dots)
  12px  gap-3
 448px  the grid — 6 rows × 68px + 5 gaps × 8px
  56px  the reserved Continue slot (min-h-14, deliberate)
```

The 68px row height is set by the Japanese tiles: each carries a 54px inner
span because kanji tiles render furigana above the kanji (お金 / かね). English
tiles are shorter, but a grid row is as tall as its tallest cell.

**To fit, the grid would have to come down to about 307px — roughly 43px per
row against 68px today.** No padding trim reaches that. The levers are:

1. **Fewer pairs on narrow viewports.** Dropping `MATCH_PAIRS_FLOOR` from 6 to
   5 below `sm` saves 76px. Still ~119px over, so this alone does not fix it.
2. **Smaller type / tighter furigana on match tiles at phone width.** This is
   the only lever big enough on its own, and it trades against readability of
   the exact thing the step is testing.
3. **Declare it scrolling by design** — add `match_pairs` to
   `SCROLLABLE_STEP_TYPES` alongside `grammar_rule`. Honest, costs nothing, and
   means a phone learner scrolls inside a matching grid.

This is a design call, not a mechanical fix, so it is measured and left alone.
The same reasoning applies to dialogue_listen (121px) and speaking (100px);
listening_build (67px) and listening_comprehension (55px) are small enough that
a trim may genuinely reach them.

### listening_comprehension, 55px → 27px

Below `sm` only: block gaps `gap-6` → `gap-4` (twice), option padding `py-4` →
`py-3`, option grid `gap-3` → `gap-2`. Nothing above the breakpoint changed and
the option buttons stay at 42px, well clear of the 24px WCAG 2.5.8 floor.

It does not reach zero. What is left is content, not spacing: the audio row is
94px, the four options 192px, the reserved CTA 64px. Squeezing the last 27px
means shrinking type or the play button, which is a design call rather than a
trim — same place the match_pairs analysis lands, one notch less severe.
