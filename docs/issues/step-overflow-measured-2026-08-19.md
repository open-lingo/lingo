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

**kanji_reading overflows on a current large phone.** That is worth separating
from the rest: the SE numbers can be argued down as "squished but functional
on a 2015 device, outside the support window" (Spencer 2026-08-09), and this
one cannot.

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
