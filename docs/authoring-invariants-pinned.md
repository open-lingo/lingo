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
3. Kanji furigana is window-floor OR unmastered (Spencer 2026-07-17), on
   BUILD TILES and SENTENCE surfaces alike: a kanji shows kana furigana
   while the lesson module is inside its unlock+2 grace window (the floor —
   even for long-mastered atoms), and past the window it KEEPS furigana
   until the atom is FSRS-mastered (both modalities ≥ 21 days), then bare.
   Grading, `tiles`, and `correctOrder` stay KANA — display-only.
   Character-granularity (kana-decoding) builds never kanji-fy: kana IS
   their content. Furigana is okurigana-aligned (rt over the kanji run
   only: 飲(の)まない), and REAL inflected tile forms kanji-fy under the
   same gates (のまない → 飲まない). Exception: `kanji_reading` prompts
   render bare always (the reading IS the answer — surface === reading
   suppression).

## Step-type bans (ja only — es/ko differ)

4. ja ships ZERO `info` steps and ZERO `phrase_card` steps. `vocab()` and
   `phrase()` helpers silently EMIT phrase_card — do not call them in ja.
   Introduce vocab via `listeningCompSentence` + `speaking`, a `build`
   sentence, or a `grammarRule` compact card.
5. `particle_cloze` only within 2 modules of that particle's introduction.
6. Blocked words (emoji-blocked-words doc) never get image MCQs.

## Register

7. M3–M28 is polite form (です/ます) everywhere. Plain form exists only in
   m29+ and NEVER leaks into earlier modules' surfaces or distractors.
8. Every production prompt whose answer depends on register carries an
   explicit cue ("Say to a friend:", "Say politely:"). A learner must never
   need out-of-band lesson context to pick between polite/plain options.
9. No "(plain)"/"(te-form)"-style tags on options — if every option carries
   the same tag it discriminates nothing; if only the answer carries it,
   it's a giveaway.

## MCQs and distractors

10. All options unique, non-empty. No distractor echoes a Japanese token
    quoted in the prompt. For meaning-cued form pickers, every distractor is
    a REAL conjugated form of some taught verb (cross-verb confusion), never
    an invented non-word (のみる/のむる-class). Non-words are allowed ONLY in
    derivation drills ("convert X to て-form") where wrong-derivation is the
    tested contrast.
11. Rotate correct-answer positions; never hardcode slot A.

## grammarRule cards

12. `antiPattern.ja` is a FULL-SENTENCE minimal pair of `examples[0].ja`
    (same sentence, one wrong piece) — never a bare fragment; the derived
    spot-the-mistake step makes fragments a length giveaway.
    **SEMANTIC CONTRACT (2026-07-19, m3-neo pilot walk):** the wrong piece
    must make the sentence GENUINELY INCORRECT Japanese — a plausible
    learner error. A correct sentence with a different job (statement vs
    question) or register (だ vs です) is CONTRAST material: it belongs in
    `examples[]` with a labeled `en`, NEVER in antiPattern. The derived
    spot step and the reactive ✗ tip both label antiPattern "wrong"; a
    contrast pair there grades correct Japanese as an error (shipped
    twice in the pilot: ねこ？ and そらです。 both marked ✗). If a rule
    has no natural learner error, omit antiPattern — no spot step derives,
    which is correct.
    **Gloss style (2026-07-19):** MCQ/listening option text is the plain
    natural English translation alone ("It's a book.") — never stacked
    with a literal re-gloss ("A book — 'it's a book.'"). Equivalence
    nuance (だ isn't literally "it is") belongs in the rule card's
    cultureNote, once, not in every option.

## Sentences and coverage

13. From M12 on, production/build sentences ramp in complexity (connectives
    から/ので/けど/て-links; see guide §4g floors). Short-and-flat everywhere
    is a defect; review-tail citation retrievals are exempt.
14. Every SRS-eligible vocab atom needs ≥3 authored surface occurrences
    across its home + later modules (atom-coverage gate, m3–m29).
15. Sub-lesson density: match the m3+ bar (~18–24 steps); never pad with
    passive cards to hit it.

## Provenance discipline

16. Never invent vocab/kanji outside the module's allocation (spine doc).
    Pull review atoms via the seeded helpers, never hand-pick randomness.

## English glosses (Spencer 2026-07-17; machine-checked by Gate 8)

17. English "-ing" glosses belong to 〜ている surfaces. Plain non-past
    ACTIVITY verbs gloss habitual/intent ("You study...?", "Gonna
    drink...?", "Do you...") — a progressive gloss primes learners to
    expect ている where there is none. Exceptions that stay "-ing":
    future-anchored futurates ("Are you coming tomorrow?") and motion-verb
    futurates (いく/くる/かえる). The inverse trap: resultative-stative
    ている correctly glosses as SIMPLE present (すんでいる "I live",
    しっている "I know") — never "fix" those to progressive.
18. Prompts are framed, sentence-cased English ('Pick the word for
    "this"'), never a bare lowercase meaning.

## Review surfaces (Spencer 2026-07-17)

19. Any review surface (generated SRS reviews AND authored review tails)
    targets ≥60% sentence-context steps for non-new atoms — sentence
    listening comp, multi-tile sentence builds, sentence speaking. Word
    cards are for first exposures and the flashcard deck, not lesson
    reviews. Reuse MINED authored sentences (minedSentences.ts); never
    hand-write new review sentences. Single-tile builds are banned.

## Orthography (render rules authors must not defeat)

20. Furigana sits only above kanji glyphs (okurigana never carries ruby);
    a word shown in kanji anywhere on a screen must show kanji in ALL its
    forms on that screen (inflections included). These are render-layer
    guarantees (KanjiRuby / buildTileKanji) — never hand-annotate around
    them, and never put a kanji word's reading in prompt text (it defeats
    kanji_reading and leaks answers).
