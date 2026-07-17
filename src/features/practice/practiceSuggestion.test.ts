import { describe, it, expect } from "vitest";
import {
  pickSuggestion,
  buildQuickStarts,
  moduleNumber,
  ROTATION_PILLAR_IDS,
  type Suggestion,
} from "./practiceSuggestion";
import type { Pillar } from "./pillars";
import type { DueReview } from "@/features/lesson/data/moduleReviewSchedule";

const pillar = (id: string): Pillar => ({
  id: id as Pillar["id"],
  icon: "target",
  titleKey: `k.${id}`,
  titleDefault: id,
  taglineKey: `t.${id}`,
  taglineDefault: "",
  route: `practice/${id}`,
  activities: [],
});
const allPillars = ["vocabulary", ...ROTATION_PILLAR_IDS].map(pillar);
const base = {
  dueCount: 0,
  totalCards: 100,
  dueReviews: [] as DueReview[],
  pillars: allPillars,
  langId: "ja",
  dayIndex: 0,
  reviewModuleIdFor: (m: string) => `${m}r`,
};

describe("pickSuggestion", () => {
  it("prioritizes due SRS cards", () => {
    expect(pickSuggestion({ ...base, dueCount: 12 })).toEqual({
      kind: "srs",
      dueCount: 12,
      to: "practice/flashcards/review",
    });
  });

  it("falls to module reviews when no cards are due", () => {
    expect(
      pickSuggestion({ ...base, dueReviews: [{ moduleId: "m4" } as DueReview] }),
    ).toEqual({ kind: "module", moduleId: "m4", to: "learn/lessons/ja-m4r-1" });
  });

  it("rotates a skill pillar when caught up, stable within a day", () => {
    const a = pickSuggestion({ ...base, dayIndex: 0 });
    const b = pickSuggestion({ ...base, dayIndex: 0 });
    expect(a).toEqual(b);
    expect(a.kind).toBe("pillar");
    if (a.kind === "pillar") expect(a.pillar.id).toBe("grammar");
  });

  it("advances the rotation across days", () => {
    const d0 = pickSuggestion({ ...base, dayIndex: 0 });
    const d1 = pickSuggestion({ ...base, dayIndex: 1 });
    if (d0.kind === "pillar" && d1.kind === "pillar")
      expect(d0.pillar.id).not.toBe(d1.pillar.id);
    else throw new Error("expected pillar suggestions");
  });

  it("suggests starting for a brand-new user with no cards", () => {
    expect(pickSuggestion({ ...base, totalCards: 0 })).toEqual({
      kind: "start",
      to: "practice/flashcards",
    });
  });
});

describe("buildQuickStarts", () => {
  const srs: Suggestion = { kind: "srs", dueCount: 12, to: "practice/flashcards/review" };

  it("excludes the chip that duplicates the primary suggestion", () => {
    const chips = buildQuickStarts({
      suggestion: srs,
      dueCount: 12,
      dueReviews: [],
      langId: "ja",
      reviewModuleIdFor: (m) => m,
    });
    expect(chips.some((c) => c.to === "practice/flashcards/review")).toBe(false);
    expect(chips.some((c) => c.to === "practice/flashcards")).toBe(true);
  });

  it("includes a module-review chip when a module is due and it isn't primary", () => {
    const chips = buildQuickStarts({
      suggestion: srs,
      dueCount: 12,
      dueReviews: [{ moduleId: "m4" } as DueReview],
      langId: "ja",
      reviewModuleIdFor: (m) => `${m}r`,
    });
    expect(chips.some((c) => c.to === "learn/lessons/ja-m4r-1")).toBe(true);
    expect(chips.length).toBeLessThanOrEqual(3);
  });
});

describe("moduleNumber", () => {
  it("extracts the numeric part", () => {
    expect(moduleNumber("m4")).toBe("4");
    expect(moduleNumber("m12")).toBe("12");
  });
});
