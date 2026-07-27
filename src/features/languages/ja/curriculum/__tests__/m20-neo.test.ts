/**
 * m20-neo module guards. Same 2026-07-26 module shape as m12-m19
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m19 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { M20_NEO_LESSONS } from "../m20-neo";
import { M19_NEO_LESSONS } from "../m19-neo";
import { M18_NEO_LESSONS } from "../m18-neo";
import { M17_NEO_LESSONS } from "../m17-neo";
import { M16_NEO_LESSONS } from "../m16-neo";
import { M15_NEO_LESSONS } from "../m15-neo";
import { M14_NEO_LESSONS } from "../m14-neo";
import { M13_NEO_LESSONS } from "../m13-neo";
import { M12_NEO_LESSONS } from "../m12-neo";
import { M11_NEO_LESSONS } from "../m11-neo";
import { M10_NEO_LESSONS } from "../m10-neo";
import { M9_NEO_LESSONS } from "../m9-neo";
import { M8_NEO_LESSONS } from "../m8-neo";
import { M7_NEO_LESSONS } from "../m7-neo";
import { M3_NEO_LESSONS } from "../m3-neo";
import { M4_NEO_LESSONS } from "../m4-neo";
import { M5_NEO_LESSONS } from "../m5-neo";
import { M6_NEO_LESSONS } from "../m6-neo";

registerJaModuleContentLints("m20");

registerModuleBarGuards({
  moduleLabel: "m20-neo",
  lessons: M20_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19"],
  priorLessons: [
    ...M3_NEO_LESSONS,
    ...M4_NEO_LESSONS,
    ...M5_NEO_LESSONS,
    ...M6_NEO_LESSONS,
    ...M7_NEO_LESSONS,
    ...M8_NEO_LESSONS,
    ...M9_NEO_LESSONS,
    ...M10_NEO_LESSONS,
    ...M11_NEO_LESSONS,
    ...M12_NEO_LESSONS,
    ...M13_NEO_LESSONS,
    ...M14_NEO_LESSONS,
    ...M15_NEO_LESSONS,
    ...M16_NEO_LESSONS,
    ...M17_NEO_LESSONS,
    ...M18_NEO_LESSONS,
    ...M19_NEO_LESSONS,
  ],
  canon: COURSE_CANON,
  minLessons: 12,
  maxLessons: 15,
  requireChallengeLast: true,
  requireReviewCount: 3,
  requireChallengeStep: true,
  requireTeachFirst: true,
  requireImageFirst: true,
});

describe("m20-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M20_NEO_LESSONS).toHaveLength(13);
    const reviews = M20_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M20_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M20_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M20_NEO_LESSONS[M20_NEO_LESSONS.length - 1].id).toBe("ja-m20-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M20_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M20_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M20_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m20-neo owes the spine's comparison points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m20. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = ["yori-comparison", "numbers-100-10000", "counter-ko"];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches the six ⟳ points the module leans on", () => {
    // The row owes three ids across nine teaching lessons, and inv 42 forbids
    // inventing new ones. So six earlier points are re-taught in new
    // positions, the same ⟳ move m14-m19 made: the reduced 「AはBより〜」
    // (`wa-topic`, m3), the closed pair a question asks about (`to-and`, m8),
    // prices as the home of thousands (`ikura-price`, m9), な-adjectives
    // keeping だ inside the frame (`na-adj-present`, m12), 「AもBも〜けど」 as
    // the concession move (`mo-also`, m3) and どちら's register home
    // (`masu-present`, m7). No ledger row moves: a re-teach is not a
    // re-assignment.
    for (const p of [
      "wa-topic", "to-and", "ikura-price", "na-adj-present", "mo-also", "masu-present",
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("does NOT teach いちばん — n09 is the intro beat, n14 (m26) the deepen", () => {
    // spinePlan n09: "⟳ intro beat — いちばん superlatives deepen later". The
    // s20 split exists precisely so superlatives arrive once comparison is
    // second nature; `ichiban-superlative` keeps its m26 ledger row.
    expect(taughtPoints.has("ichiban-superlative")).toBe(false);
    const corpus = JSON.stringify(M20_NEO_LESSONS.map((l) => l.steps));
    expect(corpus.includes("いちばん")).toBe(false);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M20_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m20-neo pedagogy invariants", () => {
  const steps = M20_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );
  const corpus = JSON.stringify(M20_NEO_LESSONS.map((l) => l.steps));

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (a deliberate
   *  wrong sentence — 「さんひゃくえん」 and 「かぎが さん ある」 ARE the learner
   *  errors these lessons name) and grading-only `acceptedAnswers`. */
  const surfaces: { where: string; ja: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja });

  it("every hundred/thousand surface uses the reading the number actually takes", () => {
    // The five sound changes ARE the number lesson, and m17 shipped wrong
    // 〜さい readings that only its own guard caught. さんびゃく / ろっぴゃく /
    // はっぴゃく / さんぜん / はっせん are whole atoms precisely because they do
    // not decompose; this checks that no OTHER number ever pairs with びゃく /
    // ぴゃく / ぜん, and that さん / ろく / はち never pair with the plain
    // ひゃく / せん.
    const HUNDREDS: Record<string, string> = {
      さん: "びゃく", ろっ: "ぴゃく", はっ: "ぴゃく",
      よん: "ひゃく", ご: "ひゃく", なな: "ひゃく", きゅう: "ひゃく", なん: "ひゃく",
    };
    const THOUSANDS: Record<string, string> = {
      さん: "ぜん", はっ: "せん",
      よん: "せん", ご: "せん", なな: "せん", きゅう: "せん", いっ: "せん", なん: "せん",
    };
    const HEAD = "(さん|ろっ|ろく|はっ|はち|よん|ご|なな|きゅう|いち|いっ|なん)";
    const offenders: string[] = [];
    const judge = (
      where: string, whole: string, head: string, counter: string,
      table: Record<string, string>, unit: string,
    ) => {
      const want = table[head];
      if (want === undefined)
        offenders.push(`${where}: "${whole}" — ${head} is not a ${unit} head this module uses`);
      else if (counter !== want)
        offenders.push(`${where}: "${whole}" — ${head} takes ${want}, not ${counter}`);
    };
    for (const { where, ja } of surfaces) {
      for (const m of ja.matchAll(new RegExp(`${HEAD}(ひゃく|びゃく|ぴゃく)`, "g")))
        judge(where, m[0], m[1], m[2], HUNDREDS, "hundreds");
      for (const m of ja.matchAll(new RegExp(`${HEAD}(せん|ぜん)`, "g")))
        judge(where, m[0], m[1], m[2], THOUSANDS, "thousands");
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("the geminating hundreds/thousands only ever ship as WHOLE atoms", () => {
    // ろっぴゃく / はっぴゃく / はっせん decompose to nothing (ろっ and はっ are
    // not atoms), so a surface that spelled them any other way would either
    // trip the compiler's unbuildable gate or ship a junk tile.
    // Checked over `surfaces`, not the raw corpus: the numbers card's
    // antiPattern IS 「さんひゃくえん」 and the prices card's IS 「さんせんえん」 —
    // deliberate learner errors that `jaSurfaces` scrubs for exactly this
    // reason.
    for (const { where, ja } of surfaces)
      for (const bad of ["ろくひゃく", "ろくぴゃく", "はちひゃく", "はちぴゃく", "はちせん", "さんひゃく", "さんせん"])
        expect(ja.includes(bad), `${where}: ${bad} must never reach a surface`).toBe(false);
  });

  it("にひゃく / にせん / にこ never reach a surface (the に/二 homograph trap)", () => {
    // に the particle and に the numeral share a kana, and the RUN-PLAN's
    // recurring-traps list records that a homograph mis-credits SRS silently.
    for (const { where, ja } of surfaces)
      for (const bad of ["にひゃく", "にせん", "にこ"])
        expect(ja.includes(bad), `${where}: ${ja}`).toBe(false);
  });

  it("the geminating 〜こ cells stay PROSE-only, never on a tile", () => {
    // いっこ / ろっこ / はっこ / じゅっこ do not decompose, so they are named in
    // the L6 card's mixed-script prose (invisible to jaSurfaces) and never
    // reach a surface. The cells that do reach one are number + こ.
    for (const { where, ja } of surfaces)
      for (const bad of ["いっこ", "ろっこ", "はっこ", "じゅっこ"])
        expect(ja.includes(bad), `${where}: ${ja}`).toBe(false);
  });

  it("〜こ is its OWN build tile, never fused to the number", () => {
    // Tokenization is pedagogy here: 「さんこ」 must build as さん / こ, so the
    // learner assembles the count rather than picking a memorised lump —
    // the same principle as inv 34.
    const FUSED = ["さんこ", "よんこ", "ごこ", "ななこ", "きゅうこ"];
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const tiles = (step as unknown as Record<string, unknown>).tiles as string[] | undefined;
      if (!Array.isArray(tiles)) continue;
      for (const t of tiles)
        if (FUSED.includes(t)) offenders.push(`${lessonId}/${String(step.id)}: ${t}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("より is never contrasted against a particle that would also be correct", () => {
    // Same principle inv 35 states for は↔が. より's cloze distractors are を
    // and から, both genuinely ungrammatical after the loser of a comparison;
    // が and は are never offered, because 「バスが たかい」 and 「バスは たかい」
    // are correct Japanese and the step would mark a right answer wrong.
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const options = ((step as unknown as Record<string, unknown>).options as string[] | undefined) ?? [];
      if (!options.includes("より")) continue;
      for (const bad of ["が", "は", "に"])
        expect(options.includes(bad), `${lessonId}/${String(step.id)}: [${options.join(" | ")}]`).toBe(false);
    }
  });

  it("the only true particle_cloze in the module is より's (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so the only particle this
    // module may cloze is the one it introduces. も, は, が, から and を were
    // introduced three to fifteen modules ago, and
    // `particleClozePlacement.test.ts` would reject them too — L8's
    // 'both … and …' cloze therefore picks among CONTENT words inside a frame
    // that already shows both も.
    const PARTICLES = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const rec = step as unknown as Record<string, unknown>;
      const options = (rec.options as string[] | undefined) ?? [];
      if (!options.length || !options.every((o) => PARTICLES.has(o))) continue;
      if (rec.correctParticle !== "より")
        offenders.push(`${lessonId}/${String(step.id)}: [${options.join(" | ")}] → ${String(rec.correctParticle)}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ほう always carries の in front of it and が behind it", () => {
    // ほう is an ORDINARY NOUN — that is the L1 card's whole argument — so a
    // bare 「でんしゃ ほうが」 or a 「ほうを」 is the learner error the
    // antiPattern names, not something the module may ship.
    const offenders: string[] = [];
    for (const { where, ja } of surfaces) {
      for (const m of ja.matchAll(/(.)ほう(.)?/g)) {
        const [, before, after] = m;
        if (before !== "の" && before !== "っ" && before !== " ")
          offenders.push(`${where}: "…${m[0]}…" — ほう needs の in front of it`);
        if (after !== undefined && after !== "が" && after !== " ")
          offenders.push(`${where}: "…${m[0]}…" — ほう takes が, not ${after}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no untaught comparison vocabulary", () => {
    // はやい is deliberately absent: JA_PRIMARY_ATOM_BY_KANA resolves the bare
    // kana to 早い "early" (⏰, an emoji already owned by MET じかん and いま),
    // so a はやい surface glossed "fast" would credit SRS to the wrong sense —
    // the はな/鼻 class. ちかい / とおい carry the comparison instead. いちばん
    // belongs to m26. せんせい is absent because the bulk audit's debut check
    // is token-INITIAL and a 「せんせい」 token would register as せん's debut.
    for (const w of [
      "はやい", "おそい", "ながい", "みじかい", "ひろい", "せまい", "べんり",
      "いちばん", "もっと", "ずっと", "おなじ", "くらい", "ぐらい",
      "せんせい", "りんご", "みかん",
    ])
      expect(corpus.includes(w), `${w} is not taught by m20 or any earlier module`).toBe(false);
  });

  it("no 「〜からだ」 fuses into からだ (the m19 finding)", () => {
    // から + the copula tokenizes as からだ, the m2 atom for "body", and the
    // mis-credit is silent. から is followed by a verb or by まで here, and a
    // price reason spells えん + だ + から, never から + だ.
    // Fusion needs the two kana ADJACENT — an authored space is a word
    // boundary the tokenizer never matches across, so 「あるから だいじょうぶだ」
    // is safe and 「あるからだ」 is not.
    for (const { where, ja } of surfaces)
      expect(ja.includes("からだ"), `${where}: ${ja}`).toBe(false);
  });

  it("no student answers たなか in plain form", () => {
    // m7 assigned register by AUDIENCE, and たなか is the teacher. A dialogue
    // where a student replies to her in plain form teaches the opposite of
    // what L9 exists to teach.
    for (const lesson of M20_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        if (step.type !== "dialogue_listen") continue;
        const lines = (step.lines ?? []) as { speaker?: string; kana?: string }[];
        const hasTanaka = lines.some((l) => /たなか|Tanaka/i.test(l.speaker ?? ""));
        if (!hasTanaka) continue;
        for (const l of lines) {
          if (/たなか|Tanaka/i.test(l.speaker ?? "")) continue;
          const last = (l.kana ?? "").split(/[。？！]/).filter((c) => c.trim()).at(-1) ?? "";
          expect(
            /(です|ます|ません|ました|ください|でした)(か)?$/.test(last.trim()),
            `${lesson.id}: ${l.speaker} answers たなか in plain form — "${l.kana}"`,
          ).toBe(true);
        }
      }
    }
  });
});
