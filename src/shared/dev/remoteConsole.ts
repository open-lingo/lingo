/**
 * DEV-ONLY remote log channel (lane A11, 2026-09-17 —
 * `docs/device-dev-debug-2026-09-17.md`).
 *
 * Spencer is pairing an iPad with iOS Developer Mode to this Mac so a
 * cross-device sync bug (phone vs iPad, both on the same build) can be
 * watched live instead of reconstructed after the fact from TestFlight
 * screenshots. `installDevLog()` (`shared/devlog/devLog.ts`) already
 * forwards `console.*` to `/tmp/lingo-console.log` for a human tail; this
 * module is a SEPARATE, richer channel — one JSONL file per device under
 * `artifacts/devlog/<device>.jsonl` — that also carries every API request
 * through `ApiClient`, every `sessionLog` event, SRS sync queue
 * transitions, and progress-reconcile decisions, batched and POSTed to the
 * Vite dev server's `/__devlog` middleware (`vite.config.ts`).
 *
 * Gating (both must hold, checked at `installRemoteConsole()` call time,
 * not module scope — mirrors `installSimProbe`/`installDevLog`):
 *   1. `import.meta.env.DEV` — Vite inlines this to `false` in every
 *      production/native build, so the whole install path dead-code-
 *      eliminates out of a real TestFlight bundle.
 *   2. The ARM flag — `localStorage["lingo:devlog"] === "1"` OR
 *      `import.meta.env.VITE_DEVLOG === "1"` (a dev-server env var, for
 *      `scripts/mobile/dev-build-device.sh`'s `dev:lan` server, where
 *      there's no interactive console to set localStorage from before the
 *      very first page load). Neither is set by default, so a plain
 *      `npm run dev` stays silent — this is opt-in debugging, not a
 *      standing tap on dev traffic.
 *
 * Privacy (see the doc): every hook here reports SHAPE, never CONTENT —
 * method/path/status/timing/byte-COUNTS for API calls (never a header
 * value, never a request/response body), counts for SRS sync, status
 * strings for reconcile decisions. `safeStringify` additionally redacts
 * any object key that looks like a credential (`authorization`, `token`,
 * `password`, …) before it can reach a console-forwarded log line, and
 * caps every field at 2 KB so one huge `console.log(hugeObject)` can't
 * blow up a batch.
 */

import { IS_NATIVE } from "@/shared/platform/native";
import { getSessionLog, subscribeSessionLog } from "@/shared/telemetry/sessionLog";
import { setApiRequestObserver, type ApiRequestObserverRecord } from "@/shared/api/client";
import { setSrsSyncObserver, type SrsSyncEvent } from "@/features/flashcards/engine/srsSync";
import { setReconcileObserver, type ReconcileObserverEvent } from "@/shared/domain/progressReconcile";

// ── Constants ────────────────────────────────────────────────────────────

const ARM_KEY = "lingo:devlog";
const DEVICE_ID_KEY = "lingo_devlog_device_id_v1";
const SERVER_PATH = "/__devlog";
const FLUSH_INTERVAL_MS = 500;
/** Per-field cap, matching the task's "≤2 KB each" — applied to every
 *  stringified console arg AND to the JSON-stringified session/sync/
 *  reconcile payloads, so no single record can dominate a batch. */
const MAX_FIELD_CHARS = 2000;

export type DevLogKind = "console" | "error" | "api" | "session" | "sync" | "reconcile";

export interface DevLogRecord {
  t: number;
  device: string;
  seq: number;
  kind: DevLogKind;
  [key: string]: unknown;
}

// ── Module state ─────────────────────────────────────────────────────────

let installed = false;
let queue: DevLogRecord[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let seq = 0;
let cachedDeviceId = "";
/** `getSessionLog()` length as of the last forward — `subscribeSessionLog`'s
 *  callback carries no payload, so new rows are found by diffing lengths. */
let lastSessionLogLen = 0;
/** Unsubscribe handle for `hookSessionLog`'s `subscribeSessionLog` call —
 *  `sessionLog.ts`'s `subscribers` Set is module-level and OUTLIVES this
 *  module's own `installed` guard, so a stale subscription left behind by
 *  `__resetRemoteConsoleForTests()` (tests only — `installRemoteConsole()`
 *  is idempotent in production and never torn down) would otherwise keep
 *  forwarding session events after "install" via a callback the next test
 *  never registered itself. */
let sessionLogUnsubscribe: (() => void) | null = null;

// ── Arm check ────────────────────────────────────────────────────────────

export function isDevlogArmed(): boolean {
  if (import.meta.env.VITE_DEVLOG === "1") return true;
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(ARM_KEY) === "1";
  } catch {
    return false;
  }
}

// ── Device id ────────────────────────────────────────────────────────────

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Best-effort device model from the UA — WKWebView's UA carries "iPhone"
 *  or "iPad" but never a model number; Android's UA DOES carry a model
 *  token in parentheses, so that's used when present. Sanitized to a safe
 *  filename/log-line segment (no `/`, spaces collapsed to `-`). */
export function detectDevlogModel(ua: string): string {
  if (/iPad/.test(ua)) return "iPad";
  if (/iPhone/.test(ua)) return "iPhone";
  const androidModel = /Android [^;]+;\s*([^)]+)\)/.exec(ua)?.[1]?.trim();
  if (androidModel) {
    return androidModel.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 24) || "Android";
  }
  if (/Android/.test(ua)) return "Android";
  return "browser";
}

export function detectDevlogPlatform(ua: string): "ios" | "android" | "web" {
  if (!IS_NATIVE) return "web";
  if (/Android/.test(ua)) return "android";
  return "ios";
}

/** `<platform>-<model>-<last4 of a random per-install id>` — the id itself
 *  persists in localStorage (stable per install/browser profile, NOT per
 *  session), so the same phone shows up as the same `device` string across
 *  launches, letting `sync-timeline.mjs` merge two devices' files. */
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  let installId = "";
  try {
    installId = (typeof localStorage !== "undefined" && localStorage.getItem(DEVICE_ID_KEY)) || "";
    if (!installId) {
      installId = randomId();
      localStorage.setItem(DEVICE_ID_KEY, installId);
    }
  } catch {
    installId = installId || randomId();
  }
  const last4 = installId.replace(/-/g, "").slice(-4).padStart(4, "0");
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  cachedDeviceId = `${detectDevlogPlatform(ua)}-${detectDevlogModel(ua)}-${last4}`;
  return cachedDeviceId;
}

// ── Redaction / stringify ────────────────────────────────────────────────

/** Object keys that must never leave this channel even truncated —
 *  matched case-insensitively against the FULL key (JSON.stringify's
 *  replacer sees each key as it recurses). */
const REDACT_KEY_RE = /^(authorization|cookie|set-cookie|token|access[_-]?token|refresh[_-]?token|id[_-]?token|password|secret|api[_-]?key)$/i;

export function redactingReplacer(key: string, value: unknown): unknown {
  if (REDACT_KEY_RE.test(key)) return "[redacted]";
  return value;
}

/** Same shape as `devLog.ts`'s `safeStringify`, plus key-based redaction
 *  and the 2 KB cap. Never throws. */
export function safeStringify(arg: unknown): string {
  let s: string;
  if (arg === null) s = "null";
  else if (arg === undefined) s = "undefined";
  else if (typeof arg === "string") s = arg;
  else if (typeof arg === "number" || typeof arg === "boolean") s = String(arg);
  else if (arg instanceof Error) s = `${arg.name}: ${arg.message}`;
  else {
    try {
      s = JSON.stringify(arg, redactingReplacer) ?? String(arg);
    } catch {
      s = "[unserializable]";
    }
  }
  return s.length > MAX_FIELD_CHARS ? `${s.slice(0, MAX_FIELD_CHARS)}…[truncated]` : s;
}

// ── Batching ─────────────────────────────────────────────────────────────

function enqueue(kind: DevLogKind, fields: Record<string, unknown>): void {
  queue.push({ t: Date.now(), device: getDeviceId(), seq: seq++, kind, ...fields });
  scheduleFlush();
}

function scheduleFlush(): void {
  if (flushTimer != null) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

function flush(): void {
  flushTimer = null;
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    void fetch(SERVER_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ batch }),
      keepalive: true,
    }).catch(() => {
      /* best effort — a dropped batch is not retried; devlog is a live tap,
         not a durable queue */
    });
  } catch {
    /* no fetch (SSR, ancient runtime) — best effort */
  }
}

function flushOnHide(): void {
  flush();
}

// ── console / window error hooks ────────────────────────────────────────

type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";
const CONSOLE_LEVELS: ConsoleLevel[] = ["log", "info", "warn", "error", "debug"];

function hookConsole(): void {
  for (const level of CONSOLE_LEVELS) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      original(...args);
      enqueue("console", { level, msg: args.map(safeStringify).join(" ") });
    };
  }
}

function hookWindowErrors(): void {
  window.addEventListener("error", (e: ErrorEvent) => {
    enqueue("error", {
      source: "window.onerror",
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error instanceof Error ? safeStringify(e.error.stack ?? "") : undefined,
    });
  });
  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    enqueue("error", { source: "unhandledrejection", reason: safeStringify(e.reason) });
  });
}

// ── ApiClient hook ───────────────────────────────────────────────────────

function hookApiClient(): void {
  setApiRequestObserver((rec: ApiRequestObserverRecord) => {
    enqueue("api", {
      method: rec.method,
      path: rec.path,
      status: rec.status,
      ok: rec.ok,
      ms: rec.ms,
      requestId: rec.requestId,
      reqBytes: rec.reqBytes,
      resBytes: rec.resBytes,
      attempt: rec.attempt,
    });
  });
}

// ── sessionLog hook ──────────────────────────────────────────────────────

function hookSessionLog(): void {
  lastSessionLogLen = getSessionLog().length;
  sessionLogUnsubscribe = subscribeSessionLog(() => {
    const log = getSessionLog();
    // `clearSessionLog()` shrinks the buffer — reset the cursor rather than
    // forwarding nothing forever.
    if (log.length < lastSessionLogLen) lastSessionLogLen = 0;
    for (let i = lastSessionLogLen; i < log.length; i++) {
      const e = log[i];
      enqueue("session", { type: e.type, sid: e.sid, payload: safeStringify(e.payload) });
    }
    lastSessionLogLen = log.length;
  });
}

// ── SRS sync + reconcile hooks ───────────────────────────────────────────

function hookSrsSync(): void {
  setSrsSyncObserver((event: SrsSyncEvent) => {
    enqueue("sync", { ...event });
  });
}

function hookReconcile(): void {
  setReconcileObserver((event: ReconcileObserverEvent) => {
    enqueue("reconcile", { ...event });
  });
}

// ── Install ──────────────────────────────────────────────────────────────

/**
 * Wire every hook. Idempotent. No-ops unless `import.meta.env.DEV` AND the
 * arm flag are both true — see the module doc comment. Call once from
 * `main.tsx`, next to `installSimProbe()`.
 */
export function installRemoteConsole(): void {
  if (installed) return;
  if (!import.meta.env.DEV) return;
  if (typeof window === "undefined") return;
  if (!isDevlogArmed()) return;
  installed = true;

  hookConsole();
  hookWindowErrors();
  hookApiClient();
  hookSessionLog();
  hookSrsSync();
  hookReconcile();

  window.addEventListener("pagehide", flushOnHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnHide();
  });

  enqueue("console", { level: "info", msg: `[remoteConsole] installed device=${getDeviceId()} href=${window.location.href}` });
}

// ── Test-only seams ──────────────────────────────────────────────────────

/** Vitest-only: reset all module state between tests. Not used in
 *  production code. Also clears the observers registered on the other
 *  three modules — a test that installs and then resets must not leave a
 *  live observer pointed at a torn-down queue. */
export function __resetRemoteConsoleForTests(): void {
  installed = false;
  queue = [];
  if (flushTimer != null) clearTimeout(flushTimer);
  flushTimer = null;
  seq = 0;
  cachedDeviceId = "";
  lastSessionLogLen = 0;
  sessionLogUnsubscribe?.();
  sessionLogUnsubscribe = null;
  setApiRequestObserver(null);
  setSrsSyncObserver(null);
  setReconcileObserver(null);
  try {
    localStorage.removeItem(DEVICE_ID_KEY);
  } catch {
    /* ignore */
  }
}

/** Vitest-only: current pending (unflushed) queue snapshot. */
export function __getPendingDevlogQueueForTests(): readonly DevLogRecord[] {
  return queue;
}

/** Vitest-only: force an immediate flush (bypasses the 500ms timer). */
export function __flushDevlogForTests(): void {
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flush();
}
