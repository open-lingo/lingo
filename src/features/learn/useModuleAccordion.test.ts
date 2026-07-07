import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useModuleAccordion } from "./useModuleAccordion";

const KEY = "lingo_module_open_v1:course-1";

beforeEach(() => localStorage.clear());

describe("useModuleAccordion", () => {
  it("first visit opens the current module only", () => {
    const { result } = renderHook(() => useModuleAccordion("course-1", "m3"));
    expect(result.current.isOpen("m3")).toBe(true);
    expect(result.current.isOpen("m1")).toBe(false);
  });

  it("returning learner gets the CURRENT module opened over stale stored state", () => {
    // Regression: a visit made at M1 stored {m1:true}; revisiting at M13
    // kept opening M1 forever because the mount ref already equals m13 and
    // the change-effect never fires.
    localStorage.setItem(KEY, JSON.stringify({ m1: true }));
    const { result } = renderHook(() => useModuleAccordion("course-1", "m13"));
    expect(result.current.isOpen("m13")).toBe(true);
    expect(result.current.isOpen("m1")).toBe(true); // user's stored opens kept
  });

  it("manual collapse still sticks within the session", () => {
    const { result } = renderHook(() => useModuleAccordion("course-1", "m3"));
    act(() => result.current.toggle("m3"));
    expect(result.current.isOpen("m3")).toBe(false);
  });
});
