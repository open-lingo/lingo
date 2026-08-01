# Curated Content + Conversations + Inline Lookup — plan

**Branch:** `curated-content` (off `origin/main`) · **Date:** 2026-07-30 · **Status:** ✅ SHIPPED to `main` (2026-07-30). Reading = Stories | Fill-in-the-blank tabs, story preview modal (difficulty + module words), conversation listener + roleplay, `<TappableText>` inline lookup. Later refined: density ramp + longer stories, per-language romanization gate.

## Why
Random sentence generation produces nonsense ("I can't drink a leg") — grammatical but meaningless slot-fills. For comprehension surfaces (reading, listening), content must make sense and be engaging. Fix: **authored, module-gated stories + conversations**, comprehensibility-gated, with **inline dictionary lookup** (tap any word → the dictionary modal). Keep the dynamic generator only where it's semantically safe (speaking echo/production, writing, and cloze over *authored* sentences). Add two conversation listening modes.

## Components

### 1. Curated content data (`src/features/practice/content/`)
- `Story` = `{ id, languageId, module, title, theme, sentences: { text, translation }[] }` — a short narrative gated to a module.
- `Conversation` = `{ id, languageId, module, title, situation, speakers: {id,label,voice?}[], lines: { speaker, text, translation }[], learnerRole?: speakerId }`.
- **Comprehensibility gate**: every content word decomposes to atoms with `fromModule ≤ module` (reuse the existing curriculum comprehensibility assertion) — so content only shows once the learner can read it.
- Per-language authored registries + `getStories(lang, reachedModule)` / `getConversations(lang, reachedModule)` (module-gated).
- **Starter content**: convert the 26 existing per-module "Mini-dialogue" lessons into `Conversation`s (real, module-calibrated), + author a handful of interesting `Story`s + a few richer `Conversation`s for early modules (JA + KO). The system handles any volume; content grows over time.

### 2. Inline dictionary lookup — `<TappableText text lang>` (`src/features/dictionary/` or `src/shared/`)
Renders target-language text where each recognized word is tappable → `useDictionaryModal().openWord(surface)`. Tokenizes via **dictionary longest-match** per language (JA/KO have no spaces): greedily match the longest known dictionary surface at each position; matched spans are tappable, the rest (particles/punctuation) render plain. Reused across reading, listening, stories, conversations. Depends only on the dictionary modal (already on `main`).

### 3. Reading revamp (`ReadingPracticePage`)
- **Stories**: read an authored module-appropriate story with `<TappableText>` + a few comprehension questions.
- **Cloze**: blank a word in an *authored* sentence (base is hand-written → never nonsense); options = same-POS known words. Retire random full-sentence generation here.

### 4. Listening revamp + two conversation modes (`ListeningPracticePage` + a Conversation surface)
- Keep tailored listening but source sentences from *authored* content (safe).
- **Conversation listener** (comprehension): play an authored dialogue (multi-voice TTS), then "what's going on" context questions; transcript with inline lookup on reveal.
- **Interactive conversation** (roleplay): the app voices one side; the learner produces the other side's lines (build-tiles → type → speak) — per `docs/superpowers/specs/2026-07-24-conversation-trainer-design.md`. Inline lookup on the transcript.

### 5. Speaking / Writing
Keep the dynamic generator (producing known words is semantically safe). Optionally draw prompts from authored sentences too.

## Testing
- Content: gating (only ≤ reached module), comprehensibility assertion over every authored item, per-language parity.
- `<TappableText>`: longest-match tokenization makes known words tappable + opens the modal; unknown spans render plain; ja/ko/es.
- Surfaces: render smokes (story renders + lookup; cloze over authored sentence; conversation comprehension; interactive roleplay grades a produced line).

## Scope boundaries
**In:** content data + gating + starter authored content (convert mini-dialogues + some stories/richer convos), `<TappableText>`, reading (stories+cloze) + listening (curated + 2 conversation modes), inline lookup everywhere.
**Deferred:** deep content across all 25 modules × all languages (starter set now, grows); LLM-generated dialogue; ES conversation depth.
