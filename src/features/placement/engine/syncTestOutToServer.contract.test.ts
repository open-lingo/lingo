/**
 * Server-contract regression tests for the test-out → server sync
 * (TestFlight b18 #144/#145: "I have progress up to module 31 but it marks
 * these incomplete", "is it not sending the progress externally?"; and the
 * 2026-09-18 SYNC2 lane: a 491-row queue from this era stuck on a phone for
 * weeks because the per-row shape made a whole test-out as failure-prone as
 * its most fragile row).
 *
 * The batch (`lessons/batch`) contract this file used to pin — the 100-row
 * cap (`app/progress/schemas.py:100`) and the per-row duration floor
 * (`app/progress/router.py:363-377`) — no longer applies to test-out at
 * all: `POST /progress/lessons/bulk-complete` takes ids only (no duration,
 * no step results), capped at 1000 ids per request server-side, and is what
 * this file now pins.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BulkCompleteResponse, BulkCompleteSubmission, ProgressApi } from "@/shared/api/progress";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  clearTestOutSyncQueue,
  getQueuedBulkOps,
  resetBulkQueueForTests,
} from "@/shared/domain/testOutSyncQueue";
import { buildTestOutLessonIds, syncTestOutToServer } from "./syncTestOutToServer";

/** Spencer's case: tested out of m32 ⇒ m1–m31 credited as assumed. */
function jaModulesThrough(lastModuleId: string): {
  passed: string[];
  assumed: string[];
} {
  const ids = getMockCourse("ja").modules.map((m) => m.id);
  const cut = ids.indexOf(lastModuleId);
  return { passed: [lastModuleId], assumed: ids.slice(0, cut) };
}

function acceptAll(payload: BulkCompleteSubmission): Promise<BulkCompleteResponse> {
  return Promise.resolve({
    accepted: payload.lessonIds.length,
    alreadyComplete: 0,
    total: payload.lessonIds.length,
  });
}

describe("test-out sync respects the lingo-core bulk-complete contract", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTestOutSyncQueue();
    resetBulkQueueForTests();
  });

  it("sends a full-course test-out as ONE bulk-complete request, not chunked", async () => {
    const { passed, assumed } = jaModulesThrough("m32");
    const seen: BulkCompleteSubmission[] = [];
    const bulkComplete = vi.fn(async (payload: BulkCompleteSubmission) => {
      seen.push(payload);
      return acceptAll(payload);
    });
    const progress = { bulkComplete } as unknown as ProgressApi;

    const total = buildTestOutLessonIds([...passed, ...assumed], "ja").length;
    // Guard the premise: this really would have been a multi-chunk payload
    // under the old batch contract, so the test can't pass vacuously if the
    // JA course ever shrinks.
    expect(total).toBeGreaterThan(100);

    const res = await syncTestOutToServer(progress, passed, "ja", assumed);

    expect(seen).toHaveLength(1);
    expect(seen[0].lessonIds).toHaveLength(total);
    expect(seen[0].lang).toBe("ja");
    expect(seen[0].source).toBe("test_out");
    expect(res.submitted).toBe(total);
    expect(res.pending).toBe(0);
    expect(getQueuedBulkOps()).toHaveLength(0);
  });

  it("keeps the op queued whole when the request fails transport — no partial loss", async () => {
    const { passed, assumed } = jaModulesThrough("m32");
    const bulkComplete = vi.fn(async () => {
      throw new Error("network down");
    });
    const progress = { bulkComplete } as unknown as ProgressApi;

    const total = buildTestOutLessonIds([...passed, ...assumed], "ja").length;
    const res = await syncTestOutToServer(progress, passed, "ja", assumed);

    expect(res.submitted).toBe(0);
    expect(res.pending).toBe(total);
    const ops = getQueuedBulkOps();
    expect(ops).toHaveLength(1);
    expect(ops[0].lessonIds).toHaveLength(total);
  });

  it("survives an app kill: the queue outlives the failed sync and drains later", async () => {
    const { passed, assumed } = jaModulesThrough("m5");
    const failing = {
      bulkComplete: vi.fn(async () => {
        throw new Error("offline");
      }),
    } as unknown as ProgressApi;

    const first = await syncTestOutToServer(failing, passed, "ja", assumed);
    expect(first.submitted).toBe(0);
    expect(first.pending).toBeGreaterThan(0);

    // Simulate a relaunch: nothing in memory, only localStorage.
    const queued = getQueuedBulkOps();
    expect(queued).toHaveLength(1);
    expect(queued[0].source).toBe("test_out");

    const { drainBulkQueue } = await import("@/shared/domain/testOutSyncQueue");
    const good = vi.fn(acceptAll);
    const drained = await drainBulkQueue(good);
    expect(drained.accepted).toBe(first.pending);
    expect(getQueuedBulkOps()).toHaveLength(0);
  });

  it("keeps an op queued whole when the server only partially accepted it (per-id failure isolation, server-side)", async () => {
    const bulkComplete = vi.fn(async (payload: BulkCompleteSubmission) => ({
      accepted: payload.lessonIds.length - 1,
      alreadyComplete: 0,
      total: payload.lessonIds.length,
    }));
    const progress = { bulkComplete } as unknown as ProgressApi;

    const res = await syncTestOutToServer(progress, ["m3"], "ja", []);
    expect(res.pending).toBeGreaterThan(0);
    expect(getQueuedBulkOps()).toHaveLength(1);
  });
});
