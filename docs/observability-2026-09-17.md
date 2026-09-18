# Client error reporting — 2026-09-17

**Status:** LIVE (client + server code committed; server NOT deployed by this
lane — see "Deploy recipe" below).

Before today the app had no crash/error reporting at all: no Sentry, Bugsnag,
Crashlytics, or PostHog; `AppErrorBoundary`/`RouteErrorBoundary` only
`console.error`; `src/shared/telemetry/sessionLog.ts` buffers 500 events in
`localStorage` for testers and is never sent anywhere. TestFlight screenshots
were the only production signal. This ships an in-house, zero-vendor client
error reporter (no Sentry/Bugsnag/etc. — a vendor account + App Store privacy
label change stays Spencer's decision) so a JS error, unhandled rejection,
error-boundary catch, or chunk-load failure on a learner's device reaches
CloudWatch within about a debounce window, with enough context to act.

Code:
- Client: `src/shared/telemetry/errorReporter.ts` (policy: dedupe/cap/backoff/
  offline queue; also builds breadcrumbs and the diagnostics document — see
  §7 below), `src/shared/api/telemetry.ts` (transport, both endpoints), wired
  from `src/main.tsx`, `src/shared/components/AppErrorBoundary.tsx`,
  `src/shared/components/RouteErrorBoundary.tsx`, and — for the one-tap
  diagnostics button — `src/features/sync/LayoutTracePanel.tsx`.
- Server (`lingo-core`): `app/telemetry/schemas.py`, `app/telemetry/router.py`
  (`POST /api/core/v1/telemetry/errors` AND, since 2026-09-17 lane A3b,
  `POST /api/core/v1/telemetry/diagnostics`), `app/telemetry/guard.py`
  (body-size cap + per-IP token bucket, now shared across both paths),
  `app/shared/request_id.py` + `app/main.py` exception handlers
  (`X-Request-Id` on every error response). Adjacent same-lane fix:
  `app/auth/dependencies.py` + `app/main.py`'s `access_log` — see §8.
- Ops: `scripts/ops/pull-diagnostics.mjs` (new, this lane) reads a
  diagnostics document back out of CloudWatch by its 6-char code.

---

## 1. Payload contract

One report = one `ClientErrorItem`. A batch is `{"items": [...]}`, 1–20 items.
Client and server caps are mirrored (`errorReporter.ts` truncates BEFORE
sending so one oversized item can never 422 a whole batch — the batch is
all-or-nothing, same contract as `progress.ts`'s `MAX_ATTEMPTS_PER_BATCH`).

| Field | Type | Cap | Required | Notes |
|---|---|---|---|---|
| `message` | string | 1 KB (1000 chars client-side, 1024 bytes server-side) | yes | `"Name: message"` for an `Error`, raw string otherwise |
| `stack` | string | 4 KB | no | first 4 KB; `componentStack` (React boundaries) appended before truncation |
| `source` | string | 64 chars | yes | `window.onerror` \| `unhandledrejection` \| `AppErrorBoundary` \| `RouteErrorBoundary` \| `chunk-load` \| `boot-guard` — free text, not an enum, so a client ahead of the server's known values is never rejected |
| `route` | string | 256 chars | no | `window.location.pathname` ONLY — no query string, no hash |
| `lessonId` / `stepIndex` / `stepType` | string / int / string | 128 / — / 64 | no | **populated** — `useLessonErrorContext` (`src/features/lesson/useLessonErrorContext.ts`), called from `LessonPage.tsx` (real `lessonId`/`currentStepIdx`/`currentStep.type`) and `PlacementTestPage.tsx` (`placement:<moduleId>` / the adaptive engine's `totalServed` / `currentStep.type`, since placement has no stable lesson id); cleared on step change and on unmount |
| `appVersion` | string | 64 chars | no | native: `App.getInfo().version`; web: `__LINGO_BUILD_ID__` (git SHA / local timestamp) or `package.json` version as a last resort |
| `buildNumber` | string | 32 chars | no | native: `App.getInfo().build`; **web: always absent** — no discrete build number is exposed to the web bundle (see §5) |
| `platform` | `"ios"\|"android"\|"web"` | 16 chars | yes | `Capacitor.getPlatform()`, UA-sniffed fallback before the native bridge resolves |
| `osVersion` | string | 64 chars | no | parsed from `navigator.userAgent` (`parseOsVersion`) |
| `fontScale` | number | 0.1–5.0 | no | the accessibility font-size multiplier (85–140% slider), read from the same `open-lingo-settings` localStorage key `simProbe.ts` reads |
| `online` | boolean | — | no | `navigator.onLine` at report time |
| `count` | int | 1–100,000 | yes (default 1) | dedupe counter — see §2 |
| `ts` | int (epoch ms) | — | yes | client clock, first occurrence |
| `sessionId` | string | 64 chars | yes | random per-session id, generated client-side, **not** a user id |
| `lastRequestId` | string | 64 chars | no | **populated** — `ApiClient._request` (`src/shared/api/client.ts`) reads the `X-Request-Id` response header off every response (success or error) and calls `setLastRequestId` |
| `breadcrumbs` | array of `{t, type, payload}` | ≤20 items, ≤4 KB total serialized | no | **added 2026-09-17 (lane A3b)** — see "Breadcrumbs" below |

**Never sent, by construction (no such field exists in the schema):** user id,
email, name, username, display name, free-text answers, lesson/sentence
text, IP address. See §6 for the full privacy statement.

### Breadcrumbs (added 2026-09-17, lane A3b)

Every `ClientErrorItem` now carries the last ≤20 `sessionLog.ts` events at
report time — "what did the learner do in the ~20 events before this
broke," read straight off the CloudWatch line instead of asking the
tester what they were doing. Built client-side by
`errorReporter.ts::buildBreadcrumbs`, logged server-side inline in the
same `lingo.client_error` JSON line (key `"breadcrumbs"`).

Shape, one entry per `sessionLog.ts` event:

| Field | Type | Notes |
|---|---|---|
| `t` | int (ms) | Relative to THIS report's own `ts` — 0 or negative (the event happened before or at the moment of the error). Not an absolute epoch timestamp. |
| `type` | string | `sessionLog.ts`'s `SessionEventType` (`step_view`, `lesson_start`, `tile_tap`, `review_grid_served`, …) |
| `payload` | object of string → string | The event's own payload, each value stringified (non-strings via `JSON.stringify`) and trimmed to ≤120 chars |

Caps, mirrored client- and server-side exactly the way every other field in
this doc is (`errorReporter.ts`'s `MAX_BREADCRUMBS`/`MAX_BREADCRUMBS_BYTES`
↔ `lingo-core/app/telemetry/schemas.py`'s `MAX_BREADCRUMBS`/
`MAX_BREADCRUMBS_BYTES`):

- **≤20 events.** The client already slices to the most recent 20 before
  building breadcrumbs; the server additionally rejects (422) a batch
  claiming more, via `Field(max_length=20)` on `ClientErrorItem.breadcrumbs`.
- **≤4 KB total serialized size.** The client drops the OLDEST breadcrumbs
  first, re-checking the serialized byte size after each drop, until the
  array fits — same "drop oldest until it fits" pattern the diagnostics
  document (below) uses at a much bigger budget. The server pins this with
  a `field_validator` that raises (422) if a client-sent array is still
  over 4 KB — a real client is never expected to hit this, since it trims
  first, so a 422 here indicates a client/server contract drift worth
  investigating, not a size worth silently truncating.
- **Per-value 120-char trim.** Enforced client-side before sending; the
  server's `ClientErrorBreadcrumb.payload` re-trims to 120 chars server-side
  too (truncates rather than rejects — a client a few bytes over its own
  trim, e.g. from unicode width differences, shouldn't 422 an otherwise-
  valid error report over one long breadcrumb value).

PII-free by the same rule `sessionLog.ts` already documents on itself:
payload values are lesson content (atom labels, step ids/types, tile
labels, counts) or small numeric/boolean facts — never a field the
learner typed. No new field type was added to carry anything else; a
breadcrumb's `payload` is exactly the event's existing, already-audited
`sessionLog.ts` payload, just size-capped.

---

## 2. Client policy

- **Dedupe.** Identical `message`+`stack` within a session collapses into one
  report; a repeat increments `count` instead of enqueuing a new item.
- **Cap.** 20 distinct (post-dedupe) reports per session; beyond that,
  silently dropped (a console line would itself be noise on a device that's
  already erroring a lot).
- **Chunking.** Flushes send at most 5 items per request — sized so a full
  chunk at max field sizes (~5 KB/item) stays well under the 64 KB cap
  `fetch({keepalive:true})` and `navigator.sendBeacon` both enforce across
  ALL in-flight keepalive requests/beacons combined (a 20-item batch at max
  size would be ~100 KB, over that cap).
- **Backoff.** A 5xx or 429 keeps the batch queued and backs off
  exponentially (4 s base, doubling, capped at 5 min); a non-429 4xx (the
  item is unrecoverable — e.g. it somehow got past client-side caps) is
  dropped so one bad item can't block the rest of the session.
- **Offline queue.** Unsent reports persist to `localStorage`
  (`lingo_error_reports_v1`, FIFO-bounded at 40) and flush on the next
  `installErrorReporter()` call (next app launch).
- **Transport.** Normal flush: `fetch(..., {keepalive: true})` (status
  visible, drives backoff). Unload (`pagehide` / tab hidden):
  `navigator.sendBeacon` (fire-and-forget, no status — see `telemetry.ts`).
- **Never throws.** Every entry point (`reportError`, `flushPending`,
  `installErrorReporter`) is wrapped so a bug in the reporter itself can
  never become a NEW error to report.

---

## 3. CloudWatch Logs Insights — top errors by message, last 24 h

Each item logs as one `lingo.client_error` WARNING line via
`logger.warning(json.dumps(payload, ensure_ascii=False))` — matches this
repo's existing structured-logging convention (`app/db/dynamo/telemetry.py`'s
`log_dynamo_op`), not the stdlib `extra=` pattern. `_configure_logging()` in
`app/main.py` formats every line as `%(asctime)s  %(name)s  %(message)s`, so
the JSON is embedded in the line, not the whole line — the query below
extracts fields with `parse` regexes rather than relying on Insights'
whole-line JSON auto-discovery (which requires the ENTIRE log line to be
valid JSON).

Log group: `/aws/lambda/lingo-core` (per `lingo-infra/observability.tf` and
the `LINGO_CORE_FUNCTION_NAME` repo variable, currently `lingo-core` — see
"Deploy recipe" for the historical `lingo-test` name this superseded).
Region: `us-west-1`.

```
fields @timestamp
| filter @message like /"type": "client_error"/
| parse @message /"message":\s*"(?<message>[^"]*)"/
| parse @message /"source":\s*"(?<source>[^"]*)"/
| parse @message /"platform":\s*"(?<platform>[^"]*)"/
| parse @message /"count":\s*(?<count>\d+)/
| parse @message /"requestId":\s*"(?<requestId>[^"]*)"/
| stats sum(count) as occurrences, count(*) as reports, latest(requestId) as lastRequestId by message, source, platform
| sort occurrences desc
| limit 20
```

Run over the last 24 h in the console, or via the CLI (read-only, safe to
run any time):

```bash
aws logs start-query \
  --log-group-name "/aws/lambda/lingo-core" \
  --start-time "$(date -v-24H +%s)" \
  --end-time "$(date +%s)" \
  --query-string 'fields @timestamp | filter @message like /"type": "client_error"/ | parse @message /"message":\s*"(?<message>[^"]*)"/ | parse @message /"count":\s*(?<count>\d+)/ | stats sum(count) as occurrences by message | sort occurrences desc | limit 20' \
  --region us-west-1
# then: aws logs get-query-results --query-id <id> --region us-west-1
```

A per-request grep (pairing a client's `lastRequestId` field back to the
exact CloudWatch invocation it followed):

```
fields @timestamp, @message
| filter @message like /"requestId": "req-abc123"/
```

---

## 4. Alarm to create (Spencer)

Metric filter on `lingo.client_error` lines, counting occurrences (metric
value 1 per log line — note this counts distinct-report EVENTS, not the
dedupe-summed `count` field; a metric filter can only extract one numeric
value, and log-line volume is the more direct "is something on fire" signal
for an alarm anyway), then an alarm at ≥10 in 5 minutes. **Not run by this
lane** — described here for Spencer to run:

```bash
# 1. Metric filter — one JSON-pattern match, turns each client_error log
#    line into one data point in a custom namespace.
aws logs put-metric-filter \
  --log-group-name "/aws/lambda/lingo-core" \
  --filter-name "client-error-count" \
  --filter-pattern '{ $.type = "client_error" }' \
  --metric-transformations \
      metricName=ClientErrorCount,metricNamespace=LingoCore,metricValue=1,defaultValue=0 \
  --region us-west-1

# 2. Alarm — fires when 5-minute SUM >= 10. --alarm-actions needs a real SNS
#    topic ARN; lingo-infra (observability.tf, cost_breaker.tf) has no
#    general-purpose ops-alert SNS topic today, only the AWS Budgets billing
#    topics cost_breaker.tf subscribes to — those are the wrong target for
#    this. Spencer needs to create one (or point this at an existing
#    destination) before this alarm does anything but sit SILENT.
aws cloudwatch put-metric-alarm \
  --alarm-name "lingo-core-client-errors-high" \
  --namespace LingoCore \
  --metric-name ClientErrorCount \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "<SNS topic ARN — create one first>" \
  --region us-west-1
```

Both commands are idempotent (re-running with the same names updates in
place) and safe to run from AWS SSO PowerUser access
([[aws-access-and-cost-guardrails]] — no IAM writes needed, these are plain
CloudWatch API calls). Prefer wiring both into `lingo-infra` as
`aws_cloudwatch_log_metric_filter` / `aws_cloudwatch_metric_alarm` Terraform
resources over the raw CLI, matching how `observability.tf` already declares
the log groups — out of scope for this lane (lingo-infra isn't in the owned
paths) but the natural next step.

---

## 5. Known gaps (reasoned omissions, not oversights)

- **Lesson/step context — WIRED 2026-09-17 (lane A3b).** `useLessonErrorContext`
  (`src/features/lesson/useLessonErrorContext.ts`) wraps `errorReporter.ts`'s
  `setLessonContext` in a small `useEffect` (set on mount/step-change, cleared
  on unmount). Called from `LessonPage.tsx` (`lesson?.id`, `currentStepIdx`,
  `currentStep?.type` — the same values already driving
  `data-visual-qa-step-id`/`-step-type`) and from `PlacementTestPage.tsx`
  (`src/features/placement/`, which renders through the same `StepRenderer`
  shell): `placement:<currentModuleId>` (prefixed so it's never confused
  with a real lesson id — placement has no stable numeric lesson id),
  `state?.totalServed` as the step index, `currentStep?.type`. Never lesson
  text — ids/indices only, matching `LessonErrorContext`'s field set.
  Tested at the hook level (`src/features/lesson/useLessonErrorContext.test.ts`)
  rather than by rendering `LessonPage` (a god-file — see `CLAUDE.md`); no
  test renders `LessonPage`/`PlacementTestPage` to prove the two call sites
  themselves stay wired if someone edits around them later.
- **`buildNumber` is always absent on web.** The only place a
  `package.json`-version Vite `define` could live is `vite.config.ts`,
  which this lane does not touch. `__LINGO_BUILD_ID__` (already defined
  there, the deploy's git SHA or a local dev timestamp) stands in as the
  web app-version signal instead; there is no separate "build number"
  concept for a web SPA the way there is for a native binary anyway.
- **`lastRequestId` — WIRED 2026-09-17 (lane A3b).** `ApiClient._request`
  (`src/shared/api/client.ts`) now reads `resp.headers?.get("X-Request-Id")`
  right after every `fetch` (success or error response alike — before the
  `resp.ok` branch) and calls `setLastRequestId` when present. (The `?.` is
  defensive: some existing tests mock `fetch` with a bare
  `{ok, status, json}` object with no `.headers` at all —
  `src/shared/api/progressMe.coalesce.test.ts` caught this at first pass.)
  Requests served from the boot-batch cache (`serveFromBoot`, GET-only) skip
  the raw `fetch`/`Response` entirely and so never update `lastRequestId` —
  a real but narrow gap (boot-wave requests are the least likely to need
  request-id correlation, since they're not user-triggered actions).
  Confirmed server-side that `X-Request-Id` is CORS-exposed already
  (`lingo-core/app/main.py`'s `CORSMiddleware(..., expose_headers=["*"])`,
  predates this lane) — no lingo-core change was needed.
- **Per-IP rate limiting is per-Lambda-container, not fleet-wide.** See
  `app/telemetry/guard.py`'s docstring and the "Guard math" section below.

---

## Guard math (server)

Referenced from `app/telemetry/guard.py`.

- **Body-size cap:** `MAX_BODY_BYTES = 150_000` — sized for the schema's own
  worst case (20 items × (1024 B message + 4096 B stack + ~300 B other
  fields) ≈ 106 KB), rounded up with headroom for JSON escaping. Enforced
  as ASGI middleware on `Content-Length` alone, BEFORE FastAPI reads the
  body into memory (a `Depends`-based check runs too late — FastAPI/
  Starlette reads and JSON-decodes the whole body before solving any
  `Depends()`).
- **Token bucket:** burst capacity 20 (one full batch flush never itself
  throttled), refill 1 token/15s (~4 req/min/IP steady-state = ~5,760
  req/day/IP sustained, each up to 20 items). Scope is honest, not
  optimistic: the bucket dict is **per warm Lambda execution environment**
  (module-level Python state), not per-IP-globally. API Gateway fans out
  across many concurrent execution environments, each with its OWN dict —
  so a single IP hammering the endpoint is capped hard IF it keeps landing
  on the same warm container, but a distributed abuser (or just enough
  concurrent legitimate load) gets roughly `N × 20` burst capacity across
  `N` concurrent Lambda invocations before any single container starts
  rejecting. `N` is bounded by the account/region Lambda concurrency limit
  (default 1000 unless raised). Real fleet-wide throttling needs an API
  Gateway usage plan or WAF rate rule — Terraform, `lingo-infra`, not built
  here.
- **What a false allow costs:** one extra `lingo.client_error` CloudWatch
  log line (~200–500 bytes). At CloudWatch Logs' $0.50/GB ingestion price
  (same rate `app/db/dynamo/telemetry.py`'s docstring cites), even a
  sustained worst case of 1000 concurrent containers × 20 req burst × 20
  items/req × 500 B ≈ 200 MB in one burst is a ten-cent event, not a
  budget incident — the guard exists to keep the endpoint from being a free
  amplifier for garbage in Logs Insights, not because a burst is expensive.

---

## 6. Privacy statement

**Collected**, every field capped and typed as in §1:
- Error message and stack trace (truncated to 1 KB / 4 KB)
- Where it happened: a `source` tag, the URL **path only** (no query
  string, no hash), and — when inside a lesson or placement test — a lesson
  id / step index / step type (never the lesson's text)
- Device/app context: platform (ios/android/web), OS version, app version,
  native build number, the accessibility font-scale setting, online/offline
  state
- A random, per-session, client-generated id (`sessionId`) — **not** a user
  id, not derived from any account identifier, not persisted across
  sessions
- A dedupe counter (`count`) and client timestamp (`ts`)
- The most recent API `X-Request-Id`, so a report can be correlated to a
  server log line

**Never collected — no such field exists in the schema, client or server:**
- User id, email, username, display name, or any other account identifier
- Free-text the learner typed (answers, chat, profile fields)
- Lesson/sentence content
- Precise location, device identifiers (IDFA/advertising id), contacts,
  photos, or anything else outside the field list above

**What the client controls vs. what any HTTP request inherently reveals:**
the client never sends an IP address in the payload, but — like every HTTP
request — the network layer (API Gateway / Lambda) sees the caller's IP by
necessity for TCP/HTTP itself; that's outside the app's control and outside
this payload's contract, and no field in `ClientErrorItem` persists it.

**Unauthenticated by design:** errors happen before login too (boot
failures, the login screen itself throwing), so this endpoint cannot sit
behind auth. It is protected instead by the body-size cap, per-IP token
bucket, and strict field caps described above (§ "Guard math" and
`app/telemetry/guard.py`).

**Retention:** CloudWatch Logs retention for `/aws/lambda/lingo-core` is
already declared at 30 days in `lingo-infra/observability.tf` — see "Deploy
recipe" for the adoption caveat (the log group may predate that Terraform
resource and need `terraform import` before `retention_in_days` actually
applies). Confirm rather than assume:

```bash
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/lingo-core" \
  --query 'logGroups[0].retentionInDays' \
  --region us-west-1
```

---

## 7. Diagnostics endpoint — one-tap "Send diagnostics" (added 2026-09-17, lane A3b)

A second, separate, unauthenticated endpoint,
`POST /api/core/v1/telemetry/diagnostics`, and a button next to the
Layout-trace tools in the mobile Sync panel
(`src/features/sync/LayoutTracePanel.tsx`). Where `/errors` fires
automatically on a JS error, `/diagnostics` is a single **explicit user
action** — Spencer taps it when something looks wrong but nothing has
actually thrown yet, or when he wants a fuller dump than an error report
carries.

**Document sent** (`errorReporter.ts::buildDiagnosticsDocument`, wire type
`ClientDiagnosticsWireDocument` in `shared/api/telemetry.ts`, server schema
`ClientDiagnosticsDocument` in `lingo-core/app/telemetry/schemas.py`):

| Field | Notes |
|---|---|
| `sessionLog` | Up to 200 raw `sessionLog.ts` events (NOT the 120-char-trimmed breadcrumb slice — full payload values), most recent first-dropped if the document is over budget |
| `layoutTrace` | The on-device `#174` layout trace if one has been recorded this session (`shared/dev/layoutTrace.ts`), else absent |
| `tapReplay` | The most recent step's tap-replay document (`sessionLog.ts::buildTapReplayDocument`) if any taps were logged this session, else absent |
| `device` | `{platform, osVersion, appVersion, buildNumber, fontScale, viewport}` — the same device-context fields an error report carries |
| `lastRequestId` | The most recent `X-Request-Id` seen by `ApiClient` |

**Body budget:** the client trims to `DIAGNOSTICS_BODY_BUDGET_BYTES`
(145,000 bytes — a hair under the server's 150,000-byte hard cap) by
dropping the OLDEST `sessionLog` events first, re-checking the serialized
size after each drop, exactly the way breadcrumbs trim to their own
(much smaller) 4 KB budget above. The server's `TelemetryGuardMiddleware`
(`lingo-core/app/telemetry/guard.py`) now guards BOTH
`/telemetry/errors` and `/telemetry/diagnostics` — same 150 KB
`Content-Length` cap, enforced before any JSON parsing — off one small
`_GUARDED_PATHS` set instead of a single hardcoded path.

**Rate limit:** the two endpoints **share one per-IP token bucket** (see
"Guard math" above — burst 20, refill 1 token/15s), keyed on IP alone,
not on path. A tester who just burst 20 error reports and then taps "Send
diagnostics" can get a 429 on the diagnostics call too; the panel shows
"Couldn't send — check connection and try again" (no auto-retry — it's a
one-tap action, not a queued background flush like `/errors`).

**Response & code:** `202 {"code": "<6 chars>"}`. The server generates the
code fresh per request (`app/telemetry/router.py::_generate_diagnostics_code`)
from an alphabet that excludes `0/O/1/I`
(`DIAGNOSTICS_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"`) —
chosen because this code gets read aloud or typed by hand off a phone
screen. The panel shows it large — `"Tell Spencer: K7P4QX"` — with a Copy
button.

**Server log line:** ONE `lingo.client_diag` WARNING line per POST
(separate logger name from `lingo.client_error` — a Logs Insights query
for one never accidentally picks up the other), same
`logger.warning(json.dumps(payload))` convention as `/errors`:

```json
{"type": "client_diag", "code": "K7P4QX", "requestId": "...", "sessionLog": [...], "layoutTrace": null, "tapReplay": null, "device": {...}, "lastRequestId": "..."}
```

**Pulling a document back out:** `scripts/ops/pull-diagnostics.mjs <CODE>`
(new, this lane) runs
`aws logs filter-log-events --log-group-name /aws/lambda/lingo-core --filter-pattern '"lingo.client_diag" "<CODE>"' --region us-west-1`,
extracts the JSON payload (everything from the line's first `{` onward —
robust to whatever CloudWatch/Lambda prepend ahead of the formatted
`_configure_logging()` line), and writes it to
`artifacts/diagnostics/<CODE>.json` (gitignored — `artifacts/` is already
in `.gitignore`). Needs an active AWS SSO session with CloudWatch Logs
read access — no write/IAM permissions.

**Cost of a runaway client**, quantified the same way "Guard math" above
quantifies `/errors`: `/diagnostics` shares the same 150 KB body cap and
the same 20-burst/~4-req-min/IP token bucket. A single warm Lambda
container hammered at the bucket's steady-state ceiling
(4 req/min × 60 × 24 = 5,760 req/day) at the 150 KB cap would write
5,760 × 150 KB ≈ 864 MB/day of `lingo.client_diag` lines from that one
container — at CloudWatch Logs' $0.50/GB ingestion, **≈$0.43/day** for a
single pinned-container abuser. The same "N concurrent warm containers ×
20-burst before any one throttles" caveat from Guard math applies: a
distributed abuser spread across, say, 50 concurrent containers could
sustain roughly 50× that (~$21/day) before hitting the account's Lambda
concurrency ceiling — still a rounding error against this app's overall
AWS spend, not a budget incident, and not a reason to add more than the
existing IP-scoped guard for what remains a rare, one-tap, human-triggered
action (unlike `/errors`, nothing in the client fires this automatically
or on a retry loop).

**Not deployed by this lane** — same caveat as everywhere else in this
doc; see "Deploy recipe" below.

---

## 8. Access log — `lingo.access` now shows a real user + platform (added 2026-09-17, lane A3b addendum)

Adjacent fix, same lane, same day, requested mid-task: `app/main.py`'s
`access_log` middleware was printing `user=-` for **every** request,
authenticated ones included — it only ever read the raw `X-Dev-User`
header, which real (non-DEBUG) traffic never sets. Verified in CloudWatch
before the fix: 30× `GET /progress/me`, 6× `POST /progress/lessons/batch`,
1× `POST /srs/sync` in a 6-hour window, all `user=-`.

Fixed in `lingo-core/app/auth/dependencies.py`: `get_current_user` /
`get_current_user_optional` now stash `request.state.auth_sub_hash =
log_safe_user_hash(resolved.sub)` the moment either resolves a token —
dev-bypass or a real Auth0 JWT, both funnel through the same return
point. The `access_log` middleware (`app/main.py`) reads it off
`request.state` after `call_next` returns.

`log_safe_user_hash` is `sha256(sub)[:8]`, not the raw `sub` — this repo's
own no-PII posture for the `/telemetry/*` endpoints (§6 above) treats a
raw account identifier as too identifying for a log line, and while
`lingo.access` is a separate, older, internal-only logger, the same
reasoning applies: the hash is STABLE per account (so the same person's
requests visibly correlate across a log stream — the actual point, e.g.
telling a phone session from an iPad session apart) but not reversible
from the hash alone.

The client (`src/shared/api/client.ts`) now also stamps
`X-Lingo-Platform: ios|android|web` on every request (reusing
`errorReporter.ts`'s `detectPlatform`, now exported), which the same
line logs as `platform=`. Example line, real local-dev capture:

```
17:58:36  lingo.access  127.0.0.1 GET /api/core/v1/users/me  → 404  (4ms)  user=11ed54b1  platform=ios
```

A request to a route with no auth dependency at all (e.g. `/health`, or
`/telemetry/errors`/`/telemetry/diagnostics`, both intentionally
unauthenticated) still logs `user=-` — the fix does not fabricate an
identity for a request that never carried one. 10 new tests in
`lingo-core/tests/test_access_log.py`.

---

## Deploy recipe (lingo-core) — exactly as its docs describe it

**This lane did not deploy anything.** `app/telemetry/**`, `app/main.py`,
`app/auth/dependencies.py`, and `app/v1/router.py` changes are all
committed to `lane/A3b`, not pushed to `main` and not merged.

Per `lingo-core/.github/workflows/deploy.yml` (the ONLY deploy path this
repo documents — there is no separate manual runbook): a push to `main`
auto-deploys, gated on the same checks `ci.yml` runs:

1. `pip install -e ".[dev]"`
2. `ruff check .`
3. `pytest -q`
4. `./scripts/build-zip.sh` (packages `app/` + pinned runtime deps —
   fastapi, pydantic-settings, python-jose[cryptography], httpx, aiosqlite,
   aioboto3, mangum, kombu — targeted at `manylinux2014_x86_64` / Python
   3.13, matching the Terraform-managed Lambda's architecture)
5. Assume `arn:aws:iam::349654078389:role/ci-lingo-core` via GitHub OIDC (no
   stored AWS keys)
6. `aws lambda update-function-code --function-name "$FUNCTION_NAME" --zip-file fileb://lingo-core.zip --publish`
   — `$FUNCTION_NAME` is the `LINGO_CORE_FUNCTION_NAME` repo variable,
   currently **`lingo-core`** (confirmed via `gh variable list` — deploy.yml's
   own comment describes this as a still-pending cutover from the
   manually-provisioned `lingo-test` function, but the repo variable has
   already been flipped)
7. `aws lambda wait function-updated`, then an `aws lambda invoke` smoke
   test against `GET /health` with a full API Gateway v2 payload shape
   (Mangum requires `requestContext.http.sourceIp`) — deploy fails the
   workflow if the smoke test doesn't return `< 400`.

Manual alternative (also described in the repo, for a target other than
CI's role): `./scripts/build-zip.sh -f <LAMBDA_ARN>` builds AND pushes in
one step, prompting for the ARN if not passed and running interactively.

**To ship this lane's server change:** merge/push `lane/A3b`'s `lingo-core`
commits to `main` — the workflow above runs automatically (including its own
`pytest -q`, which now includes the 403 tests in the full suite — up from
373 before this lane, across `tests/test_telemetry_errors.py` (breadcrumbs),
the new `tests/test_telemetry_diagnostics.py`, and the new
`tests/test_access_log.py`) and the smoke test will implicitly cover the new
`X-Request-Id` exception-handler change (the smoke payload hits `/health`,
not `/telemetry/errors`, but a 400/500 there would fail the existing handler
contract too — the new handlers are additive to the existing 200 path).

---

## Three things Spencer must do

1. **Create the alarm** — §4 above. Needs an SNS topic ARN to notify
   (none exists for general ops alerts today; the only SNS topics in
   `lingo-infra` are AWS Budgets billing topics, the wrong target).
2. **Deploy** — push (or merge) `lane/A3b`'s `lingo-core` commits to `main`
   to actually put `POST /api/core/v1/telemetry/errors`,
   `POST /api/core/v1/telemetry/diagnostics`, and the `lingo.access` fix on
   the internet; nothing in this lane pushes it. The client code ships the
   moment its own commit reaches a build (content-in-binary rule — see
   [[content-ships-in-the-binary]] — though this is app CODE, not lesson
   content, so it ships on the next TestFlight/web build like any other
   code change, not gated on a content-manifest rebuild).
3. **Decide retention** — already declared at 30 days in
   `lingo-infra/observability.tf`; confirm it's actually applied to the
   live `/aws/lambda/lingo-core` group (the file's own "ADOPTION" note
   says the group may predate the Terraform resource and need
   `terraform import` before `retention_in_days` takes effect) rather than
   assuming 30 days is already in force. Run the `describe-log-groups`
   command in §6 to check.
