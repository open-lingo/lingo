import { describe, it, expect } from "vitest";
import {
  isBuildCorrect,
  jaVariantSurfaces,
  alsoAcceptedSurfaces,
  lintAlsoAccepted,
  normalizeBuildAnswer,
  MAX_ALSO_ACCEPTED,
  type BuildGradable,
} from "./buildAcceptance";

const esStep = {
  id: "es-test-build-also",
  type: "build_sentence",
  targetSentence: "ahora voy a la playa",
  tiles: ["ahora", "voy", "a", "la", "playa", "yo", "casa"],
  correctOrder: ["ahora", "voy", "a", "la", "playa"],
  alsoAccepted: ["voy a la playa ahora", "yo voy a la playa ahora"],
  granularity: "word" as const,
};

function grade(placed: string[], step: BuildGradable = esStep) {
  return isBuildCorrect(placed, step, jaVariantSurfaces(step, 9), alsoAcceptedSurfaces(step));
}

describe("build grading — author-listed alsoAccepted", () => {
  it("accepts the exact authored order", () => {
    expect(grade(["ahora", "voy", "a", "la", "playa"])).toBe(true);
  });
  it("accepts each listed alternate, built tile by tile", () => {
    expect(grade(["voy", "a", "la", "playa", "ahora"])).toBe(true);
    expect(grade(["yo", "voy", "a", "la", "playa", "ahora"])).toBe(true);
  });
  it("rejects an unlisted reorder and garbage", () => {
    expect(grade(["playa", "la", "a", "voy", "ahora"])).toBe(false);
    expect(grade(["voy", "a", "la", "casa", "ahora"])).toBe(false);
    expect(grade(["voy", "a", "la", "playa"])).toBe(false);
  });
  it("is exact when the field is absent — the pre-2026-09-06 behavior", () => {
    const { alsoAccepted: _drop, ...bare } = esStep;
    expect(alsoAcceptedSurfaces(bare)).toBeNull();
    expect(grade(["voy", "a", "la", "playa", "ahora"], bare)).toBe(false);
    expect(grade(["ahora", "voy", "a", "la", "playa"], bare)).toBe(true);
  });
  it("never applies to listening_build (you build what you heard)", () => {
    const listen = { ...esStep, type: "listening_build" };
    expect(alsoAcceptedSurfaces(listen)).toBeNull();
    expect(grade(["voy", "a", "la", "playa", "ahora"], listen)).toBe(false);
  });
  it("does not open the JA variant lane for a Spanish target", () => {
    expect(jaVariantSurfaces(esStep, 9)).toBeNull();
  });
  it("normalises case, inverted marks and terminal punctuation but keeps word boundaries", () => {
    expect(normalizeBuildAnswer("¿Voy a la playa?")).toBe("voy a la playa");
    expect(normalizeBuildAnswer("a la")).not.toBe(normalizeBuildAnswer("ala"));
  });
});

describe("lintAlsoAccepted", () => {
  it("passes a well-formed list", () => {
    expect(lintAlsoAccepted(esStep)).toEqual([]);
  });
  it("fails on more than the cap, duplicates, the answer itself, and unbuildable words", () => {
    const bad = {
      ...esStep,
      alsoAccepted: [
        "ahora voy a la playa",
        "voy a la playa ahora",
        "Voy a la playa ahora.",
        "voy a la playa mañana",
      ],
    };
    const problems = lintAlsoAccepted(bad);
    expect(problems.some((p) => /> max/.test(p))).toBe(true);
    expect(problems.some((p) => /is the authored answer/.test(p))).toBe(true);
    expect(problems.some((p) => /listed twice/.test(p))).toBe(true);
    expect(problems.some((p) => /mañana.*cannot be laid out/.test(p))).toBe(true);
    expect(MAX_ALSO_ACCEPTED).toBe(3);
  });
  it("keeps punctuation-fused tiles at their edge", () => {
    const step = {
      id: "q",
      tiles: ["¿tienes", "un", "perro?", "tú", "gato"],
      correctOrder: ["¿tienes", "un", "perro?"],
      alsoAccepted: ["¿tienes tú un perro?", "un perro ¿tienes?"],
    };
    const problems = lintAlsoAccepted(step);
    expect(problems.filter((p) => /tienes tú/.test(p))).toEqual([]);
    expect(problems.some((p) => /moves the punctuated tile «perro» off its edge/.test(p))).toBe(true);
  });
  it("covers with whole multi-word tiles, never by splitting them", () => {
    const step = {
      id: "fr",
      tiles: ["je vais", "au cinéma", "ce soir", "à la", "gare"],
      correctOrder: ["je vais", "au cinéma", "ce soir"],
      alsoAccepted: ["ce soir je vais au cinéma"],
    };
    expect(lintAlsoAccepted(step)).toEqual([]);
    // «je» alone is not a tile even though «je vais» is
    expect(lintAlsoAccepted({ ...step, alsoAccepted: ["je ce soir vais au cinéma"] }).length).toBe(1);
  });
  it("respects tile multiplicity", () => {
    const step = {
      id: "x",
      tiles: ["la", "casa", "es", "blanca"],
      correctOrder: ["la", "casa", "es", "blanca"],
      alsoAccepted: ["la casa es la blanca"],
    };
    expect(lintAlsoAccepted(step).some((p) => /cannot be laid out/.test(p))).toBe(true);
  });
});
