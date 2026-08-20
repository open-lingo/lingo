/**
 * frames-es-a2.mjs — drafting frames for the Spanish A2 tier (m17+).
 *
 * Same architecture as `frames-es.mjs`, one contract tighter: **the frame owns
 * BOTH sides of the sentence.** m8 let the local model write the English gloss
 * and the frame patched the adverb in; that worked because the present tense of
 * an English verb is its lemma. It does not survive the preterite — a model
 * asked for the past of "to speak" will eventually write "I speaked", and no
 * residual check catches a wrong gloss that parses. So every verb here carries
 * its own English past form and every noun resolves its own gloss from the
 * taught inventory. The model chooses combinations and nothing else.
 *
 * The generic contract a frame implements (see `draft.mjs`):
 *   slots   — { name: { enum, optional, describe } } → the JSON schema
 *   rules   — prompt lines that decide whether a combination is GOOD
 *   build   — pick → { es, en }, throws rather than emitting bad Spanish
 *   check   — pick → string[] of residual complaints (never grammar)
 */
import { conjugate, PRONOUN, EN_SUBJECT } from "./morph-es.mjs";
import { esInventory } from "./inventory-es.mjs";

/**
 * m17's verb pool is PLAIN REGULARS ONLY.
 *
 * `llegar`, `pagar`, `buscar`, `empezar` and `almorzar` are regular too, and
 * `morph-es.mjs` now spells their yo-preterites correctly (llegué / busqué /
 * empecé). They are still excluded here: «llegué» is a spelling lesson wearing
 * a conjugation lesson's clothes, and mixing it into the module that introduces
 * the paradigm teaches the exception before the rule. It is m18's opening beat.
 *
 * `leer`, `dormir`, `pedir`, `servir`, `preferir`, `vestirse` are excluded for
 * the harder reason: their preterite stems actually change (leyó, durmió,
 * pidió), so they are not regular at all.
 */
const VERBS = [
  // -ar
  { lemma: "hablar", en: "spoke", enInf: "to speak" },
  { lemma: "trabajar", en: "worked", enInf: "to work" },
  { lemma: "estudiar", en: "studied", enInf: "to study" },
  { lemma: "comprar", en: "bought", enInf: "to buy" },
  { lemma: "caminar", en: "walked", enInf: "to walk" },
  { lemma: "escuchar", en: "listened to", enInf: "to listen to" },
  { lemma: "mirar", en: "watched", enInf: "to watch" },
  { lemma: "cocinar", en: "cooked", enInf: "to cook" },
  { lemma: "bailar", en: "danced", enInf: "to dance" },
  { lemma: "cantar", en: "sang", enInf: "to sing" },
  { lemma: "descansar", en: "rested", enInf: "to rest" },
  { lemma: "necesitar", en: "needed", enInf: "to need" },
  { lemma: "usar", en: "used", enInf: "to use" },
  { lemma: "desayunar", en: "had for breakfast", enInf: "to have breakfast" },
  { lemma: "llevar", en: "wore", enInf: "to wear" },
  // -er
  { lemma: "comer", en: "ate", enInf: "to eat" },
  { lemma: "beber", en: "drank", enInf: "to drink" },
  { lemma: "aprender", en: "learned", enInf: "to learn" },
  { lemma: "comprender", en: "understood", enInf: "to understand" },
  { lemma: "correr", en: "ran", enInf: "to run" },
  { lemma: "vender", en: "sold", enInf: "to sell" },
  // -ir
  { lemma: "escribir", en: "wrote", enInf: "to write" },
  { lemma: "abrir", en: "opened", enInf: "to open" },
  { lemma: "recibir", en: "received", enInf: "to receive" },
];

/** Never takes a direct object. The frame drops the slot rather than trusting
 *  the model to leave it empty. */
const INTRANSITIVE = new Set(["trabajar", "caminar", "descansar", "correr"]);

/**
 * `vivir` was in this pool for one smoke test and came out as «Ustedes
 * vivieron el año pasado.» — "You all lived last year." Perfectly formed and
 * faintly ominous. Spanish `vivir` wants a place («viví en México»), and this
 * frame has no place slot, so the verb is dropped rather than propped up with
 * a residual check. Same class as m8's «cociné el lápiz»: narrow the
 * inventory, do not grade the output.
 */

/** Fine with or without one — «Ella cantó» and «Ella cantó una canción» are
 *  both good Spanish, and scoring the bare form as a failure is the check
 *  being wrong, not the model (m8 lesson, invariant: three of that module's
 *  "defects" were checks). */
const OPTIONAL = new Set(["bailar", "cantar", "hablar", "comprender", "escribir"]);

/**
 * WHICH OBJECTS EACH VERB MAY TAKE — the whole judgment budget of this frame.
 * A verb absent from this map takes no object. Narrow pools make «cociné el
 * lápiz» unreachable instead of merely detectable; that is the pipeline's
 * founding rule and the reason there is no world-knowledge residual check.
 */
const OBJECTS_BY_VERB = {
  hablar: ["inglés"],
  estudiar: ["inglés", "música"],
  comprar: ["libro", "teléfono", "computadora", "carro", "boleto", "camisa", "zapatos", "pan", "queso", "fruta", "periódico", "café"],
  escuchar: ["música"],
  mirar: ["televisión", "película", "partido"],
  cocinar: ["pollo", "pescado", "arroz", "sopa", "huevo", "carne"],
  bailar: [],
  cantar: [],
  necesitar: ["dinero", "ayuda", "boleto", "llave", "mapa", "pasaporte"],
  usar: ["computadora", "teléfono", "celular", "mapa", "tarjeta"],
  desayunar: ["pan", "huevo", "fruta", "café"],
  llevar: ["camisa", "chaqueta", "sombrero", "vestido", "zapatos", "mochila", "maleta"],
  comer: ["pollo", "pescado", "arroz", "ensalada", "sopa", "fruta", "manzana", "pan", "queso", "carne", "huevo"],
  beber: ["café", "té", "jugo", "leche", "agua", "cerveza"],
  aprender: ["inglés", "música"],
  comprender: ["inglés"],
  vender: ["carro", "casa", "bicicleta", "boleto", "libro"],
  escribir: ["carta", "libro"],
  abrir: ["puerta", "ventana", "libro", "tienda"],
  recibir: ["carta", "dinero", "tarjeta", "boleto", "ayuda"],
};

/**
 * The module's second payload. Every marker is placed at the END of the
 * clause, which is grammatical for all six; fronting («Ayer hablé…») is also
 * grammatical but changes the comma rules, so the frame does not do it. One
 * placement, always correct, beats two placements and a rule to remember.
 */
const TIME = [
  { es: "ayer", en: "yesterday" },
  { es: "anoche", en: "last night" },
  { es: "anteayer", en: "the day before yesterday" },
  { es: "la semana pasada", en: "last week" },
  { es: "el mes pasado", en: "last month" },
  { es: "el año pasado", en: "last year" },
];

/** Nouns that take no ENGLISH article. Distinct from taking no SPANISH
 *  determiner — «la música» / "music" is right on both sides, and conflating
 *  the two axes produced false failures on the m8 run. */
const EN_MASS = new Set(["música", "inglés", "dinero", "arroz", "pan", "queso", "carne", "agua", "café", "té", "jugo", "leche", "cerveza", "fruta", "sopa", "ensalada", "ayuda", "televisión", "pescado", "pollo"]);

const PERSONS = ["yo", "tu", "el", "nosotros", "ustedes"];

/** Resolved lazily from the taught inventory so gender and gloss are never
 *  retyped here — a retyped gender is a silent agreement bug. */
let NOUNS = null;
export async function loadNouns(throughModule = "m16") {
  const inv = await esInventory(throughModule);
  NOUNS = new Map(inv.filter((a) => a.pos === "noun").map((a) => [a.surface, a]));
  assertNounNumbers([...new Set(Object.values(OBJECTS_BY_VERB).flat())]);
  return NOUNS;
}

const DEF = { m: { s: "el", p: "los" }, f: { s: "la", p: "las" } };

/**
 * NUMBER. The inventory carries gender and does not carry number, and this
 * frame assumed every object noun was singular for its whole life — which
 * emitted «Ustedes llevaron el zapatos ayer» into the m17 pool. Nothing caught
 * it: the ES gates check step order and atom coverage, not agreement, and the
 * m17 lessons happened never to draw that cell. It surfaced only when m19
 * redrew the same inventory and the sentence was read.
 *
 * So number is DECLARED, and — the part that matters — a noun that could be
 * plural and has not been declared is a BUILD ERROR rather than a silent
 * singular. `assertNounNumbers` runs over the frame's whole object set at load
 * and refuses any surface ending in -s that is in neither list. The next
 * «pantalones» added to OBJECTS_BY_VERB stops the pipeline instead of shipping.
 */
const ES_PLURAL = new Set(["zapatos"]);

/** Singular nouns that merely END in -s. Without this the guard below would
 *  reject «inglés» on every run. */
const ES_SINGULAR_S = new Set(["inglés", "mes", "autobús", "lápiz", "país"]);

export function assertNounNumbers(objectNouns) {
  const unclassified = objectNouns.filter(
    (n) => /s$/.test(n) && !ES_PLURAL.has(n) && !ES_SINGULAR_S.has(n),
  );
  if (unclassified.length) {
    throw new Error(
      `frames-es-a2: noun(s) ${unclassified.join(", ")} end in -s and are declared ` +
        `neither plural (ES_PLURAL) nor singular (ES_SINGULAR_S). Spanish articles ` +
        `agree in number and this frame cannot guess — declare them.`,
    );
  }
  // The English gloss must agree too, or «los zapatos» pairs with "the shoe".
  for (const n of objectNouns) {
    const a = NOUNS.get(n);
    if (!a) continue;
    const gloss = a.gloss.replace(/\s*\([^)]*\)/g, "").trim();
    if (ES_PLURAL.has(n) && !/s$/.test(gloss)) {
      throw new Error(`"${n}" is declared plural but its gloss "${gloss}" is singular`);
    }
  }
}

/**
 * Nouns that take NO Spanish determiner in this frame's contexts. A language
 * name after hablar / estudiar / aprender / comprender is bare: «hablé
 * inglés», never *«hablé el inglés». The first emitted draft of m17-1 shipped
 * the article and it was the only ungrammatical Spanish the whole run produced
 * — caught by reading the output, not by a check, and fixed in the inventory
 * rather than by adding one.
 */
const ES_BARE = new Set(["inglés"]);

/** English gloss of a taught noun, stripped of the inventory's disambiguating
 *  parentheticals — "room (hotel)" is an authoring note, not a translation. */
function enNoun(surface) {
  const a = NOUNS.get(surface);
  if (!a) throw new Error(`"${surface}" is not in the taught inventory`);
  const bare = a.gloss.replace(/\s*\([^)]*\)/g, "").trim();
  return EN_MASS.has(surface) ? bare : `the ${bare}`;
}

function esNoun(surface) {
  const a = NOUNS.get(surface);
  if (!a) throw new Error(`"${surface}" is not in the taught inventory`);
  if (ES_BARE.has(surface)) return surface;
  if (!a.gender) throw new Error(`"${surface}" has no gender in the inventory`);
  return `${DEF[a.gender][ES_PLURAL.has(surface) ? "p" : "s"]} ${surface}`;
}

export const es_m17 = {
  id: "es-m17",
  module: "m17",
  lang: "es",
  topic: "what people did yesterday — the preterite of regular verbs",
  persons: PERSONS,
  verbs: VERBS,
  time: TIME,
  intransitive: INTRANSITIVE,
  optional: OPTIONAL,
  objectsByVerb: OBJECTS_BY_VERB,

  slots: {
    person: { enum: PERSONS, describe: "who did it" },
    verb: { enum: VERBS.map((v) => v.lemma), describe: "the verb, in the infinitive" },
    object: {
      enum: [...new Set(Object.values(OBJECTS_BY_VERB).flat())],
      optional: true,
      describe: 'what it was done to — or "none"',
    },
    time: { enum: TIME.map((t) => t.es), optional: true, describe: 'when — or "none"' },
  },

  rules: [
    "  - The verb and object must make real-world sense together.",
    `  - These verbs take NO object, so use "none": ${[...INTRANSITIVE].join(", ")}.`,
    `  - These verbs are fine with or without one: ${[...OPTIONAL].join(", ")}.`,
    "  - Every other verb MUST have an object, chosen from the list.",
    "  - Vary the person, the verb and the time marker; never repeat a combination.",
    "  - Prefer combinations a real beginner would say about their own past week.",
  ],

  /** Every surface this frame can put in front of a learner, for the
   *  teach-first assertion. */
  vocabSurfaces() {
    return [...VERBS.map((v) => v.lemma), ...new Set(Object.values(OBJECTS_BY_VERB).flat())];
  },

  /** Assemble. Throws rather than emitting Spanish it cannot vouch for. */
  build({ person, verb, object, time }) {
    const v = VERBS.find((x) => x.lemma === verb);
    if (!v) throw new Error(`verb "${verb}" is not in the m17 pool`);
    if (!PERSONS.includes(person)) throw new Error(`person "${person}" is not in the m17 pool`);

    const allowed = OBJECTS_BY_VERB[verb] ?? [];
    if (object && !allowed.includes(object)) {
      throw new Error(`"${verb}" may not take "${object}"`);
    }
    if (!object && !INTRANSITIVE.has(verb) && !OPTIONAL.has(verb)) {
      throw new Error(`"${verb}" requires an object`);
    }

    const conj = conjugate(verb, person, "preterite");
    const t = time ? TIME.find((x) => x.es === time) : null;
    if (time && !t) throw new Error(`time "${time}" is not in the m17 pool`);

    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const es =
      cap([PRONOUN[person], conj, object ? esNoun(object) : null, t?.es].filter(Boolean).join(" ")) + ".";
    const en =
      [EN_SUBJECT[person], v.en, object ? enNoun(object) : null, t?.en].filter(Boolean).join(" ") + ".";
    return { es, en, conj, verb, person, object: object ?? null, time: time ?? null };
  },

  /**
   * Residual checks. Deliberately thin — grammaticality is the frame's job,
   * not a score. What is left is the handful of things a narrow inventory
   * cannot make unreachable.
   */
  check(pick) {
    const errs = [];
    const allowed = OBJECTS_BY_VERB[pick.verb] ?? [];
    if (pick.object && !allowed.includes(pick.object)) {
      errs.push(`"${pick.verb}" may not take "${pick.object}"`);
    }
    if (!pick.object && !INTRANSITIVE.has(pick.verb) && !OPTIONAL.has(pick.verb)) {
      errs.push(`"${pick.verb}" needs an object`);
    }
    if (pick.object && INTRANSITIVE.has(pick.verb)) {
      errs.push(`"${pick.verb}" is intransitive but got "${pick.object}"`);
    }
    return errs;
  },
};

export const ES_A2_FRAMES = { m17: es_m17 };

/**
 * TEACH-FIRST (ja invariant 33, es §0 CARRIED). A frame may only draw on words
 * an earlier module actually taught. m8 shipped `café` in its pool while café
 * is taught at m10; TMR caught it after the fact, and the fix was structural —
 * assert it before generating, not measure it after.
 */
export async function assertFrameVocabIsTaught(frame, throughModule = "m16") {
  const inv = await esInventory(throughModule);
  const taught = new Set(inv.map((a) => a.surface));
  const missing = frame.vocabSurfaces().filter((s) => !taught.has(s));
  if (missing.length) {
    throw new Error(
      `frame ${frame.id} draws on ${missing.length} untaught surface(s) through ${throughModule}: ${missing.join(", ")}`,
    );
  }
  return true;
}
