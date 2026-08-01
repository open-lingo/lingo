import { describe, expect, it, vi } from "vitest";

import {
  buildTestOutAttempts,
  syncTestOutToServer,
} from "./syncTestOutToServer";
import type { ProgressApi } from "@/shared/api/progress";

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
      // Server validator is ge=1; 0 was silently 422'ing every sync.
      expect(a.durationSec).toBe(1);
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
  it("includes the assumed (before-the-tested-module) modules, all isTestOut", async () => {
    const batchAttempts = vi.fn().mockResolvedValue(undefined);
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
    const batchAttempts = vi.fn().mockResolvedValue(undefined);
    const progress = { batchAttempts } as unknown as ProgressApi;

    await syncTestOutToServer(progress, ["m3"], "ja", ["m3"]);
    const sent = batchAttempts.mock.calls[0][0].attempts;
    const ids = sent.map((a: { clientAttemptId: string }) => a.clientAttemptId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
