import { describe, it, expect } from "vitest";
import {
  resolveAtom,
  build,
  speaking,
  reviewMatchPairs,
  audioMeaningMcq,
  listeningBuildSentence,
  listeningCompSentence,
  buildSentenceAnnotation,
  resolveEligibleKanjiAtomId,
  vocabMcq,
  type ReviewAtom,
} from "./grammarHelpers";

const HAS_HAN = /\p{Script=Han}/u;
/** Concatenated segment surfaces must reproduce the input sentence exactly. */
const joinSurfaces = (segs: { surface: string }[]) =>
  segs.map((s) => s.surface).join("");

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

// ────────────── sentence-level kanji: conservative atomId resolver ──────────

describe("resolveEligibleKanjiAtomId — never returns an atomId for an ambiguous token", () => {
  it("returns the atomId for a non-homographic, kanji-eligible word", () => {
    // まいにち = 毎日 — exactly one atom carries this kana AND it is eligible.
    expect(resolveEligibleKanjiAtomId("まいにち")).toBe("mainichi");
  });

  it("returns undefined for HOMOGRAPH kana (≥2 atoms share the surface)", () => {
    // はな = 花 (flower) / 鼻 (nose); に = 二 (two) / particle に; はし = 橋 / 箸.
    // Even though at least one branch is kanji-eligible, the kana→atom map is
    // last-write-wins, so we refuse to guess — WRONG kanji is worse than kana.
    expect(resolveEligibleKanjiAtomId("はな")).toBeUndefined();
    expect(resolveEligibleKanjiAtomId("に")).toBeUndefined();
    expect(resolveEligibleKanjiAtomId("はし")).toBeUndefined();
  });

  it("returns undefined for words with no eligible kanji, particles, and conjugated forms", () => {
    expect(resolveEligibleKanjiAtomId("じゅぎょう")).toBeUndefined(); // 授業: 授/業 not in catalog
    expect(resolveEligibleKanjiAtomId("てつだう")).toBeUndefined(); // 手伝う: 伝 not in catalog
    expect(resolveEligibleKanjiAtomId("を")).toBeUndefined(); // particle
    expect(resolveEligibleKanjiAtomId("のまない")).toBeUndefined(); // conjugated, not an atom
    expect(resolveEligibleKanjiAtomId("てつだった")).toBeUndefined(); // conjugated, not an atom
  });
});

describe("buildSentenceAnnotation — multi-segment, atomIds only on unambiguous eligible words", () => {
  const SENTENCE = "まいにち ともだちを てつだう";

  it("emits a segment carrying an atomId ONLY for the eligible word; others stay bare", () => {
    const segs = buildSentenceAnnotation(SENTENCE);
    // Concatenation reproduces the sentence byte-for-byte.
    expect(joinSurfaces(segs)).toBe(SENTENCE);
    // Two segments carry an atomId: まいにち (毎日) and ともだち (友達 — 達
    // joined the catalog in the 2026-07-28 exposure tier). The rule is
    // unchanged; what moved is which words are still catalog gaps.
    const withAtom = segs.filter((s) => s.atomId);
    expect(withAtom.map((s) => s.atomId)).toEqual([
      "mainichi",
      "ja-m3-3-v-tomodachi",
    ]);
    expect(withAtom[0]).toMatchObject({
      surface: "まいにち",
      reading: "まいにち",
      atomId: "mainichi",
    });
    // を (particle) and てつだう (手伝う — 伝 has no entry) stay bare kana.
    const rest = segs.filter((s) => !s.atomId).map((s) => s.surface).join("");
    expect(rest).toContain("を");
    expect(rest).toContain("てつだう");
    // No segment carries kanji yet (that's the pass's job).
    expect(segs.some((s) => HAS_HAN.test(s.surface))).toBe(false);
  });

  it("does NOT attach an atomId to a homograph token in a sentence (stays bare kana)", () => {
    // はな (花/鼻) must never resolve — the whole sentence stays atom-less.
    const segs = buildSentenceAnnotation("はなが すきです");
    expect(joinSurfaces(segs)).toBe("はなが すきです");
    expect(segs.some((s) => s.atomId === "hana" || s.atomId === "hana-nose")).toBe(false);
  });

  it("keeps a single-word target as the historical singleton shape (atomId + gloss)", () => {
    // A whole-string single atom short-circuits — identical to the old
    // buildSingletonAnnotation output (single-word factories rely on this).
    expect(buildSentenceAnnotation("コーヒー")).toEqual([
      { surface: "コーヒー", reading: "コーヒー", atomId: "ja-m3-1-coffee", gloss: "coffee" },
    ]);
  });
});

describe("sentence factories emit multi-segment annotations", () => {
  const SENTENCE = "まいにち ともだちを てつだう";
  it("build(): targetAnnotation is multi-segment with one eligible atomId; tiles/order stay kana", () => {
    const tiles = ["まいにち", "ともだち", "を", "てつだう"];
    const step = build("bs-multi", "Every day I help a friend", SENTENCE, tiles, tiles);
    expect(joinSurfaces(step.targetAnnotation!)).toBe(SENTENCE);
    expect(step.targetAnnotation!.filter((s) => s.atomId).map((s) => s.atomId)).toEqual([
      "mainichi",
      "ja-m3-3-v-tomodachi", // 友達, eligible since the exposure tier
    ]);
    // Grading fields are untouched, pure kana.
    expect(step.tiles).toEqual(tiles);
    expect(step.correctOrder).toEqual(tiles);
    expect(step.targetSentence).toBe(SENTENCE);
    expect(step.audioKey).toBe(SENTENCE);
  });
});

describe("vocabMcq", () => {
  it("never offers two options with the same emoji, even when the distractor pool holds a same-glyph pair", () => {
    const target: ReviewAtom = {
      kana: "test-target-fruit",
      meaningEn: "test target",
      emoji: "🍎",
      fromModule: "m1",
    };
    // 🍇 is deliberately shared by two distinct pool entries — before the
    // emoji-dedup guard, both could land as separate options in the same
    // step (a learner-facing bug: two visually identical foils).
    const pool: ReviewAtom[] = [
      { kana: "test-grape-a", meaningEn: "test grape a", emoji: "🍇", fromModule: "m1" },
      { kana: "test-grape-b", meaningEn: "test grape b (same glyph)", emoji: "🍇", fromModule: "m1" },
      { kana: "test-banana", meaningEn: "test banana", emoji: "🍌", fromModule: "m1" },
      { kana: "test-cherry", meaningEn: "test cherry", emoji: "🍒", fromModule: "m1" },
    ];
    const step = vocabMcq("t-vocab-mcq-dedupe", target, pool);
    const emojis = step.options.map((o) => o.emoji);
    // 4 options total (target + 3 distractors); all must be visually distinct.
    expect(emojis).toHaveLength(4);
    expect(new Set(emojis).size).toBe(emojis.length);
    // Exactly one of the 🍇 twins survives — the pool only offers 3 distinct
    // emoji among 4 entries, so all 3 distinct emoji (including 🍇 once)
    // must appear for the step to have enough distractors at all.
    expect(emojis.filter((e) => e === "🍇")).toHaveLength(1);
  });
});
