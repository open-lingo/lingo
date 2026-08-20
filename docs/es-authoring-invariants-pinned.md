# PINNED authoring invariants (es) — paste VERBATIM into every ES dispatch

**Status:** LIVE · **Created:** 2026-08-18 · **Adapted from:**
[authoring-invariants-pinned.md](authoring-invariants-pinned.md) (ja, 50 invariants)

> Same contract as the ja pin: this is the block that must physically travel
> with every Spanish authoring dispatch, every time, no matter how long the
> session. Soft rules decay ~8× faster than hard rules after compaction
> (`ai-workflow-optimization-research-2026-07-17.md`, Finding 1), so it is
> re-injected rather than remembered.
>
> **This file is NOT a copy of the ja pin.** Spanish is a Latin-script,
> morphology-heavy, no-particle language with a different module shape, and
> roughly a third of the ja invariants are about scripts, particles, or
> register systems Spanish does not have. Porting them verbatim would have
> imported rules that cannot be obeyed and, worse, would have hidden the ones
> that genuinely do not exist yet on the ES side.
>
> §0 accounts for **all 50** ja invariants — carried, adapted, or dropped with
> a reason. That table is the correctness claim of this document. If you find a
> ja invariant not listed there, this file is incomplete: say so rather than
> guessing which bucket it belongs in.

---

## 0. Provenance — every ja invariant, accounted for

**CARRIED (identical in substance; ja wording holds):**
6 (blocked words never get image MCQs) · 10 (distractor discipline) ·
11 (rotate correct-answer position) · 14 (≥3 authored occurrences per atom) ·
16 (never invent vocab outside the module's allocation) · 18 (framed
sentence-cased prompts, no narrative colour) · 19 (≥60% sentence-context in
review surfaces) · 21 (persona canon) · 22 (dialogue questions grade stated
facts only) · 24 (sentence variety ≤3 uses; provenance is intro-capable) ·
27 (frequency-weighted reinforcement) · 28 (no full-sentence recognition MCQs
in teaching lessons) · 29 (plain prompts, no theatrics) · 30 (image-MCQ-first,
word-before-dialogue) · 32 (no derived spot-the-mistake step) · 33
(TEACH-FIRST, always) · 35 (build banks carry real distractors) · 36
(match-pairs floor is 6, word-only grids) · 43 (`translate` ≤15% of
production) · 44 (`word_image_mcq` is first-exposure ONLY) · 45 (under-used
step types carry floors) · 47 (re-read this file per LESSON) · 50 (nobody
likes a person — `contentSafety.test.ts` already runs on all courses).

**ADAPTED (same principle, different mechanism — see the numbered rules below):**
4 → E1 (step-type bans INVERT for es) · 5 → E2 (`particle_cloze` is
articles/prepositions, and the intro-only rule still binds) · 7/8/9 → E3
(register is tú/usted, and it is a PRONOUN choice, not a verb-ending ladder) ·
12 → E4 (`antiPattern` semantic contract, on Spanish surfaces) · 13 → E5
(complexity ramp) · 15/25/26 → E6 (module shape — es is 8 lessons, not 12–15) ·
17 → E7 (English gloss discipline, Spanish tense/aspect edition) ·
23 → E8 (dialogue TTS: two voices, es-MX) · 31 → E9 (teach element-drops:
Spanish drops the SUBJECT, not the copula) · 34 → E10 (build-tile
separation — clitics and articles, not particles) · 37–42 → E11 (the
authoring-mistake set, restated for hand-authored TS — July-wave modules are
still hand TS; re-authored modules (m1, m2) compile from **frameless IR** via
`scripts/compile-ir-es.mjs`, updated 2026-08-19) ·
46 → E3 · 49 → E12 (formation points = the tense paradigms).

**DROPPED — Spanish has no such surface. Do not look for an es equivalent:**
1, 2, 3 (script ladder: romaji/kanji/furigana — Spanish is Latin script and
ships no second script) · 20 (furigana orthography, same reason) ·
48 (graded register cue — folded into E3; Spanish register does not have a
morphological politeness axis that a grader can reject).

**NOT YET APPLICABLE — the machinery does not exist for es. Do not author
against these; open work, not rules:**
- ja inv 25's THREE REVIEW TIERS: es has **no routed review lessons at all**
  (`moduleProgress.ts` `REVIEW_LESSON_RE` matches `ja|ko`, not `es`), so the
  in-module review tier cannot be authored yet.
- ja inv 42's `grammarPointId` registry: there is **no `es-grammar-points.json`**
  and Track B grammar SRS is JA-only. Do not invent ids; leave the field off.
- ja inv 49's `TRANSFORM_RULESETS`: `conjugation_transform` is JA-typed
  (`verbClass: ichidan|godan|…`). ES teaches paradigms through the
  ConjugationGrid trainer instead — see E12.

---

## 1. Step-type bans and mix

**E1. The ja step-type bans INVERT for es. Do not port them.**
ja ships ZERO `info` and ZERO `phrase_card`; **es ships both, deliberately**,
and `self_explanation_mcq` — which is BANNED in ja as a metalinguistic quiz —
is a required es step type (`es-quality.test.ts` demands ≥2 per module for
m2–m16). An agent that has read the ja pin will try to strip these. It must
not.
> The one thing to carry across is the ja *audit finding* behind the ban, not
> the ban: the 2026-08-09 walk measured es passive-card density at **3.5× ja**
> (2.8 vs 0.8 passive cards per lesson) and named the phrase-card→drill intro
> pattern "the mechanical reason the course feels flat". So: passive cards are
> LEGAL and OVERUSED. Introduce vocabulary through a drill
> (`word_image_mcq` discovery) wherever the word is imageable, and reserve
> `phrase_card` for genuinely non-inferable fixed expressions. Never deal a
> passive card for a function word (`phrase("I am", "soy")` is the shipped
> anti-example).

**E2. `particle_cloze` in es means ARTICLE / PREPOSITION / CONJUNCTION, and
ja inv 5's intro-only rule still binds.** Tapping one item from a closed set is
too cheap to count as retrieval no matter what the set contains. Legal only in
(a) the lesson that introduces the item, and (b) reviews inside that same
module. Past that, the article or preposition is PRODUCED — in a `build`,
`translate`, or `speaking` step — not picked.
> Where the choice is really an AGREEMENT question (el/la/los/las against a
> noun's gender and number), use `agreement_cloze` instead: it grades the
> whole set together, which is correct, because agreement is a property of the
> sentence and partial credit would teach that "las caso blancas" is half
> right.

**E12. Tense paradigms are the es formation points, and they ship through the
ConjugationGrid, not through `conjugation_transform`.** `conjugation_transform`
is JA-typed and unavailable. The es equivalent of ja inv 49's "a formation
point ships with a rule table or it does not ship" is: **a tense may not be
drilled in a lesson before its paradigm exists in
`es/conjugationTables.ts`.** Derive every cell from that file — the course's
own table — and never hand-write a paradigm into a step. The tables already
carry present, preterite and imperfect for the ten A1 verbs, so the A2
past-tense tier has its morphology seeded and does not need new data to begin.

## 2. Register — tú / usted

**E3. Spanish register is a PRONOUN-AND-ENDING choice among words the learner
already knows, and it is taught by choosing, never by MCQ-ing an unmet word.**
This is ja inv 46 unchanged in principle and completely changed in mechanism.
- ja's politeness ladder is morphological (だ / です / ます) and gradient. Spanish
  is binary and pronominal: tú vs usted, with the verb ending following the
  pronoun.
- The course is **LatAm-neutral**: `tú` is the default, `ustedes` covers all
  second-person plural, and **`vosotros` is never drilled** — it exists in the
  conjugation DATA for completeness and is flagged Spain-only. A step that
  drills vosotros is an authoring error.
- ja inv 8 carries: any production prompt whose answer depends on register
  states the audience explicitly ("Say to your teacher:"). A learner must
  never need out-of-band context to choose.
- ja inv 9 carries: no "(formal)"/"(informal)" tags on options. A tag on every
  option discriminates nothing; a tag on one is a giveaway.
- ja inv 48 is DROPPED rather than carried: it requires a grader that rejects
  the wrong register, and es has no register grading path. If you write a
  register cue, the two forms differ in the verb ending, so ordinary exact-match
  grading already does the job — but do not claim a guard that does not exist.

## 3. Prompts, glosses, and comprehensibility

**E7. English glosses: Spanish tense maps onto English differently than
Japanese does, and the trap is the mirror image of ja inv 17.**
- Spanish simple present covers English simple present AND present
  progressive ("hablo" = "I speak" / "I am speaking"). Gloss it as **simple
  present** by default; a progressive gloss primes the learner to expect
  `estar + -ndo` where there is none. This is exactly ja inv 17's shape with
  the languages swapped.
- The A2 aspect pair is where glosses actually decide meaning: preterite
  glosses as English simple past ("I walked"), imperfect as "used to walk" /
  "was walking" / "would walk". A gloss that flattens both to "walked" erases
  the only thing the contrast teaches. See the `aspect_choice_cloze` step type.
- Do not gloss `ser` and `estar` both as "to be" and leave it there. If the
  step turns on the choice, the gloss must carry what decides it.

**E8. COMPREHENSIBILITY IS A HARD GATE, and it is the invariant es shipped
without.** Every word in a PROMPT — not just in the answer — must be one the
learner has met, or a function word on the closed allowlist.
> This exists because es shipped the defect. The 2026-07-16 rewrite's de-leak
> rule ("make the learner read Spanish to choose") pushed MCQ prompts into
> Spanish with no comprehensibility bound, and m2-2 shipped *"Diego pregunta
> '¿quién eres?' Ana se señala a sí misma. ¿Qué dice ella?"* — untaught
> vocabulary in a module-2 prompt, plus a metalinguistic *"¿Cuál es su
> infinitivo?"*. **Already knowing Spanish HIDES this defect**: a knower reads
> past it, a true beginner hits an unreadable wall.
> Machine-checked by `esPromptComprehensibility.test.ts` — but only over
> `multiple_choice` prompt prose, with a ratchet at 470 unknown-token
> occurrences (229 of them in m1–m6). **The ratchet is debt, not a pass.**
> Every authoring wave lowers it; none raises it.

## 4. Module shape and density

**E6. The es module is 8 lessons, and that is NOT ja's shape.** Do not import
ja inv 25's 12–15 lessons = 8–11 teaching + 3 review + 1 challenge. es modules
are **L1–L7 teaching + L8 mastery test**, sixteen modules, m1–m16.
- Density: **14–25 steps** for L1–L7; L8 mastery is **8–16 graded-only** steps.
  (`es-quality.test.ts`.) The ja aim of 20–22 is a reasonable target inside
  that band, but the band is the rule.
- Per lesson: no two adjacent steps of the same `type`; never 3+ consecutive
  selection-MCQ steps even when the type strings differ; ≥2 generation steps
  and ≥1 typed-or-spoken step per topic lesson.
- Per module (m2–m16): ≥2 `self_explanation_mcq`, and ≥6 of L2–L8 draw a
  prior-module atom.
- **There is no es challenge lesson and no es review lesson.** ja inv 25/26
  cannot be authored here until review routing lands. Do not invent
  `es-mN-review-*` ids — nothing routes them, and `reviewMatchPairs(...)` step
  ids that merely contain the word "review" are not review lessons.

**E5. Complexity ramps, and the es ramp is morphological.** ja ramps by adding
connectives from m12. es ramps by adding: stem changes → irregular presents →
object pronouns → the past-tense pair. Short-and-flat everywhere is a defect;
review-tail retrievals are exempt.

## 5. Build banks and tiles

**E10. Clitics and articles are their OWN build tiles.** This is ja inv 34
with the inventory swapped. Shipping `melgusta` or `lacasa` as one tile lets
the learner skip the actual skill. Separate tiles for: definite and indefinite
articles (el/la/los/las/un/una/unos/unas), object and reflexive pronouns
(me/te/le/lo/la/nos/les/se), and prepositions (a/de/en/con/por/para).
> The one genuine exception is a **contraction**, because Spanish spells it as
> one word: `al` (a+el) and `del` (de+el) are single tiles. Splitting them
> would ask the learner to build a string Spanish does not write. French will
> need a much longer version of this exception list — see the fr pin.

**E11. Hand-authored TS, not IR — so ja inv 37–42 restate rather than port.**
There is no es IR and no `compileModule` for Spanish; `moduleCompiler.ts`
imports `languages/ja/*` directly and is JA-only. Consequences:
- ja inv 38 ("beat order is not step order") does NOT apply: in es, the array
  order in `mN.ts` IS the step order. Teach-first is therefore something you
  can actually see by reading the file.
- ja inv 37 ("a new atom must debut on a `build` beat") becomes: **a new
  atom's first occurrence must be an intro-capable STEP** — `word_image_mcq`,
  `build_sentence`, `speaking`, `listening_comprehension`, or a rule card.
  Never a distractor, never a dialogue (ja inv 33 carries).
- ja inv 40 carries verbatim in substance: every `particle_cloze` option must
  be a taught atom.
- ja inv 42 is NOT YET APPLICABLE — there is no es grammar-point registry.
- New es-only trap: **atoms live WITH their module** (`ES_MN_ATOMS` in
  `curriculum/mN.ts`), and `courseAtoms.ts` dedupes first-write-wins by
  surface. A later module re-teaching an earlier surface must NOT re-register
  it — unique atom ids are enforced by the es conformance test.

## 6. Audio

**E4/E8-audio. Every authored text needs a clip, and the fallback is worse
than silence.** A manifest miss on es falls back to browser `speechSynthesis`.
Before 2026-08-09 that spoke **Castilian** into an es-MX course; the tag is now
`es-MX`, but a synthetic voice interleaved with recorded Dalia clips is still
the "degraded TTS" complaint class that headlines Duolingo's AI backlash.
- Measured 2026-08-09 and **still true**: 719 of 1,879 es course texts (38%)
  have no clip in the shipped manifest. 1,974 mp3s exist in `lingo-data` — the
  regen ran; the publish never did.
- `esAudioCoverage.test.ts` ratchets at `MAX_UNCOVERED_TEXTS = 719`. **That
  number is debt.** Every wave lowers it.
- Dialogues are currently single-voice. ja inv 23's rule carries in principle
  (real distinct voices, raw clips, no pitch processing, per-sentence
  chaining); es needs a second voice before a dialogue with two speakers is
  honest.

## 7. What is machine-enforced for es today

Trust this list, not your memory of ja's guards:

| Enforced | File |
|---|---|
| Density, adjacent-type, selection runs, generation floors, selfExplain ≥2, prior-atom draws | `curriculum/es-quality.test.ts` |
| Audio coverage (render-side walk, ratcheted at 719) | `__tests__/esAudioCoverage.test.ts` |
| Prompt comprehensibility (MCQ prose only, ratcheted at 470) | `__tests__/esPromptComprehensibility.test.ts` |
| Atom namespacing, ids, `fromModule`, gender validity, ADR-011 slot omission | `__tests__/moduleConformance.test.ts` |
| Per-module: lesson tags, id uniqueness, passive-card spacing, answer-leak lint, atom-surface presence | `curriculum/m1..m16.test.ts` |
| Content safety (nobody likes a person) | `src/__tests__/contentSafety.test.ts` (all courses) |

**NOT enforced for es — these ja gates were never ported, and each maps to a
live defect class:** gloss-before-production, recognition-exposure ratchet,
MCQ-position distribution, tile-floor and distractor audits, the JA
comprehensibility gate proper (atom decomposition over authored review-pool
steps — a strictly stronger instrument than the es prompt check), and the whole
`moduleBarGuards` family. **No es learner-sim walk has ever run.** The ja walks
found 185 findings, 53 of them blockers, on content that had already passed its
own tests. Assume es has the same latent count.
