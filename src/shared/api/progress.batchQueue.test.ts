/**
 * Sync-stuck investigation (2026-09-18, docs/handoff-2026-09-18-resume.md §6
 * / docs/progress-sync-contract-2026-09-17.md). Root cause: `batchAttempts`
 * always posts with `tag: "progress:batch"`, and `ApiClient`'s tag dedup
 * ABORTS the previous in-flight request when a new one with the same tag
 * starts (`shared/api/client.ts` `_request`: `this._inflight.get(tag)?.abort()`).
 *
 * `LessonProgressHydrate` fires (at least) two independent, uncoordinated
 * callers of `batchAttempts` around the same moment at boot — its own
 * `syncLessonProgressWithServer` push and `useProgressReconcile`'s
 * local→server catch-up — so one call's rows are silently killed by the
 * other's. This is the identical failure shape SRS already hit and fixed
 * with `enqueueSyncOp` ("two net::ERR_ABORTED, zero server writes" on a
 * 394-card payload, `features/flashcards/engine/srsSync.ts`); `progress:batch`
 * had no equivalent queue. This test pins the fix the same way
 * `srsSync.test.ts`'s "enqueueSyncOp serialization" describe block does:
 * prove at most one POST is ever in flight, whichever callers race.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgressApi } from "./progress";
import type { BatchAttempt } from "./progress";

function api(): ProgressApi {
  return new ProgressApi({
    baseUrl: "https://api.test",
    getAccessToken: () => Promise.resolve("token"),
    maxRetries: 0,
  });
}

function attempt(id: string): BatchAttempt {
  return {
    clientAttemptId: id,
    lessonId: id,
    attemptedAt: "2026-09-18T00:00:00.000Z",
    durationSec: 5,
    passed: true,
    score: 1,
    stepResults: [],
    isTestOut: true,
  };
}

describe("ProgressApi.batchAttempts — concurrent callers must queue, not race", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("two concurrent batchAttempts calls never overlap on the wire, and both land", async () => {
    let active = 0;
    let maxActive = 0;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      active++;
      maxActive = Math.max(maxActive, active);
      // Yield a macrotask so a second call issued "at the same time" (no
      // await between the two `batchAttempts()` calls below) has a real
      // chance to start before this one resolves — matching the boot-time
      // shape (two effects both gated on the same isProgressReady signal).
      await new Promise((r) => setTimeout(r, 15));
      active--;
      const body = JSON.parse(init.body as string) as { attempts: BatchAttempt[] };
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
          results: body.attempts.map((a) => ({
            clientAttemptId: a.clientAttemptId,
            attemptId: `srv-${a.clientAttemptId}`,
            accepted: true,
            xpEarned: 0,
            streakAfter: 0,
            lingotsEarned: 0,
            dailyTotalLessons: 0,
          })),
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const progress = api();
    // No `await` between these two — this is exactly what LessonProgressHydrate
    // does: its boot-push effect and useProgressReconcile's effect both fire
    // once `isProgressReady` flips, with no coordination between them.
    const p1 = progress.batchAttempts({ attempts: [attempt("a1")] });
    const p2 = progress.batchAttempts({ attempts: [attempt("b1")] });
    const [r1, r2] = await Promise.all([p1, p2]);

    // The regression: without serialization this is 2 (both POSTs in flight
    // at once), and the ApiClient's tag-abort kills whichever started first —
    // its rows never reach the server.
    expect(maxActive).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(r1.results.map((r) => r.clientAttemptId)).toEqual(["a1"]);
    expect(r2.results.map((r) => r.clientAttemptId)).toEqual(["b1"]);
  });

  it("a failing batch does not wedge the queue for the next caller", async () => {
    let call = 0;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      call++;
      if (call === 1) {
        throw new Error("boom");
      }
      const body = JSON.parse(init.body as string) as { attempts: BatchAttempt[] };
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
          results: body.attempts.map((a) => ({
            clientAttemptId: a.clientAttemptId,
            attemptId: `srv-${a.clientAttemptId}`,
            accepted: true,
            xpEarned: 0,
            streakAfter: 0,
            lingotsEarned: 0,
            dailyTotalLessons: 0,
          })),
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const progress = api();
    const p1 = progress.batchAttempts({ attempts: [attempt("fail1")] });
    const p2 = progress.batchAttempts({ attempts: [attempt("ok1")] });

    await expect(p1).rejects.toThrow();
    const r2 = await p2;
    expect(r2.results.map((r) => r.clientAttemptId)).toEqual(["ok1"]);
  });
});
