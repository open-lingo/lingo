/**
 * `POST /api/core/v1/telemetry/outcomes` — per-word difficulty stats (T7).
 *
 * Deliberately a SEPARATE file from `./telemetry.ts` (the /errors and
 * /diagnostics transport), not an addition to it: those two endpoints are
 * unauthenticated by construction (errors happen before login too — see
 * that file's docstring) and hand-roll `fetch`/`sendBeacon` for that
 * reason. `/telemetry/outcomes` is the opposite case — it only ever fires
 * mid-lesson, well after login, and the server hashes the caller's `sub`
 * into the log line (`AtomOutcomeItem`'s docstring, `lingo-core`), so it
 * MUST be authenticated. That means this client belongs on the same
 * `ApiClient` every other authed service module uses (token injection,
 * retries, `X-Lingo-Platform`, impersonation headers), constructed in
 * `provider.tsx` exactly like `SrsApi`/`ProgressApi`/etc.
 *
 * The batching/queueing policy (≤50 events or 30s, flush on lesson end /
 * background) lives in `../telemetry/atomOutcome.ts`, which stays
 * transport-agnostic and calls this class's `sendBatch` the same way
 * `lessonSync.ts` stays transport-agnostic and is driven by
 * `useLessonSyncSession.ts` calling `progress.batchAttempts`.
 */

import { ApiClient } from "./client";

const OUTCOMES_PATH = "/api/core/v1/telemetry/outcomes";

/** Wire-shape-identical to `lingo-core`'s `AtomOutcomeItem`
 *  (`app/telemetry/schemas.py`). */
export interface AtomOutcomeWireItem {
  lang: string;
  lessonId: string;
  stepIndex: number;
  stepType: string;
  atomIds: string[];
  correct: boolean;
  msToAnswer: number;
  attempt: number;
  srcSurface: string;
  buildNumber?: string;
}

export interface AtomOutcomeAcceptedResponse {
  accepted: number;
}

export class TelemetryOutcomesApi extends ApiClient {
  /**
   * Send one batch. `keepalive` lets the request outlive a background/close
   * mid-flight (same rationale as `client.ts`'s `RequestOptions.keepalive`
   * — see its docstring) — used for the background-flush path, not the
   * lesson-end path (page is still alive there, no need to risk the 64 KB
   * combined keepalive-body cap for no reason).
   */
  sendBatch(items: AtomOutcomeWireItem[], opts?: { keepalive?: boolean }): Promise<AtomOutcomeAcceptedResponse> {
    return this.post<AtomOutcomeAcceptedResponse>(OUTCOMES_PATH, { items }, { keepalive: opts?.keepalive });
  }
}
