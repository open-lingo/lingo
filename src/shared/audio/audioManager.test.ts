import { describe, it, expect, vi } from "vitest";
import { audioManager } from "./audioManager";

describe("audioManager — single content-audio channel", () => {
  it("starting a new clip cancels the in-progress one", () => {
    const stopA = vi.fn();
    audioManager.begin(stopA);
    expect(stopA).not.toHaveBeenCalled();
    const stopB = vi.fn();
    audioManager.begin(stopB); // should cancel A
    expect(stopA).toHaveBeenCalledTimes(1);
    expect(stopB).not.toHaveBeenCalled();
    audioManager.stop(); // cancel B
    expect(stopB).toHaveBeenCalledTimes(1);
  });

  it("isCurrent tracks the latest holder; superseded tokens are stale", () => {
    const tA = audioManager.begin(() => {});
    expect(audioManager.isCurrent(tA)).toBe(true);
    const tB = audioManager.begin(() => {});
    expect(audioManager.isCurrent(tA)).toBe(false);
    expect(audioManager.isCurrent(tB)).toBe(true);
    audioManager.stop();
  });

  it("end() only releases if still current (a natural finish after supersede is a no-op)", () => {
    const stopA = vi.fn();
    const tA = audioManager.begin(stopA);
    const tB = audioManager.begin(() => {}); // supersedes A (calls stopA)
    audioManager.end(tA); // A finished late — must NOT release B's channel
    expect(audioManager.isCurrent(tB)).toBe(true);
    audioManager.stop();
  });

  it("stop() is idempotent", () => {
    audioManager.stop();
    audioManager.stop();
    const stop = vi.fn();
    audioManager.begin(stop);
    audioManager.stop();
    audioManager.stop();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
