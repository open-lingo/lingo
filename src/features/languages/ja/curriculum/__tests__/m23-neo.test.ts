/**
 * m23-neo module guards. Same 2026-07-26 module shape as m12-m22
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m22 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { M23_NEO_LESSONS } from "../m23-neo";
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

registerJaModuleContentLints("m23");

registerModuleBarGuards({
  moduleLabel: "m23-neo",
  lessons: M23_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22"],
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
    ...M22_NEO_LESSONS,
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

describe("m23-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M23_NEO_LESSONS).toHaveLength(13);
    const reviews = M23_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M23_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M23_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M23_NEO_LESSONS[M23_NEO_LESSONS.length - 1].id).toBe("ja-m23-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M23_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M23_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M23_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m23-neo owes the spine's experience-and-intent points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m23. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = ["koto-ga-aru", "tsumori-desu", "kanji-set-2"];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches the six ⟳ points the module leans on", () => {
    // The row owes three ids across nine teaching lessons, and inv 42 forbids
    // inventing new ones. So six earlier points are re-taught in new
    // positions, the same ⟳ move m14-m22 made: `nai-existence` (m6 —
    // 「ことが ない」 is が-existence negated), `v-tai` (m13 — want against
    // decided is the contrast that DEFINES つもり), `nai-form` (m6 — a
    // negative intention is 〜ない つもりだ and nothing else), `toki` (m15 —
    // the relative-tense flip s11 explicitly deferred to this tile),
    // `te-kara` (m15 — ordering an itinerary) and `to-omoimasu` (m18 —
    // embedding a whole つもり / ことが ある clause is the module's hardest
    // shape). No ledger row moves.
    for (const p of [
      "nai-existence", "v-tai", "nai-form", "toki", "te-kara", "to-omoimasu",
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M23_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m23-neo pedagogy invariants", () => {
  const steps = M23_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );
  const corpus = JSON.stringify(M23_NEO_LESSONS.map((l) => l.steps));

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (a deliberate
   *  wrong sentence — 「いった ことが いる」 and 「いきます つもりだ」 ARE the
   *  learner errors these lessons name) and grading-only `acceptedAnswers`. */
  const surfaces: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  it("する's plain past した never reaches a surface (it is the atom for 下 'below')", () => {
    // The trap this module was briefed on, and it was MEASURED rather than
    // assumed: tokenizing 「した ことが ある。」 against the compiler's own
    // vocabulary yields した | こと | が | ある with した resolving to the m17
    // atom 下 "below". A bare した tile therefore credits the wrong word and
    // nothing errors — the silent shape ふるかった / ごじ⊂ごじゅう / からだ have.
    // The fix is authorial: a trip is 「りょこうに いった ことが ある」.
    // The ONE legal した in this module is the kanji_reading step for 下,
    // whose answer IS that atom, so its credit is correct by construction.
    const offenders: string[] = [];
    for (const { where, ja, type } of surfaces) {
      if (type === "kanji_reading") continue;
      for (const seg of ja.split(/[\s　]+/))
        if (seg.replace(/[。？！]/g, "") === "した")
          offenders.push(`${where}: bare した tile in 「${ja}」`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("くる's plain past きた never reaches a surface (it is the atom for 北 'north')", () => {
    // Same class as した, same reason, same fix: the とき lesson uses the
    // NON-PAST 「ミカが くる とき」 rather than 「きた とき」.
    const offenders: string[] = [];
    for (const { where, ja, type } of surfaces) {
      if (type === "kanji_reading") continue;
      for (const seg of ja.split(/[\s　]+/))
        if (seg.replace(/[。？！]/g, "") === "きた")
          offenders.push(`${where}: bare きた tile in 「${ja}」`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ある is never inflected — あった would collide with 会った 'met'", () => {
    // 「あった」 has no atom row (m22 made the same call), and registering one
    // would have been the worst kind of homograph: ある's past and 会う's past
    // share the kana. An experience is by definition still true, so the module
    // never needs it. はいった is banned for a different mechanical reason —
    // it fragments to はい + った, the interjection eating the stem.
    for (const { where, ja } of surfaces)
      for (const bad of ["あった", "はいった", "ついた", "あるいた"])
        expect(ja.includes(bad), `${where}: 「${bad}」 has no atom row — ${ja}`).toBe(false);
  });

  it("no 〜た ことが ある surface is glossed as a plain past", () => {
    // The meaning IS the lesson (the brief's central note): 「にほんに いった」
    // is I went to Japan and 「にほんに いった ことが ある」 is I have been to
    // Japan, ever. If the English carries a bare past the module has taught a
    // SECOND past tense, which is wrong. Every experience gloss must say
    // "have"/"has"/"never"/"ever".
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const ja = String(rec.targetSentence ?? rec.audioText ?? "");
      if (!/ことが\s*(ある|ない)/.test(ja)) continue;
      // A listening_build's prompt is the generic "Build what you hear." — it
      // carries no English gloss at all, so there is nothing here to check.
      const glosses = [rec.prompt, rec.meaningEn, rec.translation, rec.englishPrompt]
        .filter((x): x is string => typeof x === "string" && /[A-Za-z]/.test(x))
        .filter((x) => !/^build what you hear/i.test(x.trim()));
      for (const g of glosses) {
        const body = g.replace(/^(Build|Say to a friend|Say politely|Ask a friend|Ask politely|What does this mean\?)\s*:?\s*/i, "");
        if (!/\b(have|has|had|never|ever)\b/i.test(body))
          offenders.push(`${lessonId}/${String(rec.id)}: experience glossed without have/never — "${g}"`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("つもり never follows ます, たい or a past form", () => {
    // The three learner errors the tsumori-desu and v-tai cards name. つもり
    // hangs off the PLAIN DICTIONARY form (or a ない-form for a negative
    // intention) and nothing else — an intention is about what has not
    // happened yet.
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const m of ja.matchAll(/(\S+)\s+つもり/g))
        if (/(ます|たい|った|いた|えた|んだ|した)$/.test(m[1]))
          offenders.push(`${where}: 「${m[1]} つもり」 — つもり takes the plain dictionary or ない form`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no untaught travel vocabulary", () => {
    // The context pack is built from `courseAtoms` attribution and OVERSTATES
    // what the learner has met: none of these is in any earlier module's
    // priorVocab, so using one would be a bare-word debut the compiler's own
    // provenance gate cannot see (a build_sentence IS intro-capable, so an
    // untaught word can slip through as a "debut"). Every entry was found by
    // tokenizing this module's surfaces against the compiler's vocabulary and
    // then checking each token against priorVocab — はやい and では were BOTH
    // caught that way and rewritten out. Substring-safe entries only.
    for (const w of [
      "はやい", "いちばん", "たくさん", "こうえん", "ノート", "ちかく",
      "ゆっくりと", "せっけん", "プール", "えいご", "ホテルの ひと",
      "よむ", "みがく", "おぼえる",
      // では is an ATOM ("with that…") and is taught nowhere, so 「うみでは」
      // fuses で + は into it and tiles an untaught word. Same family as
      // からだ ⊃ から + だ (m19) and ので ⊂ のです (m16).
      "では",
    ])
      expect(corpus.includes(w), `${w} is taught by no module before m23`).toBe(false);
  });

  it("every kanji_reading option is pure kana and none is the answer", () => {
    // kanji-set-2's four hand-authored sets (山 / 川 / 海 / 来る — the
    // generator produced fewer than three near-misses for each) have to obey
    // the same contract as the generated ones: kana only, and never a real
    // alternate reading of the word under test. That last part is why 行く got
    // hand distractors in m18 (ゆく) and why 月 was cut from this set (げつ /
    // がつ).
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "kanji_reading") continue;
      const rec = step as unknown as { reading: string; options: { id: string; text: string }[] };
      for (const o of rec.options) {
        if (!/^[぀-ゟ゠-ヿー]+$/.test(o.text))
          offenders.push(`${lessonId}/${String((step as { id: string }).id)}: option "${o.text}" is not pure kana`);
        if (o.id !== "correct" && o.text === rec.reading)
          offenders.push(`${lessonId}/${String((step as { id: string }).id)}: distractor equals the answer`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("kanji-set-2 tests eight glyphs and re-tests none of m18's set", () => {
    // A set-2 that re-tested set-1 would measure nothing. m18 shipped
    // 人 水 食べる 行く 聞く 分かる 新しい 高い; this set is disjoint from it.
    const tested = new Set(
      M23_NEO_LESSONS.flatMap((l) => l.steps)
        .filter((s) => s.type === "kanji_reading")
        .map((s) => (s as unknown as { kanji: string }).kanji),
    );
    expect([...tested].sort()).toEqual(["下", "来る", "小さい", "山", "川", "海", "上", "足"].sort());
    for (const m18Glyph of ["人", "水", "食べる", "行く", "聞く", "分かる", "新しい", "高い"])
      expect(tested.has(m18Glyph), `${m18Glyph} is m18's, not m23's`).toBe(false);
  });

  it("no true particle_cloze anywhere — m23 introduces no particle (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so a module that introduces no
    // particle may not use it on one at all. Every cloze here picks among
    // CONTENT words — past forms, dictionary forms, ない-forms, nouns,
    // adjectives.
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

  it("no cloze frame carries a character name or ends on the bare copula", () => {
    // A particle_cloze is HARVESTED into the grammar-review deck, whose
    // comprehensibility gate resolves every word through `courseAtoms` — and
    // ミカ / トム / ケン / たなか have no rows, so a frame naming one lands in
    // GATE_EXEMPTIONS as "too advanced" (m22's finding). The same gate strips
    // only atoms and TAUGHT_ENDINGS, and だ is in neither, so a frame ending
    // in the bare copula reads as unexplained vocabulary (m21's や cloze).
    // Every frame here ends on a VERB.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const rec = step as unknown as { sentenceBefore?: string; sentenceAfter?: string; targetSentence?: string };
      const frame = `${rec.sentenceBefore ?? ""}${rec.sentenceAfter ?? ""}${rec.targetSentence ?? ""}`;
      for (const name of ["ミカ", "トム", "ケン", "たなか"])
        if (frame.includes(name))
          offenders.push(`${lessonId}/${String(step.id)}: cloze frame names ${name}`);
      const tail = (rec.sentenceAfter ?? "").replace(/[。？！\s　]+$/g, "");
      if (tail.endsWith("だ"))
        offenders.push(`${lessonId}/${String(step.id)}: cloze frame ends on bare だ — "${tail}"`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
