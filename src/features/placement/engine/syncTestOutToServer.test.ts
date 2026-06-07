import { describe, expect, it } from "vitest";

import { buildTestOutAttempts } from "./syncTestOutToServer";

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
});
