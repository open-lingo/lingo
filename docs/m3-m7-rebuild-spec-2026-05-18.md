# M3-M7 Rebuild Spec (2026-05-18)

Agent-facing brief for rebuilding `mock-ja-m3-v2.ts` through `mock-ja-m7.ts` to the M1/M2 density bar + the 2026-05-18 resolutions in `curriculum-roadmap-n5-2026-05-18.md`.

**This is a contract for the rebuild agents.** Read it; don't drift from it.

---

## 1. The density bar (read these first — non-negotiable)

Before touching any M3-M7 file:

1. `src/features/lesson/data/mock-ja-m1-l1.ts` — vowel sub-lessons, the **gold-standard density pattern**
2. `src/features/lesson/data/mock-ja-m1-ka.ts` — hand-authored consonant-row sub-lesson trio + row test
3. `src/features/lesson/data/mock-ja-m2-g.ts` — M2 row template; R3 step-type interleave baked in
4. `src/features/lesson/data/_consonantRowHelpers.ts` — factories: `pickThreeKanaDistractors`, `correctSlot`, `buildRowTestLesson`, `M1_REVIEW_POOL`, prior-row review helpers
5. `src/features/lesson/data/_jaGrammarHelpers.ts` — current M3-M7 factories (thin; this file will be **extended**, not replaced)
6. The module you're rebuilding (`mock-ja-m{N}.ts`)

If any of these reads is skipped, the rebuild will drift. They are referenced repeatedly below.

---

## 2. Pedagogical contract (per sub-lesson)

Every sub-lesson must meet **all** of these:

- **Step count: 12-20.** Sit close to 20, do not exceed. Current M3-M7 averages 5-6; that is the failure mode being fixed.
- **≥4 distinct step types** per drill block (no 3-cloze runs, no 5-phrase-card runs).
- **No two adjacent steps of the same type** (R3 interleave rule from M2 g-row).
- **Every new atom in ≥2 modalities** before the sub-lesson ends. (Atom = vocab word, grammar particle, sentence pattern.)
- **≥1 generation step per sub-lesson** — `build_sentence`, `speaking`, `listening_build`, or `translate` (typed-bank). Pure recognition (MCQ-only) is not enough.
- **Hard direction last.** Recall / production steps (`symbol_to_sound`, `speaking`, `translate`) go at the end of the sub-lesson, not the start.
- **No same-answer cloze clusters.** The current M3-5 `は か は か は か` pattern, M6-6 `がががが`, M7-5 `をををを` are anti-patterns. If a sub-lesson drills one particle, **answer-set must rotate ≥3 distinct options** across cloze items.
- **info chrome bookends only.** Open with one `infoStep`, close with one. Don't pad a thin sub-lesson with extra info cards.
- **Wrong-answer feedback names the rule**, not just right/wrong (use the `explanation` field on `particle_cloze`, `ruleExplanation` on `self_explanation_mcq`).

---

## 3. Compounding-review rule (first-class)

From `curriculum-roadmap-n5-2026-05-18.md` §10.4:

> Review-to-new ratio per sub-lesson **≥ 0.25** (1 review step per 4 new-content steps), once a module has 2+ prior modules to draw from.

Operational form per sub-lesson:

- **M3:** can pull from M1 + M2 vocab/kana pool (use `M1_REVIEW_POOL` + M2 atoms). Tail: 2-3 review steps per sub-lesson.
- **M4:** pull from M1 + M2 + M3. Tail: 3-4 review steps per sub-lesson.
- **M5+:** pull from all prior modules. Tail: ≥4 review steps per sub-lesson.

Review steps must be **interleaved into the body when natural**, not just dumped at the end. Examples of natural placement:
- A new vocab card → immediately reuse 1 prior-module word in the next `word_image_mcq` distractor set.
- A new grammar drill → use 1 cloze whose carrier sentence reuses prior-module vocab (e.g., M5 numbers cloze can reuse M3 nouns).
- A sub-lesson's final `match_pairs` or `listening_build` can pull entirely from the prior atom pool.

The compounding effect is **the** differentiator from Duolingo. Take it seriously.

---

## 4. Step types — wake up the underused ones

Existing types defined in `src/features/lesson/types.ts` that M3-M7 **must use** in the rebuild but currently barely does:

| Type | Current M3-M7 usage | Required after rebuild |
|---|---|---|
| `translate` | 2 uses (M2 g-row only) | ≥1 per sub-lesson where vocab exists |
| `match_pairs` | M1/M2 only | ≥1 per module, ideally per sub-lesson as a review-tail |
| `fill_blank` | 0 | Use for verb-form / sentence-completion clozes (not particles); helpful M5+ |
| `listening_build` | M1/M2 only | Pull into M3+ for cumulative phonological recall on prior-row vocab |
| `listening_comprehension` | sparse | Use for meaning-recall on the anchor word per sub-lesson |
| `word_image_mcq` | M1/M2 only | Use for vocab introductions — emoji-anchored, 2x2 grid |
| `symbol_to_sound` | M1/M2 only | Use sparingly in M3+ for any remaining kana the learner stumbles on |

**New types coming online (don't author against these until they land):**
- `self_explanation_mcq` (being built in parallel by another agent) — once landed, use ≥1 per sub-lesson on grammar drills from M4 onward.
- `dialogue_listen`, `reading_passage`, `kanji_intro`, `kanji_recognition`, `conceptual_contrast` — **out of scope for M3-M7 mainline.** Not yet built; not needed for these modules.

**`build_sentence` sunset.** The current `BUILD_SENTENCE_SUNSET_MODULES = new Set(["m5","m6","m7"])` hack at `mockLessons.ts:388` strips the type silently — anti-pattern. The rebuild should:
- Keep `build_sentence` where it's pedagogically right (2-4 mora-tile sentences in M3-M4).
- For M5+ sentences ≥5 mora, substitute `translate` (word-tile bank) + `listening_build` (mora-tile reconstruction of an audio cue) + `speaking` (whole-utterance production). Do NOT use the sunset filter.

---

## 5. Sub-lesson structure (the template)

Each module gets 6-9 sub-lessons of ~15-20 steps each. Sub-lesson template, adapt per module:

```
Sub-lesson N — <name>
  [info:open]                                          (1 step)
  Atom introductions (2-3 new atoms):
    - phrase_card / vocab                              (1-3 steps)
    - word_image_mcq                                   (1-2 steps)
    - listening_build (anchor word, 1)                 (1 step)
  Grammar concept (if new this sub-lesson):
    - grammar_rule                                     (1 step)
    - particle_cloze × 3-4 (rotating answers!)         (3-4 steps)
    - self_explanation_mcq (1, after a cloze commits)  (1 step) [once shipped]
  Production:
    - translate (word-bank or typed-future)            (1-2 steps)
    - build_sentence (if ≤4-tile)                      (1 step)
    - speaking (anchor sentence)                       (1 step)
  Listening:
    - listening_comprehension                          (1 step)
  Review tail (prior-module atoms, NOT this sub-lesson):
    - match_pairs (4-pair from prior atom pool)        (1 step)
    - 1-2 cloze / mcq on prior-module grammar          (1-2 steps)
  [info:close]                                         (1 step)
```

Total: 14-20 steps. **Aim for 18.** Below 14 = thin; above 20 = drop a review step.

---

## 6. Anti-patterns to remove (current M3-M7 failures)

The following anti-patterns from `docs/curriculum-roadmap-n5-2026-05-18.md` §3 **must be killed** in the rebuild:

1. **Same-answer cloze clusters.** M3-5 (`は か は か は か`), M6-6 (6× `が`), M7-5 (6× `を`). Replace with answer-rotating drills.
2. **Vocab-only lessons with zero retrieval.** M5-1 (5 phrase_cards back to back). Every vocab introduction must be followed by retrieval in the same sub-lesson.
3. **`BUILD_SENTENCE_SUNSET_MODULES` hack.** Remove all M5-M7 entries from the set; substitute proper step types per §4 above. The dev-warn fire path is OK to keep as a safety net.
4. **Iteration lessons with 6 identical-type steps.** M3-5, M6-6, M7-5. Break into mixed-type sub-lessons.
5. **No-distractor `word_image_mcq`.** Distractor pool must be size ≥3 plausible-but-wrong options drawn from the current + prior module vocab.

---

## 7. Per-module rebuild scope

### M3 — First sentences
- **Spine (unchanged):** です + か, は (topic). Adjective exposure via examples.
- **Atoms to teach:** ~25 vocab (15 already in M3-v2 + ~10 review-pool from M1/M2 anchoring).
- **Sub-lesson count: 6** (compressed from current 8 by absorbing M3-1 katakana intro into M3-2/3 as 1-loanword-per-sub-lesson exposure; row test stays last).
- **Goal:** prove the rebuild pattern.

### M4 — Things & people
- **Spine:** の (possession), これ/それ/あれ/どれ (demonstratives).
- **Atoms:** ~25 new vocab (+ M3 review tail).
- **Sub-lesson count: 7.**

### M5 — Numbers + ください
- **Spine:** 1-10 Sino, 人 counter, ください, から (origin).
- **Atoms:** ~25 new vocab (numbers are vocab too).
- **Sub-lesson count: 7.**
- **Critical fix:** the numbers lesson must NOT be 5 phrase_cards. Use `word_image_mcq` (number-as-emoji), `match_pairs` (numeral ↔ kana), `listening_build` (mora reconstruction of '_ ひと' patterns).

### M6 — Where things are
- **Spine:** に (destination), で (setting), が (existence).
- **Atoms:** ~30 new vocab (location words).
- **Sub-lesson count: 8.**
- **Critical fix:** が must NOT appear 6 times in a row. Rotate through に / で / が in the drills.

### M7 — Verbs in motion
- **Spine:** dictionary form, ます-form, を.
- **Atoms:** ~30 new vocab (verbs + objects).
- **Sub-lesson count: 8.**
- **Critical fix:** を must NOT appear 6 times in a row. Mix を with the M6 particles (に/で/が) — that's the natural compounding moment.

---

## 8. Helper extensions (do this once, in `_jaGrammarHelpers.ts`)

Add these factories before authoring sub-lessons. They keep call sites readable and enforce the contract:

```ts
/** Cumulative atom pool for review-tail draws. */
export type ReviewAtom = {
  kana: string;
  meaningEn: string;
  emoji?: string;
  fromModule: "m1" | "m2" | "m3" | "m4" | "m5" | "m6";
};

/** Draw N atoms from prior-module pool, deterministic by id seed. */
export function pickReviewAtoms(seed: string, pool: ReviewAtom[], n: number): ReviewAtom[];

/** match_pairs factory drawing from prior atom pool. */
export function reviewMatchPairs(idPrefix: string, atoms: ReviewAtom[]): MatchPairsStep;

/** word_image_mcq factory with auto-drawn distractors from a pool. */
export function vocabMcq(
  idPrefix: string,
  target: ReviewAtom,
  distractorPool: ReviewAtom[],
): WordImageMcqStep;

/** Cloze with answer-rotation guarantor: throws if more than 2 adjacent
 *  call sites use the same correctParticle. (Use at module build time
 *  before exporting LESSONS array.) */
export function assertNoSameAnswerCluster(steps: LessonStep[], maxAdjacent = 2): void;
```

Add a single `M3_M7_REVIEW_POOL` const that aggregates atom-level vocab from prior modules. Keep additive (don't duplicate atoms already in `M1_REVIEW_POOL`).

---

## 9. Validation gates (every rebuilt module)

Before declaring a rebuild done, the rebuild agent must verify:

1. `npx tsc --noEmit` clean.
2. **Step count per sub-lesson** in [14, 20]. Report the distribution.
3. **Distinct step types per sub-lesson** ≥ 5.
4. **Review-to-new ratio per sub-lesson** ≥ 0.25 (count steps whose primary atom is from a prior module).
5. **No same-answer cluster** > 2 consecutive. Use `assertNoSameAnswerCluster`.
6. **Existing lesson IDs preserved** where downstream code references them (search for the old IDs first: `grep -rn "ja-m3-" src/` — if any non-mock-data file references an ID, keep it).
7. **Module review schedule (`moduleReviewSchedule.ts`) still passes** — module IDs are stable.

---

## 10. Out of scope (do NOT do as part of this rebuild)

- Building `dialogue_listen`, `reading_passage`, `kanji_intro`, `kanji_recognition`, `conceptual_contrast`.
- Authoring kanji sidequests (separate post-rebuild work).
- Authoring placement-test / mock-exam engine.
- Modifying the curriculum pathway UI.
- Touching M1/M2 hand-authored files (those are the reference, not a target).
- Adding L1-aware variants (English/Spanish/Korean L1 — future scope).
- ESLint flat-config migration, feature gating registry, CEFR badging — these are §10 framework items, not rebuild scope.

If the rebuild needs any of the above, **stop and flag**. Don't widen scope.

---

## 11. Living doc

This spec will be refined as M3 ships and we see what the agent gets right vs drifts on. Append "Lessons from M3 rebuild" + "Lessons from M4-M7 rebuild" sections as they land. Eventually condense into `docs/lesson-authoring-guide.md` (per Q8 resolution).

---

## 12. Lessons from M3 rebuild (2026-05-18)

M3 shipped clean — 7 content sub-lessons + row test, all validation gates green, 296/296 tests pass, `tsc --noEmit` clean. Carry-forwards for M4-M7 agents:

### 12.1 External IDs are the contract; sub-lesson count is the target

Spec §7 named target sub-lesson counts. But `mockCourse.ts` + lesson tests reference specific lesson IDs, and external refs **win** over the target count when they conflict (per §9 rule "preserve externally-referenced IDs"). M3's resolution: kept 7 content sub-lessons + row test = 8 IDs (matched the 8 existing). Other M4-M7 agents: grep first (`grep -rn "ja-m{N}-" src/ | grep -v mock-ja-m{N}`), preserve referenced IDs, treat §7 sub-lesson counts as guidance.

### 12.2 Use the helpers M3 agent added — do NOT re-add or re-derive

`_jaGrammarHelpers.ts` now exports (additive on top of the original M3-M7 factories):

- `M3_M7_REVIEW_POOL` — 20 M1 + 4 M2 anchors, curated
- `pickReviewAtoms(seed, pool, n)` — deterministic by id seed
- `reviewMatchPairs(idPrefix, atoms)`
- `vocabMcq(idPrefix, target, distractorPool)` — throws if pool can't yield 3 emoji-bearing foils
- `assertNoSameAnswerCluster(steps, maxAdjacent = 2)` — **call at import time** on every rebuilt module's sub-lesson arrays
- `translateStep({id, promptEn, acceptedAnswers, audioText?})`
- `listeningBuildSentence({id, target, tiles, correctOrder, promptEn})`
- `listeningCompSentence({id, audioText, correctMeaningEn, distractorsEn, question?})`
- `sentenceMcq({id, prompt, promptAudioText?, correctKana, distractorsKana, explanation?})`

Each M4-M7 agent should **add its module's atoms to `M3_M7_REVIEW_POOL`** (purely additive — don't remove existing atoms; M5 draws from M3 + M4, M6 draws from M3 + M4 + M5, etc.) with `fromModule: "m4" | "m5" | "m6"`.

### 12.3 Dialogue factory adjacency carve-out is accepted

`dialogueLesson(speakingTargets: "representative")` emits 4-5 consecutive `phrase_card`s by design. This violates the R3 interleave rule but is structurally required by the factory and gated on Whisper sentence-level validation (per CLAUDE.md). M4-M7 dialogues can keep this shape; `assertNoSameAnswerCluster` doesn't check phrase_card adjacency anyway. **Don't try to "fix" it.**

### 12.4 `self_explanation_mcq` is live; use ≥1 per sub-lesson on grammar drills from M4

The step type shipped 2026-05-18 (engineering agent). Import `selfExplain(...)` factory and `EXAMPLE_SELF_EXPLAIN_NO_POSSESSION` shape from `_jaGrammarHelpers.ts`. After each `particle_cloze` block in a sub-lesson with a new grammar concept, insert one `selfExplain` step probing the rule the learner just used:

```ts
selfExplain({
  id: "ja-m4-2-self-no-1",
  anchorLabel: "You picked の in: わたし＿ ほん",
  anchorAudioText: "わたしの ほん",
  question: "Why is の correct here?",
  rule:       { text: "の attaches the owner to what they own." },
  surface:    { text: "の always comes after a noun." },
  distractor: { text: "の is the question marker." },
  ruleExplanation: "の is the possession particle — it links owner (わたし) to thing owned (ほん).",
})
```

The view branches wrong-answer feedback on `reasonType` ("close, surface-level" vs "unrelated"); the rule reveal follows commit.

### 12.5 `BUILD_SENTENCE_SUNSET_MODULES` cleared by coordinator

The hack at `mockLessons.ts:388` previously stripped `build_sentence` from M5-M7. The coordinator has **already emptied the set** before dispatching wave 2 — M5/M6/M7 rebuild agents should:

- Substitute `build_sentence` for ≥5-mora sentences with `translateStep` + `listeningBuildSentence` + `speaking` per spec §4.
- Still use `build_sentence` for ≤4-mora sentence-tile builds where the pedagogy is right (per spec §4 reuse rule).
- **Do NOT re-populate the sunset set.** If the rebuild needs it, that's a spec violation — fix the content instead.

### 12.6 Spec ambiguity carve-out: helper additions are encouraged

M3 agent added 4 spec-required helpers AND 4 bonus helpers it discovered it needed (`translateStep`, `listeningBuildSentence`, `listeningCompSentence`, `sentenceMcq`). All purely additive, all useful for M4-M7. **M4-M7 agents may add additional thin factories if the call sites read better** — but every new helper must:
1. Be a thin wrapper over existing step types (no new step types).
2. Have a single-line JSDoc.
3. Be exported.
4. Not collide with existing helper names.
