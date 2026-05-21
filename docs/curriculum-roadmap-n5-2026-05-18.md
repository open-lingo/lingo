# Curriculum Roadmap — N5 in 30 Modules (2026-05-18)

Research + planning artifact. Written 2026-05-18 from Spencer's brief:
> "modules 1 and 2 are good for now… let's look into the structure for future modules, maybe including a new step type if needed and then along with that, let's research modules 3-30~ and see if we can reasonably cover ALL of N5 vocab and grammar rules in a reasonable amount of time."

Four threads woven together:
1. What M1/M2 got right (the working pattern).
2. What M3-M7 currently lacks (the gap to close).
3. N5 scope (vocab / grammar / kanji / hours).
4. A roadmap for M3-M30 with step-type additions, kanji policy, accessibility hooks.

Companion to `learning-science-foundation-2026-05-17.md` (the *why*), `m1-density-restructure-plan-2026-05-17.md` (the *how dense*), `m2-row-template-2026-05-17.md` (the *what shape*), and `curriculum-design-v2.md` (the *what order*).

**Status: living doc.** Iterate per-session; condense into `docs/lesson-authoring-guide.md` (per Q8 resolution) after M3-M7 rebuild lands. Per-question resolutions appended to §8 inline; cross-cutting framework concepts in §10.

---

## 1. Executive summary

**Where we are.** M1 (hiragana, 39 lessons) and M2 (dakuten/yōon, 37 lessons) are the density gold-standard — every sub-lesson rotates 5-7 distinct step types, every new atom traverses see→hear→write→produce, and a row-test gates mastery. Combined they introduce ~50 anchor words and the kana writing system. M3-M7 are pedagogically thoughtful (≤2 grammar concepts per module, copula → topic-marker → の → demonstratives → numbers → に/で/が → を + verbs) but structurally thin — average ~5.5 real-work steps per lesson, ≤2 step types per drill block, and several lessons let the learner pattern-match the answer without reading the sentence (M3-5 delimiter exploit, M6-6 = 6× が, M7-5 = 6× を). Total content today teaches ~125 words. N5 needs ~800.

**What N5 actually demands.** Multiple sources converge on **~600-800 vocab words**, **~80-100 grammar points** (50-100 if you collapse the verb-form families), **~100 kanji** (80-120 range depending on source), assessed across Vocabulary, Grammar+Reading, and Listening sections. Typical study load is **150-250 hours** for an English-L1 learner with no kanji background (up to 460 hours per some surveys; ~100 hours for the 70% who pass-marginal). For the broadest age band Lingo targets (8-80), plan for the upper end and accept that a child + a retiree will both need ~6-12 months at 20-30 min/day.

**The plan.** **30-module N5 spine, ~35-45 hours of in-app study time, ~3 new step types**, **kanji introduced at recognition-only starting M14** (after the learner has a 300-word vocab base and the syntactic spine to anchor characters into). The roadmap below sketches M3-M30 with theme, new grammar, vocab budget, and the ★ review modules between every 3-4 content modules (extending the existing `moduleReviewSchedule` SRS pattern). Three step types are proposed as additions: `reading_passage` (essential for the Reading section), `dialogue_listen` (essential for Listening), and `self_explanation_mcq` / `conceptual_contrast` (one or both — they're the missing pedagogy moves for は/が-style L1-contrastive grammar). `translate` is already defined in `types.ts` but underused — wake it up before adding new types. Three things remain explicitly open for Spencer: kanji policy timing, whether to ship a kana-input typed-translation step or stay MCQ-only, and whether to expand beyond pure-JLPT-N5 content (slang, common signage kanji, JR Station kanji).

---

## 2. What M1/M2 got right — the working pattern

### Per-row structure (from `mock-ja-m1-ka.ts` + `mock-ja-m2-g.ts`)

```
Sub-lesson 1 — Intro: meet 2-3 new atoms + 1 anchor word
  [info:open]
  for each new atom:
    symbol_intro → symbol_trace (M1 only) → symbol_recognition
  word_image_mcq + listening_build for the anchor
  symbol_to_sound × all-new-atoms     # hard direction at the end
  [info:close]

Sub-lesson 2 — Practice: 2 more atoms + cumulative consolidation
  intro block for new atoms (no trace in M2)
  redo prior-sub mcqs (cumulative recall)
  translate (M2 added) + match_pairs + listening_build
  listening_comp × 3 (interleaved with speaking — no 2 same-type adjacent)

Sub-lesson 3 — Review (M2 only): cumulative + cross-module
  mix of word_image_mcq, symbol_to_sound, recognition, translate, speaking, match_pairs
  M1 prior-module review words sprinkled (FSRS-style via M1_REVIEW_POOL)

Row test — Mastery gate (auto-built from buildRowTestLesson)
  6-8 items from row pool, 70% pass, wrong → re-queue
```

**Density signal**: every sub-lesson hits 11-17 steps; every drill block uses ≥5 distinct step types. The drill-block rotation (no two adjacent steps of the same type — codified post-R3) is what kills patternization.

### The seven structural moves that make the pattern work

1. **Layered exposure per atom** — see (intro) → write (trace, M1) → hear→pick (recognition) → use (mcq + build) → hear→meaning (listening_comp) → say (speaking) → recall (symbol_to_sound). 6 step types touch one concept. Mirrors the Encounter→Encode→Elaborate→Retrieve→Apply→Transfer cycle.
2. **Closed-set distractor pools per row** — `pickThreeKanaDistractors` keeps wrong options grammatically plausible (same row + tile-pool fallback). Eliminates category-elimination shortcuts.
3. **Deterministic slot, non-deterministic answer** — `correctSlot` rotates the correct button position per step.id. Even within-step pattern recognition is killed.
4. **Anchor word as through-line** — 1 anchor word per row appears in mcq → build → listening_comp → speaking → row-test pool. Cumulative reinforcement without re-teaching. M2 g-row added a *second* anchor per sub-lesson; sub-3 sprinkles 4 M1 review words on top.
5. **Hard direction last** — `symbol_to_sound` (kana→romaji, production-shaped recall) is reserved for the end of every sub-lesson. Codified in `mock-ja-m1-l1.ts:16-20`.
6. **`info` chrome bookends, never interrupts** — two info cards per sub-lesson (open + close). M1 never uses info to artificially extend a thin lesson.
7. **Sentence sprinkle from ka onwards** — です + か info card at ka-3, plus one `build_sentence` + one `speaking` of "X です" per row's last sub-lesson (ka/sa/ta/na/ha/ma). Teaches the syntactic spine implicitly *while* the kana is the primary focus. This is the bridge M3+ should preserve.

### What earns a step its slot — the density bar

The 22-item audit checklist in `learning-science-foundation-2026-05-17.md` §7 is the answer. The shorthand version for the roadmap below:

- Every new atom encoded in **≥2 modalities** before the lesson ends.
- Every lesson contains **≥1 generation step** (build / type / produce / speak).
- Drill block contains **≥4 distinct step types**.
- ≥4 intervening steps between first encounter of an atom and first retrieval.
- No ≥3 consecutive same-answer clozes; particle answer set rotates ≥3 distinct options across the lesson.
- Hard direction (production / free recall) at the END.
- Wrong answers re-queue (row_test machinery already does this).
- Feedback names the rule, not just right/wrong.

The roadmap below assumes M3-M30 lessons hold this bar. The current M3-M7 lessons do not.

---

## 3. M3-M7 gap analysis

### Current state (verified 2026-05-18)

- **5 modules, 41 lessons, ~73 vocab words introduced** (counted via grep on `vocab(` + `phrase(` calls in `mock-ja-m{3-7}.ts`).
- **Average ~5.5 real-work steps per content lesson** vs M1's ~12.
- **5 lesson archetypes** per module, each ~1-step-type wide:
  - Vocab lesson: 5× `phrase_card`
  - Grammar lesson: 1× `grammar_rule` + 3-5× `particle_cloze`
  - Iteration lesson: 6× `particle_cloze`
  - Build lesson: 5× `build_sentence`
  - Dialogue lesson: 4-5× `phrase_card` + 1× `speaking`
- **No interleaving of step types within a lesson** (vs M1 where every sub-lesson rotates 6+ step types).

### Three specific failure modes worth naming

1. **Same-answer cloze clusters**. M3-5 has 6 clozes whose answers are `は, か, は, か, は, か` (delimiter exploit — pick か if `。` follows, else は). M6-6 has 6 consecutive answers all `が`. M7-5 has 6 consecutive `を`. These are recognition-of-screen-region tasks, not grammar drills.

2. **Vocab-only lessons with zero retrieval**. M5-1 = 5 vocab cards back-to-back. Learner taps Continue × 5, never recalls, never produces. The numbers lesson — one of the highest-leverage vocab pools in N5 — ships as exposure-only.

3. **build_sentence is now sunsetting at M5+**. `BUILD_SENTENCE_SUNSET_MODULES = new Set(["m5","m6","m7"])` filters the type out at the `getMockLessonContent` seam because at 5+ mora words the tile-build adds nothing. **Net effect: M5-M7 build lessons currently render as info-only after the strip**. The dev-warn fires on degenerate lessons; the production fix is to substitute `translate` + `listening_build` + a sentence-level production step, not just remove the type.

### Pedagogy bar M3-M7 misses (from the 22-item checklist)

| # | Check | M3-M7 status |
|---|---|---|
| 5 | Every atom in ≥2 modalities | ✗ vocab lessons are 1 modality (visual phrase_card) |
| 6 | ≥1 generation step per lesson | ✗ vocab lessons have zero |
| 8 | Self-explanation / comparison step | ✗ no such step type exists |
| 9 | Cued/free recall (not only MCQ) | ✗ no listening_build, no translate, no match_pairs in M3-M7 |
| 11 | Drill-block step-type interleave | ✗ 6× cloze blocks, 5× phrase_card blocks |
| 14 | ≥4 distinct step types per drill block | ✗ ≤2 typical |
| 15 | No >2 consecutive same-answer | ✗ 6× が, 6× を, は/か delimiter cluster |
| 16 | ≥3 distinct particle answers across lesson | ✗ 1-particle iteration lessons |
| 17 | Row-test gate | ✓ each module ends with row_test |
| 18 | Wrong-answer re-queue | ✓ row_test items max-retry 3 |

**Three of the 10 boxes ticked.** The rebuild plan in `m1-density-restructure-plan-2026-05-17.md` Phases B-F addresses all the failures; it remains queued (#R2-defer-D). The roadmap below assumes M3-M7 get rebuilt to the M1/M2 density bar before M8+ is authored — building M8 on top of the current M7 just propagates the gap.

---

## 4. N5 scope research

Sources cited in §10. Multiple cross-references; ranges given where sources disagree.

### Vocabulary

- **Total: 600-800 words** ([JLPT Sensei](https://jlptsensei.com/jlpt-n5-vocabulary-list/) lists 644 across 7 pages; [Migaku](https://migaku.com/blog/japanese/jlpt-n5-overview) says 600-800; [italki](https://www.italki.com/en/blog/jlpt-n5-vocabulary), [Japonin](https://www.japonin.com/jlpt-n5-present.html), and others consistently cite ~800).
- **No official list** — Japan Foundation has not published a vocabulary spec since 2010. Study materials reverse-engineer from past tests.
- **Composition** (from [Japanese Language Courses](https://japaneselanguagecourses.com/blog/how-many-words-in-jlpt-n5) breakdown):
  - Verbs: ~250-300
  - i-adjectives + na-adjectives: ~150-200
  - Nouns + adverbs + particles + katakana loanwords: remainder
- **Topical distribution** ([GyanMirai 22-topic breakdown](https://www.gyanmirai.com/jlpt/jlpt-n5/vocabulary-topics), totals ~652):

| Topic | Words | Topic | Words |
|---|---|---|---|
| Time & calendar | 97 | Body & health | 21 |
| Location & direction | 82 | Basic adjectives | 18 |
| Numbers & counting | 61 | Abstract concepts | 16 |
| Food & drink | 49 | Transportation | 12 |
| Family & people | 38 | Shopping & money | 12 |
| Communication | 33 | Actions & behavior | 12 |
| Verbs of motion | 32 | Arts & culture | 10 |
| School & education | 31 | Work & business | 7 |
| Physical descriptions | 31 | Emotions & feelings | 6 |
| Home & daily life | 30 | Sports & recreation | 5 |
| Clothing & appearance | 25 | | |
| Nature & weather | 25 | | |

Time + Location + Numbers alone = **240 words** — over a third of the N5 vocabulary load. Front-loading these is high-leverage.

### Grammar

- **Total: 41-100 points depending on how you count.** [Wikibooks JLPT N5 grammar](https://en.wikibooks.org/wiki/JLPT_Guide/JLPT_N5_Grammar) lists 41 collapsed points; [JLPT Sensei](https://jlptsensei.com/jlpt-n5-grammar-list/) lists 84; [Migaku grammar guide](https://migaku.com/blog/japanese/jlpt-grammar-points) says "roughly 60." The variation is in how tightly verb-form families are grouped (te-form alone has 5-6 named patterns).
- **Working number for the roadmap: ~80 grammar atoms** (matches the JLPT Sensei spec, the most commonly referenced).

**The 11 functional categories** (from Wikibooks, adapted):

1. **Particles & case markers**: は, を, に/へ, で, と, や, も, が (8)
2. **Copula & existence**: です, ～があります, ～がいます (3)
3. **Polite requests & suggestions**: ～てください, ～ませんか, ～ましょう, ～ましょうか, ないでください (5)
4. **Permission & prohibition**: ～てもいいです, ～てはいけません (2)
5. **Capability & skill**: ～のがじょうずです, ～のがへたです (2)
6. **Preferences & desires**: ～のがすきです, V-stem + たいです (2)
7. **Tense & aspect**: ～ている, まだ～ていません, ～たことがある (3)
8. **Causality & reasoning**: ～から, ～ので, ～んです (3)
9. **Comparison**: ～のほうが～より, ～のなかで～がいちばん～ (2)
10. **Temporal patterns**: ～にいく, ～から (time), ～まえに, ～てから (4)
11. **Quantity & transformation**: ～すぎる, ～く/～になる, ～たり…～たりする, つもりです (4)
12. **Modal**: でしょう, ～ほうがいい, ～なくちゃいけない (3)
13. **Conjugation families** (counted by Migaku as one "form" each, but each form has present/past/negative/past-negative for both i-adj, na-adj, verbs):
    - Verb ます-form (present, past, negative, past-negative)
    - Verb dictionary form
    - Verb te-form (and its function-stack: request, permission, prohibition, progressive)
    - Verb ない-form
    - Verb た-form
    - i-adjective conjugation (4 forms)
    - na-adjective conjugation (4 forms)
    - Counter system (人, 個, 枚, 本, 匹, 杯, 時間, 分, etc. — at least 8 productive counters in N5)

**Reality check** against current Lingo coverage: M3-M7 covers です/か, は, の, demonstratives, numbers 1-10 + 人 counter, に, で, が-existence, を, dictionary + ます-form. That's **roughly 12 atoms out of ~80**. The remaining ~68 are unbuilt.

### Kanji

- **Total: 80-120**, working number **~100** ([Hirakan list of 112](https://hirakan.com/blogs/japanese/kanji-jlpt-n5-list); [JLPT Sensei](https://jlptsensei.com/jlpt-n5-kanji-list/) says ~100; [Migii](https://migii.net/en/blog/jlpt-level-n5-kanji) says 100-120; one current source ([Kanjidon](https://kanjidon.com/blog/jlpt-n5-kanji-list/)) says 103 for the latest test).
- **Categories** (Hirakan grouping): numbers (20+), time (10+), people/places/things (30+), nature/directions (20+), verbs (15+), adjectives (10+).
- **N5 reading-only requirement** — the test does not require writing kanji productively at N5; recognition (reading) is sufficient. This matters for Lingo: kanji can be taught as `multiple_choice` + `word_image_mcq` extensions without ever needing a `kanji_writing` step type.

### Study hours

- **150-250 hours** for English-L1 learners with no kanji background ([Coto Academy](https://cotoacademy.com/study-hours-needed-pass-jlpt-comparison-levels/); [Migii](https://migii.net/en/blog/jlpt-n5-study-hours)).
- Survey: students with no kanji background reported **462 hours** to pass; with Chinese background, **350 hours** (Migii).
- **70% pass with only 100 hours of prep** per official JLPT statistics (cited Migii).
- Daily-rate guide: **1-2 hours/day → 2-6 months**; **3-4 hours/day → 2-3 months** (Migii / [JLPT Books FAQ](https://www.jlptbooks.com/faq/how-long-to-pass-jlpt-n5/)).

**Implication for Lingo**: a 30-module spine at ~75 min/module (per `m1-density-restructure-plan-2026-05-17.md` §4 length target) = ~37.5 hours of pure in-app time. That's well under the 150-hour total — but Lingo is the *foundation*, not the only study input. Realistically the learner spends another 30-50 hours on flashcards (FSRS reviews), 20-40 hours on listening exposure (anime, podcasts, native content), and 20-30 hours on a paid practice book or mock exams. Lingo's 37 hours should target *everything in the test* at recognition-with-light-production fluency; SRS handles the over-learning that elevates to 80% pass.

### Test format (from [official JLPT site](https://www.jlpt.jp/e/guideline/testsections.html))

Three sections, 90 min total:
- **Vocabulary** — 21 questions / 20 min. Kanji reading, orthography, contextual expression, paraphrasing.
- **Grammar + Reading** — 22 questions / 40 min. Grammar fill-in + sentence composition + short passages + mid-size passages + information retrieval.
- **Listening** — 24 questions / 30 min. Task-based comprehension, key-point comprehension, verbal expressions, quick response.

**Skills Lingo currently has step-type coverage for**:
- ✓ Vocabulary recognition (word_image_mcq, match_pairs)
- ✓ Grammar fill-in (particle_cloze, fill_blank)
- ✓ Sentence composition (build_sentence — though sunset M5+)
- ✓ Listening to a single word/phrase (listening_comprehension, listening_build)
- ✗ Reading a paragraph and answering (no step type)
- ✗ Listening to a multi-turn dialogue and answering (no step type — `dialogueLesson` shows phrase cards, doesn't quiz)
- ✗ Information retrieval from a text snippet (no step type)
- ✗ Quick-response listening (would need a timed variant — defer)

The N5 Reading and Listening sections together = **46 of 67 questions (69%)**. Lingo's current step-type catalog **cannot drill ~30% of the test**. Filling this gap is the load-bearing roadmap addition.

---

## 5. Step-type gaps + new-step proposals

Ranked by impact (highest first). Each weighed for necessity, engineering cost, pedagogy value.

### 5.1 `reading_passage` — HIGH NECESSITY, MEDIUM EFFORT

**Why**: N5 Reading section = 8-10 questions ~15 min, ~30% of the Grammar+Reading score. Lingo has no step type for it.

**What it looks like**: 3-5 sentence passage in known kana+vocab+grammar (≥85% known per the comprehensible input principle). Hover-to-reveal furigana on any kanji. Below: 2-3 multiple-choice comprehension questions. Optional "what's this passage about" gist question.

**Engineering**: reuses `AnnotatedJa` ruby renderer + `MultipleChoiceStep` for the questions. New step type to wrap them. Estimate ~1 dev-day for view + grading + step-type wiring.

**Pedagogy**: hits Encounter (comprehensible input — Krashen operational), Retrieve (testing effect), and Transfer (apply rules to novel sentence). The single missing piece for the Bloom *Understand* level.

**Blocking?** Critical from M10+. Build before M14.

### 5.2 `dialogue_listen` — HIGH NECESSITY, MEDIUM EFFORT

**Why**: N5 Listening section = 24 questions ~30 min, ~35% of the overall test. Lingo's current `dialogueLesson` shows lines as `phrase_card`s; the learner reads them. No retrieval.

**What it looks like**: 2-4 line dialogue plays audio (no transcript visible). Below: comprehension MCQ ("Where will they meet?" / "Who ordered the coffee?"). Optional transcript reveal after answer. Variants: full-blind (audio only, no transcript ever), gist (audio + question only), detail (specific factual answer).

**Engineering**: extension of `listening_comprehension` — same renderer + grading; new step type to enforce the dialogue-format prompt. Audio asset cost: each dialogue needs Nanami + Keita line-by-line via the existing TTS pipeline. Estimate ~1 dev-day for view + ~2 days for first-round dialogue content authoring.

**Pedagogy**: hits Retrieve (cued recall on meaning), Apply (parse multi-turn discourse), and matches the actual test format directly.

**Blocking?** Critical from M8+ (the natural slot is after the learner has past-tense + te-form + は/が contrast, so dialogues can be more than introductions). Build before M10.

### 5.3 `self_explanation_mcq` / `conceptual_contrast` — HIGH IMPACT, SMALL EFFORT

**Why**: Two separate moves from `learning-science-foundation-2026-05-17.md` §6.1 + §6.2. Both reuse `multiple_choice` rendering; both are *missing* moves in the current toolkit. Combining into a single step type with a `mode` field keeps the surface area small.

**`self_explanation_mcq`**: after a `particle_cloze` answer commits, follow-up MCQ asks **why** that answer was right. 3 options: surface heuristic (wrong), rule-citing (correct), unrelated distractor (wrong). Dunlosky 2013 moderate utility, replicated.

**`conceptual_contrast`**: 2-pane MCQ. Two minimally-different Japanese sentences are shown; learner picks which means X and which means Y. After commit, the rule is revealed naming the differentiator. Critical for は/が, transitive/intransitive pairs, には/では double-particles. Kapur 2016 ~30% improvement on transfer items.

**Engineering**: ~half a day for the self-explanation variant (literally a tagged `multiple_choice`). ~1-2 days for the conceptual_contrast 2-pane renderer.

**Pedagogy**: closes the *Understand* / Elaborate gap that the 22-item checklist flagged on M3-M7.

**Blocking?** Self-explanation is non-blocking, plug it in opportunistically from M4 onward. Conceptual-contrast is **required for the は/が-contrast lesson** (currently dodged by introducing が via existence in M6 — that defers the real reckoning to M~12-15 when は/が clash is unavoidable).

### 5.4 Wake up the existing `translate` step — ZERO EFFORT (type exists)

**Why**: defined in `types.ts:147-154` since 2026-05-16, used **once** in M2 (`mock-ja-m2-g.ts` g-2 translate-megane + translate-kagi) and that's it. The grading is already wired against `acceptedAnswers: string[]`. The expanded view (`translateMcq` in `_consonantRowHelpers.ts`) renders an MCQ over options drawn from the row pool.

**The unsolved sub-piece**: typed input (user types kana via IME or romaji) is **not yet wired**. The current `translateMcq` is recognition-shaped, not production-shaped. Two paths:

- **Path A — MCQ-only (zero new work)**: keep using `translateMcq` everywhere. Loses the free-recall multiplier but gains immediate use across M3-M30.
- **Path B — kana-input typed translate (medium effort)**: add a kana-input variant (kuroshiro normalizes romaji → kana or kana → kana, then matches `acceptedAnswers`). Production-shaped, hits the strongest retrieval tier per Roediger & Karpicke. Estimate ~2-3 dev-days for input handling + acceptance-set tooling + fuzzy match.

**Recommendation**: Path A now (use translateMcq everywhere from M3+), Path B as a future enhancement around M10. Don't block the roadmap on it.

### 5.5 Wake up `fill_blank` and `match_pairs` — ZERO EFFORT (types exist)

`fill_blank` is defined in `types.ts:139-145`, has a wordBank, supports multi-blank sentences. Currently superseded by `particle_cloze` for particles only — but **N5 has plenty of non-particle clozes** (verb-form fill-in: 「きのうとうきょうに ___ 」→「いきました」). Adopt for verb-form drills starting M11.

`match_pairs` is heavily used in M1/M2 (kana↔romaji), almost unused in M3-M7. The 4-pair format is perfect for cumulative vocab from prior lessons. Adopt as a baked drill in every M3-M30 lesson.

### 5.6 `verb_conjugation` — MEDIUM IMPACT, MEDIUM EFFORT

**Why**: te-form alone has 5 sub-patterns (group-1 / group-2 / irregular + 2 sound-change rules). A drill where the learner conjugates a single verb across all forms (dictionary → ます → ない → た → て) is the single-highest-leverage move for verb mastery. Currently you'd shoehorn it into 5 separate `multiple_choice` steps.

**What it looks like**: dictionary form shown ("たべる"); learner picks/types the requested form ("ます-form" → "たべます"). Repeat across the 5 forms for the same verb, then rotate to the next.

**Engineering**: ~2 dev-days for view + conjugation table + grading.

**Blocking?** Non-blocking but high-leverage from M16+ (te-form module).

### 5.7 `kanji_intro` / `kanji_recognition` — LOW EFFORT (extends symbol_* family)

**Why**: 100 kanji at recognition-only. The existing `symbol_intro` + `symbol_recognition` family generalizes — they're already abstracted over `scriptId`. KanjiVG stroke data is already in the codebase for the trace step.

**What it looks like**:
- `kanji_intro` = `symbol_intro` with kanji payload: shows kanji, on-yomi, kun-yomi, primary meaning, 2-3 anchor vocab using the kanji.
- `kanji_recognition` = `symbol_recognition` with "What does 水 mean?" or "Which kanji means 'water'?" depending on direction. Reuses MC.
- `kanji_trace` (optional) = `symbol_trace` with KanjiVG strokes. Defer to M~20+ as a "deepen if you want to" lesson; not required for N5.

**Engineering**: ~1-2 dev-days for the payload extension + script_id wiring; the views exist.

**Pedagogy**: dual coding works (kanji + meaning + reading + anchor vocab = 4 channels). The known-hiragana spine makes kanji recognition substantially easier.

**Blocking?** Required from M14 onwards in the roadmap.

### 5.8 Step types NOT to add

- **`pitch_accent_drill`**: N5 doesn't test pitch accent. Defer to N4+ if ever.
- **`writing_kanji` (kana-style trace)**: N5 doesn't test productive kanji writing. Trace step exists if a learner wants it; don't make it required.
- **`free_typing_translation`**: covered by typed `translate` (5.4 path B) — don't add a separate type.
- **`metacognitive_confidence_slider`**: from `learning-science-foundation-2026-05-17.md` §6.5, low impact. Defer indefinitely.

---

## 6. Roadmap M3-M30 — the 30-module N5 spine

### Conventions

- **★ Review modules** between every 3-4 content modules (extends `moduleReviewSchedule.ts` SRS to all major boundaries — 1d/3d/7d/14d/30d/90d intervals already shipped).
- **Vocab budget** is cumulative across modules. Target: ~600-800 by M30.
- **Grammar atoms** counted per the Wikibooks 41-point scheme (and verb-form families counted as one atom even though they contain 4-5 forms). Target: cover all ~80 atoms by M30.
- **Kanji introduced from M14**. Recognition-only; 5-8 per module. Target: 100 by M30.
- **Lesson count per module**: 6-9 (matches `m1-density-restructure-plan-2026-05-17.md` §4 target). Lessons are 8-12 real-work steps per the same target.
- **Estimated module time**: 65-90 min (lesson average 8-10 min × 7-9 lessons).
- **New step type column**: marks the first module that introduces a given step type.

### M3-M7 — REBUILD, do not extend

Per the existing `m1-density-restructure-plan-2026-05-17.md` Phases B-F. Spine stays:

| # | Module | Theme | New grammar | Vocab cum. |
|---|---|---|---|---|
| M3 | First sentences | です + か, は (topic) | ~25 |
| M4 | Things & people | の (possession), これ/それ/あれ/どれ | ~50 |
| M5 | Numbers + ください | 1-10 Sino, 人 counter, ください, から (origin) | ~75 |
| M6 | Where things are | に (destination), で (setting), が (existence) | ~105 |
| M7 | Verbs in motion | dictionary form, ます-form, を | ~135 |

Total after M7 rebuild: **~135 words, ~12 grammar atoms, 35-40 lessons, ~5-6 hours**.

### M3-M7 review modules

Bake one `module_review`-kind lesson INSIDE each module (per the m1-density doc §5). Drop the separate `m3-review`..`m6-review` pseudo-modules from the pathway. Keeps `buildModuleReview.ts` + `moduleReviewSchedule.ts` alive for cross-module FSRS-tier reviews (R2-defer-A FSRS-6 swap unlocks this further).

### M8-M11 — Adjectives, past, negation, time

Closes the "describe + recall the past" loop. Heavy reuse of M3-M7 grammar.

| # | Module | Theme | New grammar | New step types | Vocab cum. |
|---|---|---|---|---|---|
| M8 | i-adjectives | い-adj present + negative (たかい / たかくない) | `dialogue_listen` | ~165 |
| M9 | na-adjectives + よ/ね | な-adj present + negative (きれい / きれいじゃない), sentence-final よ/ね | (none — reuse) | ~190 |
| M10 | Past tense | i-adj past (たかかった), na-adj past (きれいでした), ます past (たべました) | `reading_passage` | ~220 |
| M11 | Negation deep-dive | ます-negative (たべません), ない-form intro (たべない), まだ + もう | `self_explanation_mcq`, `fill_blank` wake-up | ~245 |
| **★** | **M8-M11 review** | Cumulative; FSRS-stage-2 SRS | — | — |

### M12-M15 — Daily life, time, frequency, kanji intro

| # | Module | Theme | New grammar | New step types | Vocab cum. |
|---|---|---|---|---|---|
| M12 | Time & calendar | clock time, days of week, 月 (months as numbers), counter 時 / 分 | (none) | ~285 |
| M13 | Frequency adverbs | いつも, よく, ときどき, あまり, ぜんぜん; から (time) | (none) | ~315 |
| M14 | **Kanji intro + N5 set 1** (numbers + time) | 一二三四五六七八九十百千万 + 日月年時分 | `kanji_intro`, `kanji_recognition` | ~340 |
| M15 | Wants & desires | V-stem + たい (want to do), がほしい (want a thing), すき/きらい | (none) | ~375 |
| **★** | **M12-M15 review** | Cumulative; kanji recognition tested | — | — |

**Kanji timing rationale**: by M14 the learner has ~315 vocab, the syntactic spine, and 13 modules of fluent hiragana practice. Introducing kanji as "the shapes you've been hearing about" lands more naturally than introducing them at M5 where the cognitive load competes with grammar.

### M16-M19 — Te-form, location, transportation, weather

This is the te-form gauntlet — the single highest-leverage grammar concept after は/が. Spread it across two modules instead of front-loading.

| # | Module | Theme | New grammar | New step types | Vocab cum. |
|---|---|---|---|---|---|
| M16 | Te-form intro | te-form rule per verb group; ～てください (request); ～ている (progressive) | `verb_conjugation`, `conceptual_contrast` | ~410 |
| M17 | Te-form expanded | ～てもいいです (permission), ～てはいけません (prohibition), ～てから (after) | (none) | ~445 |
| M18 | Transportation & directions | で (means), counter 台, ～までに (by-time) | (none) | ~480 |
| M19 | Weather + seasons | 天気 vocab, ～と思います (intro to thinking), でしょう (it'll probably) | (none) | ~510 |
| **★** | **M16-M19 review** | Te-form drill heavy; kanji set 2 reviewed | — | — |

### M20-M23 — Family, body, food, restaurants

The first "I have a life" module cluster. High volume of concrete nouns + transactional dialogues.

| # | Module | Theme | New grammar | New step types | Vocab cum. |
|---|---|---|---|---|---|
| M20 | Family + people register | family terms (お父さん vs ちち), age + 才/歳 counter | (none) | ~545 |
| M21 | Body + health | body parts, 痛い (hurts) pattern, ます-form medical phrases | (none) | ~575 |
| M22 | Food + restaurants | extended food vocab; ～てください (re-drill); ～と (with whom) | (none) | ~605 |
| M23 | **Kanji set 3** — body + family + food | 人男女子父母兄姉口目耳手足肉魚 | (none — reuse kanji types) | ~620 |
| **★** | **M20-M23 review** | Cumulative dialogue listening | — | — |

### M24-M27 — Comparison, asking around, hobbies, plans

| # | Module | Theme | New grammar | New step types | Vocab cum. |
|---|---|---|---|---|---|
| M24 | Comparison | ～のほうが～より, ～のなかで～がいちばん | (none) | ~650 |
| M25 | Asking around + capability | ～のがじょうずです, ～のがへたです, ～ましょうか, ～ませんか (invitation) | (none) | ~680 |
| M26 | Hobbies + activities | ～のがすきです, ～たり…～たりする (enumerated activities), counter 回 | (none) | ~710 |
| M27 | Plans + intentions | つもりです (plan), ～にいく (going to do), ～ことがあります (experience) | (none — `translate` typed input wakes here optionally) | ~740 |
| **★** | **M24-M27 review** | — | — | — |

### M28-M30 — Causality, capstone, exam prep

| # | Module | Theme | New grammar | New step types | Vocab cum. |
|---|---|---|---|---|---|
| M28 | Causality | ～から (because), ～ので (because, impartial), ～んです (explanation softener) | (none) | ~770 |
| M29 | **Kanji set 4** (verbs + nature) + ない-form deepening | 見聞言行来食飲山川海雨花木 + ない-form drilled across all verbs | (none) | ~800 |
| M30 | **N5 mastery capstone** | Cumulative test simulation + N5 mock-test prep + ★ graduation | (none) | ~800 |
| **★** | **M28-M30 review** | Final consolidation; FSRS hands off to standalone flashcards | — | — |

### Roll-up

| Cluster | Modules | Hours | Vocab end | Kanji end | Grammar atoms |
|---|---|---|---|---|---|
| M3-M7 rebuilt | 5 + 1 ★ | ~6 | 135 | 0 | 12 |
| M8-M11 | 4 + 1 ★ | ~6 | 245 | 0 | 20 |
| M12-M15 | 4 + 1 ★ | ~6 | 375 | 21 | 27 |
| M16-M19 | 4 + 1 ★ | ~6.5 | 510 | 21 | 38 |
| M20-M23 | 4 + 1 ★ | ~6.5 | 620 | 36 | 42 |
| M24-M27 | 4 + 1 ★ | ~6 | 740 | 36 | 56 |
| M28-M30 | 3 + 1 ★ | ~5 | 800 | 50 | 65+ |
| **Total** | **28 content + 7 review = 35 module-units** | **~42 hours** | **~800** | **~50** | **~65** |

**Gap notes**:
- **Kanji 50 vs N5 target 100**. The 50 above are the high-frequency core (numbers, time, body/family/food, common verbs, nature). The remaining 50 N5 kanji can ship as a sidequest module after M30 OR be threaded as ★ review additions. Spencer's call.
- **Grammar 65 vs N5 target ~80**. The 15-atom gap is mostly compound verb-form patterns (～たり…～たりする, ～ながら, ～がほしい, ～ことができる) and N5-edge structures (～でしょう degrees, ～かもしれない). M28-M30 can absorb them as "fluency layer" drills if the schedule allows.
- **35 module-units × ~80 min/unit = ~46.5 hours**. Above the 37.5h estimated from `m1-density-restructure-plan-2026-05-17.md` because review modules add ~7 × 60 min = ~7h. Still well under the 150-250h external study estimate; the rest is FSRS reviews + native-content exposure.

---

## 7. Accessibility + age accommodations woven in

Spencer's framing: "for people of all ages and abilities" is a design constraint, not a checkbox. Each accommodation marked where in the roadmap it lands.

### Children (8-12)

- **Win-per-minute pacing** — keep lesson length ≤8 min (the roadmap holds this). The 3-button `LessonComplete` "I'm done, save my XP" path (#R1-shipped) is the right move; children stop when they stop.
- **Trace step motor leniency** — already shipped at +10% threshold. M14+ kanji trace should ship at +15% leniency given the higher stroke count. Per-user "Easier writing" toggle (#R3-defer-E queued).
- **Visual density** — emoji + image-MCQ should remain the spine through M30. The `word_image_mcq` rate target: ≥2 per lesson in any module with new vocab.
- **No streak guilt** — already shipped via "Rest mode" being on the queue (#R1-defer-D).
- **Kanji intro at M14, not earlier** — children's verbal-to-visual mapping isn't slower than adults', but kanji-as-puzzle requires a vocab base to anchor against. Earlier than M14 lands as memorization rather than recognition.

### Teens + young adults (13-25)

- **Identity-relevant content** — M22 (food + restaurants), M26 (hobbies), M27 (plans) are the natural slots for anime/manga vocab woven in. Author lessons with manga-fluent reading passages where the source allows. Avoid feeling manipulative; let the cultural callout cards be matter-of-fact, not "you'll be cool if you learn this."
- **Speech anxiety** — existing silent-mode toggle (#R1-shipped) + Maya's flashcards-as-opt-out-for-speaking (#R1-defer-C). Teen speech anxiety is high; respect it by never auto-playing in the absence of explicit permission.
- **Gamification ceiling** — leaderboard hidden under "Coming soon" (#R1-shipped) is right. If we add real leaderboards in N4-territory, scope them to small groups (cohort of 10) not global.

### Adults (26-50)

- **Time per session** — 8-min lessons fit lunch + commute slots. Soft-cap toast after 25 min (#R1-defer queued, Trevor's binge protection).
- **Dignity / no streak shame** — already shipped.
- **ROI visibility** — the cumulative vocab + grammar counts in the roadmap above (every ★ review module names "you now know N words, M grammar points") are the operational form. Author the ★ review module copy to say this explicitly.

### Older learners (50+)

- **Slower input** — Whisper speaking thresholds should ratchet for older learners. Per-user accessibility profile (#R1-defer-E) covers this.
- **Text + audio over visuals** — kana intro lessons (M1/M2) already do this; M3+ word_image_mcq is image-primary. **Add `optionsAudioFirst` toggle** in Settings that auto-plays the audio when a step mounts and reduces emoji visual prominence. Small dev cost. Queue for M~12 along with the broader accessibility profile.
- **Font size + contrast** — Atkinson Hyperlegible already preset; default `system` is the leak (#R3-defer-C font-lazy-load + dyslexia auto-toggle).
- **Slower TTS option** — Edge-TTS rate is currently fixed. Add a 0.75x / 1.0x / 1.25x slider in Settings. Small dev cost. Queue.

### Disabilities

- **Colorblind** — MC verdicts are red/green. Add a verdict-shape indicator (check / X icon) alongside color. WCAG 1.4.1. ~half a day.
- **Low motor** — trace step has 10% leniency now; the per-user profile (#R1-defer-E) extends this. Optional "skip trace" toggle: lesson still grants ★, learner uses recognition-only path. Queue.
- **Dyslexia** — Atkinson Hyperlegible preset; auto-toggle on first-run accessibility prompt (#R3-defer queue). Romaji default ON for speaking + accessibility settings panel (#R3-defer-B queued).
- **Hearing-impaired** — every `listening_comprehension` and `dialogue_listen` step needs a "show transcript instead" affordance. Already partially honored via `transcript` field in `ListeningComprehensionStep`; the view doesn't surface it as a fallback yet. ~1 dev-day to make it a learner-side toggle.
- **ADHD** — lesson length cap (~8 min) is the structural fix. Pause-modality system (#97 future scope) handles audio-fatigue cap. The hard-cap should be exposed as a setting ("Limit me to N lessons per day") — Trevor's binge protection is the ADHD-aware version too.

### Marked accommodation hooks in the roadmap

| Module | Accommodation work to ship alongside |
|---|---|
| M8 (i-adj) | Colorblind verdict shape (one-time fix; lands here because dialogue_listen needs it for "right answer" cue) |
| M10 (past tense + reading_passage) | Reading passage needs hover-furigana + font-size respect + reduced-motion check |
| M12 (time & calendar) | Slower TTS toggle (numbers + dates are the longest TTS strings; pacing matters most here) |
| M14 (kanji intro) | Kanji trace step ratchets to +15% leniency; "skip trace" toggle wired |
| M16 (te-form) | Optional "show conjugation table on every cloze" accessibility toggle — older learners struggle with table recall |
| ★ between M19-M20 | Hearing-impaired transcript-fallback affordance lands (by this point dialogue_listen is heavy) |

---

## 8. Open questions for Spencer

Mark each `[now]` / `[defer]` / `[needs more info]`. Each item is a fork in the roadmap that I couldn't decide alone.

1. **N5-only vs broader scope?** Roadmap above is strictly N5. Spencer's note in `m1-density-restructure-plan-2026-05-17.md` open-question 1 implied "M3-M30 covers N5 with a few practical extensions." Confirm: lock to JLPT N5 exclusively, OR thread in practical extras (slang like やばい, JR station kanji set, common signage like 出口/入口, anime-derived phrases)? If yes to extras, where do they live (sidequest modules vs sprinkled into themed modules)?

   **Update 2026-05-18 (preference, not research-decidable):** No literature can settle JLPT-strict vs +extras — it's an audience/identity call. Decision drivers: (a) learner self-image (test-takers vs immersion-curious vs both), (b) maintenance cost of dual canon (each extras module is one more drift point when N5 specs update). Flagging for Spencer's call.

   **Resolved 2026-05-18 (Spencer):** Both. N5 spine + extras as sidequests. Goal-selection unlock at ~M5 (see §10.1) routes test-takers to mock-exam + JLPT sidequests; general learners to immersion sidequests + CEFR badging (§10.5).

2. **Kanji policy — start at M14 or earlier/later?** Roadmap says M14 (after ~315 vocab). Alternatives:
   - **Earlier (M10)** — risk of cognitive-load competition with past tense + negation, but unlocks reading_passage with kanji in M10 lessons.
   - **Later (M20)** — risk of cramming 100 kanji into 10 modules, but a learner has 545 vocab by then and characters anchor faster.
   - **Never-required, recognition-only on demand** — kanji as a parallel sidequest track from M14, never gating any required module. Most lenient; closest to Duolingo's "kanji is optional."

   **Update 2026-05-18 (research-backed, medium confidence):** Shift earlier than M14. Best move: kanji **recognition-only as a parallel low-stakes track starting M~5** (after kana automatic, ~50-100 vocab). Don't gate on M14. Mori 1998 (*Modern Language Journal*, n=42 + n=45 across two experiments): English-L1 learners process kanji via phonological recoding — they need *some* spoken-vocab anchoring but not 315 words. Rose 2017 synthesis of ~8 studies (Toyoda, Shimizu, Kubota et al.): productive-writing load is the demotivator, not exposure — recognition-first / radical-decomposition retains learners. The roadmap's M14 instinct conflates exposure with production. Recognition-only changes the timing answer materially.

   **Resolved 2026-05-18 (Spencer):** Kanji track as **sidequest from ~M5 onward** — intro card + trace + furigana. Recognition required, productive optional. Aligns research update (shift earlier) with the sidequest framework from Q1 / §10.7.

3. **Kana-input typed translate — ship now or M~10?** Path A (MCQ-only) ships zero new work; loses production strongest-tier retrieval. Path B (typed input + kuroshiro normalization) is ~2-3 dev-days. Critical question: how badly do we need free-recall translation in the roadmap? My read: ship Path A across M3-M30, plan Path B as a M10-M14 upgrade. Spencer's call.

   **Update 2026-05-18 (research-backed, medium-high confidence):** Stay Path A; demote Path B from "upgrade" to "optional sidequest." Adesope, Trevisan & Sundararajan 2017 (*Review of Educational Research* meta-analysis, k=118 studies): MCQ practice produced *larger* gains (g=0.70) than short-answer (g=0.48) vs no-test controls. Little & Bjork (*Memory & Cognition*, replicated): competitive distractors trigger covert retrieval of related material that open-ended formats do *not*. Zhang & Pérez-Paredes L2-vocab meta-analysis (*ReCALL*): no statistically significant difference between recognition and production formats. Caveat: Roediger & Marsh 2005 (*JEP:LMC*) — poorly-designed lures get encoded as false knowledge, so distractor quality is load-bearing. The only defensible reason to add typing is **productive orthographic recall** (forming kana/kanji from memory), not retention. For 8-12yo, typing friction adds extraneous cognitive load.

   **Resolved 2026-05-18 (Spencer):** Defer Path B. Future scope: optional typed variant alongside word-bank translate, post-N5. Path A (MCQ-only) ships across M3-M30.

4. **`reading_passage` vs `dialogue_listen` — which lands first?** Both required for N5 test coverage. Roadmap puts dialogue_listen at M8, reading_passage at M10. Reading_passage is slightly higher engineering effort (hover-furigana renderer). Dialogue_listen has audio content cost (TTS for every line). Confirm sequence, or swap?

   **Update 2026-05-18 (research-backed, low-medium confidence — no direct sequencing RCT exists):** Keep current sequence (dialogue_listen M8, reading_passage M10). Ear-first slightly favored. Vandergrift & Goh 2012 + Vandergrift 2007 (*Language Teaching* review): listening is the most-neglected skill in instructed L2 and aural decoding is the rate-limiter for downstream reading and speaking. Hamada 2025 (*Int. J. Applied Linguistics*): aural decoding correlates r=0.69-0.72 with L2 listening comprehension with an ~80% threshold effect — reading-to-listening transfer does *not* automatically happen for non-cognate L1. Webb/Yanagisawa/Uchihara vocab-modality work: incidental vocab gains roughly equal across reading and listening, so modality choice is a wash for vocab; decide on skill development, which favors listening first.

   **Resolved 2026-05-18 (Spencer):** Build all four — `reading_passage`, `dialogue_listen`, `info_retrieval`, `quick-response`. Speaking variants opt-in where they fit (§10.8). Sequencing per research update: `dialogue_listen` first (M8), `reading_passage` second (M10). Mockups for new step types green-lit.

5. **`conceptual_contrast` step type — necessary or shoehorn?** The roadmap puts it at M16 for transitive/intransitive verb pairs, which is the cleanest N5 use case. But the load-bearing use is **は vs が**, which the roadmap dodges by introducing が via existence in M6 and never doing a head-to-head contrast lesson. Two paths:
   - **Bake は vs が contrast at M~11 or M~12** when the learner has enough syntactic comfort to handle it (textbook approach).
   - **Defer は vs が contrast to N4** and accept that N5 learners will conflate them (Duolingo approach; faster but pedagogically weak).
   Spencer noted in `full-app-audit-2026-05-17.md` R2-defer-C that は vs が "has no concrete explanation sometimes" — implies preference for deferring. Confirm.

   **Update 2026-05-18 (research-backed, HIGH confidence on explicit > implicit; medium on module timing):** Bake the explicit は/が contrast lesson around M~11-12. **Do NOT defer to N4** — this counters the R2-defer-C instinct. Two gold-standard meta-analyses converge: Norris & Ortega 2000 (*Language Learning*, k=49 unique samples 1980-1998): explicit instruction d≈1.13 vs implicit d≈0.54, durable on delayed posttests. Spada & Tomita 2010 (*LL*, k=41): explicit > implicit holds *especially* for **complex** grammatical features — the "は/が is too complex so let it acquire naturally" intuition is contradicted by the data. Goo, Granena, Yilmaz & Novella 2015 replicated with 1999-2013 studies; advantage holds. Nishi 2017 (CAJLE, with Sakamoto 1993): wa/ga discourse contrast stays unresolved even at advanced levels without explicit teaching — Duolingo's implicit pattern-match route demonstrably under-delivers. Productive-failure delivery (Kapur 2016, *Educational Psychologist*) is a reasonable design choice *within* explicit instruction, not a substitute for it. The "our explanations confuse learners" concern points at *explanation quality*, not at deferring — the fix is iterating the contrast presentation, not skipping it.

   **Resolved 2026-05-18 (Spencer):** Third path. Spine teaches は and が as **prerequisites** where they naturally appear (M3 for は, M6 for が via existence). Explicit head-to-head contrast moves to an opt-in **deep-dive sidequest** (§10.7) with tailored examples for learners who want it. Resolves the research-vs-defer tension: explicit instruction wins for engaged learners who self-select into the sidequest; exposure handles the spine. Honors Spencer's "prereq-first, understandability-second, defer complicated explanations" ladder principle.

6. **Module length — 6 or 7-9 lessons?** Roadmap above uses 6-9 with ★ review modules between every 3-4 content. M1 has 39 sub-lessons in a single "module" entity; M3-M7 each has 7-9. Are 30 modules at 7-9 lessons each (~210-270 lessons total) the right density, or should the spine compress to ~20 modules at 10-12 lessons each? Pathway visual density matters here — Spencer flagged the "extra progress markers inflate perceived size" issue.

   **Update 2026-05-18 (research-backed, medium confidence):** Hold 8-10 min lessons and ~7-9 lessons/module. Don't compress to 20-modules-of-10-12. Cepeda et al. 2008 + Latimier, Peyre & Ramus 2021 (*Educational Psychology Review*): the dominant variable is **inter-session interval**, not within-session length — 9 ten-minute sessions over 9 days beats one 90-min block (robust, replicated, n in the thousands). Sweller CLT: ~4±1 novel chunks per session ceiling, the current 8-12 step structure aligns *if* most steps are review not novel intros (a constraint the M1/M2 density bar already meets). Staub et al. 2023 (*Frontiers in Cognition*, n=262, ages 7-85): no lifespan attention differences at the 10-vs-30-min lesson scale — no need for age-segmented session-length defaults. The "2-3 min per year of age" rule for children is folk wisdom, not from a controlled study. Microlearning meta-analyses favor 5-15 min but with I²>80% heterogeneity; treat as suggestive, not gold-standard. **Pathway density is a UI/visualization problem to solve in the pathway view, not in module compression.**

   **Resolved 2026-05-18 (Spencer):** Hold 8-10 min lessons. **Raise sub-lesson density target to ~20 steps** (currently 11-17 in M1, sit close to but don't exceed 20). Every sub-lesson appends 2-4 prior-content review steps for the compounding effect (§10.4). Folds into M3-M7 rebuild brief.

7. **★ review module placement — between every 3 modules, or end-of-quarter (every 7)?** Roadmap uses every 3-4. Cepeda 2006 ratio-based spacing supports both, depending on target retention interval. Tighter (every 3) feels more cumulative; looser (every 7) reduces ★ inflation on the pathway. Spencer call.

   **Update 2026-05-18 (research-backed, medium-high confidence):** Keep every-3-4 cadence. Cepeda et al. 2008 temporal ridgeline (*Psychological Science*, n=1,354, k=26 gap×delay combinations): for a 6-month retention target the optimal study-gap interpolates to ~18-27 days = every 3-4 modules (~3-4 weeks each). Every-7 puts the gap at ~80% of test delay — steep declining side of the ridgeline. Cepeda et al. 2006 (*Psychological Bulletin*, 184 articles, 317 experiments, 839 effect sizes) is the canonical foundation. Mawson & Kang 2025 classroom meta-analysis (22 reports, N>3,000, d=0.54 [0.31, 0.77]) — spacing effect transfers to real classrooms with *larger* effects at longer retention intervals, directly relevant to your 6-month horizon. Caveat: none of these studies test cumulative review-modules layered on top of an FSRS-style background; the cadence is the cleanest prescription without that interaction effect being empirically pinned.

   **Resolved 2026-05-18 (Spencer):** Every 3-4 + flashcard interleave at session login. Compounding cumulative review is a **first-class authoring rule** (§10.4), not just a review-module concept — every new lesson reuses prior atoms.

8. **Lesson authoring path — agents vs solo?** M3-M7 rebuild alone is ~40-50 agent hours per `m1-density-restructure-plan-2026-05-17.md` §7. M8-M30 at the same density bar is ~150-200 agent hours. At that scale, the lesson-authoring guide (`m1-density-restructure-plan-2026-05-17.md` §9, deferred to post-Phase-H) becomes load-bearing — without it agents regenerate the M3-M7 drift. Write the guide before or after the M3-M7 rebuild lands? My take: write it after M3-M7 rebuild (the guide should describe what the codebase actually does, per Spencer's `check_existing_codebase_for_output_patterns` memory). Confirm timing.

   **Update 2026-05-18 (engineering judgment, not research-decidable):** Stick with author-after-rebuild. Your `check_existing_codebase_for_output_patterns` memory + the "the guide describes what the code does" principle both push the same way. If we write it first it encodes aspiration; agents then drift to match the aspirational guide and the unfinished code at once, and we lose the ground-truth anchor that the M1/M2 hand-authored files currently provide.

   **Resolved 2026-05-18 (Spencer):** Author **after** M3-M7 rebuild — those modules will hold the backbone for all future authoring (except kanji, which slots in via the sidequest pattern from Q2 / §10.7).

9. **Cultural / locale-specific content acceptance bar.** N5 is heavily Japan-anchored (JR train stations, 100-yen shops, コンビニ). Older learners or non-travelers may want the dialogues to land outside Japan-as-tourist contexts. Do we author dialogues with explicit "you're in Japan as a tourist" framing (current default) or layer alternative cohort framings (you're studying remotely / you have a Japanese family member / you work with Japanese colleagues)? Affects M22/M25/M27 most.

   **Update 2026-05-18 (preference, not research-decidable):** No literature decides this — it's an audience-hypothesis call. Decision driver: are non-traveler personas (older learners, work-with-Japanese-colleagues, anime-curious, remote-study) churning at M22+ because tourist framing doesn't fit them? If unknown: simplest path is ship tourist-default at M22, instrument completion-rate by persona via the existing session telemetry, then layer alternate-cohort dialogues only if data shows drop-off. Don't pre-build five framings on speculation.

   **Resolved 2026-05-18 (Spencer):** Tourist-default + Japanese culture intro for the N5 core. Sub-paths and sidequests handle work-specific / other audience differentiation later. **Future scope: Lingo as a content-ingestion tool** for authentic Japanese content (NHK Easy, manga snippets, signage) — the long-term mechanism that resolves cultural framing across all audiences.

10. **Recap / capstone — full mock exam, or just module-style recap?** M30 is currently sketched as "N5 mastery capstone + mock-test prep." A real mock exam would need authoring of 67 official-format questions, timed UI, scoring. Heavy lift, ~1 dev-week. Alternative: a 2-lesson "your weakest concepts, drilled" cumulative session that uses FSRS state. Confirm scope.

   **Update 2026-05-18 (engineering judgment, not research-decidable):** Ship the FSRS-tagged cumulative recap, not the mock exam. Mock exam = ~1 dev-week + heavy authoring (67 official-format items × distractor sets × timed UI × scoring) and reuses no existing machinery. Recap reuses the FSRS state that's already shipped. A real mock exam belongs as an optional sidequest post-M30 once the spine is solid — it's a *practice* artifact, not a *teach* artifact, and the in-app capstone should be on the teach side.

   **Resolved 2026-05-18 (Spencer):** Both — cumulative FSRS-recap at M30 *and* a standing **mock-proficiency-test feature**. Built post-rebuild as a **shared engine with placement tests** (same MCQ-format step types, timing, scoring — see §10.6). Mock + placement collapse into one engine with two preset families.

11. **Sidequest module backlog.** `mock-ja-sidequest-survival.ts` exists. Do sidequests count toward the 30-module roadmap, or are they orthogonal? My read: orthogonal, optional, available to learners who finish M~5 onward. But they should pull from the same vocab pools (avoid re-teaching) and ideally feed back into FSRS. Confirm.

   **Update 2026-05-18 (preference, not research-decidable):** Sidequests stay orthogonal — don't count toward 30. Vocab-pool sharing + FSRS feedback are the right structural invariants. Flagging for Spencer confirmation.

   **Resolved 2026-05-18 (Spencer):** Orthogonal — don't count toward 30. Gated by module progress (§10.2 — M1 learner doesn't see conjugation drills). Suggested by selected goal (§10.1). Vocab pool shared with main spine; FSRS feedback wired.

12. **FSRS-6 swap timing — block M14+ on it, or land later?** R2-defer-A queues the engine swap. SM-2 is fine through M10; from M14+ when kanji review-tail starts, the "cards return when you'd start forgetting" pitch becomes load-bearing. If kanji lands at M14, FSRS-6 should land by M12. Confirm.

   **Update 2026-05-18 (research-backed, HIGH confidence on "FSRS > SM-2 on prediction"; medium on "matters meaningfully at N5 scale"):** Swap to FSRS-6. open-spaced-repetition srs-benchmark (~10K Anki users, 500M+ reviews, time-split train/test methodology — closest thing to a gold-standard benchmark in the field): FSRS-6 beats SM-2 for **99.5% of users** with ~25% workload reduction at equal retention. Anki adopted FSRS as default in v23.10 (Nov 2023) after independent validation against their own user base. Ye et al. 2022 (ACM SIGKDD, peer-reviewed) established the DSR/FSRS model is principled but used proprietary MaiMemo data; the open-benchmark replication is the load-bearing evidence. Scale caveat: improvement is biggest at ≥1,000 reviews per user; N5 sits at ~1,500-3K cards over 6 months = moderate band, not transformative. Cold-start failure mode (fixed initial-stability defaults misfire on first 1-2 weeks) is real but matches SM-2's same weakness. **Cross-link to Q2 update:** if kanji shifts earlier than M14 (recognition track from M~5), the FSRS-6 timing should shift earlier too — land by M~8 so the kanji review-tail benefits from day one.

   **Resolved 2026-05-18 (Spencer):** Land early. "Flashcards interleave at session login" + kanji recognition sidequest from M~5 (Q2 resolution) both presume a working FSRS engine; swap should land by M~8 so the early review tail benefits from day one.

---

## 9. Implementation phasing (suggestion, not prescription)

Spencer drives sequencing. This is what I'd recommend if asked.

| Phase | Scope | Effort | Blocks |
|---|---|---|---|
| **P0** | M3-M7 rebuild (`m1-density-restructure-plan-2026-05-17.md` Phases B-F) | ~40-50 agent hours | All downstream M8+ work |
| **P1** | Write `docs/lesson-authoring-guide.md` (m1-density §9) | 2-3h | M8+ author dispatch |
| **P2** | Wake up `translate` + `match_pairs` + `fill_blank` across M3-M7 retrofit | included in P0 | — |
| **P3** | Build `dialogue_listen` step type + view | 2-3 dev-days | M8 dialogue lessons |
| **P4** | Author M8-M11 (adj + past + negation) | ~25-30 agent hours | — |
| **P5** | Build `reading_passage` step type + view | 2-3 dev-days | M10 reading content |
| **P6** | Build `self_explanation_mcq` + `conceptual_contrast` | ~2 dev-days combined | M11 self-explanation seeds, M16 contrast |
| **P7** | FSRS-6 swap (R2-defer-A) | ~1 dev-week | M14+ kanji review tail |
| **P8** | Author M12-M15 (time + frequency + kanji + たい) | ~25-30 agent hours | — |
| **P9** | Build `kanji_intro` / `kanji_recognition` extensions | 1-2 dev-days | M14 |
| **P10** | Build `verb_conjugation` step type | 2-3 dev-days | M16 te-form |
| **P11** | Author M16-M30 in 4-module chunks | ~120-150 agent hours total | — |
| **P12** | Accessibility hooks (colorblind verdict, slower TTS, transcript fallback) | 3-5 dev-days | M19+ |
| **P13** | Final ★ capstone authoring (M30) | ~10 hours | — |
| **P14** | Optional: typed `translate` (Path B) | 2-3 dev-days | non-blocking |

**Total dev-engineering: ~3-4 weeks (~15-20 dev-days)**. **Total agent-hours for content authoring: ~220-260.** **Total wall-clock at Spencer's typical 1-2 sessions/week with 4-10 parallel agents: ~3-5 months.**

---

## 10. Living framework — concepts to fold into the future authoring guide

These are the framework-level concepts surfaced in the 2026-05-18 sync that go beyond per-module roadmapping. They aren't open questions (those are §8, now resolved) — they're the **structural rules** the future `docs/lesson-authoring-guide.md` (per Q8) will condense and codify. **This section is living** — append new concepts as they emerge; condense to the authoring guide when M3-M7 rebuild lands.

### 10.1 Goal-selection unlock at ~M5

After the learner passes M5 (or tests out of it), they pick a primary goal:

- **N5 test-prep** → auto-enables mock-exam (§10.6), suggests JLPT sidequests (kanji recognition track, grammar fill-in), N5 progress as primary metric.
- **General fluency** → suggests immersion sidequests (signage, anime phrases, slang), CEFR estimate (§10.5) as primary metric.
- **Travel-focused** → survival sidequests, JR station kanji, ordering / asking-directions dialogues.
- *(Future: more presets per audience — work-with-Japanese-colleagues, study-abroad, etc.)*

Switchable at any time. Frame as **positive branching**, never as restriction. Non-test-takers should never see test-prep content unless they opt in.

### 10.2 Practice-feature gating by module progress

Practice / drill surfaces unlock as module progress crosses thresholds:

| Feature | Unlocks at |
|---|---|
| Flashcards | M1 (shipped) |
| Kanji recognition drills | ~M5 (with kanji sidequest) |
| Dialogue-listening practice | ~M8 |
| Reading-passage practice | ~M10 |
| Conjugation drills | ~M16 (after te-form lands) |
| Mock exam | After M30 OR after passing a placement test |

Needs a feature-unlock registry (`featureUnlocks: Record<FeatureId, { minModule: string }>`). Practice / grammar / conjugation routes currently reachable from nav at any progress — soft leak to close during rebuild.

### 10.3 Sub-lesson density target: **20-22 steps**, aim 21

Authoring target (Spencer directive 2026-05-18, post-tester walkthrough): every sub-lesson **20-22 steps, aim 21**. Was "~20 ceiling" — raised to a **floor of 20** after the tester (T8 in `docs/user-feedback/2026-05-18-tester-m1-m2-walkthrough.md`) asked for *more* end-of-sub-lesson recap. Above 25 = hard ceiling; split into two sub-lessons if you'd exceed.

Every sub-lesson appends 2-4 review steps from prior content (compounding rule §10.4) AND/OR a sentence-pattern sprinkle (T11 tester finding). Absorbs CLAUDE.md R2-defer-F (prior-row review tail).

Current M3-M7 sub-lessons mostly sit at 14-19 (per the wave-2 rebuild). Wave-4 should re-density them to 20-22.

### 10.4 Compounding-effect authoring rule (first-class)

Every new content lesson must pull a quantifiable fraction of prior atoms — not just review modules. M1's `M1_REVIEW_POOL` pattern is the precedent; promote to every-module requirement.

**Working metric:** review-to-new ratio per sub-lesson **≥ 0.25** (1 review step per 4 new-content steps) once a module has 2+ prior modules to draw from.

Duolingo's review weakness: only reviews previous 2 lessons. Lingo's edge: every sub-lesson draws from the full prior atom pool, FSRS-weighted.

### 10.5 CEFR badging alongside JLPT N5 %

Display A1 / A2 estimate next to "N5 progress: X%". Map each grammar atom + vocab tier to CEFR can-do statements. Display-only — light lift. Helps non-test-takers see progress in a non-JLPT framework.

### 10.6 Mock proficiency test = placement test (shared engine)

Both are MCQ-format, timed, scored, repeatable. One engine, two preset families:

- **Placement** (pre-content or mid-content): "where are you currently" — feeds module recommendation + initial FSRS seeding.
- **Mock exam** (post-content): "are you ready" — per-language preset (N5, N4, TOPIK tiers).

Architecture sketch: `features/proficiency/{engine.ts, presets/{n5,n4,topik-1}.ts}`. Build post-M3-M7 rebuild.

### 10.7 Sidequests as the home for opt-in + non-canon content

Sidequests hold:

- Vocabulary outside strict N5 canon (slang, signage, anime phrases, JR stations).
- **Deep-dive grammar explanations** (e.g., は/が contrast — Q5 resolution).
- Kanji recognition track (Q2 resolution).
- *(Future)* cultural / regional / register-variation lessons.

Discovery: surfaced by selected goal (§10.1). Suggested, not required. Completion feeds FSRS like any other lesson.

### 10.8 Speaking variants opt-in across new step types

Every new content step type (`reading_passage`, `dialogue_listen`, `info_retrieval`, `quick-response`) and existing types (`translate`, `build_sentence`) can carry an optional "say this aloud" rider. Off by default to avoid friction. Mic-enabled learners get the prompt.

### 10.9 Language-agnostic architecture from day one

Goal-selection (§10.1), feature gating (§10.2), mock-exam engine (§10.6), and the sidequest framework (§10.7) must all be **language-keyed**, not Japanese-hardcoded. Korean and future languages adopt these systems without rework.

### 10.10 Lingo competitive positioning (acceptance bar)

Not a feature — the bar for "is this good enough to ship":

- **No paywall-gated content** (Duolingo's main weakness).
- **Features full, not feature-flag-thin** (when Lingo ships a system, it's the complete system).
- **Cumulative review > 2-lesson lookback** (Duolingo's review gap; addressed via §10.4).
- **Full ecosystem in one place** — FSRS flashcards + lessons + kanji + grammar + conjugation + immersion + tests — not modularly bolted on.

Proposed features that don't move at least one lever earn skepticism.

---

## 11. Companion docs

When authoring an M8-M30 lesson, pair this roadmap with the vocab-art reference:

- **[emoji-blocked-words-2026-05-18.md](./emoji-blocked-words-2026-05-18.md)** — rubric for assigning emoji vs marking a word image-MCQ-unsafe. End-to-end authoring workflow.
- **[n5-vocab-emoji-reference-2026-05-18.md](./n5-vocab-emoji-reference-2026-05-18.md)** — all 662 N5 words with assigned Noto emoji or `blocked: true` classification. Pull the canonical emoji from this table before authoring `RowWord` / `ReviewAtom` entries.

## 12. Sources

**JLPT N5 vocabulary**
- [JLPT Sensei — N5 Vocabulary List](https://jlptsensei.com/jlpt-n5-vocabulary-list/) — 644 words, 7 categories
- [Migaku — JLPT Vocabulary Lists](https://migaku.com/blog/japanese/jlpt-vocabulary-lists)
- [Japonin — JLPT N5 Kanji & Words](https://www.japonin.com/jlpt-n5-present.html)
- [Japanese Language Courses — How Many Words in N5](https://japaneselanguagecourses.com/blog/how-many-words-in-jlpt-n5) — breakdown by part of speech
- [italki — N5 Vocabulary](https://www.italki.com/en/blog/jlpt-n5-vocabulary)
- [GyanMirai — N5 Vocabulary by Topic](https://www.gyanmirai.com/jlpt/jlpt-n5/vocabulary-topics) — 22 topics, totals

**JLPT N5 grammar**
- [Wikibooks JLPT N5 Grammar](https://en.wikibooks.org/wiki/JLPT_Guide/JLPT_N5_Grammar) — 41-point comprehensive list
- [JLPT Sensei — N5 Grammar List](https://jlptsensei.com/jlpt-n5-grammar-list/) — 84-point list
- [Migaku — JLPT Grammar Points](https://migaku.com/blog/japanese/jlpt-grammar-points)
- [JLPT N5 Study Guide — Migaku](https://migaku.com/blog/japanese/jlpt-n5-overview)
- [Coto Academy — 30 Must-know N5 Grammar Points](https://cotoacademy.com/30-must-know-jlpt-n5-grammar-points/)

**JLPT N5 kanji**
- [Hirakan — N5 Kanji List (112)](https://hirakan.com/blogs/japanese/kanji-jlpt-n5-list)
- [JLPT Sensei — N5 Kanji List](https://jlptsensei.com/jlpt-n5-kanji-list/)
- [Migii — JLPT Level N5 Kanji](https://migii.net/en/blog/jlpt-level-n5-kanji)
- [Kanjidon — 103 JLPT N5 Kanji 2026](https://kanjidon.com/blog/jlpt-n5-kanji-list/)

**Study hours + test format**
- [JLPT Official Test Sections](https://www.jlpt.jp/e/guideline/testsections.html) — authoritative section breakdown
- [Migii — JLPT N5 Study Hours](https://migii.net/en/blog/jlpt-n5-study-hours)
- [Coto Academy — JLPT Study Hours Comparison](https://cotoacademy.com/study-hours-needed-pass-jlpt-comparison-levels/)
- [JLPT Books FAQ — How Long to Pass N5](https://www.jlptbooks.com/faq/how-long-to-pass-jlpt-n5/)
- [JLPT Bootcamp — Listening Sections](https://jlptbootcamp.com/2011/06/jlpt-listening-sections-what-are-they-like/)
- [KanaDojo — N5 Complete Study Guide 2026](https://kanadojo.com/academy/jlpt-n5-study-guide-2026)

**Lingo-internal references**
- `CLAUDE.md` (repo root) — app vision + curriculum state
- `docs/learning-science-foundation-2026-05-17.md` — 22-item authoring checklist + step-type map
- `docs/curriculum-design-v2.md` — north-star pedagogy + iteration-pacing rule
- `docs/m1-density-restructure-plan-2026-05-17.md` — M1 anatomy + M3-M7 diagnosis + rebuild plan
- `docs/m2-row-template-2026-05-17.md` — g-row template that became the M2 spine
- `docs/full-app-audit-2026-05-17.md` — 10-persona walk + Spencer's `[now]`/`[defer]` marks
- `src/features/lesson/types.ts` — step-type union (20 types defined; 4-5 underused)
- `src/features/lesson/data/mockLessons.ts:388` — `BUILD_SENTENCE_SUNSET_MODULES` + central seam
- `src/features/lesson/data/_consonantRowHelpers.ts` — M1/M2 factory library
- `src/features/lesson/data/_jaGrammarHelpers.ts` — M3-M7 factory library (note: thin, lacks the cumulative review baked into the M1/M2 helpers)

---

*Doc verified against:*
- *Step-type union as of `types.ts` 2026-05-18 (20 types defined)*
- *Curriculum state as of `CLAUDE.md` 2026-05-17 + `mockLessons.ts` 2026-05-18*
- *N5 specifications as of sources cited above (2025-2026 publication dates where applicable)*

*When new modules land or step types are added, update §6 + §5 first; the rest of the doc is conceptual and changes less often.*
