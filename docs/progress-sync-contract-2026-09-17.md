# Progress/SRS sync contract (2026-09-17)

Project review, storage lane A6 (correctness slice). Every claim below cites
`path:line` in the two repos as of this pass (lingo-core commits `44bff4e`,
`86cd159`; lingo/client this worktree). Server paths are in `lingo-core/`;
client paths are relative to this repo's `src/`.

## 1. The two batch endpoints

| | `POST /progress/lessons/batch` | `POST /srs/sync` |
|---|---|---|
| Router | `app/progress/router.py:67` `submit_attempt_batch` | `app/srs/router.py:48` `sync_cards` |
| Request cap | 100 attempts (`app/progress/schemas.py:100` `attempts: list[BatchAttempt] = Field(min_length=1, max_length=100)`) | 1000 cards (`app/srs/schemas.py:59` `MAX_SYNC_CARDS = 1000`) |
| Cap enforced by | Pydantic `max_length` — FastAPI 422s the **whole body** before the handler runs if exceeded | Pydantic `max_length` on `SRSSyncRequest.cards` (`app/srs/schemas.py:65`) |
| Client chunk size | `MAX_ATTEMPTS_PER_BATCH = 100` (`shared/api/progress.ts:18`), applied in `chunkAttempts` (`shared/domain/testOutSyncQueue.ts`, used by `lessonSync.ts:performLessonSync`) | `SRS_SYNC_CHUNK_SIZE = 1000` (`features/flashcards/engine/srsSync.ts:237`) |
| Write primitive | `TransactWriteItems` (2 items: `ATTEMPT#` + `CLIENT#`) per attempt (`app/db/dynamo/progress.py:196` `put_attempt`), plus a separate conditional `UpdateItem` per lesson/day rollup | One conditional `UpdateItem` per card, fanned out under a semaphore (`app/db/dynamo/srs.py:170` `upsert_cards`, `_WRITE_CONCURRENCY = 25` at `app/db/dynamo/srs.py:43`) |
| Per-item result | `BatchAttemptResult` per attempt, always (`app/progress/schemas.py` — `accepted`, `reason`, `xpEarned`, …) | `cards` dict keyed by the ids that landed; **additive** `failedCardIds: list[str]` (`app/srs/schemas.py`, added this pass) for the ones that didn't |

### Why these caps

- **100 attempts**: not a payload-size limit — measured to keep the batch
  well inside a comfortable request/response cycle and to bound the cost of
  `_process_one_attempt`'s several sequential DB round-trips per item
  (`app/progress/router.py:347`). A 490-row test-out batch hitting this cap
  and 422ing in full (no partial acceptance) was a real incident —
  `shared/api/progress.ts:9-16` documents it (TestFlight b18 #144) and is why
  every write path chunks client-side.
- **1000 cards**: the binding constraint is the Lambda's 30s timeout against
  `upsert_cards`'s per-card round trips, not the ~6MB Function URL payload
  cap (`app/srs/schemas.py:44-58`, comment above `MAX_SYNC_CARDS`). Sized so
  a batch finishes inside the timeout even fully serialized at ~8ms/card.

## 2. `clientAttemptId` derivation and server dedupe

- **New lesson attempt**: `crypto.randomUUID()` (`features/lesson/engine/lessonSync.ts:48` `newAttemptId`), one per completed lesson.
- **Mid-lesson draft**: `draft:<lessonId>` (`features/lesson/engine/lessonSync.ts:149`, `draftAttemptId`) — stable per lesson so repeated draft syncs update the same row instead of creating new ones.
- **Test-out / reconciled completion**: `reconcile-v1-<userId>-<lessonId>` (`shared/domain/progressReconcile.ts:119-121` `reconcileAttemptId`) — deterministic per (user, lesson), so two devices reconciling the same lesson produce one server row, not two.
- **Server dedupe rule**: `attempt_exists(user_id, client_attempt_id)` (`app/progress/router.py:376`, backed by `app/db/dynamo/progress.py:165` / `app/db/sqlite/progress.py:167`) is a `GetItem`/`SELECT` on `(PK=USER#<id>, SK=CLIENT#<clientAttemptId>)`. `put_attempt`'s `TransactWriteItems` additionally guards both the `ATTEMPT#` and `CLIENT#` puts with `attribute_not_exists(SK)` (`app/db/dynamo/progress.py:264-277`), so even a race between two concurrent identical submissions collapses into one write plus one no-op (`app/db/dynamo/progress.py:286-296`).

### The idempotency gap this pass closed

Before this pass, `attempt_exists is not None` alone meant "return
`accepted: true, xpEarned: 0` and stop" (`app/progress/router.py:340`,
pre-fix). `put_attempt` and its rollup writes
(`update_lesson_rollup`/`update_day_rollup`) are **not one transaction** —
they're 1-3 separate DynamoDB/SQLite calls. A failure between the first and
the rest (a repo error, or a Lambda execution environment freezing right
after a 500 response goes out) left the attempt durably logged but its
XP/streak/rollup contribution silently and *permanently* dropped: every
retry re-hit the same short-circuit.

The fix: a `rollupApplied` boolean on the `CLIENT#` row
(`app/db/dynamo/progress.py:247` write, `:81-97` `_attempt_item_to_dict`
default-True read for pre-migration rows (line 97: `"rollupApplied": bool(item.get("rollupApplied", True))`); SQLite mirror at
`app/db/sqlite/progress.py` `rollup_applied` column + `_MIGRATION_COLS`
backfill). `mark_rollup_applied` (`app/db/dynamo/progress.py:196-212`,
`app/db/sqlite/progress.py` same name) flips it once the rollups land. The
router now checks `existing.get("rollupApplied")` (`app/progress/router.py:377`)
before taking the no-op fast path; otherwise it takes a **repair path**
(`app/progress/router.py:417-463`) that reuses the durably-stored attempt row
and (re)applies the rollups instead of assuming they already ran.

**Legacy-row default matters**: a row written before this migration has no
`rollupApplied` attribute. Both repos default that to `True` (not `False`)
on read — treating a pre-existing row as "already processed" — so no
historical attempt gets silently re-rolled-up and double-counted the first
time an old `clientAttemptId` happens to be resent. Only rows created by the
new `put_attempt` explicitly start at `False`.

**Residual risk, bounded**: if `mark_rollup_applied` itself fails after the
rollups already landed, the next retry re-applies them once more (a bounded
over-count, self-terminating once the marker write succeeds) rather than the
pre-fix failure mode (permanent, silent under-count with no repair path at
all). A fully atomic 3-item `TransactWriteItems` (rollups + marker) would
close this residual window too, at 1.5x the WCU cost of every attempt, not
just the failing tail — judged not worth it for a failure mode this rare and
this much better than the status quo; see `app/progress/router.py:504-510`
for the in-code note.

## 3. Per-item isolation (both endpoints)

`submit_attempt_batch`'s per-attempt loop now wraps `_process_one_attempt`
in a `try/except` (`app/progress/router.py:118-152`): an unexpected
exception for one item becomes `BatchAttemptResult(accepted=False,
reason="server_error")` for that item only, instead of a bare 500 that
discards the results of every other item already processed in the same
request (their writes had already landed — only the *response* was lost).

`upsert_cards` (`app/db/dynamo/srs.py:170`) fans out per-card writes under
`asyncio.gather(..., return_exceptions=True)` (`app/db/dynamo/srs.py:213-215`,
changed this pass — previously a bare `gather()` with no
`return_exceptions`). This is a correctness fix, not style: `gather()`
without it raises on the first exception **without cancelling the sibling
tasks it already scheduled** — they keep running as orphaned background
work. On Lambda that's a data-loss vector, not just untidiness: the
exception propagates out through the whole request (a bare 500), and if the
execution environment freezes right after that response is sent, any
sibling card write that hadn't completed its await yet never runs at all.
`return_exceptions=True` guarantees every task is awaited to completion
(success or failure) before the function returns, so there is no unawaited
work outstanding when the response goes out.

`delete_cards` (`app/db/dynamo/srs.py:286-308`) got the same fix for the
same reason, though a lost delete isn't a data-loss risk the way a lost
write is — the card just stays.

## 4. Conflict rules

**Progress** (`app/db/dynamo/progress.py:392-441` `update_lesson_rollup`):
- `bestScore`: **best-wins** — `ConditionExpression="attribute_not_exists(bestScore) OR bestScore < :s"`; a non-improving attempt falls back to a second `UpdateItem` that bumps everything except `bestScore`.
- `firstPassedAt`: **first-wins** — `SET firstPassedAt = if_not_exists(firstPassedAt, :ts)`.
- `latestAttemptAt`, `attemptCount`: **latest/cumulative** — always overwritten / always incremented.
- Day rollup (`lessonsCompleted`, `minutesActive`, `xpEarned`): **cumulative ADD** (`app/db/dynamo/progress.py:461-475` `update_day_rollup`), keyed by server processing date (`date.today()`, `app/progress/router.py`), not the attempt's own `attemptedAt` — a repair-path retry landing on a later calendar day than the original attempt would add to *that* day's rollup. Not fixed here (pre-existing, low-probability: the repair path fires within the same sync cycle in practice); flagged for awareness.

**SRS** (`app/db/dynamo/srs.py:56-68` `_max_last_review`, `:254` `_write_if_newer`, `:267` `_put_full`):
- **LWW on the freshest review marker**: prefers the top-level `lastReviewedAt` ISO timestamp when present (`state.lastReviewedAt`, client-stamped in `features/flashcards/engine/srs.ts:435-439` `cardLastReviewedAt`), falling back to the modality `lastReviewDate` (date-only) for pre-timestamp rows. A bare date sorts before any same-day timestamp by string comparison, so the timestamp-carrying side always wins when both exist for the same day.
- **Conditional write**: `ConditionExpression="attribute_not_exists(lastReview) OR lastReview < :lr"` — the incoming write only lands if its marker is strictly newer. A loss falls back to one `GetItem` to merge any `buriedUntil` change and return the authoritative server state (`app/db/dynamo/srs.py:228-252` `_upsert_one`).
- **Local-reset override**: a card matching `isResetState` (`features/flashcards/engine/srsSync.ts:84-93`) is never overwritten by server "learned" state even if the server is nominally newer (`mergeStates`, `features/flashcards/engine/srsSync.ts:112-131`) — a deliberate user action (Card Manager reset) always wins client-side, independent of the server's own LWW.

## 5. Start-over reset flag

- Set by `markLessonProgressReset()` (`shared/domain/mockProgress.ts:209`), a per-active-user localStorage flag (`shared/domain/mockProgress.ts:204-206` `lessonProgressResetStorageKey`).
- **Honoured** by `useProgressMe`'s query function (`shared/hooks/useProgressMe.ts:40-44`, skips merging server lesson rollups into the local cache while set) and by `progressReconcile.ts` (`shared/domain/progressReconcile.ts:308`, `hasLessonProgressReset()` is the first gate in `runReconcile`, before any local→server catch-up attempt).
- **Not honoured** by exactly one path, by design: `pullFromServerIgnoringReset` (`features/sync/pullFromServerIgnoringReset.ts`), the Sync panel's manual "Pull from server (ignore local reset)" action for bug #176a — it clears the flag, forces a refetch, and lets that refetch merge normally. Every other code path (`progressSync.ts`, `progressReconcile.ts`) keeps honouring the flag; this is documented as the one deliberate override, not a second implementation of the guard.
- Server side: `DELETE /progress/me` (`app/progress/router.py:602-624`) wipes lesson/concept/day progress and resets streak, but **preserves XP, lingots, and level** — lifetime currency the user earned, by explicit design (docstring at `app/progress/router.py:611-613`).

## 6. Retry / backoff

- **`put_attempt` transact conflicts**: bounded retry with full-jitter exponential backoff, `_TRANSACT_MAX_RETRIES = 5` (`app/db/dynamo/progress.py:41`), `_transact_backoff` (`app/db/dynamo/progress.py:44-46`) — only for `TransactionConflict` (concurrent double-submit); a duplicate-row `ConditionalCheckFailed` is treated as the idempotent no-op immediately, no retry needed. Worst case ~1.5s total before giving up and re-raising (comment at `app/db/dynamo/progress.py:33-40`).
- **Throttling** (`ProvisionedThroughputExceededException` and friends): not retried at the application level anywhere in this codebase — relies entirely on botocore's own built-in retry policy (the shared `aioboto3` session, `app/db/dynamo/_session.py`, does not set an explicit `retries` mode in its `Config`, so botocore's default — `legacy` mode, up to 5 attempts with exponential backoff for retryable errors including throttling — applies). No raw `BatchWriteItem` calls exist on the hot write paths in either domain (only `delete_all_for_user`/`clear_all`'s bulk-delete reset paths use `Table.batch_writer()`, whose context manager auto-retries `UnprocessedItems` internally — not exercised by this audit since resets aren't on the sync hot path).
- **Client retry**: chunk-level. A chunk that throws is not retried immediately — `performLessonSync` (`features/lesson/engine/lessonSync.ts`) and `performSyncNow` (`features/flashcards/engine/srsSync.ts`) bank whatever chunks already landed, leave the rest dirty, and rethrow; the next periodic sync tick (30s) or manual "Sync now" resends only what's still dirty. `testOutSyncQueue.ts`'s `postAttemptChunks` follows the same "stop at first transport failure, keep the rest queued" rule.

## 7. Per-item result format

**Progress** (`BatchAttemptResult`, `app/progress/schemas.py`): `clientAttemptId`, `attemptId` (nullable), `accepted`, `reason` (nullable — `"duration_below_floor"`, `"server_error"` as of this pass, or a future prerequisite-check reason), `xpEarned`, `streakAfter`, `lingotsEarned`, `dailyTotalLessons`. Present for every attempt in the request, always — this endpoint never had a "silently drop from the response" failure mode; the gap was only that an *uncaught* exception could 500 the whole batch before any results were returned (§3).

**SRS** (`SRSSyncResponse`, `app/srs/schemas.py`, this pass): `cards` (only the ids that landed — omission means "not synced", the pre-existing client contract), `syncedAt`, and the new additive `failedCardIds: list[str]`. The client doesn't need `failedCardIds` to behave correctly (`returnedIds = Object.keys(serverState)` in `features/flashcards/engine/srsSync.ts:280` already treats any omission as unsynced, whatever the reason), but it's there for anyone who wants to distinguish "the server never saw this card" from "the server saw it and rejected the write."

## 8. What this pass deliberately did not change

- **Day-rollup date attribution on a delayed repair** (§4) — real but low-probability, and fixing it (attributing the rollup to the attempt's own date instead of processing date) is a bigger semantic change than this pass's scope.
- **Atomic rollup+marker write** (§2 residual risk) — the cost (1.5x WCU on every attempt) doesn't clear the bar for a failure mode this rare, per Spencer's "quantify, don't ship barely-beneficial" rule.
- **BatchWriteItem retry logic** — doesn't apply; neither hot write path uses `BatchWriteItem`. Documented here so the next person doesn't go looking for a bug that isn't there.
