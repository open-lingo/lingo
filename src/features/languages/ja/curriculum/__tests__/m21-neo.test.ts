/**
 * m21-neo module guards. Same 2026-07-26 module shape as m12-m20
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m20 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
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

registerJaModuleContentLints("m21");

registerModuleBarGuards({
  moduleLabel: "m21-neo",
  lessons: M21_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20"],
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

describe("m21-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M21_NEO_LESSONS).toHaveLength(13);
    const reviews = M21_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M21_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M21_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M21_NEO_LESSONS[M21_NEO_LESSONS.length - 1].id).toBe("ja-m21-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M21_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M21_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M21_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m21-neo owes the spine's listing points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m21. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced.
   *  `counter-hai` moved m22→m21 on 2026-07-27: a listing module is where a
   *  counter is actually used, so it lands inside the grammar rather than as
   *  a drip bolted on. */
  const OWED = ["ya-incomplete-list", "to-and", "tari-tari-suru", "counter-hai"];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches the five ⟳ points the module leans on", () => {
    // The row owes four ids across nine teaching lessons, and inv 42 forbids
    // inventing new ones. So five earlier points are re-taught in new
    // positions, the same ⟳ move m14-m20 made: `family-register` (m17 taught
    // the うち half and the spine always meant the そと half to land here),
    // `no-possession` (m4 — の is the ENTIRE disambiguation between the two
    // family sets), `counter-nin` (m17 — a counter is only learned when you
    // have to choose between two), `suki-kirai-no` (m13 — 「Aや Bが すきだ」 is
    // where an open list is most naturally spoken) and `kudasai` (m14 —
    // ordering drinks is where a cup counter is used). No ledger row moves.
    for (const p of [
      "family-register", "no-possession", "counter-nin", "suki-kirai-no", "kudasai",
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M21_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m21-neo pedagogy invariants", () => {
  const steps = M21_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );
  const corpus = JSON.stringify(M21_NEO_LESSONS.map((l) => l.steps));

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (a deliberate
   *  wrong sentence — 「コーヒーを さん のむ」 and 「ミカの ははは せんせいだ」
   *  ARE the learner errors these lessons name) and grading-only
   *  `acceptedAnswers`. */
  const surfaces: { where: string; ja: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja });

  /** Surfaces that are SENTENCES, not single build tiles. `jaSurfaces` walks
   *  every kana string on a step, so a tile bank contributes 「みたり」 and
   *  「おかあさん」 on their own — real, but not something a clause-level check
   *  can read. Authored clause boundaries are spaces, so a space is the test. */
  const sentences = surfaces.filter((s) => /[\u3000\s]/.test(s.ja));

  it("every 〜はい surface uses the reading the number actually takes", () => {
    // The sound changes ARE the counter lesson, and m17 shipped wrong 〜さい
    // readings that only its own guard caught (m19 then guarded ふん, m20
    // ひゃく/せん). Readings follow `classifiers.ts`, this repo's shipped
    // counter table: 1 ippai, 3 sanbai, 6 roppai, 8 happai, 10 juppai, and
    // everything else plain はい.
    const CUPS: Record<string, string> = {
      いっ: "ぱい", ろっ: "ぱい", はっ: "ぱい", じゅっ: "ぱい",
      さん: "ばい", なん: "ばい",
      よん: "はい", ご: "はい", なな: "はい", きゅう: "はい",
    };
    const HEAD = "(いっ|いち|ろっ|ろく|はっ|はち|じゅっ|じゅう|さん|なん|よん|ご|なな|きゅう|に)";
    const offenders: string[] = [];
    for (const { where, ja } of surfaces) {
      for (const m of ja.matchAll(new RegExp(`${HEAD}(はい|ばい|ぱい)`, "g"))) {
        const want = CUPS[m[1]];
        if (want === undefined)
          offenders.push(`${where}: "${m[0]}" — ${m[1]} is not a 〜はい head this module uses`);
        else if (m[2] !== want)
          offenders.push(`${where}: "${m[0]}" — ${m[1]} takes ${want}, not ${m[2]}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every 〜はい cell ships as a WHOLE tile, never split around はい", () => {
    // はい CANNOT be registered as the counter: 「はい」 is already the m3-era
    // interjection "yes" (`ja-surv-hai`) and `JA_COURSE_ATOMS_BY_KANA` is
    // last-wins, so a second row would flip every はい in the course. That is
    // why no cell composes from number + counter the way m19's さん + ぷん and
    // m20's ご + ひゃく did — each cell is its own atom, and a tile bank that
    // ever emitted a bare はい would be crediting the interjection.
    const CELLS = ["いっぱい", "さんばい", "よんはい", "ごはい", "ろっぱい", "なんばい"];
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
        if (t === "はい" || t === "ばい" || t === "ぱい")
          offenders.push(`${lessonId}/${String(step.id)}: bare "${t}" tile`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("にはい never reaches a surface (the に/二 AND はい/はい homographs)", () => {
    // に the particle and に the numeral share a kana (the documented m19/m20
    // ban), and はい the counter shares its kana with the interjection "yes".
    // 「にはい」 collides with both at once, so it is banned twice over.
    for (const { where, ja } of surfaces)
      expect(ja.includes("にはい"), `${where}: ${ja}`).toBe(false);
  });

  it("the geminating 〜はい cells this module does not teach stay off every surface", () => {
    // ななはい / はっぱい / きゅうはい / じゅっぱい are named in the L5 card's
    // mixed-script PROSE, which `jaSurfaces` cannot see, and they have no
    // atom rows — a surface carrying one would ship a junk tile.
    for (const { where, ja } of surfaces)
      for (const bad of ["ななはい", "はっぱい", "きゅうはい", "じゅっぱい", "はちはい", "さんはい", "ろくはい", "いちはい"])
        expect(ja.includes(bad), `${where}: ${bad} must never reach a surface`).toBe(false);
  });

  it("no 〜たり list is closed with the BARE plain past した (した is 下)", () => {
    // 「した」 is the registered atom 下 "below" (m17), so a bare した tile shows
    // a direction word and FSRS credits it — the ふるかった / からだ /
    // ごじ⊂ごじゅう class, silent in every direction.
    //
    // BUT THE BAN IS ON した, NOT ON THE PAST TENSE. This test was written
    // `/たり[^。？]*した/`, a substring match, so it also rejected 「〜たり 〜たり
    // しました」 — which is not した at all. That mattered: it is the highest-
    // frequency form of the pattern in real speech (it answers "what did you do
    // at the weekend?"), and the module had shipped without it on the strength
    // of this test. Verified against the compiler before relaxing: 「しました」
    // emits ONE tile, `しました`, and its exercisedAtoms are
    // [yasumi, p-wa, eiga, p-wo, mitari, ongaku, p-wo, kiitari] — no `shita`,
    // so no atom is mis-credited.
    //
    // Substring matching on a language with no spaces is this repo's most
    // repeated bug (ので⊂のです, さん⊂さんぷん, は⊂歯 …). Match a TILE, which is
    // what SRS actually credits, and the question stops being ambiguous.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const tiles = (step as unknown as { tiles?: string[] }).tiles ?? [];
      if (!tiles.some((t) => /たり$/.test(t))) continue;
      if (tiles.includes("した")) {
        offenders.push(`${lessonId}/${String(step.id)}: bare した tile in a たり list`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every 〜たり list is closed by する", () => {
    // The antiPattern of the L7 card is an unclosed list, so an authored one
    // would be shipping the error the card names.
    // Match the DECLARED たり atoms, never a bare 「たり」 — ふたり ("two
    // people") ends in the same two kana and is a match-pair tile all over
    // this module.
    const TARI = /(たべたり|のんだり|みたり|きいたり|あそんだり|いったり)/;
    // Read the WHOLE authored sentence off the step, never `jaSurfaces` — the
    // annotation layer chops a transcript into ruby segments, so a fragment
    // ending mid-list is an artefact of the renderer, not of the content.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const whole = [
        rec.targetSentence,
        rec.transcript,
        rec.targetPhrase,
        ...(((rec.examples as { ja?: string }[] | undefined) ?? []).map((e) => e.ja)),
      ].filter((x): x is string => typeof x === "string");
      for (const ja of whole)
        for (const clause of ja.split(/[。？！]/)) {
          if (!TARI.test(clause)) continue;
          // A word-level speaking/match filler citing one たり form is a
          // vocabulary drill, not a list — a real list always has a space.
          if (!/[\u3000\s]/.test(clause.trim())) continue;
          // する is what closes the list, but する is a VERB and carries the
          // tense — 「〜たり 〜たり しました」 is the same closure in the past, not
          // a missing one. Checking for the literal string する rejected it.
          if (!/(する|します|しました|しません)/.test(clause))
            offenders.push(`${lessonId}/${String(step.id)}: "${clause.trim()}"`);
        }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("a Family II word always says WHOSE family it is", () => {
    // Family I and Family II mean the same person and differ only in whose
    // family it is, so an unpossessed honorific is genuinely ambiguous rather
    // than merely vague. Every occurrence carries a possessor (…の おかあさん)
    // or opens the clause as a VOCATIVE (「おかあさん ちゃが ある？」).
    const SOTO = ["おかあさん", "おとうさん", "おにいさん", "おねえさん"];
    const offenders: string[] = [];
    for (const { where, ja } of sentences) {
      for (const w of SOTO) {
        let i = ja.indexOf(w);
        while (i !== -1) {
          // Authored clause boundaries are SPACES (、 is stripped by the
          // compiler), so 「ミカの おかあさん」 has one before the word.
          const before = ja.slice(0, i).replace(/[　\s]+$/, "");
          const possessed = before.endsWith("の");
          // Vocative: the word opens its clause.
          const vocative = before === "" || /[。？！]$/.test(before);
          if (!possessed && !vocative)
            offenders.push(`${where}: "${ja}" — ${w} with no possessor`);
          i = ja.indexOf(w, i + 1);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("an honorific family word is never offered as a WRONG answer against a humble one", () => {
    // Grading runs one way only. 「ミカの はは」 is flatly wrong — はは is
    // reserved for your own family — so はは/あに/あね/いもうと/おとうと are
    // legitimate distractors for somebody else's relative. The reverse is NOT
    // an error: a child says おかあさん about their own mother all the time.
    // So a step whose ANSWER is a humble word may never offer an honorific as
    // a distractor, or it would mark a defensible reading wrong.
    const HUMBLE = new Set(["はは", "ちち", "あに", "あね", "いもうと", "おとうと"]);
    const SOTO = new Set(["おかあさん", "おとうさん", "おにいさん", "おねえさん"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const options = (rec.options as unknown[] | undefined) ?? [];
      const texts = options.map((o) =>
        typeof o === "string" ? o : String((o as { text?: string }).text ?? ""),
      );
      const answer = String(
        (rec.correctParticle as string | undefined) ??
          (rec.correctKana as string | undefined) ??
          "",
      );
      if (!HUMBLE.has(answer)) continue;
      for (const t of texts)
        if (SOTO.has(t))
          offenders.push(`${lessonId}/${String(step.id)}: ${t} offered against ${answer}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("と is never a distractor against や (both would be correct Japanese)", () => {
    // The same principle inv 35 states for は↔が. 「うみと やまが すきだ」 and
    // 「うみや やまが すきだ」 are BOTH correct — they differ in whether the
    // list is finished, which a tile picker cannot express — so a cloze
    // offering と against や would mark a right answer wrong. The contrast is
    // taught and drilled by PRODUCTION, with the English saying which list is
    // meant.
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const rec = step as unknown as Record<string, unknown>;
      const options = ((rec.options as string[] | undefined) ?? []);
      if (rec.correctParticle !== "や" && !options.includes("や")) continue;
      for (const bad of ["と", "が", "は"])
        expect(
          options.includes(bad),
          `${lessonId}/${String(step.id)}: [${options.join(" | ")}]`,
        ).toBe(false);
    }
  });

  it("the only true particle_cloze in the module is や's (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so the only particle this
    // module may cloze is the one it introduces. と, を, が, から and に were
    // introduced 8 to 18 modules ago and `particleClozePlacement.test.ts`
    // would reject them too — every other cloze here picks among CONTENT
    // words (counter cells, family words, たり forms).
    const PARTICLES = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const rec = step as unknown as Record<string, unknown>;
      const options = (rec.options as string[] | undefined) ?? [];
      if (!options.length || !options.every((o) => PARTICLES.has(o))) continue;
      if (rec.correctParticle !== "や")
        offenders.push(`${lessonId}/${String(step.id)}: [${options.join(" | ")}] → ${String(rec.correctParticle)}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no 「〜からだ」 fuses into からだ (the m19 finding)", () => {
    // から + the copula tokenizes as からだ, the m2 atom for "body", and the
    // mis-credit is silent. から is followed by a verb here, and a reason
    // spells すき + だ + から, which produces だから, never からだ.
    for (const { where, ja } of surfaces)
      expect(ja.includes("からだ"), `${where}: ${ja}`).toBe(false);
  });

  it("ships no untaught listing vocabulary", () => {
    // The context pack is built from `courseAtoms` attribution and OVERSTATES
    // what the learner has met: none of these is in any earlier module's
    // priorVocab, so using one would be a bare-word debut the compiler cannot
    // see. せんせい / がくせい / かいしゃ carry the professions instead.
    // Substring-safe entries only: いしゃ ⊂ かいしゃ, とり ⊂ とりにく and
    // にく ⊂ とりにく, so those three are checked by the compiler's own
    // provenance gate rather than by a blunt string search here.
    for (const w of [
      "へや", "こうえん", "ノート", "たくさん", "おなか",
      "くち", "みみ", "くすり", "びょうき", "せいと", "やさい",
      "さかな", "くだもの", "ケーキ", "ビール", "レストラン", "はいる",
    ])
      expect(corpus.includes(w), `${w} is taught by no module before m21`).toBe(false);
  });

  it("no student answers たなか in plain form", () => {
    // m7 assigned register by AUDIENCE, and たなか is the teacher.
    for (const lesson of M21_NEO_LESSONS) {
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
