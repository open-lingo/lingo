# Curriculum audit — Lingo vs. external pedagogy research

**Date:** 2026-05-21
**Scope:** Japanese N5 curriculum (M1–M7 shipped + sidequests). Korean course not audited.
**Method:** Parallel dual-agent — one agent researched textbook/app/research consensus for L2 Japanese sequencing; second agent mapped the live Lingo curriculum order from source files. Gap analysis synthesized from both.
**Companion docs:** `curriculum-design-v2.md`, `docs/n5-content-spec-2026-05-25.md`.

---

## Top-line verdict

Lingo is closer to research-backed best practice than any of the apps surveyed (Duolingo, WaniKani, Bunpro included), and noticeably more disciplined than Genki/Minna in several places. M1+M2 (the kana phase) is essentially textbook-perfect. M3–M7 (grammar/vocab phase) has two deliberate divergences from consensus worth keeping under review, plus one apparent omission (も).

---

## Research synthesis — the rubric

### Textbook consensus (Genki I, Minna no Nihongo I, Japanese From Zero)

For the first ~20 hours of study, the stable shape across textbooks is:

1. **Script first or in parallel with first phrases.** Genki and Minna front-load full hiragana before Lesson 1's grammar proper. Japanese From Zero substitutes kana in gradually from romaji.
2. **Lesson 1 grammar = copula + topic particle.** `N1 は N2 です`, `です/ですか` questions, `の` noun-linking. First four particles: は, も, の, か.
3. **Polite (-masu) form is the default starting verb form.** Dictionary form delayed (Genki Ch.3, Minna L20).
4. **Demonstratives これ/それ/あれ + ここ/そこ/あそこ in Lesson 2.**
5. **Existence verbs ある/いる + location particle に around Lesson 4 (Genki) / Lesson 9–10 (Minna).**
6. **Past tense + adjectives together around Lesson 4–5.**
7. **Numbers, time, ~100 high-frequency nouns interleaved through Lessons 1–5.**

### Live debates

- Romaji crutch vs. cold-turkey kana (classroom consensus leans against romaji).
- Kanji from day 1 (Minna, WaniKani) vs. delayed (Genki).
- Polite-form-first (classroom) vs. dictionary-form-first (Tae Kim, self-learner camp).
- Greeting-first survival mode vs. systematic script-first.
- Katakana timing — Genki delays, Duolingo interleaves early.

### App approaches

- **Duolingo Japanese** — orders kana thematically (い ち に first so learners read "one/two" immediately). Hiragana first, katakana mid-section 1, kanji late section 1. Pro: instant payoff. Con: weak grammar, kanji-too-early is #1 complaint.
- **WaniKani** — kanji-only, ordered by radical-buildup efficiency. Strict gating radical → kanji → vocab. Mandatory SRS.
- **Bunpro** — grammar-only, JLPT-tiered (N5 → N1). N5 has ~36 grammar points.

All three specialize. None do script+grammar+vocab+kanji in one pipeline like Duolingo — and Duolingo is the most criticized.

### Research-backed principles

- **Distributed practice + retrieval practice** are the two highest-utility learning techniques (Dunlosky et al. 2013). SRS operationalizes both.
- **FSRS-6 beats SM-2 for >99% of users** at matched retention, 20–30% fewer reviews (benchmarked on ~700M Anki reviews).
- **Receptive precedes productive.** Recognition scores reliably higher than production; teach receptive first, promote to productive.
- **Interleaving beats blocking for long-term retention, but blocking is better during initial acquisition.** Hybrid block-then-interleave > pure either (Kang; Hwang 2025).
- **Romaji co-presentation can hurt long-term kana fluency.** Toggle-off-able romaji is the safe compromise.
- **JLPT N5 ≈ 800 words, ~100 kanji, ~80 grammar points** — de facto "first 200 hours" target.
- **Particle introduction consensus order:** は → か → の → も → を → に → で → と → へ → から → まで → が. (が deferred despite being fundamental because the は/が distinction confuses beginners.)

### Canonical first 10 lessons (the rubric used for the gap analysis)

1. Hiragana あ-row through な-row + 5 survival greetings. Recognition only.
2. Hiragana は-row through わ-row + ん. Reading drills with 2-mora words. Recognition-dominant.
3. Dakuten/handakuten + `これは___です`. Introduce は. First productive output.
4. Yōon + small っ + long vowels. Numbers 1–10, days. Introduce か, の.
5. Self-introduction. `わたしは___です`, occupations/nationalities, negation. Introduce も. Receptive katakana exposure (country names).
6. Demonstratives これ/それ/あれ + ここ/そこ/あそこ. ~20 everyday objects.
7. Katakana あ-か-さ-た-な + loanwords. Introduce particle を + first -masu verbs (たべます, のみます, みます).
8. Katakana complete + first 5 -masu verbs present/negative. Time expressions. Particle に for time.
9. ある/いる + location particle に. Vocab: rooms, furniture, family. First ~5 kanji.
10. Past tense (-ました/-ませんでした) + first い-adjectives. Particles で, と. Cumulative SRS pass.

End-of-Lesson-10 target: all kana + first dakuten/yōon, ~150 vocab, ~5 kanji (recognition), 5 particles, copula + -masu present/past/negative, basic adjectives, demonstratives, existence verbs.

---

## Lingo current state (audited 2026-05-21)

### Module spine

- **M1 — "First 46 sounds"** (39 sub-lessons): vowels + 9 consonant rows, each row = 3 content sub-lessons + 1 row-test. Anchor words assigned greedily (うま, かお, さくら, etc.).
- **M2 — "Dakuten · Handakuten · Yōon"** (37 sub-lessons): が/ざ/だ/ば/ぱ rows + yōon (きゃ → しゃ/ちゃ → voiced → rare). Yōon hard-gated by ya-row mastery via `prerequisites: ["ya"]`. Tracing dropped.
- **M3 — "First sentences"** (8 sub-lessons): katakana intro as system, です + か, は particle, mini-dialogue, mastery test.
- **M4 — "Things and people"** (8): everyday objects, の possessive, demonstratives.
- **M5 — "Numbers"** (8): 1–10, 人 counter, café transactions, ください, から.
- **M6 — "Where things are"** (9): place vocab, に, で, が via あります/います, directions dialogue.
- **M7 — "Verbs in motion"** (9): dictionary form first, then ます stem, を particle, food vocab.
- **Sidequest — Survival Phrasebook**: 15 phrases unlocked day-1 (こんにちは, ありがとう, etc.), pure exposure.

### Particle order shipped

です/か (M3-2) → は (M3-4) → の (M4-2) → これ/それ/あれ/どれ (M4-4) → ください (M5-2) → から (M5-7) → に (M6-2) → で (M6-3) → が (M6-4) → 辞書/ます (M7-1, M7-2) → を (M7-3).

### Vocab coverage

196 of ~600–800 target N5 atoms taught (~25–33%). 553 future N5 atoms staged in `ja-course-atoms.ts` awaiting M8+ lessons.

### Grammar coverage

12–14 of ~80 N5 grammar atoms (~15–18%). Te-form, past tense, ない-form, adjective conjugation, comparison, modals all unbuilt (roadmapped M8–M30).

### SRS

FSRS-6 via ts-fsrs v5.4.0. Target retention 0.95. Mastery at 21-day interval. Lesson outcomes map `{correct, retried}` → Again/Hard/Good. Recognition/production modality split in-progress (per CLAUDE.md), not yet shipped.

### Notable design choices

- Romaji ruby via `AnnotatedJa` — only above un-introduced kana, by design.
- Mastery-gated row tests; sub-lessons skippable but row tests not.
- ぢ / づ explicitly dropped from drillable atoms (modern usage).
- Compounding review baked into every sub-lesson tail (≥0.25 review-to-new ratio) — replaced standalone inter-module Review pseudo-modules (2026-05-18).
- Adaptive per-atom picking lives on flashcards surface, not in lessons (architectural commitment to keep lessons statically authored).

---

## Gap analysis

### Aligned with consensus

| Principle | Lingo's implementation |
|---|---|
| Block-then-interleave practice | Per-row 3 sub-lessons + test (blocked), then M3+ interleaved drills |
| Yōon after base 46 mastered | Hard prerequisite gate on ya-row mastery |
| Recognition → recall → production within each sub-lesson | Codified in M1; M3+ retains principle |
| FSRS-6 over SM-2 | Already migrated; tighter target retention (0.95) |
| Survival phrases day-1 detour | 15-phrase sidequest unlocked from start |
| が via existence, not "subject marker" | M6-4 teaches が through あります/います — sidesteps the は/が trap |
| No kanji dump | Zero productive kanji in shipped spine |
| Dakuten ordering (が→ざ→だ→ば→ぱ) | Universal consensus order |
| Romaji as ruby, not body text | AnnotatedJa shows romaji only above un-introduced kana |
| N5 as explicit target | 600–800 atom target; deck sourced from N5 list |

### Defensible divergences (deliberate calls, flag for review)

**1. Verbs deferred to M7.**
Textbooks (Genki Ch.3, Minna L6) put -masu verbs around lesson 6–8 of total study; Lingo waits until module 7, after numbers (M5) and locations (M6). M3–M6 are noun-state sentences ("X は Y です", "X は Z に あります") with no action sentences for many hours.
- *Defense:* Phrasebook-first arc (café in M5, directions in M6) is motivating.
- *Cost:* Learner can't say "I eat / I go / I see" until module 7. Genki learners can by Ch.3.

**2. Dictionary form before -masu form (M7-1 → M7-2).**
Classroom consensus is -masu first; Tae Kim / self-learner camp argues dictionary first. Lingo picked self-learner path.
- *Defense:* Dictionary is morphological root — all conjugation derives from it.
- *Cost:* Diverges from every classroom textbook a learner might cross-reference.

**3. Romaji ruby has no off-toggle.**
The "only above un-introduced kana" design is smart, but CALL research found even passive romaji co-presentation can slow kana fluency. Toggle would cost ~30 min to add and satisfies the research camp.

### Real gaps

**1. も is missing from the curriculum entirely.**
Consensus particle order: は → か → の → **も** → を → に → で. Lingo ships は, か, の, に, で, が, を, から — but no も. It is an N5 particle, extremely high-frequency ("X も Y です" = "X is also Y"), and unlocks contrast sentences. Looks like an unintentional omission, not a deliberate cut.

**2. Past tense + adjectives missing from shipped spine.**
Research rubric has these by Lesson 10. Lingo doesn't ship them until M8+ (roadmapped). A learner finishing M7 still can't say "yesterday was fun" or "the food was good." The gap from "course feels playable" to "course feels usable" is wider than the module count suggests.

**3. Density audit findings the roadmap doc already flagged are still live.**
Same-answer cloze clusters (M3-5 = repeated は/か, M6-6 = 6×が, M7-5 = 6×を), vocab-only lessons with zero retrieval (M5-1), step-type variety dropping from M1's 5+ types to ~2 in some M3–M7 drill blocks. The 2026-05-18 rebuild brought averages closer to the ~20-step target but variance remains.

**4. Recognition/production SRS split not yet shipped.**
Research clearly separates these. CLAUDE.md notes it is in-progress; until it lands, FSRS treats "recognize かめ from audio" and "produce かめ from English" as the same card, which under-schedules production.

---

## Open questions

1. **も** — intentional skip, or did it fall through the cracks? If unintentional, easy fix to slot into M4 or M5 as a third particle alongside は/の.
2. **Verb-delay vs. textbook-parity** — is "phrasebook arc through M6" a deliberate product call (motivation > textbook alignment), or worth revisiting? Genki/Minna are very confident -masu belongs at hour 4, not hour 30.
3. **Past tense roadmap urgency** — current spine tops out without past tense. If optimizing for a learner who completes M7 and stays, past tense may need to move earlier than M8.
4. **Romaji toggle** — research lean is slightly against current default. Worth a setting?

---

## Sources

- St. Olaf Genki I/II grammar index — https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/
- Minna no Nihongo lesson grammar — https://learnjapaneseaz.com/minna-no-nihongo-lesson-1-grammar.html, https://learnjapaneseaz.com/minna-no-nihongo-lesson-10-grammar.html
- Tofugu — Genki review, Japanese From Zero review
- 80/20 Japanese — when to learn Japanese characters
- WaniKani community — kanji-first debate; WaniKani knowledge base — radicals/kanji/vocab
- Bunpro N5 grammar deck — https://bunpro.jp/decks/nn10ai/Bunpro-N5-Grammar
- Duolingo blog — how Duolingo invented kana teaching; Duolingo Wiki — Japanese course
- Linguaholic / Kokoro Media — Duolingo Japanese reviews
- JapaneseAmmo — why self-learners should skip -masu first
- JapanesePod101 — survival phrases lesson library
- SmileNihongo — Japanese verb forms overview
- Avatalks / Migaku — kana extras (dakuten/handakuten/yōon) reference
- Mindomax — SRS algorithms guide; FSRS vs SM-2 benchmark
- Dunlosky et al. 2013 — learning techniques meta-review
- ResearchGate (Webb) — receptive/productive L2 vocabulary learning
- Frontiers 2023 — receptive vs productive vocabulary
- Kang interleaving review (UNH) — https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-interleaved-training-and-category-learning-kang.pdf
- Hwang 2025 Language Learning — interleaved practice in L2 acquisition
- ResearchGate — CALL Vocabulary Learning in Japanese (romaji effects)
- JLPTLord N5 vocab list — https://www.jlptlord.com/jlpt-n5
- MLC Japanese — N5 particle order guide

## Internal source files audited

- `lingo/src/features/lesson/data/hiraganaCurriculum.ts`
- `lingo/src/features/lesson/data/mock-ja-m{3-v2,4,5,6,7}.ts`
- `lingo/src/features/lesson/data/mockLessons.ts`
- `lingo/src/shared/domain/mockCourse.ts`
- `lingo/src/features/flashcards/data/ja-course-atoms.ts`
- `lingo/src/features/flashcards/engine/srs.ts`
- `lingo/docs/n5-content-spec-2026-05-25.md`
- `lingo/docs/curriculum-design-v2.md`
