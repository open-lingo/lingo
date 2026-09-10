/**
 * m13.ts — «Je sais pas» — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-10 per docs/fr-m13-brief-2026-09-10.md: negation
 * generalizes from the four frozen chunks the course already knows («je ne
 * comprends pas» m2, «je n'aime pas» m3, «il n'y a pas de» m4, «ce n'est
 * pas cher» m12) into a real ne…pas MACHINE the learner builds themselves
 * around verbs they already conjugate (m11's aimer/parler/habiter), plus
 * the spoken register beat (pin F10): in casual French the «ne» is usually
 * dropped — «je sais pas», not «je ne sais pas».
 *
 * SCOPE DECISIONS (all deliberate, brief §7):
 *   - «savoir» enters as CHUNKS (je sais / tu sais / je ne sais pas / je
 *     sais pas), never as a paradigm — this module is about negation and
 *     register, not a new verb machine (playbook: verbs are chunks until
 *     their own machine). No «il/elle sait» anywhere — untaught, and the
 *     brief flags it as a live homophone risk with «c'est»/«ces».
 *   - Ne-drop is authored ONLY inside `dialogue_sim` NPC lines and choice
 *     reply OPTIONS, from L7 onward — never in a build/cloze ANSWER
 *     position, never as a `speaking` target. Grading canonical stays the
 *     written full form; register is a listening/recognition skill at
 *     this tier (brief §7 decision 2). `frSurfaces()` in
 *     `moduleBarGuards.ts` has no `dialogue_sim` case at all — sim content
 *     is outside the vocab-provenance gate's reach — so this rule is a
 *     self-imposed content-quality discipline, pinned by this module's own
 *     bespoke test, not something the shared gate would catch.
 *   - «pas encore» (the brief's optional 8th atom) is CUT; «je n'ai pas
 *     de» is registered in its place. Reason: «j'ai» (m7) is a CONSONANT-
 *     onset surface («j'ai» starts with the letter j), so
 *     `elidesBefore()` never fires for it and the elision lexicon never
 *     derives a bare "ai" or "n'ai" token the way it derives "n'aime" from
 *     m11's vowel-onset "aime". Without a registered "je n'ai pas de"
 *     surface, "n'ai" would be an untracked word and L5 ("je n'ai pas de
 *     chat") would fail the vocab-provenance gate outright — the exact
 *     precedent m4 already set by registering the whole "il n'y a pas de"
 *     chunk rather than expecting "n'y" to derive from "y".
 *   - L3's brief draft line "tu n'as pas…" is DROPPED for the identical
 *     reason: "tu as" (m7) is consonant-onset («t»), so "n'as" is not
 *     derivable and was never going to be registered — the brief's own
 *     next clause ("n' before a vowel") only covers vowel-onset verbs
 *     (aime/aimes/habite/habites), and "as" isn't one.
 *   - «moi non plus» DEBUTS IN L6, not L8/L9. The brief is internally
 *     ambiguous: L8's own line says the checkpoint reviews «moi non plus»
 *     with "no new atoms" (implying it must already be taught), yet L9 is
 *     titled «Moi non plus» as if debuting there. L6 is where the course
 *     first prints a genuine negative statement with a natural "me
 *     neither" beat («je n'aime pas le chocolat» / «moi non plus»), so
 *     debuting it there lets L8 review it (zero-new, as required) and L9
 *     consolidate/extend it in a fuller conversational sim — satisfying
 *     both of the brief's contradictory lines at once.
 *   - «pourquoi» and «parce que» (minus the elision «parce qu'», never
 *     taught — brief §3) are function-word-adjacent but the brief still
 *     wants an explicit teaching moment; «pourquoi ?» and «parce que» are
 *     registered as thin phrase atoms purely for that debut + answer-
 *     position bookkeeping — `FR_FUNCTION_WORDS` already carries
 *     "pourquoi" for provenance, so registering it is belt-and-braces,
 *     never a conflict.
 *   - L10's soft m14 «Hier» tease is ONE NPC line, never exercised, never
 *     an answer position — the same "outside `frSurfaces()`'s reach"
 *     property that licenses the ne-drop debut licenses this: a
 *     dialogue_sim NPC line is flavor, not taught content, and introduces
 *     no new verb form (every word beside "hier" itself is already taught:
 *     "bon", "on", "parle", "demain" all pre-date this module). The line
 *     fronts "hier" as its own question ("Hier ? On parle demain ?")
 *     rather than "on parle d'hier demain ?" specifically to avoid the
 *     untaught d'-elision (de + vowel word) playbook §6 defers — flavor
 *     text is not exempt from that ban either.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   je ne sais pas L1 · tu sais où est la gare ? L1 · il ne parle pas L2 ·
 *   tu n'aimes pas la pizza L3 · parce que c'est cher L4 · je n'ai pas de
 *   livre L5 · ce n'est pas un musée L6 · tu sais où est Léa ? L7 ·
 *   je n'aime pas le chocolat L8 — 9 printed targets.
 *   recalls: où est le musée ? L2 (m4) · il parle français L3 (m11) ·
 *   c'est cher L4 (m12) · il ne parle pas L5 (internal, L2) · c'est lundi
 *   L6 (m8) · tu sais où est la gare ? L7 (internal, L1) · c'est lundi L8
 *   (internal, L6) · c'est cher L9 (internal, L4) · moi aussi L9 (m3) ·
 *   je vais au cinéma L10 (m5) · je ne sais pas L10 (internal, L1). 11
 *   recalls total, 6 tracing to a prior module (m3/m4/m5/m8/m11/m12) —
 *   comfortably over the ≥8 floor.
 *
 * Cast: reused faces (Léa, Thomas, Hugo, Marie) asking where things are and
 * getting shrugged off; a L9 café scene mixing casual/negative register; a
 * L10 mastery sim planning an evening that keeps falling through (cinéma
 * too expensive, nobody knows where anyone is) and closing on a one-line
 * tease for m14 «Hier» — talking about yesterday.
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  vocabTextMcq,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
  matchPairs,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

export const FR_M13_ATOMS: FrAtom[] = [
  atom({ surface: "je sais", meaningEn: "I know", partOfSpeech: "verb", fromModule: "m13", kind: "phrase", hint: "zhuh say — «savoir», chunked for now" }),
  atom({ surface: "tu sais", meaningEn: "you know", partOfSpeech: "verb", fromModule: "m13", kind: "phrase", hint: "tu say — the -s is silent, as ever" }),
  atom({ surface: "je ne sais pas", meaningEn: "I don't know", partOfSpeech: "verb", fromModule: "m13", kind: "phrase", hint: "zhuh nuh say pa — the full WRITTEN form; canonical answer everywhere" }),
  atom({ surface: "je sais pas", meaningEn: "I don't know (spoken)", partOfSpeech: "verb", fromModule: "m13", kind: "phrase", hint: "zhuh say pa — casual speech drops the «ne»; never write this as an answer" }),
  atom({ surface: "pourquoi ?", meaningEn: "why?", partOfSpeech: "other", fromModule: "m13", kind: "phrase", hint: "poor-KWA" }),
  atom({ surface: "parce que", meaningEn: "because", partOfSpeech: "conjunction", fromModule: "m13", kind: "phrase", hint: "pars kuh — never before a vowel; no «parce qu'» taught here" }),
  atom({ surface: "je n'ai pas de", meaningEn: "I don't have a/any", partOfSpeech: "verb", fromModule: "m13", kind: "phrase", hint: "zhuh nay pa duh — negated «j'ai»; «de» replaces un/une, consonant nouns only" }),
  atom({ surface: "moi non plus", meaningEn: "me neither", partOfSpeech: "other", fromModule: "m13", kind: "phrase", hint: "mwa non ploo — the negative twin of m3's «moi aussi»" }),
];

/** L1 — «Je sais / je ne sais pas»: savoir debuts as chunks, positive
 *  first, then wrapped in the ne…pas the learner already recognizes from
 *  m2's «je ne comprends pas». */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m13-1-info-savoir",
      "Je sais / je ne sais pas",
      "«Je sais» — I know. To say you DON'T know, wrap it in the ne…pas you already know: «je ne sais pas». Ask a friend with «tu sais… ?» — «tu sais où est la gare ?»",
    ),
    {
      id: "fr-m13-1-map-savoir",
      type: "word_map",
      tokens: ["je sais", "tu sais", "où est", "la gare"],
      pairs: [
        { en: "I know", tokenIndex: 0 },
        { en: "you know", tokenIndex: 1 },
        { en: "where is", tokenIndex: 2 },
        { en: "the train station", tokenIndex: 3 },
      ],
      audioText: "je sais, tu sais, où est la gare",
      revealNote: "«je sais» / «tu sais» — the verb savoir, chunked for now.",
    },
    vocabTextMcq("fr-m13-1-mcq-jesais", "je sais", ["j'aime", "je vais", "j'ai"]),
    build(
      "fr-m13-1-build-tusaisou",
      "Build: 'do you know where the train station is?'",
      "tu sais où est la gare ?",
      ["tu sais", "où est", "la", "gare ?", "le"],
      ["tu sais", "où est", "la", "gare ?"],
    ),
    listeningCompSentence({
      id: "fr-m13-1-lc-tusaisou",
      audioText: "tu sais où est la gare ?",
      correctMeaningEn: "Do you know where the train station is?",
      distractorsEn: ["Where is the train station?", "You know the train station.", "Do you know where the park is?"],
    }),
    speaking("fr-m13-1-speak-jenesaispas", "je ne sais pas", "I don't know", ["je ne sais pas"]),
    cloze(
      "fr-m13-1-cloze-sais",
      "tu",
      "où est la gare ?",
      "sais",
      ["sais", "vais", "aime"],
      "do you know where the train station is?",
      "tu sais où est la gare ?",
      "«tu sais où est la gare ?» — the verb slot takes «sais».",
    ),
    build(
      "fr-m13-1-build-jenesaispas",
      "Build: 'I don't know'",
      "je ne sais pas",
      ["je", "ne", "sais", "pas", "vais", "aime"],
      ["je", "ne", "sais", "pas"],
    ),
    sentenceMcq({
      id: "fr-m13-1-smcq-jenesaispas",
      prompt: "'I don't know' — pick the French.",
      correctText: "je ne sais pas",
      distractorsText: ["tu ne sais pas", "je ne sais", "je sais"],
    }),
    speaking("fr-m13-1-speak-tusaisou", "tu sais où est la gare ?", "do you know where the train station is?", ["tu sais", "où est"]),
    {
      id: "fr-m13-1-sim-perdu",
      type: "dialogue_sim",
      scene: { emoji: "🗺️", title: "Lost in town" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-musee",
          npc: {
            speaker: "Thomas",
            kana: "Tu sais où est le musée ?",
            audioText: "tu sais où est le musée ?",
            gloss: "Do you know where the museum is?",
          },
          goal: "Say you don't know.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "je ne sais pas" },
              { id: "wrong-pos", text: "je sais" },
              { id: "wrong-go", text: "je vais" },
            ],
            correctOptionId: "correct",
            audioText: "je ne sais pas",
          },
          replyGloss: "I don't know.",
        },
        {
          id: "t2-moiaussi",
          npc: {
            speaker: "Thomas",
            kana: "D'accord, moi aussi je ne sais pas.",
            audioText: "d'accord, moi aussi je ne sais pas",
            gloss: "Okay, me too, I don't know.",
          },
          goal: "Say okay.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord" },
              { id: "wrong-know", text: "je sais" },
              { id: "wrong-go", text: "on va" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord",
          },
          replyGloss: "Okay.",
        },
      ],
    },
    {
      id: "fr-m13-1-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "je sais", target: "I know" },
        { id: "p-1", source: "tu sais", target: "you know" },
        { id: "p-2", source: "je ne sais pas", target: "I don't know" },
        { id: "p-3", source: "où est", target: "where is" },
        { id: "p-4", source: "gare", target: "train station" },
        { id: "p-5", source: "musée", target: "museum" },
      ],
    },
  ];
}

/** L2 — the ne…pas MACHINE, consonant-initial verbs only («n' before a
 *  vowel» is its own beat next lesson): parler/habiter (m11), aller (m5),
 *  être (m2), savoir (L1) all take a plain separate «ne» tile. No new
 *  atoms — every surface here is built from taught tokens. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m13-2-info-nepas",
      "Ne … pas around a verb",
      "You know «je ne comprends pas». The same frame wraps ANY verb you conjugate: «ne» before it, «pas» after — «je ne parle pas anglais». Before a vowel, «ne» shrinks to «n'» — that's next lesson.",
    ),
    {
      id: "fr-m13-2-map-nepas",
      type: "word_map",
      tokens: ["je ne parle pas", "tu ne parles pas", "il ne parle pas", "français"],
      pairs: [
        { en: "I don't speak", tokenIndex: 0 },
        { en: "you don't speak", tokenIndex: 1 },
        { en: "he doesn't speak", tokenIndex: 2 },
        { en: "French", tokenIndex: 3 },
      ],
      audioText: "je ne parle pas, tu ne parles pas, il ne parle pas, français",
      revealNote: "«ne … pas» wraps the verb you already conjugate.",
    },
    vocabTextMcq("fr-m13-2-mcq-parle", "parle", ["habite", "aime", "vais"], 'Which word means "speaks"?'),
    build(
      "fr-m13-2-build-jeneparle",
      "Build: 'I don't speak English'",
      "je ne parle pas anglais",
      ["je", "ne", "parle", "pas", "anglais", "français"],
      ["je", "ne", "parle", "pas", "anglais"],
    ),
    listeningCompSentence({
      id: "fr-m13-2-lc-tuneparles",
      audioText: "tu ne parles pas français",
      correctMeaningEn: "You don't speak French.",
      distractorsEn: ["You speak French.", "I don't speak French.", "You don't speak English."],
    }),
    speaking("fr-m13-2-speak-ilneparle", "il ne parle pas", "he doesn't speak", ["il", "parle"]),
    cloze(
      "fr-m13-2-cloze-nesuispas",
      "je",
      "suis pas grand",
      "ne",
      ["ne", "très"],
      "I am not tall",
      "je ne suis pas grand",
      "«je ne suis pas grand» — «ne» opens the frame, «pas» closes it.",
    ),
    build(
      "fr-m13-2-build-tunevas",
      "Build: 'you don't go to the cinema'",
      "tu ne vas pas au cinéma",
      ["tu", "ne", "vas", "pas", "au cinéma", "à la gare"],
      ["tu", "ne", "vas", "pas", "au cinéma"],
    ),
    sentenceMcq({
      id: "fr-m13-2-smcq-tunesais",
      prompt: "'I don't know' — pick the French.",
      correctText: "je ne sais pas",
      distractorsText: ["tu ne sais pas", "je sais", "je ne sais"],
    }),
    speaking("fr-m13-2-speak-recall-musee", "où est le musée ?", "where is the museum?", ["où est", "le", "musée"], "recall"),
    {
      id: "fr-m13-2-sim-francais",
      type: "dialogue_sim",
      scene: { emoji: "💬", title: "Small talk" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-parle",
          npc: {
            speaker: "Marie",
            kana: "Il parle français ?",
            audioText: "il parle français ?",
            gloss: "Does he speak French?",
          },
          goal: "Say no, he doesn't speak French.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, il ne parle pas français" },
              { id: "wrong-yes", text: "oui, il parle français" },
              { id: "wrong-en", text: "non, il ne parle pas anglais" },
            ],
            correctOptionId: "correct",
            audioText: "non, il ne parle pas français",
          },
          replyGloss: "No, he doesn't speak French.",
        },
      ],
    },
    matchPairs("fr-m13-2", ["parle", "parles", "français", "anglais", "je sais", "tu sais"]),
  ];
}

/** L3 — «n' before a vowel»: aimer/habiter (both vowel-onset) elide.
 *  «je n'aime pas» is now EXPLAINED, not just recognized. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m13-3-info-elision",
      "N' devant une voyelle",
      "Before a vowel sound, «ne» shrinks to «n'» — one squeeze, like «l'» before a noun. «je n'aime pas le chocolat», «je n'habite pas à Montréal». Same rule, just a vowel-onset verb.",
    ),
    {
      id: "fr-m13-3-map-elision",
      type: "word_map",
      tokens: ["je n'aime pas", "je n'habite pas", "tu n'aimes pas", "le chocolat"],
      pairs: [
        { en: "I don't like", tokenIndex: 0 },
        { en: "I don't live", tokenIndex: 1 },
        { en: "you don't like", tokenIndex: 2 },
        { en: "the chocolate", tokenIndex: 3 },
      ],
      audioText: "je n'aime pas, je n'habite pas, tu n'aimes pas, le chocolat",
      revealNote: "«n'» before a vowel-onset verb — «aime», «habite».",
    },
    {
      id: "fr-m13-3-mcq-jenaimepas",
      type: "multiple_choice",
      prompt: 'Which word means "I don\'t like"?',
      options: [
        { id: "correct", text: "je n'aime pas" },
        { id: "opt-1", text: "je n'ai pas de" },
        { id: "opt-2", text: "je ne sais pas" },
        { id: "opt-3", text: "tu ne parles pas" },
      ],
      correctOptionId: "correct",
      optionsHideRomaji: true,
      exercisedAtoms: [],
      modality: "recognition",
    },
    build(
      "fr-m13-3-build-jenaimepas",
      "Build: 'I don't like chocolate'",
      "je n'aime pas le chocolat",
      ["je n'aime pas", "le chocolat", "la pizza", "tu n'aimes pas"],
      ["je n'aime pas", "le chocolat"],
    ),
    listeningCompSentence({
      id: "fr-m13-3-lc-jenhabite",
      audioText: "je n'habite pas à Montréal",
      correctMeaningEn: "I don't live in Montreal.",
      distractorsEn: ["I live in Montreal.", "I don't live in Paris.", "I don't speak French."],
    }),
    speaking("fr-m13-3-speak-tunaimes", "tu n'aimes pas la pizza", "you don't like pizza", ["tu n'aimes pas", "la pizza"]),
    cloze(
      "fr-m13-3-cloze-habite",
      "je n'",
      "pas à Paris",
      "habite",
      ["habite", "vais"],
      "I don't live in Paris",
      "je n'habite pas à Paris",
      "«je n'habite pas à Paris» — vowel-onset verb, so «n'» not «ne».",
    ),
    build(
      "fr-m13-3-build-jenhabitepas",
      "Build: 'I don't live in Montreal'",
      "je n'habite pas à Montréal",
      ["je n'habite pas", "à Montréal", "à Paris", "je n'aime pas"],
      ["je n'habite pas", "à Montréal"],
    ),
    sentenceMcq({
      id: "fr-m13-3-smcq-pizza",
      prompt: "'I don't like' — pick the French.",
      correctText: "je n'aime pas",
      distractorsText: ["tu n'aimes pas", "je n'aime pas la pizza", "j'aime"],
    }),
    speaking("fr-m13-3-speak-recall-parle", "il parle français", "he speaks French", ["il", "parle", "français"], "recall"),
    {
      id: "fr-m13-3-sim-gouts",
      type: "dialogue_sim",
      scene: { emoji: "🍫", title: "Tastes" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-chocolat",
          npc: {
            speaker: "Léa",
            kana: "Tu aimes le chocolat ?",
            audioText: "tu aimes le chocolat ?",
            gloss: "Do you like chocolate?",
          },
          goal: "Say no, you don't like chocolate.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, je n'aime pas le chocolat" },
              { id: "wrong-yes", text: "oui, j'aime le chocolat" },
              { id: "wrong-habite", text: "non, je n'habite pas le chocolat" },
            ],
            correctOptionId: "correct",
            audioText: "non, je n'aime pas le chocolat",
          },
          replyGloss: "No, I don't like chocolate.",
        },
      ],
    },
    {
      id: "fr-m13-3-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "je n'aime pas", target: "I don't like" },
        { id: "p-1", source: "chocolat", target: "chocolate" },
        { id: "p-2", source: "pizza", target: "pizza" },
        { id: "p-3", source: "habite", target: "lives (il/elle/on)" },
        { id: "p-4", source: "à Montréal", target: "in Montreal" },
        { id: "p-5", source: "à Paris", target: "in Paris" },
      ],
    },
  ];
}

/** L4 — «Pourquoi ? Parce que…»: the reason machine, interleaved over
 *  negatives (break from pure negation drilling). */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m13-4-info-pourquoi",
      "Pourquoi ? Parce que…",
      "Ask «pourquoi ?» — why? — and answer with «parce que» — because. «Pourquoi tu ne vas pas au cinéma ? — Parce que c'est cher.»",
    ),
    {
      id: "fr-m13-4-map-pourquoi",
      type: "word_map",
      tokens: ["pourquoi ?", "parce que", "c'est cher", "le cinéma"],
      pairs: [
        { en: "why?", tokenIndex: 0 },
        { en: "because", tokenIndex: 1 },
        { en: "it's expensive", tokenIndex: 2 },
        { en: "the cinema", tokenIndex: 3 },
      ],
      audioText: "pourquoi ? parce que c'est cher, le cinéma",
      revealNote: "«pourquoi ?» asks, «parce que» answers.",
    },
    vocabTextMcq("fr-m13-4-mcq-pourquoi", "pourquoi ?", ["parce que", "où est", "c'est combien"]),
    build(
      "fr-m13-4-build-pourquoi",
      "Build: 'why don't you go to the cinema?'",
      "pourquoi tu ne vas pas au cinéma ?",
      ["pourquoi", "tu", "ne", "vas", "pas", "au cinéma ?", "à la gare"],
      ["pourquoi", "tu", "ne", "vas", "pas", "au cinéma ?"],
    ),
    listeningCompSentence({
      id: "fr-m13-4-lc-parceque",
      audioText: "parce que c'est cher",
      correctMeaningEn: "Because it's expensive.",
      distractorsEn: ["Why is it expensive?", "It's not expensive.", "Because it's not expensive."],
    }),
    speaking("fr-m13-4-speak-parceque", "parce que c'est cher", "because it's expensive", ["parce que", "c'est cher"]),
    cloze(
      "fr-m13-4-cloze-parceque",
      "je ne vais pas au restaurant,",
      "c'est cher",
      "parce que",
      ["parce que", "pourquoi ?", "et"],
      "because it's expensive",
      "je ne vais pas au restaurant, parce que c'est cher",
      "«parce que c'est cher» — the reason follows «parce que».",
    ),
    build(
      "fr-m13-4-build-recallcinema",
      "Build: 'I'm going to the cinema'",
      "je vais au cinéma",
      ["je vais", "au cinéma", "à la gare", "je ne vais pas"],
      ["je vais", "au cinéma"],
    ),
    sentenceMcq({
      id: "fr-m13-4-smcq-pourquoi",
      prompt: "'Why?' — pick the French.",
      correctText: "pourquoi ?",
      distractorsText: ["parce que", "c'est combien", "comment"],
    }),
    speaking("fr-m13-4-speak-recall-cher", "c'est cher", "it's expensive", ["c'est cher"], "recall"),
    {
      id: "fr-m13-4-sim-restaurant",
      type: "dialogue_sim",
      scene: { emoji: "🍽️", title: "Not tonight" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-pourquoi",
          npc: {
            speaker: "Hugo",
            kana: "Pourquoi tu ne vas pas au restaurant ?",
            audioText: "pourquoi tu ne vas pas au restaurant ?",
            gloss: "Why aren't you going to the restaurant?",
          },
          goal: "Say because it's expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "parce que c'est cher" },
              { id: "wrong-not", text: "parce que ce n'est pas cher" },
              { id: "wrong-q", text: "pourquoi ?" },
            ],
            correctOptionId: "correct",
            audioText: "parce que c'est cher",
          },
          replyGloss: "Because it's expensive.",
        },
      ],
    },
    {
      id: "fr-m13-4-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "pourquoi ?", target: "why?" },
        { id: "p-1", source: "parce que", target: "because" },
        { id: "p-2", source: "c'est cher", target: "it's expensive" },
        { id: "p-3", source: "cinéma", target: "the movies" },
        { id: "p-4", source: "musée", target: "museum" },
        { id: "p-5", source: "restaurant", target: "restaurant" },
      ],
    },
  ];
}

/** L5 — «Je n'ai pas de …»: negated avoir, consonant-initial nouns only
 *  («de» replaces un/une, precedent m4's «il n'y a pas de»). */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m13-5-info-naipasde",
      "Je n'ai pas de …",
      "«J'ai un chat» — I have a cat. Negate «j'ai» and «un/une» disappears, replaced by «de»: «je n'ai pas de chat». Same swap as «il n'y a pas de».",
    ),
    {
      id: "fr-m13-5-map-naipasde",
      type: "word_map",
      tokens: ["j'ai", "un chat", "un chien", "je n'ai pas de"],
      pairs: [
        { en: "I have", tokenIndex: 0 },
        { en: "a cat", tokenIndex: 1 },
        { en: "a dog", tokenIndex: 2 },
        { en: "I don't have", tokenIndex: 3 },
      ],
      audioText: "j'ai, un chat, un chien, je n'ai pas de",
      revealNote: "«je n'ai pas de» — negated «avoir»; «de» replaces un/une.",
    },
    vocabTextMcq("fr-m13-5-mcq-naipasde", "je n'ai pas de", ["je n'aime pas", "je ne sais pas", "il n'y a pas de"]),
    build(
      "fr-m13-5-build-naipasdechat",
      "Build: 'I don't have a cat'",
      "je n'ai pas de chat",
      ["je n'ai pas de", "chat", "chien", "j'ai un"],
      ["je n'ai pas de", "chat"],
    ),
    listeningCompSentence({
      id: "fr-m13-5-lc-naipasdefrere",
      audioText: "je n'ai pas de frère",
      correctMeaningEn: "I don't have a brother.",
      distractorsEn: ["I have a brother.", "I don't have a sister.", "I don't have a dog."],
    }),
    speaking("fr-m13-5-speak-naipasdelivre", "je n'ai pas de livre", "I don't have a book", ["je n'ai pas de", "livre"]),
    cloze(
      "fr-m13-5-cloze-aiunchat",
      "j'ai",
      "chat",
      "un",
      ["un", "une"],
      "I have a cat",
      "j'ai un chat",
      "«j'ai un chat» — «chat» is masculine, so «un», not «une».",
    ),
    build(
      "fr-m13-5-build-naipasdesoeur",
      "Build: 'I don't have a sister'",
      "je n'ai pas de sœur",
      ["je n'ai pas de", "sœur", "frère", "j'ai une"],
      ["je n'ai pas de", "sœur"],
    ),
    sentenceMcq({
      id: "fr-m13-5-smcq-naipasde",
      prompt: "'I don't have a/any' — pick the French.",
      correctText: "je n'ai pas de",
      distractorsText: ["j'ai un chien", "je n'ai pas de chat", "je n'aime pas le chien"],
    }),
    speaking("fr-m13-5-speak-recall-parle", "il ne parle pas", "he doesn't speak", ["il", "ne", "parle", "pas"], "recall"),
    {
      id: "fr-m13-5-sim-animal",
      type: "dialogue_sim",
      scene: { emoji: "🐱", title: "Pets" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-chien",
          npc: {
            speaker: "Camille",
            kana: "Tu as un chien ?",
            audioText: "tu as un chien ?",
            gloss: "Do you have a dog?",
          },
          goal: "Say no, you don't have a dog.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, je n'ai pas de chien" },
              { id: "wrong-yes", text: "oui, j'ai un chien" },
              { id: "wrong-cat", text: "non, je n'ai pas de chat" },
            ],
            correctOptionId: "correct",
            audioText: "non, je n'ai pas de chien",
          },
          replyGloss: "No, I don't have a dog.",
        },
      ],
    },
    {
      id: "fr-m13-5-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "j'ai", target: "I have" },
        { id: "p-1", source: "je n'ai pas de", target: "I don't have a/any" },
        { id: "p-2", source: "chat", target: "cat" },
        { id: "p-3", source: "chien", target: "dog" },
        { id: "p-4", source: "frère", target: "brother" },
        { id: "p-5", source: "livre", target: "book" },
      ],
    },
  ];
}

/** L6 — «Il n'est pas, ce n'est pas»: negating the copula (est/n'est,
 *  c'est/n'est already function-word chrome), with an agreement recall
 *  (m9), and the DEBUT of «moi non plus» — the negative twin of m3's
 *  «moi aussi», landing right where the course first prints a genuine
 *  negative statement worth agreeing with. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m13-6-info-nestpas",
      "Il n'est pas, ce n'est pas",
      "Negating «c'est»/«il est» uses the same frame: «il n'est pas étudiant», «ce n'est pas un musée». Agree with a negative the way m3 taught «moi aussi» — but for a negative, French says «moi non plus».",
    ),
    {
      id: "fr-m13-6-map-nestpas",
      type: "word_map",
      tokens: ["il n'est pas", "elle n'est pas", "ce n'est pas", "moi non plus"],
      pairs: [
        { en: "he is not", tokenIndex: 0 },
        { en: "she is not", tokenIndex: 1 },
        { en: "it's not", tokenIndex: 2 },
        { en: "me neither", tokenIndex: 3 },
      ],
      audioText: "il n'est pas, elle n'est pas, ce n'est pas, moi non plus",
      revealNote: "«moi non plus» — the negative twin of «moi aussi».",
    },
    vocabTextMcq("fr-m13-6-mcq-moinonplus", "moi non plus", ["moi aussi", "je ne sais pas", "parce que"]),
    build(
      "fr-m13-6-build-ilnestpas",
      "Build: 'he is not a student'",
      "il n'est pas étudiant",
      ["il n'est pas", "étudiant", "étudiante", "elle n'est pas"],
      ["il n'est pas", "étudiant"],
    ),
    listeningCompSentence({
      id: "fr-m13-6-lc-ellenestpas",
      audioText: "elle n'est pas grande",
      correctMeaningEn: "She is not tall.",
      distractorsEn: ["She is tall.", "He is not tall.", "She is not small."],
    }),
    speaking("fr-m13-6-speak-cenestpas", "ce n'est pas un musée", "it's not a museum", ["ce n'est pas", "musée"]),
    cloze(
      "fr-m13-6-cloze-nestpas",
      "il",
      "pas étudiant",
      "n'est",
      ["n'est", "est"],
      "he is not a student",
      "il n'est pas étudiant",
      "«il n'est pas étudiant» — «est» shrinks to «n'est» in the negative.",
    ),
    build(
      "fr-m13-6-build-moinonplus",
      "Build: 'me neither'",
      "moi non plus",
      ["moi non plus", "moi aussi", "je ne sais pas"],
      ["moi non plus"],
    ),
    sentenceMcq({
      id: "fr-m13-6-smcq-ellenestpasgrande",
      prompt: "'He is not' — pick the French.",
      correctText: "il n'est pas",
      distractorsText: ["il est", "elle n'est pas", "elle est"],
    }),
    speaking("fr-m13-6-speak-recall-lundi", "c'est lundi", "it's Monday", ["c'est"], "recall"),
    {
      id: "fr-m13-6-sim-nonplus",
      type: "dialogue_sim",
      scene: { emoji: "🍫", title: "Same tastes" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-nonplus",
          npc: {
            speaker: "Paul",
            kana: "Je n'aime pas le chocolat.",
            audioText: "je n'aime pas le chocolat",
            gloss: "I don't like chocolate.",
          },
          goal: "Say me neither.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "moi non plus" },
              { id: "wrong-aussi", text: "moi aussi" },
              { id: "wrong-sais", text: "je ne sais pas" },
            ],
            correctOptionId: "correct",
            audioText: "moi non plus",
          },
          replyGloss: "Me neither.",
        },
      ],
    },
    {
      id: "fr-m13-6-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "il", target: "he" },
        { id: "p-1", source: "elle", target: "she" },
        { id: "p-2", source: "étudiant", target: "student (m)" },
        { id: "p-3", source: "grande", target: "big / tall (f-form)" },
        { id: "p-4", source: "musée", target: "museum" },
        { id: "p-5", source: "moi non plus", target: "me neither" },
      ],
    },
  ];
}

/** L7 — «Je sais pas» (pin F10, the register beat): ONE rule step;
 *  written keeps «ne», spoken drops it. Debut atom «je sais pas» lands
 *  ONLY inside the dialogue_sim, as a choice-mode correct option — never
 *  a build/cloze/speaking ANSWER position (brief §4/§7 decision 2). */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m13-7-info-registre",
      "En français parlé…",
      "In written French you always keep «ne»: «je ne sais pas». In SPOKEN, casual French, the «ne» usually disappears: «je sais pas». Same meaning — different register. Writing always keeps «ne».",
    ),
    listeningCompSentence({
      id: "fr-m13-7-lc-ecrit",
      audioText: "je ne sais pas",
      correctMeaningEn: "I don't know",
      distractorsEn: ["I know", "I don't understand", "You don't know"],
      question: "Written register — what does this mean?",
    }),
    build(
      "fr-m13-7-build-jenesaispas",
      "Build: 'I don't know' (written)",
      "je ne sais pas",
      ["je", "ne", "sais", "pas", "sommes"],
      ["je", "ne", "sais", "pas"],
    ),
    listeningCompSentence({
      id: "fr-m13-7-lc-parle",
      audioText: "je sais pas",
      correctMeaningEn: "I don't know",
      distractorsEn: ["I know", "I don't understand", "You don't know"],
      question: "Spoken, casual register — what does this mean?",
    }),
    speaking("fr-m13-7-speak-recall-gare", "tu sais où est la gare ?", "do you know where the train station is?", ["tu sais", "où est"], "recall"),
    cloze(
      "fr-m13-7-cloze-sais",
      "je ne",
      "pas",
      "sais",
      ["sais", "vais", "aime"],
      "I don't know",
      "je ne sais pas",
      "«je ne sais pas» — the verb slot takes «sais».",
    ),
    build(
      "fr-m13-7-build-pourquoitunesaispas",
      "Build: 'why don't you know?'",
      "pourquoi tu ne sais pas ?",
      ["pourquoi", "tu", "ne", "sais", "pas ?", "vais"],
      ["pourquoi", "tu", "ne", "sais", "pas ?"],
    ),
    sentenceMcq({
      id: "fr-m13-7-smcq-parceque",
      prompt: "'Because' — pick the French.",
      correctText: "parce que",
      distractorsText: ["pourquoi ?", "moi non plus", "c'est cher"],
    }),
    speaking("fr-m13-7-speak-tusaisoulea", "tu sais où est Léa ?", "do you know where Léa is?", ["tu sais", "où est"]),
    {
      id: "fr-m13-7-sim-registre",
      type: "dialogue_sim",
      scene: { emoji: "🤷", title: "Casual chat" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-lea",
          npc: {
            speaker: "Hugo",
            kana: "Tu sais où est Léa ?",
            audioText: "tu sais où est léa ?",
            gloss: "Do you know where Léa is?",
          },
          goal: "Say you don't know, casually.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "je sais pas" },
              { id: "also-correct", text: "je ne sais pas" },
              { id: "wrong-oui", text: "oui, c'est Léa" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "je sais pas",
          },
          replyGloss: "I don't know.",
        },
        {
          id: "t2-nonplus",
          npc: {
            speaker: "Hugo",
            kana: "Moi non plus, je ne sais pas.",
            audioText: "moi non plus, je ne sais pas",
            gloss: "Me neither, I don't know.",
          },
          goal: "Agree with him.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "moi non plus" },
              { id: "wrong-aussi", text: "moi aussi" },
              { id: "wrong-sais", text: "je sais" },
            ],
            correctOptionId: "correct",
            audioText: "moi non plus",
          },
          replyGloss: "Me neither.",
        },
      ],
    },
    matchPairs("fr-m13-7", ["je sais", "tu sais", "je ne sais pas", "pourquoi ?", "parce que", "moi non plus"]),
  ];
}

/** L8 — checkpoint: negation across every taught verb, mixed; «moi non
 *  plus» reviewed; zero new atoms; all graded. */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m13-8-lc-1",
      audioText: "je ne parle pas anglais",
      correctMeaningEn: "I don't speak English.",
      distractorsEn: ["I speak English.", "I don't speak French.", "I don't know."],
    }),
    cloze(
      "fr-m13-8-cloze-1",
      "elle",
      "pas grande",
      "n'est",
      ["n'est", "est"],
      "she is not tall",
      "elle n'est pas grande",
    ),
    speaking("fr-m13-8-speak-jenaimepas", "je n'aime pas le chocolat", "I don't like chocolate", []),
    sentenceMcq({
      id: "fr-m13-8-smcq-1",
      prompt: "'I don't have a/any' — pick the French.",
      correctText: "je n'ai pas de",
      distractorsText: ["j'ai un chat", "je n'aime pas le chat", "je n'ai pas de chien"],
    }),
    build(
      "fr-m13-8-build-1",
      "Build: 'why don't you go to the cinema?'",
      "pourquoi tu ne vas pas au cinéma ?",
      ["pourquoi", "tu", "ne", "vas", "pas", "au cinéma ?", "à la gare"],
      ["pourquoi", "tu", "ne", "vas", "pas", "au cinéma ?"],
    ),
    listeningCompSentence({
      id: "fr-m13-8-lc-2",
      audioText: "parce que c'est cher",
      correctMeaningEn: "Because it's expensive.",
      distractorsEn: ["Why is it expensive?", "Because it's not expensive.", "It's not expensive."],
    }),
    cloze(
      "fr-m13-8-cloze-2",
      "il n'habite",
      "à Montréal",
      "pas",
      ["pas", "que"],
      "he doesn't live in Montreal",
      "il n'habite pas à Montréal",
    ),
    speaking("fr-m13-8-speak-cestlundi-recall", "c'est lundi", "it's Monday", [], "recall"),
    sentenceMcq({
      id: "fr-m13-8-smcq-2",
      prompt: "'Me neither' — pick the French.",
      correctText: "moi non plus",
      distractorsText: ["moi aussi", "je ne sais pas", "parce que"],
    }),
    build(
      "fr-m13-8-build-2",
      "Build: 'I don't have a sister, and you?'",
      "je n'ai pas de sœur, et toi ?",
      ["je n'ai pas de sœur", "et toi ?", "je n'ai pas de frère", "j'ai une sœur"],
      ["je n'ai pas de sœur", "et toi ?"],
    ),
    listeningCompSentence({
      id: "fr-m13-8-lc-3",
      audioText: "tu sais où est le musée ? je ne sais pas",
      correctMeaningEn: "Do you know where the museum is? I don't know.",
      distractorsEn: [
        "Do you know where the train station is? I don't know.",
        "Do you know where the museum is? I know.",
        "Where is the museum? It's not far.",
      ],
    }),
    build(
      "fr-m13-8-build-transfer",
      "Build: 'he doesn't live in Paris'",
      "il n'habite pas à Paris",
      ["il n'habite pas", "à Paris", "à Montréal", "il n'aime pas"],
      ["il n'habite pas", "à Paris"],
    ),
    {
      id: "fr-m13-8-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "je ne sais pas", target: "I don't know" },
        { id: "p-1", source: "je n'aime pas", target: "I don't like" },
        { id: "p-2", source: "je n'ai pas de", target: "I don't have a/any" },
        { id: "p-3", source: "pourquoi ?", target: "why?" },
        { id: "p-4", source: "parce que", target: "because" },
        { id: "p-5", source: "moi non plus", target: "me neither" },
      ],
    },
  ];
}

/** L9 — «Moi non plus»: fuller conversational recall, mixing the NPC's
 *  casual register (ne-drop, licensed from L7) against the learner's
 *  written replies (full «ne … pas» — the grading canonical). Recalls
 *  m3's «moi aussi» and m12's «c'est cher». No new atoms; no info card
 *  (checkpoint/integration/mastery carry no cards, same convention m12
 *  set from its own checkpoint index onward). */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m13-9-map-cafe",
      type: "word_map",
      tokens: ["moi aussi", "moi non plus", "c'est cher", "je sais pas"],
      pairs: [
        { en: "me too", tokenIndex: 0 },
        { en: "me neither", tokenIndex: 1 },
        { en: "it's expensive", tokenIndex: 2 },
        { en: "I don't know (spoken)", tokenIndex: 3 },
      ],
      audioText: "moi aussi, moi non plus, c'est cher, je sais pas",
      revealNote: "Casual speech drops «ne»; the written reply keeps it.",
    },
    {
      id: "fr-m13-9-mcq-moiaussi",
      type: "multiple_choice",
      prompt: 'Which word means "me too"?',
      options: [
        { id: "correct", text: "moi aussi" },
        { id: "opt-1", text: "moi non plus" },
        { id: "opt-2", text: "je ne sais pas" },
        { id: "opt-3", text: "c'est cher" },
      ],
      correctOptionId: "correct",
      optionsHideRomaji: true,
      exercisedAtoms: [],
      modality: "recognition",
    },
    build(
      "fr-m13-9-build-1",
      "Build: 'I don't like the museum, and you?'",
      "je n'aime pas le musée, et toi ?",
      ["je n'aime pas le musée", "et toi ?", "j'aime le musée", "je n'aime pas le cinéma"],
      ["je n'aime pas le musée", "et toi ?"],
    ),
    listeningCompSentence({
      id: "fr-m13-9-lc-1",
      audioText: "c'est cher, non ?",
      correctMeaningEn: "It's expensive, isn't it?",
      distractorsEn: ["It's not expensive, isn't it?", "How much is it?", "It's cheap, isn't it?"],
    }),
    speaking("fr-m13-9-speak-cestcher-recall", "c'est cher", "it's expensive", [], "recall"),
    cloze(
      "fr-m13-9-cloze-1",
      "je ne vais pas au restaurant, parce que",
      "cher",
      "c'est",
      ["c'est", "n'est"],
      "because it's expensive",
      "je ne vais pas au restaurant, parce que c'est cher",
    ),
    build(
      "fr-m13-9-build-2",
      "Build: 'I don't know why'",
      "je ne sais pas pourquoi",
      ["je ne sais pas", "pourquoi", "parce que", "je sais pas"],
      ["je ne sais pas", "pourquoi"],
    ),
    sentenceMcq({
      id: "fr-m13-9-smcq-1",
      prompt: "'Me too' — pick the French.",
      correctText: "moi aussi",
      distractorsText: ["moi non plus", "je ne sais pas", "pourquoi ?"],
    }),
    speaking("fr-m13-9-speak-moiaussi-recall", "moi aussi", "me too", [], "recall"),
    {
      id: "fr-m13-9-sim-cafe",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Café talk" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cher",
          npc: {
            speaker: "Chloé",
            kana: "Le café, c'est cher ici.",
            audioText: "le café, c'est cher ici",
            gloss: "Coffee, it's expensive here.",
          },
          goal: "Agree — say me too, it's expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "moi aussi, c'est cher" },
              { id: "wrong-non", text: "moi non plus" },
              { id: "wrong-not", text: "moi aussi, ce n'est pas cher" },
            ],
            correctOptionId: "correct",
            audioText: "moi aussi, c'est cher",
          },
          replyGloss: "Me too, it's expensive.",
        },
        {
          id: "t2-pourquoi",
          npc: {
            speaker: "Chloé",
            kana: "Pourquoi ? Je sais pas.",
            audioText: "pourquoi ? je sais pas",
            gloss: "Why? I don't know.",
          },
          goal: "Say you don't know either.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "moi non plus, je ne sais pas" },
              { id: "wrong-aussi", text: "moi aussi, je sais" },
              { id: "wrong-que", text: "parce que je ne sais pas" },
            ],
            correctOptionId: "correct",
            audioText: "moi non plus, je ne sais pas",
          },
          replyGloss: "Me neither, I don't know.",
        },
      ],
    },
    {
      id: "fr-m13-9-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "moi aussi", target: "me too" },
        { id: "p-1", source: "moi non plus", target: "me neither" },
        { id: "p-2", source: "c'est cher", target: "it's expensive" },
        { id: "p-3", source: "je ne sais pas", target: "I don't know" },
        { id: "p-4", source: "pourquoi ?", target: "why?" },
        { id: "p-5", source: "parce que", target: "because" },
      ],
    },
  ];
}

/** L10 — mastery: planning an evening that keeps falling through (cinéma
 *  too expensive, nobody knows where anyone is), ending on a soft one-line
 *  m14 «Hier» tease — flavor text only, no new atom, no answer position
 *  (dialogue_sim is outside `frSurfaces()`'s reach). All graded; ends on
 *  the sim. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m13-10-lc-1",
      audioText: "pourquoi tu ne vas pas au cinéma ?",
      correctMeaningEn: "Why aren't you going to the cinema?",
      distractorsEn: ["Why aren't you going to the museum?", "Why are you going to the cinema?", "Where is the cinema?"],
    }),
    cloze(
      "fr-m13-10-cloze-1",
      "je ne vais pas au cinéma,",
      "c'est cher",
      "parce que",
      ["parce que", "pourquoi ?", "moi non plus"],
      "because it's expensive",
      "je ne vais pas au cinéma, parce que c'est cher",
    ),
    speaking("fr-m13-10-speak-recall-vaiscinema", "je vais au cinéma", "I'm going to the cinema", [], "recall"),
    sentenceMcq({
      id: "fr-m13-10-smcq-1",
      prompt: "'I don't know where Hugo is' — pick the French.",
      correctText: "je ne sais pas où est Hugo",
      distractorsText: ["je sais où est Hugo", "tu ne sais pas où est Hugo", "je ne sais pas où est Marie"],
    }),
    build(
      "fr-m13-10-build-1",
      "Build: 'I don't know either'",
      "je ne sais pas non plus",
      ["je ne sais pas", "non plus", "moi non plus", "il n'est pas"],
      ["je ne sais pas", "non plus"],
    ),
    listeningCompSentence({
      id: "fr-m13-10-lc-2",
      audioText: "moi non plus, je ne sais pas",
      correctMeaningEn: "Me neither, I don't know.",
      distractorsEn: ["Me too, I know.", "Me neither, I know.", "Me too, I don't know."],
    }),
    speaking("fr-m13-10-speak-recall-jenesaispas", "je ne sais pas", "I don't know", [], "recall"),
    build(
      "fr-m13-10-build-2",
      "Build: 'me neither'",
      "moi non plus",
      ["moi non plus", "moi aussi", "parce que"],
      ["moi non plus"],
    ),
    sentenceMcq({
      id: "fr-m13-10-smcq-2",
      prompt: "'It's not expensive' — pick the French.",
      correctText: "ce n'est pas cher",
      distractorsText: ["c'est cher", "ce n'est pas combien", "je ne sais pas"],
    }),
    {
      id: "fr-m13-10-sim-soiree",
      type: "dialogue_sim",
      scene: { emoji: "🌆", title: "A complicated evening" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cinema",
          npc: {
            speaker: "Marie",
            kana: "On va au cinéma ce soir ?",
            audioText: "on va au cinéma ce soir ?",
            gloss: "Are we going to the cinema tonight?",
          },
          goal: "Say no, it's expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, c'est cher" },
              { id: "wrong-not", text: "non, ce n'est pas cher" },
              { id: "wrong-yes", text: "oui, on va au cinéma" },
            ],
            correctOptionId: "correct",
            audioText: "non, c'est cher",
          },
          replyGloss: "No, it's expensive.",
        },
        {
          id: "t2-hugo",
          npc: {
            speaker: "Marie",
            kana: "D'accord. Tu sais où est Hugo ?",
            audioText: "d'accord, tu sais où est hugo ?",
            gloss: "Okay. Do you know where Hugo is?",
          },
          goal: "Say you don't know, casually.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "je sais pas" },
              { id: "also-correct", text: "je ne sais pas" },
              { id: "wrong-oui", text: "oui, il est là" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "je sais pas",
          },
          replyGloss: "I don't know.",
        },
        {
          id: "t3-tease",
          npc: {
            speaker: "Marie",
            kana: "Bon. On parle demain ?",
            audioText: "bon, on parle demain ?",
            gloss: "Okay. We'll talk tomorrow?",
          },
          goal: "Agree.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord" },
              { id: "wrong-non", text: "non" },
              { id: "wrong-sais", text: "je ne sais pas" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord",
          },
          replyGloss: "Okay.",
        },
      ],
    },
  ];
}

const FR_M13_1: LessonContent = {
  id: "fr-m13-1",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je sais / je ne sais pas",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M13_2: LessonContent = {
  id: "fr-m13-2",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Ne … pas — les verbes",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M13_3: LessonContent = {
  id: "fr-m13-3",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "N' devant une voyelle",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M13_4: LessonContent = {
  id: "fr-m13-4",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Pourquoi ? Parce que…",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M13_5: LessonContent = {
  id: "fr-m13-5",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je n'ai pas de …",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M13_6: LessonContent = {
  id: "fr-m13-6",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il n'est pas, ce n'est pas",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M13_7: LessonContent = {
  id: "fr-m13-7",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je sais pas",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M13_8: LessonContent = {
  id: "fr-m13-8",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · La négation",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M13_9: LessonContent = {
  id: "fr-m13-9",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Moi non plus",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M13_10: LessonContent = {
  id: "fr-m13-10",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Une soirée compliquée",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M13_MODULE: FrModuleDef = {
  title: "Je sais pas",
  eyebrow: "Module 13",
  summary:
    "Negation generalizes: build ne…pas around any verb you conjugate, then meet the spoken register that drops the ne — «je sais pas».",
  lessons: [
    FR_M13_1,
    FR_M13_2,
    FR_M13_3,
    FR_M13_4,
    FR_M13_5,
    FR_M13_6,
    FR_M13_7,
    FR_M13_8,
    FR_M13_9,
    FR_M13_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M13_CHECKPOINT_INDEX = 8;

export const FR_M13_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m13-s",
    moduleId: "m13",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m13-s",
        prompt: "'I don't know' — pick the French.",
        correctText: "je ne sais pas",
        distractorsText: ["je sais", "tu ne sais pas", "je ne sais"],
      }),
  },
  {
    id: "pt-fr-m13-1",
    moduleId: "m13",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m13-1",
        prompt: "'I don't like chocolate' — pick the French.",
        correctText: "je n'aime pas le chocolat",
        distractorsText: ["j'aime le chocolat", "je n'aime pas la pizza", "je ne sais pas le chocolat"],
      }),
  },
  {
    id: "pt-fr-m13-2",
    moduleId: "m13",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m13-2",
        prompt: "'Why?' — pick the French.",
        correctText: "pourquoi ?",
        distractorsText: ["parce que", "comment", "c'est combien"],
      }),
  },
  {
    id: "pt-fr-m13-3",
    moduleId: "m13",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m13-3",
        prompt: "'I don't have a cat' — pick the French.",
        correctText: "je n'ai pas de chat",
        distractorsText: ["j'ai un chat", "je n'aime pas le chat", "je n'ai pas de chien"],
      }),
  },
  {
    id: "pt-fr-m13-4",
    moduleId: "m13",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m13-4",
        prompt: "'Me neither' — pick the French.",
        correctText: "moi non plus",
        distractorsText: ["moi aussi", "je ne sais pas", "parce que"],
      }),
  },
];
