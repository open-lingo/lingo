import { describe, it, expect } from "vitest";
import {
  PLACEMENT_QUESTION_BANK,
  getItemsForModule,
  instantiateItem,
} from "./questionBank";
import { ALL_TESTABLE_MODULES } from "./tiers";

describe("questionBank", () => {
  it("has 75 items total (3 per module × 25 modules)", () => {
    expect(PLACEMENT_QUESTION_BANK.length).toBe(75);
  });

  it("has exactly 3 items for every testable module", () => {
    for (const mod of ALL_TESTABLE_MODULES) {
      const items = getItemsForModule(mod);
      expect(items.length, `${mod} should have 3 items`).toBe(3);
    }
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

  it("all items reference valid module IDs", () => {
    const validModules = new Set(ALL_TESTABLE_MODULES);
    for (const item of PLACEMENT_QUESTION_BANK) {
      expect(validModules.has(item.moduleId), `${item.id} references invalid module ${item.moduleId}`).toBe(true);
    }
  });
});
