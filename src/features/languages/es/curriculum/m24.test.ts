/**
 * ES M24 curriculum guard — «Estaba, hacía, quería», imperfect wave 2
 * (estar/hacer/querer/poder/venir). Sonnet-drafted lessons, Fable spine +
 * pins (2026-09-10). Shared lints at ZERO debt + shared doctrine pins +
 * module-bespoke lanes below. Pin E12: every imperfect cell produced here
 * must come from conjugationTables.ts; the accent rule is per-family (estar:
 * nosotros only; hacer/querer/poder/venir: every form). Unlike m23 (zero new
 * verb atoms), m24 registers all 20 new atoms as verb-table cells.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M24_ATOMS, ES_M24_LESSONS, ES_M24_PLACEMENT, ES_M24_CHECKPOINT_INDEX } from "./m24";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";
import { ES_VERB_ENTRIES } from "../conjugationTables";

registerEsModuleContentLints({
  moduleId: "m24",
  lessons: ES_M24_LESSONS,
  atoms: ES_M24_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m24",
  lessons: ES_M24_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m24")),
});

registerEsDoctrinePins({
  moduleId: "m24",
  lessons: ES_M24_LESSONS,
  checkpointIndex: ES_M24_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m24", ES_M24_LESSONS, ES_M24_ATOMS);

const getLesson = (n: number) => ES_M24_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Learner-facing Spanish carried as a step's own sentence — ANSWER positions only. */
function allSurfaces(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of nums) {
    for (const s of getLesson(n)) {
      const rec = s as unknown as Record<string, unknown>;
      for (const k of ["audioText", "targetPhrase", "targetSentence", "transcript"]) {
        const v = rec[k];
        if (typeof v === "string") out.push({ id: s.id, text: v });
      }
      if (s.type === "dialogue_sim") {
        for (const t of s.turns) {
          const r = t.reply;
          out.push({ id: `${s.id}/${t.id}`, text: r.mode === "build" ? r.answer : r.options.find((o) => o.id === r.correctOptionId)?.text ?? "" });
        }
      }
    }
  }
  return out;
}

/** Same as allSurfaces, but also includes dialogue_sim NPC lines (questions), for scans that ban a form ANYWHERE, not just in graded answer positions. */
function allSurfacesAndNpc(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out = allSurfaces(nums);
  for (const n of nums) {
    for (const s of getLesson(n)) {
      if (s.type === "dialogue_sim") {
        for (const t of s.turns) out.push({ id: `${s.id}/${t.id}/npc`, text: t.npc.kana });
      }
    }
  }
  return out;
}

const lessonBlob = (n: number) => JSON.stringify(getLesson(n));
/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 20 imperfect verb forms this module registers. */
const ALL_ATOMS = ES_M24_ATOMS.map((a) => a.surface);

/** estar family — accent ONLY on nosotros. */
const ESTAR_NOSOTROS_ONLY_ACCENT = ["estábamos"];
const ESTAR_NO_ACCENT_FORMS = ["estaba", "estabas", "estaban"];
/** hacer/querer/poder/venir families — EVERY form is accented. */
const EVERY_ACCENTED = [
  "hacía", "hacías", "hacíamos", "hacían",
  "quería", "querías", "queríamos", "querían",
  "podía", "podías", "podíamos", "podían",
  "venía", "venías", "veníamos", "venían",
];

/** No progressive anywhere (out of scope for this module). */
const PROGRESSIVE_RE = /\b(estoy|está|estaba|estábamos|estabas|estaban|estamos|están|estuve|estuvo)\s+(?!cuando\b)\w+(?:ando|iendo)\b/;

/** Unregistered preterite forms — querer/poder never shipped a preterite anywhere in m1-m23 (only the imperfect is being taught for these two verbs). Must never appear in a graded answer position. */
const UNREGISTERED_PRETERITE = ["quise", "quisiste", "quiso", "quisimos", "quisieron", "pude", "pudiste", "pudo", "pudimos", "pudieron"];

/** Present-tense cells NEVER confirmed PRIOR anywhere in m1-m23 for these five verbs — must never appear ANYWHERE in m24 (not even as a foil/distractor in a graded field). */
const ILLEGAL_PRESENT_FORMS = ["estoy", "hacemos", "hacen", "queremos", "quieren", "podemos", "pueden", "vienes", "venimos", "vienen"];
/** Present-tense cells confirmed PRIOR (grepped against m1-m23) — the only sanctioned present/imperfect contrast, confined to L9. */
const PRIOR_PRESENT_LEGAL = ["está", "estamos", "están", "hago", "haces", "hace", "quiero", "quieres", "quiere", "puedo", "puedes", "puede", "vengo", "viene"];

const WE_FORMS = ["estábamos", "hacíamos", "queríamos", "podíamos", "veníamos"];
const THE_FORMS = ["estaban", "hacían", "querían", "podían", "venían"];

describe("ES m24 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M24_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M24_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M24_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("PIN E12: every one of the 20 new atoms is a cell of ES_VERB_ENTRIES, and the accent rule holds per family (estar: nosotros only; hacer/querer/poder/venir: every form)", () => {
    const cells = new Set<string>();
    for (const v of ES_VERB_ENTRIES) for (const [k, f] of Object.entries(v.forms)) if (k.startsWith("imperfect.")) cells.add(f);
    expect(ALL_ATOMS.length, "no verb atoms found — the pin would be vacuous").toBe(20);
    const invented = ALL_ATOMS.filter((s) => !cells.has(s));
    expect(invented, `imperfect atoms that are not table cells: ${invented.join(", ")}`).toEqual([]);

    const missingAccent = ESTAR_NOSOTROS_ONLY_ACCENT.filter((s) => !/[áéíóú]/.test(s));
    expect(missingAccent, `estar nosotros form missing its required accent: ${missingAccent.join(", ")}`).toEqual([]);
    const wrongAccent = ESTAR_NO_ACCENT_FORMS.filter((s) => /[áéíóú]/.test(s));
    expect(wrongAccent, `estar non-nosotros form wrongly accented: ${wrongAccent.join(", ")}`).toEqual([]);
    const missingEveryAccent = EVERY_ACCENTED.filter((s) => !/[áéíóú]/.test(s));
    expect(missingEveryAccent, `hacer/querer/poder/venir form missing its required accent: ${missingEveryAccent.join(", ")}`).toEqual([]);
  });

  it("the yo=él collision — every one of the five 'first slot' atoms (estaba, hacía, quería, podía, venía) is explicitly drilled: each has ≥1 agreement_cloze step whose segments contrast «yo» against «él» (or «yo no» against «él»/«él no»), with BOTH blanks answered by that same atom", () => {
    const FIRST_SLOT = ["estaba", "hacía", "quería", "podía", "venía"];
    const bad: string[] = [];
    for (const w of FIRST_SLOT) {
      let hit = false;
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type !== "agreement_cloze") continue;
          const segs = s.segments;
          const text = segs.map((seg) => ("text" in seg ? seg.text : seg.blank.correctAnswer)).join("").toLowerCase();
          const blanks = segs.filter((seg) => "blank" in seg).map((seg) => (seg as { blank: { correctAnswer: string } }).blank.correctAnswer);
          const hasYo = word("yo").test(text);
          const hasEl = word("él").test(text);
          const bothAnswerW = blanks.length >= 2 && blanks.every((a) => a === w);
          if (hasYo && hasEl && bothAnswerW) { hit = true; break; }
        }
        if (hit) break;
      }
      if (!hit) bad.push(`«${w}»: no agreement_cloze step contrasts yo/él with both blanks answering «${w}»`);
    }
    expect(bad, `first-slot atom missing its yo=él collision drill:\n${bad.join("\n")}`).toEqual([]);
  });

  it("«todos» takes 3rd-person-plural agreement only — never pairs with a nosotros form (checked per-clause)", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase().replace(/\btodos los días\b/g, "cada día");
      if (!word("todos").test(t)) continue;
      const todosClause = t.split(/,|\by\b|\bpero\b/).find((c) => word("todos").test(c));
      if (todosClause === undefined) continue;
      const hasWe = anyWord(WE_FORMS).test(todosClause);
      const hasThey = anyWord(THE_FORMS).test(todosClause);
      if (hasWe) bad.push(`${id}: «${text}» — «todos» paired with a nosotros form in its own clause`);
      if (!hasThey && !hasWe) bad.push(`${id}: «${text}» — «todos» with no agreeing verb found in its own clause`);
    }
    expect(bad, `«todos» agreement violation:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: no present-tense form outside the confirmed-PRIOR list ever appears ANYWHERE in m24 (answer positions + sim NPC lines) — estoy/hacemos/hacen/queremos/quieren/podemos/pueden/vienes/venimos/vienen were never confirmed as PRIOR anywhere in m1-m23 for these five verbs, so they are never produced, not even as a foil in a graded field", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      for (const { id, text } of allSurfacesAndNpc([n])) {
        const m = text.toLowerCase().match(anyWord(ILLEGAL_PRESENT_FORMS));
        if (m) bad.push(`${id}: «${m[2]}»`);
      }
    }
    expect(bad, `never-confirmed-PRIOR present-tense form produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: the confirmed-PRIOR present-tense forms (está/estamos/están, hago/haces/hace, quiero/quieres/quiere, puedo/puedes/puede, vengo/viene) are produced ONLY in L9's sanctioned hoy-vs-de-niño contrast — a '-sp-recall-' step verbatim-reprinting an earlier lesson's own win line is exempt", () => {
    const outsideL9 = LESSONS.filter((n) => n !== 9).filter((n) =>
      allSurfacesAndNpc([n]).some(({ id, text }) => !id.includes("-sp-recall-") && anyWord(PRIOR_PRESENT_LEGAL).test(text.toLowerCase())),
    );
    expect(outsideL9, `PRIOR present forms produced outside L9: L${outsideL9.join(", L")}`).toEqual([]);
    expect(allSurfacesAndNpc([9]).some(({ text }) => anyWord(PRIOR_PRESENT_LEGAL).test(text.toLowerCase())), "L9 must contrast present tense against the imperfect").toBe(true);
  });

  it("PIN: no progressive anywhere (out of scope for this module)", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n).toLowerCase();
      const m = blob.match(PROGRESSIVE_RE);
      if (m) bad.push(`L${n}: «${m[0].trim()}»`);
    }
    expect(bad, `progressive form printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: querer/poder never carry a preterite form (quise/quiso/pude/pudo/...) in a graded answer position — unregistered anywhere in m1-m23, this module teaches only their imperfect", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const m = text.toLowerCase().match(anyWord(UNREGISTERED_PRETERITE));
      if (m) bad.push(`${id}: «${m[2]}»`);
    }
    expect(bad, `unregistered querer/poder preterite form produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("every one of the 20 new atoms debuts on an intro-capable step (word_map does not count; scanned via esSurfaces, same billed-content rule as the shared vocab-provenance gate), and every debut lands in L1-L5 (the five debut lessons) — L6/L7/L9/L10 introduce zero new atoms", () => {
    const bad: string[] = [];
    for (const w of ALL_ATOMS) {
      const re = word(w);
      let found: { lesson: number; type: string } | null = null;
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type === "word_map") continue; // unbilled preview
          if (esSurfaces(s).some((surf) => re.test(surf.toLowerCase()))) { found = { lesson: n, type: s.type }; break; }
        }
        if (found) break;
      }
      expect(found, `«${w}» never appears`).not.toBeNull();
      expect(ES_INTRO_TYPES.has(found!.type), `«${w}» first appears on ${found!.type} (L${found!.lesson}), not an intro-capable step`).toBe(true);
      if (found!.lesson > 5) bad.push(`«${w}» first debuts at L${found!.lesson}, outside the L1-L5 debut window`);
    }
    expect(bad, `atom debuting outside L1-L5:\n${bad.join("\n")}`).toEqual([]);
  });

  it("each new atom is PRODUCED at least 3 times (answer positions), spread over ≥2 lessons", () => {
    const short: string[] = [];
    for (const w of ALL_ATOMS) {
      const re = word(w);
      const hits = LESSONS.map((n) => allSurfaces([n]).filter((s) => re.test(s.text.toLowerCase())).length);
      const total = hits.reduce((a, b) => a + b, 0);
      const spread = hits.filter((h) => h > 0).length;
      if (total < 3 || spread < 2) short.push(`«${w}» ${total}× over ${spread} lesson(s)`);
    }
    expect(short, `under-produced atoms:\n${short.join("\n")}`).toEqual([]);
  });

  it("recall floor: ≥1 recall in L4/L5/L6/L7/L9, ≥2 in L8/L10; L1/L2/L3 carry none (nothing earlier to recall)", () => {
    const recallCount = (n: number) => getLesson(n).filter((s) => (s as unknown as Record<string, unknown>).cue === "recall").length;
    for (const n of [4, 5, 6, 7, 9]) {
      expect(recallCount(n), `L${n} must carry ≥1 recall`).toBeGreaterThanOrEqual(1);
    }
    for (const n of [8, 10]) {
      expect(recallCount(n), `L${n} must carry ≥2 recalls`).toBeGreaterThanOrEqual(2);
    }
    for (const n of [1, 2, 3]) {
      expect(recallCount(n), `L${n} must carry zero recalls — nothing earlier in this module to recall`).toBe(0);
    }
  });

  it("the mastery lesson (L10) ends on a sim, not a grid (§13.9 law 7)", () => {
    const steps = getLesson(10);
    expect(steps[steps.length - 1].type, "L10's last step must be dialogue_sim").toBe("dialogue_sim");
  });

  it("the checkpoint lesson (L8) carries zero info cards; the mastery lesson (L10) carries zero info cards", () => {
    for (const n of [8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
    }
  });

  it("no cloze blank ever sits inside a question", () => {
    const bad: string[] = [];
    const balanced = (before: string) => (before.match(/¿/g) ?? []).length === (before.match(/\?/g) ?? []).length;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        if (s.type === "particle_cloze") {
          const prompt = rec.prompt as { before: string; after: string };
          expect(typeof prompt?.before, `${s.id}: particle_cloze prompt shape changed — pin would be vacuous`).toBe("string");
          if (!balanced(prompt.before) || /\?/.test(prompt.after)) bad.push(s.id);
        } else if (s.type === "agreement_cloze") {
          let acc = "";
          for (const seg of s.segments) {
            if ("blank" in seg) { if (!balanced(acc)) bad.push(`${s.id}/${seg.blank.id}`); acc += "_"; }
            else acc += seg.text;
          }
        }
      }
    }
    expect(bad, `blank inside a question: ${bad.join(", ")}`).toEqual([]);
  });

  it("the module's signature payoff («quería... pero no podía») is cashed by L4 and recalled at the checkpoint (L8)", () => {
    const l4 = lessonBlob(4).toLowerCase();
    expect(/quería.*pero.*no podía|no podía.*pero.*quería|quería.*podía/.test(l4), "L4 must cash «quería, pero no podía»").toBe(true);
    const l8 = lessonBlob(8).toLowerCase();
    expect(/quería.*tenía.*podía|tenía.*quería.*podía/.test(l8) || (l8.includes("quería") && l8.includes("podía") && l8.includes("tenía")), "L8 must recombine quería/tenía/podía").toBe(true);
  });
});
