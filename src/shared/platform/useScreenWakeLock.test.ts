/**
 * Screen Wake Lock (iPad pass, docs/ipad-scoping-2026-09-15.md §2).
 *
 * The behaviours worth pinning are all POLICY and LIFECYCLE, not rendering:
 * which form factors get the lock, that the OS taking it back on hide is
 * recovered from on the next show, that unmount always releases, and that an
 * absent or hostile API never throws into the app shell. `navigator.wakeLock`
 * is mocked wholesale — happy-dom has no Wake Lock implementation, which is
 * itself one of the cases under test.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// The form factor is faked at the module seam (same pattern as
// LearnHomeSwitch.test.tsx) so each case names a device shape.
const factor = {
  coarsePointer: false,
  tabletPortrait: false,
  landscapeLg: true,
  landscapeDesktopTouch: false,
  forceVerticalLearnMap: false,
};
vi.mock("./formFactor", () => ({ useFormFactor: () => factor }));

import { useScreenWakeLock, isScreenWakeLockSupported } from "./useScreenWakeLock";

function asDesktopMouse() {
  Object.assign(factor, {
    coarsePointer: false,
    tabletPortrait: false,
    landscapeLg: true,
    landscapeDesktopTouch: false,
    forceVerticalLearnMap: false,
  });
}
function asPhone() {
  Object.assign(factor, {
    coarsePointer: true,
    tabletPortrait: false,
    landscapeLg: false,
    landscapeDesktopTouch: false,
    forceVerticalLearnMap: true,
  });
}
function asTabletLandscape() {
  Object.assign(factor, {
    coarsePointer: true,
    tabletPortrait: false,
    landscapeLg: true,
    landscapeDesktopTouch: true,
    forceVerticalLearnMap: false,
  });
}

type Sentinel = {
  released: boolean;
  release: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  fireRelease: () => void;
};

let sentinels: Sentinel[] = [];
let request: ReturnType<typeof vi.fn>;

function makeSentinel(): Sentinel {
  const listeners: Array<() => void> = [];
  const s: Sentinel = {
    released: false,
    release: vi.fn(async () => {
      s.released = true;
    }),
    addEventListener: vi.fn((_type: string, cb: () => void) => listeners.push(cb)),
    fireRelease: () => {
      s.released = true;
      for (const cb of listeners) cb();
    },
  };
  return s;
}

function installWakeLock() {
  request = vi.fn(async () => {
    const s = makeSentinel();
    sentinels.push(s);
    return s;
  });
  Object.defineProperty(navigator, "wakeLock", {
    value: { request },
    configurable: true,
    writable: true,
  });
}

function removeWakeLock() {
  Object.defineProperty(navigator, "wakeLock", {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
}

/** The hook's acquire path is async — let the microtask queue drain. */
async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  sentinels = [];
  asDesktopMouse();
  setVisibility("visible");
  installWakeLock();
});

afterEach(() => {
  vi.restoreAllMocks();
  removeWakeLock();
});

describe("useScreenWakeLock — policy", () => {
  it("holds the lock during a session on a touch device", async () => {
    asPhone();
    const { result } = renderHook(() => useScreenWakeLock({ inSession: true }));
    await settle();
    expect(request).toHaveBeenCalledWith("screen");
    expect(result.current.held).toBe(true);
    expect(result.current.wanted).toBe(true);
  });

  it("does NOT touch the lock during a session on a desktop mouse", async () => {
    asDesktopMouse();
    const { result } = renderHook(() => useScreenWakeLock({ inSession: true }));
    await settle();
    expect(request).not.toHaveBeenCalled();
    expect(result.current.wanted).toBe(false);
    expect(result.current.held).toBe(false);
  });

  it("does NOT hold the lock outside a session on a phone", async () => {
    asPhone();
    renderHook(() => useScreenWakeLock({ inSession: false }));
    await settle();
    expect(request).not.toHaveBeenCalled();
  });

  // Spencer's own mode: iPad in landscape, app open all day, any route.
  it("holds the lock on a landscape tablet even with no session running", async () => {
    asTabletLandscape();
    const { result } = renderHook(() => useScreenWakeLock({ inSession: false }));
    await settle();
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current.held).toBe(true);
  });

  it("respects the `enabled` escape hatch", async () => {
    asTabletLandscape();
    renderHook(() => useScreenWakeLock({ inSession: true, enabled: false }));
    await settle();
    expect(request).not.toHaveBeenCalled();
  });
});

describe("useScreenWakeLock — lifecycle", () => {
  it("skips the request while the document is hidden, then acquires on show", async () => {
    asTabletLandscape();
    setVisibility("hidden");
    const { result } = renderHook(() => useScreenWakeLock({ inSession: false }));
    await settle();
    expect(request).not.toHaveBeenCalled();
    expect(result.current.held).toBe(false);

    setVisibility("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    await settle();
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current.held).toBe(true);
  });

  // The OS releases the lock when the page hides and does not give it back —
  // this is the whole reason the hook listens to visibilitychange.
  it("re-acquires after a hide/show round trip", async () => {
    asTabletLandscape();
    const { result } = renderHook(() => useScreenWakeLock({ inSession: false }));
    await settle();
    expect(request).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(result.current.held).toBe(false);

    setVisibility("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    await settle();
    expect(request).toHaveBeenCalledTimes(2);
    expect(result.current.held).toBe(true);
  });

  it("does not re-request while already holding a live sentinel", async () => {
    asTabletLandscape();
    renderHook(() => useScreenWakeLock({ inSession: false }));
    await settle();
    setVisibility("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    await settle();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("reports held=false when the OS releases the sentinel under us", async () => {
    asTabletLandscape();
    const { result } = renderHook(() => useScreenWakeLock({ inSession: false }));
    await settle();
    expect(result.current.held).toBe(true);
    await act(async () => {
      sentinels[0].fireRelease();
      await Promise.resolve();
    });
    expect(result.current.held).toBe(false);
  });

  it("releases the lock on unmount", async () => {
    asTabletLandscape();
    const { unmount } = renderHook(() => useScreenWakeLock({ inSession: false }));
    await settle();
    expect(sentinels).toHaveLength(1);
    await act(async () => {
      unmount();
      await Promise.resolve();
    });
    expect(sentinels[0].release).toHaveBeenCalledTimes(1);
  });

  it("releases the lock when the session ends", async () => {
    asPhone();
    const { result, rerender } = renderHook(
      ({ inSession }: { inSession: boolean }) => useScreenWakeLock({ inSession }),
      { initialProps: { inSession: true } },
    );
    await settle();
    expect(result.current.held).toBe(true);
    await act(async () => {
      rerender({ inSession: false });
      await Promise.resolve();
    });
    expect(sentinels[0].release).toHaveBeenCalledTimes(1);
    expect(result.current.held).toBe(false);
  });
});

describe("useScreenWakeLock — never throws", () => {
  it("no-ops when the API is absent (every desktop browser, pre-16.4 WebKit)", async () => {
    removeWakeLock();
    asTabletLandscape();
    expect(isScreenWakeLockSupported()).toBe(false);
    const { result } = renderHook(() => useScreenWakeLock({ inSession: true }));
    await settle();
    expect(result.current.supported).toBe(false);
    expect(result.current.held).toBe(false);
  });

  it("survives a rejected request (denied / battery policy)", async () => {
    asTabletLandscape();
    request = vi.fn(async () => {
      throw new Error("NotAllowedError");
    });
    Object.defineProperty(navigator, "wakeLock", {
      value: { request },
      configurable: true,
      writable: true,
    });
    const { result } = renderHook(() => useScreenWakeLock({ inSession: true }));
    await settle();
    expect(result.current.supported).toBe(true);
    expect(result.current.held).toBe(false);
  });

  it("survives a release() that rejects", async () => {
    asTabletLandscape();
    const { unmount } = renderHook(() => useScreenWakeLock({ inSession: false }));
    await settle();
    sentinels[0].release.mockImplementation(async () => {
      throw new Error("InvalidStateError");
    });
    await act(async () => {
      unmount();
      await Promise.resolve();
    });
    expect(sentinels[0].release).toHaveBeenCalled();
  });
});
