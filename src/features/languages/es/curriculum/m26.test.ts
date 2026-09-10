/**
 * ES M26 curriculum guard — «Vivía, comía, estudiaba», imperfect wave 3
 * (vivir/comer/estudiar/trabajar/salir). Sonnet-drafted lessons, Fable spine
 * + pins (2026-09-10). Shared lints at ZERO debt + shared doctrine pins +
 * module-bespoke lanes below. Pin E12: every imperfect cell produced here
 * must come from conjugationTables.ts; the accent rule is per-family
 * (estudiar/trabajar: nosotros only; vivir/comer/salir: every form). Unlike
 * m23/m25 (zero new verb atoms), m26 registers all 20 new atoms as
 * verb-table cells — the third such wave after m22/m24. This module's own
 * signature: for the first time, every one of its five verbs has a matching
 * PRIOR preterite (m19/m21) to contrast against, «pero» between them (L6),
 * cashed at checkpoint (L8) and recalled at mastery (L10).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M26_ATOMS, ES_M26_LESSONS, ES_M26_PLACEMENT, ES_M26_CHECKPOINT_INDEX } from "./m26";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";
import { ES_VERB_ENTRIES } from "../conjugationTables";

registerEsModuleContentLints({
  moduleId: "m26",
  lessons: ES_M26_LESSONS,
  atoms: ES_M26_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m26",
  lessons: ES_M26_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m26")),
});

registerEsDoctrinePins({
  moduleId: "m26",
  lessons: ES_M26_LESSONS,
  checkpointIndex: ES_M26_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m26", ES_M26_LESSONS, ES_M26_ATOMS);

const getLesson = (n: number) => ES_M26_LESSONS[n - 1].steps;
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

/** Every printed string anywhere in a lesson step, INCLUDING tiles/distractors/options — for scans that must ban a form even as a foil, not just in a graded answer position. */
function allPrintedStrings(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of nums) {
    for (const s of getLesson(n)) {
      const walk = (v: unknown, path: string) => {
        if (typeof v === "string") { out.push({ id: `${s.id}${path}`, text: v }); return; }
        if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
        if (v && typeof v === "object") { for (const [k, val] of Object.entries(v)) walk(val, `${path}.${k}`); }
      };
      walk(s, "");
    }
  }
  return out;
}

/**
 * Same walk as allPrintedStrings, but drops explanatory PROSE fields
 * (explanation/why/body/revealNote/gloss/replyGloss/description/title/setting) —
 * per m25.test.ts's own precedent, "info-card/hint prose may still name the
 * untaught contrast form for teaching purposes." Bans that must hold even as a
 * tile/distractor/option foil should still fail on those; bans on live verb-form
 * production should not fire on legitimate teaching prose (e.g. L5 explaining
 * exactly why «salimos»/«salieron» are wrong for salir).
 */
const PROSE_FIELD_RE = /\.(explanation|why|body|revealNote|gloss|replyGloss|description|title|setting)$/;
function allPrintedStringsNoProse(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  return allPrintedStrings(nums).filter(({ id }) => !PROSE_FIELD_RE.test(id));
}

const lessonBlob = (n: number) => JSON.stringify(getLesson(n));
/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 20 new imperfect verb forms this module registers. */
const ALL_ATOMS = ES_M26_ATOMS.map((a) => a.surface);

/** estudiar/trabajar family — accent ONLY on nosotros. */
const AR_NOSOTROS_ONLY_ACCENT = ["estudiábamos", "trabajábamos"];
const AR_NO_ACCENT_FORMS = ["estudiaba", "estudiabas", "estudiaban", "trabajaba", "trabajabas", "trabajaban"];
/** vivir/comer/salir families — EVERY form is accented. */
const EVERY_ACCENTED = [
  "vivía", "vivías", "vivíamos", "vivían",
  "comía", "comías", "comíamos", "comían",
  "salía", "salías", "salíamos", "salían",
];

/** No progressive anywhere (out of scope for this module), extended to this module's five new atoms + a -ndo form (E7, carried). */
const PROGRESSIVE_RE = /\b(estoy|está|estaba|estábamos|estabas|estaban|estamos|están|estuve|estuvo|vivía|vivías|vivíamos|vivían|comía|comías|comíamos|comían|estudiaba|estudiabas|estudiábamos|estudiaban|trabajaba|trabajabas|trabajábamos|trabajaban|salía|salías|salíamos|salían)\s+(?!cuando\b)\w+(?:ando|iendo)\b/;

/** Unregistered querer/poder preterite forms — never shipped a preterite anywhere in m1-m25 (only the imperfect is PRIOR). Must never appear anywhere. */
const UNREGISTERED_PRETERITE = ["quise", "quisiste", "quiso", "quisimos", "quisieron", "pude", "pudiste", "pudo", "pudimos", "pudieron"];

/** The 3 still-banned imperfect forms — cocinar/escribir/comprar were never assigned an imperfect wave (m22 = wave 1, m24 = wave 2, m26 = wave 3); their imperfect cells stay unregistered. */
const BANNED_IMPERFECT_FORMS = ["cocinaba", "escribía", "compraba"];

/** NOT-PRIOR present-tense cells for this module's five verbs — only the cells actually confirmed PRIOR (vivo/vive, como/comemos, estudio, trabajo/trabaja, salgo) may appear; these must never appear ANYWHERE, not even as a foil. */
const NOT_PRIOR_PRESENT = ["trabajamos", "trabajan", "sales", "salimos", "salen", "estudiamos", "estudian"];

/** NOT-PRIOR preterite cells for this module's five verbs — viviste/trabajamos(pret)/salimos(pret)/salieron/estudiaste/estudiamos(pret) were never registered anywhere; only vivió/viví, comiste/comió/comí, estudié, trabajé/trabajó, salí/saliste/salió are PRIOR (m19/m21). */
const NOT_PRIOR_PRETERITE_RE = /(^|[^\p{L}])(viviste|estudiaste|estudiamos|salimos|salieron|trabajamos)(?=[^\p{L}]|$)/u;

/** Habitual-side markers (imperfect) vs. bounded-past markers (preterite) for the same-verb-contrast discipline pin. */
const HABITUAL_MARKERS = ["siempre", "todos los días", "de niño"];
const BOUNDED_MARKERS = ["ayer", "anoche", "la semana pasada", "el mes pasado"];

/**
 * This module's five lemmas, with forms bucketed by TENSE-TAGGED KEY (never by
 * substring-sniffing the surface value — trabajar's own stem contains the literal
 * substring "aba" ("trab-aba-jar"), which silently breaks any ".includes('aba')"
 * heuristic for ALL of trabajar's forms, not just its imperfect ones).
 * LEMMA_ALL_FORMS (imperfect+preterite only, present EXCLUDED) is the set used for
 * the same-verb double-conjugation pin — present is excluded specifically so
 * trabajar's "trabajo" (present.yo) never collides with the registered PRIOR noun
 * "el trabajo" (m9); this module only cares about imperfect/preterite stacking.
 */
const M26_LEMMAS = ["vivir", "comer", "estudiar", "trabajar", "salir"];
const LEMMA_IMPERFECT_FORMS: Record<string, string[]> = {};
const LEMMA_PRETERITE_FORMS: Record<string, string[]> = {};
const LEMMA_ALL_FORMS: Record<string, string[]> = {};
for (const v of ES_VERB_ENTRIES) {
  if (!M26_LEMMAS.includes(v.id)) continue;
  const imp = Object.entries(v.forms).filter(([k]) => k.startsWith("imperfect.")).map(([, f]) => f);
  const pret = Object.entries(v.forms).filter(([k]) => k.startsWith("preterite.")).map(([, f]) => f);
  LEMMA_IMPERFECT_FORMS[v.id] = [...new Set(imp)];
  LEMMA_PRETERITE_FORMS[v.id] = [...new Set(pret)];
  LEMMA_ALL_FORMS[v.id] = [...new Set([...imp, ...pret])];
}

describe("ES m26 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M26_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M26_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M26_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 20 new atoms — the four cells (yo/tú/nosotros/ellos) of vivir, comer, estudiar, trabajar, salir", () => {
    const expected = [
      "vivía", "vivías", "vivíamos", "vivían",
      "comía", "comías", "comíamos", "comían",
      "estudiaba", "estudiabas", "estudiábamos", "estudiaban",
      "trabajaba", "trabajabas", "trabajábamos", "trabajaban",
      "salía", "salías", "salíamos", "salían",
    ];
    expect(ALL_ATOMS.sort()).toEqual(expected.sort());
  });

  it("PIN E12: every one of the 20 new atoms is a cell of ES_VERB_ENTRIES, and the accent rule holds per family (estudiar/trabajar: nosotros only; vivir/comer/salir: every form)", () => {
    const cells = new Set<string>();
    for (const v of ES_VERB_ENTRIES) for (const [k, f] of Object.entries(v.forms)) if (k.startsWith("imperfect.")) cells.add(f);
    expect(ALL_ATOMS.length, "no verb atoms found — the pin would be vacuous").toBe(20);
    const invented = ALL_ATOMS.filter((s) => !cells.has(s));
    expect(invented, `imperfect atoms that are not table cells: ${invented.join(", ")}`).toEqual([]);

    const missingAccent = AR_NOSOTROS_ONLY_ACCENT.filter((s) => !/[áéíóú]/.test(s));
    expect(missingAccent, `estudiar/trabajar nosotros form missing its required accent: ${missingAccent.join(", ")}`).toEqual([]);
    const wrongAccent = AR_NO_ACCENT_FORMS.filter((s) => /[áéíóú]/.test(s));
    expect(wrongAccent, `estudiar/trabajar non-nosotros form wrongly accented: ${wrongAccent.join(", ")}`).toEqual([]);
    const missingEveryAccent = EVERY_ACCENTED.filter((s) => !/[áéíóú]/.test(s));
    expect(missingEveryAccent, `vivir/comer/salir form missing its required accent: ${missingEveryAccent.join(", ")}`).toEqual([]);
  });

  it("«ir» (infinitive) is never CREDITED as an atom — it legitimately appears as a plain word inside sentences (e.g. «quería ir a la escuela»), just never listed as a taught surface", () => {
    const bad = ES_M26_ATOMS.filter((a) => a.surface.toLowerCase() === "ir");
    expect(bad, "«ir» must never be registered as a live atom").toEqual([]);
  });

  it("every `atoms:` credit of vivir/comer/estudiar/trabajar/salir (the bare infinitive, when printed) corresponds to a real atom() registration elsewhere — no phantom infinitive credits", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        const atoms = rec.atoms;
        if (!Array.isArray(atoms)) continue;
        for (const a of atoms) {
          if (typeof a === "string" && M26_LEMMAS.includes(a)) bad.push(`${s.id}: bare infinitive «${a}» credited as an atom — infinitives are never live atoms`);
        }
      }
    }
    expect(bad, `phantom infinitive atom credit:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: no unregistered verb form anywhere (including tiles/distractors/options) — the 3 still-banned imperfect forms (cocinaba/escribía/compraba), querer/poder's unregistered preterite (quise/pude/...), the NOT-PRIOR present cells (trabajamos/trabajan/sales/salimos/salen/estudiamos/estudian), and the NOT-PRIOR preterite cells (viviste/trabajamos-pret/salimos-pret/salieron/estudiaste/estudiamos-pret)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStringsNoProse()) {
      const t = text.toLowerCase();
      let m = t.match(anyWord(BANNED_IMPERFECT_FORMS));
      if (m) bad.push(`${id}: still-banned imperfect «${m[2]}»`);
      m = t.match(anyWord(UNREGISTERED_PRETERITE));
      if (m) bad.push(`${id}: unregistered querer/poder preterite «${m[2]}»`);
      m = t.match(anyWord(NOT_PRIOR_PRESENT));
      if (m) bad.push(`${id}: NOT-PRIOR present form «${m[2]}»`);
      m = t.match(NOT_PRIOR_PRETERITE_RE);
      if (m) bad.push(`${id}: NOT-PRIOR preterite form «${m[2]}»`);
    }
    expect(bad, `unregistered verb form produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: no progressive anywhere (out of scope for this module), extended to this module's five new atoms (E7, carried)", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n).toLowerCase();
      const m = blob.match(PROGRESSIVE_RE);
      if (m) bad.push(`L${n}: «${m[0].trim()}»`);
    }
    expect(bad, `progressive form printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: same-verb contrast marker discipline in L6 (the signature teaching lesson) — every habitual/imperfect ↔ one-time/preterite pair of the SAME verb, joined by «pero», carries a habitual marker on the imperfect clause and a bounded-past marker on the preterite clause. Scoped to L6 only: L8 (checkpoint) deliberately recombines the same contrast WITHOUT scaffolding markers — a harder, marker-free recognition test of tense alone, not a teaching moment — so it is exempt from this discipline by design.", () => {
    const bad: string[] = [];
    for (const n of [6] as const) {
      for (const { id, text } of allSurfacesAndNpc([n])) {
        const t = text.toLowerCase();
        if (!/\bpero\b/.test(t)) continue;
        const clauses = t.split(/\bpero\b/);
        if (clauses.length !== 2) continue;
        const [left, right] = clauses;
        // does this sentence contain two forms of the SAME m26 lemma, one per clause (the signature contrast shape)?
        for (const lemma of M26_LEMMAS) {
          const impForms = LEMMA_IMPERFECT_FORMS[lemma] ?? [];
          const pretForms = LEMMA_PRETERITE_FORMS[lemma] ?? [];
          const leftHasImperfect = impForms.length > 0 && anyWord(impForms).test(left);
          const rightHasPreterite = pretForms.length > 0 && anyWord(pretForms).test(right);
          if (leftHasImperfect && rightHasPreterite) {
            const leftHasHabitual = anyWord(HABITUAL_MARKERS).test(left);
            const rightHasBounded = anyWord(BOUNDED_MARKERS).test(right);
            if (!leftHasHabitual) bad.push(`${id}: «${text}» — imperfect clause for «${lemma}» missing a habitual marker (siempre/todos los días/de niño)`);
            if (!rightHasBounded) bad.push(`${id}: «${text}» — preterite clause for «${lemma}» missing a bounded-past marker (ayer/anoche/la semana pasada/el mes pasado)`);
          }
        }
      }
    }
    expect(bad, `same-verb contrast missing required marker discipline:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: no same-verb double-conjugation — two forms of the SAME m26 lemma never co-occur inside a single clause (clauses split on comma/«pero»/«y»)", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      for (const { id, text } of allSurfacesAndNpc([n])) {
        const t = text.toLowerCase();
        const clauses = t.split(/,|\bpero\b|\by\b/);
        for (const clause of clauses) {
          for (const lemma of M26_LEMMAS) {
            const forms = (LEMMA_ALL_FORMS[lemma] ?? []).filter((f) => f.length > 1);
            const hits = new Set(forms.filter((f) => word(f).test(clause)));
            if (hits.size >= 2) bad.push(`${id}: «${text}» — clause «${clause.trim()}» stacks two forms of «${lemma}»: ${[...hits].join(", ")}`);
          }
        }
      }
    }
    expect(bad, `same-verb double-conjugation inside one clause:\n${bad.join("\n")}`).toEqual([]);
  });

  it("every new atom debuts on an intro-capable step (word_map does not count), and every debut lands in L1-L5 (the five debut lessons, one family per lesson) — L6/L7/L8/L9/L10 introduce zero new atoms", () => {
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

  it("recall floor: ≥1 recall in L5/L6/L7/L9, ≥2 in L8/L10; L1-L4 carry none (nothing earlier in this module to recall)", () => {
    const recallCount = (n: number) => getLesson(n).filter((s) => (s as unknown as Record<string, unknown>).cue === "recall").length;
    for (const n of [5, 6, 7, 9]) {
      expect(recallCount(n), `L${n} must carry ≥1 recall`).toBeGreaterThanOrEqual(1);
    }
    for (const n of [8, 10]) {
      expect(recallCount(n), `L${n} must carry ≥2 recalls`).toBeGreaterThanOrEqual(2);
    }
    for (const n of [1, 2, 3, 4]) {
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

  it("«todos» takes 3rd-person-plural agreement only — never pairs with a nosotros form (checked per-clause)", () => {
    const WE_FORMS = ["vivíamos", "comíamos", "estudiábamos", "trabajábamos", "salíamos"];
    const THE_FORMS = ["vivían", "comían", "estudiaban", "trabajaban", "salían"];
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      // «todos los días» is the unrelated adverbial phrase ("every day"), not the
      // pronoun «todos» ("everyone") this pin checks agreement for — strip it first
      // (m24.test.ts's own established pattern) or every legitimate "todos los
      // días" sentence false-positives.
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

  it("«cuando» (conjunction) is never confused with «¿cuándo?» (the fixed standalone question phrase, PRIOR m8) — «cuándo» with an accent only ever appears as the exact phrase «¿cuándo?»", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      if (!/cuándo/.test(t)) continue;
      if (!/¿cuándo\?/.test(t)) bad.push(`${id}: «${text}» — accented «cuándo» used outside the fixed «¿cuándo?» phrase`);
    }
    expect(bad, `«cuándo» misuse:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: porque-spelling discipline carried (this module doesn't teach porque/por eso, but may exercise them via recall) — «por qué» / «porqué» / bare two-word «por que» never appear anywhere", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      if (/por qué|porqué/.test(t)) bad.push(`${id}: «${text}»`);
      if (/\bpor que\b/.test(t)) bad.push(`${id}: «${text}» (bare "por que")`);
    }
    expect(bad, `accidental por-qué spelling in graded content:\n${bad.join("\n")}`).toEqual([]);
  });

  it("the module's signature payoff (same-verb imperfect vs. preterite contrast, «pero» between them) is cashed by L6 and recalled at the checkpoint (L8)", () => {
    const l6 = lessonBlob(6).toLowerCase();
    expect(/comía.*pero.*comí|comí.*pero.*comía/.test(l6), "L6 must cash the same-verb «comía ... pero ... comí» contrast").toBe(true);
    const l8 = lessonBlob(8).toLowerCase();
    const hasContrast = M26_LEMMAS.some((lemma) => {
      const imp = LEMMA_IMPERFECT_FORMS[lemma] ?? [];
      const pret = LEMMA_PRETERITE_FORMS[lemma] ?? [];
      return imp.length > 0 && pret.length > 0 && anyWord(imp).test(l8) && anyWord(pret).test(l8);
    });
    expect(hasContrast, "L8 must recall/recombine at least one same-verb imperfect-vs-preterite contrast").toBe(true);
  });
});
