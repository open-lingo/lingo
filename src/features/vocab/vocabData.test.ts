import { describe, it, expect } from "vitest";
import { buildVocabRows, filterVocab, sortVocab, moduleLabel, moduleOrder } from "./vocabData";
import type { ConceptRollup } from "@/shared/api/progress";

describe("buildVocabRows", () => {
  it("returns nothing for non-JA languages", () => {
    expect(buildVocabRows("ko", [])).toEqual([]);
  });

  it("builds JA rows and tags untouched words as new", () => {
    const rows = buildVocabRows("ja", []);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.id.startsWith("ja:"))).toBe(true);
    expect(rows.every((r) => r.tier === "new")).toBe(true);
  });

  it("merges mastery from concept rollups", () => {
    const rows = buildVocabRows("ja", []);
    const sample = rows[0];
    const concept: ConceptRollup = {
      conceptId: sample.id,
      encounters: 6,
      correctCount: 6,
      incorrectCount: 0,
      recentResults: [true, true, true, true],
      firstSeenAt: "2026-06-01",
      lastSeenAt: "2026-06-10",
    };
    const merged = buildVocabRows("ja", [concept]).find((r) => r.id === sample.id)!;
    expect(merged.tier).toBe("strong");
    expect(merged.recentStrength).toBe(100);
    expect(merged.encounters).toBe(6);
  });
});

describe("filterVocab", () => {
  const rows = buildVocabRows("ja", []);

  it("filters by free-text search across romaji/meaning", () => {
    const out = filterVocab(rows, { module: [], kind: [], mastery: [] }, rows[0].romaji);
    expect(out.some((r) => r.id === rows[0].id)).toBe(true);
  });

  it("filters by kind", () => {
    const particles = filterVocab(rows, { module: [], kind: ["particle"], mastery: [] }, "");
    expect(particles.every((r) => r.kind === "particle")).toBe(true);
  });

  it("filters by mastery tier", () => {
    const out = filterVocab(rows, { module: [], kind: [], mastery: ["new"] }, "");
    expect(out.length).toBe(rows.length); // all untouched are new
  });
});

describe("sortVocab", () => {
  it("orders weakest mastery first", () => {
    const rows = [
      { tier: "strong", module: "m1", romaji: "a" },
      { tier: "weak", module: "m1", romaji: "b" },
    ] as ReturnType<typeof buildVocabRows>;
    expect(sortVocab(rows)[0].tier).toBe("weak");
  });
});

describe("module helpers", () => {
  it("labels and orders modules", () => {
    expect(moduleLabel("m3")).toBe("Module 3");
    expect(moduleLabel("future")).toBe("Upcoming");
    expect(moduleOrder("m2")).toBeLessThan(moduleOrder("m10"));
    expect(moduleOrder("m5")).toBeLessThan(moduleOrder("future"));
  });
});
