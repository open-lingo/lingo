> **Status: ARCHIVED — SUPERSEDED by srs-scheduling-model-2026-06-15.md.** Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Retention Architecture — Design Proposal (2026-06-13)

> ⚠️ **PARTIALLY SUPERSEDED (2026-06-15).** The intake/scheduling decisions
> here — §4 "do not seed-at-unlock", §6 **D7** "new-card cap adaptive", §8
> "seed-at-unlock is a trap" — are **superseded** by
> `srs-scheduling-model-2026-06-15.md`. That spec changes the architecture to
> **show-all-due + course-self-covers-review** (sub-lesson review steps write
> FSRS, review lessons gate, seed-on-unlock→next-day, reviewer all-due/no-cap),
> which invalidates the throttle-architecture premises those decisions rested
> on. The Track-A/B analysis, current-state map, and reference-deck findings
> below still stand. Read the new spec first.

**Status:** DRAFT for review. No code changed. Author: walkthrough/retention analysis session.
**Goal Spencer set:** "make sure people don't forget the things we teach them." The app is polished and structured; this doc is about *durable memory*, not UI.

---

## 1. Problem in one sentence

We have a real spaced-repetition system for **vocabulary recognition** (the lowest-value retrieval tier), and **no scheduler at all** for **grammar and sentence-level production** (the highest-value retrieval tier). The architecture is inverted relative to what drives durable memory.

---

## 2. Current-state map (code reality, file:line)

### 2.1 There is exactly one reviewable unit: the atom
- `CourseAtom.kind = "vocab" | "particle" | "phrase"` — `courseAtoms.ts:24`. 716 vocab, 9 particle, 24 phrase.
- FSRS tracks each atom with two modalities (recognition + production), target retention 0.95 — `srs.ts:40`, `srs.ts:104-112`.
- **No grammar/pattern unit exists.** Te-form, ます-form, past tense, い-adj conjugation, は-vs-が, particle *usage* are taught + drilled in lessons but are **not** tracked or scheduled by anything.

### 2.2 Three on-ramps put an atom into FSRS scheduling
1. **Placement test** — bulk-seeds passed modules' atoms as "learning," due today (`applyPlacement.ts:84`).
2. **Lesson review nodes** (`ja-mN-review-1/2`) — create state on render + grade on completion (`buildSrsReviewLesson.ts:128-132`, `LessonPage.tsx:498-502`).
3. **Flashcard reviewer** — injects *unlocked* atoms (even with no FSRS state) as new cards; rating writes FSRS state (`courseDeck.ts:125` → `useFlashcardDueSummary.ts:107` → `FlashcardTester.tsx:226`).

`unlockLessonAtoms` writes **no** FSRS state — only an "unlocked" flag in a separate store (`unlockLessonAtoms.ts:39-66`, key `lingo:unlocked-atoms`).

> **Correction to a stale doc:** CLAUDE.md's "SRS writes happen ONLY in review lessons" is **factually wrong** — the flashcard reviewer is an independent SRS write surface. Fix the invariant text.

### 2.3 Two parallel "due" schedulers that share no state
- **System A — per-module calendar** (`moduleReviewSchedule.ts`, store `lingo_module_reviews_v1`): one stage 0→5 per module, fixed intervals 1/3/7/14/30/90d, bumped by completing a review *node*. Drives the "🔄 N reviews due" chip. **Performance-blind** — the ★ graduates on a calendar regardless of whether atoms stuck.
- **System B — per-atom FSRS** (`srs.ts`, store `open-lingo-srs:v2`): adaptive, per-atom-per-modality. Drives flashcards + review-node card selection.
- They don't reinforce each other: flashcards advance B but not A; review nodes advance both. The module ★ can lie (graduate while FSRS shows the cards failing).

### 2.4 Review lessons only ever produce vocab-anchored steps
`buildSrsReviewLesson` `pickRecognitionStep` = vocabMcq / listeningComp; `pickProductionStep` = `speaking(target.kana)` / `build(target.kana…)` (`buildSrsReviewLesson.ts:59-108`). The scheduled target is always a vocab atom; recognition/production are two modalities of the *same word*. "Produce a sentence applying a grammar rule" is never the tracked thing.

### 2.5 No forgetting-curve urgency
`isDue` is binary (`srs.ts:225`). No overdue-weighting, no decay-aware prioritization, no daily-review forcing function for flashcards (only the coarse module chip).

---

## 3. The inversion (why this matters)

Per `learning-science-foundation-2026-05-17.md` §4.1, retrieval strength is **free/cued recall (build, translate, speak, cloze) ≫ recognition (word flashcards)**. Today:
- The **recognition** track (word flashcards) has full FSRS rigor.
- The **production + grammar** track (the high-value one) has *no* scheduler — it's faked by the blind module calendar + opportunistic step generation around due vocab.

So the half of the curriculum that matters most for durable memory is left to chance.

---

## 4. Proposed architecture: two complementary SRS tracks

Keep them **separate** (per Spencer). Both adaptive (FSRS-style), tracking different unit types, surfaced differently.

| | **Track A — Vocab cards** | **Track B — Grammar & production** |
|---|---|---|
| Unit | vocab/particle/phrase atom | grammar point / sentence pattern |
| Surface | word flashcards + review steps | lesson-style steps (cloze, build, translate, speak, listen) — "sentence reviews" |
| Retrieval | recognition + single-word production | cued/free recall (highest tier) |
| Scheduler | FSRS per-atom (exists) | FSRS per-grammar-unit (NEW) |
| Status today | ✅ scheduling works; needs an engagement driver | ❌ no scheduler at all |

### Track A fixes (small) — CORRECTED after feasibility check
**Do NOT seed-at-unlock.** ⛔ *SUPERSEDED 2026-06-15 (`srs-scheduling-model-2026-06-15.md` §6): the "due-later → never surfaces" objection assumed throttled intake; under show-all-due, seed-on-unlock→next-day is the correct mechanism.* — Adversarial check against `reviewQueue.ts:49-66` + `countCardsDue:148-166` shows the queue already separates cards correctly: **no FSRS state → "unseen" → throttled to `newCardsPerDay` (default 5)**; **has state + due → uncapped review pile**. Seeding FSRS state at unlock would break this throttle — seed due-today and you flood the review pile with hundreds of cards; seed due-later and the card is invisible *and* no longer counts as unseen intake, so it never surfaces. The current lazy model is the right one, and `countCardsDue` already returns an honest "today's load" = `dueReviews + min(unseen, newCardsPerDay)`. (This reverses my earlier claim that seed-at-unlock was the root fix and a quest prerequisite — it is neither.)

The real Track A gaps are **engagement and throughput**, not scheduling:
- **No forcing function** drives the learner to clear the daily queue (the only nudge is the coarse module chip). → the daily quest below.
- **New-card cap vs lesson velocity:** lessons unlock ~4–8 atoms/day; intake is ~5/day, so a slow-draining backlog of unseen atoms forms. Consider making `newCardsPerDay` adaptive to unlock rate, or surfacing the unseen-backlog size so the learner sees the debt. *(Backlog is intentional throttling — not a bug — but it should be visible and tunable.)*

### Track B (the new work) — the unit ALREADY EXISTS
- **The registry is already there:** `src/features/lesson/data/n5-grammar-points.json` — **93 grammar points**, each with `id`, `point`/`pointEn`, `category` (particle/…), `module`, `status` (shipped/planned), and a `dependsOn` prerequisite graph. It's conformance-tested (`moduleConformance.test.ts:27`). So Track B is **not** "invent a unit" — it's "attach FSRS scheduling to the grammar points that are already enumerated and dependency-ordered." Schedule a card per shipped grammar-point id; it renders **only** as lesson-style steps (cloze/build/translate/speak), never a word flashcard.
- **Tag exercises.** Steps already carry `exercisedAtoms`; add `exercisedGrammar` (grammar-point ids) so a cloze/build/translate/speaking step credits the point it tests. Many steps already map to a grammar point via the curriculum's `grammarRule` ids — wire that through.
- **Surface:** the **lesson-style review machinery**, NOT the flashcard reviewer. Production (cloze/build/translate/speak) already exists as lesson *step views* and is the right home — building a sentence is not a flashcard interaction (Spencer 2026-06-13). Track B extends `buildSrsReviewLesson` to pull due grammar points (alongside vocab) and emit the grammar-appropriate steps. The flashcard reviewer stays pure quick-recall (Track A vocab only).
- **Scheduler replaces System A:** the per-module calendar becomes a *derived view* of Track B due-state ("module N has ≥k due grammar points") instead of a blind clock. Closes the performance-blind ★ problem — and the `dependsOn` graph means you can avoid resurfacing a point whose prerequisites aren't mastered.

### Cross-cutting
- **Daily-review quest (Spencer's idea):** daily quest "Review N cards" (N≈20), target = `min(N, countCardsDue())`, **auto-complete when caught up** (`countCardsDue() == 0` → today's due + today's new allotment cleared), **swap to another quest when nothing's due**. `countCardsDue` (`reviewQueue.ts:148`) already gives the honest number — **no seed-at-unlock needed**; "caught up" honestly means "cleared today's scheduled load," even with a throttled backlog behind it (correct pedagogy — don't dump 200 cards). Count due reviews + capped new intake, across *both* tracks, and credit review-node atom-gradings too so either surface satisfies the quest (unifies surfaces at the engagement layer). Reuses shipped quest infra (`app/quests/logic.py`, "cards" unit exists). **Verify** flashcard reviews emit the event the quest pipeline consumes (the doc says it advances on "review" — confirm the flashcard path, not just lesson grading, fires it).
- **Decay-aware prioritization** so lapsed learners get the most-overdue items first, with urgency signaling. (Note: `isDue` is binary today — `srs.ts:225` — and the review pile is sorted by *difficulty*, not overdue-ness — `reviewQueue.ts:63`. Overdue-weighting is net-new.)
- **Fix the stale CLAUDE.md invariant.**

---

## 5. Phasing (proposed build order — revised)
1. **Daily review quest + visible backlog** (Track A engagement) — the forcing function. Cheapest, highest immediate retention ROI, reuses shipped quest infra, no schema change. Ship first.
2. **New-card-cap tuning** (adaptive to unlock rate) — small, removes the backlog drag.
3. **Track B v1** — define the grammar unit + `exercisedGrammar` tagging + a minimal sentence-review surface; schedule with FSRS. The big build.
4. **Replace System A** with a derived view of Track B; fix the stale CLAUDE.md invariant.

(Seed-at-unlock removed — see §4; it was harmful, not foundational.)

---

## 6. OPEN DECISIONS (recommended default in **bold**; ⚑ = genuinely needs Spencer's call)
- **D1 — Grammar unit representation.** Rec: **schedule the existing `n5-grammar-points.json` registry** (93 points, module-tagged, `dependsOn` graph) — do NOT add a `CourseAtom.kind:"grammar"` (that would leak grammar into the word deck via `isSrsEligibleAtom`/`buildJaCourseDeck` and trip the `moduleConformance` asserts). The registry already exists and is conformance-tested — Track B keys FSRS state by grammar-point id. Lowest-risk path, off the vocab deck entirely.
- ✅ **D2 — Grammar unit granularity — DECIDED.** **Per-rule** for Track B SRS scheduling ("te-form" = one unit). The sub-pattern specifics (う/つ/る→って, む/ぶ→んで…) get drilled in a **dedicated Conjugation Trainer** (new feature, §10) with focused teaching — *outside* the normal lesson flow — rather than fragmenting the SRS scheduler.
- ✅ **D3 — Sentence/grammar surface — DECIDED (corrected).** **Lesson-style review, NOT the flashcard reviewer.** Building/producing a sentence isn't a flashcard interaction (Spencer 2026-06-13) — it lives in the existing lesson step views (cloze/build/translate/speak) via the review-lesson machinery. Flashcards stay quick-recall (Track A vocab). (Reverses the earlier "deck inside FlashcardTester" rec.)
- ✅ **D4 — Credit rules — DECIDED.** A completed sentence review counts as a **full word review** (full FSRS credit) for each vocab atom it contains, *and* advances the Track B grammar unit. Sentences pull double duty — they are the production rep for their vocab.
- **D5 — Daily quest N + sources.** Rec: **N=20, capped at `countCardsDue()`; both flashcard reviews AND lesson review-node atom-gradings count.** Matches your "auto-complete if caught up / swap" exactly.
- **D6 — Backend scope.** Rec: **piggyback the local-first SRS store with a new key namespace** (`open-lingo-srs-grammar:v1`) mirroring `srsSync.ts` delta-merge, so Track B doesn't block on backend. ⚠ **REVISED DIRECTION (Spencer 2026-06-14):** separate SRS stores are fragmentation — eventually fold grammar (and sentence) items into the **deck system as card types** so everything SRS schedules + syncs through ONE path. The `open-lingo-srs-grammar:v1` store is a deliberate stopgap; migrate it into a "grammar deck" when we do more grammar SRS. See `docs/followups.md` → "SRS storage unification".
- ✅ **D7 — engagement vs throttle — DECIDED.** ⛔ *SUPERSEDED 2026-06-15: no new-card cap by default (lesson pace is the throttle); optional user max-reviews/day instead. See `srs-scheduling-model-2026-06-15.md` D5.* Backlog **visible** to the learner ("N queued, 5/day") + new-card cap **adaptive** to unlock rate.

---

## 8. Feasibility findings from the hardening pass (implementer risks)
- **Seed-at-unlock is a trap** — breaks the new-card throttle (`reviewQueue.ts:49-66`). Don't. ⛔ *SUPERSEDED 2026-06-15: seed due-**today** is the trap; seed due-**next-day** under show-all-due is correct (`srs-scheduling-model-2026-06-15.md` D4).*
- **Track B must stay off the word-deck path** — `buildJaCourseDeck` includes everything `isSrsEligibleAtom` passes (→ D1).
- **`moduleConformance` + `m[3-7]` range-hardcode landmine** — atom-shape/module-range changes must update the conformance suites in lockstep (they stop at M7 — see the coverage-gap follow-up).
- **Quest event source unverified** — confirm flashcard ratings (not just lesson grading) feed the quest "review" metric before D5 is real.
- **`isDue` is binary + review sorted by difficulty, not overdue-ness** (`srs.ts:225`, `reviewQueue.ts:63`) — decay-aware prioritization is net-new code.

---

## 7. Research basis
Cepeda et al. 2006 (spacing ratio), Roediger & Karpicke 2006 (retrieval-type hierarchy), Sweller 2019 (CLT — don't fatten lessons), Birnbaum 2013 (interleave-after-encode), Diekelmann & Born 2010 (sleep → spread sessions), Nation (~8–15 encounters for durable vocab; lessons supply ~5–7, SRS carries the rest). Full mapping in `learning-science-foundation-2026-05-17.md`.

---

## 9. Reference-deck analysis (Spencer's Anki collection, 2026-06-13)

Analyzed `~/Library/Application Support/Anki2/User 1/collection.anki2` (read-only copy). Relevant decks: **Core 2000**, **Core 2k/6k Optimized (JouzuJuls)** = note type "Japanese Vocab Dynamic" (5,997 notes), **iKnow! Vocabulary / iKnow! Sentences**, Migaku, plus YouTube/podcast mining.

**Field structures observed:**
- *Japanese Vocab Dynamic* (one note = whole package): `Expression, Meaning, Reading(+pitch-accent SVG), Audio, Sentence, Sentence-Kana, Sentence-English, Sentence Audio, Image_URI`. Templates: **Listening, Reading**.
- *iKnow! Vocabulary*: `Expression, Reading, Meaning, Audio, Image`. Templates: **Listening, Production, Reading**.
- *iKnow! Sentences* (SEPARATE note type — the sentence is the unit): same fields, sentence in `Expression`. Templates: **Listening, Reading**.
- *Core 2000*: rich — `Vocabulary-Kanji/Furigana/Kana/English/Audio/Pos, Sentence-Kana/English/Clozed/Audio, Frequency, Notes`.

**What it confirms / changes for us:**
1. **The universal triad is word + sentence + audio (both), plus image** — and our `ankiNoteSchema.ts` (`JA_VOCAB_FIELDS`: Word/Reading/WordFurigana/Meaning/Sentence/SentenceMeaning/WordAudio/SentenceAudio/PitchAccent/Image/Notes) is **already Core-2k-aligned**, including a `PitchAccent` field we don't yet populate. The prior schema work holds up against real decks.
2. **Listening is a first-class card type in EVERY reference deck** (audio-only front), but we only schedule `recognition` + `production`. **Add a Listening modality/template** — high value since we already TTS-generate word + sentence audio. *(New finding — fold into Track A modalities.)*
3. **The split model (iKnow: separate Sentence note type) validates Track A/B separation** — sentences scheduled as their own units. The combined model (JouzuJuls: sentence attached to each word) validates our per-atom mined example (`courseDeck.ts` `examplesByCardId`). We use both: word cards carry a context sentence; Track B schedules sentence/grammar units independently.
4. **`Sentence-Clozed`** (Core 2000) = the sentence with the target blanked → exactly the cloze-production format Track B sentence reviews should use.
5. **`Frequency`** ordering (Core 2000) → use our existing frequency index for new-card order.
6. **Pitch accent** (SVG contour) is populated in the optimized decks → future enrichment for our `PitchAccent` field.

**Planned-flashcards note:** when the planned/Anki-import flashcards ship, mirror this field set (we already do) and generate Listening + Reading + Production templates so imported Core-style decks round-trip cleanly. The export schema already matches; the gap is the **Listening template/modality** and **pitch** population.

---

## 10. Conjugation Trainer (new feature, from D2)

A **dedicated drill surface for conjugation specifics**, separate from the normal lesson flow — the place to teach + solidify the sub-patterns that Track B intentionally keeps coarse (te-form う/つ/る→って vs む/ぶ→んで vs く→いて…; ます-stem; past; negative; い-adj forms; the いい/いく/かえる irregulars).
- **Why separate:** per CLT, conjugation is a *procedural* skill that benefits from massed, focused, generative drilling (conjugate-this-verb reps) — different from the spaced contextual review Track B does. Keeping it out of the lesson flow avoids bloating lessons (don't fatten lessons — §7) while giving conjugation the concentrated practice it needs.
- **Shape (sketch):** input a dictionary-form verb/adjective → produce the requested form (te / ます / past / negative), graded; adaptive difficulty; surfaces the irregulars deliberately. Could live as a Practice-page tool / sidequest.
- **Relation to Track B:** the trainer *teaches/solidifies* the mechanics; Track B *schedules* the per-rule retention. Mastery in the trainer can feed the Track B unit's state.
- Status: **separate design needed** — noted here so it isn't lost.

---

## 11. Implementation plan — Phase 3b → 4 (researched 2026-06-13)

**External validation (Bunpro / Renshuu model):** grammar SRS = **cloze-deletion of the target grammar point inside an example sentence**, SRS-scheduled. Cued recall beats recognition for long-term retention (Glover 1989; tofugu.com/reviews/bunpro). Track B should mirror this: the review *is* "recall the grammar element in context," not a flashcard flip. ✅ matches the D3 decision (lesson-style, not flashcards).

### 3b — Grammar review-step generator (best-guess design)

**Sourcing (cheapest path, validated against code — no/low new authoring):** every `grammarRule(...)` step already carries 2–3 example sentences (`ja/romaji/en`) + an antiPattern (`grammarHelpers.ts:205`). Reuse those as the per-point review pool; backfill by mining lesson sentences that contain the point's `point` string (extend `courseDeck.ts:getMinedSentences`); author new only for points with zero coverage (expected few).

**Point → step-type mapping (the core 3b decision):**
| Grammar `category` | Review step | Rationale |
|---|---|---|
| particle (は/が/を/に/で/の/から/まで) | `particle_cloze` — blank the particle | Bunpro-exact cued recall; `cloze()` factory already does this + tags `exercisedAtoms` |
| copula / ender (です/か/だ) | `cloze` — blank the ender | same |
| conjugation / pattern (te-form, ます, past, negative, adj-conj) | `build_sentence` or `translate` — produce the form | no clean single blank; production tier (free recall) |
| any (rotated in) | `speaking` occasionally | spoken production |

**Mapping point → its sentences:** add an optional `grammarPoint?: string` arg to `grammarRule()` (+ `cloze()`/`build()` where convenient) so authored steps self-tag — but for v1, derive a static `grammarReviewIndex` (point id → candidate sentences) by (a) matching grammarRule examples by module + `point` string, (b) mined-sentence fallback. This avoids the full per-step `exercisedGrammar` sweep while still sourcing real sentences.

**Generator integration:** extend `buildSrsReviewLesson` — alongside due vocab atoms, call `buildGrammarReviewQueue()`; for each due point pick a sentence from the index and emit the category-mapped step, setting a new optional step field **`exercisedGrammar: string[]`** (point ids) AND `exercisedAtoms` (the sentence's vocab, for 3c).

**Grading wiring (Track B write path):** in `LessonPage.handleStepComplete`, when a completed step carries `exercisedGrammar`, call `reviewGrammarPoint(pointId, modality, rating)` (already built in `grammarSrs.ts`) in addition to the existing vocab grading. Gate on the review-lesson id like the vocab SRS write.

### 3c — D4 credit (small)
Because the generated grammar steps carry `exercisedAtoms` (the vocab in the sentence), the existing vocab-grading loop in `handleStepComplete` already gives those words full review credit. 3c = ensure the generator populates `exercisedAtoms` from the chosen sentence (resolve kana → atom ids via the existing `resolveAtomIds`). No new credit path.

### Phase 4 — replace the blind module calendar + fix docs
- Demote `moduleReviewSchedule` from an independent 1/3/7/14/30/90-day clock to a **derived view**: "module N is due for review" = it has ≥k due items across Track A (vocab) + Track B (grammar). The "🔄 N reviews due" chip reads the derived count; the ★ reflects real mastery, not calendar position.
- Fix the stale CLAUDE.md invariant ("SRS writes happen ONLY in review lessons" → note the flashcard reviewer + Track B are also write surfaces).

### Deferred (own slices)
- **1b — daily-review quest:** cross-repo (`lingo-core` needs a cards/review-unit quest; backend tracks only lessons/xp/perfect today) + frontend `FlashcardTester` → `addProgress` with caught-up/swap. One focused cross-repo commit.
- **Listening modality:** isolated, migrated change — adds a third sub-state to the persisted+synced `SRSCardState`; applies to Track A vocab too. Do after Track B is stable.

### Build order & risk
3b (generator + `exercisedGrammar` field + grading wiring) → 3c (populate `exercisedAtoms`) → smoke-test a generated grammar review in-browser → Phase 4 (derived calendar) → fix CLAUDE.md. Each gate: tests green + a manual review-lesson walk. Riskiest piece = the point→sentence index quality (mis-sourced sentence drills the wrong point); mitigate by preferring grammarRule examples (authored, correct) over string-mined ones, and logging points with no source.
