import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCombo, reportGradedAnswer, resetLessonJuice } from "./juice";
import { playSfx } from "@/shared/audio/sfx";

vi.mock("@/shared/audio/sfx", () => ({
  playSfx: vi.fn(),
}));

describe("lesson juice combo", () => {
  beforeEach(() => {
    resetLessonJuice();
    vi.mocked(playSfx).mockClear();
  });

  it("starts at zero and increments per correct answer", () => {
    expect(getCombo()).toBe(0);
    reportGradedAnswer("s1", true);
    reportGradedAnswer("s2", true);
    reportGradedAnswer("s3", true);
    expect(getCombo()).toBe(3);
  });

  it("resets to zero on a wrong answer", () => {
    reportGradedAnswer("s1", true);
    reportGradedAnswer("s2", true);
    reportGradedAnswer("s3", false);
    expect(getCombo()).toBe(0);
    reportGradedAnswer("s4", true);
    expect(getCombo()).toBe(1);
  });

  it("counts a step once even when it reports success repeatedly", () => {
    // Trace steps persist every passing attempt + report again on Continue.
    reportGradedAnswer("trace-a", true);
    reportGradedAnswer("trace-a", true);
    reportGradedAnswer("trace-a", true);
    expect(getCombo()).toBe(1);
    expect(playSfx).toHaveBeenCalledTimes(1);
  });

  it("counts a wrong→correct upgrade (replay tail retry)", () => {
    reportGradedAnswer("s1", false);
    expect(getCombo()).toBe(0);
    reportGradedAnswer("s1", true);
    expect(getCombo()).toBe(1);
  });

  it("repeated wrong answers still reset and chime each time", () => {
    reportGradedAnswer("s1", false);
    reportGradedAnswer("s1", false);
    expect(vi.mocked(playSfx).mock.calls.filter(([n]) => n === "incorrect")).toHaveLength(2);
  });

  it("plays the correct sound with the running combo", () => {
    reportGradedAnswer("s1", true);
    reportGradedAnswer("s2", true);
    expect(playSfx).toHaveBeenNthCalledWith(1, "correct", { combo: 1 });
    expect(playSfx).toHaveBeenNthCalledWith(2, "correct", { combo: 2 });
  });

  it("resetLessonJuice clears combo and verdict memory", () => {
    reportGradedAnswer("s1", true);
    resetLessonJuice();
    expect(getCombo()).toBe(0);
    reportGradedAnswer("s1", true);
    expect(getCombo()).toBe(1);
  });
});
