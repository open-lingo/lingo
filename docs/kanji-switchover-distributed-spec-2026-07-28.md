# Variant G — the switchover beat, distributed across review tails

Working spec for simulation + critique. Spencer, 2026-07-28, on variant E:

> "step 2 then 1 and then the mcq, spaced out inside the reviews might be
> good? can we dynamically add those in some way and just make review tails
> the three steps longer that would be? might feel chunky but we can do it
> max 1 review at a time?"

Two changes to variant E: **reorder** (reveal first, retrieval second) and
**distribute** (the beats are spread across successive review tails instead of
firing back-to-back in one lesson).

---

## 1. The case

The learner has known ともだち by sound and meaning since m3. At m19 the
character pair 友達 becomes eligible. Nothing about the *word* is new — only
its written form. 112 such events exist in the course; median gap between
"word taught" and "kanji eligible" is 11 modules.

## 2. Trigger

A word enters the switchover queue when ALL of:

1. `learnerModule >= unlockModule` — the component glyphs have been taught.
2. The word card's SRS interval `>= 14 days` — the learner demonstrably knows
   the word. (`MASTERED_INTERVAL_DAYS` is 21; 14 is deliberately lower so the
   word still has review traffic to carry the beats.)
3. The triggering answer was **correct**.

Once fired, the switch **latches** — it must never revert. A pure predicate on
the current interval would un-write the kanji after a lapse, which is the
single most-reported complaint about Duolingo's kanji behaviour.

## 3. The three beats, in order

Spaced across successive review tails. Review tails today are **3 steps**
(4 when the struggle store has >6 entries) and sit just before the wrap-up
step, so the learner's last interaction is a retrieval.

| # | Beat | Step | What it does |
| --- | --- | --- | --- |
| 1 | **Reveal** | new `kanji_reveal` | ともだち → 友達, gloss, component glyphs where honest. Ungraded. |
| 2 | **Retrieval** | `kanji_reading` | 友達 shown bare, four kana options, pick the reading. |
| 3 | **Recognition in context** | `multiple_choice` | "Which one means *friend*?" — 友達 among four kanji words. 友達 must be the CORRECT option. |

After beat 3 the word is latched: it renders as 友達 everywhere, with furigana
for a window measured from the **latch date** (not the module), so a
late-latching learner never meets the bare form cold.

## 4. Distribution rule

- **At most one beat per review tail.** The tail grows from 3 steps to 4.
- **At most one word in flight at a time.** Word W finishes all three beats
  before word X starts. This is the "max 1 review at a time" constraint.
- Beats are **not** adjacent: W's reveal lands in one lesson's tail, its
  retrieval in a later one, its context MCQ later still.

### Worked example — 友達, learner at m19

```
ja-m19-a-1  tail: [match, build, REVEAL 友達]          ← beat 1
ja-m19-a-2  tail: [match, build, listen]               (rest)
ja-m19-a-3  tail: [match, READ 友達→ともだち, build]     ← beat 2
ja-m19-b-1  tail: [match, build, listen]               (rest)
ja-m19-b-2  tail: [MCQ "which means friend", match…]   ← beat 3
                                                        → 友達 latches
```

## 5. The capacity problem (must be resolved before building)

112 words × 3 beats = **336 beat-slots**. At most one beat per lesson tail, and
tails only exist on row sub-lessons (skipped for `-test` and `-recap`).

Kanji recognition starts at m8, so only m8–m29 lessons can host beats. The
course is 427 lessons across 30 modules. **If the hostable subset is smaller
than 336, the queue cannot drain** and later words never complete their beats.

Options if it does not fit:
- allow 2 words in flight,
- drop to 2 beats for low-frequency words (reveal + retrieval, skip context),
- or let the tail-end words get beat 3 only (passive exposure, no reveal).

## 6. FINDINGS — the spec above is now known to be wrong in three places

Written after probing the code and running two learner simulations against
§1–§5. Kept above unedited so the corrections below are legible.

### 6a. The proposed host does not exist (measured, twice)

**Review tails do not occur anywhere kanji lives.** `augmentWithReviewTail`
requires the lesson's rowId to be in `ALL_ROWS`, which is
`HIRAGANA_ROWS + DAKUTEN_ROWS + YOON_ROWS` — kana rows only. Confirmed by the
guard (0 tail-eligible lessons at m8+) and confirmed empirically on the
compiled course (**0 of 294 m8+ lessons carry a review-tail step**). Tails
exist only in m1–m2, 54 lessons, all of them before kanji recognition starts
at m8.

So "just make the review tails longer" cannot be built as written. Candidate
hosts instead: the 294 ordinary m8+ lessons, or the 44 derived SRS review
lessons (`ja-mN-review-1/2`, 2 per module m8–m29) — the latter are
per-learner already, which fits the SRS trigger, but their length is
learner-dependent and was not measurable with an empty card store.

### 6b. The capacity math does not close

112 words × 3 beats = 336 slots. Against the 294 ordinary m8+ lessons that is
**1.14 beats per lesson** — i.e. more than one per lesson on average, so "max
one beat per lesson, one word in flight" **cannot drain the queue**. Against
the 44 review lessons it is not close at all. Either the beat count per word
drops, more than one word runs in flight, or most words get only passive
exposure.

### 6c. The ungraded reveal gets skipped — by both simulated learners

This is the finding that matters most, because both personas hit it
independently and for the same reason:

- Steady learner: *"it doesn't feel like a lesson, it feels like a
  notification I half-read"* — three seconds, moved on.
- Impatient learner: *"ungraded = 'not going to be tested on this' in my head,
  so I tap past it."*

Consequence: **beat 2 silently becomes the learner's first real encounter with
the form** — cold — which is exactly what the spec was designed to prevent.
An ungraded step cannot carry teaching weight in an app where everything else
is graded.

Both also reported the spacing did no work. The steady learner had forgotten
the reveal by beat 2 and answered off residual familiarity with 友 (drilled
since m8), not recall. The binge learner collapsed all five lessons into ~15
minutes, so no forgetting curve was crossed and the intervening steps were
*"padding I tap through, not spacing that does pedagogical work."*

### 6d. Two problems neither the spec nor I had considered

1. **The 14-day trigger reads as unfair.** With messy intervals a word known
   since m3 can oscillate at 12–13 days indefinitely and never latch, while a
   shakier word rides a lucky gap past 14 and gets its kanji first. From
   inside the app: *"the word I've known since m3 stays baby-hiragana forever
   while some word I half-guessed right gets its kanji."* The latch was
   designed to stop unfairness on the lapse side; this reintroduces it on the
   trigger side.
2. **The whole mechanism is invisible.** Nothing announces the latch, and
   nothing exposes the trigger. The steady learner called a permanent,
   irreversible switch off one correct answer *"the scariest line in here."*

### 6e. One assumption inverted

I expected the reveal to earn its slot most where a component gloss is
possible (友達) and least where it is not (猫). The steady learner reported
the opposite: for 猫 the reveal was *more* worth it, because there is no shape
to guess from and it is the only warning the learner gets. Its job is
"brace yourself," not "learn this" — and the spec should own that rather than
dress it as teaching.

### 6f. Underspecified, and it changes what is being tested

Beat 3's distractors are not defined. If they are other already-switched kanji
words it is a reading test; if they are unseen kanji it is a meaning test the
learner can solve by elimination without reading anything. The impatient
learner solved it *"without the kanji itself mattering."*

---

## 7. What to attack

This spec is deliberately unhedged so it can be argued with. The open
questions:

1. Does reveal-then-retrieve-then-recognize, spaced across sessions, actually
   beat doing all three back-to-back in one lesson?
2. Does a 3-step tail growing to 4 read as "chunky"? Spencer already suspects
   it might.
3. Is one word in flight too slow, given the capacity math above?
4. Is the reveal (beat 1) load-bearing at all, or does a learner who already
   knows the word get everything they need from beats 2 and 3?
5. Component glosses are only honest for some words (友 = friend is clean;
   達 is a pluralising suffix). Is a partial-gloss reveal better or worse than
   no gloss?
