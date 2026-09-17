import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * A8b (2026-09-17, docs/learning-loop-2026-09-17.md §2) — regression pin.
 *
 * ROOT CAUSE of the reviewSplit.test.ts / switchoverBeatIntegration.test.ts
 * slowdown (6.88s -> 13.12s at f18311e1, per the lead's measurement) was
 * NOT the `reviewGridsFromFsrs` flag machinery — that path was already
 * correctly gated (`fsrsOrdering?.enabled` guards the only line that calls
 * `selectReviewCandidatesByFsrs`/`getSRSStore`; see buildTileFloor.test.ts's
 * "flag off: never touches the live FSRS store" pin).
 *
 * The real cost is `recordReviewStepsServed`, which f18311e1 wired into
 * `getMockLessonContent` UNCONDITIONALLY (task 2's always-on telemetry,
 * §3a of the doc). `GetLessonContentOptions.floors` already exists
 * specifically so the sentence miner's whole-course walk
 * (`minedSentences.ts`'s `buildIndexesInner`, which calls
 * `getMinedLessonReader()!(id, { floors: false })` for EVERY lesson in the
 * course to mine example sentences) stays cheap — see that option's own
 * doc comment. Calling `recordReviewStepsServed` regardless of `floors`
 * defeated that: under happy-dom (`window` is defined in tests),
 * `switchoverBeatIntegration.test.ts` alone — which never calls
 * `getMockLessonContent` directly — was measured triggering 25,883 calls
 * to `logSessionEvent` (via the miner's internal `floors:false` reads),
 * ~2.9-3.1s of which was `persist()`'s synchronous
 * `JSON.stringify`-to-localStorage. Confirmed with a counting spy + stack
 * trace: every call bottomed out at
 * `buildIndexesInner (minedSentences.ts) -> getMockLessonContent
 * (mockLessons.ts:261) -> recordReviewStepsServed`.
 *
 * The fix: gate `recordReviewStepsServed` on the SAME `floors` flag that
 * already means "this is a real, learner-facing serve" vs. "an internal
 * read." Invariant: `floors:false` (or any call that resolves to it, like
 * the miner's) must never touch telemetry — 0 calls, not just fewer.
 */

const logReviewGridServed = vi.fn();
vi.mock("@/shared/telemetry/sessionLog", () => ({
  logReviewGridServed: (...args: unknown[]) => logReviewGridServed(...args),
}));

beforeEach(() => {
  logReviewGridServed.mockClear();
});

describe("getMockLessonContent — review-grid telemetry is floors-gated (A8b)", () => {
  it("floors:false (the miner's internal-read shape) never logs telemetry", async () => {
    const { getMockLessonContent } = await import("./mockLessons");
    const lesson = getMockLessonContent("ja-m7-neo-1", { floors: false });
    expect(lesson).toBeTruthy();
    expect(logReviewGridServed).not.toHaveBeenCalled();
  });

  it("a real serve (floors default true) still logs telemetry", async () => {
    const { getMockLessonContent } = await import("./mockLessons");
    const lesson = getMockLessonContent("ja-m7-neo-1");
    expect(lesson).toBeTruthy();
    expect(logReviewGridServed.mock.calls.length).toBeGreaterThan(0);
  });

  it("floors:false explicitly still gates even though the flag default is on", async () => {
    // Same call, but with floors passed explicitly true/false back to back,
    // to rule out "it only worked because floors happened to default true
    // in the other test" — this is the exact shape the miner's reader uses.
    const { getMockLessonContent } = await import("./mockLessons");
    getMockLessonContent("ja-m7-neo-1", { floors: false });
    expect(logReviewGridServed).not.toHaveBeenCalled();
    getMockLessonContent("ja-m7-neo-1", { floors: true });
    expect(logReviewGridServed.mock.calls.length).toBeGreaterThan(0);
  });

  it("recordTelemetry:false suppresses telemetry WITHOUT changing floors (lessonAtomIndex.ts's shape)", async () => {
    // lessonAtomIndex.ts's atom-attribution walk needs the REAL padded
    // content (it reads step.tiles) so it can't pass floors:false, but it's
    // still a background/cached lookup, not a learner-facing serve — it
    // passes { recordTelemetry: false } instead. Content must be identical
    // to the telemetry-on call; only the side effect differs.
    const { getMockLessonContent } = await import("./mockLessons");
    const withTelemetry = getMockLessonContent("ja-m7-neo-1");
    logReviewGridServed.mockClear();
    const withoutTelemetry = getMockLessonContent("ja-m7-neo-1", {
      recordTelemetry: false,
    });
    expect(logReviewGridServed).not.toHaveBeenCalled();
    expect(withoutTelemetry).toEqual(withTelemetry);
  });
});
