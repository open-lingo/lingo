/**
 * ES M18 curriculum guard — the irregular preterite.
 *
 * The same contract every ES module carries (pathway resolution, unique step
 * ids, passive-card follow-up spacing, no explanation on passive steps, answer
 * leaks, full atom-surface coverage, graded-only mastery test), plus the four
 * guards this module's payload earns.
 *
 * m18.ts is GENERATED from `ir/m18.ir.yaml`, so a typo is not the risk — the
 * risk is the generator drifting from the facts the module claims to teach.
 * Each guard below re-derives one of those claims from something other than
 * the generator:
 *
 *   1. **No written accent on a strong preterite.** m17 spent eight lessons
 *      establishing that yo and él are the accented cells; m18's whole first
 *      half is that this class does NOT take them. «tuvé» or «hizó» would be
 *      the single most damaging thing this module could ship, and both are one
 *      wrong ending table away.
 *   2. **The j-stem rule.** «dijeron», never «dijieron». The wrong form is
 *      exactly what a regular ending table produces, so this is what a
 *      morphology regression looks like from the outside.
 *   3. **The six spelling verbs are respelled in the yo cell ONLY.** That is
 *      the module's second thesis: they are regular. A generator that
 *      "helpfully" respelled other cells would be teaching the misconception
 *      the module exists to prevent.
 *   4. **Agreement with `ES_VERB_ENTRIES`,** for the verbs it carries — and an
 *      explicit pin on the ones it does not, so the gap ratchets shut instead
 *      of being quietly inherited.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M18_ATOMS, ES_M18_LESSONS } from "./m18";
import { ES_VERB_ENTRIES } from "../conjugationTables";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { ES_MODULE_ORDER } from "../grammarHelpers";

/** The verbs m18 teaches, split the way the module itself splits them. */
const STRONG = [
  "ir",
  "tener",
  "hacer",
  "estar",
  "ver",
  "dar",
  "decir",
  "venir",
  "poner",
  "querer",
  "traer",
];
const SPELLING = ["llegar", "buscar", "pagar", "empezar", "jugar", "almorzar"];

const hasAccent = (s: string) => /[áéíóú]/.test(s);

describe("ES M18 curriculum", () => {

  it("listening steps are sentence-level (m5+ ratchet)", () => {
    for (const lesson of ES_M18_LESSONS) {
      for (const step of lesson.steps) {
        if (step.type === "listening_build") {
          expect(
            step.correctOrder.length,
            `${step.id} listening_build has < 3 tiles`,
          ).toBeGreaterThanOrEqual(3);
        }
        if (step.type === "listening_comprehension") {
          expect(
            step.transcript?.includes(" "),
            `${step.id} listening_comprehension transcript is a bare word`,
          ).toBe(true);
        }
      }
    }
  });

  it("registers 33 atoms, all fromModule m18", () => {
    expect(ES_M18_ATOMS.length).toBe(33);
    expect(ES_M18_ATOMS.every((a) => a.fromModule === "m18")).toBe(true);
  });

  // ── guard 1 ───────────────────────────────────────────────────────────────
  it("no strong preterite carries a written accent", () => {
    // Every form of a strong preterite is stressed on the STEM, which the
    // ordinary Spanish accent rules already place correctly — so no tilde is
    // written anywhere in the paradigm. This is the exact opposite of m17,
    // where the yo and él cells are the accented ones, and it is the fact a
    // learner is most likely to over-generalise across.
    //
    // The regular -ar/-er/-ir yo and él cells («llegué», «llegó») ARE accented
    // and belong to the spelling half of the module, so the check is scoped to
    // surfaces that cannot be produced by any regular ending table: they end in
    // one of the strong endings and are not one of the six spelling verbs'.
    const STRONG_ENDINGS = ["e", "iste", "o", "imos", "ieron", "eron", "i", "io"];
    const spellingSurfaces = new Set(
      ES_M18_ATOMS.map((a) => a.surface).filter((s) =>
        SPELLING.some((lemma) => s.startsWith(lemma.slice(0, 4))),
      ),
    );
    const strongSurfaces = ES_M18_ATOMS.map((a) => a.surface).filter(
      (s) =>
        !spellingSurfaces.has(s) &&
        STRONG_ENDINGS.some((end) => s.endsWith(end)),
    );
    expect(
      strongSurfaces.length,
      "no atom looks like a strong preterite — the check is dead",
    ).toBeGreaterThanOrEqual(20);
    for (const surface of strongSurfaces) {
      expect(
        hasAccent(surface),
        `"${surface}" is a strong preterite and must carry NO written accent — ` +
          `m18's whole first half is that this class drops m17's tildes`,
      ).toBe(false);
    }
  });

  // ── guard 2 ───────────────────────────────────────────────────────────────
  it("j-stems take -eron, never -ieron", () => {
    // «dijieron» is precisely what the shared strong ending table produces if
    // the j rule is dropped, so its absence is the observable form of the rule
    // still being implemented. The MCQ distractor lists deliberately CONTAIN
    // the wrong form — that is the teaching — so this checks the registered
    // atoms and the steps' correct answers, never the whole corpus.
    const jStemUstedes = ES_M18_ATOMS.map((a) => a.surface).filter((s) =>
      /j[ei]/.test(s) && s.endsWith("ron"),
    );
    expect(
      jStemUstedes.sort(),
      "m18 must register the j-stem ustedes forms — they are the rule's payload",
    ).toEqual(["dijeron", "trajeron"]);
    for (const surface of ES_M18_ATOMS.map((a) => a.surface)) {
      expect(
        /j(?:ieron|iaron)$/.test(surface),
        `"${surface}" applies the full -ieron ending after a j; the i is dropped`,
      ).toBe(false);
    }
  });

  // ── guard 3 ───────────────────────────────────────────────────────────────
  it("the six spelling verbs are respelled in the yo cell only", () => {
    // The thesis of lesson 6: these verbs are REGULAR. Their yo cell is
    // respelled so the stem's consonant keeps its sound before -é, and every
    // other cell is spelled exactly like hablar's. A generator that carried the
    // respelling into another cell would teach the misconception the module
    // exists to prevent — and the wrong forms («llegué» → *«lleguaste») look
    // plausible enough to survive a read.
    const expected: Record<string, string> = {
      llegar: "llegué",
      buscar: "busqué",
      pagar: "pagué",
      empezar: "empecé",
      jugar: "jugué",
      almorzar: "almorcé",
    };
    const surfaces = new Set(ES_M18_ATOMS.map((a) => a.surface));
    for (const [lemma, yo] of Object.entries(expected)) {
      expect(surfaces.has(yo), `m18 must register "${yo}" (the yo cell of ${lemma})`).toBe(true);
    }
    // Nothing else in the module may carry the protective u / qu / c. Every
    // corpus occurrence of e.g. "llegu" must be the yo form itself.
    // Compared accent-blind, because `translateStep` ships a de-accented
    // variant of every answer on purpose (a learner on a US keyboard must not
    // be graded wrong for a missing á). Without stripping, that variant reads
    // as a rogue "llegue" and the guard fails on its own accessibility policy.
    const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const corpus = strip(ES_M18_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n"));
    const RESPELLED_STEMS = ["llegu", "busqu", "pagu", "empec", "jugu", "almorc"];
    for (const stem of RESPELLED_STEMS) {
      const found = [...corpus.matchAll(new RegExp(`${stem}[a-zñ]*`, "g"))].map((m) => m[0]);
      const legal = new Set(Object.values(expected).map(strip));
      for (const form of new Set(found)) {
        expect(
          legal.has(form),
          `"${form}" carries the yo-cell respelling into another cell — ` +
            `only ${[...legal].join(", ")} may be respelled`,
        ).toBe(true);
      }
    }
  });

  // ── guard 4 ───────────────────────────────────────────────────────────────
  it("agrees with ES_VERB_ENTRIES on every verb the shipped table carries", () => {
    // The generator derives forms from scripts/draft/morph-es.mjs; the app
    // ships ES_VERB_ENTRIES and drives the Conjugation Trainer from it.
    // Nothing enforces that those two agree, so the agreement is asserted here
    // on the forms that actually reached a learner.
    const tabled = new Map<string, Set<string>>();
    for (const entry of ES_VERB_ENTRIES) {
      const cells = new Set<string>();
      for (const [cell, form] of Object.entries(entry.forms)) {
        if (cell.startsWith("preterite.")) cells.add(form as string);
      }
      tabled.set(entry.lemma, cells);
    }
    const allTabledPreterites = new Set([...tabled.values()].flatMap((s) => [...s]));

    // ir and ser share one preterite, which is lesson 1's whole point — so a
    // form is "backed" if ANY tabled verb claims it.
    const backedLemmas = [...STRONG, ...SPELLING].filter((l) => tabled.has(l));
    expect(backedLemmas.length, "the shipped table backs none of m18's verbs").toBeGreaterThan(0);

    // Of m18's atoms, the ones whose lemma the table carries must match it.
    const checkable = ES_M18_ATOMS.map((a) => a.surface).filter((s) =>
      backedLemmas.some((l) => (tabled.get(l) ?? new Set()).has(s)) ||
      // a surface that LOOKS like a backed verb's paradigm but is absent from
      // it is exactly the drift this guard is for, so catch those too
      ["fu", "tuv", "hic", "hiz", "estuv", "quis"].some((stem) => s.startsWith(stem)),
    );
    expect(checkable.length, "nothing to check — the guard is dead").toBeGreaterThan(0);
    for (const surface of checkable) {
      expect(
        allTabledPreterites.has(surface),
        `"${surface}" is not a preterite cell of any verb in ES_VERB_ENTRIES — ` +
          `either the module invented it or the shipped table is wrong`,
      ).toBe(true);
    }
  });

  it("pins how many m18 verbs the shipped conjugation table does NOT back", () => {
    // ES_VERB_ENTRIES seeds ten A1 verbs; m18 teaches eighteen. The twelve
    // below are taught to learners while the app's own conjugation table has
    // never heard of them, so the Conjugation Trainer cannot drill them and
    // guard 4 above has no authority over their forms.
    //
    // This is a real gap, not a decision — filling it means authoring 18 cells
    // (including the Spain-only vosotros row) per verb, which is its own piece
    // of work. The count is pinned so it ratchets DOWN as verbs are added and
    // fails loudly if a later module teaches another unbacked verb, rather than
    // being inherited silently the way m17's missing atom registration was.
    const lemmas = new Set(ES_VERB_ENTRIES.map((e) => e.lemma));
    const unbacked = [...STRONG, ...SPELLING].filter((l) => !lemmas.has(l));
    expect(unbacked.sort()).toEqual(
      [
        "almorzar",
        "buscar",
        "dar",
        "decir",
        "empezar",
        "jugar",
        "llegar",
        "pagar",
        "poner",
        "traer",
        "venir",
        "ver",
      ].sort(),
    );
  });
});

// ── Shared per-module structure lints (subsume the old hand-copied
// boilerplate this file carried until 2026-08-19) ──────────────────────────
registerEsModuleContentLints({
  moduleId: "m18",
  lessons: ES_M18_LESSONS,
  atoms: ES_M18_ATOMS,
});

// ── ES authoring bar (Track B, 2026-08-19) ─────────────────────────────────
// m18 was IR-authored against es-quality but predates this bar file; any
// debt below is measured, pinned, and SHRINK-ONLY.
registerEsModuleBarGuards({
  moduleLabel: "m18",
  lessons: ES_M18_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m18")),
  debt: { unknownTokens: 46, nonIntroDebuts: 6, translateShare: 0.27 },
});
