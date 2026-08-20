/**
 * ES M5 curriculum guard.
 *
 * Headline guard: every M5 pathway node declared in the course mock
 * (`es-m5-1` … `es-m5-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud. Also enforces the spine's global-style ratchets on the
 * authored steps (passive-card follow-up spacing, no `explanation` on
 * passive steps, answer-leak lint, full atom-surface coverage) plus the
 * m5+ sentence-level listening ratchet (listening_build ≥3 tiles,
 * listening_comprehension transcripts are full sentences).
 */
import { describe, it, expect } from "vitest";
// Evaluate the full atom registry before ./m5: with ./m5 as the module-graph
// entry point it sits mid-cycle (unregistered) while courseAtoms pulls in the
// later modules, and any later-module factory that resolves an m5 surface
// (e.g. m16's capstone match grid) would throw before this suite runs.
import "../courseAtoms";
import { ES_M5_ATOMS, ES_M5_LESSONS, ES_M5_PLACEMENT } from "./m5";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { ES_MODULE_ORDER } from "../grammarHelpers";

describe("ES M5 curriculum", () => {
  it("ships 8 lessons, all tagged es / m5 / mock-1", () => {
    expect(ES_M5_LESSONS.length).toBe(8);
    expect(ES_M5_LESSONS.every((l) => l.moduleId === "m5")).toBe(true);
    expect(ES_M5_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M5_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M5_LESSONS.map((l) => l.id)).toEqual([
      "es-m5-1",
      "es-m5-2",
      "es-m5-3",
      "es-m5-4",
      "es-m5-5",
      "es-m5-6",
      "es-m5-7",
      "es-m5-8",
    ]);
    expect(ES_M5_LESSONS[7].title).toBe("M5 Mastery Test");
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M5_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M5_LESSONS.length);
  });

  it("every M5 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m5 = course.modules.find((m) => m.id === "m5");
    expect(m5).toBeDefined();
    expect(m5?.lessons.length ?? 0).toBe(8);
    for (const lesson of m5!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M5 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M5_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M5_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M5_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M5_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("listening is sentence-level only (m5+ ratchet)", () => {
    for (const lesson of ES_M5_LESSONS) {
      for (const step of lesson.steps) {
        if (step.type === "listening_build") {
          expect(
            step.correctOrder.length,
            `${lesson.id}/${step.id}: listening_build below 3 tiles`,
          ).toBeGreaterThanOrEqual(3);
        }
        if (step.type === "listening_comprehension") {
          const words = (step.transcript ?? "").trim().split(/\s+/).length;
          expect(
            words,
            `${lesson.id}/${step.id}: transcript '${step.transcript}' is not sentence-level`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("every M5 atom surface literally appears in M5 steps", () => {
    const corpus = ES_M5_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M5_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M5 steps`,
      ).toBe(true);
    }
  });
});

describe("ES M5 bespoke guards", () => {
  it("the placement bank carries the m5 facts (1 screener + 4 byModule)", () => {
    expect(ES_M5_PLACEMENT.screener.length).toBe(1);
    expect(ES_M5_PLACEMENT.byModule.length).toBe(4);
    for (const item of [...ES_M5_PLACEMENT.screener, ...ES_M5_PLACEMENT.byModule]) {
      const step = item.build();
      if (step.type !== "multiple_choice") {
        throw new Error(`${item.id}: expected a multiple_choice placement step`);
      }
      expect(step.options.length, `${item.id} should offer 4 options`).toBe(4);
    }
  });

  it("every emoji atom debuts on exactly one word_image_mcq (inv 30)", () => {
    // The bar's imageMcqReuse gate forbids a SECOND image MCQ but not a
    // missing FIRST one. Pin the full inv 30 shape: 9 emoji atoms, one
    // image MCQ each, no repeats — which also keeps L8 image-MCQ-free.
    const emojiSurfaces = new Set(
      ES_M5_ATOMS.filter((a) => a.emoji).map((a) => a.surface),
    );
    const imageTargets: string[] = [];
    for (const lesson of ES_M5_LESSONS) {
      for (const step of lesson.steps as never as Array<Record<string, unknown>>) {
        if (step.type !== "word_image_mcq") continue;
        const options = step.options as Array<{ id: string; word: string }>;
        imageTargets.push(options.find((o) => o.id === "correct")?.word ?? "");
      }
    }
    expect(new Set(imageTargets).size, "no image MCQ may repeat a target").toBe(
      imageTargets.length,
    );
    expect(new Set(imageTargets)).toEqual(emojiSurfaces);
  });

  it("the tener paradigm card precedes any tener form (the paradigm is taught as a set, not smuggled)", () => {
    // The provenance gate sees that tengo/tienes/tiene resolve to atoms,
    // not WHERE the paradigm lands. Walk the module in pathway order and
    // require the L2 card before any tener form reaches learner-visible
    // Spanish — the verb-module analogue of m4's agreement-card pin.
    const forms = ["tener", "tengo", "tienes", "tiene"];
    let cardSeen = false;
    for (const lesson of ES_M5_LESSONS) {
      for (const step of lesson.steps as never as Array<Record<string, unknown>>) {
        if (step.id === "es-m5-2-info-tener") cardSeen = true;
        const spanish = [
          step.targetSentence,
          step.audioText,
          step.targetPhrase,
          ...(Array.isArray(step.tiles) ? step.tiles : []),
          ...(Array.isArray(step.acceptedAnswers) ? step.acceptedAnswers : []),
          ...(Array.isArray(step.options)
            ? (step.options as unknown[]).filter((o) => typeof o === "string")
            : []),
        ]
          .filter((v): v is string => typeof v === "string")
          .join(" ")
          .toLowerCase();
        for (const form of forms) {
          if (new RegExp(`\\b${form}\\b`, "u").test(spanish)) {
            expect(
              cardSeen,
              `${lesson.id}/${step.id} uses "${form}" before the paradigm card`,
            ).toBe(true);
          }
        }
      }
    }
    expect(cardSeen, "the tener paradigm card must exist").toBe(true);
  });

  it("the mastery test drills person AND possessive discrimination (a cloze each)", () => {
    const mastery = ES_M5_LESSONS[7];
    const optionSets: string[][] = [];
    for (const step of mastery.steps as never as Array<Record<string, unknown>>) {
      if (step.type !== "particle_cloze") continue;
      optionSets.push((step.options as string[]).slice().sort());
    }
    const has = (want: string[]) =>
      optionSets.some((set) => JSON.stringify(set) === JSON.stringify([...want].sort()));
    expect(
      has(["tengo", "tienes", "tiene", "tener"]),
      "mastery needs a tener person-discrimination cloze",
    ).toBe(true);
    expect(
      has(["mi", "tu", "su", "la"]),
      "mastery needs a possessive-discrimination cloze",
    ).toBe(true);
  });

  it("no build/listening tile carries punctuation (a '¿quién' tile is unreadable)", () => {
    for (const lesson of ES_M5_LESSONS) {
      for (const step of lesson.steps as never as Array<Record<string, unknown>>) {
        if (!Array.isArray(step.tiles)) continue;
        for (const tile of step.tiles as unknown[]) {
          expect(
            /^[a-záéíóúñü]+$/iu.test(String(tile)),
            `${lesson.id}/${step.id}: tile "${String(tile)}" is not a bare word`,
          ).toBe(true);
        }
      }
    }
  });

  it("only singular tener forms appear — the paradigm boundary holds", () => {
    // m5 teaches tengo/tienes/tiene; the conjugation-aware PRIOR hands
    // tenemos/tienen to m6+ once tener is a prior-module verb. A plural
    // form slipping in here would be comprehensible to the gate (it's in
    // the real-form lexicon) but untaught to the learner.
    const banned = /\b(tenemos|tien[e]?n|ten[eé]is)\b/iu;
    const corpus = ES_M5_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    expect(banned.test(corpus), "plural tener form found in m5 content").toBe(false);
  });
});

// ── ES authoring bar (Track B, 2026-08-19) ─────────────────────────────────
// m5 was IR re-authored 2026-08-20 (ir/m5.ir.yaml) with zero pinned debt —
// the full bar applies with no ratchet. Never add a `debt:` entry here; fix
// the content instead.
registerEsModuleBarGuards({
  moduleLabel: "m5",
  lessons: ES_M5_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m5")),
});
