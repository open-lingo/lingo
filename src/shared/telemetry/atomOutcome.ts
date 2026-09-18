/**
 * Per-word difficulty stats (T7, lane STATS, 2026-09-18).
 *
 * Spencer, 2026-09-18: "how often do people fail X word, how easy are
 * others… more statistical data tracking here is future scope but answers
 * this better than we can." One `AtomOutcomeEvent` = one graded step. No
 * free text, no answer strings — only ids, counts, and timings (privacy +
 * size), same discipline `errorReporter.ts`'s breadcrumbs already follow.
 *
 * Transport-agnostic by design, mirroring `features/lesson/engine/
 * lessonSync.ts`: this module only buffers and batches; the actual
 * authenticated POST is injected by the caller (see
 * `useAtomOutcomeSync.ts`, which gets `telemetryOutcomes` from `useApi()`
 * and wires it in). That split is why this file has no import of
 * `ApiClient`/`useApi` at all — it stays testable with a fake `send`.
 *
 * OFF BY DEFAULT (build 32): every entry point below no-ops unless
 * `feature-flags.json`'s `telemetry.atomOutcomes` is true, read via
 * `getCachedFeatureFlags()` — the same synchronous, non-React read
 * `mockLessons.ts`'s pad pass already relies on (see that function's own
 * docstring for why a synchronous read is necessary here: this fires from
 * a plain callback, not a component that can `useContext`).
 */

import { getCachedFeatureFlags } from "@/shared/config/featureFlags";

/** One graded step. Wire-shape-identical to `AtomOutcomeWireItem`
 *  (`shared/api/telemetryOutcomes.ts`) and `lingo-core`'s `AtomOutcomeItem`
 *  — kept as a separate type here (rather than importing the wire type)
 *  so this module has zero dependency on the API layer. */
export interface AtomOutcomeEvent {
  lang: string;
  lessonId: string;
  stepIndex: number;
  stepType: string;
  /** Vocab/grammar/kana atom ids this step exercised — never the answer text. */
  atomIds: string[];
  correct: boolean;
  /** Wall-clock ms from step shown to graded. */
  msToAnswer: number;
  /** 1 = first try, 2+ = retry on the same step. */
  attempt: number;
  srcSurface: "lesson" | "review" | "flashcards" | "test_out";
  buildNumber?: string;
}

export interface SendAtomOutcomesResult {
  ok: boolean;
  /** 0 = never reached a server (network error / offline / threw). */
  status: number;
}

export type SendAtomOutcomesFn = (
  items: AtomOutcomeEvent[],
  opts?: { keepalive?: boolean },
) => Promise<SendAtomOutcomesResult>;

/** Batch trigger: flush as soon as the buffer reaches this size. Matches
 *  the server's per-request accepted count in the common case (well under
 *  its own 200-event/request hard cap — see `lingo-core/app/telemetry/
 *  router.py::MAX_OUTCOME_EVENTS_PER_REQUEST`), so a normal flush is one
 *  request, not several. */
export const MAX_BATCH_EVENTS = 50;

/** Time trigger: flush this long after the FIRST still-unflushed event was
 *  buffered, even if the batch never fills (e.g. a short lesson). */
export const FLUSH_INTERVAL_MS = 30_000;

/** Safety ceiling on total buffered (never-sent) events. Not expected to be
 *  hit in practice — 50-event batches flush well before this — but a
 *  stuck network shouldn't let the in-memory queue grow unbounded for the
 *  rest of a long session. Oldest events are dropped first (least useful
 *  for "which word is hard right now" anyway). */
const MAX_QUEUED_EVENTS = 500;

const BACKOFF_BASE_MS = 4_000;
const BACKOFF_MAX_MS = 5 * 60_000;

let queue: AtomOutcomeEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let backoffAttempts = 0;
let backoffUntil = 0;

function flagEnabled(): boolean {
  try {
    return getCachedFeatureFlags().telemetry.atomOutcomes === true;
  } catch {
    return false;
  }
}

/**
 * Buffer one graded step. No-ops entirely (never queues, never schedules a
 * timer, never touches state) when the flag is off — the "flag off = zero
 * requests" contract starts here, not just at flush time.
 */
export function recordAtomOutcome(event: AtomOutcomeEvent): void {
  try {
    if (!flagEnabled()) return;
    queue.push(event);
    if (queue.length > MAX_QUEUED_EVENTS) {
      queue = queue.slice(queue.length - MAX_QUEUED_EVENTS);
    }
    if (queue.length >= MAX_BATCH_EVENTS) {
      clearScheduledFlush();
      // Caller-driven send happens via `flushAtomOutcomes` — scheduling a
      // microtask-deferred call here keeps `recordAtomOutcome` itself
      // synchronous and never-throwing, same contract as `recordStepEvent`.
      void Promise.resolve().then(() => {
        void _pendingSend?.(false);
      });
      return;
    }
    scheduleFlush();
  } catch {
    // Never throw out of telemetry.
  }
}

function scheduleFlush(): void {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void _pendingSend?.(false);
  }, FLUSH_INTERVAL_MS);
}

function clearScheduledFlush(): void {
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function isBackingOff(): boolean {
  return Date.now() < backoffUntil;
}

function applyBackoff(): void {
  backoffAttempts += 1;
  backoffUntil = Date.now() + Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** (backoffAttempts - 1));
}

function resetBackoff(): void {
  backoffAttempts = 0;
  backoffUntil = 0;
}

/** The `send` function most recently handed to `flushAtomOutcomes`, reused
 *  by the timer/batch-size triggers above so `useAtomOutcomeSync.ts` only
 *  has to register it once (on mount) rather than pass it through every
 *  `recordAtomOutcome` call site. */
let _pendingSend: ((keepalive: boolean) => Promise<void>) | null = null;

/** Register the authenticated transport. Call once, e.g. from
 *  `useAtomOutcomeSync()`'s effect. Idempotent — a later call just
 *  replaces the sender (e.g. a fresh `ApiClient` after Auth0 token
 *  rotation), never accumulates listeners. */
export function registerAtomOutcomeSender(send: SendAtomOutcomesFn): void {
  _pendingSend = (keepalive: boolean) => doFlush(send, keepalive);
  // Catch anything buffered before a sender existed (e.g. events recorded
  // in the instant between mount and this effect running).
  if (queue.length > 0) void _pendingSend(false);
}

export function unregisterAtomOutcomeSender(): void {
  _pendingSend = null;
}

/** Guards against overlapping `doFlush` calls — several triggers
 *  (size, timer, lesson-end, background, a fresh `registerAtomOutcomeSender`
 *  catching a backlog) can fire in close succession, and without this a
 *  second call could start slicing `queue` while the first is still
 *  awaiting a `send`, double-sending events that were already in flight. */
let flushInFlight = false;

/**
 * Send everything currently queued, in `MAX_BATCH_EVENTS`-sized chunks.
 * Stops at the first failing chunk (keeps it and everything after it
 * queued) so ordering is preserved and one bad chunk doesn't get retried
 * out of order — same policy as `errorReporter.ts::flushPending`.
 */
async function doFlush(send: SendAtomOutcomesFn, keepalive: boolean): Promise<void> {
  if (queue.length === 0) return;
  if (!keepalive && isBackingOff()) return;
  if (flushInFlight) return;
  flushInFlight = true;
  try {
    await doFlushInner(send, keepalive);
  } finally {
    flushInFlight = false;
  }
}

async function doFlushInner(send: SendAtomOutcomesFn, keepalive: boolean): Promise<void> {
  let sentThrough = 0;
  for (let i = 0; i < queue.length; i += MAX_BATCH_EVENTS) {
    const chunk = queue.slice(i, i + MAX_BATCH_EVENTS);
    let result: SendAtomOutcomesResult;
    try {
      result = await send(chunk, { keepalive });
    } catch {
      result = { ok: false, status: 0 };
    }
    if (result.ok) {
      resetBackoff();
      sentThrough = i + chunk.length;
      continue;
    }
    if (keepalive) {
      // Unload path: no retry loop possible (the page may already be
      // gone). Drop this chunk and keep going through the rest so one
      // failure doesn't strand everything queued forever.
      sentThrough = i + chunk.length;
      continue;
    }
    if (result.status === 0 || result.status >= 500 || result.status === 429) {
      applyBackoff();
      break;
    }
    // Non-retryable 4xx (e.g. a malformed item past client-side caps) —
    // this chunk can never succeed; drop it, keep going.
    sentThrough = i + chunk.length;
  }
  if (sentThrough > 0) {
    queue = queue.slice(sentThrough);
  }
  if (queue.length > 0) {
    scheduleFlush();
  } else {
    clearScheduledFlush();
  }
}

/**
 * Explicit flush — lesson end, or the background/pagehide hook in
 * `useAtomOutcomeSync.ts`. A no-op if no sender is registered (flag off,
 * or called before the hook mounts) or the queue is empty.
 */
export async function flushAtomOutcomes(opts: { keepalive?: boolean } = {}): Promise<void> {
  if (!_pendingSend) return;
  await _pendingSend(opts.keepalive === true);
}

/** How many events are buffered right now. Test/diagnostic use only. */
export function getQueuedAtomOutcomeCount(): number {
  return queue.length;
}

/** Vitest-only: reset all module state between tests. */
export function __resetAtomOutcomeStateForTest(): void {
  queue = [];
  clearScheduledFlush();
  backoffAttempts = 0;
  backoffUntil = 0;
  _pendingSend = null;
  flushInFlight = false;
}
