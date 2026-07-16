# JA ↔ KO Feature-Parity Audit + Conjugation-Trainer Korean-Port Plan

**Date:** 2026-07-15
**Scope:** `lingo/` React app only (frontend). AUDIT + PLAN — no product code changed.
**Priority:** bringing the conjugation trainer to Korean (Part 2).

---

## 0. Bottom line up front

- The app has already been **generalized into a `LanguageModule` registry** (`src/shared/language/registry.ts`) with two registered languages: `jaModule` and `koModule`. KO is a **real, registered module with a full m1–m27 curriculum** — the docs (`docs/CLAUDE.md`, which still describes a JA-only `mock-ja-m*` world) are stale. Most *lesson-player* surfaces are already language-agnostic.
- **KO is structurally present but content-light**: ~52% of JA's vocab atoms (389 vs 750), ~19% of authored curriculum lines (14.6k vs 75.8k), **zero TTS audio** (empty manifest vs 4,884 JA clips), placement reaching only m3 vs m27.
- **The conjugation trainer is the single largest engine-level (not content-only) gap.** It is entirely Japanese-hardwired and **bypasses the language-module abstraction** — it imports `features/languages/ja/conjugationEngine` + `conjugationTables` directly across 8 files. KO is not surfaced it at all (gated out in `practiceUnlockConfig.ts` and `PracticeGrammarPage.tsx`).
- There is a **dead generic `ConjugationCapability` slot** on `LanguageModule` that both languages populate but **nothing consumes** (verified: zero readers of `module.conjugation`). KO even wires a 1-verb table into it. The correct port makes the trainer consume that slot.

**Conjugation port verdict:** the trainer's *interaction scaffolding* (session round-robin, FSRS session-rating, MCQ card state machine, hub tiles, learn-ahead, combo algebra) is reusable in shape but every file is JA-typed; the *linguistic core* (engine, tables, trainer types, distractors, cheat-sheet, kanji/furigana rendering, Track-B grammar points) is net-new for Korean. Rough effort: **Large** (generalize + de-JA the surface) **+ Medium/Large** (author Korean conjugation content, linguist-reviewed). Phase-1 minimal-viable KO trainer is scoped in §2.5.

---

## 1. Parity inventory

### 1.1 Architecture context (read this first)

- Contract: `src/shared/language/LanguageModule.ts` + `src/shared/language/types.ts`. Required slots + optional capabilities (ADR-011). Consumers reach data through `getLanguageModule(id)`.
- Registry: `src/shared/language/registry.ts` — `{ ja: jaModule, ko: koModule }`.
- JA module: `src/features/languages/ja/module.ts`. KO module: `src/features/languages/ko/module.ts`.
- Practice routes are registered **globally** in `src/App.tsx` (~lines 353–380) under `/:lang/practice/*` with **no route-level language guard**. Gating is soft, at two layers:
  - **Discovery:** `src/features/practice/practiceNavItems.ts` (reads `languageConfig.practiceOptions`) + `src/features/practice/practiceUnlockConfig.ts` (`getPracticeFeatures` → `JA_FEATURES` / `KO_FEATURES`).
  - **Data:** `src/features/practice/data/practiceDataLoader.ts` switches on language id for reading/speaking/counter content.

### 1.2 Language-module capability matrix

Source: the exported `LanguageModule` object literals in each `module.ts`. "Wired" = actually assigned on the literal.

| Capability slot | JA (`jaModule`) | KO (`koModule`) | Gap type |
|---|---|---|---|
| `curriculum` (required) | m1–m27, 51 files, 75.8k LOC | m1–m27, 31 files, 14.6k LOC | content-only |
| `courseAtoms` (required) | **750** atoms | **389** atoms | content-only |
| `grammarHelpers` (required) | 32 exports, 1,425 LOC | 12 exports, 353 LOC | mixed (see 1.4) |
| `placementBank` (required) | screener `[]`; byModule m1–m27 (~170 items) | screener 3; byModule m1–m3 only (15 items) | content-only |
| `ttsManifest` (required) | **4,884 clips** (`src/pub/tts/manifest.json`) | **`{}` empty** — browser TTS fallback | content-only (asset pipeline) |
| `vocabArt` (required) | Noto + custom SVG | Noto emoji only | content-only |
| `alphabetConfig` | hiragana + katakana | hangul (40 chars, 6 sections, RR, stroke order) | **parity** |
| `secondScript` | N5 kanji glyph map, `auto` unlock | **absent** (Hanja deferred) | engine+content |
| `readingAnnotation` | kana tokenizer + romaji | **absent** (Hangul is phonetic — legitimately N/A) | N/A for KO |
| `romanizer` | kuroshiro async romaji | **absent** | engine+content |
| `conjugation` | full (88 verb+adj entries) | **stub: 1 verb (먹다)**, no `analyze` | engine+content — **the priority** |
| `classifiers` | 8 full counter defs | 13 shallow (`usedWith: []`) | content-only |
| `particles` | derived from atoms | derived from atoms | parity |
| `symbolMastery` | kana `isSymbol` | **absent** (alphabet drill handles jamo) | acceptable |
| `imageMcqBlocklist` | present | **absent** | content-only |
| `vocabGraduation` | hiragana-row anchor walker | **absent** | engine+content |
| `importMatch` | `jaImportMatch` (Anki import) | **absent** | engine+content |

KO opts into **4 optional capabilities** (alphabetConfig, conjugation, classifiers, particles) + the required slots. JA opts into **11 optional** slots. Note both languages redundantly populate `conjugation`, which has **no consumer**.

### 1.3 Lesson step / exercise types

21 distinct step `type` literals (union in `src/features/lesson/types.ts`; dispatch in `src/features/lesson/components/StepRenderer.tsx`; renderers in `src/features/lesson/components/steps/*.tsx`). Reading annotation is centralized + registry-driven in `src/shared/readingAnnotation/AnnotatedText.tsx`, so most renderers are language-agnostic (they annotate only if the active module supplies an annotator).

**Renderers with hardcoded JA logic (engine-level gap):**
- `SpeakingStepView.tsx` — imports `convertToHiragana` / `tokenizeJapanese` / `kanaToRomajiHint` from the JA module; scoring path is JA-specific.
- `SymbolIntroStepView.tsx` — explicit `isJaKana = scriptId === "hiragana"/"katakana"` branch (else hangul path — so KO *is* handled, but via a JA-first conditional).
- `TranslateStepView.tsx` — soft JA default `(language?.id ?? "ja") === "ja"`.

**Step types that are JA-only by CONTENT (renderer is generic, KO simply authors none):**
- `grammar_rule` (no KO `grammarRule` helper)
- `self_explanation_mcq` (no KO `selfExplain`)
- `dialogue_listen` (no KO `dialogueListen`; JA also has `storyComprehension` composing it)
- `symbol_production` — dead in both languages.

**Shared / parity:** `info`, `multiple_choice`, `build_sentence`, `match_pairs`, `fill_blank`, `listening_comprehension`, `listening_build`, `word_image_mcq`, `phrase_card`, `particle_cloze` (KO uses it too — not JA-only despite the name), and the `symbol_*` family (script-parametric; KO reuses it for hangul via `ko/curriculum/_hangulRowHelpers.ts`).

### 1.4 grammarHelpers JA vs KO

| | JA | KO |
|---|---|---|
| File | `src/features/languages/ja/grammarHelpers.ts` | `src/features/languages/ko/grammarHelpers.ts` |
| LOC | 1,425 | 353 |
| Exports | 32 | 12 (strict subset) |

KO exports: `slotFor, phrase, vocab, cloze, sentenceMcq, build, translateStep, listeningBuildSentence, listeningCompSentence, speaking, infoStep, vocabMcq`.

JA-only factories: `grammarRule, selfExplain, dialogueLesson, dialogueListen, storyComprehension, reviewMatchPairs, audioImageMcq, audioMeaningMcq, translationMcq, withoutMcqBlocked, resolveAtom, pickReviewAtoms, pickReviewAtomsWeighted` + review-pool constants and answer-distribution assertion tooling. Gap concentrates in: (a) the JA-only step families above, (b) richer JA MCQ variants (KO has only `vocabMcq`), (c) JA's review-pool weighting.

### 1.5 Practice surfaces

| Surface | Available | Driving gate |
|---|---|---|
| Flashcards (general) | Both | `practiceNavItems.ts` always first; language-agnostic |
| Stories | Both | `flags.practice.stories`; API-driven, filtered by `learningLanguageId` (`StoriesPage.tsx`). Not code-gated — KO-vs-JA story existence is a backend/content question |
| Alphabet (kana/hangul) | **Both** | KO has full `alphabet: hangul` config in `languageConfig.ts`; `AlphabetPracticePage` resolves generically. Hangul practice fully works |
| Particles | Both | `getParticlesForLanguage` maps ko → `ko/particles.json`, ja → `practice/data/ja.json` |
| Reading | Both (thin KO) | `getReadingPassages`; JA 6 passages vs KO 2; furigana toggle JA-only; unlock KO m3 / JA m7 |
| Speaking | Both (near parity) | `getSpeakingPrompts`; JA 10 / KO 10; unlock KO m1 / JA m5 |
| Counters | Both | `getCounterDefs`; JA 8 / KO 4 defs; unlock KO m3 / JA m5 |
| **Kanji** | **JA only** | Not in `KO_FEATURES`/KO `practiceOptions`. `KanjiPracticePage` calls `getKanjiUpToModule` (JA `secondScript/n5Kanji.ts`), **not language-parameterized** — `/ko/practice/kanji` renders JA kanji (nonsensical, no crash) |
| **Conjugation** | **JA only** | Not in `KO_FEATURES`/KO `practiceOptions`; trainer is JA-hardwired (§2). KO's `conjugationTables.ts` exists but is not connected |
| **Grammar** (`PracticeGrammarPage`) | **JA only (functional)** | Short-circuits for non-JA: `if (langId !== "ja") return {due:0,isNew:0}`; grammar-review + conjugation rows wrapped in `{langId === "ja" && …}`. KO gets a near-empty page |
| Components | JA-only stub | `ComponentsPracticePage` is a "Coming soon" placeholder for everyone |
| Videos | Both (surfaced) | **Bug:** `VideosPracticePage.tsx:20` reads `langId === "ko" ? MOCK_VIDEO_KO : MOCK_VIDEO_KO` — both branches return the KO mock, so JA shows KO videos |

### 1.6 Non-learning surfaces (fully language-agnostic)

Social, Leaderboard, Shop, Quests: **zero** language references (grep for `language.id`/`langId`/`"ja"`/`"ko"` returns nothing). Community has language refs only for content **filtering** (browse target-language user content), not feature gating.

### 1.7 i18n locale coverage

`src/shared/i18n/locales/`, `supportedLngs = ["en","ko","es"]`, fallback `en`. **These are UI/interface locales, orthogonal to the *learning* language.** There is **no `ja.json`** — the JA interface falls back entirely to English (the `ja.json` under `practice/data/` is particle *data*, not a locale).

| Locale | Lines | ~keys |
|---|---|---|
| en.json | 2,475 | ~2,300 (source of truth) |
| ko.json | 1,797–1,821 | ~1,690 (~73% of en; ~600 keys behind) |
| es.json | 1,067 | ~1,010 |

### 1.8 Gap classification summary

**Content-only (KO needs authored data; code already generalizes):** courseAtoms depth, curriculum depth, TTS audio, placement m4–m27, reading passages, classifiers, `grammar_rule`/`self_explanation_mcq`/`dialogue_listen` content, ko.json UI strings.

**Engine/UI is JA-specific (code must be generalized):** the **conjugation trainer** (§2), `KanjiPracticePage` + `secondScript` (JA kanji only), `PracticeGrammarPage`/Track-B grammar SRS (`langId==="ja"` gates), `SpeakingStepView` scoring, `romanizer`/`importMatch`/`vocabGraduation` capability engines, and the `VideosPracticePage` KO/KO bug.

---

## 2. Conjugation trainer deep-dive (priority)

### 2.1 Where it lives

**Hub / entry:**
- `src/features/practice/ConjugationPracticePage.tsx` (~516 LOC) — the hub (2×3 "ink tiles", combined-forms toggle, learn-ahead, sticky action bar). Imports `conjugateVerb`/`conjugateIAdj` from the JA engine directly.
- `src/features/practice/PracticeGrammarPage.tsx` — surfaces the "Conjugation trainer" + "Grammar review" rows, both wrapped in `{langId === "ja" && …}`.

**Data/logic layer (`src/features/practice/conjugation/`):**
- `trainerRegistry.ts` — 6 JA trainer types (`te-form, ta-form, nai-form, masu, v-tai, i-adj-forms`), formation cheat rows, unlock modules derived from `n5-grammar-points.json`.
- `trainerSession.ts` — session builder + JA distractor generators + FSRS grading into Track B.
- `comboForms.ts` — stacked-form (なかった/たくない/ました…) tile-set → form mapping.
- `typeColors.ts` — per-type kana glyphs (て/た/な/ま/い) + colors.
- `learnAhead.ts` — ahead-of-path ack persistence.

**UI:**
- `DrillQuestionCard.tsx` — the shared MCQ card (JA kanji+furigana rendering, `WordClassChip` godan/ichidan/i-adj, `KANJI_EXPOSURE_MODULE = 10`).
- `CheatSheet.tsx`, `TrainerTypeSession.tsx`, `CombinedSession.tsx`, `FreeDrillPage.tsx`, `SessionSummary.tsx`, `LearnAheadDialog.tsx`.

**JA engine + tables (the linguistic core, in the JA module):**
- `src/features/languages/ja/conjugationEngine.ts` — rule-based generator (`conjugateVerb`, `conjugateIAdj`, `ChainForm`, `IAdjForm`, kana-row shift maps `U_TO_I`/`U_TO_A`, godan euphonic changes, irregular special-cases).
- `src/features/languages/ja/conjugationTables.ts` (1,542 LOC) — 88 hand-authored VERB/ADJ entries with `group`, `introducedAtModule`, kanji forms; `getVerbsUpToModule` / `getAdjsUpToModule`.
- `src/features/languages/ja/writtenForms.ts` — `writtenSegments` (kanji+furigana ruby derivation used by `DrillQuestionCard`).

**SRS integration (Track B):**
- `src/features/flashcards/engine/grammarSrs.ts` — a second FSRS store (`open-lingo-srs-grammar:v1`) keyed by grammar-point id. Imports `JA_COURSE_ATOMS` + JA unlock map directly — **JA-hardwired**.
- Reviewable unit = grammar point from `src/features/lesson/data/n5-grammar-points.json` (93 points).

**Routes** (`src/App.tsx`, all lazy, no language guard):
`practice/conjugation`, `practice/conjugation/free`, `practice/conjugation/train`, `practice/conjugation/:typeId`.

### 2.2 How it works end-to-end

1. **Hub** (`ConjugationPracticePage`): reads `reachedModule` via `useCourseLevel()`. Builds 6 tiles; each tile's unlock module = latest module among its grammar points (`unlockModuleForType`), mastery = derived from Track-B production reps (`typeMasteryPercent`), due count = `dueGrammarPointCount`. Selection drives a sticky bar: 0 → recommendation; 1 → per-type page; 2+ → combined drill. Locked tiles are drillable behind a one-time "learn-ahead" confirmation (practice-only, writes no SRS).
2. **Session build** (`trainerSession.buildTrainerSession` / `buildCombinedSession`): draws a verb/adjective pool from `getVerbsUpToModule(reachedModule)` / `getAdjsUpToModule`, round-robins the type's forms, and for each `(item, form)` calls the JA engine to compute the correct answer + 3 rule-misapplication distractors (`generateFormationDistractors` — same-verb, same-ending-family wrong sound-changes; the anti-elimination design). Clamped to 6–12 (individual) / 8–14 (combined) questions.
3. **Drill card** (`DrillQuestionCard`): renders the dictionary word (as kanji+furigana from module 10 on via `writtenSegments`), a `WordClassChip` (godan/ichidan/irregular/i-adj), a vertical "build stack" of tiles in application order, and 4 MCQ tiles. Keyboard 1–4. A stuck-timer surfaces the cheat sheet; peeking = half credit.
4. **Grading** (`gradeTrainerSession` / `gradeCombinedSession`): the session collapses to one FSRS rating (`sessionRating`: full→good, ≥50%→hard, else→again) written **per grammar point** into Track B via `reviewGrammarPoint(pointId, "production", rating)`. `FORM_TO_POINT` maps forms→points; pooled points (`masu`) write nothing to avoid double-counting with the step-pool grammar review. XP is not directly wired here — the trainer's authority is Track-B SRS scheduling; the due badges flow back into `PracticeGrammarPage`.

### 2.3 How JA-specific it is

Effectively 100% at the linguistic layer, and it **does not use `getLanguageModule`** at all:

- **Direct JA imports** in 8 non-test files (`ConjugationPracticePage`, `trainerRegistry`, `trainerSession`, `comboForms`, `CheatSheet`, `FreeDrillPage`, `CombinedSession`, `DrillQuestionCard`) of `languages/ja/conjugationEngine` / `conjugationTables` / `writtenForms`.
- **Verb taxonomy hardcoded** to godan/ichidan/irregular + い/な-adjective; distractors encode kana-row shifts (`U_TO_A_NAIVE`) and euphonic families.
- **Trainer types** are the 6 JA forms; unlock + SRS keyed to `n5-grammar-points.json`.
- **Rendering** assumes kana dictionary form + kanji/furigana exposure; `WordClassChip` labels are Japanese classes.
- **Track B** (`grammarSrs.ts`) imports `JA_COURSE_ATOMS` and the JA unlock map; `PracticeGrammarPage` short-circuits non-JA.
- **Surfacing** excludes KO (`KO_FEATURES` omits conjugation; hub row gated on `langId === "ja"`).

**Reusable in shape (but JA-typed today):** the round-robin builders (`buildQuestions`, `roundRobinBuild`), FSRS session-rating (`sessionRating`, `credit`, half-credit), the MCQ card *state machine* (selection/feedback/keyboard/stuck-timer shell), the hub tile interaction + learn-ahead dialog, and the combo-selection algebra (`canExtendSelection`, `combosForSelection`). None reference JA *linguistics* — only JA *types*. These become reusable once the data layer is parameterized by language.

### 2.4 What a Korean port concretely requires

**Korean conjugation data model (net-new linguistic content).** Korean is genuinely data-heavier than Japanese. A KO trainer needs, at minimum:

- **Stem classes:** regular consonant-stem, regular vowel-stem, and the irregular families the task calls out: **ㅂ** (돕다→도와요), **ㄷ** (듣다→들어요), **ㅅ** (짓다→지어요), **르** (모르다→몰라요), **ㅎ** (그렇다→그래요), plus **ㄹ-stem** (살다→삽니다/살아요), **으-deletion** (쓰다→써요), and **하다** verbs (공부하다→공부해요). Adjectives (descriptive verbs) conjugate on the same machinery.
- **Politeness levels:** 반말 / 해체 (casual), 해요체 (polite -요), 합쇼체 / formal (-습니다). The starter seed `ko/conjugationTables.ts` already encodes `formal_polite` / `polite` / `casual` / `plain`.
- **Tense/aspect:** present, past (-았/었-), future (-을 거예요 / -겠-).
- **Negation:** short (안 …) and long (-지 않다), plus 못 (inability) if desired.
- **The vowel-harmony rule** for -아/어 selection (stem vowel ㅏ/ㅗ → 아, else 어) and ㅎ-contraction (하 → 해) — these are the KO analogue of JA's euphonic sound-changes and drive both the engine and the distractors.

**Engine decision (the key fork):** Korean requires **jamo-level manipulation** (decompose 먹 → ㅁ/ㅓ/ㄱ, inspect the batchim, apply the rule, recompose) to generate forms from a compact table the way `conjugationEngine.ts` does for kana. Two options:
- **(A) Pure hand-authored tables** (no engine) — expand `ko/conjugationTables.ts` to ~30–50 lemmas with every drilled cell filled. Mirrors "tables are authoritative" but skips generation. Distractors then use the *legacy* strategy (`generateAdjDistractors`: same-item-other-form + other-item-same-form) rather than rule-misapplication. **Lower effort, phase-1 friendly, weaker distractors.**
- **(B) Rule-based KO engine** — a `ko/conjugationEngine.ts` doing jamo composition + irregular handling, enabling compact tables + rule-misapplication distractors (the anti-elimination quality JA has). **Higher effort, better pedagogy, the eventual target.**

**Files reusable as-is (once parameterized):** none can be imported unchanged today because all are JA-typed, but the *logic* of `trainerSession.buildQuestions/roundRobinBuild/sessionRating/credit`, the `DrillQuestionCard` state machine, `LearnAheadDialog`, `learnAhead.ts`, and the hub interaction transfer directly.

**Files needing a KO variant:** `conjugationTables.ts` (expand), a KO `conjugationEngine.ts` (option B) or pure tables (option A), `trainerRegistry.ts` (KO types), `trainerSession` distractor generators, `comboForms.ts` (KO stacks — Korean does stack: 안 먹었어요 etc.), `typeColors.ts` (KO glyphs), `CheatSheet.tsx` (KO formation rows), the `DrillQuestionCard` rendering (`WrittenJa`/furigana/`KANJI_EXPOSURE_MODULE` → plain hangul; KO `WordClassChip` labels).

**Net-new Korean linguistic content to author:** the verb/adjective tables (~40 lemmas × ~15–20 forms), the trainer-type taxonomy + per-type formation cheat rows, irregular-class definitions, distractor rules, and a **KO grammar-points registry** (a `ko-grammar-points.json` analogue of `n5-grammar-points.json`) if Track-B SRS integration is wanted — otherwise gate on reached-module only.

### 2.5 Phasing

**Phase 1 — minimal viable KO trainer (ship a working drill):**
- Add a KO trainer data layer: expand `ko/conjugationTables.ts` to ~25–40 high-frequency verbs/adjectives across the main classes; define KO trainer types (e.g. 해요체-present, past, 습니다-formal, 안-negation) with `introducedAtModule` gates.
- **Option A engine** (pure tables) + legacy distractors — no jamo engine yet.
- Parameterize the trainer surface by language (read the data layer via a KO branch or, cleaner, via `getLanguageModule("ko").conjugation`); de-JA `DrillQuestionCard` rendering (plain hangul, no furigana/kanji-exposure) and `WordClassChip`.
- Gate on **reached-module only** (skip Track-B SRS grading initially, or add a lightweight KO grammar-points list).
- Surface it: add `conjugation` to `KO_FEATURES` + KO `practiceOptions`; un-gate the `PracticeGrammarPage` row for KO.

**Phase 2 — quality + SRS:**
- Build `ko/conjugationEngine.ts` (jamo composition + irregulars) to enable compact tables + rule-misapplication distractors.
- Generalize Track B (`grammarSrs.ts`) off `JA_COURSE_ATOMS`; add `ko-grammar-points.json`; wire per-point grading + due badges.
- KO combo (stacked) forms + cheat sheet.

**Phase 3 — cleanup:** retire the direct JA imports in `features/practice/conjugation/*` by making the trainer consume `getLanguageModule(id).conjugation` for both languages, killing the dead-slot redundancy (the `shared/conjugation/types.ts` stub anticipated exactly this).

---

## 3. Recommendations (prioritized — conjugation first)

| # | Item | Size | Depends on |
|---|---|---|---|
| 1 | **Generalize the conjugation trainer to be language-driven** — introduce a per-language data layer (ideally consume `module.conjugation`), retire direct `languages/ja/*` imports across `features/practice/conjugation/*`, de-JA `DrillQuestionCard`/`WordClassChip` rendering | **L** | — |
| 2 | **Author KO conjugation content** — expand `ko/conjugationTables.ts` to ~25–40 lemmas across the main classes; define KO trainer types + formation cheat rows; linguist review | **M/L** | 1 |
| 3 | **Surface KO conjugation** — add to `KO_FEATURES` + KO `practiceOptions`; un-gate `PracticeGrammarPage` row | **S** | 1, 2 |
| 4 | **KO conjugation engine** (`ko/conjugationEngine.ts`, jamo + irregulars) → compact tables + rule-misapplication distractors | **L** | 2 |
| 5 | **Generalize Track B grammar SRS** off `JA_COURSE_ATOMS`; add `ko-grammar-points.json`; wire KO conjugation + grammar-review SRS | **M/L** | 1, 4 |
| 6 | **KO TTS audio pipeline** — empty manifest today is the biggest cross-cutting UX gap (browser TTS only) | **L** | — |
| 7 | **KO placement bank m4–m27** — currently m1–m3 only (`ko/placementBank.ts`) | **M** | curriculum |
| 8 | **Fix practice bugs** — `VideosPracticePage` KO/KO branch; hide/guard `/ko/practice/kanji` (renders JA kanji) | **S** | — |
| 9 | **KO curriculum + atom depth** — 389 vs 750 atoms; 19% of JA authored volume | **L** (ongoing content) | — |
| 10 | **KO UI locale** — ~600 keys behind `en.json` | **S/M** | — |
| 11 | **Optional-capability parity** (KO `importMatch`, `vocabGraduation`; `secondScript`/Hanja later if desired) | **M** each | — |

**Conjugation-trainer critical path:** 1 → 2 → 3 delivers a usable KO trainer (reached-module gated, hand-authored tables). 4 → 5 upgrade it to JA-quality (rule engine + SRS). Item 1 is the load-bearing prerequisite and the largest single piece.
