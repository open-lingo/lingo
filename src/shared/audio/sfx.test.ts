import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * `haptic()` (private, called internally by `playSfx`) must not call
 * `navigator.vibrate` before the user has made a real gesture on the page —
 * Chrome logs a console-level intervention for that (not an exception, so
 * try/catch never sees it), which used to spam the console on every lesson
 * mount via LessonIntro's "lesson-start" sfx firing from a useEffect.
 *
 * The gesture flag is module-level state, so each test re-imports the
 * module fresh via `vi.resetModules()`. happy-dom ships no Web Audio, so a
 * minimal `AudioContext` stub (same pattern as `shared/tts/index.test.ts`)
 * is installed so `playSfx` gets past its `getCtx()` guard and actually
 * reaches the haptic call.
 */
function installAudioContextStub(): void {
  class FakeAudioContext {
    state = "running";
    currentTime = 0;
    destination = {};
    resume = () => Promise.resolve();
    createGain = () => ({
      gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => ({ connect: () => {} }),
    });
    createOscillator = () => ({
      type: "sine",
      frequency: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => ({ connect: () => {} }),
      start: () => {},
      stop: () => {},
    });
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
}

describe("sfx — haptic waits for a real user gesture", () => {
  beforeEach(() => {
    vi.resetModules();
    installAudioContextStub();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not call navigator.vibrate before any user gesture", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
      writable: true,
    });

    const { playSfx } = await import("./sfx");
    playSfx("correct", { combo: 1 }); // "correct" fires a haptic internally

    expect(vibrate).not.toHaveBeenCalled();
  });

  it("calls navigator.vibrate once a pointerdown has been dispatched", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
      writable: true,
    });

    const { playSfx } = await import("./sfx");

    window.dispatchEvent(new Event("pointerdown"));

    playSfx("correct", { combo: 1 });

    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(10);
  });
});
