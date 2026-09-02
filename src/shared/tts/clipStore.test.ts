/**
 * Persistent TTS clip store — the thing that makes lessons work on a plane.
 *
 * Lesson CONTENT already ships inside the bundle, so the only piece missing
 * offline is the audio, which lives on the CDN. This store keeps a bounded,
 * LRU-evicted set of decoded-on-demand mp3 bytes so the current and next
 * module can be played with no network.
 *
 * The eviction policy is the part worth testing: a cap that evicts the wrong
 * clips is worse than no cache, because it burns bandwidth re-fetching the
 * clips the learner is actively drilling.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createClipStore, memoryAdapter, type ClipStoreAdapter } from "./clipStore";

const buf = (n: number) => new ArrayBuffer(n);

describe("clip store", () => {
  let adapter: ClipStoreAdapter;
  beforeEach(() => {
    adapter = memoryAdapter();
  });

  it("round-trips a clip", async () => {
    const store = createClipStore({ adapter, maxBytes: 1000 });
    await store.put("a.mp3", buf(10));
    const got = await store.get("a.mp3");
    expect(got?.byteLength).toBe(10);
  });

  it("misses cleanly for an unknown clip", async () => {
    const store = createClipStore({ adapter, maxBytes: 1000 });
    expect(await store.get("nope.mp3")).toBeNull();
  });

  it("evicts least-recently-used clips once the cap is exceeded", async () => {
    const store = createClipStore({ adapter, maxBytes: 100 });
    await store.put("old.mp3", buf(50));
    await store.put("mid.mp3", buf(40));
    // 90/100 used. This one forces an eviction.
    await store.put("new.mp3", buf(40));

    expect(await store.get("old.mp3")).toBeNull();
    expect((await store.get("mid.mp3"))?.byteLength).toBe(40);
    expect((await store.get("new.mp3"))?.byteLength).toBe(40);
    expect(await store.bytes()).toBeLessThanOrEqual(100);
  });

  it("treats a read as a use, so an actively-drilled clip survives eviction", async () => {
    const store = createClipStore({ adapter, maxBytes: 100 });
    await store.put("a.mp3", buf(45));
    await store.put("b.mp3", buf(45));
    // `a` is the older insert, but the learner just played it again.
    await store.get("a.mp3");
    await store.put("c.mp3", buf(45));

    expect((await store.get("a.mp3"))?.byteLength).toBe(45);
    expect(await store.get("b.mp3")).toBeNull();
  });

  it("never stores a clip larger than the whole cap", async () => {
    const store = createClipStore({ adapter, maxBytes: 100 });
    await store.put("huge.mp3", buf(500));
    expect(await store.get("huge.mp3")).toBeNull();
    expect(await store.bytes()).toBe(0);
  });

  it("survives an adapter that throws, rather than breaking playback", async () => {
    const broken: ClipStoreAdapter = {
      get: async () => {
        throw new Error("quota");
      },
      put: async () => {
        throw new Error("quota");
      },
      delete: async () => undefined,
      entries: async () => {
        throw new Error("quota");
      },
    };
    const store = createClipStore({ adapter: broken, maxBytes: 100 });
    // Caching is an optimisation; a failing store must degrade to "no cache",
    // never to "audio is broken".
    await expect(store.put("a.mp3", buf(10))).resolves.toBeUndefined();
    await expect(store.get("a.mp3")).resolves.toBeNull();
  });
});
