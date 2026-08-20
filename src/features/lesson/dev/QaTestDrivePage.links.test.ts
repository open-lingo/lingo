import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getMockLessonContent } from "../data/mockLessons";

// B097: this page rotted to 37 dead lesson links because ids were typed by
// hand and nothing checked them — the stale-id sweep only REPORTED dev pages.
// This makes the contract binding: every /learn/lessons/<id> href on the QA
// test-drive page must resolve to live lesson content.
describe("QaTestDrivePage lesson links", () => {
  it("every linked lesson id resolves to live content", () => {
    // cwd is the repo root under vitest; import.meta.url is http-scheme in
    // the happy-dom environment, so resolve from the root instead.
    const src = readFileSync(
      "src/features/lesson/dev/QaTestDrivePage.tsx",
      "utf-8",
    );
    const ids = [...src.matchAll(/\/learn\/lessons\/(ja-[\w-]+)/g)].map(
      (m) => m[1],
    );
    expect(ids.length).toBeGreaterThan(8);
    const dead = [...new Set(ids)].filter(
      (id) => getMockLessonContent(id) === null,
    );
    expect(dead).toEqual([]);
  });
});
