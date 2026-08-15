import { describe, it, expect } from "vitest";
import {
  PLACEMENT_QUESTION_BANK,
  getItemsForModule,
  instantiateItem,
} from "./questionBank";
import { ALL_TESTABLE_MODULES, getAllTestableModules } from "./tiers";

describe("questionBank", () => {
  it("JA bank is coverage-scaled: m3-m17 carry per-grammar-point coverage", () => {
    // The bank is language-aware. m3-m17 (the shipped course) are
    // coverage-scaled — one item per grammar point, each tagged with
    // grammarPointId + skill so a test-out actually covers the module and the
    // gap report can name what was missed. m18-m29 remain 3-item stubs, though
    // m27/m28/m29 now carry grammarPointId + skill too (2026-08-14, B103).
    const jaItems = PLACEMENT_QUESTION_BANK.filter(
      (i) => (i.languageId ?? "ja") === "ja",
    );
    // 93 → 99: tier 8 opened m28/m29 to placement, which needed 3 items each,
    // and m27 lost none (two of its items moved to m28, two were authored to
    // replace them). Raise this deliberately; a silent drift means items were
    // duplicated or a module lost coverage.
    expect(jaItems.length).toBe(99);
    const shipped = jaItems.filter((i) => {
      const n = Number(i.moduleId.replace("m", ""));
      return n >= 3 && n <= 17;
    });
    for (const i of shipped) {
      expect(i.grammarPointId, `${i.id} needs a grammarPointId`).toBeTruthy();
      expect(i.skill, `${i.id} needs a skill label`).toBeTruthy();
    }
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

  it("every JA testable module has >= 3 items; broad modules scale up", () => {
    for (const mod of getAllTestableModules("ja")) {
      const items = getItemsForModule(mod, "ja");
      expect(
        items.length,
        `ja ${mod} should have at least 3 items`,
      ).toBeGreaterThanOrEqual(3);
    }
    // m14 (te-form + ta-form + counters — the widest module) gets the most.
    expect(getItemsForModule("m14", "ja").length).toBeGreaterThanOrEqual(6);
  });

  it("has exactly 3 KO items for every KO testable module", () => {
    for (const mod of getAllTestableModules("ko")) {
      const items = getItemsForModule(mod, "ko");
      expect(items.length, `ko ${mod} should have 3 items`).toBe(3);
    }
  });

  it("getItemsForModule defaults to JA for back-compat", () => {
    // No languageId arg → JA spine (existing call-site contract).
    expect(getItemsForModule("m3").length).toBeGreaterThanOrEqual(3);
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

describe("near-duplicate MCQ → cloze presentation (QA 2026-07-12)", () => {
  it("renders a shared-frame particle MCQ as a cloze with chips", () => {
    const step = instantiateItem({
      id: "t-neardup",
      moduleId: "m3",
      type: "sentenceMcq",
      prompt: "Which sentence means 'I drink water.'?",
      correctKana: "みずを のみます",
      distractorsKana: ["みずは のみます", "みずに のみます", "みずで のみます"],
    });
    expect(step.type).toBe("particle_cloze");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = step as any;
    expect(s.prompt.before).toBe("みず");
    expect(s.prompt.after).toBe(" のみます");
    expect(s.options.sort()).toEqual(["で", "に", "は", "を"]);
    expect(s.meaningEn).toBe("I drink water.");
  });

  it("keeps genuinely different sentences as an MCQ", () => {
    const step = instantiateItem({
      id: "t-distinct",
      moduleId: "m3",
      type: "sentenceMcq",
      prompt: "Which sentence means 'Good morning'?",
      correctKana: "おはようございます",
      distractorsKana: ["こんばんは", "さようなら", "いただきます"],
    });
    expect(step.type).toBe("multiple_choice");
  });

  it("reports how much of the live bank converts", () => {
    let mcq = 0;
    let converted = 0;
    for (const item of PLACEMENT_QUESTION_BANK) {
      if (item.type !== "sentenceMcq") continue;
      mcq++;
      if (instantiateItem(item).type === "particle_cloze") converted++;
    }
    // Informational floor: the transform must fire on a meaningful share
    // of the bank (the "4 same sentences" items Spencer flagged) without
    // converting everything.
    expect(mcq).toBeGreaterThan(0);
    expect(converted).toBeGreaterThan(0);
    expect(converted).toBeLessThan(mcq);
  });
});
