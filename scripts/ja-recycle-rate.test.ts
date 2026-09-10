import { describe, expect, it } from "vitest";
import {
  analyzeSentence,
  classSlotSkeleton,
  isAdditiveLesson,
  isSentence,
  summarize,
  type AtomMeta,
  type Classifier,
} from "./ja-recycle-lib";

// Tiny fixture registry, module 5 is "the lesson under test".
// たべる  verb, taught m3 (earlier)
// ねこ    noun, taught m1 (earlier)
// かわいい adjective, taught m2 (earlier)
// あたらしい adjective, taught m5 (THIS module — not earlier)
// くるま  noun, taught m5 (THIS module — not earlier)
// ある    verb, taught m5 (THIS module — not earlier)
// は/を/が particles — "other", unattributed
const FIXTURE: Record<string, AtomMeta> = {
  たべる: { pos: "verb", fromModule: 3 },
  ねこ: { pos: "noun", fromModule: 1 },
  かわいい: { pos: "adjective", fromModule: 2 },
  あたらしい: { pos: "adjective", fromModule: 5 },
  くるま: { pos: "noun", fromModule: 5 },
  ある: { pos: "verb", fromModule: 5 },
};
const classify: Classifier = (t) => FIXTURE[t] ?? { pos: "other", fromModule: null };

const MODULE = 5;
const SENTENCE_A = ["わたし", "は", "ねこ", "を", "たべる"]; // earlier noun + earlier verb
const SENTENCE_B = ["あたらしい", "くるま", "が", "ある"]; // zero earlier content words
const SENTENCE_C = ["ねこ", "が", "かわいい"]; // earlier noun + earlier adjective

describe("isSentence", () => {
  it("requires >=3 space-separated chunks, matching moduleCompiler's own filler-dedup heuristic", () => {
    expect(isSentence("ねこ です")).toBe(false); // 2 chunks
    expect(isSentence("ねこ が いる")).toBe(true); // 3 chunks
    expect(isSentence("  ")).toBe(false);
  });
});

describe("analyzeSentence + summarize — known recycle rate on a tiny fixture", () => {
  it("classifies each sentence's earlier-module content words correctly", () => {
    const a = analyzeSentence(SENTENCE_A, MODULE, classify);
    expect(a).toMatchObject({
      hasEarlierVerb: true,
      hasEarlierNoun: true,
      hasEarlierAdjective: false,
      hasAnyEarlier: true,
    });

    const b = analyzeSentence(SENTENCE_B, MODULE, classify);
    expect(b).toMatchObject({
      hasEarlierVerb: false,
      hasEarlierNoun: false,
      hasEarlierAdjective: false,
      hasAnyEarlier: false,
    });

    const c = analyzeSentence(SENTENCE_C, MODULE, classify);
    expect(c).toMatchObject({
      hasEarlierVerb: false,
      hasEarlierNoun: true,
      hasEarlierAdjective: true,
      hasAnyEarlier: true,
    });
  });

  it("computes the exact known recycle rate over the 3-sentence fixture: 2/3 overall, 1/3 verb, 2/3 noun, 1/3 adjective", () => {
    const stats = [SENTENCE_A, SENTENCE_B, SENTENCE_C].map((s) =>
      analyzeSentence(s, MODULE, classify),
    );
    const summary = summarize(stats);
    expect(summary.totalSentences).toBe(3);
    expect(summary.overallRecyclePct).toBeCloseTo((2 / 3) * 100, 5);
    expect(summary.verbRecyclePct).toBeCloseTo((1 / 3) * 100, 5);
    expect(summary.nounRecyclePct).toBeCloseTo((2 / 3) * 100, 5);
    expect(summary.adjRecyclePct).toBeCloseTo((1 / 3) * 100, 5);
  });

  it("returns all-zero summary for an empty lesson (no sentences) instead of dividing by zero", () => {
    const summary = summarize([]);
    expect(summary).toEqual({
      totalSentences: 0,
      overallRecyclePct: 0,
      verbRecyclePct: 0,
      nounRecyclePct: 0,
      adjRecyclePct: 0,
    });
  });
});

describe("classSlotSkeleton — same-frame near-duplicate detection", () => {
  it("collapses content words to POS slots so swapped-noun/verb sentences share a skeleton", () => {
    const skelA = classSlotSkeleton(SENTENCE_A, classify);
    const skelC = classSlotSkeleton(["いぬ", "が", "おおきい"], (t) =>
      t === "いぬ"
        ? { pos: "noun", fromModule: 1 }
        : t === "おおきい"
          ? { pos: "adjective", fromModule: 1 }
          : classify(t),
    );
    // SENTENCE_C ("ねこ が かわいい") and this swapped-noun/adjective sentence
    // ("いぬ が おおきい") are the same frame: [noun] が [adjective].
    const skelSame = classSlotSkeleton(SENTENCE_C, classify);
    expect(skelC).toBe(skelSame);
    expect(skelA).not.toBe(skelC);
  });
});

describe("isAdditiveLesson", () => {
  it("flags a lesson via the verified grammarPointId allowlist (te-oku)", () => {
    expect(
      isAdditiveLesson({
        grammarPointIds: ["te-oku", "mae-ni"],
        lessonTitle: "Doing things in advance",
        moduleTitle: "て + helper I",
      }),
    ).toBe(true);
  });

  it("does NOT false-positive on an id that merely contains the substring 'te-' mid-word", () => {
    expect(
      isAdditiveLesson({
        grammarPointIds: ["ya-incomplete-list"],
        lessonTitle: "や — an incomplete list",
        moduleTitle: "Listing things",
      }),
    ).toBe(false);
  });

  it("falls back to the kana title regex when the id isn't in the allowlist", () => {
    expect(
      isAdditiveLesson({
        grammarPointIds: ["some-future-point"],
        lessonTitle: "Trying it out: 〜てみる",
        moduleTitle: "Module X",
      }),
    ).toBe(true);
  });

  it("does not flag an unrelated grammar lesson", () => {
    expect(
      isAdditiveLesson({
        grammarPointIds: ["wa-topic"],
        lessonTitle: "は as topic marker",
        moduleTitle: "Basics",
      }),
    ).toBe(false);
  });
});
