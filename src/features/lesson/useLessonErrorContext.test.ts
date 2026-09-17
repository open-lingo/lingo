/**
 * A3b — lesson-context wiring. `LessonPage`/`PlacementTestPage` call
 * `useLessonErrorContext(lessonId, stepIndex, stepType)` from the one place
 * each knows its current step (see the hook's own docstring for the exact
 * call sites and why `LessonPage`, a god-file, isn't rendered directly here
 * — same rationale as `lessonPageBuildStepAudioAdvance.test.tsx`). This
 * tests the hook itself: set on mount, re-set on step change (clearing the
 * old value first), cleared on unmount.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { setLessonContext } from "@/shared/telemetry/errorReporter";
import { useLessonErrorContext } from "./useLessonErrorContext";

vi.mock("@/shared/telemetry/errorReporter", () => ({
  setLessonContext: vi.fn(),
}));

const mockedSetLessonContext = vi.mocked(setLessonContext);

afterEach(() => {
  cleanup();
  mockedSetLessonContext.mockClear();
});

describe("useLessonErrorContext", () => {
  it("sets lesson context (lessonId + stepIndex + stepType) on mount when lessonId is present", () => {
    renderHook(() => useLessonErrorContext("ja-m12-01", 3, "build_sentence"));
    expect(mockedSetLessonContext).toHaveBeenCalledWith({
      lessonId: "ja-m12-01",
      stepIndex: 3,
      stepType: "build_sentence",
    });
  });

  it("does not set context when lessonId is undefined (lesson not loaded yet)", () => {
    renderHook(() => useLessonErrorContext(undefined, 0, "mcq"));
    expect(mockedSetLessonContext).not.toHaveBeenCalled();
  });

  it("clears the old context before setting the new one when the step changes", () => {
    const { rerender } = renderHook(
      ({ idx, type }: { idx: number; type: string }) =>
        useLessonErrorContext("ja-m12-01", idx, type),
      { initialProps: { idx: 0, type: "mcq" } },
    );
    mockedSetLessonContext.mockClear();

    rerender({ idx: 1, type: "build_sentence" });

    expect(mockedSetLessonContext).toHaveBeenNthCalledWith(1, null);
    expect(mockedSetLessonContext).toHaveBeenNthCalledWith(2, {
      lessonId: "ja-m12-01",
      stepIndex: 1,
      stepType: "build_sentence",
    });
  });

  it("clears context on unmount", () => {
    const { unmount } = renderHook(() =>
      useLessonErrorContext("ja-m12-01", 0, "mcq"),
    );
    mockedSetLessonContext.mockClear();

    unmount();

    expect(mockedSetLessonContext).toHaveBeenCalledWith(null);
  });
});
