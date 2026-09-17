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
  // Vacuity sweep 2026-09-17 (lane A5c): a deepEqual against a live build
  // output still passes if BOTH sides collapse to an empty array (a broken
  // import, an accidentally-emptied curriculum) — the drift check would
  // never fire. Pin the module list non-empty first.
  it("has at least one module", () => {
    expect(structure.length).toBeGreaterThan(0);
  });

  it("matches the curriculum (run `npm run content:emit` if this fails)", () => {
    expect(structure).toEqual(JSON.parse(JSON.stringify(buildFrenchCourse())));
  });
});
