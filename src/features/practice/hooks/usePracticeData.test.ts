import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePracticeData } from "./usePracticeData";
import { markLessonCompleted } from "@/shared/domain/mockProgress";

describe("usePracticeData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a stable shape", () => {
    const { result } = renderHook(() => usePracticeData("ja"));
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
    const { result } = renderHook(() => usePracticeData("ja"));
    expect(result.current.data.weekMinutes).toHaveLength(7);
    expect(result.current.data.weekMinutes.every((n) => typeof n === "number")).toBe(true);
  });

  it("starts with zero minutes when no lessons are completed", () => {
    const { result } = renderHook(() => usePracticeData("ja"));
    expect(result.current.data.todayMinutes).toBe(0);
    expect(result.current.data.weekMinutes.every((n) => n === 0)).toBe(true);
  });

  it("derives todayMinutes from lesson completions", () => {
    markLessonCompleted("ja-m3-1", { accuracy: 1, xpEarned: 10, isReview: false });
    const { result } = renderHook(() => usePracticeData("ja"));
    expect(result.current.data.todayMinutes).toBeGreaterThan(0);
    // todayMinutes is the last entry of the week array.
    const week = result.current.data.weekMinutes;
    expect(result.current.data.todayMinutes).toBe(week[week.length - 1]);
  });

  it("exposes due/total modules from the review schedule + course map", () => {
    const { result } = renderHook(() => usePracticeData("ja"));
    const { dueModules, totalModules } = result.current.data;
    expect(totalModules).toBeGreaterThan(0);
    // Fresh storage — nothing scheduled, so nothing due.
    expect(dueModules).toBe(0);
  });

  it("reports null last-touched hours when there is no recorded activity", () => {
    const { result } = renderHook(() => usePracticeData("ja"));
    const { lastTouchedHours } = result.current.data;
    expect(lastTouchedHours.flashcards).toBeNull();
    expect(lastTouchedHours.alphabet).toBeNull();
  });

  it("reports isLoading=false (synchronous local reads)", () => {
    const { result } = renderHook(() => usePracticeData("ja"));
    expect(result.current.isLoading).toBe(false);
  });
});
