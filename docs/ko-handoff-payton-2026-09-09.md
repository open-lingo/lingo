# KO handoff for Payton — 2026-09-09

Korean course m1–m27. This note says what changed today, what the machine
now guarantees, and where a human walk is still the only check. Read it
before walking; log findings the way `docs/user-feedback/README.md` asks.

## What changed today (commit `ko: extend gates to m27 …`)
| area | change | what you may notice in the app |
|---|---|---|
| m16–m27 | two compounding-review match grids per module (end of lesson 3 and end of lesson 7), same machinery as m3–m15 | a 6-pair "match" step that pulls words from EARLIER modules; every word should already be taught |
| m16 L1 | 담배 now has a phrase card before it is graded | one extra card |
| m26 L3→L4 | «오늘 너무 피곤하거든요» listening moved into the 너무 lesson | L3 is one step shorter |
| m2 compound vowels | 뭐 (cv-2) and 왜 (cv-3) get an image-MCQ intro before their listening/speaking steps | ❓ image cards |
| m2 liaison wrap-up | the two meaning-MCQs on 있어요/없어요 were removed (those words are taught in m6/m8); the sound-spelling MCQs stay | lesson is two steps shorter |
| 21 particle clozes m3–m24 | English prompt gained a cue such as "(object)", "(time)", "As for me," | the prompt now tells you WHICH particle family is wanted |

Nothing about the Korean text or the audio changed. No new clips.

## What the machine now checks (so you don't have to)
- Intro-before-graded, m3–m27: an owned vocab word cannot be graded before
  a card or image-MCQ introduces it.
- Compounding review, m3–m27: every module carries two prior-module grids;
  ≥60% of lessons touch earlier material (today m12 is the tightest at 5/8).
- Particle-cue answerability, m3–m27: a particle cloze with more than one
  phonologically possible option must carry an English cue.
- Everything from the 2026-09-01 audit (`docs/ko-release-audit-2026-09-01.md`
  §4 lists the gates).

## What the gates CANNOT see — please walk these
1. **m1–m2 hangul tier.** Those lessons use raw Hangul strings, not atoms,
   so the intro-before-graded gate is blind there. Today's audit found and
   fixed three cases by hand (뭐, 왜, 있어요/없어요). Walk `ko-m2-cv-1/2/3`
   and `ko-m2-bt-review` end to end and flag any word you are asked about
   that the lesson never showed you.
2. **m16–m27 lesson content.** Never walked by a human. Each has 8 lessons.
   Priority order: m16 (면 안 돼요), m21 (food/ordering — TestFlight #33/#34
   came from here), m26 (거든요), then the rest. Look for: wrong or
   unnatural Korean, glosses that mislead, MCQ where two options are both
   right, tile banks that cannot build the answer, audio that does not
   match the printed text.
3. **The new review grids.** Do the 6 pairs feel like review (words you
   met earlier) or like new words? Note any pair whose English is
   ambiguous with another pair in the same grid.
4. **The cue wording** on the 21 particle clozes — does "(object)" /
   "(time)" / "(existence)" read naturally to a learner, or would you
   phrase it differently? Say which.
5. **Romanization / liaison claims** in `ko-m2-bt-review` (물이→[무리],
   있어요→[이써요], 좋아요→[조아요]) — confirm as a speaker.

## Known, deliberately not changed (Spencer decides)
- Six words are fully taught as readings in m2 (가게, 노래, 사과, 귀, 회사,
  의자) but registered as vocabulary only at their later module (m6, m23,
  m9, m20, m13, m4). The later card re-teaches them as new. Registering
  them at m2 ripples through five gates; parked.
- 와/과 vs 하고 (formal vs colloquial "and") is not distinguishable from
  English; the cue gate treats them as one family.
- 742 grade-A frequency words are untaught (`docs/ko-gap-audit-2026-08-26.md`).
- The frequency-deck `unlockModule` values are an SRS drip, not a claim
  that lessons teach the word first; a spot check of 25 found 18 words
  that no lesson teaches. Expected by design, but worth knowing when a
  flashcard shows a word you never met in a lesson.

## How to report
One row per finding: module, lesson number and step number (e.g. "m16
lesson 1, step 5"), what you saw, what you expected. Screenshots help for layout; for
language, quote the Korean. Put rows in `docs/user-feedback/` under a
dated file, as the README describes.
