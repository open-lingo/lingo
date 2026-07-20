import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { M3_NEO_LESSONS } from "@/features/languages/ja/curriculum/m3-neo";
import { M4_NEO_LESSONS } from "@/features/languages/ja/curriculum/m4-neo";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("probe", () => {
  it("prints step types", () => {
    const types = new Set<string>();
    const counts: Record<string, number> = {};
    let totalSteps = 0;
    for (const lesson of [...M3_NEO_LESSONS, ...M4_NEO_LESSONS]) {
      const rendered = getMockLessonContent(lesson.id);
      expect(rendered).not.toBeNull();
      for (const s of rendered!.steps) {
        types.add(s.type);
        counts[s.type] = (counts[s.type] ?? 0) + 1;
        totalSteps++;
      }
    }
    fs.writeFileSync(
      "/tmp/claude-1000/-mnt-c-Users-Spencer/4836ded2-8756-440c-b984-e287d17b91a7/scratchpad/steptypes-out.json",
      JSON.stringify(
        {
          types: [...types].sort(),
          counts,
          totalSteps,
          lessonCount: M3_NEO_LESSONS.length + M4_NEO_LESSONS.length,
        },
        null,
        2,
      ),
    );
  });
});
