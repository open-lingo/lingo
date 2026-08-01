# Frequency Vocab ("optional words") — implementation plan

**Branch:** `freq-vocab` · **Date:** 2026-07-24 · **Status:** ✅ SHIPPED to `main` (2026-07). Optional frequency-ranked vocab: model + resolver + deck + settings toggle + learn-path indicator.

## Goal
Optional, module-gated frequency vocabulary for **KO and JA**: words beyond the authored lessons that **unlock at ≤ the learner's reached module** (so they already have the grammar to handle them), flow through the existing SRS intake, and surface an "**X new words accumulated**" indicator in the learn path. Opt-in. The words are POS-tagged, so conjugable ones are ready for the conjugation trainer ("learn grammar as well").

## Architecture (integrates with existing seams — no parallel machinery)

### Data model
- **`FrequencyAtom`** per language: `{ id, surface, reading, meaningEn, pos, frequencyRank, unlockModule, conjugation?, source: "freq" }`. Reuse `PartOfSpeech` + the conjugation-link types already added.
- Registries: `ja/frequencyAtoms.ts` (`JA_FREQUENCY_ATOMS`), `ko/frequencyAtoms.ts` (`KO_FREQUENCY_ATOMS`).
- **`frequencyRankToModule(rank): number`** — buckets frequency rank into an unlock module (higher-frequency → earlier module), bounded to the content-module range. Monotonic non-decreasing. Single source of truth for gating.

### Unlock-by-module
- `getFrequencyUnlockedAtomIds(languageId, reachedModule, enabled): Set<string>` — ids whose `unlockModule <= reachedModule`, empty when `enabled` is false. `reachedModule` = the learner's max-reached module from progress.
- Merge these into the unlocked-id set the deck builder consumes (`buildCourseDeck` / `getUnlockedAtomIds` union), so frequency cards appear as unlocked cards only when opted-in AND module-reached. No change to lesson-driven unlocks.

### SRS intake (unchanged mechanism)
Frequency cards enter the **existing** throttled new-card intake (`buildReviewQueue` adaptive cap) — no flooding by construction. `unseenTotal` naturally accounts for them; `unseenTotal - newCount` is the throttled backlog.

### Opt-in
- `flashcards.frequencyVocab?: boolean` (default **false**) in settings. Off → frequency atoms never enter the deck/intake. Toggle in the Settings flashcards section (UI phase).

### Learn-path indicator
- Surface the accumulated backlog in `LearnPage` — "You have **X** new words ready" — shown only when `frequencyVocab` is on and backlog > 0; links to flashcards. Reuses the queue's `unseenTotal`/backlog count (frequency-aware).

## Data sources
- **JA (real data now):** derive `JA_FREQUENCY_ATOMS` from the existing `fromModule: "future"` `CourseAtom`s (~553, already POS-tagged) — assign `frequencyRank` (JLPT/order heuristic) + `unlockModule` via `frequencyRankToModule`. Immediate, licensed (our own content).
- **KO (pipeline + seed):** `scripts/ingest-ko-frequency.mjs` parses a 국립국어원-format list (word, freq/rank, POS) → `KO_FREQUENCY_ATOMS`. Seed a starter sample now; full 국립국어원「한국어 학습용 어휘 목록」+「현대 국어 사용 빈도 조사」ingest pending file download (**KOGL Type 1** — commercial OK, attribution "출처: 국립국어원", **no share-alike**; see `docs/ko-6k-vocab-sourcing-2026-07-24.md`). Do NOT use the CC-BY-SA GitHub lists.

## Testing
- Resolver: module-N unlocks rank buckets ≤ N; opt-in off → empty; reached-module respected.
- `frequencyRankToModule`: monotonic, bounded to content modules.
- Deck integration: frequency cards appear unlocked iff enabled + module reached; absent otherwise.
- Data validity: every frequency atom has `pos` + `unlockModule`; conjugable ones link to an engine class that conjugates (reuse the `posTagging.test.ts` pattern).

## Scope boundaries
**In (v1):** data model + resolver + module-gated unlock + opt-in + SRS-intake integration + learn-path indicator + **JA real data** + **KO seed + ingest pipeline**.
**Deferred:** full KO 6k ingest (needs the gov file downloaded); conjugation-trainer drilling these words (separate wiring — data is ready); an "encountered in a sentence/dialogue" introduction trigger; art/emoji coverage for frequency words; ES.
