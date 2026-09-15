# 2026-09-15 — TestFlight feedback, builds 17/18 (Spencer) — cross-device progress

Two screenshot items, **#144** (iPad, build 18, 12:26) and **#145** (iPhone,
build 17, 12:28), 2 minutes apart, same account. Crashes: 0. Shots at
`scratchpad/tf-b18/144.jpg` / `145.jpg`.

Both are one bug: **the test-out completions never reached the server**, so
they existed on the phone only. They are filed as one root cause with one fix.

Purpose: same working-sheet format as
[`2026-09-15-testflight-b15.md`](2026-09-15-testflight-b15.md) — located code
(file:line), root cause, fix, and what Spencer has to do to get his iPad
caught up. Server evidence is from `lingo-core` @ `43df253` (clean tree,
`main == origin/main`, so prod matches it).

## 1. Table

| # | Where | Class | Finding (one line) | Fix / effort | Spencer? |
|---|---|---|---|---|---|
| 144 | iPad, Learn map (landscape) | progress sync | Test-out completions were POSTed as ONE 490-attempt batch; the server caps a batch at **100** and rejects an oversized body in full (422, before the handler). Nothing persisted, so a second device has nothing to hydrate. | S — chunk + persist + retry (done) | N |
| 145 | iPhone, Home | progress sync | Same root cause, seen from the device that *has* the progress. Also: every synthesised row carried `durationSec: 1` against a server floor of `max(5, steps)`, so even a legal-sized batch was rejected row-by-row. | same fix | N |

**Not a decision item.** Both are mechanical defects with a client-side fix.
The only thing Spencer needs to do is the one-tap recovery in §4.

## 2. Per-item detail

### #144 — "I have progress up to module 31 but it marks these incomplete even though I've tested out"

- **Shot:** `scratchpad/tf-b18/144.jpg` (build 18, 12:26, iPad, landscape).
- **Quote:** "I have progress up to module 31 but it marks these incomplete even though I've tested out. Potential error in test out progress marker or rendering here."
- **On screen:** the landscape Learn map (desktop-mirroring layout, b18 iPad
  Phase B). **"YOU ARE HERE" sits on M1.** Right rail: "Your Progress — 1%
  course complete", **385 total XP**, **Level 1**, **2-day streak**, **58
  gems**, **18 flashcards due**. The Resume card offers "Vowe…" — an M1
  lesson. Every module past M1 renders locked/incomplete.
- **Located code:** `src/features/placement/engine/syncTestOutToServer.ts`
  (the mirror-to-server path), called once from
  `src/features/placement/PlacementTestPage.tsx:253`; local completions are
  written first by `src/features/placement/engine/applyPlacement.ts:109`
  (`markLessonCompleted`); the receiving device hydrates through
  `src/shared/hooks/useProgressMe.ts:44` → `mergeServerLessonRollups`
  (`src/shared/domain/mockProgress.ts:123`) and re-reads via
  `src/features/learn/hooks/useCompletedLessonIds.ts:24`.
- **Class:** progress sync (data loss, silent).
- **Root cause — two independent server rejections, both fatal, with the
  evidence:**

  1. **Batch size.** `buildTestOutAttempts` synthesises one attempt per lesson
     of every credited module and sends them in a single POST
     (`syncTestOutToServer.ts`, pre-fix line 66: `await
     progress.batchAttempts({ attempts })`). Measured against the real JA
     course: a **m32 test-out is 490 attempts** (m1 alone has 31 lessons, m2
     has 28 — `getMockCourse("ja")`), ~103 KB of JSON. The server caps the
     array at 100:

     ```python
     # lingo-core/app/progress/schemas.py:100
     attempts: list[BatchAttempt] = Field(min_length=1, max_length=100)
     ```

     FastAPI validates `body: BatchAttemptSubmission` *before*
     `submit_attempt_batch` (`lingo-core/app/progress/router.py:64`) runs, so
     the response is a flat **422 with zero rows written** — no partial
     success, no per-attempt `BatchAttemptResult`. There is no custom
     validation handler in the service, so the body is the generic Pydantic
     `too_long` detail.

  2. **Duration floor.** Even a ≤100-row batch would have persisted nothing:

     ```python
     # lingo-core/app/progress/router.py:362-377
     step_count = len(item.stepResults)
     min_duration = max(5, step_count)
     if item.durationSec < min_duration:
         return (BatchAttemptResult(..., accepted=False,
                                    reason="duration_below_floor"), 0, 0)
     ```

     Test-out rows carry `stepResults: []`, so the floor is **5s**, and the
     client sent **`durationSec: 1`** — with a comment asserting the opposite
     ("Server clamps to [1, 3600]"), which is true of the *schema*
     (`durationSec: int = Field(ge=1)`, `schemas.py:73`) but not of the
     handler. Rejected rows return before `put_attempt` /
     `update_lesson_rollup` (`router.py:390,419`), so no rollup exists to
     read back. The client's own lesson buffer already knew the real rule —
     `lessonSync.ts:197 minDurationSecForAttempt = max(5, stepResults.length)`
     — the test-out builder just never used it.

- **Why the failure was invisible:** the sync was fire-and-forget. The old
  code caught everything into `console.warn("[test-out] server sync failed")`
  and returned `{ submitted: 0 }`, with no retry, no persistence, and no UI.
  Worse, `submitted` counted rows *POSTed*, not rows *accepted*, so a
  100 %-rejected batch was indistinguishable from success in every caller.
- **What this rules out (checked, all innocent):**
  - **`/progress/me` is not capped or filtered.** `get_lesson_rollups`
    (`lingo-core/app/db/dynamo/progress.py:426-431`) paginates
    `SK begins_with LESSON#` to exhaustion — no `Limit`, no recency window, no
    per-module filter, and `ProgressSummary.lessons` carries no cache token.
  - **`/boot` is not a trimmed variant.** `lingo-core/app/boot/router.py:47`
    imports `get_my_progress` from the progress router and calls it
    (`router.py:90-99`), passing the result through unmodified
    (`boot/schemas.py:23` is the same `ProgressSummary` model). So the boot
    batching in `src/shared/api/bootCache.ts:42` cannot be losing lessons,
    and there is no camelCase/snake_case divergence between the two routes.
  - **`isTestOut` is not filtered out of rollups.** `update_lesson_rollup`
    (`progress.py:364-424`) takes no `isTestOut` argument at all; a passed row
    sets `firstPassedAt = if_not_exists(...)` exactly like a real completion.
    `isTestOut` only zeroes XP/lingots (`router.py:396`).
  - **The client hydrate path is correct.** New test
    `src/shared/hooks/useProgressMe.testOutHydrate.test.tsx` feeds a realistic
    `/progress/me` (490 test-out rollups for m1–m32) into the real hook on an
    empty localStorage and asserts the map lands on **m33** with m31
    `completed`. It passes unchanged, before and after the fix — so
    `firstPassedAt`/`bestScore` gating (`mockProgress.ts:85`), the snapshot
    cache (`progressSnapshotCache.ts`), and the language-resolution race in
    `useCompletedLessonIds.ts:40` are all exonerated. The rows were never
    there.
  - **Body size and Dynamo fan-out are not involved.** 103 KB against a 6 MB
    Lambda Function URL cap; each attempt is its own 2-item
    `TransactWriteItems`, nowhere near the 25/100-item caps.
  - **Not a rendering bug**, contra Spencer's hypothesis: 1 % complete and an
    M1 resume card are the *correct* render of an empty completion set.
- **Fix (client, shipped in this lap):**
  - `src/shared/api/progress.ts` — the two server limits are now named
    constants (`MAX_ATTEMPTS_PER_BATCH = 100`,
    `SERVER_DURATION_FLOOR_SEC = 5`) in the "Server schema mirrors" block,
    each citing its `lingo-core` file:line.
  - `src/shared/domain/testOutSyncQueue.ts` (new) — durable localStorage queue
    per user + `chunkAttempts` + `toServerLegalAttempt` (raises a row to the
    duration floor, keeps the 3600s ceiling) + `drainTestOutSyncQueue`, which
    removes **only the ids the server confirmed** (`accepted || attemptId`) and
    treats an empty `results` array as "not stored".
  - `syncTestOutToServer.ts` — `durationSec: 5`; rows are persisted *before*
    the network, then drained in ≤100-row chunks; returns
    `{ submitted, pending }` where `submitted` counts server confirmations.
  - `src/features/lesson/engine/progressSync.ts` — the queue drains inside
    `syncLessonProgressWithServer`, the choke point all three sync triggers
    already use (boot hydrate, the 30s tick, SyncManager "Sync now"), so a
    failed test-out retries on its own. The server is idempotent on
    `clientAttemptId` (`router.py:320`), so re-draining is free.
  - `src/features/lesson/engine/lessonSync.ts` — **same class, second
    instance:** `performLessonSync` also POSTed the whole pending buffer
    unchunked, so a long offline stretch (>100 buffered attempts) would have
    422'd forever behind a 10-minute backoff. Now chunked, with `checkStreak`
    on the first chunk only and the chunks that landed banked before a
    mid-flush failure is rethrown.
  - Visible state: `getLessonDirtyCount()` now includes the queued test-out
    rows, so the existing SyncManager row shows the pending count and its
    "Sync now" drains them; and `PlacementResultScreen` shows a warning
    `AlertBanner` ("Saved on this device … it will retry on its own") when
    `pending > 0`. No new sizing literals — `AlertBanner` primitive only.
- **Effort:** S (done). No server deploy required.
- **Needs Spencer:** N — only the recovery tap in §4.

### #145 — "This is real progress, is it not sending the progress externally?"

- **Shot:** `scratchpad/tf-b18/145.jpg` (build 17, 12:26–12:28, iPhone).
- **Quote:** "This is real progress, is it not sending the progress externally?"
- **On screen:** the Home hero showing the *correct* state for this account —
  "Volitional — よう/おう, とおもう, ことにする … **Lesson 3 of 12**" — with the
  same **58 gems / Level 1 / 2-day streak** as the iPad.
- **Class:** progress sync (same root cause as #144; this is the control
  observation that localises it).
- **Answer / finding:** Spencer's instinct is exactly right, and the pair of
  screenshots is the proof. The two devices agree on **gems (58), XP (~385)
  and streak (2)** but disagree on lesson completion. Those two facts come
  from *different* writes:
  - gems/XP/streak live on the **user row**, updated once per batch at
    `router.py:129-140` from ordinary lesson syncs — which are small, legal
    batches, so they land.
  - lesson completion lives in the **`LESSON#` rollup**, written only per
    accepted attempt (`router.py:419`) — and every test-out attempt was
    rejected.

  So the answer to "is it not sending the progress externally?" is: it was
  *sending* it, and the server was *refusing* it — 490 rows against a 100-row
  cap, each one also under the duration floor — and the client threw the
  refusal away. Same fix as #144.
- **Effort / Spencer:** see #144.

## 3. Correction to the b15 sheet

b15 **#123** recorded "Test-out marks only the tested module's lessons
complete (`applyPlacement.ts:96`)" and asked Spencer for his module history.
That is wrong, and #144 supersedes it: `applyPlacement.ts:104` credits
**passed AND assumed** modules (`if (!passedSet.has(mod.id) &&
!assumedSet.has(mod.id)) continue;`) — the assume-complete policy of
2026-07-12. Measured on the live course, a m32 test-out marks **490 lessons**
complete locally and `getCurrentModuleIndex` then returns **m33**, which is
what his phone showed in #145. The "resume goes back to an earlier module"
symptom in #123 was the *iPad* (empty local state), i.e. the same bug as #144,
not a placement-policy question. Nothing needs to be asked of Spencer for
#123 either.

Two latent items found while measuring, **not changed** in this lap:

- `LANGUAGE_PLACEMENT_CONFIG.ja.reviewLessonRe` (`applyPlacement.ts:49`) is
  `/^ja-m\d+-review-[12]$/`, but live review lessons are named
  `ja-m32-neo-review-1`. The regex matches nothing, so the "leave review
  lessons available after a test-out" intent is dead — all 124 review lessons
  are auto-completed. Left alone deliberately: the sync mirrors exactly what
  the local apply writes, so fixing one without the other would make the two
  devices disagree again. Worth one decision (keep auto-completing, or revive
  the intent in both places).
- `getCurrentModuleIndex` (`moduleProgress.ts:87-99`) does **not** filter
  review lessons, while `getModuleStatus` (`:64`) does. Harmless today because
  of the bullet above, but it means reviving the review-lesson skip would
  snap "YOU ARE HERE" back to m1 — fix both together if it's ever touched.

## 4. What Spencer has to do (iPad recovery)

**The server has none of it.** The rows were rejected, not stored, so there is
nothing to pull down and no amount of re-opening the iPad will help.

On **build 19** (this fix), on the **iPhone** (the device that holds the
progress):

1. Open the app and let it sit on Home for ~10 seconds. Nothing to tap: the
   fix drains on boot.
2. Re-run **one** module test-out and pass it. On the course map that is the
   **"Test out of M33"** button — the test-out button only renders on a module
   that is *not* already complete (`LearnCourseMap.tsx:250`), so M1–M32 no
   longer offer one; M33 is the next in line and is the one you were already
   testing in #126. Passing it credits **m1–m33** and now uploads the whole
   set in 5 server-legal chunks. Watch the result screen: if it shows the
   amber "Saved on this device" banner the upload didn't finish — it will
   retry by itself, or tap **Sync now** in the SyncManager.
3. Then open the **iPad**. It hydrates from `/progress/me` on launch and
   should land on **M33** with M1–M32 complete.

If you'd rather not re-run a test-out, the alternative is to do it from the
SyncManager — but only after step 2 has queued the rows; there is nothing to
sync until then.

**"Did I need to prompt it to save?"** — No. Nothing you did or didn't tap
caused this, and there is no button that would have helped. Saving has never
needed a prompt: normal lesson attempts buffer to localStorage the moment they
are graded and flush on a 30-second timer with backoff
(`LessonProgressHydrate.tsx:65-116`), which is why your XP, gems and streak
crossed over fine. (The old "I'm done — save my XP" button is gone; all that
survived of it is the binge-brake stop bit on Return,
`LessonComplete.tsx:134-140`.) The test-out mirror
was the one write path with no buffer, no retry and no visible state — it
fired automatically, the server refused all 490 rows, and the only trace was a
`console.warn` you could never see. That asymmetry is what this lap fixed.

## 5. Gates

- `npx tsc --noEmit -p tsconfig.json` — clean.
- `npx vitest run --project app src/features/placement src/shared/hooks
  src/features/learn/hooks src/features/lesson` — 1459 passed, 6 failed, all
  6 in `src/features/lesson/data/glossFidelity.test.ts` and
  `moduleCompiler.diagnostics.test.ts` (m11/m16/m34/m36/m37 gloss-mismatch
  diagnostics). Those are the concurrent curriculum lanes' in-flight edits to
  `courseAtoms.ts` / `moduleCompiler.ts` / m2x IR; both files read compiled IR
  from disk and import only `moduleCompiler`, so they share nothing with this
  change.
- New/changed tests: `syncTestOutToServer.contract.test.ts` (5, red→green),
  `testOutSyncQueue.test.ts` (6), `lessonSync.test.ts` (+2 chunking),
  `useProgressMe.testOutHydrate.test.tsx` (2, green throughout as the
  ruling-out control).

## 6. Optional server hardening

`scratchpad/tf-b18/lingo-core.patch` — exempts `isTestOut` rows from the
duration floor (a synthesised row has no elapsed time to police; `isTestOut`
already zeroes XP/lingots, which is what the floor protects). Defense in
depth only; the client fix stands alone.

The patch deliberately **does not raise `max_length=100`**. Quantified: 490
attempts × ~4 sequential DynamoDB round trips per attempt ≈ 2,000 round trips
in one invoke, 20–30 s at 10–15 ms each, against `timeout = 30`
(`lingo-infra/lingo_core_function.tf:148`). Raising the cap would trade a fast
422 for a coin-flip 504 that re-runs on every retry — so chunking has to live
on the client, and **builds ≤ 18 cannot be healed by a server change**; the
recovery in §4 needs build 19.
