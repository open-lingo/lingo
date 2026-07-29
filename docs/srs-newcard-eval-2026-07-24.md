# SRS new-card evaluation — 2026-07-24

READ-ONLY investigation. Frontend `/home/trevor/projects/open-lingo/lingo`, branch `main`.
No code changed. File:line citations throughout.

---

## Part 1 (PRIORITY) — perpetual "dirty" count = new-card count

### What the UI shows

- `SyncManager.tsx` renders `source.dirtyCount` per source (`SyncManager.tsx:261`) and
  the warning state is `hasDirty = visibleSources.some(s => s.dirtyCount > 0)`
  (`SyncManager.tsx:66`).
- The SRS source's count is
  `dirtyCount: Object.keys(getDirtyCards()).length` (`useSRSSyncStatus.ts:11,18`),
  fed to the widget via `useSRSSyncSource.ts:15,30`. Polls every 2s + on store revision,
  so it reflects `getDirtyCards()` live.
- `getDirtyCards()` → `computeDirtyCards(getSRSStore())` (`srsSync.ts:40-42`).

### The dirty rule and where new/seeded cards enter it

`computeDirtyCards` (`srsSync.ts:16-33`) flags a card dirty when:

```ts
const lastReview = cardLastReviewedAt(state);          // srsSync.ts:20
if (!state.lastSyncedAt || lastReview > state.lastSyncedAt) { ... }   // srsSync.ts:23
```

A seeded-but-never-reviewed card enters this set two ways, and — critically — the FIRST
push does **not** clear it. Root cause is a **future-dated derived timestamp**:

1. **Seeds have no top-level `lastReviewedAt`.** `seedUnlockedAtomsDueNextDay`
   (`seedSchedule.ts:23`, called at `LessonPage.tsx:402`) writes `createSeededState(due)`
   (`srs.ts:149-157`). Placement writes `createPlacementSeedState()` (`applyPlacement.ts:34-47,133-145`).
   Neither sets the top-level `lastReviewedAt` field. Both set each sub-state's
   `lastReviewDate = todayStr()` (the UTC calendar date), via `createInitialSubState`
   (`srs.ts:116-128`).

2. **`cardLastReviewedAt` therefore falls back to noon of the seed day.** With no
   top-level `lastReviewedAt`, `cardLastReviewedAt` returns
   `` `${day}T12:00:00.000Z` `` where `day = cardLastReviewDate(state)` = today's date
   (`srs.ts:415-419`, fallback literal at `srs.ts:418`). So the card's effective
   "last review" is **12:00 UTC of the day it was seeded** — even though it was never reviewed.

3. **The push happens, `markSynced` stamps `lastSyncedAt = now`, but the noon timestamp
   is still in the future relative to a morning sync.** `buildSyncPayload` includes every
   dirty card, seeds included (`srsSync.ts:153-158`). The server is content-agnostic and
   echoes back every submitted id (`srsSync.ts:222,235`; verified note at `srsSync.ts:224-234`),
   so `performSyncNow` runs `markSynced(returnedIds)` → `lastSyncedAt = new Date().toISOString()`
   (`srsSync.ts:62-66,236`). If the sync completes **before 12:00 UTC** on the seed day, then
   `lastSyncedAt` (e.g. `…T03:15:00Z`) is *earlier* than the derived
   `lastReview` (`…T12:00:00Z`). ISO string compare: `"…T12:00:00.000Z" > "…T03:15:00.000Z"` → **true**.
   The card is re-flagged dirty on the very next `computeDirtyCards` scan.

4. **The round trip never persists a real `lastReviewedAt`, so it re-derives noon forever.**
   `computeDirtyCards` stamps `lastReviewedAt: lastReview` onto the **payload copy** only
   (`srsSync.ts:26-28`) — never into the stored card. After the push, `mergeServerState`
   runs (`srsSync.ts:238`): the server's echoed card carries the noon stamp, but the local
   seed *derives* the identical noon value, so `serverIsNewer =
   cardLastReviewedAt(serverCard) > cardLastReviewedAt(localCard)` is `false`
   (`srsSync.ts:117-125`) and the local card is left untouched — still with **no** top-level
   `lastReviewedAt`. Next scan re-derives noon-today again. Perpetual.

### Exact mechanism (why perpetual)

> A never-reviewed seeded card's "last review" is *derived* as noon-UTC of its seed day
> (`srs.ts:418`), which is **in the future** for any sync that completes earlier that same
> UTC day. Because `markSynced` records the *actual* (earlier) wall-clock time and the local
> store never persists a real `lastReviewedAt`, the `lastReview > lastSyncedAt` test at
> `srsSync.ts:23` stays true after every push. The card is re-counted dirty on every 2s poll
> until wall-clock UTC passes 12:00 of the seed day.

Because lessons continuously seed 4-8 new atoms each (and placement seeds a whole batch at
once), and because active-use hours for Western-hemisphere users routinely fall in the
00:00–12:00 UTC window, the dirty count settles at a floor **equal to the count of
today's seeded/new cards** and won't clear — exactly the reported symptom. Placement is the
worst case: `createPlacementSeedState` seeds `state:"learning"`, `dueDate: today`
(`applyPlacement.ts:39-42`), so those cards are simultaneously *due today* AND *perpetually
dirty*.

### Precise defect locations

- **Primary:** `srs.ts:418` — `cardLastReviewedAt` fallback expands the day to
  `T12:00:00.000Z`, producing a future-dated timestamp for same-day seeds.
- **Contributing:** `srsSync.ts:23` — the dirty rule counts any card with genuine review
  progress OR merely `!lastSyncedAt`, so never-reviewed reps-0 seed shells are pushed as if
  they were reviews. This also pollutes the server card map with reps-0 states.
- **Contributing:** `srsSync.ts:26-28` stamps `lastReviewedAt` on the payload copy but never
  persists it locally, so the future-dated value is re-derived on every scan.

### The failing tests are an environmental flake, NOT a regression guard for this bug

`npx vitest run srsSync.test.ts grammarSync.test.ts` → **31 failed / 2 passed**. Every failure
is `Error: Hook timed out in 10000ms` in the `afterEach(() => vi.useRealTimers())` hook
(`srsSync.test.ts:70`) — the whole file cascades from a fake-timers/hook-timeout issue; the
assertions never execute. This matches the "inherited from a recent commit" note.

Crucially, **no test in either file exercises the seeded-card-syncs-and-clears path.** The
`getDirtyCards` tests only use `learnedCard(...)` (`srsSync.test.ts:75-109`); the `freshCard`
(never-reviewed) tests only cover *merge/reset-preservation* LWW (`srsSync.test.ts:140-189`),
never dirty-count clearing after a push. So the bug is a genuine, untested gap — the failing
tests are hiding nothing here; they're just an unrelated timer flake.

### Recommended fix (do NOT apply)

Two small, decisive changes — the first is the robust universal fix, the second aligns
behavior with the "only reviews count" invariant:

1. **`srs.ts:418` — stop future-dating the derived fallback.** Change the fallback expansion
   from `` `${day}T12:00:00.000Z` `` to `` `${day}T00:00:00.000Z` ``. Start-of-day is `≤` any
   same-day sync time, so a seed clears on its first push **regardless of time of day**, and
   the change is LWW-conservative (a legacy card with no top-level `lastReviewedAt` merely
   looks 12h older, so the server wins same-day ties — safe). This fixes seeds, placement
   seeds, AND deliberate resets (which share the same never-reviewed noon-derived shape and
   otherwise suffer the identical morning-perpetual behavior). `reviewCard` always writes a
   real top-level `lastReviewedAt` (`srs.ts:227-229`), so this fallback only ever affects
   never-reviewed/legacy cards.
   - Note: this shifts the expected value in `srsSync.test.ts:99-109` from `…T12:00:00.000Z`
     to `…T00:00:00.000Z` — update that assertion.

2. **`srsSync.ts:23` — don't count never-reviewed reps-0 shells as dirty.** Add a guard so
   only cards carrying real review progress (or a deliberate reset that must propagate) are
   pushed: skip a card when `!state.lastReviewedAt && !isLearnedState(state) &&
   !state.manualResetAt` (helpers already exported at `srsSync.ts:94,84`). This zeroes the
   perpetual count immediately and stops seed shells polluting the server. Caveat: unlock
   seeds would then no longer persist their next-day due date cross-device — acceptable
   because seeding is a deterministic client-side side effect of lesson completion, but call
   it out. (If cross-device seed persistence must be kept, ship change #1 alone — it fully
   clears the perpetual count while still pushing seeds once.)

   Note change #2 alone is **not** sufficient for placement seeds: `createPlacementSeedState`
   uses `state:"learning"`, so `isLearnedState` returns `true` (`srsSync.ts:94-101`) and those
   cards stay in the dirty set — only change #1 clears them. Recommend shipping **#1**
   (minimum) and **#1 + #2** (best).

---

## Part 2 — new-card introduction + SRS fidelity

**Headline: FSRS is respected on the grading path, but new-card *intake* leaks around the
daily cap because unlock/placement seeding writes SRS state, and seeded cards inflate both the
due count and (per Part 1) the dirty count.**

### How new cards are introduced

- **Unlock → seed due-next-day.** Content-lesson completion calls `unlockLessonAtoms` then
  `seedUnlockedAtomsDueNextDay(lesson.id)` (`LessonPage.tsx:400-403`), which writes
  `createSeededState(today+1)` for each SRS-eligible atom with no existing state
  (`seedSchedule.ts:23-34`). Due **next day** (never same-day) — good practice
  (`seedSchedule.ts:10-18`).
- **Placement → seed due-today.** `applyPlacementResult` seeds every eligible atom in
  passed/assumed modules with `state:"learning"`, `dueDate: today` (`applyPlacement.ts:34-46,
  133-145`). This is **same-day due**, contradicting the next-day principle the unlock path
  deliberately follows.
- **Reviewer queue.** `buildReviewQueue` (`reviewQueue.ts:99-142`) partitions unlocked cards:
  `!state` → `unseenCards` (the daily-capped "new" pile); `isDue(state)` → `review` pile.
- **Intake cap.** `adaptiveNewCardsPerDay` = base 5, scaled to drain the backlog over 21 days,
  capped at 15 (`reviewQueue.ts:5,13-23`). Course-deck path passes no explicit cap so it's
  adaptive (`useFlashcardDueSummary.ts:118`); subscription decks apply the user setting
  `settings.flashcards.maxNewCardsPerDay` (`useSubscriptionQueue.ts:120-122`).

### What FSRS respects (good)

- Only reviews advance card state: the `shouldWriteSrs(step)` gate blocks teach steps
  (`LessonPage.tsx:588`, `_stepPredicates.ts:55`).
- `TARGET_RETENTION = 0.90`, deliberately chosen over 0.95 to avoid doubling review load
  (`srs.ts:46`).
- Leech handling: tag + auto-bury at 8 lapses for 4 days (`srs.ts:70-71,233-235`); `isDue`
  respects `buriedUntil` (`srs.ts:288-291`).
- Receptive-before-productive stagger of 3 days (`srs.ts:61,138,155`).
- Same-fact sibling burial in the queue (`reviewQueue.ts:87-97`).

### Where it diverges from good SRS practice (issues)

1. **Seed-on-unlock bypasses the daily new-card cap.** `buildReviewQueue` only throttles cards
   with **no** state (`reviewQueue.ts:110-119`). Seeded cards *have* state, so they enter the
   `review` pile uncapped the day they come due. The adaptive cap therefore governs only the
   truly-stateless remainder (e.g. the ~553 "future" `JA_COURSE_ATOMS`), while the *actual*
   intake — lesson unlocks, potentially several lessons/day × 4-8 atoms — is ungoverned. The
   throttle is largely cosmetic for the course path.
2. **Placement floods same-day due.** Placement seeds `dueDate: today` (`applyPlacement.ts:41`),
   so a learner who tests out gets a large batch due immediately — the opposite of the
   next-day spacing the unlock path is careful to enforce.
3. **New/seeded cards inflate the due count.** `countCardsDue` sums due reviews + capped
   unseen (`reviewQueue.ts:240-259`); seeded cards land in "due reviews," so the headline
   "N due" is partly never-reviewed cards, not spaced recall.
4. **New/seeded cards perpetually inflate the dirty count** — see Part 1.
5. **Latent LWW risk from placement seeds.** A placement seed is `state:"learning"` with a
   noon-today derived timestamp, so `isLearnedState` is true and `isResetState` is false; on a
   fresh-device hydrate it could beat *older* real server progress (`serverIsNewer` false at
   `srsSync.ts:117-125`). Guarded today only by the "don't clobber existing card" check at
   seed time (`applyPlacement.ts:143`). Fixing Part 1 change #1 (midnight fallback) mitigates
   this by making the seed look older.

**Recommendations:** route unlock/placement seeds through the same daily-intake throttle as
`unseenCards` (or don't write SRS state on unlock at all — surface unlocked-but-unseen atoms as
the "new" pile and let the reviewer admit them at the cap); seed placement due next-day like
unlocks; and report seeded-not-yet-reviewed cards separately from true spaced-recall "due" in
the headline count.

---

## Part 3 — feature scoping (feasibility only, NOT build)

### 3a) Core-6k frequency vocab as non-lesson cards, introduced "as they come up"

**Headline: feasible as a new optional deck + an "encountered" trigger, but the SRS-intake
plumbing and content-tagging are the real work; sourcing a licensed 6k list + art coverage are
the big unknowns.**

- **Where the list lives.** Mirror `JA_COURSE_ATOMS` (`courseAtoms.ts`, 749 atoms with
  `fromModule`, `introducedByLessonId`, `kind`, optional `kanji`) — but that type has **no
  frequency-rank field**, so a new `freqRank` (and a `deck: "core6k"` marker) is needed. Build
  a sibling `ja/core6kAtoms.ts` (and `ko/…`) rather than overloading the course deck, and
  extend `buildJaCourseDeck({unlockedIds})` / the deck registry to admit a second source.
- **Introduction trigger ("as they come up").** Today the *only* thing that materializes SRS
  state for an atom is lesson unlock (`unlockLessonAtoms` + `seedUnlockedAtomsDueNextDay`,
  `LessonPage.tsx:400-403`). There is no "this word appeared in a dialogue/sentence/reading"
  hook. You'd add an *encountered-atom* signal at content render time (dialogue/story/reading
  steps) that resolves surface text → atom id and, on first encounter, seeds the frequency
  card (respecting the daily intake cap — see Part 2, otherwise a single reading floods intake).
  Reuse the seed guard (`getCardState(id)` skip) so it never clobbers course progress.
- **Unlock-map / SRS interaction.** Frequency cards share one SRS store keyed by atom id
  (`ja:<bare>` per ADR-005), so they ride the same reviewer, dirty-sync (Part 1 fix applies),
  and leech/bury machinery for free. They must be admitted through the *capped* new-card path,
  not seed-with-state, or they inherit the Part 2 cap-bypass.
- **Per-language (JA vs KO).** Both have parallel `courseAtoms`; a KO 6k list is a separate
  sourcing effort. JA adds kana/kanji-form + the render-time kanji-reveal gating (`courseAtoms.ts:39`);
  KO needs romanization reading aids. Art/emoji resolution (`notoEmojiUrl`/`lingoArtUrl`) is
  per-word and today curated for ~662 N5 words — 6k words will have large emoji-coverage gaps.
- **Rough effort:** medium-large. Data model + deck registry + capped-intake wiring ≈ 2-3 days;
  the encounter-tagging pass across content is the long pole and is per-language.
- **Big unknowns:** (1) sourcing a **licensed** frequency 6k list (JLPT/BCCWJ-derived lists have
  licensing constraints); (2) art/emoji coverage for 6k words; (3) comprehensibility — dumping
  frequency-ranked words with no lesson context risks decontextualized rote cards, the exact
  anti-pattern the authored deck avoids.

### 3b) Optional "show conjugations" on vocab cards, wired to the conjugation trainer

**Headline: forms are already generated deterministically, so almost nothing needs *storing* —
the missing link is a `lemma → conjugation-class` mapping on vocab atoms, which the trainer
already has for its own curated pool.**

- **Forms are derived, not stored.** `conjugateVerb(dictionary, group, form)` and
  `conjugateIAdj(dictionary, form)` for JA (`ja/conjugationEngine.ts:137,171`) and
  `conjugateKo(lemma, cls, form)` for KO (`ko/conjugationEngine.ts:316`) generate every form
  on the fly from `(dictionary/lemma, class, form)`. So a "show conjugations" panel needs to
  store **nothing** except the inputs — call the engine at render time. Storing precomputed
  strings would only be worth it for caching, not correctness.
- **The one thing to store/derive: the word's conjugation class.** The engines need the verb
  `group` (godan/ichidan/irregular) or KO `KoStemClass` / adjective flag. `JA_COURSE_ATOMS`
  (`courseAtoms.ts`) carry **no** conjugation-class field — this is the gap. But the trainer
  **already** maintains exactly this map: `VERB_ENTRIES` / `ADJ_ENTRIES` in
  `ja/conjugationTables.ts` hold `{ dictionary, group, introducedAtModule }`
  (referenced from `ja/conjugation/formationDistractors.ts:14`, `provider.ts:230`). So linking
  a vocab atom to its conjugation type is a join on dictionary form against these tables (plus
  the KO equivalent), or adding an optional `conjugationClass?` field to the atom for words not
  in the trainer pool.
- **Wiring to the trainer.** The trainer resolves per-language via
  `useConjugation()` → `getLanguageModule(id).conjugation.trainer` (`practice/conjugation/useConjugation.ts`).
  A vocab card's "show conjugations" affordance would (a) resolve the atom → `(lemma, class)`,
  (b) render the derived forms inline, and (c) offer "drill this word" that seeds a
  `TrainerTypeSession` / `FreeDrillPage` scoped to that single lemma. The trainer's drill pool
  is already dictionary-keyed (`ja/conjugation/trainerSession.ts`, `drillPoolIsTaught.test.ts`),
  so scoping to one lemma is a filter, not new machinery.
- **Per-language coverage.** JA verbs + i-adjectives fully covered by the engine; na-adjectives
  and copula are simpler/partly out of scope. KO has `conjugateKo` + stem classes + na/verb
  distinction (`ko/conjugationEngine.ts:22-33`). ES has `es/conjugationTables.ts` but I did not
  confirm a generative engine — verify before promising ES.
- **Rough effort:** small-medium. The affordance + inline form render + "drill this word"
  handoff ≈ 1-2 days *if* the atom→class map is a clean join against
  `VERB_ENTRIES`/`ADJ_ENTRIES`; add time to backfill a `conjugationClass` field for vocab atoms
  outside the trainer's curated pool.
- **Unknowns:** class-attribution coverage for vocab atoms not in the trainer tables; irregulars
  the engine doesn't special-case; whether ES has a generative engine at all.

---

## One-file summary of citations

- Perpetual-dirty root cause: `srs.ts:415-419` (fallback `:418`), `srsSync.ts:16-33` (rule `:23`,
  payload-only stamp `:26-28`), `srsSync.ts:62-66,235-239` (markSynced/echo), `srsSync.ts:117-125`
  (merge no-op for seeds).
- Seeds: `seedSchedule.ts:23-34`, `srs.ts:116-157`, `applyPlacement.ts:34-47,133-145`,
  `LessonPage.tsx:400-403`.
- UI trace: `SyncManager.tsx:66,261`, `useSRSSyncStatus.ts:11,18`, `useSRSSyncSource.ts:15,30`.
- Intake/FSRS: `reviewQueue.ts:5,13-23,99-142,240-259`, `srs.ts:46,61,70-71,233-235,288-291`,
  `_stepPredicates.ts:55`, `LessonPage.tsx:588`.
- Part 3: `courseAtoms.ts`, `ja/conjugationTables.ts`, `ja/conjugationEngine.ts:137,171`,
  `ko/conjugationEngine.ts:316`, `practice/conjugation/useConjugation.ts`.
