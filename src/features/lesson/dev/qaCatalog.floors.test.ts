import { describe, it, expect, vi } from "vitest";

/**
 * `buildStepTypeCoverage` only ever reads `step.type` off the returned
 * content — it must pass `{ floors: false }` to `getMockLessonContent` so
 * the whole-course walk doesn't pay to build the match-pairs frequency
 * index over every lesson (`padMatchPairsFloor`, on by default), which is
 * what hung the `/:lang/qa` dev hub for minutes (see
 * `GetLessonContentOptions` in `../data/mockLessons`).
 *
 * Mocked in its own file (rather than added to `qaCatalog.test.ts`) so the
 * `vi.mock` of `../data/mockLessons` doesn't shadow that file's other tests,
 * which exercise the real lesson registry.
 */
const getMockLessonContent = vi.fn(
  (_lessonId: string, _options?: { floors?: boolean }) => null,
);
const getAvailableMockLessonIds = vi.fn(() => ["ja-m1-1"]);

vi.mock("../data/mockLessons", () => ({
  getAvailableMockLessonIds: () => getAvailableMockLessonIds(),
  getMockLessonContent: (
    lessonId: string,
    options?: { floors?: boolean },
  ) => getMockLessonContent(lessonId, options),
}));

describe("qaCatalog — whole-course walk skips match-pair floors", () => {
  it("passes floors:false to getMockLessonContent", async () => {
    const { buildStepTypeCoverage } = await import("./qaCatalog");
    buildStepTypeCoverage("ja");

    expect(getMockLessonContent).toHaveBeenCalledWith("ja-m1-1", {
      floors: false,
    });
  });
});
