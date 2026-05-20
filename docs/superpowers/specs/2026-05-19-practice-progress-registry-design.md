# Practice Progress Registry — Design

**Date:** 2026-05-19
**Owner:** Trevor Lichfield
**Status:** Draft (awaiting user approval before plan)
**Related:** `lingo-core/docs/adr/0001-progress-api-hybrid-rollup.md`, `lingo/docs/PROJECT_STATE.md`

---

## Problem

`src/features/practice/PracticePage.tsx` renders a hero "due ring", a streak/XP chip row, and a "recent activity" strip. Three of those still read from module-scope MOCK constants (`MOCK_PRACTICE_DUE_RING`, `MOCK_PRACTICE_WEEK_MINUTES`, `MOCK_LAST_TOUCHED_HOURS`). Each individual practice domain (alphabet, particles, kanji, grammar, flashcards, stories, videos) already has its own progress surface — but every consumer reaches into a different store with a different shape, so the Practice page can't aggregate generically and adding a new domain means editing PracticePage.

**Goal:** introduce a thin per-domain progress contract so (a) the Practice hub renders real per-domain data uniformly, (b) each domain page can render its own progress summary from the same source, and (c) new domains plug in via one provider file with no edits to PracticePage.

**Non-goal:** rebuild the existing per-domain storage. Each provider wraps what's already there.

---

## Backend reuse — REUSE the existing progress table

`lingo-core` already has the right shape, accepted in ADR-0001 (2026-05-19) and provisioned in `lingo-infra/main.tf` as `aws_dynamodb_table.progress`. Four SK shapes under each user PK:

```
SK = ATTEMPT#<lessonId>#<isoTs>    immutable per-attempt log
SK = LESSON#<lessonId>             eager: best score, attempt count, latest attempt time
SK = DAY#<YYYY-MM-DD>              eager: lessonsCompleted, minutesActive, xpEarned
SK = CONCEPT#<conceptId>           LAZY: encounters / correctCount / lastSeenAt / recentResults
```

The `CONCEPT` rollup is the per-domain progress backbone. Already specified in `app/db/protocols/progress.py`, returned by `GET /progress/me` as `ProgressSummary.concepts[]`. Sqlite impl is wired (`app/db/sqlite/progress.py`); Dynamo impl is the only "new repo class" required and is a chore not a design question — the protocol and SK shapes are locked.

**No new tables.** The only backend code added is `app/db/dynamo/progress.py` (concrete implementation of the existing protocol), which is a pre-existing backlog item and can ship independently of this spec — sqlite-backed prod would work in the interim.

### Concept ID namespacing (new convention)

To let providers filter `concepts[]` cleanly:

```
<domain>:<lang>:<scriptOrSubdomain?>:<itemId>
```

Examples:

```
alphabet:ja:hiragana:あ
alphabet:ja:katakana:ア
alphabet:ko:hangul:ㄱ
particle:ja:は
particle:ko:은
kanji:ja:日
grammar:ja:te-form
vocab:ja:annyeong
```

This convention is documented in the ADR as a one-section addition. The conventional shape is enforced by `conceptId.ts` helpers (`buildConceptId`, `parseConceptId`) so no provider hand-formats strings.

### Practice attempt submission

Non-lesson trainers (e.g., a 30-second hiragana drill) need to flow through `POST /progress/lessons/batch` to update concept rollups. We use synthetic lesson IDs prefixed `practice:`:

```
practice:alphabet:ja:hiragana:<sessionUuid>
practice:particle:ja:<sessionUuid>
```

The batch handler's prerequisite check (existing logic that requires the prior lesson in a module to have ≥1 attempt) is skipped for any `lessonId` starting with `practice:`. Single-line change in `app/progress/router.py`. No new endpoint.

---

## Frontend architecture

### File layout

```
src/features/practice/progress/
├── types.ts                     DomainProgressSummary, ProgressProvider, ProgressStatus
├── conceptId.ts                 buildConceptId / parseConceptId
├── registry.ts                  practiceProgressRegistry: ProgressProvider[]
├── usePracticeProgress.ts       hook: Map<domainId, DomainProgressSummary>
├── useAggregateProgress.ts      hook: { domainsWithDue, totalDomains, totalDueItems }
└── providers/
    ├── alphabetProvider.ts
    ├── particleProvider.ts
    ├── kanjiProvider.ts
    ├── grammarProvider.ts
    └── flashcardsProvider.ts
```

### The contract

```ts
// types.ts
export type ProgressStatus = "untouched" | "in-progress" | "mastered";

export interface DomainProgressSummary {
  domainId: string;                      // "alphabet" | "particles" | "kanji" | "grammar" | "flashcards"
  labelKey: string;                      // i18n
  iconName: IconName;
  totalItems: number;
  masteredItems: number;
  inProgressItems: number;
  dueItems: number;                      // drives Practice hero ring
  lastTouchedAt: string | null;          // ISO 8601
  nextActionTo: string;                  // langPath where to resume
  nextActionLabelKey: string;
  /** Optional per-domain extras kept opaque to consumers. */
  extras?: Record<string, unknown>;
}

export interface ProgressProvider {
  domainId: string;
  /** Pure read. Cheap. Called inside React render. */
  getSummary(args: {
    langId: string;
    /** ProgressSummary.concepts for the user, server-cached. */
    concepts: ConceptRollup[];
  }): DomainProgressSummary | null;     // null = domain not applicable for this lang
  /** Optional: subscribe for live updates (storage events, in-memory pub-sub). */
  subscribe?(listener: () => void): () => void;
}
```

### Data flow

```
GET /progress/me   ──→  useProgressSummary (TanStack Query, 60s staleTime)
                           │
                           ├──→ useUserStats (today)              streak/xp/level/lingots
                           │
                           └──→ usePracticeProgress(langId)
                                    │
                                    ├──→ for each provider in registry:
                                    │        provider.getSummary({ langId, concepts })
                                    │
                                    └──→ Map<domainId, DomainProgressSummary>

PracticePage hero ring  ── useAggregateProgress() ──→ { due, total }
PracticePage strip      ── usePracticeProgress() ──→ ordered by lastTouchedAt desc
Domain page             ── direct call to its own provider for its summary card
```

### Provider responsibilities

Each provider:

1. Reads the cached `/progress/me` payload's `concepts[]` (passed in)
2. Filters by its prefix (`alphabet:<langId>:*`, `particle:<langId>:*`, etc.)
3. Joins against its local item catalog (`kanaConfig`, `particleList`, etc.) to compute `totalItems`
4. Derives status per item:
   - **mastered**: `encounters ≥ 6` and `recentResults` accuracy ≥ 0.85
   - **in-progress**: at least 1 encounter, not mastered
   - **untouched**: no concept rollup
5. Derives `dueItems`:
   - Items with `lastSeenAt` older than the domain's review interval, OR
   - Items whose `recentResults` last-3 are <50% correct
6. `lastTouchedAt` = max `lastSeenAt` across the domain's concepts (null if untouched)
7. Returns `DomainProgressSummary` or `null` if the domain has no items for the current language (e.g., kanji on Korean)

Each provider's mastery/due thresholds live as exported constants in the provider file. Tunable without changing the contract.

### `flashcardsProvider` exception

Flashcards has no concept rollups — SRS state is the source of truth and lives in `app/srs` (separate ADR concern). The flashcards provider reads `useFlashcardDueSummary` + the local SRS store directly. Its `getSummary` ignores the `concepts` argument. This is a deliberate exception documented in the provider file.

---

## Migration sequence (no Big Bang)

| # | Step | Verifies |
|---|---|---|
| 1 | Land `types.ts` + `conceptId.ts` + empty registry + unit tests | Compiles, type-checks, no behavior change |
| 2 | Add `useProgressSummary` hook (full payload). Refactor `useUserStats` to derive from it so we don't double-fetch. | Existing AccountOverviewCard + practice page hero still render identically |
| 3 | Wire `alphabetProvider`. Migrate `alphabetProgress.ts` writes to ALSO submit synthetic `practice:alphabet:*` attempts via the batch endpoint. Reads prefer server concept rollups, fall back to local. | Alphabet practice page shows real progress; storybook still renders |
| 4 | Wire `flashcardsProvider` (no concept dependency) | Flashcards hub card shows real due count via the registry, not direct hook call |
| 5 | Wire `grammarProvider` (reads lesson `introduces_concept_ids` + `moduleReviewSchedule` for due) | Grammar section in Practice shows real last-touched |
| 6 | Replace `MOCK_PRACTICE_DUE_RING` → `useAggregateProgress` | Hero ring shows real domains-with-due |
| 7 | Replace `MOCK_LAST_TOUCHED_HOURS` → render `usePracticeProgress` ordered by `lastTouchedAt` | Recent-activity strip shows real timestamps |
| 8 | Particle/kanji providers (return `{ totalItems: 0 }` until their stores are seeded) | Practice page tolerates partial coverage |
| 9 | Backend: add `app/db/dynamo/progress.py` so prod can run off Dynamo | Existing SQLite-backed tests continue to pass; new Dynamo integration test passes |

Each step is independently reviewable and revertable.

---

## What stays mocked after this spec

These belong to separate specs and are intentionally not addressed here:

- **Weekly minutes / today's minutes** (`MOCK_PRACTICE_WEEK_MINUTES`, `MOCK_PRACTICE_TODAY_MIN`) — telemetry topic; `day_rollups` already exists server-side but client aggregation/render isn't designed yet
- **XP award rule tuning** (`app/progress/xp.py` exists)
- **Lingot earning flows**
- **Concept skill-heatmap UI** (Learn page concern)

---

## Risks & open questions

1. **Mastery / due thresholds** — picked sensible defaults (`encounters ≥ 6 && accuracy ≥ 0.85` for mastered). Will need tuning once real users hit it. Living as named constants in each provider; not in the contract.
2. **Synthetic lesson IDs for non-lesson practice** — the backend will see a steady trickle of `practice:*` rows in `ATTEMPT` and `LESSON` SK partitions. Storage is cheap (PAY_PER_REQUEST), but it bloats the `LESSON` partition with one-shot rows. Mitigation: the batch handler can choose to skip writing the `LESSON` rollup when the `lessonId` starts with `practice:`, only writing `ATTEMPT` + `CONCEPT` invalidations + `DAY`. Confirm with backend owner before implementing.
3. **Local-first migration window** — between step 3 and step 9, alphabet writes go to both local storage and the server. Local storage stays authoritative for offline. After step 9 we can drop the local mirror in a follow-up.
4. **The Dynamo concrete repo** is a chore but it's blocking step 9. Without it, prod still runs sqlite and progress doesn't persist across deploys.

---

## Acceptance criteria

- `PracticePage.tsx` has zero `MOCK_*` constants for due-ring and last-touched
- Adding a hypothetical new "writing" domain requires one new file `providers/writingProvider.ts` and a one-line registry entry; no edit to `PracticePage.tsx`
- Each existing domain page can render its own progress card from the same provider it registered
- A new conceptId only enters the system through `buildConceptId(...)` — no string concatenation
- `npm run test:run` and `npm run test:e2e` pass
