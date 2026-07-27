/**
 * m24-neo module guards. Same 2026-07-26 module shape as m12-m23
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m23 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS_BY_KANA } from "../../courseAtoms";
import { M24_NEO_LESSONS } from "../m24-neo";
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

registerJaModuleContentLints("m24");

registerModuleBarGuards({
  moduleLabel: "m24-neo",
  lessons: M24_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23"],
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
    ...M23_NEO_LESSONS,
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

describe("m24-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M24_NEO_LESSONS).toHaveLength(13);
    const reviews = M24_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M24_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M24_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M24_NEO_LESSONS[M24_NEO_LESSONS.length - 1].id).toBe("ja-m24-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M24_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("carries NO kanji_reading steps (kanji-set-3 is m28's ledger row)", () => {
    const kanji = M24_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "kanji_reading",
    );
    expect(kanji).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M24_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M24_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m24-neo owes the spine's can-and-let's points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m24. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = ["mashou", "masenka", "no-ga-jouzu", "no-ga-heta"];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("teaches the four potential-system points the registry has no id for", () => {
    // `n5-grammar-points.json` holds 103 points and NONE of them is the
    // potential form — the potential is nominally N4 grammar that the
    // dict-form-first rewrite pulled forward, which docs/spine-n4.md §1.1
    // states in so many words ("potential form (full system, incl. ら抜き
    // recognition) | Owned by m24"). Inv 42 forbids INVENTING an id where the
    // registry has one; it cannot require one that does not exist. These four
    // are declared in the IR's own grammarPoints[], the same move m11 made for
    // `itsu-when`. The registry was deliberately not edited — see the IR notes.
    for (const p of ["potential-form", "potential-rareru", "dekiru", "mieru-kikoeru"])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("re-teaches nai-form, the one ⟳ point the module leans on", () => {
    // Every potential form is itself a る-verb, so its negative is m6's rule
    // applied to a new stem: のめる → のめない is exactly たべる → たべない.
    // That IS the module's argument for learning the potential as a FORM, so
    // the re-teach is content rather than filler. No ledger row moves.
    expect(taughtPoints.has("nai-form")).toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M24_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m24-neo pedagogy invariants", () => {
  const steps = M24_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (deliberate wrong
   *  sentences — 「のむれる」 and 「たべるましょう」 ARE the learner errors these
   *  lessons name) and grading-only `acceptedAnswers`. */
  const surfaces: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  /** SPACE-SEGMENTED tokens, never a substring test (RULE ZERO). Japanese has
   *  no spaces, so `ja.includes(kana)` matches inside unrelated words and the
   *  wrong version always passes — the single most common defect in this run.
   *  The IR authors clause boundaries as spaces, so a segment IS a word here;
   *  where a claim needs true tiles the compiled `tiles` array is read instead
   *  (see the ましょう-stem guard below). */
  const segmentsOf = (ja: string): string[] =>
    ja.split(/[\s　]+/).map((t) => t.replace(/[。？！]/g, "")).filter(Boolean);

  it("三 potential forms whose kana belong to another verb never reach a surface", () => {
    // MEASURED against courseAtoms, not assumed. かう's potential is かえる,
    // which is the m14 atom 帰る "to go back"; かく's is かける, the m14 atom
    // 掛ける "to call by phone"; つく's is つける, 付ける "to turn on". A bare
    // かえる tile would credit the wrong verb and NOTHING would error — the
    // same silent shape that made した (下) unusable in m23. The fix is
    // authorial: those three verbs never appear in the potential here.
    const BANNED = ["かえる", "かける", "つける"];
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const seg of segmentsOf(ja))
        if (BANNED.includes(seg))
          offenders.push(`${where}: 「${seg}」 is another verb's atom — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no ましょう form is built on a ます-stem that is itself a noun", () => {
    // ましょう is registered as a SUFFIX, so 「たべましょう」 tiles as
    // たべ + ましょう. That is only safe when the stem is not a registered
    // word: する→し is 四 "four", くる→き is 木 "tree", かう→かい is 貝
    // "shell", まつ→まち is 町 "town", つく→つき is 月 "moon", はなす→はなし
    // is 話 "talk". 「しましょう」 is registered WHOLE (5 chars, so
    // longest-match beats し) and is the ONE legal exception.
    //
    // Read from the COMPILED tiles rather than the authored string, because
    // the tile is the thing that credits an atom — a module guard over
    // authored surfaces cannot see what the tokenizer actually emitted
    // (RUN-PLAN, the m23 backfill note).
    const NOUN_STEMS = new Set(["し", "き", "かい", "まち", "つき", "はなし", "みせ", "とり"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { tiles?: string[]; correctOrder?: string[]; id: string };
      const tiles = [...(rec.tiles ?? []), ...(rec.correctOrder ?? [])];
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i] !== "ましょう" && tiles[i] !== "ましょう。") continue;
        const stem = tiles[i - 1];
        if (stem !== undefined && NOUN_STEMS.has(stem))
          offenders.push(
            `${lessonId}/${rec.id}: 「${stem}」+ましょう — ${stem} is a registered NOUN, so the tile credits the wrong atom`,
          );
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every ましょう / ませんか surface tiles into KNOWN atoms only", () => {
    // The positive half of the guard above: read the compiled tiles of every
    // polite-invitation build and assert each tile resolves to a real atom
    // (or the suffix/particle the module registered). A fragment here means
    // the ます-form has no atom row — ききません and およぎません are exactly
    // the shapes that fail, which is why this module's ませんか set is
    // たべません / のみません / みません / いきません and nothing else.
    const EXTRA = new Set(["ましょう", "しましょう", "か", "に", "を", "で", "が", "は", "と", "の", "も", "から", "まで", "へ", "な", "だ"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { tiles?: string[]; correctOrder?: string[]; id: string };
      const tiles = [...(rec.correctOrder ?? [])];
      if (!tiles.some((t) => t.startsWith("ましょう") || t.includes("ません"))) continue;
      for (const raw of tiles) {
        const t = raw.replace(/[。？！]/g, "");
        if (t.length <= 1 || EXTRA.has(t)) continue;
        if (["トム", "ミカ", "ケン", "たなか"].includes(t)) continue;
        // ます-stems are legal tiles (m19's 〜に いく shipped them) and are not
        // atoms; accept a stem only when suffixed by ましょう on the next tile.
        const next = tiles[tiles.indexOf(raw) + 1];
        if (next && next.replace(/[。？！]/g, "") === "ましょう") continue;
        if (!JA_COURSE_ATOMS_BY_KANA.has(t))
          offenders.push(`${lessonId}/${rec.id}: tile 「${t}」 resolves to no atom`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ら抜き forms are RECOGNITION only — never a production target", () => {
    // The spine's own wording: "casual speech often drops ら (食べれる) —
    // understand it, produce the full form". たべれる / みれる are registered
    // so the module can HEAR them without shipping an untracked word, and they
    // are legal on a rule card, a listening_comprehension and a dialogue —
    // never on a build, translate, speaking or listening_build target, where
    // the learner would be asked to produce them.
    const RANUKI = ["たべれる", "みれる"];
    const PRODUCTION = new Set([
      "build_sentence", "translate", "speaking", "listening_build", "particle_cloze",
    ]);
    const offenders: string[] = [];
    for (const { where, ja, type } of surfaces) {
      if (!PRODUCTION.has(type)) continue;
      for (const seg of segmentsOf(ja))
        if (RANUKI.includes(seg))
          offenders.push(`${where} (${type}): ら抜き 「${seg}」 as a production target — ${ja}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
    // …and non-vacuity: the module must actually TEACH them somewhere, or the
    // guard above passes by saying nothing at all.
    const heard = surfaces.filter(({ ja }) =>
      segmentsOf(ja).some((s) => RANUKI.includes(s)),
    );
    expect(heard.length, "ら抜き is never heard — the recognition beat is missing").toBeGreaterThanOrEqual(3);
  });

  it("no negative potential reaches a surface without an atom row", () => {
    // Only THREE negative potentials are registered (のめない / たべられない /
    // できない), because each new row is a course-wide tokenizer change. Any
    // other 〜えない / 〜られない surface would fragment silently: 「いけない」
    // has no row, 「みられない」 has no row, 「きこえない」 has no row. Every one
    // of them was authored into a first draft and rewritten out.
    const REGISTERED = new Set(["のめない", "たべられない", "できない"]);
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const seg of segmentsOf(ja)) {
        if (!/(えない|られない)$/.test(seg)) continue;
        if (REGISTERED.has(seg)) continue;
        offenders.push(`${where}: 「${seg}」 has no atom row — ${ja}`);
      }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no potential surface is glossed with an English progressive", () => {
    // Inv 17, applied to this module's own semantics: 「のめる」 is "I can
    // drink", never "I'm able to be drinking". A progressive gloss on a
    // potential primes ている where there is none.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const ja = String(rec.targetSentence ?? rec.audioText ?? "");
      if (!/(のめる|いける|およげる|はなせる|あるける|たべられる|みられる|こられる|できる)/.test(ja)) continue;
      const glosses = [rec.prompt, rec.meaningEn, rec.translation, rec.englishPrompt]
        .filter((x): x is string => typeof x === "string" && /[A-Za-z]/.test(x))
        .filter((x) => !/^build what you hear/i.test(x.trim()));
      for (const g of glosses)
        if (/\b(am|is|are)\s+\w+ing\b/i.test(g))
          offenders.push(`${lessonId}/${String(rec.id)}: potential glossed progressive — "${g}"`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("じょうず is never said about the speaker (the culture rule the card states)", () => {
    // Calling YOURSELF じょうず lands as boasting in a way "good at" does not,
    // and the no-ga-jouzu card says so. Every じょうず assertion in the module
    // is about a third party; the speaker's own skill is へた or
    // あまり じょうずじゃない.
    const offenders: string[] = [];
    for (const { where, ja } of surfaces) {
      const segs = segmentsOf(ja);
      if (!segs.includes("じょうずだ") && !segs.includes("じょうず")) continue;
      if (segs.includes("じゃない") || segs.includes("じょうずじゃない")) continue;
      if (segs.includes("わたしは") || segs.includes("ぼくは"))
        offenders.push(`${where}: the speaker calls themselves じょうず — ${ja}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("へた is never said about a third party (the card's mirror rule)", () => {
    // The no-ga-heta card teaches that へた is the word you use about YOURSELF
    // and that the polite way to say somebody ELSE is not good is
    // 「あまり じょうずじゃない」. A module that then ships 「トムは …へただ」
    // contradicts its own card, so every へた assertion here is either
    // first-person (ぼく) or a character's self-report inside a dialogue.
    const NAMES = ["トム", "ミカ", "ケン", "たなか", "あね", "いもうと", "ちち", "はは", "あに", "おとうと"];
    const offenders: string[] = [];
    for (const { where, ja, type } of surfaces) {
      const segs = segmentsOf(ja);
      if (!segs.some((t) => t === "へた" || t.startsWith("へただ"))) continue;
      if (type === "dialogue_listen") continue; // a speaker reporting on themselves
      for (const n of NAMES)
        if (segs.some((t) => t.startsWith(n)))
          offenders.push(`${where}: へた ascribed to ${n} — ${ja}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no untaught vocabulary the context pack claims is known", () => {
    // The pack is built from `courseAtoms` attribution and OVERSTATES what the
    // learner has met: none of these is in any earlier module's priorVocab, so
    // using one would be a bare-word debut the compiler's own provenance gate
    // cannot see (a build_sentence IS intro-capable, so an untaught word slips
    // through as a "debut"). Every entry was found by tokenizing this module's
    // surfaces against the compiler's vocabulary and checking each token
    // against priorVocab — かく, へや and タクシー were all caught that way and
    // rewritten out. Token-exact, never substring (RULE ZERO).
    const UNTAUGHT = [
      "かく", "よむ", "とる", "うたう", "おぼえる", "でる", "たつ", "みがく",
      "なる", "すむ", "へや", "こうえん", "タクシー", "プール", "えいご",
      "はなし", "ノート", "ちかく", "そば", "ゆっくりと", "せっけん", "にく",
      // では is an ATOM ("with that…") taught nowhere, so 「かわでは」 fuses
      // で + は into it and tiles an untaught word (m23's finding).
      "では",
    ];
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const seg of segmentsOf(ja))
        if (UNTAUGHT.includes(seg))
          offenders.push(`${where}: 「${seg}」 is taught by no module before m24 — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no true particle_cloze anywhere — m24 introduces no particle (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so a module that introduces no
    // particle may not use it on one at all. Every cloze here picks among
    // CONTENT words — potential forms, dictionary forms, ない-forms,
    // な-adjectives, polite forms.
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
    // only atoms and TAUGHT_ENDINGS, and だ is in neither, so a frame ending in
    // the bare copula reads as unexplained vocabulary (m21's や cloze).
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

  it("every carrier flagged over-exposed by the 2026-07-27 audit is absent", () => {
    // Inv 27. `node scripts/exposure-audit.mjs` names these 15 as the worst
    // over-exposed carriers in the course; an ability module has its own
    // natural stock, so none of them carries a sentence here. Token-exact,
    // never substring — 「みず」 ⊄ 「みずうみ」 matters and 「いる」 is a
    // substring of nothing this module says.
    const FATIGUED = new Set([
      "みせ", "ともだち", "ほん", "ごはん", "みず", "きのう", "あたらしい",
      "えき", "かった", "うみ", "いたい", "でんしゃ", "ちゃ", "ください",
    ]);
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const seg of segmentsOf(ja))
        if (FATIGUED.has(seg)) offenders.push(`${where}: fatigued carrier 「${seg}」 — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
