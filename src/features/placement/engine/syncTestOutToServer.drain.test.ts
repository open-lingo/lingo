/**
 * b19 evidence (2026-09-15): the iPad ran a module test-out ("Give & receive
 * I", 12 items) and the server saw ZERO batch POSTs afterwards. Two
 * explanations were open — the run did not PASS (in which case posting
 * nothing is correct), or the done-stage effect in `PlacementTestPage.tsx`
 * never fired. These tests pin the engine half of that fork so the next
 * report can be read off the server logs instead of guessed at:
 *
 *   PASSED  ⇒ ids are POSTed (as ONE bulk-complete op, 2026-09-18) inside
 *             the same call, not on the next 30s tick
 *   FAILED  ⇒ no POST at all, and nothing left queued to post later
 *   OFFLINE ⇒ the op survives an instantly-dismissed result screen and goes
 *             up from the ordinary hydrate/sync path
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { syncTestOutToServer } from "./syncTestOutToServer";
import {
  getTestOutQueueCount,
  resetBulkQueueForTests,
} from "@/shared/domain/testOutSyncQueue";
import {
  resetLessonSyncCoalescerForTests,
  syncLessonProgressWithServer,
} from "@/features/lesson/engine/progressSync";
import type { BulkCompleteResponse, BulkCompleteSubmission, ProgressApi } from "@/shared/api/progress";

function acceptAll(payload: BulkCompleteSubmission): Promise<BulkCompleteResponse> {
  return Promise.resolve({
    accepted: payload.lessonIds.length,
    alreadyComplete: 0,
    total: payload.lessonIds.length,
  });
}

describe("module test-out → server, immediately", () => {
  beforeEach(() => {
    localStorage.clear();
    resetBulkQueueForTests();
    resetLessonSyncCoalescerForTests();
  });

  it("a PASSED test-out drains inside the call, not on the next tick", async () => {
    const bulkComplete = vi.fn(acceptAll);
    const progress = { bulkComplete } as unknown as ProgressApi;

    const res = await syncTestOutToServer(progress, ["m10"], "ko", ["m3", "m4"]);

    // POSTed by the time the promise settles — no timer involved.
    expect(bulkComplete).toHaveBeenCalled();
    expect(res.submitted).toBeGreaterThan(0);
    expect(res.pending).toBe(0);
    expect(getTestOutQueueCount()).toBe(0);
  });

  it("a FAILED test-out posts nothing and queues nothing", async () => {
    const bulkComplete = vi.fn(acceptAll);
    const progress = { bulkComplete } as unknown as ProgressApi;

    // Failing the module means no passed and no assumed modules reach here.
    const res = await syncTestOutToServer(progress, [], "ko", []);

    expect(bulkComplete).not.toHaveBeenCalled();
    expect(res).toEqual({ submitted: 0, pending: 0 });
    expect(getTestOutQueueCount()).toBe(0);
  });

  it("survives an instantly-dismissed result screen: the hydrate path drains it", async () => {
    // The POST fails (offline / 5xx) while the user taps straight past the
    // result screen — the op must still be on the device.
    const failing = vi.fn(() => Promise.reject(new Error("offline")));
    const progress = { bulkComplete: failing } as unknown as ProgressApi;
    await syncTestOutToServer(progress, ["m3"], "ko", []);
    const queued = getTestOutQueueCount();
    expect(queued).toBeGreaterThan(0);

    // Next ordinary sync — boot hydrate, 30s tick or "Sync now", all of
    // which go through this one choke point.
    const batch = vi.fn();
    const bulkComplete = vi.fn(acceptAll);
    const out = await syncLessonProgressWithServer({
      batch,
      bulkComplete,
      getMe: () => Promise.resolve(null),
    });
    expect(out.testOutPushed).toBe(queued);
    expect(getTestOutQueueCount()).toBe(0);
  });
});
