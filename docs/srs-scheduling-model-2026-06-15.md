# SRS Scheduling Model — Phase 2 spec (2026-06-15)

**Status:** ACTIVE spec. Supersedes the scheduling decisions in
`retention-architecture-design-2026-06-13.md` (§4 "do not seed-at-unlock",
§6 D7 "new-card cap adaptive — DECIDED", §8 "seed-at-unlock is a trap").
Those decisions assumed a throttled-intake architecture; this spec changes
the architecture to **show-all-due + course-self-covers-review**, which
invalidates their premises (detailed in §6 below).

**How we got here:** Phase 1 (course deck → reviewer) shipped + verified
live (`useSubscriptionQueue.ts`). Verifying it surfaced a seed-on-load that
exposed the real question — *what is the intended intake/scheduling model?*
Resolved with Spencer + an inline research pass (§5). This spec is the
consolidation.

---

## 1. The model in one paragraph

There is **one unified FSRS schedule** for everything reviewable (vocab,
grammar, sentences; kana scheduled-but-not-surfaced). **Review is woven
through the course itself** — every content sub-lesson's review-tail steps
write FSRS (reviewing *prior* atoms, spaced), and each content module ends
with **non-skippable** review lessons that consolidate. Because review
scales with lessons, a normally-paced learner clears ~100% of their reviews
*inside the course*. The standalone flashcard reviewer is a **supplement**
(quest-driven), defaulting to **all-due, no new-card cap** — lesson
progression *is* the intake throttle. A word becomes reviewable the **day
after** it's unlocked, never same-day.

## 2. Decisions (D1–D8)

- **D1 — One unified scheduler.** Fold Track A (vocab, `open-lingo-srs:v2`),
  Track B (grammar, `open-lingo-srs-grammar:v1`), and sentences into a
  single store + scheduler. Anything with an SRS component is a card-type in
  one deck system. **Kana glyphs are scheduled but not surfaced** as a
  reviewable deck (their surface is the alphabet trainer); kana scheduling
  **ages out ~M3** (katakana later) once exposure is sufficient.

- **D2 — Prior-atom review woven into content sub-lessons is the primary
  FSRS write.** ✅ **SHIPPED 2026-07-01, vocab-only** — implemented as a
  per-ATOM gate rather than a step marker: `shouldWriteContentReviewAtom`
  (`lesson/data/reviewTailSrs.ts`) writes Track A iff the atom's
  `fromModule` is strictly earlier than the lesson's module AND the atom
  isn't introduced by this lesson/cluster (probe over all 78 M3–M7
  sub-lessons: zero bad writes, 71 write ≥1 prior-atom review). Track B
  grammar stays review-lesson-gated (grammar review is getting a separate
  flashcard deck — open task). Pre-ship analysis below kept for the
  record. ⚠️ **REVISED after ralph — the tails this assumed don't
  exist for vocab.** `augmentWithReviewTail` (`mockLessons.ts:709-718`) and
  `withKanaReviewTail` (`kanaReviewTails.ts`) are **kana-only** (both bail
  unless the lesson's `rowId` is a real hiragana row in `ALL_ROWS`), emit
  `symbol_recognition` over **kana glyphs** (not SRS-eligible), and carry
  **no `exercisedAtoms`** (confirmed in `buildReviewTailSteps.ts`). So the
  lever is **NOT** "drop the `LessonPage.tsx:488` gate." Dropping it would
  instead make content lessons' **current-atom** practice steps (which DO
  carry `exercisedAtoms`, on the *just-introduced* words) write FSRS =
  **same-day grading**, violating D6 and the very reason the gate exists.
  The actual work: **author/generate a vocab prior-atom review tail**
  (the analogue of the kana tail) whose steps carry `exercisedAtoms` on
  **prior** atoms, and write FSRS for **those tail steps only** — keep
  excluding current-atom practice. The new gate is **step-scoped** (is this a
  prior-atom review step?), not lesson-scoped. This is real generative work,
  not a one-line gate removal. (See §3 — the capacity math still holds *once
  the tail exists*.)

- **D3 — Review lessons gate progression (non-skippable).** Each content
  module (m3–m28) has 2 review lessons; they currently DON'T gate
  (`moduleProgress.ts:getModuleStatus` filters `isContentLesson`). Make the
  unlock chain require them, so "users review in-course" is *enforced*, not
  suggested. (m1/m2 kana have none — correct, no-SRS-for-kana.)

- **D4 — Seed-on-unlock → due *next day*.** When a word unlocks (content
  lesson completion), schedule it into FSRS with first review **the next
  day**, never same-day. This replaces the build-time `setCardState`
  side-effect in `buildSrsReviewLesson.ts:143-145` (which seeds due-*today*
  — the exact same-day antipattern) with a proper unlock-event scheduler. It
  makes "every unlocked word is reviewable" universal and gives a clean
  same-day guard (a word unlocked today is not due until tomorrow).
  ⚠️ **Confirmed after ralph:** `createInitialState`/`createInitialSubState`
  set `dueDate: today` (`engine/srs.ts:90-101`), so the next-day offset must
  be **explicit** (seed with `dueDate = unlock-day + 1`) — it is NOT free.
  **D4 is the single state-creating write**; later in-course reviews and
  reviewer grades only *advance* it. (This resolves the D4-vs-
  "write-on-first-review" wording in §7: there is no separate first-review
  write — unlock seeds, everything after advances.)

- **D5 — Reviewer default: show all due, no new-card cap.** Lesson pace +
  in-course review is the throttle (§3, §5). The Phase-1 adaptive new-card
  cap becomes **off by default**. Provide an **optional** user "max
  reviews/day" — the right knob is capping *review load*, not intake.

- **D6 — First review never same-day.** Cepeda 2006: optimal first gap ≈
  overnight for weekly retention; same-day re-test is too easy to be
  worthwhile. Applies to both the reviewer and in-course review tails (they
  must target prior atoms, not the lesson's just-introduced ones).

- **D7 — FTUE: one-time ~5-word sample.** Introduce the flashcard surface
  once with a small sample; after that, the standalone reviewer is
  quest-driven and optional.

- **D8 — Standalone reviewer = supplement, quest-driven.** Not lesson-
  embedded. The daily "Review N" quest (now auto-seeded server-side after
  the lingo-core pull, `220004b`) is the driver.

## 3. Why the course can self-cover review (the numbers)

- Words introduced per content module: **~20–37** (m3=21, m7=27, m8=37…;
  518 atoms total, ~26 modules).
- FSRS-*writing* capacity if **review lessons only** (today): 2 lessons ×
  `MAX_ATOMS=18` = 36 slots, but only `MAX_NEW=5`×2 = **~10 new-to-SRS/
  module** → **deficit vs ~20–37 introduced** (latent today, masked by the
  seed-on-load bug force-seeding everything as due).
- FSRS-writing capacity **with D2** (sub-lesson tails count): ~7–14
  sub-lessons/module × review-tail steps ⇒ dozens of review-touches/module
  ≫ introduction. Intake ≥ introduction → **no structural backlog**; "100%
  via course at normal pace" becomes achievable.

## 4. Implied code changes (file:line)

1. `LessonPage.tsx:488` — remove `isReviewLesson` gate; FSRS write fires for
   any step where `shouldWriteSrs(step)` is true (TEACH excluded,
   `exercisedAtoms` required). **Verify review-tail steps carry
   `exercisedAtoms` pointing at PRIOR atoms** (else D2 writes nothing/wrong).
2. `moduleProgress.ts:getModuleStatus` — include review lessons in the
   unlock chain (D3). Reconcile with `getCurrentModuleIndex` (already counts
   all lessons).
3. `buildSrsReviewLesson.ts:143-145` + `:246-248` — remove build-time
   `setCardState`/`setGrammarCardState` side-effects (make construction
   pure); seeding moves to the D4 unlock-event scheduler.
4. New: unlock-event scheduler — on content-lesson completion
   (`unlockLessonAtoms`), schedule unlocked atoms due next-day.
5. `useSubscriptionQueue.ts` (Phase 1) — default to all-due, no new-card cap
   (D5); wire optional `flashcards.maxReviewsPerDay`.
6. D1 store unification — one store + migration from the 3 existing keys,
   preserving sync (`srsSync.ts`).

## 5. Research basis (inline pass, 2026-06-15)

- **Anki new-card cap = substitute for absent external pacing.** Anki
  manual: review load ≈ **10× new-card rate**; the cap exists because Anki's
  source is an unbounded pile + user impulse ("users… overwhelmed by the
  reviews required"). **We have lesson-pacing**, so the cap is redundant by
  default → D5.
- **Cepeda 2006 / spacing:** first gap ≈ overnight for weekly retention;
  expanding > fixed intervals; same-day too easy → D4, D6.
- **Reference decks (Spencer's Anki, retention doc §9):** word+sentence+audio
  +image triad; **Listening** is a first-class modality everywhere — flagged
  as a future 3rd modality (open Q).

## 6. What this supersedes (and why the old reasoning fails)

`retention-architecture-design-2026-06-13.md`:
- **§4 "Do NOT seed-at-unlock"** → SUPERSEDED. Its objection ("seed
  due-later → invisible AND not unseen intake → never surfaces") assumed the
  throttle architecture. Under **show-all-due (D5)**, a card seeded
  due-next-day **surfaces next day as due** — exactly intended.
- **§6 D7 "new-card cap adaptive — DECIDED"** → SUPERSEDED by D5 (no cap
  default; optional review-load cap).
- **§8 "Seed-at-unlock is a trap"** → REFINED: seed due-*today* is the trap;
  seed due-*next-day* under show-all-due is correct (D4).

## 7. Open questions / risks (attack surface)

1. **Same-day guard mechanism:** D4 seed-next-day vs unlock-timestamps — does
   `createInitialState` need an explicit first-due offset? Confirm FSRS
   new-card semantics don't surface a word same-day.
2. **Review-tail `exercisedAtoms`:** do current tail steps actually tag
   PRIOR atoms? If not, D2 mis-grades or no-ops. (Blocking verification.)
3. **Double-grading:** if a sub-lesson tail and a review lesson grade the
   same atom the same day, dedup? (massed, low-value.)
4. **Kana aging-out:** mechanism + exact cutoff for "stop scheduling kana ~M3"
   (and katakana). Curriculum-driven, not memory-driven.
5. **Store migration (D1):** 3 keys → 1 without losing existing users'
   schedules; preserve delta-merge sync.
6. **Missed-days / binge pile-up** under no-cap: covered by the optional
   review cap, but confirm the default UX for a returning learner with a big
   due pile (the reviewer, not the course, eats it).
7. **Listening modality:** add as a 3rd FSRS modality (reference decks all
   have it; we TTS-generate audio already)?
8. **D3 gating UX:** does forcing review lessons before the next module
   unlock create a wall that hurts momentum? (Tune vs hard-gate.)

## 8. Ralph hardening pass (2026-06-15)

**Confirmed holes (file:line), now folded into D2/D4 above:**
1. ⛔ **D2 was false-premised (BLOCKING).** No prior-atom review tail exists
   for vocab. `augmentWithReviewTail` (`mockLessons.ts:709-718`) +
   `withKanaReviewTail` (`kanaReviewTails.ts:86-105`) are kana-row-only and
   emit `symbol_recognition` over kana glyphs with **no `exercisedAtoms`**;
   `buildReviewTailSteps.ts` tags none either. Dropping `LessonPage.tsx:488`
   alone would write same-day grades from current-atom practice. → D2
   rewritten: author a vocab prior-atom tail; gate becomes step-scoped.
2. ✅ **D4 same-day guard is not free.** `createInitialSubState`
   (`engine/srs.ts:90-101`) → `dueDate: today`. Next-day offset must be
   explicit. → noted in D4.
3. ✅ **D4 vs "write-on-first-review" reconciled** — D4 seed is the single
   creating write; no double-write. No conflict.

**Verified load-bearing claims (all true):** `LessonPage.tsx:488`
`isReviewLesson` gate ✔; `moduleProgress.ts:62-78` `getModuleStatus`
content-only filter ✔; `buildSrsReviewLesson.ts:143-145` build-time
`setCardState` ✔; per-module atom counts ~20–37 vs `MAX_NEW=5`×2 ✔.

**Docs to reconcile (assert the now-superseded "SRS writes only in review
lessons / content sub-lessons are pure introduction" rule):**
- `CLAUDE.md` → "SRS engine (invariants)" bullet ("writes happen in review
  lessons AND on the flashcard reviewer — NOT in content sub-lessons").
  Refine to: *current-atom practice never writes; prior-atom review-tail
  steps in content sub-lessons DO (D2).*
- `docs/lesson-authoring-guide.md` §13 (grading=review-only) — same refinement.
- `feedback_srs-write-scope` (auto-memory) — same.
- `buildSrsReviewLesson.ts` end-card copy + `_stepPredicates.ts`
  `shouldWriteSrs` comments — re-scope to step-level, not lesson-id-level.

**Still open (not resolvable from code alone — need Spencer/design):**
kana aging-out mechanism (§7.4); D1 store-migration plan (§7.5); D3 gating
UX hard vs soft (§7.8); Listening modality (§7.7).

## Changelog
- 2026-06-15: created; ralph pass v1 — D2 rewritten (false-premised tail
  assumption → author vocab prior-atom tail; step-scoped gate), D4 explicit
  next-day offset noted, docs-to-reconcile list added. Net: the model holds,
  but D2 is **more work than a gate removal** — that's the headline.
- 2026-06-15: **D4 + D5 SHIPPED** (`2756331`). D4: `createSeededState` +
  `seedUnlockedAtomsDueNextDay`; `buildSrsReviewLesson` made pure. D5: reviewer
  default no-cap + `flashcards.maxNewCardsPerDay`. tsc + 599 tests + live
  Playwright (store stays empty on reviewer load; New:8/Due:0 vs old Due:8).
  Remaining: **D3** (needs hard-vs-soft call), **D2** (vocab tail generator),
  **D1** (store unify), **D7** (FTUE). See `docs/archive/handoff-2026-06-15.md`.
