/**
 * ES M21 curriculum guard — «Fuimos, fueron», the plural preterite. Sonnet-
 * drafted lessons, Fable spine + pins (2026-09-10). Shared lints at ZERO
 * debt + shared doctrine pins + module-bespoke lanes below. Pin E12: every
 * plural preterite cell produced here must come from conjugationTables.ts.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M21_ATOMS, ES_M21_LESSONS, ES_M21_PLACEMENT, ES_M21_CHECKPOINT_INDEX } from "./m21";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES } from "../__tests__/moduleBarGuards";
import { ES_VERB_ENTRIES } from "../conjugationTables";

registerEsModuleContentLints({
  moduleId: "m21",
  lessons: ES_M21_LESSONS,
  atoms: ES_M21_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m21",
  lessons: ES_M21_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m21")),
});

registerEsDoctrinePins({
  moduleId: "m21",
  lessons: ES_M21_LESSONS,
  checkpointIndex: ES_M21_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m21", ES_M21_LESSONS, ES_M21_ATOMS);

const getLesson = (n: number) => ES_M21_LESSONS[n - 1].steps;
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

const lessonBlob = (n: number) => JSON.stringify(getLesson(n));
/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 20 plural preterite verb forms this module registers (single-word verb atoms). «todos» is a pronoun, checked separately. */
const PLURAL_ATOMS = ES_M21_ATOMS.filter((a) => a.partOfSpeech === "verb").map((a) => a.surface);
const ALL_ATOMS = ES_M21_ATOMS.map((a) => a.surface);

/** The m19 singular preterite paradigm — fully PRIOR, re-spent freely (esp. L9/L10). */
const M19_SINGULARS = [
  "hablé", "hablaste", "habló", "compré", "compraste", "compró", "trabajé", "trabajaste", "trabajó",
  "estudié", "estudiaste", "estudió", "comí", "comiste", "comió", "viví", "viviste", "vivió",
  "salí", "saliste", "salió", "escribí", "escribiste", "escribió", "cociné", "cocinaste", "cocinó",
];
/** The m20 singular irregular preterite paradigm — fully PRIOR, re-spent freely (esp. L9/L10). */
const M20_SINGULARS = [
  "fui", "fuiste", "fue", "hice", "hiciste", "hizo", "tuve", "tuviste", "tuvo",
  "estuve", "estuviste", "estuvo", "vi", "viste", "vio", "vine", "viniste", "vino",
];
const MARKERS = ["ayer", "anoche", "la semana pasada", "el fin de semana", "el mes pasado"];
const PRESENT_MARKERS = /\b(hoy|todos los días|mañana|ahora)\b/;
/** PRIOR m18 present-tense forms that never carry a past marker. «hablamos»/«vivimos» are deliberately excluded — they are the ambiguous both-ways forms, pinned separately. */
const PRESENT_FORMS = ["vamos", "van", "tenemos", "tienen", "estamos", "están", "somos", "son", "comemos", "comen", "viven"];
/** BANNED — never registered at any tense/person; several look exactly like the nosotros preterite this module deliberately does not teach. */
const BANNED_PRESENT = [
  "hacemos", "hacen", "queremos", "quieren", "podemos", "pueden", "trabajamos", "trabajan",
  "estudiamos", "estudian", "compramos", "compran", "escribimos", "escriben", "salimos", "salen",
  "cocinamos", "cocinan", "vemos", "ven", "venimos", "vienen",
];
const VOSOTROS = [
  "fuisteis", "hicisteis", "tuvisteis", "estuvisteis", "visteis", "vinisteis",
  "hablasteis", "comisteis", "vivisteis", "estudiasteis", "comprasteis", "trabajasteis", "escribisteis",
];
/** ustedes/ellos plural forms — the only agreement «todos» may take. */
const THEY_FORMS = ["fueron", "hicieron", "tuvieron", "estuvieron", "vieron", "vinieron", "hablaron", "comieron", "vivieron", "estudiaron", "compraron", "trabajaron", "escribieron"];
/** nosotros forms — «todos» must never pair with these. */
const WE_FORMS = ["fuimos", "hicimos", "tuvimos", "estuvimos", "vimos", "vinimos", "hablamos", "vivimos", "comimos"];

describe("ES m21 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M21_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M21_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M21_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("PIN E12: every plural preterite produced is a cell of ES_VERB_ENTRIES — nothing hand-written, and no accent on any of them", () => {
    const cells = new Set<string>();
    for (const v of ES_VERB_ENTRIES) for (const [k, f] of Object.entries(v.forms)) if (k.startsWith("preterite.")) cells.add(f);
    expect(PLURAL_ATOMS.length, "no verb atoms found — the pin would be vacuous").toBeGreaterThanOrEqual(17);
    const invented = PLURAL_ATOMS.filter((s) => !cells.has(s));
    expect(invented, `preterite atoms that are not table cells: ${invented.join(", ")}`).toEqual([]);
    const accented = PLURAL_ATOMS.filter((s) => /[áéíóú]/.test(s));
    expect(accented, `a plural preterite form never carries an accent: ${accented.join(", ")}`).toEqual([]);
  });

  it("nosotros/ustedes plural only: no vosotros, no untaught present forms", () => {
    const banned = anyWord([...BANNED_PRESENT, ...VOSOTROS]);
    const bad: string[] = [];
    for (const n of LESSONS) {
      const m = lessonBlob(n).toLowerCase().match(banned);
      if (m) bad.push(`L${n}: «${m[2]}»`);
    }
    expect(bad, `banned form printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("every one of the 21 new atoms debuts on an intro-capable step (word_map does not count)", () => {
    for (const w of ALL_ATOMS) {
      const re = word(w);
      let found: { lesson: number; type: string } | null = null;
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type === "word_map") continue; // unbilled preview
          if (re.test(JSON.stringify(s).toLowerCase())) { found = { lesson: n, type: s.type }; break; }
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

  it("«fuimos» is cashed BOTH ways — as went (a place follows somewhere in the clause) and as was (a bare predicate adjective/noun); L1 is WENT-only", () => {
    /** "went" needs a place: «a»/«al» appears anywhere in the same clause after «fuimos» (words like «juntos», «con Diego» may sit between). */
    const wentClause = (clause: string) => {
      const i = clause.search(word("fuimos"));
      if (i < 0) return false;
      return /\b(a|al)\b/.test(clause.slice(i + "fuimos".length));
    };
    /** "was" is a bare predicate — «fuimos» immediately followed by «muy» or by «amigo(s)/amiga(s)», never a place. */
    const wasClause = (clause: string) => /(^|[^\p{L}])fuimos (muy |amigos?|amigas?)/u.test(clause);
    const clausesOf = (text: string) => text.toLowerCase().split(/,|\by\b|\bpero\b/).filter((c) => word("fuimos").test(c));
    const went = allSurfaces().flatMap((s) => clausesOf(s.text).filter(wentClause).map(() => s));
    const was = allSurfaces().flatMap((s) => clausesOf(s.text).filter(wasClause).map(() => s));
    expect(went.length, "«fuimos» as went (a place follows) under-drilled").toBeGreaterThanOrEqual(3);
    expect(was.length, "«fuimos» as was (a bare predicate) under-drilled").toBeGreaterThanOrEqual(1);
    const l1Was = allSurfaces([1]).filter((s) => clausesOf(s.text).some(wasClause));
    expect(l1Was, "L1 must not spend «fuimos» as was").toEqual([]);
  });

  it("«hablamos»/«vivimos» carry an explicit past reading, debuted in L2, disambiguated by context wherever produced", () => {
    for (const w of ["hablamos", "vivimos"]) {
      const re = word(w);
      expect(re.test(lessonBlob(2).toLowerCase()), `«${w}» past reading must debut in L2`).toBe(true);
    }
    // Disambiguation is a WHOLE-STEP context claim (info card: "the story around it says which") — a marker or
    // another past-tense form anywhere in the step (own sentence, npc line, or reply) is sufficient; it need not
    // sit in the exact same clause split. Scan full step JSON, which captures sim npc + reply + explanation together.
    const otherPast = anyWord([...PLURAL_ATOMS.filter((x) => x !== "hablamos" && x !== "vivimos"), ...M19_SINGULARS, ...M20_SINGULARS]);
    const bad: string[] = [];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        // Bare person-recognition MCQs (vocabTextMcq: "which word means X?") carry
        // single conjugated words as options, no sentence — they test SUBJECT/PERSON
        // (hablamos vs hablan/hablas/hablo), never assert a tense reading, so the
        // disambiguation requirement (which is about a TENSE claim) doesn't apply.
        if (
          rec.type === "multiple_choice" &&
          Array.isArray(rec.options) &&
          (rec.options as Array<{ text: string }>).every((o) => !o.text.includes(" "))
        ) {
          continue;
        }
        const blob = JSON.stringify(s).toLowerCase();
        for (const w of ["hablamos", "vivimos"]) {
          if (!word(w).test(blob)) continue;
          const hasMarker = MARKERS.some((m) => blob.includes(m)) || PRESENT_MARKERS.test(blob);
          const hasOtherPast = otherPast.test(blob);
          const hasOtherPresent = anyWord(PRESENT_FORMS).test(blob);
          if (!hasMarker && !hasOtherPast && !hasOtherPresent) bad.push(`${s.id}: «${w}» unmarked (ambiguous, no context)`);
        }
      }
    }
    expect(bad, `«hablamos»/«vivimos» produced without a disambiguating marker or context:\n${bad.join("\n")}`).toEqual([]);
  });

  it("«todos» takes 3rd-person-plural agreement only — never pairs with a nosotros form (checked per-clause, not per-sentence, since a contrast sentence may carry «todos … comieron» next to a separate «nosotros comimos» clause)", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase();
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

  it("markers and tenses agree per clause; every marker is drilled; «el mes pasado» debuts in L6", () => {
    const pastForm = anyWord([...PLURAL_ATOMS, ...M19_SINGULARS, ...M20_SINGULARS]);
    const presentForm = anyWord(PRESENT_FORMS);
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase();
      for (const clause of t.split(/,|\by\b|\bpero\b/)) {
        const hasPast = MARKERS.some((m) => clause.includes(m));
        const hasPresentMarker = PRESENT_MARKERS.test(clause);
        if (hasPresentMarker && pastForm.test(clause)) bad.push(`${id}: «${text}» (present marker + preterite)`);
        // «trabajo» is also the noun (mucho trabajo, el trabajo): only the verb reading counts
        const verbClause = clause.replace(/(^|[^\p{L}])(mucho|poco|el|mi|su|tu|de|un|más|al|del) trabajo(?=[^\p{L}]|$)/gu, "$1 ");
        if (hasPast && presentForm.test(verbClause)) bad.push(`${id}: «${text}» (past marker + present form)`);
      }
    }
    expect(bad, `marker / tense disagreement:\n${bad.join("\n")}`).toEqual([]);
    for (const m of MARKERS) {
      const n = allSurfaces().filter((s) => s.text.toLowerCase().includes(m)).length;
      expect(n, `marker «${m}» is under-drilled (${n})`).toBeGreaterThanOrEqual(4);
    }
    const early = LESSONS.filter((n) => n < 6 && lessonBlob(n).toLowerCase().includes("el mes pasado"));
    expect(early, "«el mes pasado» printed before its L6 debut").toEqual([]);
  });

  it("the m19/m20 singulars are re-spent alongside the plurals in the consolidation lessons (L9, L10)", () => {
    const sing = anyWord([...M19_SINGULARS, ...M20_SINGULARS]);
    const n = allSurfaces([9, 10]).filter((s) => sing.test(s.text.toLowerCase())).length;
    expect(n, `singular preterites produced in the consolidation lessons: ${n}`).toBeGreaterThanOrEqual(8);
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

  it("no imperfect and no progressive anywhere (pin E7: preterite = simple past only)", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n).toLowerCase();
      for (const re of [
        /(^|[^\p{L}])(iba|era|tenía|hacía|veía|venía|estaba|hablaba|comía|vivía|trabajaba|compraba|estudiaba|salía|escribía)(?=[^\p{L}]|$)/u,
        /\b(estoy|está|estaba|estamos|están)\s+\w+ndo\b/,
        /\b(was|were) (going|doing|making|having|seeing|coming|speaking|eating|working|buying|studying|writing|living)\b/,
        /\bused to\b/,
        /\b(have|has|had) (gone|done|made|had|seen|come|been)\b/,
      ]) {
        const m = blob.match(re);
        if (m) bad.push(`L${n}: «${m[0].trim()}»`);
      }
    }
    expect(bad, `out-of-scope tense / gloss:\n${bad.join("\n")}`).toEqual([]);
  });
});
