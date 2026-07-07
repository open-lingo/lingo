import { describe, it, expect } from "vitest";
import { parseKnownItemsExport, ImportParseError } from "./parse";

const validItem = {
  expression: "見る",
  reading: "みる",
  meaning: "see, look at",
  evidence: {
    class: "active",
    intervalDays: 120,
    reps: 8,
    lapses: 1,
    lastReviewAt: "2026-04-18",
    source: "Core 2000::Step 01",
  },
};

const validExport = {
  version: 1,
  language: "ja",
  source: "anki",
  exportedAt: "2026-07-07T18:00:00Z",
  items: [validItem],
};

describe("parseKnownItemsExport — valid", () => {
  it("accepts a well-formed export and narrows it", () => {
    const parsed = parseKnownItemsExport(validExport);
    expect(parsed.language).toBe("ja");
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].expression).toBe("見る");
    expect(parsed.items[0].evidence.intervalDays).toBe(120);
  });

  it("accepts items with only the required fields", () => {
    const parsed = parseKnownItemsExport({
      ...validExport,
      items: [{ expression: "水", evidence: { class: "active", intervalDays: 0, reps: 1, lapses: 0 } }],
    });
    expect(parsed.items[0].reading).toBeUndefined();
    expect(parsed.items[0].meaning).toBeUndefined();
    expect(parsed.items[0].evidence.lastReviewAt).toBeUndefined();
  });

  it("tolerates unknown extra fields (forward-compat)", () => {
    const parsed = parseKnownItemsExport({
      ...validExport,
      future: "field",
      items: [{ ...validItem, extra: 1, evidence: { ...validItem.evidence, extra: 2 } }],
    });
    expect(parsed.items).toHaveLength(1);
    expect((parsed as unknown as Record<string, unknown>).future).toBeUndefined();
  });
});

describe("parseKnownItemsExport — invalid", () => {
  it("rejects non-object input", () => {
    expect(() => parseKnownItemsExport(null)).toThrow(ImportParseError);
    expect(() => parseKnownItemsExport("[]")).toThrow(ImportParseError);
  });

  it("enforces version === 1", () => {
    expect(() => parseKnownItemsExport({ ...validExport, version: 2 })).toThrow(
      /version/i,
    );
  });

  it("rejects a missing items array", () => {
    const { items: _omit, ...rest } = validExport;
    expect(() => parseKnownItemsExport(rest)).toThrow(/items/i);
  });

  it("rejects an empty expression", () => {
    expect(() =>
      parseKnownItemsExport({ ...validExport, items: [{ ...validItem, expression: "  " }] }),
    ).toThrow(/expression/i);
  });

  it("rejects a bad evidence.class", () => {
    expect(() =>
      parseKnownItemsExport({
        ...validExport,
        items: [{ ...validItem, evidence: { ...validItem.evidence, class: "suspended" } }],
      }),
    ).toThrow(/class/i);
  });

  it("rejects non-numeric evidence numbers", () => {
    expect(() =>
      parseKnownItemsExport({
        ...validExport,
        items: [{ ...validItem, evidence: { ...validItem.evidence, reps: "8" } }],
      }),
    ).toThrow(/reps/i);
  });

  it("carries the item index in the message", () => {
    expect(() =>
      parseKnownItemsExport({
        ...validExport,
        items: [validItem, { expression: "" }],
      }),
    ).toThrow(/item\[1\]/);
  });
});
