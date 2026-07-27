/**
 * m19-neo module guards. Same 2026-07-26 module shape as m12-m18
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m18 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
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

registerJaModuleContentLints("m19");

registerModuleBarGuards({
  moduleLabel: "m19-neo",
  lessons: M19_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18"],
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

describe("m19-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M19_NEO_LESSONS).toHaveLength(13);
    const reviews = M19_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M19_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M19_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M19_NEO_LESSONS[M19_NEO_LESSONS.length - 1].id).toBe("ja-m19-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M19_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M19_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M19_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m19-neo owes the spine's motion-particle points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m19. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = ["e-direction", "ni-iku", "made-ni", "kara-time", "counter-fun"];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches the four ⟳ points the module leans on", () => {
    // The row owes five ids across nine teaching lessons, and inv 42 forbids
    // inventing new ones. So four earlier points are re-taught in new
    // positions, the same ⟳ move m14-m18 made: destination as に's THIRD job
    // (`ni-location`, m6), means as で's other job (`de-action`, m6), the
    // question words a journey needs (`location-qa`, m6) and the polite layer
    // in the one situation where plain form is socially wrong
    // (`masu-present`, m7). No ledger row moves: a re-teach is not a
    // re-assignment.
    for (const p of ["ni-location", "de-action", "location-qa", "masu-present"])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M19_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m19-neo pedagogy invariants", () => {
  const steps = M19_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );
  const corpus = JSON.stringify(M19_NEO_LESSONS.map((l) => l.steps));

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (a deliberate
   *  wrong sentence — 「ごぷんだ」 and 「たべるに いく」 ARE the learner errors
   *  these lessons name) and grading-only `acceptedAnswers`. */
  const surfaces: { where: string; ja: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja });

  it("every 〜ふん/〜ぷん surface uses the counter the number actually takes", () => {
    // The rendaku table is the whole point of `counter-fun`, and an earlier
    // module shipped wrong 〜さい readings that only its own guard caught. ぷん
    // after 1/3/4/6/8/10 (and なん); ふん after 2/5/7/9. The geminating cells
    // いっぷん / ろっぷん / はっぷん are deliberately PROSE-only, so they never
    // reach a surface at all — but if one ever does, this checks it.
    const PUN = new Set(["いっ", "さん", "よん", "ろっ", "はっ", "じゅっ", "なん"]);
    const FUN = new Set(["に", "ご", "なな", "きゅう"]);
    const offenders: string[] = [];
    for (const { where, ja } of surfaces) {
      for (const m of ja.matchAll(/([぀-ヿ]{1,4}?)(ぷん|ふん)/g)) {
        const [, head, counter] = m;
        // Only judge a head we recognise as a number; anything else is a
        // longer word that happens to end in one (there are none today).
        const numHead = [...PUN, ...FUN].filter((n) => head.endsWith(n)).sort((a, b) => b.length - a.length)[0];
        if (!numHead) {
          offenders.push(`${where}: "${m[0]}" — head "${head}" is not a number this module counts with`);
          continue;
        }
        const want = PUN.has(numHead) ? "ぷん" : "ふん";
        if (counter !== want)
          offenders.push(`${where}: "${m[0]}" — ${numHead} takes ${want}, not ${counter}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("にふん never reaches a surface (the に/二 homograph trap)", () => {
    // に the particle and に the numeral share a kana, and the RUN-PLAN's
    // recurring-traps list records that a homograph mis-credits SRS silently.
    // ごふん / ななふん / きゅうふん carry the ふん family instead.
    for (const { where, ja } of surfaces)
      expect(ja.includes("にふん"), `${where}: ${ja}`).toBe(false);
  });

  it("へ is never contrasted against に in a cloze option set", () => {
    // Same principle inv 35 states for は↔が: に and へ are both correct on a
    // destination, so offering に as a distractor for へ would mark a right
    // answer wrong.
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const options = ((step as unknown as Record<string, unknown>).options as string[] | undefined) ?? [];
      if (!options.includes("へ")) continue;
      expect(options.includes("に"), `${lessonId}/${String(step.id)}: [${options.join(" | ")}]`).toBe(false);
    }
  });

  it("the only true particle_cloze in the module is へ's (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so the only particle this
    // module may cloze is the one it introduces. に, で, から and まで were all
    // introduced five to fourteen modules ago, and
    // `particleClozePlacement.test.ts` would reject them too.
    const PARTICLES = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const rec = step as unknown as Record<string, unknown>;
      const options = (rec.options as string[] | undefined) ?? [];
      if (!options.length || !options.every((o) => PARTICLES.has(o))) continue;
      if (rec.correctParticle !== "へ")
        offenders.push(`${lessonId}/${String(step.id)}: [${options.join(" | ")}] → ${String(rec.correctParticle)}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("〜に いく always attaches to a ます-STEM, never a dictionary form", () => {
    // The module's own antiPattern (「たべるに いく」) is the learner error, and
    // it must not appear as a taught surface anywhere.
    for (const { where, ja } of surfaces)
      for (const bad of ["たべるに いく", "のむに いく", "みるに いく", "あそぶに いく", "かうに いく"])
        expect(ja.includes(bad), `${where}: ${ja}`).toBe(false);
  });

  it("the purpose stem is its OWN build tile, never fused to に or いく", () => {
    // Tokenization is pedagogy here: 「たべに いく」 must build as たべ / に /
    // いく. A 「たべに」 tile would hide the construction the lesson exists to
    // teach — the same principle as inv 34.
    const FUSED = ["たべに", "のみに", "みに", "あそびに", "かいものに", "にいく"];
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const tiles = (step as unknown as Record<string, unknown>).tiles as string[] | undefined;
      if (!Array.isArray(tiles)) continue;
      for (const t of tiles)
        if (FUSED.includes(t)) offenders.push(`${lessonId}/${String(step.id)}: ${t}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no untaught motion vocabulary", () => {
    // The module's word list is deliberately twelve atoms. Everything else an
    // author reaches for when writing journeys (のる, おりる, つく, でる,
    // かかる, ひこうき, くうこう, こうえん, タクシー, まっすぐ, みぎ, ひだり)
    // is taught in no NEO module, and the conjugated forms of かえる / あるく
    // exist in no lexicon the compiler reads.
    for (const w of [
      "のる", "おりる", "つく", "でる", "かかる", "ひこうき", "くうこう",
      "こうえん", "タクシー", "まっすぐ", "みぎ", "ひだり",
      "あるいて", "あるきます", "かえります", "かえって",
    ])
      expect(corpus.includes(w), `${w} is not taught by m19 or any earlier module`).toBe(false);
  });

  it("no student answers たなか in plain form", () => {
    // m7 assigned register by AUDIENCE, and たなか is the teacher. A dialogue
    // where a student replies to her in plain form teaches the opposite of
    // what L9 exists to teach.
    for (const lesson of M19_NEO_LESSONS) {
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
