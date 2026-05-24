# Lesson authoring guide

How to author a Lingo JA sub-lesson that passes every standard we've accumulated. Living doc — refine as new findings land.

**Read this before authoring any new JA lesson.** Read `docs/curriculum-roadmap-n5-2026-05-18.md` (curriculum-level scope) + `docs/m3-m7-rebuild-spec-2026-05-18.md` (M3-M7 contract) + `docs/user-feedback/` (real-user evidence) for context.

---

## 1. The one-paragraph contract

A Lingo JA sub-lesson is **20-22 retrieval-heavy steps** that introduce 2-4 new atoms (vocab or grammar), drill them with rotating-answer MCQs + 1 typed translate + 1 speaking, fold in a `selfExplain` at position N-1 (after the learner has committed 2-3 times), and close with a 3-5 step **compounding-review tail** drawing from prior modules' `M3_M7_REVIEW_POOL`. Every introduced atom must re-surface ≥3 times across the M3-M7 corpus. No same-answer cloze clusters, no auto-pass on speaking, no hardcoded MCQ slot, no match-pairs grid below 4 pairs. The lesson is fun because every step is a chance to win; it teaches because every step makes the learner retrieve, not re-read; it sticks because every prior atom you've seen comes back when you'd start forgetting.

---

## 2. Density bar (every sub-lesson)

| Dimension | Floor | Aim | Ceiling |
|---|---|---|---|
| Step count | 20 | 21 | 22 (hard 25) |
| Distinct step types | 5 | 7-8 | — |
| Adjacent same-type | — | — | 1 (R3 rule) |
| Review-to-new ratio | 0.25 | 0.3 | — |
| Generation steps per sub-lesson | 1 | 2 (translate + speaking) | — |
| selfExplain per grammar-drill sub-lesson | 1 | 1 (at N-1) | 2 |
| Hard direction (translate / speaking) position | step 12+ | end | — |

Hard guards (vitest):
- `src/features/lesson/data/sub-lesson-density.test.ts` — fails if any sub-lesson < 12 or > 25 steps.
- `src/features/lesson/data/atom-coverage.test.ts` — fails if any introduced atom has < 3 occurrences across the corpus.
- `src/features/lesson/data/mcq-position-distribution.test.ts` — fails if any MCQ-type's correct slot has > 55% concentration.
- `_jaGrammarHelpers.ts:assertNoSameAnswerCluster` — throws at import if a sub-lesson's cloze block has ≥3 consecutive same-particle answers.
- `_jaGrammarHelpers.ts:assertAnswerRotation(steps, minDistinct=2)` — throws at import if a sub-lesson's cloze block has < 2 distinct correct particles (3 for drill-only sub-lessons).

---

## 3. Sub-lesson template (M3-M7+)

This is the canonical shape. Adapt freely within the density bounds, but every section should be represented.

```
Sub-lesson N — <name> (target: 20-22 steps)

  1.  [info: open]      One-line propulsion + audio cue. NOT exposition.
                        ("Three particles that put things AT, BY, and IN.")

  ── Atom introductions + immediate retrieval (8-10 steps) ──
  2.  grammar_rule    OR phrase_card trio
  3.  vocabMcq         (target = atom-1, emoji from n5-vocab-emoji-reference)
  4.  listening_comp   (anchor word, EN distractors)
  5.  vocab            (atom-2)
  6.  vocabMcq         (target = atom-2)
  7.  particle_cloze   (carrier sentence introducing the new particle)
  8.  vocab            (atom-3)
  9.  listening_build  (anchor sentence in mora tiles)
  10. particle_cloze   (rotating answer — different from step 7's correct)

  ── Mid-block production + selfExplain at N-1 (4-6 steps) ──
  11. translateStep    (TYPED — highest-tier retrieval; see §5.2)
  12. sentenceMcq      (kana-sentence selection from English prompt)
  13. particle_cloze   (third answer particle — must hit ≥3 distinct across the block)
  14. selfExplain      (AFTER 2-3 commits, NOT immediate — see §5.3)
  15. speaking         (anchor sentence — Whisper-graded)

  ── Compounding review tail (4-6 steps from prior modules) ──
  16. vocabMcq         (prior-module atom, distractor pool also prior-module)
  17. listeningCompSentence (prior-module sentence)
  18. reviewMatchPairs  (4-6 pairs from prior pool — never < 4)
  19. particle_cloze   (prior-module grammar reuse — compounds across modules)

  20. [info: close-win] Identity-anchored — "You can now ask where the train station is."
```

Variations:
- **Vocab-only sub-lesson** (introduces a noun set, no new grammar): skip the `grammar_rule` + the second `selfExplain` slot. Reuse a prior-module particle in cloze carriers. Keep the same overall density.
- **Drill sub-lesson** (no new atoms — pure rotation/interleave practice): swap `grammar_rule` + `vocab` slots for more cloze + selfExplain + production steps. Density holds via wider variety.
- **Dialogue closer**: ONE `dialogue_listen` step replaces multiple individual listening + MCQ steps. Wrap with warm-up vocab + production + review tail to hit 20-22.
- **Mastery row test**: the `row_test` step is itself a 6-12 item drill; the lesson is just 3 steps total (info open + row_test + info close). Exempt from the density bar.

---

## 4. Step-type cheat sheet

Use the M3-M7 helpers in `_jaGrammarHelpers.ts`. Inline literals are a last resort (no slot rotation, no atom-coverage tracking).

| Goal | Use | Notes |
|---|---|---|
| Show a new vocab word | `vocab(...)` or `phrase(...)` | Same factory; both produce `phrase_card`. Always include emoji from n5-vocab-emoji-reference if available. |
| Introduce a grammar concept | `grammarRule(...)` | Include 2-3 examples + antiPattern + cultureNote. |
| Cloze a particle answer | `cloze(...)` | Authors pass options in any order; the factory rotates the correct slot deterministically. Must hit `assertAnswerRotation(steps, 2+)` across the block. |
| Visual MCQ on a vocab word | `vocabMcq(...)` | Distractors auto-drawn from the supplied pool. Throws if pool can't yield 3 emoji-bearing foils. Skips `WORD_IMAGE_MCQ_BLOCKLIST` kana. |
| Kana sentence selection from EN prompt | `sentenceMcq(...)` | Slot-rotated. Three explicit kana distractors. |
| Free-recall typed Japanese | `translateStep(...)` | TYPED input (NOT MCQ — accidental win per audit §3.4; preserve). Highest-tier retrieval. |
| Listening comp on a sentence | `listeningCompSentence(...)` | EN options, slot-rotated. |
| Listening + reassemble in mora tiles | `listeningBuildSentence(...)` | For ≥4-mora sentences. |
| Build a short sentence from word tiles | `build(...)` | Only for ≤4-mora sentences. ≥5-mora → use `translateStep` + `listeningBuildSentence` + `speaking` instead. |
| Production by voice | `speaking(...)` | Whisper-graded, 2-fail-then-choice flow. NOT stubbed in M3-M7 (was a bug, fixed 2026-05-18). |
| Match Japanese ↔ English | `reviewMatchPairs(...)` | Auto-padded to ≥4 pairs from `M1_REVIEW_POOL` if local pool is thin. |
| Multi-turn dialogue + comprehension MCQs | `dialogueListen(...)` | NEW 2026-05-18. Replaces the legacy `dialogueLesson()` phrase-card chain. Use for every module's dialogue closer (M3-7, M4-7, M5-7, M6-8, M7-8). |
| Metacognitive "why is X correct" | `selfExplain(...)` | Place at sub-lesson position N-1 — AFTER 2-3 commits, NOT immediate. Rule-citing-wrong distractor (not "obvious nonsense"). |
| Chrome / framing card | `infoStep(...)` | Open = 1 sentence + propulsion. Close = identity-anchored win. NEVER use to pad a thin lesson. |

---

## 5. The five things authors get wrong (audit + tester pattern)

### 5.1 Hardcoding the correct MCQ slot
**Don't** ship an MCQ-type step with `correctOptionId: "correct"` in position 0 unless the factory handles rotation. Authors using `cloze` / `vocabMcq` / `sentenceMcq` / `selfExplain` / `listeningCompSentence` get rotation automatically. Inline literals (e.g., the per-module `particleMc` row-test helpers) must rotate using `slotFor(id, 4)` (exported from `_jaGrammarHelpers.ts`).

Regression guard: `mcq-position-distribution.test.ts` fails if any step type's correct slot concentration exceeds 55% across the corpus.

### 5.2 Wasting `translateStep` on word-bank prompts
`translateStep` ships TYPED INPUT (free-text textarea) — the strongest retrieval tier in the codebase. Authors sometimes underuse it because Q3 resolution in the roadmap said "Path A MCQ-only." That was overridden by the actual shipping behavior. **Use `translateStep` for every sub-lesson's free-recall slot.** Don't add word-bank options.

### 5.3 Firing `selfExplain` immediately after the first cloze commit
The CLT audit found this violates Kalyuga's expertise-reversal. After only 1 retrieval, the schema is at its most fragile — `selfExplain` lands when the learner is still encoding. **Place `selfExplain` at position N-1 of the drill cluster** — after 2-3 cloze/MCQ commits, when the schema has consolidated enough to introspect on.

### 5.4 Dismiss-on-sight `selfExplain` distractors
A distractor like `"は and が mean exactly the same thing — pick either one"` takes ≤0.5s to reject, degrading the step to recognition. Per Little & Bjork 2015 + Adesope 2017, the testing-effect gain requires plausible-but-wrong distractors. **Write distractors as rule-citing-but-wrong** (e.g., `"が introduces the answer to an implied wh-question"`) — true-sounding near-rules the learner could plausibly endorse.

### 5.5 Same-answer cloze monotony
`assertNoSameAnswerCluster` catches ≥3 *adjacent* same-particle answers, but a sub-lesson with 5 cloze items all answered with `は` still pattern-matches "always pick は." Use `assertAnswerRotation(steps, minDistinct=3)` after re-author. For sub-lessons that legitimately introduce ONE new particle (intro slot), relax to `minDistinct=2` with a `TODO(wave-N): tighten` comment.

---

## 6. Compounding review (the #1 differentiator vs Duolingo)

Every M3-M7 sub-lesson appends 3-5 review-tail steps drawing from `M3_M7_REVIEW_POOL` via `pickReviewAtoms(seedId, pool, n)`. The pool is additive across modules — each module appends its atoms with `fromModule: "m{N}"` so downstream modules can draw.

Every introduced atom **must re-surface ≥3 times** across the M3-M7 corpus. Atom-coverage test enforces this. M5+ atoms get extra scrutiny because there are fewer downstream modules to compound them.

**Module-specific notes:**
- **M3** atoms (です/か, は, basic sentence vocab) should appear in M4-M7 review tails. M3 itself only has M1+M2 to draw from for its own review tail.
- **M4** atoms (の, demonstratives, objects) should appear in M5-M7. Question word `だれ` is high-value — re-surface.
- **M5** atoms (numbers, counters, ください) have the **heaviest leakage** in the original M3-M7 — counter forms and `X です` duplicates often appeared once and never again. Collapse duplicates: teach bare counters once, use them in carrier sentences without re-introducing.
- **M6** atoms (locations, に/で/が) should appear in M7 verb-of-motion sentences (every motion verb takes a location particle — natural compounding).
- **M7** atoms have **no downstream module** in the current 30-module spine — every M7 atom must re-surface ≥3× WITHIN M7's own 8 sub-lessons. Be aggressive about internal review tails.

**Cross-module compounding rule** (in the test): atoms introduced in M3-M5 must appear in at least one later-numbered module's review tail. M6+M7 atoms exempted (M6 may compound in M7 only; M7 has no successor).

---

## 7. Audio, emoji, and surface-form conventions

### Emoji
- Use `docs/n5-vocab-emoji-reference-2026-05-18.md` for canonical emoji per N5 vocab word.
- 22.5% of N5 words are **blocked** (no honest visual referent — abstract concepts, pronouns, existence verbs). For these, use `phrase_card` / `particle_cloze` / `listening_build` / `dialogue_listen`. Add to `WORD_IMAGE_MCQ_BLOCKLIST` if not yet there.
- Same emoji can legitimately appear on multiple words at different specificity (朝 / 今朝 / 毎朝 all → 🌅). Author distractor pools per-lesson; don't try to globally disambiguate.

### Audio
- TTS pipeline: Edge-TTS (Nanami + Keita) via `getTtsUrl(text, lang)` + `playJaAudio(text)`. Honors silent-mode setting on auto-play (manual taps always play).
- For non-TTS audio (alphabet drills), `getAlphabetAudioUrl(audioKey)` + `playLocalAudio(url)` (volume-controlled).
- New audio additions: pre-generate via the Python TTS pipeline; commit the manifest entry alongside the lesson.

### Surface forms
- Atoms should be **bare kana** (e.g., `ペン`, `さんにん`), not `X です`-suffixed (e.g., `ペンです`, `さんにんです`). Surface forms with `です` are duplicative atoms in the coverage audit and bloat the count. Teach the bare noun + drill the `です` form in cloze stems.
- Romaji strings (`Spencer`, `amerikajin`, `FamilyMart`) leaked into supposedly-kana fields in the original rebuild. Use katakana (`ファミマ`) or wrap in a phrase that doesn't surface the romaji as a standalone atom.

---

## 8. Speech step gotchas

- Default `stubbed: false` for all whole-word + sentence speaking (sa-row through M7 dialogue closers). `stubbed: true` only for legacy M1 vowel placeholders and single-kana drills (Whisper grades sub-second audio poorly).
- 2-fail flow: after 2 fails, learner picks "Continue (skip, no pass)" OR "Keep trying." NO auto-pass.
- Per-error helper copy: see `SpeakingStepView.tsx:helperText` — already written. Add a new error path only when a real new failure mode appears.

---

## 9. Win cards (the close)

**Don't:** "は as topic marker — unlocked."
**Do:** "You can now point at things, name them, and ask whose they are."

Identity-anchored win copy (Cialdini Unity, audit synthesis §2.6). The learner self-categorizes — "I am someone who can do X in Japanese" — which is more durable than abstract concept-unlocking.

Pair with the upcoming wave's CelebrationToast wiring (audit §2.1) — when the win-card mount fires the toast, the somatic + verbal payoff compound.

---

## 10. Constraints (the "don't")

- **Don't** add new step types without a written spec entry (see roadmap §5 for the design template).
- **Don't** edit M1/M2 mock data unless a specific bug requires it. They're the density-bar reference + the kana-mastery on-ramp.
- **Don't** rewrite the legacy `dialogueLesson()` factory — it's still used by older code. Add to it; don't break it.
- **Don't** ship a sub-lesson without running `tsc --noEmit` + the full vitest suite. The hard guards exist for a reason.
- **Don't** delete external lesson IDs — they're referenced from `mockCourse.ts` + tests + (soon) flashcards + (soon) FSRS. Preserve `ja-m{N}-1` through `ja-m{N}-K`.
- **Don't** introduce surface-form duplicates as atoms (see §7).

---

## 11. The fastest way to author a new sub-lesson

1. Pick a target slot (`ja-m{N}-{n}`). Read the surrounding sub-lessons to know the curriculum context.
2. Open `mock-ja-m{N}.ts` near the relevant `export const M{N}_{n}` block.
3. Copy the template in §3 above; fill in the atom-introduction section with your 2-4 new atoms.
4. Pull review-tail atoms from `pickReviewAtoms(\`ja-m{N}-{n}-rev\`, PRIOR_POOL, 5)`.
5. Wire each step using factories from `_jaGrammarHelpers.ts` — never inline literals.
6. Add the import-time guards: `assertNoSameAnswerCluster(M{N}_{n}.steps)` + `assertAnswerRotation(M{N}_{n}.steps, 2)` (or 3 for drill sub-lessons).
7. Run `npx tsc --noEmit` + the four relevant vitest files (density, atom-coverage, mcq-position, ja-m3-m7-coverage). All green = ship.
8. If your atoms aren't in `M3_M7_REVIEW_POOL`, add them with `fromModule: "m{N}"` so future modules can compound.

---

## 12. Living history

| Date | Change | Doc |
|---|---|---|
| 2026-05-18 | Density target raised 14-20 → 20-22 | spec §13.1 |
| 2026-05-18 | `dialogue_listen` step type shipped | wave-4 outline §3 |
| 2026-05-18 | `assertAnswerRotation` helper shipped | this guide §2 + §5.5 |
| 2026-05-18 | `padMatchPairsToTarget` shipped (never empty grids) | this guide §4 |
| 2026-05-18 | MCQ slot rotation hardened (Murmur3 finalizer) | this guide §5.1 |
| 2026-05-18 | Speaking step: 2-fail → user choice; persistent-error skip | this guide §8 |
| 2026-05-18 | Speaking step: sa-row + M3-M7 dialogue closers un-stubbed | this guide §8 |
| 2026-05-18 | Atom-coverage hard floor: ≥3 occurrences | this guide §2 + §6 |
| 2026-05-21 | Card-type → lexical category rubric locked | this guide §13.1 |
| 2026-05-21 | Image-MCQ-as-introduction pattern (vocabMcq BEFORE bare vocab) | this guide §13.2 |
| 2026-05-21 | Just-in-time grammar teach (RULE_MO in M3-7 inline) | this guide §13.3 |
| 2026-05-21 | Forced sentence_build replacing copula-cloze | this guide §13.4 |
| 2026-05-21 | Close-on-confidence step (matchPairs after dialogue peak) | this guide §13.5 |
| 2026-05-21 | Grading = review-only (teach steps never write SRS) | this guide §13.6 |
| 2026-05-21 | `excludeFromSrs` + `isSrsEligibleAtom` filter on deck builder | ja-course-atoms.ts |
| 2026-05-21 | Particle-tile separation in build tile banks (open work) | this guide §13.10 |

---

## 13. Authoring patterns retrospective — 2026-05-21 M3 rewrite

The 2026-05-21 M3 rewrite landed a set of reusable patterns that should propagate to M4-M7 authoring. These are the things that worked — file them next to the per-step factory cheat sheet (§4) when you're authoring new content.

### 13.1 Card-type → lexical category rubric (locked)

Map atom lexical category to the dominant retrieval step type. Author the FIRST graded encounter using the matching step type; downstream encounters can vary.

| Lexical category | Dominant retrieval | Why |
|---|---|---|
| Concrete noun with canonical emoji (りんご, ねこ, ほん, コーヒー) | `vocabMcq` (image MCQ) | Image is unambiguous; recognition-first; survives mixed-age audience. |
| Compound noun without single-glyph emoji (にほんじん, アメリカじん) | `listeningCompSentence` (audio→meaning) + `speaking` | Composite — no clean image cue; audio carries the load. |
| Verb (たべる, のむ, みる) | `build` (forced single-answer tile bank) | Action images are ambiguous; tile-bank production drills the form. |
| Adjective (あおい, おおきい) | `build` (forced) OR `phrase_card` exposure + `sentenceMcq` recognition | Color emoji exist (🟦) but the kana ↔ image mapping is weaker than nouns. Production-direction build is the safer choice. |
| Pronoun (わたし, あなた, これ/それ/あれ, なん) | `build` (forced) — never image_mcq | Rubric block: `WORD_IMAGE_MCQ_BLOCKLIST` in `_jaGrammarHelpers.ts`. Demonstrative-image cues are deeply context-dependent. |
| Function-phrase / greeting (すみません, こんにちは, おねがいします) | `phrase_card` + `listeningCompSentence` | No image; oral function carries the meaning. |
| Particle (は, か, を, に, で, も) | `particle_cloze` | Form-focused practice in carrier sentences. Don't drill in a `particle_cloze` slot if the answer would be `です` — see §13.4. |
| Kanji-word (when productive — M10+) | `audio_spelling_mcq` (factory to be built) on top of recognition | Tests sound→kanji-spelling; spelling-MCQ assumes sound↔meaning already bound. |

**Image-MCQ ceiling rule:** "bad image is worse than no image." If the kana ↔ image mapping is ambiguous (>1 valid interpretation), fall back to `listeningCompSentence` or `sentenceMcq`. Don't force image_mcq when the emoji doesn't disambiguate the meaning.

### 13.2 Image-MCQ-as-introduction pattern

For concrete-noun atoms, lead with `vocabMcq` BEFORE the bare `vocab` card. The image IS the introduction.

```ts
// PATTERN (M3-3 ねこ at mock-ja-m3-v2.ts:525):
vocabMcq(
  "ja-m{N}-{n}-mcq-{atom}",
  { kana: "ねこ", meaningEn: "cat", emoji: "🐱", fromModule: "m{N}" },
  POOL_M{N-1}_OR_M{N-2},
),
speaking("ja-m{N}-{n}-speak-{atom}", "ねこ", "Cat"),
// NO bare vocab card — the MCQ + speaking pair is the intro.
```

When this pattern is right:
- Atom has a clean emoji asset (cross-ref `docs/n5-vocab-emoji-reference-2026-05-18.md`).
- Atom hasn't been seen in the curriculum yet (this IS the formal teach).
- Distractor pool has 4+ atoms with emojis the learner can read.

When NOT to use it (keep the traditional `vocab → vocabMcq` pair):
- The atom has cultural context worth surfacing (e.g., コーヒー with the "ー is a long vowel mark" note).
- The atom is in a "people-words batch" where the vocab card carries shared explanation across multiple atoms.

### 13.3 Just-in-time grammar teach (don't pre-load particles in earlier modules)

When a new particle / grammar piece is needed in lesson X, formally teach it in lesson X — not in a future lesson. Then M(X+1)+ can weave it into example sentences without re-teaching.

Concrete: `RULE_MO` in M3-7 (`mock-ja-m3-v2.ts:1331`). Pattern:

1. Lesson opens with warm-up and cumulative review on already-taught content.
2. Right before the construct is needed (the dialogue, the production block), ship `grammarRule({...})` with one `antiPattern` showing the broken form.
3. ONE contextual exposure (`phrase_card` showing the construct in use, no retrieval pressure).
4. The construct is used naturally in the next step (dialogue, sentence-build, etc.) — first real retrieval happens here.
5. ONE retrieval beat AFTER the use (`sentenceMcq` discriminating the new construct vs near-misses).
6. M(X+1)+ uses the construct in sentence examples without ever re-teaching it.

This is the "teach once, build subtly" cadence Spencer locked in. **Anti-pattern:** introducing a particle as a quiz answer in lesson X when it's never been formally taught. Forward-leak = test-before-teach.

### 13.4 Forced sentence_build replacing copula-cloze

Don't drill `です` (or any copula / sentence-ender that isn't grammatically a particle) in a `particle_cloze` slot. Doing so teaches the learner "です is one of the particles I pick" — Roediger & Marsh 2005 negative testing.

**Bad** (what the 2026-05-21 rewrite removed):
```ts
cloze(
  "...",
  "あれは いぬ", "。",
  "です",                            // <-- です as a "particle option"
  ["です", "は", "か", "の"],          // <-- mixed pool
  ...
),
```

**Good** (replace with forced sentence_build on the same target):
```ts
build(
  "...",
  "Build: 'That over there is a dog.'",
  "あれは いぬです",
  ["あれは", "いぬです", "これは", "ねこです"],
  ["あれは", "いぬです"],
),
```

Same target sentence, same retrieval beat, production direction, no negative-testing risk.

### 13.5 Close on confidence

The last cognitive step of a sub-lesson should be a step the learner is **likely to get right**, not the hardest production. The high-energy peak (dialogue, hard production) belongs in the middle of the lesson's second half; the close is recognition-easy.

Recommended closing tail order:
1. Peak: `dialogue_listen` / hardest `build` / `speaking` on a long target.
2. One short retrieval beat on the peak's atoms.
3. **`reviewMatchPairs` as the closer** — 4-6 pairs, recognition-easy, almost-always-right.
4. `infoStep` (win variant) — identity-anchored "you can now…" close.

The rewrite's M3-7 follows this exactly (`mock-ja-m3-v2.ts:1477` dialogue → `:1539` mcq retrieval → `:1554` speaking → `:1561` matchPairs → `:1564` info-end).

### 13.6 Grading = review-only (the flip-side invariant)

Teach steps never write to SRS. The rule:

- An atom's first appearance in the curriculum is a **teach** step. Ungraded.
- An atom acquires SRS state the first time it appears in a step where `step.exercisedAtoms` resolves to a card that ALREADY has SRS state from a prior session — at which point it's a **review** step.
- A "review pool" must only sample from atoms that have been graded before. Drawing a never-taught atom into a review beat = test-before-teach.

Two practical consequences:
- Phase 4 of the vocab-SRS-unification plan (CLAUDE.md §"Vocab SRS unification") wires `gradeFromLesson` into LessonPage with this rule.
- The `exercisedAtoms` tagging phase (CLAUDE.md §2) determines which atom IDs each step writes to. Teach steps either don't tag, or tag with `gradeAsReview: false`.

### 13.7 Distractor plausibility

The 2026-05-21 audit found "MCQ ordering is off" was actually about **distractor quality**, not slot position (slot rotation is healthy via the Murmur3 finalizer). Fix-pattern:

| Distractor type | OK? |
|---|---|
| Semantically plausible near-miss (`せんせいですか` vs `せんせいの ですか` — different particle, different meaning) | ✅ |
| Same lexical category, different lexeme (`コーヒーです` vs `タクシーです`) | ✅ |
| Wrong sentence type (statement vs question) | ✅ — tests sentence-type discrimination |
| Word-order-impossible bait (`ですか せんせい`) | ❌ — solved by elimination |
| Random filler (`タクシーの コーヒー` for "It's a taxi") | ❌ — solved by elimination |

**Audio-MCQ rule:** distractors should share initial mora with the correct answer. If they don't, the test is reading-the-emoji-label not hearing-the-audio.

### 13.8 Atom registry discipline

Every atom used in lesson content must have its `introducedByLessonId` set in `src/features/flashcards/data/ja-course-atoms.ts` pointing to its FIRST formal teach lesson. Two failure modes to avoid:

1. **Forward-leak**: atom is `fromModule: "m4"` (or no `introducedByLessonId`) but is used in M3 carrier sentences without formal teach. → Either backfill (atom moves to M3) or scrub from M3 (defer use to M4).
2. **Drift**: lesson code formally teaches an atom (adds a `grammar_rule` or `vocab` card) but the registry still tags it under the old module. → Always update both: lesson code + atom registry.

When you change a lesson to add a formal teach for a previously-forward-leaked atom, also:
- Update `fromModule` to the new module.
- Add `introducedByLessonId: "ja-m{N}-{n}"` pointing at the formal teach.
- Add a `note:` documenting the move so future auditors don't think it's an error.

**Two-stage attribution (kana introduced in one module, vocab introduced in another):** When an atom's kana shape is taught in module N but the word as a vocab unit lands in module M (M > N), set `fromModule: "m{N}"` AND `introducedByLessonId: "ja-m{M}-{n}"`. Example: `inu` (`いぬ`) and `neko` (`ねこ`) in `ja-course-atoms.ts:82-83` carry `fromModule: "m1"` (where the kana shapes ship) but `introducedByLessonId: "ja-m3-3"` (where they become drillable vocab). The compounding-review pool keys off `fromModule`; the curriculum-coverage tests key off `introducedByLessonId`. Both fields are load-bearing.

### 13.9 SRS pool filter (`isSrsEligibleAtom`)

`buildJaCourseDeck()` in `ja-course-atoms.ts` filters via `isSrsEligibleAtom`. Rules:

- `excludeFromSrs: true` → excluded (explicit opt-out for alphabet-trainer atoms).
- `kind: "particle"` → included (particles are single-kana but grammatically essential).
- Length-1 kana + no emoji + not a particle → excluded (alphabet-trainer territory).
- Everything else → included.

When adding a new atom: if it's a single-kana standalone word (like a numeral kana on its own), set `emoji` so the pool keeps it (the emoji disambiguates the meaning).

### 13.10 Particle-tile separation in build tile banks (shipped 2026-05-21)

In `build()` and `listeningBuildSentence()` tile banks, particles are separated from their host nouns. Pre-attached particles gave the answer away — the learner just picked the right chunk instead of choosing the particle.

**The pattern (across all M3-M7 build sites):**
```ts
// Particles as their own tiles — the learner must choose は and です:
tiles: ["わたし", "は", "にほんじん", "です", "がくせい"]
correctOrder: ["わたし", "は", "にほんじん", "です"]
```

**Particles that get their own tile:** は, が, を, に, で, の, から, か, です. (Yes — です gets separated as its own tile. It's a copula but for production-direction tile assembly, it's treated like a particle so the learner picks it.)

**Kept attached:** ます-form verbs (います, あります, いきます, たべます, のみます), ください, adjective stems (おおきい, あおい — adjective conjugation isn't formally taught until M8+, so the bare adjective form ships as a single tile).

The renderer's `JSON.stringify(placed) === JSON.stringify(step.correctOrder)` comparison handles either shape; display join works via the `granularity === "word"` space separator.

**Shipped scope (2026-05-21 sweep):** 45 `build()` calls + 13 `listeningBuildSentence()` calls + 4 row-test build payloads across M3-M7. Two builds intentionally ship with 7-token answers (`ja-m4-6-translate-s2` "Is that your bag?" and `ja-m4-6-s5` "Which is your dictionary?") — both are M4-6 production-cluster cards where the は + の + か compound is the entire pedagogical target.

### 13.11 Single-kana atoms live in the alphabet trainer, not the SRS deck

Single-kana atoms (え, き, つ as standalone "words") belong in the alphabet trainer on the Practice page — not in the cumulative vocab review queue. The SRS deck filter handles this automatically (§13.9). The implication for lesson authors:

- Don't add a single-kana atom to `M3_M7_REVIEW_POOL`. The compounding-review tail only draws multi-kana atoms.
- If you NEED a single-kana atom in a lesson (e.g., a hiragana spotlight in M2), keep it scoped to that lesson — don't tag it for cross-module re-exposure.
- Numerals like に (two) / ご (five) are special — they're single-kana but the emoji (2️⃣ / 5️⃣) disambiguates the meaning, so they stay in the deck.

### 13.12 The cloze rotation gold standard (M3-5)

Perfect rotation of particle answers across a cloze block. Pattern from M3-5 (`mock-ja-m3-v2.ts:947-1067`):

- 6 clozes, answers alternate `は / か / は / か / は / か` — no two adjacent same.
- Each cloze surface position (beginning, middle, end of sentence) varies so the learner can't pattern-match on slot.
- Non-cloze interleavers (sentenceMcq, listeningBuild, speaking) break adjacency.

This is the shape any future drill-only sub-lesson should target. `assertAnswerRotation(steps, 3)` is the gate when the block introduces 3 distinct particles; `(steps, 2)` is the gate for 2-particle blocks. **Keep the gate matched to the actual block content** — drift between docstring promise and shipped gate (M3-4 ships 2 but docstring promises 3 as of this writing) is a known anti-pattern.

### 13.13 Canonical M8+ sub-lesson template (locked 2026-05-23)

Per the 2026-05-23 re-audit (`docs/curriculum-audit-vs-research-2026-05-21.md` + the M3-M7 template-consistency audit), M3-M7 converged on a recognizable 8-sub-lesson shape with documented divergences. Spencer's call: **lock this as the canonical template for M8+**. Variants distinguished by grammar-concept count.

#### 8-sub-lesson template (2 grammar concepts — matches M3 / M4 / M7)

| Pos | Role | Step factories |
|---|---|---|
| L1 | Vocab intro (≥5 new atoms) | `vocab` × 5–8, `vocabMcq`, `listeningComp`, `speaking`, `matchPairs` (review tail) |
| L2 | Grammar rule A + drill | `grammarRule` + `cloze` × 4–5 (rotating answers ≥2 distinct) + `sentenceMcq` × 1–2 + `listeningComp` + `selfExplain` at N-1 + 1 `build`/`speaking` + review tail |
| L3 | More vocab in context | `vocab` × 5 inside L2 carriers + `vocabMcq`/`listeningComp` interleave + 2–3 `cloze` on new vocab + 1 `build` + review tail |
| L4 | Grammar rule B + drill | Same shape as L2 |
| L5 | Interleaved drill (L2+L4) | 6 `cloze` rotating ≥2 distinct particles + `sentenceMcq` + `listeningComp` + `selfExplain` at N-1 + 1 `build` + review tail |
| L6 | Production | 4–6 `build` + 2–3 `speaking` + 1 `listeningBuild` + 1–2 `sentenceMcq` + 1 `selfExplain` (optional) + review tail |
| L7 | Comprehension closer | **EITHER** `dialogueListen` (2-speaker exchange, 2–4 lines + 1–3 questions) **OR** `storyComprehension` (single-voice narrative 1–8 lines + 1–3 questions + chained `build_sentence` response). Warmup vocab recap before; cumulative review tail after. |
| L8 | Row test ★ | Auto-built via `buildRowTest` |

#### 9-sub-lesson variant (3 grammar concepts — matches M6)

Insert an extra `RuleC + drill` at position 4 and an extra interleave at position 6. Closer slides to L8, row test to L9.

#### When to choose dialogueListen vs storyComprehension for L7

- **dialogueListen** — fits modules where the natural setting is a transactional exchange (café, directions, introductions). 2 speakers, 3-4 turns, comprehension MCQs only.
- **storyComprehension** — fits modules where the natural setting is a narrative (recounting a day, reading a short story, hearing a monologue). Single voice OR multi-voice without alternation, 1-8 lines, comprehension MCQs PLUS a chained `build_sentence` response (the learner answers what they'd say in reply).

Mix freely across the course. Both write SRS the same way (recognition modality on comprehension, production on the response build).

#### Tagging atoms for FSRS grading (Spencer's invariant)

Every graded step factory in `_jaGrammarHelpers.ts` accepts an `exercisedAtomKanas?: string[]` argument (or auto-resolves from `target.kana` for atom-keyed factories). When set, the step's `exercisedAtoms` populates and `LessonPage.handleStepComplete` advances FSRS state for those atoms. **Teach steps** (`phrase_card`, `info`, `grammar_rule`, `symbol_intro`, `teach`) NEVER write SRS — the `shouldWriteSrs(step)` gate in `_stepPredicates.ts` blocks them even if they accidentally carry `exercisedAtoms`. Sentence-level factories (`build`, `speaking`, `listeningBuildSentence`, `listeningCompSentence`, `sentenceMcq`, `translateStep`) require the author to pass the kana list. Atom-keyed factories (`vocabMcq`, `audioImageMcq`, `audioMeaningMcq`, `translationMcq`, `reviewMatchPairs`, `dialogueListen` via the `exercisedAtomKanas` option, `cloze` from `correctParticle`) auto-tag.

---

*This guide is the condensed output of the M3-M7 rebuild waves (per `curriculum-roadmap-n5-2026-05-18.md` Q8 resolution) plus the 2026-05-21 M3 rewrite retrospective and the 2026-05-23 SRS modality / canonical template lock. Refine as new findings land.*
