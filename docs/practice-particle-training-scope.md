# Scope: particle practice as real grammar training (TestFlight #44)

Spencer, build 8: "this page is a little useless as is, it's effectively
grammar training. Maybe we expand the grammar training to count particle usage
as training and do a better 'combined forms' of things that use like に and
から in one sentence, or から and まで, and it just exposes a bunch of new
grammar usages of the concepts they already know?"

## What exists

- `/practice/grammar/particles` (`ParticlePracticePage.tsx`): a reference page
  (all 15 particles as chips, grouped cards with a one-line meaning) that
  launches the particle cloze drill (`practice/cloze`). The drill is one blank
  per sentence, one particle, from the taught pool.
- The conjugation trainer already has "Combined forms" (drill two forms
  together) — the pattern Spencer wants mirrored.

## Proposed shape

1. **Particle pairs as drills.** A "Combine" toggle like the conjugation
   trainer's: pick two particles (に+から, から+まで, は+が, を+で, へ+に) and
   the drill serves sentences with BOTH blanks, both from the pool. Sentence
   source: mine the taught corpus for sentences containing both particles
   (the SRS review miner in `buildSrsReviewLesson.ts` already tokenizes taught
   sentences with the module tokenizer), so no new authoring.
2. **Count it as training.** Particle drills write to the same practice stats
   as conjugation (`practiceStats.ts`) and surface on the grammar pillar card
   ("particles · 12 today").
3. **Exposure of new usages.** Each pair gets a 3-line "what changes when
   they meet" card (e.g. から…まで brackets a span; に marks the destination
   while へ marks the direction) shown once before the first combined drill.
   These are teaching notes, not lessons — same slot as the free-drill rule
   card.
4. **The に time-marker note** (`docs/ja-time-ni-lesson-scope.md`) belongs
   here too: absolute vs relative time is the first "usage" card for に.

## Cost

- Pair drill on mined sentences: ~1 day (miner filter, two-blank cloze view
  variant, tests). Two-blank grading is the only new UI.
- Stats + pillar card: 2 h.
- Usage cards: content, ~30 min each; 6 pairs to start.
