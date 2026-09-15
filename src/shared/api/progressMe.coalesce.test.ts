/**
 * GET /progress/me refetch storm (TestFlight b19, 2026-09-15).
 *
 * Server logs show ~11 GET /progress/me from the iPad inside 5 seconds. The
 * callers are all legitimate and all different: the react-query hook, the
 * `invalidateQueries` + explicit `refetch()` pair in `LessonProgressHydrate`,
 * and the DIRECT `progress.getMe()` inside `hydrateLessonProgressFromServer`
 * — which runs on the boot sync, the 30s tick, and every lesson unmount
 * (`useLessonSyncSession`). react-query can only dedupe the ones that go
 * through react-query.
 *
 * So the dedupe belongs at the client: one in-flight promise per acting
 * user, plus a short tail so the "sync → invalidate → refetch" cascade that
 * every sync fires collapses into a single round-trip.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressApi, PROGRESS_ME_COALESCE_MS } from "./progress";

const SUMMARY = { user: { streak: 1, bestStreak: 1, lastActiveDate: null, xp: 0, level: 1, lingots: 0 }, lessons: [], concepts: [], last30days: [] };

function api(): ProgressApi {
  return new ProgressApi({
    baseUrl: "https://api.test",
    getAccessToken: () => Promise.resolve("token"),
    maxRetries: 0,
  });
}

describe("ProgressApi.getMe — one GET per boot wave", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(SUMMARY),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("collapses the observed 11-call boot wave into 1 network GET", async () => {
    const progress = api();

    // 4 concurrent (hook mount + hydrate effect + tick + lesson unmount)…
    await Promise.all([progress.getMe(), progress.getMe(), progress.getMe(), progress.getMe()]);
    // …then the sequential invalidate → refetch → direct-getMe cascade.
    for (let i = 0; i < 7; i++) await progress.getMe();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still refetches once the coalescing window has passed", async () => {
    const progress = api();
    await progress.getMe();
    vi.setSystemTime(Date.now() + PROGRESS_ME_COALESCE_MS + 1);
    await progress.getMe();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("honours an explicit force (pull-to-refresh, resume)", async () => {
    const progress = api();
    await progress.getMe();
    await progress.getMe(undefined, { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
