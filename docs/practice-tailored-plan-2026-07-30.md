# Tailored Practice — plan (speaking / reading-madlibs / listening / writing from learned content)

**Branch:** `practice-tailored` (off `origin/main`) · **Date:** 2026-07-30 · **Status:** ✅ SHIPPED to `main` (2026-07-30). Speaking/Writing/Listening/reading-cloze generated from learned content via the practice engine (`learnedContent` + templates + `generatePracticeItems`). Note: Reading & Listening comprehension later moved to curated authored content (see `curated-content-plan-2026-07-30.md`); the generator remains for Speaking/Writing + cloze over authored sentences.

## Goal
Make the four practice surfaces (Speaking, Reading, Listening, Writing) draw from **what the learner has actually learned** (their unlocked/SRS vocab + reached grammar), instead of small static hand-authored lists filtered only by a module slider. Content is **generated fresh + relevant** from the learner's known words — always comprehensible, varied, never the same 10 prompts. Clean/calm UI with light progress feedback (not game-y). Reading gets **madlibs** (blanks filled by words you know). **Language-agnostic.**

## The engine (backbone) — template + known-vocab filler
The one mechanism behind all four surfaces:
- **`learnedContent` provider** (`src/features/practice/data/learnedContent.ts`, language-agnostic): the learner's real state — known atoms grouped by POS + SRS tier (new/learning/reviewing/mastered) + due/struggle weight, reached grammar points, reached module. Built from `getUnlockedAtomIds` + the SRS store + the POS tags (now on every atom) + the dictionary service. `getKnownAtomsByPos(lang, pos, opts)`, `getDueOrStruggling(lang)`, `getReachedModule()`.
- **Sentence templates** (`src/features/practice/data/sentenceTemplates/<lang>.ts`): authored patterns with **typed slots** — the template carries the grammar (particles, verb form, word order), slots carry vocab. Each template declares its slot types (POS + optional constraint) and a **grammar/module gate** (only offered once the learner has that grammar). e.g. JA `{topic:noun}は{obj:noun}が すきです`, KO `{subj:noun}이/가 좋아요`. This is the madlibs skeleton; it keeps generated sentences grammatical.
- **Filler/generator** (`generatePracticeItems(lang, { surface, count, seed? })`): pick templates gated ≤ reached content, fill each slot with a **known atom of the right POS** (SRS-weighted toward due/struggling for reinforcement), resolve reading (module romanizer) + audio (tts) + translation. Returns modality-agnostic `PracticeItem`s the surfaces render. Deterministic per seed (so a session is stable) but fresh across sessions.
- Keep the existing authored prompts/passages as **seed items** mixed in where they add value; the generator supplements them.

## Surfaces (each consumes the engine; disjoint files)
- **Speaking** (`SpeakingPracticePage`): echo a known/due word (SRS-weighted) + say a generated sentence + respond-to-a-question items. Reframe the "test page" into a calm flowing session (item → speak → light feedback → next, small progress bar, variety). Reuse the speech-recognition + `scoreAlternativesGeneric` path (incl. the KO-number fix).
- **Reading — madlibs** (`ReadingPracticePage`): generated sentences/short passages shown with a **POS-typed blank** the learner fills from options/typing (cloze), the blank being a word they know; plus straight comprehensible reading of generated sentences. Sub-in driven by `learnedContent`.
- **Listening** (`ListeningPracticePage`): TTS speaks a generated sentence → comprehension (pick meaning / which word did you hear / transcribe), all from known vocab.
- **Writing** (`WritingPracticePage`): prompt (English gloss or slot cues) → learner writes the target sentence using known words/grammar; typed grading (reuse `normalizeTypedAnswer` + KO romaja→Hangul).

## SRS
Practice can lightly credit the `production`/`recognition` modality for the atoms it exercises (via the existing `gradeFromLesson` path, gated) — reinforcing due words. Keep it conservative (Spencer's "only review cards count" invariant respected).

## Testing
- Engine: `learnedContent` groups by POS/tier correctly off injected stores; templates only offered ≤ reached grammar/module; the filler never places a word the learner doesn't know and never leaves a slot empty; deterministic per seed; language-agnostic (ja/ko/es).
- Each surface: render smoke — generates items from a mocked learned-content set, the modality interaction works, empty/low-vocab state is graceful.

## Scope boundaries
**In:** the engine + all four surfaces revamped to generate from learned content + reading madlibs, clean UI, ja/ko (+ es where templates exist).
**Deferred:** LLM-generated sentences (this is template-driven, deterministic, safe); rich per-surface game mechanics; audio for generated KO sentences beyond what TTS covers at runtime; ES template depth.
