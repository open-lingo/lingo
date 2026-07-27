> **Status: ARCHIVED — SHIPPED.** Work completed; kept for history. Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Wave 4B agent dispatch briefs — staged 2026-05-18

Pre-staged briefs so dispatch is instant when Wave 4A-1 + 4A-3 finalize. Each agent gets a focused per-module brief + the shared standards contract.

---

## Shared contract (all 5 agents receive)

### Read first (in this order)
1. `docs/wave-4-m3-m7-reauthor-2026-05-18.md` — the contract. Read §2 standards checklist (17 items) end-to-end.
2. `docs/m3-m7-rebuild-spec-2026-05-18.md` — `§13` is the latest carry-forwards from the tester walkthrough. §2 + §5 hold the new 20-22 density target.
3. `docs/user-feedback/2026-05-18-tester-m1-m2-walkthrough.md` — tester-validated patterns to apply (T2, T3, T8, T11 especially).
4. `docs/n5-vocab-emoji-reference-2026-05-18.md` — canonical emoji per vocab atom. Use these where your module's atoms appear; do NOT re-decide emoji per-lesson.
5. `src/features/lesson/data/_jaGrammarHelpers.ts` — every factory you'll use. New since the last rebuild: `dialogueListen()`, `assertAnswerRotation()`, `slotFor` (exported), upgraded `slotFor` hash (Murmur3 finalizer).
6. `src/features/lesson/components/steps/DialogueListenStepView.tsx` — the new step type's renderer (read so you know what your `dialogueListen()` call produces).

### Standards (every sub-lesson must hit ALL)
**Density:**
- 20-22 steps, aim 21. Hard floor 12, hard ceiling 25.
- ≥5 distinct step types per sub-lesson.
- No 2 adjacent same-type steps.
- Hard direction last (`speaking` / `translate` / `listening_build` after step ~12).

**Retrieval quality:**
- ≥1 typed `translateStep` per sub-lesson (highest-tier retrieval).
- `selfExplain` placed at position N-1 of the drill cluster — AFTER 2-3 commits, not immediate (CLT expertise-reversal).
- `selfExplain` distractors = "rule-citing-but-wrong" not "obvious nonsense" (e.g., NOT "は and が mean exactly the same thing").
- Every cloze block: `assertAnswerRotation(steps, minDistinct=2)` minimum; aim for `minDistinct=3` once you can.
- MCQ slot rotation: automatic via the factories. Inline literals must rotate manually using `slotFor(id, 4)`.

**Compounding review (THE differentiator):**
- ≥0.25 review-to-new ratio per sub-lesson.
- Pull review-tail atoms from `M3_M7_REVIEW_POOL` via `pickReviewAtoms(seed, pool, n)`.
- **Every atom your module introduces should appear ≥3 times across the M3-M7 corpus**. If you introduce 5 new atoms and your module is the last surface for them (M7), each must re-surface ≥2 times WITHIN your module's later sub-lessons / row test.
- Per the atom-coverage audit (`docs/wave-4-m3-m7-reauthor-2026-05-18.md` §5 cite): 31% of current atoms violate this. The atom-coverage test (`src/features/lesson/data/atom-coverage.test.ts`) will tell you which.

**Tester-validated patterns:**
- Use canonical emoji from `n5-vocab-emoji-reference-2026-05-18.md` for every atom that has one.
- Identity-anchored `infoStep("...","win")` close cards — "You can now [verb thing learner can now do in real life]" not "[grammar concept] unlocked."
- Sentence-pattern sprinkle: `X です` / `わたしは X です` patterns can carry vocab in cloze stems without re-explaining (the formal rule lives in M3-2).

**M3-M7 ≠ M1/M2 template** (Spencer's follow-on):
- Grammar takes center stage. Less `symbol_intro` / `symbol_trace` / `symbol_recognition` (kana is assumed by M3).
- More `grammar_rule` / `particle_cloze` / `translateStep` / `selfExplain` / `dialogueListen`.
- Kana review present in `reviewMatchPairs` (prior-module pool) but gradually tapered.

**Dialogue closer upgrade** (per module):
- Every module's dialogue closer sub-lesson (your `*-7` or `*-8` slot) must use the NEW `dialogueListen()` factory for the comprehension drill, NOT the legacy `dialogueLesson()` phrase-card-chain factory. The dialogue itself becomes a `dialogue_listen` step with 3-4 turns + 2-3 questions.
- The dialogue sub-lesson still needs to hit 20-22 steps total → wrap the `dialogue_listen` step with warm-up vocab, a vocab/phrase intro, a translate step, a speaking step, AND a review tail.

### Constraints
- **DO NOT TOUCH M1/M2 files** (`mock-ja-m1-*.ts`, `mock-ja-m2-*.ts`).
- **DO NOT TOUCH OTHER MODULES** — only your assigned module.
- **DO NOT change step type APIs** — author against the existing types + new `dialogue_listen`.
- **DO NOT delete external IDs** — `ja-m{N}-1` through `ja-m{N}-K` are referenced from `mockCourse.ts` + tests; preserve them.
- **Preserve M{N}_REVIEW_POOL atom additions** — your module's atoms must remain available for downstream modules' compounding.

### Validation gates (run before reporting)
- `npx tsc --noEmit` clean.
- `npx vitest run src/features/lesson/data/sub-lesson-density.test.ts` → your module's sub-lessons land in [20, 22] band (some [18, 24] grace OK, none < 18 unless explicitly justified).
- `npx vitest run src/features/lesson/data/atom-coverage.test.ts` → distribution improves (fewer atoms at n=1).
- `npx vitest run src/features/lesson/data/mcq-position-distribution.test.ts` → still green (no regressions).
- `npx vitest run src/features/lesson/data/ja-m3-m7-coverage.test.ts` → still green (you preserved external IDs).

### Report back (under 600 words)
- Per-sub-lesson new step count (was → now).
- Per-sub-lesson distinct-step-type count.
- New atoms added (with canonical emoji used).
- Atoms you re-exposed in review tails (with `fromModule` source).
- `dialogue_listen` usage on the dialogue closer (where + questions count).
- Tests passing? Distribution movements?
- Anything punted with TODO.

---

## Per-module dispatch briefs

### Agent B-3 — M3 (First sentences: です + か, は)
**Target file:** `src/features/lesson/data/mock-ja-m3-v2.ts`

**Current state:** 8 lessons (M3-1 through M3-8). Sub-lesson step counts: 15, 20, 20, 16, 16, 15, 16, 3 (row-test stub). Only M3-2 and M3-3 hit 20-22.

**Specific changes required:**
1. **M3-1 (currently 15)** — re-density to 20-22. Currently 5 katakana loanwords + culture. Per tester T10 + audit §3.5, **de-scope the katakana load**: keep ~2 loanwords inline (コーヒー, タクシー — high frequency travel words), pad rest with prior-pool review + a sentence-pattern sprinkle (`コーヒー です`). Add `translateStep` (typed) for the anchor.
2. **M3-2 + M3-3** — already at 20. Add 1-2 review-tail items each to bump to 21. Move the `selfExplain` (if any) to N-1 placement.
3. **M3-4 (16)** — re-density to 20-22. Current 5 consecutive `cloze` answer = `は` — APPLY `assertAnswerRotation(steps, minDistinct=3)` and add 1-2 clozes with `か` or `です`-slot answers to break the monotony. Move `selfExplain` to N-1.
4. **M3-5 (16) — interleaved drill** — pad to 20-22 with cumulative review.
5. **M3-6 (15) — sentence build** — pad to 20-22 with translate / speaking / review.
6. **M3-7 (16) — dialogue closer** — REWRITE the dialogue using `dialogueListen()` (the new factory). 3-4 turn dialogue with the same scenario; add 2-3 comprehension MCQs. Wrap with intro + warm-up + review tail to hit 20-22. **Fix the hardcoded "Spencer" name leak** — use `{learnerName}` placeholder or replace with a generic name like "Kenji" / "Yuki" (depending on dialogue context).
7. **M3-8 (row test)** — leave as-is (3-step wrapper exempt from density bar).

**Atom-coverage targets** (atoms currently at n=1 in M3): `にほんじん`, `アメリカじん`, `あに`, `なまえです`. Re-expose at least 2 of these in M3-5/M3-6 cloze carriers or `vocabMcq` distractors.

**Cross-module compounding:** add 3-5 M3 atoms to `M3_M7_REVIEW_POOL` (if not already there) so M4-M7 can draw them.

### Agent B-4 — M4 (Things & people: の, demonstratives)
**Target file:** `src/features/lesson/data/mock-ja-m4.ts`

**Current state:** 8 lessons. Sub-lesson step counts: 15, 15, 19, 16, 17, 14, 16, 3 (row-test stub). All below 20.

**Specific changes required:**
1. **All 7 content sub-lessons** — re-density to 20-22.
2. **M4-2 `selfExplain` placement** — currently fires after first cloze commit. Move to position N-1 (after 2-3 commits).
3. **M4-2 `selfExplain` distractor rewrite** — `"の always comes after a noun"` is the surface heuristic but worded too obviously. Make it more plausible (e.g., `"の links two nouns into a compound noun"` — true-but-wrong rule).
4. **M4-7 dialogue closer** — REWRITE with `dialogueListen()`. Friend's apartment scene works; add 3 comprehension questions probing "whose X is this" / "what's in the photo" etc.

**Atom-coverage targets** (atoms at n=1 in M4): `ペンです`, `くるまです`, `カメラです`, `かさです`, `じしょです`, `じてんしゃです`, `だれ`, `わたしのです`. The `X です` surface forms are duplicative authoring drift — collapse: teach the noun bare (`ペン`), then use `です`-suffixed forms only in cloze stems. Re-expose `だれ` somewhere (it's a key question word).

**Cross-module compounding:** M4 atoms must appear in M5/M6/M7 review tails. Verify `M3_M7_REVIEW_POOL` has them with `fromModule: "m4"`.

### Agent B-5 — M5 (Numbers + ください)
**Target file:** `src/features/lesson/data/mock-ja-m5.ts`

**Current state:** 8 lessons. Sub-lesson step counts: 19, 19, 19, 17, 18, 15, 16, 3. Three sub-lessons very close to target (need just 1-3 more steps).

**Specific changes required:**
1. **All 7 content sub-lessons** — re-density to 20-22 (M5-1/2/3 just need 2-3 more steps each).
2. **M5-3 `selfExplain` rewrite** — `"ください always follows a drink word"` is dismiss-on-sight. Replace with a real wrong-rule.
3. **M5-3 `selfExplain` placement** — move to N-1.
4. **M5-6 ふたつ/みっつ teaching gap** — these counter words appear in cloze answers without being formally taught. Add a brief grammarRule or `vocab` card in M5-5 introducing generic counters (ひとつ, ふたつ, みっつ).
5. **M5-7 dialogue closer** — REWRITE with `dialogueListen()`. Café scene; 3 comprehension Q's (what was ordered, how many, who paid).

**Atom-coverage targets** (atoms at n=1 in M5): `いくらです`, `アメリカから`, `さんにんです`, `にほんから`, `ふたつです`, `さんにん`, `よにん`, `ごにん`, `みっつ`, `ざん`, `せん`, `ににんです`, `ひとりです`, `みっつです`, `いじょう`, `よろしいです`, `にほんです`, `わたしから`, `から`. **This is the heaviest leakage** — many counter-form duplicates. Collapse: teach `ふたり` / `さんにん` once each, use them in M5-5/M5-6/M5-7 cloze carriers WITHOUT re-introducing as new atoms.

**Cross-module compounding:** counter words MUST appear in M6/M7 review tails (location + verb sentences with counter-noun pairs).

### Agent B-6 — M6 (Where things are: に, で, が-existence)
**Target file:** `src/features/lesson/data/mock-ja-m6.ts`

**Current state:** 9 lessons. Sub-lesson step counts: 18, 14, 14, 14, 17, 18, 14, 15, 3. Mostly at the bottom of the range — heavy lift.

**Specific changes required:**
1. **All 8 content sub-lessons** — re-density to 20-22. M6-2/3/4/7 (currently 14) need 6-8 more steps each.
2. **M6-4 expertise-reversal contradiction** — currently the rule card says "don't worry about は/が yet" then `selfExplain` 4 steps later asks the exact contrast. **Move the は/が selfExplain to M6-5 or later**. Replace M6-4's selfExplain with one on the あります/います animacy split (the rule the learner just committed).
3. **M6-4 `selfExplain` distractor rewrite** — `"は and が mean exactly the same thing"` is the canonical dismiss-on-sight lure. Replace with a real near-rule (e.g., `"が introduces the answer to an implied wh-question"`).
4. **All `selfExplain` steps in M6-2/3/4 → move to N-1 placement**.
5. **M6-6 `assertAnswerRotation(steps, minDistinct=3)`** — the rebuild already rotates が→に→で→が→に→が (3 distinct). Confirm with the helper call.
6. **M6-8 dialogue closer** — REWRITE with `dialogueListen()`. Asking directions in Shibuya. 3 Q's (where is the station, which way, how long).

**Atom-coverage targets:** M6 location atoms need to appear in M7 review tails (verb-of-motion sentences naturally take location particles).

### Agent B-7 — M7 (Verbs + ます + を)
**Target file:** `src/features/lesson/data/mock-ja-m7.ts`

**Current state:** 9 lessons. Sub-lesson step counts: 16, 15, 16, 18, 16, 16, 15, 19, 3.

**Specific changes required:**
1. **All 8 content sub-lessons** — re-density to 20-22.
2. **M7-2 verb-class cliff** — `RULE_DICT_MASU` → 6-pair `match_pairs` requires type-classification + form-transformation simultaneously. **Insert one transitional `sentenceMcq`** ("Which is a -る verb?") between rule and match.
3. **M7-3 `assertAnswerRotation(steps, minDistinct=3)`** — current cloze block all `を`. Rotate at least 3 distinct particles across the block (mix with に / で).
4. **M7-5 / M7-6 selfExplain placement** — move to N-1.
5. **M7 internal compounding is CRITICAL** — M7 has no successor module, so any M7 atom must appear ≥3× within M7. The atom-coverage audit lists many M7 atoms at n=1 (`くうこう`, `ゆうびんきょく`, `テレビ`, `さけ`, `ひとつ`, `ごちゅうもん`, `かしこまりました`, `なんめいさまです`, etc.). Re-expose each at least twice within M7-5/M7-6/M7-7/M7-8/M7-9 (row test).
6. **M7-8 dialogue closer** — REWRITE with `dialogueListen()`. Ramen shop. 3 Q's (what did each person order, how many, total cost).

**Authoring drift to fix:** the romaji strings `Spencer`, `amerikajin`, `FamilyMart` showed up as atoms in the audit — confirm they don't appear in your kana fields. If they do (`FamilyMart` likely in M7-4 or M7-8), either move to katakana (`ファミマ`) or wrap in a phrase that doesn't surface them as standalone atoms.

---

## Wave 4C briefs (staged for dispatch after 4B)

### Agent C-1 — Maya teen persona Playwright walk (M3-M4)
Read the audit synthesis Maya findings (§3.x), use Playwright to navigate to `/ja/lesson/ja-m3-1` through `/ja/lesson/ja-m4-8` sequentially, simulate a "1 sub-lesson per session, 2 sessions/day" pace. Assert: lessons load, every step is reachable, no console errors, completion fires for each lesson. Capture screenshots at key moments (the dialogue_listen step, a selfExplain step, a row test). Report any UI bugs / dead steps.

### Agent C-2 — Devon returning-user Playwright walk (M5)
Simulate a 7-day gap re-entry: navigate to `/ja/lesson/ja-m5-1` first (mid-curriculum). Complete the 8 lessons of M5. Assert all the same surface gates as C-1.

### Agent C-3 — Trevor optimizer Playwright walk (M6-M7)
Time-boxed: complete M6 in 8 mini-sessions, M7 in 8 mini-sessions. Assert XP-per-minute feels reasonable + no stuck states.

### Agent C-4 — Static curriculum quality re-audit
Run every relevant vitest: density-distribution, mcq-position-distribution, atom-coverage, ja-m3-m7-coverage, grammar-rule, mockCourse. Report pass/fail + the distributions. Tag any sub-lessons that still fall short.
