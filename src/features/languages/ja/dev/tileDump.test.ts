/**
 * Whole-course compiled-step dump — the "tile diff" registration procedure
 * (m22/m25, see docs/RUN-PLAN-n4.md), mechanized.
 *
 * Registering a courseAtoms row can re-attribute token boundaries in ANY
 * later module's tiles ([[atom-registration-ripples-forward]]). The
 * mitigation is a before/after diff of every compiled step in the course:
 *
 *   TILE_DUMP_OUT=/tmp/ja-before.txt npx vitest run --project curriculum \
 *     src/features/languages/ja/dev/tileDump.test.ts
 *   # ...register atoms...
 *   TILE_DUMP_OUT=/tmp/ja-after.txt npx vitest run --project curriculum \
 *     src/features/languages/ja/dev/tileDump.test.ts
 *   diff /tmp/ja-before.txt /tmp/ja-after.txt   # must be EMPTY (or only
 *                                               # the change you intended)
 *
 * Skips (does nothing) unless TILE_DUMP_OUT is set.
 */
import { writeFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";

const OUT = process.env.TILE_DUMP_OUT;

describe.skipIf(!OUT)("JA whole-course step dump", () => {
  it("dumps every compiled step", () => {
    const lines: string[] = [];
    for (const lessonId of getAvailableMockLessonIds()) {
      const lesson = getMockLessonContent(lessonId);
      if (!lesson || lesson.languageId !== "ja") continue;
      lesson.steps.forEach((step, i) => {
        lines.push(`${lesson.moduleId}/${lessonId}/${i}\t${JSON.stringify(step)}`);
      });
    }
    expect(lines.length).toBeGreaterThan(1000);
    writeFileSync(OUT!, lines.join("\n") + "\n");
  });
});
