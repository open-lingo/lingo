import { describe, it, expect } from "vitest";
import {
  resolveAtom,
  build,
  speaking,
  reviewMatchPairs,
  audioMeaningMcq,
  listeningBuildSentence,
  listeningCompSentence,
} from "./grammarHelpers";

describe("resolveAtom", () => {
  it("returns atomId + gloss for a known reading (コーヒー → ja-m3-1-coffee)", () => {
    const r = resolveAtom("コーヒー");
    expect(r.atomId).toBe("ja-m3-1-coffee");
    expect(r.gloss).toBe("coffee");
  });

  it("returns an empty object for unknown readings", () => {
    expect(resolveAtom("not-a-real-atom-xyz")).toEqual({});
  });
});

describe("annotation builders carry atomId + gloss when reading matches an atom", () => {
  it("build(): single-token target annotation resolves", () => {
    const step = build("b1", "Say coffee in JA", "コーヒー", ["コーヒー"], ["コーヒー"]);
    expect(step.targetAnnotation).toEqual([
      { surface: "コーヒー", reading: "コーヒー", atomId: "ja-m3-1-coffee", gloss: "coffee" },
    ]);
  });

  it("speaking(): single-token target annotation resolves", () => {
    const step = speaking("s1", "コーヒー", "coffee");
    expect(step.targetAnnotation).toEqual([
      { surface: "コーヒー", reading: "コーヒー", atomId: "ja-m3-1-coffee", gloss: "coffee" },
    ]);
  });

  it("reviewMatchPairs(): every pair carries atomId when reading matches", () => {
    const step = reviewMatchPairs("rmp", [
      { kana: "コーヒー", meaningEn: "coffee", fromModule: "m3" },
      { kana: "not-a-real-atom-xyz", meaningEn: "nope", fromModule: "m3" },
    ]);
    expect(step.pairs[0].sourceAnnotation).toEqual([
      { surface: "コーヒー", reading: "コーヒー", atomId: "ja-m3-1-coffee", gloss: "coffee" },
    ]);
    // unmatched reading: still rendered, no atomId/gloss
    expect(step.pairs[1].sourceAnnotation).toEqual([
      { surface: "not-a-real-atom-xyz", reading: "not-a-real-atom-xyz" },
    ]);
  });

  it("listeningBuildSentence(): target annotation resolves when reading matches", () => {
    const step = listeningBuildSentence({
      id: "lb1",
      target: "コーヒー",
      tiles: ["コーヒー"],
      correctOrder: ["コーヒー"],
      promptEn: "Build it",
    });
    expect(step.targetAnnotation).toEqual([
      { surface: "コーヒー", reading: "コーヒー", atomId: "ja-m3-1-coffee", gloss: "coffee" },
    ]);
  });

  it("listeningCompSentence(): transcript annotation resolves", () => {
    const step = listeningCompSentence({
      id: "lc1",
      audioText: "コーヒー",
      correctMeaningEn: "coffee",
      distractorsEn: ["tea", "water", "juice"],
    });
    expect(step.transcriptAnnotation).toEqual([
      { surface: "コーヒー", reading: "コーヒー", atomId: "ja-m3-1-coffee", gloss: "coffee" },
    ]);
  });

  it("audioMeaningMcq(): transcript annotation resolves on the atom kana", () => {
    const target = { kana: "コーヒー", meaningEn: "coffee", fromModule: "m3" as const };
    const distractors = [
      { kana: "ペン", meaningEn: "pen", fromModule: "m4" as const },
      { kana: "かばん", meaningEn: "bag", fromModule: "m4" as const },
      { kana: "くるま", meaningEn: "car", fromModule: "m4" as const },
    ];
    const step = audioMeaningMcq("lca1", target, distractors);
    expect(step.transcriptAnnotation).toEqual([
      { surface: "コーヒー", reading: "コーヒー", atomId: "ja-m3-1-coffee", gloss: "coffee" },
    ]);
  });
});
