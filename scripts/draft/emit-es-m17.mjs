#!/usr/bin/env node
/**
 * emit-es-m17.mjs — the PEDAGOGY layer of the m17 build.
 *
 *   node scripts/draft/emit-es-m17.mjs > src/features/languages/es/curriculum/m17.ts
 *
 * Everything the local model cannot be trusted with lives here as literals:
 * the lesson arc, the atom allocation, which contrast each lesson turns on,
 * every info card, both selfExplains. The drafted pool supplies sentences and
 * nothing else.
 */
import { pick, S, q, frameFilled } from "./assemble-es-m17.mjs";
import { conjugate } from "./morph-es.mjs";

const out = [];
const w = (s) => out.push(s);

// ─── atom allocation (the spine, as literals) ───────────────────────────────

const ATOMS = [
  // L1 — -ar preterite opens the tier
  { s: "ayer", en: "yesterday", pos: "adverb", kind: "vocab" },
  { s: "anoche", en: "last night", pos: "adverb", kind: "vocab" },
  { s: "hablé", en: "I spoke", pos: "verb", kind: "vocab" },
  { s: "hablaste", en: "you spoke", pos: "verb", kind: "vocab" },
  { s: "trabajé", en: "I worked", pos: "verb", kind: "vocab" },
  { s: "estudié", en: "I studied", pos: "verb", kind: "vocab" },
  // L2 — the rest of the -ar paradigm
  { s: "habló", en: "he/she spoke", pos: "verb", kind: "vocab" },
  { s: "hablamos", en: "we spoke", pos: "verb", kind: "vocab" },
  { s: "hablaron", en: "you all spoke", pos: "verb", kind: "vocab" },
  { s: "compré", en: "I bought", pos: "verb", kind: "vocab" },
  { s: "caminó", en: "he/she walked", pos: "verb", kind: "vocab" },
  { s: "bailaron", en: "you all danced", pos: "verb", kind: "vocab" },
  // L3 — -er
  { s: "comí", en: "I ate", pos: "verb", kind: "vocab" },
  { s: "comiste", en: "you ate", pos: "verb", kind: "vocab" },
  { s: "comió", en: "he/she ate", pos: "verb", kind: "vocab" },
  { s: "comimos", en: "we ate", pos: "verb", kind: "vocab" },
  { s: "comieron", en: "you all ate", pos: "verb", kind: "vocab" },
  { s: "aprendí", en: "I learned", pos: "verb", kind: "vocab" },
  // L4 — -ir
  { s: "escribí", en: "I wrote", pos: "verb", kind: "vocab" },
  { s: "escribiste", en: "you wrote", pos: "verb", kind: "vocab" },
  { s: "escribió", en: "he/she wrote", pos: "verb", kind: "vocab" },
  { s: "escribimos", en: "we wrote", pos: "verb", kind: "vocab" },
  { s: "escribieron", en: "you all wrote", pos: "verb", kind: "vocab" },
  { s: "recibí", en: "I received", pos: "verb", kind: "vocab" },
  // L5 — the accent contrast needs its own time markers, not its own verbs
  { s: "anteayer", en: "the day before yesterday", pos: "adverb", kind: "vocab" },
  { s: "la semana pasada", en: "last week", pos: "phrase", kind: "phrase" },
  // L6 — the far past
  { s: "el mes pasado", en: "last month", pos: "phrase", kind: "phrase" },
  { s: "el año pasado", en: "last year", pos: "phrase", kind: "phrase" },
  { s: "vendieron", en: "you all sold", pos: "verb", kind: "vocab" },
];

// ─── the 20-step topic template ─────────────────────────────────────────────
//
// Order is load-bearing and every constraint it satisfies is a live CI gate:
//   · no two adjacent steps share a `type` (es-quality)
//   · no run of 3+ selection steps (es-quality)
//   · ≥2 generation steps, ≥1 typed or spoken (es-quality)
//   · every phrase card is retrieved at i+1 AND again at i+2/i+3 — adjacent
//     retrieval alone is massed practice and the lint rejects it
//   · the closing `win` card has no graded step after it, which is the
//     terminal-outro exemption rather than an oversight
//
//   1 info · 2 card A1 · 3 mcq A1 · 4 build A1 · 5 card A2 · 6 cloze A2
//   7 translate A2 · 8 speaking X · 9 textMcq · 10 listenComp Y · 11 build Z
//   12 card A3 · 13 mcq A3 · 14 listenBuild A3 · 15 translate A3
//   16 speaking A1 · 17 selfExplain|textMcq · 18 reviewMatch · 19 speaking rev
//   20 info win

function topicLesson(spec) {
  const id = `es-m17-${spec.n}`;
  const steps = [];
  steps.push(S.info(`${id}-info`, spec.info.title, spec.info.body, "grammar"));

  const [A1, A2, A3] = spec.anchors;
  steps.push(S.phrase(`${id}-p-a1`, A1.en, A1.form));
  steps.push(S.formMcq(`${id}-q-a1`, A1.verb, A1.person, A1.why));
  steps.push(S.build(`${id}-b-a1`, A1.p, A1.tiles ?? [conjugate(A1.verb, "nosotros", "preterite")]));

  steps.push(S.phrase(`${id}-p-a2`, A2.en, A2.form));
  steps.push(S.cloze(`${id}-c-a2`, A2.p, A2.why));
  steps.push(S.translate(`${id}-tr-a2`, A2.p2 ?? A2.p));

  steps.push(S.speaking(`${id}-sp-x`, spec.extra.speaking));
  steps.push(S.textMcq(`${id}-tm-a2`, A2.form, spec.textMcqDistractors));
  steps.push(S.listenComp(`${id}-lc-y`, spec.extra.listen));
  steps.push(S.build(`${id}-b-z`, spec.extra.build, spec.extra.buildTiles ?? []));

  steps.push(S.phrase(`${id}-p-a3`, A3.en, A3.form));
  steps.push(S.formMcq(`${id}-q-a3`, A3.verb, A3.person, A3.why));
  steps.push(S.listenBuild(`${id}-lb-a3`, A3.p, A3.tiles ?? []));
  steps.push(S.translate(`${id}-tr-a3`, A3.p2 ?? A3.p));

  steps.push(S.speaking(`${id}-sp-a1`, A1.p2 ?? A1.p));
  steps.push(spec.seventeen);
  steps.push(S.reviewMatch(`${id}-rev-mp`, `${id}-rev-mp-seed`));
  steps.push(S.speaking(`${id}-sp-close`, spec.close));
  steps.push(S.info(`${id}-win`, spec.win.title, spec.win.body, "win"));
  return lesson(id, spec.title, spec.description, steps);
}

function lesson(id, title, description, steps) {
  return [
    `const ${id.toUpperCase().replace(/-/g, "_")}: LessonContent = {`,
    `  id: ${q(id)},`,
    `  moduleId: "m17",`,
    `  courseId: COURSE_ID,`,
    `  languageId: "es",`,
    `  title: ${q(title)},`,
    `  description: ${q(description)},`,
    `  estimatedMinutes: ${steps.length >= 18 ? 10 : 8},`,
    `  xpReward: 20,`,
    `  steps: [`,
    ...steps,
    `  ],`,
    `};`,
    ``,
  ].join("\n");
}

const anchor = (verb, person, en, why, opts = {}) => ({
  verb,
  person,
  en,
  why,
  form: conjugate(verb, person, "preterite"),
  p: pick(verb, person, opts.p ?? {}),
  p2: opts.second ? pick(verb, person, opts.second) : null,
  tiles: opts.tiles,
});

export { ATOMS, topicLesson, lesson, anchor, w, out, frameFilled };

// ─── the module ─────────────────────────────────────────────────────────────

const L1 = topicLesson({
  n: 1,
  title: "Ayer hablé — el pretérito de los verbos -ar",
  description: "Spanish has a tense for finished business. Say what you did yesterday.",
  info: {
    title: "A tense for things that are over",
    body:
      "Everything you have said so far happens now, or happens generally: hablo, trabajo, estudio. The pretérito is for what happened and finished — one event, done, boxed up. For -ar verbs you drop the -ar and add the ending: yo hablé, tú hablaste. Notice where the stress lands: habLÉ, not HAblo. That accent is not decoration — it is the whole difference, and Spanish writes it down for you.",
  },
  anchors: [
    anchor("hablar", "yo", "I spoke", "The yo preterite of an -ar verb is stem + -é, and the accent is written.", {
      p: { timeIs: "ayer" },
      second: {},
    }),
    anchor("hablar", "tu", "you spoke", "Tú takes -aste — no accent, because the stress already falls there.", {
      p: { timeIs: "anoche" },
      second: {},
    }),
    anchor("trabajar", "yo", "I worked", "Same ending on every regular -ar verb: trabaj- + -é.", {
      p: { object: false },
      second: { object: false },
    }),
  ],
  textMcqDistractors: ["hablé", "trabajé", "estudié"],
  extra: {
    speaking: pick("estudiar", "yo"),
    listen: pick("hablar", "yo", { object: true }),
    build: pick("estudiar", "yo", { time: true }),
    buildTiles: ["estudio"],
  },
  seventeen: S.textMcq("es-m17-1-tm-estudie", "estudié", ["hablé", "trabajé", "hablaste"]),
  close: pick("trabajar", "yo", { timeIs: "ayer" }),
  win: {
    title: "You can talk about yesterday",
    body: "Two endings — -é and -aste — and every regular -ar verb in the course just gained a past tense. That is roughly forty verbs from one pattern.",
  },
});

const L2 = topicLesson({
  n: 2,
  title: "Él habló — el resto del paradigma",
  description: "Three more endings finish the -ar preterite. One of them is a trap.",
  info: {
    title: "Finishing the -ar table",
    body:
      "él/ella habló, nosotros hablamos, ustedes hablaron. Two of those are easy. The third is the one to watch: hablamos is ALSO the present — we speak and we spoke are the same word, and only the sentence around it tells you which. Spanish is content to let context do that work, and after this lesson so are you.",
  },
  anchors: [
    anchor("hablar", "el", "he/she spoke", "él/ella takes -ó, with the accent on the ending — habló, not hablo.", {
      p: { object: true },
      second: {},
    }),
    anchor("hablar", "nosotros", "we spoke", "nosotros -ar preterite is -amos, spelled exactly like the present.", {
      p: { time: true },
      second: {},
    }),
    anchor("hablar", "ustedes", "you all spoke", "ustedes takes -aron.", { p: { time: true }, second: {} }),
  ],
  textMcqDistractors: ["habló", "hablaron", "hablé"],
  extra: {
    speaking: pick("comprar", "yo"),
    listen: pick("caminar", "el", { time: true }),
    build: pick("bailar", "ustedes"),
    buildTiles: ["bailamos"],
  },
  seventeen: S.selfExplain({
    id: "es-m17-2-self-explain",
    anchorLabel: "You just read hablamos twice — once meaning we speak, once meaning we spoke",
    anchorAudioText: "hablamos",
    question: "Why does Spanish let one word mean both we speak and we spoke?",
    rule: "The -ar nosotros ending is -amos in BOTH tenses, so the form is genuinely ambiguous and the time word or the surrounding sentence decides which reading is meant.",
    surface: "The accent mark tells them apart — one of them is hablámos.",
    distractor: "Only the present exists for nosotros; the preterite always uses a helping verb instead.",
    ruleExplanation:
      "Regular -ar verbs collapse the two nosotros forms (hablamos / hablamos). -er and -ir verbs do NOT — comemos vs comimos, which is the next lesson. When it matters, Spanish adds ayer or anoche and the ambiguity disappears.",
  }),
  close: pick("comprar", "yo", { time: true }),
  win: {
    title: "The whole -ar table",
    body: "Five endings: -é, -aste, -ó, -amos, -aron. You have also met the first genuine ambiguity in the language and learned that Spanish solves it with a time word rather than a new form.",
  },
});

const L3 = topicLesson({
  n: 3,
  title: "Comí y bebí — el pretérito de los verbos -er",
  description: "-er verbs take a different set of endings. Only one of them will surprise you.",
  info: {
    title: "One table for -er",
    body:
      "comí, comiste, comió, comimos, comieron. The vowel changes from a to i, and the accents move to match: comÍ, comiÓ. Here is the payoff for last lesson's ambiguity — comemos is we eat and comimos is we ate. Different words. -er verbs keep the two tenses apart where -ar verbs do not.",
  },
  anchors: [
    anchor("comer", "yo", "I ate", "The yo preterite of an -er verb is stem + -í.", { p: { object: true }, second: {} }),
    anchor("comer", "tu", "you ate", "tú takes -iste, the same ending -ir verbs use.", { p: { object: true }, second: {} }),
    anchor("comer", "el", "he/she ate", "él/ella takes -ió, accent on the ending.", { p: { object: true }, second: {} }),
  ],
  textMcqDistractors: ["comí", "comió", "comieron"],
  extra: {
    speaking: pick("aprender", "yo"),
    listen: pick("comer", "ustedes", { object: true }),
    build: pick("comer", "nosotros", { object: true }),
    buildTiles: ["comemos"],
  },
  seventeen: S.selfExplain({
    id: "es-m17-3-self-explain",
    anchorLabel: "Last lesson hablamos meant both tenses. This lesson comimos meant only one",
    anchorAudioText: "comemos... comimos",
    question: "Why do -er verbs keep we eat and we ate apart when -ar verbs do not?",
    rule: "The -er present nosotros ending is -emos and the preterite one is -imos, so the two forms differ by a vowel; the -ar endings are both -amos and differ by nothing.",
    surface: "-er verbs are irregular in the preterite, so they get an extra form the -ar verbs lack.",
    distractor: "Spanish only allows one ambiguous form per tense, and hablamos already used it up.",
    ruleExplanation:
      "Nothing here is irregular. -ar happens to reuse -amos across both tenses; -er and -ir happen not to reuse theirs. The ambiguity is an accident of the endings, not a rule about meaning.",
  }),
  close: pick("beber", "yo", { object: true }),
  win: {
    title: "Two tables down",
    body: "-ar and -er both have a complete past tense now. The -ir table is next, and you already know most of it.",
  },
});

const L4 = topicLesson({
  n: 4,
  title: "Escribí una carta — el pretérito de los verbos -ir",
  description: "The shortest lesson in the module: -ir borrows almost everything from -er.",
  info: {
    title: "-ir borrows the -er table",
    body:
      "escribí, escribiste, escribió, escribimos, escribieron. Compare with comer: identical, every cell. In the present these two families differ (comemos vs vivimos); in the preterite they merge completely. That is one table to learn instead of two, and it is the only place in the course where Spanish gives you something for nothing.",
  },
  anchors: [
    anchor("escribir", "yo", "I wrote", "-ir yo preterite is -í, exactly like -er.", { p: { object: true }, second: {} }),
    anchor("escribir", "tu", "you wrote", "-iste, exactly like -er.", { p: { object: true }, second: {} }),
    anchor("escribir", "el", "he/she wrote", "-ió, exactly like -er.", { p: { object: true }, second: {} }),
  ],
  textMcqDistractors: ["escribí", "escribió", "escribieron"],
  extra: {
    speaking: pick("recibir", "yo", { object: true }),
    listen: pick("escribir", "ustedes", { object: true }),
    build: pick("escribir", "nosotros", { object: true }),
    buildTiles: ["escribieron"],
  },
  seventeen: S.textMcq("es-m17-4-tm-escribimos", "escribimos", ["escribí", "escribió", "escribieron"]),
  close: pick("abrir", "yo", { object: true }),
  win: {
    title: "Every regular verb, in the past",
    body: "Two tables cover all three families. Anything regular in this course can now be said in the preterite.",
  },
});

// ─── L5: the accent contrast ────────────────────────────────────────────────
//
// Bespoke rather than templated, because the payload is not a paradigm — it is
// a MINIMAL PAIR (hablo / habló), and the distractors have to be the same
// sentence in the other tense. HVPT-style minimal-pair training is the one
// perception finding in the SLA pass with an effect size worth designing a
// lesson around (g=0.92), and this is the orthographic version of it.

const L5_A = pick("caminar", "el", { timeIs: "anteayer" });
const L5_B = pick("hablar", "el", { timeIs: "anteayer" });
const L5_C = pick("comprar", "yo", { timeIs: "la semana pasada" });
const L5_D = pick("estudiar", "el", { timeIs: "la semana pasada" });
const L5_E = pick("trabajar", "el", { timeIs: "la semana pasada" });
const L5_F = pick("cocinar", "el", { object: true });
const L5_G = pick("escuchar", "yo", { object: true });
const L5_H = pick("mirar", "el", { object: true });

const presentTwin = (p) => p.es.replace(p.conj, conjugate(p.verb, p.person, "present"));

const L5 = lesson(
  "es-m17-5",
  "¿Hablo o habló? — el acento lo cambia todo",
  "One letter, one mark, two different people in two different tenses.",
  [
    S.info(
      "es-m17-5-info",
      "The accent is the tense",
      "hablo means I speak. habló means he spoke. Same five letters, and the only thing separating a first person present from a third person past is a mark over the o. Spanish does not consider this a hardship — it considers it a spelling rule that carries information, and it expects you to read it. Say them out loud: HA-blo, ha-BLÓ. The stress is where the meaning lives; the accent just writes the stress down.",
      "grammar",
    ),
    S.phrase("es-m17-5-p-anteayer", "the day before yesterday", "anteayer"),
    S.cloze("es-m17-5-c-anteayer", L5_A, "anteayer puts the whole sentence in the past, so the verb has to be preterite too."),
    S.build("es-m17-5-b-anteayer", L5_B, [conjugate("hablar", "yo", "present")]),
    S.phrase("es-m17-5-p-semana", "last week", "la semana pasada"),
    S.translate("es-m17-5-tr-semana", L5_C),
    S.speaking("es-m17-5-sp-semana", L5_D),
    S.listenComp("es-m17-5-lc-pair", L5_E),
    S.build("es-m17-5-b-pair", L5_F, [conjugate("cocinar", "yo", "present")]),
    S.mcq(
      "es-m17-5-q-pair1",
      "Which one means 'he spoke'?",
      "habló",
      ["hablo", "hablar", "hablamos"],
      "The written accent moves the stress onto the ending, and that is what makes it third person past instead of first person present.",
      ["habló"],
    ),
    S.translate("es-m17-5-tr-pair", L5_G),
    S.selfExplain({
      id: "es-m17-5-self-explain",
      anchorLabel: "You just chose between hablo and habló",
      anchorAudioText: "hablo... habló",
      question: "What is the accent on habló actually doing?",
      rule: "It marks which syllable is stressed, and in this pair the stressed syllable is the only thing distinguishing a first-person present from a third-person preterite.",
      surface: "It marks the past tense — Spanish puts an accent on every preterite verb.",
      distractor: "It marks the vowel as long, the way some languages lengthen a vowel to show a completed action.",
      ruleExplanation:
        "Not every preterite carries an accent — hablaste and hablaron have none, because their stress already falls where the rules put it. The mark appears exactly when the default stress rule would put the emphasis somewhere else.",
    }),
    S.speaking("es-m17-5-sp-pair", L5_H),
    S.listenBuild("es-m17-5-lb-pair", L5_A, [conjugate("caminar", "yo", "present")]),
    S.mcq(
      "es-m17-5-q-pair2",
      "Which one means 'I work'?",
      "trabajo",
      ["trabajó", "trabajé", "trabajaron"],
      "No accent, stress on the middle syllable: present tense, and the speaker is talking about themselves.",
      ["trabajé"],
    ),
    S.build("es-m17-5-b-close", L5_C, [conjugate("comprar", "yo", "present")]),
    S.translate("es-m17-5-tr-close", L5_E),
    S.reviewMatch("es-m17-5-rev-mp", "es-m17-5-rev-mp-seed"),
    S.speaking("es-m17-5-sp-close", L5_B),
    S.info(
      "es-m17-5-win",
      "You can read an accent",
      "hablo / habló, trabajo / trabajó, estudio / estudió. Six words, three meanings apiece, and you can now tell them apart on the page and in the ear.",
      "win",
    ),
  ],
);

// ─── L6: the far past ───────────────────────────────────────────────────────

const L6_A = pick("comprar", "yo", { timeIs: "el mes pasado" });
const L6_B = pick("cocinar", "el", { timeIs: "el mes pasado" });
const L6_C = pick("aprender", "yo", { timeIs: "el año pasado" });
const L6_D = pick("trabajar", "ustedes", { timeIs: "el año pasado" });
const L6_E = pick("vender", "ustedes", { object: true });
const L6_F = pick("vender", "ustedes", { object: true });
const L6_G = pick("recibir", "yo", { object: true });
const L6_H = pick("mirar", "el", { time: true });
const L6_I = pick("beber", "nosotros", { object: true });

const L6 = lesson(
  "es-m17-6",
  "El año pasado — cuándo pasó",
  "Yesterday is not the only past there is. Reach further back.",
  [
    S.info(
      "es-m17-6-info",
      "Pasado does the work",
      "You already own semana, mes and año. Put the definite article in front and pasado/pasada behind, and you have a time marker: la semana pasada, el mes pasado, el año pasado. The adjective agrees with the noun, which is why semana takes pasada and mes takes pasado — the same agreement you have been doing since module 4, now carrying a date.",
      "grammar",
    ),
    S.phrase("es-m17-6-p-mes", "last month", "el mes pasado"),
    S.cloze("es-m17-6-c-mes", L6_A, "The time marker is already in the past, so the verb cannot be present."),
    S.build("es-m17-6-b-mes", L6_B, [conjugate("cocinar", "yo", "preterite")]),
    S.phrase("es-m17-6-p-anio", "last year", "el año pasado"),
    S.translate("es-m17-6-tr-anio", L6_C),
    S.speaking("es-m17-6-sp-anio", L6_D),
    S.listenComp("es-m17-6-lc-far", L6_H),
    S.build("es-m17-6-b-far", L6_I, [conjugate("beber", "yo", "preterite")]),
    S.phrase("es-m17-6-p-vendieron", "you all sold", "vendieron"),
    S.formMcq("es-m17-6-q-vendieron", "vender", "ustedes", "-er ustedes preterite is -ieron, the same ending -ir verbs take."),
    S.listenBuild("es-m17-6-lb-vendieron", L6_E, [conjugate("vender", "nosotros", "preterite")]),
    S.translate("es-m17-6-tr-vendieron", L6_F),
    S.speaking("es-m17-6-sp-recibi", L6_G),
    S.textMcq("es-m17-6-tm-vendieron", "vendieron", ["comieron", "escribieron", "hablaron"]),
    S.build("es-m17-6-b-close", L6_C, [conjugate("aprender", "el", "preterite")]),
    S.translate("es-m17-6-tr-close", L6_B),
    S.reviewMatch("es-m17-6-rev-mp", "es-m17-6-rev-mp-seed"),
    S.speaking("es-m17-6-sp-close", L6_A),
    S.info(
      "es-m17-6-win",
      "The whole past is reachable",
      "ayer, anoche, anteayer, la semana pasada, el mes pasado, el año pasado. Six markers, and every regular verb in the course to put behind them.",
      "win",
    ),
  ],
);

// ─── L7: integration ────────────────────────────────────────────────────────
//
// No new atoms (spine reuse rule). Every sentence here recombines m17's five
// endings with m1–m16 vocabulary, which is also what makes the compounding
// check pass without a single review-only step.

const R = {
  a: pick("comprar", "tu", { object: true }),
  b: pick("comer", "el", { object: true }),
  c: pick("escribir", "yo", { object: true }),
  d: pick("beber", "tu", { object: true }),
  e: pick("caminar", "nosotros", { time: true }),
  f: pick("mirar", "yo", { object: true }),
  g: pick("aprender", "ustedes", { object: true }),
  h: pick("llevar", "el", { object: true }),
  i: pick("abrir", "tu", { object: true }),
  j: pick("necesitar", "nosotros", { object: true }),
  k: pick("descansar", "yo", { time: true }),
  l: pick("cantar", "ustedes"),
  m: pick("usar", "el", { object: true }),
};

const L7 = lesson(
  "es-m17-7",
  "Repaso — ¿qué hiciste?",
  "Everything from this module, mixed, with no table in front of you.",
  [
    S.info(
      "es-m17-7-info",
      "Five endings, three families",
      "-ar takes -é -aste -ó -amos -aron. -er and -ir share -í -iste -ió -imos -ieron. Nothing else in the module is new — the rest was vocabulary you already had, put into the past. This lesson gives you no table and no warning about which family a verb belongs to.",
      "grammar",
    ),
    S.mcq(
      "es-m17-7-q-family",
      "Which ending does beber take for yo in the preterite?",
      "bebí",
      ["bebé", "bebó", "bebo"],
      "-er and -ir verbs share one preterite table, and its yo cell is -í.",
      ["comí"],
    ),
    S.build("es-m17-7-b-1", R.a, [conjugate("comprar", "yo", "preterite")]),
    S.translate("es-m17-7-tr-1", R.b),
    S.listenComp("es-m17-7-lc-1", R.c),
    S.speaking("es-m17-7-sp-1", R.d),
    S.cloze("es-m17-7-c-1", R.e, "nosotros -ar preterite is spelled the same as the present; the time word is what fixes the tense."),
    S.build("es-m17-7-b-2", R.f, [conjugate("mirar", "el", "preterite")]),
    S.textMcq("es-m17-7-tm-1", "comieron", ["comimos", "comiste", "comió"]),
    S.listenBuild("es-m17-7-lb-1", R.g, [conjugate("aprender", "yo", "preterite")]),
    S.translate("es-m17-7-tr-2", R.h),
    S.speaking("es-m17-7-sp-2", R.i),
    S.mcq(
      "es-m17-7-q-accent",
      "Which one means 'she studied'?",
      "estudió",
      ["estudio", "estudié", "estudiaron"],
      "Third person, past: the stress lands on the ending and the accent writes it down.",
      ["estudié"],
    ),
    S.match("es-m17-7-mp-forms", ["hablé", "comiste", "escribió", "hablamos", "comieron", "recibí"]),
    S.speaking("es-m17-7-sp-3", R.j),
    S.reviewMatch("es-m17-7-rev-mp", "es-m17-7-rev-mp-seed"),
    S.translate("es-m17-7-tr-3", R.k),
    S.info(
      "es-m17-7-win",
      "A2 has started",
      "The preterite is the tense every English speaker's Spanish stalls on, and you have the regular half of it. The irregulars — fui, tuve, hice — are next, and they are a list rather than a system.",
      "win",
    ),
  ],
);

// ─── L8: mastery test (graded steps only) ───────────────────────────────────

const T = {
  a: pick("hablar", "yo", { time: true }),
  b: pick("comer", "tu", { object: true }),
  c: pick("escribir", "el", { object: true }),
  d: pick("comprar", "ustedes", { object: true }),
  e: pick("trabajar", "nosotros", { time: true }),
  f: pick("beber", "el", { object: true }),
  g: pick("recibir", "tu", { object: true }),
  h: pick("cocinar", "yo", { object: true }),
  i: pick("correr", "ustedes", { time: true }),
};

const L8 = lesson(
  "es-m17-8",
  "M17 Mastery Test",
  "Prove the preterite. No tables, no hints.",
  [
    S.mcq(
      "es-m17-8-q-1",
      "Which one means 'you all wrote'?",
      "escribieron",
      ["escribimos", "escribiste", "escribió"],
      "-ir ustedes preterite is -ieron.",
      ["escribieron"],
    ),
    S.build("es-m17-8-b-1", T.a, [conjugate("hablar", "el", "preterite")]),
    S.translate("es-m17-8-tr-1", T.b),
    S.listenComp("es-m17-8-lc-1", T.c),
    S.speaking("es-m17-8-sp-1", T.d),
    S.cloze("es-m17-8-c-1", T.e, "The time marker is past, so the verb is too — even though this form is spelled like the present."),
    S.build("es-m17-8-b-2", T.f, [conjugate("beber", "yo", "preterite")]),
    S.textMcq("es-m17-8-tm-1", "hablaron", ["hablamos", "hablaste", "habló"]),
    S.listenBuild("es-m17-8-lb-1", T.g, [conjugate("recibir", "yo", "preterite")]),
    S.translate("es-m17-8-tr-2", T.h),
    S.speaking("es-m17-8-sp-2", T.i),
    S.capstoneMatch("es-m17-8-mp", [
      { surface: "hablé", gloss: "I spoke" },
      { surface: "comiste", gloss: "you ate" },
      { surface: "escribió", gloss: "he/she wrote" },
      { surface: "comimos", gloss: "we ate" },
      { surface: "hablaron", gloss: "you all spoke" },
      { surface: "anteayer", gloss: "the day before yesterday" },
    ]),
  ],
);

// ─── emit ───────────────────────────────────────────────────────────────────

const LESSONS = [L1, L2, L3, L4, L5, L6, L7, L8];

w(`/**
 * Spanish Module 17 — EL PRETÉRITO, and the first module of the A2 tier.
 *
 * The A1 spine (m1–m16) is entirely present tense. This module opens the tier
 * that \`docs/es-authoring-scope-2026-08-09.md\` §4 names as the strategic
 * opening: the preterite/imperfect arc, the classic EN→ES wall, the zone
 * where every competitor's learners plateau and no product engineers a
 * set-piece. m17 is the regular half of the preterite; the irregulars are a
 * list rather than a system and belong to m18.
 *
 * Lesson arc:
 *   es-m17-1  Ayer hablé — -ar preterite, yo + tú
 *   es-m17-2  Él habló — the rest of the -ar table, and its one ambiguity
 *   es-m17-3  Comí y bebí — -er preterite (and why it is NOT ambiguous)
 *   es-m17-4  Escribí una carta — -ir borrows the -er table wholesale
 *   es-m17-5  ¿Hablo o habló? — the accent minimal pair
 *   es-m17-6  El año pasado — the far-past time markers
 *   es-m17-7  Repaso — integration, no tables
 *   es-m17-8  M17 Mastery Test
 *
 * GENERATED FILE — do not hand-edit.
 *   node scripts/draft/draft.mjs es-a2:m17 --rounds 60 --n 20 --duty 0.8
 *   node scripts/draft/emit-es-m17.mjs > src/features/languages/es/curriculum/m17.ts
 *
 * The Spanish is not sampled. A local model chose which taught words combine;
 * \`scripts/draft/frames-es-a2.mjs\` built every sentence from
 * \`morph-es.mjs\`, so grammaticality and agreement are guaranteed rather than
 * scored. The pedagogy — arc, atom allocation, both selfExplains, every info
 * card — is authored in \`emit-es-m17.mjs\` and is not model output.
 */
import type { LessonContent } from "@/features/lesson/types";
import type { PlacementItem } from "@/shared/language/types";
import { atom, type EsAtom } from "../courseAtoms";
import {
  build,
  capstoneMatchPairs,
  cloze,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  matchPairs,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
  vocabTextMcq,
} from "../grammarHelpers";

// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m16";

const COURSE_ID = "mock-1";

// ─── M17 atoms ──────────────────────────────────────────────────────────────
//
// Conjugated forms are registered as atoms because the SRS tracks them
// individually: knowing «comí» is not knowing «comieron», and a learner who
// has produced one has not thereby earned credit for the other.

export const ES_M17_ATOMS: EsAtom[] = [`);
for (const a of ATOMS) {
  w(
    `  atom({ surface: ${q(a.s)}, meaningEn: ${q(a.en)}, partOfSpeech: ${q(a.pos)}, fromModule: "m17", kind: ${q(a.kind)} }),`,
  );
}
w(`];
`);
for (const l of LESSONS) w(l);
w(`// ─── Placement (1 screener + 4 stage-2 items) ───────────────────────────────
//
// The placement bank is a hard gate: \`moduleConformance\` fails the build for
// any authored module with no screener item, which is how a module can ship
// invisible to the placement test. m17's items are the four things that
// actually separate someone who has the preterite from someone who does not.

export const ES_M17_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m17",
      moduleId: "m17",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m17",
          prompt: "'I spoke English yesterday' — pick the Spanish.",
          correctText: "hablé inglés ayer",
          distractorsText: ["hablo inglés ayer", "hablaste inglés ayer", "hablar inglés ayer"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m17-1",
      moduleId: "m17",
      build: () =>
        sentenceMcq({
          id: "pt-es-m17-1",
          prompt: "Pick the yo past form of trabajar (to work).",
          correctText: "trabajé",
          distractorsText: ["trabajo", "trabajó", "trabajaste"],
        }),
    },
    {
      id: "pt-es-m17-2",
      moduleId: "m17",
      build: () =>
        sentenceMcq({
          id: "pt-es-m17-2",
          prompt: "Pick the él/ella past form of comer (to eat).",
          correctText: "comió",
          distractorsText: ["come", "comí", "comieron"],
        }),
    },
    {
      id: "pt-es-m17-3",
      moduleId: "m17",
      build: () =>
        cloze(
          "pt-es-m17-3",
          "Nosotros ",
          " el pescado anoche.",
          "comimos",
          ["comimos", "comemos", "comieron", "comer"],
          "We ate the fish last night",
          "nosotros comimos el pescado anoche",
        ),
    },
    {
      id: "pt-es-m17-4",
      moduleId: "m17",
      build: () =>
        sentenceMcq({
          id: "pt-es-m17-4",
          prompt: "'She studied last week.' — Ella ___ la semana pasada.",
          correctText: "estudió",
          distractorsText: ["estudio", "estudié", "estudiaron"],
        }),
    },
  ],
};

export const ES_M17_LESSONS: LessonContent[] = [
${LESSONS.map((_, i) => `  ES_M17_${i + 1},`).join("\n")}
];`);

process.stdout.write(out.join("\n") + "\n");
if (frameFilled.length) {
  process.stderr.write(
    `\nFRAME-FILLED ${frameFilled.length} cell(s) the pool did not cover: ${frameFilled.join(", ")}\n` +
      `These are built by the frame, not chosen by the model. Grammatical, but not sampled.\n`,
  );
}
