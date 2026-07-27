/**
 * m22-neo module guards. Same 2026-07-26 module shape as m12-m21
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m21 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { M22_NEO_LESSONS } from "../m22-neo";
import { M21_NEO_LESSONS } from "../m21-neo";
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

registerJaModuleContentLints("m22");

registerModuleBarGuards({
  moduleLabel: "m22-neo",
  lessons: M22_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21"],
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
    ...M20_NEO_LESSONS,
    ...M21_NEO_LESSONS,
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

describe("m22-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M22_NEO_LESSONS).toHaveLength(13);
    const reviews = M22_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M22_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M22_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M22_NEO_LESSONS[M22_NEO_LESSONS.length - 1].id).toBe("ja-m22-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M22_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M22_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M22_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m22-neo owes the spine's health points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m22. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced.
   *  `counter-hon` moved m21→m22 on 2026-07-27: 本 has no affinity with a
   *  listing module, so it drips here as ordinary vocabulary. */
  const OWED = ["ga-itai", "frequency-adverbs", "counter-hon"];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches the six ⟳ points the module leans on", () => {
    // The row owes three ids across nine teaching lessons, and inv 42 forbids
    // inventing new ones. So six earlier points are re-taught in new
    // positions, the same ⟳ move m14-m21 made: `wa-topic` (m3 — the
    // double-subject 「わたしは あたまが いたい」 is the first place は and が
    // have to be chosen in the SAME clause), `ga-existence` (m6 — 「ねつが
    // ある」), `masu-present` (m7 — symptoms are described to a doctor),
    // `kudasai` (m14 — a pharmacy is where you ask for something),
    // `naide-kudasai` (m14 — the spine's own named spend) and `te-mo-ii`
    // (m14 — permission is the other end of prohibition, and the two belong
    // in one contrast). No ledger row moves.
    for (const p of [
      "wa-topic", "ga-existence", "masu-present", "kudasai", "naide-kudasai", "te-mo-ii",
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M22_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m22-neo pedagogy invariants", () => {
  const steps = M22_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );
  const corpus = JSON.stringify(M22_NEO_LESSONS.map((l) => l.steps));

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (a deliberate
   *  wrong sentence — 「あたまを いたい」 and 「あまり くすりを のむ」 ARE the
   *  learner errors these lessons name) and grading-only `acceptedAnswers`. */
  const surfaces: { where: string; ja: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja });

  it("は 'tooth' and かぜ 'a cold' reach no surface (both are homograph losers)", () => {
    // Spencer's ruling, 2026-07-27, made BEFORE this module was briefed. は
    // resolves to the TOPIC PARTICLE and かぜ to 風 "wind" through
    // `JA_PRIMARY_ATOM_BY_KANA`, so neither sense can ever be identified by a
    // token and neither can ever accrue SRS credit. Checked as a WORD, not a
    // substring: は is in every sentence in the course as a particle, so the
    // test is that no health SENSE of either is taught — i.e. no English gloss
    // in this module names a tooth or a cold.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const blob = JSON.stringify(step);
      for (const bad of ["tooth", "teeth", "toothache", "a cold", "cold ", "catch a cold"])
        if (new RegExp(`\\b${bad.trim()}\\b`, "i").test(blob))
          offenders.push(`${lessonId}/${String(step.id)}: gloss names "${bad.trim()}"`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
    // …and the module AUTHORS neither kana. The check reads the IR rather than
    // the compiled corpus on purpose: かぜ IS a met word (m7's 風 "wind") and
    // the compiler is free to draw it as an image-MCQ distractor, which is
    // correct behaviour and teaches the winning sense. What must never happen
    // is this module WRITING either surface into a sentence, a card or an
    // answer — that is what the IR contains and what an author controls.
    const irYaml = readFileSync(
      join(__dirname, "..", "ir", "m22.ir.yaml"),
      "utf-8",
    );
    // Everything before `grammarPoints:` is the authoring notes block, which
    // EXPLAINS the ban and therefore quotes the banned kana. Only content is
    // checked.
    const irContent = irYaml.slice(irYaml.indexOf("\ngrammarPoints:"));
    for (const bad of ["かぜ", "むしば"])
      expect(irContent.includes(bad), `m22.ir.yaml authors ${bad}`).toBe(false);
  });

  it("every 〜ほん surface uses the reading the number actually takes", () => {
    // The sound changes ARE the counter lesson, and m17 shipped wrong 〜さい
    // readings that only its own guard caught (m19 then guarded ふん, m20
    // ひゃく/せん, m21 はい). Readings follow `classifiers.ts`, this repo's
    // shipped counter table: 1 ippon, 3 sanbon, 6 roppon, 8 happon, 10 juppon,
    // and everything else plain ほん.
    const LONG: Record<string, string> = {
      いっ: "ぽん", ろっ: "ぽん", はっ: "ぽん", じゅっ: "ぽん",
      さん: "ぼん", なん: "ぼん",
      よん: "ほん", ご: "ほん", なな: "ほん", きゅう: "ほん",
    };
    const HEAD = "(いっ|いち|ろっ|ろく|はっ|はち|じゅっ|じゅう|さん|なん|よん|ご|なな|きゅう|に)";
    const offenders: string[] = [];
    for (const { where, ja } of surfaces) {
      for (const m of ja.matchAll(new RegExp(`${HEAD}(ほん|ぼん|ぽん)`, "g"))) {
        const want = LONG[m[1]];
        if (want === undefined)
          offenders.push(`${where}: "${m[0]}" — ${m[1]} is not a 〜ほん head this module uses`);
        else if (m[2] !== want)
          offenders.push(`${where}: "${m[0]}" — ${m[1]} takes ${want}, not ${m[2]}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every 〜ほん cell ships as a WHOLE tile, never split around ほん", () => {
    // ほん CANNOT be registered as the counter: 「ほん」 is already the m3 atom
    // for "book" and `JA_COURSE_ATOMS_BY_KANA` is last-wins, so a second row
    // would flip ~488 existing surfaces. That is why no cell composes the way
    // m19's さん + ぷん and m20's ご + ひゃく did — each cell is its own atom,
    // and a tile bank that ever emitted a bare ほん beside a number would be
    // tiling a library.
    const CELLS = ["いっぽん", "さんぼん", "ろっぽん", "なんぼん", "よんほん", "ごほん"];
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const tiles = [
        ...((rec.tiles as string[] | undefined) ?? []),
        ...((rec.correctOrder as string[] | undefined) ?? []),
      ];
      const hasCell = CELLS.some((c) =>
        String((rec.targetSentence as string | undefined) ?? "").includes(c),
      );
      if (!hasCell) continue;
      for (const t of tiles)
        if (t === "ほん" || t === "ぼん" || t === "ぽん")
          offenders.push(`${lessonId}/${String(step.id)}: bare "${t}" tile`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("にほん never counts anything (it is JAPAN, and に is the 二 homograph)", () => {
    // 「にほん」 is banned three times over: the documented に/二 homograph, に +
    // ほん splitting into the numeral plus "book", and 「にほん」 being the
    // registered atom for Japan with ~150 occurrences in the corpus. The
    // module never says にほん at all, which is the only way to be sure.
    for (const { where, ja } of surfaces)
      expect(ja.includes("にほん"), `${where}: ${ja}`).toBe(false);
  });

  it("the geminating 〜ほん cells this module does not teach stay off every surface", () => {
    // ななほん / はっぽん / きゅうほん / じゅっぽん are named in the L7 card's
    // mixed-script PROSE, which `jaSurfaces` cannot see, and they have no atom
    // rows — a surface carrying one would ship a junk tile.
    for (const { where, ja } of surfaces)
      for (const bad of ["ななほん", "はっぽん", "きゅうほん", "じゅっぽん", "はちほん", "さんほん", "ろくほん", "いちほん"])
        expect(ja.includes(bad), `${where}: ${bad} must never reach a surface`).toBe(false);
  });

  it("いたい is never inflected — it is absent from ADJ_ENTRIES", () => {
    // 「いたくない」 tokenizes to the junk fragment いた + く + ない and trips
    // the compiler's `unbuildable` gate; 「いたかった」 is the same shape. This
    // is the m12 すごい/こわい and m13 ほしくない class — an adjective the
    // conjugation tables do not carry has no inflections any lexicon in this
    // repo can see. "It doesn't hurt" is said with だいじょうぶ / げんき, which
    // is what a Japanese speaker says anyway.
    for (const { where, ja } of surfaces)
      for (const bad of ["いたくない", "いたかった", "いたくなかった", "いたくて", "いたく"])
        expect(ja.includes(bad), `${where}: ${bad} has no lexicon entry`).toBe(false);
  });

  it("no 「〜からだ」 fuses into からだ (the m19 finding)", () => {
    // から + the copula tokenizes as からだ, the m2 atom for "body" — which
    // this module ACTUALLY TEACHES WITH, so the mis-credit would be invisible
    // twice over. から is always followed by a verb or a noun phrase here, and
    // a reason spells びょうき + だ + から, which produces だから, never からだ.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const tiles = (step as unknown as { correctOrder?: string[] }).correctOrder ?? [];
      const i = tiles.indexOf("からだ");
      if (i === -1) continue;
      // A legitimate からだ tile is followed by が (「からだが いたい」). A fused
      // one would sit where から + だ was authored.
      if (tiles[i + 1] !== "が")
        offenders.push(`${lessonId}/${String(step.id)}: からだ tile not followed by が — [${tiles.join(" ")}]`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no bare て tile ever ships (て is 手 AND every て-form ends in it)", () => {
    // The brief flagged this as unverified and it was checked against the
    // COMPILER rather than assumed: the tokenizer is longest-match-first and
    // every て-form the course uses (たべて / みて / のんで / いって / して /
    // きいて / かって / あそんで / きて / おしえて / はたらいて / まって /
    // みせて / しって) has its own atom row, so a bare て is only ever emitted
    // where an author writes it. This module writes it exactly where it means
    // the hand, and never inside a verb.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const tiles = (rec.correctOrder as string[] | undefined) ?? [];
      const target = String((rec.targetSentence as string | undefined) ?? "");
      const i = tiles.indexOf("て");
      if (i === -1) continue;
      // The only legal bare て is the body part, which is followed by a
      // particle — 「てが いたい」. A て split out of a verb would follow a
      // verb stem instead.
      if (!/^(が|は|も|を|に)$/.test(tiles[i + 1] ?? ""))
        offenders.push(`${lessonId}/${String(step.id)}: bare て not used as the body part — "${target}"`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no untaught health vocabulary", () => {
    // The context pack is built from `courseAtoms` attribution and OVERSTATES
    // what the learner has met: none of these is in any earlier module's
    // priorVocab, so using one would be a bare-word debut the compiler's own
    // provenance gate cannot see (a build_sentence IS intro-capable, so an
    // untaught word can slip through as a "debut"). Substring-safe entries
    // only.
    for (const w of [
      "へや", "こうえん", "ノート", "たくさん", "せいと", "やさい",
      "さかな", "くだもの", "ケーキ", "ビール", "レストラン", "はいる",
      "まいにち", "まいあさ", "まいばん", "みがく", "ゆっくりと", "せっけん",
      "たいへん", "ひこうき", "さいふ", "あまい", "ちかく", "そば",
      "おかね", "つかう", "やすむ", "はなし", "なる",
      // Substring-safe entries only — にく and とり are both inside MET
      // とりにく, and a bare `includes` on Japanese is this repo's most
      // repeated bug (ので⊂のです, さん⊂さんぷん, は⊂歯, した⊂しました).
      // Those two are left to the compiler's own provenance gate.
    ])
      expect(corpus.includes(w), `${w} is taught by no module before m22`).toBe(false);
  });

  it("no student answers たなか in plain form", () => {
    // m7 assigned register by AUDIENCE, and たなか is the teacher.
    for (const lesson of M22_NEO_LESSONS) {
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

  it("no student answers a Doctor or a Pharmacist in plain form", () => {
    // Same rule as たなか, extended to the two professional roles this module
    // introduces: describing symptoms to someone in a white coat is a
    // です・ます situation, and the whole point of L6 is that the learner can
    // now do it. A plain reply to a doctor would teach the opposite.
    for (const lesson of M22_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        if (step.type !== "dialogue_listen") continue;
        const lines = (step.lines ?? []) as { speaker?: string; kana?: string }[];
        const STAFF = /^(Doctor|Pharmacist)$/;
        if (!lines.some((l) => STAFF.test(l.speaker ?? ""))) continue;
        for (const l of lines) {
          if (STAFF.test(l.speaker ?? "")) continue;
          const last = (l.kana ?? "").split(/[。？！]/).filter((c) => c.trim()).at(-1) ?? "";
          expect(
            /(です|ます|ません|ました|ください|でした|いい)(か)?(？)?$/.test(last.trim()),
            `${lesson.id}: ${l.speaker} answers a ${lines.find((x) => STAFF.test(x.speaker ?? ""))?.speaker} in plain form — "${l.kana}"`,
          ).toBe(true);
        }
      }
    }
  });

  it("no true particle_cloze anywhere — m22 introduces no particle (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so a module that introduces no
    // particle may not use it on one at all: every particle in this module was
    // introduced between 8 and 19 modules ago, and
    // `particleClozePlacement.test.ts` would reject each of them. Every cloze
    // here picks among CONTENT words — body parts, frequency adverbs, counter
    // cells, ない-forms.
    const PARTICLES = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const options = (step as unknown as { options?: string[] }).options ?? [];
      if (options.length && options.every((o) => PARTICLES.has(o)))
        offenders.push(`${lessonId}/${String(step.id)}: [${options.join(" | ")}]`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
