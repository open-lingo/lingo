/**
 * frames-es.mjs — Spanish drafting frames.
 *
 * Same contract as `frames.mjs` (JA), with one structural difference that is
 * the whole reason a separate file exists: a JA frame CONCATENATES invariant
 * chunks, because あげます is あげます whoever the subject is. A Spanish frame
 * must INFLECT — so `build()` calls into `morph-es.mjs` rather than joining
 * strings, and agreement stops being something a draft can get wrong.
 *
 * The model's job is unchanged and deliberately small: choose which taught
 * words go together, and write the English gloss. It never writes Spanish.
 */
import { conjugate, PRONOUN, np, sentence } from "./morph-es.mjs";

/**
 * m8 · "Rutinas" — the -ar present-tense paradigm.
 *
 * The module's payload is that ONE ending pattern unlocks fourteen verbs, so
 * the frame varies the person and the verb freely and lets the object slot
 * carry the meaning. Every verb here is regular -ar: that is the point of the
 * module, and an irregular sneaking in would teach the opposite of the lesson.
 */
export const es_m8 = {
  module: "m8",
  lang: "es",

  /** Regular -ar verbs taught in m8. NOT a general verb pool — ser/estar/tener
   *  are taught earlier and are irregular, so they would undercut the module. */
  verbs: [
    { lemma: "hablar", gloss: "to speak" },
    { lemma: "trabajar", gloss: "to work" },
    { lemma: "estudiar", gloss: "to study" },
    { lemma: "comprar", gloss: "to buy" },
    { lemma: "caminar", gloss: "to walk" },
    { lemma: "escuchar", gloss: "to listen to" },
    { lemma: "mirar", gloss: "to watch" },
    { lemma: "cocinar", gloss: "to cook" },
    { lemma: "bailar", gloss: "to dance" },
    { lemma: "cantar", gloss: "to sing" },
    { lemma: "descansar", gloss: "to rest" },
    { lemma: "llegar", gloss: "to arrive" },
    { lemma: "necesitar", gloss: "to need" },
    { lemma: "usar", gloss: "to use" },
  ],

  /**
   * `ustedes` is SECOND person plural ("you all"), not third. It shares a verb
   * form with ellos/ellas, and the first version of this frame quietly used
   * that shared form to print the pronoun «ellos» while asking the model to
   * gloss it — so every ustedes pick was either printed as "they" or rejected
   * for glossing "You". Both were the frame's fault. The conjugation cell is
   * shared; the pronoun and the meaning are not.
   */
  persons: ["yo", "tu", "el", "nosotros", "ustedes"],

  /**
   * Frequency adverbs are m8's second payload, and Spanish PLACES THEM
   * DIFFERENTLY depending on which one it is — so a single flat list produced
   * «ellos llegan nunca» on the first run. That is ungrammatical: a postposed
   * `nunca` requires a preceding `no` («no llegan nunca»). Splitting the list
   * by position moves the rule into the frame, where it is guaranteed.
   */
  frequencyPre: ["siempre", "nunca", "a veces"],
  frequencyPost: ["todos los días", "mucho", "poco"],
  get frequency() {
    return [null, ...this.frequencyPre, ...this.frequencyPost];
  },

  /**
   * Objects the model may choose from — taught nouns only, carrying the gender
   * the agreement engine needs. Intransitive verbs (caminar, descansar,
   * llegar, bailar) take no object; the frame drops the slot for those rather
   * than trusting the model to leave it empty.
   */
  /**
   * NEVER take a direct object. `trabajar` belongs here and was missing on the
   * first run, which let the model produce «tú trabajas el carro» — "you work
   * the car" — and score it as a pass.
   */
  intransitive: new Set(["caminar", "descansar", "llegar", "trabajar"]),

  /**
   * MUST take one. Without an object these are incomplete rather than merely
   * terse: «yo necesito.» is not a sentence a learner should be shown.
   */
  transitive: new Set(["comprar", "necesitar", "usar", "escuchar", "mirar"]),

  /**
   * Fine either way — «ellos cocinan» and «ellos cocinan el pescado» are both
   * good Spanish. The first run marked the bare forms WRONG because the frame
   * only had two categories, so two perfectly usable sentences were scored as
   * failures. The score was misleading in both directions at once.
   */
  optionallyTransitive: new Set(["cocinar", "cantar", "bailar", "estudiar", "hablar"]),

  /**
   * `bare` = takes no Spanish determiner. `mass` = takes no ENGLISH article.
   * These are different axes and conflating them produced false failures: «la
   * música» is correct Spanish and "music" is correct English, so an article
   * check keyed on the Spanish side flags a gloss that is already right.
   */
  /**
   * WHICH OBJECTS EACH VERB MAY TAKE.
   *
   * The first 158-sentence batch was 93% "passing" and included «yo cocino el
   * lápiz» ("I cook the pencil") and «tú hablas el teléfono» ("you talk the
   * phone" — Spanish says *hablar POR teléfono*). Both are perfectly formed and
   * both are nonsense, and no residual check was ever going to catch them
   * without re-encoding world knowledge one assertion at a time.
   *
   * The fix is the pipeline's founding principle: SPEND JUDGMENT ON THE
   * INVENTORY, NEVER ON THE OUTPUT. Narrowing each verb's object pool is a
   * dozen decisions made once, and it makes «cocinar el lápiz» unreachable
   * rather than merely detectable. Output is unbounded; the inventory is not.
   *
   * A verb absent from this map takes no object (see `intransitive`).
   */
  objectsByVerb: {
    comprar: ["libro", "teléfono", "computadora", "carro", "casa", "mochila", "lápiz", "llave"],
    necesitar: ["libro", "teléfono", "computadora", "carro", "dinero", "mochila", "lápiz", "llave"],
    usar: ["teléfono", "computadora", "carro", "mochila", "lápiz", "llave"],
    escuchar: ["música"],
    mirar: ["teléfono", "computadora", "libro", "carro"],
    estudiar: ["inglés", "libro"],
    // hablar takes a LANGUAGE. «hablar el teléfono» is not Spanish — that is
    // *hablar por teléfono*, a prepositional phrase this frame does not build.
    hablar: ["inglés"],
    cantar: [],
    cocinar: [],
    bailar: [],
  },

  objects: [
    { noun: "música", gender: "f", gloss: "music", mass: true },
    { noun: "inglés", gender: "m", gloss: "English", bare: true, mass: true },
    { noun: "libro", gender: "m", gloss: "book" },
    { noun: "teléfono", gender: "m", gloss: "phone" },
    { noun: "computadora", gender: "f", gloss: "computer" },
    { noun: "carro", gender: "m", gloss: "car" },
    { noun: "casa", gender: "f", gloss: "house" },
    { noun: "dinero", gender: "m", gloss: "money", bare: true, mass: true },
    { noun: "mochila", gender: "f", gloss: "backpack" },
    { noun: "lápiz", gender: "m", gloss: "pencil" },
    { noun: "llave", gender: "f", gloss: "key" },
  ],

  /**
   * Assemble. Spanish drops subject pronouns freely; we keep them for `yo`/`tú`
   * at this level because the module is teaching that the ENDING encodes the
   * person — showing the pronoun beside the ending is the contrast that makes
   * the pattern visible. Third person keeps it too, since -a is ambiguous
   * between él/ella/usted without one.
   */
  build({ person, verb, object, freq }) {
    const v = conjugate(verb, person, "present");
    const obj = object
      ? object.bare
        ? object.noun
        : np(object.noun, { gender: object.gender, det: "def" })
      : null;
    const pre = freq && this.frequencyPre.includes(freq) ? freq : null;
    const post = freq && this.frequencyPost.includes(freq) ? freq : null;
    return sentence([PRONOUN[person], pre, v, obj, post]);
  },

  /**
   * Residual checks only — everything the pools already guarantee is absent
   * here on purpose. These catch what a narrowed pool cannot express.
   */
  check({ verb, object, en }) {
    const errs = [];
    if (this.intransitive.has(verb) && object)
      errs.push(`${verb} takes no object but got "${object.noun}"`);
    if (this.transitive.has(verb) && !object)
      errs.push(`${verb} requires an object but got none`);
    if (object) {
      const allowed = this.objectsByVerb[verb] ?? [];
      if (!allowed.includes(object.noun))
        errs.push(`${verb} does not take "${object.noun}" as an object`);
    }
    if (typeof en === "string" && en.trim()) {
      // The module drills PRESENT tense. The model reaches for English past
      // constantly — the same failure the JA frame documents — and the frame
      // cannot see it, because `en` is the one field the frame does not build.
      if (/\b(spoke|worked|studied|bought|walked|listened|watched|cooked|danced|sang|rested|arrived|needed|used)\b/i.test(en))
        errs.push(`past-tense gloss on a present-tense sentence: "${en}"`);
      // Person/gloss agreement across all five persons. The first version
      // only checked "I", so «ellos a veces cantan» glossed "You sing" passed.
      // `ustedes` accepts a bare "You": English does not mark plural on the
      // pronoun, so "You buy the car" is a correct gloss and demanding "You
      // all" rejected ten good sentences in the v2 batch. Third time a residual
      // check, not the model, was the thing that was wrong — they need as much
      // iteration as the content does.
      const SUBJ = { yo: /^\s*I\b/i, tu: /^\s*you\b/i, el: /^\s*(he|she)\b/i,
                     nosotros: /^\s*we\b/i, ustedes: /^\s*(you|they)\b/i };
      const want = SUBJ[this.lastPerson];
      if (want && !want.test(en))
        errs.push(`gloss subject does not match person "${this.lastPerson}": "${en}"`);
      // Bare glosses — "I study book", "He looks at computer". The model drops
      // English articles constantly, and a gloss a native speaker would not
      // write is not shippable even when the Spanish beside it is perfect.
      // `mass` marks nouns that take no ENGLISH article ("music", "money") —
      // a different axis from `bare`, which is about the SPANISH determiner.
      if (object && !object.mass) {
        const head = object.gloss.split(" ").pop();
        const re = new RegExp(`\\b(the|a|an|my|your|his|her|their|our)\\s+\\S*${head}`, "i");
        if (en.toLowerCase().includes(head.toLowerCase()) && !re.test(en))
          errs.push(`gloss is missing an English article before "${head}": "${en}"`);
      }
      // NOTE: the adverb is no longer CHECKED here — it is COMPOSED by
      // `gloss()` below. The check version fired on 12 of 12 sentences: the
      // model omits the frequency adverb from the English essentially always,
      // and «yo nunca descanso» glossed "I rest" is a meaning inversion, not a
      // style miss. A defect the model produces every time is not something to
      // detect, it is something to stop being able to produce.
    }
    return errs;
  },
};

export const ES_FRAMES = { m8: es_m8 };

/**
 * Assert every word a frame can emit is taught by its module.
 *
 * This exists because the m8 frame shipped «café» in its object pool and café
 * is introduced at m10 — a TEACH-FIRST violation (ja inv 33 / es E11) that no
 * residual check could catch, because the sentence containing it is perfectly
 * correct Spanish. Token Miss Rate found it in one run over 158 sentences.
 *
 * TMR is the detector; this is the fix. A pool validated against the taught
 * inventory cannot emit an untaught word at all, which is the difference
 * between finding the bug every time and never writing it.
 */
export async function assertFrameVocabIsTaught(frame) {
  const { esInventory } = await import("./inventory-es.mjs");
  const atoms = await esInventory(frame.module);
  const taught = new Set(atoms.map((a) => a.surface.toLowerCase()));

  const problems = [];
  for (const v of frame.verbs) {
    if (!taught.has(v.lemma.toLowerCase())) problems.push(`verb "${v.lemma}"`);
  }
  for (const o of frame.objects) {
    if (!taught.has(o.noun.toLowerCase())) problems.push(`object "${o.noun}"`);
  }
  for (const f of [...frame.frequencyPre, ...frame.frequencyPost]) {
    if (!taught.has(f.toLowerCase())) problems.push(`adverb "${f}"`);
  }
  // Cross-check the per-verb map against the object list, so a typo there is
  // caught too rather than silently narrowing a pool to nothing.
  const known = new Set(frame.objects.map((o) => o.noun));
  for (const [verb, list] of Object.entries(frame.objectsByVerb ?? {})) {
    for (const n of list) if (!known.has(n)) problems.push(`objectsByVerb.${verb} → unknown object "${n}"`);
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let bad = 0;
  for (const [id, frame] of Object.entries(ES_FRAMES)) {
    const problems = await assertFrameVocabIsTaught(frame);
    if (problems.length) {
      bad += 1;
      console.log(`✗ ${id}: ${problems.length} word(s) not taught by ${frame.module}`);
      for (const p of problems) console.log(`    ${p}`);
    } else {
      console.log(`✓ ${id}: every pool word is taught by ${frame.module}`);
    }
  }
  process.exit(bad ? 1 : 0);
}

/**
 * Compose the English gloss: the model supplies the core clause, the frame
 * supplies the adverb.
 *
 * The frame already knows which adverb it placed in the Spanish, so leaving
 * that word to the model was giving away a fact we hold for free — and the
 * model dropped it on 12 of 12 sentences. Same division of labour as the rest
 * of the pipeline: what we know, we build; what needs judgement, we ask for.
 * The model keeps the part it IS good at, which is phrasing the noun ("the
 * book", "music" with no article).
 *
 * English places these two groups differently, so the frame has to know that
 * too: frequency adverbs sit after the subject ("I never rest"), quantity
 * adverbs sit at the end ("I work every day").
 */
const EN_ADVERB = {
  siempre: { word: "always", pos: "pre" },
  nunca: { word: "never", pos: "pre" },
  "a veces": { word: "sometimes", pos: "pre" },
  poco: { word: "rarely", pos: "pre" },
  mucho: { word: "a lot", pos: "end" },
  "todos los días": { word: "every day", pos: "end" },
};

export function gloss(core, freq) {
  const clean = String(core ?? "").trim().replace(/[.]+$/, "");
  if (!freq) return `${clean}.`;
  const a = EN_ADVERB[freq];
  if (!a) return `${clean}.`;
  if (a.pos === "end") return `${clean} ${a.word}.`;
  // Pre-verb means "after the subject", which is the first token for every
  // person this frame emits (I / You / He / We / You all).
  const [subject, ...rest] = clean.split(" ");
  return rest.length ? `${subject} ${a.word} ${rest.join(" ")}.` : `${subject} ${a.word}.`;
}
