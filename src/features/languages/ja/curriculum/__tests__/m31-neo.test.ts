/**
 * m31-neo module guards — spine unit n4-02, "Give & receive I:
 * あげる・くれる・もらう (things)". Same 2026-07-26 module shape as m12–m30
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST. Like m12–m30 it splices NOTHING in at module
 * level — the katakana programme ended at m11 — so the compiled lessons ARE the
 * shipped lessons and the guards run over the whole module.
 *
 * Four things make this file different from m30's, and each has its own
 * describe block:
 *
 *   1. **ZERO て-FORMS, of any verb, anywhere.** The spine's n4-02 block says
 *      "no て-forms in this module at all" because 〜てあげる / 〜てくれる /
 *      〜てもらう are n4-06, and the tier's whole sequencing bet is that no
 *      module carries two axes at once. That is a claim about compiled output,
 *      so it is measured over compiled output — with a non-vacuity floor on the
 *      て-form inventory it scans against, because an empty inventory would make
 *      the check pass for the wrong reason.
 *   2. **THE VIEWPOINT BAN IS STRUCTURAL.** ×わたしにあげる is the spine's named
 *      antiPattern, and a module that teaches it must not contain it. The check
 *      is positional — the token immediately in front of に — because "does the
 *      sentence contain わたし" is a substring question and every あげる sentence
 *      with a first-person GIVER would trip it.
 *   3. **くださる / いただく ARE RECOGNITION ONLY.** Spine: production at n4-21.
 *      They may appear on a rule card, a listening step and a dialogue line;
 *      they may never be a build or speaking target and never enter a
 *      reviewPool, because the filler generator draws production targets from
 *      the pool (m23/m24's bound-ender finding). This is m30's 〜とく fence.
 *   4. **FOUR INVENTED IDS, AND ONLY FOUR.** N4 still has no grammar-point
 *      registry, so `ageru`, `kureru`, `morau` and `ni-recipient` are IR-local
 *      by necessity; every OTHER card is a shipped N5 registry point re-taught
 *      in the new frame. That ratio is asserted against the shipped registry,
 *      not a hand-copied list.
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
import N5_GRAMMAR_POINTS from "@/features/lesson/data/n5-grammar-points.json";
import m31Ir from "../ir/m31.ir.json";
import { M31_NEO_LESSONS } from "../m31-neo";
import { M30_NEO_LESSONS } from "../m30-neo";
import { M29_NEO_LESSONS } from "../m29-neo";
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

registerJaModuleContentLints("m31");

registerModuleBarGuards({
  moduleLabel: "m31-neo",
  lessons: M31_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30"],
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
    ...M28_NEO_LESSONS,
    ...M29_NEO_LESSONS,
    ...M30_NEO_LESSONS,
  ],
  // Same reason m28/m29/m30 needed this: this module's own inflections
  // (もらった, くれない, いただいた …) and m11–m30's 100+ IR-only forms exist in
  // neither `courseAtoms` nor the conjugation engine's real-form lexicon, so
  // without them the bar guards' tokenizer cannot see the module's headline
  // vocabulary at all. Declaring them makes them TOKENS, which is what subjects
  // them to the debut check — the opposite of a loosening.
  extraVocab: [
    ...(m31Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m31Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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

describe("m31-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M31_NEO_LESSONS).toHaveLength(13);
    const reviews = M31_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    expect(reviews).toHaveLength(3);
    expect(M31_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    // Reviews sit in the first, middle and last thirds rather than bunched.
    const at = reviews.map((r) => M31_NEO_LESSONS.indexOf(r));
    expect(at).toEqual([3, 7, 11]);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M31_NEO_LESSONS[M31_NEO_LESSONS.length - 1].id).toBe("ja-m31-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M31_NEO_LESSONS.filter((l) => l.id.includes("kata"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M31_NEO_LESSONS)
      expect(getMockLessonContent(l.id), `${l.id} not registered in mockLessons`).not.toBeNull();
  });

  it("declares exactly the spine's 36 atoms", () => {
    const atoms = (m31Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms;
    expect(atoms).toHaveLength(36);
    expect(new Set(atoms.map((a) => a.kana)).size, "duplicate kana declared").toBe(36);
  });

  it("owes the spine's `must` allocation — declared new, or already taught", () => {
    // n4-02's `must` list is [プレゼント, おくる, かす, かりる, おれい,
    // たんじょうび, おかし]. THREE of those are already taught — おくる is m30's,
    // かす is m8's — and re-declaring a taught word would reset its SRS history
    // rather than teach anything. So the bar is "the learner owns it by the end
    // of this module", not "this module declared it".
    const ir = m31Ir as unknown as { newAtoms: { kana: string }[]; priorVocab?: string[] };
    const owned = new Set([...ir.newAtoms.map((a) => a.kana), ...(ir.priorVocab ?? [])]);
    expect(owned.size, "the IR failed to load").toBeGreaterThan(300);
    for (const w of ["プレゼント", "おくる", "かす", "かりる", "おれい", "たんじょうび", "おかし"])
      expect(owned.has(w), `spine \`must\` word ${w} is neither taught nor declared`).toBe(true);
  });
});

const taughtPoints = new Set(
  M31_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m31-neo owes the spine's give-and-receive row", () => {
  it("teaches the three payload verbs and the recipient に", () => {
    for (const p of ["ageru", "kureru", "morau", "ni-recipient"])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("re-teaches the four REGISTRY points the nine teaching lessons need", () => {
    // A re-teach is not a re-assignment (the m16 ruling): no ledger row moves.
    for (const p of [
      "kara-origin", // m4  — から is もらう's other legal source marker
      "ta-form", // m11 — あげた / くれた / もらった is where the module becomes reportable
      "wa-topic", // m3  — viewpoint cashes out as which participant may disappear
      // m13 — 〜たい on the three verbs. Added 2026-08-15 when the L1+L2 merge
      // (あげる and くれる taught as ONE axis rather than in consecutive
      // single-verb lessons) freed a card slot. あげたい / もらいたい were
      // already declared atoms carrying sentences in the shipped module with no
      // card of their own, so the module was USING the form and never teaching
      // it; this spends the freed slot closing that.
      "v-tai",
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("invents EXACTLY FOUR ids, and all four are the N4 payload", () => {
    // Inv 42, asserted against the SHIPPED registry rather than a hand-copied
    // list, with a non-vacuity floor: an empty or failed import would make
    // every id "known" and the check would pass for the wrong reason.
    const registry = new Set((N5_GRAMMAR_POINTS as { id: string }[]).map((p) => p.id));
    expect(registry.size, "the grammar-point registry failed to load").toBeGreaterThan(100);
    const invented = [...taughtPoints].filter((p) => !registry.has(p)).sort();
    // EIGHT distinct ids since 2026-08-15 (was seven). The count moved for one
    // reason and it is a registry point, not an invention: `v-tai` joined the
    // card set. The INVENTED four are unchanged, which is what inv 42 is
    // actually about — the N4 tier still has no registry of its own.
    expect(taughtPoints.size, "no rule cards found").toBe(8);
    expect(invented).toEqual(["ageru", "kureru", "morau", "ni-recipient"]);
  });

  it("ships nine rule cards across nine teaching lessons", () => {
    // Eight distinct IDS but NINE cards: `ageru` teaches twice under a
    // `variant` (the axis at L1, the ban at L5), which is how one grammar point
    // keeps one SRS history while each lesson still states its own rule (m6's
    // three `nai-form` cards). `kureru` used to be the second doubled id; since
    // the L1+L2 merge it carries only the honorific card, and `v-tai` took the
    // freed slot. One card per teaching lesson — two adjacent PINNED
    // grammar_rule steps would fail the adjacency bar (m14's layout law).
    const cards = M31_NEO_LESSONS.flatMap((l) =>
      l.steps.filter((s) => s.type === "grammar_rule").map(() => l.id),
    );
    expect(cards).toHaveLength(9);
    expect(new Set(cards).size, "two cards landed in one lesson").toBe(9);
    for (const l of M31_NEO_LESSONS.filter((x) => /-review(-\d+)?$/.test(x.id)))
      expect(
        l.steps.filter((s) => s.type === "grammar_rule"),
        `${l.id} is a review lesson and should carry no rule card`,
      ).toHaveLength(0);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    // くださる / いただく are handled as RECOGNITION vocabulary, deliberately
    // NOT as a register drill — the register axis is m50 and the spine splits
    // one axis per module.
    for (const lesson of M31_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });

  it("ships EXACTLY TWO image MCQs — こども and たんじょうび — and no more", () => {
    // m30 shipped zero and said why. This module can honestly ship two, and the
    // test is on the CONDITION rather than the count: an atom may carry a
    // picture only if no word the learner has MET shares its glyph (the
    // m19/m24/m26 shared-glyph ruling) and no rule card names it (the m14
    // debut-theft ruling). 🎂 is carried by exactly one row course-wide; 🧒 is
    // shared only with おさななじみ, which is `future` and unmet. Everything
    // else m31 declares is a derived form, an abstract noun (おれい, おいわい,
    // きねん) or an adjective, and the emoji rubric exists to stop art being
    // invented for those. The three registry rows that DO carry art — あげる
    // 🎁, かりる 🤝, おかし 🍬 — are `blocked` with the reason on each row.
    const imaged = M31_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "word_image_mcq",
    );
    expect(imaged).toHaveLength(2);
    const atoms = (m31Ir as unknown as { newAtoms: { kana: string; imageable?: boolean }[] })
      .newAtoms;
    const imageable = atoms.filter((a) => a.imageable === true).map((a) => a.kana).sort();
    expect(imageable).toEqual(["こども", "たんじょうび"]);
    // Each imaged atom must own its glyph among words the learner has met, or
    // the MCQ can draw a same-art distractor. Measured against the registry.
    const met = new Set([
      ...((m31Ir as unknown as { priorVocab?: string[] }).priorVocab ?? []),
      ...atoms.map((a) => a.kana),
    ]);
    for (const kana of imageable) {
      const atom = JA_COURSE_ATOMS_BY_KANA.get(kana);
      expect(atom?.emoji, `${kana} lost its registry emoji`).toBeTruthy();
      const rivals = [...JA_COURSE_ATOMS_BY_KANA.values()].filter(
        (a) => a.emoji === atom!.emoji && a.kana !== kana && met.has(a.kana),
      );
      expect(rivals.map((a) => a.kana), `${kana} shares ${atom!.emoji} with a MET word`).toEqual([]);
    }
  });
});

describe("m31-neo pedagogy invariants", () => {
  const steps = M31_NEO_LESSONS.flatMap((l) => l.steps.map((s) => [l.id, s] as const));

  /**
   * RULE ZERO — never substring-match Japanese. Japanese has no spaces, so
   * `ja.includes(kana)` matches inside unrelated words and the wrong version
   * always PASSES. This module is a POSITIONAL question end to end — which
   * participant sits in front of に, and whether any verb ever wears a て — and
   * neither can be asked of a substring.
   *
   * So this file tokenizes for real: longest-match over the same vocabulary
   * `moduleCompiler.makeTokenizer` uses — courseAtoms ∪ this module's newAtoms ∪
   * the priorAtoms compile-ir injects (m11–m30's inflections live ONLY there) ∪
   * particles ∪ names ∪ interjections ∪ STEMS. The first test below proves the
   * two agree by checking every compiled build tile bank against it, so nothing
   * downstream rests on a re-implementation that quietly drifted.
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
  const IR = m31Ir as unknown as {
    newAtoms: { kana: string; kind?: string; derivedFrom?: string }[];
    priorAtoms?: { kana: string; kind?: string; derivedFrom?: string }[];
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

  const bare = (t: string) => t.replace(/[。？！]/g, "");

  const surfaces: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({
        where: `${lessonId}/${String((step as { id: string }).id)}`,
        ja,
        type: step.type,
      });

  /**
   * WHOLE SENTENCES, not every kana string on the step. `jaSurfaces` walks every
   * field, so a build's `tiles` array contributes the bare tile 「あげる」 as its
   * own "surface" — useless for a positional question, because there is nothing
   * on either side of it.
   *
   * FIELD NAMES ARE THE TRAP. `speaking` keeps its answer in `targetPhrase` and
   * `translate` in `acceptedAnswers` (a list); neither has a `targetSentence`. A
   * scan that reads the wrong field compares `undefined` every time and reports
   * a clean course, which is why every guard below asserts it saw something.
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
      sentences.push({
        where: `${lessonId}/${String((step as { id: string }).id)}`,
        ja,
        type: step.type,
      });

  it("this file's tokenizer reproduces the compiler's own build tiles", () => {
    // NON-VACUITY + CORRECTNESS ANCHOR. Every guard below reads `tok()`, so if
    // `tok()` segmented differently from the compiler the guards would be
    // measuring a sentence the learner never sees. `correctOrder` IS the
    // compiler's tokenization, so comparing the two on every build in the
    // module is a direct proof that they agree.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string;
        targetSentence?: string;
        correctOrder?: string[];
        id: string;
      };
      if (rec.type !== "build_sentence" && rec.type !== "listening_build") continue;
      if (!rec.targetSentence || !rec.correctOrder) continue;
      checked++;
      const mine = tok(rec.targetSentence).join("·");
      const theirs = rec.correctOrder.map(bare).join("·");
      if (mine !== theirs)
        offenders.push(`${lessonId}/${rec.id}: mine [${mine}] vs compiler [${theirs}]`);
    }
    expect(checked, "no build steps to anchor against").toBeGreaterThan(80);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every token resolves to an atom — no invented surface reaches a tile", () => {
    const EXTRA = new Set([
      ...PARTICLES,
      ...NAMES,
      ...INTERJ,
      ...MASU_STEMS,
      ...KU_STEMS,
      "だ",
      "な",
      "です",
    ]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces)
      for (const t of tok(ja)) {
        scanned++;
        if (
          !JA_COURSE_ATOMS_BY_KANA.has(t) &&
          !NEW_KANA.includes(t) &&
          !PRIOR_KANA.includes(t) &&
          !EXTRA.has(t)
        )
          offenders.push(`${where}: ${t} in 「${ja}」`);
      }
    expect(scanned, "no surfaces scanned — jaSurfaces returned nothing").toBeGreaterThan(500);
    expect([...new Set(offenders)], [...new Set(offenders)].join("\n")).toEqual([]);
  });

  /**
   * THE MODULE'S HEADLINE STRUCTURAL CLAIM, and the reason it is worth a test
   * rather than a comment: 〜てあげる / 〜てくれる / 〜てもらう are the single most
   * natural thing to reach for while authoring this content, they are correct
   * Japanese, and they are five modules early. Nothing in the compiler would
   * object. The spine's sequencing bet — one axis per module — is enforced here
   * or nowhere.
   */
  it("ZERO て-FORMS, of any verb, anywhere in the module", () => {
    const TE_FORMS = new Set<string>();
    for (const a of [...IR.newAtoms, ...(IR.priorAtoms ?? [])])
      if (a.derivedFrom && /[てで]$/.test(a.kana)) TE_FORMS.add(a.kana);
    for (const [kana, atom] of JA_COURSE_ATOMS_BY_KANA)
      if (/[てで]$/.test(kana) && atom.pos === "verb") TE_FORMS.add(kana);
    // NON-VACUITY: an empty inventory would make this pass for the wrong
    // reason. m8 alone registered fourteen て-forms and m30 added sixteen more.
    expect(TE_FORMS.size, "the て-form inventory failed to build").toBeGreaterThan(20);

    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces)
      for (const t of tok(ja)) {
        scanned++;
        if (TE_FORMS.has(t)) offenders.push(`${where}: ${t} in 「${ja}」`);
      }
    expect(scanned, "nothing scanned").toBeGreaterThan(500);
    expect(
      [...new Set(offenders)],
      "the spine bans て-forms in n4-02 — 〜てあげる / 〜てくれる / 〜てもらう are n4-06:\n" +
        [...new Set(offenders)].join("\n"),
    ).toEqual([]);
  });

  /**
   * うち / そと, made positional. The token immediately in FRONT of に is the
   * marked participant; asking "does the sentence contain わたし" instead would
   * flag every あげる sentence with a first-person giver, which is the correct
   * half of the module.
   */
  const AGERU = new Set(["あげる", "あげた", "あげない", "あげたい"]);
  const KURERU = new Set(["くれる", "くれた", "くれない", "くださる", "くださった"]);
  const MORAU = new Set(["もらう", "もらった", "もらわない", "もらいたい", "いただく", "いただいた"]);
  const SPEAKER = new Set(["わたし", "ぼく"]);
  /** The speaker's circle. Honorific family terms are HERE, not outside it:
   *  they denote the same referents as あに / はは under a different register,
   *  and treating them as outsiders produces one person giving to himself. */
  const INSIDE = new Set([
    "わたし", "ぼく", "ちち", "はは", "あに", "あね", "いもうと", "おとうと", "かぞく",
    "おにいさん", "おねえさん", "おかあさん", "おとうさん", "きょうだい",
  ]);
  /** Tokens immediately in front of a に, per sentence. */
  const niMarked = (ja: string): string[] => {
    const ts = tok(ja);
    const out: string[] = [];
    for (let i = 1; i < ts.length; i++) if (ts[i] === "に" && ts[i - 1]) out.push(ts[i - 1]);
    return out;
  };
  const verbsOf = (ja: string, set: Set<string>) => tok(ja).some((t) => set.has(t));

  it("×わたしにあげる NEVER APPEARS — the spine's named antiPattern is unexpressible", () => {
    const offenders: string[] = [];
    let ageruSentences = 0;
    for (const { where, ja } of sentences) {
      if (!verbsOf(ja, AGERU)) continue;
      ageruSentences++;
      for (const n of niMarked(ja))
        if (SPEAKER.has(n)) offenders.push(`${where}: 「${ja}」 — ${n}に with あげる`);
    }
    expect(ageruSentences, "no あげる sentences found — the scan read the wrong field").toBeGreaterThan(
      20,
    );
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("くれる always lands INSIDE the circle, and もらう never sources from the speaker", () => {
    const offenders: string[] = [];
    let kureru = 0;
    let morau = 0;
    for (const { where, ja } of sentences) {
      if (verbsOf(ja, KURERU)) {
        kureru++;
        for (const n of niMarked(ja)) {
          // Skip time/date に (「たんじょうびに」) — only PEOPLE are on the axis.
          if (!INSIDE.has(n) && isPerson(n))
            offenders.push(`${where}: 「${ja}」 — くれる delivering to ${n} (outside)`);
        }
      }
      if (verbsOf(ja, MORAU)) {
        morau++;
        for (const n of niMarked(ja))
          if (SPEAKER.has(n)) offenders.push(`${where}: 「${ja}」 — もらう sourcing from ${n}`);
      }
    }
    expect(kureru, "no くれる sentences found").toBeGreaterThan(15);
    expect(morau, "no もらう sentences found").toBeGreaterThan(15);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no sentence transfers a thing from somebody to themselves", () => {
    // 「あには おにいさんに きっぷを あげる」 is grammatical, tiles cleanly and is
    // one person giving to himself, because あに and おにいさん denote the same
    // referent under two registers. うち / そと is about the REFERENT, and the
    // registry does not make that distinction — so it is made here.
    const SAME: Record<string, string> = {
      あに: "brother-older", おにいさん: "brother-older",
      あね: "sister-older", おねえさん: "sister-older",
      はは: "mother", おかあさん: "mother",
      ちち: "father", おとうさん: "father",
    };
    const offenders: string[] = [];
    for (const { where, ja } of sentences) {
      const people = tok(ja).filter((t) => SAME[t]);
      const refs = people.map((p) => SAME[p]);
      if (new Set(refs).size !== refs.length)
        offenders.push(`${where}: 「${ja}」 — ${people.join(" / ")} are the same person`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("くださる / いただく are RECOGNITION only — never produced, never in a pool", () => {
    // m30's 〜とく fence, applied to the honorific tier. Production lands at
    // n4-21; a reviewPool entry would make one a production target, because the
    // filler generator draws from the pool (m23/m24's bound-ender finding).
    const HON = ["くださる", "くださった", "いただく", "いただいた"];
    const PRODUCTION = new Set(["build_sentence", "listening_build", "translate", "speaking"]);
    const offenders: string[] = [];
    let seen = 0;
    for (const { where, ja, type } of surfaces) {
      const hits = tok(ja).filter((t) => HON.includes(t));
      if (!hits.length) continue;
      seen++;
      if (PRODUCTION.has(type))
        offenders.push(`${where}: ${hits.join("/")} is a ${type} target in 「${ja}」`);
    }
    expect(seen, "the honorific pair never appears at all — recognition needs exposure").toBeGreaterThan(
      3,
    );
    for (const lesson of IR.lessons)
      for (const w of lesson.reviewPool ?? [])
        if (HON.includes(w)) offenders.push(`${lesson.id}: ${w} is in a reviewPool`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no POLITE form of the three verbs is registered or shipped", () => {
    // `register: plain`, like m30. あげます / くれます / もらいます exist nowhere,
    // so any polite surface would fragment loudly rather than ship quietly —
    // asserted at the declaration so the fence is visible where it is decided.
    const banned = /^(あげ|くれ|もらい|くださ|いただき)ます/;
    for (const a of IR.newAtoms)
      expect(banned.test(a.kana), `${a.kana} is a polite form and this module is plain`).toBe(false);
  });

  it("no cloze frame names a character or ends on a bare だ", () => {
    // A frame containing a name lands in the grammar deck's GATE_EXEMPTIONS
    // (m22's finding); a frame ending on だ reads as an assertion the learner
    // did not make (m21's finding).
    const clozes = steps.filter(([, s]) => s.type === "particle_cloze");
    expect(clozes.length, "no cloze steps found").toBeGreaterThan(8);
    for (const [lessonId, step] of clozes) {
      const rec = step as unknown as {
        id: string;
        prompt?: { before?: string; after?: string };
      };
      const frame = `${rec.prompt?.before ?? ""}${rec.prompt?.after ?? ""}`;
      for (const n of NAMES)
        expect(frame.includes(n), `${lessonId}/${rec.id} names ${n}`).toBe(false);
      expect(
        /だ[。？!]?\s*$/.test((rec.prompt?.after ?? "").trim()),
        `${lessonId}/${rec.id} ends on a bare だ`,
      ).toBe(false);
    }
  });

  it("every cloze option is a taught atom or one of this module's own (inv 40)", () => {
    const known = new Set([...JA_COURSE_ATOMS_BY_KANA.keys(), ...NEW_KANA, ...PRIOR_KANA]);
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const opts = (step as unknown as { options?: string[] }).options ?? [];
      for (const o of opts) {
        checked++;
        for (const t of tok(o)) if (!known.has(t)) offenders.push(`${lessonId}: ${o} → ${t}`);
      }
    }
    expect(checked, "no cloze options found").toBeGreaterThan(20);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  function isPerson(kana: string): boolean {
    if (INSIDE.has(kana)) return true;
    const a = JA_COURSE_ATOMS_BY_KANA.get(kana);
    if (!a) return false;
    return /person|people|teacher|doctor|student|friend|child|American|Japanese/i.test(a.meaningEn);
  }
});

describe("m31-neo kanji drip", () => {
  const kanjiSteps = M31_NEO_LESSONS.flatMap((l) =>
    l.steps.filter((s) => s.type === "kanji_reading").map((s) => [l.id, s] as const),
  );

  it("drips four reading checks across four different lessons", () => {
    expect(kanjiSteps).toHaveLength(4);
    expect(new Set(kanjiSteps.map(([l]) => l)).size, "a kanji lesson formed").toBe(4);
  });

  it("every glyph READS BARE at m31 — past unlock + the furigana window", () => {
    // A kanji step is a cold recognition check, never a first sighting: the
    // word must have unlocked at m31 - FURIGANA_WINDOW or earlier, or the
    // learner is still being shown its furigana elsewhere in the same module.
    expect(KANJI_ELIGIBLE_ATOMS.size, "the rollout catalog failed to load").toBeGreaterThan(50);
    for (const [lessonId, step] of kanjiSteps) {
      const rec = step as unknown as {
        id: string;
        kanji: string;
        promptAnnotation?: { atomId?: string }[];
      };
      const atomId = rec.promptAnnotation?.[0]?.atomId;
      expect(atomId, `${lessonId}/${rec.id} has no atomId`).toBeTruthy();
      const entry = KANJI_ELIGIBLE_ATOMS.get(atomId!);
      expect(entry, `${lessonId}/${rec.id}: ${atomId} is not kanji-eligible`).toBeDefined();
      expect(
        entry!.unlockModule + FURIGANA_WINDOW,
        `${lessonId}/${rec.id}: ${rec.kanji} still inside its furigana window at m31`,
      ).toBeLessThanOrEqual(31);
    }
  });

  it("re-tests no word from kanji-set-1/2/3 or m30's own drip", () => {
    // A fifth drip that re-tested earlier glyphs would measure nothing.
    const SPENT = new Set([
      "わかる", "やま", "みず", "まいにち", "なまえ", "はなす", "ひと", "でんわ", "てんき",
      "ちいさい", "たべる", "たかい", "じかん", "した", "くる", "きく", "がっこう", "がいこく",
      "かわ", "かいしゃ", "うみ", "うえ", "いく", "あたらしい", "あし", "せんせい",
      // m30's four
      "じしょ", "でんき", "しゃしん", "じてんしゃ",
    ]);
    for (const [lessonId, step] of kanjiSteps) {
      const rec = step as unknown as { id: string; reading: string };
      expect(
        SPENT.has(rec.reading),
        `${lessonId}/${rec.id}: ${rec.reading} was already tested`,
      ).toBe(false);
    }
  });

  it("teaches a word this module does NOT introduce — reading, never vocabulary", () => {
    const declared = new Set(
      (m31Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    );
    for (const [lessonId, step] of kanjiSteps) {
      const rec = step as unknown as { id: string; reading: string };
      expect(
        declared.has(rec.reading),
        `${lessonId}/${rec.id}: ${rec.reading} is new this module — a kanji step is not a first exposure`,
      ).toBe(false);
    }
  });
});
