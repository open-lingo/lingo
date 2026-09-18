import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const state = {
  status: "idle" as "idle" | "loading" | "ready" | "error",
  dictFromCdn: true,
  listeners: new Set<() => void>(),
};

vi.mock("./kuroshiro", () => ({
  getDictLoadStatus: () => state.status,
  isDictFromCdn: () => state.dictFromCdn,
  subscribeDictLoadStatus: (listener: () => void) => {
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  },
}));

function setStatus(next: typeof state.status) {
  state.status = next;
  state.listeners.forEach((l) => l());
}

afterEach(() => {
  state.status = "idle";
  state.dictFromCdn = true;
  state.listeners.clear();
  vi.resetModules();
});

describe("useDictDownloadState", () => {
  it("showDownloadingBanner is false while idle", async () => {
    const { useDictDownloadState } = await import("./useDictDownloadState");
    const { result } = renderHook(() => useDictDownloadState());
    expect(result.current.status).toBe("idle");
    expect(result.current.showDownloadingBanner).toBe(false);
  });

  it("showDownloadingBanner turns true when status becomes loading (CDN path active)", async () => {
    const { useDictDownloadState } = await import("./useDictDownloadState");
    const { result } = renderHook(() => useDictDownloadState());
    act(() => setStatus("loading"));
    expect(result.current.status).toBe("loading");
    expect(result.current.showDownloadingBanner).toBe(true);
  });

  it("showDownloadingBanner turns false again once status becomes ready", async () => {
    const { useDictDownloadState } = await import("./useDictDownloadState");
    const { result } = renderHook(() => useDictDownloadState());
    act(() => setStatus("loading"));
    act(() => setStatus("ready"));
    expect(result.current.status).toBe("ready");
    expect(result.current.showDownloadingBanner).toBe(false);
  });

  it("showDownloadingBanner stays false even while loading when the CDN path isn't active (bundled dict build)", async () => {
    state.dictFromCdn = false;
    const { useDictDownloadState } = await import("./useDictDownloadState");
    const { result } = renderHook(() => useDictDownloadState());
    act(() => setStatus("loading"));
    expect(result.current.showDownloadingBanner).toBe(false);
  });
});
