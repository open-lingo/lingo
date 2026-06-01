import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetLearnProgress } from "./resetLearnProgress";
import {
  clearLessonProgressReset,
  hasLessonProgressReset,
} from "@/shared/domain/mockProgress";
import type { ProgressApi } from "@/shared/api/progress";
import type { SrsApi } from "@/shared/api/srs";

function buildApiStub(opts: {
  progressReset?: () => Promise<void>;
  srsClear?: () => Promise<void>;
}) {
  return {
    progress: {
      resetMe:
        opts.progressReset ?? (() => Promise.resolve(undefined as unknown as void)),
    } as unknown as ProgressApi,
    srs: {
      clearAll:
        opts.srsClear ?? (() => Promise.resolve(undefined as unknown as void)),
    } as unknown as SrsApi,
  };
}

describe("resetLearnProgress — Fix H10 reset-flag lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    clearLessonProgressReset();
  });

  it("sets the lesson-progress-reset flag after server reset succeeds", async () => {
    const api = buildApiStub({});
    await resetLearnProgress("ja", "mock-1", api);
    expect(hasLessonProgressReset()).toBe(true);
  });

  it("does NOT set the flag for a local-only reset (no api)", async () => {
    await resetLearnProgress("ja", "mock-1", null);
    expect(hasLessonProgressReset()).toBe(false);
  });

  it("does NOT set the flag if the server reset itself failed", async () => {
    const api = buildApiStub({
      progressReset: () => Promise.reject(new Error("network")),
    });
    await resetLearnProgress("ja", "mock-1", api);
    expect(hasLessonProgressReset()).toBe(false);
  });

  it("still sets the flag even if SRS clearAll failed (independent failure)", async () => {
    const api = buildApiStub({
      srsClear: () => Promise.reject(new Error("srs-broken")),
    });
    await resetLearnProgress("ja", "mock-1", api);
    // The reset flag tracks the lesson-progress side specifically; SRS is
    // independent and shouldn't block the lesson-rollup re-merge gate.
    expect(hasLessonProgressReset()).toBe(true);
  });

  it("calls both server endpoints in parallel", async () => {
    const progressReset = vi.fn(() => Promise.resolve(undefined as unknown as void));
    const srsClear = vi.fn(() => Promise.resolve(undefined as unknown as void));
    const api = buildApiStub({ progressReset, srsClear });
    await resetLearnProgress("ja", "mock-1", api);
    expect(progressReset).toHaveBeenCalledOnce();
    expect(srsClear).toHaveBeenCalledOnce();
  });
});
