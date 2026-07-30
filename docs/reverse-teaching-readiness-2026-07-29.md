# Reverse-teaching readiness — instruction-language audit + housekeeping plan (2026-07-29)

**Status:** RESEARCH (read-only audit; nothing here is implemented) · **Scope:** what breaks when the learner's language is not English (e.g. ko→ja: a Korean speaker studying Japanese), what the abstractions already give us, the schema that separates glosses cheaply, and the **zero-cost authoring discipline for the vocab-pack wave (packs 5–16)** so the ~90 lessons being authored right now don't become migration debt.
**Method:** direct file reads + measured counts (scripts run against the working tree 2026-07-29) + two fan-out audits (grading-vs-English; i18n coverage). Every claim carries file:line. "Never/nowhere" claims are positive-controlled (instrument shown to fire on a planted case). Counts are exact where labeled *measured*, otherwise *estimated*.

---

## 0. Executive summary

1. **Grading is already instruction-language-clean inside the lesson player.** Every graded comparison is option-**id** equality or string equality against **Japanese** text (translate: `grammarHelpers.ts:1733` hardcodes `sourceLanguage:"native"`, graded against JA `acceptedAnswers`; builds compare kana `correctOrder`, `BuildSentenceStepView.tsx:157-171`, `ListeningBuildStepView.tsx:93`; MCQs by `correctOptionId`). Two exceptions live on practice pillar pages, not lessons: `ListeningPracticePage.tsx:56` (`option === prompt.translation`) and `KanjiPracticePage.tsx:129` (kanji→English-meaning mode). Reverse teaching is therefore a **translation problem, not a grading rewrite** — *provided* four English-**shape** couplings are fixed (§1.E): the worst is `jaAcceptedForms.ts:127`, where the accepted-answer widener classifies verbs by `/^to /i.test(a.meaningEn)` — a Korean-glossed atom table would misclassify **every verb as a nominal** and corrupt grading.
2. **The instruction language is not a dimension anywhere.** `settings.learning.uiLocale` exists but is read only by chrome/i18n/date code (readers: `SettingsContext.tsx`, `formatDate.ts`, `users.ts`, `SettingsSectionPanel.tsx`; grep verified — no content-side reader). Content English is baked into single-string fields at authoring time and into step objects at compile time.
3. **The measured content-English surface is ~15,000 strings** (§6): 10,093 in the IR (m6–m29, measured by JSON walk), 2,556 in hand-authored TS (m1–m5, m30, katakana), 1,024 atom glosses in `courseAtoms.ts`, 665 map titles/descriptions, ~620 in review pools / placement / passages / grammar-point labels. Separately, the lesson-surface **chrome** only *looks* i18n'd: 84 `t()` keys are called from `src/features/lesson/`, **5 resolve** — there is no `lesson` namespace in any locale file; ~74 more literals aren't wrapped at all. `ko.json` is otherwise a real, near-complete UI translation (only 49 late-wave keys missing).
4. **Recommendation (§3): keep authoring English-in-place exactly as today, and add a build-time string-extraction pass** producing per-module sidecar catalogs keyed by stable content anchors (atom surface, grammarPointId, lesson-id + ja surface, en source string), with per-language catalog files resolved at compile time and a coverage ratchet. Inline `{en, ko}` maps in the IR would put translators and authoring agents in the same files (merge hell with waves like the current packs churn) and grow the statically-imported 3.3 MB IR payload per language; pure id-keyed sidecars fail because **beats and steps have no stable ids** (`moduleCompiler.ts:870-871` numbers steps positionally).
5. **The urgent part is free.** The current IR conventions are already ~95% gloss-separable: zero English inside `ja:` fields across all 24 IR files (positive-controlled), cues drawn from a closed 8-variant set, answers matched to options verbatim. §4 pins eight rules that keep packs 5–16 that way at ~zero authoring cost.
6. **ko→ja is the right first reverse course** (§5): it reuses the entire target-side machinery (TTS keyed `ja:<text>`, kanji ladder, conjugation engine, sibling distractor banks, comprehensibility gate, SRS ids) and needs only the instruction dimension swapped. Honest minimum for one module: **m3 ≈ 403 strings (~1,650 words)**. ko→en by contrast needs an entire English target curriculum that does not exist (`src/features/languages/` contains only `ja`, `ko`, `es`).

---

## 1. Touchpoint inventory — where English-as-instruction-language lives

Fix column: **schema** = data-shape/code change required; **content** = pure translation once the schema exists; **chrome** = UI i18n work, no content implications.

### A. Atom glosses (the vocabulary meaning surface)

| Touchpoint | Evidence | Breaks how for a Korean learner | Fix |
|---|---|---|---|
| `CourseAtom.meaningEn` / `shortGloss` | `src/features/languages/ja/courseAtoms.ts:68,76`; **928** `meaningEn:` rows + **96** `shortGloss:` (measured) | Flashcard backs, match-pair tiles, MCQ prompts all show English | content (via §3 catalog) |
| Contract-level `Atom.gloss` — *documented as* "English meaning" | `src/shared/language/types.ts:83-85` | Single string, no language key | schema (doc + type: gloss becomes "instruction-language gloss", resolved) |
| `NormalizedAtom.gloss` — the one cross-language read surface | `src/features/lesson/data/normalizedAtoms.ts:44-45`; `fromJaAtom` maps `gloss: atom.meaningEn` `:66` | Flashcard back = `atom.gloss` (`src/features/flashcards/data/courseDeck.ts:92,138`); vocab browser, course map, command palette, dictionary all consume it (`normalizedAtoms.ts:1-5`) | schema — **this is the single best seam**: one resolver here re-glosses every consumer |
| IR `newAtoms[].gloss`/`shortGloss` | `docs/content-ir-spec-2026-07-20.md:40-41`; e.g. `ir/m13.ir.yaml:305` — **500 + 299** strings (measured) | Compiler bakes them into match tiles / transform cards (`moduleCompiler.ts:301-302,962-965`) | content |
| `GraduationAnchor.meaning`, `Particle.meaning`, `ParticleExample.gloss`, `ReadingPassage.glossEn` | `src/shared/language/types.ts:288,199,194,271` | Same single-English-string pattern across capability types | schema (same treatment) |

### B. Rule-card prose (grammar teaching text)

| Touchpoint | Evidence | Breaks how | Fix |
|---|---|---|---|
| IR `grammarPoints[].rule` — long English paragraphs | e.g. `ir/m13.ir.yaml:158,176` — **209** rules (measured) | The teach surface itself; also re-served as the review-deck preface (`grammarReviewPools.ts:300-343` harvests the authored `grammar_rule` step per point) | content — rules translate as blocks; ja tokens inside prose survive verbatim |
| `examples[].en` | `ir/m13.ir.yaml:160-166` — **920** (measured) | Parallel translation lines on rule cards | content |
| `antiPattern.why` | `ir/m13.ir.yaml:167` — **194** (measured) | The "why it's wrong" line | content |
| Compiler literal `en: "(incorrect)"` on antiPatterns | `src/features/lesson/data/moduleCompiler.ts:926` | Hardcoded English injected at compile | schema (move to catalog/chrome) |
| `n5-grammar-points.json` `pointEn` + `notes` | `src/features/lesson/data/n5-grammar-points.json` — 103 entries, `{"id":"wa-topic","point":"は","pointEn":"Topic marker",…}` | Track-B deck labels (`grammarSrs.ts:38`) | content |
| Rendered by `GrammarRuleStepView.tsx` — **zero `useTranslation`** | agent-verified `:260-261,334,408,442` ("Read aloud", "Got it") | Even the card chrome is English | chrome |

### C. Step prompts, titles, and cue-bearing English

| Touchpoint | Evidence | Breaks how | Fix |
|---|---|---|---|
| `beat.en` = the prompt AND the meaning — **3,129** strings (measured) | translate: `moduleCompiler.ts:999` (`promptEn: beat.en`); build: `:1042` prefixes `` `Build: ${beat.en}` `` | Every build/translate prompt is English | content |
| **Register cues embedded as free English prose** — **988** beats open with a cue (measured: `Say politely:` 507, `Say to a friend:` 436, `Say to a teacher:` 18, `Ask a friend:` 16, `Ask politely:` 4, +3 more variants) | The compiler *parses English* to handle them: `meaningOf` strips `/^(?:Say|Ask|Answer|Reply|Tell)\b[^:]{0,40}:\s*/i` (`moduleCompiler.ts:887-888`) and `directive` decides prompt framing by `/^(Say|Ask|Answer|Reply|Tell)\b/` (`:1039`) | Cue semantics live in English word-shape; a translated prompt string defeats both regexes (double-framed prompts + cue-leaking listening options — the exact bugs those regexes exist to prevent, documented at `:881-886,1036-1037`) | **schema** (cue → structured field at migration; until then, discipline rule D2) |
| Compiler literal `promptEn: "Build what you hear."` | `moduleCompiler.ts:1030` | Hardcoded | schema/chrome |
| Lesson `title` (**316**) + `focus` (**316**) — learner-visible | `moduleCompiler.ts:1314-1315` (`title`, `description: lesson.focus`) | Lesson list shows English | content |
| Course-map module/lesson titles + descriptions — **665** strings in `mockCourse.ts` (measured), incl. templates like `` `Learn the ${langName} Alphabet` `` `src/shared/domain/mockCourse.ts:30` | Map tiles English | content |
| `pitfall.title ?? "Heads up"` | `moduleCompiler.ts:1014` | Hardcoded | chrome |
| Dialogue speaker labels — **568** `speaker:` strings in IR (measured by field grep); named cast (Mika/Tom) + English roles ("Stranger", "Server", "Clerk", "Staff", "You") | Role labels are instruction-language | content (closed set — one-time translation) |

### D. English-text MCQs (answer content is English; grading is id-based)

| Touchpoint | Evidence | Breaks how | Fix |
|---|---|---|---|
| `listening-comp` beats: `answer` + `distractors` are English meanings — **461 + 1,383** strings (measured) | IR → `correctMeaningEn`/`distractorsEn` (`moduleCompiler.ts:1059-1072`); factory maps answer to `{id:"correct"}` and grades by `correctOptionId` (`grammarHelpers.ts:1776-1813`; view `ListeningComprehensionStepView.tsx:30,60`) | Options render English; correctness survives translation because it's id-keyed — but the compiler resolves correct-vs-filler by **English string inequality** `f !== q.answer` (`moduleCompiler.ts:1150`) and drops beats whose translated option set collides (`:1613` uniqueness over `.en`) | content + schema (answer→index at migration) |
| Dialogue `lines[].en` (**594**) + `questions[]` `q`/`options`/`answer` (**297 + 1,184**) (measured) | `moduleCompiler.ts:1147-1161`; **English fillers generated in code**: `["We can't tell","Neither","Both","Not yet"]` `:1150`; same pattern `buildSrsReviewLesson.ts:191-195` (agent-verified) | Generated distractors exist in no curriculum file — a translation pass over the IR alone misses them | schema (fillers → catalog) |
| `self_explanation_mcq` — options are English rule statements | `src/features/lesson/types.ts:765-772` (agent-verified) | Whole step is instruction-language | content |
| `match_pairs` right column = English gloss | `grammarHelpers.ts:952` (`target: a.meaningEn`); graded by pair id (`MatchPairsStepView.tsx:116`) | Display-only English | content |
| Particle-cloze `meaningEn` shown **pre-answer on every surface** — deliberately load-bearing ("without the english phrase … it's hard to know the intention", Spencer QA 2026-07-12) | `ParticleClozeStepView.tsx:132-137,158-160`; the old `surface==="grammarReview"` gate is dead (`:138` `void showMeaningPreAnswer`) | The design *requires* an L1 gloss; can't be dropped, must be translated | content |
| `word_image_mcq` prompt = `meaningEn` | `types.ts:466`; `grammarHelpers.ts:1066` | English prompt | content |

### E. Grading machinery — the verdict, and the four hard couplings

**Verdict (fan-out audit, spot-verified):** inside lessons, no graded comparison uses learner-typed English. Positive controls — places where correctness IS an English comparison — exist and were found on the pillar pages: `src/features/practice/ListeningPracticePage.tsx:56` (`option === prompt.translation`, data `ja-speaking-prompts.ts`) and `src/features/practice/KanjiPracticePage.tsx:129` (kanji→meaning mode, English meanings from `secondScript/n5Kanji.ts:15,35`). One representable-but-unused shape: `TranslateStep.sourceLanguage:"target"` with English `acceptedAnswers` (`types.ts:337-339`; only instantiation is the admin editor template `admin/lessons/editor/stepCatalog.ts:74`).

**English-shape couplings that would corrupt a Korean-glossed course (all verified in-file):**

1. `src/features/languages/ja/jaAcceptedForms.ts:121-129` — `NOMINALS` (which words may take a widened polite copula, i.e. what the grader *accepts*) excludes verbs by `!/^to /i.test(a.meaningEn)`. Korean glosses never start "to " → every verb classified nominal → grader accepts `たべないです`-class junk. **Grading behavior depends on English gloss prose.**
2. `src/features/lesson/data/matchPairsFloor.ts:86` — match-step **mode detection**: `pairs.every(p => /[a-zA-Z]/.test(p.target))` ⇒ "meaning" mode; `:402` and `:476` require `/[a-zA-Z]/.test(a.meaningEn|a.gloss)` to enter the distractor pool. Hangul glosses fail both → wrong mode + silently empty distractor floor.
3. `src/features/languages/ja/jaSurfaceForms.ts:91` — `glossLooksLikeVerb = startsWith("to ")` decides conjugation group for generated surfaces (flashcard-import credit).
4. `src/features/lesson/data/moduleCompiler.ts:887-888,1039` (cue regexes, §C), `:1578` (dedupe keyed on `meaningEn`), `:301-302` (`matchTileGloss` splits English on `/[/,;]/`).

Also English-adjacent: `conjugation/provider.ts:139` strips `^to be|^to ` for captions (display-only); `kanjiDistractorPool.ts:137,145` drops pool words whose *English gloss* equals the answer's — correctness of the kanji cloze is defined relative to an English cue (agent-verified; live via `kanjiClozeStep.ts:44`).

All four couplings are small, mechanical fixes (courseAtoms rows already carry `pos:` — `courseAtoms.ts:120ff` — so NOMINALS can key on `pos !== "verb"`); they belong in the pre-ko schema-hardening batch (§3.4), **not** on the authoring wave.

### F. Comprehensibility gate, placement, passages, conjugation labels

| Touchpoint | Evidence | Breaks how | Fix |
|---|---|---|---|
| Comprehensibility gate — authoring-time vitest over **JA** tokens only | `grammarReviewPools.test.ts:221-245` (mechanism `:338-351`); runtime cousin filters by reached module (`useGrammarReviewSession.ts:12`) | Nothing breaks — it's instruction-language-independent. But no L1-side twin exists: nothing checks the learner can read the *gloss* language | none now; note for ko QA gate |
| Placement bank — English `meaningEn` prompts + `skill` labels | `src/features/placement/questionBank.ts:44-58` (types), `:175,179,189` (samples); `skill` surfaces to the learner in the gap report (`PlacementResultScreen.tsx:78` via `adaptiveEngine.ts:256`) — **320** EN strings (measured) | Gap report + item cues in English. Answers are `correctKana`/`correctParticle` (safe) | content |
| Placement is already multi-course | `questionBank.ts:4-7` imports `ko` grammarHelpers; `src/features/languages/ko/placementBank.ts` exists | — | — |
| Reading passages — target-language `passage`, **English** `contextHint`/`prompt`/option texts | `src/features/practice/data/ja-reading-passages.ts:1-22,29,34,36-39` (**80** EN strings measured); the **ko course's own passages ask English questions about Korean text** (`src/features/languages/ko/readingPassages.ts:7,15,17-21`) | Comprehension MCQs unreadable | content |
| Conjugation trainer — chrome is the best-covered surface (30/37 keys in ko; `t(key,{defaultValue})` pattern `DrillQuestionCard.tsx:71`), but **form labels are data literals**: `CONJUGATION_FORM_LABELS` (`conjugationTables.ts:45-55`), `ADJ_FORM_LABELS` (`:57-62`), `CHAIN_FORM_LABELS` (`conjugationEngine.ts:33`) → flow to `formLabel` (`provider.ts:236,260`) and render raw (`FreeDrillPage.tsx:177`, `SessionSummary.tsx:43-46`) | "Past negative" stays English in a Korean UI | schema-lite — the repo already has the right pattern one field over: `labelKey`+`labelDefault` (`provider.ts:153-186`) |
| TTS — **confirmed instruction-language-independent** | manifest keyed `` `${lang}:${text}` `` over *target* text (`src/shared/tts/index.ts:84-87`); per-lang dirs `:14-17`; synth fallback with BCP-47 incl. `en-US` (`:127-132,148-150`) | Nothing breaks. Audio transfers to ko→ja wholesale | none |

### G. i18next — what's chrome vs content (fan-out audit, key numbers)

- Setup: `src/shared/i18n/i18n.ts:1-35`, locales en/es/ko, single namespace, `fallbackLng:"en"`.
- **Lesson surface: 84 distinct `t()` keys called from `src/features/lesson/`, 5 resolve in any locale file — there is no `lesson` namespace** (verified by flattening `en.json`/`ko.json`). Every `t("lesson.check","Check")` renders its English inline default. ~69 wrapped literals vs ~74 bare literals in step views; 5 step views import no `useTranslation` at all — including `Feedback.tsx:88,96` (`"Correct!" / "Not quite" / "Correct answer: "` — the most-seen banner in the app) and `SpeakingStepView.tsx` (25 bare literals of mic/error microcopy).
- **Chrome-in-data (b3):** ~209 English literals emitted *into step objects* by builders (`buildSrsReviewLesson.ts:103,500,506-507,…`, `hiraganaCurriculum.ts` ~83, `moduleCompiler.ts:208,1014,1030,1150`) — a view-layer i18n pass cannot catch these.
- `ko.json` is a genuine human-quality UI translation: 2,218 leaf keys, only 49 missing vs en (one late feature wave). Conjugation 81%, flashcards 89%, placement 72% covered.
- **No locale-parity test exists** — nothing fails when a key misses; that's how 131 phantom keys shipped. (Highest-leverage first i18n commit: a test that every `t()` call-site key resolves in `en.json`.)
- Cross-course pollution: the shared `alphabet.*` namespace serves both the JA kana trainer and KO hangul trainer with mixed copy (`en.json` `alphabet.plainConsonantsTitle` = "Plain consonants (기본 자음)" beside `alphabet.yoonCombosTitle` = "Small ゃ/ゅ/ょ combinations") — needs per-course splitting regardless of reverse teaching.

---

## 2. What the abstractions already give us

- **Ids are instruction-language-neutral.** Atom ids are `lang:surface` (`types.ts:40,78-80`, ADR-005); SRS/progress/unlock keys never contain English. A ko-instructed ja course shares the learner's SRS store with an en-instructed one for free.
- **`NormalizedAtom` is one resolver away from per-viewer glosses.** It's explicitly "the ONE cross-language read surface" (`normalizedAtoms.ts:1-5`); flashcards, vocab browser, course map, palette, dictionary all read `gloss` from it (`:44-45`), populated by three tiny per-language adapters (`fromJaAtom :61-74`, `fromKoAtom :76-91`, `fromEsAtom :93-105`). Teaching `buildAtomsFor(languageId)` to also take an instruction language and consult a gloss catalog re-glosses *every one of those surfaces at once*. **But** this covers only render-time consumers: `grammarHelpers` factories bake `meaningEn` into step objects at course-build time (§1.D), so the lesson path needs the catalog at the compiler/factory boundary instead.
- **The non-JA lesson path already resolves atoms language-generically** — `nonJaAtomsForLesson` walks `exercisedAtoms` through the normalized index (`lessonAtomIndex.ts:190-218`), and lesson-id language inference exists (`:225-229`). The es/ko courses prove the engine runs non-ja content; their *instruction* text is still English (e.g. ko passages, §1.F) or template English (`mockCourse.ts:30`); `getMockCourse` remains a 1,754-line per-language branch (`mockCourse.ts:22,48,1091,1707`) — pre-existing debt, orthogonal to instruction language.
- **`LOCALIZATION.md` already promises exactly this** — "Course content … has instruction-language variants served via a version manifest (en, ko, ja …)" (`docs/LOCALIZATION.md:23`) and an inline `{ "meaning": { "en": …, "ko": … } }` pattern for practice data (`:48-54`). No implementation of the content manifest was found (could-not-verify §7 — searched, absent from `src/`). The doc chose the architecture years early; §3 fills in the mechanism.
- **TTS, kanji, conjugation, distractors, gate: all target-side.** TTS §1.F; kanji ladder is render-time surface substitution (`applyKanjiSurfaces.ts`, CLAUDE.md); sibling/distractor banks are pure kana (`jaSiblingSets.ts:27-49,59-72`; `buildTileFloor.ts:55-58`); the comprehensibility gate tokenizes JA (§1.F).
- Distance-to-goal summary: **display-side gloss swap ≈ one resolver + catalogs; lesson-side ≈ catalog lookup inside `moduleCompiler`/`grammarHelpers` + the four §1.E de-couplings; chrome ≈ finishing an i18n job that's half-plumbed.**

---

## 3. Schema comparison — how the second instruction language should be stored

Baseline facts constraining the choice: IR JSON is statically imported per module (`m13-neo.ts:13-16`) and totals **3.3 MB** (measured); step ids are **positional** (`moduleCompiler.ts:870-871` `sid()` counter — inserting a beat renumbers everything after it, a known resume-state concern `:984-991`); beats have **no ids**; the QA culture gates everything, so translations will be QA-judged artifacts needing clean diffs; authoring agents (like the live packs wave) own the IR files.

### (a) Inline per-language fields — `gloss: {en, ko}`, `en:` → `meanings: {…}`

- Authoring ergonomics: **bad.** Two writer populations (curriculum agents + translators/MT) in the same files; the current m13/m14 packs churn would conflict with any translation wave. Authors must carry fields they can't verify.
- Diff review: curriculum diffs and translation diffs interleave; a Korean QA judge must diff whole IR files.
- Bundle: per-language text rides the statically-imported IR → 3.3 MB grows ~linearly per language with no lazy split.
- Migration: rewrites every one of ~10k IR rows + 60 TS files.
- Determinism: fine. Verdict: **reject.**

### (b) Sidecar files keyed by minted stable ids (atom id / grammar-point id / step id)

- Needs ids on ~3,129 beats that don't have them; positional step ids churn (`moduleCompiler.ts:870-871`). Minting ids is precisely the authoring tax we cannot put on the live wave, and id-discipline failure modes are silent. Verdict: **reject as stated** — but the *sidecar* half is right.

### (c) RECOMMENDED — English-as-source + build-time extraction into anchor-keyed catalogs

Keep authoring **exactly as today** (English in place — it stays the source text and the fallback). Add a deterministic extraction step (sibling of `compile-ir.mjs`) that walks compiled IR + hand-TS content and emits, per module, a catalog of `{key → en}` where keys are **derived from anchors that already exist and are already stable**:

- atom gloss → `m13/atom:ほしい/gloss` (kana surface — unique per module by construction)
- rule / why / example → `m13/gp:v-tai/rule`, `m13/gp:v-tai/ex:<ja>` (grammarPointId is governed by inv 42; the ja line is the example's identity)
- beat prompt/meaning → `m13/<lessonId>/ja:<ja-surface>` (the ja sentence IS the beat's identity; see rule D6 on uniqueness)
- English-native texts with no ja anchor (listening-comp options, dialogue q/options, titles) → keyed by **their own en string** in context, `m13/<lessonId>/en:<hash(en)>` — gettext-style; an en edit invalidates the translation, which is exactly the staleness signal a QA-gated pipeline wants.

Then `m13.ko.json` is a sidecar mapping the same keys → Korean (MT wave writes it; the QA gate judges it in isolation — pure-translation diffs), each entry carrying the en-source hash for staleness detection. `compileModule` gains a `resolveText(key, instructionLang)` that substitutes at compile time and emits per-language lesson content; unresolved keys fall back to English, and a coverage ratchet (the TTS-coverage pattern from `module-gate`) reports per-module per-language coverage.

Why it wins on the stated axes: **authoring ergonomics** — zero change for authors, the packs wave needs no new fields; **determinism** — extraction is a pure function of the IR; **diff-review** — translations live in their own files; **MT+QA workflow** — catalogs are the natural MT unit and staleness is mechanical; **bundle** — catalogs are separate lazily-loadable files per language, base bundle unchanged; **migration cost** — the extractor is written once and the "migration" of existing content is running it (0 hand-touched rows); only the §1.E de-couplings and the compile-time English templates (`Build:` prefix `:1042`, `"(incorrect)"` `:926`, fillers `:1150`, `"Build what you hear."` `:1030`) are hand-fixes.

**One-time schema hardening to land before the first ko catalog** (small, none block the packs wave): cue prefix → structured `cue:` field (extractor can mechanically split the 988 existing ones because the cue set is closed); dialogue/listening-comp `answer` → `answerIndex`; NOMINALS → `pos`-driven (`courseAtoms.ts` rows already carry `pos`); remove the three Latin-regex gates (`matchPairsFloor.ts:86,402,476`); key compiler dedupe on anchors not `meaningEn` (`moduleCompiler.ts:1578,1613`).

---

## 4. AUTHORING DISCIPLINE — packs 5–16 (pin this section for authoring agents if approved)

Each rule: what it costs the author **today** → what it saves in 3 months. All eight are current-practice codifications — the measured baseline already complies; the point is that ~90 new lessons don't drift.

**D1 — English only in English fields; never inside `ja:`/`audio:`/`stem:`/`tail:` or any tile/answer text.**
Baseline: 0 Latin-text hits in any `ja:` field across all 24 IR files (measured, instrument positive-controlled). Cost: none. Saves: the §3 extractor can enumerate every translatable string purely by field name; one embedded "OK" in a ja sentence becomes an untranslatable tile and a TTS-manifest miss.

**D2 — Register/directive cues come ONLY from the existing closed set, sentence-initial, colon included:** `Say politely:` · `Say to a friend:` · `Say to a teacher:` · `Ask a friend:` · `Ask politely:` (+`Answer/Reply/Tell …:` if genuinely needed — never a novel phrasing like "When chatting with your buddy, …").
Why: the compiler parses cues by regex (`moduleCompiler.ts:887-888,1039`); a nonconforming cue **is a live bug today** (double-framed build prompts; the cue leaks into listening-comp options as a fake "meaning" — the documented 164-option incident `:881-886`). Cost: none — 988 existing cue beats already use 8 variants. Saves: cues lift mechanically into a structured `cue:` enum at migration; free prose would need human re-reading of every prompt.

**D3 — English string relationships must be exact, never paraphrased:** dialogue `answer` character-identical to exactly one `options[]` entry; listening-comp `answer` distinct from every distractor; don't rely on two prompts being "the same meaning worded differently".
Why: correctness is resolved by matching the answer string against options at compile time (`grammarHelpers.ts:1776-1813`), fillers by `f !== q.answer` (`moduleCompiler.ts:1150`), beat emission by option-set uniqueness (`:1613`). Cost: none (violations already fail or misbehave). Saves: en-keyed translation round-trips 1:1. *(Drive-by evidence this rule catches real bugs: `m13.ir.yaml` m13-neo-2's dialogue answer "Stay home and look at a book" mismatches the line 「いえで しゃしんが みたい」 — photos, not a book.)*

**D4 — Glosses are standalone dictionary entries: one sense; verb glosses start `to …`; multi-sense glosses get a `shortGloss`; mnemonics and rationale go in `note:`/comments, never in the gloss.**
Why: grading *classifies words by gloss shape today* — `jaAcceptedForms.ts:127` (`/^to /`) and `jaSurfaceForms.ts:91`; the `gloss-long` diagnostic already enforces ≤28-char tiles (`content-ir-spec:115`); `note:` is authoring-only (`courseAtoms.ts:132` pattern). Cost: none — it's the house style. Saves: 928+ rows translate as a flat two-column table, and today's grader keeps working.

**D5 — English MCQ option sets (listening-comp distractors, dialogue questions) must differ in MEANING** (tense/polarity/object/quantity), never by English-only surface features — articles, homophones, spelling near-misses, word-order puns. Each option a complete standalone sentence.
Why: grading is id-based so translation is safe, but an option pair distinguished only by English surface ("a hat"/"the hat") collapses to identical Korean — the item becomes unanswerable or trivial post-translation. Cost: ~zero (current items already contrast semantically, e.g. `m13.ir.yaml` L1's listening-comps). Saves: the 1,383 distractors + 1,184 dialogue options survive MT without per-item redesign.

**D6 — One meaning per ja surface within a lesson: don't reuse the same `ja:` sentence in two beats of one lesson with different `en:` texts** (repetition with the *same* en is fine, ≤3 per the existing repeat diagnostic).
Why: the ja surface is the beat's natural stable key for sidecar catalogs (§3c) — beats have no ids (`moduleCompiler.ts:870-871`); a polysemous reuse makes the key ambiguous. Cost: none observed in current modules. Saves: beat-level keying without minting 3,129 ids.

**D7 — Rule prose (`rule:`, `why:`, `explanation:`) names Japanese forms by their Japanese surface** (たべたくない, not "tabetakunai" or invented English nicknames); `examples[].en` is a plain meaning with no cue prefix.
Why: ja tokens embedded in prose pass through translation verbatim and stay correct; the review-deck preface re-serves this exact prose (`grammarReviewPools.ts:300-343`); `meaningOf` would mis-strip a cue-prefixed example en (`moduleCompiler.ts:887-888`). Cost: none — house style. Saves: rules translate as blocks with zero token surgery.

**D8 — Never author a step whose correct answer is an English string: no `sourceLanguage:"target"` translate steps, no typed-English grading, in packs or QA fixtures.**
Why: the shape is representable (`types.ts:337-339`; template `stepCatalog.ts:74`) and only discipline keeps the "grading is target-language-or-id-only" invariant true — the single property that makes reverse teaching a translation problem instead of a grading rewrite (§0.1). Cost: none. Saves: the entire grading layer stays instruction-language-agnostic.

Also (not authoring, but wave-adjacent): dialogue speakers stay within the named cast + existing role labels ("Stranger"/"Server"/"Clerk"/"Staff"/"Friend"/"You") — a closed set translates once (568 speaker strings measured).

---

## 5. First reverse course: ko→ja sketch (and the ko→en contrast)

**Confirmed — ko→ja reuses the entire target-side machinery.** Same modules, same lessons, same step ids/SRS keys (`lang:surface` ids, §2), same TTS corpus (`tts/index.ts:84-87` keys on `ja:<text>` — every recorded clip transfers), kanji ladder unchanged (render-time substitution, CLAUDE.md `applyKanjiSurfaces.ts`), conjugation engine + drills unchanged (Japanese in/out), sibling-set distractors unchanged (kana-only, `jaSiblingSets.ts:27-49`), comprehensibility gate unchanged (JA tokens, `grammarReviewPools.test.ts:338-351`). What swaps is exactly the instruction dimension: the §3 catalogs + UI chrome + the §1.E/§3.4 hardening batch (which is shared work, not ko-specific).

**Romaji — revisit, don't block.** Romaji ruby is arguably an English-instruction artifact, but its carrier is instruction-neutral: `AnnotationFragment.reading` is a plain string (`types.ts:119-129`), so hangul readings (deterministic kana→hangul transliteration) could be served without schema change; the romaji fade ladder (`romajiAutoFlip.ts`, CLAUDE.md) transfers as-is. Latin script is universally read in Korea and Korean JA-pedagogy moves to raw kana fast — recommend shipping v1 with romaji and treating hangul-ruby as a settings-level option later. Product decision, not an engineering gate.

**Honest minimum translation surface for ONE module — m3 (hand-authored TS), measured:** **386 English strings (275 unique, ~1,603 words)** in `m3-neo.ts` + **17** `courseAtoms` rows with `fromModule:"m3"` glosses ≈ **~403 strings / ~1,650 words**, plus the shared-chrome fix (the missing `lesson.*` namespace + ~74 literals — one-time, benefits every course). Full ja course extrapolation: ~15k strings (§6), roughly 65–70k words (*estimated* from the m3 words/string ratio) — an MT-wave-plus-QA-gate-sized job, not a rewrite.

**ko→en contrast:** the reverse-instruction machinery is identical (same catalogs, same chrome — `ko.json` already ~complete). But the *target* side doesn't exist: `src/features/languages/` contains only `ja`, `ko`, `es` (verified listing) — no en atom table, no en curriculum, no en TTS corpus (browser-synth fallback exists, `tts/index.ts:131,148-150`, but the JA course's recorded-corpus quality bar would demand generation). Engine-ready (LanguageModule contract + `"en"` in `LanguageId`, `types.ts:31`), **content-from-scratch** — a full course build on the scale of the 2-month ja rewrite, not a translation pass. Sequence ko→ja first.

---

## 6. Migration cost estimate (measured counts)

| Surface | Strings | Method |
|---|---|---|
| IR m6–m29 (24 modules) — atom glosses 500 + shortGloss 299, rules 209, example-en 920, antiPattern-why 194, **beat en 3,129**, explanations 285, listening-comp answers 461 + distractors 1,383, dialogue line-en 594, question q 297 + options 1,184, titles 316 + focus 316, pitfalls 6 | **10,093** | JSON walk over `*.ir.json` (excludes `notes:` — authoring-only, dropped at `compile-ir.mjs:37`) |
| Hand-authored TS: m1/m2 rows 442 · m3 386 · m4 595 · m5 651 · m30 379 · katakana+helpers 103 | **2,556** | English-literal filter over quoted strings (kana-free, ≥2 Latin letters, non-id) |
| `courseAtoms.ts` — 928 `meaningEn` + 96 `shortGloss` | **1,024** | field grep |
| `mockCourse.ts` titles/descriptions (map tiles, all courses) | **665** | field grep |
| Grammar review pools 116 · placement bank 320 · ja reading passages 80 · `n5-grammar-points` pointEn 103 | **619** | field grep / filter |
| **Content total** | **≈ 14,960** | |
| Chrome (separate track): ~131 phantom `t()` keys + ~74 unwrapped view literals + ~209 builder-emitted literals | ≈ 414 | fan-out audit |

Under the §3c recommendation, ~14.5k of these migrate by **running the extractor** (zero hand edits); hand-touched surfaces are the §1.E couplings, the compile-time English templates, and the answer→index change — plus the ko catalogs themselves (translation, not migration). MCQ **fillers generated in code** (`moduleCompiler.ts:1150`, `buildSrsReviewLesson.ts:191-195`) would be silently missed by any pass over content files — they must move to the catalog explicitly.

## 7. Could not verify

- **The `LOCALIZATION.md:23` "version manifest" for instruction-language variants** — searched `src/` and found no implementation; `lingo-core` was not exhaustively searched, so "never implemented anywhere" is not claimed.
- **Bundle chunking of `*.ir.json`** — static imports verified (`m13-neo.ts:13-16`) and 3.3 MB measured on disk; actual emitted-chunk layout not measured (no build run — read-only session).
- **`lingo-core` payloads carry no instruction-language strings** — believed from the SRS key audit (ids only) but the backend was not audited this session.
- **es/ko lesson step internals** — es/ko instruction-English was verified at the passages/placement/mockCourse level (§1.F, §2); a per-step sweep of the es/ko curricula was dispatched but its report did not land before writing; their counts are excluded from §6's total (i.e., §6 understates the multi-course total).
- **Word-count for the full course** (~65–70k) is extrapolated from m3's measured 4.15 words/string; only m3's word count is measured.
- Third-party fact (not repo-verifiable): conventions of Korean JA-pedagogy re romaji vs hangul glosses (§5) are stated from general knowledge, flagged as a product decision.
