import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildTestOutAttempts,
  syncTestOutToServer,
} from "./syncTestOutToServer";
import {
  SERVER_DURATION_FLOOR_SEC,
  type BatchAttempt,
  type ProgressApi,
} from "@/shared/api/progress";
import { clearTestOutSyncQueue } from "@/shared/domain/testOutSyncQueue";
import { clearSessionLog, getSessionLog } from "@/shared/telemetry/sessionLog";

/** What the server answers for an accepted row. `syncTestOutToServer` only
 *  counts ids the server confirms, so a mock that resolves `undefined`
 *  legitimately reports 0 submitted (b18 #144 — the old code counted rows it
 *  had merely POSTed, which is how a 100%-rejected batch looked like success). */
function acceptAll(payload: { attempts: BatchAttempt[] }) {
  return {
    results: payload.attempts.map((a) => ({
      clientAttemptId: a.clientAttemptId,
      attemptId: `srv-${a.clientAttemptId}`,
      accepted: true,
      xpEarned: 0,
      streakAfter: 0,
      lingotsEarned: 0,
      dailyTotalLessons: 0,
    })),
  };
}

describe("buildTestOutAttempts", () => {
  it("returns empty when no modules passed", () => {
    expect(buildTestOutAttempts([])).toEqual([]);
  });

  it("synthesizes one attempt per lesson in passed modules", () => {
    const attempts = buildTestOutAttempts(["m3"]);
    expect(attempts.length).toBeGreaterThan(0);
    for (const a of attempts) {
      expect(a.passed).toBe(true);
      expect(a.score).toBe(1.0);
      // Server floor is max(5, stepResults.length) — `router.py:363`.
      // Anything under it comes back `duration_below_floor` and is dropped
      // before the rollup write (b18 #144).
      expect(a.durationSec).toBe(SERVER_DURATION_FLOOR_SEC);
      expect(a.stepResults).toEqual([]);
      expect(a.clientAttemptId).toMatch(/^testout-m3-/);
      expect(a.lessonId).toBeTruthy();
      expect(a.attemptedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      // Currency gate — server skips XP/lingots when this is true.
      expect(a.isTestOut).toBe(true);
    }
  });

  it("clientAttemptIds are unique across modules", () => {
    const attempts = buildTestOutAttempts(["m3", "m4"]);
    const ids = attempts.map((a) => a.clientAttemptId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("skips modules not in passedModules", () => {
    const attempts = buildTestOutAttempts(["m3"]);
    for (const a of attempts) {
      expect(a.clientAttemptId.startsWith("testout-m3-")).toBe(true);
    }
  });

  it("builds attempts against the requested course (KO → ko-* lesson ids)", () => {
    const attempts = buildTestOutAttempts(["m3"], "ko");
    expect(attempts.length).toBeGreaterThan(0);
    for (const a of attempts) {
      // Story capstones carry the `story:` namespace prefix (see
      // `storyNodeId`) — they are still KO course rows, and testing out has
      // to credit them or the module would stay incomplete.
      expect(a.lessonId).toMatch(/^(story:)?ko-/);
    }
  });
});

describe("syncTestOutToServer", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTestOutSyncQueue();
    clearSessionLog();
  });

  function pushEvents() {
    return getSessionLog().filter(
      (e) => e.type === "sync_event" && e.payload.source === "test_out_push",
    );
  }

  // 2026-09-18 — the coordinator's exact ask: find (and make VISIBLE) the
  // branch that returns before `batchAttempts` is ever called. This is it —
  // a caller-supplied `passedModules`/`assumedModules` set that doesn't
  // synthesize any rows (empty, or ids that don't match any course module)
  // returns here with ZERO network calls and, pre-this-lane, zero trace.
  it("logs test_out_push with reason 'no-attempts' on the empty-synthesis early return, before any POST", async () => {
    const batchAttempts = vi.fn(acceptAll);
    const progress = { batchAttempts } as unknown as ProgressApi;

    const res = await syncTestOutToServer(progress, [], "ja");

    expect(batchAttempts).not.toHaveBeenCalled();
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

  it("logs test_out_push ok with chunk/submitted counts on a successful drain", async () => {
    const batchAttempts = vi.fn(acceptAll);
    const progress = { batchAttempts } as unknown as ProgressApi;

    await syncTestOutToServer(progress, ["m3"], "ja");

    const events = pushEvents();
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({ source: "test_out_push", languageId: "ja", outcome: "ok" });
    expect((events[0].payload as { attemptCount: number }).attemptCount).toBeGreaterThan(0);
    expect((events[0].payload as { submitted: number }).submitted).toBe(
      (events[0].payload as { attemptCount: number }).attemptCount,
    );
  });

  it("logs test_out_push err with the failure's name when every chunk fails transport", async () => {
    const batchAttempts = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const progress = { batchAttempts } as unknown as ProgressApi;

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

  it("includes the assumed (before-the-tested-module) modules, all isTestOut", async () => {
    const batchAttempts = vi.fn(acceptAll);
    const progress = { batchAttempts } as unknown as ProgressApi;

    // Passed m10 ⇒ assumed earlier modules auto-completed. Both must sync.
    // Uses the KO course: the ja map's m4+ are unauthored rewrite-spine
    // placeholders (zero lessons ⇒ zero synthesizable attempts) since
    // 2026-07-19, while KO still carries full lesson lists per module.
    const res = await syncTestOutToServer(progress, ["m10"], "ko", [
      "m3",
      "m4",
      "m5",
    ]);

    // KO m3-m5 + m10 is under the server's 100-row cap, so one POST.
    expect(batchAttempts).toHaveBeenCalledTimes(1);
    const sent = batchAttempts.mock.calls[0][0].attempts;
    // Every synced attempt is flagged isTestOut so the server gates XP.
    expect(sent.every((a: { isTestOut?: boolean }) => a.isTestOut === true)).toBe(
      true,
    );
    // Attempts exist for the tested module AND the assumed ones.
    const modulesTouched = new Set(
      sent.map((a: { lessonId: string }) => a.lessonId.split("-")[1]),
    );
    expect(modulesTouched.has("m10")).toBe(true);
    expect(modulesTouched.has("m3")).toBe(true);
    expect(modulesTouched.has("m4")).toBe(true);
    expect(modulesTouched.has("m5")).toBe(true);
    expect(res.submitted).toBe(sent.length);
  });

  it("de-dupes a module that appears in both passed and assumed", async () => {
    const batchAttempts = vi.fn(acceptAll);
    const progress = { batchAttempts } as unknown as ProgressApi;

    await syncTestOutToServer(progress, ["m3"], "ja", ["m3"]);
    const sent = batchAttempts.mock.calls[0][0].attempts;
    const ids = sent.map((a: { clientAttemptId: string }) => a.clientAttemptId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
