# PINNED authoring invariants (ja) — paste VERBATIM into every dispatch

**Status:** LIVE · **Last-verified:** 2026-07-26

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
5. **`particle_cloze` is an INTRODUCTION device, never a review device
   (Spencer 2026-07-26 — TIGHTENS the old "within 2 modules" rule).**
   Tapping one particle from a closed set is too cheap to count as
   retrieval. Allowed ONLY in (a) the lesson that introduces the particle,
   and (b) review lessons *within that same module* — the first in-lesson
   reviews of it. NEVER in a later module, and NEVER as a generated
   grammar-SRS review rendering. Past that point the particle is exercised
   by ACTIVE RECALL — `build`/`translate`/`speaking` where the learner
   produces the particle in a sentence, not picks it. Usage should thin out
   as a module progresses, not persist. (A visual-design pass may make the
   step feel less cheap; that changes how it LOOKS, not where it is legal.)
   Machine guard `particleClozePlacement.test.ts` currently encodes the
   looser ±2-module window — tighten it to same-module when this lands.
6. Blocked words (emoji-blocked-words doc) never get image MCQs.

## Register

7. **DICT-FORM-FIRST (Spencer 2026-07-20 — SUPERSEDES the retired "M3–M28
   polite / plain only in m29+" law).** Plain/dictionary form is the taught
   PRODUCTION base from m3-neo onward: だ is the copula and a bare dict-form
   verb is a complete casual sentence (たべる = "I'll eat", never たべるだ).
   Every production surface, build tile, and distractor in a REWRITTEN module
   is plain form. です/ます appear ONLY as flagged RECOGNITION previews
   spoken by a teacher character (e.g. Tanaka) — never a production target —
   until ます is formally introduced as a derived politeness layer at the
   spine-defined module. That boundary is NOT yet set (authoring paused at
   m5) — do NOT invent one; check the spine before authoring register.
   Polite form must never be silently required by a production prompt in a
   rewritten module. (Old-course modules not yet rewritten still ship
   polite-first and are being replaced module-by-module — confirm a module's
   rewrite status before authoring against it.)
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

## Persona canon and dialogue referents (2026-07-19, m3-neo walk)

21. Named characters carry ONE set of facts across the whole module (and
    ideally the course): m3-neo canon is Tom = student, American, Mika's
    friend; Mika = student, Japanese; Tanaka = the teacher; Ken = student,
    friend. Slot-filler practice sentences are NOT exempt — a build that
    says トムは せんせいだ while a graded dialogue says he's a student is
    a shipped contradiction (Tom flipped roles 5× inside one pilot
    lesson). Questions (…？) don't assert and are exempt; assertions in
    DISTRACTOR slots are not (they render on screen as plausible facts).
    Machine-checked by the persona-canon test in m3-neo.test.ts — extend
    its CANON map when a character gains a fact.
22. Dialogue comprehension questions grade on STATED facts only. Every
    person named in options must have an unambiguous referent in the
    lines; a distractor must be wrong by what was said, never by an
    unstated assumption. The pilot's closer had ミカ describe an unnamed
    ともだち while the same lesson taught トムは ともだちだ — "Tom" and
    "Mika's friend" collapsed into one person and the graded answer
    punished a defensible reading. Prefer speakers stating facts about
    THEMSELVES (or explicitly named third parties) over unnamed roles.

## Dialogue TTS (2026-07-19)

23. Dialogue speakers use REAL distinct voices, zero pitch processing:
    male-named speakers (トム/ケン/たなか — MALE_SPEAKERS in
    DialogueListenStepView) play ja-JP-KeitaNeural clips under
    `ja-keita:` manifest keys; everyone else plays the Nanami corpus.
    Clips are raw — no detune, no playbackRate, and NEVER post-process
    clip internals (the silence-splice experiment cut がくせい in half).
    Lines chain per-sentence with a 350ms gap; whole-line clip is the
    fallback. New male dialogue lines: run emit-tts-deck.mjs then
    lingo-core scripts/tts/gen_keita_dialogue.py. A new male-named
    speaker must be added to MALE_SPEAKERS + the emitter's set.

## Sentences and coverage

13. From M12 on, production/build sentences ramp in complexity (connectives
    から/ので/けど/て-links; see guide §4g floors). Short-and-flat everywhere
    is a defect; review-tail citation retrievals are exempt.
14. Every SRS-eligible vocab atom needs ≥3 authored surface occurrences
    across its home + later modules (atom-coverage gate, m3–m29).
15. Sub-lesson density: match the m3+ bar (~18–24 steps); never pad with
    passive cards to hit it.
25. **Module size + shape (Spencer 2026-07-26 — SUPERSEDES the 2026-07-20
    "11 teaching + 1 review = 12" rule).** **12–15 lessons per module**
    (hard floor 12, hard ceiling 15) = **8–11 teaching + 3 review + 1
    challenge**. The three review lessons sit at the module's beginning,
    middle, and end thirds; **the CHALLENGE lesson is ALWAYS the final
    lesson of the module.**

        12:  T T T [R1] T T T [R2] T T [R3] [CHALLENGE]
        15:  T T T T [R1] T T T T [R2] T T T [R3] [CHALLENGE]

    - **Review lessons drill THIS MODULE ONLY** — the concepts and atoms
      taught since the previous review. Cross-module and long-interval
      reinforcement belongs to the SYSTEMS, not the author; do not
      hand-build cumulative reviews spanning earlier modules. R3 may range
      across the whole module.
    - **Three review tiers exist — know which one you're authoring for:**
      (1) these in-module review lessons — authored, module-scoped, and the
      ONLY surface where Track B grammar SRS grading is currently enabled;
      (2) `moduleReviewSchedule.ts` — a module-level SRS (M3 restructure,
      2026-05-16) that brings the learner BACK to a completed module on an
      expanding schedule (stages 0–5 at +1d/+3d/+7d/+14d/+30d/+90d,
      graduating at stage 5, soft gate surfacing a chip on Learn home and
      Practice); (3) FSRS Track A (vocab atoms) + Track B (grammar points),
      item-level. Tier 2 is what "the learner revisits m4 three weeks later"
      actually means — it is NOT something an author builds, and it is not
      replaced by the three review lessons.
    - **The CHALLENGE lesson closes the module** (m6's
      `ja-m6-neo-challenge` is the exemplar): no new atoms, all-combination
      surfaces, ≥3 grammar points per beat in shapes not seen in the
      module's teaching lessons. It does not count toward the 3 reviews.
    - **There is NO "capstone lesson."** The challenge lesson IS the
      module's capstone; "capstone" is retired as a lesson name (see
      inv 26 for the step-level rename).
    - Rationale: grammar needs ~8–10 spaced retrievals to reach productive
      mastery, and dedicated review lessons are the only surface where
      Track B (grammar) SRS grading is enabled. One review lesson per 11
      teaching lessons was too thin to feed it.
    - m3's 7 is grandfathered. m4/m5 (12 lessons) and m6 (13) predate this
      SHAPE — they are slated for re-authoring, not retrofit.

    Enforced via moduleBarGuards `minLessons`. Every new module's test file
    MUST call `registerModuleBarGuards(...)`
    (src/features/languages/ja/__tests__/moduleBarGuards.ts) — it carries
    the whole mechanical bar (density, variety, sentence-repeat, reply-MCQ
    ban, vocab provenance, persona canon).
26. **Challenge step (Spencer 2026-07-26 — TIGHTENS the 2026-07-20 rule).**
    From m5 on, every TEACHING lesson places ONE harder integration step
    (id suffix `-capstone` today — see the rename note; build/translate/
    listening_build) immediately BEFORE its review tail. It is the
    lesson-level analogue of the module's CHALLENGE LESSON and is held to
    the same bar (Spencer 2026-07-24, m6 challenge beats): it combines
    **≥3 grammar points in a combination the learner has NOT seen in this
    module.** Every constituent piece is taught; the SHAPE is new. Longer-
    but-familiar is not a challenge step — if the same arrangement
    already appeared in an earlier lesson, enrich it or pick a different
    pairing. It is the lesson's single stretch beat; close-on-confidence
    still holds because the recognition-easy tail follows it. Guard:
    moduleBarGuards `requireCapstone`.

    **Terminology (2026-07-26):** "challenge" names the whole family —
    a CHALLENGE STEP closes each teaching lesson; the CHALLENGE LESSON
    (inv 25) is the module-level version of the same idea and closes the
    module. **"Capstone" is RETIRED as a lesson/step name entirely** — it
    survives only as the course-level "N5 Mastery Capstone" MODULE title in
    the spine. The `-capstone` id suffix, the IR `kind: capstone` beat, and
    `requireCapstone` are the OLD names and are still what the code uses;
    rename them to `challenge` in one commit that moves code + docs together
    (the IR beat kind is load-bearing — `moduleCompiler` detects a review
    lesson by the ABSENCE of a capstone beat).
27. **Frequency-weighted reinforcement (Spencer 2026-07-20):** exposure
    share tracks CEJC rank and difficulty, not author habit. Run
    `node scripts/exposure-audit.mjs` every authoring cycle: CEJC top-150
    words under 4 occurrences get worked into the NEXT module's tails and
    carriers; >25 occurrences outside a word's home module flags carrier
    rotation. Home-module density is exempt (teaching a word is dense by
    design).
24. **Sentence variety + name continuity (Spencer 2026-07-20):** a lesson
    uses any single primary sentence surface at most 3 TIMES
    (machine-checked, m3-neo.variety.test.ts) — L2 ran student/teacher
    carriers ~10× before its first new noun. Prefer recycling
    earlier-module nouns as carriers (かわは みずだ, すしは ごはんだ)
    over re-running the lesson's headline pair. Dialogue speaker labels
    are ROMANIZED (Tom/Mika/Ken/Tanaka) — katakana chips are unreadable
    before the katakana ladder; in-sentence katakana names rely on the
    romaji annotation line. Vocab provenance is machine-checked
    (m3-neo.vocab-provenance.test.ts): every non-M1/M2 word's FIRST
    occurrence must be an intro-capable step, never a distractor. For
    particle-substitution concepts (も-class), the compact rule card
    comes BEFORE first exposure — the meaning is not inferable from one
    hearing. Production-framed prompts ("pick your reply", "Say: …")
    with full-sentence answers are GENERATION steps (build/translate/
    speaking), never sentence MCQs — the options print the answer.
    Single-chunk choices and form discrimination (Telling or asking?)
    stay MCQ-legal. Machine-checked in m3-neo.variety.test.ts.

## Step-type discipline (m3-neo/m4-neo/m5 walk rulings, 2026-07-19/20 — machine-checked in moduleBarGuards)

28. **No full-sentence recognition MCQs in teaching lessons.** Picking a
    built multi-word Japanese sentence from options is TEST-OUT ONLY. Convert
    to build/translate/speaking. Single-chunk MCQs (register/tone/"Telling or
    asking?"/act-out) and vocab/English-option MCQs stay legal.
29. **Production + listening-comp prompts are PLAIN — no theatrics.** No
    scenario prose, no fake "they ask in English" wrappers, no internal
    sentence period. "Build: <English>" / "What does this mean?"; a register
    cue ("Say to a friend:") only when it changes the answer.
30. **Image-MCQ-first + word-before-dialogue.** An imageable module-new atom
    makes its FIRST appearance on a `word_image_mcq`; no teaching lesson OPENS
    on a dialogue — dialogues are CLOSERS, after word + concept + builds are
    established. (requireImageFirst.)
31. **Teach element-drops explicitly (verbs take no だ).** A bare dict-form
    verb is ALREADY a whole sentence (たべる, never たべるだ); だ finishes
    NOUNS (ねこだ). The rule card states it; `antiPattern` is the genuine
    learner error (たべるだ。) against `examples[0]` (たべる。).
32. **The derived spot-the-mistake step is RETIRED.** No `-spot` step id, no
    "one of these is wrong" prompt. `antiPattern` feeds ONLY the reactive
    ✗/✓ tip. (Machine-checked.)
33. **TEACH-FIRST, ALWAYS (Spencer 2026-07-20).** Every content word in a
    dialogue must first appear via a REAL intro step (`word_image_mcq` /
    `speaking` / `build_sentence` / `grammar_rule` / `listening_comprehension`)
    in this or an earlier NEO module — a dialogue is NEVER a valid first
    exposure. NO "situated chunk" / "flagged-recognition preview" exception;
    greetings included (teach them or cut them — that's how いくら/えん/
    いらっしゃいませ leaked into m5). A word counts as "known" ONLY if a prior
    neo module introduced it via an intro step; old-course `fromModule` tags
    are NOT proof. (Machine-checked: `requireTeachFirst` drops dialogue_listen
    from intro-capable; the neo taught-set comes from `priorLessons`, not tags.)

## Build banks and tiles (shipped guards that were never written down — pinned 2026-07-26)

34. **Particles are their OWN build tiles** (`particleTileSeparation.test.ts`,
    Spencer QA 2026-07-12). In any build-type step, a tile that decomposes
    into `<known word> + <case/topic particle>` is an authoring error —
    shipping `わたしは` as one tile lets the learner skip the actual skill
    of choosing は vs が vs を. Particles: から/まで/は/が/を/に/で/と/の/へ/
    も/や. Only genuinely lexicalized surfaces (allowlisted in the test) may
    contain a particle-looking substring. This is the same principle as
    inv 5 — particles are PRODUCED, not picked.
35. **Build/listening_build tile banks carry real distractors**
    (`buildTileFloor.test.ts` + `buildTileDistractorAudit.test.ts`, Spencer
    QA 2026-07-16: "we give them the answer a little too easy"). `tiles` is
    a flat pool = answer tiles + distractor tiles, and `distractorCount =
    tiles.length − correctOrder.length` must clear the floor
    (`minDistractorsFor`). A central backfill pass in `getMockLessonContent`
    repairs thin banks, which is exactly why authors stop noticing the bar —
    author the distractors anyway. Fill is SIBLING-FIRST from
    `jaSiblingSets.ts` (semantic sets + `JA_PARTICLE_CONTRASTS`); は↔が is
    deliberately never offered (swapping them usually yields correct
    Japanese, so it would mark a right answer wrong), while に↔で and
    を-on-existence ARE real contrasts.
36. **`reviewMatchPairs` floor is 6 pairs**, not 4 (`MATCH_PAIRS_FLOOR = 6`
    in `matchPairsFloor.ts`; enforced by `matchPairsPairCount.test.ts`) — a
    learner must not be able to brute-force the last pair by elimination.
    The authoring guide said "never < 4" until 2026-07-26; the code is the
    truth. Grids are also WORD-ONLY (no whitespace in `source` —
    `matchPairsWordOnly.test.ts`), so no sentence-level item can close a
    lesson via the match grid.

## IR authoring — mistakes the m7 cycle made silently (pinned 2026-07-26)

Every rule below cost a red test during m7. They are cheap to obey and
invisible until something fails, which is exactly why they are pinned.

37. **A new atom must DEBUT on a `build` beat.** `mode: build` compiles to
    `build_sentence` (intro-capable); `mode: translate` and `mode: listening`
    compile to `translate` / `listening_build`, which are NOT. Any kana listed
    in a lesson's `introduces` must appear first in a `build` beat (or a
    `rule` card). Getting this wrong fails vocab-provenance with a message
    that names the STEP type, not the beat — so read it as "my beat mode was
    wrong."
38. **Beat order is NOT step order.** The compiler interleaves the middle of
    a lesson, so a `dialogue` beat written after a `build` beat can render
    BEFORE it. Never rely on beat sequence for teach-first. Corollary: a
    word's first exposure must never be inside a dialogue (inv 33) — that
    is unfixable by moving the dialogue later in the IR.
39. **`en` on a sentence beat becomes the PROMPT.** It must carry no internal
    sentence period — `"I eat. (polite)"` renders as `Build: I eat. (polite)`
    and trips inv 29's theatrics check. Register cues are a PREFIX, matching
    inv 8: `"Say politely: I eat"` / `"Say to a friend: I'll eat"`.
40. **Every `particle-cloze` option must be a taught atom.** A distractor
    that isn't in the taught set (or this module's `newAtoms`) is an
    untracked word, not a distractor — it fails vocab provenance.
41. **Bound suffixes are dangerous as free atoms.** Making くん/さま/ちゃん
    standalone atoms let the tokenizer decompose an unrelated NON-WORD
    distractor elsewhere in the course (`くんで` in a て-form derivation
    drill). When an atom is a bound morpheme, check what else in the corpus
    contains that string before shipping it.
42. **Author `grammarPointId` against the REGISTRY** (`n5-grammar-points.json`
    ids: `masu-present`, `desu-copula`, `ka-question`, …), not invented
    IR-local names. m7 did this and its compiled rule cards immediately
    became resolvable by the grammar-review deck; m6 invented its own
    vocabulary and 20 of its 21 ids match nothing. Unknown ids are now
    caught by the `unknown-grammar-point` diagnostic — declare genuinely
    prior-module points in `priorGrammarPoints:` instead.

## Step mix and ratios (Spencer 2026-07-26 — the "translate is bad" ruling)

43. **`translate` is ≤15% of PRODUCTION, module-wide.** Production =
    `build_sentence` + `translate` + `speaking` + `listening_build`. Before
    this ruling the course ran ~30% (m6–m10 were 32–37%) because filler
    alternated speaking/translate. Typed translation is a LATE surface: it
    belongs in FSRS review after an atom has graduated, not in the lesson
    that teaches it. Do NOT lean on it for early authoring — an author who
    can't think of a step reaches for `mode: translate`, and that reflex is
    the whole reason for the cap. Enforced by the compiler's filler budget
    plus the `translate-heavy` diagnostic; authored `mode: translate` beats
    count toward the same ceiling.
44. **`word_image_mcq` is FIRST-EXPOSURE ONLY.** It is the debut surface for
    an imageable new word and may never be used again for that word — not as
    review, not as filler, not in a later module. (Inv 30 says it must be
    first; this says it must be ONLY.) There is no minimum-usage floor for
    it, because its count is fixed by how many imageable words the module
    introduces.
45. **Under-used step types carry usage FLOORS, not just permission.** The
    compiler's filler rotation exists so lessons stop being
    build/translate monocultures. Types that must actually appear across a
    module: `listening_comprehension`, `multiple_choice` (word- and
    English-option, per inv 28), `speaking`, `conjugation_transform` (where
    a rule has a conjugation), `particle_cloze` (introduction lessons only,
    per inv 5), `match_pairs` (lesson closer). A module that ships without a
    type it had material for is an authoring miss, not a style choice.
46. **Register is taught by CHOOSING AMONG KNOWN WORDS — never by MCQ-ing a
    word the learner has not met** (Spencer 2026-07-26). The pattern
    `"You are talking to <person>, how do you say this?"` is BANNED as a
    teaching device: m10 used it to quiz brand-new register words, so the
    learner's first-ever exposure was as a wrong answer.
    **The mechanics live in [register-teaching.md](register-teaching.md) and
    apply to REGISTER LESSONS ONLY — if you are not authoring one, this
    invariant is the whole of your obligation and you can skip that file
    entirely.** Register scaffolding (audience pictures, politeness meters,
    cheat sheets, vocative frames) reaches a step through exactly one IR beat
    (`kind: register`), so it cannot leak into an ordinary teaching lesson;
    `registerScaffoldIsolation.test.ts` keeps it that way. It is also
    deliberately temporary — the scaffolds fade as the words are learned, and
    a word past the ladder is ordinary vocabulary in ordinary beats.

## Standing rule — re-read this file per lesson (Spencer 2026-07-26)

47. **Re-check the guide EVERY time you author, at LESSON granularity — not
    once per module, not once per session.** Compliance decays across a long
    dispatch (research doc Finding 1: soft rules decay ~8× faster than hard
    rules after compaction), and the m7–m10 cycle proved it: 38 bare-word
    debuts and 58 translate-heavy lessons shipped from agents that had read
    these rules at the top of the same dispatch. Before emitting each
    lesson's beats, re-read at minimum: inv 5 (particle_cloze),
    inv 28–33 (step-type discipline), inv 37–42 (IR mistakes), inv 43–46
    (step mix). A bulk conformance audit runs separately over compiled
    output — but the audit is a backstop for the cases this re-read misses,
    not a substitute for it.

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
    **No narrative color (2026-07-19, m3-neo walk):** prompts carry ONLY
    context that changes the answer, stated minimally. Meaning checks
    default to "What does this mean?"; tone drills to "Telling or
    asking?". Keep one-clause situation cues where the situation IS the
    content (chunk-function steps, register cues like "Say to a friend" /
    "Which thanks fits a stranger?"). Scenario prose ("You crest a hill
    and your friend shouts…") is reserved for story lessons and for
    register authoring where the scenario carries the contrast.
    **Tail + variety (2026-07-19, m3-neo audit):** every lesson ENDS with
    the house review tail (reviewMatchPairs over the lesson's seeded pool
    + vocabMcq + a listening_build where clips exist) — building a pool
    and not spending it is a defect. Step-type variety floor: no lesson
    leans on ≤3 graded types; break walls of one type (9 LCs in a row
    shipped in the pilot) with match grids, word MCQs, and builds.

## Review surfaces (Spencer 2026-07-17)

19. Any review surface (generated SRS reviews AND authored review tails)
    targets ≥60% sentence-context steps for non-new atoms — sentence
    listening comp, multi-tile sentence builds, sentence speaking. Reuse
    MINED authored sentences (minedSentences.ts); never hand-write new
    review sentences. Single-tile builds are banned.

    **"Word card" means PASSIVE RECOGNITION (Spencer 2026-07-26 — this
    sentence was being misread).** A word card is an image-MCQ debut or a
    click-through vocab card: the learner is shown a word, not asked to
    retrieve it. Those belong to first exposures and the flashcard deck,
    not lesson reviews. They are NOT the same as word-level RETRIEVAL
    (`vocabMcq`, word MCQ, `reviewMatchPairs`, `listening_build`), which is
    legal — but see the ladder below for WHERE it stays legal.

    **Word-level retrieval fades out of reviews (Spencer 2026-07-26).**
    The target shape, once the learner is far enough along:
    `reviewMatchPairs` is the ONLY word-level step in a review surface, and
    everything else is sentence-context in any of its forms (sentence
    listening comp, multi-tile sentence build, sentence speaking, translate,
    sentence-level `listening_build`). Concretely:
    - **m3–m4:** word-level retrieval (`vocabMcq`, word MCQ, word-level
      `listening_build`) is FINE — these modules are still doing kana
      acquisition, which is why `listeningGranularity.test.ts` exempts
      M1–M4 from the sentence-first ratchet.
    - **m5 on:** `reviewMatchPairs` (the mandatory recognition-easy CLOSER)
      is the only word-level step. `vocabMcq` and word MCQ move to first
      exposures and the flashcard deck; `listening_build` in a review tail
      is SENTENCE-level (`listeningBuildSentence`), not a word's mora.
    This is what makes the ≥60% floor achievable: with match-pairs as the
    sole word-level step, a 4-step tail lands at 75% sentence-context
    without any exemption arithmetic. Word-level retrieval still counts as
    NON-sentence against the floor wherever it remains legal.

## Orthography (render rules authors must not defeat)

20. Furigana sits only above kanji glyphs (okurigana never carries ruby);
    a word shown in kanji anywhere on a screen must show kanji in ALL its
    forms on that screen (inflections included). These are render-layer
    guarantees (KanjiRuby / buildTileKanji) — never hand-annotate around
    them, and never put a kanji word's reading in prompt text (it defeats
    kanji_reading and leaks answers).
