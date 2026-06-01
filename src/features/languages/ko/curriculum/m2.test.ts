import { describe, it, expect } from "vitest";
import { buildAllKoreanM2Lessons, KO_M2_ROWS } from "./m2";
import { validateRowVocab } from "./m1-rows";

describe("KO M2 curriculum", () => {
  it("every row's anchor words decompose into known blocks", () => {
    for (const row of KO_M2_ROWS) {
      expect(() => validateRowVocab(row)).not.toThrow();
    }
  });

  it("builds 9 rows × 3 sub-lessons + 1 y-vowel + 1 review = 29 lessons", () => {
    const lessons = buildAllKoreanM2Lessons();
    expect(lessons.length).toBe(29);
    expect(lessons.every((l) => l.moduleId === "m2")).toBe(true);
    expect(lessons.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const lessons = buildAllKoreanM2Lessons();
    const ids = new Set(lessons.map((l) => l.id));
    expect(ids.size).toBe(lessons.length);
  });
});
