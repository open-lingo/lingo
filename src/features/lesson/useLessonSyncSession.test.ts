/**
 * Fix 13 — useLessonSyncSession must NOT register a setInterval (the global
 * LessonProgressHydrate owns the periodic flush). It still keeps the
 * beforeunload guard + unmount flush.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    progress: {
      batchAttempts: vi.fn().mockResolvedValue({ results: [] }),
      getMe: vi.fn().mockResolvedValue({}),
    },
  }),
}));

vi.mock("./engine", () => ({
  getLessonDirtyCount: vi.fn(() => 0),
  syncLessonProgressWithServer: vi.fn(async () => ({ pushed: 0 })),
}));

vi.mock("./engine/lessonStorage", () => ({
  setNextLessonSyncAt: vi.fn(),
}));

import { useLessonSyncSession } from "./useLessonSyncSession";

describe("useLessonSyncSession", () => {
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setIntervalSpy = vi.spyOn(window, "setInterval");
  });
  afterEach(() => {
    setIntervalSpy.mockRestore();
  });

  it("does NOT register a setInterval (Fix 13 — collapsed to LessonProgressHydrate)", () => {
    renderHook(() => useLessonSyncSession());
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });
});
