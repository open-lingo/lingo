import { describe, it, expect } from "vitest";
import { buildPortugueseCourse } from "./index";
import structure from "./structure.generated.json";

/**
 * `structure.generated.json` is what `mockCourse.ts` ships for the pt
 * pathway (mirrors es/fr's structure.test.ts — PTHOME lane, 2026-09-18) so
 * the main bundle never imports the module TS. It is written by
 * `npm run content:emit`; this test is the stale guard.
 */
describe("pt course structure", () => {
  // Vacuity sweep (mirrors es/fr): a deepEqual against a live build output
  // still passes if BOTH sides collapse to an empty array — pin the module
  // list non-empty first.
  it("has at least one module", () => {
    expect(structure.length).toBeGreaterThan(0);
  });

  it("matches the curriculum (run `npm run content:emit` if this fails)", () => {
    expect(structure).toEqual(JSON.parse(JSON.stringify(buildPortugueseCourse())));
  });
});
