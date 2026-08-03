import { describe, it, expect } from "vitest";
import { buildSpeakerColors, speakerColorAt } from "./speakerColor";

describe("speakerColor", () => {
  it("assigns by order of first appearance, not by key", () => {
    const a = buildSpeakerColors(["A", "B"]);
    const b = buildSpeakerColors(["B", "A"]);
    expect(a.get("A")).toEqual(speakerColorAt(0));
    expect(a.get("B")).toEqual(speakerColorAt(1));
    // Same keys, different order — the FIRST one seen takes slot 0 either way.
    expect(b.get("B")).toEqual(speakerColorAt(0));
    expect(b.get("A")).toEqual(speakerColorAt(1));
  });

  it("is stable across repeats — a re-appearing speaker keeps its colour", () => {
    const colors = buildSpeakerColors(["민수", "지수", "민수", "지수", "민수"]);
    expect(colors.size).toBe(2);
    expect(colors.get("민수")).toEqual(speakerColorAt(0));
    expect(colors.get("지수")).toEqual(speakerColorAt(1));
  });

  it("gives the two-speaker case (almost every piece) distinct slots", () => {
    expect(speakerColorAt(0)).not.toEqual(speakerColorAt(1));
  });

  it("wraps past the palette instead of returning undefined", () => {
    expect(speakerColorAt(99).text).toBeTruthy();
    expect(speakerColorAt(5)).toEqual(speakerColorAt(0));
  });
});
