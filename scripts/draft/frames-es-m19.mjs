/**
 * frames-es-m19.mjs — the m19 drafting frame: the IMPERFECT, and the aspect
 * contrast that is the whole reason the imperfect exists.
 *
 * ── Why this frame COMPOSES on m17's instead of restating it ────────────────
 * m19 drills exactly the verbs m17 drilled, with exactly the same complements.
 * Only the ENDING changes, and the imperfect is the most regular paradigm in
 * Spanish — three irregular verbs in the entire language. Retyping 24 verbs and
 * their complement tables to change a suffix would be 300 lines of new surface
 * for a fact `morph-es.mjs` already knows, and every one of those lines is a
 * chance to mistype a gloss. So this frame imports `es_m17` and overrides the
 * three things that genuinely differ: the tense, the time markers, and the rule
 * that binds them.
 *
 * m18 did the opposite — its own file, its own tables — and that was also
 * right: m18's verbs, complement shapes and time rules all differ from m17's.
 * The test is not "new module ⇒ new frame", it is "does the inventory differ".
 *
 * ── THE ASPECT RULE, which is the module ────────────────────────────────────
 * Spanish does not let the speaker choose freely between preterite and
 * imperfect. The time expression decides:
 *
 *   «Ayer hablé con María»      — a bounded occasion ⇒ PRETERITE
 *   «Siempre hablaba con María» — a habit, unbounded ⇒ IMPERFECT
 *
 * «Ayer hablaba con María» and «Siempre hablé con María» are both wrong, and
 * they are the two errors every English speaker makes, because English marks
 * neither distinction on the verb.
 *
 * So the frame **derives the tense from the marker** rather than accepting it
 * as a parameter, and refuses a mismatch. A drafted sentence in this module
 * physically cannot carry the wrong aspect — which is the same move that made
 * «Yo tuve un perro ayer» unreachable in m18, applied to the fact m19 teaches.
 * A residual check that scored aspect after the fact would be guessing at the
 * one thing the module exists to make certain.
 */
import { conjugate, PRONOUN, EN_SUBJECT } from "./morph-es.mjs";
import { es_m17, assertFrameVocabIsTaught, loadNouns } from "./frames-es-a2.mjs";
import { es_m18, enVerbFor } from "./frames-es-m18.mjs";

export { assertFrameVocabIsTaught, loadNouns };

/**
 * PUNCTUAL markers bound an event to an occasion. They select the preterite,
 * and they are exactly m17's set — the learner already owns all six, which is
 * what lets m19 spend its whole budget on the contrast rather than on vocabulary.
 */
const PUNCTUAL = es_m17.time;

/**
 * HABITUAL markers describe a repeated or unbounded state. They select the
 * imperfect.
 *
 * All four frequency adverbs are taught by m10; the three day-part phrases are
 * taught by m13. Nothing here is new vocabulary, deliberately: m19 introduces a
 * PARADIGM and a RULE, and a module that introduces both plus new words teaches
 * none of the three.
 *
 * `de niño` / `cuando era joven` are the other canonical imperfect frames and
 * are NOT here — neither is taught, and both need a subordinate clause the
 * course has not introduced.
 */
const HABITUAL = [
  // `esPos`/`enPos` are POSITION, and they are not cosmetic. Spanish frequency
  // adverbs sit BEFORE the verb — «Yo siempre hablaba inglés», never
  // «Yo hablaba inglés siempre», and «Yo compraba el libro nunca» is flatly
  // wrong rather than merely marked. The first build of this frame appended
  // every marker sentence-finally, the way m17's punctual markers go, and
  // produced both of those. English has its own placement and it does not
  // match Spanish's, so the two are tabled separately:
  //   esPos "pre"  → after the pronoun, before the verb
  //   enPos "sub"  → after the subject, before the verb ("I always used to…")
  //   enPos "init" → sentence-initial ("Sometimes I would…" — "I sometimes
  //                  would eat" is the kind of English no one writes)
  //   "post"       → sentence-final, which is where the day-part phrases and
  //                  every punctual marker go in both languages
  { es: "siempre", en: "always", esPos: "pre", enPos: "sub" },
  { es: "a veces", en: "Sometimes", esPos: "pre", enPos: "init" },
  { es: "nunca", en: "never", esPos: "pre", enPos: "sub" },
  { es: "todos los días", en: "every day", esPos: "post", enPos: "post" },
  { es: "por la mañana", en: "in the morning", esPos: "post", enPos: "post" },
  { es: "por la tarde", en: "in the afternoon", esPos: "post", enPos: "post" },
  { es: "por la noche", en: "at night", esPos: "post", enPos: "post" },
];

const PUNCTUAL_ES = new Set(PUNCTUAL.map((t) => t.es));
const HABITUAL_ES = new Set(HABITUAL.map((t) => t.es));

/** The tense a marker selects. This is the whole module in one function. */
function tenseFor(time) {
  if (time === null || time === undefined) return null;
  if (PUNCTUAL_ES.has(time)) return "preterite";
  if (HABITUAL_ES.has(time)) return "imperfect";
  return null;
}

/**
 * English needs its own habitual marking, and it is not the simple past.
 * «Siempre hablaba español» is "I always SPOKE Spanish" only if the reader
 * supplies the habitual reading themselves; "I always USED TO speak Spanish"
 * makes it explicit and is what the learner needs to see, because the whole
 * difficulty is that English leaves this to context.
 *
 * "used to" is wrong with `nunca` ("I never used to speak" is odd) and with the
 * day-part phrases ("in the morning I used to eat" over-reads a single habit),
 * so the frame picks per marker rather than applying one rule.
 */
const EN_HABITUAL_STYLE = {
  siempre: "usedTo",
  "a veces": "would",
  // "I never used to buy the book" over-reads; the plain past already carries
  // the habitual reading once «nunca» is present.
  nunca: "plain",
  "todos los días": "usedTo",
  "por la mañana": "would",
  "por la tarde": "would",
  "por la noche": "would",
};

/**
 * English past of a verb, in the habitual reading. `es_m17`'s `en` field is the
 * simple past ("spoke"), and the infinitive is on `enInf` as "to speak" — so
 * "used to speak" is `enInf` minus its "to ".
 */
function enHabitual(v, style, person, object) {
  // Resolve the SAME per-person / per-object gloss the parent frame used to
  // build `base.en`. Taking `v.en` directly would look for "saw" in a sentence
  // that says "watched", and the guard below would (correctly) throw.
  const g = enVerbFor(v, person, object);
  const bare = g.enInf.replace(/^to /, "");
  if (style === "usedTo") return `used to ${bare}`;
  if (style === "would") return `would ${bare}`;
  return g.en; // plain simple past, for «nunca»
}

/**
 * `desayunar` is excluded. Its English is DISCONTINUOUS — "had bread for
 * breakfast" wraps the object — so the habitual form composes to "would have
 * breakfast bread". Same class as m18's «pagar» doubling its preposition and
 * m18's «poder» having no complement: a verb whose gloss will not compose is
 * removed from the inventory rather than patched at the output. Every other
 * verb in m17's table composes cleanly (checked, all 24).
 */
const EXCLUDED = new Set(["desayunar"]);
const M17_VERBS = es_m17.verbs.filter((v) => !EXCLUDED.has(v.lemma));

/**
 * ── THE THREE IRREGULARS, and why only two of them get sentences ────────────
 *
 * The imperfect has exactly three irregular verbs in the whole language: ser
 * (era), ir (iba), ver (veía). A module that teaches the imperfect and omits
 * them teaches a paradigm the learner cannot use, because «era» and «iba» are
 * two of the most common words in spoken Spanish.
 *
 * `morph-es.mjs` spells all three correctly. What decides whether m19 can put
 * one in a SENTENCE is whether some frame owns its complement table:
 *
 *   ir  → es_m18 has it («al parque», «a la escuela», …)   ⇒ sentences
 *   ver → es_m18 has it («la película», «el partido», …)   ⇒ sentences
 *   ser → NO frame has it. «Yo era maestro» needs a bare role noun, and this
 *         course has never set roles up as a frame slot — every object in
 *         both parent frames takes a determiner. Inventing one here to reach
 *         «era» would be the frame guessing at Spanish, which is the one thing
 *         these frames exist not to do.
 *
 * So `era` is taught at FORM level in lesson 6 — phrase card, spelling MCQ,
 * match, self-explanation — alongside iba/veía sentences that carry the
 * lesson's generation steps. Same call m18 made for «pude»: the module claims
 * the form it can drill honestly and does not manufacture a context for it.
 */
const BORROWED = ["ir", "ver"];
const M18_VERBS = BORROWED.map((l) => {
  const v = es_m18.verbs.find((x) => x.lemma === l);
  if (!v) throw new Error(`m19: es_m18 no longer carries "${l}" — the borrow is broken`);
  return v;
});
const BORROWED_SET = new Set(BORROWED);

const USABLE_VERBS = [...M17_VERBS, ...M18_VERBS];
const BY_LEMMA = Object.fromEntries(USABLE_VERBS.map((v) => [v.lemma, v]));

/** Which parent frame owns a verb's complements, its article choices and its
 *  English gloss. m19 owns the tense and nothing else. */
const parentFor = (verb) => (BORROWED_SET.has(verb) ? es_m18 : es_m17);

/**
 * Place a marker in a finished sentence, keeping the final period.
 *
 * The SUBJECT is passed in rather than inferred. An earlier version inserted
 * after the first word, on the reasoning that both languages open with a
 * one-word subject pronoun — and Spanish does («Yo», «Tú», «Él», «Nosotros»,
 * «Ustedes» are all one word), but English does not: `ustedes` is "You all".
 * That produced "You always all used to go to the park" and "You never all
 * worked", which no gate could see because they are not ungrammatical Spanish
 * and not ungrammatical anything — they are just not English. Reading the
 * compiled file is what found them.
 *
 * So the boundary is now given, and asserted. A sentence that does not start
 * with the subject it was built from is a frame bug, and it throws here rather
 * than producing a subtly reordered gloss.
 */
function place(sentence, marker, pos, subject) {
  const body = sentence.replace(/\.$/, "");
  if (pos === "post") return `${body} ${marker}.`;
  if (pos === "init") {
    return `${marker} ${body.charAt(0).toLowerCase()}${body.slice(1)}.`;
  }
  // The parent frames capitalise the finished sentence, so the subject table's
  // «ustedes» has to be matched as «Ustedes».
  const cap = subject.charAt(0).toUpperCase() + subject.slice(1);
  const head = body.startsWith(subject) ? subject : body.startsWith(cap) ? cap : null;
  if (!head) {
    throw new Error(
      `m19: cannot place "${marker}" — "${body}" does not begin with its subject "${subject}"`,
    );
  }
  return `${head} ${marker}${body.slice(head.length)}.`;
}

export const es_m19 = {
  id: "es-m19",
  module: "m19",
  lang: "es",
  topic: "the imperfect, and when Spanish demands it",
  persons: es_m17.persons,
  verbs: USABLE_VERBS,
  // ir and ver both REQUIRE their complement in es_m18 («Yo iba» alone is a
  // fragment), so neither joins the intransitive set.
  intransitive: es_m17.intransitive,
  optional: es_m17.optional,
  objectsByVerb: {
    ...Object.fromEntries(
      Object.entries(es_m17.objectsByVerb).filter(([k]) => !EXCLUDED.has(k)),
    ),
    ...Object.fromEntries(BORROWED.map((l) => [l, es_m18.objectsByVerb[l] ?? []])),
  },

  /** BOTH marker sets. The frame is bilingual in aspect on purpose — half of
   *  m19's sentences must be preterite or the contrast has nothing to contrast
   *  against, and a module that only ever shows the new form teaches the
   *  learner that the old one is retired. */
  time: [...HABITUAL, ...PUNCTUAL],

  /**
   * NOT `es_m17.slots`. Two of the four differ, and inheriting them would have
   * put the model outside the module:
   *   `time` — m17 offers six punctual markers and lets the slot be "none".
   *            m19 offers thirteen and forbids "none", because the marker is
   *            what selects the tense; a pick without one has no aspect to
   *            teach and `build` throws on it.
   *   `verb` — `desayunar` is out of m19's inventory (see EXCLUDED), so it must
   *            be out of the schema too. A model cannot pick what the enum
   *            does not contain, which is the cheapest place to enforce it.
   */
  /** Exposed on the frame so the assembler can honour a `tenseIs` draw —
   *  it is the frame, not the compiler, that knows which marker means what. */
  tenseFor,

  slots: {
    ...es_m17.slots,
    verb: { ...es_m17.slots.verb, enum: USABLE_VERBS.map((v) => v.lemma) },
    // The borrowed verbs bring their own complements. m17's object enum is
    // bare nouns («libro»); m18's ir/ver take whole phrases («al parque»,
    // «la película»). Without them in the enum the model can only offer ir a
    // noun it may not take, and the frame rejects all ten cells — which is
    // exactly what the first m19 draft did, silently, reporting only that ten
    // picks were "rejected by the frame".
    object: {
      ...es_m17.slots.object,
      enum: [
        ...new Set([
          ...es_m17.slots.object.enum,
          ...BORROWED.flatMap((l) => es_m18.objectsByVerb[l] ?? []),
        ]),
      ],
    },
    time: {
      enum: [...HABITUAL, ...PUNCTUAL].map((t) => t.es),
      optional: false,
      describe: "when — REQUIRED, and it decides the tense",
    },
  },

  rules: [
    ...es_m17.rules.filter((r) => !/preterite/i.test(r)),
    "The TIME MARKER decides the tense. You do not choose it.",
    `These demand the imperfect (a habit): ${[...HABITUAL_ES].join(", ")}.`,
    `These demand the preterite (one occasion): ${[...PUNCTUAL_ES].join(", ")}.`,
    "Never combine a habitual marker with a preterite verb, or the reverse.",
    "Every sentence must carry a time marker — without one there is no aspect to teach.",
  ],

  vocabSurfaces: es_m17.vocabSurfaces,

  build({ person, verb, object, time }) {
    const v = BY_LEMMA[verb];
    if (!v) throw new Error(`unknown verb "${verb}"`);

    // The marker is not optional in this module, and this is not a style
    // preference: an aspect-contrast sentence with nothing selecting the aspect
    // is a sentence where both tenses are correct, which is the exact opposite
    // of the lesson.
    if (!time) {
      throw new Error(
        `m19 sentences require a time marker — it is what selects the tense`,
      );
    }
    const tense = tenseFor(time);
    if (!tense) throw new Error(`time "${time}" is not in the m19 pool`);

    // Delegate every non-aspect judgment — complement legality, the bare
    // language-name rule, article selection, the English gloss of the object —
    // to the frame that already got them right. Reimplementing any of it here
    // is how the two frames would drift.
    //
    // Built with NO marker, so what comes back is the sentence minus the one
    // part m19 owns. The imperfect is then produced by substituting two tokens
    // rather than by reassembling from word positions: an earlier version
    // sliced both strings by index and broke on every multi-word complement
    // and on the verbs whose English is two words ("listened to", "had for
    // breakfast").
    const parent = parentFor(verb);
    const base = parent.build({ person, verb, object, time: null });
    if (tense === "preterite") {
      // Punctual markers are sentence-final in both languages — m17's shape.
      const pt = PUNCTUAL.find((x) => x.es === time);
      return {
        ...base,
        es: place(base.es, time, "post", PRONOUN[person]),
        en: place(base.en, pt.en, "post", EN_SUBJECT[person]),
        time,
        tense,
      };
    }

    const conj = conjugate(verb, person, tense);
    const t = HABITUAL.find((x) => x.es === time);
    const enVerb = enHabitual(v, EN_HABITUAL_STYLE[time] ?? "usedTo", person, object);

    const esPret = conjugate(verb, person, "preterite");
    if (!base.es.includes(esPret)) {
      throw new Error(
        `m19: cannot find "${esPret}" in "${base.es}" to re-tense — the m17 frame's output shape changed`,
      );
    }
    const enBase = enVerbFor(v, person, object).en;
    if (!base.en.includes(enBase)) {
      throw new Error(
        `m19: cannot find "${enBase}" in "${base.en}" to re-word — check the verb's en/enInf/enByObject`,
      );
    }

    return {
      es: place(base.es.replace(esPret, conj), t.es, t.esPos, PRONOUN[person]),
      en: place(base.en.replace(enBase, enVerb), t.en, t.enPos, EN_SUBJECT[person]),
      conj,
      verb,
      person,
      object: object ?? null,
      time,
      tense: "imperfect",
    };
  },

  /**
   * The distractor set for a "pick the imperfect" cloze or MCQ.
   *
   * The generic assembler builds these WITHIN one tense — present of the same
   * person, another person's imperfect, the infinitive. Every one of those is a
   * plausible wrong answer in a module that teaches a paradigm, and none of
   * them is the wrong answer m19 exists to prevent. The learner's actual error
   * is «Siempre hablé» for «Siempre hablaba», and a four-option cloze that
   * never offers the preterite cannot detect it.
   *
   * So the SAME PERSON'S PRETERITE goes first, always. The rest fill in behind
   * it. Two collisions are handled rather than hoped past: for -ar verbs the
   * nosotros preterite and present are the same word («hablamos»), and for -ir
   * verbs so are the nosotros preterite and present («vivimos») — a duplicated
   * option is a broken step, and the top-up loop is what keeps four distinct.
   */
  formDistractors(verb, person, { conjugate: conj, PERSONS: people }) {
    const right = conj(verb, person, "imperfect");
    const out = [];
    const add = (f) => {
      if (f && f !== right && !out.includes(f)) out.push(f);
    };

    add(conj(verb, person, "preterite")); // the aspect competitor — the point
    add(conj(verb, person, "present"));
    for (const o of people.filter((x) => x !== person)) {
      if (out.length >= 3) break;
      add(conj(verb, o, "imperfect"));
    }
    for (const o of people.filter((x) => x !== person)) {
      if (out.length >= 3) break;
      add(conj(verb, o, "preterite"));
    }
    if (out.length < 3) {
      throw new Error(`m19.formDistractors: only ${out.length} for ${verb}.${person}`);
    }
    return out.slice(0, 3);
  },

  /** Residual checks only. Aspect is guaranteed by `build`, not scored here —
   *  this catches an inventory bug, not a model mistake. */
  check(pick) {
    const errs = [...parentFor(pick.verb).check({ ...pick, time: null })];
    if (!pick.time) errs.push("m19 sentences require a time marker");
    const want = tenseFor(pick.time);
    if (pick.time && !want) errs.push(`"${pick.time}" is not an m19 marker`);
    return errs;
  },
};

export const ES_M19_FRAMES = { m19: es_m19 };
export { PUNCTUAL, HABITUAL, tenseFor };
