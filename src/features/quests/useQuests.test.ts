import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuests, QUESTS_STORAGE_KEY } from "./useQuests";

beforeEach(() => {
  localStorage.clear();
});

describe("useQuests", () => {
  it("returns the full catalog on first read", () => {
    const { result } = renderHook(() => useQuests());
    expect(result.current.quests.length).toBeGreaterThanOrEqual(4);
    const types = new Set(result.current.quests.map((q) => q.type));
    expect(types.has("daily")).toBe(true);
    expect(types.has("weekly")).toBe(true);
    expect(types.has("random")).toBe(true);
    expect(types.has("friend")).toBe(true);
  });

  it("addProgress bumps the current count", () => {
    const { result } = renderHook(() => useQuests());
    const id = result.current.quests[0].id;
    act(() => {
      result.current.addProgress(id, 10);
    });
    const updated = result.current.quests.find((q) => q.id === id)!;
    expect(updated.progress.current).toBe(10);
  });

  it("hitting target flips status to claimable", () => {
    const { result } = renderHook(() => useQuests());
    const q = result.current.quests.find((q) => q.id === "daily-fifty-xp")!;
    act(() => {
      result.current.addProgress(q.id, q.progress.target);
    });
    const updated = result.current.quests.find((qq) => qq.id === q.id)!;
    expect(updated.progress.current).toBe(q.progress.target);
    expect(updated.status).toBe("claimable");
  });

  it("claim() turns claimable into completed", () => {
    const { result } = renderHook(() => useQuests());
    const q = result.current.quests.find((q) => q.id === "daily-fifty-xp")!;
    act(() => {
      result.current.addProgress(q.id, q.progress.target);
    });
    act(() => {
      result.current.claim(q.id);
    });
    const updated = result.current.quests.find((qq) => qq.id === q.id)!;
    expect(updated.status).toBe("completed");
  });

  it("claim() is a no-op on an active (not claimable) quest", () => {
    const { result } = renderHook(() => useQuests());
    const q = result.current.quests[0];
    act(() => {
      result.current.claim(q.id);
    });
    const updated = result.current.quests.find((qq) => qq.id === q.id)!;
    expect(updated.status).toBe("active");
  });

  it("counts claimable + completed in summary", () => {
    const { result } = renderHook(() => useQuests());
    const q = result.current.quests.find((q) => q.id === "daily-fifty-xp")!;
    act(() => {
      result.current.addProgress(q.id, q.progress.target);
    });
    expect(result.current.summary.claimable).toBe(1);
    expect(result.current.summary.active).toBeGreaterThan(0);
    act(() => {
      result.current.claim(q.id);
    });
    expect(result.current.summary.claimable).toBe(0);
    expect(result.current.summary.completed).toBe(1);
  });

  it("persists progress to localStorage so it survives reload", () => {
    const { result, unmount } = renderHook(() => useQuests());
    const id = result.current.quests[0].id;
    act(() => {
      result.current.addProgress(id, 25);
    });
    unmount();
    expect(localStorage.getItem(QUESTS_STORAGE_KEY)).not.toBeNull();
    // Re-mount and check the value is back.
    const { result: r2 } = renderHook(() => useQuests());
    const reloaded = r2.current.quests.find((q) => q.id === id)!;
    expect(reloaded.progress.current).toBe(25);
  });

  it("refresh() resets progress and clears storage", () => {
    const { result } = renderHook(() => useQuests());
    const id = result.current.quests[0].id;
    act(() => {
      result.current.addProgress(id, 25);
    });
    act(() => {
      result.current.refresh();
    });
    const updated = result.current.quests.find((q) => q.id === id)!;
    expect(updated.progress.current).toBe(0);
    expect(updated.status).toBe("active");
  });
});
