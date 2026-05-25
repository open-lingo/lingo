import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePracticeData } from "./usePracticeData";

describe("usePracticeData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a stable shape", () => {
    const { result } = renderHook(() => usePracticeData());
    const keys = Object.keys(result.current.data).sort();
    expect(keys).toEqual(
      [
        "dueModules",
        "lastTouchedHours",
        "todayMinutes",
        "totalModules",
        "weekMinutes",
      ].sort(),
    );
  });

  it("returns a 7-day week minutes array (oldest -> newest)", () => {
    const { result } = renderHook(() => usePracticeData());
    expect(result.current.data.weekMinutes).toHaveLength(7);
    expect(result.current.data.weekMinutes.every((n) => typeof n === "number")).toBe(true);
  });

  it("exposes due/total modules with sane defaults", () => {
    const { result } = renderHook(() => usePracticeData());
    const { dueModules, totalModules } = result.current.data;
    expect(typeof dueModules).toBe("number");
    expect(typeof totalModules).toBe("number");
    expect(totalModules).toBeGreaterThan(0);
    expect(dueModules).toBeGreaterThanOrEqual(0);
    expect(dueModules).toBeLessThanOrEqual(totalModules);
  });

  it("exposes per-section last-touched hours", () => {
    const { result } = renderHook(() => usePracticeData());
    const { lastTouchedHours } = result.current.data;
    expect(typeof lastTouchedHours.flashcards).toBe("number");
    expect(typeof lastTouchedHours.grammar).toBe("number");
    expect(typeof lastTouchedHours.alphabet).toBe("number");
  });

  it("exposes todayMinutes as a number", () => {
    const { result } = renderHook(() => usePracticeData());
    expect(typeof result.current.data.todayMinutes).toBe("number");
    expect(result.current.data.todayMinutes).toBeGreaterThanOrEqual(0);
  });

  it("reports isLoading=false in the mock implementation", () => {
    const { result } = renderHook(() => usePracticeData());
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useGrammarPracticeData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns trainer/lesson/hours counts", async () => {
    const { useGrammarPracticeData } = await import("./usePracticeData");
    const { result } = renderHook(() => useGrammarPracticeData());
    const { data } = result.current;
    expect(typeof data.trainerCount).toBe("number");
    expect(typeof data.lessonCount).toBe("number");
    expect(typeof data.hoursPracticed).toBe("number");
  });
});
