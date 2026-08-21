/**
 * ES M19 curriculum guard — the imperfect, and the aspect rule.
 *
 * The same contract every ES module carries (pathway resolution, unique step
 * ids, passive-card follow-up spacing, no explanation on passive steps, answer
 * leaks, full atom-surface coverage, graded-only mastery test), plus the four
 * guards this module's payload earns.
 *
 * m19.ts is GENERATED from `ir/m19.ir.yaml`, so a typo is not the risk. The
 * risk is subtler here than in any previous ES module, and it is worth naming:
 * **an aspect error is well-formed Spanish.** «Siempre hablé inglés» violates
 * nothing a parser could see. It has correct agreement, a real verb form, a
 * real time expression, and it is wrong — which means no gate the course
 * already owns can find it. The frame makes it unreachable by deriving the
 * tense from the marker; guard 1 below is what proves the frame is still doing
 * that, from the emitted file rather than from the frame's own logic.
 *
 *   1. **Marker and aspect agree, in every sentence.** The module's entire
 *      claim, checked against the compiled output.
 *   2. **Every sentence carries a marker at all.** Without one both tenses are
 *      correct and the step teaches nothing — which is a silent failure, not a
 *      visible one.
 *   3. **The accent pattern.** Every -ía form is written with it, in all five
 *      persons; of the -aba forms only nosotros is. A generator that dropped
 *      the tilde would produce «comia», which is a different word's shape.
 *   4. **All three irregulars ship, and no fourth one does.** The imperfect has
 *      exactly three. A module that invented a fourth — or that regularised
 *      one of the three into «*iba» → «*iaba» — would be teaching a language
 *      that does not exist.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M19_ATOMS, ES_M19_LESSONS } from "./m19";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { ES_MODULE_ORDER } from "../grammarHelpers";

/** The markers that demand each aspect. These are RESTATED here on purpose:
 *  reading them off `frames-es-m19.mjs` would make the guard agree with the
 *  generator by construction, which is the one thing it must not do. */
const HABITUAL = [
  "siempre",
  "a veces",
  "nunca",
  "todos los días",
  "por la mañana",
  "por la tarde",
  "por la noche",
];
const PUNCTUAL = [
  "ayer",
  "anoche",
  "anteayer",
  "la semana pasada",
  "el mes pasado",
  "el año pasado",
];

/** Imperfect endings, in the only two sets Spanish has: `-aba…` for -ar,
 *  `-ía…` for -er and -ir. ver's «veía…» is covered by the second set. */
const IMPERFECT_ENDING = /(aba|abas|ábamos|aban|ía|ías|íamos|ían)$/;

/**
 * ir and ser fit NEITHER set — «iba» is not «*iaba» and «era» is not «*seía».
 * They are listed rather than pattern-matched, because the whole point of an
 * irregular is that no pattern reaches it, and a regex loose enough to admit
 * «iba» would also admit forms that are simply wrong.
 *
 * This was found by the guard failing on «yo iba al parque todos los días» — a
 * correct sentence that the check called an aspect error. Widening the corpus
 * is what surfaced it; the narrow version never saw an ir sentence at all.
 */
const IRREGULAR_IMPERFECT = new Set([
  "iba", "ibas", "íbamos", "iban",
  "era", "eras", "éramos", "eran",
]);

const isImperfect = (verb: string) =>
  IRREGULAR_IMPERFECT.has(verb) || IMPERFECT_ENDING.test(verb);

/**
 * Every Spanish sentence the module renders, with the step that carries it.
 *
 * The field name is NOT uniform across step types, and assuming it was is how
 * the first version of this file shipped a guard that looked thorough and read
 * almost nothing: it collected `audioText`, which only `particle_cloze`
 * carries at runtime, so the aspect check saw four sentences out of ~50 and
 * passed a module with a marker deliberately stripped out of it. The list
 * below is taken from the compiled steps' own keys.
 *
 * `translate` stores its answer set accent-first — `acceptedAnswers[0]` is the
 * properly accented form and the later entries are the de-accented variants
 * the ES engine accepts from a US keyboard. Taking the whole array would feed
 * «comia» to an accent-sensitive check.
 */
function sentences(): { stepId: string; lessonId: string; es: string }[] {
  const out: { stepId: string; lessonId: string; es: string }[] = [];
  for (const lesson of ES_M19_LESSONS) {
    for (const step of lesson.steps) {
      const s = step as Record<string, unknown>;
      const candidates = [
        s.audioText, // particle_cloze
        s.targetSentence, // build_sentence, listening_build
        s.targetPhrase, // speaking
        s.transcript, // listening_comprehension
        Array.isArray(s.acceptedAnswers) ? s.acceptedAnswers[0] : undefined, // translate
      ];
      for (const es of candidates) {
        if (typeof es === "string" && es.includes(" ")) {
          out.push({ stepId: step.id, lessonId: lesson.id, es });
        }
      }
    }
  }
  return out;
}

/** The conjugated verb of a sentence: the word after the subject pronoun, or
 *  after the pre-verbal frequency adverb when one is present. */
function verbOf(es: string): string {
  const w = es.replace(/\.$/, "").split(" ");
  let i = 1; // [0] is always the subject pronoun
  // «a veces» and «todos los días» are multi-word; only the single-word
  // frequency adverbs can sit between the pronoun and the verb.
  if (["siempre", "nunca"].includes(w[i])) i += 1;
  else if (w[i] === "a" && w[i + 1] === "veces") i += 2;
  return w[i] ?? "";
}

describe("ES M19 curriculum", () => {

  // NOTE: there is deliberately no "M19 pathway node resolves" test here, the
  // way m18.test.ts has one. m19 is not on the ES learn map yet — that is a
  // live-gating decision, not an authoring one — so `getMockCourse("es")` has
  // no m19 module to walk. What CAN be asserted now is that every lesson is
  // registered in the shared content index, which is what the map would look
  // its ids up in; the day m19 is gated on, the pathway test is one paste away.

  it("listening steps are sentence-level (m5+ ratchet)", () => {
    for (const lesson of ES_M19_LESSONS) {
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

  it("registers 29 atoms, all fromModule m19", () => {
    expect(ES_M19_ATOMS.length).toBe(29);
    expect(ES_M19_ATOMS.every((a) => a.fromModule === "m19")).toBe(true);
  });

  // ── guard 1 — THE MODULE ──────────────────────────────────────────────────
  it("every sentence's aspect agrees with its time marker", () => {
    const bad: string[] = [];
    for (const { stepId, es } of sentences()) {
      const hab = HABITUAL.find((m) => es.includes(m));
      const pun = PUNCTUAL.find((m) => es.includes(m));
      // «por la noche» contains no punctual marker and «anoche» is not a
      // substring of it, so the two sets cannot both match — but if a future
      // marker made them overlap, that ambiguity is itself the bug.
      if (hab && pun) {
        bad.push(`${stepId}: "${es}" carries both "${hab}" and "${pun}"`);
        continue;
      }
      const verb = verbOf(es);
      if (hab && !isImperfect(verb)) {
        bad.push(`${stepId}: "${es}" — "${hab}" demands the imperfect, got "${verb}"`);
      }
      if (pun && isImperfect(verb)) {
        bad.push(`${stepId}: "${es}" — "${pun}" demands the preterite, got "${verb}"`);
      }
    }
    expect(bad, bad.join("\n")).toEqual([]);
  });

  // ── guard 2 ───────────────────────────────────────────────────────────────
  it("every sentence carries a time marker", () => {
    const all = [...HABITUAL, ...PUNCTUAL];
    const naked = sentences()
      .filter(({ es }) => !all.some((m) => es.includes(m)))
      .map(({ stepId, es }) => `${stepId}: "${es}"`);
    // A sentence with no marker is the silent failure this module cannot
    // tolerate: BOTH tenses are correct for it, so the step is asking the
    // learner a question that has two right answers.
    expect(naked, naked.join("\n")).toEqual([]);
  });

  // ── guard 3 ───────────────────────────────────────────────────────────────
  it("every -ía imperfect is written with its accent, and only nosotros is in the -aba set", () => {
    const surfaces = ES_M19_ATOMS.map((a) => a.surface);

    // The -er/-ir set: an accent in all five persons, because without it the
    // i and a collapse into one syllable («gracias» has two, «comía» has three).
    const iaForms = surfaces.filter((s) => /(ia|ía|ias|ías|iamos|íamos|ian|ían)$/.test(s));
    expect(iaForms.length).toBeGreaterThan(6);
    for (const s of iaForms) {
      expect(/[íáéóú]/.test(s), `'${s}' is an -ía imperfect written without its accent`).toBe(
        true,
      );
    }

    // The -ar set: nosotros ONLY. Its stress falls three syllables from the end,
    // which Spanish always writes; the other four cells need nothing.
    const abaForms = surfaces.filter((s) => /(aba|abas|ábamos|abamos|aban)$/.test(s));
    expect(abaForms.length).toBeGreaterThan(3);
    for (const s of abaForms) {
      const isNosotros = /[áa]bamos$/.test(s);
      expect(
        /[áéíóú]/.test(s),
        `'${s}' ${isNosotros ? "is the nosotros cell and must carry an accent" : "must NOT carry an accent"}`,
      ).toBe(isNosotros);
    }
  });

  // ── guard 4 ───────────────────────────────────────────────────────────────
  it("ships all three irregular imperfects and regularises none of them", () => {
    const surfaces = new Set(ES_M19_ATOMS.map((a) => a.surface));
    // ser, ir and ver are the complete list — there is no fourth irregular
    // imperfect in Spanish, and each of these is unpredictable from its
    // infinitive, so each has to be taught rather than derived.
    for (const s of ["era", "iba", "veía"]) {
      expect(surfaces.has(s), `the irregular imperfect '${s}' is not registered`).toBe(true);
    }
    // The regularised forms a generator that lost the irregular table would
    // emit. None may appear anywhere in the module, including as a distractor:
    // a wrong form the learner is asked to REJECT is fine, but these are wrong
    // in a way that looks right, and the module never uses them that way.
    // Matched as WHOLE WORDS, not substrings. The first version of this check
    // used `corpus.includes` and fired on «estudiaba», which contains "iaba" —
    // the guard failing the module for a form that is perfectly correct.
    const corpusWords = new Set(
      ES_M19_LESSONS.map((l) => JSON.stringify(l.steps))
        .join("\n")
        .toLowerCase()
        .split(/[^a-záéíóúñü]+/)
        .filter(Boolean),
    );
    // FULL PARADIGMS of each regularisation, not one sample form each. The
    // first version listed «iaba» alone and passed a corpus containing
    // «iabas» — which guard 1 also waves through, because it ends in -abas and
    // therefore looks like a perfectly ordinary -ar imperfect. A wrong form
    // that pattern-matches as right is exactly what this guard is for, so the
    // list has to be complete rather than representative.
    const REGULARISED = [
      // ser conjugated as if it were a regular -er verb
      "seía", "seías", "seíamos", "seían",
      // ir conjugated as if it were a regular -ir verb
      "iía", "iías", "iíamos", "iían",
      // ir conjugated as if its infinitive ended in -ar
      "iaba", "iabas", "iábamos", "iabamos", "iaban",
      // ver with its stem e eaten by the ending, which is the one thing that
      // makes it irregular at all
      "vía", "vías", "víamos", "vían",
    ];
    for (const wrong of REGULARISED) {
      expect(corpusWords.has(wrong), `regularised form '${wrong}' appears in M19`).toBe(false);
    }
  });
});

// ── Shared per-module structure lints (subsume the old hand-copied
// boilerplate this file carried until 2026-08-19) ──────────────────────────
registerEsModuleContentLints({
  moduleId: "m19",
  lessons: ES_M19_LESSONS,
  atoms: ES_M19_ATOMS,
});

// ── ES authoring bar (Track B, 2026-08-19) ─────────────────────────────────
// m19 was IR-authored against es-quality but predates this bar file; any
// debt below is measured, pinned, and SHRINK-ONLY.
registerEsModuleBarGuards({
  moduleLabel: "m19",
  lessons: ES_M19_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m19")),
  debt: { unknownTokens: 48, nonIntroDebuts: 7, translateShare: 0.286 },
});
