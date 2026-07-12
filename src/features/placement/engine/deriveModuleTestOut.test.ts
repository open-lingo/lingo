import { describe, it, expect } from "vitest";
import {
  deriveModuleTestOut,
  collectGradable,
  TESTOUT_FORMATS,
  TESTOUT_SIZE,
} from "./deriveModuleTestOut";

const SHIPPED = ["m3","m4","m5","m6","m7","m8","m9","m10","m11","m12","m13","m14","m15","m16","m17"];

describe("deriveModuleTestOut", () => {
  it("every shipped module yields a full-size, format-legal, covering test-out", () => {
    for (const mid of SHIPPED) {
      const d = deriveModuleTestOut(mid);
      // 10 questions (modules have hundreds of gradable steps, so always full).
      expect(d.steps.length, `${mid} size`).toBe(TESTOUT_SIZE);
      // Only allowed formats — no speaking/dialogue/symbol drills.
      for (const it of d.items) {
        expect(TESTOUT_FORMATS.has(it.format), `${mid} bad format ${it.format}`).toBe(true);
      }
      // Covers every skill section the module teaches (when it has ≤10),
      // else covers 10 distinct sections.
      const expectCovered = Math.min(d.sectionsTotal, TESTOUT_SIZE);
      expect(d.sectionsCovered, `${mid} coverage ${d.sectionsCovered}/${d.sectionsTotal}`)
        .toBeGreaterThanOrEqual(expectCovered);
      // No duplicate step ids (module is big enough).
      const ids = d.items.map((i) => (i.step as { id: string }).id);
      expect(new Set(ids).size, `${mid} dupes`).toBe(ids.length);
    }
  });

  it("excludes speaking/dialogue/symbol formats from the pool", () => {
    const withSpeaking = new Set([...TESTOUT_FORMATS, "speaking", "dialogue_listen"]);
    const legal = collectGradable("m10");
    const all = collectGradable("m10", withSpeaking);
    expect(all.length).toBeGreaterThan(legal.length); // speaking exists but is excluded by default
    expect(legal.every((i) => i.format !== "speaking")).toBe(true);
    expect(legal.every((i) => i.format !== "dialogue_listen")).toBe(true);
  });

  it("is deterministic — same module yields the same picks", () => {
    const a = deriveModuleTestOut("m14").items.map((i) => (i.step as { id: string }).id);
    const b = deriveModuleTestOut("m14").items.map((i) => (i.step as { id: string }).id);
    expect(a).toEqual(b);
  });
});
