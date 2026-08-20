# Handoff — course re-authoring wave (2026-08-19)

**Status:** PLANNED, nothing started. Spencer's ruling: re-author Spanish rather
than patch it; leave m17–m19 live (nobody is actively taking the course); do all
four fix tracks; **separate the languages properly and account for the
language-agnostic layer.**

Audit that produced this: four parallel auditors (ja m1–m4 learner walk, es
m1–m4 learner walk, es-vs-ja gate conformance, fr readiness). Every claim
marked ✅ below was re-verified by hand against the working tree; claims marked
⚠️ are auditor-reported and NOT independently checked.

---

## 0. The rule that governs this wave

**Spend judgment on the INVENTORY, never on the OUTPUT.** A wrong item must be
*unreachable*, not *detectable*. The ja course's cleanest instance, and the
model for everything below:

```ts
// ja/grammarHelpers.ts:1044
if (!target.emoji) {
  throw new Error(`vocabMcq: target '${target.kana}' has no emoji —
                   use listeningBuild or listeningComp instead`);
}
```

You cannot author a picture-MCQ for an unpicturable word. That is why es m4
could ship 27 words with zero intro cards and ja could not. ✅

---

## 1. What the JAPANESE re-authoring cost — read before authoring Spanish

Source: `docs/rewrite-cycle-report-2026-07-20.md`, `docs/authoring-invariants-pinned.md`.

1. **Five of the invariants (28–32) were discovered by Spencer walking m4/m5
   AFTER those modules passed every gate they had.** The machine layer caught
   ~80% of defect classes; the residue was semantic naturalness and
   cross-module consistency. **Plan walk checkpoints into the schedule — do not
   author m1→m19 straight through.**
2. **Pause after the riskiest pedagogy before it compounds.** ja paused after
   m5 (verbs). The es analogue is the first module that introduces verb
   conjugation — stop there for a walk.
3. **The provenance tokenizer was dict-form-only, and would have false-positived
   the moment negatives arrived — "an agent would loosen the check."** This is
   the highest-risk trap for Spanish, which is far more inflected than the ja
   dict-form set. Any es provenance gate must union a conjugation-aware lexicon
   from day one, or the first agent that hits a false positive will weaken it.
4. **The visual/continuity gate was silently skippable** — the workflow called
   it mandatory while the runner SKIPped it unless two flags were set. Fixed by
   making it default-ON with an explicit `--skip-visual`. **A skip must be
   chosen, never accidental.**
5. **The exposure audit was report-only** until it was given a non-zero exit.
   A gate that cannot fail is documentation.
6. **`fromModule` tags carry pre-rewrite numbering** and must not be read as
   "where it is taught". A Spanish re-author will invalidate every es atom's
   `fromModule` mid-flight; decide up front whether the re-author restamps them
   or whether provenance reads the lesson index instead.
7. **Dialogue could still be a word's first exposure** (INTRO_TYPES was
   POS-blind). Split intro-capability by part of speech.

---

## 2. The language-agnostic layer — the thing Spencer flagged

Three categories. Getting these confused is how es ended up with ja's
placement spine.

### 2a. Genuinely shared, correctly shared
`LessonStep` types · `StepRenderer` + all step views · `contentSafety.test.ts` ·
`shared/language/__tests__/moduleConformance.test.ts` (`describe.each(getAllLanguageIds())`) ·
`shared/lessonAuthoring/curriculumAssertions.ts` · `buildTileFloor` (ja/es/ko) ·
`matchPairsPairCount`.

### 2b. Shared-looking but secretly Japanese — the leaks ✅
Verified by grep over `src/shared/` and `src/features/lesson/data/`:

| Site | Effect on es/fr |
|---|---|
| ~~`DialogueListenStepView.tsx:14` imports `ja/dialogueSpeakers.json`~~ **FIXED 2026-08-20**: per-language `dialogueVoices` capability; ja roster no longer leaks | ES/FR dialogues play the default voice until their male-voice clips exist and their modules declare the capability (content-wave item). |
| `dynamicReviewPrefix.ts:117` `!== "ja"` | No FSRS-due review prefix for es/fr. |
| `grammarReviewPools.ts:314`, `grammarReviewIndex.ts:214` | Grammar SRS is ja-only. |
| `buildSrsReviewLesson.ts:584` | SRS review lesson shape branches on ja. |
| `vocabGraduation/storage.ts:51` | Vocab graduation is ja-only. |
| `notoEmoji.ts:34` `courseAtomsFor` returns `[]` for non-ja | Stale ADR-005 violation; harmless on the `vocabArt` path fr/es use. |
| `placement/tiers.ts:88` `TIERS_BY_LANGUAGE = {ja, ko}` | **es silently falls back to the JA module spine** — es m1/m2 unreachable by the adaptive test, ten nonexistent modules reachable. `hasSkillTiers()` exists to prevent exactly this and is **never called anywhere**. |
| `AccentBar.tsx:6` hardcoded 9 Spanish chars, gated `id === "es"` in `TranslateStepView.tsx:72` | fr needs ~15 chars and does not fit the row. |
| `loose-match.ts:495` `gradeTypedAnswer(accepted, input)` — **no language parameter at all** | Diacritics folded unconditionally for every language. fr cannot distinguish `ou`/`où`, `sur`/`sûr`. |
| `translateVariants.ts:141` `expandAcceptedAnswers` | 100% Japanese (kana regexes). es/fr get no variant expansion. |

**Net effect: a large part of the review/SRS machinery is Japanese-only, so a
Spanish learner gets materially less app than a Japanese learner independent of
content quality.** Decide per item whether to generalize or to declare it a ja
capability — but decide, and record it.

### 2c. Should be shared and isn't ⚠️
**There is no shared step-constructor library.** `es/grammarHelpers.ts` is ~790
LOC of es-specific wrappers over the shared step types; ja has its own; fr would
need ~13 of them on day one. Every new language re-implements the same 18
factories. If the Spanish re-author is going to rewrite these anyway, that is
the moment to decide whether a shared core with per-language validators is worth
extracting — before fr copies the pattern a third time.

---

## 3. The four fix tracks

Ordered by learner damage. Tracks B and C are prerequisites for a clean
re-author; track A is partly obviated by it.

### Track A — Spanish m1–m4 content ✅
- **m4 ships zero intro cards** for 27 new atoms, zero pronunciation hints, 72%
  of audio surfaces uncovered. `es-m4-1`: 5 new words, 0 cards, 0/8 audio.
- **`ratón`, `elefante`, `monstruo` are used as build/listening targets and are
  registered as atoms in none of the 19 modules.** Plus forward leaks: `hermana`
  and `tengo` from m5, `comida` from m9, `sol` from m14.
- **`es-m2-2` asks a grammar-terminology question in Spanish** at module 2
  ("¿Cuál es su infinitivo?"), with a Spanish explanation. m2 carries 96 of the
  course's 467 unknown-token occurrences; `es-m2-8` (the graded exit exam) is
  the second-worst lesson in the course.
- **Prose error** `m4.ts:847`: "-ent and -ing endings surface as **-ente**:
  … interesting → interesante" — `interesante` ends `-ante`.
- All 28 teaching lessons end on a non-gradeable "win" card.
- Mastery tests recycle teaching items verbatim (`es-m1-8`: 7 of 12 byte-identical).
- **If Spanish is re-authored, most of this is moot — but the defect CLASSES
  must become gates first, or the re-author reproduces them.**

### Track B — the structural gate ✅
Port `registerModuleBarGuards` + `registerJaModuleContentLints` to es and call
them from every module test. ja: **30 of 30 modules** call them. es: **0**, and
its 19 test files are hand-copied boilerplate with ~8 assertions each.

Of the 27 ja invariants the es pin claims are "CARRIED", **exactly 5 have a test
that fails on violation.** Expect this track to go red before it goes green —
that is the point. Known violations it will surface: 89 production-framed
`sentenceMcq` prompts (inv 24), no distractor-quality lint, no provenance, no
tail-closer check, no ≥5-distinct-types floor, `translate` at 22% against a
stated 15% cap.

Note ⚠️ on `sentenceMcq`: the auditor called all 509 call sites a violation. The
distractors are near-minimal pairs (`pienso`/`penso`/`piensas`), which is a
discrimination drill the ja guide itself endorses. The clean violation is the
**89 production-framed ones**; the rest breach the letter of inv 28 only.

### Track C — the four frozen lists ✅
The recurring defect class. One line each plus a regeneration.

| List | Stops at | Exists | Consequence |
|---|---|---|---|
| `es-quality.test.ts:29` MODULE_ORDER | m17 | m19 | m18/m19 exempt from metacognition + compounding-review floors; `moduleIndex()` returns −1 for them so **an m5 lesson citing an m19 atom counts as prior-module review** |
| `es/esReviewPool.ts` | m17 | m19 | **62 words can never surface in compounding review** — the mechanism the code calls "the #1 differentiator" |
| `placement/tiers.ts:88` | ja, ko | + es | es placement runs the JA spine; `hasSkillTiers()` dead |
| `ja/moduleContentLints.ts:570` COMPLEXITY_FLOORS | m31 | m32 | ja m32 exempt from its own complexity ratchet |

Also: `ja/moduleConformance.test.ts:194` — title says "module ≤ m27", code checks
`n <= 7`. The gate is 20 modules narrower than it advertises. ⚠️

**Fix shape: derive, don't re-hardcode.** `ES_MODULE_ORDER` is the good pattern —
`moduleIndex` *throws* on an unlisted module.

### Track D — French bugs (mine, from 2026-08-18) ✅
- **`frModule.curriculum` returns placeholder junk**, not `[]` — three fake
  English-titled modules (`m1 "Basics"`, `m2 "Everyday phrases"`,
  `m3 "Grammar foundations"`) and eight placeholder lessons, because
  `getMockCourse` has no `fr` branch. It even injects an alphabet-trainer node,
  contradicting `fr/module.ts:19`. The shared conformance gate missed it because
  it only asserts `Array.isArray` — a vacuous assertion.
- **`elidesBefore` is wrong on two classes**: `œuf`/`œil` return false (French
  elides — `l'œuf`); `yaourt`/`yoga`/`onze`/`huit`/`ouate` return true (these
  block elision). The header's "exactly one unpredictable exception" is false.
- **`fr/placementBank.ts:33` requires a flat array**, but es exports
  `{screener, byModule}`. An author copying the es convention gets their
  placement items **silently dropped** — no throw, no failing test. This is the
  exact defect class the file was written to prevent.
- `liaisonListen` does not enforce pin F1 (≥1 non-linking junction) and permits
  a link from `et` (which ends in `t` and passes the consonant test).
- ⚠️ **New representational need**: written-but-inaudible agreement
  (`parle`/`parles`/`parlent` are one sound). Nothing can express "these
  surfaces are homophones", so a listening-build offering both is authorable and
  unanswerable. Fix belongs on the atom (`homophoneSet`), not in a checker.

---

## 4. Sequencing

1. **Track C first** — cheapest, and Track B's provenance gate will read the
   review pool and the module order. Regenerate `esReviewPool`, derive
   `MODULE_ORDER`, register es placement tiers, call `hasSkillTiers`.
2. **Track B second** — land the gates BEFORE re-authoring, so the re-author is
   written against a bar that fails rather than a doc that describes one.
   Ratchet existing violations rather than fixing them inline; the re-author
   retires the debt.
3. **Decide the 2c question** (shared factory core vs per-language) before
   authoring, because the re-author rewrites those factories either way.
4. **Then re-author**, with a Spencer walk checkpoint after the first
   verb-conjugation module.
5. **Track D any time** — fr has no learners, zero urgency, but it is small and
   the `elidesBefore` bug will silently corrupt every fr module authored on top
   of it.

---

## 5. Open decisions

- **`fromModule` restamp policy** for the es re-author (see §1 item 6).
- **Which 2b leaks get generalized** vs declared ja-only capabilities.
- **How far the A2 arc runs** past m19.

## 6. Settled 2026-08-19

- **ES m4 re-authored to zero debt; gender canon lands** (2026-08-20): the
  provenance gate gained a GENDER CANON beside m3's plural canon — a taught
  -o adjective's regular feminine (alta, bonita, roja + their -as plurals)
  folds into the masculine atom, because m4 teaches the rule (exactly as
  "los libros" drills libro from m3 on). Canon only, deliberately NOT the
  real-form lexicon: adding feminines to VOCAB made every «alta» a
  trackable word with no PRIOR and flipped debut/inv-28 ratchets in six
  modules (m4/m5/m7/m9/m12/m13/m14) — tried and reverted same day, reason
  pinned in the guard comment. m4 itself: frameless IR
  (`es/curriculum/ir/m4.ir.yaml`), same 27-atom inventory, all five debt
  categories retired (unknownTokens 55→0 — ratón/elefante/monstruo/cielo/
  examen and later-module nouns replaced by m1–m3 carriers; nonIntroDebuts
  6→0; distractor echoes 7→0; imageMcqReuse 3→0, one image MCQ per emoji
  atom at debut; translate 0.17→0.12). Feminine production drills via
  clozeLit agreement pickers (alta/alto/altos/altas) + build/speaking —
  never as meaning-MCQ distractors in teaching lessons (header records the
  honest scope: L4's order card, L8's mastery items and placement DO offer
  variants — there discrimination IS the skill). Bespoke pins: inv-30 shape
  (18 emoji atoms ↔ 18 image MCQs), rule-card-before-first-feminine, ≥2
  mastery agreement items, no punctuation tile. TTS delta: 66 new clips
  generated + staged (tts-publish/es → 1,115), es.json manifest recopied
  byte-identical. AUTHORED BY SONNET against a pinned brief (dispatch log
  row 2026-08-20) — first ES module on the JA m30 dispatch pattern; the
  reviewer pass caught 4 defects the gates cannot see (a "six of them"
  count, the July -ente/-ante cognate prose error REPRODUCED from the old
  file, two missing muy atom credits, one overclaiming header note).


- French lexical data: derived wordlists ship as a **segregated CC BY-SA 4.0
  file** with attribution; app code and generated sentences stay proprietary.
  FLELex **skipped** — CEFR ordering derived from spoken-corpus frequency
  (Gougenheim + Lexique `freqlemfilms2`) instead. Do not email CENTAL.
- Local-model duty cap **lifted to 1.0** (was 0.8; cost 21% throughput for no
  observed throttling). `--duty 0.8` still works.
- `liaison_listen` / `aspect_choice_cloze` layout: **keep the movement fix**,
  accept the post-commit overflow (42px / 85px at 375×667).
- m17–m19 **stay live**.
- **Step factories stay per-language** (§2c): ES/FR each get their own
  factories with language-specific validators; JA's migration onto the shared
  `mcqDistractorLint` core is deferred until the in-flight JA session lands.
- **ES IR is frameless** (`frame: none`): the es re-author compiles every
  lesson as `template: free` from `mN.ir.yaml` via `scripts/compile-ir-es.mjs`.
  Verb modules will add frames when their re-author reaches them.
- **Re-authored modules register at ZERO debt** (m1/m2 convention:
  `registerEsModuleContentLints` + `registerEsModuleBarGuards` with no `debt`).
  Never add a `debt` entry to admit new content.
- **Surgical retirement is a valid alternative to full re-author** when
  measured debt is small: m3 (6 items) was retired 2026-08-19 by targeted
  edits (translate→build, image-MCQ conversions, proper intro debuts) instead
  of an IR rewrite — judgment on the inventory, not more volume.
- **Plural canonicalization** landed in the provenance lexicon
  (`moduleBarGuards.ts` `esRegularPlurals`/`getEsPluralCanon`): regular plurals
  of taught noun/adjective atoms now count as known. Retired ~60 phantom
  unknown-token debts and exposed 4 real reach-ahead bugs (m4 niñas, m6
  dólares, m8 fiestas, m12 pesos), all fixed in content. Known gap:
  stressed-final -s words (autobús→autobuses) are not expanded.
- **ES audio gate is GREEN** (0 uncovered, ratchet at 0). The no-credentials
  publish path is `tts-publish/es/` (1,049 new mp3s staged, additive only,
  never `--delete`); the updated `es.json` manifest must ship in the SAME
  deploy as the clips. Only upload needs Trevor's AWS creds.
- **FR m1 shipped, full JA-style suite, same day as its gates** (2026-08-19):
  frameless IR (`fr/curriculum/ir/m1.ir.yaml` → `scripts/compile-ir-fr.mjs`),
  27 atoms / 8 lessons / 5 placement items. Shared factories ported into
  `fr/grammarHelpers.ts` with FR validators (elision breach, homophone tiles,
  article-by-construction). Gates all landed WITH the module, all at zero:
  structure lints, bar guards (NO debt parameter exists for FR), fr-quality,
  comprehensibility (ratchet 0), audio coverage (ratchet 0, GREEN — 53 edge
  Denise clips staged in `tts-publish/fr/`, `manifests/fr.json` byte-identical
  in both repos, ships same deploy). Ladder decision recorded in the IR:
  m1 teaches silent finals; liaison deferred to m2 (it re-voices them), handed
  the «huit» silent-h contrast by m1's mastery. m1 is zero-translate (typed
  French waits for accentPolicy — F5). FR stays NON-selectable: the remaining
  blockers are human (Denise voice audition, m1 walk), pinned in
  `frEngine.test.ts`. Collector globs now exclude `m*.test.ts` (a module test
  beside its module cycled back through mockLessons).


**ES m5 re-authored to zero debt (2026-08-20, Sonnet dispatch #2 — the first
verb module).** Same pattern as m4: Sonnet authored `ir/m5.ir.yaml` against a
pinned brief (334k tokens, ~24m, all gates green first review), fable reviewed
IR + compiled output in full. Verb-module decisions now precedent for m6+:
frameless IR (frames-es.mjs is regular-paradigm only; tener is irregular);
tengo/tienes/tiene stay registered atoms (m2 es/eres/soy precedent) while the
conjugation-aware PRIOR hands the rest of the present paradigm to m6+; the L2
paradigm card presents the three forms as a set before any tener production
(bespoke-pinned, the verb analogue of m4's agreement card). Debt retired:
unknowns 17→0 (all carriers verified m1–m4: perro/gato/carro m4, numbers m1,
doctor/doctora m2), non-intro debuts 3→0, full-sentence MCQs 3→0,
distractor echoes 2→0, image reuse 2→0 (9 emoji atoms ↔ 9 first-exposure
MCQs; L8 has zero), out-of-module de/es clozes 3→0 (particle_cloze now blanks
only m5's own mi/tu/su/tener forms/años — that discrimination IS the module),
translate 0.237→0.077. Reviewer caught what the gates can't: (1) a COMPILER
bug — es-ir/assemble.mjs lower1()'d every tile, so «Ana» shipped as tile
"ana"; fixed to sentence-initial-only, which also restored Diego/México/
España tiles in SHIPPED m2 (m2 IR distractor tiles re-cased to match, m4
recompile byte-identical); (2) three identical niña retrievals (L5/L6/L8,
same distractor set — pattern-memorizable; varied). Six bespoke pins in
m5.test.ts (27/27): placement shape, 9↔9 image debuts, paradigm-card
ordering, mastery person+possessive discrimination clozes, tile purity, and
a paradigm-boundary pin (no tenemos/tienen/tenéis — comprehensible to the
lexicon-aware gate but untaught to the learner). TTS delta: 46 clips,
manifests byte-identical, tts-publish/es 1,161 files. ES tree 476 green.
**Spencer's walk of m5 is owed BEFORE m6+ replicates the verb pattern (JA
trap #2).**

## 7. Not verified

Nothing was rendered in a browser. The mobile Playwright gate and the
authenticated e2e suite were not run. The full 50-row invariant table and the
ja m1–m2 per-step counts are auditor-reported. Whether the ~1,974 mp3s in
`lingo-data` cover the 825 missing es texts is unknown — that repo is outside
this working tree.
