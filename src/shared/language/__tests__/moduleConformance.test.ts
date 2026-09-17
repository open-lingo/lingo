/**
 * Module conformance test — runs against every registered language module
 * to ensure the contract from ADR-001 + ADR-005 is satisfied.
 */

import { describe, it, expect } from "vitest";
import {
  getAllLanguageIds,
  getLanguageModule,
} from "@/shared/language/registry";

describe.each(getAllLanguageIds())("language module: %s", (langId) => {
  const m = getLanguageModule(langId);

  it("has required identity fields", () => {
    expect(m.id).toBe(langId);
    expect(m.displayName.en).toBeTruthy();
    expect(m.displayName.native).toBeTruthy();
    expect(m.scriptFont).toBeTruthy();
    expect(["ltr", "rtl"]).toContain(m.textDirection);
  });

  it("has a courseId", () => {
    expect(typeof m.courseId).toBe("string");
    expect(m.courseId.length).toBeGreaterThan(0);
  });

  it("has a curriculum", () => {
    expect(Array.isArray(m.curriculum)).toBe(true);
  });

  it("has a courseAtoms list", () => {
    expect(Array.isArray(m.courseAtoms)).toBe(true);
  });

  it("has all required content + assets + placement", () => {
    expect(m.grammarHelpers).toBeDefined();
    expect(m.ttsManifest).toBeDefined();
    expect(m.vocabArt).toBeDefined();
    expect(m.placementBank).toBeDefined();
  });

  it("atom ids are prefixed with the language id", () => {
    for (const atom of m.courseAtoms) {
      expect(atom.id.startsWith(`${langId}:`)).toBe(true);
      expect(atom.languageId).toBe(langId);
    }
  });
});

describe("registry behavior", () => {
  it("throws a useful error for unknown language ids", () => {
    expect(() => getLanguageModule("xyz" as never)).toThrow(/xyz/);
  });

  it("getAllLanguageIds includes ja", () => {
    expect(getAllLanguageIds()).toContain("ja");
  });

  // Vacuity sweep 2026-09-17 (lane A5c): the `describe.each(getAllLanguageIds())`
  // block above would silently register zero conformance suites if the
  // registry ever returned an empty array — the "includes ja" check above
  // happens to catch a fully-empty registry today, but only incidentally
  // (it names one language, not "at least one"). Make the non-empty
  // requirement explicit so it doesn't depend on ja specifically staying
  // registered forever.
  it("registers at least one language module (describe.each above is not vacuous)", () => {
    expect(getAllLanguageIds().length).toBeGreaterThan(0);
  });
});
