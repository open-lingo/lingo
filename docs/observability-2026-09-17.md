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
  offline queue), `src/shared/api/telemetry.ts` (transport), wired from
  `src/main.tsx`, `src/shared/components/AppErrorBoundary.tsx`,
  `src/shared/components/RouteErrorBoundary.tsx`.
- Server (`lingo-core`): `app/telemetry/schemas.py`, `app/telemetry/router.py`
  (`POST /api/core/v1/telemetry/errors`), `app/telemetry/guard.py`
  (body-size cap + per-IP token bucket), `app/shared/request_id.py` +
  `app/main.py` exception handlers (`X-Request-Id` on every error response).

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
| `lessonId` / `stepIndex` / `stepType` | string / int / string | 128 / — / 64 | no | opt-in, see §5 — nothing calls the setter today |
| `appVersion` | string | 64 chars | no | native: `App.getInfo().version`; web: `__LINGO_BUILD_ID__` (git SHA / local timestamp) or `package.json` version as a last resort |
| `buildNumber` | string | 32 chars | no | native: `App.getInfo().build`; **web: always absent** — no discrete build number is exposed to the web bundle (see §5) |
| `platform` | `"ios"\|"android"\|"web"` | 16 chars | yes | `Capacitor.getPlatform()`, UA-sniffed fallback before the native bridge resolves |
| `osVersion` | string | 64 chars | no | parsed from `navigator.userAgent` (`parseOsVersion`) |
| `fontScale` | number | 0.1–5.0 | no | the accessibility font-size multiplier (85–140% slider), read from the same `open-lingo-settings` localStorage key `simProbe.ts` reads |
| `online` | boolean | — | no | `navigator.onLine` at report time |
| `count` | int | 1–100,000 | yes (default 1) | dedupe counter — see §2 |
| `ts` | int (epoch ms) | — | yes | client clock, first occurrence |
| `sessionId` | string | 64 chars | yes | random per-session id, generated client-side, **not** a user id |
| `lastRequestId` | string | 64 chars | no | most recent `X-Request-Id` response header seen — opt-in, see §5 |

**Never sent, by construction (no such field exists in the schema):** user id,
email, name, username, display name, free-text answers, lesson/sentence
text, IP address. See §6 for the full privacy statement.

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

- **Lesson/step context is unwired.** `errorReporter.ts` exports
  `setLessonContext({lessonId, stepIndex, stepType})` and the field is real
  end-to-end (client → `ClientErrorItem` → CloudWatch line), but nothing
  calls the setter. Wiring it into `LessonPage`/the step renderer touches
  files this lane does not own (`src/features/lesson/components/steps/**`
  is explicitly off-limits — three other 2026-09-17 review lanes are
  working there). Whoever owns that surface next can call the setter at
  step-mount with near-zero additional plumbing.
- **`buildNumber` is always absent on web.** The only place a
  `package.json`-version Vite `define` could live is `vite.config.ts`,
  which this lane does not touch. `__LINGO_BUILD_ID__` (already defined
  there, the deploy's git SHA or a local dev timestamp) stands in as the
  web app-version signal instead; there is no separate "build number"
  concept for a web SPA the way there is for a native binary anyway.
- **`lastRequestId` is opt-in, unwired.** `errorReporter.ts` exports
  `setLastRequestId(id)`; nothing calls it because `ApiClient`
  (`src/shared/api/client.ts`) doesn't read response headers anywhere
  today (`_request` returns the parsed JSON body, discarding `Response`).
  Wiring this would mean `ApiClient` reading `X-Request-Id` off every
  response and calling the setter — a real but separate change to a file
  outside this lane's owned set.
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
  string, no hash), and — only once wired — a lesson id / step index / step
  type (never the lesson's text)
- Device/app context: platform (ios/android/web), OS version, app version,
  native build number, the accessibility font-scale setting, online/offline
  state
- A random, per-session, client-generated id (`sessionId`) — **not** a user
  id, not derived from any account identifier, not persisted across
  sessions
- A dedupe counter (`count`) and client timestamp (`ts`)
- The most recent API `X-Request-Id`, once wired, so a report can be
  correlated to a server log line

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

## Deploy recipe (lingo-core) — exactly as its docs describe it

**This lane did not deploy anything.** `app/telemetry/**` and the `main.py`/
`v1/router.py` changes are committed to the current branch, not pushed.

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

**To ship this lane's server change:** merge/push this branch's `lingo-core`
commit to `main` — the workflow above runs automatically (including its own
`pytest -q`, which now includes the 17 tests in
`tests/test_telemetry_errors.py`) and the smoke test will implicitly cover
the new `X-Request-Id` exception-handler change (the smoke payload hits
`/health`, not `/telemetry/errors`, but a 400/500 there would fail the
existing handler contract too — the new handlers are additive to the
existing 200 path).

---

## Three things Spencer must do

1. **Create the alarm** — §4 above. Needs an SNS topic ARN to notify
   (none exists for general ops alerts today; the only SNS topics in
   `lingo-infra` are AWS Budgets billing topics, the wrong target).
2. **Deploy** — push (or merge) this lane's `lingo-core` commit to `main`
   to actually put `POST /api/core/v1/telemetry/errors` on the internet;
   nothing in this lane pushes it. The client code ships the moment its own
   commit reaches a build (content-in-binary rule — see
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
