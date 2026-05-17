/**
 * Smoke tests for the two M3-introduced step types and the M3 lesson
 * registration. Asserts shape contracts so silent drift surfaces in CI.
 */
import { describe, it, expect } from "vitest";
import { getMockLessonContent } from "./mockLessons";
import type {
  GrammarRuleStep,
  ParticleClozeStep,
  LessonContent,
} from "../types";

const M3_IDS = [
  "ja-m3-1",
  "ja-m3-2",
  "ja-m3-3",
  "ja-m3-4",
  "ja-m3-5",
  "ja-m3-6",
  "ja-m3-7",
  "ja-m3-8",
  "ja-m3-9",
  "ja-m3-10",
];

describe("M3 lesson registration", () => {
  for (const id of M3_IDS) {
    it(`${id} resolves to a LessonContent`, () => {
      const lesson = getMockLessonContent(id);
      expect(lesson, `${id} missing from mockLessons`).not.toBeNull();
      expect(lesson?.moduleId).toBe("m3");
      expect((lesson as LessonContent).steps.length).toBeGreaterThan(0);
    });
  }

  it("M3-1 contains a katakana SYSTEM info card (not per-row drill)", () => {
    const lesson = getMockLessonContent("ja-m3-1")!;
    const infoSteps = lesson.steps.filter((s) => s.type === "info");
    expect(infoSteps.length).toBeGreaterThan(0);
    // First info step should explain katakana as a system.
    const sysCard = infoSteps[0];
    if (sysCard.type !== "info") return;
    expect(sysCard.body.toLowerCase()).toMatch(/katakana/);
    expect(sysCard.body.toLowerCase()).toMatch(/loanword|foreign/);
    // No symbol_trace or symbol_intro steps anywhere in M3-1.
    for (const step of lesson.steps) {
      expect(step.type).not.toBe("symbol_trace");
      expect(step.type).not.toBe("symbol_intro");
    }
  });

  it("M3-10 is a row-test mastery lesson", () => {
    const lesson = getMockLessonContent("ja-m3-10")!;
    const rowTest = lesson.steps.find((s) => s.type === "row_test");
    expect(rowTest, "M3-10 missing row_test step").toBeDefined();
    if (rowTest?.type !== "row_test") return;
    expect(rowTest.items.length).toBeGreaterThan(5);
  });
});

describe("grammar_rule step shape", () => {
  function getAllGrammarRules(): GrammarRuleStep[] {
    const out: GrammarRuleStep[] = [];
    for (const id of M3_IDS) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const step of lesson.steps) {
        if (step.type === "grammar_rule") out.push(step);
      }
    }
    return out;
  }

  it("M3 contains grammar_rule steps for the core particles", () => {
    const rules = getAllGrammarRules();
    expect(rules.length).toBeGreaterThanOrEqual(4);
    const titles = rules.map((r) => r.title);
    // Must cover the four highest-leverage M3 rules.
    expect(titles.some((t) => t.includes("です"))).toBe(true);
    expect(titles.some((t) => t.includes("か"))).toBe(true);
    expect(titles.some((t) => t.includes("は") && t.includes("が"))).toBe(true);
    expect(titles.some((t) => t.includes("の"))).toBe(true);
  });

  it("every grammar_rule has rule + at least 2 examples", () => {
    for (const rule of getAllGrammarRules()) {
      expect(rule.rule.length, `${rule.id}: empty rule`).toBeGreaterThan(20);
      expect(
        rule.examples.length,
        `${rule.id}: needs ≥ 2 examples`,
      ).toBeGreaterThanOrEqual(2);
      for (const ex of rule.examples) {
        expect(ex.ja.length).toBeGreaterThan(0);
        expect(ex.romaji.length).toBeGreaterThan(0);
        expect(ex.en.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("particle_cloze step shape", () => {
  function getAllParticleClozes(): ParticleClozeStep[] {
    const out: ParticleClozeStep[] = [];
    for (const id of M3_IDS) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const step of lesson.steps) {
        if (step.type === "particle_cloze") out.push(step);
      }
    }
    return out;
  }

  it("M3 contains particle_cloze steps", () => {
    const clozes = getAllParticleClozes();
    expect(clozes.length).toBeGreaterThanOrEqual(6);
  });

  it("every cloze has 4 options including the correct particle", () => {
    for (const c of getAllParticleClozes()) {
      expect(c.options.length, `${c.id}: needs 4 options`).toBe(4);
      expect(
        c.options.includes(c.correctParticle),
        `${c.id}: correctParticle "${c.correctParticle}" missing from options`,
      ).toBe(true);
      expect(c.meaningEn.length).toBeGreaterThan(0);
    }
  });

  it("M3-3 (は vs が) has at least 6 cloze drills", () => {
    const lesson = getMockLessonContent("ja-m3-3")!;
    const clozes = lesson.steps.filter((s) => s.type === "particle_cloze");
    expect(clozes.length).toBeGreaterThanOrEqual(6);
  });
});
