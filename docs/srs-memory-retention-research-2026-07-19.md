# SRS & Memory-Retention Best Practices for Vocabulary — Research + Open Lingo Gap Analysis

**Date:** 2026-07-19
**Scope:** Spaced-repetition scheduling + memory science for L2 **vocabulary**, then a gap analysis against Open Lingo's shipped flashcard/SRS system.
**Builds on (does not duplicate):**
- `docs/srs-scheduling-model-2026-06-15.md` — the ACTIVE scheduling spec (unified FSRS, seed-next-day, no-cap intake, review-woven-through-course). This report treats those decisions as given and does not re-litigate them.
- `docs/curriculum-audit-vs-research-2026-05-21.md` — already establishes distributed+retrieval practice, FSRS>SM-2, receptive-before-productive, block-then-interleave, and the romaji-crutch finding for the *curriculum*. This report applies the same lens to the *flashcard reviewer* specifically.
- `docs/srs-deck-unification-plan-2026-06-13.md` — the card model derived from `JA_COURSE_ATOMS`; Kaishi-1.5k field reference (separate word audio + sentence audio + pitch + image).
- `CLAUDE.md` §"SRS engine" and §"Vocab SRS unification".

The point of this doc is the **reviewer surface**: what the learner actually experiences when grading a card, and which measurable retention levers are present, absent, or under-used there.

---

## Part 1 — Research

### 1. Scheduling: FSRS vs SM-2 vs Leitner

- **Leitner (boxes):** fixed promotion/demotion between a handful of boxes with fixed intervals. Simple, no per-card memory model. Fine for small static decks; wastes reviews at scale because every card in a box shares one interval.
- **SM-2 (SuperMemo, 1987):** one per-card **ease factor** adjusts a single interval multiplier. The workhorse behind classic Anki. Two well-known failure modes: **"ease hell"** (a few lapses permanently crater a card's ease and it never recovers) and interval estimates that don't reflect *actual* recall probability.
- **FSRS (Free Spaced Repetition Scheduler):** a data-driven **DSR model** (Difficulty, Stability, Retrievability) descended from Wozniak's two-component model via MaiMemo's DHP. Each card carries **stability** (how long memory lasts), **difficulty** (intrinsic hardness), and computed **retrievability** (current recall probability). ~17–21 trainable weights; FSRS-6 defaults were trained on ~700M reviews from ~10k Anki users.
- **Why FSRS-6 beats SM-2:** ~**20–30% fewer reviews** for the same retention; more accurate recall prediction on ~99.6% of collections; and **mean-reversion of difficulty** cures ease hell (a card's difficulty drifts back toward baseline after consistent correct answers instead of staying permanently damaged). Anki ships FSRS as the default since 23.10 (2023).
- **Optimal retention target:** the workload-minimizing target is **~0.90** for most users. FSRS explicitly frames desired retention as a knob on a **workload↔knowledge trade-off**: raising the target above ~0.90 sharply increases review count for diminishing retention gains. The community-endorsed "reasonable range" is **0.80–0.95**, with **0.90 the recommended default**. Pushing to 0.95 roughly *doubles* long-run workload relative to 0.90 (each 9-point retrievability step near the top costs disproportionate reviews).
  - Sources: kachika, smartrecallai, studycardsai, expertium benchmark, Anki FAQ, fsrs4anki "Optimal Retention" wiki, fsrs-optimizer DeepWiki.

### 2. Retrieval practice & the testing effect; recognition vs production

- **Testing effect / retrieval-practice effect (RPE):** actively *retrieving* an item produces markedly better long-term retention than re-studying it. It's one of the two highest-utility techniques in Dunlosky et al. (2013), alongside distributed practice.
- **Recall > recognition as a *training* format.** Words trained by effortful **recall** are later recalled better than words trained by restudy or by recognition; the retrieval-practice advantage is **largest when the practice test is recall**, smaller or absent when it's recognition. Recall also produces greater transfer.
- **Why production matters:** recognition ("do I know this word?") is *easier* and reliably scores higher than production ("can I *produce* this word from meaning?"). That ease is exactly why recognition-only review over-estimates mastery. Production is the harder, more diagnostic, more transferable direction — and it's a **generative** act (see §3). Best-practice sequence: **teach receptive first, then promote to productive** rather than testing only one direction forever.
- **Cued vs free recall:** flashcards are inherently **cued** recall (the prompt cues the target). Cued recall is a reasonable middle ground; the desirable-difficulty gradient runs recognition → cued recall → free recall/production.
  - Sources: Karpicke retrieval-based-learning review (ERIC), ncbi RPE studies, PMC "learning rounds" flashcard study.

### 3. Desirable difficulties: spacing, interleaving, generation, varied context

- **Spacing:** spaced repetition beats massed for L2 vocab, robustly. **Expanding** intervals ≥ fixed intervals (FSRS produces expanding intervals natively). The **first gap should be ~overnight**, not same-day — same-day re-test is too easy to be worth much (Cepeda et al. 2006). This is exactly why the scheduling spec seeds cards **due next day, never same-day**.
- **Interleaving:** interleaved practice of different items beats blocked practice for long-term retention, partly via spacing and partly because interleaving forces **discrimination between items** (blocking lets you notice commonalities but hides contrasts). Caveat: **blocking is better during *initial* acquisition**; the evidence-backed shape is **block-then-interleave** (Kang; Hwang 2025 shows pure interleaving can *hurt* low-achieving learners early). Don't interleave brand-new words the moment they're introduced.
- **Generation effect:** producing/generating an answer (typing, building, speaking the word) beats passively reading it. Note: several studies find the generation benefit is **weak over very short horizons (days)** and shows up on **longer-delay** retention — i.e., it's a true "desirable" difficulty (costs now, pays later), which argues for *keeping* production drills even when they feel slower.
- **Varied context / context variability:** encountering a word in **multiple different sentences/contexts** builds a richer, more retrievable memory than a single fixed context — though it also raises processing load, so it's a difficulty to dose, not maximize.
  - Sources: Cambridge SSLA (expanding vs equal spacing; massing vs spacing), castledown generation study, Wiley "Undesirable Difficulty of Interleaved Practice" (Hwang 2025), Applied Psycholinguistics context-variability study, MDPI Behav. Sci. difficulty/transfer study.

### 4. Encoding aids that measurably help vocab retention

- **Audio / native pronunciation on the card:** multimedia vocab instruction (imagery + context + **native-speaker audio**) strengthens the web of associations (orthography ↔ pronunciation ↔ meaning). Pronunciation is a distinct code from orthography, so hearing the word adds a retrieval route and — critically for a *spoken* language goal — trains the form you'll actually recognize in speech. **Important dosing caveat (redundancy effect):** presenting **text + audio of the same verbal content simultaneously** can *hurt* (two verbal streams compete). The clean design is audio tied to the **reveal/answer** and/or one-tap replay, not a second verbal stream fighting the prompt.
- **Imagery / dual coding (Paivio):** pairing a word with a picture creates a second (visual) memory code; **concrete** words benefit most. Dual-coded cards outperform text-only in EFL vocab studies — but watch cognitive load (image + text + audio all at once can tip into overload).
- **Example sentences in context:** words learned in rich, relevant contexts are retained better; a contextual example sentence is a standard component of an effective vocab card. Combine with **varied context** (§3) for the strongest effect.
- **L1 vs L2 glossing:** L1 glosses (translation on the back) are fast and low-load for early acquisition; L2-only definitions push deeper processing but cost more. Reasonable design: L1 gloss for the core meaning, plus an L2 example sentence for depth.
- **Keyword / mnemonic method:** linking the L2 form to an L1 keyword via a vivid image measurably boosts initial acquisition, especially for concrete nouns; benefits fade for abstract words and need reinforcement. Useful as an *optional* per-card aid (a "note/mnemonic" field), not a system-wide requirement.
  - Sources: Sciedu multimedia study, Frontiers dual-coding/cognitive-load study, TELJournal decontextualized vs dual-code study, Language Gym ranked-factors analysis.

### 5. Session design

- **New-vs-review ratio / daily load:** in Anki, steady-state daily reviews settle at roughly **8–12× the new-card rate**. 20 new/day → 150–240 reviews/day at maturity — the classic burnout curve. Beginner guidance: **10–15 new/day**. Open Lingo's model deliberately makes **lesson pacing the intake throttle** and defaults the standalone reviewer to no new-card cap (scheduling spec D5) — the review-load cap is the right knob, not intake.
- **Learning steps:** short steps for language vocab ("1m 10m"); an optional "1d" step (see the card again next day before graduation) improves early retention at the cost of week-1 reviews.
- **Lapses / leeches:** a card that keeps failing is usually **too complex, lacks context, or violates the minimum-information principle** (one fact per card). Anki tags a **leech at ~8 lapses** (healthy range 6–8) and then suspends or flags it for reformulation. The point isn't punishment — it's a *signal to fix the card*, and to stop it from eating review time.
- **Burying siblings:** don't show two cards of the **same fact** (e.g. recognition + production, or word + its example sentence) on the **same day** — the first exposure makes the second trivially easy, wasting the retrieval. Anki buries new+review siblings by default.

### 6. Pitfalls

- **Over-reliance on romanization/transliteration:** romaji/pinyin co-presentation **hinders script fluency** and can cause "character amnesia"; it also approximates pronunciation imperfectly. Consensus fix: **toggle-off-able** transliteration used as a temporary aid, never the primary stimulus. (Open Lingo's curriculum audit already reaches this conclusion; the reviewer should honor it too — the *front* of a card should be the target script, not the romanization.)
- **Recognition-only review:** the single most common flashcard failure — feels productive, over-estimates mastery, never trains production (§2).
- **Cloze overuse:** cloze is powerful for grammar/collocation but degrades when **overused** (fatigue), when **multiple words are blanked** in one sentence (loses the focused single-retrieval that makes cloze work), or when the surrounding context is too thin. Keep clozes single-blank, well-contextualized, and mixed with other card types.
- **Answer-leaking formatting:** cards where the prompt telegraphs the answer (length, a highlighted particle that gives it away, an image that *is* the answer on a "produce the word" card, matching pair counts that make the last pair free) produce false "correct" grades and inflate scheduling. Audit card templates for accidental cues.
  - Sources: jasonmrubin Thai romanization, chineseboost/clozemaster/speakada cloze guides, migaku cloze guide.

---

## Part 2 — Gap analysis vs Open Lingo

Grounded in: `src/features/flashcards/engine/srs.ts`, `reviewQueue.ts`, `FlashcardTester.tsx`, `components/FlashcardDetailSidebar.tsx`, `data/types.ts`, `data/courseDeck.ts`.

### What Open Lingo already does well

| Best practice | Status in Open Lingo |
|---|---|
| Modern scheduler (FSRS-6 > SM-2) | ✅ `ts-fsrs` v5.4.0, FSRS-6, no legacy SM-2 fields written (`srs.ts`). |
| Stability/Difficulty/Retrievability model, ease-hell-free | ✅ Inherited from FSRS-6; `cardMaxDifficulty` used for sort. |
| **Hard is a success** (not a lapse) | ✅ Explicit and correct (`srs.ts` docstring + `RATING_MAP`). |
| Recognition **and** production as first-class, independently scheduled | ✅ Two FSRS sub-states per card (`SRSCardState`), graded one at a time. Ahead of most consumer apps. |
| Retrieval practice woven into lessons, unified with flashcards | ✅ `gradeFromLesson` + `shouldWriteSrs` gate: **only review steps write FSRS**; teach steps never advance state. |
| First review never same-day (spacing / Cepeda) | ✅ `createSeededState` seeds **due next day**; scheduling spec D4/D6. |
| Intake throttle = lesson pace, not an arbitrary cap | ✅ Scheduling spec D5; adaptive `adaptiveNewCardsPerDay` backstop. |
| Dual coding (imagery) | ✅ Every authored vocab word has an image (Noto Emoji + custom SVG); shown on the card. |
| Example sentences in context | ✅ Supported (`Example[]`, `ExamplesList`) with optional per-example audio, "+N more" toggle. |
| Bury support | ✅ `buriedUntil` + `buryCard`/`unburyCard` in engine. |
| Undo, interval preview, honest "min(recognition,production)" due estimate | ✅ Thoughtful reviewer UX. |
| Romaji as toggle, target script as primary | ✅ Curriculum uses toggle-off-able transliteration; reviewer front = target form. |

This is a genuinely strong foundation — the engine and the lesson↔flashcard unification are ahead of most commercial apps.

### What's missing or under-used (measurable retention levers)

**G1 — No audio on the word card itself (highest-leverage gap).**
`FlashcardBase` has **no `audioUrl` field**, and `FlashcardTester` plays **no audio** when a card is shown or revealed — it renders image + text only. Audio exists **only** on *example* sentences, behind a manual play button in the sidebar (`FlashcardDetailSidebar`). Yet the app already has **full M3–M27 TTS coverage (2504 texts, 0 gaps)** and a runtime `getTtsUrl()`. So the single most-cited encoding aid for *spoken*-language vocab — hearing the word's pronunciation during review — is absent from the core review loop despite the infrastructure being paid for. Research says wire it to the **reveal side** (avoid text+audio-of-same-content simultaneously; the redundancy effect). This is the clearest ROI in the whole system.

**G2 — Target retention 0.95 is likely too aggressive.**
`TARGET_RETENTION = 0.95` (`srs.ts`), justified by "vocab is exposed on two surfaces." But FSRS research frames retention as a workload-minimizing knob where **~0.90 is optimal for most** and 0.95 roughly **doubles** long-run review load for a few points of retention. The two-surface argument actually cuts the other way: because lessons *also* review these atoms, per-card scheduling pressure is already high, so an aggressive per-card target compounds load. Recommend **lowering the default to 0.90** (or A/B 0.90 vs 0.92) and — since `getTargetRetention()` is "not currently surfaced" — optionally exposing it as a power-user setting. Low code effort, potentially large workload reduction.

**G3 — Production is under-surfaced in practice.**
The engine supports production fully, but `FlashcardTester` picks **recognition first** whenever recognition is due, and both sub-states are seeded with the **same due date**, so in normal flow recognition is almost always the one exercised; production only surfaces when it's the *sole* due modality. There is no **production-focused session** and no **recognition→production promotion gate** (research: teach receptive first, then promote). Net effect: the app has a production model but leans recognition-heavy in reality — the exact recognition-only-ish pitfall the modality split was built to avoid. Options: (a) a "Production practice" review mode; (b) stagger production's first due date behind recognition maturity so promotion is deliberate.

**G4 — No leech / lapse handling.**
`lapses` is tracked on every sub-state but **nothing acts on it** — no leech threshold, no auto-suspend, no "reformulate this card" flag (grep confirms: lapses only read/written, never thresholded). A chronically-failing card silently burns review time forever. Add a leech tag at ~**6–8 lapses** that surfaces the card in Card Manager for reformulation and optionally auto-buries/suspends it. Cheap, and directly protects daily-load sanity.

**G5 — Sibling burying not enforced for word↔sentence (and recognition↔production same-day).**
`buryCard` exists but isn't wired to **sibling** logic. When a word card and a sentence card share an atom (or both modalities of one card are due the same day), the first makes the second trivially easy. `srsSync`/queue building should bury siblings within a day. Medium value, medium effort.

**G6 — Struggle-weighted render-time picker (unification Phase 6) still not shipped.**
`reviewQueue` sorts due cards by **FSRS difficulty descending** (hardest first). That's a reasonable proxy but: (a) it's *fixed sort*, not the struggle-weighted + interval-aware picker the unification plan envisioned (`pickReviewAtoms`/`topStruggleKana` exist for lessons but the flashcard surface doesn't use them); and (b) hardest-first every session can feel punishing and front-loads the highest-failure cards when the learner is coldest. Consider an easy-first warmup or a weighted shuffle. Aligns with CLAUDE.md's own "remaining phase 6."

**G7 — New cards are blocked at the end of the queue (interleaving).**
`buildReviewQueue` appends new cards **after** all reviews (`[...reviewCards, ...newCards]`). That's correct for *initial acquisition* (block-then-interleave says don't interleave brand-new items immediately), but once a new card has had its first exposure it should **interleave** with reviews for discrimination benefit. Current model is fine but leaves the interleaving gain partly on the table. Low priority.

**G8 — Example-sentence coverage & varied context are opt-in/sparse.**
Examples come from `getMinedSentences()`; coverage across the atom set is unclear, they're **sidebar-only** (post-reveal, easy to skip), and there's no **context variation** (a word tends to appear with one fixed sentence). Context and context-variability are solid retention levers (§3–4). Auditing coverage and surfacing at least one example inline would help. Medium.

**G9 — Default FSRS weights, no per-user optimization.**
The scheduler uses FSRS-6 default weights (fine — trained on 700M reviews) with `enable_fuzz: false`. No per-user weight optimization from review history (what mature Anki does). Correctly *not* worth it yet (needs review volume), but worth noting as a future lever once there's per-user history — and re-enabling **fuzz** would prevent review pile-ups on the same day. Low.

---

## Do these next (ranked)

1. **[HIGH · S] Play the target word's audio on card reveal.** Add `audioUrl` (or derive via `getTtsUrl()` at load) to word/sentence cards; auto-play or one-tap on flip in `FlashcardTester`. Infra already exists (full TTS coverage). Biggest retention ROI; wire to the reveal side to dodge the redundancy effect. (G1)
2. **[HIGH · XS] Lower default target retention 0.95 → 0.90** (or A/B 0.90–0.92) and expose `getTargetRetention()` as an optional setting. One-line default change; potentially large workload reduction. Re-enable FSRS **fuzz** while there. (G2, G9)
3. **[MED · M] Surface production properly.** Add a production-practice review mode and/or stagger production's first-due behind recognition maturity (receptive→productive promotion). Prevents the de-facto recognition-only drift. (G3)
4. **[MED · S] Leech handling.** Tag at 6–8 lapses; surface in Card Manager for reformulation; optional auto-bury/suspend. Protects daily load. (G4)
5. **[MED · S] Bury siblings within a day** (word↔sentence sharing an atom; both modalities same day). Wire existing `buryCard` into queue building. (G5)
6. **[MED · M] Ship the struggle-weighted / interval-aware reviewer picker** (unification Phase 6), and consider easy-first warmup instead of pure hardest-first. (G6)
7. **[LOW · M] Audit + expand example-sentence coverage; add context variation; surface one example inline.** (G8)
8. **[LOW · S] Interleave post-first-exposure new cards** among reviews instead of appending all new cards at the end. (G7)

Effort key: XS ≈ <½ day, S ≈ ~1 day, M ≈ few days.

---

## Sources

**Scheduling / FSRS vs SM-2 / retention target**
- [Spaced Repetition Algorithm: SM-2 vs FSRS Explained — kachika](https://kachika.app/en/blog/spaced-repetition-algorithms/)
- [SM-2 vs FSRS vs Leitner vs Anki: Which Wins in 2026? — smartrecallai](https://smartrecallai.com/blog/sm2-vs-fsrs-vs-leitner-vs-anki-2026)
- [Anki FSRS: The New Scheduling Algorithm Explained (2026) — studycardsai](https://studycardsai.com/blog/anki-fsrs-algorithm)
- [Expertium's FSRS Benchmark](https://expertium.github.io/Benchmark.html)
- [What spaced repetition algorithm does Anki use? — Anki FAQs](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)
- [The Optimal Retention — fsrs4anki wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-optimal-retention)
- [Optimal Retention Calculation — fsrs-optimizer DeepWiki](https://deepwiki.com/open-spaced-repetition/fsrs-optimizer/4.6-optimal-retention-calculation)

**Retrieval practice / recognition vs production**
- [Retrieval-Based Learning: A Decade of Progress — Karpicke (ERIC)](https://files.eric.ed.gov/fulltext/ED599273.pdf)
- [The Effect of Retrieval Practice in Primary School Vocabulary Learning](https://www.researchgate.net/publication/259679706_The_Effect_of_Retrieval_Practice_in_Primary_School_Vocabulary_Learning)
- [The Moderating Role of Learning Rounds (digital flashcard FL vocab, PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12649105/)
- [The Critical Importance of Retrieval for Learning — Karpicke & Roediger](https://www.researchgate.net/publication/5574966_The_Critical_Importance_of_Retrieval_for_Learning)

**Desirable difficulties: spacing / interleaving / generation / context**
- [Effects of Expanding and Equal Spacing on L2 Vocabulary Learning — SSLA (Cambridge)](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/D1D796306985C52F9BE7A1200AC50DB9/S0272263114000825a.pdf)
- [Effects of Massing and Spacing on Semantically Related/Unrelated Words — SSLA](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/effects-of-massing-and-spacing-on-the-learning-of-semantically-related-and-unrelated-words/F58BA8D70385603B9C42E408BFCB8A10)
- [Generation and L2 vocabulary learning — Vocabulary Learning and Instruction](https://www.castledown.com/journals/vli/article/view/vli.v14n1.102482)
- [Undesirable Difficulty of Interleaved Practice (Hwang 2025) — Language Learning (Wiley)](https://onlinelibrary.wiley.com/doi/10.1111/lang.12659)
- [Practice conditions: difficulties from spacing and context variability — Applied Psycholinguistics](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/impact-of-practice-conditions-on-vocabulary-learning-and-processing-a-closer-look-at-difficulties-arising-from-spacing-and-context-variability/435E40BAF7EB0C2A65F778D19B3C0BC0)
- [Making L2 Vocabulary Learning Difficult: Retention and Transfer — MDPI Behav. Sci.](https://www.mdpi.com/2076-328X/15/5/692)

**Encoding aids: audio / dual coding / context / mnemonics**
- [The Effect of Multimedia on Vocabulary Learning — Sciedu WJEL](https://www.sciedupress.com/journal/index.php/wjel/article/viewFile/26331/16286)
- [Dual Coding or Cognitive Load? Multimodal Input & EFL Vocab — Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.834706/full)
- [Decontextualized, Semi-Contextualized, and Dual-Code Methods in Vocab Recall — TELJournal](https://www.teljournal.org/article_233360.html)
- [What Really Matters in Vocabulary Acquisition? Ranked Analysis — The Language Gym](https://gianfrancoconti.com/2025/04/26/what-really-matters-in-vocabulary-acquisition-a-ranked-analysis-of-key-influencing-factors/)

**Session design (Anki)**
- [Deck Options — Anki Manual (leeches, burying, steps)](https://docs.ankiweb.net/deck-options.html)
- [Studying — Anki Manual](https://docs.ankiweb.net/studying.html)
- [Right-Sizing Daily Load: New Limits, Ease, Leech Fixes — MemoForge](https://memoforge.app/blog/right-sizing-daily-load-anki-new-card-limits-ease-leech-settings/)
- [Anki Settings for Beginners — flica](https://flica.app/article/anki-settings-for-beginners)

**Pitfalls: romanization / cloze**
- [Mastering Thai Reading: A Romanized Guide (limits of romanization)](https://jasonmrubin.com/blog/mastering-thai-reading-a-romanized)
- [Cloze Deletion for Learning Chinese — Chinese Boost](https://www.chineseboost.com/blog/cloze-deletion-learning-chinese/)
- [Cloze Deletion Anki Guide — Speakada](https://speakada.com/cloze-deletion-anki-guide-my-experience-and-what-i-use-instead/)
- [Cloze Deletion vs Flashcards — Clozemaster](https://www.clozemaster.com/blog/cloze-deletion-vs-flashcards/)
