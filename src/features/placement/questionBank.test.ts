import { describe, it, expect } from "vitest";
import {
  PLACEMENT_QUESTION_BANK,
  getItemsForModule,
  instantiateItem,
} from "./questionBank";
import { ALL_TESTABLE_MODULES, getAllTestableModules } from "./tiers";

describe("questionBank", () => {
  it("has 75 JA items (3 per module × 25 modules)", () => {
    // The bank is language-aware: JA is the complete spine (3 × 25); other
    // languages (KO, etc.) are their own complete banks layered on top, so
    // the total bank size grows as new languages get placement content.
    const jaItems = PLACEMENT_QUESTION_BANK.filter(
      (i) => (i.languageId ?? "ja") === "ja",
    );
    expect(jaItems.length).toBe(75);
  });

  it("has 81 KO items (3 per module × 27 modules)", () => {
    const koItems = PLACEMENT_QUESTION_BANK.filter(
      (i) => i.languageId === "ko",
    );
    expect(koItems.length).toBe(81);
  });

  it("non-JA items all declare an explicit languageId", () => {
    const nonJa = PLACEMENT_QUESTION_BANK.filter(
      (i) => (i.languageId ?? "ja") !== "ja",
    );
    for (const item of nonJa) {
      expect(item.languageId, `${item.id} must declare languageId`).toBeTruthy();
    }
  });

  it("has exactly 3 JA items for every JA testable module", () => {
    for (const mod of getAllTestableModules("ja")) {
      const items = getItemsForModule(mod, "ja");
      expect(items.length, `ja ${mod} should have 3 items`).toBe(3);
    }
  });

  it("has exactly 3 KO items for every KO testable module", () => {
    for (const mod of getAllTestableModules("ko")) {
      const items = getItemsForModule(mod, "ko");
      expect(items.length, `ko ${mod} should have 3 items`).toBe(3);
    }
  });

  it("getItemsForModule defaults to JA for back-compat", () => {
    // No languageId arg → JA spine (existing call-site contract).
    expect(getItemsForModule("m3").length).toBe(3);
    expect(getItemsForModule("m3").every((i) => (i.languageId ?? "ja") === "ja")).toBe(
      true,
    );
    expect(ALL_TESTABLE_MODULES).toContain("m3");
  });

  it("has no duplicate IDs", () => {
    const ids = PLACEMENT_QUESTION_BANK.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every item instantiates without throwing", () => {
    for (const config of PLACEMENT_QUESTION_BANK) {
      expect(() => instantiateItem(config)).not.toThrow();
    }
  });

  it("every item references a module testable in its own language", () => {
    const validByLang = new Map<string, Set<string>>();
    for (const item of PLACEMENT_QUESTION_BANK) {
      const lang = item.languageId ?? "ja";
      if (!validByLang.has(lang)) {
        validByLang.set(lang, new Set(getAllTestableModules(lang)));
      }
      expect(
        validByLang.get(lang)!.has(item.moduleId),
        `${item.id} references invalid module ${item.moduleId} for ${lang}`,
      ).toBe(true);
    }
  });

  it("no sentence-MCQ item repeats its correct answer in distractors", () => {
    for (const item of PLACEMENT_QUESTION_BANK) {
      if (item.type !== "sentenceMcq") continue;
      const all = [item.correctKana, ...item.distractorsKana];
      expect(
        new Set(all).size,
        `${item.id} has a duplicated option`,
      ).toBe(all.length);
    }
  });
});
