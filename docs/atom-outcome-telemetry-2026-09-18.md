# Per-word difficulty stats (T7) — 2026-09-18

**Status:** client emitter + server route + weekly report tool built,
tested, OFF BY DEFAULT on the client (`telemetry.atomOutcomes` in
`feature-flags.json`, false). Server route lands on `lingo-core`'s
`lane/STATS` (off `main`, **not pushed** — see "Deploy recipe" below).
Report tool **not run live** — AWS SSO was expired at authoring time; its
query-building and table-formatting logic is unit-tested on a fixture
instead (12/12 green, `scripts/ops/atom-difficulty-report.test.mjs`).

Spencer, 2026-09-18: "how often do people fail X word, how easy are
others… more statistical data tracking here is future scope but answers
this better than we can."

Sibling doc: `docs/observability-2026-09-17.md` (the `client_error` /
`client_diag` streams this design mirrors in storage/cost shape, but
diverges from in auth — see §2 below).

---

## 1. Event contract

One `atom_outcome` event = one graded step. No free text, no answer
strings — same discipline as the client-error breadcrumb payload.

| Field | Type | Notes |
|---|---|---|
| `lang` | string | Course language code (`ja`/`ko`/`es`/`fr`) |
| `lessonId` | string | Real lesson id, or a synthetic `alphabet:<id>:<mode>[:<section>]` for kana practice (matches `recordStepEvent`'s existing convention) |
| `stepIndex` | int | Index into the lesson's step array |
| `stepType` | string | e.g. `build_sentence`, `multiple_choice` |
| `atomIds[]` | string[] | Vocab/grammar/kana atom ids the step exercised — never the answer text. LessonPage sends `exercisedAtoms` + `exercisedGrammar` concatenated; AlphabetLessonPage sends `[alphabet:<id>]` |
| `correct` | bool | |
| `msToAnswer` | int | Wall-clock ms from step shown to graded, clamped client- and server-side to 10 min |
| `attempt` | int | 1 = first try, 2 = the lesson's one-shot replay retry (LessonPage never allows a 3rd) |
| `srcSurface` | `lesson \| review \| flashcards \| test_out` | Free text on the wire (not a `Literal`), matching `ClientErrorItem.source`'s own forward-compat rationale |
| `buildNumber` | string? | Native build number, when resolved (see `errorReporter.ts::appVersionAndBuild`, now exported) |

Batched client-side, ≤50 events or 30s, flushed on lesson end and on
background (`pagehide` / `visibilitychange: hidden`). Server caps a
request at 200 events, 413 beyond.

---

## 2. Why this endpoint is AUTHENTICATED (unlike /errors, /diagnostics)

`docs/observability-2026-09-17.md`'s two telemetry endpoints
(`/telemetry/errors`, `/telemetry/diagnostics`) are deliberately
**unauthenticated** — errors happen before login too. `/telemetry/outcomes`
is the opposite case: it only ever fires mid-lesson, well after login, and
the task spec requires the server to hash the caller's user id into the
log line "like the access log" (`sha256(sub)[:8]`, `log_safe_user_hash` —
`lingo-core/app/auth/dependencies.py`) — which requires a resolved
identity. So this route uses ordinary JWT/dev-bypass auth
(`get_acting_user`, this repo's CLAUDE.md-documented default for a
user-facing route), NOT `TelemetryGuardMiddleware`'s IP-keyed token
bucket. The per-request 200-event cap (413 beyond) is the guard instead.

This also means the CLIENT transport differs from `shared/api/telemetry.ts`
(hand-rolled `fetch`/`sendBeacon`, chosen there specifically to work before
Auth0Provider mounts): `shared/api/telemetryOutcomes.ts` is a normal
`ApiClient` subclass, constructed in `provider.tsx` exactly like
`SrsApi`/`ProgressApi`, with token injection, retries, and
`keepalive: true` support for the background-flush path (`sendBeacon`
can't carry an `Authorization` header, so background flush uses
`fetch(..., {keepalive: true})` instead — `client.ts`'s existing
`RequestOptions.keepalive`, documented there for exactly this "outlive a
backgrounded tab" case).

---

## 3. Client architecture

- **`src/shared/telemetry/atomOutcome.ts`** — transport-agnostic
  buffer/batch engine (mirrors `features/lesson/engine/lessonSync.ts`'s
  split from its own transport). `recordAtomOutcome(event)` no-ops
  entirely (never queues, never schedules a timer) when
  `telemetry.atomOutcomes` is off — checked via
  `getCachedFeatureFlags()`, the same synchronous non-React read
  `mockLessons.ts`'s pad pass already relies on. Batch trigger:
  `MAX_BATCH_EVENTS = 50`. Time trigger: `FLUSH_INTERVAL_MS = 30_000`.
  Safety ceiling on total buffered events: 500 (oldest dropped first).
  Exponential backoff (4s base, doubling, capped 5 min) on 5xx/429/network
  failure; a non-retryable 4xx drops just that chunk. An in-flight guard
  (`flushInFlight`) stops two overlapping flush triggers (e.g. the
  size trigger and a fresh `registerAtomOutcomeSender` both firing close
  together) from double-sending — caught by a real test, not just
  reasoned about (`atomOutcome.test.ts`'s "chunks a queue larger than
  MAX_BATCH_EVENTS" case failed with 26 calls instead of 2 before this
  guard was added).
- **`src/shared/api/telemetryOutcomes.ts`** — the authenticated
  `ApiClient` subclass (`TelemetryOutcomesApi.sendBatch`), wired into
  `ApiContext` in `provider.tsx` as `telemetryOutcomes`.
- **`src/shared/telemetry/useAtomOutcomeSync.ts`** — the one place that
  connects the two: registers `telemetryOutcomes.sendBatch` as the
  engine's sender on mount (mirrors `useLessonSyncSession.ts`'s
  `progress.batchAttempts` wiring), installs `pagehide`/
  `visibilitychange` listeners for the background-flush path, and does a
  best-effort keepalive flush on unmount (navigate-away mid-lesson).

### Seams covered — LessonPage.tsx and AlphabetLessonPage.tsx

The task asked to "find the single grading seam every step type already
passes through." There are **two** in this codebase, both already
identified by `recordStepEvent`'s existing callers:

1. **`src/features/lesson/LessonPage.tsx`'s `handleStepComplete`** — every
   lesson AND every dedicated review lesson (`ja-mN-review-*`) render
   through the same `StepRenderer` → `onComplete={handleStepComplete}`
   path, regardless of step type (build/MCQ/listening/translate/etc.).
   `srcSurface` is `"review"` when `isDedicatedReviewLesson(lesson.id)`,
   else `"lesson"`. A new `stepShownAtRef`, reset in an effect keyed on
   `currentStep?.id`, drives `msToAnswer`.
2. **`src/features/practice/alphabet/AlphabetLessonPage.tsx`'s
   `recordAlphabetStep`** — kana learn/review/test steps. Kana atoms are
   never SRS-eligible (per CLAUDE.md), but "how often do people fail X
   kana" is exactly the question this task asked, so it's wired here too.
   `srcSurface` is always `"lesson"` (no review/test distinction is
   plumbed through today — the mode string exists but wasn't worth a
   third enum value for a first cut). Same `stepShownAtRef` pattern.

### Reasoned gaps — flashcards and test_out NOT wired

- **`test_out` (`PlacementTestPage.tsx`)** — its `handleStepComplete`
  calls a local adaptive-engine reducer (`recordAnswer`), never
  `recordStepEvent`. It's a genuinely different engine (no per-step
  SRS/sync write at all, only a final placement result), so wiring it
  would mean adding a NEW call site with its own atom-id sourcing rather
  than reusing an existing seam — real work, not covered by "find the
  seam(s) every step type already passes through." Left for a follow-up;
  `srcSurface: "test_out"` exists in the type today so that follow-up is
  additive, not a schema change.
- **`flashcards`** — grading lives in the FSRS review engine
  (`features/flashcards/engine/*`), a third, unrelated call path with no
  `recordStepEvent`-equivalent seam either. Same reasoning: real,
  separate wiring work, not a "second seam" of the two step-grading pages
  above. `srcSurface: "flashcards"` is likewise reserved but unused today.

Both gaps are cost-neutral (the flag stays off everywhere either way) and
don't block turning the flag on for `lesson`/`review` coverage first.

---

## 4. Server (`lingo-core`, branch `lane/STATS`)

- **`app/telemetry/schemas.py`** — `AtomOutcomeItem`, `AtomOutcomeBatch`,
  `AtomOutcomeAcceptedResponse`. `msToAnswer` capped `0..600_000` (10
  min); `atomIds` capped at 32 entries, each re-trimmed to 128 chars
  server-side (defense in depth, mirrors `ClientErrorBreadcrumb`'s
  payload re-trim).
- **`app/telemetry/router.py`** — `POST /outcomes`, `get_acting_user`
  (JWT/dev-bypass), `MAX_OUTCOME_EVENTS_PER_REQUEST = 200` enforced with
  an explicit `HTTPException(413)` check (not a pydantic `Field(max_length)`,
  which would 422 instead — the schema's own `max_length` is a much
  higher technical safety ceiling, not the enforced cap). Logs one JSON
  line per item to a **new `lingo.atom_outcome` logger, at INFO** (not
  WARNING like `client_error`/`client_diag` — this is routine data
  collection, matching `app/db/dynamo/telemetry.py::log_dynamo_op`'s
  INFO convention, not a failure signal).
- **Storage = CloudWatch log lines, not DynamoDB** (Spencer's call): a
  weekly aggregate over ~15 events/lesson at current volume is a Logs
  Insights query; see §6 for the cost math. Retention already 30 days
  (`/aws/lambda/lingo-core`, `lingo-infra/observability.tf` — same
  adoption caveat as the other telemetry streams, confirm with
  `aws logs describe-log-groups`).
- **12 new tests**, `tests/test_telemetry_outcomes.py` — happy path,
  X-Request-Id, minimal-fields, 401 when unauthenticated (DEBUG off, no
  JWT), the 413-at-201-events / 202-at-200-events boundary pair
  (behavior-pinning — verified for real: temporarily raising
  `MAX_OUTCOME_EVENTS_PER_REQUEST` to 250 flips the 201-item batch from
  413 back to 202), field caps, and three logging tests (one line per
  item on its own logger, never on `client_error`/`client_diag`, two
  different users get two different hashes). Full suite: **415 → 427
  passed**, `ruff check`/`ruff format --check` clean.

---

## 5. Feature flag

`feature-flags.json`:
```json
{ "telemetry": { "atomOutcomes": false } }
```
`FeatureFlags.telemetry.atomOutcomes`, default `false` in
`DEFAULT_FEATURE_FLAGS`, merged via `mergeFeatureFlags`. **Off for build
32** (Spencer's call in the task spec) — flipping it true in
`feature-flags.json` is the only step needed to start client traffic;
`useAtomOutcomeSync` and every call site are already mounted
unconditionally (they no-op while the flag reads false, so there is no
second code path to wire later).

---

## 6. Numbers

Measured on a representative event (`lang: "ja"`, a real `lessonId`, one
`atomId`, `srcSurface: "lesson"`, `buildNumber` present):

| Measure | Value |
|---|---|
| Client wire item (what the batch POST body contains, per event) | **197 bytes** |
| 50-event batch POST body (the batching cap) | **9.9 KB** — well under the server's 200-event/request cap and the browser's 64 KB keepalive-body cap |
| Server-logged `lingo.atom_outcome` JSON payload (adds `requestId`, `userHash`) | **268 bytes** |
| Full CloudWatch log line (with `_configure_logging()`'s timestamp+logger prefix) | **298 bytes** |
| Requests per lesson | **Typically 1** — ~15 graded steps/lesson is well under the 50-event batch trigger, so the lesson-end flush is usually the only request; at most 2 if the 30s timer fires once mid-lesson first |
| **Ingestion cost per 1,000 lessons/day** (15 events/lesson × 1,000 × 298 B) | **4.26 MB/day → ≈$0.0021/day → ≈$0.06/month** at CloudWatch Logs' $0.50/GB |

Unverified claim, labelled: "requests per lesson ≈ 1" assumes ~15 graded
steps/lesson (the same figure the task spec itself uses) and a typical
lesson completing in well under 30s of wall-clock step-answering time
between the first buffered event and lesson end — both plausible but not
measured against real session data by this lane (the flag has never been
on in production).

---

## 7. Weekly report tool

`scripts/ops/atom-difficulty-report.mjs [--days 7] [--lang ja]`

**Not run live by this lane** — AWS SSO was expired at authoring time.
`buildOutcomesQuery` (the Logs Insights query string) and
`formatDifficultyTable` (sort/filter/render) are unit-tested on a fixture
(`atom-difficulty-report.test.mjs`, 12/12 green, `node --test`); the
`aws logs start-query`/`get-query-results` round trip in `main()` is
exercised only by an actual run once SSO is back — same caveat
`pull-diagnostics.mjs` (the sibling ops script) already carries.

**Exact query** (log group `/aws/lambda/lingo-core`, region `us-west-1`,
time range = `--days` back from now):

```
fields @timestamp, @message
| filter @message like /"type": "atom_outcome"/
| parse @message /"lang":\s*"(?<lang>[^"]*)"/
| parse @message /"correct":\s*(?<correct>true|false)/
| parse @message /"msToAnswer":\s*(?<msToAnswer>\d+)/
| parse @message /"atomIds":\s*(?<atomIdsJson>\[[^\]]*\])/
| fields jsonParse(atomIdsJson) as atomIdsList
| unnest atomIdsList into atomId
| stats count() as attempts, sum(correct = "false") as fails, pct(msToAnswer, 50) as medianMs by atomId, lang
| sort attempts desc
| limit 1000
```

(`--lang ja` inserts `| filter lang = "ja"` right after the type filter.)

Two things about this query are **unverified against real data** (SSO
expired):
- `unnest` on a `jsonParse`d array field — confirmed against AWS's own
  docs (`CWL_QuerySyntax-Unnest.html`, fetched 2026-09-18: "the input for
  `unnest` is `LIST`, which comes from the `jsonParse` function") and
  matches its own worked example almost exactly, but never run against
  this repo's actual log format.
- `sum(correct = "false")` as a conditional count — a documented
  CloudWatch idiom (boolean coerces to 0/1 in a numeric aggregation), but
  not spot-checked against a hand count here. **First real run: diff
  `fails`/`attempts` against a manual count on a handful of atomIds
  before trusting the fail-rate column.**

The script itself does the n≥20 filter and hardest/easiest sort/slice in
JS (`formatDifficultyTable`) rather than in the query, so one query
answers both halves of the report (no second round-trip for "10
easiest").

Output: a printed table (hardest-first, n≥20, then the 10 easiest) and
`artifacts/atom-difficulty/<date>-<lang|all>.json` (gitignored, matches
`pull-diagnostics.mjs`'s `artifacts/diagnostics/` convention).

---

## 8. Deploy recipe

**This lane did not deploy or push anything.** `lingo-core`'s
`app/telemetry/{schemas,router}.py` changes are committed to
`lane/STATS` (off `main`), not merged. Per
`lingo-core/.github/workflows/deploy.yml` (see
`docs/observability-2026-09-17.md`'s own "Deploy recipe" section for the
full pipeline description — identical for this change): merging
`lane/STATS` to `main` triggers `ruff check` → `pytest -q` (427 tests,
including the 12 new ones) → `build-zip.sh` → Lambda deploy → a `/health`
smoke test.

The client code (feature-flag-gated, off) ships on the next TestFlight/web
build like any other code change — no content-manifest rebuild needed
(this is app CODE, not lesson content).

**Two things for Spencer:**
1. **Merge `lingo-core`'s `lane/STATS`** to actually put
   `POST /api/core/v1/telemetry/outcomes` on the internet. Nothing sends
   to it from the client until the flag is also flipped, so merging it
   alone is a no-op traffic-wise — safe to do independently of the flag
   decision.
2. **Decide when to flip `telemetry.atomOutcomes` true** — this lane
   scoped it to `lesson`/`review` only (see §3's reasoned gaps); flipping
   it on starts real client traffic and, a week later, a real
   `atom-difficulty-report.mjs` run.
