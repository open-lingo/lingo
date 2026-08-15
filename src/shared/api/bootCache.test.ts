import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  BOOT_MISS,
  registerBootFetcher,
  resetBootCache,
  serveFromBoot,
  type BootData,
} from "./bootCache";

const BASE = "https://api.example.com/api/core/v1";

const payload: BootData = {
  user: { id: "u1" },
  settings: { theme: "dark" },
  progress: { xp: 10 },
  unlocks: { unlockedAtoms: ["a"] },
  touch: { streakUpdated: false },
  srs: { cards: [] },
  quests: { items: [] },
  subscriptions: null, // best-effort section absent in this env
};

describe("bootCache", () => {
  beforeEach(() => {
    resetBootCache();
  });

  it("answers the whole boot wave from one fetch, single-use per path", async () => {
    const fetcher = vi.fn().mockResolvedValue(payload);
    registerBootFetcher(fetcher);

    // The wave, concurrently — exactly one /boot fetch.
    const wave = await Promise.all([
      serveFromBoot("GET", `${BASE}/users/me`, null),
      serveFromBoot("GET", `${BASE}/users/me/settings`, null),
      serveFromBoot("GET", `${BASE}/progress/me`, null),
      serveFromBoot("POST", `${BASE}/progress/me/touch`, null),
      serveFromBoot("GET", `${BASE}/srs/state`, null),
      serveFromBoot("GET", `${BASE}/quests`, null),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(wave).toEqual([
      payload.user,
      payload.settings,
      payload.progress,
      payload.touch,
      payload.srs,
      payload.quests,
    ]);

    // A refetch of an already-served path is a real refetch — miss.
    expect(await serveFromBoot("GET", `${BASE}/progress/me`, null)).toBe(BOOT_MISS);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("misses on query strings, unknown paths, and null sections", async () => {
    registerBootFetcher(vi.fn().mockResolvedValue(payload));

    expect(
      await serveFromBoot("GET", `${BASE}/users/me/subscriptions?content_type=deck`, null),
    ).toBe(BOOT_MISS);
    expect(await serveFromBoot("GET", `${BASE}/decks/batch`, null)).toBe(BOOT_MISS);
    // subscriptions section is null in this payload → network.
    expect(await serveFromBoot("GET", `${BASE}/users/me/subscriptions`, null)).toBe(BOOT_MISS);
  });

  it("never serves across impersonation targets, and batches once per target", async () => {
    const fetcher = vi.fn().mockResolvedValue(payload);
    registerBootFetcher(fetcher);

    expect(await serveFromBoot("GET", `${BASE}/users/me`, null)).toEqual(payload.user);
    // Same batch, different acting user → miss (no cross-user data).
    expect(await serveFromBoot("GET", `${BASE}/users/me/settings`, "user-2")).toBe(BOOT_MISS);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("falls through to the network when /boot fails (new-user 404 flow)", async () => {
    registerBootFetcher(vi.fn().mockRejectedValue(new Error("404")));

    expect(await serveFromBoot("GET", `${BASE}/users/me`, null)).toBe(BOOT_MISS);
    expect(await serveFromBoot("GET", `${BASE}/users/me/settings`, null)).toBe(BOOT_MISS);
  });
});
