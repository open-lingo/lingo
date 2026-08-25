# Spanish lesson authoring guide

**Status:** LIVE · **Created:** 2026-08-18 · **Adapted from:**
[lesson-authoring-guide.md](lesson-authoring-guide.md) (ja, 68 KB)

> **Read [es-authoring-invariants-pinned.md](es-authoring-invariants-pinned.md)
> first.** That file is the LAW — the block that travels verbatim with every
> dispatch. This file is the METHOD: how the Spanish pipeline is actually
> operated, what each gate is really checking, and which specific mistakes
> produced which rule.
>
> **This is not a translation of the ja guide.** The ja guide is 68 KB, and
> roughly half of it is about kana, kanji, furigana, particles, and register
> audiences — machinery Spanish does not have. More importantly, the two
> languages now have *different pipelines*: ja compiles YAML → JSON →
> `compileModule()` at **runtime**; es compiles YAML → **TypeScript source** at
> build time. §2 explains why, and that difference propagates through
> everything below. §0 accounts for every ja section so the omissions are
> auditable rather than accidental.

---

## 0. Provenance — every ja guide section, accounted for

**CARRIED (same substance, ES examples):** §1 contract · §2 density bar ·
§4 step-type cheat sheet · §5 the five things authors get wrong · §6
compounding review · §8 speech gotchas · §9 win cards · §10 constraints ·
§13.1 card-type→lexical-category rubric · §13.5 close on confidence · §13.6
grading = review-only · §13.7 distractor plausibility · §13.8 atom registry
discipline · §13.9 SRS pool filter · §13.12 cloze rotation.

§4g (sentence-complexity floor) is carried and **upgraded**. ja states the rule
and then says of it: *"This is guidance, not yet a machine gate. No test asserts
sentence complexity today."* Spanish can assert it, because ES sentences are not
hand-written — whether a sentence carries an adverbial is a property of the
frame's `slots`, not of an author's discipline. `esSentenceComplexity.test.ts`
requires every production target (`targetSentence` / `targetPhrase` /
`transcript`) in every IR-compiled module to carry one of its own frame's time
markers. Measured at the time of writing: **145/145 across m17–m19.** The test
exists to stop a future frame making `time` optional — a change that would be
invisible in review, because every sentence it produced would still be correct
Spanish.

**ADAPTED (the rule survives, the mechanism differs):**

| ja section | what changes for es |
|---|---|
| §3 sub-lesson template (M3–M7+) | ES uses one 20-step **topic template** for every teaching lesson, in code (`scripts/draft/es-ir/templates.mjs`), not prose. See §5. |
| §4b listening is sentence-first from M5 | Same ratchet, enforced per module by `mN.test.ts` rather than by the guide. |
| §7 audio conventions | Same chain, different manifest (`src/shared/tts/manifests/es.json`) and a **much worse coverage position** — see §9. |
| §11 fastest way to author | Completely different: ES authors a YAML IR and runs two commands. See §8. |
| §13.13 canonical M8+ template | Superseded by the topic template, which is executable. |
| §14 story comprehension lessons | Not built for ES. Named here so its absence is a known gap, not an oversight. |
| §12 living history | ES keeps its history in `docs/multilang-authoring-wave-2026-08-18.md` (dated addenda, one per authoring wave) rather than inside the guide. ES §12 below is "Known gaps" — the numbering collision is a coincidence, not a mapping. |
| §13 authoring-patterns retrospective (the parent) | Its *findings* are inherited item by item as §13.1–§13.13 above. The retrospective itself narrates the 2026-05-21 ja M3 rewrite and is ja history; it does not transfer. |

**DROPPED (no Spanish counterpart, with the reason):**

| ja section | why it does not apply |
|---|---|
| §4a2 word-level recall is MCQ not typed | Carried into the pin as an invariant; not repeated here. |
| §4c particle clozes | Spanish has no particles. The nearest analogue is the preposition/article cloze, which is an ordinary `cloze`. |
| §4d ja ships ZERO `info` steps | **Deliberately reversed.** ES ships an `info` card at position 1 of every teaching lesson. ja purged them because kana/kanji teaching had nothing to say that a step could not show; Spanish grammar rules (the preterite accent, the j-stem, the -car/-gar/-zar respelling) are *statements about a system*, and a learner who is never told the rule has to induce it from eight examples. The purge was right for ja and would be wrong here. |
| §4e/§4e-addendum/§4f script ladder, furigana, `kanji_reading` | Spanish is Latin-script throughout. |
| §13.2 image-MCQ-as-introduction | ~~ES uses `vocab()` phrase cards; the emoji art pipeline is JA-only.~~ **No longer dropped — CARRIED as of 2026-08-20.** The premise was false: the emoji art path (`notoEmojiUrl`/`lingoArtUrl` + device fallback) is shared, and shipped ES content already debuts words on `word_image_mcq` (m1/m4/m5). §13 below makes image-first debut the ES law too. |
| §13.3 just-in-time particle teach | No particles. |
| §13.4 forced sentence_build replacing copula-cloze | ja-specific (です). |
| §13.10 particle-tile separation in build banks | No particles. |
| §13.11 single-kana atoms → alphabet trainer | No kana. |

**REVERSED (ja bans it; ES does it on purpose):**

| ja section | why ES goes the other way |
|---|---|
| §4b2 `phrase_card` is shelved | **REVERSAL WITHDRAWN 2026-08-20 — ES now follows ja and shelves passive vocab cards too.** The original entry defended `vocab()` on two grounds and both failed: (1) "the emoji art pipeline is JA-only" was simply wrong — the art path is shared and shipped ES content already debuts on image MCQs; (2) "banning `vocab()` would replace it with nothing" stopped being true when `pretest_mcq` landed (guess-before-taught, the interactive debut for NON-imageable words). Spencer, seeing m1 L1: passive show-and-listen cards "feel hollow" and phrasebook-style intro "is bad teaching." The 69 legacy `vocab()` call sites in m17–m19 are grandfathered until those modules re-author; **no NEW module ships one** — see §13. |

If you find a ja section not in one of these three tables, this file is
incomplete. Say so rather than guessing.

---

## 1. The one-paragraph contract

A Spanish lesson teaches **one contrast** and proves it. It opens by stating
the rule in a card, introduces at most three anchor forms, exercises each one
in both directions (recognition and production), returns to the first anchor
after a gap, makes the learner *explain* the contrast once, draws six pairs
from earlier modules, and closes on a sentence they can now produce. Twenty
steps. Ten minutes. If you cannot name the contrast in one sentence, the
lesson is two lessons.

---

## 2. The pipeline — and why it is not ja's

```
ir/mN.ir.yaml                   ← the ONLY file an author edits
      │
      │  node scripts/compile-ir-es.mjs mN
      ▼
curriculum/mN.ts                ← GENERATED. Never hand-edited. Committed.
      │
      ▼
the app imports it exactly like a hand-authored module
```

ja goes YAML → committed JSON → `compileModule(json)` **at runtime**. ES goes
YAML → **TypeScript source** at build time. This was a deliberate choice, not
an accident of order:

- `ja/moduleCompiler.ts` is 94 KB and imports six Japanese-specific modules
  (kana tokenization, kanji surface substitution, verb-class morphology,
  register audiences). Porting it means rewriting all of it, and the parts that
  would survive are precisely the parts ES already ships as `grammarHelpers`
  factories.
- Generating TS means the output passes the existing ES gates **by
  construction** — it calls the same `build()`, `cloze()`, `translateStep()`
  factories a hand-authored module calls — rather than by a second
  implementation happening to agree.
- The generated file is **readable**, and reading it is a real quality gate:
  «hablé el inglés», «I paid for for the coffee», «You all was at the beach»
  and «Yo pude ayer» were all caught by a human reading the emitted module,
  and none of them would have been caught by any structural check.

The costs, stated plainly: there is no runtime diagnostics pass, and a
committed generated file can go stale. The staleness guard is `mN.test.ts`,
which imports the generated module and re-derives its claims from the shipped
conjugation tables.

### Files

| file | role |
|---|---|
| `src/features/languages/es/curriculum/ir/mN.ir.yaml` | **the authored source.** Judgment only. |
| `scripts/compile-ir-es.mjs` | validates the IR, resolves the frame, emits the module |
| `scripts/draft/es-ir/templates.mjs` | the lesson SHAPES (topic / free) |
| `scripts/draft/es-ir/assemble.mjs` | the step emitters, frame-parameterized |
| `scripts/draft/frames-es-*.mjs` | **the inventory.** One frame per module family. |
| `scripts/draft/morph-es.mjs` | every Spanish form. Throws rather than guesses. |
| `scripts/draft/drafts/es-mN.json` | the drafted sentence pool (local model output) |

---

## 3. Spend judgment on the INVENTORY, never on the OUTPUT

This is the single most important idea on the Spanish side, and it is what
makes a local 4-billion-parameter model sufficient to author a module.

**The frame owns both languages.** It owns the Spanish surface, the English
gloss, the complement tables, the time markers, and every rule about which
combine. The local model's *only* job is choosing which taught words go
together. It never writes Spanish, and it never writes English.

The consequence: a wrong sentence is not something you detect, it is something
the inventory makes **unreachable**. Every defect below was fixed in the frame,
never in a filter:

| the defect | what it looked like | the inventory fix |
|---|---|---|
| «hablé el inglés» | "I spoke the English" | language names take no article — removed from the complement pool |
| «Yo pagué el café ayer» → "I paid **for for** the coffee" | doubled preposition | pagar's gloss became `"paid"`; its complements already carry "for" |
| «Ustedes estuvieron en la playa» → "You all **was** at the beach" | English agreement | `enByPerson` table — English "be" is the one verb that still inflects |
| «Yo tuve un perro ayer» | "I had a dog yesterday" — grammatical, meaningless | `DURATIVE_ONLY` / `DURATIVE_TIME`: a state verb rejects a punctual marker |
| «Yo pude ayer» → "I was able to yesterday" | a modal with no infinitive | **poder removed from the frame entirely** — it is taught as a form, never in a sentence |
| «llegé» | a fabricated strong preterite | `STRONG_PRETERITE_LEMMAS` in `morph-es.mjs` throws rather than falling through to the regular endings |

Note the shape of the last one. `morph-es.mjs` is documented as "throws rather
than guessing", and it was *still* fabricating `decí`, `vení`, `dé`, `poní`,
`sabí` and `traí`, because a verb absent from the irregular table fell through
to the regular endings silently. The guard is a hard-coded list of lemmas known
to have strong preterites; a lemma on that list with no table is an error, not
a guess.

**Rule:** if you catch yourself writing a check that *detects* a bad sentence,
stop and ask what inventory change makes it unbuildable instead.

---

## 4. The frame

A frame exports `slots`, `rules`, `build()`, `check()`, `vocabSurfaces()`, and
re-exports `assertFrameVocabIsTaught` / `loadNouns`.

**Complements are TABLED PHRASES, in both languages.** m17's verbs were plain
transitives, so a complement could be a bare noun with the article bolted on.
m18's are not: `ir`/`venir` take a destination behind a preposition that
*contracts* with the article («al parque», never *«a el parque»`), `estar`
takes `en`, `decir` takes a fixed formula. Deriving that from a bare noun means
re-implementing Spanish syntax inside a drafting script — which is exactly what
produced «hablé el inglés». So:

```js
ir: [
  { es: "al parque", en: "to the park", noun: "parque" },
  ...
]
```

`noun` exists so `vocabSurfaces()` can report the bare noun for the teach-first
assertion — «al parque» is not an atom, `parque` is.

**Pools are deliberately SHORT.** Three to six complements per verb. The cost
of a missing combination is a duller sentence; the cost of a wide pool is a
wrong one.

**Teach-first is asserted before any emission.** `assertFrameVocabIsTaught`
checks every noun in every phrase against the atoms taught by `throughModule`.
It caught `clase` as untaught through m17 on the m18 frame's first run, which
is the assertion doing exactly its job.

---

## 5. The 20-step topic template

Every position is load-bearing. The order is what satisfies the ES quality
gates, and those gates constrain the **sequence**, not a beat list — which is
why ES cannot copy ja's beat-list IR.

| # | step | why it is here |
|---|---|---|
| 1 | `info` | the rule, stated. (ja purged these; see §0.) |
| 2 | `phrase` A1 | passive card … |
| 3 | `formMcq` A1 | … followed up at i+1 |
| 4 | `build` A1 | … **and** at i+2 — both clauses of the follow-up lint |
| 5 | `phrase` A2 | second passive card |
| 6 | `cloze` A2 | follow-up |
| 7 | `translate` A2 | generation step #1 (gate wants ≥2) |
| 8 | `speaking` | the typed/spoken requirement, met early |
| 9 | `textMcq` | breaks what would be a 3-selection run |
| 10 | `listenComp` | recognition direction |
| 11 | `build` | generation #2 |
| 12 | `phrase` A3 | third passive card |
| 13 | `formMcq` A3 | follow-up |
| 14 | `listenBuild` | …at i+2 |
| 15 | `translate` A3 | generation #3 |
| 16 | `speaking` A1 | spaced return to the first anchor |
| 17 | **bespoke** | the module's own beat |
| 18 | `reviewMatch` | ≥6 pairs from earlier modules |
| 19 | `speaking` close | the lesson's closing sentence |
| 20 | `info` win | close-payoff |

Reordering 2–4, 5–6 or 12–14 breaks a passive-card follow-up rule. Reordering
8, 9 or 11 breaks the selection-run or generation-count rules.

> **v1 NOTICE (2026-08-20):** positions 2, 5 and 12 are passive `phrase`
> cards, which §13 retires for new modules. A template v2 (debuts via
> `formMcq`/image-MCQ/`pretest`, first sentence view via `word_map`) is
> pending the m1 word-first re-author's verdict; until it lands, `free`
> lessons are how a module follows §13 fully.

### The 17th beat

`selfExplain`, `mcq`, or `textMcq`. **Never `match`** — position 18 is always
`reviewMatch`, which renders as `match_pairs` too, so a match at 17 is
guaranteed to trip "no two adjacent steps share a type". The compiler rejects
it by name; it does not need to be discovered in vitest.

At least **two** lessons per module must use `selfExplain` at 17. The compiler
enforces this before emitting anything.

---

## 6. The `free` template

Three kinds of lesson cannot use `topic` and are not variations of it:

- **a lesson whose contrast IS the lesson** — a minimal pair, the j-stem beat,
  the spelling-verb beat. The 20-step arc assumes three anchors differing only
  in person; these need pairs differing in exactly one feature, and the pairing
  is the pedagogy.
- **Repaso**, which introduces nothing and therefore has no anchors.
- **the Mastery Test**, which is graded steps only — no info cards, no passive
  vocabulary cards, nothing passable by reading.

`free` lists its steps explicitly in the IR. That is more YAML and it is the
honest shape: for these lessons the order *is* the judgment.

**The gates still apply.** `es-quality` reads the emitted lesson, not the IR,
so a free lesson with three selection steps in a row hears about it from vitest
rather than from the compiler. That is deliberate — a second implementation of
the gate rules inside the compiler is a second thing to keep in sync.

### The spacing trap, which will bite you

`checkPassiveCardFollowup` wants a same-atom graded step at **i+1 AND at i+2 or
i+3**. A card at i+1 with nothing after is *massed practice* and fails. In a
free lesson the natural order — teach «dijeron», then immediately drill
«dijeron» — is exactly this failure. The fix is to put a *different* form of the
same verb at i+1 and the taught form's retrieval at i+2:

```yaml
- kind: phrase       # teaches «dijeron»
- kind: translate    # decir.el → «dijo»      ← i+1, different atom
- kind: cloze        # decir.ustedes → «dijeron»  ← i+2, spaced retrieval
```

---

## 7. What the gates actually check

| gate | what it really enforces |
|---|---|
| `es-quality.test.ts` | no two adjacent steps share a type · no run of 3 selection steps · ≥2 generation steps per lesson · ≥1 typed/spoken · ≥2 `selfExplain` per module |
| `moduleConformance.test.ts` | atoms ↔ vocab map consistency · unique atom ids · every `fromModule` names a module in `ES_MODULE_ORDER` |
| `esPromptComprehensibility.test.ts` | every content word in a prompt decomposes into atoms taught at or before this module |
| `esAudioCoverage.test.ts` | a **ratchet**: how many rendered audio texts have no clip. Never raise it. |
| `matchPairsFloor` | a review-match draw must find ≥6 eligible prior pairs |
| `mN.test.ts` | the module's own claims, re-derived from `ES_VERB_ENTRIES` |
| import-time assertions in `grammarHelpers` | `vocabTextMcq` targets must be registered atoms; ≥3 distinct distractors |

Those last ones are stronger than they look. A propagated morphology regression
(«dijeron» → «dijieron» everywhere) is caught by the import-time assertions
*before* any test runs, because the wrong form is already in a distractor list
and collides.

---

## 8. The fastest way to author a new module

```bash
# 1. inventory — write scripts/draft/frames-es-mN.mjs
#    verbs, complement tables (both languages), time markers, the rules
node -e 'import("./scripts/draft/frames-es-mN.mjs").then(m => …)'   # sanity

# 2. draft the sentence pool locally. 80% duty, ~35 s, $0 of Claude tokens.
node scripts/draft/draft.mjs es-mN:mN --cover --n 12 --duty 0.8
#    --cover pins one request per (verb, person) cell; free-form drafting clusters

# 3. write src/features/languages/es/curriculum/ir/mN.ir.yaml
#    module, frame, frameFile, tense, throughModule, newAtoms,
#    exactly 8 lessons, ≥2 selfExplain, placement

node scripts/compile-ir-es.mjs mN --check     # validate, emit nothing
node scripts/compile-ir-es.mjs mN             # emit curriculum/mN.ts

# 4. READ THE GENERATED FILE. This is a gate, not a formality.
grep -oE 'promptEn: "[^"]*"' src/features/languages/es/curriculum/mN.ts | sort -u
grep -oE 'audioText: "[^"]*"' src/features/languages/es/curriculum/mN.ts | sort -u

# 5. register it — SEVEN points, all of them silent if missed (§10)
# 6. write mN.test.ts, then:
npx tsc --noEmit && npx vitest run src/features/languages/es
```

**Frame-filled cells are reported on stderr.** A (verb, person) cell the pool
missed is built from the frame and named — never silently substituted. A run
that reports 17 frame-fills is fine; a run that reports none *and* used the
pool for everything is fine; a run that reports none because the reporting
broke is not, so read the line.

---

## 9. Audio

Same chain as ja (`emit-tts-deck.mjs` → `lingo-data` → CloudFront), with one
difference that matters: **ES coverage is bad and getting worse with every
authored module.** `esAudioCoverage.test.ts` is a ratchet and new content
raises it by construction — m18 took it from 719 to 752.

The gate's own message is the policy: *"Fix = TTS regen chain + manifest
refresh, then ratchet MAX_UNCOVERED_TEXTS down — never up."* Do not raise the
number to make the suite green. Authoring a module and leaving the ratchet red
is the correct, honest state until the TTS chain runs; the upload needs AWS
credentials that not everyone has.

---

## 10. Registration — seven silent points

Adding `curriculum/mN.ts` without these is silent. m17 shipped missing one of
them and its 29 atoms were invisible to the SRS unlock index, the match-pairs
floor, and the language module's published atom set for the module's entire
life.

1. `curriculum/index.ts` — import, `ES_MODULE_META` entry, `LESSONS_BY_MODULE`
2. `courseAtoms.ts` — `EsAtomSource` union
3. `courseAtoms.ts` — **the `getEsCourseAtoms()` spread** ← the one m17 missed
4. `grammarHelpers.ts` — `ES_MODULE_ORDER`
5. `placementBank.ts` — import + map entry
6. `curriculum/mN.test.ts`
7. the module's atoms must each literally appear in its steps
   (`mN.test.ts` checks this; it caught `pagué` registered with no step using it)

---

## 11. Constraints (the "don't")

- **Don't hand-edit a generated module.** Regenerate. The file says so at the top.
- **Don't invent a step type** an existing one can express — the house rule.
  `gender_sort`, `stress_pattern`, and the 2026-08-20 interaction wave —
  `pretest_mcq`, `tap_the_word`, `word_map` (plus `dialogue_sim`, ja-born,
  now es-staged) — cleared that bar and are documented with the reason in
  `features/lesson/types.ts`; nothing else has.
- **Don't add a check that detects a bad sentence.** Change the inventory (§3).
- **Don't raise the audio ratchet.**
- **Don't teach a form the frame cannot build a sentence from** — either give
  the frame what it needs, or teach the form at form level and say so in the IR
  (as m18 does for poder).
- **Don't let the local model near English or Spanish surface text.** It picks
  combinations. That is the whole contract.

---

## 12. Known gaps

- **`ES_VERB_ENTRIES` carries 10 verbs; m18 alone teaches 18.** Twelve verbs are
  taught to learners that the app's own conjugation table has never heard of,
  so the Conjugation Trainer cannot drill them. `m18.test.ts` pins the list so
  it ratchets down rather than being inherited.
- **No story-comprehension lesson type for ES** (ja guide §14).
- **Audio coverage** (§9).
- **No `es` counterpart to the ja `module-gate` command**, so the "did my new
  sentences actually reach the TTS deck?" check is manual.

---

## 13. The interaction doctrine (Spencer, 2026-08-20)

Written language-agnostic on purpose — lift this section into the fr guide
verbatim, swapping examples. It supersedes any older section it contradicts
(notably §5 positions 2/5/12 and the withdrawn §0 phrase-card reversal).

### 13.1 No hollow steps

A step where the learner is shown something and does nothing about it
("show them and have them listen but do nothing") does not ship. The ONE
exception is a single compact `info`/`grammar_rule` card per teaching
lesson, because a grammar rule is a statement about a system (§0's §4d
argument stands) — and even that card should be the lesson's thesis, three
sentences, not a lecture.

### 13.2 The debut policy — how a WORD is met

| word class | debut step | why |
|---|---|---|
| imageable (has an emoji/art) | `word_image_mcq` — first-ever appearance IS the picture guess | ja's 2026-07-23 law, now ES law too; the picture makes it deducible at zero knowledge |
| non-imageable word or formula | **1-turn micro-`dialogue_sim`** — the situation is SHOWN (scene emoji + a ≤6-word goal line + the NPC's turn), the learner replies with the new word among taught distractors | same pretesting effect, near-zero English reading; the sim IS the situation the pretest could only narrate |
| non-imageable, no sim can carry it | `pretest_mcq` — LAST RESORT (Spencer 2026-08-20: "any narrative card is very miserable… you have to read a ton just to press one button"). If used, the situation line is ONE short sentence | keeps the pretesting mechanics for the rare debut with no conversational frame |
| never | passive vocab/phrase card | withdrawn — see §0 |

### 13.3 The sentence ramp — how a SENTENCE is met

First view of a sentence pattern: **`word_map`** — the learner maps each
highlighted English word to its target-language word, interlinear glosses
fill in, elimination carries the tail. Second encounter (same lesson, i+2/
i+3, or the next lesson): **`build`** from scratch — production of the
order they already mapped. Direct-translation sentences (aligned word
order) may use `word_map` as the build REPLACEMENT — an aligned build is
trivially guessable from English, the map is the more instructive step.
Keep `build` where order diverges: producing the divergent order is the
skill, and the map's crossing taught it first.

### 13.4 Gender is absorbed, not announced

Nouns wear their article from first exposure («la casa», never bare
«casa») in cards, audio, maps and builds — the article is part of the
word. No gender rule is stated until the module that owns the article
system (in the restarted spine that is m3 — this section originally said
"m4" against the July spine), and that card is a CALLBACK: "you've been
saying it right all along — here's why." Registry convention (m3,
2026-08-24): the ATOM surface stays bare («casa», with `gender`) — el/la/
un/una are their own atoms — and the articled form is the STEP surface;
inv 44's first-exposure check ignores a leading article for exactly this
reason. `word_map.tokenGenders` + the `genderColor` layer light
agreement chains in the noun's hue at the REVEAL, never before the answer.
Exceptions («el día») are free before the rule exists — chunks can't
contradict a rule that hasn't been stated.

### 13.5 The deduction contract (anti-frustration)

The learner must never face "I don't know!" when the author could have
prevented it. Every guessable step carries an honest path to the answer
that needs no prior teaching: the emoji (image MCQ), elimination against
taught words (pretest, word_map's shrinking bank), a cognate, visible
morphology (the -a on «simpática»), the gloss, position, or a prior sim
turn. Author the cue deliberately and name it in the reveal
(`revealNote`), so the learner walks away with a strategy, not a lucky
tap. A step whose answer is reachable only by luck is an authoring bug.

**Cognates are an AID, never the MECHANISM** (Spencer 2026-08-20:
"cognates are hard to rely on for other languages… germans can learn the
same way but not know no is nein"). The design must survive translation
to a non-cognate language: every word still gets a real teach beat, and
every deduction path must work WITHOUT the resemblance. ELIMINATION is
the language-agnostic path — a word_map may debut at most ONE new word
per map because the taught words eliminate down to it (German: eins/zwei
known → drei falls out the same way). A cognate `revealNote` celebrates
the luck ("bonus — it's the same word in English"); it never carries the
teaching.

The companion rule (Spencer 2026-08-20): **think about what the learner
needs to learn and the simplest step that teaches it — the less reading
the better.** Concretely: `tap_the_word` only where FINDING the word in a
real sentence is the work (≥5 tokens as a floor — on a 3-token sentence
it's an MCQ in a costume, so author the MCQ); the audio-prompt word MCQ
("Which word do you hear?", `meaningEn` = the target word) is the
zero-reading recognition beat and should appear in every early lesson;
explanations on WINS collapse behind "View explanation" (Feedback does
this automatically) — forced reading after a correct answer is the
narrative-card problem in miniature.

### 13.6 `dialogue_sim` is the integration beat — and the debut vehicle

The favorite step in the course. Use it where the old arc used the L7
dialogue-listen — the learner IS the second speaker, every NPC line
glosses below, and the scenario is followed by a retrieval quiz over
exactly the words/sentences it used. Sim replies obey §13.5: the goal
line, the glosses and prior turns make each reply deducible. One step =
one scenario; grading per the 2026-07-29 decision recorded in
`_stepPredicates.ts`. Two grain sizes: the FULL scenario (3–5 turns) is
the integration beat; the **micro-sim** (ONE turn) is the debut vehicle
for non-imageable words — but ONLY under the self-cueing law below.

**THE SELF-CUEING LAW (Spencer 2026-08-20, from walking a broken sim):
the NPC's line must ITSELF create the slot the reply fills.** A mirror
(«Mucho gusto.» → mucho gusto), a question («¿Café?» → sí por favor /
no gracias, both accepted), an interjection («¡Ay!» → perdón). If the
real cue lives in `scene.setting` or the goal line — Ana says «¡Hola!»
but the flower that makes «gracias» right is in prose — the step is a
narrative card in a sim costume, and worse: "someone saying hello would
warrant a hello back," so the learner is punished for correct
pragmatics. Named failure modes, all found on one walk:

1. **Natural-answer trap** — a known word among the options is the
   pragmatically right reply to the NPC line but marked wrong (hola →
   hola). Machine-checkable: a mirror of the NPC line may appear only as
   correct/alsoCorrect (pinned in the m1 prototype tests).
2. **Prose-cued turn** — the reply is not deducible from npc line +
   gloss alone. Review trick: cover the scene text and replay the turn;
   if it stops making sense, it fails.
3. **Tonal incoherence** — the injured stranger cheerfully saying
   «Buenos días» after you step on his foot. Drama that contradicts the
   target reply is prose-cueing's louder cousin.
4. **Both-correct dodge** — when alsoCorrect includes an already-known
   answer, a DEBUT can be dodged forever by picking the familiar one.
   Fine for consolidation (a real offer has two right answers); wrong
   for debuts, so debut sims keep exactly one right reply.
5. **Goal-as-translation** — a goal line like "Say 'see you later'"
   hands over the answer as a translation exercise. Acceptable for a
   debut (it IS the gloss); too shallow for any later retest.

Corollary: if a word is imageable at all — even a soft emoji like 🤲 —
the image MCQ beats a forced sim (elimination carries a weak picture);
and a sim whose only honest line would be untaught Spanish should not
exist at that point in the course.

### 13.7 FSRS in intro contexts

New-type steps in intro lessons carry NO `exercisedAtoms` — the house rule
(grading is review-only; a lesson's own new content is never graded
same-session) already covers them, so nothing new is wired. "Author it
well" is the design: the choreography above IS the spacing. Review-context
uses may add `exercisedAtoms` exactly like any graded step.

### 13.8 What the gates still owe this section

~~IR emitters + factories for the new kinds~~ — **LANDED 2026-08-24.**
The §13 IR route is live and m3 is its exemplar: a `frame: none` module
declaring `expectedLessonCount` + `checkpoint` unlocks the doctrine mode
(free lessons only; mastery must END on a `sim`; the compiler emits
`ES_Mn_CHECKPOINT_INDEX` for es-quality). New IR step kinds, all literal:
`sim` (compile-time self-cueing checks: mirror-trap, goal ≤8 words,
debut = single correct, tile-composability of every accepted reply),
`map` (word_map incl. `tokenGenders`), `audioWimcq` (audio mode set by
construction), `matchLit`, and `speakLit` gained `cue: recall`. Author
workflow: write `ir/mN.ir.yaml` → `node scripts/compile-ir-es.mjs mN` →
READ the emitted module (still the gate) → register (§10) → module test
in the m2.test.ts shape → TTS delta chain. Option ORDER is owned by the
render layer (2026-08-24: seeded shuffle in the MCQ/sim views — the
literal correct-first style is readable, never a position tell).

Still owed: classify `word_map`/`tap_the_word` in the selection-run and
modality-mix lints once a module leans on them harder; `tap_the_word` /
`pretest_mcq` remain pinned in `UNUSED_STEP_TYPES` (no shipped content
uses them — pretest by design, tap awaiting a ≥5-token sentence that
earns it).

### 13.9 The retention rhythm (learner-sim rework, 2026-08-20)

Four Opus fresh-learner walks of the first m1 prototype quantified the
failure Spencer had already named ("we teach too much at once, don't
review enough… it shouldn't be this hard"): 48% of steps carried zero
retrieval demand, items averaged 1.5 retrievals, all 19 speaking steps
were read-aloud, and the net next-day yield of eight lessons was ~4 new
items. Full synthesis: `docs/learner-sim/es-m1-proto-FINDINGS.md`. The
laws that came out of it — all live in the m1v2 prototype and
machine-pinned in `esM1Lessons.test.ts`:

1. **Every lesson carries a review tail** (the JA house mechanism):
   2–3 OFF-TOPIC prior-item retrievals before the close, and the tail
   lane is itself spaced across lessons (L4 carries L2's courtesy, L5
   carries L3+L4, L6 carries L3+L5…). Closing match ≥50% prior items.
2. **A dedicated zero-new CHECKPOINT lesson sits mid-module** (after L5
   in m1): ~16 graded retrievals, no cards, every confusable pair
   discriminated. Target: every item ≥2 post-intro retrievals, every
   item present in mastery.
3. **The speaking recall law.** The FIRST voicing of any surface shows
   the printed form (and the learner can hear the clip). Every LATER
   voicing is cued recall — `cue: "recall"` on the step: English cue,
   Spanish hidden, no autoplay, "Show answer" as the graceful out.
   Machine-linted: recall may never precede a printed voicing.
4. **Confusable pairs get alternating-answer discrimination trials with
   both halves live.** A pair trained with one answer trains a false
   rule (the buenos/buenas finding: both original trials answered
   "buenas" — always-answer-buenas scored 100%). m1's pairs and their
   trial lanes: buenos/buenas (card teaches the pairing + NOT:
   «buenas días»), y/o, seis/siete (by EAR), cero/cinco, tardes/noches.
5. **Cash every card within ~2 steps or cut it.** A phonetics card pays
   off in a which-do-you-hear check right after it (L1 vowels →
   hear-adiós; L4 soft-c → hear-cero) or it doesn't ship (L5's stress
   line was cut). Phonetics taught = phonetics tested.
6. **Digit emoji only where they're honest** — on the intro MCQ (the
   emoji IS the numeral) and as the MEANING side of audio-prompted ear
   trials. Word→meaning retrievals are text MCQs. Number lessons end by
   COUNTING out loud.
7. **World and wins.** The module states its promise in L1; titles are
   promises, not inventory labels; NPC continuity holds (a character
   debuts once); sim questions are real questions; every lesson ends on
   its WIN (match second-to-last); the MODULE ends on a conversation,
   not a grid. The free delight beats (¿ and ¡) live in collapsed win
   explanations, never in forced reading.
8. **Listening retrieval is separated from its source.** The
   map → hear → speak ramp on a sentence's FIRST encounter is teaching
   and stays adjacent; every LATER listening check lives lessons away
   from the step that showed its text. Unscaffolded production in
   mastery is a tile build or a cued recall — law 10.
9. **Interleave — never block-teach a category** (Spencer, 2026-08-20:
   "teaching all the numbers at once, in a row, is kind of boring…
   teaching too much of the same thing at once or in one lesson is
   bad" — JA m31's kureru/ageru block is the same failure). The shape
   for repetitive families (numbers, days, verb-pair clusters): a few
   items plus a couple of UNRELATED words, then a lesson with the rest
   plus more unrelated words, then the full review lesson. m1 runs
   numbers 4/4/3 across L4–L6 with the hasta-luego and mucho-gusto sims
   as the mid-lesson breaks. This is a SPINE-design law for every
   course, and these families are among the few spots that stay
   hand-authored.
10. **No typed `translate` at beginner tier** (Spencer, fr m1 L9 walk
    2026-08-21: he typed the phonetically-perfect «oui, si vu plait»
    and was graded wrong). Typed production tests SPELLING, which
    beginner modules never teach — French orthography especially.
    The production ladder is: cued-recall speaking → tile build →
    typed translate only in LATER modules, once spelling has been
    earned. Machine-pinned at ZERO translate steps in all four proto
    suites; when the spine wants a translate, place a build.
11. **Max-acceptance on sim tile banks** (same walk: Spencer built
    «oui deux s'il vous plaît» — natural, correct — and was marked
    wrong). Every natural reply a bank can compose must be in
    `alsoAccepted`: enumerate the combinations, exclude only the
    genuinely unidiomatic or an untaught nuance (bare «merci» answering
    an offer often means REFUSAL — ungradeable at this tier). With no
    slot-count cue, good learners build the fullest polite answer;
    never punish that.

Scope note (R10, decided 2026-08-20): the turn-2 rescue kit
(¿cómo estás? / me llamo / no entiendo) is HELD for early m2 — m1
compresses instead of growing. Engine backlog from the same findings
(R9): listening tap-to-reveal fallback, speaking "later" affordance,
sim tile-reply length cue.

Walk yields, Spencer's own fr walk (2026-08-21): recognizer digit ITN
fixed in the ENGINE (`numbersToRomance` in `shared/speech/loose-match.ts`
— counting steps now grade a "1 2 3 4" transcript as the words the
learner actually said, es and fr, both recognizers); the pipeline
`silent_letter` kind is BANNED (English speakers own silent letters
already — the concept costs one info-card sentence, not an interactive
type; drop the kind when fr recompiles from IR).
