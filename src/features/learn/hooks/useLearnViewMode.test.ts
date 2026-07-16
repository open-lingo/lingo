import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLearnViewMode } from "./useLearnViewMode";

describe("useLearnViewMode", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to map", () => {
    const { result } = renderHook(() => useLearnViewMode("ko"));
    expect(result.current[0]).toBe("map");
  });

  it("persists per language", () => {
    const { result } = renderHook(() => useLearnViewMode("ko"));
    act(() => result.current[1]("list"));
    expect(localStorage.getItem("lingo:learn-view:ko")).toBe("list");
    const { result: ja } = renderHook(() => useLearnViewMode("ja"));
    expect(ja.current[0]).toBe("map");
  });

  it("ignores garbage stored values", () => {
    localStorage.setItem("lingo:learn-view:ko", "bogus");
    const { result } = renderHook(() => useLearnViewMode("ko"));
    expect(result.current[0]).toBe("map");
  });
});
