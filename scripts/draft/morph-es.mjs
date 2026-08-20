/**
 * morph-es.mjs — Spanish morphology for the drafting pipeline.
 *
 * WHY THIS FILE EXISTS. In Japanese the frame could assemble a sentence by
 * concatenating invariant chunks: あげます is あげます no matter who the subject
 * is. Romance languages do not work that way — the verb agrees with the
 * subject, and the article and adjective agree with the noun's gender and
 * number. If the local model is asked to supply an inflected form, we are back
 * to sampling grammaticality instead of guaranteeing it, which is the exact
 * failure the slot-filling design exists to avoid.
 *
 * So the model picks LEMMAS and this file inflects them. Agreement stops being
 * a thing that can be wrong.
 *
 * Counter-intuitively this makes Spanish and French EASIER to draft than
 * Japanese, not harder: their grammar is more mechanical, so more of it moves
 * into JS where it is guaranteed.
 *
 * `verify-morph.mjs` cross-checks every form here against the app's own
 * `es/conjugationTables.ts`. Two sources of truth that silently disagree is
 * worse than one that is wrong, so the check is not optional.
 */

/** Course drills LatAm-neutral: tú, no vosotros. `ustedes` covers 3pl. */
export const PERSONS = ["yo", "tu", "el", "nosotros", "ustedes"];

const REGULAR = {
  ar: {
    present:   { yo: "o",    tu: "as",    el: "a",    nosotros: "amos",  ustedes: "an" },
    preterite: { yo: "é",    tu: "aste",  el: "ó",    nosotros: "amos",  ustedes: "aron" },
    imperfect: { yo: "aba",  tu: "abas",  el: "aba",  nosotros: "ábamos", ustedes: "aban" },
  },
  er: {
    present:   { yo: "o",    tu: "es",    el: "e",    nosotros: "emos",  ustedes: "en" },
    preterite: { yo: "í",    tu: "iste",  el: "ió",   nosotros: "imos",  ustedes: "ieron" },
    imperfect: { yo: "ía",   tu: "ías",   el: "ía",   nosotros: "íamos", ustedes: "ían" },
  },
  ir: {
    present:   { yo: "o",    tu: "es",    el: "e",    nosotros: "imos",  ustedes: "en" },
    preterite: { yo: "í",    tu: "iste",  el: "ió",   nosotros: "imos",  ustedes: "ieron" },
    imperfect: { yo: "ía",   tu: "ías",   el: "ía",   nosotros: "íamos", ustedes: "ían" },
  },
};

/**
 * The A1 irregulars, spelled out. These are not derivable from the stem, which
 * is what "irregular" means — any attempt to generate them from a rule is a
 * bug waiting for a learner to find.
 */
const IRREGULAR = {
  ser: {
    present:   { yo: "soy",   tu: "eres",  el: "es",    nosotros: "somos",   ustedes: "son" },
    preterite: { yo: "fui",   tu: "fuiste", el: "fue",  nosotros: "fuimos",  ustedes: "fueron" },
    imperfect: { yo: "era",   tu: "eras",  el: "era",   nosotros: "éramos",  ustedes: "eran" },
  },
  estar: {
    present:   { yo: "estoy", tu: "estás", el: "está",  nosotros: "estamos", ustedes: "están" },
    preterite: { yo: "estuve", tu: "estuviste", el: "estuvo", nosotros: "estuvimos", ustedes: "estuvieron" },
    imperfect: { yo: "estaba", tu: "estabas", el: "estaba", nosotros: "estábamos", ustedes: "estaban" },
  },
  ir: {
    // ir and ser share a preterite. This is real, not a copy-paste slip.
    present:   { yo: "voy",   tu: "vas",   el: "va",    nosotros: "vamos",   ustedes: "van" },
    preterite: { yo: "fui",   tu: "fuiste", el: "fue",  nosotros: "fuimos",  ustedes: "fueron" },
    imperfect: { yo: "iba",   tu: "ibas",  el: "iba",   nosotros: "íbamos",  ustedes: "iban" },
  },
  tener: {
    present:   { yo: "tengo", tu: "tienes", el: "tiene", nosotros: "tenemos", ustedes: "tienen" },
    preterite: { yo: "tuve",  tu: "tuviste", el: "tuvo", nosotros: "tuvimos", ustedes: "tuvieron" },
    imperfect: { yo: "tenía", tu: "tenías", el: "tenía", nosotros: "teníamos", ustedes: "tenían" },
  },
  querer: {
    present:   { yo: "quiero", tu: "quieres", el: "quiere", nosotros: "queremos", ustedes: "quieren" },
    preterite: { yo: "quise", tu: "quisiste", el: "quiso", nosotros: "quisimos", ustedes: "quisieron" },
    imperfect: { yo: "quería", tu: "querías", el: "quería", nosotros: "queríamos", ustedes: "querían" },
  },
  poder: {
    present:   { yo: "puedo", tu: "puedes", el: "puede", nosotros: "podemos", ustedes: "pueden" },
    preterite: { yo: "pude",  tu: "pudiste", el: "pudo", nosotros: "pudimos", ustedes: "pudieron" },
    imperfect: { yo: "podía", tu: "podías", el: "podía", nosotros: "podíamos", ustedes: "podían" },
  },
  ver: {
    // Monosyllabic preterite forms carry NO written accent (RAE 2010): «vi»,
    // «vio» — not *ví / *vió. The regular -er table would have produced both
    // with accents, so `ver` has to be listed even though its stem looks tame.
    present:   { yo: "veo",   tu: "ves",   el: "ve",    nosotros: "vemos",   ustedes: "ven" },
    preterite: { yo: "vi",    tu: "viste", el: "vio",   nosotros: "vimos",   ustedes: "vieron" },
    imperfect: { yo: "veía",  tu: "veías", el: "veía",  nosotros: "veíamos", ustedes: "veían" },
  },
  hacer: {
    present:   { yo: "hago",  tu: "haces", el: "hace",  nosotros: "hacemos", ustedes: "hacen" },
    preterite: { yo: "hice",  tu: "hiciste", el: "hizo", nosotros: "hicimos", ustedes: "hicieron" },
    imperfect: { yo: "hacía", tu: "hacías", el: "hacía", nosotros: "hacíamos", ustedes: "hacían" },
  },
  // ── added for m18 (2026-08-18) ────────────────────────────────────────────
  // Every verb below produced a FABRICATED preterite before it was listed:
  // decí, vení, dé, poní, sabí, traí. `conjugate` fell through to the regular
  // -er/-ir table because the lemma simply was not here, and the regular table
  // has no way to know that «decir» has a j-stem. Same defect class as «llegé»
  // (m17 wave) — a module documented as "throws rather than guessing" guessing.
  // The guard below (STRONG_PRETERITE_LEMMAS) is what stops the NEXT one.
  decir: {
    present:   { yo: "digo",  tu: "dices", el: "dice",  nosotros: "decimos", ustedes: "dicen" },
    // j-stem: the ustedes ending is -eron, NOT -ieron. «dijieron» is the
    // classic over-regularisation and it is not a word.
    preterite: { yo: "dije",  tu: "dijiste", el: "dijo", nosotros: "dijimos", ustedes: "dijeron" },
    imperfect: { yo: "decía", tu: "decías", el: "decía", nosotros: "decíamos", ustedes: "decían" },
  },
  venir: {
    present:   { yo: "vengo", tu: "vienes", el: "viene", nosotros: "venimos", ustedes: "vienen" },
    preterite: { yo: "vine",  tu: "viniste", el: "vino", nosotros: "vinimos", ustedes: "vinieron" },
    imperfect: { yo: "venía", tu: "venías", el: "venía", nosotros: "veníamos", ustedes: "venían" },
  },
  dar: {
    // -ar lemma taking -er/-ir preterite endings, and monosyllabic, so no
    // written accents: «di», «dio» — not *dí / *dió (RAE 2010, same rule ver
    // is listed for).
    present:   { yo: "doy",   tu: "das",   el: "da",    nosotros: "damos",   ustedes: "dan" },
    preterite: { yo: "di",    tu: "diste", el: "dio",   nosotros: "dimos",   ustedes: "dieron" },
    imperfect: { yo: "daba",  tu: "dabas", el: "daba",  nosotros: "dábamos", ustedes: "daban" },
  },
  poner: {
    present:   { yo: "pongo", tu: "pones", el: "pone",  nosotros: "ponemos", ustedes: "ponen" },
    preterite: { yo: "puse",  tu: "pusiste", el: "puso", nosotros: "pusimos", ustedes: "pusieron" },
    imperfect: { yo: "ponía", tu: "ponías", el: "ponía", nosotros: "poníamos", ustedes: "ponían" },
  },
  saber: {
    present:   { yo: "sé",    tu: "sabes", el: "sabe",  nosotros: "sabemos", ustedes: "saben" },
    preterite: { yo: "supe",  tu: "supiste", el: "supo", nosotros: "supimos", ustedes: "supieron" },
    imperfect: { yo: "sabía", tu: "sabías", el: "sabía", nosotros: "sabíamos", ustedes: "sabían" },
  },
  traer: {
    // j-stem again: «trajeron», not *trajieron.
    present:   { yo: "traigo", tu: "traes", el: "trae", nosotros: "traemos", ustedes: "traen" },
    preterite: { yo: "traje", tu: "trajiste", el: "trajo", nosotros: "trajimos", ustedes: "trajeron" },
    imperfect: { yo: "traía", tu: "traías", el: "traía", nosotros: "traíamos", ustedes: "traían" },
  },
  andar: {
    present:   { yo: "ando",  tu: "andas", el: "anda",  nosotros: "andamos", ustedes: "andan" },
    preterite: { yo: "anduve", tu: "anduviste", el: "anduvo", nosotros: "anduvimos", ustedes: "anduvieron" },
    imperfect: { yo: "andaba", tu: "andabas", el: "andaba", nosotros: "andábamos", ustedes: "andaban" },
  },
};

/**
 * Verbs whose preterite is IRREGULAR, whether or not this file has a table for
 * them yet. The regular -ar/-er/-ir tables cannot produce a correct form for
 * any of these, and — before this set existed — they did not fail either: they
 * returned a plausible-looking non-word (decí, vení, poní, sabí) that no
 * downstream check could distinguish from a real form.
 *
 * This is the structural version of the m17 «llegé» fix. That one added the
 * missing RULE; this one makes the MISSING TABLE loud. A lemma may be added to
 * this set the moment it is known to be irregular, before anyone writes its
 * table — the failure is then a compile error naming the verb, which is the
 * cheapest possible outcome.
 */
const STRONG_PRETERITE_LEMMAS = new Set([
  "ser", "ir", "estar", "tener", "querer", "poder", "hacer", "ver",
  "decir", "venir", "dar", "poner", "saber", "traer", "andar",
  // Known irregular, deliberately NOT tabled yet — the course does not teach
  // them. Listed so that teaching one fails loudly instead of fabricating.
  "haber", "caber", "conducir", "traducir", "producir", "reducir",
  "sentir", "dormir", "morir", "pedir", "servir", "seguir", "repetir",
  "preferir", "mentir", "vestir", "reir", "sonreir", "elegir", "corregir",
]);

/**
 * SPELLING-CHANGE VERBS. These are *regular* — they keep the regular endings —
 * but Spanish orthography rewrites the stem's final consonant so the SOUND
 * survives the ending's front vowel. Before this table the frame emitted
 * «llegé», «busqué»→*buscé, «empecé»→*empezé for the yo preterite of five
 * verbs already taught by m8–m13. They are not irregular and must not be
 * listed as such; the rule is one line of orthography applied to a regular
 * stem, so it lives here rather than in IRREGULAR.
 *
 * Scope is deliberately narrow: the preterite `yo` cell is the ONLY indicative
 * cell where an -ar stem meets a front vowel. (The same rewrites recur across
 * the present subjunctive, which this course does not teach.)
 */
const ORTHO_AR_YO_PRETERITE = [
  [/car$/, "qué"],  // buscar  → busqué
  [/gar$/, "gué"],  // llegar  → llegué,  pagar → pagué
  [/zar$/, "cé"],   // empezar → empecé,  almorzar → almorcé
];

/**
 * VOWEL-STEM -er/-ir VERBS. When the regular ending starts with an unstressed
 * `i` between two vowels, that `i` becomes `y` (leyó, leyeron) and the
 * remaining forms take a written accent to break the hiatus (leíste, leímos).
 * `leer` is taught at m9; without this the frame produced «leió» and
 * «leieron», neither of which is a Spanish word.
 *
 * `ver` looks like it belongs here and does NOT — its stem vowel is dropped
 * entirely (vi, vio), so it is listed in IRREGULAR above instead.
 */
const VOWEL_STEM_PRETERITE = {
  yo: "í", tu: "íste", el: "yó", nosotros: "ímos", ustedes: "yeron",
};
const ENDS_IN_VOWEL = /[aeiouáéíóú]$/;

/** Inflect a lemma. Throws rather than guessing — a wrong form must not ship. */
export function conjugate(lemma, person, tense = "present") {
  const irr = IRREGULAR[lemma];
  if (irr) {
    const form = irr[tense]?.[person];
    if (!form) throw new Error(`no ${tense}.${person} for irregular "${lemma}"`);
    return form;
  }
  // A verb known to have a strong preterite must never reach the regular
  // table — that path CANNOT produce a correct form for it and will happily
  // return a non-word instead of failing.
  if (STRONG_PRETERITE_LEMMAS.has(lemma)) {
    throw new Error(
      `"${lemma}" has an irregular preterite but no table in morph-es.mjs — ` +
        `add it to IRREGULAR rather than letting the regular endings guess`,
    );
  }
  const group = lemma.slice(-2);
  const table = REGULAR[group];
  if (!table) throw new Error(`"${lemma}" is not -ar/-er/-ir and has no irregular table`);
  const ending = table[tense]?.[person];
  if (!ending) throw new Error(`no ${tense}.${person} ending for -${group}`);
  const stem = lemma.slice(0, -2);

  if (tense === "preterite") {
    if (group === "ar" && person === "yo") {
      for (const [pattern, replacement] of ORTHO_AR_YO_PRETERITE) {
        if (pattern.test(lemma)) return lemma.replace(pattern, replacement);
      }
    }
    if (group !== "ar" && ENDS_IN_VOWEL.test(stem)) {
      return stem + VOWEL_STEM_PRETERITE[person];
    }
  }

  return stem + ending;
}

/** Subject pronouns. Spanish drops them freely; the frame decides when. */
export const PRONOUN = {
  yo: "yo", tu: "tú", el: "él", nosotros: "nosotros", ustedes: "ustedes",
};

/** English subject for each person — `ustedes` is "you all", NOT "they". */
export const EN_SUBJECT = {
  yo: "I", tu: "You", el: "He", nosotros: "We", ustedes: "You all",
};

const DEFINITE = { m: { sg: "el", pl: "los" }, f: { sg: "la", pl: "las" } };
const INDEFINITE = { m: { sg: "un", pl: "unos" }, f: { sg: "una", pl: "unas" } };

/**
 * Agree an adjective with a noun. `-o` adjectives inflect for both gender and
 * number; `-e` and consonant-final ones inflect for number only. Adjectives of
 * nationality (español/española) are the ragged edge — they take a feminine
 * `-a` on a consonant stem — so the pool marks those explicitly rather than
 * letting this function guess.
 */
export function agreeAdj(adj, gender, number = "sg", { nationality = false } = {}) {
  let base = adj;
  if (base.endsWith("o") && gender === "f") base = base.slice(0, -1) + "a";
  else if (nationality && gender === "f" && !/[oae]$/.test(base)) base = base + "a";
  if (number === "pl") base = /[aeiouáéíóú]$/.test(base) ? base + "s" : base + "es";
  return base;
}

/** Determiner + agreed adjective + noun, in Spanish order (adj follows). */
export function np(noun, { gender, number = "sg", det = "def", adj = null, nationality = false } = {}) {
  const table = det === "indef" ? INDEFINITE : det === "def" ? DEFINITE : null;
  const pluralNoun = number === "pl" ? (/[aeiouáéíóú]$/.test(noun) ? noun + "s" : noun + "es") : noun;
  const parts = [];
  if (table) parts.push(table[gender][number]);
  parts.push(pluralNoun);
  if (adj) parts.push(agreeAdj(adj, gender, number, { nationality }));
  return parts.join(" ");
}

/** Assemble, then punctuate. Spanish questions need the inverted opener. */
export function sentence(chunks, { question = false, exclaim = false } = {}) {
  const body = chunks.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (question) return `¿${body}?`;
  if (exclaim) return `¡${body}!`;
  return `${body}.`;
}
