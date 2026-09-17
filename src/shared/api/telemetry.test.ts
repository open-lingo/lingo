import { afterEach, describe, expect, it, vi } from "vitest";
import { sendErrorBatch, sendErrorBatchBeacon, telemetryErrorsUrl } from "./telemetry";

const ITEM = {
  message: "TypeError: boom",
  source: "window.onerror",
  platform: "web" as const,
  count: 1,
  ts: 1_758_000_000_000,
  sessionId: "s-1",
};

describe("telemetryErrorsUrl", () => {
  it("targets the versioned telemetry errors path", () => {
    expect(telemetryErrorsUrl()).toMatch(/\/api\/core\/v1\/telemetry\/errors$/);
  });
});

describe("sendErrorBatch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs a JSON body of {items} with keepalive and reports ok on 2xx", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 202 }));

    const result = await sendErrorBatch([ITEM]);

    expect(result).toEqual({ ok: true, status: 202 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/telemetry\/errors$/);
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body as string)).toEqual({ items: [ITEM] });
  });

  it("never throws — reports status 0 on a network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await sendErrorBatch([ITEM]);

    expect(result).toEqual({ ok: false, status: 0 });
  });

  it("surfaces a real status code so the caller can drive backoff (e.g. 503)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));

    const result = await sendErrorBatch([ITEM]);

    expect(result).toEqual({ ok: false, status: 503 });
  });
});

describe("sendErrorBatchBeacon", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-expect-error — test-only cleanup of a property we stub on navigator
    delete navigator.sendBeacon;
  });

  it("calls navigator.sendBeacon with the telemetry URL and a JSON blob, and returns its verdict", () => {
    const beaconSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", { value: beaconSpy, configurable: true });

    const ok = sendErrorBatchBeacon([ITEM]);

    expect(ok).toBe(true);
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    const [url, blob] = beaconSpy.mock.calls[0] as [string, Blob];
    expect(url).toMatch(/\/telemetry\/errors$/);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
  });

  it("returns false (never throws) when sendBeacon is unavailable", () => {
    Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true });

    expect(() => sendErrorBatchBeacon([ITEM])).not.toThrow();
    expect(sendErrorBatchBeacon([ITEM])).toBe(false);
  });

  it("returns false (never throws) when sendBeacon itself throws synchronously", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: () => {
        throw new Error("queue full");
      },
      configurable: true,
    });

    expect(() => sendErrorBatchBeacon([ITEM])).not.toThrow();
    expect(sendErrorBatchBeacon([ITEM])).toBe(false);
  });
});
