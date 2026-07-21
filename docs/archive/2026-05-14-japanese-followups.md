> **Status: ARCHIVED — SUPERSEDED by the full curriculum.** Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Japanese curriculum — follow-ups log

**Date:** 2026-05-14
**Status:** Open, prioritized

Carries forward every deferred item from the design spec
(`2026-05-14-japanese-lesson-flow-design.md`) plus everything surfaced
during MVP buildout. Pick up in roughly listed order.

## High-value next picks

### 1. Yōon lessons (combination kana)
Spencer's directive: "slowly introduce things like hya". Deferred from
this MVP because each yōon (きゃ, しゃ, ちゃ, etc.) needs its own
tokenizer + romaji table extension and the lesson template has to
handle 2-codepoint syllables uniformly.

- Add yōon entries to `JA_HIRAGANA.characterRomanization` for every
  combo (currently only りゃ/りゅ/りょ are wired).
- Verify the existing yōon-aware tokenizer in
  `kanaTable.tokenizeJapanese` handles all combinations (lookahead is
  already in place, but only tested against りゃ).
- Author 2 yōon lessons (consonant + ya/yu/yo group): one for kya/sha/
  cha/nya/hya/mya/rya, one for the voiced gya/ja/bya + pya.
- TTS: every yōon syllable + anchor words like しゃしん (photo),
  おちゃ (tea), りょこう (trip).

### 2. Katakana curriculum (Module 4)
The course already shows a "Katakana" locked module with a placeholder.
Mirror the hiragana curriculum but with the same row spine — most
learners can transfer recognition from hiragana once they know one
script. The `buildRowLesson` builder is script-agnostic; pass
`scriptId: "katakana"` and it'll work. Need:

- `katakanaCurriculum.ts` mirroring the hiragana catalog.
- Decide pedagogical pacing: full katakana row-by-row (15 lessons)
  versus a 5-lesson "katakana sprint" that groups rows.
- Distinct anchor words from hiragana lessons — katakana is for
  loanwords (コーヒー, ピザ, テレビ, パン) so the lesson character
  changes meaningfully.

### 3. Trace + Production step types for the new JA lessons
Right now the generated lessons only use `symbol_intro` +
`symbol_recognition`. The `symbol_trace` and `symbol_production` step
types exist (alphabet learner uses them) but the lesson generator
doesn't emit them. Should the curriculum lesson player ramp from
recognition → trace → production for each new kana? Pros: cements
muscle memory. Cons: dramatically lengthens each lesson.

Recommended: optional `includeProduction: boolean` on `RowDef`. Off by
default; turn on after MVP A/B-testing shows learners want it.

### 4. WanaKana IME for hard-mode lessons
Spencer's answer locked in: tile builds now, WanaKana for harder
lessons / "hard mode". When the time comes:

- Install `wanakana` (~12 kB gz, MIT). Wrap the existing
  `TranslateStepView` textarea with `wanakana.bind(inputEl)` so
  romaji-as-typed converts to kana live.
- Add a `useIme: boolean` flag on `TranslateStep` so legacy translate
  steps remain unchanged.
- Add a "Mastery mode" toggle on the lesson list that swaps build →
  type for production steps.

### 5. Backend kana mastery sync
Spec §6.3 + §9. The frontend store is localStorage-only; a parallel
SQLite + DynamoDB endpoint family at `/api/core/v1/japanese/kana/*`
needs to land in `lingo-core` before learners switching devices can
keep helper-fade progress.

- Mirror the existing SRS `/state`, `/sync`, `/all` shape.
- Same delta-sync pattern as `srsSync.ts`.
- Mangum redeploy.

## Pedagogy + content polish

### 6. Distractor quality audit
Generator-picked distractors lean on a hand-curated `CONFUSABLES` map.
A few rows (especially ra/wa) fall back to a-row vowels — those are
weak distractors that don't teach the in-row distinction. Curate
better in-row sets after watching real users miss-tap.

### 7. Anchor word breakdowns
Lesson `teach` steps render the word + translation but skip the
existing `vocab.breakdown` field (mora-by-mora gloss). Worth wiring
back in for compound words — especially dakuten lessons where
learners should see ご + は + ん = "rice" with the new dakuten kana
highlighted.

### 8. Symbol intro — example field reinstated as a card
Image-5 fix dropped the `example` line entirely from `SymbolIntroStepView`.
Long-term the right move is a small "see it in context" card that
shows the example AFTER Continue is tapped, or a footnote-style mini-
chip below the symbol, not crowded next to it. The data is still in
the curriculum, just not rendered.

### 9. Romaji helper threshold tuning
`helperHidden` AND-gates on 20 exposures + 7-day interval. Once we
have telemetry on how fast learners cross those thresholds, tune. The
gate lives in one place (`features/japanese/kanaMastery/types.ts`) so
a one-line change suffices.

## Engineering hygiene

### 10. Lesson registration test
A unit test that imports the generator output and asserts every
`buildRowLesson` lesson:
- Has a unique `id`.
- Every `audioPick.promptAudioText` has a manifest entry.
- Every recognition step has exactly 4 options with the correct one
  in slot `a`.
- Every build step's `correctOrder` is a valid prefix of `tiles`.

Catches drift between curriculum edits and TTS regeneration.

### 11. TTS regeneration command
The current loop is: edit curriculum → run
`scripts/emit-tts-deck.mjs` → `cd lingo-core && python -m
scripts.tts.generate`. Wrap in a single npm script
(`npm run tts:regen`) for cleanliness.

### 12. Phase 3 — kanji ramp
Original spec §8. The `JapaneseAnnotation` type already accommodates
kanji (`surface=漢字`, `reading=かな`); the renderer's kanji branch
just emits a single `<ruby>` per segment. Phase 3 adds:
- `kanjiMasteryState` parallel store.
- Lessons that introduce 1-3 N5 kanji each, with kana fallback above.
- The `<AnnotatedJa>` segments branch already handles `surface ≠ reading`
  correctly — no renderer change.

### 13. Match pairs `audioPick`-style variant
Current match pairs are visual JA → English. Add an audio variant:
4 audio bubbles ↔ 4 kana tiles. Trains sound→symbol mapping in a
batched form, complementing the per-kana `audioPick` drill.

## Already shipped this session — for reference

- Renderer: AnnotatedJa with segments-mode + per-character helper
  visibility + tokenization (incl. yōon lookahead).
- localStorage kana mastery store + exposure tracking.
- TTS resolver + manifest + `useAutoPlayJaAudio` hook (350ms after
  mount, StrictMode-safe, Audio-element keep-alive set).
- Lesson primitives wired: Teach, MC (with audioOnlyPrompt),
  MatchPairs (Duolingo Match Madness — bidirectional, immediate
  feedback), BuildSentence, Translate, Listening*, Speaking.
- SymbolIntro: stroke animation + inline romaji-Play pill + TTS.
- SymbolRecognition: 2×2 grid + TTS auto-play of target kana.
- Progress chrome: 2× taller bar, larger counter + X.
- 13 lessons authored: a-row + 9 basic rows + 4 dakuten/handakuten,
  146 unique TTS phrases.
- Curriculum catalog + lesson builder for future row additions.
