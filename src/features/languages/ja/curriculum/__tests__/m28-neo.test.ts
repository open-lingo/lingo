/**
 * m28-neo module guards. Same 2026-07-26 module shape as m12-m27
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m27 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS_BY_KANA } from "../../courseAtoms";
import { VERB_ENTRIES, ADJ_ENTRIES } from "../../conjugationTables";
import { conjugateVerb } from "../../conjugationEngine";
import { KANJI_ELIGIBLE_ATOMS } from "../../secondScript/applyKanjiSurfaces";
import { FURIGANA_WINDOW } from "../../secondScript/kanjiRollout";
import { isKana } from "@/shared/japanese/kanaTable";
import N5_GRAMMAR_POINTS from "@/features/lesson/data/n5-grammar-points.json";
import m28Ir from "../ir/m28.ir.json";
import { M28_NEO_LESSONS } from "../m28-neo";
import { M27_NEO_LESSONS } from "../m27-neo";
import { M26_NEO_LESSONS } from "../m26-neo";
import { M25_NEO_LESSONS } from "../m25-neo";
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

registerJaModuleContentLints("m28");

registerModuleBarGuards({
  moduleLabel: "m28-neo",
  lessons: M28_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25", "m26", "m27"],
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
    ...M24_NEO_LESSONS,
    ...M25_NEO_LESSONS,
    ...M26_NEO_LESSONS,
    ...M27_NEO_LESSONS,
  ],
  // The must-forms exist in neither `courseAtoms` nor the conjugation engine's
  // real-form lexicon (`ChainForm` has no `nakereba` cell), so without this the
  // bar guards' own tokenizer could not see the module's headline vocabulary:
  // 「いかなきゃ」 came out as い + かな + き + ゃ. Declaring them makes them
  // TOKENS, which is what subjects them to the debut check below — the opposite
  // of a loosening.
  //
  // `priorAtoms` is here for the same reason and it is NOT optional: earlier
  // modules registered 68+ inflections in IR `newAtoms` alone (registering
  // inflections in courseAtoms regresses flashcard import), so without them the
  // guard's tokenizer cannot see m27's 「むずかしすぎる」 either — it came out as
  // むず + かしすぎる and was reported as an untracked word in a sentence made
  // entirely of taught vocabulary.
  extraVocab: [
    ...(m28Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m28Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
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

describe("m28-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M28_NEO_LESSONS).toHaveLength(13);
    const reviews = M28_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M28_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M28_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M28_NEO_LESSONS[M28_NEO_LESSONS.length - 1].id).toBe("ja-m28-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M28_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M28_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M28_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m28-neo owes the spine's must/should/kanji row", () => {
  /** RUN-PLAN-n4 coverage ledger, row m28 — THREE ids, and each must be
   *  TAUGHT here (carried by a compiled `grammar_rule` card, not merely
   *  referenced by an `exercises:` tag). */
  it("teaches `nakereba-naranai`, `hou-ga-ii` and `kanji-set-3`, the whole ledger row", () => {
    for (const p of ["nakereba-naranai", "hou-ga-ii", "kanji-set-3"])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("re-teaches the six points the nine teaching lessons need", () => {
    // The row owes THREE ids across nine teaching lessons. Rather than invent
    // IR-local ids (m24 needed four, m25 six), every remaining card is a
    // REGISTRY point re-taught inside the new frame — the m20/m26/m27 move. A
    // re-teach is not a re-assignment (the m16 ruling): no ledger row moves.
    for (const p of [
      "nai-form",         // m6  — the ない-form is the raw material of every must-form
      "kara-because",     // m16 — an obligation is rarely stated without its reason
      "masu-present",     // m7  — なりません, the polite pole
      "ta-form",          // m11 — the た in たほうがいい, the one place it is not a past
      "yori-comparison",  // m20 — ほう and より, the frame ほうがいい is built out of
      "v-tai",            // m13 — want against must
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("invents ZERO grammar-point ids — every card resolves to the N5 registry", () => {
    // Inv 42, asserted against the SHIPPED registry rather than a hand-copied
    // list, with a non-vacuity floor: an empty or failed import would make
    // every id "known" and the check would pass for the wrong reason.
    const registry = new Set(
      (N5_GRAMMAR_POINTS as { id: string }[]).map((p) => p.id),
    );
    expect(registry.size, "the grammar-point registry failed to load").toBeGreaterThan(100);
    const unknown = [...taughtPoints].filter((p) => !registry.has(p));
    expect(taughtPoints.size, "no rule cards found").toBe(9);
    expect(unknown, unknown.join(", ")).toEqual([]);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M28_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m28-neo pedagogy invariants", () => {
  const steps = M28_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );

  /**
   * RULE ZERO — never substring-match Japanese. Japanese has no spaces, so
   * `ja.includes(kana)` matches inside unrelated words and the wrong version
   * always PASSES. This module is entirely an ADJACENCY question — what sits
   * in FRONT of なきゃ (nothing: it is one whole tile), what sits in front of
   * ならない (a 〜なければ form and never a contraction), what sits in front of
   * ほう (a た-form, a ない-form or の) — and none of those can be asked of a
   * substring. 「いかなきゃ」 contains 「かな」, the m25 atom.
   *
   * So this file tokenizes for real: longest-match over the same vocabulary
   * `moduleCompiler.makeTokenizer` uses — courseAtoms ∪ this module's newAtoms
   * ∪ the priorAtoms compile-ir injects (m11-m27's inflections live ONLY
   * there) ∪ particles ∪ names ∪ interjections ∪ STEMS. The first test below
   * proves the two agree by checking every compiled build tile bank against
   * it, so nothing downstream rests on a re-implementation that quietly
   * drifted.
   */
  const PARTICLES = ["は", "が", "を", "に", "で", "と", "の", "も", "へ", "から", "まで", "か"];
  const NAMES = ["トム", "ミカ", "ケン", "たなか", "タナカ"];
  const INTERJ = ["うん", "ううん", "そう", "ええ", "はい", "いいえ"];
  const MASU_STEMS = new Set<string>();
  const KU_STEMS = new Set<string>();
  for (const v of VERB_ENTRIES) {
    const masu = conjugateVerb(v.dictionary, v.group, "masu");
    if (masu.endsWith("ます")) MASU_STEMS.add(masu.slice(0, -2));
  }
  for (const adj of ADJ_ENTRIES) {
    if (adj.type !== "i-adj") continue;
    if (adj.dictionary === "いい") KU_STEMS.add("よく");
    else if (adj.dictionary.endsWith("い")) KU_STEMS.add(`${adj.dictionary.slice(0, -1)}く`);
  }
  MASU_STEMS.delete("");
  KU_STEMS.delete("");
  const IR = m28Ir as unknown as {
    newAtoms: { kana: string }[];
    priorAtoms?: { kana: string }[];
    lessons: { id: string; reviewPool?: string[] }[];
  };
  const NEW_KANA = IR.newAtoms.map((a) => a.kana);
  const PRIOR_KANA = (IR.priorAtoms ?? []).map((a) => a.kana);
  const VOCAB = [
    ...new Set([
      ...JA_COURSE_ATOMS_BY_KANA.keys(),
      ...NEW_KANA,
      ...PRIOR_KANA,
      ...PARTICLES,
      ...NAMES,
      ...INTERJ,
      ...MASU_STEMS,
      ...KU_STEMS,
    ]),
  ].sort((a, b) => b.length - a.length);
  const tok = (ja: string): string[] => {
    const out: string[] = [];
    for (const chunk of ja.replace(/[。、？！]/g, " ").split(/[\s　]+/).filter(Boolean)) {
      let i = 0;
      while (i < chunk.length) {
        const hit = VOCAB.find((t) => chunk.startsWith(t, i));
        if (hit) {
          out.push(hit);
          i += hit.length;
        } else {
          let j = i + 1;
          while (j < chunk.length && !VOCAB.some((t) => chunk.startsWith(t, j))) j++;
          out.push(chunk.slice(i, j));
          i = j;
        }
      }
    }
    return out;
  };

  const surfaces: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  /**
   * WHOLE SENTENCES, not every kana string on the step. `jaSurfaces` walks
   * every field, so a build's `tiles` array contributes the bare tile
   * 「いかなきゃ」 as its own "surface" — useless for an ADJACENCY question,
   * because there is nothing on either side of it. The adjacency guards
   * therefore read the sentence-carrying fields only.
   *
   * FIELD NAMES ARE THE TRAP. `speaking` keeps its answer in `targetPhrase`
   * and `translate` in `acceptedAnswers` (a list — grading is max-acceptance);
   * neither has a `targetSentence`. A scan that reads the wrong field compares
   * `undefined` every time, reports a clean course and is wrong, which is why
   * every guard below asserts it saw something.
   */
  const sentencesOf = (step: Record<string, unknown>): string[] => {
    const out: string[] = [];
    for (const k of ["targetSentence", "targetPhrase", "transcript", "audioText", "correctKana"]) {
      const v = step[k];
      if (typeof v === "string" && v.trim()) out.push(v);
    }
    if (Array.isArray(step.acceptedAnswers))
      for (const a of step.acceptedAnswers as string[])
        if (typeof a === "string" && a.trim()) out.push(a);
    const prompt = step.prompt as { before?: string; after?: string } | undefined;
    if (step.type === "particle_cloze" && prompt && typeof prompt === "object")
      out.push(`${prompt.before ?? ""}${String(step.correctParticle ?? "")}${prompt.after ?? ""}`);
    if (Array.isArray(step.lines))
      for (const l of step.lines as { kana?: string }[])
        if (typeof l?.kana === "string") out.push(l.kana);
    const ex = step.examples;
    if (Array.isArray(ex))
      for (const e of ex as { ja?: string }[]) if (typeof e?.ja === "string") out.push(e.ja);
    return out;
  };

  const sentences: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of sentencesOf(step as unknown as Record<string, unknown>))
      sentences.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  const bare = (t: string) => t.replace(/[。？！]/g, "");

  it("this file's tokenizer reproduces the compiler's own build tiles", () => {
    // NON-VACUITY + CORRECTNESS ANCHOR. Every guard below reads `tok()`, so if
    // `tok()` segmented differently from the compiler the guards would be
    // measuring a sentence the learner never sees. `correctOrder` IS the
    // compiler's tokenization, so comparing the two on every build in the
    // module is a direct proof that they agree. 105 builds measured.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { type: string; targetSentence?: string; correctOrder?: string[]; id: string };
      if (rec.type !== "build_sentence" && rec.type !== "listening_build") continue;
      if (!rec.targetSentence || !rec.correctOrder) continue;
      checked++;
      const mine = tok(rec.targetSentence).join("·");
      const theirs = rec.correctOrder.map(bare).join("·");
      if (mine !== theirs)
        offenders.push(`${lessonId}/${rec.id}: mine [${mine}] vs compiler [${theirs}]`);
    }
    expect(checked, "no build steps to anchor against").toBeGreaterThan(60);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every token resolves to an atom — no invented surface reaches a tile", () => {
    const EXTRA = new Set([...PARTICLES, ...NAMES, ...INTERJ, ...MASU_STEMS, ...KU_STEMS, "だ", "です"]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces)
      for (const t of tok(ja)) {
        scanned++;
        if (
          t.length > 1 &&
          !JA_COURSE_ATOMS_BY_KANA.has(bare(t)) &&
          !NEW_KANA.includes(bare(t)) &&
          !PRIOR_KANA.includes(bare(t)) &&
          !EXTRA.has(bare(t))
        )
          offenders.push(`${where}: 「${t}」 resolves to no atom — ${ja}`);
      }
    // 7304 tokens measured; floor set below it so a projection that stops
    // seeing steps fails loudly rather than passing silently.
    expect(scanned, "no tokens scanned — the projection moved").toBeGreaterThan(5000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── The must-forms are WHOLE, and that is the module's structural claim ──
  //
  // Every 〜なきゃ / 〜なくちゃ / 〜なければ surface in this module is ONE
  // registered atom. Nothing else can be, because the ない-STEM they attach to
  // (いか / のま / かえら) is in no lexicon here — moduleCompiler.STEMS carries
  // the ます-stem and the く-stem only. A must-form the module forgot to
  // register would fragment into い · かな · き · ゃ, which is a real tile bank
  // shipping real junk, so it is checked rather than trusted.
  const MUST_FORMS = new Set(
    NEW_KANA.filter((k) => /(なきゃ|なくちゃ|なければ)$/.test(k)),
  );

  it("every must-form is a WHOLE registered atom — no fragment reaches a tile", () => {
    const offenders: string[] = [];
    let must = 0;
    let scanned = 0;
    for (const { where, ja } of surfaces) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        scanned++;
        // A bare contraction, or a fragment of one, is the failure mode.
        if (t[i] === "なきゃ" || t[i] === "なくちゃ" || t[i] === "なければ" || t[i] === "きゃ" || t[i] === "ちゃ") {
          offenders.push(`${where}: bare 「${t[i]}」 — the contraction must be part of one whole atom — ${ja}`);
          continue;
        }
        if (!/(なきゃ|なくちゃ|なければ)$/.test(t[i])) continue;
        must++;
        if (!MUST_FORMS.has(t[i]))
          offenders.push(`${where}: 「${t[i]}」 is not one of the module's registered must-forms — ${ja}`);
      }
    }
    expect(MUST_FORMS.size, "no must-forms registered").toBe(15);
    // 463 must tokens measured across every surface.
    expect(must, "no must-form token examined — the projection moved").toBeGreaterThan(200);
    expect(scanned, "no tokens scanned").toBeGreaterThan(5000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ならない / なりません follow a 〜なければ form, never a contraction", () => {
    // The masu-present card's own antiPattern is 「いかなきゃ なりません」:
    // なきゃ has already swallowed the ending, so nothing can follow it. This
    // is invisible to any substring check — 「いかなければ」 and 「いかなきゃ」
    // both end in ば/ゃ and both precede the same word in the wrong version.
    const offenders: string[] = [];
    let checked = 0;
    for (const { where, ja } of sentences) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "ならない" && t[i] !== "なりません") continue;
        const prev = t[i - 1];
        if (prev === undefined) {
          offenders.push(`${where}: 「${t[i]}」 opens a sentence — ${ja}`);
          continue;
        }
        checked++;
        if (!prev.endsWith("なければ"))
          offenders.push(
            `${where}: 「${prev}」 in front of 「${t[i]}」 — only a 〜なければ form may take it — ${ja}`,
          );
      }
    }
    // 46 preceders measured in the sentence-carrying fields.
    expect(checked, "no ならない/なりません preceder examined — the projection moved")
      .toBeGreaterThan(25);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every 〜なければ form is finished by ならない / なりません", () => {
    // The other direction of the same claim, and the reason those eight atoms
    // are BOUND: 「いかなければ」 on its own is a dangling conditional. If one
    // ever reached the end of a sentence the learner would be taught to stop
    // halfway through the grammar point.
    const offenders: string[] = [];
    let checked = 0;
    for (const { where, ja } of sentences) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        if (!t[i].endsWith("なければ")) continue;
        checked++;
        const next = t[i + 1];
        if (next !== "ならない" && next !== "なりません")
          offenders.push(`${where}: 「${t[i]}」 is followed by 「${next ?? "(end)"}」 — ${ja}`);
      }
    }
    expect(checked, "no 〜なければ form examined").toBeGreaterThan(25);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── ほう takes a た-form, a ない-form or の, and always が after ─────────
  const TA_FORMS = new Set([
    "たべた", "のんだ", "きいた", "みた", "あそんだ", "いった", "わかった",
    "のった", "およいだ", "はたらいた",
  ]);
  const NAI_FORMS = new Set([
    "たべない", "みない", "のまない", "いかない", "かわない", "しない",
    "およがない", "わからない", "こない",
  ]);

  it("ほう follows a た-form (advice), a ない-form (advice) or の (comparison)", () => {
    // The hou-ga-ii card's antiPattern drops the が; the ta-form card's claim
    // is that the positive side takes た and the negative side takes plain
    // ない, never a past negative. Both are adjacency questions. A dictionary
    // form in front of ほう would render, grade and sound fine on a tile bank
    // and teach the wrong derivation, which is exactly why this is enumerated:
    // an unclassified preceder FAILS and the author has to say which it is.
    const offenders: string[] = [];
    let advice = 0;
    let comparison = 0;
    for (const { where, ja } of sentences) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "ほう") continue;
        const prev = t[i - 1];
        const next = t[i + 1];
        if (next !== "が")
          offenders.push(`${where}: 「ほう」 is followed by 「${next ?? "(end)"}」 — ほう is a NOUN and needs が — ${ja}`);
        if (prev === undefined) {
          offenders.push(`${where}: 「ほう」 opens a sentence — ${ja}`);
          continue;
        }
        if (prev === "の") comparison++;
        else if (TA_FORMS.has(prev) || NAI_FORMS.has(prev)) advice++;
        else
          offenders.push(
            `${where}: 「${prev}」 in front of 「ほう」 is neither a た-form, a ない-form nor の — ${ja}`,
          );
      }
    }
    // 107 ほう tokens measured: 84 advice + 23 comparison.
    expect(advice, "no 〜た/〜ない ほうが いい — the second ledger id is missing")
      .toBeGreaterThan(50);
    expect(comparison, "no 〜の ほうが — the m20 comparison frame is missing")
      .toBeGreaterThan(5);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── vocabulary discipline ───────────────────────────────────────────────
  it("the banned homograph past forms never reach a tile", () => {
    // PROBED, not assumed. 「した」 is the registered atom for 下 "below"
    // (m17), so 「でんわを した ほうが いい」 would credit "below" and nothing
    // would error — m23's finding, and it costs this module the most obvious
    // advice sentence about phoning. 「きた」 is 北 "north" for the same
    // reason. 「はいった」 fragments to はい · った (m23). 「かった」 is banned
    // for a different reason entirely — carrier fatigue — which costs the
    // module 「かった ほうが いい」 and is why 「かわない ほうが いい」 carries
    // every shopping beat. Token-adjacency, never substring: 「した」 is a
    // substring of 「はなした」 and of nothing else here.
    //
    // SCOPED TO AUTHORED SENTENCES, following m26/m27's narrowing and for the
    // same measured reason: a first pass over every `jaSurfaces` string fired
    // once, on `ja-m28-neo-3-debut-0` — a `word_image_mcq` whose options the
    // COMPILER draws from `emojiPool`, where した is the perfectly good atom
    // 下 ⬇️ "below". Nothing there is authored and nothing there is a carrier,
    // so the guard reads the sentence-carrying fields, which is where a wrong
    // past form would actually be taught.
    const BANNED = new Set(["した", "きた", "はいった", "かった"]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of sentences)
      for (const t of tok(ja).map(bare)) {
        scanned++;
        if (BANNED.has(t)) offenders.push(`${where}: 「${t}」 — ${ja}`);
      }
    expect(scanned, "no sentence tokens scanned").toBeGreaterThan(1500);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("「なんですか」 appears nowhere (m27's atoms come forward as priorAtoms)", () => {
    // m27's note names this trap for m28/m29 by name: `compile-ir.mjs` hands
    // m27's newAtoms forward, so 「なんですか」 meaning "what is it?" now
    // tokenizes as なんです · か and credits the explanatory ending inside a
    // question. Asserted over the COMPILED output, not over the IR text.
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        scanned++;
        if (t[i] === "なんです" && t[i + 1] === "か")
          offenders.push(`${where}: 「なんですか」 is ambiguous with "what is it?" — ${ja}`);
        if (t[i] === "なん" && (t[i + 1] === "だ" || t[i + 1] === "です"))
          offenders.push(`${where}: なん + ${t[i + 1]} — the explanatory did not fuse — ${ja}`);
      }
    }
    expect(scanned, "no tokens scanned").toBeGreaterThan(5000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no untaught vocabulary the context pack claims is known", () => {
    // The pack is derived from `courseAtoms` attribution and OVERSTATES: none
    // of these is in any earlier module's priorVocab, so using one would be a
    // bare-word debut the compiler's own provenance gate cannot see (a
    // build_sentence IS intro-capable, so an untaught word slips through as a
    // "debut"). Each was checked token-exactly against m28's computed
    // priorVocab, not against the pack. はやい and あつい stay banned on m20's
    // and m27's homograph rulings.
    const UNTAUGHT = [
      "はやい", "あつい", "よわい", "つめたい", "わるい", "やさしい",
      "まずい", "つまらない", "べんり", "ふべん", "かんたん",
      "こうえん", "まち", "ちかく", "そと", "きょうしつ", "おふろ",
      "べんきょう", "ページ", "よこ", "いりぐち",
      "ノート", "プール", "ドア", "どあ", "クラス", "スポーツ",
      "よむ", "かく", "うたう", "たつ", "とる", "なく", "でる", "おぼえる",
      "まいあさ", "まいばん", "あまい", "はなし", "タクシー",
      "なんで", "おちゃ", "さけ", "ぷりん", "あおい", "しょうゆ",
      "あい", "えび", "ぱん", "ぴあの", "しち",
      // では is an ATOM ("with that…") taught nowhere, so a fused で + は would
      // tile an untaught word (m23's finding, restated by m26 and m27).
      "では",
    ];
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces)
      for (const t of tok(ja)) {
        scanned++;
        if (UNTAUGHT.includes(bare(t)))
          offenders.push(`${where}: 「${t}」 is taught by no module before m28 — ${ja}`);
      }
    expect(scanned, "no tokens scanned").toBeGreaterThan(5000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every carrier flagged over-exposed by the 2026-07-27 audit is absent", () => {
    // Inv 27. The brief's nine worst carriers plus the seven m26/m27 added
    // from the same audit. Token-exact, never substring.
    //
    // SCOPED TO WHAT THE AUTHOR CHOSE — multi-token SENTENCES plus every
    // `reviewPool` — rather than to `jaSurfaces`, following m26/m27's
    // narrowing and for their evidence: a scan over every surface fires on
    // `word_image_mcq` options, which the COMPILER picks out of `emojiPool`,
    // so the offending word is neither authored nor a carrier of anything.
    // `reviewPool` is scanned explicitly because a pool entry IS an authorial
    // choice.
    const FATIGUED = new Set([
      "みせ", "ともだち", "ほん", "ごはん", "いる", "きのう", "あたらしい",
      "えき", "かばん", "みず", "かった", "うみ", "いたい", "でんしゃ",
      "ください", "きっさてん",
    ]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of sentences) {
      if (tok(ja).length < 2) continue;
      for (const t of tok(ja)) {
        scanned++;
        if (FATIGUED.has(bare(t))) offenders.push(`${where}: fatigued carrier 「${t}」 — ${ja}`);
      }
    }
    let pooled = 0;
    for (const lesson of IR.lessons)
      for (const kana of lesson.reviewPool ?? []) {
        pooled++;
        if (FATIGUED.has(kana))
          offenders.push(`${lesson.id}: fatigued carrier 「${kana}」 in reviewPool`);
      }
    // 1978 sentence tokens and 130 pool words measured; floors below them.
    expect(scanned, "no sentence tokens scanned — the projection moved").toBeGreaterThan(1500);
    expect(pooled, "no reviewPool words scanned — the IR shape moved").toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no bound ender is ever a bare word-level production target", () => {
    // `moduleCompiler`'s BOUND list filters these out of the filler pools and
    // `boundEnderProduction.test.ts` is the course-wide ratchet; BOTH gained
    // this module's eight enders WITH the module rather than after it, which
    // is the whole lesson of the つもり / ましょう incident. This is the local
    // half: no pool may carry one either, because a pool entry feeds the
    // filler's bare-word `speaking` slot.
    //
    // THE RULING, stated where the guard can be read beside it: the 〜なきゃ
    // and 〜なくちゃ contractions are NOT bound and are deliberately absent
    // from this list. 「いかなきゃ。」 is a complete utterance ("gotta go") and
    // a legitimate `speaking` target; 「いかなければ」 is a dangling
    // conditional and is not.
    // FIELD NAMES: `speaking` → targetPhrase, `translate` → acceptedAnswers.
    const BOUND = new Set([
      "いかなければ", "のまなければ", "かえらなければ", "しなければ",
      "はたらかなければ", "おぼえなければ", "ならない", "なりません",
      "んだ", "んです", "なんだ", "なんです", "すぎる", "すぎた",
      "つもり", "ましょう", "でしょう", "でしょ", "だろう", "かな", "たり",
    ]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; id: string; targetPhrase?: string; acceptedAnswers?: string[];
      };
      if (rec.type !== "speaking" && rec.type !== "translate") continue;
      const targets =
        rec.type === "speaking"
          ? [rec.targetPhrase].filter((x): x is string => typeof x === "string")
          : (rec.acceptedAnswers ?? []);
      for (const t of targets) {
        scanned++;
        if (BOUND.has(t.replace(/[。？！\s　]/g, "")))
          offenders.push(`${lessonId}/${rec.id} (${rec.type}): bare 「${t}」 as the answer`);
      }
    }
    let pooled = 0;
    for (const lesson of IR.lessons)
      for (const kana of lesson.reviewPool ?? []) {
        pooled++;
        if (BOUND.has(kana)) offenders.push(`${lesson.id}: bound ender 「${kana}」 in reviewPool`);
      }
    expect(scanned, "scanned no production targets — the field names moved")
      .toBeGreaterThan(30);
    expect(pooled, "no reviewPool words scanned").toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no true particle_cloze anywhere — m28 introduces no particle (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so a module that introduces no
    // particle may not use it on one at all. Every cloze here picks among
    // CONTENT words and predicate FORMS.
    const PARTICLE_SET = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    let seen = 0;
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      seen++;
      const options = (step as unknown as { options?: string[] }).options ?? [];
      if (options.length && options.every((o) => PARTICLE_SET.has(o)))
        offenders.push(`${lessonId}/${String(step.id)}: [${options.join(" | ")}]`);
    }
    expect(seen, "no particle_cloze steps at all — inv 45's usage floor is unmet")
      .toBeGreaterThan(8);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no cloze frame carries a character name or ends on the bare copula", () => {
    // A particle_cloze is HARVESTED into the grammar-review deck, whose
    // comprehensibility gate resolves every word through `courseAtoms` — and
    // ミカ / トム / ケン / たなか have no rows, so a frame naming one lands in
    // GATE_EXEMPTIONS as "too advanced" (m22's finding). The same gate strips
    // only atoms and TAUGHT_ENDINGS, and だ is in neither, so a frame ending
    // in the bare copula reads as unexplained vocabulary (m21's finding).
    const offenders: string[] = [];
    let seen = 0;
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      seen++;
      const rec = step as unknown as { sentenceBefore?: string; sentenceAfter?: string; targetSentence?: string };
      const frame = `${rec.sentenceBefore ?? ""}${rec.sentenceAfter ?? ""}${rec.targetSentence ?? ""}`;
      for (const name of ["ミカ", "トム", "ケン", "たなか"])
        if (frame.includes(name))
          offenders.push(`${lessonId}/${String(step.id)}: cloze frame names ${name}`);
      const tail = (rec.sentenceAfter ?? "").replace(/[。？！\s　]+$/g, "");
      if (tail.endsWith("だ"))
        offenders.push(`${lessonId}/${String(step.id)}: cloze frame ends on bare だ — "${tail}"`);
    }
    expect(seen, "no cloze steps found").toBeGreaterThan(8);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── glosses ─────────────────────────────────────────────────────────────
  it("a must-form is glossed as an OBLIGATION, never as advice", () => {
    // GLOSS DISCIPLINE, the one thing no mechanical check normally catches
    // (m23 shipped 11 sentences glossing はいる as "check in"). 「いかなきゃ」
    // is a duty — have to, gotta — and this module spends a whole lesson on
    // the difference between that and 「いった ほうが いい」, which is advice.
    // A must-form glossed "you'd better" collapses the two and deletes the
    // lesson. Scoped to listening_comprehension, the one step type carrying
    // transcript AND gloss as clean fields.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; transcript?: string; correctOptionId?: string;
        options?: { id: string; text: string }[]; id: string;
      };
      if (rec.type !== "listening_comprehension" || !rec.transcript) continue;
      const t = tok(rec.transcript).map(bare);
      if (!t.some((x) => MUST_FORMS.has(x))) continue;
      checked++;
      const correct = rec.options?.find((o) => o.id === rec.correctOptionId)?.text ?? "";
      if (!/(have to|has to|gotta)/i.test(correct))
        offenders.push(
          `${lessonId}/${rec.id}: must-form glossed without an obligation — "${correct}"`,
        );
      if (/\bbetter\b/i.test(correct))
        offenders.push(
          `${lessonId}/${rec.id}: must-form glossed as advice ("better") — that is ほうが いい's job — "${correct}"`,
        );
    }
    expect(checked, "no must-form listening item to check").toBeGreaterThan(6);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("〜た/〜ない ほうが いい is glossed as ADVICE, never as an obligation", () => {
    // The mirror of the guard above, and scoped to the ADVICE reading only:
    // 「さいふの ほうが やすい」 is a comparison and has no business saying
    // "better do" anything, so a ほう preceded by の is skipped.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; transcript?: string; correctOptionId?: string;
        options?: { id: string; text: string }[]; id: string;
      };
      if (rec.type !== "listening_comprehension" || !rec.transcript) continue;
      const t = tok(rec.transcript).map(bare);
      const advice = t.some(
        (x, i) => x === "ほう" && i > 0 && (TA_FORMS.has(t[i - 1]) || NAI_FORMS.has(t[i - 1])),
      );
      if (!advice) continue;
      checked++;
      const correct = rec.options?.find((o) => o.id === rec.correctOptionId)?.text ?? "";
      if (!/\bbetter\b/i.test(correct))
        offenders.push(`${lessonId}/${rec.id}: advice glossed without "better" — "${correct}"`);
      if (/(have to|has to|must)/i.test(correct))
        offenders.push(
          `${lessonId}/${rec.id}: advice glossed as an obligation — that is なきゃ's job — "${correct}"`,
        );
    }
    expect(checked, "no ほうが いい listening item to check").toBeGreaterThan(4);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every register cue is graded — the other register is never accepted", () => {
    // Inv 48, module-local and reading the SENTENCE fields rather than only
    // `acceptedAnswers` (which is all the course-wide
    // `registerCueGrading.test.ts` can see). L5 is THE register lesson of this
    // module — なきゃ with friends, なければ なりません with everybody else —
    // and it carries one deliberately PLAIN beat as the contrast, so both
    // directions have to be checked or the guard passes by only ever looking
    // one way.
    const POLITE = /(です|ます|ません|ました|ましょう|ください|でした)(か)?[。？！]?\s*$/;
    const offenders: string[] = [];
    let politeCues = 0;
    let plainCues = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const prompt = String(rec.promptEn ?? rec.sourceText ?? rec.prompt ?? "");
      const wantsPolite = /say politely/i.test(prompt);
      const wantsPlain = /say to a friend/i.test(prompt);
      if (!wantsPolite && !wantsPlain) continue;
      for (const ja of sentencesOf(rec)) {
        const clause = ja.split(/[。？！]/).filter((c) => c.trim()).at(-1) ?? ja;
        const isPolite = POLITE.test(clause.trim());
        if (wantsPolite) politeCues++;
        else plainCues++;
        if ((wantsPolite && !isPolite) || (wantsPlain && isPolite))
          offenders.push(
            `${lessonId}/${String(rec.id)}: prompt "${prompt}" carries ${isPolite ? "polite" : "plain"} 「${ja}」`,
          );
      }
    }
    expect(politeCues, "no politely-cued surface — L5's register lesson is missing")
      .toBeGreaterThan(8);
    expect(plainCues, "no friend-cued surface — the plain contrast beat is missing")
      .toBeGreaterThan(0);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

// ── kanji-set-3, the third ledger id ──────────────────────────────────────
describe("m28-neo kanji-set-3 is a READING ladder that reads cold", () => {
  const kanjiSteps = M28_NEO_LESSONS.flatMap((l) =>
    l.steps
      .filter((s) => s.type === "kanji_reading")
      .map((s) => [l.id, s as unknown as {
        id: string; kanji: string; reading: string;
        correctOptionId: string; options: { id: string; text: string }[];
        promptAnnotation?: { surface: string; reading: string }[];
      }] as const),
  );

  /** m18 shipped set-1 and m23 shipped set-2. A set-3 that re-tested either
   *  would measure nothing, so both are enumerated and excluded. */
  const SET_1 = ["人", "水", "食べる", "行く", "聞く", "分かる", "新しい", "高い"];
  const SET_2 = ["山", "川", "海", "上", "下", "小さい", "足", "来る"];

  it("is exactly eight glyphs — the COMPOUND set — each TAUGHT before reviewed", () => {
    // Counts DISTINCT GLYPHS, not steps. It asserted `toHaveLength(8)` until
    // 2026-07-27, which sounds like the same thing and is not: with exactly
    // one beat per glyph spread over L9/L10/L11/review-3, whichever glyph
    // landed in the review had its FIRST cold read there. QA caught 先生 that
    // way. A glyph is now taught in a teaching lesson and may be re-tested in
    // a review, which is what a review is for — so the step count is a floor
    // and the glyph SET is the invariant.
    const glyphs = [...new Set(kanjiSteps.map(([, s]) => s.kanji))];
    expect(kanjiSteps.length, "no kanji steps at all").toBeGreaterThanOrEqual(8);
    expect(glyphs.sort()).toEqual(
      ["会社", "先生", "外国", "天気", "学校", "時間", "話す", "電話"].sort(),
    );
    const firstBeat = new Map<string, string>();
    for (const [lessonId, s] of kanjiSteps)
      if (!firstBeat.has(s.kanji)) firstBeat.set(s.kanji, lessonId);
    const debutsInReview = [...firstBeat]
      .filter(([, lessonId]) => /review|challenge/.test(lessonId))
      .map(([k, lessonId]) => `${k} is first read in ${lessonId}`);
    expect(debutsInReview, debutsInReview.join("\n")).toEqual([]);
  });

  it("re-tests nothing from set-1 or set-2", () => {
    const taken = new Set([...SET_1, ...SET_2]);
    const overlap = kanjiSteps.map(([, s]) => s.kanji).filter((k) => taken.has(k));
    expect(taken.size, "the earlier sets failed to enumerate").toBe(16);
    expect(overlap, overlap.join(", ")).toEqual([]);
  });

  it("every glyph is past its furigana window at m28, so it reads COLD", () => {
    // A kanji unlocking at module N keeps furigana for N and N+1 and reads
    // bare from N+FURIGANA_WINDOW. Testing a reading that is still floating
    // its own answer on the module's sentence surfaces would be a first
    // sighting dressed as a check — which is why m27's 空 (unlock 27) was
    // rejected from this set.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of kanjiSteps) {
      const atomId = JA_COURSE_ATOMS_BY_KANA.get(step.reading)?.id;
      const entry = atomId ? KANJI_ELIGIBLE_ATOMS.get(atomId) : undefined;
      if (!entry) {
        offenders.push(`${lessonId}/${step.id}: ${step.kanji} is not in the rollout catalog`);
        continue;
      }
      checked++;
      if (28 < entry.unlockModule + FURIGANA_WINDOW)
        offenders.push(
          `${lessonId}/${step.id}: ${step.kanji} unlocks at m${entry.unlockModule}, so it still shows furigana at m28`,
        );
    }
    expect(checked, "no kanji entry resolved — the catalog lookup moved").toBe(kanjiSteps.length);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("shows the tested kanji BARE and offers four distinct kana readings", () => {
    // The factory's own contract (kanjiReading.test.ts): promptAnnotation is
    // emitted in the furigana-OFF shape so the ruby renderer has nothing to
    // float, and every option is pure kana because this step never asks for
    // kanji production.
    let checked = 0;
    for (const [lessonId, step] of kanjiSteps) {
      checked++;
      const where = `${lessonId}/${step.id}`;
      expect(step.promptAnnotation, where).toHaveLength(1);
      expect(step.promptAnnotation![0].surface, where).toBe(step.kanji);
      expect(step.promptAnnotation![0].reading, where).toBe(step.kanji);
      expect(step.options, where).toHaveLength(4);
      expect(new Set(step.options.map((o) => o.text)).size, where).toBe(4);
      for (const o of step.options)
        expect(Array.from(o.text).every((c) => isKana(c)), `${where}: ${o.text}`).toBe(true);
      const correct = step.options.find((o) => o.id === step.correctOptionId);
      expect(correct?.text, where).toBe(step.reading);
      // Only ONE option may be the answer.
      expect(step.options.filter((o) => o.text === step.reading), where).toHaveLength(1);
    }
    expect(checked, "no kanji steps scanned").toBe(kanjiSteps.length);
  });

  it("is sprinkled across the module rather than walled into one lesson", () => {
    // m23's rule, restated: five in the kanji lesson, the rest spread. A wall
    // of eight identical recognition steps is a table, not a lesson.
    const byLesson = new Map<string, number>();
    for (const [lessonId] of kanjiSteps)
      byLesson.set(lessonId, (byLesson.get(lessonId) ?? 0) + 1);
    expect(byLesson.size, [...byLesson].map(([k, v]) => `${k}:${v}`).join(", "))
      .toBeGreaterThanOrEqual(4);
    expect(Math.max(...byLesson.values())).toBeLessThanOrEqual(5);
  });
});
