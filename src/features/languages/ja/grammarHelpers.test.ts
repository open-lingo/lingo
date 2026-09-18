import { describe, it, expect } from "vitest";
import {
  resolveAtom,
  build,
  speaking,
  reviewMatchPairs,
  audioMeaningMcq,
  audioImageMcq,
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

  it("listeningBuildSentence(): translation defaults to promptEn when omitted (TestFlight #142)", () => {
    const step = listeningBuildSentence({
      id: "lb2",
      target: "コーヒー",
      tiles: ["コーヒー"],
      correctOrder: ["コーヒー"],
      promptEn: "Coffee.",
    });
    expect(step.translation).toBe("Coffee.");
  });

  it("listeningBuildSentence(): an explicit translation wins over promptEn (moduleCompiler's generic listening prompt)", () => {
    const step = listeningBuildSentence({
      id: "lb3",
      target: "コーヒー",
      tiles: ["コーヒー"],
      correctOrder: ["コーヒー"],
      promptEn: "Build what you hear.",
      translation: "Coffee.",
    });
    expect(step.prompt).toBe("Build what you hear.");
    expect(step.translation).toBe("Coffee.");
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
    // じゅぎょう (授業) and てつだう (手伝う) used to be the examples here —
    // the KANJICAT lane (2026-09-18) catalogued every uncatalogued Jōyō
    // character course-wide (298 of them, including 授/業/伝), so both are
    // now catalog-eligible. うそ (嘘, "a lie") is the current example of
    // "no eligible kanji": 嘘 is one of the 6 characters that lane
    // individually reviewed and permanently excluded as non-Jōyō (see
    // `joyo.ts` and `kanjiCatalogCoverage.test.ts`'s
    // `ALLOWED_UNCATALOGUED_CHARS`), not backlog waiting to be added.
    expect(resolveEligibleKanjiAtomId("うそ")).toBeUndefined(); // 嘘: non-Jōyō, permanent exception
    expect(resolveEligibleKanjiAtomId("しかる")).toBeUndefined(); // 叱る: non-Jōyō, permanent exception
    expect(resolveEligibleKanjiAtomId("を")).toBeUndefined(); // particle
    expect(resolveEligibleKanjiAtomId("のまない")).toBeUndefined(); // conjugated, not an atom
    expect(resolveEligibleKanjiAtomId("てつだった")).toBeUndefined(); // conjugated, not an atom
  });
});

describe("buildSentenceAnnotation — multi-segment, atomIds only on unambiguous eligible words", () => {
  const SENTENCE = "まいにち ともだちを てつだう";

  it("emits a segment carrying an atomId ONLY for eligible words; particles stay bare", () => {
    const segs = buildSentenceAnnotation(SENTENCE);
    // Concatenation reproduces the sentence byte-for-byte.
    expect(joinSurfaces(segs)).toBe(SENTENCE);
    // Three segments carry an atomId: まいにち (毎日), ともだち (友達 — 達
    // joined the catalog in the 2026-07-28 exposure tier), and てつだう
    // (手伝う — 伝 joined the catalog in the KANJICAT lane, 2026-09-18: full
    // Jōyō coverage). The rule is unchanged; what moved is which words are
    // still catalog gaps.
    const withAtom = segs.filter((s) => s.atomId);
    expect(withAtom.map((s) => s.atomId)).toEqual([
      "mainichi",
      "ja-m3-3-v-tomodachi",
      "tetsudau",
    ]);
    expect(withAtom[0]).toMatchObject({
      surface: "まいにち",
      reading: "まいにち",
      atomId: "mainichi",
    });
    // Only を (particle) and the surrounding spaces stay bare kana now.
    const rest = segs.filter((s) => !s.atomId).map((s) => s.surface).join("");
    expect(rest.trim()).toBe("を");
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
  it("build(): targetAnnotation is multi-segment with multiple eligible atomIds; tiles/order stay kana", () => {
    const tiles = ["まいにち", "ともだち", "を", "てつだう"];
    const step = build("bs-multi", "Every day I help a friend", SENTENCE, tiles, tiles);
    expect(joinSurfaces(step.targetAnnotation!)).toBe(SENTENCE);
    expect(step.targetAnnotation!.filter((s) => s.atomId).map((s) => s.atomId)).toEqual([
      "mainichi",
      "ja-m3-3-v-tomodachi", // 友達, eligible since the exposure tier
      "tetsudau", // 手伝う, eligible since the KANJICAT lane (伝 catalogued)
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

describe("audioImageMcq — TestFlight #163", () => {
  it("throws (never renders) for a registry-blocked target, even when it's not on WORD_IMAGE_MCQ_BLOCKLIST", () => {
    // ならう — real registry atom, `blocked: true`, NOT on the curated
    // WORD_IMAGE_MCQ_BLOCKLIST (courseAtoms.ts is the source of truth here).
    const narau: ReviewAtom = {
      kana: "ならう",
      meaningEn: "to learn",
      emoji: "🎓",
      fromModule: "m30",
      blocked: true,
      pos: "verb",
    };
    const pool: ReviewAtom[] = [
      { kana: "test-a", meaningEn: "a", emoji: "🍎", fromModule: "m1" },
      { kana: "test-b", meaningEn: "b", emoji: "🍌", fromModule: "m1" },
      { kana: "test-c", meaningEn: "c", emoji: "🍒", fromModule: "m1" },
    ];
    expect(() => audioImageMcq("t-blocked-target", narau, pool)).toThrow(/image-blocked/);
  });

  it("never offers a registry-blocked atom as a distractor tile either", () => {
    const target: ReviewAtom = { kana: "test-target", meaningEn: "target", emoji: "🍎", fromModule: "m1" };
    const blockedDistractor: ReviewAtom = {
      kana: "test-blocked-word",
      meaningEn: "to practice",
      emoji: "📓",
      fromModule: "m30" as const,
      blocked: true,
      pos: "verb",
    };
    const pool: ReviewAtom[] = [
      blockedDistractor,
      { kana: "test-b", meaningEn: "b", emoji: "🍌", fromModule: "m1" },
      { kana: "test-c", meaningEn: "c", emoji: "🍒", fromModule: "m1" },
      { kana: "test-d", meaningEn: "d", emoji: "🍑", fromModule: "m1" },
    ];
    const step = audioImageMcq("t-blocked-distractor", target, pool);
    const words = step.options.map((o) => o.word);
    expect(words).not.toContain(blockedDistractor.kana);
  });

  it("never offers two options with the same emoji — the exact #163 collision (れんしゅうする's 📓 vs ノート's); audioImageMcq had NO dedup guard before this fix", () => {
    const target: ReviewAtom = { kana: "test-target-fruit", meaningEn: "test target", emoji: "🍎", fromModule: "m1" };
    const pool: ReviewAtom[] = [
      { kana: "test-grape-a", meaningEn: "test grape a", emoji: "🍇", fromModule: "m1" },
      { kana: "test-grape-b", meaningEn: "test grape b (same glyph)", emoji: "🍇", fromModule: "m1" },
      { kana: "test-banana", meaningEn: "test banana", emoji: "🍌", fromModule: "m1" },
      { kana: "test-cherry", meaningEn: "test cherry", emoji: "🍒", fromModule: "m1" },
    ];
    const step = audioImageMcq("t-audio-image-dedupe", target, pool);
    const emojis = step.options.map((o) => o.emoji);
    expect(emojis).toHaveLength(4);
    expect(new Set(emojis).size).toBe(emojis.length);
  });

  it("throws rather than render a wrong tile when collisions leave fewer than 3 eligible distractors", () => {
    const target: ReviewAtom = { kana: "test-target-2", meaningEn: "target 2", emoji: "🍎", fromModule: "m1" };
    // Only 2 distinct emoji available among 3 pool entries once the
    // duplicate is deduped — not enough for a 4-option MCQ.
    const pool: ReviewAtom[] = [
      { kana: "test-dup-a", meaningEn: "dup a", emoji: "🍇", fromModule: "m1" },
      { kana: "test-dup-b", meaningEn: "dup b", emoji: "🍇", fromModule: "m1" },
      { kana: "test-single", meaningEn: "single", emoji: "🍌", fromModule: "m1" },
    ];
    expect(() => audioImageMcq("t-thin-pool", target, pool)).toThrow(/not enough/);
  });
});

describe("audioMeaningMcq — part-of-speech tiering (TestFlight #164(c))", () => {
  it("real #164(c) case: 'elevator' never draws 'do' when ≥3 noun candidates exist", () => {
    const elevator: ReviewAtom = { kana: "エレベーター", meaningEn: "elevator", fromModule: "m30" as const, pos: "noun" };
    const shimasu: ReviewAtom = { kana: "します", meaningEn: "do", fromModule: "m7", pos: "verb" };
    const pool: ReviewAtom[] = [
      shimasu,
      { kana: "test-noun-1", meaningEn: "chair", fromModule: "m1", pos: "noun" },
      { kana: "test-noun-2", meaningEn: "window", fromModule: "m1", pos: "noun" },
      { kana: "test-noun-3", meaningEn: "table", fromModule: "m1", pos: "noun" },
      { kana: "test-noun-4", meaningEn: "lamp", fromModule: "m1", pos: "noun" },
    ];
    const step = audioMeaningMcq("t-elevator", elevator, pool);
    const texts = step.options.map((o) => o.text);
    expect(texts).not.toContain("do");
  });

  it("never mixes a verb form with nouns when ≥3 same-POS candidates exist", () => {
    const target: ReviewAtom = { kana: "test-noun-target", meaningEn: "book", fromModule: "m1", pos: "noun" };
    const pool: ReviewAtom[] = [
      { kana: "test-verb-1", meaningEn: "to run", fromModule: "m1", pos: "verb" },
      { kana: "test-noun-a", meaningEn: "pen", fromModule: "m1", pos: "noun" },
      { kana: "test-noun-b", meaningEn: "cup", fromModule: "m1", pos: "noun" },
      { kana: "test-noun-c", meaningEn: "bag", fromModule: "m1", pos: "noun" },
      { kana: "test-noun-d", meaningEn: "shoe", fromModule: "m1", pos: "noun" },
    ];
    const step = audioMeaningMcq("t-pos-mix", target, pool);
    const texts = step.options.map((o) => o.text);
    expect(texts).not.toContain("to run");
  });

  it("relaxes to any POS only when same-POS candidates are too few (still returns 3 distractors)", () => {
    const target: ReviewAtom = { kana: "test-lonely-noun", meaningEn: "cloud", fromModule: "m1", pos: "noun" };
    const pool: ReviewAtom[] = [
      { kana: "test-verb-a", meaningEn: "to walk", fromModule: "m1", pos: "verb" },
      { kana: "test-verb-b", meaningEn: "to eat", fromModule: "m1", pos: "verb" },
      { kana: "test-adj-a", meaningEn: "tall", fromModule: "m1", pos: "adjective" },
      { kana: "test-noun-only", meaningEn: "rock", fromModule: "m1", pos: "noun" },
    ];
    const step = audioMeaningMcq("t-relax", target, pool);
    expect(step.options).toHaveLength(4);
  });

  it("prefers same verb form (ます vs dictionary) before relaxing to a noun", () => {
    // Target is polite-form (ます). Same-form pool has only 1 candidate, so
    // tier 2 (same POS, any form) must supply the rest — it must NOT skip
    // straight to tier 3 (any POS) while a noun sits in the pool too.
    const target: ReviewAtom = { kana: "たべます", meaningEn: "eat (polite)", fromModule: "m7", pos: "verb" };
    const pool: ReviewAtom[] = [
      { kana: "のみます", meaningEn: "drink (polite)", fromModule: "m7", pos: "verb" },
      { kana: "いく", meaningEn: "go (dict)", fromModule: "m7", pos: "verb" },
      { kana: "みる", meaningEn: "watch (dict)", fromModule: "m7", pos: "verb" },
      { kana: "test-noun-distractor", meaningEn: "desk", fromModule: "m1", pos: "noun" },
    ];
    const step = audioMeaningMcq("t-verb-form", target, pool);
    const texts = step.options.map((o) => o.text);
    expect(texts).not.toContain("desk");
  });

  it("is deterministic for the same seed/target/pool", () => {
    const target: ReviewAtom = { kana: "test-det-target", meaningEn: "target", fromModule: "m1", pos: "noun" };
    const pool: ReviewAtom[] = [
      { kana: "test-det-a", meaningEn: "a", fromModule: "m1", pos: "noun" },
      { kana: "test-det-b", meaningEn: "b", fromModule: "m1", pos: "noun" },
      { kana: "test-det-c", meaningEn: "c", fromModule: "m1", pos: "noun" },
      { kana: "test-det-d", meaningEn: "d", fromModule: "m1", pos: "noun" },
      { kana: "test-det-e", meaningEn: "e", fromModule: "m1", pos: "verb" },
    ];
    const step1 = audioMeaningMcq("t-det", target, pool);
    const step2 = audioMeaningMcq("t-det", target, pool);
    expect(step1).toEqual(step2);
  });
});
