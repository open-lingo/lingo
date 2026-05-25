import { describe, it, expect, vi } from "vitest";
import { AdSenseAdProvider } from "./AdSenseAdProvider";

describe("AdSenseAdProvider", () => {
  it("has id 'adsense'", () => {
    const p = new AdSenseAdProvider({ getClient: () => "ca-pub-xxx" });
    expect(p.id).toBe("adsense");
  });

  it("isReady is false when no client id is configured", () => {
    const p = new AdSenseAdProvider({ getClient: () => "" });
    expect(p.isReady()).toBe(false);
  });

  it("isReady is true when a client id is configured", () => {
    const p = new AdSenseAdProvider({ getClient: () => "ca-pub-xxx" });
    expect(p.isReady()).toBe(true);
  });

  it("returns null when not ready (no client id)", () => {
    const p = new AdSenseAdProvider({ getClient: () => "" });
    const result = p.request({ slot: "banner", format: "banner" });
    expect(result).toBeNull();
  });

  it("returns a rendered slot when ready and the slot maps to an AdSense unit", () => {
    const p = new AdSenseAdProvider({
      getClient: () => "ca-pub-xxx",
      getSlotId: (slot) => (slot === "banner" ? "1234567890" : ""),
      loadScript: vi.fn(),
    });
    const result = p.request({ slot: "banner", format: "banner" });
    expect(result).not.toBeNull();
    expect(result!.impressionId).toMatch(/^adsense-banner-/);
  });

  it("returns null when the AdSense unit for the slot is not configured", () => {
    const p = new AdSenseAdProvider({
      getClient: () => "ca-pub-xxx",
      getSlotId: () => "",
      loadScript: vi.fn(),
    });
    const result = p.request({ slot: "banner", format: "banner" });
    expect(result).toBeNull();
  });
});
