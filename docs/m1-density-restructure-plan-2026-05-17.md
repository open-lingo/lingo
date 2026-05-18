# M1-Density Restructure Plan — M3–M7 (2026-05-17)

Spencer's verbatim complaint:
> "modules 2 and 3 and everything after COMPLETELY ignore the module 1
> setup we use. they have fragmented teaching and only include a few
> things, and are too pinholed into 'we teach you this one thing'…
> particle practice 8 of them took me literally 1 minute and the answer
> was only ha or ka which you patternize instead of learn… course
> content is way shorter than you assumed without the extra progress
> markers."

The diagnosis below treats this as load-bearing: the M3 restructure was
*pedagogically* good (≤2 grammar concepts per module, block-then-
interleave), but it threw away the *structural density* of M1 in the
process. M3–M7 lessons are skeletal in step-count AND uniform in step-
type AND patternized in correct-answer distribution. Every one of those
is fixable without changing the grammar spine.

---

## 1. M1 Density Anatomy — the gold standard

### What an M1 vowels sub-lesson actually contains

`MOCK_LESSON_JA_M1_L1A` (`src/features/lesson/data/mock-ja-m1-l1.ts:292`)
has **24 steps** for a single sub-lesson billed at 5 estimated minutes:

| Count | Step type           | Role                                       |
|-------|---------------------|--------------------------------------------|
| 2     | `info`              | Open + close (the framing chrome)          |
| 5     | `symbol_intro`      | One per vowel — meet the kana              |
| 5     | `symbol_trace`      | One per vowel, `minCorrectAttempts: 2`     |
| 5     | `symbol_recognition`| Audio→kana (easier direction)              |
| 4     | `word_image_mcq`    | Emoji+kana 2×2 grid                        |
| 4     | `listening_build`   | Hear word, build from vowel tiles          |
| 5     | `symbol_to_sound`   | Kana→romaji (harder direction, *final*)    |

Sub-lesson 2/2 (`mock-ja-m1-l1.ts:372`) keeps the density: **26 steps**
with the same skeleton plus 4 `listening_comprehension` MCQs and dropped
intros (kana already met). Combined L1A+L1B = **50 steps** to teach 5
kana + 5 words. That is the density bar.

### What a hand-authored M1 consonant row (ka) contains

`mock-ja-m1-ka.ts` is 3 sub-lessons + auto row-test (the "2+2+1+test"
template, file:line `8–30`):

- **Ka-1** (`:58`) — 12 steps: 1 info + 2× (intro + trace + recog) + mcq +
  build + 2× symbol_to_sound + outro info. **5 kana taught? No — 2.**
- **Ka-2** (`:94`) — 14 steps: 1 info + 2× (intro+trace+recog) + mcq +
  build + **2× listening_comprehension** + 2× symbol_to_sound + outro.
- **Ka-3** (`:134`) — 11 steps: review sweep + recog + mcq + listening +
  **2× speaking** + outro.

Pattern: ~12 steps for ~2 kana + 1 anchor word per sub-lesson. The
**drill block** is the same recipe every time:
**intro → trace → recognition → mcq → build → listening_comp → speaking
→ symbol_to_sound**. 6–8 distinct step types in rotation. No
patternization is possible because the answer space changes shape
every two steps.

### The structural choices that produce density

1. **Layered exposure per concept.** Every kana traverses the full
   sensorimotor loop: see (intro) → write (trace ×2) → hear→pick
   (recognition) → use (build) → hear→meaning (listening_comp) → say
   (speaking) → kana→sound (symbol_to_sound). That's **6 step types
   touching 1 concept**.
2. **Closed-set distractor pools per row.** `pickThreeKanaDistractors`
   (`_consonantRowHelpers.ts:41`) keeps wrong options grammatically
   plausible — same row + tile-pool fallback. The learner can't
   eliminate by category; they have to actually know it.
3. **Deterministic slot, not deterministic *answer*.** `correctSlot`
   (`_consonantRowHelpers.ts:37`) places the right option in different
   physical slots per step. The *correct answer changes every step*.
4. **Anchor word is the through-line.** Each sub-lesson has 1 anchor
   word that appears in mcq → build → listening_comp → speaking →
   row-test pool. Cumulative reinforcement without re-teaching.
5. **Hard direction comes last.** `symbol_to_sound` (production-shaped
   recall) is reserved for the end of every sub-lesson. Spencer's
   note at `mock-ja-m1-l1.ts:16–20` codifies this: "Audio→kana is more
   concrete… push it later when the kana is familiar."
6. **`info` chrome bookends, never interrupts.** Two info cards per
   sub-lesson: open ("here's what we're doing") and close ("here's the
   real-world payoff"). M1 never uses `info` to artificially extend
   a thin lesson.

### Template extracted

```
[info:open]
for each new kana in this sub-lesson (~2):
  symbol_intro → symbol_trace(×2) → symbol_recognition
[word_image_mcq → listening_build] for the anchor word
[listening_comprehension OR speaking] for cumulative vocab
[symbol_to_sound × all-new-kana]   # hard direction at the end
[info:close]
```

This produces 11–14 steps minimum from ~2 atoms of new content. It is
**dense by construction**, not by counting.

---

## 2. M3–M7 Diagnosis (blunt)

### Step-type census per lesson

Counted from the files (`mock-ja-m3-v2.ts`, `mock-ja-m4.ts`, etc.). I
exclude `info` for the "real work" column because info is chrome.

| Lesson | Total | info | grammar_rule | particle_cloze | phrase_card | build_sentence | match | mc | speaking | dialogue lines | Real work |
|---|---|---|---|---|---|---|---|---|---|---|---|
| M3-1 | 7   | 2 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 5  |
| M3-2 | 10  | 2 | 1 | 3 | 4 | 0 | 0 | 0 | 0 | 0 | 8  |
| M3-3 | 12  | 3 | 0 | 1 | 8 | 0 | 0 | 0 | 0 | 0 | 9  |
| M3-4 | 7   | 2 | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 6  |
| M3-5 | 8   | 2 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6  |
| M3-6 | 7   | 2 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 5  |
| M3-7 | 7   | 2 | 0 | 0 | 4 | 0 | 0 | 0 | 1 | 4 | 5  |
| M3-8 | 3   | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 (row_test inner) |
| M4-1 | 7   | 2 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 5  |
| M4-2 | 7   | 2 | 1 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 5  |
| M4-3 | 10  | 2 | 0 | 3 | 5 | 0 | 0 | 0 | 0 | 0 | 8  |
| M4-4 | 6   | 2 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 4  |
| M4-5 | 8   | 2 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6  |
| M4-6 | 7   | 2 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 5  |
| M4-7 | 7   | 2 | 0 | 0 | 4 | 0 | 0 | 0 | 1 | 4 | 5  |
| M5-1 | 7   | 2 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 5  |
| M5-2 | 8   | 2 | 0 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 7  |
| M5-3 | 9   | 3 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 6  |
| M5-4 | 8   | 2 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 6  |
| M5-5 | 8   | 2 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6  |
| M5-6 | 7   | 2 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 5  |
| M5-7 | 7   | 2 | 0 | 0 | 4 | 0 | 0 | 0 | 1 | 4 | 5  |
| M6-1 | 8   | 2 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 6  |
| M6-2 | 7   | 2 | 1 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 5  |
| M6-3 | 7   | 2 | 1 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 5  |
| M6-4 | 7   | 2 | 1 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 5  |
| M6-5 | 8   | 2 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6  |
| M6-6 | 8   | 2 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6  |
| M6-7 | 7   | 2 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 5  |
| M6-8 | 7   | 2 | 0 | 0 | 4 | 0 | 0 | 0 | 1 | 4 | 5  |
| M7-1 | 8   | 2 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 6  |
| M7-2 | 6   | 2 | 1 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 4  |
| M7-3 | 7   | 2 | 1 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 5  |
| M7-4 | 8   | 2 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 6  |
| M7-5 | 8   | 2 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6  |
| M7-6 | 8   | 2 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6  |
| M7-7 | 7   | 2 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 5  |
| M7-8 | 8   | 2 | 0 | 0 | 5 | 0 | 0 | 0 | 1 | 5 | 6  |

**Average real-work steps per content lesson (excludes row tests): ~5.5.**
**M1 sub-lesson average: ~12.** Roughly **half the density.**

### Where the fragmentation lives

Every M3–M7 lesson uses **at most 2 distinct step types** for its
real work. Cross-reference:

- **Vocab lessons** (M3-1, M3-3, M4-1, M4-3, M5-1/2/3/4, M6-1, M7-1, M7-4):
  *all* `phrase_card`, sometimes one cloze tacked on at the end.
- **Grammar lessons** (M3-2/4, M4-2/4, M6-2/3/4, M7-2/3):
  `grammar_rule` + uniform `particle_cloze` stream.
- **Iteration lessons** (M3-5, M4-5, M5-5, M6-5/6, M7-5/6):
  6 `particle_cloze` in a row. Nothing else.
- **Build lessons** (M3-6, M4-6, M5-6, M6-7, M7-7):
  5 `build_sentence` in a row. Nothing else.
- **Dialogue lessons** (M3-7, M4-7, M5-7, M6-8, M7-8):
  4–5 `phrase_card` + 1 representative `speaking` step.

There is **zero interleaving of step types within a lesson**. Compare
to M1 where every sub-lesson rotates through 6+ step types.

### Spencer's "8 ha-or-ka" complaint — sourced

The exact lesson is **M3-5** (`mock-ja-m3-v2.ts:394–476`). It is 6
particle_cloze (not 8, but his criticism still lands — see below). The
answer sequence:

| # | id | correct | options |
|---|---|---|---|
| 1 | ja-m3-5-cloze-1 | は | `["は", "が", "を", "に"]` |
| 2 | ja-m3-5-cloze-2 | か | `["は", "が", "か", "を"]` |
| 3 | ja-m3-5-cloze-3 | は | `["は", "が", "を", "に"]` |
| 4 | ja-m3-5-cloze-4 | か | `["か", "は", "が", "の"]` |
| 5 | ja-m3-5-cloze-5 | は | `["は", "が", "を", "に"]` |
| 6 | ja-m3-5-cloze-6 | か | `["か", "は", "が", "を"]` |

Answer set across 6 clozes: `{は, か}`. Two answers total. A learner
who picks "if there's a 。 right after the blank, pick か; else pick は"
solves the whole lesson without reading anything. That's not learning
— that's pattern-matching the *delimiter*.

But it gets worse downstream. **M6-6** (the が drill,
`mock-ja-m6.ts:462`):

| # | id | correct |
|---|---|---|
| 1–6 | ja-m6-6-cloze-1..6 | が, が, が, が, が, が |

**Six consecutive clozes where the correct answer is always が.**
Distractor pool is `["が", "は", "の", "を"]` every time. There is
literally one button to learn. Spencer's complaint is *understated*
relative to what this lesson actually does. The learner taps が six
times and the system tells them they've mastered the existence pattern.

**M7-5** (`mock-ja-m7.ts:335`): 6 consecutive を correct answers. Same
pathology.

**M6-2/3/4** (`mock-ja-m6.ts:137,228,319`): each is 4 consecutive
clozes with the **same correct particle** (4× に, 4× で, 4× が).

### Diagnosis — Spencer's 4-way decomposition

He asked whether the problem is:

| Failure mode | Verdict | Evidence |
|---|---|---|
| **Number of cloze in a row** | Real but secondary | 6 ≠ 8; even 3 in a row of *same answer* would still fail |
| **Uniformity of correct answer** | **Primary cause** | M6-6 = 6/6 が. M3-4 = 5/5 は. M7-5 = 6/6 を. Pattern recognition replaces grammar learning |
| **Lack of interleaving with other step types** | Primary cause (different axis) | Iteration lessons are 100% cloze. Grammar lessons are RuleCard + 100% cloze. No mcq, build, listening, speaking in the same lesson |
| **Lack of distractor variation** | Real but tertiary | Distractor pools are 4 options but rotate the *same particles*. The slot-correct-answer issue dwarfs this |

The fix has to attack uniformity-of-answer + interleaving simultaneously.
Tightening only one leaves the other.

---

## 3. The "Too Short" Problem

Spencer's "extra progress markers" almost certainly refers to:

1. **Step-progress dots** in the lesson header. The 7-step M3-5 lesson
   renders the same dot strip as a 14-step M1 sub-lesson, but each dot
   represents 100% more actual work.
2. **Module ★ slot** on the pathway. Mastery state inflates the
   perceived size of the journey.
3. **Lesson-card stack on the pathway.** M3 has 8 cards; M1 has 39.
   Visually M3 looks substantial; pedagogically it's a quarter of M1.
4. **Inter-module review modules** (the planned 3-lesson cycles via
   `buildModuleReviewLessons`) — these *don't exist yet on the
   pathway*, so they're inflating Spencer's mental model of what's
   there, not the actual content.

Each marker says "this is a lot of content." The actual content is
~5 real steps × 6 lessons = **30 real-work touchpoints per module**.
M1 hits 30 touchpoints in a single sub-lesson.

**How M1 avoids the trap:** M1 only has the per-step progress dots —
no mastery dot exists yet because the row test is the mastery dot.
And M1 *deserves* its dot count: every dot is genuine sensorimotor
practice. The dots are *honest* in M1; they are *aspirational* in
M3–M7.

---

## 4. Restructure Template (the heart of the plan)

### Lesson skeleton (M2-M7+ content lessons)

```
[info:open]                       1 step — frame what's happening
[exposure block: 3–6 steps]       grammar_rule OR vocab cards
[drill block: 6–9 steps]          MIXED step types (see below)
[integration: 2–3 steps]          build_sentence OR speaking
[info:close]                      1 step — culture/payoff card
                                  ─────────
                                  TOTAL: 13–20 real-work + chrome
```

Estimated 7–9 minutes per lesson (vs the current 5–6).

### Drill block composition — the 8-step mixed drill

Replace the "6× particle_cloze in a row" pattern with a fixed mixed
block. Authoring rule: every drill block contains *at least* 4 distinct
step types.

```
1× grammar_rule (or its earlier exposure)
2× particle_cloze         # max 2 consecutive, see anti-patterns below
1× word_image_mcq         # 2×2 vocab recall (already exists)
1× listening_comprehension# hear + pick meaning — already used in M1
1× build_sentence         # short, 3-tile
1× match_pairs            # 4-pair, cumulative vocab from prior lessons
1× translate              # CURRENTLY UNUSED in JA M3-M7 — wake it up
```

### Worked example — M3-2 (です + か) rebuilt at density

Current M3-2 (`mock-ja-m3-v2.ts:135`): 10 steps (5 vocab + 3 cloze +
1 grammar_rule + 2 info). Real work: 8.

Proposed (16 steps, ~9 min):

```typescript
// 1 — Frame
infoStep("ja-m3-2-info-open", ...)

// 2-4 — Exposure: rule card + first 2 vocab (the most needed for drills)
grammarRule(RULE_DESU_KA)
vocab("v-gakusei", "Student", "gakusei", "がくせい")
vocab("v-sensei", "Teacher", "sensei", "せんせい")

// 5-13 — Drill block (interleaved across grammar + vocab)
particleCloze("cloze-1", "がくせいです", "。", "か", ...)
wordImageMcq("mcq-gakusei", "がくせい")             // emoji + vocab recall
listeningComp("lc-1", "せんせいですか", "Are you a teacher?", ...)
particleCloze("cloze-2", "せんせい", " です。", "は", ...) // DIFFERENT answer!
vocab("v-nihonjin", "Japanese person", "nihonjin", "にほんじん")
matchPairs("match-1", [
  { gakusei → student }, { sensei → teacher },
  { nihonjin → Japanese }, { namae → name }   // pulls in M3-3 vocab early
])
particleCloze("cloze-3", "にほんじんです", "。", "か", ...)
translate("translate-1", "I am a student.", ["わたしは がくせいです"], ...)  // NEW step type
buildSentence("build-1", "Ask: Are you a teacher?",
  "せんせいですか", ["せんせいですか", "がくせいです", "なまえは"], ...)

// 14-15 — Integration
speaking("speak-1", "わたしは がくせいです", "I am a student.")
vocab("v-namae", "Name", "namae", "なまえ")  // cap with one more vocab

// 16 — Close
infoStep("ja-m3-2-info-end", ...)
```

Real-work step count: **14** (up from 8). Distinct step types in the
drill block: **7** (grammar_rule, particle_cloze, word_image_mcq,
listening_comprehension, match_pairs, translate, build_sentence) plus
the speaking + vocab cards. Pattern-memorization route closed: 3
clozes with answers `か → は → か`, never the same correct answer in
adjacent clozes.

### Anti-patternization rules (codify these)

1. **No more than 2 consecutive `particle_cloze` steps with the same
   correct answer.** Hard rule. Enforce via authoring lint
   (`ja-m3-m7-coverage.test.ts` already exists — add a `coverage`
   check that flags any run of ≥3 same-answer clozes within a lesson).
2. **Every drill block contains ≥4 distinct step types.** Lint check
   on the `LessonContent.steps` array.
3. **Every cloze block must include at least one distractor that
   *also* makes grammatical sense** (force learning, not elimination).
   Today the distractors are mostly category-rejects (`を` next to
   `に`); add one near-miss per cloze (e.g., the は/が distractor pair
   in an existence cloze — both could plausibly fit; the correct one
   is が because new info).
4. **Every particle drill set in a lesson must rotate through ≥3
   distinct particles even when one is in focus.** This means the
   "introduce に" lesson can't be 4× に — it must mix in `は` (already
   known) and `が` (preview) as foils, so the learner *picks* に
   rather than tapping the only new option.
5. **Vocab-only lessons are banned.** Every lesson that introduces
   vocab must end with at least 1 `word_image_mcq` and 1
   `listening_comprehension` or `build_sentence` using that vocab.
   M5-1 (just 5 vocab cards) is the worst current offender —
   the learner can pass without producing or recognizing the words.
6. **Build lessons must use varied tile pools.** Today M3-6 reuses
   `["わたしは", "アメリカじんです", "がくせいです"]` style tiles in
   every build, so by build 3 the learner sees only the obvious
   answer. Add 2–3 wildcard tiles that aren't in *any* answer.
7. **Iteration lessons must contain ≥2 step types other than
   `particle_cloze`.** M3-5, M4-5, M5-5, M6-5, M6-6, M7-5, M7-6 all
   violate this today. Rotate in mcq, listening_comp, build, match.

### Length targets

| Lesson role         | Current real-work steps | Target real-work steps | Est. min |
|---------------------|-------------------------|-------------------------|----------|
| Vocab introduction  | 5                       | 12–14                   | 7–8      |
| Grammar (intro+drill)| 5–6                    | 14–18                   | 8–10     |
| Iteration / mixed   | 6                       | 12–16                   | 7–8      |
| Sentence build      | 5                       | 10–12 (build + mcq + speak) | 6–7  |
| Dialogue            | 5                       | 10–14 (lines + 2 speak + 1 cloze + 1 build) | 7–8 |
| Row test            | (unchanged: 5–7 items)  | (unchanged)             | 5–6      |

Lessons average ~12–14 real-work steps post-restructure (matches M1
sub-lesson average of ~12). Module total minutes: 6 lessons × ~8 min
+ baked review (~12 min) + row test (~6 min) ≈ **65–75 min/module**,
which is within the 1.5h target from `curriculum-design-v2.md:87`
*without* needing the 3-lesson external review cycle to inflate the
number.

---

## 5. Interleaved Review Plan (bake reviews INTO modules)

### Spencer's spec (from CLAUDE.md tail + m3-restructure-proposal-2026-05-16.md:200)

The shipped `buildModuleReviewLessons` (`buildModuleReview.ts:157`)
emits **3 separate review lessons + 1 review test** that live in their
own pseudo-module (`m3-review`, etc.). That model was designed to
sit *between* M3 and M4 on the pathway with FSRS scheduling.

Per Spencer's restructured ask: shrink that to **1 baked-in review
lesson** per module that consumes prior-module material as part of the
normal lesson sequence — not a separate pathway entity.

### Proposed placement per module (new module shapes)

| Module | Total lessons | Position of baked review | What it cycles |
|---|---|---|---|
| **M2** | 7 (5 dakuten rows + yoon intro + **baked review**) | Lesson 6 (between yoon-intro and yoon-test) | M1 kana (top 30 anchor words) |
| **M3** | 7 (current 8 minus the dialogue, see below; + baked review) | Lesson 5 of 7 (between iteration + build) | M2 dakuten reading + early M3 (です/か) |
| **M4** | 7 | Lesson 5 of 7 | M3 (は + です/か) primarily |
| **M5** | 7 | Lesson 5 of 7 | M4 + some M3 |
| **M6** | 8 | Lesson 6 of 8 | M5 + M4 (2-sublesson "double-tap" — see below) |
| **M7** | 8 | Lesson 6 of 8 | M6 + M5 (2-sublesson) |

**M4+ "2-sublesson lesson"** means the baked review is *one
LessonContent* with **~22 steps** that internally has two visual
sub-lesson markers (separator info card + transition). The runner
treats it as one lesson for ★ purposes but the learner perceives it as
two passes. This mirrors how `MOCK_LESSON_JA_M1_L1A` and `_L1B` are
two separate `LessonContent`s but the user feels them as "vowels".

### Step composition for a baked review lesson

```
[info:open] "Pause to review — no new grammar"
4 particle_cloze (interleaved across modules, each different answer)
1 match_pairs (8 pairs drawn from cumulative vocab)
2 listening_comprehension (hear → pick meaning)
2 build_sentence (cumulative sentences using prior particles)
1 word_image_mcq (vocab recall)
1 speaking (one representative phrase from the prior module's dialogue)
[info:close] "Patterns hold. New material next."
                                            ─────────
                                            TOTAL: ~12 steps + 2 info
```

Estimated 6–7 min. Counts toward module ★ as a regular lesson.

### How baked reviews differ from regular content lessons

- **No new grammar_rule or vocab cards.** Material is recall-only.
- **Lower XP reward.** ~10 XP vs ~18 for grammar lessons (signals
  recall ≠ discovery).
- **Cumulative source pool.** Pulls from `jaReviewPools.ts` POOL_M*
  entries — those are already authored.
- **`kind: "module_review"`** stays on the lesson so the runner can
  apply a review-tail multiplier later if we want graduated SRS.

### Adapting buildModuleReview.ts

**Keep it. Adapt it.** Two concrete changes:

1. **Add `buildBakedReviewLesson(pools, moduleId, lessonIndex)`** that
   returns ONE `LessonContent` (not the current array of 4). The
   internal interleave logic is exactly what we need; just bound it
   to one lesson and drop the row-test emission for the baked variant.
2. **Throw out the separate `m*-review` pseudo-module**. The
   `module_review` `kind` stays on the lesson so behaviour (no
   tracing-style mastery, repeatable for XP-decayed credit) can be
   gated by `lesson.kind === "module_review"` at the runner level.

Files affected:
- `buildModuleReview.ts:157` — add `buildBakedReviewLesson`; keep
  `buildModuleReviewLessons` as fallback for the separate-module path
  if Spencer wants it back later.
- `moduleReviewSchedule.ts` — becomes a no-op for the in-module case
  (no more FSRS-due chips needed on the pathway). Keep the file in
  case Spencer wants out-of-module catch-up reviews layered later.
- `mockCourse.ts` — drop the synthetic `m3-review`, `m4-review`
  module entries; bake the lesson into the parent module's `lessons:`
  array at the prescribed position.

---

## 6. M1 Density Applied to M2

### Is M2 actually a problem?

`mock-ja-m2-g.ts` (voiced k→g) — 12 steps for 5 new kana + 1 anchor
word. Step types: info + 5× contrast MC + 2× recognition + mcq +
build + speaking + info. That's **6 distinct step types in 12 steps**.

`mock-ja-m2-yoon-sh-ch.ts` — 12 steps, 6 new yōon + 1 anchor. Same
shape: info + 6× recognition + mcq + build + speaking + info. **5
distinct types.**

Verdict: **M2's structure is fine — it inherits the M1 helper template
via `_consonantRowHelpers.ts`.** Spencer's "module 2 and 3 and
everything after" complaint is probably aimed at M2's *thinness*
(per-row only 12 steps vs M1 row's 11–14) rather than fragmentation.

### What M2 is missing relative to M1 (small fixes)

1. **No `symbol_to_sound` step.** M1 ends every consonant-row sub-lesson
   with the hard direction; M2 skips it entirely. Add 1–2
   `symbol_to_sound` per M2 row (kana→romaji with row-pool
   distractors). +2 steps/row.
2. **Only 1 anchor word per row.** M1 ka has 3 (かい, いけ, こえ); M2
   g has only かぎ. Even one more anchor (e.g., げんき) would unlock
   another mcq + build + listening_comp cycle. +3 steps/row.
3. **No `listening_comprehension` step.** M1 has it in every row;
   M2 skips it. Add 1 per row. +1 step/row.

Target M2 row size: 12 → 17 steps. Same skeleton as M1 ka. Authoring
cost is small because `_consonantRowHelpers.ts` already exposes
`listeningComp`, `speaking`, etc. — just call them.

### M2 baked review

Insert one `module_review`-kind lesson at position 6 of M2 (after the
last yōon intro, before yoon-test). 12 steps drawn from POOL_M1
(would need to author POOL_M1 — see Phase Z below). Material: pure-
kana sentences using only M1 + M2 kana, no grammar.

---

## 7. Phasing / Order of Operations

| Phase | Scope | Effort (agent hrs) |
|---|---|---|
| ~~**A**~~ | ~~Quick win: rotate same-answer cloze chains in M3-7~~ **SUPERSEDED 2026-05-17** — the rebuilt template caps consecutive clozes at 2 with mandatory answer rotation, so the lessons Phase A targets won't exist post-rebuild. Don't ship this. | 0 |
| **B** | Rebuild M3 to the new template (16 steps avg per lesson, 7-lesson module with baked review). Use the worked M3-2 example as the pattern. | **6–8** |
| **C** | Rebuild M4 to template. | **5–7** |
| **D** | Rebuild M5 to template. | **5–7** |
| **E** | Rebuild M6 to template (currently 9 lessons → 8 with baked review). | **6–8** |
| **F** | Rebuild M7 to template. | **5–7** |
| **G** | Beef up M2 rows (per §6): +symbol_to_sound, +1 anchor word, +listening_comp. ~10 row files × small edit. | **3–4** |
| **H** | Author POOL_M1 + POOL_M2 in `jaReviewPools.ts` so baked reviews have material. | **2** |
| **Z** | Wire baked reviews into modules: extend `buildModuleReview.ts` with `buildBakedReviewLesson`; update `mockCourse.ts` to inject the baked lesson at the prescribed position; drop the separate `m*-review` modules from pathway. Update `mockCourse.test.ts` lesson counts. Smoke `npm run test:run`. | **3–4** |
| **Lint** | Add `lessonDensity.test.ts` rules: no >2 consecutive same-answer clozes per lesson; every lesson with ≥4 real-work steps must use ≥3 distinct step types; vocab lessons must end with ≥1 recall step. | **2** |

**Total: ~40–50 agent hours.** Phase A alone (2–3h) addresses Spencer's
most pressing complaint without rebuilding anything. Spencer can run
through A immediately, then decide whether B–F are worth the time
before friend-test data lands.

---

## 8. Open Questions for Spencer

1. **Should the baked review be one fat lesson (~22 steps) or kept as
   two ~12-step lessons** at later modules (M4+)? Spencer's prior
   spec said "2 sublessons" for M4+ — clarify whether that means one
   LessonContent with internal separators (matches M1 vowels L1A/L1B
   feel) or two distinct LessonContents back-to-back on the pathway.

2. **Translate step adoption.** `translate` exists in `types.ts:133`
   but is unused in any M1–M7 JA lesson today. Acceptance grading
   needs `acceptedAnswers: string[]` — for kana sentences this is
   tractable (small variant set). OK to adopt as a step type in the
   new drill block, or defer until IME-input grading is solved?

3. **Are mini-dialogues the right *final* lesson per module?** Today
   every M3-M7 ends content with a 4-line dialogue + 1 representative
   speaking step. Pedagogically fine; structurally it's the
   *lowest-density* lesson in the module. Should the dialogue
   restructure too (split into 2 lessons: dialogue-read + dialogue-
   produce with 3 speaking targets), or stay one lesson at the cost
   of being thin?

4. **Should baked-review lessons count toward module ★?** Today the
   row-test lesson is what unlocks ★. If the baked review is a normal
   lesson in the module, completing the module already requires
   completing the review — but does failing/skipping the row-test
   tail items still produce ★ if the baked review was passed? I'd
   say yes (the baked review is harder than any single test item, so
   passing it is a stronger signal). Spencer's call.

5. **Drop the separate review-cycle pathway entirely, or keep it
   dormant for future FSRS work?** `buildModuleReviewLessons` +
   `moduleReviewSchedule.ts` represent ~3–5h of prior work. Cheap
   to keep dormant (one unused export); cleaner to delete. Spencer
   call.

6. **M2 thinness fix — author or generate?** §6 proposes adding 2–3
   anchor words per dakuten row. The current `tileBankPool` per row
   in the hand-authored M2 files doesn't support new vocab without
   adding words to the row's `ctx.words`. Author manually (10 files,
   straightforward) or extend `lessonBuilder.ts`'s preset machinery
   to emit the extra steps automatically (more work upfront, easier
   forward maintenance)?

---

## 9. Phase I — Lesson Authoring Guide (after Phases A–H + Z land)

Spencer's side note (2026-05-17): the M3-M7 drift happened because the
prior restructure agent was given a *pedagogical* spec
(`curriculum-design-v2.md`) but was never told to read or mirror M1's
*structural* template. Opus-vs-Sonnet wasn't the load-bearing variable;
**the missing instruction was "read mock-ja-m1-l1.ts + mock-ja-m1-ka.ts
first and match their density"**. To prevent the same regression next
time, codify the standards from §1, §4, and §5 into a single authoring
guide that ALL future lesson-authoring work (agent or human) must read.

**Deliverable**: `docs/lesson-authoring-guide.md`

**Sections**:
1. **The M1 template, distilled** — the "Template extracted" block from
   §1 plus 1 worked example per role (vocab / grammar / iteration /
   build / dialogue / row-test / baked-review).
2. **Anti-patternization rules** — the 7 rules from §4, each with a
   Bad/Good code snippet pair.
3. **Step-type catalog with usage notes** — when to reach for
   `particle_cloze` vs `multiple_choice` vs `fill_blank`; when
   `phrase_card` is the right answer vs when it's the lazy answer; the
   "hard direction last" rule from M1.
4. **Per-lesson checklist** — copy-pasteable into a PR description:
   ≥4 distinct step types per drill block; no ≥3 consecutive same-
   answer clozes; every vocab lesson ends with ≥1 recall step;
   `info` cards only at lesson ends; `speaking` step present somewhere;
   appropriate `kind` (`module_review` for baked reviews).
5. **CLAUDE.md cross-link**: add an "Authoring JA lessons" section that
   points at this guide and instructs subagents to read it AND
   `mock-ja-m1-l1.ts` before writing any new lesson file.
6. **Lint test list** — what `lessonDensity.test.ts` (Phase Lint above)
   enforces mechanically so authoring drift gets caught by CI not
   review.

**Effort**: 2–3h (writing only; no code).

**Sequencing**: Write *after* Phases A–H land, not before. The guide
must describe what the codebase actually does, not what we hoped it
would do. Writing it concurrently risks divergence between guide and
implementation — Spencer flagged exactly that anti-pattern in
`feedback_check_existing_codebase_for_output_patterns.md`.

**Maintenance**: Bump the guide's "last verified against" date every
time a new lesson role is added. If the guide ever describes patterns
the code doesn't follow, treat that as a P0 doc bug — the guide is the
contract.
