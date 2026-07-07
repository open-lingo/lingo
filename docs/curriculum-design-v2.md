# Lingo Curriculum Design v2 — pedagogy & rationale

Written 2026-05-16. Distills the multi-source research session that landed
after #88–#95 + #84 shipped. This is the **"why our JA curriculum is shaped
the way it is"** doc — pedagogy principles, the Duolingo-contrast, Tae Kim
strategy, vocab strategy, anti-patterns. Sources at the bottom.

> ⚠️ **NOT the module map or scope source-of-truth.** The 2026-05-16 draft
> module spine (M3–M11) and the "lesson types to add" table below are
> **superseded / historical** — the shipped curriculum is M1–M27 and the
> current content/scope SoT is **`n5-content-spec-2026-05-25.md`** (map) +
> **`curriculum-audit-vs-research-2026-05-21.md`** (grading rubric) + the
> real step union in `src/features/lesson/types.ts`. This doc is kept for
> its pedagogy rationale (the M2-compact pattern, M5 mastery gate, and
> survival-phrase strategy here are cited by shipped code).

## North star

Teach Japanese **better than Duolingo** by combining what evidence-based
language pedagogy says works:
1. Comprehensible Input (Krashen) — content the learner can mostly follow
   (~85–95% known) so the brain naturally acquires the gap.
2. Active recall + spaced repetition (Karpicke & Roediger, FSRS) — proven
   ~50% retention edge over rereading.
3. Explicit grammar **within context** (CAELA / ACTFL consensus) — neither
   pure drills nor pure exposure; both.
4. Production practice (tutor-style) — speech recognition + sentence-build
   force output, not just recognition.
5. Mastery via review-tail, not pass-threshold — wrong answers re-queue
   until correct (already shipped in #84).

## What Duolingo gets wrong (and we won't)

- **Particles taught implicitly.** Never explains why は vs が. → We use an
  explicit Grammar Rule Card + dedicated Particle Cloze drill.
- **Conjugations by exposure only.** Te-form, passive, causative,
  conditional all pattern-match. → We teach with explicit rule + drill.
- **No keigo / no register awareness.** → Polite (です/ます) is the
  baseline; plain form layered in M5+.
- **Nonsense sentences** ("the cat drinks beer"). → We hand-author every
  sentence, run 4-persona audits, prefer Core 2k frequency.
- **Stalls at A2/N4.** → Our full course spine (M1–M27) targets full N5 + early N4.
- **No pitch accent, no contractions, no natural dialogue.** → Sentence-
  ending よ/ね taught early per Tae Kim; dialogue mini-scripts in M5+.

## Pedagogy principles (codified)

| Principle | Implementation |
|---|---|
| Comprehensible Input | Every new word/grammar lives in a sentence where ≥85% of the kana + vocab is already known. |
| Active recall | Already shipped: FSRS-6 flashcards, in-lesson MCQ + production. |
| Spaced repetition for grammar | Apply the per-lesson review-tail pattern to grammar cards, not just vocab. |
| Explicit + contextual | Grammar Rule Card states the rule + 2 examples + 1 anti-pattern. Always followed by a context drill. |
| Mastery (★) | Review-tail (no fail), per-row test required, completed-without-skip wins the badge. (#84) |
| STT-forward | Speaking on every relevant lesson, mora-aware thresholds, encouraging tone — never punitive. |
| Cultural callouts | Hero info cards explaining when/where to use phrases (ありがとう vs どうも, ごめん vs すみません). |

## Curriculum spine

### M1 — Hiragana basics (shipped, 39 lessons)
Vowels + ka–ra rows + ya + wa, with row tests (mastery gate). Tracing on
all kana. Per-row anchor words (やま, ゆき, よむ, etc.). Speaking
on every row.

### M2 — Voiced kana + yōon (compact, NO tracing) — **next**
Dakuten/yōon are *modifications* of known kana — the hand already knows
the shape. Drop tracing entirely. Per row, ~3 cards instead of 8–12:
1. Recognition contrast card (`か → が`, explain the ゛ mark) + listen
2. 1 word using the new variant (e.g., がっこう)
3. Recognition rotation (audio→kana) across the row

Group as **5 mini-modules**:
- m2-1 voiced k→g
- m2-2 voiced s→z (with し→じ quirk callout)
- m2-3 voiced t→d (ち→ぢ usually written じ note)
- m2-4 voiced h→b
- m2-5 p-row (handakuten)

Plus **yōon** as a separate compressed module (4 sub-lessons + capstone):
- yo-1 sh/ch (しゃ・ちゃ — most common)
- yo-2 k/n/h/m/r (the long tail)
- yo-3 voiced (ぎゃ・じゃ・びゃ・ぴゃ)
- yo-test (capstone — required for mastery of yōon)

Each row-test still required for ★ mastery.

### M3+ — see the shipped module map

The 2026-05-16 draft spine for M3–M11 (は/が, を+transitive, に/で, verb
forms, adjectives, て-form, sentence-ending particles…) has been **superseded
by the shipped M1–M27 curriculum**. For the current module themes, order, and
kanji placement use **`n5-content-spec-2026-05-25.md`** and
**`curriculum-audit-vs-research-2026-05-21.md`** — not this section. The
pedagogy *principles* above still apply.

## Lesson types

### Existing (shipped)
- `symbol_intro`, `symbol_trace`, `symbol_recognition`, `symbol_to_sound`,
  `multiple_choice`, `listening_build`, `listening_comp`,
  `word_image_mcq`, `speaking`, `info`, `row_test`

### To add for M3+ — ✅ all shipped (historical)

*This table is a 2026-05-16 plan; every type below shipped (some renamed —
`sentence_build`→`build`, `dialogue_pick`→`dialogue_listen`,
`translation_production`→`translate`). For the real step union see
`src/features/lesson/types.ts`; for authoring, `lesson-authoring-guide.md`.*

| Type | Purpose | Effort |
|---|---|---|
| **`grammar_rule`** | Explicit rule + 2 examples + 1 anti-pattern. Replaces Duolingo's silent pattern-match. | Small — reuse `info` hero variant + structured slots |
| **`particle_cloze`** | "わたし___学生です" — pick particle from 4 options. The single highest-leverage drill. | Small — `multiple_choice` with sentence prompt |
| **`sentence_build`** | Tap tiles in order to compose a Japanese sentence (sentence-level `listening_build`). | Medium — extend existing primitive |
| **`dialogue_pick`** | Read 2–3 exchanges, pick what the responder says next. | Medium — new step type |
| **`translation_production`** | Type the Japanese for an English prompt. (Stretch — IME input + grading is harder.) | Large — defer to M5+ |

### STT expansion

- Sentence-level speaking targets (M3+) — currently word-level only.
- Avoid Japanese-specific gotchas (geminate っ, long-vowel ee→えい, pitch
  accent) in early speaking targets. Whisper can't grade these reliably.
- Keep tone encouraging. STT improves phoneme accuracy but raises self-
  consciousness (research finding) — never punitive feedback.

## Vocab strategy: Core 2k as the spine

- Pull from Core 2k frequency order, ~10 words per lesson, every word
  embedded in a model sentence using prior-known kana + grammar.
- Concrete nouns first (image MCQ possible), then verbs (paired with the
  particle they take), then adjectives, then abstracts.
- Audit each word for: (a) emoji availability if image-MCQ-eligible,
  (b) Core 2k frequency rank, (c) cultural relevance (avoid Western-
  centric examples that don't translate to Japan — see わに→かわ pivot).

## Survival phrase pacing

15 essentials in **M3 sub-1** as a warm-up info card carousel. Then again
in the speaking drill of M3 sub-2 (recall production). Then naturally
re-occur in dialogues throughout M3–M5.

## Iteration pacing — introduce, then reuse (added 2026-05-16)

Critical principle, flagged on M3 review: **never introduce a grammar
concept once and move on.** Adults retain through spaced exposure in
varied contexts, not single-pass exposure. Flashcards reinforce
*vocabulary* well; they don't reinforce *grammar patterns* — those need
to be re-encountered inside live sentences across multiple lessons.

**Rule of thumb per module:**
- ≤2 brand-new grammar concepts introduced (Grammar Rule Card + drill)
- Every prior module's grammar concept appears at least once in usage
  (Particle Cloze, Sentence Build, Dialogue) — not re-taught, just
  re-encountered in the wild
- Module recap lesson explicitly cycles the last 2 modules' grammar via
  cumulative drills

**Anti-example:** M3 v1 introduced 7 grammar concepts in 10 lessons
(です/か, は/が, の, これ/それ/あれ/どれ, numbers + counters, に/で,
sentence build). That's the Duolingo crash-course failure mode — the
learner sees each concept once and remembers none of them a week later.

**Fix:** When a module would otherwise exceed 2 new concepts, split it:
- Move concepts 3+ to a later module
- OR extend the module to 12-15 lessons with iteration lessons between
  introductions
- OR redesign as introduce-A → drill-A → introduce-B → drill-B-with-A →
  introduce-C → drill-C-with-A-and-B

**M3 specific fix (to ship): split into M3 + M3b.**
- M3 (new): keep katakana intro + です/か + は/が + drills/dialogue/
  test that REUSE only these two grammar concepts. ~8 lessons.
- M3b (new module): の + demonstratives + numbers + に/で, also with
  drills and dialogues that REUSE prior concepts. ~8-10 lessons.

This is the same "introduce sparingly, iterate ruthlessly" principle
Genki uses — Genki I covers ~12 chapters in roughly the same
grammar-concept density we're targeting per module.

## Anti-patterns (don't ship)

- Nonsense sentences ("the cat drinks beer")
- Reading-only lessons with no production
- Tracing on derived kana (dakuten/yōon)
- Tests with binary pass/fail (review-tail replaced this in #84)
- Implicit grammar (let users figure out particles from exposure)
- ASR targets with geminates/long vowels/pitch dependence in early modules
- Romaji ruby on test/quiz options (already fixed via `optionsHideRomaji`)

## Where we already beat Duolingo

- Hand-authored sentences with 4-persona audit
- Mora-aware STT — encouraging, not punitive
- FSRS for retention + per-lesson review-tail
- Mastery gate (★) via review-tail mechanics
- Cultural callouts (info hero variant)
- Speech production on every relevant lesson

## What to steal from Tae Kim

1. Explanation style — explain *what a grammar element does*, not just
   how to use it. Map to Grammar Rule Card design.
2. Transitive/intransitive pairs taught early.
3. Particles taught by role, not by English-equivalent.
4. Sentence-ending particles (よ/ね) early — makes early dialogues sound
   real.

## What NOT to steal from Tae Kim

- Casual だ first. Friends test with strangers; politeness baseline
  matters. **Keep です first**, layer plain form in M5+.
- No audio / no exercises — we have both solved.

## Sources

- [Migaku — Duolingo Japanese Review](https://migaku.com/blog/japanese/duolingo-japanese-review)
- [JLPT Samurai — Duolingo CEFR Analysis](https://jlptsamurai.com/2025/11/15/duolingo-japanese-accuracy-is-the-course-really-broken-analyzing-grammar-and-cefr-levels/)
- [Migaku — Comprehensible Input Method](https://migaku.com/blog/language-fun/comprehensible-input-method-language-learning)
- [Comprehensible Japanese (Krashen platform)](https://cijapanese.com/about)
- [CAELA Network — Grammar in Context](https://www.cal.org/caelanetwork/resources/teachinggrammar.html)
- [ACTFL — Teach Grammar as a Concept in Context](https://www.actfl.org/educator-resources/guiding-principles-for-language-learning/teach-grammar-as-a-concept-in-context)
- [Genki Grammar Index — St. Olaf](https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/)
- [JLPT N5 Grammar List — Migaku](https://migaku.com/blog/japanese/jlpt-grammar-points)
- [Core 2k/6k Anki Deck](https://ankiweb.net/shared/info/1880390099)
- [Preply — 100 Basic Japanese Words](https://preply.com/en/blog/basic-japanese-words/)
- [Tae Kim's Guide (official)](https://guidetojapanese.org/learn/)
- [Migaku — Tae Kim Review](https://migaku.com/blog/japanese/tae-kim-japanese-grammar-guide)
- [JLPT Samurai — Tae Kim Review](https://jlptsamurai.com/2025/11/03/tae-kims-guide-the-complete-review-and-how-to-use-it-for-jlpt-prep/)
- [ASR for L2 Japanese — pronunciation training](https://www.shs-conferences.org/articles/shsconf/pdf/2020/05/shsconf_etltc2020_02003.pdf)
- [Preply — Worth getting a Japanese tutor?](https://preply.com/en/blog/worth-getting-japanese-tutor/)
- [Spaced repetition (Wikipedia)](https://en.wikipedia.org/wiki/Spaced_repetition)
