/**
 * m20.ts — «Venir de + infinitif» — the recent-past construction.
 *
 * AUTHORED 2026-09-10 per docs/fr-m20-brief-2026-09-10.md. The learner
 * already owns «venir»/«venu»/«venue» as the motion-verb passé composé
 * (m16: «Hugo est venu de Lyon» = Hugo came from Lyon) — this module teaches
 * the PRESENT-TENSE chunks «je viens de / tu viens de / il vient de /
 * elle vient de» fronting a plain infinitive as the recent-past marker
 * ("I just...", "he's just..."). Same root, third job in the course
 * ("same chrome, second job": m18 ne...pas→jamais/rien/plus, m19 je
 * vais→near future, m20 venir→recent past).
 *
 * SCOPE DECISIONS (brief §7, executed not re-litigated):
 *   - New atoms: exactly four phrase atoms — «je viens de», «tu viens
 *     de», «il vient de», «elle vient de». Verified in code: present-
 *     tense «viens»/«vient» are registered NOWHERE in m1-m19 (only
 *     «venir»/«venu»/«venue», m16, all passé-composé/infinitive uses).
 *     No «on vient de» atom — the brief scopes exactly four chunks;
 *     «on» stays out of this frame this module (it keeps its existing
 *     m5/m19 «on va»/«on habite» jobs only).
 *   - «il y a» — the brief flagged this as possibly already shipped.
 *     VERIFIED TRUE: m4.ts registers it (fromModule "m4", phrase atom).
 *     Not re-registered, not otherwise used here — brief's own flag
 *     resolved, no action needed.
 *   - Infinitives fronted: exactly three — manger (m14), parler (m11),
 *     visiter (m15). «habiter» (m11) is DELIBERATELY EXCLUDED: it is the
 *     only vowel-onset infinitive candidate, and an unelided "vient de
 *     habiter" is wrong French while the correct elided "vient
 *     d'habiter" form is not a taught surface (d'-elision is deferred
 *     course-wide per the playbook §6). Confirmed via
 *     docs/fr-speech-recent-past-2026-09-10.md: the matcher grades
 *     "vient d'habiter" fine (0.952) — so this is an AUTHORING-
 *     CORRECTNESS call, not a grading gap, and stays excluded regardless.
 *   - Subject×infinitive coverage (all 12 combinations across the module,
 *     each debuted written-first before any speaking use):
 *       je+manger L1, tu+manger L1, il+visiter L2, elle+visiter L2,
 *       je+parler L3, tu+parler L3, il+manger L4, elle+manger L4,
 *       tu+visiter L5, il+parler L5, je+visiter L7.
 *     «elle+parler» is DELIBERATELY WITHHELD from every teaching lesson
 *     and reserved for the checkpoint (L8) as a graded, non-recall
 *     speaking TRANSFER TEST of a fresh recombination of two
 *     individually-known elements — mirrors m19's own «elle va parler»
 *     precedent exactly (constraint 5 of the speech doc; distinct from
 *     the teaching-lesson first-exposure ban in constraint applying to
 *     L1-L7/L9/L10).
 *
 * SPEECH-RECENT-PAST CONSTRAINTS (docs/fr-speech-recent-past-2026-09-10.md,
 * applied throughout):
 *   1. Colloquial reductions/elision/participle-homophone spellings of
 *      the frame grade safely — authored freely, no special-casing.
 *   2. NEVER let a `speaking` step's pass/fail discriminate SUBJECT — all
 *      four chunks cross-substitute as passes (je/tu «viens» identical
 *      spelling+sound; il/elle bare phrase both pass). Cast (je/tu, L1/
 *      L3; il/elle gender, L2/L4/L5) is discriminated via build/cloze/
 *      MCQ only, never via a speaking step's grading.
 *   3. «vient»/«viens» vs «bien» (m2) is NOT rejected at any length —
 *      never gate a speaking step's pass/fail on that distinction (no
 *      speaking step in this module targets a bare «vient»/«viens»
 *      against a «bien» foil).
 *   4. Recent-past vs «je vais» (m19, near future) and vs origin-sense
 *      «je viens de Paris» (m2-ish) BOTH false-positive on the matcher —
 *      those two contrasts live in L1's/L6's CARDS (cloze/sentenceMcq),
 *      never in a speaking step.
 *   5. «Written-only» is LIFTED ONLY for L6 (the passé-composé bridge) —
 *      L6 carries exactly one graded, non-recall speaking step targeting
 *      the frame (constraint distinct from the checkpoint's transfer
 *      test). L1/L2/L4/L5/L7/L9/L10 stay written-only for the frame;
 *      L3 (interleave) is written-only too. Only `cue:"recall"` speaking
 *      of NON-FRAME, already-debuted-elsewhere sentences appears in any
 *      lesson before L6.
 *
 * "Real use, not a bare list" (task instruction): every recent-past
 * sentence names what actually just happened — arriving/coming from
 * somewhere (echoing m16's own venir root), finishing a meal, finishing
 * a conversation, finishing a visit — never a bare conjugation drill.
 * L6 contrasts the new frame directly against the already-known passé
 * composé («elle a mangé» / «elle vient de manger» — same event, two
 * ways to say it) so the learner locks the distinction by use. L9/L10
 * close on plans-just-finished dialogue_sims, manually vocabulary-
 * audited turn-by-turn (frSurfaces() has no dialogue_sim case; this
 * module is added to frSimProvenance.test.ts's MODULES array as the
 * course-wide sim gate).
 *
 * Cast: reuses Hugo (L9 integration sim) and Camille (L10 mastery sim),
 * both already-established FR_PROPER_NAMES entries (m16/m19 precedent).
 *
 * VOICING LEDGER — every `cue:"recall"` step and its non-recall source:
 *   - L1 "Hugo est venu de Lyon" recalls m16's own established voicing
 *     (fr-m16-4-speak-hugolyon, exact string match) — thematic venir-root echo opening the
 *     module.
 *   - L2 "il parle français" recalls m11's own established voicing.
 *   - L3 "c'est lundi" recalls m8's own first voicing
 *     (fr-m8-1-speak-lundi).
 *   - L3 "un grand chat" recalls m9's own first voicing
 *     (fr-m9-1-speak-grandchat).
 *   - L4 "ça coûte vingt euros" recalls m12's own established voicing
 *     (fr-m12-6-speak-cacoute).
 *   - L5 "il n'est pas venu de Paris" recalls m16's own established
 *     voicing (fr-m16-6-speak-ilnestpasvenu) — second venir-root echo.
 *   - L6 "je vais au cinéma" recalls m5's own first voicing
 *     (fr-m5-1-speak-aucinema) — ties near-future into the bridge
 *     lesson alongside the new recent-past frame and the already-known
 *     passé composé, all three tenses in one lesson.
 *   - L7 "bonjour" recalls m1's own first voicing
 *     (fr-m1v2-1-speak-bonjour).
 *   - L7 "on va au cinéma demain ?" recalls m5's own established voicing
 *     (fr-m5-4-speak-onvademain) — near-future reach-back, also recalled
 *     by m19.ts's own L6 (multiple modules may recall the same printed
 *     original voicing).
 *   - L9 "j'ai déjà parlé ce matin" recalls m14's own established
 *     voicing (fr-m14-10-speak-fresh) — ties m14's «ce matin»/«déjà»
 *     time-marker family into the integration lesson.
 *   - L10 "Hugo est venu de Lyon" recalls L1's own recall a second time,
 *     for closure symmetry (mirrors m19.ts L10's own reuse of L1's
 *     recall).
 *   Total: 11 recalls, all reaching outside m20 itself; none is ever the
 *   first exposure to the phrase it recalls (each source verified via
 *   direct grep to carry no `cue:"recall"` argument itself).
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

/**
 * Hand-built match_pairs, shape-identical to grammarHelpers' matchPairs(),
 * bypassing the atom registry — same m2-m9 import.meta.glob ordering
 * landmine m17/m18/m19.ts route around (see those files' own comments).
 * Used for EVERY match_pairs step in this module.
 */
function crossModuleMatchPairs(
  idPrefix: string,
  entries: Array<[surface: string, gloss: string]>,
): LessonStep {
  if (entries.length < 6) {
    throw new Error(
      `fr crossModuleMatchPairs(${idPrefix}): needs >= 6 surfaces (got ${entries.length})`,
    );
  }
  return {
    id: `${idPrefix}-match`,
    type: "match_pairs",
    prompt: "Match each French word to its meaning",
    playAudioOnSelect: true,
    pairs: entries.map(([source, target], i) => ({ id: `p-${i}`, source, target })),
    exercisedAtoms: [],
    modality: "recognition",
  } as LessonStep;
}

export const FR_M20_ATOMS: FrAtom[] = [
  atom({
    surface: "je viens de",
    meaningEn: "I just (have just)",
    partOfSpeech: "phrase",
    fromModule: "m20",
    kind: "phrase",
    hint: "zhuh vyeh(n) duh — «venir» present tense + de, fronting a verb = recent past",
  }),
  atom({
    surface: "tu viens de",
    meaningEn: "you just (have just)",
    partOfSpeech: "phrase",
    fromModule: "m20",
    kind: "phrase",
    hint: "tu vyeh(n) duh — same «viens» as «je viens de», different subject",
  }),
  atom({
    surface: "il vient de",
    meaningEn: "he just (has just)",
    partOfSpeech: "phrase",
    fromModule: "m20",
    kind: "phrase",
    hint: "eel vyeh(n) duh — third person, same engine as m19's «il va»",
  }),
  atom({
    surface: "elle vient de",
    meaningEn: "she just (has just)",
    partOfSpeech: "phrase",
    fromModule: "m20",
    kind: "phrase",
    hint: "ell vyeh(n) duh — third person, feminine subject",
  }),
];

/** L1 — bridge: m16's «Hugo est venu de Lyon» (motion, past) into the new
 *  present-tense recent-past frame. Debuts je+manger and tu+manger,
 *  written first. Card 5 carries the origin-vs-recent-past contrast
 *  (constraint 4) — never tested via speaking. Written-only throughout
 *  (constraint 5). */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m20-1-info-bridge",
      "Venir de + any verb",
      "«Il est venu de Lyon» means he came FROM Lyon (a place). Front a verb instead — «je viens de manger» — and it means I JUST ate. Same «venir», new job: just-happened, not a place.",
    ),
    {
      id: "fr-m20-1-map-frame",
      type: "word_map",
      tokens: ["je viens de", "manger"],
      pairs: [
        { en: "I just", tokenIndex: 0 },
        { en: "eaten", tokenIndex: 1 },
      ],
      audioText: "je viens de manger",
      revealNote: "«Je viens de» + a plain infinitive = I just... — no new verb form to learn.",
    },
    cloze(
      "fr-m20-1-cloze-jemange",
      "Je viens de",
      ".",
      "manger",
      ["manger", "mangé"],
      "I just ate",
      "je viens de manger",
    ),
    build(
      "fr-m20-1-build-croissant",
      "Build: 'you just ate a croissant'",
      "tu viens de manger un croissant",
      ["tu viens de", "manger", "un croissant", "mangé"],
      ["tu viens de", "manger", "un croissant"],
    ),
    listeningCompSentence({
      id: "fr-m20-1-lc-tuviensmanger",
      audioText: "tu viens de manger un croissant",
      correctMeaningEn: "You just ate a croissant",
      distractorsEn: [
        "You're going to eat a croissant",
        "You ate a croissant yesterday",
        "You always eat a croissant",
      ],
    }),
    build(
      "fr-m20-1-build-origincontrast",
      "Build: 'I just ate' (not 'I'm coming from Paris')",
      "je viens de manger",
      ["je viens de", "manger", "je vais", "j'ai", "mangé", "Paris"],
      ["je viens de", "manger"],
    ),
    speaking("fr-m20-1-speak-hugolyon-recall", "Hugo est venu de Lyon", "Hugo came from Lyon", [], "recall"),
    build(
      "fr-m20-1-build-pizza",
      "Build: 'I just ate a pizza'",
      "je viens de manger une pizza",
      ["je viens de", "manger", "une pizza", "mangé"],
      ["je viens de", "manger", "une pizza"],
    ),
    listeningCompSentence({
      id: "fr-m20-1-lc-recap",
      audioText: "je viens de manger une pizza",
      correctMeaningEn: "I just ate a pizza",
      distractorsEn: [
        "I'm going to eat a pizza",
        "I ate a pizza yesterday",
        "I eat a pizza every day",
      ],
    }),
    crossModuleMatchPairs("fr-m20-1", [
      ["je viens de", "I just"],
      ["tu viens de", "you just"],
      ["manger", "to eat"],
      ["un croissant", "a croissant"],
      ["une pizza", "a pizza"],
      ["venu", "came"],
    ]),
  ];
}

/** L2 — «Il vient de, elle vient de» debut across the visiter cast,
 *  written first. Interleave: reach-back recall to m11's «il parle
 *  français». Written-only. */
function lesson2(): LessonStep[] {
  return [
    {
      id: "fr-m20-2-map-ilelle",
      type: "word_map",
      tokens: ["il vient de", "elle vient de"],
      pairs: [
        { en: "he just", tokenIndex: 0 },
        { en: "she just", tokenIndex: 1 },
      ],
      audioText: "il vient de manger, elle vient de manger",
      revealNote: "Same engine, third person: «il vient de» / «elle vient de» + a plain infinitive.",
    },
    cloze(
      "fr-m20-2-cloze-ilvisite",
      "Il vient de",
      "le musée.",
      "visiter",
      ["visiter", "visité"],
      "he just visited the museum",
      "il vient de visiter le musée",
    ),
    build(
      "fr-m20-2-build-ellevisite",
      "Build: 'she just visited the park'",
      "elle vient de visiter le parc",
      ["elle vient de", "visiter", "le parc", "visité"],
      ["elle vient de", "visiter", "le parc"],
    ),
    listeningCompSentence({
      id: "fr-m20-2-lc-ellevientdevisiter",
      audioText: "elle vient de visiter le parc",
      correctMeaningEn: "She just visited the park",
      distractorsEn: [
        "She's visiting the park now",
        "She just visited the museum",
        "She's going to visit the park",
      ],
    }),
    build(
      "fr-m20-2-build-ilvientdevisiter",
      "Build: 'he just visited'",
      "il vient de visiter",
      ["il vient de", "visiter", "il visite", "manger", "on vient de"],
      ["il vient de", "visiter"],
    ),
    speaking("fr-m20-2-speak-parle-recall", "il parle français", "he speaks French", [], "recall"),
    cloze(
      "fr-m20-2-cloze-elleaussi",
      "Elle vient de",
      "le musée aussi.",
      "visiter",
      ["visiter", "manger"],
      "she just visited the museum too",
      "elle vient de visiter le musée aussi",
    ),
    listeningCompSentence({
      id: "fr-m20-2-lc-ilvisiteparc-recap",
      audioText: "il vient de visiter le parc",
      correctMeaningEn: "He just visited the park",
      distractorsEn: [
        "He's visiting the park now",
        "He just visited the museum",
        "He visits the park every day",
      ],
    }),
    sentenceMcq({
      id: "fr-m20-2-smcq-ilvisite-recap",
      prompt: "'He visits' (right now) — pick the French.",
      correctText: "il visite",
      distractorsText: ["il vient de visiter", "on va visiter", "il a visité"],
    }),
    crossModuleMatchPairs("fr-m20-2", [
      ["il vient de", "he just"],
      ["elle vient de", "she just"],
      ["visiter", "to visit"],
      ["le musée", "the museum"],
      ["le parc", "the park"],
      ["parle", "speaks (il/elle/on)"],
    ]),
  ];
}

/** L3 — interleave break (time markers, m14's «ce matin»): je+parler and
 *  tu+parler debut, written first. Written-only. */
function lesson3(): LessonStep[] {
  return [
    {
      id: "fr-m20-3-map-cematin",
      type: "word_map",
      tokens: ["ce matin", "je viens de", "parler"],
      pairs: [
        { en: "this morning", tokenIndex: 0 },
        { en: "I just", tokenIndex: 1 },
        { en: "spoken", tokenIndex: 2 },
      ],
      audioText: "ce matin, je viens de parler",
      revealNote: "«Ce matin» sets the time; «viens de parler» says what just happened.",
    },
    cloze(
      "fr-m20-3-cloze-jeparle",
      "Ce matin, je viens de",
      "avec Hugo.",
      "parler",
      ["parler", "parlé"],
      "this morning, I just spoke with Hugo",
      "ce matin, je viens de parler avec Hugo",
    ),
    build(
      "fr-m20-3-build-tuparle",
      "Build: 'you just spoke French this morning'",
      "ce matin, tu viens de parler français",
      ["ce matin", "tu viens de", "parler", "français", "parlé"],
      ["ce matin", "tu viens de", "parler", "français"],
    ),
    listeningCompSentence({
      id: "fr-m20-3-lc-tuparlefrancais",
      audioText: "tu viens de parler français ce matin",
      correctMeaningEn: "You just spoke French this morning",
      distractorsEn: [
        "You're going to speak French this morning",
        "You spoke French yesterday morning",
        "You speak French every morning",
      ],
    }),
    build(
      "fr-m20-3-build-jeviensdeparler",
      "Build: 'I just spoke'",
      "je viens de parler",
      ["je viens de", "parler", "je vais", "j'ai", "parlé", "je parle"],
      ["je viens de", "parler"],
    ),
    speaking("fr-m20-3-speak-lundi-recall", "c'est lundi", "it's Monday", [], "recall"),
    cloze(
      "fr-m20-3-cloze-tuparle-recap",
      "Ce matin, tu viens de",
      ".",
      "parler",
      ["parler", "parlé"],
      "this morning, you just spoke",
      "ce matin, tu viens de parler",
    ),
    listeningCompSentence({
      id: "fr-m20-3-lc-jeparle-recap",
      audioText: "je viens de parler ce matin",
      correctMeaningEn: "I just spoke this morning",
      distractorsEn: [
        "I'm going to speak this morning",
        "I spoke yesterday morning",
        "I speak every morning",
      ],
    }),
    speaking("fr-m20-3-speak-grandchat-recall", "un grand chat", "a big cat", [], "recall"),
    crossModuleMatchPairs("fr-m20-3", [
      ["ce matin", "this morning"],
      ["je viens de", "I just"],
      ["tu viens de", "you just"],
      ["parler", "to speak"],
      ["avec Hugo", "with Hugo"],
      ["français", "French"],
    ]),
  ];
}

/** L4 — il/elle across manger; both pairings debut written first. Sets
 *  up L6's reuse of «elle vient de manger». Written-only. */
function lesson4(): LessonStep[] {
  return [
    {
      id: "fr-m20-4-map-ilmange",
      type: "word_map",
      tokens: ["il vient de", "manger"],
      pairs: [
        { en: "he just", tokenIndex: 0 },
        { en: "eaten", tokenIndex: 1 },
      ],
      audioText: "il vient de manger",
      revealNote: "«Il vient de manger» = he just ate — same frame, new infinitive.",
    },
    cloze(
      "fr-m20-4-cloze-ilmange",
      "Il vient de",
      "un gâteau.",
      "manger",
      ["manger", "mangé"],
      "he just ate cake",
      "il vient de manger un gâteau",
    ),
    build(
      "fr-m20-4-build-ellemange",
      "Build: 'she just ate a pizza'",
      "elle vient de manger une pizza",
      ["elle vient de", "manger", "une pizza", "mangé"],
      ["elle vient de", "manger", "une pizza"],
    ),
    listeningCompSentence({
      id: "fr-m20-4-lc-ellevientdemanger",
      audioText: "elle vient de manger une pizza",
      correctMeaningEn: "She just ate a pizza",
      distractorsEn: [
        "She's eating a pizza now",
        "She just ate cake",
        "She's going to eat a pizza",
      ],
    }),
    build(
      "fr-m20-4-build-ilvientdemanger",
      "Build: 'he just ate'",
      "il vient de manger",
      ["il vient de", "manger", "il a", "mangé", "visiter", "on vient de"],
      ["il vient de", "manger"],
    ),
    speaking("fr-m20-4-speak-cacoute-recall", "ça coûte vingt euros", "it costs twenty euros", [], "recall"),
    cloze(
      "fr-m20-4-cloze-elleaussi",
      "Elle vient de",
      "un gâteau aussi.",
      "manger",
      ["manger", "visiter"],
      "she just ate cake too",
      "elle vient de manger un gâteau aussi",
    ),
    listeningCompSentence({
      id: "fr-m20-4-lc-ilmangegateau-recap",
      audioText: "il vient de manger un gâteau",
      correctMeaningEn: "He just ate cake",
      distractorsEn: [
        "He's eating cake now",
        "He just ate a pizza",
        "He eats cake every day",
      ],
    }),
    sentenceMcq({
      id: "fr-m20-4-smcq-ilmange-recap",
      prompt: "'He ate' (simple past) — pick the French.",
      correctText: "il a mangé",
      distractorsText: ["il vient de manger", "il va manger", "elle a mangé"],
    }),
    crossModuleMatchPairs("fr-m20-4", [
      ["il vient de", "he just"],
      ["elle vient de", "she just"],
      ["manger", "to eat"],
      ["un gâteau", "a cake"],
      ["une pizza", "a pizza"],
      ["aussi", "too"],
    ]),
  ];
}

/** L5 — tu+visiter and il+parler debut, written first (leaves
 *  elle+parler reserved for the checkpoint's transfer test). */
function lesson5(): LessonStep[] {
  return [
    {
      id: "fr-m20-5-map-tuvisite",
      type: "word_map",
      tokens: ["tu viens de", "visiter"],
      pairs: [
        { en: "you just", tokenIndex: 0 },
        { en: "visited", tokenIndex: 1 },
      ],
      audioText: "tu viens de visiter",
      revealNote: "«Tu viens de visiter» = you just visited — same frame you already know.",
    },
    cloze(
      "fr-m20-5-cloze-tuvisite",
      "Tu viens de",
      "la gare.",
      "visiter",
      ["visiter", "visité"],
      "you just visited the station",
      "tu viens de visiter la gare",
    ),
    build(
      "fr-m20-5-build-ilparle",
      "Build: 'he just spoke with Camille'",
      "il vient de parler avec Camille",
      ["il vient de", "parler", "avec Camille", "parlé"],
      ["il vient de", "parler", "avec Camille"],
    ),
    listeningCompSentence({
      id: "fr-m20-5-lc-ilvientdeparler",
      audioText: "il vient de parler avec Camille",
      correctMeaningEn: "He just spoke with Camille",
      distractorsEn: [
        "He's speaking with Camille now",
        "He just visited Camille",
        "He's going to speak with Camille",
      ],
    }),
    build(
      "fr-m20-5-build-tuviensdevisiter",
      "Build: 'you just visited'",
      "tu viens de visiter",
      ["tu viens de", "visiter", "tu visites", "tu vas visiter", "tu as visité"],
      ["tu viens de", "visiter"],
    ),
    speaking("fr-m20-5-speak-venuparis-recall", "il n'est pas venu de Paris", "he didn't come from Paris", [], "recall"),
    cloze(
      "fr-m20-5-cloze-tuvisite-recap",
      "Tu viens de",
      "le musée.",
      "visiter",
      ["visiter", "parler"],
      "you just visited the museum",
      "tu viens de visiter le musée",
    ),
    listeningCompSentence({
      id: "fr-m20-5-lc-ilparlecamille-recap",
      audioText: "il vient de parler avec Camille",
      correctMeaningEn: "He just spoke with Camille",
      distractorsEn: [
        "He speaks with Camille every day",
        "He spoke with Camille yesterday",
        "He's going to speak with Camille",
      ],
    }),
    sentenceMcq({
      id: "fr-m20-5-smcq-ilparle-recap",
      prompt: "'He speaks' (right now) — pick the French.",
      correctText: "il parle",
      distractorsText: ["il vient de parler", "il va parler", "il a parlé"],
    }),
    crossModuleMatchPairs("fr-m20-5", [
      ["tu viens de", "you just"],
      ["il vient de", "he just"],
      ["visiter", "to visit"],
      ["parler", "to speak"],
      ["la gare", "the station"],
      ["avec Camille", "with Camille"],
    ]),
  ];
}

/** L6 — bridge: passé composé vs recent past, same event two ways
 *  («elle a mangé» / «elle vient de manger»), plus near-future recalled
 *  for a three-tense tie-together. "Written-only" is LIFTED here ONLY
 *  (constraint 5): carries exactly one graded, non-recall speaking step
 *  targeting the frame, reusing the ALREADY-debuted elle+manger pairing
 *  (L4) — never a first-exposure pairing, and never gated on subject
 *  discrimination (a single target phrase, not a subject-swap MCQ). */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m20-6-info-contrast",
      "«A mangé» vs «vient de manger»",
      "«Elle a mangé» (passé composé) is the general past — she ate, at some point. «Elle vient de manger» means she just ate, right now. When it really did just happen, either works — but only «vient de» spells out JUST NOW.",
    ),
    cloze(
      "fr-m20-6-cloze-amange",
      "Elle a",
      "une pizza.",
      "mangé",
      ["mangé", "manger"],
      "she ate a pizza",
      "elle a mangé une pizza",
    ),
    build(
      "fr-m20-6-build-vientdemanger",
      "Build: 'she just ate a pizza'",
      "elle vient de manger une pizza",
      ["elle vient de", "manger", "une pizza", "mangé"],
      ["elle vient de", "manger", "une pizza"],
    ),
    listeningCompSentence({
      id: "fr-m20-6-lc-jaimange",
      audioText: "hier, j'ai mangé une pizza",
      correctMeaningEn: "Yesterday, I ate a pizza",
      distractorsEn: [
        "I just ate a pizza",
        "I'm going to eat a pizza",
        "Yesterday, I ate a croissant",
      ],
    }),
    build(
      "fr-m20-6-build-justvspast",
      "Build: 'she just ate'",
      "elle vient de manger",
      ["elle vient de", "manger", "elle a mangé", "elle va manger", "il vient de manger"],
      ["elle vient de", "manger"],
    ),
    speaking("fr-m20-6-speak-cinema-recall", "je vais au cinéma", "I'm going to the cinema", [], "recall"),
    build(
      "fr-m20-6-build-tuasmange",
      "Build: 'you just ate a croissant'",
      "tu viens de manger un croissant",
      ["tu viens de", "manger", "un croissant", "mangé"],
      ["tu viens de", "manger", "un croissant"],
    ),
    speaking(
      "fr-m20-6-speak-vientdemanger",
      "elle vient de manger une pizza",
      "she just ate a pizza",
      ["elle vient de"],
    ),
    cloze(
      "fr-m20-6-cloze-onmange-recap",
      "Hier, on a",
      "un gâteau.",
      "mangé",
      ["mangé", "manger"],
      "yesterday, we ate cake",
      "hier, on a mangé un gâteau",
    ),
    crossModuleMatchPairs("fr-m20-6", [
      ["a mangé", "ate"],
      ["vient de manger", "just ate"],
      ["viens de manger", "just ate (je/tu)"],
      ["hier", "yesterday"],
      ["une pizza", "a pizza"],
      ["un croissant", "a croissant"],
    ]),
  ];
}

/** L7 — interleave break (negation review, m18/m19): debuts je+visiter,
 *  written first, plus reviews the already-known «ne ... pas» frame on
 *  already-debuted pairings only — never a first-exposure pairing inside
 *  a negation. Written-only. */
function lesson7(): LessonStep[] {
  return [
    {
      id: "fr-m20-7-map-jevisite",
      type: "word_map",
      tokens: ["je viens de", "visiter"],
      pairs: [
        { en: "I just", tokenIndex: 0 },
        { en: "visited", tokenIndex: 1 },
      ],
      audioText: "je viens de visiter",
      revealNote: "«Je viens de visiter» = I just visited — the same frame, one more infinitive.",
    },
    cloze(
      "fr-m20-7-cloze-jevisite",
      "Je viens de",
      "le parc.",
      "visiter",
      ["visiter", "visité"],
      "I just visited the park",
      "je viens de visiter le parc",
    ),
    build(
      "fr-m20-7-build-ilnevientpas",
      "Build: 'he didn't just eat cake'",
      "il ne vient pas de manger de gâteau",
      ["il ne vient pas de", "manger", "de gâteau", "mangé"],
      ["il ne vient pas de", "manger", "de gâteau"],
    ),
    sentenceMcq({
      id: "fr-m20-7-smcq-negator",
      prompt: "'Not just...' — pick the correct negator.",
      correctText: "pas",
      distractorsText: ["jamais", "rien", "plus"],
    }),
    listeningCompSentence({
      id: "fr-m20-7-lc-ellenevientpas",
      audioText: "elle ne vient pas de visiter le musée",
      correctMeaningEn: "She didn't just visit the museum",
      distractorsEn: [
        "She's not visiting the museum",
        "She didn't visit the museum yesterday",
        "She didn't just visit the park",
      ],
    }),
    speaking("fr-m20-7-speak-bonjour-recall", "bonjour", "hello", [], "recall"),
    cloze(
      "fr-m20-7-cloze-jevisite-recap",
      "Je viens de",
      "la gare.",
      "visiter",
      ["visiter", "manger"],
      "I just visited the station",
      "je viens de visiter la gare",
    ),
    build(
      "fr-m20-7-build-tunevienspas-recap",
      "Build: 'you didn't just visit the museum'",
      "tu ne viens pas de visiter le musée",
      ["tu ne viens pas de", "visiter", "le musée", "visité"],
      ["tu ne viens pas de", "visiter", "le musée"],
    ),
    speaking("fr-m20-7-speak-onvacinema-recall", "on va au cinéma demain ?", "are we going to the cinema tomorrow?", [], "recall"),
    crossModuleMatchPairs("fr-m20-7", [
      ["je viens de", "I just"],
      ["il ne vient pas de", "he didn't just"],
      ["elle ne vient pas de", "she didn't just"],
      ["visiter", "to visit"],
      ["le parc", "the park"],
      ["la gare", "the station"],
    ]),
  ];
}

/** L8 — checkpoint: zero-new content words, every step graded. Includes
 *  the deliberate TRANSFER TEST «elle vient de parler» — elle+parler is
 *  never paired before this lesson (elle only ever paired with
 *  visiter/manger earlier; parler only ever paired with je/tu/il), so
 *  this is a graded, non-recall speaking of a fresh RECOMBINATION of two
 *  individually-taught elements — legal at a checkpoint (constraint 5),
 *  distinct from a teaching-lesson debut, mirrors m19's own «elle va
 *  parler» precedent exactly. */
function checkpointLesson(): LessonStep[] {
  return [
    build(
      "fr-m20-8-build-jeviensdemanger",
      "Build: 'I just ate' (not the Paris one!)",
      "je viens de manger",
      ["je viens de", "manger", "je vais", "j'ai", "mangé", "Paris"],
      ["je viens de", "manger"],
    ),
    cloze(
      "fr-m20-8-cloze-ilvisite",
      "Il vient de",
      "le musée.",
      "visiter",
      ["visiter", "manger"],
      "he just visited the museum",
      "il vient de visiter le musée",
    ),
    speaking(
      "fr-m20-8-speak-tuviensdevisiter",
      "tu viens de visiter la gare",
      "you just visited the station",
      ["tu viens de"],
    ),
    build(
      "fr-m20-8-build-ellevisite",
      "Build: 'she just visited the park'",
      "elle vient de visiter le parc",
      ["elle vient de", "visiter", "le parc", "visité"],
      ["elle vient de", "visiter", "le parc"],
    ),
    speaking(
      "fr-m20-8-speak-elleparle",
      "elle vient de parler",
      "she just spoke",
      ["il vient de", "elle vient de"],
    ),
    listeningCompSentence({
      id: "fr-m20-8-lc-ilmange",
      audioText: "il vient de manger un gâteau",
      correctMeaningEn: "He just ate cake",
      distractorsEn: [
        "He's eating cake now",
        "He just ate a pizza",
        "He's going to eat cake",
      ],
    }),
    sentenceMcq({
      id: "fr-m20-8-smcq-negator",
      prompt: "'Not just...' — pick the correct negator.",
      correctText: "pas",
      distractorsText: ["jamais", "rien", "plus"],
    }),
    // Was a `speaking` step (fr-m20-8-speak-ilnevientpas) — retired
    // 2026-09-10 (docs/fr-speech-negated-frames-2026-09-10.md): the fuzzy
    // speech matcher cannot discriminate a negated target from its
    // truth-flipped affirmative (or from a wrong-negator swap), so a
    // negated-vs-affirmative contrast may never be graded via `speaking`.
    // The sibling affirmative «elle vient de manger une pizza» (L6) stays
    // a graded speaking of this frame; this step now discriminates the
    // SAME contrast (negated vs. affirmative, and which negator) via a
    // build tile bank instead, which grades exact tile order and cannot
    // pass on a dropped or swapped negator. Same target sentence, same
    // audioKey text — no new voiced string. Placed right after the
    // word-level negator MCQ above rather than at the old slot: a
    // full-sentence multiple_choice is test-out-only
    // (lintFullSentenceMcqs), and the old slot sat between two other
    // build/cloze steps, so a straight in-place swap would have created
    // an adjacent-same-type run either way.
    build(
      "fr-m20-8-build-ilnevientpas",
      "Build: 'he didn't just eat cake'",
      "il ne vient pas de manger de gâteau",
      [
        "il ne vient pas de",
        "manger",
        "de gâteau",
        "il vient de",
        "il ne vient jamais de",
      ],
      ["il ne vient pas de", "manger", "de gâteau"],
      ["il vient de"],
    ),
    cloze(
      "fr-m20-8-cloze-amange",
      "Hier, j'ai",
      "un croissant.",
      "mangé",
      ["mangé", "manger"],
      "yesterday, I ate a croissant",
      "hier, j'ai mangé un croissant",
    ),
    build(
      "fr-m20-8-build-jevisite",
      "Build: 'I just visited the station'",
      "je viens de visiter la gare",
      ["je viens de", "visiter", "la gare", "visité"],
      ["je viens de", "visiter", "la gare"],
    ),
    cloze(
      "fr-m20-8-cloze-tuparle",
      "Tu viens de",
      "avec Hugo ?",
      "parler",
      ["parler", "manger"],
      "did you just speak with Hugo?",
      "tu viens de parler avec Hugo ?",
    ),
    crossModuleMatchPairs("fr-m20-8", [
      ["je viens de", "I just"],
      ["tu viens de", "you just"],
      ["il vient de", "he just"],
      ["elle vient de", "she just"],
      ["manger", "to eat"],
      ["visiter", "to visit"],
    ]),
  ];
}

/** L9 — integration: «Tu viens de manger ?» dialogue_sim, manually
 *  vocabulary-audited (dialogue_sim is invisible to the automated vocab-
 *  provenance gate — frSurfaces() has no case for it — and machine-gated
 *  by frSimProvenance.test.ts once this module lands in its MODULES
 *  array). */
function lesson9(): LessonStep[] {
  return [
    build(
      "fr-m20-9-build-tuviensdevisiter",
      "Build: 'did you just visit the museum?'",
      "tu viens de visiter le musée ?",
      ["tu viens de", "visiter", "le musée ?", "tu visites", "tu as visité", "tu vas visiter"],
      ["tu viens de", "visiter", "le musée ?"],
    ),
    cloze(
      "fr-m20-9-cloze-cematin",
      "Ce matin, il vient de",
      "avec Camille.",
      "parler",
      ["parler", "manger"],
      "this morning, he just spoke with Camille",
      "ce matin, il vient de parler avec Camille",
    ),
    build(
      "fr-m20-9-build-jeviensdemanger",
      "Build: 'I just ate a pizza with you'",
      "je viens de manger une pizza avec toi",
      ["je viens de", "manger", "une pizza", "avec toi", "mangé"],
      ["je viens de", "manger", "une pizza", "avec toi"],
    ),
    listeningCompSentence({
      id: "fr-m20-9-lc-ellevientdevisiter",
      audioText: "elle vient de visiter le musée",
      correctMeaningEn: "She just visited the museum",
      distractorsEn: [
        "She's visiting the museum now",
        "She just visited the park",
        "She's going to visit the museum",
      ],
    }),
    speaking("fr-m20-9-speak-deja-recall", "j'ai déjà parlé ce matin", "I already spoke this morning", [], "recall"),
    cloze(
      "fr-m20-9-cloze-ilvisiteparis",
      "Il vient de",
      "à Paris.",
      "visiter",
      ["visiter", "manger"],
      "he just visited Paris",
      "il vient de visiter à Paris",
    ),
    build(
      "fr-m20-9-build-ellenevientpas",
      "Build: 'she didn't just eat cake'",
      "elle ne vient pas de manger de gâteau",
      ["elle ne vient pas de", "manger", "de gâteau", "mangé"],
      ["elle ne vient pas de", "manger", "de gâteau"],
    ),
    listeningCompSentence({
      id: "fr-m20-9-lc-ilparlecamille-recap",
      audioText: "ce matin, il vient de parler avec Camille",
      correctMeaningEn: "This morning, he just spoke with Camille",
      distractorsEn: [
        "This morning, he's speaking with Camille",
        "Yesterday morning, he spoke with Camille",
        "This morning, he just spoke with Hugo",
      ],
    }),
    crossModuleMatchPairs("fr-m20-9", [
      ["ce matin", "this morning"],
      ["avec toi", "with you"],
      ["visiter", "to visit"],
      ["manger", "to eat"],
      ["le musée", "the museum"],
      ["un gâteau", "a cake"],
    ]),
    {
      id: "fr-m20-9-sim-arrivee",
      type: "dialogue_sim",
      scene: { emoji: "🚉", title: "Hugo checks in" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-manger",
          npc: {
            speaker: "Hugo",
            kana: "Salut ! Tu viens de manger ?",
            audioText: "salut ! tu viens de manger ?",
            gloss: "Hi! Did you just eat?",
          },
          goal: "Say yes, you just ate a croissant.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, je viens de manger un croissant" },
              { id: "wrong-past", text: "oui, j'ai mangé un croissant hier" },
              { id: "wrong-no", text: "non, je ne vais pas manger" },
            ],
            correctOptionId: "correct",
            audioText: "oui, je viens de manger un croissant",
          },
          replyGloss: "Yes, I just ate a croissant.",
        },
        {
          id: "t2-visiter",
          npc: {
            speaker: "Hugo",
            kana: "Et Camille, elle vient de visiter le musée ?",
            audioText: "et camille, elle vient de visiter le musée ?",
            gloss: "And Camille, did she just visit the museum?",
          },
          goal: "Say yes, she just visited the museum.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, elle vient de visiter le musée" },
              { id: "wrong-no", text: "non, elle ne vient pas de visiter" },
              { id: "wrong-past", text: "oui, elle a visité le musée" },
            ],
            correctOptionId: "correct",
            audioText: "oui, elle vient de visiter le musée",
          },
          replyGloss: "Yes, she just visited the museum.",
        },
      ],
    },
  ];
}

/** L10 — mastery: recap variety, ends on its own dialogue_sim (second
 *  scene, different cast — Camille — different vocabulary mix). */
function lesson10(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m20-10-smcq-jeviensdemanger-recap",
      prompt: "'I just ate' — pick the French.",
      correctText: "je viens de manger",
      distractorsText: ["je viens de Paris", "j'ai mangé", "je vais manger"],
    }),
    cloze(
      "fr-m20-10-cloze-ellevisite",
      "Elle vient de",
      "le parc.",
      "visiter",
      ["visiter", "manger"],
      "she just visited the park",
      "elle vient de visiter le parc",
    ),
    build(
      "fr-m20-10-build-ellenevientpas",
      "Build: 'she didn't just eat cheese'",
      "elle ne vient pas de manger de fromage",
      ["elle ne vient pas de", "manger", "de fromage", "mangé"],
      ["elle ne vient pas de", "manger", "de fromage"],
    ),
    listeningCompSentence({
      id: "fr-m20-10-lc-ilvientdeparler",
      audioText: "ce matin, il vient de parler avec Hugo",
      correctMeaningEn: "This morning, he just spoke with Hugo",
      distractorsEn: [
        "This morning, he's speaking with Hugo",
        "Yesterday morning, he spoke with Hugo",
        "This morning, he just spoke with Camille",
      ],
    }),
    speaking("fr-m20-10-speak-hugolyon-recall", "Hugo est venu de Lyon", "Hugo came from Lyon", [], "recall"),
    cloze(
      "fr-m20-10-cloze-tuvisite",
      "Tu viens de",
      "un croissant.",
      "manger",
      ["manger", "visiter"],
      "you just ate a croissant",
      "tu viens de manger un croissant",
    ),
    build(
      "fr-m20-10-build-jeparle",
      "Build: 'this morning, I just spoke French'",
      "ce matin, je viens de parler français",
      ["ce matin", "je viens de", "parler", "français", "parlé"],
      ["ce matin", "je viens de", "parler", "français"],
    ),
    crossModuleMatchPairs("fr-m20-10", [
      ["je viens de", "I just"],
      ["tu viens de", "you just"],
      ["il vient de", "he just"],
      ["elle vient de", "she just"],
      ["ce matin", "this morning"],
      ["venu", "came"],
    ]),
    {
      id: "fr-m20-10-sim-projets",
      type: "dialogue_sim",
      scene: { emoji: "🍰", title: "Camille's snack break" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-gateau",
          npc: {
            speaker: "Camille",
            kana: "Je viens de manger un gâteau. Et toi ?",
            audioText: "je viens de manger un gâteau. et toi ?",
            gloss: "I just ate cake. And you?",
          },
          goal: "Say no thanks, you just ate too.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non merci, je viens de manger aussi" },
              { id: "wrong-past", text: "non merci, j'ai mangé hier" },
              { id: "wrong-future", text: "non merci, je vais manger" },
            ],
            correctOptionId: "correct",
            audioText: "non merci, je viens de manger aussi",
          },
          replyGloss: "No thanks, I just ate too.",
        },
        {
          id: "t2-visite",
          npc: {
            speaker: "Camille",
            kana: "Et Hugo, il vient de visiter la gare ?",
            audioText: "et hugo, il vient de visiter la gare ?",
            gloss: "And Hugo, did he just visit the station?",
          },
          goal: "Say yes, he just visited the station.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, il vient de visiter la gare" },
              { id: "wrong-no", text: "non, il ne vient pas de visiter" },
              { id: "wrong-past", text: "oui, il a visité la gare" },
            ],
            correctOptionId: "correct",
            audioText: "oui, il vient de visiter la gare",
          },
          replyGloss: "Yes, he just visited the station.",
        },
      ],
    },
  ];
}

const FR_M20_1: LessonContent = {
  id: "fr-m20-1",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je viens de manger",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M20_2: LessonContent = {
  id: "fr-m20-2",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il vient de, elle vient de",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M20_3: LessonContent = {
  id: "fr-m20-3",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Ce matin, je viens de parler",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M20_4: LessonContent = {
  id: "fr-m20-4",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il vient de manger, elle vient de manger",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M20_5: LessonContent = {
  id: "fr-m20-5",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Tu viens de visiter",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M20_6: LessonContent = {
  id: "fr-m20-6",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "A mangé vs vient de manger",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M20_7: LessonContent = {
  id: "fr-m20-7",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je ne viens pas de...",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M20_8: LessonContent = {
  id: "fr-m20-8",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Venir de + any verb",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M20_9: LessonContent = {
  id: "fr-m20-9",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Tu viens de manger ?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M20_10: LessonContent = {
  id: "fr-m20-10",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je viens de manger, et toi ?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M20_MODULE: FrModuleDef = {
  title: "Venir de + infinitif",
  eyebrow: "Module 20",
  summary:
    "«Il est venu de Lyon» already means he came FROM somewhere — now front a verb instead of a place and it means something just happened. «Je viens de manger» = I just ate. Same «venir» root, third job in the course, no new verb form to learn.",
  lessons: [
    FR_M20_1,
    FR_M20_2,
    FR_M20_3,
    FR_M20_4,
    FR_M20_5,
    FR_M20_6,
    FR_M20_7,
    FR_M20_8,
    FR_M20_9,
    FR_M20_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M20_CHECKPOINT_INDEX = 8;

export const FR_M20_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m20-s",
    moduleId: "m20",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m20-s",
        prompt: "'I just ate' — pick the French.",
        correctText: "je viens de manger",
        distractorsText: ["je viens de Paris", "j'ai mangé", "je vais manger"],
      }),
  },
  {
    id: "pt-fr-m20-1",
    moduleId: "m20",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m20-1",
        prompt: "'He just visited the museum' — pick the French.",
        correctText: "il vient de visiter le musée",
        distractorsText: [
          "il visite le musée",
          "il a visité le musée",
          "il va visiter le musée",
        ],
      }),
  },
  {
    id: "pt-fr-m20-2",
    moduleId: "m20",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m20-2",
        prompt: "'She just ate a pizza' — pick the French.",
        correctText: "elle vient de manger une pizza",
        distractorsText: [
          "il vient de manger une pizza",
          "elle a mangé une pizza",
          "elle va manger une pizza",
        ],
      }),
  },
  {
    id: "pt-fr-m20-3",
    moduleId: "m20",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m20-3",
        prompt: "'You just spoke French' — pick the French.",
        correctText: "tu viens de parler français",
        distractorsText: ["tu parles français", "tu as parlé français", "tu vas parler français"],
      }),
  },
  {
    id: "pt-fr-m20-4",
    moduleId: "m20",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m20-4",
        prompt: "'He didn't just eat cake' — pick the French.",
        correctText: "il ne vient pas de manger de gâteau",
        distractorsText: [
          "elle ne vient pas de manger de gâteau",
          "il n'a pas mangé de gâteau",
          "il ne va pas manger de gâteau",
        ],
      }),
  },
];
