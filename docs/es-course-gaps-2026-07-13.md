# ES course — missing pieces & wanted changes (2026-07-13)

> **STATUS 2026-07-15: §"New trainers/steps" items 1–7 ALL SHIPPED** (ConjugationGrid,
> agreement_cloze, accent accept-but-flag + AccentBar, es match_pairs +
> language-keyed pad pool, es dialogue_listen, cloze exercisedAtomSurfaces,
> vocabTextMcq), plus most of the ja-hardcode burn-down (vocab browser,
> lessonAtomIndex/SRS loop, derived test-outs, course deck, milestones,
> command palette — for es AND ko). Current state + remaining deltas:
> `docs/es-ja-parity-2026-07-15.md`. Kept below for provenance.

Notes from the Spanish A1 mass-authoring session. Nothing here blocks the shipped
course; these are the gaps we authored AROUND, ranked by learner impact. See
`docs/es-course-spine-2026-07-13.md` for the course itself and
`docs/research/multi-language-scoping-2026-07-11.md` §2 for the original Romance
capability analysis.

## New trainers/steps Spanish wants (the Romance engines)

1. **ConjugationGrid — person×tense matrix trainer.** The single biggest gap.
   Spanish's core game is the verb matrix; our 1-D conjugation practice page
   (built for ja forms, adapted for ko) can list forms but can't drill the
   person×tense grid. Data is ALREADY SHIPPED: `es/conjugationTables.ts` has 10
   verbs × 18 forms (present/preterite/imperfect × 6 persons) with labels, and
   `practiceDataLoader.getConjugationVerbEntries("es")` serves it. The scoping
   doc's "generalized morphology trainer" (paradigm axes declared per language,
   distractors from adjacent cells) is the design. A2 content (preterite arc)
   should not ship before this exists.
2. **AgreementCloze step type.** Gender/number concordance drilled as a SET
   (multi-blank: "L__ cas__ blanc__s"), graded together. Interim: m3/m4 fake it
   with single-blank particle clozes and hand-balanced MCQ distractors. Atom
   `gender` metadata is already populated course-wide to feed it.
3. **Accent-aware grading mode.** Today translate steps accept full
   diacritic-stripped variants (incl. ñ→n, so "anos" passes for "años" —
   deliberate typability call, Duolingo-parity). The right end state:
   accept-but-flag ("don't forget the ñ") + an accent bar above the input
   (the scoping doc's input-layer primitive). Interim variants are authored
   into every acceptedAnswers list, so flipping to accept-but-flag later is a
   grading-layer change only.
4. **es match_pairs factory + language-aware pad pool.** ko never had one
   either; `padMatchPairsFloor`'s meaning-fill backfills from JA atoms, so an
   es grid under 6 pairs would get Japanese fills. Until the pad pool is
   language-keyed, es lessons ship zero match grids (agents wanted them in
   nearly every module — it's the natural L2–L5 "match" rung).
5. **dialogue_listen factory for es.** The step type is universal but only ja
   has a factory; L7 integration lessons emulate dialogues with info steps +
   listening_comprehension. With es-MX Dalia+Jorge clips, real two-voice
   dialogues are within reach (no voice-coloring hack needed — two actual
   voices).
6. **Conjugation-aware cloze.** Reported by 5 of 8 authoring agents: `cloze()`
   credits only its `correctParticle` atom and takes no
   `exercisedAtomSurfaces`, so (a) a cloze can't serve as the spaced follow-up
   for a noun in its carrier sentence, and (b) drilling person-forms
   ("puedo/puedes/puede") shoehorns verb forms into the particle slot. Add an
   optional surfaces param + a person-form cloze variant.
7. **Text-only recognition MCQ factory.** `vocabMcq` requires emoji, and the
   bundled Noto subset is missing many high-value glyphs (computadora, queso,
   naranja, mesa, tarjeta…), so those words skip the image-recognition rung
   entirely. Either widen the Noto subset or add a text-front variant.

## Deliberately skipped for A1 (fine as-is)

- Alphabet trainer config (m1 teaches pronunciation in-lesson; es
  practiceTypes trimmed to general-only).
- Reactive grammar micro-teaching (grammar_rule + grammarPointId +
  es-grammar-points.json) — KO precedent: infoStep(variant "grammar")
  everywhere. Wiring it for es is phase 2; the ja system is language-agnostic
  once the JSON exists.
- Sidequests, stories, counters (N/A), kanji-analog (N/A), vosotros drills
  (LatAm course; culture-noted in m2).

## ja-hardcoded surfaces es now visibly lacks (burn-down candidates)

Fail-soft today (empty/hidden, no crashes) — each is a `!== "ja"` gate:

- `vocabData.buildVocabRows` — vocab browser page empty for es (and ko). The
  es atom set (surface/gloss/emoji/gender) is richer than what the page needs.
- `lessonAtomIndex` — lesson→atom index empty → downstream enriched features
  (flashcard due summaries, subscription queue) ja-only.
- `getDerivedTestOutItems` — derived module test-outs ja-only; es uses the
  authored placement bank for test-outs (4 items/module vs ja's 12 derived).
  Generalizing the deriver is mostly removing the gate — es steps carry
  exercisedAtoms the same way.
- Grammar SRS / PracticeGrammarPage — ja-only (es skipped grammar points, so
  nothing to show yet anyway).
- `notoEmoji` fallback resolver + `srsStorage.canonicalize` bare-id default
  `ja:` — cosmetic/latent respectively.
- `mockCourse.getMockCourse` — now THREE hand-branches (isJapanese/isKorean/
  isSpanish); the es branch delegates to `buildSpanishCourse()` (pathway
  derived from content, ~10 lines). Migrating ja/ko to the same derive-from-
  content pattern would delete most of the 97KB file.
- ko/module.ts comment claims a browser speechSynthesis fallback that does
  not exist in src/ — misleading; either build the fallback or fix the
  comment. (es sidesteps it: real mp3 clips shipped.)

## Code added/changed outside es/ this session (all reviewed-size)

- `shared/tts/index.ts` — `setDefaultTtsLang()`; parameter defaults resolve
  to the active course language (LanguageContext stamps it). ja behavior
  unchanged (default starts "ja").
- `LanguageContext` — one effect to stamp the TTS default.
- `languageConfig.ts` — es route-enabled; es practiceTypes trimmed.
- `registry.ts`, `mockCourse.ts` (isSpanish branch), `mockLessons.ts`
  (ES lessons in index), `practiceDataLoader.ts` (es cases),
  `practiceUnlockConfig.ts` (ES_FEATURES).
- lingo-core `scripts/tts/generate.py` — es voice config (Dalia primary,
  Jorge alt). New emitter: `es/__tests__/emitTtsDeck.test.ts` (env-gated,
  walks runtime step objects — the ja regex/charset emitter can't work for
  Latin-script languages).
