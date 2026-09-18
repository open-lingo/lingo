/**
 * Wire format + transport for `POST /api/core/v1/telemetry/errors`.
 *
 * Deliberately NOT built on `ApiClient` (`./client.ts`). Every other client
 * in this directory assumes an Auth0 session is either present or on its
 * way (see `provider.tsx` — even the `skipAuth: true` clients like
 * `FinanceApi`/`TagsApi` are constructed inside `<ApiProvider>`, after
 * `Auth0Provider` mounts). Error reporting has to work BEFORE any of that:
 * `installErrorReporter()` is called once from `main.tsx` right after the
 * provider tree renders, but the whole point of `AppErrorBoundary` sitting
 * OUTSIDE every provider (see its own docstring) is that a throw in
 * `Auth0Provider` itself, or in anything before it, must still be
 * reportable. `ApiClient` also carries its own retry/backoff/keepalive
 * policy tuned for authed JSON APIs; the error reporter needs its own
 * dedupe/cap/offline-queue policy (`../telemetry/errorReporter.ts`) that
 * would just fight ApiClient's if layered on top.
 *
 * What IS reused from the rest of `shared/api/`: the `/api/core/v1/...`
 * path convention, the `VITE_API_BASE_URL` env var (`provider.tsx`'s
 * `API_BASE_URL`), and the `keepalive` pattern from `client.ts` (a request
 * that must survive the tab backgrounding/closing).
 */

const TELEMETRY_ERRORS_PATH = "/api/core/v1/telemetry/errors";
const TELEMETRY_DIAGNOSTICS_PATH = "/api/core/v1/telemetry/diagnostics";

/** Mirrors `provider.tsx`'s `API_BASE_URL` default exactly — that file is
 *  React-provider-shaped and not importable from here without dragging in
 *  Auth0/React Query, so the constant is duplicated rather than shared. */
function apiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
  return configured.replace(/\/+$/, "");
}

export function telemetryErrorsUrl(): string {
  return `${apiBaseUrl()}${TELEMETRY_ERRORS_PATH}`;
}

export function telemetryDiagnosticsUrl(): string {
  return `${apiBaseUrl()}${TELEMETRY_DIAGNOSTICS_PATH}`;
}

/**
 * One report, wire-shape-identical to `lingo-core`'s `ClientErrorItem`
 * (`app/telemetry/schemas.py`). Kept as a plain type here (not re-exported
 * from `errorReporter.ts`) so this file stays the single source of truth
 * for "what the server accepts."
 */
export interface ClientErrorWireItem {
  message: string;
  stack?: string;
  source: string;
  route?: string;
  lessonId?: string;
  stepIndex?: number;
  stepType?: string;
  appVersion?: string;
  buildNumber?: string;
  platform: "ios" | "android" | "web";
  osVersion?: string;
  fontScale?: number;
  online?: boolean;
  count: number;
  ts: number;
  sessionId: string;
  lastRequestId?: string;
  /** Last <=20 sessionLog.ts events, ms-relative timestamps, payload
   *  values pre-trimmed to <=120 chars — mirrors
   *  `lingo-core/app/telemetry/schemas.py::ClientErrorBreadcrumb`. */
  breadcrumbs?: Array<{ t: number; type: string; payload?: Record<string, string> }>;
}

export interface SendResult {
  ok: boolean;
  /** 0 = the request never reached a server (network error / offline). */
  status: number;
}

/**
 * Normal (page-alive) send path. `keepalive: true` lets it survive a
 * background/close mid-flight (same rationale as `client.ts`'s
 * `RequestOptions.keepalive`), and unlike `sendBeacon` this gives the
 * caller a real status code to drive backoff decisions from.
 *
 * Browsers cap the combined body of all in-flight `keepalive` requests at
 * 64 KB and silently drop the request over that (documented on
 * `client.ts`'s `KEEPALIVE_MAX_BODY_BYTES`) — `errorReporter.ts` chunks
 * flushes to stay well under this, so `keepalive` is safe to set
 * unconditionally here rather than sizing the body per call.
 */
export async function sendErrorBatch(items: ClientErrorWireItem[]): Promise<SendResult> {
  try {
    const resp = await fetch(telemetryErrorsUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      keepalive: true,
    });
    return { ok: resp.ok, status: resp.status };
  } catch {
    // Network error, offline, CSP block, etc. — never throw out of a
    // telemetry call.
    return { ok: false, status: 0 };
  }
}

/**
 * Unload-safe send path: `navigator.sendBeacon` queues the request with the
 * browser/OS itself, so it is still attempted even if the page is torn down
 * immediately after this call returns (a `fetch(..., {keepalive: true})`
 * from inside a `pagehide` handler is not reliably given that guarantee on
 * every engine). No status visibility — the boolean only means "the
 * browser accepted this for delivery," never "the server received it."
 *
 * Returns `false` (never throws) when `sendBeacon` is unavailable (e.g. no
 * `navigator` in a non-DOM test environment) or synchronously rejects the
 * body (queue full / payload too large for the browser's own cap).
 */
export function sendErrorBatchBeacon(items: ClientErrorWireItem[]): boolean {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return false;
  try {
    const blob = new Blob([JSON.stringify({ items })], { type: "application/json" });
    return navigator.sendBeacon(telemetryErrorsUrl(), blob);
  } catch {
    return false;
  }
}

// ── Diagnostics (one-tap "Send diagnostics", A3b 2026-09-17) ────────────
//
// Wire format for `POST /api/core/v1/telemetry/diagnostics`, mirroring
// `lingo-core/app/telemetry/schemas.py::ClientDiagnosticsDocument` the
// same way `ClientErrorWireItem` mirrors `ClientErrorItem` above. Built by
// `errorReporter.ts::buildDiagnosticsDocument`/`sendDiagnosticsReport`,
// called from the Sync panel's "Send diagnostics" button
// (`src/features/sync/LayoutTracePanel.tsx`).

export interface ClientDiagnosticsWireDocument {
  sessionLog: Array<{ ts: number; type: string; payload?: Record<string, unknown> }>;
  layoutTrace?: unknown;
  tapReplay?: unknown;
  device: {
    platform: "ios" | "android" | "web";
    osVersion?: string;
    appVersion?: string;
    buildNumber?: string;
    fontScale?: number;
    viewport?: string;
  };
  lastRequestId?: string;
  /**
   * "Report a problem" fields (lane REPORTBTN, 2026-09-18) — mirrors
   * `lingo-core/app/telemetry/schemas.py::ClientDiagnosticsDocument`'s own
   * five new optional fields. A plain "Send diagnostics" tap
   * (`LayoutTracePanel.tsx`) never sets any of these.
   */
  note?: string;
  lessonId?: string;
  stepIndex?: number;
  stepType?: string;
  screen?: string;
}

export interface SendDiagnosticsResult {
  ok: boolean;
  /** 0 = the request never reached a server (network error / offline). */
  status: number;
  /** The 6-char lookup code, present only when `ok`. */
  code?: string;
}

/**
 * One-shot, unchunked POST — unlike `sendErrorBatch`, this is a single
 * explicit user action (a button tap), not something that needs
 * dedupe/backoff/offline-queue policy layered on top. No `keepalive`: the
 * button shows its own pending/result state, so there's no unload race to
 * guard against the way there is for an error report that might fire right
 * before a tab closes.
 */
export async function sendDiagnostics(doc: ClientDiagnosticsWireDocument): Promise<SendDiagnosticsResult> {
  try {
    const resp = await fetch(telemetryDiagnosticsUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });
    if (!resp.ok) return { ok: false, status: resp.status };
    const body = (await resp.json()) as { code?: string };
    return { ok: true, status: resp.status, code: body.code };
  } catch {
    // Network error, offline, CSP block, malformed JSON response, etc. —
    // never throw out of a telemetry call.
    return { ok: false, status: 0 };
  }
}
