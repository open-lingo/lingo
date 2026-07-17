# PINNED authoring invariants (ja) — paste VERBATIM into every dispatch

**Status:** LIVE · **Last-verified:** 2026-07-17

> This is the constraint-pinning block (research doc
> [ai-workflow-optimization-research-2026-07-17.md](ai-workflow-optimization-research-2026-07-17.md),
> Finding 1: soft rules decay ~8× faster than hard rules after compaction;
> re-injection restores compliance). It is the INVARIANT CORE of
> [lesson-authoring-guide.md](lesson-authoring-guide.md) — the guide explains
> and extends; this block is the part that must physically travel with every
> authoring/fix dispatch prompt, every time, no matter how long the session.
> Machine-checked claims here are enforced by `docReferences.test.ts` +
> `moduleConformance.test.ts` + `moduleContentLints.ts`; the pin exists so
> agents don't ship the defect in the first place.

## Script ladder (constants in `shared/settings/romajiAutoFlip.ts` / `ja/secondScript/kanjiRollout.ts`)

1. Romaji cutoffs: hiragana @ M7, katakana @ M17; build-tiles fade at M5.
   Kanji recognition starts at M8 with a furigana window of unlock+2
   modules.
2. NEVER romaji + kanji on the same word, under any setting. No typed kanji
   input, ever. Kana floating above identical kana is always a defect.

## Step-type bans (ja only — es/ko differ)

3. ja ships ZERO `info` steps and ZERO `phrase_card` steps. `vocab()` and
   `phrase()` helpers silently EMIT phrase_card — do not call them in ja.
   Introduce vocab via `listeningCompSentence` + `speaking`, a `build`
   sentence, or a `grammarRule` compact card.
4. `particle_cloze` only within 2 modules of that particle's introduction.
5. Blocked words (emoji-blocked-words doc) never get image MCQs.

## Register

6. M3–M28 is polite form (です/ます) everywhere. Plain form exists only in
   m29+ and NEVER leaks into earlier modules' surfaces or distractors.
7. Every production prompt whose answer depends on register carries an
   explicit cue ("Say to a friend:", "Say politely:"). A learner must never
   need out-of-band lesson context to pick between polite/plain options.
8. No "(plain)"/"(te-form)"-style tags on options — if every option carries
   the same tag it discriminates nothing; if only the answer carries it,
   it's a giveaway.

## MCQs and distractors

9. All options unique, non-empty. No distractor echoes a Japanese token
   quoted in the prompt. For meaning-cued form pickers, every distractor is
   a REAL conjugated form of some taught verb (cross-verb confusion), never
   an invented non-word (のみる/のむる-class). Non-words are allowed ONLY in
   derivation drills ("convert X to て-form") where wrong-derivation is the
   tested contrast.
10. Rotate correct-answer positions; never hardcode slot A.

## grammarRule cards

11. `antiPattern.ja` is a FULL-SENTENCE minimal pair of `examples[0].ja`
    (same sentence, one wrong piece) — never a bare fragment; the derived
    spot-the-mistake step makes fragments a length giveaway.

## Sentences and coverage

12. From M12 on, production/build sentences ramp in complexity (connectives
    から/ので/けど/て-links; see guide §4g floors). Short-and-flat everywhere
    is a defect; review-tail citation retrievals are exempt.
13. Every SRS-eligible vocab atom needs ≥3 authored surface occurrences
    across its home + later modules (atom-coverage gate, m3–m29).
14. Sub-lesson density: match the m3+ bar (~18–24 steps); never pad with
    passive cards to hit it.

## Provenance discipline

15. Never invent vocab/kanji outside the module's allocation (spine doc).
    Pull review atoms via the seeded helpers, never hand-pick randomness.
