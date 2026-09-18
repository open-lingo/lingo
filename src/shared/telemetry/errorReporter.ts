/**
 * In-house client error reporter — the app has no crash/error reporting at
 * all today (no Sentry/Bugsnag/Crashlytics/PostHog; `AppErrorBoundary` and
 * `RouteErrorBoundary` only `console.error`; `sessionLog.ts` is a 500-event
 * localStorage buffer for testers, never sent anywhere). TestFlight
 * screenshots are the only production signal. This gets a JS error,
 * unhandled rejection, error-boundary catch, or chunk-load failure to
 * CloudWatch (`lingo-core`'s `POST /api/core/v1/telemetry/errors`) within
 * about a debounce window, no vendor involved (Spencer's call — see
 * `docs/observability-2026-09-17.md`).
 *
 * Call `installErrorReporter()` exactly once, from `main.tsx`, AFTER the
 * provider tree renders (matches the design doc — providers must exist for
 * the app to be usable at all, but nothing here depends on any of them:
 * this module touches only `window`, `localStorage`, and `fetch`/
 * `sendBeacon`). It:
 *   1. Hooks `window.onerror` and `unhandledrejection`.
 *   2. Reads `window.__lingoBootGuard.firstError` once, if set — a failure
 *      the boot guard (`src/pub/boot-guard.js`) caught before React ever
 *      mounted (see that file's docstring).
 *   3. Flushes whatever an earlier, offline session queued to
 *      `localStorage`.
 * `AppErrorBoundary`/`RouteErrorBoundary` and the `vite:preloadError`
 * listener in `main.tsx` call `reportError()` directly at their own catch
 * sites — see those files.
 *
 * Policy (see the design doc for the reasoning): dedupe identical
 * message+stack within a session into one report with a running `count`;
 * cap 20 distinct reports/session; exponential backoff after a 5xx/429;
 * queue to `localStorage` while offline or backing off, flushed on next
 * `installErrorReporter()`; `navigator.sendBeacon` on unload, `fetch`
 * (`keepalive`) otherwise; NEVER throws.
 *
 * Privacy: no user id, email, name, free-text answers, or lesson text ever
 * enters a report — see `ClientErrorReport` below for the exact field set,
 * and `docs/observability-2026-09-17.md` for the privacy statement.
 *
 * Breadcrumbs (A3b, 2026-09-17): every report also carries the last <=20
 * `sessionLog.ts` events at report time — "what did the learner do right
 * before this broke," not just the stack trace. Built fresh per-report by
 * `buildBreadcrumbs()` (NOT stored on the queued report until it's built),
 * PII-free by the same rule `sessionLog.ts` already follows (lesson
 * content — labels, ids, step types, counts — never user-typed free text),
 * and re-capped at <=20 items / <=4KB total the same way the server does
 * (`lingo-core/app/telemetry/schemas.py`'s `MAX_BREADCRUMBS`/
 * `MAX_BREADCRUMBS_BYTES`) so a batch can never 422 on this field.
 */

import { IS_NATIVE } from "@/shared/platform/native";
import { sendDiagnostics, sendErrorBatch, sendErrorBatchBeacon, type ClientErrorWireItem } from "@/shared/api/telemetry";
// Named import (not `import pkg from ...`) so Rollup's JSON plugin can
// tree-shake this to just the one field, not the whole file (devDeps etc).
import { version as PACKAGE_VERSION } from "../../../package.json";
import { getSessionLog, type SessionEvent } from "./sessionLog";

// ── Public types ─────────────────────────────────────────────────────────

export type ClientErrorSource =
  | "window.onerror"
  | "unhandledrejection"
  | "AppErrorBoundary"
  | "RouteErrorBoundary"
  | "chunk-load"
  | "boot-guard"
  | (string & {});

export interface ReportErrorOptions {
  source?: ClientErrorSource;
  /** From `ErrorInfo.componentStack` (React error boundaries) — appended
   *  to the stack, still subject to the 4 KB cap. */
  componentStack?: string;
}

/** One `sessionLog.ts` event, shaped for the wire — mirrors
 *  `lingo-core/app/telemetry/schemas.py::ClientErrorBreadcrumb`. */
export interface ClientErrorBreadcrumb {
  /** ms relative to THIS report's `ts` — 0 or negative (the breadcrumb
   *  happened before or at the moment of the error). */
  t: number;
  type: string;
  /** Values pre-trimmed to <=120 chars each — see `trimBreadcrumbValue`. */
  payload?: Record<string, string>;
}

/** Lesson/step context a caller MAY set before an error happens so reports
 *  from inside a lesson carry it. Nothing in this repo calls this today —
 *  wiring it into `LessonPage`/the step renderer touches files this lane
 *  does not own (see the lane report) — but the field is real end-to-end
 *  (client → schema → CloudWatch line) for whoever wires the call site. */
export interface LessonErrorContext {
  lessonId?: string;
  stepIndex?: number;
  stepType?: string;
}

/** Wire shape sent to the server, mirrored 1:1 by
 *  `lingo-core/app/telemetry/schemas.py::ClientErrorItem`. Every field
 *  listed here — and NOTHING else — is what leaves the device. */
export interface ClientErrorReport {
  message: string;
  stack?: string;
  source: ClientErrorSource;
  route?: string;
  lessonId?: string;
  stepIndex?: number;
  stepType?: string;
  appVersion?: string;
  buildNumber?: string;
  platform: "ios" | "android" | "web";
  osVersion?: string;
  fontScale?: number;
  online: boolean;
  count: number;
  ts: number;
  sessionId: string;
  lastRequestId?: string;
  breadcrumbs?: ClientErrorBreadcrumb[];
}

// ── Caps / tuning ────────────────────────────────────────────────────────

/** Server hard-caps at 1 KB/4 KB per item (`ClientErrorItem`); truncate
 *  client-side so one oversized item never 422s a whole batch (the batch
 *  endpoint is all-or-nothing, same contract as `progress.ts`'s
 *  `MAX_ATTEMPTS_PER_BATCH`). */
const MAX_MESSAGE_CHARS = 1000;
const MAX_STACK_CHARS = 4000;

/** Distinct (post-dedupe) reports allowed per session. */
const MAX_REPORTS_PER_SESSION = 20;

/** Items per network request. Chosen so a full chunk at max field sizes
 *  (~5 KB/item) stays well under the shared 64 KB cap `fetch(keepalive)`
 *  and `sendBeacon` both enforce across ALL in-flight keepalive
 *  requests/beacons — 5 * ~5 KB = ~25 KB, comfortable headroom even if
 *  another keepalive request is in flight at the same moment. */
const CHUNK_SIZE = 5;

/** Debounce between an error and the flush it triggers — collapses a burst
 *  of repeats (dedup'd anyway) and back-to-back distinct errors into one
 *  network round trip. */
const FLUSH_DEBOUNCE_MS = 2000;

const BACKOFF_BASE_MS = 4000;
const BACKOFF_MAX_MS = 5 * 60_000;

/** Mirrors `lingo-core/app/telemetry/schemas.py`'s `MAX_BREADCRUMBS` /
 *  `MAX_BREADCRUMBS_BYTES` — trim client-side so a batch never 422s on
 *  this field, same rationale as `MAX_MESSAGE_CHARS`/`MAX_STACK_CHARS`
 *  above. */
const MAX_BREADCRUMBS = 20;
const MAX_BREADCRUMBS_BYTES = 4096;
/** Per-value trim inside a breadcrumb's `payload` — generous enough for a
 *  lesson id or a tile label, small enough that 20 crumbs stays well
 *  under `MAX_BREADCRUMBS_BYTES` even with several payload keys each. */
const MAX_BREADCRUMB_VALUE_CHARS = 120;

/** Body budget for the one-tap diagnostics document — mirrors
 *  `lingo-core/app/telemetry/guard.py`'s `MAX_BODY_BYTES` exactly (same
 *  150 KB the server rejects at, on `Content-Length` alone). Kept a hair
 *  under that so this client-side trim is the thing that actually fires,
 *  not a 413 from the server. */
const DIAGNOSTICS_BODY_BUDGET_BYTES = 145_000;
/** Diagnostics carries the FULL session log (not the 20-event breadcrumb
 *  slice) — per the task spec, up to 200 raw events. */
const MAX_DIAGNOSTICS_SESSION_EVENTS = 200;

const OFFLINE_QUEUE_KEY = "lingo_error_reports_v1";
/** Bound on persisted-but-unsent reports — a long offline stretch must not
 *  grow localStorage unboundedly. FIFO: oldest dropped first. */
const MAX_QUEUED_REPORTS = 40;

const SESSION_ID_KEY = "lingo_error_session_id_v1";
/** Same flat key `simProbe.ts` reads for the accessibility font slider —
 *  duplicated rather than imported (see that file: `open-lingo-settings`
 *  is the single canonical settings key `features/settings/storage.ts`
 *  migrates every legacy per-user key into). */
const SETTINGS_STORAGE_KEY = "open-lingo-settings";

// ── Module state ─────────────────────────────────────────────────────────

let installed = false;
let sessionId = "";
/** Signature -> report. Mutated in place so repeats before a flush bump
 *  `count` instead of enqueuing a new item. Cleared only by
 *  `__resetErrorReporterForTests`. */
const dedupe = new Map<string, ClientErrorReport>();
/** Reports already handed to a flush, kept here until that flush confirms
 *  (or gives up on) delivery, then dropped. Order = send order. */
let queue: ClientErrorReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let backoffUntil = 0;
let backoffAttempts = 0;
let lastRequestId: string | undefined;

/** Best-effort native app version/build, resolved async on install (see
 *  `resolveNativeAppInfo`) and cached here — `reportError` is synchronous
 *  and must never block on a native bridge call. */
let nativeAppInfo: { version?: string; build?: string } | null = null;

// ── Session id ───────────────────────────────────────────────────────────

function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    const existing = typeof window !== "undefined" ? window.sessionStorage.getItem(SESSION_ID_KEY) : null;
    if (existing) {
      sessionId = existing;
      return sessionId;
    }
  } catch {
    /* no sessionStorage */
  }
  sessionId = `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  } catch {
    /* ignore */
  }
  return sessionId;
}

// ── Cheap context readers ───────────────────────────────────────────────

function readFontScale(): number | undefined {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const v = parsed?.accessibility?.fontSize;
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

/** Exported (2026-09-17, lane A3b) so `shared/api/client.ts` can stamp the
 *  same platform value onto `X-Lingo-Platform` on every request — lets
 *  `lingo-core`'s `lingo.access` line show ios/android/web per request
 *  (cheap, no PII), the same signal an error report already carries. */
export function detectPlatform(): "ios" | "android" | "web" {
  if (!IS_NATIVE) return "web";
  try {
    // Dynamic import mirrors the pattern already used for native-only
    // Capacitor calls elsewhere (`NativeAuthBridge.tsx`,
    // `useAppLifecycleSync.ts`) — keeps `@capacitor/core` out of the
    // critical path for the (far more common) web bundle. Best-effort:
    // Capacitor.getPlatform() is synchronous once the module is loaded,
    // but the import itself is async, so the FIRST report of a session
    // may fall back to the UA sniff below before this resolves. Native
    // platform is cached process-wide by `resolveNativeAppInfo`'s sibling
    // read (see `cachedPlatform`).
    if (cachedPlatform) return cachedPlatform;
  } catch {
    /* fall through */
  }
  // Fallback: UA sniff. Good enough to distinguish ios/android when the
  // Capacitor module hasn't resolved yet — WKWebView's UA always contains
  // "like Mac OS X", Android's WebView UA always contains "Android".
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod|like Mac OS X/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "web";
}

let cachedPlatform: "ios" | "android" | null = null;

let cachedTimezone: string | null = null;

/** Exported (2026-09-18, quest-timezone lane) so `shared/api/client.ts`
 *  can stamp the device's IANA zone onto `X-Lingo-Timezone` on every
 *  request — lingo-core uses it to bucket a user's daily/weekly quest
 *  resets by LOCAL calendar day instead of UTC (see the quest-timezone
 *  memory). Cached process-wide: `Intl.DateTimeFormat().resolvedOptions()`
 *  allocates a formatter every call, and this runs on the hot API-request
 *  path — a device's zone doesn't change mid-session outside a literal
 *  flight, so recomputing it per request buys nothing. `Intl` is
 *  unconditionally available in every runtime this app ships to (no
 *  native-only gate needed, unlike `detectPlatform`'s Capacitor check). */
export function detectTimezone(): string {
  if (cachedTimezone) return cachedTimezone;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    cachedTimezone = tz || "UTC";
  } catch {
    cachedTimezone = "UTC";
  }
  return cachedTimezone;
}

/** OS version parsed from the UA string, per the design doc ("OS version
 *  from navigator.userAgent"). Two shapes covered: iOS's `OS 18_4 like Mac
 *  OS X` and Android's `Android 14`. Returns undefined (never throws) for
 *  anything else — a web desktop UA has no single "OS version" token worth
 *  guessing at. */
export function parseOsVersion(ua: string): string | undefined {
  const ios = ua.match(/OS (\d+[_.]\d+(?:[_.]\d+)?) like Mac OS X/);
  if (ios) return `iOS ${ios[1].replace(/_/g, ".")}`;
  const android = ua.match(/Android (\d+(?:\.\d+)*)/);
  if (android) return `Android ${android[1]}`;
  return undefined;
}

/** Kicks off (does not await) resolving the native App plugin's
 *  version/build so LATER reports in the session can include it. Never
 *  blocks `installErrorReporter()` — a native bridge call before the
 *  bridge is ready is exactly the kind of thing this reporter must
 *  survive, not depend on. */
function resolveNativeAppInfo(): void {
  if (!IS_NATIVE || nativeAppInfo) return;
  void (async () => {
    try {
      const [{ App }, { Capacitor }] = await Promise.all([import("@capacitor/app"), import("@capacitor/core")]);
      cachedPlatform = (Capacitor.getPlatform() as "ios" | "android" | undefined) ?? null;
      const info = await App.getInfo();
      nativeAppInfo = { version: info.version, build: info.build };
    } catch {
      // No native bridge (web build under a native-flagged env, a
      // plugin that failed to load, etc.) — reports fall back to
      // __LINGO_BUILD_ID__ / undefined, same as if this never ran.
      nativeAppInfo = {};
    }
  })();
}

/** app version + build. Native: Capacitor `App.getInfo()` (Info.plist
 *  `CFBundleShortVersionString`/`CFBundleVersion` on iOS,
 *  versionName/versionCode on Android) once resolved, else undefined for
 *  BOTH fields until it is (never blocks). Web: no discrete "build
 *  number" is exposed to the bundle at all (this lane does not touch
 *  `vite.config.ts`, which is the only place a `package.json` version
 *  define lives, and none exists there today) — `__LINGO_BUILD_ID__`
 *  (the deploy's git SHA, or a local timestamp in dev) stands in as the
 *  web app-version signal, and `buildNumber` is genuinely absent.
 *
 *  Exported (2026-09-18, lane STATS) so `atomOutcome.ts` can stamp the same
 *  `buildNumber` on `atom_outcome` events without duplicating the native
 *  App-plugin resolution dance — one cached read, two telemetry streams. */
export function appVersionAndBuild(): { appVersion?: string; buildNumber?: string } {
  if (IS_NATIVE) {
    return { appVersion: nativeAppInfo?.version, buildNumber: nativeAppInfo?.build };
  }
  const buildId = typeof __LINGO_BUILD_ID__ !== "undefined" ? __LINGO_BUILD_ID__ : undefined;
  return { appVersion: buildId ?? PACKAGE_VERSION, buildNumber: undefined };
}

// ── Breadcrumbs (A3b, 2026-09-17) ───────────────────────────────────────

/** UTF-8 byte length — `TextEncoder` is available in every environment
 *  this module runs in (browsers + jsdom under Vitest); the try/catch is
 *  defense against a pathological environment that lacks it, falling back
 *  to JS string length (an under-count for non-ASCII, but "never throw"
 *  matters more here than exactness). */
function byteLength(s: string): number {
  try {
    return new TextEncoder().encode(s).length;
  } catch {
    return s.length;
  }
}

/** One payload value, stringified and trimmed to
 *  `MAX_BREADCRUMB_VALUE_CHARS`. Non-string values (numbers, booleans,
 *  small objects — `sessionLog.ts` payloads are `Record<string, unknown>`)
 *  are JSON-stringified first so the breadcrumb stays useful without ever
 *  sending a raw object the server schema (a `dict[str, str]`) would
 *  reject. */
function trimBreadcrumbValue(v: unknown): string {
  let s: string;
  if (typeof v === "string") {
    s = v;
  } else {
    try {
      s = JSON.stringify(v) ?? String(v);
    } catch {
      s = String(v);
    }
  }
  return s.length > MAX_BREADCRUMB_VALUE_CHARS ? s.slice(0, MAX_BREADCRUMB_VALUE_CHARS) : s;
}

/** The last <=20 `sessionLog.ts` events at report time, ms-relative to
 *  `reportTs`, payload values trimmed to <=120 chars each, then
 *  re-trimmed (dropping the OLDEST crumbs first) until the whole array
 *  serializes under `MAX_BREADCRUMBS_BYTES` — mirrors the server's own
 *  hard caps exactly (`ClientErrorBreadcrumb`/`MAX_BREADCRUMBS_BYTES` in
 *  `lingo-core/app/telemetry/schemas.py`) so a batch can never 422 on this
 *  field. Never throws — a failure here must not lose the underlying
 *  error report. */
function buildBreadcrumbs(reportTs: number): ClientErrorBreadcrumb[] {
  try {
    const events = getSessionLog().slice(-MAX_BREADCRUMBS);
    let crumbs: ClientErrorBreadcrumb[] = events.map((e: SessionEvent) => {
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(e.payload ?? {})) {
        payload[k] = trimBreadcrumbValue(v);
      }
      return { t: e.ts - reportTs, type: e.type, payload };
    });
    while (crumbs.length > 0 && byteLength(JSON.stringify(crumbs)) > MAX_BREADCRUMBS_BYTES) {
      crumbs = crumbs.slice(1); // drop OLDEST first — keep what's most recent
    }
    return crumbs;
  } catch {
    return [];
  }
}

// ── Diagnostics document (one-tap "Send diagnostics", A3b 2026-09-17) ────

/** Body of `POST /api/core/v1/telemetry/diagnostics` — mirrors
 *  `lingo-core/app/telemetry/schemas.py::ClientDiagnosticsDocument`. Bigger
 *  and rarer than a `ClientErrorReport`: fired once, on demand, by the
 *  "Send diagnostics" button in the Sync panel, not automatically. */
/** Sync/test-out-queue snapshot (2026-09-18, SYNC2 lane) — the same shape
 *  `testOutSyncQueue.ts`'s `getTestOutQueueDiagnostics()` returns, plus the
 *  reconcile status line the Sync panel already renders
 *  (`progressReconcile.ts`'s `formatReconcileStatusLine`). Passed through
 *  opaquely by the caller, same pattern as `layoutTrace`/`tapReplay` — this
 *  module never imports the sync/domain modules directly (would risk an
 *  import cycle back through `reportError`). */
export interface DiagnosticsSyncSection {
  pendingCount: number;
  lastChunkSize: number | null;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: { name: string; message: string; status?: number; requestId?: string; at: string } | null;
  reconcileLine: string;
}

export interface DiagnosticsDocument {
  sessionLog: Array<{ ts: number; type: string; payload: Record<string, unknown> }>;
  /** Opaque — `shared/dev/layoutTrace.ts`'s `LayoutTrace` shape, passed
   *  through as-is by the caller (see `LayoutTracePanel.tsx`). */
  layoutTrace?: unknown;
  /** Opaque — `sessionLog.ts`'s `TapReplayDoc` shape. */
  tapReplay?: unknown;
  sync?: DiagnosticsSyncSection;
  device: {
    platform: "ios" | "android" | "web";
    osVersion?: string;
    appVersion?: string;
    buildNumber?: string;
    fontScale?: number;
    viewport?: string;
  };
  lastRequestId?: string;
}

/** Builds the diagnostics document: up to 200 raw session-log events (full
 *  fidelity, NOT the 120-char-trimmed breadcrumb slice), the caller's
 *  layout-trace/tap-replay docs if present, and the same device/app
 *  context an error report carries. Trims to fit
 *  `DIAGNOSTICS_BODY_BUDGET_BYTES` by dropping the OLDEST session-log
 *  events first — same "drop oldest until it fits" pattern
 *  `buildBreadcrumbs` uses, just against a much bigger budget (the
 *  server's 150 KB body-size guard, `lingo-core/app/telemetry/guard.py`).
 *  Never throws. */
export function buildDiagnosticsDocument(
  opts: { layoutTrace?: unknown; tapReplay?: unknown; sync?: DiagnosticsSyncSection } = {},
): DiagnosticsDocument {
  const { appVersion, buildNumber } = appVersionAndBuild();
  const doc: DiagnosticsDocument = {
    sessionLog: getSessionLog()
      .slice(-MAX_DIAGNOSTICS_SESSION_EVENTS)
      .map((e) => ({ ts: e.ts, type: e.type, payload: e.payload ?? {} })),
    layoutTrace: opts.layoutTrace ?? undefined,
    tapReplay: opts.tapReplay ?? undefined,
    sync: opts.sync ?? undefined,
    device: {
      platform: detectPlatform(),
      osVersion: typeof navigator !== "undefined" ? parseOsVersion(navigator.userAgent) : undefined,
      appVersion,
      buildNumber,
      fontScale: readFontScale(),
      viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    },
    lastRequestId,
  };
  while (doc.sessionLog.length > 0 && byteLength(JSON.stringify(doc)) > DIAGNOSTICS_BODY_BUDGET_BYTES) {
    doc.sessionLog = doc.sessionLog.slice(1);
  }
  return doc;
}

/** Orchestrates the one-tap "Send diagnostics" flow: build the document,
 *  POST it, return the server's code (or failure). Never throws — the
 *  caller (the Sync panel button) only needs `ok`/`code` to render a
 *  result, not a try/catch of its own. */
export async function sendDiagnosticsReport(opts: {
  layoutTrace?: unknown;
  tapReplay?: unknown;
  sync?: DiagnosticsSyncSection;
}): Promise<{ ok: boolean; code?: string; status: number }> {
  try {
    const doc = buildDiagnosticsDocument(opts);
    const result = await sendDiagnostics(doc);
    return result;
  } catch {
    return { ok: false, status: 0 };
  }
}

// ── Lesson context (opt-in setter, unwired today — see module docstring) ──

let lessonContext: LessonErrorContext | null = null;

export function setLessonContext(ctx: LessonErrorContext | null): void {
  lessonContext = ctx && (ctx.lessonId || ctx.stepType || ctx.stepIndex !== undefined) ? ctx : null;
}

// ── lastRequestId (opt-in setter — see module docstring) ──────────────────

/** `ApiClient`/`telemetry.ts` callers MAY feed the most recent
 *  `X-Request-Id` response header here so the next error report can carry
 *  it (`lastRequestId`), letting a human grep the exact CloudWatch
 *  invocation that preceded the failure. Not wired to any call site by
 *  this lane (`ApiClient` doesn't read response headers today — see the
 *  lane report); safe to call from anywhere, no-ops harmlessly if never
 *  called. */
export function setLastRequestId(requestId: string | undefined): void {
  if (requestId) lastRequestId = requestId;
}

/** Read-only counterpart (2026-09-18, SYNC2 lane) — lets a non-error
 *  diagnostic (e.g. `testOutSyncQueue.ts`'s drain-error tracker) stamp the
 *  same request id an error report would carry, without duplicating the
 *  header-read logic that populates it. */
export function getLastRequestId(): string | undefined {
  return lastRequestId;
}

// ── Normalizing an error into a report ─────────────────────────────────

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: `${error.name}: ${error.message}`, stack: error.stack };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error).slice(0, MAX_MESSAGE_CHARS) };
  } catch {
    return { message: String(error) };
  }
}

function signatureOf(message: string, stack: string | undefined): string {
  return `${message} ${(stack ?? "").slice(0, 300)}`;
}

// ── Ignore-list (benign browser/engine noise, b28 B28A follow-up) ─────────

/**
 * Exact-message set for diagnostics that are UA-internal noise, not app
 * bugs, caught only because `window.onerror` captures ANY `error` event
 * indiscriminately:
 *
 *   - "ResizeObserver loop completed with undelivered notifications." — the
 *     spec-text WebKit/Firefox wording. Root-caused (b28 lane B28A,
 *     `docs/user-feedback/2026-09-17-testflight-b28.md`'s "ResizeObserver
 *     loop (build_sentence)" section) to `tileFit.ts`'s single shared
 *     `ResizeObserver` needing more convergence rounds than the browser's
 *     own per-frame notification-round limit allows, under `tileFit.ts`'s
 *     OWN `MAX_PASSES_PER_FRAME = 8` anti-flicker cap — bounded, converges,
 *     not a defect.
 *   - "ResizeObserver loop limit exceeded" — Chromium's older wording for
 *     the same UA-internal condition.
 *
 * Both ship with `event.error === null` for this diagnostic (a documented
 * browser quirk, not a thrown `Error`), so `onWindowError` passes
 * `event.message` straight through `normalizeError`'s plain-string branch
 * with no `"Name: message"` prefix — the exact text below is what actually
 * reaches `reportError` in practice. The `endsWith(": " + text)` check in
 * `isIgnoredMessage` also covers the rarer path where something re-throws
 * one of these as a real `Error` whose `.message` matches verbatim. A
 * DIFFERENT message that merely mentions "ResizeObserver" — in its own
 * text, or only in a stack trace — is NOT in this set and is still
 * reported (see errorReporter.test.ts).
 */
const IGNORED_ERROR_MESSAGES = new Set<string>([
  "ResizeObserver loop completed with undelivered notifications.",
  "ResizeObserver loop limit exceeded",
]);

function isIgnoredMessage(message: string): boolean {
  if (IGNORED_ERROR_MESSAGES.has(message)) return true;
  for (const text of IGNORED_ERROR_MESSAGES) {
    if (message.endsWith(`: ${text}`)) return true;
  }
  return false;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Report one error. Safe to call from anywhere, any number of times, before
 * or after `installErrorReporter()` — never throws, never awaits.
 */
export function reportError(error: unknown, opts: ReportErrorOptions = {}): void {
  try {
    const { message: rawMessage, stack: rawStack } = normalizeError(error);
    const message = rawMessage.slice(0, MAX_MESSAGE_CHARS);
    // Drop BEFORE breadcrumbs/dedupe/queue — never enters `dedupe`, never
    // counts against `MAX_REPORTS_PER_SESSION`, never persists. See
    // `IGNORED_ERROR_MESSAGES`'s docstring.
    if (isIgnoredMessage(message)) return;
    const stackWithComponent = opts.componentStack ? `${rawStack ?? ""}\n${opts.componentStack}` : rawStack;
    const stack = stackWithComponent ? stackWithComponent.slice(0, MAX_STACK_CHARS) : undefined;
    const signature = signatureOf(message, stack);

    const existing = dedupe.get(signature);
    if (existing) {
      existing.count += 1;
      scheduleFlush();
      return;
    }

    if (dedupe.size >= MAX_REPORTS_PER_SESSION) {
      // Cap reached — drop silently. A console line would itself be
      // console noise on a device that's already erroring a lot.
      return;
    }

    const platform = detectPlatform();
    const { appVersion, buildNumber } = appVersionAndBuild();
    const ts = Date.now();
    const report: ClientErrorReport = {
      message,
      stack,
      source: opts.source ?? "window.onerror",
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      lessonId: lessonContext?.lessonId,
      stepIndex: lessonContext?.stepIndex,
      stepType: lessonContext?.stepType,
      appVersion,
      buildNumber,
      platform,
      osVersion: typeof navigator !== "undefined" ? parseOsVersion(navigator.userAgent) : undefined,
      fontScale: readFontScale(),
      online: typeof navigator !== "undefined" ? navigator.onLine : true,
      count: 1,
      ts,
      sessionId: getSessionId(),
      lastRequestId,
      breadcrumbs: buildBreadcrumbs(ts),
    };
    dedupe.set(signature, report);
    queue.push(report);
    persistQueue();
    scheduleFlush();
  } catch {
    // Never throw out of error reporting.
  }
}

function scheduleFlush(): void {
  if (flushTimer != null) return;
  if (typeof window === "undefined") return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPending();
  }, FLUSH_DEBOUNCE_MS);
}

function isBackingOff(): boolean {
  return Date.now() < backoffUntil;
}

function applyBackoff(): void {
  backoffAttempts += 1;
  const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** (backoffAttempts - 1));
  backoffUntil = Date.now() + delay;
}

function resetBackoff(): void {
  backoffAttempts = 0;
  backoffUntil = 0;
}

/**
 * Send everything currently queued, in `CHUNK_SIZE` chunks. Stops at the
 * first failing chunk (keeping it and everything after it queued) so
 * ordering is preserved and one bad chunk doesn't get retried out of
 * order. Exported for `installErrorReporter()`'s startup flush and for
 * tests — production code never needs to call this directly (`reportError`
 * schedules it).
 */
export async function flushPending(opts: { beacon?: boolean } = {}): Promise<void> {
  if (queue.length === 0) return;
  if (!opts.beacon && isBackingOff()) return;

  if (opts.beacon) {
    // Unload path: fire-and-forget every chunk, no status to react to.
    // Optimistically clear — a lost beacon on tab close is an acceptable
    // gap (see the doc's privacy/limits note); staying queued forever
    // would just re-send stale reports next launch with no better odds.
    for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
      sendErrorBatchBeacon(toWireItems(queue.slice(i, i + CHUNK_SIZE)));
    }
    queue = [];
    persistQueue();
    return;
  }

  let sentThrough = 0;
  for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
    const chunk = queue.slice(i, i + CHUNK_SIZE);
    const result = await sendErrorBatch(toWireItems(chunk));
    if (result.ok) {
      resetBackoff();
      sentThrough = i + chunk.length;
      continue;
    }
    if (result.status === 0 || result.status >= 500 || result.status === 429) {
      // Offline / 5xx / rate-limited — retry later, keep this and every
      // later chunk queued.
      applyBackoff();
      break;
    }
    // 4xx other than 429 (e.g. a malformed item somehow past client-side
    // caps) — this chunk can never succeed; drop it and keep going so one
    // bad item doesn't block the rest of the session's reports forever.
    sentThrough = i + chunk.length;
  }
  if (sentThrough > 0) {
    queue = queue.slice(sentThrough);
    persistQueue();
  }
}

function toWireItems(reports: ClientErrorReport[]): ClientErrorWireItem[] {
  return reports.map((r) => ({ ...r }));
}

// ── Offline persistence ──────────────────────────────────────────────────

function persistQueue(): void {
  try {
    const bounded = queue.slice(-MAX_QUEUED_REPORTS);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(bounded));
  } catch {
    /* quota or no localStorage — best effort only */
  }
}

function loadPersistedQueue(): ClientErrorReport[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ClientErrorReport[]) : [];
  } catch {
    return [];
  }
}

// ── Install ──────────────────────────────────────────────────────────────

function onWindowError(event: ErrorEvent): void {
  reportError(event.error ?? event.message, { source: "window.onerror" });
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
  reportError(event.reason, { source: "unhandledrejection" });
}

function flushOnHide(): void {
  void flushPending({ beacon: true });
}

/**
 * Wire every hook. Idempotent — a second call is a no-op, so it's safe for
 * `main.tsx` to call unconditionally even under React StrictMode's double
 * invoke of effects (though this is called from module scope, not an
 * effect — see `main.tsx`).
 */
export function installErrorReporter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  resolveNativeAppInfo();

  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("pagehide", flushOnHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnHide();
  });

  // Boot-guard's pre-React capture (see module docstring). Read once;
  // `firstError` is a plain string (`"Name: message"` or similar), not an
  // Error, so it skips `normalizeError`'s Error-instance branch.
  try {
    const guard = (window as unknown as { __lingoBootGuard?: { firstError: string | null } }).__lingoBootGuard;
    if (guard?.firstError) {
      reportError(guard.firstError, { source: "boot-guard" });
    }
  } catch {
    /* no boot guard (test env, etc.) */
  }

  // Re-hydrate anything a previous, offline/crashed session couldn't send.
  // These are NOT re-deduped against this session's fresh `dedupe` map —
  // that map only governs new `reportError` calls; persisted reports are
  // already-finalized payloads from a different session and just need
  // delivering.
  const persisted = loadPersistedQueue();
  if (persisted.length > 0) {
    queue.push(...persisted);
    void flushPending();
  }
}

// ── Test-only reset ──────────────────────────────────────────────────────

/** Vitest-only: reset all module state between tests. Not used in
 *  production code. */
export function __resetErrorReporterForTests(): void {
  installed = false;
  sessionId = "";
  dedupe.clear();
  queue = [];
  if (flushTimer != null) clearTimeout(flushTimer);
  flushTimer = null;
  backoffUntil = 0;
  backoffAttempts = 0;
  lastRequestId = undefined;
  nativeAppInfo = null;
  cachedPlatform = null;
  cachedTimezone = null;
  lessonContext = null;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    window.sessionStorage.removeItem(SESSION_ID_KEY);
  } catch {
    /* ignore */
  }
}

/** Vitest-only: current pending queue snapshot, for assertions. */
export function __getPendingQueueForTests(): readonly ClientErrorReport[] {
  return queue;
}
