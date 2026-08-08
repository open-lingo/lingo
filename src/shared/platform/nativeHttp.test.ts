import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("@capacitor/core", () => ({ CapacitorHttp: { get: (...a: unknown[]) => get(...a) } }));

const { fetchBinaryNative } = await import("./nativeHttp");

/** base64 for the three bytes 0x01 0x02 0x03 — stands in for clip bytes. */
const B64_BYTES = "AQID";

describe("fetchBinaryNative", () => {
  beforeEach(() => get.mockReset());

  it("decodes a base64 body into bytes", async () => {
    get.mockResolvedValue({
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
      data: B64_BYTES,
    });
    const buf = await fetchBinaryNative("https://app.openlingoapp.com/tts/v1/ja/x.mp3");
    expect([...new Uint8Array(buf)]).toEqual([1, 2, 3]);
  });

  it("rejects an HTML body served at 200", async () => {
    // THE REGRESSION THIS FILE EXISTS FOR. Pointing VITE_ASSET_BASE_URL at the
    // marketing apex instead of app.openlingoapp.com makes every clip URL
    // return the marketing SPA shell — 200, text/html, ~29 KB, never a 404.
    // Before this guard, decodeAudioData rejected it and loadBuffer swallowed
    // the failure as a console.warn, so lessons played through in silence.
    // That shipped to hardware on 2026-08-07.
    get.mockResolvedValue({
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
      data: "<!doctype html><html>…</html>",
    });
    await expect(
      fetchBinaryNative("https://openlingoapp.com/tts/v1/ja/x.mp3"),
    ).rejects.toThrow(/text\/html/);
  });

  it("matches the content-type header whatever its casing", async () => {
    // Native and web disagree on header key casing; a case-sensitive lookup
    // would let the HTML body through on one platform and not the other.
    get.mockResolvedValue({
      status: 200,
      headers: { "CONTENT-TYPE": "TEXT/HTML" },
      data: "<!doctype html>",
    });
    await expect(fetchBinaryNative("https://example.test/x.mp3")).rejects.toThrow(
      /text\/html/,
    );
  });

  it("throws on a non-2xx status", async () => {
    get.mockResolvedValue({ status: 404, headers: {}, data: "" });
    await expect(fetchBinaryNative("https://example.test/x.mp3")).rejects.toThrow("HTTP 404");
  });
});

describe("env templates", () => {
  // Config ratchet, not a unit test: the bug was one line in an env file that
  // no amount of application-code testing could have caught. The two hosts are
  // easy to confuse because VITE_MARKETING_ORIGIN legitimately IS the apex.
  const read = (f: string) => readFileSync(path.resolve(process.cwd(), f), "utf8");
  const assetBase = (body: string) =>
    body.match(/^VITE_ASSET_BASE_URL=(.*)$/m)?.[1]?.trim() ?? null;

  it("never points the asset base at the marketing apex", () => {
    for (const file of [".env.example", ".env.native.example"]) {
      const value = assetBase(read(file));
      expect(value, `${file} must define VITE_ASSET_BASE_URL`).not.toBeNull();
      expect(value, `${file} serves the marketing SPA shell at 200 for /tts/*`).not.toMatch(
        /^https?:\/\/openlingoapp\.com\/?$/,
      );
    }
  });

  it("keeps the web template's asset base empty so clips stay same-origin", () => {
    // CloudFront fronts the app and /tts/* together in prod, so a relative path
    // is correct there and needs no CORS. deploy.yml passes no asset base.
    expect(assetBase(read(".env.example"))).toBe("");
  });

  it("gives the native template an absolute app-host base", () => {
    // Native has no same-origin to fall back to: under capacitor://localhost a
    // relative /tts/ path resolves into the app bundle, where no mp3s exist.
    expect(assetBase(read(".env.native.example"))).toBe("https://app.openlingoapp.com");
  });
});
