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

---

## 7. Build 20: automatic reconciliation (supersedes §4)

**§4 is no longer needed. Do not re-run "Test out of M33".** Build 19 fixed the
*write* path but did nothing for the completions already stranded: its queue
only ever holds rows a **new** test-out produces, and the phone's m1–m32 were
credited by the test-out the server had already refused. That is why the iPad
still read 18 of 660 — 18 is all the server ever stored — and why no batch POST
larger than the 30 s tick has shown up in the logs since build 19 went live.

Build 20 closes it without a manual step.

### What happens on the first launch of build 20 (phone)

1. The app hydrates `/progress/me` as usual.
2. Immediately after that merge, it diffs **local completions − server
   rollups** (minus anything already queued or buffered, so nothing is sent
   twice). On the founder's phone that is ~482 lessons.
3. Those go into the same durable queue the test-out uses and are POSTed at
   once in 5 server-legal chunks — **not** on the next 30 s tick.
4. While they're in flight the SyncManager row shows its ordinary **dirty
   count** (the same badge test-out rows use). If the network drops, the
   amber **"Saved on this device"** banner / non-zero badge stays until the
   rows land; they retry on every later sync with no action needed.
5. Then open the **iPad**: it lands on **M33** with M1–M32 complete. Resuming
   the app is now enough — no relaunch.

It runs **once per device per user**: a marker (`lingo_progress_reconciled_v1_<userId>`)
records a hash of the ids posted, so an unchanged set is never re-posted. It
re-runs by itself if the local set grows past the server's again, or if the
marker is older than 30 days. The direction is **local → server only** — no
local completion is ever deleted for being absent server-side.

### Two things to expect

- **XP and gems do not move.** The rows go up flagged `isTestOut`, which the
  server already uses to zero XP and lingots (`app/progress/router.py:396-404`).
  You keep the progress; you don't get 482 lessons' worth of currency.
- **Today's activity will spike once.** `update_day_rollup` stamps
  `date.today()` regardless of when the lesson was actually done
  (`app/progress/router.py:421-427`), so the reconciliation posts ~482
  "lessons completed today" and ~482 active minutes into today's cell of the
  30-day graph. Per-lesson history is honest (`firstPassedAt` carries the real
  local completion time); only the daily bucket is wrong, for one day, once.

### Push and pull also got the triggers they were missing

Reported the same day: *"I close the app on my phone and nothing pushes, and I
open a lesson and nothing pushes."* Correct — the only push trigger was
`LessonProgressHydrate`'s 30 s interval, which runs only while the app is
foregrounded, and iOS freezes a backgrounded webview mid-timer. Build 20 adds
`useAppLifecycleSync`:

- **Backgrounding or closing the app** (`visibilitychange → hidden`,
  `pagehide`, and Capacitor `appStateChange` when `isActive` goes false) fires
  one last push-only flush, with `keepalive` on the POST so it survives the
  freeze. Debounced against the 30 s tick, so overlapping triggers cost one
  POST, not three.
- **Returning to the app** refetches `/progress/me` once and re-runs the diff
  above — this is what makes "finish on the phone, pick up the iPad" work
  without relaunching.
- The `GET /progress/me` storm (~11 in 5 s on the iPad) was four legitimate
  callers react-query could not see each other through: the hook, the
  `invalidateQueries` + `refetch()` pair after every sync, and the *direct*
  `progress.getMe()` inside `hydrateLessonProgressFromServer` that runs on
  boot, on the tick and on every lesson unmount. The redundant `refetch()` is
  gone and `ProgressApi.getMe` now coalesces: one in-flight promise per acting
  user plus a 1.5 s tail. Same wave, one GET.

### On the iPad's build-19 test-out that posted nothing

"Give & receive I" (12 items) produced zero batch POSTs. The engine is
exonerated: a **passed** module test-out drains inside the same call (queue
empties before the promise settles) and a **failed** one posts nothing and
queues nothing — both now pinned by
`syncTestOutToServer.drain.test.ts`. JA carries 660 lessons across 46 modules
with no empty module, so there was no "nothing to synthesise" path either. The
run did not pass. Nothing to fix; the reconciliation above makes the question
moot anyway.

### Gates (build 20)

- `npx tsc --noEmit -p tsconfig.json` — clean.
- `npx vitest run --project app src/shared src/features/placement
  src/features/lesson src/features/learn` — 2269 passed, 17 skipped, 0 failed.
- New tests: `progressReconcile.test.ts` (11), `useProgressMe.reconcile.test.tsx`
  (2), `progressMe.coalesce.test.ts` (3), `useAppLifecycleSync.test.tsx` (5),
  `syncTestOutToServer.drain.test.ts` (3) — all red→green except the drain
  trio, which was written to rule the engine in or out and passed first run.
  `useProgressMe.testOutHydrate.test.tsx` stays green as the server→local
  control.

## 8. #151 — light band at the top on iPad

- **Shots:** `scratchpad/tf-b19/{146,147,148,149,150}.jpg` (2360×1640, iPad
  Air 11" M4, iPadOS 26, TestFlight build 19, dark theme, landscape). Present
  on every screen (Home, Learn map, lesson steps).
- **Quote:** "the white line at the top of the iPad is still there."
- **On screen:** rows 0→55px down the top edge (sampled at x=200/sidebar and
  x=1400/content, both screenshots) go from RGB(116,113,106) at row 0 through
  a smooth gradient to the app's dark background — RGB(32,29,24) at x=200,
  RGB(24,20,17)/(23,19,16) at x=1400 — exactly the height of the iPad status
  bar (24pt × 2). The matching iPhone shots (`tf-b18/143.jpg`, `145.jpg`) do
  **not** show it: rows 0–100 there are flat RGB(32,29,24), identical to
  background, at every sampled x.
- **Located code:** `ios/App/App/SceneDelegate.swift` (`AppBridgeViewController`,
  `CAPBridgeViewController` subclass registered as the scene's root view
  controller); the underlap it's drawing over is intentional —
  `index.html:63` (`viewport-fit=cover`) + `src/routes/SidebarNav.tsx:41`
  (`aside … pb-safe pl-safe pt-safe landscapeLg:flex`, fixed-position, only
  mounted at the iPad-landscape breakpoint) + `src/routes/Layout.tsx:200`
  (`sticky top-0 … pt-safe` top bar, present at every width/orientation).
- **Class:** native shell / iPadOS 26 system chrome, not app CSS (grep for a
  gradient in the safe-area-top region found none — correctly, because
  there isn't one; this is drawn by UIKit itself).
- **Root cause.** iPadOS/iOS 26 added an automatic "scroll edge effect" —
  `UIScrollView.topEdgeEffect`, a `UIScrollEdgeEffect` — that UIKit now
  applies to *any* `UIScrollView` whose content extends under the status bar,
  **including a `WKWebView`'s own internal scroll view**
  ([Apple docs: `UIScrollEdgeEffect`](https://developer.apple.com/documentation/uikit/uiscrolledgeeffect),
  [`UIScrollView.topEdgeEffect`](https://developer.apple.com/documentation/uikit/uiscrollview/topedgeeffect)).
  It's meant to tint itself to the content underneath, but there's a
  still-open Apple/WebKit bug where a WKWebView's content is sampled
  incorrectly and the effect falls back to a light system default instead —
  exactly a light band over a dark app
  ([Apple Developer Forums #803917, "UIScrollEdgeElementContainerInteraction
  uses wrong mix-in color over WKWebView on iOS
  26.1"](https://developer.apple.com/forums/thread/803917); also broken/
  regressed across betas per
  [forum thread #795816](https://developer.apple.com/forums/thread/795816);
  tracked upstream at
  [WebKit PR #52365](https://github.com/WebKit/WebKit/pull/52365)). It's
  iPad-landscape-only here because that's the one layout where a
  `position: fixed` element (the sidebar `aside`) sits directly under the
  safe-area-inset-top with nothing scrolling past it — the iPhone layout and
  iPad portrait only ever put the in-flow `sticky` top bar there, which the
  effect happens to sample correctly.
- **Fix (`ios/App/App/SceneDelegate.swift`,
  `AppBridgeViewController.disableTopScrollEdgeEffect()`, called from
  `capacitorDidLoad()`):** `webView?.scrollView.topEdgeEffect.isHidden = true`,
  guarded `#available(iOS 26.0, *)`. This disables the extra system overlay
  on our own webview only — the real status bar (text/icons,
  `UIViewControllerBasedStatusBarAppearance`, `prefersStatusBarHidden`) is
  untouched.
- **Cold-launch cream flash (checked, not fixed):** `capacitor.config.ts`'s
  `ios.backgroundColor: "#f5f0e6ff"` is the light-theme cream, so a
  dark-preset learner still gets a cream flash before JS paints. There is no
  cheap native fix today — the app has no `@capacitor/preferences` plugin
  (only `@capacitor-community/speech-recognition`, `@capacitor/app`,
  `@capacitor/browser` per `cap sync`), so the stored theme
  (`open-lingo-theme` / `open-lingo-themes`, `src/shared/theme/storage.ts`,
  `src/shared/contexts/SettingsContext.tsx:333`) lives only in the
  WKWebView's own `localStorage`, which native code cannot read before the
  page loads without adding a plugin. Left as-is per the brief; a real fix
  means migrating the theme key to `@capacitor/preferences` (mirrors to
  `UserDefaults`, natively readable pre-launch) — out of scope here.
- **Verification:**
  - `xcodebuild -project ios/App/App.xcodeproj -scheme App -destination
    'platform=iOS Simulator,name=iPad Air 11-inch (M4)'` — **BUILD SUCCEEDED**
    both before and after the fix (iOS 26.5 simulator runtime).
  - Portrait dark/light, before and after the fix, on the booted simulator
    (`CAP_DEV_SERVER` harness against the running :5399 dev server,
    `VITE_DEV_AUTH_BYPASS`): rows 0–100 are a flat, uniform color in every
    case (dark bg RGB(16,14,11); light RGB(150,149,147) under the language
    modal) — no gradient before or after, i.e. the fix introduces no visible
    regression, consistent with portrait/iPhone never showing the defect in
    the first place (matches the field pixel data above).
  - **Could not verify the fix against the actual defect on this machine.**
    Physically rotating the iPad simulator to landscape requires either
    Simulator.app UI automation (`Hardware ▸ Rotate` / ⌘←/⌘→) or a raw
    CoreSimulator HID orientation event; the former needs Accessibility/TCC
    permission for `System Events` that isn't grantable non-interactively in
    this sandboxed session (`osascript` UI-element queries against
    `Simulator.app` fail with "not allowed assistive access", -1719), the
    latter needs a small SimulatorKit host tool this task didn't budget for.
    `xcrun simctl` has no orientation subcommand (checked `simctl ui`,
    `simctl io screenConfig geometry` — rejects non-native sizes — and the
    full subcommand list). A workaround forcing
    `UISupportedInterfaceOrientations~ipad` to landscape-only in `Info.plist`
    boots the app into a landscape *layout* but the guest OS keeps a portrait
    framebuffer, producing a compositing artifact (rows above the rendered
    UI are flat pure black, `RGB(0,0,0)`, not the app's real background) that
    is not a faithful reproduction — sampled identically before and after the
    fix, so it was **not** used as evidence either way (Info.plist was
    restored to its original content after each attempt; `git diff` on it is
    clean). The fix targets the mechanism directly (Apple's own docs say
    `topEdgeEffect.isHidden = true` fully suppresses the effect) and is
    scoped to exactly the code path the field screenshots implicate, but the
    literal before/after landscape pixel pair from a local simulator is
    missing — recommend confirming on the next TestFlight build against a
    real iPad, or from a machine where Accessibility can be granted to
    `Simulator.app` for `xcrun simctl`-driven rotation.

---

## 8. Build 20 shipped and posted nothing — why, and what build 21 changes

Build 20 (`2f56da91`) reached the phone at 21:23Z. Server evidence for the next
15 minutes: **33 `GET /progress/me`** and **six batch POSTs** (112, 71, 62, 587,
658, 68 ms). All six are tick-sized. A 100-row chunk is ~4 DynamoDB round trips
per row and takes seconds; none appeared.

**What that proves, before any theorising:** nothing ever reached the sync
queue. A queued row would have shown in the SyncManager dirty count *and* been
drained by the very next 30 s tick — the tick fired ~30 times. So the
reconciliation either skipped, or failed to persist what it built. It was not a
network problem and not a server refusal.

Four defects in b20 each produce exactly that signature. All four are fixed.

1. **It lived in the wrong place.** The diff ran inside `useProgressMe`'s
   *query function* — once per fetch, in a promise continuation — and was gated
   on the learning language. `/progress/me` and `/users/me/settings` arrive in
   the same `/boot` payload, but the progress half is consumed immediately
   while the language needs a render + SettingsContext's Phase-2 effect + a
   localStorage write. Progress always wins, so the first pass of every launch
   skipped. Nothing invalidates `["progress","me"]` when a language resolves
   (grep confirms: the only invalidators are sync ticks, quests, shop, ads and
   social). → The trigger is now `useProgressReconcile`, an **effect** keyed on
   (progress, resolved language, user): whichever half lands last starts it.
2. **Draft rollups counted as "the server already has it."** The diff
   subtracted *every* rollup id, but a mid-lesson draft sync writes a rollup
   with `firstPassedAt: null` — not a completion (`mockProgress` refuses those
   for exactly this reason). Any lesson he had merely *opened* was therefore
   invisible to reconciliation, permanently. → Only rollups with a
   `firstPassedAt` now count.
3. **A refused localStorage write was swallowed, and the marker was written
   anyway.** 482 synthesised rows is ~90 KB. If the quota refused them the
   queue stayed empty, the drain found nothing to send — and the marker had
   already been written, so every later launch skipped as
   `already-reconciled`. One silent failure became permanent. → The marker is
   now written only when rows actually persisted or actually posted, and a
   refused write falls back to a direct chunked POST (the same fallback
   `syncTestOutToServer` has had since b19).
4. **It could not be seen.** ~30 silent skips and the only way to find out was
   a CloudWatch query. → The SyncManager panel now carries a reconcile line —
   `reconcile: skipped (language-unresolved)`, `reconcile: queued 482 ·
   confirmed 482/482`, or `reconcile: not run yet` — written on **every** pass
   including a skip, persisted per user, plus a **Reconcile now** button that
   ignores the marker entirely.

**Spencer: on build 21, open the sync cloud in the header.** The line under the
source rows names what happened. If it says anything other than
`queued N / confirmed N`, tap **Reconcile now** and report the line verbatim —
that one string replaces a log dig.

One more, found while reading and worth knowing: the Start-over flag
(`open-lingo-lesson-progress-reset:<user>`) only clears when the server comes
back with **zero** lessons (`useProgressMe.ts:46-52`). Reset, then play one
lesson, and the flag is stuck forever — blocking the server→local hydrate *and*
reconciliation on that device. Not fixed here (it needs its own lap), but it is
now visible: the line reads `reconcile: skipped (reset-pending)`.

### "Do they fight each other? Do we need to keep furthest progress save?"

No, and no.

- **Nothing fights.** The two directions are asymmetric on purpose.
  Server→local is a **union** — `mergeServerLessonRollups` only ever adds ids
  and raises a lesson's best score / attempt count; it has no delete path.
  Local→server is **additive only** — reconciliation POSTs completions the
  server lacks and never removes one. Neither direction can take a lesson away
  from the other, so two devices cannot overwrite each other's progress.
- **"Furthest progress" is automatic**, because completion is a **set of lesson
  ids**, not a high-water mark. Phone ∪ iPad is what both devices converge on,
  and your position on the map is derived from that set (the first module not
  fully complete). There is no counter to lose a race on: the only way to go
  *backwards* is Start over, which is explicit and asks first.
- What you saw on the iPad was not a fight — it was the phone never uploading,
  so the iPad had nothing to union with. That is what §7 and this section fix.

### Gates (build 21)

- `npx tsc --noEmit -p tsconfig.json` — clean.
- `npx vitest run --project app` — 408 files / 3355 passed. The 9 failures are
  a concurrent lane's in-flight edits to `ListeningComprehensionStepView.tsx`
  and `_stepPredicates.ts` (both dirty in the tree, neither touched here);
  this lane's own scope — `src/shared`, `src/features/placement/engine`,
  `src/features/learn`, the sync/reconcile/lifecycle/locale suites — is
  125 files / 1258 passed, 0 failed.
- New/changed tests: `useProgressReconcile.test.tsx` (4, including the launch
  ordering repro: progress resolves first, language 2 s later, it still posts),
  `progressReconcile.test.ts` (16 — +5 for the draft-rollup, quota-fallback,
  marker-only-on-success, status-line and force cases),
  `useAppLifecycleSync.test.tsx` (6 — +1 native `appStateChange`, which is real
  on device: `ios/App/CapApp-SPM/Package.swift` carries CapacitorApp, so the
  plugin is synced into the iOS project).
