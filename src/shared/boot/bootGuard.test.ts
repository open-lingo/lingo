import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * src/pub/boot-guard.js is a classic script (CSP forbids inline), evaluated
 * here inside the test DOM. It is the layer under AppErrorBoundary: it must
 * paint a Reload fallback when React never mounts, and when React unmounts
 * the root after having rendered (TestFlight #64).
 */
const SRC = fs.readFileSync(path.resolve(__dirname, "../../../src/pub/boot-guard.js"), "utf8");

type Guard = { firstError: string | null; fallback: HTMLElement | null; hadContent: boolean };
const guard = () => (window as unknown as { __lingoBootGuard: Guard }).__lingoBootGuard;

function boot() {
  document.body.innerHTML = '<div id="root"></div>';
  document.head.innerHTML = '<link id="lingo-fonts" rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Instrument+Sans&display=swap" />';
  new Function(SRC)();
}

describe("boot-guard.js", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("promotes the preloaded Google Fonts link to a stylesheet (non-blocking font load)", () => {
    boot();
    const link = document.getElementById("lingo-fonts")!;
    expect(link.getAttribute("rel")).toBe("stylesheet");
    expect(link.getAttribute("href")).toContain("fonts.googleapis.com");
  });

  it("does nothing when the root fills before the watchdog fires", async () => {
    boot();
    document.getElementById("root")!.appendChild(document.createElement("div"));
    await vi.advanceTimersByTimeAsync(25_000);
    expect(document.getElementById("boot-fallback")).toBeNull();
    expect(guard().hadContent).toBe(true);
  });

  it("paints the fallback (with the first captured error) when the root is still empty at the deadline", async () => {
    boot();
    window.dispatchEvent(new ErrorEvent("error", { error: new ReferenceError("auth0 config missing") }));
    // happy-dom runs on localhost → no silent auto-reload, 20 s deadline.
    await vi.advanceTimersByTimeAsync(20_100);
    const fb = document.getElementById("boot-fallback")!;
    expect(fb).not.toBeNull();
    expect(fb.getAttribute("data-reason")).toBe("boot-timeout");
    expect(fb.textContent).toContain("Open Lingo didn’t start");
    expect(fb.textContent).toContain("ReferenceError: auth0 config missing");
    expect(fb.querySelector("button")!.textContent).toBe("Reload");
  });

  it("paints the fallback immediately when a populated root is emptied, and clears it when content returns", async () => {
    boot();
    const root = document.getElementById("root")!;
    const child = document.createElement("div");
    root.appendChild(child);
    await vi.advanceTimersByTimeAsync(0); // flush the MutationObserver
    expect(guard().hadContent).toBe(true);
    root.removeChild(child);
    await vi.advanceTimersByTimeAsync(0);
    expect(document.getElementById("boot-fallback")!.getAttribute("data-reason")).toBe("root-emptied");
    root.appendChild(document.createElement("div"));
    await vi.advanceTimersByTimeAsync(0);
    expect(document.getElementById("boot-fallback")).toBeNull();
  });
  it("treats the Android origin https://localhost as native (8 s deadline, not dev)", () => {
    const setURL = (window as unknown as { happyDOM?: { setURL(u: string): void } }).happyDOM?.setURL;
    if (!setURL) return; // happy-dom only
    const before = location.href;
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      setURL.call((window as unknown as { happyDOM: unknown }).happyDOM, "https://localhost/");
      boot();
      const armed = info.mock.calls.map((c) => String(c[0])).find((m) => m.includes("armed:"));
      expect(armed).toContain("timeout=8000ms native=true localDev=false");
    } finally {
      setURL.call((window as unknown as { happyDOM: unknown }).happyDOM, before);
      info.mockRestore();
    }
  });

});
