# French lesson authoring guide

**Status:** DESIGN — no French module has been authored. The FR engine's
STRUCTURAL CORE now exists (atoms, the 5 FR-usable step factories, placement
bank, module, registry entry — `fr` is registered and deliberately not
selectable); the CONTENT half (conjugation tables, the drafting frames, the IR
compiler, TTS) does not. §9 is the current line between them. ·
**Created:** 2026-08-18 · **Adapted from:**
[lesson-authoring-guide.md](lesson-authoring-guide.md) (ja) and
[es-lesson-authoring-guide.md](es-lesson-authoring-guide.md) (es)

> **Read [fr-authoring-invariants-pinned.md](fr-authoring-invariants-pinned.md)
> first** — that file is the LAW, and its §7 is the BUILD LIST. This file is the
> METHOD, and it is written *ahead* of the build deliberately: the Spanish wave
> proved that the expensive mistakes are inventory mistakes, and inventory
> mistakes are cheapest to prevent before the first frame is written.
>
> **Honesty about status.** Everything in §§2–8 below describes a pipeline that
> can be built by parameterizing the Spanish one — the ES compiler already takes
> `frameFile` as a parameter and the templates already take the frame as an
> argument. Nothing in it is running today. Every claim about French *grammar*
> is real; every claim about French *tooling* is a design, and §9 says exactly
> what is missing. Do not read §8's command block as something you can run.

---

## 0. What French inherits, and what it does not

French is closer to Spanish than to Japanese in every way that matters to this
codebase: Latin script, no particles, morphology-heavy, person-marked verbs,
gendered nouns with agreement. So the **Spanish** guide is the parent document,
not the Japanese one, and §§1–8 below are the ES method with French's facts.

Three things are genuinely French and have no Spanish analogue. They are the
reason French cannot simply reuse `frames-es-*.mjs` with new words:

1. **Sound and spelling come apart.** Spanish orthography is nearly phonemic;
   French is not. `parle`, `parles`, `parlent` are three spellings of one sound.
   Any step that asks a learner to *hear* a distinction that does not exist in
   speech is unanswerable, and any step that asks them to *write* one they were
   only told about in audio is unfair. This is invariant §1 of the pin and it
   is the single largest source of unusable French exercises.
2. **Liaison and elision change the surface at word boundaries.** `le` + `ami`
   → `l'ami`; `les amis` is pronounced with a /z/ that is written nowhere. A
   build-tile bank that hands out `le` and `ami` as separate tiles teaches a
   form that does not exist.
3. **Agreement is written but often silent.** `grande` vs `grand` differ in
   writing and in speech; `parlé` vs `parler` vs `parlez` differ in writing and
   not at all in speech.

The consequence for the pipeline is the same as always: **these are inventory
constraints, not filters.** The frame must be incapable of producing a step
whose answer is inaudible.

### 0.1 Provenance — every ja guide section, accounted for

French inherits through Spanish, so this ledger has two levels. **The default
rule: FR takes the ES guide's ruling on every ja section.** ES §0 already
classifies all of them as carried, adapted, dropped, or reversed, and repeating
that here would just be a copy that goes stale. The table below is therefore the
*exceptions* — every ja section where French does something ES does not — plus
an explicit roll-call so the accounting is complete and machine-checkable
(`authoringGuideProvenance.test.ts`).

**AS SPANISH, no French exception:** §1 contract · §2 density bar · §3
sub-lesson template (the 20-step topic template, §5 below) · §5 the five things
authors get wrong (and §5.1–§5.5) · §6 compounding review · §9 win cards · §10
constraints · §11 fastest-way-to-author (FR version in §8 below) · §12 living
history · §13 retrospective and §13.1–§13.13 · §14 story comprehension (not
built for FR either) · §4d info steps (FR ships them, same reversal and same
reason as ES) · §4b2 `phrase_card` (FR uses `vocab()`, same reversal — and for
the same reason, since there is no FR art pipeline either).

**WHERE FRENCH DIVERGES FROM SPANISH:**

| ja section | ES ruling | what French does instead |
|---|---|---|
| §4 step-type cheat sheet | carried, ES examples | **Carried, and it is the one section the Latin-script languages grow.** Six types were added in the 2026-08-18 wave, all wired (type + `StepRenderer` case + view) — but they do not all belong to French, and authoring against the wrong one wastes a module:

- **French only:** `silent_letter`, `liaison_listen`, `agreement_chain`. These exist for the sound/spelling gap and have no Spanish use.
- **Shared FR + ES:** `gender_sort` (both languages have two genders), `aspect_choice_cloze` (imparfait/passé composé and imperfecto/pretérito are the same choice).
- **Spanish only — do NOT author it for French:** `stress_pattern`. Its `accentRule` enum is `aguda | llana | esdrujula` and its worked minimal pair is `hablo` / `habló`. **French has no lexical stress** — stress is phrase-final and fixed, so there is no word-level answer for a learner to hear. A French `stress_pattern` step would be unanswerable in the strict sense of pin §1.

The FR cheat sheet is §6 below, and it supersedes ja §4 for French rather than replacing it: every ja type is still available. |
| §4a2 word-level recall is MCQ, never typed | carried | **Carried and strengthened into a hard rule.** In Spanish a typed answer is merely unforgiving; in French it is close to a trick — `parle` / `parles` / `parlent` are one sound, and `é` / `è` / `ê` are three keystrokes most learners cannot produce. Typed recall of a French word is a spelling test wearing a vocabulary test's clothes. Where the spelling genuinely *is* the lesson, that is `silent_letter` or `agreement_chain`, which ask for a tap. |
| §4b listening is sentence-first | carried | **Carried, with a French ceiling.** Sentence-first is right, but no listening step may hinge on a distinction that does not exist in speech (pin §1). A `listening_build` whose answer is `parlent` and whose distractor is `parle` is unanswerable, not hard. The frame must not be able to build one. |
| §4c particle clozes | dropped — Spanish has no particles | **Dropped as written, but the slot is filled.** French has no particles either; it has obligatory *contractions* — `de + le → du`, `à + les → aux`, `le + ami → l'ami`. These behave like ja particles in the one way that matters: they are small, high-frequency, and a build-tile bank that offers the parts teaches a form that does not exist. So ja's rule survives as: contractions are introduced by cloze, and never appear as separable tiles. |
| §4e / §4e-addendum / §4f script ladder, furigana, `kanji_reading` | dropped — Spanish is Latin-script throughout | **Not dropped. This is the section French needs most, and ES did not.** ja's ladder exists because the written and spoken systems come apart and the learner must climb from one to the other. French is Latin-script but has exactly that gap: silent finals, liaison, and written-but-inaudible agreement. `silent_letter`, `liaison_listen` and `agreement_chain` are the French rungs, and they inherit the ladder's discipline — a rung is introduced before it is graded, and the window between "shown" and "required" is a property of the module, not the step. |
| §4g sentence-complexity floor | carried, and upgraded to a machine gate | **Carried, gate included, once the engine exists.** `esSentenceComplexity.test.ts` is frame-driven, not Spanish-specific — it reads each module's IR header for its `frameFile` and asserts every production target carries one of that frame's own time markers. The FR engine must expose `time` on its frames in the same shape for it to apply unchanged. |
| §7 audio conventions | same chain, `manifests/es.json`, poor coverage | **Worse: there is no `manifests/fr.json` at all.** No French clip has been generated. Until the TTS chain is run for `fr`, every audio-bearing step type degrades to its no-clip rendering, and `liaison_listen` — whose entire content is a sound — is not authorable. This gates the first FR module, not a later polish pass. |
| §8 speech-step gotchas | carried | **Carried plus liaison.** A `speaking` target whose scoring spans a liaison boundary will be marked wrong for a correct pronunciation, because the recogniser returns the written form. Keep speech targets inside one phonological word until this is measured. |

If you find a ja section in none of the above, this file is incomplete. Say so
rather than guessing — and the test says so for you.

---

## 1. The one-paragraph contract

Unchanged from Spanish. One contrast per lesson, stated in an `info` card,
three anchors, both directions, a spaced return, one self-explanation, six
review pairs, close on a producible sentence. Twenty steps.

---

## 2. The pipeline (design)

Identical in shape to Spanish, because the Spanish compiler was written to be
parameterized rather than copied:

```
ir/mN.ir.yaml   →   node scripts/compile-ir-fr.mjs mN   →   curriculum/mN.ts
```

`scripts/compile-ir-es.mjs` already resolves its frame via
``await import(`./draft/frames-${ir.frameFile ?? "es-a2"}.mjs`)`` and already
takes the tense from the IR. The French front door is that file with three
substitutions — the frame prefix, the emitted import path, and the morphology
module — plus a French `renderFreeStep` if French earns step kinds Spanish does
not have. **It should be a sibling, not a fork**: if the two diverge by more
than those substitutions, the divergence is a bug in one of them.

`scripts/draft/es-ir/assemble.mjs` and `templates.mjs` are already
frame-parameterized and take no ES-specific knowledge except `morph-es.mjs`.
Lifting that import to a parameter is the actual work of making them shared.

---

## 3. Spend judgment on the INVENTORY — the French version

Every Spanish defect in the ES guide §3 has a French analogue, and French adds
a class Spanish does not have: **the inaudible answer.**

| the defect class | French example | the inventory fix |
|---|---|---|
| ungrammatical gloss | `jouer` "to play" + a complement carrying "to" | table the complement's English with it, per verb (the ES rule) |
| grammatical but meaningless | a punctual time marker on a state verb | `DURATIVE_ONLY` / `DURATIVE_TIME`, exactly as ES does it |
| fabricated form | a strong past participle guessed from the infinitive | a `STRONG_*` lemma list that **throws** rather than falling through |
| **inaudible answer** | a `listening_build` whose tiles are `parle` / `parles` / `parlent` | the frame must not offer homophone tiles in the same bank — this has no ES analogue |
| **elision at a boundary** | tiles `le` + `ami` for «l'ami» | elided forms are TABLED WHOLE, like ES's contracted prepositions («al parque») |
| **written-only agreement in a spoken step** | «grand» vs «grande» in a `speaking` step where they sound alike | the frame tags each adjective `audibleAgreement: true/false`; spoken steps draw only from the audible set |

The last three are the French-specific work. They are all frame-side, and none
of them is a check.

**The ES precedent that matters most:** `poder` was removed from the m18 frame
entirely, because as an intransitive it built «Yo pude ayer» — "I was able to
yesterday", grammatical in both languages and a sentence no person has said.
The form is still taught, at form level, and the IR says so in a comment.
French will need the same call repeatedly: a form worth teaching is not
automatically a form the frame can build a sentence around.

---

## 4. The frame (design)

Same exports as `frames-es-m18.mjs`: `slots`, `rules`, `build()`, `check()`,
`vocabSurfaces()`, and re-exported `assertFrameVocabIsTaught` / `loadNouns`.

Three additional tables French needs:

```js
// Elided and contracted forms, whole, in both languages — never composed.
// «à le» is not a thing; «au» is. Same discipline as ES's «al parque».
const CONTRACTED = {
  à:  { le: "au",  les: "aux" },
  de: { le: "du",  les: "des" },
};

// Does this adjective's agreement survive into speech? A spoken or listening
// step may only draw from the audible set — otherwise the answer cannot be
// heard, which is the pin's §1.
const ADJECTIVES = [
  { lemma: "grand", f: "grande", audibleAgreement: true  },
  { lemma: "joli",  f: "jolie",  audibleAgreement: false },
];

// Homophone sets. No build-tile bank and no MCQ option list may contain two
// members of the same set unless the step is explicitly a SPELLING step.
const HOMOPHONES = [
  ["parle", "parles", "parlent"],
  ["parlé", "parler", "parlez"],
  ["est", "es", "ai", "aie"],
];
```

`HOMOPHONES` is the one that makes French tractable. It converts "does this
step have an inaudible answer?" — a question about pronunciation that no
structural check can answer — into a table lookup the frame performs before it
builds anything.

---

## 5. The 20-step topic template

Unchanged from Spanish (§5 of the ES guide), because the ES quality gates it
satisfies are language-independent: no adjacent same-type, no 3-selection run,
≥2 generation, ≥1 typed/spoken, passive-card follow-up at i+1 **and** i+2/i+3,
≥2 `selfExplain` per module.

Two French-specific constraints layer on top:

- **Position 8 (`speaking`) and 10 (`listenComp`) may not draw a cell whose
  contrast is written-only.** If the lesson's contrast is `parle`/`parles`,
  those two positions must draw a different contrast — otherwise the lesson's
  own payload is untestable in the two positions that use audio.
- **Position 14 (`listenBuild`) may not receive homophone tiles.** This is the
  `HOMOPHONES` table doing its job; it should be enforced in the assembler's
  `checkDistractors`, which already throws when a distractor tile collides with
  an answer token.

### The 17th beat

`selfExplain`, `mcq`, or `textMcq` — never `match` (it collides with the
`reviewMatch` at 18; the ES compiler rejects it by name and the FR one must
too). French earns a fourth option that Spanish does not need:
**`liaison_listen`**, which already ships as a step type and view.

---

## 6. Step types — what already exists

Per the pin's §7 audit, French needs **no new step types**. The following are
reusable with zero engine change: `agreement_cloze`, `particle_cloze`,
`word_image_mcq`, `match_pairs`, `build_sentence` (including register
scaffolds), `translate`, `listening_comprehension`, `listening_build`,
`dialogue_listen`, `self_explanation_mcq`, `speaking`, derived test-outs, and
the shared `accentFold` grading path.

Three landed on 2026-08-18 specifically for French: apostrophe folding in
`normalizeTypedAnswer`, `liaison_listen`, and `aspect_choice_cloze`.

**The house rule is parameterize, don't fork,** and French is the language most
likely to tempt an author into forking, because its surface feels unfamiliar
while its mechanics do not. A "French agreement" step type, a "gender cloze",
an "article picker" and a "tu/vous" step type are all already expressible.

Two step types were added during the 2026-08-18 wave that French *will* use and
Spanish does not: `gender_sort` (n items into 2 buckets — `match_pairs` is 1:1
and `agreement_cloze` assumes the gender is already known) and `stress_pattern`
(accent-stripped syllables, audio as the stimulus). `stress_pattern` is
Spanish-first; French's accent marks are not stress marks, so **do not reach
for it** — French's analogue is `liaison_listen`.

---

## 7. Register — tu / vous

Spanish's tú/usted split is carried in `build_sentence`'s register scaffolds and
French uses the same machinery. The French-specific trap is in the pin §4: the
negation register split. Written French is `ne … pas`; spoken French drops `ne`
almost always. A course that teaches only the written form produces learners who
cannot parse speech, and a course that teaches only the spoken form produces
learners who fail every written test. Both are taught, and which one a step
expects must be explicit in the step, never inferred.

---

## 8. Authoring a French module (once §9 is built)

```bash
# 1. inventory — scripts/draft/frames-fr-mN.mjs
#    verbs, TABLED complements with contractions, CONTRACTED, ADJECTIVES,
#    HOMOPHONES, time markers, the durative rules
# 2. draft locally, 80% duty, one request per (verb, person) cell
node scripts/draft/draft.mjs fr-mN:mN --cover --n 12 --duty 0.8
# 3. write src/features/languages/fr/curriculum/ir/mN.ir.yaml
node scripts/compile-ir-fr.mjs mN --check
node scripts/compile-ir-fr.mjs mN
# 4. READ THE GENERATED FILE — this is a gate
grep -oE 'promptEn: "[^"]*"' src/features/languages/fr/curriculum/mN.ts | sort -u
# 5. register (seven points, all silent if missed — ES guide §10)
# 6. mN.test.ts, then tsc + vitest
```

**None of these commands exist yet.** §9 is what stands between this block and
being runnable.

---

## 9. What must be built first

Reproduced from `fr-authoring-invariants-pinned.md` §7, ordered by what blocks
what. The verdicts are from the 2026-08-18 engine audit.

**Small parameterizations** (each a line or a small table): ~~`BCP47.fr`~~
**done** · ~~`SPEECH_LOCALES.fr`~~ **done** · the AccentBar char set (13+ French
chars will not fit the one row the 9 Spanish chars use — this needs a layout
decision, not a longer array; blocks typed steps, see item 3) ·
`getConjugationGridConfig("fr")`.

> On `matchPairsFloor`: **resolved differently, 2026-08-19.** No FR pad branch
> exists, DELIBERATELY: the FR `matchPairs` factory enforces the ≥6-pair floor
> at authoring time, so every authored grid already renders full and there is
> nothing for a render-side pad to do. A pad branch would re-introduce the
> render-time content synthesis the IR process exists to avoid. Add one only
> if a future step type genuinely needs render-side fill.

**Genuinely new code:**

1. ~~`fr/courseAtoms.ts`, `fr/grammarHelpers.ts`, `fr/module.ts`,
   `registry.ts` entry~~ — **DONE.** Plus `fr/placementBank.ts`, which the
   original list missed (it is required by the `LanguageModule` contract), and
   `fr/__tests__/frEngine.test.ts`. **`fr/conjugationTables.ts` is still
   open**, and `module.ts` OMITS the `conjugation` slot rather than declaring
   `tables: []` — the generic engines read null as "no such capability, route
   around me" and empty as "capability present, no data", which renders an
   empty trainer.
   The shared factories (`cloze`, `build`, `translateStep`, `speaking`,
   `matchPairs`, …) were ported 2026-08-19 WITH m1 (as this section required),
   carrying the FR-specific validators: `assertNoElisionBreach` on every
   build/listening word order, `assertNoHomophoneTiles` on listening_build
   banks, and `withArticle()` deriving gendered-noun display so pin F6 holds
   by construction.
2. A FR `expandAcceptedAnswers` ruleset for elision variants. The JA file's
   *architecture* (fixpoint variant queue, `MAX_VARIANTS` guard) is a clean
   template; its rules are not reusable.
3. A per-language `accentPolicy: "lenient" | "strict"` threaded into
   `gradeTypedAnswer`, so the pin's §1 minimal pairs grade exactly while
   ordinary accents stay lenient. **Until this lands, typed steps on those
   pairs are forbidden.**
4. ~~A FR TTS deck emitter + `manifests/fr.json`~~ — **DONE 2026-08-19.**
   `fr/__tests__/emitTtsDeck.test.ts` (ES data-walk pattern), edge
   `fr-FR-DeniseNeural` in lingo-data's generator, `manifests/fr.json`
   installed byte-identical in both repos, 53 m1 clips staged in
   `tts-publish/fr/` (additive only — clips + manifest ship the same deploy).
   **The Denise voice has NOT been auditioned by a human yet.**
5. **The gates, ported WITH the first module, not after.** This is the sharpest
   lesson the Spanish wave has to offer: `esAudioCoverage.test.ts` has a ratchet
   that started at **719** because it was written after the debt existed, and it
   has been climbing ever since — m18 took it to 752. **`frAudioCoverage`
   should start at 0 and stay there.** Also needed:
   `frPromptComprehensibility.test.ts`, `fr-quality.test.ts`, per-module
   conformance tests. `moduleConformance` in `shared/language/__tests__/` is
   `describe.each(getAllLanguageIds())` and picks fr up for free the moment it
   registers — **which it now has.** French is under the shared conformance
   gate from 2026-08-18. **The FR-specific gates all landed 2026-08-19, WITH
   m1, all at zero:** `frAudioCoverage` (ratchet 0, green), 
   `frPromptComprehensibility` (ratchet 0 — ES's is 467), `fr-quality.test.ts`
   (density/variety/production/compounding), and the per-module pair
   `fr/__tests__/moduleContentLints.ts` + `moduleBarGuards.ts`. The FR bar
   guards have **no debt parameter at all** — the type system cannot express
   a pinned violation, because no pre-gate FR content exists to pin.
6. `AVAILABLE_LEARNING_LANGUAGE_IDS` in `shared/domain/languageConfig.ts` — the
   last switch, deliberately last, and STILL OFF. The audio gate passes at
   zero as of 2026-08-19, so the remaining blockers are human: Spencer's
   audition of the Denise voice and a walk of m1. The course is also only one
   module deep — selectability is a judgment call, not a checklist item.

---

## 10. Data licensing — decide before the frame is written

French lexical resources were surveyed on 2026-08-18
(`fr-lexical-resources-2026-08-18.md`). The licensing question is not a
formality: several of the best French frequency and inflection datasets are
**CC BY-SA**, which is share-alike. Tabling their content into
`frames-fr-*.mjs` would arguably make the frame a derivative work.

This is an open decision and it belongs to the project owner, not to an
authoring session. Resolve it before the first frame tables real vocabulary,
because unwinding it afterwards means rewriting the inventory — which is, by
this guide's own argument, the expensive half.

---

## 11. Known gaps

- **Nothing in §§2–8 runs today.** §9 is the gate.
- The licensing decision in §10 is unresolved.
- No French story-comprehension lessons (ja guide §14); ES does not have them
  either.
- `AccentBar` needs a layout, not a table entry.
