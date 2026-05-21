# Wave 4 — M3-M7 re-author + verify (2026-05-18)

Spencer's directive (2026-05-18 evening):

> Make M3-M7 follow all the learning standards we've outlined so far. Author them. Make an outline. Have a few personas effectively test it with Playwright. Make it a working tool that will effectively teach you everything it is trying to, with 80% memory, building upon previous lessons (reuse OR review grammar concepts well). Don't stop until you have confirmed M3-M7 work well for a user doing **half a module a day**. Use the new emojis we baked in. Add 1-2 new lesson types if needed. Note user feedback heavily. Should be fun, teach well, help remember.
>
> **Constraints:** Don't break M1/M2. Don't change the world on current lesson steps. Don't delete M1/M2 content. Don't make major structural changes OUTSIDE of lesson cards.
>
> **Follow-on:** Use M1/M2 as pacing/structure reference, BUT M3-M7 should be different — grammar takes center stage now, with a gradual shift away from kana-specific drills as the learner uses kana more.

---

## 1. Scope

**In scope** (lesson-card-level authoring):
- Re-density every M3-M7 sub-lesson to 20-22 steps (per `m3-m7-rebuild-spec-2026-05-18.md` §2 + §13.1 — updated 2026-05-18).
- Fix all carry-forward findings from `docs/user-feedback/2026-05-18-tester-m1-m2-walkthrough.md` + `docs/m3-m7-audit-synthesis-2026-05-18.md` that touch lesson cards.
- Re-shape sub-lesson templates so grammar takes center stage; kana review present but tapered (vs M1/M2 which is kana-first).
- Add ONE new step type — `dialogue_listen` — to put real retrieval on dialogue closers (currently `dialogueLesson` factory shows phrase cards only). Spec §5.2 says target M8+ but the M3-7/M4-7/M5-7/M6-8/M7-8 dialogues need the same upgrade.
- Use canonical emoji from `docs/n5-vocab-emoji-reference-2026-05-18.md` everywhere a vocab atom has a pre-assigned emoji.
- Replace hardcoded "Spencer" name in M3-7 dialogue with a learner-name placeholder.
- Identity-anchored win-card copy (Cialdini Unity — "you're now someone who can…").

**Out of scope** (per Spencer's constraints):
- M1/M2 content edits (S8 desu/ka split + S9 "red" claim land in a separate wave — they touch M1/M2 ka-row).
- View-component / UI changes (CelebrationToast wiring, romaji adaptive fade, "?" peek, etc.).
- Architecture changes (no new context, no new routes).
- Sidequest authoring (katakana track, deep-dive grammar) — separate workstream.
- Kanji authoring.
- L1-aware variants.

---

## 2. Standards checklist (consolidated from all docs + user feedback)

Every rebuilt sub-lesson must hit ALL of:

### Density + structure
1. **20-22 steps, aim 21.** Hard floor 12, hard ceiling 25 (per `sub-lesson-density.test.ts`).
2. **≥5 distinct step types per sub-lesson.**
3. **R3 interleave: no 2 adjacent same-type steps** (enforced by spec §2; `assertNoSameAnswerCluster` already catches the cloze case).
4. **Hard direction last** — `speaking`, `translate`, `listening_build` after step ~12.

### Retrieval-quality (audit + retrieval-gradient agent)
5. **≥0.25 review-to-new ratio** per sub-lesson (compounding rule).
6. **≥1 typed `translateStep`** per sub-lesson (free-recall tier — the highest-leverage retrieval; current implementation accidentally typed-input vs the Q3 "Path A MCQ-only" resolution and is the single biggest testing-effect lever per audit §3.4).
7. **selfExplain placement at N-1** of the drill cluster (after 2-3 commits — not immediate). CLT expertise-reversal compliance.
8. **selfExplain distractors = "rule-citing-but-wrong"** not "obvious nonsense." Audit synthesis §2.6 listed specific weak ones; fix during re-author.
9. **No same-answer rotation gap** — every cloze block must have ≥3 distinct correct particles across its items (Devon's audit catch §2.4). Add `assertAnswerRotation` check in helpers if not yet there.
10. **MCQ slot rotation** — guaranteed by all the M3-M7 helpers (`vocabMcq`, `sentenceMcq`, `selfExplain`, `cloze`, `particleMc`) after the 2026-05-18 audit fix. Inline literals must rotate manually.
11. **Match-pairs grids always full** — `padMatchPairsToTarget` already shipped; no action needed if using `reviewMatchPairs` helper.

### Compounding review (the differentiator vs Duolingo)
12. **Every introduced atom appears ≥3 times** across the M3-M7 corpus (will be enforced by a new `atom-coverage.test.ts`).
13. **Spaced re-encounter** — atoms introduced in module N appear in module N+1, N+2 review tails (already partial via `M3_M7_REVIEW_POOL` + `pickReviewAtoms`).
14. **Grammar concepts reused across modules** — の introduced M4 should appear in M5/M6/M7 cloze carrier sentences; に introduced M6 should resurface in M7 verb compound clozes.

### Tester-validated patterns
15. **Sentence-pattern sprinkle** — keep the existing M3-2 RULE_DESU_KA structure (out of scope to rewrite here), but every M3+ sub-lesson can leverage `X です` / `わたしは X です` patterns in its drill carriers without re-explaining the rule.
16. **Identity-relevant content** — Maya teen persona finding; where appropriate, M5-7 / M6-8 / M7-8 dialogue framings can hint at non-tourist contexts (school, friends, casual) for variety.
17. **Win-card copy = identity-anchored** — "You can now [verb thing learner can now do]" not "[grammar concept] unlocked."

### Sub-lesson template (M3-M7 — different from M1/M2)
Spencer's follow-on: M3-M7 shifts away from kana-first. Adapted template:

```
Sub-lesson N (target: 20-22 steps, aim 21)

  [info: 1] open — 1-line propulsion + audio cue (NOT exposition)
  Grammar/vocab introduction (the LESSON content, 7-10 steps):
    - grammar_rule  OR  vocab/phrase trio (2-3 atoms)
    - vocabMcq × 2-3 (with emoji from n5-vocab-emoji-reference)
    - listening_comp on anchor word
    - particle_cloze × 3-4 (rotated answers; min 3 distinct particles)
  Production (3-5 steps):
    - translateStep × 1-2 (free-recall, typed)
    - sentenceMcq (kana-sentence selection from English prompt)
    - speaking (anchor sentence)
    - build_sentence (only for ≤4-mora sentences)
  Selfexplain (1 step, placed at N-1):
    - selfExplain — fires AFTER 2-3 commits, distractors = rule-citing-wrong
  Listening drill (1-2 steps):
    - listening_comprehension OR dialogue_listen (NEW)
  Compounding review tail (3-5 steps from PRIOR modules):
    - reviewMatchPairs (pad to 4+)
    - vocabMcq from prior pool × 2
    - 1 cloze with prior-module grammar concept reused
  [info: 1] close — identity-anchored win + 1-line forward tee
```

Compared to M1/M2 template: less symbol_intro / symbol_trace / symbol_recognition (kana is assumed); more grammar_rule / particle_cloze / translateStep / selfExplain. Kana review present in `reviewMatchPairs` (M1-anchor draws), gradually fades as later modules' compounding pools grow.

---

## 3. New step type: `dialogue_listen`

Spec §5.2 already designs this. Implementing for M3-M7 dialogue closers.

**Shape**:
```ts
type DialogueListenStep = {
  id: string;
  type: "dialogue_listen";
  /** 2-4 turns. Each line auto-played in sequence (gap between).
   *  No transcript shown by default; transcript is reveal-on-tap. */
  lines: Array<{
    speaker: string;          // e.g. "Stranger" / "You" / "Server"
    kana: string;             // for TTS + optional transcript reveal
    audioText?: string;       // override the kana for TTS lookup if different
  }>;
  /** 2-3 comprehension MCQs over the dialogue. */
  questions: Array<{
    id: string;
    prompt: string;           // English
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
    explanation?: string;
  }>;
  /** Optional: reveal transcript after first question commits. */
  transcriptRevealAfter?: "first-answer" | "all-answers" | "never";
};
```

**Renderer** mirrors `ListeningComprehensionStepView` + multi-turn audio playback + sequential MCQs. Each MCQ commits before the next reveals (no peek-ahead).

**Authoring use**: replace each module's dialogue closer (M3-7, M4-7, M5-7, M6-8, M7-8). Each gets `dialogue_listen` with 3-4 turns + 2-3 questions probing comprehension (who said what, where, what was ordered, etc.).

**Counts toward density**: 1 `dialogue_listen` step = 1 step in the sub-lesson count (the comprehension MCQs are bundled inside). To hit 20-22, the dialogue sub-lesson needs additional warm-up + review tail around the dialogue_listen.

---

## 4. Self-answered open questions (where I had been waiting on Spencer)

Per Spencer's directive ("answer the questions you asked me yourself"), making the calls:

- **Wave-4A/4B/4C sequencing** (audit synthesis §5): execute as designed. Engineering first (dialogue_listen), then content re-author in parallel, then verification.
- **selfExplain distractor rewrite scope**: include in the per-module re-author (each agent fixes their module's distractors). Audit listed M6-4-self-ga + M4-2-self-no-1 + M5-3-self-futari specifically.
- **`assertAnswerRotation` helper**: add to `_jaGrammarHelpers.ts` and call from each module's import-time validation. Throws if any sub-lesson's cloze block has < 3 distinct correct particles.
- **Identity-relevant dialogue framing for teens (Maya audit)**: light touch — keep one dialogue per module tourist-framed for the goal-selection N5-prep persona, but vary the other (M5-7 café stays tourist; M6-8 directions becomes "asking a classmate where the gym is"). Doesn't bloat scope.
- **WaniKani-style "you've seen this" badges** (audit §2.8): out of scope for this wave — view-component change. The compounding-review *content* already lands; making it visible is a separate UI workstream.
- **`reading_passage` step type**: deferred — spec target M10+, not needed for M3-M7. Skip.
- **`verb_conjugation` step type**: deferred — spec target M16+. M7-2 ships with match_pairs scaffolding (works); new step type later.

---

## 5. Execution plan

**Wave 4A — engineering + verification primitives (parallel, ~30 min):**
- Agent A1: build `dialogue_listen` step type (types.ts + view + StepRenderer wiring + factory in `_jaGrammarHelpers.ts`).
- Agent A2: write `atom-coverage.test.ts` (every vocab atom introduced in M3-M7 appears ≥3 times across the corpus; flags atoms with < 3 re-exposures as failures).
- Agent A3: extend `_jaGrammarHelpers.ts` with `assertAnswerRotation(steps, minDistinct=3)`; wire into M3-M7 module imports.

**Wave 4B — per-module re-author (5 parallel agents, ~90 min):**
- Each module gets one Opus agent.
- Briefing: read spec §13.1 + this outline §2 + the user-feedback log + the audit synthesis.
- Output: re-densified module hitting 20-22 per sub-lesson, all standards in §2.

**Wave 4C — verification (parallel, ~30 min):**
- Agent C1: Playwright persona walk #1 (Maya, completes M3-M4 across "2 days" via half-module/day pacing simulated by visiting + completing in sequence).
- Agent C2: Playwright persona walk #2 (Devon, returns to M5 after 7-day gap — simulated by direct nav, asserts re-entry warm-up + per-module review feels coherent).
- Agent C3: Playwright persona walk #3 (Trevor, optimizer — completes M6-M7 in 2× 10-min windows per module).
- Agent C4: Static curriculum-quality audit — re-runs all density/MCQ-rotation/atom-coverage tests, summarizes pass/fail.

**Wave 4D — iteration:**
- Fix any issues surfaced by Wave 4C. Re-run verification. Repeat until green.

**Acceptance:**
- All vitest tests green (density distribution, MCQ position, atom coverage, ja-m3-m7-coverage, mockCourse, grammar-rule, lessonDensity, etc.).
- Playwright persona walks complete without errors; each persona finishes all module(s) assigned.
- Every M3-M7 sub-lesson lands in [20, 22] band (or [18, 24] grace) — density-distribution test reports near 100% at-target.
- Atom-coverage test reports every introduced atom ≥3 re-exposures.

---

## 6. Living doc

Append per-wave outcomes here. After Wave 4D acceptance, condense the M3-M7 patterns into `docs/lesson-authoring-guide.md` per roadmap Q8 resolution.
