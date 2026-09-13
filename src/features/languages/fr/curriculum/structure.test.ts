import { describe, it, expect } from "vitest";
import { buildFrenchCourse } from "./index";
import structure from "./structure.generated.json";

/**
 * `structure.generated.json` is what `mockCourse.ts` ships for the FR
 * pathway (content-as-data, 2026-09-13) so the main bundle never imports the
 * module TS. It is written by `npm run content:emit`; this test is the
 * stale guard.
 */
describe("fr course structure", () => {
  it("matches the curriculum (run `npm run content:emit` if this fails)", () => {
    expect(structure).toEqual(JSON.parse(JSON.stringify(buildFrenchCourse())));
  });
});
