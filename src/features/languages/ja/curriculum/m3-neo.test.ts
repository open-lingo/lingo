/**
 * JA m3-neo PILOT curriculum guard — the dict-form-first rewrite's first
 * module (spine tile s03, "Plain sentences — だ, は, も").
 *
 * The shared house feet (Gate 2: unique ids, passive-card spacing,
 * explanation lints, Gate 5 distractors, Gate 6 antiPattern minimal pairs,
 * Gate 8 progressive gloss) run via `registerJaModuleContentLints("m3")`
 * — the pilot lessons are tagged moduleId "m3", so they ride the same
 * harness as m3-v2 (and m3.test.ts covers them too once registered).
 *
 * This file adds the pilot-specific content assertions:
 *   - all 7 lessons registered + deep-link resolvable, correct ids;
 *   - density band (invariant 15: ~18-24 steps);
 *   - plain-form register: no です/ます in any PRODUCTION surface
 *     (build/listening_build correctOrder, speaking targets, translate
 *     accepted answers) — です exists ONLY on recognition surfaces;
 *   - だ-drop grading: every translate step accepts a だ-dropped variant;
 *   - うん recognition-only: no production step targets うん;
 *   - L5 chunk lesson ships ZERO grammar_rule steps (type-5 template);
 *   - L7 review reuses no earlier audioText verbatim (fresh-sentence rule)
 *     and keeps ≥60% sentence-context;
 *   - the concept set is covered (だ, は, も, ？-questions, chunks, です
 *     preview).
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../__tests__/moduleContentLints";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import {
  M3_NEO_1,
  M3_NEO_2,
  M3_NEO_3,
  M3_NEO_4,
  M3_NEO_5,
  M3_NEO_6,
  M3_NEO_LESSONS,
  M3_NEO_REVIEW,
} from "./m3-neo";

registerJaModuleContentLints("m3");

const NEO_IDS = [
  "ja-m3-neo-1",
  "ja-m3-neo-2",
  "ja-m3-neo-3",
  "ja-m3-neo-4",
  "ja-m3-neo-5",
  "ja-m3-neo-6",
  "ja-m3-neo-review",
];

/** Every PRODUCTION-side Japanese surface of a step (what the learner is
 *  asked to produce), for register assertions. */
function productionSurfaces(step: LessonStep): string[] {
  switch (step.type) {
    case "build_sentence":
    case "listening_build":
      return [step.correctOrder.join("")];
    case "speaking":
      return [step.targetPhrase];
    case "translate":
      return step.acceptedAnswers;
    default:
      return [];
  }
}

describe("JA m3-neo pilot module content", () => {
  it("registers all 7 pilot lessons under their deep-link ids", () => {
    for (const id of NEO_IDS) {
      const lesson = getMockLessonContent(id);
      expect(lesson, `${id} not resolvable via getMockLessonContent`).not.toBeNull();
      expect(lesson!.id).toBe(id);
      expect(lesson!.moduleId).toBe("m3");
      expect(lesson!.languageId).toBe("ja");
    }
    expect(M3_NEO_LESSONS.map((l) => l.id)).toEqual(NEO_IDS);
  });

  it("every lesson sits in the density band (invariant 15: 18-24 steps)", () => {
    for (const lesson of M3_NEO_LESSONS) {
      const n = lesson.steps.length;
      expect(n, `${lesson.id} has ${n} steps`).toBeGreaterThanOrEqual(18);
      expect(n, `${lesson.id} has ${n} steps`).toBeLessThanOrEqual(24);
    }
  });

  it("ships zero info and zero phrase_card steps (invariant 4)", () => {
    for (const lesson of M3_NEO_LESSONS) {
      const bad = lesson.steps.filter(
        (s) => s.type === "info" || s.type === "phrase_card",
      );
      expect(bad.map((s) => s.id), lesson.id).toEqual([]);
    }
  });

  it("plain form IS the register: no です/ます on any production surface", () => {
    // Exception: formulaic chunks are unanalyzed wholes (guide type 5) — the
    // polite thanks formula is taught as one sound, not as ます-morphology.
    const CHUNK_EXEMPT = new Set(["ありがとうございます"]);
    const offenders: string[] = [];
    for (const lesson of M3_NEO_LESSONS) {
      for (const step of lesson.steps) {
        for (const s of productionSurfaces(step)) {
          if (CHUNK_EXEMPT.has(s)) continue;
          if (s.includes("です") || s.includes("ます")) {
            offenders.push(`${lesson.id}/${step.id}: "${s}"`);
          }
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("です appears ONLY as flagged recognition previews (L1, L6, L7)", () => {
    // Recognition surfaces may carry です — but every listening step whose
    // audio contains です must flag itself as a politeness preview in its
    // question text.
    for (const lesson of M3_NEO_LESSONS) {
      for (const step of lesson.steps) {
        if (step.type === "listening_comprehension" && step.transcript?.includes("です")) {
          expect(
            /polite|preview/i.test(step.question),
            `${lesson.id}/${step.id} carries です audio without a politeness flag in its question`,
          ).toBe(true);
        }
      }
    }
  });

  it("every translate step accepts a だ-dropped variant (grading policy)", () => {
    for (const lesson of M3_NEO_LESSONS) {
      for (const step of lesson.steps) {
        if (step.type !== "translate") continue;
        const hasDa = step.acceptedAnswers.some((a) => a.replace(/[。？]/g, "").endsWith("だ"));
        if (!hasDa) continue; // question-form target (ほん？) — no だ to drop
        const hasDropped = step.acceptedAnswers.some(
          (a) => !a.replace(/[。？]/g, "").endsWith("だ"),
        );
        expect(
          hasDropped,
          `${lesson.id}/${step.id} accepts only だ-final answers — casual だ-drop must grade correct`,
        ).toBe(true);
      }
    }
  });

  it("うん is recognition-only: no production step targets it", () => {
    const offenders: string[] = [];
    for (const lesson of M3_NEO_LESSONS) {
      for (const step of lesson.steps) {
        for (const s of productionSurfaces(step)) {
          if (s.includes("うん")) offenders.push(`${lesson.id}/${step.id}`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("L1 teaches by showing: listening exposure precedes the だ rule", () => {
    const ruleIdx = M3_NEO_1.steps.findIndex((s) => s.id === "ja-m3-neo-1-rule-da");
    expect(ruleIdx).toBeGreaterThanOrEqual(3);
    const before = M3_NEO_1.steps.slice(0, ruleIdx);
    const listens = before.filter((s) => s.type === "listening_comprehension");
    expect(listens.length).toBeGreaterThanOrEqual(2);
  });

  it("L2 keeps は in multi-sentence/dialogue context and never glosses 'as for'", () => {
    expect(M3_NEO_2.steps.some((s) => s.type === "dialogue_listen")).toBe(true);
    const corpus = JSON.stringify(M3_NEO_2.steps);
    expect(corpus.toLowerCase()).not.toContain("as for");
  });

  it("L3 drills は/も as choice-under-contrast (both particles rotate as answers)", () => {
    const clozes = M3_NEO_3.steps.filter((s) => s.type === "particle_cloze");
    expect(clozes.length).toBeGreaterThanOrEqual(3);
    const answers = new Set(clozes.map((s) => s.correctParticle));
    expect(answers.has("も")).toBe(true);
    expect(answers.has("は")).toBe(true);
    // Context is multi-sentence: every も-cloze frame carries a first sentence.
    for (const c of clozes) {
      expect(
        c.prompt.before.includes("。"),
        `${c.id} lacks the 2-line context the particle-choice template mandates`,
      ).toBe(true);
    }
  });

  it("L4 authors BOTH members of each intonation pair (。 vs ？ audio strings)", () => {
    const audio = new Set(
      M3_NEO_4.steps
        .filter((s) => s.type === "listening_comprehension")
        .map((s) => s.transcript),
    );
    expect(audio.has("ねこだ。")).toBe(true);
    expect(audio.has("ねこ？")).toBe(true);
    expect(audio.has("がくせいだ。")).toBe(true);
    expect(audio.has("がくせい？")).toBe(true);
  });

  it("L5 is a pure chunk lesson: ZERO grammar_rule steps (type-5 template)", () => {
    expect(
      M3_NEO_5.steps.filter((s) => s.type === "grammar_rule").map((s) => s.id),
    ).toEqual([]);
    // All five chunks surface.
    const corpus = JSON.stringify(M3_NEO_5.steps);
    for (const chunk of [
      "すみません",
      "ごめんなさい",
      "ありがとうございます",
      "だいじょうぶ",
      "はじめまして",
    ]) {
      expect(corpus, `L5 missing chunk ${chunk}`).toContain(chunk);
    }
  });

  it("L6 story: the polite character speaks exactly two flagged です lines", () => {
    const dialogues = M3_NEO_6.steps.filter((s) => s.type === "dialogue_listen");
    const desuLines = dialogues.flatMap((d) =>
      d.lines.filter((l) => l.kana.includes("です")),
    );
    expect(desuLines.length).toBe(2);
    for (const l of desuLines) {
      expect(l.speaker, `です line "${l.kana}" spoken by ${l.speaker}`).toBe("たなか");
    }
  });

  it("L7 review reuses no earlier audioText verbatim (fresh-sentence rule)", () => {
    const collect = (lessons: LessonContent[]): Set<string> => {
      const out = new Set<string>();
      for (const lesson of lessons) {
        for (const step of lesson.steps) {
          if (step.type === "listening_comprehension" && step.transcript) out.add(step.transcript);
          if (step.type === "speaking") out.add(step.targetPhrase);
          if (step.type === "build_sentence" || step.type === "listening_build") {
            out.add(step.targetSentence);
          }
          if (step.type === "particle_cloze" && step.audioText) out.add(step.audioText);
          if (step.type === "translate" && step.audioKey) out.add(step.audioKey);
          if (step.type === "dialogue_listen") {
            for (const l of step.lines) out.add(l.audioText ?? l.kana);
          }
        }
      }
      return out;
    };
    const earlier = collect([M3_NEO_1, M3_NEO_2, M3_NEO_3, M3_NEO_4, M3_NEO_5, M3_NEO_6]);
    // Single review-pool word draws are seeded/dynamic, not authored sentences.
    const reviewAuthored = [...collect([M3_NEO_REVIEW])].filter((s) =>
      /[はもだ。？]/.test(s),
    );
    const reused = reviewAuthored.filter((s) => earlier.has(s));
    expect(reused, `review reuses: ${reused.join(" / ")}`).toEqual([]);
  });

  it("L7 review keeps ≥60% sentence-context steps (invariant 19 spirit)", () => {
    const steps = M3_NEO_REVIEW.steps;
    const isSentenceContext = (s: LessonStep): boolean => {
      if (s.type === "listening_comprehension") {
        return (s.transcript ?? "").length >= 3 || /[。？]/.test(s.transcript ?? "");
      }
      if (s.type === "build_sentence" || s.type === "listening_build") {
        return s.correctOrder.length >= 2;
      }
      if (s.type === "speaking") return s.targetPhrase.length >= 3;
      if (s.type === "particle_cloze") return true;
      if (s.type === "translate") return true;
      if (s.type === "multiple_choice") return true; // sentence options
      return false;
    };
    const share = steps.filter(isSentenceContext).length / steps.length;
    expect(share, `sentence-context share ${share.toFixed(2)}`).toBeGreaterThanOrEqual(0.6);
  });

  it("every production prompt with a register-dependent answer names its audience", () => {
    // At m3-neo the audience is always casual/"friend" — check builds +
    // translates whose target ends in だ (or a だ-dropped noun) carry the cue.
    const offenders: string[] = [];
    for (const lesson of M3_NEO_LESSONS) {
      for (const step of lesson.steps) {
        let prompt: string | undefined;
        if (step.type === "build_sentence") prompt = step.prompt;
        else if (step.type === "translate") prompt = step.sourceText;
        else continue;
        const surfaces = productionSurfaces(step);
        const registerDependent = surfaces.some((s) => /だ[。？]?$/.test(s));
        if (!registerDependent) continue;
        if (!/friend|Mika adds|casual/i.test(prompt ?? "")) {
          offenders.push(`${lesson.id}/${step.id}: "${prompt}"`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

/**
 * antiPattern SEMANTIC contract (Spencer walk, 2026-07-19): the derived
 * spot-the-mistake step calls antiPattern.ja WRONG, so it must be
 * genuinely incorrect Japanese — never a correct sentence with a
 * different job (ねこ？) or register (そらです。). Contrast material
 * belongs in examples[]. Regression: both misuses shipped in the pilot
 * and graded learners wrong for correct picks.
 */
describe("m3-neo antiPattern wrongness contract", () => {
  it("rule-da carries a true form error, not the question contrast", async () => {
    const lesson = await getMockLessonContent("ja-m3-neo-1");
    const rule = lesson!.steps.find((s) => s.id === "ja-m3-neo-1-rule-da") as any;
    expect(rule.antiPattern.ja).toBe("だねこ。");
  });
  it("rule-da-drop has NO antiPattern (its です contrast lives in examples)", async () => {
    const lesson = await getMockLessonContent("ja-m3-neo-1");
    const rule = lesson!.steps.find((s) => s.id === "ja-m3-neo-1-rule-da-drop") as any;
    expect(rule.antiPattern).toBeUndefined();
    expect(rule.examples.some((e: any) => e.ja === "そらです。")).toBe(true);
  });
  it("derived spot steps never present two correct sentences", async () => {
    const lesson = await getMockLessonContent("ja-m3-neo-1");
    const spots = lesson!.steps.filter((s: any) => s.id?.endsWith("-spot")) as any[];
    // Only the rule-da spot survives, and its wrong option is the order error.
    expect(spots.map((s) => s.id)).toEqual(["ja-m3-neo-1-rule-da-spot"]);
    expect(spots[0].options.some((o: any) => o.text === "だねこ。")).toBe(true);
    expect(spots[0].options.some((o: any) => o.text === "ねこ？")).toBe(false);
  });

  it("L2's antiPattern is the particle-order error; the no-topic contrast is an example", async () => {
    const lesson = await getMockLessonContent("ja-m3-neo-2");
    const rule = lesson!.steps.find((s) => s.id === "ja-m3-neo-2-rule-wa") as any;
    expect(rule.antiPattern.ja).toBe("はわたし がくせいだ。");
    expect(rule.examples.some((e: any) => e.ja === "がくせいだ。")).toBe(true);
  });

  it("L4's rise rule has NO antiPattern (だ-disbelief nuance lives in examples)", async () => {
    const lesson = await getMockLessonContent("ja-m3-neo-4");
    const rule = lesson!.steps.find((s) => s.id === "ja-m3-neo-4-rule-rise") as any;
    expect(rule.antiPattern).toBeUndefined();
    expect(rule.examples.some((e: any) => e.ja === "ねこだ？")).toBe(true);
    const spots = lesson!.steps.filter((s: any) => s.id === "ja-m3-neo-4-rule-rise-spot");
    expect(spots).toHaveLength(0);
  });

  it("option/meaning texts are plain translations — never double-glossed", async () => {
    // Spencer walk 2026-07-19: "A book — 'it's a book.'" is noise; the
    // translation IS the option. Equivalence nuance (だ ≠ literal "it
    // is") lives in the rule card's cultureNote, not in every option.
    for (const lid of ["ja-m3-neo-1","ja-m3-neo-2","ja-m3-neo-3","ja-m3-neo-4","ja-m3-neo-5","ja-m3-neo-6","ja-m3-neo-review"]) {
      const lesson = await getMockLessonContent(lid);
      for (const s of lesson!.steps as any[]) {
        for (const opt of s.options ?? []) {
          expect(opt.text ?? "").not.toMatch(/— '/);
        }
      }
    }
  });

  it("every antiPattern in the module is distinct from every example (wrongness sanity)", async () => {
    for (const lid of ["ja-m3-neo-1","ja-m3-neo-2","ja-m3-neo-3","ja-m3-neo-4","ja-m3-neo-5","ja-m3-neo-6","ja-m3-neo-review"]) {
      const lesson = await getMockLessonContent(lid);
      for (const s of lesson!.steps as any[]) {
        if (s.type === "grammar_rule" && s.antiPattern) {
          const exampleJas = new Set(s.examples.map((e: any) => e.ja));
          expect(exampleJas.has(s.antiPattern.ja)).toBe(false);
        }
      }
    }
  });
});
