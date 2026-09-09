import { describe, expect, it } from "vitest";
import { buildPairSession, gradePair, PAIR_SESSION_SIZE, toQuestion } from "./pairDrill";
import { getParticlePair, NI_TIME_CARD, PARTICLE_PAIRS, usageCardsForPair } from "./particlePairs";
import type { PairSentence } from "./mineParticlePairs";

const pair = getParticlePair("kara-made")!;

const sentence = (text: string, a: string, b: string, id = text): PairSentence => {
  const s1 = text.indexOf(a);
  const s2 = text.indexOf(b, s1 + a.length);
  return {
    id,
    text,
    translation: "x",
    module: 16,
    blanks: [
      { particle: a, start: s1, end: s1 + a.length },
      { particle: b, start: s2, end: s2 + b.length },
    ],
  };
};

describe("toQuestion", () => {
  it("splits the text around both blanks and carries the answers in order", () => {
    const q = toQuestion(pair, sentence("くじから ごじまで はたらく", "から", "まで"), "s");
    expect(q.segments).toEqual(["くじ", " ごじ", " はたらく"]);
    expect(q.answers).toEqual(["から", "まで"]);
    // Bank = the pair's two particles + the foil, no duplicates.
    expect([...q.options].sort()).toEqual(["から", "に", "まで"].sort());
  });
});

describe("gradePair", () => {
  const q = toQuestion(pair, sentence("くじから ごじまで はたらく", "から", "まで"), "s");

  it("is correct only when both blanks are right", () => {
    expect(gradePair(q, ["から", "まで"])).toEqual({ blanks: [true, true], correct: true });
  });
  it("grades per blank — a swap fails both, a single slip fails one", () => {
    expect(gradePair(q, ["まで", "から"])).toEqual({ blanks: [false, false], correct: false });
    expect(gradePair(q, ["から", "に"])).toEqual({ blanks: [true, false], correct: false });
    expect(gradePair(q, ["に", "まで"])).toEqual({ blanks: [false, true], correct: false });
  });
  it("an unfilled blank is wrong, never a crash", () => {
    expect(gradePair(q, ["から", null])).toEqual({ blanks: [true, false], correct: false });
  });
});

describe("buildPairSession", () => {
  const pool = Array.from({ length: 20 }, (_, i) =>
    sentence(`くじから ごじまで ${i}`, "から", "まで", `s${i}`),
  );

  it("caps at the session size and is deterministic per seed", () => {
    const a = buildPairSession(pair, pool, "seed-1");
    const b = buildPairSession(pair, pool, "seed-1");
    expect(a).toHaveLength(PAIR_SESSION_SIZE);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });

  it("pushes already-served sentences to the back so a new set is actually new", () => {
    const first = buildPairSession(pair, pool, "seed-1");
    const served = new Set(first.map((q) => q.id));
    const second = buildPairSession(pair, pool, "seed-2", served);
    expect(second.some((q) => served.has(q.id))).toBe(false);
  });

  it("serves a pool smaller than the session size without padding", () => {
    expect(buildPairSession(pair, pool.slice(0, 3), "s")).toHaveLength(3);
  });
});

describe("usage cards", () => {
  it("every pair card has exactly three lines and a unique id", () => {
    const ids = new Set<string>();
    for (const p of PARTICLE_PAIRS) {
      expect(p.card.lines).toHaveLength(3);
      expect(ids.has(p.card.id)).toBe(false);
      ids.add(p.card.id);
      expect(p.particles).not.toContain(p.foil);
    }
    expect(ids.has(NI_TIME_CARD.id)).toBe(false);
  });

  it("に's time rule leads any に pair once, then only the pair card, then nothing", () => {
    const niKara = getParticlePair("ni-kara")!;
    expect(usageCardsForPair(niKara, new Set()).map((c) => c.id)).toEqual(["ni-time", "ni-kara"]);
    expect(usageCardsForPair(niKara, new Set(["ni-time"])).map((c) => c.id)).toEqual(["ni-kara"]);
    expect(usageCardsForPair(niKara, new Set(["ni-time", "ni-kara"]))).toEqual([]);
    // A pair without に never shows the time card.
    expect(usageCardsForPair(pair, new Set()).map((c) => c.id)).toEqual(["kara-made"]);
  });
});
