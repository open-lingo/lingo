#!/usr/bin/env node
/**
 * assemble-es-m17.mjs — turn the drafted sentence pool into `curriculum/m17.ts`.
 *
 *   node scripts/draft/draft.mjs es-a2:m17 --rounds 60 --n 20 --duty 0.8
 *   node scripts/draft/assemble-es-m17.mjs > src/features/languages/es/curriculum/m17.ts
 *
 * ES has no IR compiler — that port is still an open decision
 * (`es-authoring-scope-2026-08-09.md` §8.2) — so the pipeline's last mile is
 * this: a script that emits the same hand-authored TS shape every other ES
 * module ships, from a pool the local model chose and the frame built.
 *
 * The PEDAGOGY lives here in literals, because it is judgment: the lesson arc,
 * the atom allocation, the contrast each lesson turns on, the two
 * selfExplains, every info card. Everything downstream of that is mechanical.
 *
 * Nothing emitted is sampled. Every Spanish string traces to `morph-es.mjs`;
 * every English one to the frame's own tables. A form the pool failed to cover
 * is FRAME-FILLED and reported on stderr rather than silently dropped, because
 * a pipeline that quietly substitutes its own output stops being measurable.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { es_m17, loadNouns } from "./frames-es-a2.mjs";
import { conjugate, EN_SUBJECT } from "./morph-es.mjs";

const here = dirname(fileURLToPath(import.meta.url));
await loadNouns("m16");
const pool = JSON.parse(await readFile(join(here, "drafts/es-m17.json"), "utf8")).picks;

const frameFilled = [];
const used = new Set();

/** A drafted sentence for this exact (verb, person), never reused, preferring
 *  the richest one available (object + time marker). */
function pick(verb, person, want = {}) {
  const score = (p) => (p.object ? 1 : 0) + (p.time ? 1 : 0);
  const cands = pool
    .filter((p) => p.verb === verb && p.person === person && !used.has(p.es))
    .filter((p) => (want.object === undefined ? true : Boolean(p.object) === want.object))
    .filter((p) => (want.time === undefined ? true : Boolean(p.time) === want.time))
    .filter((p) => (want.timeIs === undefined ? true : p.time === want.timeIs))
    .filter((p) => (want.objectIs === undefined ? true : p.object === want.objectIs))
    .sort((a, b) => score(b) - score(a));
  if (cands.length) {
    used.add(cands[0].es);
    return cands[0];
  }
  const objs = es_m17.objectsByVerb[verb] ?? [];
  const built = es_m17.build({
    person,
    verb,
    object: want.object === false ? null : (want.objectIs ?? objs[0] ?? null),
    time: want.time === false ? null : (want.timeIs ?? "ayer"),
  });
  frameFilled.push(`${verb}.${person}`);
  used.add(built.es);
  return built;
}

const q = (s) => JSON.stringify(s);
const bare = (s) => s.replace(/\.$/, "");
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const deaccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** translate accepts the sentence with and without accents, capitalised or
 *  not. The ES engine's accent policy is accept-but-flag; a learner on a US
 *  keyboard must never be graded wrong for a missing á. */
const accepted = (es) => [...new Set([lower1(bare(es)), bare(es), deaccent(lower1(bare(es))), deaccent(bare(es))])];

const words = (es) => bare(es).split(" ");

/**
 * A build tile that is ALSO an answer token oversupplies that token, and
 * `buildTileFloor` fails the whole suite for it — correctly: the learner is
 * handed two «escribimos» tiles and only one slot. Emitting it is an authoring
 * mistake, so this throws at generate time rather than shipping a step that
 * cannot be assembled as intended.
 */
function checkDistractors(id, es, distractors) {
  const answer = new Set(words(es).map(lower1));
  const collide = distractors.filter((d) => answer.has(lower1(d)));
  if (collide.length) {
    throw new Error(
      `${id}: distractor tile(s) ${collide.join(", ")} already appear in the answer "${bare(es)}"`,
    );
  }
  return distractors;
}

/** Atom surfaces a sentence exercises: its conjugated verb, its object noun,
 *  and its time marker. All three are registered atoms by the time the module
 *  loads — the verb form in m17, the noun in m1–m16, the marker in m17. */
const exercised = (p) => [p.conj, p.object, p.time].filter(Boolean);

/**
 * Distractors for a listening step: the SAME event with exactly one thing
 * moved — the person, the tense, or the object. Three unrelated sentences
 * would let a learner pass by spotting one content word; these force an actual
 * parse, which is the First Noun Principle finding the SLA pass turned up.
 * Built through `frame.build`, so a distractor is never ungrammatical English.
 */
function listeningDistractors(p) {
  const cands = [];
  const push = (o) => {
    try {
      const en = es_m17.build({ ...p, ...o }).en;
      if (en !== p.en && !cands.includes(en)) cands.push(en);
    } catch {
      /* an unbuildable variant is simply not a candidate */
    }
  };
  const persons = ["yo", "tu", "el", "nosotros", "ustedes"].filter((x) => x !== p.person);
  const objs = (es_m17.objectsByVerb[p.verb] ?? []).filter((o) => o !== p.object);
  const times = es_m17.time.map((t) => t.es).filter((t) => t !== p.time);

  // One thing moved, in order of how instructive the confusion is.
  for (const person of persons) push({ person });
  for (const object of objs.slice(0, 3)) push({ object });
  for (const time of times.slice(0, 3)) push({ time });
  // Two things moved, only if the single-change variants ran out (an
  // intransitive verb with no time marker has few neighbours).
  for (const person of persons) for (const time of times.slice(0, 2)) push({ person, time });

  if (cands.length < 3) {
    throw new Error(`listeningDistractors: only ${cands.length} for "${p.es}" — the frame has no third neighbour`);
  }
  // Deterministic spread rather than the first three, so a lesson's listening
  // steps do not all contrast on the person slot.
  const step = Math.max(1, Math.floor(cands.length / 3));
  return [cands[0], cands[step] ?? cands[1], cands[step * 2] ?? cands[2]];
}

/**
 * Wrong-form distractors for "pick the preterite". Every one is a REAL form of
 * the SAME verb: the present of the same person (which for -ar yo/él is the
 * accent minimal pair hablo/habló), another person's preterite, and the
 * infinitive. A distractor the learner could plausibly have produced beats a
 * distractor that is merely wrong.
 */
function formDistractors(verb, person) {
  const right = conjugate(verb, person, "preterite");
  const others = ["yo", "tu", "el", "nosotros", "ustedes"].filter((x) => x !== person);
  const set = new Set([conjugate(verb, person, "present"), conjugate(verb, others[0], "preterite"), verb]);
  set.delete(right);
  const out = [...set];
  for (const o of others) {
    if (out.length >= 3) break;
    const f = conjugate(verb, o, "preterite");
    if (f !== right && !out.includes(f)) out.push(f);
  }
  for (const o of others) {
    if (out.length >= 3) break;
    const f = conjugate(verb, o, "imperfect");
    if (f !== right && !out.includes(f)) out.push(f);
  }
  return out.slice(0, 3);
}

// ─── step emitters ──────────────────────────────────────────────────────────

const S = {
  info: (id, title, body, variant = "grammar") =>
    `    infoStep(\n      ${q(id)},\n      ${q(title)},\n      ${q(body)},\n      ${q(variant)},\n    ),`,

  phrase: (id, meaning, text) => `    vocab(${q(id)}, ${q(meaning)}, ${q(text)}),`,

  formMcq: (id, verb, person, why) => {
    const right = conjugate(verb, person, "preterite");
    const [d1, d2, d3] = formDistractors(verb, person);
    return `    sentenceMcq({\n      id: ${q(id)},\n      prompt: ${q(`Pick the ${person === "tu" ? "tú" : person === "el" ? "él/ella" : person} preterite of ${verb}.`)},\n      correctText: ${q(right)},\n      distractorsText: [${q(d1)}, ${q(d2)}, ${q(d3)}],\n      explanation: ${q(why)},\n      exercisedAtomSurfaces: [${q(right)}],\n    }),`;
  },

  build: (id, p, distractors) =>
    (checkDistractors(id, p.es, distractors),
    `    build(\n      ${q(id)},\n      ${q(`Build: '${p.en.replace(/\.$/, "")}'`)},\n      ${q(bare(p.es).toLowerCase() === bare(p.es) ? bare(p.es) : lower1(bare(p.es)))},\n      [${[...words(p.es).map(lower1), ...distractors].map(q).join(", ")}],\n      [${words(p.es).map(lower1).map(q).join(", ")}],\n      [${exercised(p).map(q).join(", ")}],\n    ),`),

  translate: (id, p) =>
    `    translateStep({\n      id: ${q(id)},\n      promptEn: ${q(p.en)},\n      acceptedAnswers: [${accepted(p.es).map(q).join(", ")}],\n      audioText: ${q(lower1(bare(p.es)))},\n      exercisedAtomSurfaces: [${exercised(p).map(q).join(", ")}],\n    }),`,

  speaking: (id, p) =>
    `    speaking(${q(id)}, ${q(lower1(bare(p.es)))}, ${q(bare(p.en))}, [${exercised(p).map(q).join(", ")}]),`,

  cloze: (id, p, why) => {
    const w = words(p.es);
    const i = w.indexOf(p.conj);
    const before = w.slice(0, i).join(" ") + (i > 0 ? " " : "");
    const after = (i < w.length - 1 ? " " : "") + w.slice(i + 1).join(" ") + ".";
    const [d1, d2, d3] = formDistractors(p.verb, p.person);
    return `    cloze(\n      ${q(id)},\n      ${q(before)},\n      ${q(after)},\n      ${q(p.conj)},\n      [${[p.conj, d1, d2, d3].map(q).join(", ")}],\n      ${q(bare(p.en))},\n      ${q(lower1(bare(p.es)))},\n      ${q(why)},\n      [${exercised(p).map(q).join(", ")}],\n    ),`;
  },

  listenComp: (id, p) => {
    const [d1, d2, d3] = listeningDistractors(p);
    return `    listeningCompSentence({\n      id: ${q(id)},\n      audioText: ${q(lower1(bare(p.es)))},\n      correctMeaningEn: ${q(bare(p.en))},\n      distractorsEn: [${q(bare(d1))}, ${q(bare(d2))}, ${q(bare(d3))}],\n      exercisedAtomSurfaces: [${exercised(p).map(q).join(", ")}],\n    }),`;
  },

  listenBuild: (id, p, distractors) =>
    (checkDistractors(id, p.es, distractors),
    `    listeningBuildSentence({\n      id: ${q(id)},\n      target: ${q(lower1(bare(p.es)))},\n      tiles: [${[...words(p.es).map(lower1), ...distractors].map(q).join(", ")}],\n      correctOrder: [${words(p.es).map(lower1).map(q).join(", ")}],\n      promptEn: ${q(bare(p.en))},\n      exercisedAtomSurfaces: [${exercised(p).map(q).join(", ")}],\n    }),`),

  textMcq: (id, target, distractors, prompt) =>
    `    vocabTextMcq(${q(id)}, ${q(target)}, [${distractors.map(q).join(", ")}]${prompt ? `, ${q(prompt)}` : ""}),`,

  /** Generic four-way sentence choice — used for the accent minimal pairs,
   *  where the "distractors" are the SAME sentence in the present tense and
   *  the whole exercise is whether the learner reads the accent. */
  mcq: (id, prompt, correct, distractors, why, atoms) =>
    `    sentenceMcq({\n      id: ${q(id)},\n      prompt: ${q(prompt)},\n      correctText: ${q(correct)},\n      distractorsText: [${distractors.map(q).join(", ")}],\n      explanation: ${q(why)},\n      exercisedAtomSurfaces: [${atoms.map(q).join(", ")}],\n    }),`,

  match: (id, surfaces) => `    matchPairs(${q(id)}, [${surfaces.map(q).join(", ")}]),`,

  reviewMatch: (id, seed) => `    reviewMatchPairs(${q(id)}, ${q(seed)}, "m17", 6),`,

  capstoneMatch: (id, entries) =>
    `    capstoneMatchPairs(${q(id)}, [\n${entries.map((e) => `      { surface: ${q(e.surface)}, gloss: ${q(e.gloss)} },`).join("\n")}\n    ]),`,

  selfExplain: (o) =>
    `    selfExplain({\n      id: ${q(o.id)},\n      anchorLabel: ${q(o.anchorLabel)},\n      anchorAudioText: ${q(o.anchorAudioText)},\n      question: ${q(o.question)},\n      rule: { text: ${q(o.rule)} },\n      surface: { text: ${q(o.surface)} },\n      distractor: { text: ${q(o.distractor)} },\n      ruleExplanation: ${q(o.ruleExplanation)},\n    }),`,
};

export { pick, S, q, bare, lower1, frameFilled, exercised };
