/**
 * frames-es-m18.mjs — the m18 drafting frame: the IRREGULAR preterite, plus
 * the -car/-gar/-zar spelling beat m17 deliberately withheld.
 *
 * Same contract as `frames-es-a2.mjs` (slots / rules / build / check) and the
 * same discipline: the frame owns BOTH languages, the model only chooses which
 * taught words combine, and a combination the inventory does not allow is
 * unreachable rather than merely detectable.
 *
 * ── Why the complement is a PHRASE, not a noun ─────────────────────────────
 * m17's verbs were plain transitives, so «object» could be a bare noun and the
 * frame could bolt on the article. m18's verbs are not: `ir` and `venir` take
 * a destination behind a preposition that CONTRACTS with the article
 * («al parque», never *«a el parque»), `estar` takes a location behind `en`,
 * and `decir` takes a fixed formula. Computing all of that from a bare noun
 * means re-deriving Spanish syntax inside a drafting script, which is exactly
 * the class of thing that produced «hablé el inglés».
 *
 * So the complement is TABLED whole, in both languages, per verb. It is more
 * typing and it is the reason nothing here can come out wrong: every phrase in
 * this file was written once, by hand, against the taught inventory.
 *
 * ── Teach-first ────────────────────────────────────────────────────────────
 * Every noun inside every phrase below is taught by m1–m17. `vocabSurfaces()`
 * reports the bare nouns so `assertFrameVocabIsTaught` can check them, because
 * a phrase like "al parque" is not itself an atom — `parque` is.
 */
import { conjugate, PRONOUN, EN_SUBJECT } from "./morph-es.mjs";

/**
 * THE TWO HALVES OF m18, kept explicitly apart.
 *
 * `strong` verbs have a preterite stem that is simply different (tuve, hice,
 * fui) and NO written accents on yo/él — that missing accent is the module's
 * hardest single fact, because m17 spent eight lessons establishing that the
 * yo and él preterites are the accented cells.
 *
 * `spelling` verbs are REGULAR. Their endings never change; Spanish
 * orthography rewrites the stem's last consonant so the sound survives the
 * front vowel of the -é ending. Teaching them as "irregular" is the
 * misconception the module exists to prevent, so they are tagged, not mixed.
 */
const VERBS = [
  // ── strong preterites ────────────────────────────────────────────────────
  { lemma: "ir", en: "went", enInf: "to go", class: "strong" },
  { lemma: "tener", en: "had", enInf: "to have", class: "strong" },
  { lemma: "hacer", en: "made", enInf: "to make", class: "strong" },
  // English "be" is the one verb in this table that still inflects for person
  // in the past, so a single `en` string cannot serve it: the flat "was"
  // shipped «Ustedes estuvieron en la playa» → "You all was at the beach".
  // Spanish marks person on the verb and English mostly does not, which is
  // exactly why the frame owns the English — and why the one place English
  // DOES mark it needs its own table rather than a string.
  {
    lemma: "estar",
    en: "was",
    enByPerson: { yo: "was", tu: "were", el: "was", nosotros: "were", ustedes: "were" },
    enInf: "to be (location)",
    class: "strong",
  },
  // poder is NOT here. It is a modal: its complement is an infinitive («pude
  // comer»), and m18 teaches stems, not a modal + infinitive structure the
  // course has not introduced. Left in the table as an intransitive it built
  // «Yo pude ayer» → "I was able to yesterday" — grammatical in both languages
  // and a sentence no person has ever said. m18 teaches pude/pudimos as FORMS
  // (vocab card, form MCQ, match) and never builds a sentence from them, which
  // is the inventory making the nonsense unreachable rather than detectable.
  {
    lemma: "ver",
    en: "saw",
    enInf: "to see",
    class: "strong",
    // English does not "see" a television or a match — it watches them. Only
    // «la película» survives with "saw", and even there "watched" is fine.
    enByObject: {
      "la televisión": { en: "watched", enInf: "to watch" },
      "el partido": { en: "watched", enInf: "to watch" },
      "la película": { en: "watched", enInf: "to watch" },
    },
  },
  { lemma: "dar", en: "gave", enInf: "to give", class: "strong" },
  { lemma: "decir", en: "said", enInf: "to say", class: "strong" },
  { lemma: "venir", en: "came", enInf: "to come", class: "strong" },
  { lemma: "poner", en: "put", enInf: "to put", class: "strong" },
  { lemma: "querer", en: "wanted", enInf: "to want", class: "strong" },
  { lemma: "traer", en: "brought", enInf: "to bring", class: "strong" },
  // ── regular, respelled in the yo cell only ───────────────────────────────
  { lemma: "llegar", en: "arrived", enInf: "to arrive", class: "spelling" },
  { lemma: "buscar", en: "looked for", enInf: "to look for", class: "spelling" },
  // The gloss is "paid", not "paid for": pagar's complements already carry
  // their own preposition ("for the ticket"), and gluing both together gave
  // «Yo pagué el café ayer» → "I paid for for the coffee yesterday". A doubled
  // preposition is the kind of defect that survives every structural check and
  // only shows up when someone reads the pool.
  { lemma: "pagar", en: "paid", enInf: "to pay for", class: "spelling" },
  { lemma: "empezar", en: "started", enInf: "to start", class: "spelling" },
  { lemma: "jugar", en: "played", enInf: "to play", class: "spelling" },
  { lemma: "almorzar", en: "had lunch", enInf: "to have lunch", class: "spelling" },
];

const BY_LEMMA = Object.fromEntries(VERBS.map((v) => [v.lemma, v]));

/** Verbs that take no complement at all in this frame. */
const INTRANSITIVE = new Set(["llegar", "almorzar"]);
/** Verbs whose complement may be omitted without the sentence going odd. */
const OPTIONAL = new Set(["jugar", "empezar", "querer", "decir"]);

/**
 * THE COMPLEMENT TABLE — the whole product of this file.
 *
 * Each entry is the Spanish phrase and its English, written together so the
 * gloss can never drift from the surface. Pools are deliberately SHORT: a
 * narrow pool makes nonsense unreachable, and the cost of a missing
 * combination is a duller sentence, not a wrong one.
 */
const COMPLEMENTS = {
  ir: [
    { es: "al parque", en: "to the park", noun: "parque" },
    { es: "a la escuela", en: "to school", noun: "escuela" },
    { es: "al mercado", en: "to the market", noun: "mercado" },
    { es: "al cine", en: "to the cinema", noun: "cine" },
    { es: "al museo", en: "to the museum", noun: "museo" },
    { es: "a la playa", en: "to the beach", noun: "playa" },
  ],
  venir: [
    { es: "a la fiesta", en: "to the party", noun: "fiesta" },
    { es: "a la escuela", en: "to school", noun: "escuela" },
    { es: "al restaurante", en: "to the restaurant", noun: "restaurante" },
  ],
  estar: [
    { es: "en casa", en: "at home", noun: "casa" },
    { es: "en la escuela", en: "at school", noun: "escuela" },
    { es: "en el parque", en: "at the park", noun: "parque" },
    { es: "en la playa", en: "at the beach", noun: "playa" },
    { es: "en el trabajo", en: "at work", noun: "trabajo" },
  ],
  tener: [
    { es: "una idea", en: "an idea", noun: "idea" },
    { es: "un perro", en: "a dog", noun: "perro" },
    { es: "un carro", en: "a car", noun: "carro" },
    { es: "una bicicleta", en: "a bicycle", noun: "bicicleta" },
  ],
  hacer: [
    { es: "la comida", en: "the meal", noun: "comida" },
    { es: "la cena", en: "dinner", noun: "cena" },
    { es: "el desayuno", en: "breakfast", noun: "desayuno" },
    { es: "la sopa", en: "the soup", noun: "sopa" },
  ],
  ver: [
    { es: "la película", en: "the film", noun: "película" },
    { es: "el partido", en: "the match", noun: "partido" },
    { es: "la televisión", en: "television", noun: "televisión" },
  ],
  dar: [
    { es: "el dinero", en: "the money", noun: "dinero" },
    { es: "la tarjeta", en: "the card", noun: "tarjeta" },
    { es: "el libro", en: "the book", noun: "libro" },
  ],
  // Fixed formulae. «Dije adiós» is what a speaker says; a bare noun object
  // behind decir would need a subordinate clause the course has not taught.
  decir: [
    { es: "adiós", en: "goodbye", noun: "adiós" },
    { es: "gracias", en: "thank you", noun: "gracias" },
    { es: "hola", en: "hello", noun: "hola" },
  ],
  poner: [
    { es: "la mesa", en: "the table", noun: "mesa" },
    { es: "la música", en: "the music", noun: "música" },
    { es: "la lámpara", en: "the lamp", noun: "lámpara" },
  ],
  querer: [
    { es: "un café", en: "a coffee", noun: "café" },
    { es: "una manzana", en: "an apple", noun: "manzana" },
    { es: "un jugo", en: "a juice", noun: "jugo" },
  ],
  traer: [
    { es: "el pan", en: "the bread", noun: "pan" },
    { es: "el café", en: "the coffee", noun: "café" },
    { es: "la comida", en: "the food", noun: "comida" },
  ],
  buscar: [
    { es: "las llaves", en: "the keys", noun: "llave" },
    { es: "el mapa", en: "the map", noun: "mapa" },
    { es: "el boleto", en: "the ticket", noun: "boleto" },
    { es: "la mochila", en: "the backpack", noun: "mochila" },
  ],
  pagar: [
    { es: "la cena", en: "for dinner", noun: "cena" },
    { es: "el boleto", en: "for the ticket", noun: "boleto" },
    { es: "el café", en: "for the coffee", noun: "café" },
  ],
  empezar: [
    // `clase` is not taught through m17 — the teach-first assertion caught it
    // on the frame's first run, which is the assertion doing exactly its job.
    { es: "el trabajo", en: "work", noun: "trabajo" },
    { es: "la cena", en: "dinner", noun: "cena" },
  ],
  jugar: [
    { es: "al fútbol", en: "football", noun: "fútbol" },
  ],
  // INTRANSITIVE in this frame — no complement table at all.
  llegar: [],
  almorzar: [],
};

/** Time markers, all taught by m17. Same pool, deliberately — m18 is a new
 *  paradigm against a familiar frame, not two new things at once. */
const TIME = [
  { es: "ayer", en: "yesterday" },
  { es: "anoche", en: "last night" },
  { es: "anteayer", en: "the day before yesterday" },
  { es: "la semana pasada", en: "last week" },
  { es: "el mes pasado", en: "last month" },
  { es: "el año pasado", en: "last year" },
];

/**
 * PUNCTUAL vs DURATIVE time markers.
 *
 * The first drafted pool returned «Yo tuve un perro ayer» — "I had a dog
 * yesterday" — which is grammatical, which the frame built, and which no
 * residual check could have caught, because nothing about it is wrong except
 * the world. Owning a dog is a STATE; «ayer» bounds it to a single day.
 *
 * This is the m8 «cociné el lápiz» lesson in its subtler form: the fix belongs
 * in the inventory, not in a checker. `tener` may combine with the markers that
 * name a stretch of time and with no marker at all — never with the ones that
 * name a point.
 */
const DURATIVE_TIME = new Set(["la semana pasada", "el mes pasado", "el año pasado"]);
const DURATIVE_ONLY = new Set(["tener"]);

const PERSONS = ["yo", "tu", "el", "nosotros", "ustedes"];

const complementByEs = (verb, es) => (COMPLEMENTS[verb] ?? []).find((c) => c.es === es);

/**
 * The English of a verb depends on TWO things, not one.
 *
 * `enByPerson` was added when «You all was at the beach» shipped — English
 * inflects for person where Spanish's gloss table did not. `enByObject` is the
 * same discovery one level over: «ver» is "saw" with a film and "watched" with
 * a television, and m18 emitted «Él vio la televisión» as "He saw television
 * last month" — into a LISTENING-COMPREHENSION step, where the English IS the
 * answer the learner picks. It is not ungrammatical, so no gate could see it;
 * it is simply not what an English speaker says.
 *
 * Both overrides live on the verb entry because that is where the fact lives.
 * A post-hoc rewrite of the emitted string would be the pipeline correcting
 * itself downstream of its own inventory, which is the failure mode the ES
 * guide's §3 is about.
 */
export function enVerbFor(v, person, object) {
  const byObj = object ? v.enByObject?.[object] : null;
  if (byObj) return byObj;
  return { en: v.enByPerson?.[person] ?? v.en, enInf: v.enInf };
}

export const es_m18 = {
  id: "es-m18",
  module: "m18",
  lang: "es",
  topic: "what people did — the irregular preterite, and the verbs that only look irregular",

  verbs: VERBS,
  time: TIME,
  persons: PERSONS,
  /** The generic driver reads this to build per-verb prompt lines. */
  objectsByVerb: Object.fromEntries(
    Object.entries(COMPLEMENTS).map(([v, list]) => [v, list.map((c) => c.es)]),
  ),

  slots: {
    person: { enum: PERSONS, describe: "who did it" },
    verb: { enum: VERBS.map((v) => v.lemma), describe: "the verb" },
    object: {
      enum: [...new Set(Object.values(COMPLEMENTS).flat().map((c) => c.es))],
      optional: true,
      describe: "the complement — must be one this verb allows",
    },
    time: { enum: TIME.map((t) => t.es), optional: true, describe: "when" },
  },

  rules: [
    "The complement must be one this verb actually allows — the list per verb is given below.",
    `These verbs take NO complement: ${[...INTRANSITIVE].join(", ")}.`,
    `These may omit it: ${[...OPTIONAL].join(", ")}.`,
    "Every other verb must have one.",
    `${[...DURATIVE_ONLY].join(", ")} name a STATE: use only "la semana pasada", "el mes pasado", "el año pasado" — or no time word at all. Never "ayer", "anoche" or "anteayer".`,
    "Vary the person and the verb across your picks; never repeat a combination.",
  ],

  /** Bare nouns behind the tabled phrases, for the teach-first assertion. */
  vocabSurfaces() {
    const nouns = Object.values(COMPLEMENTS).flat().map((c) => c.noun);
    return [...new Set(nouns.filter(Boolean))];
  },

  /**
   * Build the sentence. Throws rather than guessing — every failure here is an
   * inventory bug, and an inventory bug that returns a sentence is the one
   * thing this architecture exists to prevent.
   */
  build({ person, verb, object, time }) {
    const v = BY_LEMMA[verb];
    if (!v) throw new Error(`unknown verb "${verb}"`);
    if (!PERSONS.includes(person)) throw new Error(`unknown person "${person}"`);

    if (object) {
      if (INTRANSITIVE.has(verb)) throw new Error(`"${verb}" takes no complement`);
      if (!complementByEs(verb, object)) throw new Error(`"${verb}" may not take "${object}"`);
    } else if (!INTRANSITIVE.has(verb) && !OPTIONAL.has(verb)) {
      throw new Error(`"${verb}" requires a complement`);
    }

    const conj = conjugate(verb, person, "preterite");
    const c = object ? complementByEs(verb, object) : null;
    const t = time ? TIME.find((x) => x.es === time) : null;
    if (time && !t) throw new Error(`time "${time}" is not in the m18 pool`);
    if (time && DURATIVE_ONLY.has(verb) && !DURATIVE_TIME.has(time)) {
      throw new Error(`"${verb}" names a state — "${time}" bounds it to a point in time`);
    }

    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const es = cap([PRONOUN[person], conj, c?.es, t?.es].filter(Boolean).join(" ")) + ".";
    const enVerb = enVerbFor(v, person, object).en;
    const en = [EN_SUBJECT[person], enVerb, c?.en, t?.en].filter(Boolean).join(" ") + ".";
    return { es, en, conj, verb, person, object: object ?? null, time: time ?? null };
  },

  /** Residual checks only. Grammaticality is the frame's job, not a score. */
  check(pick) {
    const errs = [];
    if (pick.object && INTRANSITIVE.has(pick.verb)) {
      errs.push(`"${pick.verb}" is intransitive but got "${pick.object}"`);
    }
    if (pick.object && !complementByEs(pick.verb, pick.object)) {
      errs.push(`"${pick.verb}" may not take "${pick.object}"`);
    }
    if (!pick.object && !INTRANSITIVE.has(pick.verb) && !OPTIONAL.has(pick.verb)) {
      errs.push(`"${pick.verb}" needs a complement`);
    }
    if (pick.time && DURATIVE_ONLY.has(pick.verb) && !DURATIVE_TIME.has(pick.time)) {
      errs.push(`"${pick.verb}" is a state — "${pick.time}" bounds it to a point`);
    }
    return errs;
  },
};

export const STRONG = VERBS.filter((v) => v.class === "strong").map((v) => v.lemma);
export const SPELLING = VERBS.filter((v) => v.class === "spelling").map((v) => v.lemma);

/**
 * Re-exported so `draft.mjs` can drive this frame file directly. The driver
 * looks for these two on whichever `frames-*.mjs` it was pointed at, and a
 * frame file that omits them fails at the teach-first assertion — the one
 * check that is supposed to run BEFORE any model tokens are spent.
 */
export { assertFrameVocabIsTaught, loadNouns } from "./frames-es-a2.mjs";
