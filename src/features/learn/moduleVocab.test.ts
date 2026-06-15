import { describe, it, expect, beforeEach } from "vitest";
import {
  getModuleVocab,
  getCourseVocabCount,
  __resetModuleVocab,
} from "./moduleVocab";

describe("moduleVocab", () => {
  beforeEach(() => {
    __resetModuleVocab();
  });

  it("returns real JA vocab attributed to a module with label + meaning", () => {
    const m1 = getModuleVocab("ja", "m1");
    expect(m1.length).toBeGreaterThan(0);
    for (const entry of m1) {
      expect(entry.label).toBeTruthy();
      expect(entry.meaning).toBeTruthy();
    }
    // M1 (pure hiragana) introduces e.g. "house" (いえ).
    expect(m1.some((e) => e.meaning === "house")).toBe(true);
  });

  it("returns an empty list for unattributed / unknown modules", () => {
    expect(getModuleVocab("ja", "does-not-exist")).toEqual([]);
  });

  it("returns an empty list for languages without an atom catalog", () => {
    expect(getModuleVocab("xx", "m1")).toEqual([]);
    expect(getCourseVocabCount("xx")).toBe(0);
  });

  it("course vocab count is the sum of per-module counts", () => {
    const m1 = getModuleVocab("ja", "m1").length;
    const total = getCourseVocabCount("ja");
    expect(total).toBeGreaterThanOrEqual(m1);
    expect(total).toBeGreaterThan(0);
  });
});
