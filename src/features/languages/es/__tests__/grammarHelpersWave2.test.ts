/**
 * Wave-2 ES factory contract tests: agreementCloze / cloze surface
 * merging / matchPairs / dialogueListen / vocabTextMcq. Wave-2 content
 * agents consume these signatures verbatim — shape drift here breaks
 * every authored module, so the assertions pin the emitted step shapes,
 * the slot-rotation determinism contract (rotate, NEVER pre-shuffle),
 * and the authoring-error throws.
 */
import { describe, it, expect } from "vitest";
// Side-effect import: registers every ES atom (factories resolve surfaces
// against the live registry at call time).
import "../curriculum";
import {
  agreementCloze,
  cloze,
  dialogueListen,
  matchPairs,
  slotFor,
  vocabTextMcq,
} from "../grammarHelpers";
import type { AgreementClozeStep } from "@/features/lesson/types";

// Fresh arrays per call so cross-test mutation can't hide.
function houseSegments(): AgreementClozeStep["segments"] {
  return [
    {
      blank: {
        id: "b1",
        correctAnswer: "Las",
        options: ["El", "La", "Los", "Las"],
      },
    },
    { text: " cas" },
    {
      blank: { id: "b2", correctAnswer: "as", options: ["o", "a", "os", "as"] },
    },
    { text: " blanc" },
    {
      blank: { id: "b3", correctAnswer: "as", options: ["o", "a", "os", "as"] },
    },
  ];
}

function blanksOf(step: AgreementClozeStep) {
  return step.segments.flatMap((s) => ("blank" in s ? [s.blank] : []));
}

describe("agreementCloze", () => {
  it("emits the step shape with production modality", () => {
    const step = agreementCloze(
      "ac-shape",
      houseSegments(),
      "The white houses",
      "Las casas blancas",
      ["maestro"],
    );
    expect(step.type).toBe("agreement_cloze");
    expect(step.id).toBe("ac-shape");
    expect(step.meaningEn).toBe("The white houses");
    expect(step.audioText).toBe("Las casas blancas");
    expect(step.modality).toBe("production");
    expect(step.exercisedAtoms).toEqual(["es:maestro"]);
    // Text segments survive verbatim, in order.
    expect(step.segments[1]).toEqual({ text: " cas" });
    expect(step.segments[3]).toEqual({ text: " blanc" });
  });

  it("rotates each blank independently: correct answer lands at slotFor(`${id}-${blankId}`)", () => {
    const step = agreementCloze("ac-rot", houseSegments(), "meaning");
    for (const blank of blanksOf(step)) {
      const slot = slotFor(`ac-rot-${blank.id}`, blank.options.length);
      expect(blank.options[slot]).toBe(blank.correctAnswer);
    }
    // b2 and b3 share an option set — identical sets must still be
    // allowed to land in different slots (per-blank rotation key).
    const [, b2, b3] = blanksOf(step);
    expect([...b2.options].sort()).toEqual([...b3.options].sort());
  });

  it("rotates — never pre-shuffles: distractor relative order is preserved", () => {
    const step = agreementCloze("ac-order", houseSegments(), "meaning");
    const b1 = blanksOf(step)[0];
    expect(b1.options.filter((o) => o !== "Las")).toEqual(["El", "La", "Los"]);
    expect([...b1.options].sort()).toEqual(["El", "La", "Las", "Los"]);
  });

  it("is deterministic across calls", () => {
    const a = agreementCloze("ac-det", houseSegments(), "m", "audio", ["maestro"]);
    const b = agreementCloze("ac-det", houseSegments(), "m", "audio", ["maestro"]);
    expect(a).toEqual(b);
  });

  it("allows empty exercised surfaces (graded, no SRS write) and drops unknowns", () => {
    const none = agreementCloze("ac-none", houseSegments(), "m");
    expect(none.exercisedAtoms).toEqual([]);
    const mixed = agreementCloze("ac-mixed", houseSegments(), "m", undefined, [
      "maestro",
      "zzz-not-a-real-surface",
    ]);
    expect(mixed.exercisedAtoms).toEqual(["es:maestro"]);
  });

  it("throws when a blank's correctAnswer is missing from its options", () => {
    expect(() =>
      agreementCloze(
        "ac-bad",
        [{ blank: { id: "b1", correctAnswer: "as", options: ["o", "a"] } }],
        "m",
      ),
    ).toThrow(/correctAnswer 'as' missing/);
  });

  it("throws when segments contain no blanks", () => {
    expect(() => agreementCloze("ac-empty", [{ text: "hola" }], "m")).toThrow(
      /no blanks/,
    );
  });
});

describe("cloze — exercisedAtomSurfaces merging", () => {
  it("stays backward compatible: old call shape credits only the correct particle", () => {
    const step = cloze(
      "cz-compat",
      "",
      " casa",
      "de",
      ["de", "y", "o", "es"],
      "the teacher's",
      "la casa",
    );
    expect(step.exercisedAtoms).toEqual(["es:de"]);
    expect(step.options[slotFor("cz-compat", 4)]).toBe("de");
  });

  it("merges + dedupes the correct particle with the extra surfaces", () => {
    const step = cloze(
      "cz-merge",
      "",
      " casa",
      "de",
      ["de", "y", "o", "es"],
      "the teacher's",
      "la casa",
      undefined,
      ["maestro", "de", "maestro"],
    );
    expect(step.exercisedAtoms).toEqual(["es:de", "es:maestro"]);
  });

  it("silently drops unknown extra surfaces (sentence-factory convention)", () => {
    const step = cloze(
      "cz-unknown",
      "",
      " casa",
      "de",
      ["de", "y", "o", "es"],
      "the teacher's",
      "la casa",
      undefined,
      ["zzz-not-a-real-surface"],
    );
    expect(step.exercisedAtoms).toEqual(["es:de"]);
  });
});

describe("matchPairs", () => {
  const SIX = ["hola", "adiós", "gracias", "maestro", "sí", "no"];

  it("builds surface ↔ gloss pairs from the atom registry", () => {
    const step = matchPairs("mp-ok", SIX);
    expect(step.id).toBe("mp-ok-match");
    expect(step.type).toBe("match_pairs");
    expect(step.playAudioOnSelect).toBe(true);
    expect(step.modality).toBe("recognition");
    expect(step.pairs).toHaveLength(6);
    expect(step.pairs[0]).toEqual({ id: "p-0", source: "hola", target: "hello" });
    expect(step.pairs[3]).toEqual({ id: "p-3", source: "maestro", target: "teacher (m)" });
    // ES pairs carry no ruby annotation (Latin script).
    expect("sourceAnnotation" in step.pairs[0]).toBe(false);
    expect(step.exercisedAtoms).toEqual(SIX.map((s) => `es:${s}`));
  });

  it("throws below the 6-pair ratchet floor", () => {
    expect(() => matchPairs("mp-thin", SIX.slice(0, 5))).toThrow(/>= 6/);
  });

  it("throws on a surface with no registered atom (gloss side would be empty)", () => {
    expect(() =>
      matchPairs("mp-unknown", [...SIX.slice(0, 5), "zzz-not-a-real-surface"]),
    ).toThrow(/not a registered atom/);
  });
});

describe("dialogueListen", () => {
  const LINES = [
    { speaker: "Ana", text: "¡Hola! ¿Cómo estás?" },
    { speaker: "You", text: "Muy bien, gracias.", audioText: "Muy bien gracias" },
  ];
  const QUESTION = {
    id: "q1",
    prompt: "How is the second speaker doing?",
    correctText: "Very well",
    distractors: ["Badly", "So-so", "They don't say"] as [
      string,
      string,
      string,
    ],
  };

  it("maps Spanish text into the kana slot and defaults the reveal gate", () => {
    const step = dialogueListen({
      id: "dl-ok",
      lines: LINES,
      questions: [QUESTION],
      exercisedAtomSurfaces: ["gracias"],
    });
    expect(step.type).toBe("dialogue_listen");
    expect(step.format).toBe("dialogue");
    expect(step.transcriptRevealAfter).toBe("first-answer");
    expect(step.modality).toBe("recognition");
    expect(step.lines).toEqual([
      { speaker: "Ana", kana: "¡Hola! ¿Cómo estás?", audioText: undefined },
      { speaker: "You", kana: "Muy bien, gracias.", audioText: "Muy bien gracias" },
    ]);
    expect(step.exercisedAtoms).toEqual(["es:gracias"]);
  });

  it("slot-rotates each question's options by `${id}-${q.id}`", () => {
    const step = dialogueListen({
      id: "dl-rot",
      lines: LINES,
      questions: [QUESTION],
    });
    const q = step.questions[0];
    expect(q.correctOptionId).toBe("correct");
    expect(q.options).toHaveLength(4);
    expect(q.options[slotFor("dl-rot-q1", 4)].id).toBe("correct");
    expect(q.options.map((o) => o.text).sort()).toEqual(
      ["Very well", ...QUESTION.distractors].sort(),
    );
  });

  it("validates line count (1-8), speaker presence, and question count (1-3)", () => {
    expect(() =>
      dialogueListen({ id: "dl-0", lines: [], questions: [QUESTION] }),
    ).toThrow(/lines.length must be 1-8/);
    expect(() =>
      dialogueListen({
        id: "dl-9",
        lines: Array.from({ length: 9 }, (_, i) => ({
          speaker: "A",
          text: `line ${i}`,
        })),
        questions: [QUESTION],
      }),
    ).toThrow(/lines.length must be 1-8/);
    expect(() =>
      dialogueListen({
        id: "dl-nospeaker",
        lines: [{ speaker: "", text: "hola" }],
        questions: [QUESTION],
      }),
    ).toThrow(/must have a speaker/);
    expect(() =>
      dialogueListen({ id: "dl-noq", lines: LINES, questions: [] }),
    ).toThrow(/questions.length must be 1-3/);
    expect(() =>
      dialogueListen({
        id: "dl-4q",
        lines: LINES,
        questions: [
          { ...QUESTION, id: "q1" },
          { ...QUESTION, id: "q2" },
          { ...QUESTION, id: "q3" },
          { ...QUESTION, id: "q4" },
        ],
      }),
    ).toThrow(/questions.length must be 1-3/);
  });
});

describe("vocabTextMcq", () => {
  it("defaults the prompt to the target's gloss", () => {
    const step = vocabTextMcq("vtm-ok", "maestro", ["maestra", "estudiante", "señora"]);
    expect(step.type).toBe("multiple_choice");
    expect(step.prompt).toBe('Which word means "teacher (m)"?');
    expect(step.correctOptionId).toBe("correct");
    expect(step.options).toHaveLength(4);
    expect(step.options[slotFor("vtm-ok", 4)]).toEqual({
      id: "correct",
      text: "maestro",
    });
    expect(step.options.map((o) => o.text).sort()).toEqual(
      ["maestro", "maestra", "estudiante", "señora"].sort(),
    );
    expect(step.optionsHideRomaji).toBe(true);
    expect(step.exercisedAtoms).toEqual(["es:maestro"]);
    expect(step.modality).toBe("recognition");
  });

  it("respects promptOverride and is deterministic", () => {
    const a = vocabTextMcq("vtm-p", "maestro", ["maestra", "estudiante", "señora"], "Pick 'teacher'");
    const b = vocabTextMcq("vtm-p", "maestro", ["maestra", "estudiante", "señora"], "Pick 'teacher'");
    expect(a.prompt).toBe("Pick 'teacher'");
    expect(a).toEqual(b);
  });

  it("throws when the target isn't a registered atom (no gloss for the prompt)", () => {
    expect(() =>
      vocabTextMcq("vtm-unknown", "zzz-not-a-real-surface", ["a", "b", "c"]),
    ).toThrow(/not a registered atom/);
  });

  it("throws with fewer than 3 distractors distinct from the target", () => {
    expect(() => vocabTextMcq("vtm-thin", "maestro", ["maestra", "estudiante"])).toThrow(
      />= 3 distractors/,
    );
    // A target dupe in the distractor list doesn't count toward the 3.
    expect(() =>
      vocabTextMcq("vtm-dupe", "maestro", ["maestro", "maestra", "estudiante"]),
    ).toThrow(/>= 3 distractors/);
  });
});
