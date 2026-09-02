import { describe, it, expect } from "vitest";
import { resolveGradingLayout } from "./gradingLayout";

describe("resolveGradingLayout", () => {
  it("honors an explicit 'simple' preference", () => {
    expect(resolveGradingLayout("simple")).toBe("simple");
  });

  it("honors an explicit 'full' preference", () => {
    expect(resolveGradingLayout("full")).toBe("full");
  });

  it("defaults to 'simple' — two buttons are the default for everyone", () => {
    expect(resolveGradingLayout(undefined)).toBe("simple");
  });

  it("is a pure function of the preference — no history can promote it", () => {
    // Regression guard for the DELETED `hasAnyReviewedCard` branch (Spencer,
    // 2026-09-02): the reviewer used to grow from two buttons to four the
    // moment the learner had graded a single card, silently, between session
    // one and session two. The resolver now takes nothing but the stored
    // preference, so there is no input that could do that again.
    expect(resolveGradingLayout.length).toBe(1);
    expect(resolveGradingLayout(undefined)).toBe("simple");
  });
});
