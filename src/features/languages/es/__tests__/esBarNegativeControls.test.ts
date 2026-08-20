/**
 * NEGATIVE CONTROLS for the ES authoring bar — proof each gate can FIRE.
 *
 * Every pure lint in `moduleBarGuards.ts` and the shared
 * `mcqDistractorLint.ts` core is exercised here against a synthetic lesson
 * built to violate it, plus one clean lesson that must pass everything. A
 * guard whose failure branch has never executed is a decoration (the JA
 * retrospective's "gates must be able to fail" trap — handoff §1.5); this
 * file is the vitest-level equivalent of reverting a fix to watch the test
 * go red.
 *
 * The lints are PURE functions taking a LessonContent, so no vitest-in-
 * vitest is needed — synthetic lessons are cast literals.
 */
import { describe, it, expect } from "vitest";
import type { LessonContent } from "@/features/lesson/types";
import {
  esSurfaces,
  esTokens,
  getEsRealFormLexicon,
  lintFullSentenceMcqs,
  lintProductionFramedMcqs,
  lintProgressiveGloss,
  lintSentenceOveruse,
  lintSpotTheMistake,
  lintTheatricalPrompts,
  lintVosotros,
} from "./moduleBarGuards";
import { lintMcqDistractorsCore } from "@/shared/lessonAuthoring/mcqDistractorLint";

function lesson(steps: unknown[]): LessonContent {
  return {
    id: "es-mX-1",
    moduleId: "mX",
    courseId: "mock-1",
    languageId: "es",
    title: "synthetic",
    steps,
  } as never as LessonContent;
}

const ES_LINT_PARAMS = {
  wordToken: /[a-záéíóúñü]{3,}/i,
  echoMinLength: 3,
  realFormLexicon: getEsRealFormLexicon(),
  isMeaningCuedFormPicker: (prompt: string) =>
    /\bform\b/i.test(prompt) && !/[¿¡ñáéíóúü]/i.test(prompt),
};

describe("negative controls — each ES bar lint fires on a violating lesson", () => {
  it("lintSentenceOveruse: 4 uses of one sentence", () => {
    const l = lesson(
      Array.from({ length: 4 }, (_, i) => ({
        id: `s${i}`,
        type: "build_sentence",
        prompt: "Build: I speak Spanish.",
        targetSentence: "Yo hablo español.",
        tiles: ["Yo", "hablo", "español"],
        correctOrder: ["Yo", "hablo", "español"],
      })),
    );
    const failures = lintSentenceOveruse(l);
    expect(failures.length).toBe(1);
    expect(failures[0].problem).toMatch(/used 4x/);
  });

  it("lintFullSentenceMcqs: pick-the-built-sentence MCQ", () => {
    const l = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: 'How do you say "I want water"?',
        options: [
          { id: "a", text: "Yo quiero agua." },
          { id: "b", text: "Yo quiero pan." },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(lintFullSentenceMcqs(l).length).toBe(1);
    // …but a single-word discrimination drill passes (that's ES pedagogy):
    const drill = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: "Which form goes with «yo»?",
        options: [
          { id: "a", text: "hablo" },
          { id: "b", text: "habla" },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(lintFullSentenceMcqs(drill)).toEqual([]);
  });

  it("lintProductionFramedMcqs: 'Reply…' prompt on an MCQ", () => {
    const l = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: "Reply to Ana's greeting",
        options: [
          { id: "a", text: "Buenos días, Ana." },
          { id: "b", text: "Adiós." },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(lintProductionFramedMcqs(l).length).toBe(1);
  });

  it("lintTheatricalPrompts: scenario prose on a build step", () => {
    const l = lesson([
      {
        id: "s0",
        type: "build_sentence",
        prompt: "You walk into a busy café in Madrid. The waiter smiles. Order a coffee.",
        targetSentence: "Un café, por favor.",
        tiles: ["Un", "café", "por", "favor"],
        correctOrder: ["Un", "café", "por", "favor"],
      },
    ]);
    expect(lintTheatricalPrompts(l).length).toBe(1);
    const plain = lesson([
      {
        id: "s0",
        type: "build_sentence",
        prompt: "Build: A coffee, please.",
        targetSentence: "Un café, por favor.",
        tiles: ["Un", "café", "por", "favor"],
        correctOrder: ["Un", "café", "por", "favor"],
      },
    ]);
    expect(lintTheatricalPrompts(plain)).toEqual([]);
  });

  it("lintSpotTheMistake: -spot step id and the retired prompt", () => {
    const l = lesson([
      { id: "es-mX-1-spot", type: "multiple_choice", prompt: "One of these is wrong.", options: [], correctOptionId: "a" },
    ]);
    expect(lintSpotTheMistake(l).length).toBe(2);
  });

  it("lintVosotros: vosotros form on a Spanish surface", () => {
    const l = lesson([
      {
        id: "s0",
        type: "phrase_card",
        kana: "Vosotros habláis español.",
        romaji: "",
        meaningEn: "You all speak Spanish.",
      },
    ]);
    // "vosotros" + "habláis" both trip the pattern on the one surface.
    expect(lintVosotros(l).length).toBeGreaterThanOrEqual(1);
    const latam = lesson([
      {
        id: "s0",
        type: "phrase_card",
        kana: "Ustedes hablan español.",
        romaji: "",
        meaningEn: "You all speak Spanish.",
      },
      {
        id: "s1",
        type: "phrase_card",
        // number words ending -séis are not verb endings — must NOT fire
        kana: "Tengo dieciséis años.",
        romaji: "",
        meaningEn: "I am sixteen.",
      },
    ]);
    expect(lintVosotros(latam)).toEqual([]);
  });

  it("lintProgressiveGloss: simple present glossed as English progressive", () => {
    const bad = lesson([
      {
        id: "s0",
        type: "listening_comprehension",
        transcript: "Diego come pan.",
        question: "What did you hear?",
        options: [
          { id: "a", text: "Diego is eating bread." },
          { id: "b", text: "Diego drinks water." },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(lintProgressiveGloss(bad).length).toBe(1);
    // estar + gerundio LICENSES the progressive gloss:
    const licensed = lesson([
      {
        id: "s0",
        type: "listening_comprehension",
        transcript: "Diego está comiendo pan.",
        question: "What did you hear?",
        options: [
          { id: "a", text: "Diego is eating bread." },
          { id: "b", text: "Diego drinks water." },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(lintProgressiveGloss(licensed)).toEqual([]);
  });
});

describe("negative controls — shared MCQ distractor core (ES params)", () => {
  it("fires on duplicate options", () => {
    const l = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: "Which is 'the house'?",
        options: [
          { id: "a", text: "la casa" },
          { id: "b", text: "la casa" },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(
      lintMcqDistractorsCore(l, ES_LINT_PARAMS).some((f) => /duplicate options/.test(f.problem)),
    ).toBe(true);
  });

  it("fires on an unresolvable correctOptionId", () => {
    const l = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: "Pick one",
        options: [{ id: "a", text: "uno" }, { id: "b", text: "dos" }],
        correctOptionId: "zzz",
      },
    ]);
    expect(
      lintMcqDistractorsCore(l, ES_LINT_PARAMS).some((f) =>
        /resolves to no option/.test(f.problem),
      ),
    ).toBe(true);
  });

  it("fires when every option carries the same trailing tag", () => {
    const l = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: "Which is right?",
        options: [
          { id: "a", text: "hablo (present)" },
          { id: "b", text: "hablas (present)" },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(
      lintMcqDistractorsCore(l, ES_LINT_PARAMS).some((f) => /discriminates nothing/.test(f.problem)),
    ).toBe(true);
  });

  it("fires when a distractor echoes a word quoted in the prompt", () => {
    const l = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: "What does «hablo» mean?",
        options: [
          { id: "a", text: "I speak" },
          { id: "b", text: "hablo" },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(
      lintMcqDistractorsCore(l, ES_LINT_PARAMS).some((f) => /echoes a word/.test(f.problem)),
    ).toBe(true);
  });

  it("the derivation-drill exemption spares the quoted lemma, nothing else", () => {
    const params = {
      ...ES_LINT_PARAMS,
      allowEchoDistractor: ({ prompt, distractor }: { prompt: string; distractor: string }) =>
        /\b(preterite|imperfect|present|form|conjugat)/i.test(prompt) &&
        /(?:ar|er|ir)$/.test(distractor.trim().toLowerCase()),
    };
    // The didn't-conjugate distractor on a form-cued prompt is ALLOWED:
    const drill = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: "Pick the yo preterite of hablar.",
        options: [
          { id: "a", text: "hablé" },
          { id: "b", text: "hablar" },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(lintMcqDistractorsCore(drill, params).filter((f) => /echoes/.test(f.problem))).toEqual(
      [],
    );
    // A non-infinitive echo on the same kind of prompt still fires:
    const echo = lesson([
      {
        id: "s0",
        type: "multiple_choice",
        prompt: "Pick the feminine form of doctor.",
        options: [
          { id: "a", text: "doctora" },
          { id: "b", text: "doctor" },
        ],
        correctOptionId: "a",
      },
    ]);
    expect(
      lintMcqDistractorsCore(echo, params).some((f) => /echoes/.test(f.problem)),
    ).toBe(true);
  });

  it("fires when a meaning-cued form picker offers invented forms", () => {
    const l = lesson([
      {
        id: "s0",
        type: "build_sentence",
        prompt: "Pick the yo form of hablar",
        tiles: ["hablo", "hablaxo"],
        correctOrder: ["hablo"],
        targetSentence: "hablo",
      },
    ]);
    expect(
      lintMcqDistractorsCore(l, ES_LINT_PARAMS).some((f) => /invented forms/.test(f.problem)),
    ).toBe(true);
  });
});

describe("esSurfaces projection — what counts as learner exposure", () => {
  it("EXCLUDES multiple_choice distractors (discrimination-drill pedagogy)", () => {
    const step = {
      id: "s0",
      type: "multiple_choice",
      prompt: "Which form goes with «yo»?",
      options: [
        { id: "a", text: "quiero" },
        { id: "b", text: "quierro" }, // deliberately wrong form — must NOT surface
      ],
      correctOptionId: "a",
    } as never;
    const surfaces = esSurfaces(step);
    expect(esTokens(surfaces.join(" "))).toContain("quiero");
    expect(esTokens(surfaces.join(" "))).not.toContain("quierro");
  });

  it("INCLUDES particle_cloze options (inv 40 — every offered particle is exposure)", () => {
    const step = {
      id: "s0",
      type: "particle_cloze",
      prompt: { before: "Voy", after: "la escuela." },
      correctParticle: "a",
      options: ["a", "de", "en"],
    } as never;
    const s = esSurfaces(step);
    expect(s).toContain("de");
    expect(s).toContain("en");
  });

  it("info steps contribute only their «guillemet» spans", () => {
    const step = {
      id: "s0",
      type: "info",
      title: "Ser vs estar",
      body: "Use «soy» for identity. The English word 'identity' itself is not Spanish exposure.",
    } as never;
    expect(esSurfaces(step)).toEqual(["soy"]);
  });
});

describe("positive control — a clean lesson passes every bar lint", () => {
  const clean = lesson([
    {
      id: "s0",
      type: "phrase_card",
      kana: "Yo hablo español.",
      romaji: "",
      meaningEn: "I speak Spanish.",
    },
    {
      id: "s1",
      type: "multiple_choice",
      prompt: "Which form goes with «yo»?",
      options: [
        { id: "a", text: "hablo" },
        { id: "b", text: "hablas" },
      ],
      correctOptionId: "a",
    },
    {
      id: "s2",
      type: "build_sentence",
      prompt: "Build: I speak Spanish.",
      targetSentence: "Yo hablo español.",
      tiles: ["Yo", "hablo", "español"],
      correctOrder: ["Yo", "hablo", "español"],
    },
  ]);

  it("no bar lint fires", () => {
    expect(lintSentenceOveruse(clean)).toEqual([]);
    expect(lintFullSentenceMcqs(clean)).toEqual([]);
    expect(lintProductionFramedMcqs(clean)).toEqual([]);
    expect(lintTheatricalPrompts(clean)).toEqual([]);
    expect(lintSpotTheMistake(clean)).toEqual([]);
    expect(lintVosotros(clean)).toEqual([]);
    expect(lintProgressiveGloss(clean)).toEqual([]);
    expect(lintMcqDistractorsCore(clean, ES_LINT_PARAMS)).toEqual([]);
  });

  it("the real-form lexicon knows core course vocabulary", () => {
    const lex = getEsRealFormLexicon();
    expect(lex.has("hablo")).toBe(true); // conjugation output
    expect(lex.has("hablaxo")).toBe(false); // invented form stays out
    expect(lex.size).toBeGreaterThan(300);
  });
});
