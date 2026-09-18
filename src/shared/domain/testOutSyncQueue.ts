/**
 * Durable retry queue for synthesised test-out completions.
 *
 * Why this exists (TestFlight b18 #144 / #145, 2026-09-15). A module
 * test-out marks up to 490 JA lessons complete in local `mockProgress`, then
 * mirrored them to the server with ONE fire-and-forget POST. Two server
 * constraints threw the whole thing away — a >100-row body is a flat 422
 * (`schemas.py:100`) and a row under the duration floor is rejected
 * individually (`router.py:363`) — and because the client neither chunked,
 * inspected the per-attempt results, nor persisted anything, the founder's
 * completions existed on exactly one device forever. `console.warn` was the
 * only trace.
 *
 * So: the rows are written to localStorage FIRST (they survive the app being
 * killed, an offline flight, a 422 we didn't anticipate), drained in
 * server-legal chunks, and removed only for the ids the server actually
 * confirmed. The normal lesson-attempt buffer (`lesson/engine/lessonStorage`)
 * has had exactly this shape since the start; test-out was the one write path
 * without it.
 *
 * Deliberately kept free of course/curriculum imports so the periodic sync in
 * `LessonProgressHydrate` can drain it without pulling a language bundle.
 */

import {
  MAX_ATTEMPTS_PER_BATCH,
  SERVER_DURATION_CEILING_SEC,
  SERVER_DURATION_FLOOR_SEC,
  type BatchAttempt,
  type BatchAttemptResponse,
  type BatchAttemptSubmission,
} from "@/shared/api/progress";
import { getActiveUserStorageId } from "@/features/settings/storage";
import { logSessionEvent } from "@/shared/telemetry/sessionLog";
import { getLastRequestId, reportError } from "@/shared/telemetry/errorReporter";

const STORAGE_PREFIX = "open-lingo-testout-sync-queue:v1:";

/**
 * Ceiling on stored rows. A full JA course test-out is ~490; a learner who
 * tests out of several languages while offline could stack a few of those.
 * Past the cap the OLDEST rows go — a newer test-out reflects the more
 * recent intent, and the older one's lessons are already complete locally.
 */
const MAX_QUEUED = 2000;

function storageKey(): string {
  return `${STORAGE_PREFIX}${getActiveUserStorageId()}`;
}

function read(): BatchAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is BatchAttempt =>
        Boolean(a) &&
        typeof (a as BatchAttempt).clientAttemptId === "string" &&
        typeof (a as BatchAttempt).lessonId === "string",
    );
  } catch {
    return [];
  }
}

function write(rows: BatchAttempt[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (rows.length === 0) localStorage.removeItem(storageKey());
    else localStorage.setItem(storageKey(), JSON.stringify(rows));
    return true;
  } catch {
    // Quota. The caller falls back to POSTing without the durability net.
    return false;
  }
}

/**
 * Make a row satisfy the server's per-attempt validators. Applied on the way
 * out rather than only at build time so rows queued by an older build (or a
 * future caller that forgets) still land instead of silently 422/rejecting.
 */
export function toServerLegalAttempt(attempt: BatchAttempt): BatchAttempt {
  const floor = Math.max(
    SERVER_DURATION_FLOOR_SEC,
    attempt.stepResults?.length ?? 0,
  );
  const durationSec = Math.min(
    SERVER_DURATION_CEILING_SEC,
    Math.max(floor, Math.floor(attempt.durationSec || 0)),
  );
  return durationSec === attempt.durationSec
    ? attempt
    : { ...attempt, durationSec };
}

/** Split into POST-sized groups. The server rejects a whole oversized body. */
export function chunkAttempts(
  attempts: BatchAttempt[],
  size: number = MAX_ATTEMPTS_PER_BATCH,
): BatchAttempt[][] {
  const out: BatchAttempt[][] = [];
  for (let i = 0; i < attempts.length; i += size) {
    out.push(attempts.slice(i, i + size));
  }
  return out;
}

/** Persist rows for retry. Returns false when storage refused them. */
export function enqueueTestOutAttempts(attempts: BatchAttempt[]): boolean {
  if (attempts.length === 0) return true;
  const existing = read();
  const byId = new Map(existing.map((a) => [a.clientAttemptId, a]));
  for (const a of attempts) byId.set(a.clientAttemptId, a);
  let rows = [...byId.values()];
  if (rows.length > MAX_QUEUED) rows = rows.slice(rows.length - MAX_QUEUED);
  return write(rows);
}

export function getQueuedTestOutAttempts(): BatchAttempt[] {
  return read();
}

export function getTestOutQueueCount(): number {
  return read().length;
}

export function removeQueuedTestOutAttempts(clientAttemptIds: string[]): void {
  if (clientAttemptIds.length === 0) return;
  const drop = new Set(clientAttemptIds);
  write(read().filter((a) => !drop.has(a.clientAttemptId)));
}

export function clearTestOutSyncQueue(): void {
  write([]);
}

export type BatchFn = (
  payload: BatchAttemptSubmission,
) => Promise<BatchAttemptResponse>;

// ── Diagnostics (2026-09-18, SYNC2 lane) ──────────────────────────────────
//
// Before this, a failed drain's ONLY trace was a `console.warn` — which is
// exactly why Spencer's phone showed "491 pending" for days while the
// server access log showed no large batch and no error at all: the failure
// never left the device. This module now tracks the shape of its last
// attempt (regardless of outcome) so the Sync panel's diagnostics payload
// can show it, and reports a chunk failure through `errorReporter` (with a
// `sessionLog.ts` breadcrumb) so it also reaches CloudWatch.

export interface DrainErrorInfo {
  name: string;
  message: string;
  status?: number;
  requestId?: string;
  at: string;
}

export interface TestOutQueueDiagnostics {
  /** Rows currently queued, unconfirmed. Same number as `getTestOutQueueCount()`. */
  pendingCount: number;
  /** Size of the last chunk attempted (success or failure), or null before
   *  any attempt this session. */
  lastChunkSize: number | null;
  lastAttemptAt: string | null;
  /** Timestamp of the last chunk that resolved WITHOUT throwing — a 4xx
   *  per-row rejection still counts as "attempted successfully" here; this
   *  tracks transport health, not acceptance. */
  lastSuccessAt: string | null;
  /** Null once a later attempt succeeds — this is "the last failure", not
   *  a sticky red flag. */
  lastError: DrainErrorInfo | null;
}

let lastChunkSize: number | null = null;
let lastAttemptAt: string | null = null;
let lastSuccessAt: string | null = null;
let lastError: DrainErrorInfo | null = null;

function describeError(err: unknown): DrainErrorInfo {
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: unknown }).status) || undefined
      : undefined;
  const name = err instanceof Error ? err.name : "UnknownError";
  const rawMessage = err instanceof Error ? err.message : String(err);
  return {
    name,
    message: rawMessage.slice(0, 300),
    status,
    requestId: getLastRequestId(),
    at: new Date().toISOString(),
  };
}

export function getTestOutQueueDiagnostics(): TestOutQueueDiagnostics {
  return {
    pendingCount: getTestOutQueueCount(),
    lastChunkSize,
    lastAttemptAt,
    lastSuccessAt,
    lastError,
  };
}

/** Test seam — module-level diagnostics state is per-file in vitest. */
export function resetTestOutQueueDiagnosticsForTests(): void {
  lastChunkSize = null;
  lastAttemptAt = null;
  lastSuccessAt = null;
  lastError = null;
}

/**
 * POST `attempts` in server-legal chunks. Returns the ids the server
 * confirmed. Stops at the first transport failure so a flaky connection
 * doesn't burn through the whole queue; whatever is left stays queued.
 */
export async function postAttemptChunks(
  batch: BatchFn,
  attempts: BatchAttempt[],
): Promise<{ acceptedIds: string[]; failed: boolean }> {
  const acceptedIds: string[] = [];
  for (const chunk of chunkAttempts(attempts.map(toServerLegalAttempt))) {
    lastChunkSize = chunk.length;
    lastAttemptAt = new Date().toISOString();
    let response: BatchAttemptResponse;
    try {
      response = await batch({ attempts: chunk });
    } catch (err) {
      lastError = describeError(err);
      // Fold into the ordinary breadcrumb trail FIRST so `reportError`'s
      // auto-attached breadcrumbs (the last <=20 sessionLog events) carry
      // this exact failure — chunk size, queue depth, error name — not just
      // a stack trace with no context. Logged unconditionally (not gated on
      // a dev arm), so it also shows up in a plain "Send diagnostics".
      logSessionEvent("sync_event", {
        source: "test-out-queue-drain",
        status: "chunk-failed",
        chunkSize: chunk.length,
        queueLen: attempts.length,
        errorName: lastError.name,
      });
      reportError(err, { source: "test-out-sync-queue" });
      // eslint-disable-next-line no-console
      console.warn("[test-out] batch chunk failed, rows stay queued", err);
      return { acceptedIds, failed: true };
    }
    lastSuccessAt = lastAttemptAt;
    lastError = null;
    // An empty `results` means "not stored" — the 404/501 shim in
    // `ProgressApi.batchAttempts` returns exactly that, and so would any
    // future server that accepts the body but persists nothing. Keeping
    // those rows queued is the whole point of this module.
    for (const r of response?.results ?? []) {
      if (r.accepted || r.attemptId) acceptedIds.push(r.clientAttemptId);
    }
  }
  return { acceptedIds, failed: false };
}

/**
 * Flush everything queued. Safe to call on every sync tick: the server is
 * idempotent on `clientAttemptId` (`router.py:320`), so a row that did land
 * but whose response we lost returns `accepted: true` again and clears.
 */
export async function drainTestOutSyncQueue(batch: BatchFn): Promise<number> {
  const queued = read();
  if (queued.length === 0) return 0;
  const { acceptedIds } = await postAttemptChunks(batch, queued);
  removeQueuedTestOutAttempts(acceptedIds);
  return acceptedIds.length;
}
