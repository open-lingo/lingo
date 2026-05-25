/**
 * Smoke tests for the two M3-introduced step types and the M3 lesson
 * registration. Asserts shape contracts so silent drift surfaces in CI.
 */
import { describe, it, expect } from "vitest";
import { getMockLessonContent } from "./mockLessons";
import { M3_8 } from "./mock-ja-m3-v2";
import type {
  GrammarRuleStep,
  ParticleClozeStep,
  LessonContent,
} from "../types";

// M3 restructure (2026-05-16): 8 lessons instead of 10. Also exercise the
// new M4/M5/M6/M7 grammar-rule and cloze coverage so the shape audit covers
// the full grammar spine.
const M3_IDS = [
  "ja-m3-1-1",
  "ja-m3-1-2",
  "ja-m3-2-1",
  "ja-m3-2-2",
  "ja-m3-3-1",
  "ja-m3-3-2",
  "ja-m3-4-1",
  "ja-m3-4-2",
  "ja-m3-5-1",
  "ja-m3-5-2",
  "ja-m3-6-1",
  "ja-m3-6-2",
  "ja-m3-7-1",
  "ja-m3-7-2",
];

const ALL_GRAMMAR_LESSON_IDS = [
  ...M3_IDS,
  "ja-m4-1-1", "ja-m4-1-2", "ja-m4-2-1", "ja-m4-2-2", "ja-m4-3-1", "ja-m4-3-2", "ja-m4-4-1", "ja-m4-4-2", "ja-m4-5-1", "ja-m4-5-2", "ja-m4-6-1", "ja-m4-6-2", "ja-m4-7-1", "ja-m4-7-2",
  "ja-m5-1-1", "ja-m5-1-2", "ja-m5-2-1", "ja-m5-2-2", "ja-m5-3-1", "ja-m5-3-2", "ja-m5-4-1", "ja-m5-4-2", "ja-m5-5-1", "ja-m5-5-2", "ja-m5-6-1", "ja-m5-6-2", "ja-m5-7-1", "ja-m5-7-2",
  "ja-m6-1-1", "ja-m6-1-2", "ja-m6-2-1", "ja-m6-2-2", "ja-m6-3-1", "ja-m6-3-2", "ja-m6-4-1", "ja-m6-4-2", "ja-m6-5-1", "ja-m6-5-2", "ja-m6-6-1", "ja-m6-6-2", "ja-m6-7-1", "ja-m6-7-2", "ja-m6-8-1", "ja-m6-8-2",
  "ja-m7-1-1", "ja-m7-1-2", "ja-m7-2-1", "ja-m7-2-2", "ja-m7-3-1", "ja-m7-3-2", "ja-m7-4-1", "ja-m7-4-2", "ja-m7-5-1", "ja-m7-5-2", "ja-m7-6-1", "ja-m7-6-2", "ja-m7-7-1", "ja-m7-7-2", "ja-m7-8-1", "ja-m7-8-2",
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
    const lesson = getMockLessonContent("ja-m3-1-1")!;
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

  it("M3-8 is a row-test mastery lesson", () => {
    const lesson = M3_8;
    const rowTest = lesson.steps.find((s) => s.type === "row_test");
    expect(rowTest, "M3-8 missing row_test step").toBeDefined();
    if (rowTest?.type !== "row_test") return;
    expect(rowTest.items.length).toBeGreaterThan(3);
  });
});

describe("grammar_rule step shape (M3-M7 grammar spine)", () => {
  function getAllGrammarRules(): GrammarRuleStep[] {
    const out: GrammarRuleStep[] = [];
    for (const id of ALL_GRAMMAR_LESSON_IDS) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const step of lesson.steps) {
        if (step.type === "grammar_rule") out.push(step);
      }
    }
    return out;
  }

  it("M3-M7 contains grammar_rule steps for the core particles", () => {
    const rules = getAllGrammarRules();
    expect(rules.length).toBeGreaterThanOrEqual(5);
    const titles = rules.map((r) => r.title);
    // Must cover the highest-leverage M3-M7 rules per Spencer's restructure.
    expect(titles.some((t) => t.includes("です"))).toBe(true);
    expect(titles.some((t) => t.includes("は"))).toBe(true);
    expect(titles.some((t) => t.includes("の"))).toBe(true);
    expect(titles.some((t) => t.includes("が"))).toBe(true);
    expect(titles.some((t) => t.includes("を"))).toBe(true);
  });

  it("every grammar_rule has rule + at least 2 examples + an antiPattern", () => {
    // Audit rule (Spencer's restructure 2026-05-16): antiPattern is required
    // on every Grammar Rule Card across M3-M7.
    for (const rule of getAllGrammarRules()) {
      expect(rule.rule.length, `${rule.id}: empty rule`).toBeGreaterThan(20);
      expect(
        rule.examples.length,
        `${rule.id}: needs ≥ 2 examples`,
      ).toBeGreaterThanOrEqual(2);
      expect(
        rule.antiPattern,
        `${rule.id}: missing antiPattern (required across the M3-M7 spine)`,
      ).toBeDefined();
      for (const ex of rule.examples) {
        expect(ex.ja.length).toBeGreaterThan(0);
        expect(ex.romaji.length).toBeGreaterThan(0);
        expect(ex.en.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("particle_cloze step shape (M3-M7 grammar spine)", () => {
  function getAllParticleClozes(): ParticleClozeStep[] {
    const out: ParticleClozeStep[] = [];
    for (const id of ALL_GRAMMAR_LESSON_IDS) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const step of lesson.steps) {
        if (step.type === "particle_cloze") out.push(step);
      }
    }
    return out;
  }

  it("M3-M7 contains many particle_cloze steps (drilled across modules)", () => {
    const clozes = getAllParticleClozes();
    expect(clozes.length).toBeGreaterThanOrEqual(40);
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

  it("M3-4 (は as topic marker) has at least 5 cloze drills", () => {
    const lesson = getMockLessonContent("ja-m3-4-1")!;
    const clozes = lesson.steps.filter((s) => s.type === "particle_cloze");
    expect(clozes.length).toBeGreaterThanOrEqual(5);
  });
});
