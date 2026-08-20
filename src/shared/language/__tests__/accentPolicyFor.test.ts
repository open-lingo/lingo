/**
 * `accentPolicyFor` — the one seam TranslateStepView uses to pick up a
 * language's typed-answer accent policy (fr pin F5). Total: undefined for
 * languages without the capability, for unregistered ids, and for the null
 * language the context holds pre-selection — the view must never throw on
 * a grading path.
 */
import { describe, it, expect } from "vitest";
import { accentPolicyFor } from "../registry";

describe("accentPolicyFor", () => {
  it("returns the FR policy with the F5 pairs", () => {
    const p = accentPolicyFor("fr");
    expect(p).toBeDefined();
    expect(p!.protectedFoldedForms.has("ou")).toBe(true);
  });

  it("is undefined for a language without the capability (es)", () => {
    expect(accentPolicyFor("es")).toBeUndefined();
  });

  it("is undefined — not a throw — for unknown or missing ids", () => {
    expect(accentPolicyFor("xx")).toBeUndefined();
    expect(accentPolicyFor(undefined)).toBeUndefined();
  });
});
