import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildTestOutLessonIds, syncTestOutToServer } from "./syncTestOutToServer";
import type { BulkCompleteResponse, BulkCompleteSubmission, ProgressApi } from "@/shared/api/progress";
import { clearTestOutSyncQueue, resetBulkQueueForTests } from "@/shared/domain/testOutSyncQueue";
import { clearSessionLog, getSessionLog } from "@/shared/telemetry/sessionLog";

/** Server answers every id accepted. */
function acceptAll(payload: BulkCompleteSubmission): Promise<BulkCompleteResponse> {
  return Promise.resolve({
    accepted: payload.lessonIds.length,
    alreadyComplete: 0,
    total: payload.lessonIds.length,
  });
}

describe("buildTestOutLessonIds", () => {
  it("returns empty when no modules passed", () => {
    expect(buildTestOutLessonIds([])).toEqual([]);
  });

  it("returns one id per lesson in passed modules", () => {
    const ids = buildTestOutLessonIds(["m3"]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id).toBeTruthy();
  });

  it("ids are unique across modules", () => {
    const ids = buildTestOutLessonIds(["m3", "m4"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds ids against the requested course (KO → ko-* lesson ids)", () => {
    const ids = buildTestOutLessonIds(["m3"], "ko");
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      // Story capstones carry the `story:` namespace prefix (see
      // `storyNodeId`) — they are still KO course rows, and testing out has
      // to credit them or the module would stay incomplete.
      expect(id).toMatch(/^(story:)?ko-/);
    }
  });
});

describe("syncTestOutToServer", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTestOutSyncQueue();
    resetBulkQueueForTests();
    clearSessionLog();
  });

  function pushEvents() {
    return getSessionLog().filter(
      (e) => e.type === "sync_event" && e.payload.source === "test_out_push",
    );
  }

  // 2026-09-18 — the coordinator's exact ask: find (and make VISIBLE) the
  // branch that returns before the network is ever touched. This is it —
  // a caller-supplied `passedModules`/`assumedModules` set that doesn't
  // synthesize any ids (empty, or ids that don't match any course module)
  // returns here with ZERO network calls and, pre-this-lane, zero trace.
  it("logs test_out_push with reason 'no-attempts' on the empty-synthesis early return, before any POST", async () => {
    const bulkComplete = vi.fn(acceptAll);
    const progress = { bulkComplete } as unknown as ProgressApi;

    const res = await syncTestOutToServer(progress, [], "ja");

    expect(bulkComplete).not.toHaveBeenCalled();
    expect(res).toEqual({ submitted: 0, pending: 0 });
    const events = pushEvents();
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({
      source: "test_out_push",
      languageId: "ja",
      outcome: "no-attempts",
      attemptCount: 0,
    });
  });

  it("logs test_out_push ok with submitted counts on a successful drain", async () => {
    const bulkComplete = vi.fn(acceptAll);
    const progress = { bulkComplete } as unknown as ProgressApi;

    await syncTestOutToServer(progress, ["m3"], "ja");

    const events = pushEvents();
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({ source: "test_out_push", languageId: "ja", outcome: "ok" });
    expect((events[0].payload as { attemptCount: number }).attemptCount).toBeGreaterThan(0);
    expect((events[0].payload as { submitted: number }).submitted).toBe(
      (events[0].payload as { attemptCount: number }).attemptCount,
    );
  });

  it("logs test_out_push err with the failure's name when the op fails transport", async () => {
    const bulkComplete = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const progress = { bulkComplete } as unknown as ProgressApi;

    await syncTestOutToServer(progress, ["m3"], "ja");

    const events = pushEvents();
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({
      source: "test_out_push",
      languageId: "ja",
      outcome: "err",
      errorName: "TypeError",
    });
    expect((events[0].payload as { pending: number }).pending).toBeGreaterThan(0);
  });

  it("sends the tested module AND the assumed ones in ONE bulk op", async () => {
    const bulkComplete = vi.fn(acceptAll);
    const progress = { bulkComplete } as unknown as ProgressApi;

    // Passed m10 ⇒ assumed earlier modules auto-completed. Both must sync.
    // Uses the KO course: the ja map's m4+ are unauthored rewrite-spine
    // placeholders (zero lessons) since 2026-07-19, while KO still carries
    // full lesson lists per module.
    const res = await syncTestOutToServer(progress, ["m10"], "ko", ["m3", "m4", "m5"]);

    // ONE request — this is the whole point (was 5 chunked POSTs before).
    expect(bulkComplete).toHaveBeenCalledTimes(1);
    const sent = bulkComplete.mock.calls[0][0] as BulkCompleteSubmission;
    expect(sent.lang).toBe("ko");
    expect(sent.source).toBe("test_out");
    const modulesTouched = new Set(sent.lessonIds.map((id) => id.split("-")[1]));
    expect(modulesTouched.has("m10")).toBe(true);
    expect(modulesTouched.has("m3")).toBe(true);
    expect(modulesTouched.has("m4")).toBe(true);
    expect(modulesTouched.has("m5")).toBe(true);
    expect(res.submitted).toBe(sent.lessonIds.length);
  });

  it("de-dupes a module that appears in both passed and assumed", async () => {
    const bulkComplete = vi.fn(acceptAll);
    const progress = { bulkComplete } as unknown as ProgressApi;

    await syncTestOutToServer(progress, ["m3"], "ja", ["m3"]);
    const sent = bulkComplete.mock.calls[0][0] as BulkCompleteSubmission;
    expect(new Set(sent.lessonIds).size).toBe(sent.lessonIds.length);
  });

  it("the 491-lesson phone scenario is ONE request, not 491 or 5 chunked ones", async () => {
    const bulkComplete = vi.fn(acceptAll);
    const progress = { bulkComplete } as unknown as ProgressApi;

    // JA m1 alone is 31 lessons; walking enough modules gets well past 100.
    const modules = Array.from({ length: 20 }, (_, i) => `m${i + 1}`);
    const res = await syncTestOutToServer(progress, modules, "ja");

    expect(bulkComplete).toHaveBeenCalledTimes(1);
    expect(res.pending).toBe(0);
    expect(res.submitted).toBeGreaterThan(100);
  });
});
