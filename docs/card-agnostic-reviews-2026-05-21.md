> **Status: STALE SNAPSHOT (2026-07-20).** Point-in-time record; some specifics are now wrong. Kept for history — see docs/plan-code-reconciliation-2026-07-20.md §4.

# Card-agnostic review factories — catalog (2026-05-21)

## What "card-agnostic" means

A **card-agnostic** review factory has the signature `(idPrefix, target, distractorPool)` where:

- `target: ReviewAtom` — a minimal `{kana, meaningEn, emoji?, fromModule}` shape
- `distractorPool: ReviewAtom[]` — other atoms the picker can draw foils from
- the factory returns a fully-valid `LessonStep` with rotated correct slot, seeded distractors, and resolved audio keys

The crucial property: **the factory needs no other authored data**. No hand-picked distractor sentences, no per-step explanation strings, no curated tile banks. Anything in `JA_COURSE_ATOMS` (subject to per-factory eligibility — e.g. emoji presence) can be a target, and anything in the same pool can be a distractor.

## Why it matters

Per CLAUDE.md §"Vocab SRS unification" phase 6, the **flashcards practice surface** is where adaptivity earns its keep. The plan is for that surface to:

1. Read per-atom SRS state (`{recognition: SubState, production: SubState}`)
2. Pick the next due atom (struggle-weighted + interval-based, FSRS-shaped)
3. Generate a review **on the fly** that targets the right modality

That generation step requires factories that work for ANY atom without per-atom authoring overhead. The factories below are the catalog of what's available today, which can be promoted, and what's still missing.

The static lesson surfaces (`mock-ja-m{3-v2,4,5,6,7}.ts`) stay statically authored — moving review-tail construction into render time would require unwinding ~8,600 LOC and was explicitly rejected by the 2026-05-19 feasibility audit. Card-agnostic factories live ALONGSIDE the per-lesson authored ones; both are valuable in their own surface.

## Catalog of existing factories in `_jaGrammarHelpers.ts`

| Factory | Tests (modality) | Card-agnostic | Signal quality | Min data needed (if promote-candidate) |
|---|---|---|---|---|
| `vocab` / `phrase` | exposure (ungraded) | YES | n/a (no retrieval) | `{kana, meaningEn, romaji}` |
| `cloze` | particle production-in-frame | NO | very-clean binary | requires authored sentence frame + 3-4 plausible particle distractors |
| `build` | sentence production (tile bank) | NO | clean binary | requires authored tile bank + correctOrder; can't synthesize for any atom |
| `infoStep` | n/a (info card) | NO | n/a | n/a |
| `grammarRule` | n/a (teach) | NO | n/a | n/a |
| `speaking` | speech production | PARTIAL | noisy (whisper-graded) | `{kana, meaningEn}` — atom-shaped already; render-time spawnable |
| `dialogueLesson` | dialogue exposure | NO | n/a (composes phrase cards) | n/a |
| `selfExplain` | rule articulation | NO | clean binary | requires authored rule/surface/distractor strings — per-atom hand-write |
| `pickReviewAtoms` / `pickReviewAtomsWeighted` | n/a (helper) | YES | n/a | already card-agnostic |
| `reviewMatchPairs` | recognition pairs (kana↔meaning) | YES | clean binary | `{kana, meaningEn}[]` — already card-agnostic |
| `vocabMcq` | image MCQ (meaningEn cue → emoji pick) | YES | very-clean binary | `{kana, meaningEn, emoji}` + 3+ emoji-bearing distractors in pool |
| `assertNoSameAnswerCluster` | n/a (build-time guard) | n/a | n/a | n/a |
| `assertAnswerRotation` | n/a (build-time guard) | n/a | n/a | n/a |
| `assertNoConsecutiveSame` | n/a (build-time guard) | n/a | n/a | n/a |
| `translateStep` | typed production (whole utterance) | PARTIAL | noisy (typed match) | `{kana, meaningEn, romaji}` + acceptedAnswers list — needs romaji aliases curated; partial promotion possible |
| `listeningBuildSentence` | listening production (tile bank) | NO | clean binary | requires authored tile bank — same blocker as `build` |
| `listeningCompSentence` | listening comprehension (audio→meaning) | NO (sentence-form) | very-clean binary | sentence-form requires hand-authored distractor meanings. Atom-form = `audioMeaningMcq` (added 2026-05-21, below) |
| `sentenceMcq` | reading comprehension (English→kana) | NO (sentence-form) | clean binary | sentence-form requires hand-authored distractor kana. Atom-form = `translationMcq` (added 2026-05-21, below) |
| `dialogueListen` | dialogue comprehension | NO | clean binary | dialogue lines are inherently composed, not atom-shaped |

### Verdict legend

- **YES** — already card-agnostic; ready for flashcards-surface adaptive picker
- **PARTIAL** — atom-shaped but downstream concerns (e.g., `translateStep` needs accepted-answer romaji list; `speaking` quality depends on Whisper)
- **NO** — needs per-instance authored data (tile banks, distractor pools at the sentence-level, curated explanations)

### Signal quality legend

- **very-clean binary** — single right answer, easy to grade, low ambiguity
- **clean binary** — right answer is unique, some judgement on distractors needed but generally clean
- **noisy** — grader is stochastic (Whisper, fuzzy typed match)

## Promotion candidates (card-agnostic with light data work)

Three factories on the "promote to card-agnostic" list AFTER the three below ship:

1. **`reviewMatchPairs`** — already card-agnostic in form. The picker can call it on any subset of due atoms; just needs a wrapper that picks 4-6 atoms from a draw and emits the step.
2. **`translateStep`** — promote-able if we extend `CourseAtom` to carry `acceptedAnswers: string[]` (romaji + alt-kana). Currently the romaji is on the atom but a hiragana variant list is not.
3. **`speaking`** — `(idPrefix, atom) => speaking(...)` is trivial; gate by `audioText` derivable from kana (already true for all SRS-eligible atoms via TTS manifest).

## Three NEW factories shipped 2026-05-21

Added to `_jaGrammarHelpers.ts`. All follow the `(idPrefix, target, distractorPool)` signature.

### `audioImageMcq(idPrefix, target, distractorPool): WordImageMcqStep`

- **What it tests:** hear the word (TTS) → pick the matching emoji tile
- **Modality:** audio-recognition (audio→image)
- **Signal quality:** very-clean binary
- **Atom data needed:** `{kana, meaningEn, emoji}` + 3 emoji-bearing non-blocklisted distractors in pool
- **Throws when:** target has no emoji; target is in `WORD_IMAGE_MCQ_BLOCKLIST`; <3 valid distractors
- **Return type:** reuses `WordImageMcqStep` (existing renderer). `meaningEn` field set to `target.kana` so the prompt reads "What is the word for <kana>?" — audio plays the TTS and the learner matches to the emoji. The existing renderer falls back gracefully; a renderer-side audio-prompt mode upgrade is tracked separately.

### `audioMeaningMcq(idPrefix, target, distractorPool): ListeningComprehensionStep`

- **What it tests:** hear the word (TTS) → pick the English meaning
- **Modality:** audio-recognition (audio→meaning)
- **Signal quality:** very-clean binary
- **Atom data needed:** `{kana, meaningEn}` + 3 distinct-meaning distractors in pool
- **Throws when:** <3 valid distractors
- **Return type:** reuses `ListeningComprehensionStep`. This is the atom-form of `listeningCompSentence` (the existing factory is sentence-form with hand-authored distractor sentences). For atoms, distractors are other atoms' `meaningEn` strings.

### `translationMcq(idPrefix, target, distractorPool): MultipleChoiceStep`

- **What it tests:** read English meaning → pick the correct kana
- **Modality:** reading-production (English→kana, recognition direction)
- **Signal quality:** clean binary
- **Atom data needed:** `{kana, meaningEn}` + 3 distinct-kana distractors in pool
- **Throws when:** <3 valid distractors
- **Return type:** reuses `MultipleChoiceStep` with `optionsHideRomaji: true`. This is the atom-form of `sentenceMcq`. The prompt is English (the meaning), the options are kana.

## How the flashcards adaptive picker will use these (phase 6 spec hook)

Per atom + SRS state:

1. **Recognition modality due, has emoji** → `audioImageMcq` OR `vocabMcq` (alternate by streak)
2. **Recognition modality due, no clean emoji** → `audioMeaningMcq`
3. **Production modality due** → `translationMcq` (faster than typed `translateStep`; promote `speaking` later when picker can sense mic-on)
4. **Both modalities new in same session** → `reviewMatchPairs` over a 4-6 atom batch including the target (interleaves modality + provides easy-grade reps for adjacent atoms)

The picker reads `JA_COURSE_ATOMS` for the full pool, filters by `isSrsEligibleAtom`, draws the target from the SRS-due queue, and uses the rest of the pool as `distractorPool`. The factories' built-in `pickReviewAtoms` shuffle gives deterministic-per-id distractor sets so re-mounts stay stable.

## Open work (not blocking phase 6)

- Renderer enhancement: `WordImageMcqStep` could grow an `audioPrompt: boolean` flag so `audioImageMcq` doesn't have to overload `meaningEn`. Defer until the picker actually wires `audioImageMcq` into a live surface.
- `translationMcq` distractor quality could improve by sharing initial-mora with the target (per §13.7 audio-MCQ rule); requires kana-prefix sort on the pool. Defer until empirical signal from picker.
- `speaking` and `translateStep` graduate from PARTIAL to YES once the picker can opt-in to noisy-grader steps + we ship `acceptedAnswers` on `CourseAtom`.
