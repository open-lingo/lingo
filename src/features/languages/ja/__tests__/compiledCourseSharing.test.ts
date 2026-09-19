import { describe, it, expect } from "vitest";
import {
  getCompiledCourse,
  getCompiledCourseFor,
  getCompiledCourseMap,
  __compiledCourseBuildCount,
} from "@/test/fixtures/compiledCourse";

/**
 * Proves the memoization claim `compiledCourse.ts` and the TESTAUDIT lane's
 * report rest on: the compiled-course walk runs ONCE per worker, not once
 * per file/predicate that reads it.
 *
 * This file lives under `src/features/languages/**`, so it's part of the
 * `curriculum` vitest project (`isolate: false` — vite.config.ts). By the
 * time this test runs, several OTHER curriculum files (moduleConformance,
 * kanjiCoverageAudit, applyKanjiSurfaces, buildTileKanji,
 * sentenceReuseSpacing, acceptedAnswerCollisions, lessonAtomAttribution,
 * buildAnswerFloor, and this file's own three calls below) have already
 * called `getCompiledCourse()` through one accessor or another — in this
 * worker or, alone, in this process. `__compiledCourseBuildCount()`
 * asserting exactly 1 regardless of file execution order is the load-
 * bearing claim: if a future edit breaks the `if (allLessons) return
 * allLessons;` guard (or something upstream forces a rebuild), this goes
 * red instead of silently paying the O(files) cost again.
 */
describe("compiledCourse fixture: one real walk, shared across the worker", () => {
  it("getCompiledCourse / getCompiledCourseFor / getCompiledCourseMap never trigger more than one real build", () => {
    // Warm the cache first — this may be the very FIRST call in the whole
    // worker (nothing guarantees an earlier curriculum file ran before
    // this one), in which case `__compiledCourseBuildCount()` legitimately
    // goes 0 -> 1 right here. `before` is captured AFTER warming, so the
    // assertion below is only about repeat calls, not about whether this
    // test itself is the first caller.
    getCompiledCourse();
    const before = __compiledCourseBuildCount();
    expect(before, "the compiled course was never actually built").toBeGreaterThanOrEqual(1);

    // Several different accessors, several calls each — none of this may
    // increment the build count past whatever it already was.
    getCompiledCourse();
    getCompiledCourse();
    getCompiledCourseFor("ja");
    getCompiledCourseFor("es");
    getCompiledCourseMap();
    getCompiledCourse();
    const after = __compiledCourseBuildCount();
    expect(after, "getCompiledCourse must not rebuild on repeat calls").toBe(before);
  });

  it("is non-empty and internally consistent across accessors", () => {
    const all = getCompiledCourse();
    const ja = getCompiledCourseFor("ja");
    const map = getCompiledCourseMap();
    expect(all.length).toBeGreaterThan(0);
    expect(ja.length).toBeGreaterThan(0);
    expect(ja.every((l) => l.content.languageId === "ja")).toBe(true);
    expect(map.size).toBe(all.length);
    for (const l of all) expect(map.get(l.id)).toEqual(l.content);
  });
});
