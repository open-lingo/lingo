/**
 * m33-neo module guards — spine unit n4-04, "Transitivity I: 自動詞/他動詞 —
 * が vs を". Module shape per invariant 25, at the wide end of it: 14 lessons =
 * 10 teaching + 3 review + 1 challenge, reviews at 4/8/12, challenge LAST. Like
 * m12–m32 it splices NOTHING in at module level, so the compiled lessons ARE
 * the shipped lessons and the guards run over the whole module.
 *
 * Four things make this file different from m32's, and each has its own
 * describe block:
 *
 *   1. **EVERY PAIR VERB TAKES ITS OWN PARTICLE, IN EVERY AUTHORED SURFACE.**
 *      This is the module's entire content, so a single 「ドアを あく」 in the
 *      shipped text would teach the exact error the module exists to prevent.
 *      The check walks all nine pairs across every compiled Japanese surface:
 *      no 自動詞 may sit directly after を, and no 他動詞 directly after が.
 *      Distractor options are scanned separately — a wrong answer the learner
 *      is asked to REJECT is fine in an options list and nowhere else.
 *      でる is exempted from the を-check and the reason is real Japanese:
 *      「きょうしつを でる」 is correct — を marks the space departed, not an
 *      object — and the module uses it deliberately.
 *   2. **つく / つける APPEAR NOWHERE.** The spine's `must` list names the pair
 *      and m32 recorded why it cannot ship here: the course teaches つく as 着く
 *      ("to arrive", m23), 点く is a different verb in the same kana, and a
 *      homograph split inside the tier's highest-attrition module is carrying
 *      two axes at once. The deferral is a decision, so it is a test.
 *   3. **NO PAST, NEGATIVE OR たら FORM OF A MODULE-NEW VERB.** Carried from
 *      m32's tokenizer-hazard list: an unregistered inflection of a brand-new
 *      verb does not tokenize, and しまった collides with てしまう besides. Older
 *      verbs conjugate freely; this module's own thirteen do not.
 *   4. **TWO INVENTED IDS, AND ONLY TWO.** N4 still has no grammar-point
 *      registry, so `jidoushi-tadoushi` and `te-iru-resultative` are IR-local
 *      by necessity; every other card is a shipped N5 point. `te-iru-resultative`
 *      is deliberately NOT named `te-iru` — that is a shipped N5 point (m14),
 *      and one id for both would tell the learner the progressive and the
 *      resultative are the same rule.
 */
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import N5_GRAMMAR_POINTS from "@/features/lesson/data/n5-grammar-points.json";
import m32Ir from "../ir/m32.ir.json";
import m33Ir from "../ir/m33.ir.json";
import { M31_NEO_LESSONS } from "../m31-neo";
import { M33_NEO_LESSONS } from "../m33-neo";
import { M32_NEO_LESSONS } from "../m32-neo";
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

registerJaModuleContentLints("m33");

registerModuleBarGuards({
  moduleLabel: "m33-neo",
  lessons: M33_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32"],
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
    ...M31_NEO_LESSONS,
    ...M32_NEO_LESSONS,
  ],
  // Same reason m28-m32 needed this: this module's own te-forms (あいて,
  // しまって, けして …) and m11-m32's IR-only forms exist in neither
  // `courseAtoms` nor the conjugation engine's real-form lexicon, so without
  // them the bar guards' tokenizer cannot see the module's headline vocabulary
  // at all. Declaring them makes them TOKENS, which is what subjects them to
  // the debut check — the opposite of a loosening.
  extraVocab: [
    ...(m33Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m33Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m32Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
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

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; text: string }[] {
  const out: { lessonId: string; text: string }[] = [];
  for (const lesson of M33_NEO_LESSONS) {
    const content = getMockLessonContent(lesson.id) ?? lesson;
    for (const step of content.steps) {
      for (const s of jaSurfaces(step)) out.push({ lessonId: lesson.id, text: s });
    }
  }
  return out;
}

/** Options lists only — where a deliberately-wrong shape is allowed to live. */
function distractorStrings(): string[] {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return void v.forEach(walk);
    if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if ((k === "options" || k === "distractors") && Array.isArray(val)) {
          for (const o of val) if (typeof o === "string") out.push(o);
        } else walk(val);
      }
    }
  };
  walk(m33Ir);
  return out;
}

/** The module's own antiPatterns ARE broken Japanese — a card that teaches
 *  ×「ドアを あく」 has to print it. Everything else must be clean. */
const ANTI = new Set(
  (m33Ir as unknown as { grammarPoints: { antiPattern?: { ja: string } }[] }).grammarPoints
    .map((g) => g.antiPattern?.ja?.replace(/[。\s]/g, ""))
    .filter((x): x is string => Boolean(x)),
);

describe("m33-neo module shape (invariant 25)", () => {
  it("ships 14 lessons: 10 teaching + 3 review + 1 challenge", () => {
    expect(M33_NEO_LESSONS).toHaveLength(14);
    expect(M33_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M33_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M33_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 12", () => {
    const at = M33_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(Boolean);
    expect(at).toEqual([4, 8, 12]);
  });
});

describe("every pair verb takes its own particle", () => {
  // 自動詞 — never directly after を. でる is exempt: 「きょうしつを でる」 is
  // correct Japanese (を marks the space departed, not an object) and the
  // module uses it on purpose.
  const INTRANSITIVE = ["あく", "しまる", "はいる", "とまる", "きまる", "きえる", "はじまる", "おちる"];
  // 他動詞 — never directly after が.
  const TRANSITIVE = ["あける", "しめる", "いれる", "とめる", "きめる", "けす", "はじめる", "だす", "おとす"];

  it("no 自動詞 sits directly after を in a presented sentence", () => {
    const offenders: string[] = [];
    for (const { lessonId, text } of presentedSurfaces()) {
      if (ANTI.has(text.replace(/[。\s]/g, ""))) continue;
      for (const v of INTRANSITIVE) {
        if (new RegExp(`を\\s*${v}`).test(text)) offenders.push(`${lessonId}: ${text} (を${v})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  // が directly before a 他動詞 is only an error when が marks the THING being
  // acted on. When it marks the DOER it is correct and ordinary — 「だれが
  // きめる？」, 「たなかさんが きめる」 — and the object is simply elided. So the
  // check exempts an animate が-noun, which is what the doer slot holds.
  const ANIMATE = ["だれ", "ミカ", "トム", "ケン", "たなかさん", "せんせい", "ともだち", "こども", "がくせい", "わたし"];

  it("no 他動詞 sits directly after が marking a THING", () => {
    const offenders: string[] = [];
    for (const { lessonId, text } of presentedSurfaces()) {
      if (ANTI.has(text.replace(/[。\s]/g, ""))) continue;
      for (const v of TRANSITIVE) {
        for (const m of text.matchAll(new RegExp(`([^\\s。、]*)が\\s*${v}`, "g"))) {
          if (ANIMATE.includes(m[1])) continue;
          offenders.push(`${lessonId}: ${text} (${m[1]}が${v})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the animate exemption is real — the module actually ships doer-が sentences", () => {
    const doer = presentedSurfaces().filter(({ text }) =>
      ANIMATE.some((n) => TRANSITIVE.some((v) => text.includes(`${n}が`) && text.includes(v))),
    );
    expect(doer.length).toBeGreaterThan(5);
  });

  it("scans a non-vacuous number of pair-verb surfaces", () => {
    const all = [...INTRANSITIVE, ...TRANSITIVE];
    const hits = presentedSurfaces().filter((s) => all.some((v) => s.text.includes(v)));
    expect(hits.length).toBeGreaterThan(60);
  });

  // The clozes blank the VERB, not the particle, and that is a placement fact
  // as well as a pedagogic one. `particleClozePlacement.test.ts` holds that a
  // true-particle cloze (every option a particle) is an INTRODUCTION device
  // and belongs within two modules of the particle's own introduction — が is
  // m4's and を is m7's, so a が/を cloze at m33 is exactly the late usage that
  // ratchet exists to stop, and the exemption list it keeps may only shrink.
  // Blanking the verb is the better drill anyway and it is the spine's own
  // framing of the diagnostic: "given a sentence, which verb?". The learner
  // reads the particle and retrieves a word, instead of tapping one of three
  // particles they have owned for twenty-six modules.
  it("every cloze blanks a VERB, and the pair partner is always on offer", () => {
    const clozes = (m33Ir as unknown as {
      lessons: { beats: { kind: string; answer?: string; options?: string[] }[] }[];
    }).lessons.flatMap((l) => l.beats.filter((b) => b.kind === "particle-cloze"));
    expect(clozes.length).toBeGreaterThan(30);

    const PARTICLES = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か"]);
    const PARTNER: Record<string, string> = {
      あく: "あける", あける: "あく", しまる: "しめる", しめる: "しまる",
      はいる: "いれる", いれる: "はいる", とまる: "とめる", とめる: "とまる",
      きまる: "きめる", きめる: "きまる", きえる: "けす", けす: "きえる",
      はじまる: "はじめる", はじめる: "はじまる", でる: "だす", だす: "でる",
      おちる: "おとす", おとす: "おちる",
      // て-form answers (the resultative lesson and the challenge's てください
      // cloze). Without these rows the partner lookup silently skipped them —
      // which is exactly how the challenge shipped its first draft without
      // とまって on offer. The guard below makes that impossible to repeat.
      あいて: "あけて", あけて: "あいて", きえて: "けして", けして: "きえて",
      しまって: "しめて", しめて: "しまって", とまって: "とめて", とめて: "とまって",
    };
    const bad: string[] = [];
    for (const c of clozes) {
      if ((c.options ?? []).some((o) => PARTICLES.has(o))) bad.push(`particle option: ${c.answer}`);
      const partner = PARTNER[c.answer ?? ""];
      if (!partner) {
        bad.push(`${c.answer}: no PARTNER row — a silently skipped answer is how the pair check gets bypassed`);
      } else if (!(c.options ?? []).includes(partner)) {
        bad.push(`${c.answer}: partner ${partner} not offered`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("つく / つける are deferred, and the deferral is not quietly undone", () => {
  it("no AUTHORED surface uses either verb", () => {
    // Scoped to the IR, not to the compiled steps, and that scoping is a
    // finding rather than a convenience: `matchPairsFloor` backfills short
    // match grids from `getAtomsUpToModule` with NO unlock or reachability
    // check, so つく (m23's 着く) turns up in m33's L5 and L10 grids as a
    // render-time fill the module never wrote. That is the review-queue item
    // about the floor's ja fill pool, not an authoring miss here, and a test
    // that conflated the two would send the next author chasing the wrong
    // file. What this asserts is the authoring decision: m33 never TEACHES
    // or USES つく/つける.
    // Scoped to the JAPANESE the module presents — lesson beats and rule-card
    // examples. The `rule` PROSE is excluded on purpose: the switches card
    // explains the deferral in English and has to name つく to do it, and
    // `priorVocab` / `priorAtoms` are compiler-written inventories of what
    // EARLIER modules taught, not this module's content.
    const ir = m33Ir as unknown as {
      lessons: { beats: unknown[] }[];
      grammarPoints: { examples?: { ja: string }[]; antiPattern?: { ja: string } }[];
    };
    const hits: string[] = [];
    const scan = (v: unknown): void => {
      if (typeof v === "string") {
        if (/つける|つく(?![えり])/.test(v)) hits.push(v);
        return;
      }
      if (Array.isArray(v)) return void v.forEach(scan);
      if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(scan);
    };
    ir.lessons.forEach((l) => scan(l.beats));
    ir.grammarPoints.forEach((g) => {
      scan(g.examples ?? []);
      scan(g.antiPattern ?? {});
    });
    expect(hits).toEqual([]);
  });
});

describe("no past, negative or たら form of a module-new verb", () => {
  const NEW_VERBS = ["あく", "しまる", "いれる", "とめる", "きまる", "きえる", "けす", "はじまる", "はじめる", "でる", "だす", "おちる", "おとす"];
  // The past/negative surfaces those verbs would produce if anybody conjugated
  // them. None is registered, so none tokenizes — which is why they are banned
  // rather than merely discouraged.
  const BANNED = [
    "あいた", "あかない", "あいたら",
    "しまった", "しまらない", "しまったら",
    "いれた", "いれない", "いれたら",
    "とめた", "とめない", "とめたら",
    "きまった", "きまらない", "きまったら",
    "きえた", "きえない", "きえたら",
    "けした", "けさない", "けしたら",
    "はじまった", "はじまらない", "はじまったら",
    "はじめた", "はじめない", "はじめたら",
    "でた", "でない", "でたら",
    "だした", "ださない", "だしたら",
    "おちた", "おちない", "おちたら",
    "おとした", "おとさない", "おとしたら",
  ];

  it("declares one banned form per new verb, so the list cannot silently shrink", () => {
    expect(NEW_VERBS).toHaveLength(13);
    expect(BANNED).toHaveLength(39);
  });

  it("none appears in a presented sentence or in an options list", () => {
    const offenders: string[] = [];
    for (const { lessonId, text } of presentedSurfaces()) {
      for (const b of BANNED) if (text.includes(b)) offenders.push(`${lessonId}: ${text} (${b})`);
    }
    for (const d of distractorStrings()) {
      for (const b of BANNED) if (d.includes(b)) offenders.push(`option: ${d} (${b})`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("two invented grammar-point ids, and only two", () => {
  const INVENTED = ["jidoushi-tadoushi", "te-iru-resultative"];

  it("every other card is a shipped N5 registry point", () => {
    const registry = new Set(
      (N5_GRAMMAR_POINTS as unknown as { id: string }[]).map((p) => p.id),
    );
    const used = new Set(
      (m33Ir as unknown as { grammarPoints: { id: string }[] }).grammarPoints.map((g) => g.id),
    );
    const unregistered = [...used].filter((id) => !registry.has(id));
    expect(unregistered.sort()).toEqual([...INVENTED].sort());
  });

  it("does not reuse m14's te-iru id for the resultative", () => {
    const used = (m33Ir as unknown as { grammarPoints: { id: string }[] }).grammarPoints.map((g) => g.id);
    expect(used).not.toContain("te-iru");
    expect(used).toContain("te-iru-resultative");
  });
});

describe("block C is re-cemented in m34 (Spencer 2026-08-19)", () => {
  // The instruction that shaped this module: "glance over the final 3 sets and
  // then re-cement them by using them in sentence examples for the next
  // module". m33 pays half of that; m34 owes the other half, and an obligation
  // that lives only in a comment is an obligation that gets dropped. This test
  // is deliberately VACUOUS until `ir/m34.ir.yaml` exists, and bites the moment
  // it does — the author of m34 finds out from the suite, not from archaeology.
  const GLANCE = ["はじまる", "はじめる", "でる", "だす", "おちる", "おとす"];
  const M34 = new URL("../ir/m34.ir.yaml", import.meta.url).pathname;

  it("names six glance verbs, one per block-C half", () => {
    expect(GLANCE).toHaveLength(6);
  });

  it("m34 uses every one of them, once m34 exists", () => {
    if (!existsSync(M34)) return; // m34 not authored yet — nothing to check
    const src = readFileSync(M34, "utf8");
    const missing = GLANCE.filter((v) => !src.includes(v));
    expect(
      missing,
      `m34 must re-cement m33's glance block in its sentence examples (Spencer 2026-08-19). Missing: ${missing.join(", ")}`,
    ).toEqual([]);
  });
});
