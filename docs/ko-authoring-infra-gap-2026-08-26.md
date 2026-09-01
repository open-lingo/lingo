# KO authoring-infrastructure gap inventory — vs JA/ES (2026-08-26)

**Purpose:** precise inventory of where Korean course authoring infrastructure lags
Japanese (and Spanish where the ES pattern is the one to copy), so a KO re-author
can be planned on the JA/ES pattern. Inventory only — no product code changed.

**Companion docs:** `docs/ja-ko-parity-audit-2026-07-15.md` (July engine-parity audit —
partially stale: KO now HAS a TTS manifest, romanization, readingAnnotation, and a
phase-1 conjugation capability), `docs/ko-freq-level-research-2026-08-26.md` (today's
frequency/level research — treat as the authoritative §7 companion),
`docs/course-design-learnings-2026-08-21.md` (the language-neutral doctrine),
`docs/es-lesson-authoring-guide.md` (the porting playbook — its §0 provenance table
is the template for how a KO guide should account for every JA section).

Headline numbers:

| | JA | ES | KO |
|---|---|---|---|
| Content modules | m1/m2 kana + m3–m38 (N5+N4) | m1–m10 (§13 tier) | m1/m2 Hangul + m3–m27 |
| Authoring source of truth | YAML IR (m6, m10–m38) + hand TS (m3–m5, m7–m9) | YAML IR → generated TS (m3–m10) | hand-authored TS only |
| grammarHelpers factories | 40+ exports, 2,240 LOC | 22 exports, ~810 LOC | 12 exports, 368 LOC |
| Course-wide quality gates | ~25 ratchet suites (`ja/__tests__/` + `lesson/data/`) | `es-quality` + `es-course-integrity` (365 LOC) | 3 files, mostly shape checks |
| Review-interleave | pool + weighted pickers + tails, per-module review lessons | generated `esReviewPool.ts` + ≥60%-compounding gate | **one** review lesson in the whole course (`ko-m2-review`) |
| TTS | 4-stage module-gate, 2 dialogue voices, per-factory emitter | es.json manifest, Dalia voice | 1,526-clip manifest, SunHi only, no gate stage |
| Pinned invariants / guide | `authoring-invariants-pinned.md` + guide | `es-authoring-invariants-pinned.md` + guide | **none** |

---

## 1. IR / compiler

**JA** — two-phase runtime pipeline:
- IR source: `src/features/languages/ja/curriculum/ir/mN.ir.yaml` (m6, m10–m38; m3–m5
  and m7–m9 remain hand-written TS).
- Build step: `scripts/compile-ir.mjs` (126 lines) — YAML → committed `mN.ir.json`,
  plus a **priorVocab/priorAtoms computation** across all earlier IR modules and the
  hand-written early modules (quoted-hit scan of `courseAtoms.ts`). This is the
  machinery behind the untaught-distractor guard; its header documents three real
  regressions it exists to prevent.
- Runtime compiler: `src/features/lesson/data/moduleCompiler.ts` (~94 KB) —
  `compileModule(json)` builds `LessonContent[]` at import, satisfying the
  moduleBarGuards invariants BY CONSTRUCTION (step-type assignment, no-adjacent-same,
  review tail, capstone window). Deeply Japanese: kana tokenization, kanji surface
  substitution, verb-class morphology, register audiences. `diagnoseModule` is the
  author⇄compiler feedback channel. Curriculum files like `m30-neo.ts` are thin
  wrappers: `compileModule(m30Ir)`.
- Spec: `docs/content-ir-spec-2026-07-20.md`.

**ES** — codegen pipeline (the pattern for KO):
- IR source: `src/features/languages/es/curriculum/ir/m3.ir.yaml`…`m10.ir.yaml`.
- `scripts/compile-ir-es.mjs` (544 lines) — YAML → **generated TS source**
  (`es/curriculum/mN.ts`, headed "GENERATED. Do not hand-edit"), importing the same
  `grammarHelpers` factories a hand author would. Templates/assembler:
  `scripts/draft/es-ir/templates.mjs` (`topicLesson`, `makeAnchor`, `freeLesson` —
  the step ORDER lives here) and `scripts/draft/es-ir/assemble.mjs` (emits literal
  `dialogue_sim` steps with §13.6 compile-time checks). Frame + drafted-pool mode
  for verb modules, **frameless mode** (every sentence literal in the IR) for
  phrase modules like m3. `--check` validates without emitting.
- The es guide §2 states explicitly why ES did not port the ja compiler: the 94 KB
  runtime compiler is mostly Japanese linguistics; codegen through existing factories
  passes existing gates by construction.

**KO** — no IR at all. 27 hand-authored files
(`src/features/languages/ko/curriculum/m3.ts`…`m27.ts` + `m1-*.ts`, `m2.ts`),
importing 12 thin factories from `ko/grammarHelpers.ts`. No priorVocab computation,
no compiler diagnostics, no generated-file discipline.

**What KO adopting the IR takes:** follow ES, not JA — `scripts/compile-ir-ko.mjs`
+ `scripts/draft/ko-ir/{templates,assemble}.mjs`, emitting TS through KO factories.
Prereqs: factory parity (§4) and a morphology bridge for frame mode
(`ko/conjugationEngine.ts` exists — phase 1, verbs+adjectives, one cell across stem
classes per `docs/ko-conjugation-phase1-2026-07-15.md`; the ES `morph-es.mjs`
analogue would wrap it). Frameless mode needs no morphology and can carry the first
re-authored modules (that is exactly how ES m3 shipped). The priorVocab machinery
ports cleanly (Korean HAS spaces, so the substring-match hazards compile-ir.mjs
documents are milder, but the quoted-hit rule should be kept).

## 2. Authoring guidelines

- **Language-neutral doctrine:** `docs/course-design-learnings-2026-08-21.md`
  (build/gate/ship laws from the ES/FR restart), `docs/pedagogy-principles-2026-07-05.md`,
  step-type doctrine (dialogue_sim favorite, deduction-first, no hollow cards, no
  typed translate at beginner tier, max-acceptance tile banks), interleave-don't-block-teach.
- **JA:** `docs/lesson-authoring-guide.md` (§13 = locked M8+ template) +
  `docs/authoring-invariants-pinned.md` ("paste VERBATIM into every dispatch" — note
  its §"Step-type bans" is explicitly marked *ja only — es/ko differ*).
- **ES:** `docs/es-lesson-authoring-guide.md` — §0 accounts for every ja-guide
  section (adopted / adapted / N-A), §13 is the interaction doctrine (debut policy,
  sentence ramp, deduction contract, dialogue_sim-as-integration-beat, retention
  rhythm §13.9). Plus `docs/es-authoring-invariants-pinned.md`.
- **FR:** both exist too (`fr-lesson-authoring-guide.md`, `fr-authoring-invariants-pinned.md`)
  — the restart pattern is now exercised twice.
- **KO: neither exists.** No `ko-lesson-authoring-guide.md`, no
  `ko-authoring-invariants-pinned.md`. The only KO authoring docs are the
  conjugation phase-1 plan, the 6k-vocab sourcing memo, today's frequency research,
  and the stale July parity audit. **Gap:** the KO guide must be written the ES way
  (provenance table over the ja+es guides; KO-specific sections for
  batchim/liaison pronunciation notes, 은/는·이/가 particle alternation doctrine,
  honorific-register policy, RR romanization fade) before any module is dispatched.

## 3. Gates & tests

**`npm run module-gate` (`scripts/module-gate.mjs`) is JA-hardcoded end to end:**
manifest path `src/shared/tts/manifests/ja.json`, deck path
`../lingo-data/data/test_decks/ja-hiragana-curriculum.json`, hash prefix `ja:<text>`,
curriculum dir `ja/curriculum`, lesson-id regex `ja-m\d+-neo…`, stage 2 runs
`emit-tts-deck.mjs` (JA), stage 6 runs `exposure-audit.mjs` (JA). Stages: (1) scoped
vitest, (2) TTS emit + manifest coverage diff, (3) incremental tsc, (4) visual-QA
contracts + capture (auto-derived lesson ids), (5) FULL vitest CI parity,
(6) report-only exposure audit. ES has no module-gate either (its gates are the
vitest suites + `scripts/es-smoke.mjs` + reading the generated file); KO has nothing.

**Course-wide ratchet suites and their language scope:**
- `ja/__tests__/` (15 files): `moduleConformance.test.ts` (314 lines — attribution
  invariants, no-info-step, no-phrase_card, ends-gradeable, no stranded SRS atoms),
  `irAtomRegistration.test.ts` (the "reverse arrow" — every IR new LEMMA must have a
  courseAtoms row; inflections must NOT), `fromModuleDrift`, `atomExposureAudit`,
  `recognitionExposure`, `homographTeaching`, `homophoneAtomResolution`,
  `dialogueSpeakerRegistry`, `registerCueGrading`, `acceptedAnswerCollisions`,
  `verbGlossFidelity`, plus `moduleBarGuards.ts` / `moduleContentLints.ts` helpers.
- `src/features/lesson/data/*.test.ts` content gates (`untaughtOptions`,
  `distractorDebut`, `lessonDensity`, `audioCoverage`, `glossBeforeProduction`,
  `challengeNovelty`, `kanaWordIntroOrder`, `sceneVocabGate`, …) iterate the **JA IR
  modules via `compileModule`** — zero `ko` references (verified by grep). They gate
  JA only.
- **ES:** `es/curriculum/es-quality.test.ts` + `es-course-integrity.test.ts`
  (365 lines total): checkpoint zero-new, module ends on dialogue_sim, 10–25-step
  density, no adjacent same-type, no 4+ consecutive selection steps, ≥2 generation
  steps (≥1 spoken) per lesson, zero typed translate, ≥60% compounding review,
  recall law, emoji-means-one-thing, cast closed-world, unique step ids. Plus
  `es/__tests__/moduleConformance.test.ts` (127 lines, includes placement-bank
  full-coverage and atom-id-uniqueness).
- **KO:** `ko/__tests__/introBeforeGraded.test.ts` (NEW — m3 only, an extendable
  `MODULE_LESSONS` table; conservative scope: owned vocab atoms, intro =
  `phrase_card`/`word_image_mcq`), `ko/__tests__/moduleConformance.test.ts`
  (105 lines — identity/slot-shape checks only: namespacing, particles/classifiers
  populated, alphabet sections, placement m1–m3, ADR-011 omissions),
  `ko/__tests__/koSiblingSets.test.ts`. Per-module `mN.test.ts` files are **shape
  guards** (lesson count, unique ids, pathway-node-resolves), not content-quality
  gates.

**KO parity:** port the ES 365-line quality/integrity pair (adjusting the KO step
mix), grow `introBeforeGraded` into a per-module conformance suite (or fold into a
deep ko moduleConformance), and parameterize `module-gate.mjs` by language
(`--lang=ko`: ko manifest, `ko-curriculum.json` deck, ko curriculum dir, ko id
regex). An `irAtomRegistration` analogue matters the moment a KO IR exists.

## 4. Step-type availability & helper factories

`src/features/languages/ko/grammarHelpers.ts` (368 LOC, 12 exports): `slotFor`,
`phrase`, `vocab`, `cloze`, `sentenceMcq`, `build`, `translateStep`,
`listeningBuildSentence`, `listeningCompSentence`, `speaking`, `infoStep`, `vocabMcq`.

**Missing vs JA (`ja/grammarHelpers.ts`, 2,240 LOC):** `dialogueSim` /
`dialogueListen` / `dialogueLesson`, `grammarRule`, `selfExplain`,
`reviewMatchPairs`, `pickReviewAtoms` / `pickReviewAtomsWeighted` (+ review pool),
`audioImageMcq`, `audioMeaningMcq`, `translationMcq`, `transformBuild`,
`conjugationCloze`, `conjugationTransform`, `storyComprehension`,
`WORD_IMAGE_MCQ_BLOCKLIST` / `withoutMcqBlocked`, and the answer-hygiene asserts
(`assertNoSameAnswerCluster`, `assertAnswerRotation`, `assertNoConsecutiveSame`).
JA-specific and NOT needed: `kanjiReading`, `resolveEligibleKanjiAtomId`,
`buildSentenceAnnotation` (KO reading annotation is registry-driven RR).

**Missing vs ES (the realistic near-term target, `es/grammarHelpers.ts`):**
`matchPairs`, `capstoneMatchPairs`, `dialogueListen`, `selfExplain`, `vocabTextMcq`,
`pickReviewSurfaces`, `reviewMatchPairs`, a `KO_MODULE_ORDER` export
(ES's `ES_MODULE_ORDER` anchors its conformance tests). ES's `agreementCloze` is
gender-specific — the KO analogue would be a particle-alternation cloze
(은/는 vs 이/가 vs 을/를 by batchim), which no factory currently provides.

Note the current KO curriculum uses **no dialogue or match_pairs step at all**
outside `_hangulRowHelpers.matchBlocksToRomaji` (jamo drill) — m10+ "mini-dialogue"
lessons are themed `listeningCompSentence`/`build` sequences, not dialogue steps.
Step renderers themselves are language-agnostic (per the July parity audit §1.3),
so this is purely a factory + content gap.

**Alphabet-row helpers:** `ja/curriculum/_consonantRowHelpers.ts` (1,105 LOC, 21
exports incl. the prior-row review machinery below) vs
`ko/curriculum/_hangulRowHelpers.ts` (321 LOC, 10 exports). KO lacks:
`translateMcq`, `pickReviewWords` + `M1_REVIEW_POOL`, `padMatchPairsToTarget`,
`M1_PRIOR_KANA_POOL` / `M1_PRIOR_WORDS_POOL`, `priorKanaRecognition`,
`priorKanaSymbolToSound`, `priorWordMcq`, `priorWordBuildSentence`,
`priorRowReviewTail`, `matchKanaToRomaji` (KO has the jamo-block variant).

**Dialogue speakers:** `ja/dialogueSpeakers.json` is the single source of truth for
speaker→voice routing (male/female/neutral name lists), consumed by
`DialogueListenStepView`, `emit-tts-deck.mjs`, and guarded by
`dialogueSpeakerRegistry.test.ts` (a course speaker absent from the registry fails
the build). **No KO equivalent exists** — no speakers file, no registry test, and no
second KO voice (see §6), so `dialogue_sim`/`dialogue_listen` for KO would today
play every speaker in the same female voice, the exact m8–m10 JA bug the registry
was built to kill.

## 5. Review-interleave machinery

**JA:** `M3_M7_REVIEW_POOL` + `pickReviewAtomsWeighted` / `pickReviewAtoms` /
`reviewMatchPairs` in `ja/grammarHelpers.ts`; `priorRowReviewTail` + prior-kana/word
pools in `_consonantRowHelpers.ts` (used by every m1/m2 row lesson); the house
review tail applied by `moduleCompiler` per IR lesson; plus the shared
`lesson/data/` machinery (`buildReviewTailSteps.ts`, `kanaReviewTails.ts`,
`moduleReviewSchedule.ts`, `reviewTailSrs.ts`, `derivedReviews.ts`,
`dynamicReviewPrefix.ts`).

**ES:** `esReviewPool.ts` — generated by `scripts/gen-es-review-pool.mjs` (a
cycle-safe snapshot of every `ES_M{N}_ATOMS` declaration) — consumed by
`pickReviewSurfaces` / `reviewMatchPairs`, and RATCHETED by the es-quality
"≥60% of lessons reference a prior-module item" gate.

**KO: none of it.** No review pool, no picker, no review-match-pairs, no review
tails, and exactly one review lesson in the entire course (`ko-m2-review`, Hangul
tier — `src/shared/domain/mockCourse.ts:1402`). This matches the recent audit's
"no review-interleave machinery" finding. **Where KO equivalents go:**
`scripts/gen-ko-review-pool.mjs` → `ko/koReviewPool.ts` (the ES generator is ~60
lines and ports nearly verbatim since KO also declares per-module atom arrays),
`pickReviewSurfaces`/`reviewMatchPairs` into `ko/grammarHelpers.ts`, prior-row
tails into `_hangulRowHelpers.ts`, and the compounding-review ratchet into the new
ko-quality suite.

## 6. TTS pipeline

- **Emitters:** JA `scripts/emit-tts-deck.mjs` (387 lines) is per-factory-regex over
  source + IR JSON, routes dialogue lines into keita/nanami buckets via
  `dialogueSpeakers.json`, and emits multiple decks (silently skips unknown factory
  shapes — the documented landmine). KO `scripts/emit-ko-tts-deck.mjs` (79 lines)
  already exists and is *simpler and safer*: script-detection (any pure-Hangul
  string ≤40 chars) over `ko/curriculum/*.ts` + `grammarHelpers.ts` +
  `placementBank.ts` → `../lingo-data/data/test_decks/ko-curriculum.json`. Because
  it is string-scrape not factory-match, new KO factories are covered automatically
  — but **generated-TS or IR-JSON content would need the source globs extended**,
  and `ko/frequencyAtoms.ts` (2,998 drip words) is NOT scanned, so frequency-deck
  cards fall back to browser `speechSynthesis`.
- **Manifest:** `src/shared/tts/manifests/ko.json` — schema 2, **1,526 clips**, zero
  overrides (JA: 4,449 hashes in ja.json + 1,415 in ja-keita.json; ES ~1,000).
- **Voices** (`../lingo-data/pipeline/tts/generate.py`): supported set is
  `ja, es, fr, ko, ja-keita`; KO = `ko-KR-SunHiNeural` only. There is **no
  `ko-<male>` pseudo-language** (the `ja-keita` trick), so KO dialogue cannot have
  distinct speaker voices until one is added (edge-tts ships male ko-KR voices,
  e.g. InJoon — needs an audition pass like Denise/FR had).
- **Gate:** module-gate stage 2's emit+coverage-diff applies ONLY to JA (paths
  hardcoded, §3). Nothing fails a build when a KO lesson references an unclipped
  phrase; coverage is manual (`node scripts/emit-ko-tts-deck.mjs` + regenerate).
  `audioCoverage.test.ts` likewise gates JA IR modules only.

## 7. Frequency / vocab tooling

Authoritative detail: `docs/ko-freq-level-research-2026-08-26.md`. Summary of the
infra-relevant asymmetry:
- **Runtime drip:** KO is *ahead* — `ko/frequencyAtoms.ts` (2,998 atoms, real NIKL
  corpus ranks, KOGL Type 1, generated by `scripts/ingest-ko-frequency.mjs`) vs
  JA's registry-order proxy over `fromModule:"future"` atoms (`ja/frequencyAtoms.ts`,
  61 lines). Known KO defects: homograph-smearing in the rank join, written-register
  source, grade A/B/C parsed-then-dropped, and the **raw NIKL files are not on this
  machine** (gitignored dir with SOURCES.txt inside it) — the ingest cannot
  currently be re-run, which any module-count change in a re-author requires.
- **Authoring layer:** JA has `docs/data/ja-top500-cejc.json`, `ja-core6k-order.json`,
  `ja-neo-vocab.json` feeding `scripts/authoring-context.mjs` and the exposure
  audit. **KO has zero `docs/data/` files.** The research doc's proposal
  (`ko-graded-vocab.json` generator; `ko-top500-spoken.json` blocked on the Modu
  corpus agreement — an owner decision) is the plan of record.
- **Exposure audit:** `scripts/exposure-audit.mjs` is JA-hardcoded (ja curriculum +
  IR walk, `ja/courseAtoms.ts`, CEJC ranks, JA character-name blanking, kana regexes).
  A KO port is mechanical once `ko-graded-vocab.json` exists (interim: written-2002
  ranks with the register caveat) — Korean spaces actually make the counting easier.
  KO top-100 coverage is currently ~32% (vs JA 63% at its audit), so the port has
  immediate steering value for module word budgets.

## 8. SRS / atom conventions

- **Ids:** KO `ko:<surface>` with optional `-<suffix>` (`idSuffix` — just added, one
  user so far: `ko:이-subj`), deliberately matching the frequency registry's
  `ko:무-02` convention (shared SRS key space, 0 collisions measured). JA uses
  `canonicalAtomId` + curated sibling/homograph machinery (`jaSiblingSets.ts`,
  `homographTeaching.test.ts`, `homophoneAtomResolution.test.ts`,
  `acceptedAnswerCollisions.test.ts`). KO has `koSiblingSets.ts` (+ test) but no
  homograph-teaching or accepted-answer-collision gates; the frequency research
  shows KO homographs are a live hazard (이/말/한/수 senses), so a KO
  homograph-id doctrine (when to `idSuffix`, digit-suffix alignment with the NIKL
  key) belongs in the pinned invariants.
- **`introducedByLessonId`:** JA-only field (`ja/courseAtoms.ts`;
  `lesson/data/lessonAtomIndex.ts` documents the semantics — a static entry
  SUPPRESSES the module-fallback unlock). KO atoms rely wholly on the `fromModule`
  fallback. That is fine until per-lesson attribution matters (review tails,
  seed-on-unlock granularity); a re-author that adds it must respect the JA
  landmine (re-pointing can orphan fallback-dependent lessons).
- **Registration ratchet:** JA's `irAtomRegistration.test.ts` (lemma-must-register /
  inflection-must-NOT) has no KO analogue; the same "new atoms re-tokenize the whole
  course" hazard applies to KO tile banks the moment a KO tokenizer/priorVocab
  pipeline exists.
- `fromModule: "future"` backlog-tagging exists in both; KO's `KoAtomSource` union
  also carries `"sidequest-survival"`.

## 9. Other things a re-author will trip on

- **Romanization fade:** `src/shared/settings/romanizationAutoFlip.ts` constants are
  JA module numbers (hiragana M7 / katakana M17 / build-tile M5) though its id
  regex already accepts `ko-mN`. KO's `readingAnnotation` is registered with
  `fadeOnMastery: false` (`ko/module.ts:198`) — RR never fades. A KO fade doctrine
  (which module RR turns off) needs a decision + constants + tests.
- **Placement bank:** `ko/placementBank.ts` covers screener + byModule **m1–m3
  only** (15 items); JA covers m1–m27, and ES ratchets full coverage in its
  conformance test. The KO conformance test currently *asserts the small bank*, so
  extending placement means updating the test expectation too.
- **Stories:** KO has 5 reader stories (`src/features/practice/content/ko/stories.ts`;
  mockCourse story nodes at m3/m5/m7/m9/m10) — present but far sparser than JA, and
  no story-authoring pipeline exists for any language (hand-authored everywhere; not
  a KO-specific gap).
- **Learner-sim / QA walks:** `docs/learner-sim/` holds JA (m1–m38), ES (m1–m10) and
  FR-proto walk findings — **zero KO entries**. `scripts/course-qa/walk.mjs` (the
  local-model fresh-learner walker) is ES-hardcoded (derives persona knowledge from
  `esReviewPool.ts`). ES doctrine made learner-sim walks part of the gate; KO parity
  needs the walker parameterized (trivial once `koReviewPool.ts` exists) and a
  `docs/learner-sim/ko-*` convention.
- **Smoke:** `scripts/es-smoke.mjs` walks the ES routes headlessly; no ko-smoke.
  The `/:lang/qa` test-drive page (`App.tsx:582`) is language-parameterized and
  should work for `/ko/qa/...` — verify early rather than assume.
- **`scripts/authoring-context.mjs`** (the per-module authoring briefing) is
  JA-only (ja courseAtoms + ja IR grammar-point derivation). A KO variant is
  quality-of-life for dispatched authoring waves.
- **Conjugation:** trainer port status per `docs/ko-conjugation-phase1-2026-07-15.md`
  — `ko/conjugationEngine.ts` + `conjugationTables.ts` exist and are registered on
  `koModule.conjugation`; 82 frequency atoms carry conjugation links. The re-author
  should route KO verb-form steps through it (the `conjugationCloze`/
  `conjugationTransform` factories in §4) rather than hand-spelling forms.
- **Explicit N/A (don't build):** `secondScript` (Hanja deferred by design),
  `symbolMastery`, kanji-style furigana machinery, `importMatch` (Anki import) —
  ADR-011 omissions the KO conformance test pins.
- **mockCourse registration:** KO modules/lessons are hand-listed in
  `src/shared/domain/mockCourse.ts` (~254 `ko-m` references). The ES guide's §10
  "seven silent registration points" applies to KO too and should be enumerated in
  the KO guide (mockCourse node, curriculum index, review pool regen, TTS emit,
  placement, atoms, tests).

---

## KO parity punch-list (ordered)

"Blocks" = must exist before/at the start of content authoring on the ES pattern;
"trails" = can land during or after the first re-authored modules.

1. **Pinned invariants + KO authoring guide** (`docs/ko-authoring-invariants-pinned.md`,
   `docs/ko-lesson-authoring-guide.md` with an es-guide-style §0 provenance table;
   settle particle-cloze doctrine, honorific register policy, homograph `idSuffix`
   rules, RR-fade decision) — **M, blocks.** Gates-first is the house law; the
   guide is what dispatches are pasted from.
2. **Quality gates: port the ES pair** (`ko-quality.test.ts` +
   `ko-course-integrity.test.ts`; density, no-adjacent-same, generation minimums,
   compounding-review ratchet, emoji-uniqueness, cast closed-world) and grow
   `introBeforeGraded` module-by-module — **M, blocks** (they define "done" for
   every re-authored module; write them against m3 first).
3. **Factory parity in `ko/grammarHelpers.ts`** — `dialogueSim`, `dialogueListen`,
   `selfExplain`, `matchPairs`/`capstoneMatchPairs`, `vocabTextMcq`,
   `grammarRule`, particle-alternation cloze, `conjugationCloze`/`conjugationTransform`
   (over the existing engine), answer-hygiene asserts — **L, blocks** (the lesson
   template is made of these).
4. **Review-interleave:** `scripts/gen-ko-review-pool.mjs` → `ko/koReviewPool.ts`,
   `pickReviewSurfaces` + `reviewMatchPairs`, prior-row tails in
   `_hangulRowHelpers.ts`, compounding ratchet in gate #2 — **M, blocks.**
5. **KO dialogue voices:** second `ko-<voice>` pseudo-lang in
   `lingo-data/pipeline/tts/generate.py` (audition a male voice), a
   `ko/dialogueSpeakers.json` + registry test, emitter routing — **S/M, blocks
   dialogue_sim authoring** (the favorite step type; without it every speaker is
   SunHi).
6. **KO IR pipeline** (`scripts/compile-ir-ko.mjs` + `ko-ir` templates/assembler on
   the ES codegen pattern; frameless mode first, frame+morph mode once the
   conjugation bridge lands; priorVocab computation) — **L, blocks scale** (m3-style
   frameless modules can start as soon as #1–#4 exist; the assembler must land
   before the volume wave).
7. **Module-gate parameterization** (`--lang=ko`: ko manifest/deck/curriculum/id
   regex; wire `emit-ko-tts-deck` + coverage diff as stage 2) — **S, can trail the
   first module but must precede the wave** (the one-command "is mN ready" answer
   is what keeps a wave honest).
8. **Vocab authoring layer:** re-download NIKL raws (SOURCES.txt out of the ignored
   dir), fix the homograph join, re-emit grades, generate
   `docs/data/ko-graded-vocab.json` per the 2026-08-26 research doc — **M, blocks
   spine planning** (module word budgets come from it), parallelizable with #1–#4.
9. **KO exposure audit** (port `exposure-audit.mjs` over the graded/ranked list;
   written-register interim, spoken list blocked on the Modu agreement — owner
   decision, surface to Spencer separately) — **S, trails.**
10. **Placement bank m4+** regenerated per re-authored module (+ conformance test
    update) — **M total, trails per module.**
11. **Learner-sim generalization:** `course-qa/walk.mjs --lang=ko` off
    `koReviewPool.ts`; `docs/learner-sim/ko-*` findings convention; a ko-smoke
    clone — **S/M, trails the first module, part of each module's gate thereafter.**
12. **TTS drip coverage:** extend `emit-ko-tts-deck.mjs` sources to
    `frequencyAtoms.ts` (or accept browser-TTS for drip words as a decision) —
    **S, trails.**
13. **`authoring-context.mjs` KO variant** — **S, trails** (quality-of-life for
    dispatched waves).
14. **KO `irAtomRegistration` analogue** (lemma-registration ratchet) — **S, lands
    with #6.**

Out of scope by design: Hanja/secondScript, symbolMastery, Anki importMatch
(ADR-011), and the full conjugation-trainer generalization (tracked separately in
the July parity audit §2).
