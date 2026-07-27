> **Status: ARCHIVED — SUPERSEDED by srs-scheduling-model-2026-06-15.md.** Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Spaced-review cadence — hiragana module (and beyond)

Status: research-only spec, ready to implement. Pairs with the existing
hiragana curriculum + lesson builder at
`src/features/lesson/data/{hiraganaCurriculum.ts,lessonBuilder.ts}` and the
kana-mastery store at `src/features/japanese/kanaMastery/`.

Goal: every kana introduced must be *retrieved* (not re-shown) 5–7 times
in week 1 and 8–12 times by week 2, with the bulk of the lift coming from
graded within-lesson and adjacent-lesson reviews — same model Duolingo
ships and the same model FSRS-6 converges to when desired retention is
0.9.

---

## TL;DR for the implementer

1. **Within a lesson**: a newly-introduced kana K appears at minimum
   **5 times** (intro, teach, match, audio-MC, build) before the lesson
   ends. All but the intro are retrievals.
2. **Next lesson**: K appears in a **carry-over match (4 pairs)** at
   step 4 and in **one MC distractor pool** later. That's +2 retrievals.
3. **Lessons N+2 and N+3**: K is eligible for the carry-over match pool
   probabilistically (weight = recency × low-mastery). Average +1.5 each.
4. **End-of-module recap lesson**: 100% review, ~12 items drawn by FSRS
   priority across the entire module. K appears once if FSRS schedules
   it.
5. **Module spacing**: gate next module behind a **2-day cooldown** OR
   completed recap lesson, whichever is later. Cepeda 2008 ridgeline
   says ~20% gap-to-retention-interval for week-scale retention.

Resulting exposure curve (1 lesson/day pace):

| Day | Cum. retrievals of K | Source |
|---|---|---|
| 1 (intro day) | 4 retrievals + 1 intro | within-lesson |
| 2 | +2 | next-lesson carry-over |
| 3–5 | +1.5 each, avg | rolling carry-over pool |
| 7 | ~9 | + recap if module ends |
| 14 | ~12–14 | second module's spaced-review draws |

Hits the Nation 2001 target (8–12 meaningful encounters for stable
representation) by end of week 2 without overloading day 1.

---

## 1. What Duolingo actually does (reverse-engineered)

Duolingo does **not** publish exact per-lesson exposure counts. The
following synthesis combines the half-life regression paper (Settles
& Meeder 2016), the Review Exercises blog, the duome forum dataset, and
direct observation of the Japanese hiragana track.

### 1.1 Within the introducing lesson

A typical Duolingo lesson contains **12–15 exercises** (varies — wrong
answers add more). For a newly-taught word, the documented pattern is:

- **Tap-what-you-hear / match** at first exposure (immediately after
  the word's tooltip intro)
- **Translation prompt** (write the word in target language)
- **Reverse translation** (write it in source language)
- **Listening exercise** or **speak prompt**
- **Match-pairs round** at lesson end (5-pair tile match)

This puts each new word at **4–6 retrievals within the same lesson**.
The half-life paper's dataset confirms it: the `session_seen` column
(times a lexeme is seen *within one practice session*) has a mean
around 3–5 for newly-introduced items.

[Settles & Meeder 2016 — A Trainable Spaced Repetition Model for
Language Learning](https://research.duolingo.com/papers/settles.acl16.pdf)

[duolingo/halflife-regression — dataset
README](https://github.com/duolingo/halflife-regression) — describes
`session_seen` and `session_correct` columns.

### 1.2 The next lesson

Duolingo's "Review Exercises" feature sprinkles previously-introduced
items into later lessons. The product blog claims learners answer
**~300,000 Review Exercises per day** across the platform. Empirically,
each freshly-introduced word reappears in the **immediately next lesson
at least once**, usually inside a match round, and continues to be
sampled with decaying probability for the next 3–5 lessons. This is the
HLR scheduler at work: word p is queued for practice when its predicted
recall probability drops below threshold.

[Duolingo Blog — Measuring Lesson Recall](https://blog.duolingo.com/review-exercises-help-measure-learner-recall/)

[Duolingo Blog — Spaced Repetition](https://blog.duolingo.com/spaced-repetition-for-learning/)
— explicit example: "practice each word 4 times a day for 5 days" as a
spacing prescription.

### 1.3 Exposures in week 1

Combining 1.1 and 1.2: a learner doing 1 lesson/day sees a freshly-
introduced word approximately:

| Time | Exposures (cumulative) |
|---|---|
| End of intro lesson | 4–6 |
| End of day 2 | 5–8 |
| End of day 3 | 6–9 |
| End of day 7 | 8–12 |

This matches the Nation (2001) finding that **8–12 meaningful encounters
are needed for stable lexical representation**, and the broader
incidental-learning range of 6–20.

[Nation 2001 — Learning Vocabulary in Another
Language](https://www.cambridge.org/core/books/learning-vocabulary-in-another-language/491314AA1B451AD04F3536000F1C9F0D)

### 1.4 New-vs-review balance within one lesson

Not publicly disclosed by Duolingo. Best estimate from observation +
the Review Exercises blog ("an extra exercise"): newly-introducing
lessons sit around **70% new-target / 30% review**, while consolidation
lessons later in a unit invert to **40% new / 60% review**. End-of-unit
"legendary" / personalized practice runs are **100% review**.

Lingo will target the same envelope:
- **Intro lesson** (first time row R is taught): 70% R-targeted /
  30% carry-over from prior 2 rows.
- **Recap lesson** (end of module): 100% review, FSRS-prioritized.

---

## 2. What FSRS-6 prescribes

FSRS-6 (Su 2024) is the gold-standard open spaced-repetition algorithm
and ships in Anki, AnkiDroid, RemNote, and ts-fsrs.

### 2.1 Default parameters

Default initial-stability vector (rating → days of stability after
first review):
- Again (1): `0.212`
- Hard  (2): `1.2931`
- Good  (3): `2.3065`  ← typical for a passed new card
- Easy  (4): `8.2956`

So a freshly-passed item with "Good" is scheduled for a **next review
~2.3 days out** at the default 0.9 retention target. "Easy" jumps it
to ~8 days.

[Expertium — A Technical Explanation of FSRS](https://expertium.github.io/Algorithm.html)

[open-spaced-repetition/fsrs4anki — tutorial.md](https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md)

### 2.2 Same-day re-reviews

FSRS uses a **separate "crude heuristic" formula** for same-day reviews
(params w17, w18, w19). Same-day "Good" and "Easy" can't decrease
stability; "Hard" and "Again" can. Critically: **only the first review
of each day is used by the optimizer** — additional same-day reviews
don't move the long-term schedule. They're treated as in-session
reinforcement, not retention evidence.

This is exactly the right model for our within-lesson cadence: the 4–6
in-lesson retrievals count as "learning to a passable first state,"
and the **next-day exposure** is what FSRS actually uses to set
long-term stability.

### 2.3 Recommended learning steps

FSRS tutorial guidance: learning steps should be **same-day** (e.g.
10m, 30m, max ~12h). The tutorial **discourages** "5m 10m 15m 30m"
ladders — they don't help. A single 10m step or two short steps is
the canonical recommendation before graduation to the FSRS scheduler.

For Lingo, the in-lesson micro-steps (intro → teach → match → build)
serve the same role as Anki's learning steps: same-session retrievals
that get the card into a "passed Good" state at the end of the lesson.

### 2.4 Initial intervals

After a "Good" graduation: FSRS gives a first interval of **~2.3 days**
(vs. SM-2's 1 day). Tutorial: "Giving long first intervals is one of
the strengths of FSRS." This is conservative spacing that the
algorithm has empirically verified beats shorter first intervals on
retention-per-review.

---

## 3. Synthesis — concrete spec for Lingo

### 3.1 Within-lesson step indices (canonical hiragana lesson)

Current lesson builder emits a **per-kana cycle**: intro → teach. End:
match → build. Spec adds two more retrieval beats per kana inside the
lesson:

```
For a lesson introducing kana {K1, K2, K3, K4, K5}:

Step 1:  Intro(K1)                 [exposure  — recognition seeded]
Step 2:  Teach-word(K1)            [retrieval — MC pick correct kana]
Step 3:  Intro(K2)
Step 4:  Teach-word(K2)
Step 5:  Audio-MC mini round       [retrieval — K1, K2 audio→glyph]
Step 6:  Intro(K3)
Step 7:  Teach-word(K3)
Step 8:  Intro(K4)
Step 9:  Teach-word(K4)
Step 10: Audio-MC mini round       [retrieval — K3, K4]
Step 11: Intro(K5)
Step 12: Teach-word(K5)
Step 13: Match(6 pairs)            [retrieval — ALL 5 kana of this row + 1 carry-over]
Step 14: Build sentence            [retrieval — uses 2–3 of the new kana, tile-build]
Step 15: Info wrap-up              [optional, not retrieval]
```

Result: each kana gets **1 intro + 4 retrievals = 5 in-lesson
exposures**. Highest-numbered kana (K5) gets the fewest (just match +
build + teach-word + 0 audio-MC because mini-rounds are paired). To
even this out: **alternate the audio-MC pairing** so K5 gets its own
mini-round between teach and the final match (15 steps → 16).

This is **Karpicke-compliant**: every reappearance after the intro is a
retrieval (testing effect), not a re-presentation. Karpicke 2008
finding: retrieval practice produces large positive effects on delayed
recall; restudying does not.

[Karpicke & Roediger 2008 — The Critical Importance of Retrieval
Practice](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Karpicke-Roediger-2008_Sci.pdf)

### 3.2 Across-lesson carry-over

Every lesson (except lesson 1 of a module) reserves **one match round
of 6 pairs**:
- **4 pairs** from the lesson's own new kana
- **2 pairs** from a carry-over pool

**Carry-over pool** = kana introduced in the prior **2 lessons**,
weighted by:
- `recency`: lesson N-1 weight 2, lesson N-2 weight 1
- `mastery deficit`: kana with kanaMastery interval < 7d preferred
- `coverage`: avoid drawing the same carry-over kana 2 lessons in a
  row unless mastery is still <3 exposures

Pool size: typically 8–10 kana per lesson. Draw 2 weighted-random per
lesson. Each carry-over kana hits ~1–2 lessons before being retired
from the pool.

Net effect on K introduced in lesson N:
- Lesson N: 4 retrievals (above)
- Lesson N+1: 2 retrievals (carry-over match + chance of distractor)
- Lesson N+2: ~1.5 retrievals (carry-over match + match distractor)
- Lesson N+3: ~1 retrieval (decaying weight)
- Lesson N+4+: only via recap or FSRS draw

Cumulative by lesson N+3: **~8–9 retrievals**. Cumulative by recap
(N+5–N+6): **~10–11**. On target.

### 3.3 Recap lesson (end of module)

Every module ends with a **dedicated recap lesson**:
- 100% review items, drawn by FSRS priority across the entire module's
  kana
- ~12 items, ordered by ascending retrievability (lowest first)
- Same step types as a normal lesson, minus intros
- Counts as a "lesson" for streak / XP

For Hiragana (9 basic rows + 4 voicing rows + 1 yōon module): each
voicing block of 2 rows ends with a recap, and the full module ends
with a final "all hiragana" recap of 15 items.

### 3.4 Module spacing

Cepeda 2008 ridgeline: optimal gap-to-retention ratio is ~20% for
week-scale retention. For a learner whose retention target is
"remember at 1 month": optimal inter-module gap is ~6 days. Too long
for a streak-driven product.

Compromise: **gate next module behind whichever is later**:
- 2 calendar days since module completion, AND
- recap lesson completed

In the gap, the home tab offers the **per-row practice lesson** (auto-
generated, FSRS-prioritized, no new content) so streaks don't break.

[Cepeda et al. 2008 — Spacing Effects in Learning: A Temporal
Ridgeline of Optimal
Retention](https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf)

### 3.5 First-launch / cold-start math (1 lesson/day)

Lesson 1 (a-row: あ い う え お):
- Day 1: 5 retrievals each (within-lesson)

Lesson 2 (ka-row, contains a-row in carry-over match + 1 distractor):
- Day 2 for a-row: +2 retrievals (carry-over match)
- Day 2 for ka-row: +5 retrievals (within-lesson)

Lesson 3 (sa-row):
- Day 3 for a-row: +1.5 (still in pool, weight 1)
- Day 3 for ka-row: +2 (carry-over weight 2)
- Day 3 for sa-row: +5

By **day 7** (lesson 7, na-row), the a-row kana have:
- 5 (intro) + 2 + 1.5 + 1 + 0.5 = **~10 retrievals**

The na-row kana on day 7 have just had their initial **5 retrievals**.

By **day 14** the a-row is ~14 retrievals; the na-row is ~10–11. Both
above Nation's 8–12 threshold.

For a learner who does 1 lesson every 2 days, the same math applies
but with a 2-day base lag — still within the FSRS-comfortable interval
of 2.3d after Good.

---

## 4. Edge cases

### 4.1 Retrieval vs. re-exposure semantics

**Decision**: only count an interaction as an "exposure" (in the
mastery tracker) if it was a *retrieval* — i.e. the learner had to
produce or select the kana, not just see it on a teach card. Karpicke
2008 is unambiguous: retrieval is what builds retention; restudying
does not.

Concretely in `kanaMastery`:
- `recordExposure(kana, { kind: 'retrieval' })` — counts toward the
  helper-visibility gate (currently 20 exposures ∧ interval ≥ 7d) and
  toward FSRS.
- `recordExposure(kana, { kind: 'presentation' })` — counts only
  toward UI heuristics ("seen at least once, don't show the intro
  animation again").
- The intro step emits `presentation`. Teach, match, audio-MC, and
  build emit `retrieval`.

### 4.2 5-day break

When a learner returns after a multi-day absence:
- All kana intervals are now overdue; FSRS retrievability has dropped.
- The home tab's first offer should be the **per-row practice lesson
  populated entirely from overdue items**, not the next new lesson.
- "Don't pile on" rule: cap practice lesson at **15 items** even if
  100 are overdue. FSRS will keep proposing the rest the next day.
- A returning user's break doesn't reset the within-lesson 5-retrieval
  pattern when they do enter a new lesson — only the cross-lesson
  scheduler changes.

This matches Duolingo's "Refresh" / "Personalized Practice" pattern.

### 4.3 Cold-start day 1, lesson 1

Lesson 1 has nothing to review. Spec:
- No carry-over match (skip step 13's "+2 carry-over" slot;
  match round is **5 pairs from this lesson's 5 kana** instead of 4+2).
- No recap eligibility yet.
- Same 5 in-lesson retrievals as any other intro lesson.

### 4.4 Lesson failed / aborted

If user bails mid-lesson:
- All retrievals already completed in that session count toward
  mastery.
- The lesson is **not** marked complete; reentering restarts it from
  step 1. (Acceptable since within-lesson retrievals are cheap.)
- Optional: persist mid-lesson progress as a future enhancement; not
  required for this spec.

---

## 5. Open questions for next session

1. **Does the match round count K once or K-per-pair?** Currently a
   6-pair match shows K once. If K appears in 2 pairs (kana + word
   containing kana), is that 1 retrieval or 2? Spec assumes 1; revisit
   if the data shows otherwise.
2. **FSRS state per-kana, not per-word**: Lingo is at the kana level
   while Duolingo's HLR is at the lexeme level. Verify this matches
   how vocabulary words containing the kana also reinforce it (likely
   yes — every word retrieval that uses K counts as a K retrieval too).
3. **Audio-only mini-round step count**: 4 mini-rounds (steps 5, 10
   above) interrupts the intro-teach rhythm. Consider folding them
   into the teach step itself (audio plays automatically alongside the
   MC). Saves 2 steps without losing retrievals.

---

## 6. Implementation hand-off

Files to touch:
- `src/features/lesson/data/lessonBuilder.ts` — add audio-MC mini-round
  emitter; emit carry-over match round; thread a `carryOverPool` arg.
- `src/features/lesson/data/hiraganaCurriculum.ts` — declare per-module
  recap rows + module-end markers.
- `src/features/lesson/data/generatedHiraganaLessons.ts` — emit recap
  lessons at module boundaries.
- `src/features/japanese/kanaMastery/` — split `recordExposure` into
  `retrieval` and `presentation` kinds; only retrievals advance FSRS
  state.
- New: `src/features/lesson/data/carryOverPool.ts` — pool selection
  with recency × mastery-deficit weighting.
- New: `src/features/lesson/scheduling/fsrsKana.ts` — minimal FSRS-6
  state per kana (stability, difficulty, last-review). Re-use `ts-fsrs`
  if the dependency is acceptable, else hand-roll the 21-parameter
  inference.

Test plan:
- Unit: `carryOverPool.test.ts` — given prior 2 lessons, verify pool
  size, weighting, no-duplicate-2-in-a-row rule.
- Unit: `lessonBuilder.test.ts` — for a 5-kana intro lesson, assert
  every kana hits ≥4 retrieval steps.
- Unit: `fsrsKana.test.ts` — initial stability matches FSRS-6
  defaults; same-day re-review uses heuristic path.
- E2E: simulate 7 lessons, snapshot the exposure-count distribution
  for the first-row kana — should be ≥9 by lesson 7.

---

## Sources

Duolingo:
- [Settles & Meeder 2016 — A Trainable Spaced Repetition Model for Language Learning (ACL)](https://research.duolingo.com/papers/settles.acl16.pdf)
- [duolingo/halflife-regression — code + 13M-trace dataset](https://github.com/duolingo/halflife-regression)
- [Duolingo Blog — Measuring Lesson Recall (Review Exercises)](https://blog.duolingo.com/review-exercises-help-measure-learner-recall/)
- [Duolingo Blog — How We Learn How You Learn](https://blog.duolingo.com/how-we-learn-how-you-learn/)
- [Duolingo Blog — Spaced Repetition](https://blog.duolingo.com/spaced-repetition-for-learning/)
- [Duolingo Blog — Practice Hub](https://blog.duolingo.com/guide-to-duolingo-practice-hub/)
- [Duolingo Wiki — Lesson](https://duolingo.fandom.com/wiki/Lesson)
- [Duolingo Wiki — Exercise](https://duolingo.fandom.com/wiki/Exercise)
- [Duolingo Blog — Learning to Read Japanese Characters](https://blog.duolingo.com/learning-to-read-japanese-characters/)

FSRS / Anki / RemNote:
- [Expertium — A Technical Explanation of FSRS](https://expertium.github.io/Algorithm.html)
- [Expertium — Benchmark](https://expertium.github.io/Benchmark.html)
- [open-spaced-repetition/fsrs4anki — tutorial.md](https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md)
- [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
- [Anki Manual — Deck Options](https://docs.ankiweb.net/deck-options.html)
- [RemNote Help — FSRS Algorithm](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm)
- [Borretti — Implementing FSRS in 100 Lines](https://borretti.me/article/implementing-fsrs-in-100-lines)
- [Migaku — Spaced Repetition in 2026](https://migaku.com/blog/language-fun/spaced-repetition-in-2026)
- [Anki Forums — About FSRS algorithm's "first rating"](https://forums.ankiweb.net/t/about-fsrs-algorithms-first-rating/50055)

Memory / pedagogy:
- [Karpicke & Roediger 2008 — The Critical Importance of Retrieval Practice (Science)](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Karpicke-Roediger-2008_Sci.pdf)
- [Karpicke 2007 — Repeated retrieval during learning is the key to long-term retention](https://learninglab.psych.purdue.edu/downloads/2007/2007_Karpicke_Roediger_JML.pdf)
- [Cepeda et al. 2008 — Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention (Psych Sci)](https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf)
- [Tabibian et al. 2019 — Enhancing human learning via spaced repetition optimization (PNAS)](https://www.pnas.org/doi/pdf/10.1073/pnas.1815156116)
- [Nation 2001 — Learning Vocabulary in Another Language (Cambridge)](https://www.cambridge.org/core/books/learning-vocabulary-in-another-language/491314AA1B451AD04F3536000F1C9F0D)
- [Karpicke 2018 — Retrieval-Based Learning: A Decade of Progress (ERIC)](https://files.eric.ed.gov/fulltext/ED599273.pdf)
- [Roediger & Karpicke 2006 — The Power of Testing Memory (PoPS)](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf)
- [Nakata & Suzuki 2019 — Effects of Blocking, Interleaving, and Increasing Practice (MLJ)](https://yuichisuzuki.net/wp-content/uploads/2023/04/Nakata-Suzuki-2019-MLJ.pdf)
- [Pan & Carpenter 2023 — Forward Testing Effect (review)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3983480/)
