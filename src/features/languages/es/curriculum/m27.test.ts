/**
 * ES M27 curriculum guard — «Hace sol, hace frío», seven new weather words
 * (el sol/la lluvia/el viento/la nieve/nublado/el calor/el frío). Sonnet-
 * drafted lessons, Fable spine + pins (2026-09-10). Shared lints at ZERO
 * debt + shared doctrine pins + module-bespoke lanes below. Unlike
 * m22/m24/m26 (verb-paradigm waves), this module registers ZERO new verb
 * atoms and ZERO new grammar — every frame (hace/hacía, hay, está/estaba,
 * me gusta) is PRIOR; pin E12 does not apply. This module's own signature:
 * seven vocab nouns/adjective slot into three already-taught impersonal
 * frames, «hace»→calor/frío, «hay»→sol/lluvia/viento/nieve, «está»→nublado
 * (the only one that never takes «hay» or «hace»), recombined against the
 * PRIOR imperfect (m24/m26) and porque/por eso (m25) across L6-L10.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M27_ATOMS, ES_M27_LESSONS, ES_M27_PLACEMENT, ES_M27_CHECKPOINT_INDEX } from "./m27";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m27",
  lessons: ES_M27_LESSONS,
  atoms: ES_M27_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m27",
  lessons: ES_M27_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m27")),
});

registerEsDoctrinePins({
  moduleId: "m27",
  lessons: ES_M27_LESSONS,
  checkpointIndex: ES_M27_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m27", ES_M27_LESSONS, ES_M27_ATOMS);

const getLesson = (n: number) => ES_M27_LESSONS[n - 1].steps;
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
      // multiple_choice (sentenceMcq/mcq IR): the CORRECT option is the graded
      // answer position — distractors are foils, not taught surfaces (see
      // "grade answers, not every string").
      if (s.type === "multiple_choice") {
        const options = (rec.options as Array<{ id: string; text: string }>) ?? [];
        const correctOptionId = rec.correctOptionId as string | undefined;
        const correct = options.find((o) => o.id === correctOptionId)?.text;
        if (correct) out.push({ id: s.id, text: correct });
      }
      // match_pairs (matchLit IR): each pair's Spanish `source` is a graded
      // recognition target, not a foil.
      if (s.type === "match_pairs") {
        const pairs = (rec.pairs as Array<{ source: string }>) ?? [];
        for (const p of pairs) if (p.source) out.push({ id: s.id, text: p.source });
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
 * per m25/m26.test.ts's own precedent, "info-card/hint prose may still name a
 * banned form for teaching purposes" (e.g. L6's own info card explicitly
 * teaches "no «nublada», no «nublados»" to explain the invariable rule — that
 * mention must not itself trip the ban). Bans that must hold even as a
 * tile/distractor/option foil should still fail on those; bans on live
 * production should not fire on legitimate teaching prose.
 */
const PROSE_FIELD_RE = /\.(explanation|why|body|revealNote|gloss|replyGloss|description|title|setting)$/;
function allPrintedStringsNoProse(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  return allPrintedStrings(nums).filter(({ id }) => !PROSE_FIELD_RE.test(id));
}

/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 7 new atoms this module registers. */
const ALL_ATOMS = ES_M27_ATOMS.map((a) => a.surface);

/** Which lesson each atom is expected to debut in (one map/imageMcq-or-info per lesson, L1-L6). */
const DEBUT_LESSON: Record<string, number> = {
  "el sol": 1,
  "la lluvia": 2,
  "el viento": 3,
  "la nieve": 3,
  "el calor": 4,
  "el frío": 5,
  nublado: 6,
};

/** Invented weather-verb forms this module deliberately never teaches (hard rule 3) — llover/nevar conjugations, and "soleado" as an alternate adjective for sunny. Must never appear anywhere, including as a tile/distractor/option/goal foil. */
const INVENTED_WEATHER_VERBS = ["llueve", "nieva", "lloviendo", "nevando", "soleado"];

describe("ES m27 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M27_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M27_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M27_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 7 new atoms — el sol, la lluvia, el viento, la nieve, nublado, el calor, el frío", () => {
    const expected = ["el sol", "la lluvia", "el viento", "la nieve", "nublado", "el calor", "el frío"];
    expect(ALL_ATOMS.sort()).toEqual(expected.sort());
  });

  it("this module registers ZERO new verb atoms — pin E12 (verb-paradigm) does not apply; every atom is a noun or the one invariable adjective «nublado»", () => {
    for (const a of ES_M27_ATOMS) {
      expect(["noun", "adjective"], `${a.surface}: unexpected part of speech for a weather-vocab module`).toContain(a.partOfSpeech);
    }
  });

  it("every new atom debuts on an intro-capable step (word_map does not count), and every debut lands in L1-L6 (the six debut lessons); L7-L10 introduce zero new atoms", () => {
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
      if (found!.lesson > 6) bad.push(`«${w}» first debuts at L${found!.lesson}, outside the L1-L6 debut window`);
      const expectedLesson = DEBUT_LESSON[w];
      if (expectedLesson !== undefined && found!.lesson !== expectedLesson) {
        bad.push(`«${w}» debuts at L${found!.lesson}, expected L${expectedLesson}`);
      }
    }
    expect(bad, `atom debut violation:\n${bad.join("\n")}`).toEqual([]);
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

  it("recall floor (ground truth read from the compiled module): L1 zero; L2-L5, L7, L9 carry ≥1; L6, L8, L10 carry ≥2", () => {
    const recallCount = (n: number) => getLesson(n).filter((s) => (s as unknown as Record<string, unknown>).cue === "recall").length;
    expect(recallCount(1), "L1 must carry zero recalls — nothing earlier in this module to recall").toBe(0);
    for (const n of [2, 3, 4, 5, 7, 9]) {
      expect(recallCount(n), `L${n} must carry ≥1 recall`).toBeGreaterThanOrEqual(1);
    }
    for (const n of [6, 8, 10]) {
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

  it("«cuando» (conjunction) is never confused with «¿cuándo?» (the fixed standalone question phrase, PRIOR m8) — «cuándo» with an accent only ever appears as the exact phrase «¿cuándo?»", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      if (!/cuándo/.test(t)) continue;
      if (!/¿cuándo\?/.test(t)) bad.push(`${id}: «${text}» — accented «cuándo» used outside the fixed «¿cuándo?» phrase`);
    }
    expect(bad, `«cuándo» misuse:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: porque-spelling discipline carried (this module doesn't teach porque/por eso, but exercises them via recombination from L6 on) — «por qué» / «porqué» / bare two-word «por que» never appear anywhere", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      if (/por qué|porqué/.test(t)) bad.push(`${id}: «${text}»`);
      if (/\bpor que\b/.test(t)) bad.push(`${id}: «${text}» (bare "por que")`);
    }
    expect(bad, `accidental por-qué spelling in graded content:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: no invented weather-verb forms anywhere (including tiles/distractors/options/goal) — llueve/nieva/lloviendo/nevando/soleado are deliberately never taught (hard rule 3)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      const m = t.match(anyWord(INVENTED_WEATHER_VERBS));
      if (m) bad.push(`${id}: invented weather-verb form «${m[2]}» in «${text}»`);
    }
    expect(bad, `invented weather-verb form printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: no bare «qué» — a standalone «qué» token never appears outside the fixed «¿qué es?» substring", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      if (!word("qué").test(t)) continue;
      const withoutFixed = t.replace(/¿qué es\?/g, "");
      if (word("qué").test(withoutFixed)) bad.push(`${id}: bare «qué» outside «¿qué es?» in «${text}»`);
    }
    expect(bad, `bare «qué» usage:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: «el tiempo» never appears (either gender) — this module never needs the weather-as-noun word, only the impersonal idioms", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      if (/\b(el|la)\s+tiempo\b/.test(t)) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `«el tiempo» / «la tiempo» usage:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: calor/frío stay in a taught slot — every answer-position use of «calor»/«frío» sits adjacent to «hace»/«hacía» (the impersonal weather idiom) OR is the direct object of «gusta»/«gustan» (PRIOR m7/m13 gustar-object pattern, e.g. «me gusta el calor») — never a free adjective describing a different noun", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase();
      for (const w of ["calor", "frío"]) {
        if (!word(w).test(t)) continue;
        // A bare vocabulary answer ("el calor"/"el frío" alone, with no
        // other words) is a word-meaning check (mcq "which one means...",
        // textMcq, matchLit pairing), not a sentence — there's no clause for
        // the word to sit "outside" of, so it can't be a free adjective
        // describing a different noun. Exempt it.
        if (/^(el|la)?\s*(calor|frío)$/.test(t.trim())) continue;
        // adjacency check: within the same clause, "hace"/"hacía" OR
        // "gusta"/"gustan" must appear somewhere before the word (allowing
        // intervening adverbs like "mucho", "un poco de", "no", "el"/"la")
        // and no other clause boundary (,/pero/y) between them.
        const idx = t.search(word(w));
        const clauseStart = Math.max(t.lastIndexOf(",", idx), t.lastIndexOf(" pero ", idx), t.lastIndexOf(" y ", idx), 0);
        const clause = t.slice(clauseStart, idx + w.length + 2);
        if (!/\bhac(e|ía)\b/.test(clause) && !/\bgusta(n)?\b/.test(clause)) {
          bad.push(`${id}: «${text}» — «${w}» not adjacent to hace/hacía nor object of gusta/gustan`);
        }
      }
    }
    expect(bad, `calor/frío outside the taught slots:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: nublado stays impersonal — «nublada»/«nublados»/«nubladas» never appear in graded production (teaching prose explaining the rule is exempt)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStringsNoProse()) {
      const t = text.toLowerCase();
      const m = t.match(anyWord(["nublada", "nublados", "nubladas"]));
      if (m) bad.push(`${id}: «${m[2]}» in «${text}»`);
    }
    expect(bad, `agreed/pluralized «nublado» in graded content:\n${bad.join("\n")}`).toEqual([]);
  });

  it("CARRY PIN: no ☀️ anywhere in this module's imageMcq/audioWimcq pools (both compile to `word_image_mcq`) — ☀️ stays exclusively PRIOR («buenas tardes»); this module's sun atom uses 🌞", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "word_image_mcq") continue;
        const blob = JSON.stringify(s);
        if (blob.includes("☀️")) bad.push(`${s.id}: ☀️ found in a word_image_mcq pool`);
      }
    }
    expect(bad, `☀️ collision in imageMcq/audioWimcq pool:\n${bad.join("\n")}`).toEqual([]);
  });

  it("all 7 new atoms use their assigned emoji, none reuse ☀️, and none collide with a PRIOR emoji already used by an earlier module's atom", () => {
    const EXPECTED_EMOJI: Record<string, string> = {
      "el sol": "🌞",
      "la lluvia": "🌧️",
      "el viento": "💨",
      "la nieve": "❄️",
      nublado: "☁️",
      "el calor": "🥵",
      "el frío": "🥶",
    };
    for (const a of ES_M27_ATOMS) {
      expect(a.emoji, `${a.surface}: missing emoji`).toBe(EXPECTED_EMOJI[a.surface]);
      expect(a.emoji, `${a.surface}: must not reuse ☀️ (PRIOR, «buenas tardes»)`).not.toBe("☀️");
    }
  });
});
