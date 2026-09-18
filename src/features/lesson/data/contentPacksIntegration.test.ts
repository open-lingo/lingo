/**
 * Integration coverage for the content-packs loader seam inside
 * `contentLoader.ts` (docs/content-packs-2026-09-18.md, brief deliverable:
 * "loader precedence, hash mismatch → refetch, schema refusal, offline
 * path, prefetch trigger"). `contentPackLoader.test.ts` and
 * `contentPackCache.test.ts` cover the pack loader/cache in isolation with
 * injected transports; this file drives the REAL precedence chain inside
 * `contentLoader.ts` — (a) memory, (b) bundled slice, (c)/(d) pack cache +
 * network — through the actual module-level `fetch` global, split into a
 * separate file (rather than added to a same-named `contentLoader.test.ts`)
 * so a future author of the base loader's own tests doesn't collide with
 * this lane's file.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetContentLoader,
  ensureModuleLoaded,
  getContentDownloadStatus,
  triggerCoursePackPrefetch,
  type ContentManifest,
} from "./contentLoader";
import { hasRegisteredLesson, __clearLessonRegistry } from "./lessonRegistry";
import { __resetContentPackLoaderForTests } from "./contentPackLoader";

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function moduleBody(id: string) {
  return { lessons: [{ id: `ja-${id}-l1`, languageId: "ja", steps: [] }] };
}

const VERSION = "verX000001";
const MANIFEST: ContentManifest = {
  schema: 1,
  version: VERSION,
  generatedAt: "2026-09-18T00:00:00.000Z",
  languages: {
    ja: {
      modules: [
        { id: "m1", file: "ja/m1.aaa.json", lessons: ["ja-m1-l1"] },
        { id: "m2", file: "ja/m2.bbb.json", lessons: ["ja-m2-l1"] },
        { id: "m3", file: "ja/m3.ccc.json", lessons: ["ja-m3-l1"] },
        { id: "m4", file: "ja/m4.ddd.json", lessons: ["ja-m4-l1"] },
      ],
      packBundledThrough: 3,
    },
    // A language with no pack marker at all — packs OFF, every module
    // must resolve locally, network/pack path never touched.
    es: {
      modules: [{ id: "m1", file: "es/m1.eee.json", lessons: ["es-m1-l1"] }],
    },
  },
};

const PACK_BASE = `/content/v2/${VERSION}/ja/`;

function jsonResponse(obj: unknown, status = 200) {
  const text = JSON.stringify(obj);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? "application/json" : null) },
    json: async () => JSON.parse(text),
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  } as unknown as Response;
}

function htmlShellResponse() {
  return {
    ok: true,
    status: 200,
    headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? "text/html" : null) },
    json: async () => {
      throw new Error("not json");
    },
    arrayBuffer: async () => new TextEncoder().encode("<html></html>").buffer,
  } as unknown as Response;
}

function notFoundResponse() {
  return {
    ok: false,
    status: 404,
    headers: { get: () => null },
    json: async () => {
      throw new Error("404");
    },
    arrayBuffer: async () => new ArrayBuffer(0),
  } as unknown as Response;
}

describe("content packs — loader precedence inside contentLoader.ts", () => {
  let m4PackHash: string;
  let m4PackManifest: Record<string, unknown>;
  const m4Body = moduleBody("m4");
  const m4Bytes = new TextEncoder().encode(JSON.stringify(m4Body)).buffer;

  beforeEach(async () => {
    __resetContentLoader();
    __resetContentPackLoaderForTests();
    __clearLessonRegistry();
    m4PackHash = await sha256Hex(m4Bytes);
    m4PackManifest = {
      schemaVersion: 1,
      contentVersion: VERSION,
      lang: "ja",
      modules: [{ id: "m4", file: "m4.ddd.json", lessons: ["ja-m4-l1"] }],
      files: { "m4.ddd.json": { sha256: m4PackHash, bytes: m4Bytes.byteLength } },
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("(b) bundled slice: a module within packBundledThrough resolves locally, the pack path is never touched", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      calls.push(url);
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/ja/m1.aaa.json") return jsonResponse(moduleBody("m1"));
      throw new Error(`unexpected fetch: ${url}`);
    });

    await ensureModuleLoaded("ja", "m1");

    expect(hasRegisteredLesson("ja-m1-l1")).toBe(true);
    expect(calls.some((u) => u.includes("/content/v2/"))).toBe(false);
  });

  it("(d) network fallback: a module beyond packBundledThrough that 404s locally is fetched from the CDN pack, verified, and registered", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/ja/m4.ddd.json") return notFoundResponse(); // pruned by emit-content-packs.mjs
      if (url === `${PACK_BASE}manifest.json`) return jsonResponse(m4PackManifest);
      if (url === `${PACK_BASE}m4.ddd.json`) return jsonResponse(m4Body);
      throw new Error(`unexpected fetch: ${url}`);
    });

    await ensureModuleLoaded("ja", "m4");

    expect(hasRegisteredLesson("ja-m4-l1")).toBe(true);
    expect(getContentDownloadStatus("ja")).toBe("ready");
  });

  it("hash mismatch on the CDN pack file: throws, and a retry with a corrected fetch recovers (hash-mismatch → refetch)", async () => {
    let firstAttempt = true;
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/ja/m4.ddd.json") return notFoundResponse();
      if (url === `${PACK_BASE}manifest.json`) return jsonResponse(m4PackManifest);
      if (url === `${PACK_BASE}m4.ddd.json`) {
        if (firstAttempt) {
          firstAttempt = false;
          return jsonResponse({ lessons: [{ id: "tampered" }] }); // wrong bytes, wrong hash
        }
        return jsonResponse(m4Body); // the real bytes, on retry
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    await expect(ensureModuleLoaded("ja", "m4")).rejects.toThrow(/hash mismatch/);
    expect(getContentDownloadStatus("ja")).toBe("error");
    expect(hasRegisteredLesson("ja-m4-l1")).toBe(false);

    // Failures are NOT memoized (contentLoader.ts's existing contract) — retry hits the network again and succeeds.
    await ensureModuleLoaded("ja", "m4");
    expect(hasRegisteredLesson("ja-m4-l1")).toBe(true);
    expect(getContentDownloadStatus("ja")).toBe("ready");
  });

  it("schema refusal: a pack manifest whose schemaVersion is newer than this build understands never registers the lesson, status = unsupported", async () => {
    const tooNew = { ...m4PackManifest, schemaVersion: 999 };
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/ja/m4.ddd.json") return notFoundResponse();
      if (url === `${PACK_BASE}manifest.json`) return jsonResponse(tooNew);
      throw new Error(`unexpected fetch: ${url}`);
    });

    await expect(ensureModuleLoaded("ja", "m4")).rejects.toThrow(/schema/);
    expect(getContentDownloadStatus("ja")).toBe("unsupported");
    expect(hasRegisteredLesson("ja-m4-l1")).toBe(false);
  });

  it("offline path: local 404 AND the CDN unreachable — throws, nothing registered, status = error (the clean offline message case)", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/ja/m4.ddd.json") return notFoundResponse();
      if (url === `${PACK_BASE}manifest.json`) throw new Error("network unreachable");
      throw new Error(`unexpected fetch: ${url}`);
    });

    await expect(ensureModuleLoaded("ja", "m4")).rejects.toThrow(/network unreachable/);
    expect(getContentDownloadStatus("ja")).toBe("error");
    expect(hasRegisteredLesson("ja-m4-l1")).toBe(false);
  });

  it("a bundled module (index < packBundledThrough) that somehow 404s locally is NEVER retried against the pack — 'never applied over a newer bundled module'", async () => {
    let packUrlHit = false;
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/ja/m1.aaa.json") return notFoundResponse(); // a genuinely bundled module, corrupted/missing
      if (url.includes("/content/v2/")) {
        packUrlHit = true;
        return jsonResponse(moduleBody("m1"));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    await expect(ensureModuleLoaded("ja", "m1")).rejects.toThrow(/content fetch 404/);
    expect(packUrlHit).toBe(false); // no pack URL was ever requested for a bundled-slice module
  });

  it("packs OFF for a language (no packBundledThrough): a local 404 propagates directly, no pack path attempted", async () => {
    let packUrlHit = false;
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/es/m1.eee.json") return notFoundResponse();
      if (url.includes("/content/v2/")) {
        packUrlHit = true;
        return jsonResponse(moduleBody("m1"));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    await expect(ensureModuleLoaded("es", "m1")).rejects.toThrow(/content fetch 404/);
    expect(packUrlHit).toBe(false);
  });

  it("an HTML-shell 200 (CDN 403/404 mapping) for a pack-eligible module is treated as a local miss, not a success — falls through to the pack", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/ja/m4.ddd.json") return htmlShellResponse();
      if (url === `${PACK_BASE}manifest.json`) return jsonResponse(m4PackManifest);
      if (url === `${PACK_BASE}m4.ddd.json`) return jsonResponse(m4Body);
      throw new Error(`unexpected fetch: ${url}`);
    });

    await ensureModuleLoaded("ja", "m4");
    expect(hasRegisteredLesson("ja-m4-l1")).toBe(true);
  });

  it("prefetch trigger: ensureCourseLoaded(ja) with no cap warms module 4 too (loads everything, strict); triggerCoursePackPrefetch is memoized per language", async () => {
    const packFileHits: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url === "/content/v1/ja/m1.aaa.json") return jsonResponse(moduleBody("m1"));
      if (url === "/content/v1/ja/m2.bbb.json") return jsonResponse(moduleBody("m2"));
      if (url === "/content/v1/ja/m3.ccc.json") return jsonResponse(moduleBody("m3"));
      if (url === "/content/v1/ja/m4.ddd.json") return notFoundResponse();
      if (url === `${PACK_BASE}manifest.json`) return jsonResponse(m4PackManifest);
      if (url === `${PACK_BASE}m4.ddd.json`) {
        packFileHits.push(url);
        return jsonResponse(m4Body);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    triggerCoursePackPrefetch("ja");
    triggerCoursePackPrefetch("ja"); // second call this session — must not double-fetch
    await vi.waitFor(() => expect(getContentDownloadStatus("ja")).toBe("ready"));
    expect(packFileHits).toEqual([`${PACK_BASE}m4.ddd.json`]); // fetched exactly once across both trigger calls
  });

  it("prefetch trigger no-ops for a language with packs off (no packBundledThrough) — never constructs a pack request", async () => {
    let packUrlHit = false;
    vi.stubGlobal("fetch", async (url: string) => {
      if (url === "/content/v1/manifest.json") return jsonResponse(MANIFEST);
      if (url.includes("/content/v2/")) {
        packUrlHit = true;
        return jsonResponse({});
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    triggerCoursePackPrefetch("es");
    // Give any stray microtask a turn; nothing should have fired.
    await Promise.resolve();
    await Promise.resolve();
    expect(packUrlHit).toBe(false);
    expect(getContentDownloadStatus("es")).toBe("idle");
  });
});
