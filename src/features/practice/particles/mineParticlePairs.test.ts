import { describe, expect, it } from "vitest";
import {
  getJaTaughtCorpus,
  locateParticle,
  minePairSentences,
  MAX_SENTENCE_CHARS,
  type CorpusSentence,
} from "./mineParticlePairs";
import { MIN_PAIR_SENTENCES, PARTICLE_PAIRS } from "./particlePairs";

const sent = (text: string, module = 1): CorpusSentence => ({
  id: `t:${text}`,
  text,
  translation: "x",
  module,
});

describe("minePairSentences — synthetic corpus", () => {
  it("finds a sentence with both particles and orders the blanks by position", () => {
    const [s] = minePairSentences(["に", "から"], 5, [sent("くじから だいがくに いく")]);
    expect(s).toBeDefined();
    expect(s.blanks.map((b) => b.particle)).toEqual(["から", "に"]);
    expect(s.text.slice(s.blanks[0].start, s.blanks[0].end)).toBe("から");
    expect(s.text.slice(s.blanks[1].start, s.blanks[1].end)).toBe("に");
  });

  it("never blanks a particle that lives inside a taught atom (それから, すぐに…)", () => {
    // それから and すぐに are registered atoms; their から / に are not particles.
    expect(minePairSentences(["に", "から"], 5, [sent("それから だいがくに いく")])).toHaveLength(0);
    expect(minePairSentences(["に", "から"], 5, [sent("すぐに うちから でる")])).toHaveLength(0);
    // …but a free から elsewhere in the same sentence still qualifies, and
    // the atom-internal one is not double-counted as a second occurrence.
    const [s] = minePairSentences(["に", "から"], 5, [sent("それから うちから だいがくに いく")]);
    expect(s).toBeDefined();
    expect(s.text.slice(s.blanks[0].start, s.blanks[0].end)).toBe("から");
    expect(s.blanks[0].start).toBe("それから うち".length);
  });

  it("requires exactly one free occurrence of each particle", () => {
    expect(minePairSentences(["は", "が"], 5, [sent("きょうは ミカは ごはんが ない")])).toHaveLength(0);
    expect(minePairSentences(["は", "が"], 5, [sent("きょうは ごはんが ない")])).toHaveLength(1);
  });

  it("does not blank the で of a て-negative (〜ないで) or half of a compound particle", () => {
    expect(minePairSentences(["に", "で"], 5, [sent("うみに いかないで ください")])).toHaveLength(0);
    // には = compound; the は is not a free topic marker here.
    expect(minePairSentences(["は", "が"], 5, [sent("うちには いぬが いる")])).toHaveLength(0);
  });

  it("respects the learner's module and the length cap", () => {
    const corpus = [sent("くじから ごじまで はたらく", 16)];
    expect(minePairSentences(["から", "まで"], 15, corpus)).toHaveLength(0);
    expect(minePairSentences(["から", "まで"], 16, corpus)).toHaveLength(1);
    const long = sent("あ".repeat(MAX_SENTENCE_CHARS) + "から ごじまで", 1);
    expect(minePairSentences(["から", "まで"], 5, [long])).toHaveLength(0);
  });

  it("locateParticle recovers character offsets from the tokenizer walk", () => {
    const { spans, blankable } = locateParticle("ミカの いえで ごはんを たべる", "で");
    expect(blankable).toBe(true);
    expect(spans).toEqual([{ particle: "で", start: 6, end: 7 }]);
  });
});

describe("minePairSentences — taught JA corpus", () => {
  it("serves every catalogued pair with at least MIN_PAIR_SENTENCES at course end", () => {
    const corpus = getJaTaughtCorpus();
    expect(corpus.length).toBeGreaterThan(1000);
    for (const pair of PARTICLE_PAIRS) {
      const n = minePairSentences(pair.particles, 38, corpus).length;
      expect(n, `${pair.particles.join("+")} has ${n}`).toBeGreaterThanOrEqual(MIN_PAIR_SENTENCES);
    }
  });

  it("never emits the listening_build placeholder as a translation", () => {
    for (const s of getJaTaughtCorpus()) {
      expect(s.translation).not.toMatch(/build what you hear/i);
      expect(s.translation).not.toMatch(/^Build:/);
    }
  });

  it("every blank is a whole free-standing particle token in its sentence", () => {
    for (const pair of PARTICLE_PAIRS) {
      for (const s of minePairSentences(pair.particles, 38)) {
        for (const b of s.blanks) {
          expect(s.text.slice(b.start, b.end)).toBe(b.particle);
          // Not stacked on another particle (には, までに, では…).
          const after = s.text.slice(b.end, b.end + 2);
          expect(/^(は|が|を|に|で|も|の|か|と)(\s|$)/.test(after), `${s.text} @${b.start}`).toBe(false);
        }
      }
    }
  });
});
