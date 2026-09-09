/**
 * ES M20 curriculum guard — «Fui, hice, tuve», the irregular preterite.
 * Sonnet-drafted lessons, Fable spine + pins (2026-09-09). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below. Pin E12:
 * every preterite cell produced here must come from conjugationTables.ts
 * (ver + venir were added to ES_VERB_ENTRIES for this module).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M20_ATOMS, ES_M20_LESSONS, ES_M20_PLACEMENT, ES_M20_CHECKPOINT_INDEX } from "./m20";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES } from "../__tests__/moduleBarGuards";
import { ES_VERB_ENTRIES } from "../conjugationTables";

registerEsModuleContentLints({
  moduleId: "m20",
  lessons: ES_M20_LESSONS,
  atoms: ES_M20_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m20",
  lessons: ES_M20_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m20")),
});

registerEsDoctrinePins({
  moduleId: "m20",
  lessons: ES_M20_LESSONS,
  checkpointIndex: ES_M20_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m20", ES_M20_LESSONS, ES_M20_ATOMS);

const getLesson = (n: number) => ES_M20_LESSONS[n - 1].steps;
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

/** The irregular preterite forms this module registers (single-word verb atoms), transfer cell included. */
const IRREGULAR_ATOMS = ES_M20_ATOMS.filter((a) => a.partOfSpeech === "verb").map((a) => a.surface);
const TRANSFER = "viniste";
const M19_REGULARS = [
  "hablé", "hablaste", "habló", "compré", "compraste", "compró", "trabajé", "trabajaste", "trabajó", "estudié", "estudió",
  "comí", "comiste", "comió", "viví", "vivió", "salí", "saliste", "salió", "escribí", "escribió",
];
const MARKERS = ["ayer", "anoche", "la semana pasada", "el fin de semana", "el mes pasado"];
const PRESENT_MARKERS = /\b(hoy|todos los días|mañana|ahora)\b/;
const PRESENT_FORMS = [
  "hablo", "compro", "trabajo", "estudio", "como", "vivo", "salgo", "escribo", "habla", "compra", "trabaja", "estudia", "come", "vive", "sale", "escribe",
  "voy", "vas", "va", "hago", "haces", "hace", "tengo", "tienes", "tiene", "estoy", "estás", "está", "veo", "ve", "vengo", "viene",
];

describe("ES m20 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M20_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M20_PLACEMENT.screener.length).toBe(1);
    expect(ES_M20_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("PIN E12: every irregular preterite produced is a cell of ES_VERB_ENTRIES — nothing hand-written, and no accent on any of them", () => {
    const cells = new Set<string>();
    for (const v of ES_VERB_ENTRIES) for (const [k, f] of Object.entries(v.forms)) if (k.startsWith("preterite.")) cells.add(f);
    expect(IRREGULAR_ATOMS.length, "no verb atoms found — the pin would be vacuous").toBeGreaterThanOrEqual(17);
    const invented = IRREGULAR_ATOMS.filter((s) => !cells.has(s));
    expect(invented, `preterite atoms that are not table cells: ${invented.join(", ")}`).toEqual([]);
    const accented = IRREGULAR_ATOMS.filter((s) => /[áéíóú]/.test(s));
    expect(accented, `an irregular preterite never carries an accent: ${accented.join(", ")}`).toEqual([]);
    // the classic learner mis-spellings must never be printed anywhere
    for (const n of LESSONS) {
      const m = lessonBlob(n).toLowerCase().match(/(^|[^\p{L}])(fuí|vió|hizó|tuvé|estuvé|viné)(?=[^\p{L}]|$)/u);
      expect(m, `L${n}: accented irregular «${m?.[2]}» printed`).toBeNull();
    }
  });

  it("singular persons only: no plural preterite, no vosotros, no untaught present of ver / venir", () => {
    const banned = anyWord([
      "fuimos", "fueron", "hicimos", "hicieron", "tuvimos", "tuvieron", "estuvimos", "estuvieron", "vimos", "vieron", "vinimos", "vinieron",
      "fuisteis", "hicisteis", "tuvisteis", "estuvisteis", "visteis", "vinisteis", "veis", "venís",
      "ves", "vemos", "ven", "vienes", "venimos", "vienen",
      "hablaron", "compraron", "comieron", "vivieron", "salieron", "trabajaron", "estudiaron", "escribieron",
    ]);
    const bad: string[] = [];
    for (const n of LESSONS) {
      const m = lessonBlob(n).toLowerCase().match(banned);
      if (m) bad.push(`L${n}: «${m[2]}»`);
    }
    expect(bad, `banned person printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("every irregular form debuts on an intro-capable step (the table does not make it PRIOR)", () => {
    for (const w of IRREGULAR_ATOMS) {
      if (w === TRANSFER) continue; // pinned separately
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

  it("each irregular form is PRODUCED at least 3 times (answer positions), spread over ≥2 lessons", () => {
    const short: string[] = [];
    for (const w of IRREGULAR_ATOMS) {
      if (w === TRANSFER) continue;
      const re = word(w);
      const hits = LESSONS.map((n) => allSurfaces([n]).filter((s) => re.test(s.text.toLowerCase())).length);
      const total = hits.reduce((a, b) => a + b, 0);
      const spread = hits.filter((h) => h > 0).length;
      if (total < 3 || spread < 2) short.push(`«${w}» ${total}× over ${spread} lesson(s)`);
    }
    expect(short, `under-produced irregulars:\n${short.join("\n")}`).toEqual([]);
  });

  it("«fue» is cashed BOTH ways — as went (a place follows) and as was (a noun / adjective follows)", () => {
    const went = allSurfaces().filter((s) => /(^|[^\p{L}])fue (a|al) /u.test(s.text.toLowerCase()));
    const was = allSurfaces().filter((s) => /(^|[^\p{L}])fue (?!(a|al) )\p{L}/u.test(s.text.toLowerCase()));
    expect(went.length, "«fue» as went (fue a / fue al) under-drilled").toBeGreaterThanOrEqual(3);
    expect(was.length, "«fue» as was (fue muy bueno / fue mi …) under-drilled").toBeGreaterThanOrEqual(3);
    // L1 is ir only — the ser reading opens in L2
    expect(allSurfaces([1]).filter((s) => /(^|[^\p{L}])fue (?!(a|al) )\p{L}/u.test(s.text.toLowerCase())), "L1 must not spend «fue» as was").toEqual([]);
  });

  it("markers and tenses agree per clause; every marker is drilled; «el mes pasado» debuts in L6", () => {
    const pastForm = anyWord([...IRREGULAR_ATOMS, ...M19_REGULARS]);
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

  it("the m19 regulars are re-spent alongside the irregulars (L6, L7, L9, L10)", () => {
    const reg = anyWord(M19_REGULARS);
    const n = allSurfaces([6, 7, 9, 10]).filter((s) => reg.test(s.text.toLowerCase())).length;
    expect(n, `m19 regular preterites produced in the mixing lessons: ${n}`).toBeGreaterThanOrEqual(8);
  });

  it("the transfer cell «viniste» lives ONLY in the L8 checkpoint, in exactly one step, and is produced", () => {
    const re = word(TRANSFER);
    const outside = LESSONS.filter((n) => n !== 8 && re.test(lessonBlob(n).toLowerCase()));
    expect(outside, `transfer verb leaked out of the checkpoint: ${outside.map((n) => `L${n}`).join(", ")}`).toEqual([]);
    const carriers = getLesson(8).filter((s) => re.test(JSON.stringify(s).toLowerCase()));
    expect(carriers.length, "«viniste» must appear in exactly one checkpoint step").toBe(1);
    expect(ES_INTRO_TYPES.has(carriers[0].type), "the transfer step must be intro-capable").toBe(true);
    expect(allSurfaces([8]).some((s) => re.test(s.text.toLowerCase())), "the transfer never makes the learner produce «viniste»").toBe(true);
  });

  it("hacer / tener ruling (B112): present only as hago / haces / hace and tengo / tienes / tiene / tenemos / tienen", () => {
    const bad = allSurfaces().filter((s) => /\b(hacemos|hacen|hacéis|tenéis)\b/.test(s.text.toLowerCase())).map((s) => s.id);
    expect(bad).toEqual([]);
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
        /\b(estoy|está|estaba)\s+\w+ndo\b/,
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
