/**
 * ES M22 curriculum guard — «Hablaba, era, iba», the imperfect. Sonnet-
 * drafted lessons, Fable spine + pins (2026-09-10). Shared lints at ZERO
 * debt + shared doctrine pins + module-bespoke lanes below. Pin E12: every
 * imperfect cell produced here must come from conjugationTables.ts, and the
 * accent rule is per-family (only nosotros for hablar/ser/ir; every form
 * for tener/ver).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M22_ATOMS, ES_M22_LESSONS, ES_M22_PLACEMENT, ES_M22_CHECKPOINT_INDEX } from "./m22";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";
import { ES_VERB_ENTRIES } from "../conjugationTables";

registerEsModuleContentLints({
  moduleId: "m22",
  lessons: ES_M22_LESSONS,
  atoms: ES_M22_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m22",
  lessons: ES_M22_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m22")),
});

registerEsDoctrinePins({
  moduleId: "m22",
  lessons: ES_M22_LESSONS,
  checkpointIndex: ES_M22_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m22", ES_M22_LESSONS, ES_M22_ATOMS);

const getLesson = (n: number) => ES_M22_LESSONS[n - 1].steps;
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
/** Full step JSON (distractors/tiles/options included) with metadata/narrative-prose keys stripped, so a "never appears anywhere" scan doesn't false-positive on step ids (all prefixed "es-m22-...") or intentional teaching prose that quotes a banned form as a named contrast (e.g. "unlike present «tengo» or preterite «tuve»" in an info body/revealNote). */
function contentBlob(n: number): string {
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
      const o: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (k === "id" || k === "body" || k === "revealNote" || k === "title") continue;
        o[k] = strip(val);
      }
      return o;
    }
    return v;
  };
  return JSON.stringify(strip(getLesson(n)));
}
/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 20 imperfect verb forms this module registers (single-word verb atoms). «de niño» is a phrase, checked separately. */
const IMPERFECT_ATOMS = ES_M22_ATOMS.filter((a) => a.partOfSpeech === "verb").map((a) => a.surface);
const ALL_ATOMS = ES_M22_ATOMS.map((a) => a.surface);

/** hablar/ser/ir families — accent ONLY on nosotros. */
const NOSOTROS_ONLY_ACCENT = ["hablábamos", "éramos", "íbamos"];
/** hablar/ser/ir families — the three unaccented persons that must carry NO accent. */
const NO_ACCENT_FORMS = ["hablaba", "hablabas", "hablaban", "era", "eras", "eran", "iba", "ibas", "iban"];
/** tener/ver families — EVERY form is accented. */
const EVERY_ACCENTED = ["tenía", "tenías", "teníamos", "tenían", "veía", "veías", "veíamos", "veían"];

/** All preterite forms (any tense/person, m19/m20/m21 fully PRIOR) — banned anywhere in m22, including distractors/sim NPC lines. */
const PRETERITE_FORMS = [
  "hablé", "hablaste", "habló", "hablamos", "hablasteis", "hablaron",
  "comí", "comiste", "comió", "comimos", "comisteis", "comieron",
  "viví", "viviste", "vivió", "vivimos", "vivisteis", "vivieron",
  "fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron",
  "estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron",
  "tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron",
  "vi", "viste", "vio", "vimos", "visteis", "vieron",
  "vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron",
  "hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron",
  "trabajé", "trabajaste", "trabajó", "trabajaron",
  "estudié", "estudiaste", "estudió", "estudiaron",
  "compré", "compraste", "compró", "compraron",
  "escribí", "escribiste", "escribió", "escribieron",
  "salí", "saliste", "salió", "salieron",
  "cociné", "cocinaste", "cocinó",
];
/** No progressive anywhere (out of scope for this module). */
const PROGRESSIVE_RE = /\b(estoy|está|estaba|estamos|están|estuve|estuvo)\s+\w+ndo\b/;

/** PRIOR m11 present-tense «ir» forms — the only sanctioned present/imperfect contrast, all confined to L9. */
const M11_IR_PRESENT = ["voy", "vas", "va", "vamos", "van"];
/** Any OTHER present-tense form (any verb, any person) — must never appear anywhere in m22. */
const OTHER_PRESENT_FORMS = [
  "hablo", "hablas", "habla", "hablan",
  "tengo", "tienes", "tiene", "tenemos", "tienen",
  "soy", "eres", "es", "somos", "son",
  "veo", "ves", "ve", "vemos", "ven",
];

const THEY_FORMS = ["hablaban", "tenían", "eran", "iban", "veían"];
const WE_FORMS = ["hablábamos", "teníamos", "éramos", "íbamos", "veíamos"];

describe("ES m22 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M22_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M22_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M22_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("PIN E12: every imperfect form produced is a cell of ES_VERB_ENTRIES, and the accent rule holds per family (hablar/ser/ir: nosotros only; tener/ver: every form)", () => {
    const cells = new Set<string>();
    for (const v of ES_VERB_ENTRIES) for (const [k, f] of Object.entries(v.forms)) if (k.startsWith("imperfect.")) cells.add(f);
    expect(IMPERFECT_ATOMS.length, "no verb atoms found — the pin would be vacuous").toBeGreaterThanOrEqual(17);
    const invented = IMPERFECT_ATOMS.filter((s) => !cells.has(s));
    expect(invented, `imperfect atoms that are not table cells: ${invented.join(", ")}`).toEqual([]);

    const missingAccent = NOSOTROS_ONLY_ACCENT.filter((s) => !/[áéíóú]/.test(s));
    expect(missingAccent, `nosotros form missing its required accent: ${missingAccent.join(", ")}`).toEqual([]);
    const wrongAccent = NO_ACCENT_FORMS.filter((s) => /[áéíóú]/.test(s));
    expect(wrongAccent, `hablar/ser/ir non-nosotros form wrongly accented: ${wrongAccent.join(", ")}`).toEqual([]);
    const missingEveryAccent = EVERY_ACCENTED.filter((s) => !/[áéíóú]/.test(s));
    expect(missingEveryAccent, `tener/ver form missing its required accent: ${missingEveryAccent.join(", ")}`).toEqual([]);
  });

  it("PIN: no preterite form (any tense/person, any verb) appears ANYWHERE in m22 — including distractors, tiles, options, and sim NPC lines", () => {
    const banned = anyWord(PRETERITE_FORMS);
    const bad: string[] = [];
    for (const n of LESSONS) {
      const m = contentBlob(n).toLowerCase().match(banned);
      if (m) bad.push(`L${n}: «${m[2]}»`);
    }
    expect(bad, `preterite form printed:\n${bad.join("\n")}`).toEqual([]);
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

  it("PIN: no present-tense form other than PRIOR «voy» family is ever PRODUCED (answer positions + sim NPC lines) other than L9's sanctioned contrast — present tense elsewhere may still appear as a deliberate wrong-option distractor testing the yo=él collision (e.g. «era» cloze options offering «es»), which is graded content, not a printed answer (grade-answers-not-every-string doctrine)", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      for (const { id, text } of allSurfacesAndNpc([n])) {
        const m = text.toLowerCase().match(anyWord(OTHER_PRESENT_FORMS));
        if (m) bad.push(`${id}: «${m[2]}»`);
      }
    }
    expect(bad, `untaught present-tense form produced:\n${bad.join("\n")}`).toEqual([]);

    // A "-sp-recall-" step verbatim-reprints an earlier module win line (here, L9's own sanctioned
    // present/imperfect contrast) rather than producing new content — exempt from the L9-only confinement.
    const irPresentOutsideL9 = LESSONS.filter((n) => n !== 9).filter((n) =>
      allSurfacesAndNpc([n]).some(({ id, text }) => !id.includes("-sp-recall-") && anyWord(M11_IR_PRESENT).test(text.toLowerCase())),
    );
    expect(irPresentOutsideL9, `PRIOR present «ir» forms produced outside L9: L${irPresentOutsideL9.join(", L")}`).toEqual([]);
    expect(allSurfacesAndNpc([9]).some(({ text }) => anyWord(M11_IR_PRESENT).test(text.toLowerCase())), "L9 must contrast present «voy»/family against the imperfect").toBe(true);
  });

  it("PIN: the yo=él collision — every one of the five 'first slot' atoms (hablaba, era, iba, veía, tenía) is explicitly drilled: each has ≥1 agreement_cloze step whose segments contrast «yo» against «él» (or «yo no» against «él»/«él no»), with BOTH blanks answered by that same atom", () => {
    const FIRST_SLOT = ["hablaba", "era", "iba", "veía", "tenía"];
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
      // Strip the adverbial phrase «todos los días» (every day) — it isn't the agreement-taking pronoun «todos».
      const t = text.toLowerCase().replace(/\btodos los días\b/g, "cada día");
      if (!word("todos").test(t)) continue;
      const todosClause = t.split(/,|\by\b|\bpero\b/).find((c) => word("todos").test(c));
      if (todosClause === undefined) continue;
      const hasWe = anyWord(WE_FORMS).test(todosClause);
      const hasThey = anyWord(THEY_FORMS).test(todosClause);
      if (hasWe) bad.push(`${id}: «${text}» — «todos» paired with a nosotros form in its own clause`);
      if (!hasThey && !hasWe) bad.push(`${id}: «${text}» — «todos» with no agreeing verb found in its own clause`);
    }
    expect(bad, `«todos» agreement violation:\n${bad.join("\n")}`).toEqual([]);
  });

  it("every one of the 21 new atoms debuts on an intro-capable step (word_map does not count; scanned via esSurfaces, same billed-content rule as the shared vocab-provenance gate — cloze/tile options are billed, MCQ distractors are not)", () => {
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
    }
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

  it("tener's info card explicitly notes it is REGULAR in the imperfect, distinct from present «tengo» / preterite «tuve»", () => {
    const l7 = lessonBlob(7).toLowerCase();
    const infoSteps = getLesson(7).filter((s) => s.type === "info");
    expect(infoSteps.length, "L7 must carry an info card for tener's imperfect").toBeGreaterThanOrEqual(1);
    const hasRegularClaim = infoSteps.some((s) => {
      const blob = JSON.stringify(s).toLowerCase();
      return blob.includes("regular") && (blob.includes("tengo") || blob.includes("tuve"));
    });
    expect(hasRegularClaim, "L7's info card must explicitly contrast tener's regular imperfect against «tengo»/«tuve»").toBe(true);
    expect(l7.includes("tuve"), "L7 must reference «tuve» to make the contrast").toBe(true);
  });

  it("recall floor: ≥6 recalls total, ≥1 in L3/L4/L5/L6/L7/L9, ≥2 in L8/L10", () => {
    const recallCount = (n: number) => getLesson(n).filter((s) => (s as unknown as Record<string, unknown>).cue === "recall").length;
    const total = LESSONS.reduce((a, n) => a + recallCount(n), 0);
    expect(total, `total recalls: ${total}`).toBeGreaterThanOrEqual(6);
    for (const n of [3, 4, 5, 6, 7, 9]) {
      expect(recallCount(n), `L${n} must carry ≥1 recall`).toBeGreaterThanOrEqual(1);
    }
    for (const n of [8, 10]) {
      expect(recallCount(n), `L${n} must carry ≥2 recalls`).toBeGreaterThanOrEqual(2);
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
});
