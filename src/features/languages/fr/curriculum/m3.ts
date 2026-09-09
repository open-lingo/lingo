/**
 * m3.ts — Les goûts — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-01, the first FR module after the hand-authored m1/m2
 * restart. Mirrors the ES m3 spine ("Things pick a side" — the article
 * system + first nouns) merged with m2's own authored promise (Chloé, m2
 * L10: "Module 3 gives you the next thing she'll ask about: what you
 * like") — which merge is natural in French because liking TAKES the
 * definite article: «j'aime le chocolat». Scope decisions:
 *   - le/la + un/une + c'est + first nouns + j'aime / tu aimes /
 *     je n'aime pas / moi aussi. The §13.4 gender-rule callback card
 *     lives in L1 (the pink-f/blue-m chips have been absorbed since
 *     «bonne nuit»).
 *   - ES m3's «hay» (existence) is NOT ported here — «il y a» waits for
 *     a later module; the budget went to aimer (the authored m2 hook).
 *   - No plurals, no «les»: French plurals are mostly silent and need
 *     the homophone machinery first (moduleBarGuards header).
 *   - All nouns are consonant-initial ON PURPOSE: article elision
 *     («l'école») deserves its own beat after le/la is solid, and it
 *     keeps every tile bank breach-free by construction (pin F2/F4).
 *     Liking-nouns are mass/activity nouns so the singular is natural
 *     («j'aime la glace» — never a forced «les chats»).
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   le chat L1 · la musique L1 · un livre L2 · la pizza L2 ·
 *   le livre de Léa L2 · c'est un chat L3 · c'est quoi ? L3 ·
 *   c'est une glace L3 · j'aime le chocolat L4 · j'aime la musique L4 ·
 *   tu aimes le cinéma ? L5 · moi aussi L5 · j'aime le cinéma L5 ·
 *   je n'aime pas le café L6 · j'aime la glace L7
 *   recalls drawn: le chat L4 · c'est un chat L7 · tu aimes le cinéma ? L7 ·
 *   je n'aime pas le café L6+L8 · c'est quoi ? L8 · la musique L8 ·
 *   c'est une glace L9 · j'aime le cinéma L9 · la pizza L10 · moi aussi L10
 *   cross-module (licensed by m1/m2 printed voicings): ça va bien ·
 *   je ne comprends pas · je suis de Paris.
 *
 * Cast continuity: Chloé (the m2 L10 bus stranger) carries the module's
 * promise; Léa, Hugo, Emma, Inès return; Louis debuts as the L10 newcomer.
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  vocabMcq,
  vocabTextMcq,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
  listeningBuildSentence,
  genderSort,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";


export const FR_M3_ATOMS: FrAtom[] = [
  atom({ surface: "le", meaningEn: "the (with le-words)", partOfSpeech: "particle", fromModule: "m3", kind: "particle", hint: "luh — the blue-m family's 'the'" }),
  atom({ surface: "la", meaningEn: "the (with la-words)", partOfSpeech: "particle", fromModule: "m3", kind: "particle", hint: "lah — the pink-f family's 'the'" }),
  atom({ surface: "une", meaningEn: "a / an (with la-words)", partOfSpeech: "particle", fromModule: "m3", kind: "particle", hint: "oon — «un», your number one, is the blue-m 'a'" }),
  atom({ surface: "c'est", meaningEn: "it's / this is", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase", hint: "say — ce + est squeezed into one word, like d'où" }),
  atom({ surface: "c'est quoi ?", meaningEn: "what is that?", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase", hint: "say KWA — point and ask" }),
  atom({ surface: "j'aime", meaningEn: "I like / I love", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase", emoji: "❤️", hint: "zhem — je + aime squeezed into one word" }),
  atom({ surface: "tu aimes", meaningEn: "you like", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase", hint: "tu EM — the -s is silent; the aime sounds just like j'aime's" }),
  atom({ surface: "je n'aime pas", meaningEn: "I don't like", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase", hint: "zhuh nem PAH — ne squeezes to n' before aime" }),
  atom({ surface: "moi aussi", meaningEn: "me too", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase", hint: "mwa oh-SEE" }),
  atom({ surface: "chat", meaningEn: "cat", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "🐱", hint: "shah — the t is silent" }),
  atom({ surface: "chien", meaningEn: "dog", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "🐶", hint: "shyan — nasal ending, the n is not spoken" }),
  atom({ surface: "livre", meaningEn: "book", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📖", hint: "LEE-vruh" }),
  atom({ surface: "thé", meaningEn: "tea", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "🍵", hint: "tay" }),
  atom({ surface: "chocolat", meaningEn: "chocolate", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "🍫", hint: "sho-ko-LAH — the t sleeps, like chat's" }),
  atom({ surface: "cinéma", meaningEn: "the movies", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "🎬", hint: "see-nay-MA" }),
  atom({ surface: "musique", meaningEn: "music", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🎵", hint: "mu-ZEEK" }),
  atom({ surface: "pizza", meaningEn: "pizza", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🍕", hint: "peed-ZA — borrowed, and filed as a pink-f word" }),
  atom({ surface: "glace", meaningEn: "ice cream", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🍨", hint: "glass — one syllable" }),
  atom({ surface: "maison", meaningEn: "house", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🏠", hint: "may-ZOHN — nasal ending" }),
];

/** L1 — le/la: the §13.4 callback card, three noun debuts, the first
 *  gender_sort. The chips have been pink/blue since «bonne nuit» — this
 *  lesson names the system. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m3-1-info-sides",
      "The two sides",
      "Since «bonne nuit», words have worn pink-f and blue-m — you've been reading French gender all along. The secret: EVERY noun picks a side and keeps it. Blue-m words take «le» — «le chat», the cat. Pink-f words take «la» — «la musique». No shortcut from the meaning: learn each noun WITH its le or la, like a first name.",
      "grammar",
    ),
    vocabMcq(
      "fr-m3-1-img-chat",
      { surface: "chat", meaningEn: "the cat", emoji: "🐱" },
      [
        { surface: "chien", emoji: "🐶" },
        { surface: "musique", emoji: "🎵" },
        { surface: "café", emoji: "☕" },
      ],
    ),
    speaking("fr-m3-1-speak-lechat", "le chat", "the cat", []),
    vocabMcq(
      "fr-m3-1-img-chien",
      { surface: "chien", meaningEn: "the dog", emoji: "🐶" },
      [
        { surface: "chat", emoji: "🐱" },
        { surface: "musique", emoji: "🎵" },
        { surface: "café", emoji: "☕" },
      ],
    ),
    {
      id: "fr-m3-1-map-lamusique",
      type: "word_map",
      tokens: ["la", "musique"],
      pairs: [
        { en: "the", tokenIndex: 0 },
        { en: "music", tokenIndex: 1 },
      ],
      audioText: "la musique",
      tokenGenders: { 0: "f", 1: "f" },
      revealNote:
        "«musique» is a pink-f word, so its 'the' is «la» — and the chips glow to match, the same pink that dressed «bonne nuit».",
    },
    cloze(
      "fr-m3-1-cloze-la",
      "",
      "musique",
      "la",
      ["la", "le"],
      "the music",
      "la musique",
      "«musique» lives on the pink-f side — its 'the' is «la».",
    ),
    {
      // TAIL: m1 courtesy by ear.
      id: "fr-m3-1-hear-mercibeaucoup",
      type: "word_image_mcq",
      meaningEn: "merci beaucoup",
      options: [
        { id: "correct", word: "merci beaucoup", emoji: "💐" },
        { id: "o1", word: "s'il vous plaît", emoji: "🤲" },
        { id: "o2", word: "bonne nuit", emoji: "🌙" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the m2 check-in lane, from memory.
    speaking("fr-m3-1-speak-cavabien-recall", "ça va bien", "it's going well", [], "recall"),
    cloze(
      "fr-m3-1-cloze-le",
      "",
      "chien",
      "le",
      ["le", "la"],
      "the dog",
      "le chien",
      "«chien» is a blue-m word — «le». Alternate sides until it's a reflex.",
    ),
    listeningCompSentence({
      id: "fr-m3-1-lc-lechat",
      audioText: "le chat",
      correctMeaningEn: "The cat",
      distractorsEn: ["The dog", "The music", "Thank you"],
    }),
    genderSort({
      id: "fr-m3-1-sort",
      prompt: "Sort each word onto its side.",
      buckets: [
        { id: "m", label: "le (blue-m)" },
        { id: "f", label: "la (pink-f)" },
      ],
      items: [
        { id: "g-chat", surface: "chat", bucketId: "m", meaningEn: "cat" },
        { id: "g-musique", surface: "musique", bucketId: "f", meaningEn: "music" },
        { id: "g-chien", surface: "chien", bucketId: "m", meaningEn: "dog" },
      ],
      endingRule:
        "No ending trick here — you know each word's side because you met them together. That habit is the whole system.",
    }),
    {
      id: "fr-m3-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-chat", source: "chat", target: "cat" },
        { id: "p-chien", source: "chien", target: "dog" },
        { id: "p-musique", source: "musique", target: "music" },
        { id: "p-mercibeaucoup", source: "merci beaucoup", target: "thank you very much" },
        { id: "p-bonsoir", source: "bonsoir", target: "good evening" },
        { id: "p-cafe", source: "café", target: "coffee" },
      ],
    },
    // WIN: claim a side out loud — printed first voicing.
    speaking("fr-m3-1-speak-lamusique", "la musique", "the music", []),
  ];
}

/** L2 — un/une ride the same sides («Un café ?» was the rule all along),
 *  plus the «de» possessive from m2 doing new work. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m3-2-info-unune",
      "Never learn a side twice",
      "«un» — your number one since counting — is also 'a' for blue-m words: «un livre», a book. Pink-f words take «une»: «une pizza» (oon). Same sides as le/la — learn a word's side once and both pairs are yours. Léa's «Un café ?» was literally 'ONE coffee' AND 'a coffee'.",
      "grammar",
    ),
    vocabMcq(
      "fr-m3-2-img-livre",
      { surface: "livre", meaningEn: "the book", emoji: "📖" },
      [
        { surface: "chat", emoji: "🐱" },
        { surface: "chien", emoji: "🐶" },
        { surface: "musique", emoji: "🎵" },
      ],
    ),
    speaking("fr-m3-2-speak-unlivre", "un livre", "a book", []),
    vocabMcq(
      "fr-m3-2-img-pizza",
      { surface: "pizza", meaningEn: "the pizza", emoji: "🍕" },
      [
        { surface: "livre", emoji: "📖" },
        { surface: "café", emoji: "☕" },
        { surface: "musique", emoji: "🎵" },
      ],
    ),
    {
      id: "fr-m3-2-map-unepizza",
      type: "word_map",
      tokens: ["une", "pizza"],
      pairs: [
        { en: "a", tokenIndex: 0 },
        { en: "pizza", tokenIndex: 1 },
      ],
      audioText: "une pizza",
      tokenGenders: { 0: "f", 1: "f" },
      revealNote:
        "«une» — the pink-f 'a'. Same side as «la»: la pizza, une pizza. One side, both pairs.",
    },
    cloze(
      "fr-m3-2-cloze-une",
      "",
      "pizza",
      "une",
      ["une", "un"],
      "a pizza",
      "une pizza",
      "«pizza» is a pink-f word, so its 'a' is «une».",
    ),
    {
      // TAIL: m1 by ear — the casual hello.
      id: "fr-m3-2-hear-salut",
      type: "word_image_mcq",
      meaningEn: "salut",
      options: [
        { id: "correct", word: "salut", emoji: "👋" },
        { id: "o1", word: "bonjour", emoji: "🙋" },
        { id: "o2", word: "au revoir", emoji: "🚪" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the m2 escape phrase, from memory.
    speaking(
      "fr-m3-2-speak-comprends-recall",
      "je ne comprends pas",
      "I don't understand",
      [],
      "recall",
    ),
    {
      id: "fr-m3-2-map-lelivredelea",
      type: "word_map",
      tokens: ["le", "livre", "de", "Léa"],
      pairs: [
        { en: "the", tokenIndex: 0 },
        { en: "book", tokenIndex: 1 },
        { en: "of", tokenIndex: 2 },
        { en: "Léa", tokenIndex: 3 },
      ],
      audioText: "le livre de Léa",
      tokenGenders: { 0: "m", 1: "m" },
      revealNote:
        "'The book of Léa' — that's how French owns things, with the same «de» as «je suis de Paris». Léa stays plain: the colors belong to WORDS, not people.",
    },
    cloze(
      "fr-m3-2-cloze-un",
      "",
      "livre",
      "un",
      ["un", "une"],
      "a book",
      "un livre",
      "«livre» is a blue-m word — «un», the same side as «le».",
    ),
    build(
      "fr-m3-2-build-lelivredelea",
      "Build: 'Léa's book'",
      "le livre de Léa",
      ["le", "livre", "de", "Léa", "la"],
      ["le", "livre", "de", "Léa"],
    ),
    listeningCompSentence({
      id: "fr-m3-2-lc-unepizza",
      audioText: "une pizza",
      correctMeaningEn: "A pizza",
      distractorsEn: ["A book", "The music", "A coffee"],
    }),
    {
      id: "fr-m3-2-match",
      type: "match_pairs",
      pairs: [
        { id: "p-livre", source: "livre", target: "book" },
        { id: "p-pizza", source: "pizza", target: "pizza" },
        { id: "p-une", source: "une", target: "a (pink-f side)" },
        { id: "p-de", source: "de", target: "of / from" },
        { id: "p-salut", source: "salut", target: "hi / bye (casual)" },
        { id: "p-cafe", source: "café", target: "coffee" },
      ],
      prompt: "Match them.",
    },
    // WIN: printed first voicing of the possessive.
    speaking("fr-m3-2-speak-lapizza", "la pizza", "the pizza", []),
  ];
}

/** L3 — «C'est quoi ?» / «C'est un chat.» — the naming machine, and the
 *  mystery-box sim that debuts the question. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m3-3-info-cest",
      "Point and ask",
      "«C'est quoi ?» — what's that? (say KWA). The answer starts with «c'est» — it's: «C'est un chat.» — it's a cat. That's ce + est squeezed into one word, the same move as «d'où». Point at anything in France; these two phrases will name it.",
      "grammar",
    ),
    vocabMcq(
      "fr-m3-3-img-glace",
      { surface: "glace", meaningEn: "the ice cream", emoji: "🍨" },
      [
        { surface: "pizza", emoji: "🍕" },
        { surface: "café", emoji: "☕" },
        { surface: "livre", emoji: "📖" },
      ],
    ),
    {
      id: "fr-m3-3-map-cestunchat",
      type: "word_map",
      tokens: ["c'est", "un", "chat"],
      pairs: [
        { en: "it's", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "cat", tokenIndex: 2 },
      ],
      audioText: "c'est un chat",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "«c'est» carries a hidden liaison: say-TUH(n) — the t of est wakes up before «un». Your ear already knows it from «c'est».",
    },
    speaking("fr-m3-3-speak-cestunchat", "c'est un chat", "it's a cat", []),
    {
      id: "fr-m3-3-sim-surprise",
      type: "dialogue_sim",
      scene: {
        emoji: "🎁",
        title: "Léa hides something",
        setting: "Both hands behind her back.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-quoi",
          npc: {
            speaker: "Léa",
            kana: "Une surprise !",
            audioText: "une surprise !",
            gloss: "A surprise!",
          },
          goal: "Ask what it is.",
          reply: {
            mode: "choice",
            options: [
              { id: "cestquoi", text: "c'est quoi ?" },
              { id: "dou", text: "tu es d'où ?" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "cestquoi",
            audioText: "c'est quoi ?",
          },
          replyGloss: "What is it?",
          explanation:
            "«C'est quoi ?» — the question that opens every box. say KWA.",
        },
        {
          id: "t2-glace",
          npc: {
            speaker: "Léa",
            kana: "C'est une glace !",
            audioText: "c'est une glace",
            gloss: "It's an ice cream!",
          },
          goal: "Take it — thank her properly.",
          reply: {
            mode: "choice",
            options: [
              { id: "mercibeaucoup", text: "merci beaucoup" },
              { id: "bonnenuit", text: "bonne nuit" },
              { id: "pardon", text: "pardon" },
            ],
            correctOptionId: "mercibeaucoup",
            audioText: "merci beaucoup",
          },
          replyGloss: "Thank you very much!",
        },
      ],
    },
    speaking("fr-m3-3-speak-cestquoi", "c'est quoi ?", "what is that?", []),
    listeningCompSentence({
      id: "fr-m3-3-lc-cestuneglace",
      audioText: "c'est une glace",
      correctMeaningEn: "It's an ice cream.",
      distractorsEn: ["It's a pizza.", "It's a cat.", "What is it?"],
    }),
    {
      // L2 word by ear.
      id: "fr-m3-3-hear-lapizza",
      type: "word_image_mcq",
      meaningEn: "la pizza",
      options: [
        { id: "correct", word: "la pizza", emoji: "🍕" },
        { id: "o1", word: "la glace", emoji: "🍨" },
        { id: "o2", word: "le livre", emoji: "📖" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: m2 origins lane, from memory.
    speaking(
      "fr-m3-3-speak-paris-recall",
      "je suis de Paris",
      "I'm from Paris",
      [],
      "recall",
    ),
    {
      id: "fr-m3-3-map-cestuneglace",
      type: "word_map",
      tokens: ["c'est", "une", "glace"],
      pairs: [
        { en: "it's", tokenIndex: 0 },
        { en: "an", tokenIndex: 1 },
        { en: "ice cream", tokenIndex: 2 },
      ],
      audioText: "c'est une glace",
      tokenGenders: { 1: "f", 2: "f" },
    },
    cloze(
      "fr-m3-3-cloze-une",
      "c'est",
      "glace",
      "une",
      ["une", "un"],
      "it's an ice cream",
      "c'est une glace",
      "«glace» is pink-f, so «une» — even inside a sentence, the side holds.",
    ),
    {
      id: "fr-m3-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-cestquoi", source: "c'est quoi ?", target: "what is that?" },
        { id: "p-glace", source: "glace", target: "ice cream" },
        { id: "p-chat", source: "chat", target: "cat" },
        { id: "p-ettoi", source: "et toi ?", target: "and you?" },
        { id: "p-monsieur", source: "monsieur", target: "sir / Mr." },
        { id: "p-cafe", source: "café", target: "coffee" },
      ],
    },
    // WIN: name the gift out loud — printed first voicing.
    speaking("fr-m3-3-speak-cestuneglace", "c'est une glace", "it's an ice cream", []),
  ];
}

/** L4 — «j'aime» + the French twist: liking takes THE. Chocolate and tea
 *  debut; the tea-or-coffee sim is the interleave break. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m3-4-info-jaime",
      "Liking, the French way",
      "«j'aime» — I like, I love (zhem — je + aime squeezed into one word, the c'est move again). The French twist: liking takes THE. «J'aime le chocolat» — I like chocolate — literally 'I like THE chocolate'. Name the side, then love the thing.",
      "grammar",
    ),
    vocabMcq(
      "fr-m3-4-img-chocolat",
      { surface: "chocolat", meaningEn: "the chocolate", emoji: "🍫" },
      [
        { surface: "glace", emoji: "🍨" },
        { surface: "pizza", emoji: "🍕" },
        { surface: "café", emoji: "☕" },
      ],
    ),
    {
      id: "fr-m3-4-map-jaimelechocolat",
      type: "word_map",
      tokens: ["j'aime", "le", "chocolat"],
      pairs: [
        { en: "I like", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "chocolate", tokenIndex: 2 },
      ],
      audioText: "j'aime le chocolat",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "The «le» stays on — French loves things with their article attached. English drops 'the' here; French never does.",
    },
    speaking("fr-m3-4-speak-jaimelechocolat", "j'aime le chocolat", "I like chocolate", []),
    vocabMcq(
      "fr-m3-4-img-the",
      { surface: "thé", meaningEn: "the tea", emoji: "🍵" },
      [
        { surface: "café", emoji: "☕" },
        { surface: "chocolat", emoji: "🍫" },
        { surface: "glace", emoji: "🍨" },
      ],
    ),
    {
      // Interleave break (§13.9 law 9): a real offer, mid-noun-run.
      id: "fr-m3-4-sim-theoucafe",
      type: "dialogue_sim",
      scene: { emoji: "🫖", title: "Emma puts the kettle on" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-offre",
          npc: {
            speaker: "Emma",
            kana: "Un thé ? Ou un café ?",
            audioText: "un thé ? ou un café ?",
            gloss: "A tea? Or a coffee?",
          },
          goal: "Order — politely.",
          reply: {
            mode: "build",
            tiles: ["un thé", "un café", "s'il vous plaît", "non merci"],
            answer: "un thé s'il vous plaît",
            // Max-acceptance (§13.9 law 11): every natural polite answer
            // this bank composes is right.
            alsoAccepted: [
              "un café s'il vous plaît",
              "un thé",
              "un café",
              "non merci",
            ],
            audioText: "un thé s'il vous plaît",
          },
          replyGloss: "A tea, please.",
          explanation:
            "Tea, coffee, or a polite pass — «ou» gives you the choice, m1 gave you the manners.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m3-4-lc-jaimelethe",
      audioText: "j'aime le thé",
      correctMeaningEn: "I like tea.",
      distractorsEn: ["I like coffee.", "I like chocolate.", "It's a tea."],
    }),
    cloze(
      "fr-m3-4-cloze-la",
      "j'aime",
      "musique",
      "la",
      ["la", "le"],
      "I like music",
      "j'aime la musique",
      "«musique» keeps its pink-f side even mid-sentence: «la».",
    ),
    {
      // TAIL: m1 evening lane by ear.
      id: "fr-m3-4-hear-bonnenuit",
      type: "word_image_mcq",
      meaningEn: "bonne nuit",
      options: [
        { id: "correct", word: "bonne nuit", emoji: "🌙" },
        { id: "o1", word: "bonsoir", emoji: "🌆" },
        { id: "o2", word: "bonjour", emoji: "🙋" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L1 lane, from memory.
    speaking("fr-m3-4-speak-lechat-recall", "le chat", "the cat", [], "recall"),
    build(
      "fr-m3-4-build-jaimelaglace",
      "Build: 'I like ice cream'",
      "j'aime la glace",
      ["j'aime", "la", "glace", "le", "thé"],
      ["j'aime", "la", "glace"],
    ),
    {
      id: "fr-m3-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jaime", source: "j'aime", target: "I like / I love" },
        { id: "p-chocolat", source: "chocolat", target: "chocolate" },
        { id: "p-the", source: "thé", target: "tea" },
        { id: "p-bien", source: "bien", target: "well" },
        { id: "p-svp", source: "s'il vous plaît", target: "please" },
        { id: "p-dix", source: "dix", target: "ten" },
      ],
    },
    // WIN: say what you love — printed first voicing.
    speaking("fr-m3-4-speak-jaimelamusique", "j'aime la musique", "I like music", []),
  ];
}

/** L5 — «Tu aimes… ?» and «moi aussi» — Chloé's promised question
 *  arrives, and the cinema with it. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m3-5-info-tuaimes",
      "Bounce it back",
      "«Tu aimes… ?» — do you like…? Just aim the sentence up: «Tu aimes le cinéma ?» (tu EM — that -s is silent, and the aime sounds exactly like j'aime's). To agree: «moi aussi» — me too (mwa oh-SEE).",
      "grammar",
    ),
    vocabMcq(
      "fr-m3-5-img-cinema",
      { surface: "cinéma", meaningEn: "the movies", emoji: "🎬" },
      [
        { surface: "musique", emoji: "🎵" },
        { surface: "livre", emoji: "📖" },
        { surface: "chocolat", emoji: "🍫" },
      ],
    ),
    {
      id: "fr-m3-5-map-tuaimeslecinema",
      type: "word_map",
      tokens: ["tu aimes", "le", "cinéma"],
      pairs: [
        { en: "you like", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "movies", tokenIndex: 2 },
      ],
      audioText: "tu aimes le cinéma ?",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "Same shape as «j'aime», new owner — and the voice rising at the end is the whole question. French questions can be that cheap.",
    },
    speaking("fr-m3-5-speak-tuaimes", "tu aimes le cinéma ?", "do you like the movies?", []),
    {
      // Chloé cashes the m2 promise: the bus stranger asks what you like.
      id: "fr-m3-5-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "🚌",
        title: "Chloé again",
        setting: "Same bus, same seat — she remembered you.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cinema",
          npc: {
            speaker: "Chloé",
            kana: "Tu aimes le cinéma ?",
            audioText: "tu aimes le cinéma ?",
            gloss: "Do you like the movies?",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "jaime", text: "oui j'aime le cinéma" },
              // The m2 flip-trap, one verb later: her form, not yours.
              { id: "tuaimes", text: "oui tu aimes le cinéma" },
              { id: "dou", text: "tu es d'où ?" },
            ],
            correctOptionId: "jaime",
            audioText: "oui j'aime le cinéma",
          },
          replyGloss: "Yes, I like the movies.",
          explanation:
            "Her «tu aimes», your «j'aime» — the same flip as «tu es» → «je suis».",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m3-5-lc-tuaimeslamusique",
      audioText: "tu aimes la musique ?",
      correctMeaningEn: "Do you like music?",
      distractorsEn: ["I like music.", "Do you like the movies?", "What is that?"],
    }),
    {
      // «moi aussi» debuts where it lives: agreeing with a friend.
      id: "fr-m3-5-sim-moiaussi",
      type: "dialogue_sim",
      scene: { emoji: "🍫", title: "Hugo, mid-snack" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-aussi",
          npc: {
            speaker: "Hugo",
            kana: "J'aime le chocolat.",
            audioText: "j'aime le chocolat",
            gloss: "I like chocolate.",
          },
          goal: "So do you — say it.",
          reply: {
            mode: "choice",
            options: [
              { id: "moiaussi", text: "moi aussi" },
              { id: "ettoi", text: "et toi ?" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "moiaussi",
            audioText: "moi aussi",
          },
          replyGloss: "Me too.",
          explanation:
            "«moi aussi» — me too. Agreement in two syllables: mwa oh-SEE.",
        },
      ],
    },
    speaking("fr-m3-5-speak-moiaussi", "moi aussi", "me too", []),
    {
      // L1 pair by ear.
      id: "fr-m3-5-hear-lechien",
      type: "word_image_mcq",
      meaningEn: "le chien",
      options: [
        { id: "correct", word: "le chien", emoji: "🐶" },
        { id: "o1", word: "le chat", emoji: "🐱" },
        { id: "o2", word: "le livre", emoji: "📖" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      // TAIL: the m2 suis/es lane rides into m3, spaced.
      "fr-m3-5-cloze-es",
      "tu",
      "Léa",
      "es",
      ["es", "suis"],
      "you are Léa",
      "tu es Léa",
      "«tu» still takes «es» — one module later, same rule.",
    ),
    build(
      "fr-m3-5-build-tuaimeslethe",
      "Build: 'do you like tea?'",
      "tu aimes le thé ?",
      ["tu aimes", "le", "thé ?", "j'aime", "la"],
      ["tu aimes", "le", "thé ?"],
    ),
    {
      id: "fr-m3-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-cinema", source: "cinéma", target: "the movies" },
        { id: "p-tuaimes", source: "tu aimes", target: "you like" },
        { id: "p-moiaussi", source: "moi aussi", target: "me too" },
        { id: "p-ettoi", source: "et toi ?", target: "and you?" },
        { id: "p-cafe", source: "café", target: "coffee" },
        { id: "p-deux", source: "deux", target: "two" },
      ],
    },
    // WIN: your side of Chloé's exchange — printed first voicing.
    speaking("fr-m3-5-speak-jaimelecinema", "j'aime le cinéma", "I like the movies", []),
  ];
}

/** L6 — «je n'aime pas»: ne…pas from m2's escape phrase, squeezed to n'
 *  before a vowel. The like/don't-like ear lane opens. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m3-6-info-naime",
      "The polite dislike",
      "«je n'aime pas» — I don't like (zhuh nem PAH). It's the same ne…pas that built «je ne comprends pas» — but before the vowel of aime, «ne» squeezes to «n'», the d'où move yet again. «Je n'aime pas le café» — said with a shrug, never an apology.",
      "grammar",
    ),
    vocabMcq(
      "fr-m3-6-img-maison",
      { surface: "maison", meaningEn: "the house", emoji: "🏠" },
      [
        { surface: "cinéma", emoji: "🎬" },
        { surface: "pizza", emoji: "🍕" },
        { surface: "chat", emoji: "🐱" },
      ],
    ),
    {
      id: "fr-m3-6-map-jenaimepas",
      type: "word_map",
      tokens: ["je n'aime pas", "le", "café"],
      pairs: [
        { en: "I don't like", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "coffee", tokenIndex: 2 },
      ],
      audioText: "je n'aime pas le café",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "«ne» became «n'» — elision is never optional. And the article STILL stays on: even dislike is definite in French.",
    },
    speaking(
      "fr-m3-6-speak-jenaimepas",
      "je n'aime pas le café",
      "I don't like coffee",
      [],
    ),
    listeningCompSentence({
      // Discrimination lane, trial 1 — answer LIKE (§13.9 law 4).
      id: "fr-m3-6-lc-jaimelecafe",
      audioText: "j'aime le café",
      correctMeaningEn: "I LIKE coffee.",
      distractorsEn: ["I don't like coffee.", "I like tea.", "It's a coffee."],
    }),
    {
      // The sim traps the lesson's own contrast: aime vs n'aime pas.
      id: "fr-m3-6-sim-honnete",
      type: "dialogue_sim",
      scene: {
        emoji: "☕",
        title: "Hugo pours you one",
        setting: "You, however, are a tea person.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cafe",
          npc: {
            speaker: "Hugo",
            kana: "Tu aimes le café ?",
            audioText: "tu aimes le café ?",
            gloss: "Do you like coffee?",
          },
          goal: "You don't — tell him honestly.",
          reply: {
            mode: "choice",
            options: [
              { id: "naime", text: "je n'aime pas le café" },
              { id: "jaime", text: "j'aime le café" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "naime",
            audioText: "je n'aime pas le café",
          },
          replyGloss: "I don't like coffee.",
          explanation:
            "Honest and polite — «je n'aime pas» closes no doors. He'll make tea.",
        },
      ],
    },
    // TAIL: the like side, from memory (voiced L4).
    speaking(
      "fr-m3-6-speak-jaimelechocolat-recall",
      "j'aime le chocolat",
      "I like chocolate",
      [],
      "recall",
    ),
    cloze(
      "fr-m3-6-cloze-naime",
      "je",
      "pas le thé",
      "n'aime",
      ["n'aime", "aimes"],
      "I don't like tea",
      "je n'aime pas le thé",
      "«je» pulls «n'aime» — the squeezed ne rides along. «aimes» belongs to «tu».",
    ),
    {
      // Same-lesson word by ear — la maison vs the pink-f crowd.
      id: "fr-m3-6-hear-lamaison",
      type: "word_image_mcq",
      meaningEn: "la maison",
      options: [
        { id: "correct", word: "la maison", emoji: "🏠" },
        { id: "o1", word: "la glace", emoji: "🍨" },
        { id: "o2", word: "le livre", emoji: "📖" },
      ],
      correctOptionId: "correct",
    },
    // «maison» was offered in four recognition slots and never produced —
    // answer-position pin (2026-09-06). Printed first voicing, article on.
    speaking("fr-m3-6-speak-lamaison", "la maison", "the house", ["maison"]),
    listeningCompSentence({
      // Discrimination lane, trial 2 — answer DON'T (alternation, law 4).
      id: "fr-m3-6-lc-jenaimepaslethe",
      audioText: "je n'aime pas le thé",
      correctMeaningEn: "I don't like tea.",
      distractorsEn: ["I like tea.", "I don't like coffee.", "A tea, please."],
    }),
    build(
      "fr-m3-6-build-jenaimepaslapizza",
      "Build: 'I don't like pizza'",
      "je n'aime pas la pizza",
      ["je n'aime pas", "la", "pizza", "le", "j'aime"],
      ["je n'aime pas", "la", "pizza"],
    ),
    {
      id: "fr-m3-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-maison", source: "maison", target: "house" },
        { id: "p-naime", source: "je n'aime pas", target: "I don't like" },
        { id: "p-the", source: "thé", target: "tea" },
        { id: "p-comprends", source: "je ne comprends pas", target: "I don't understand" },
        { id: "p-bonnenuit", source: "bonne nuit", target: "good night" },
        { id: "p-trois", source: "trois", target: "three" },
      ],
    },
    // WIN: the shrug, from memory — voiced at the top of this lesson.
    speaking(
      "fr-m3-6-speak-jenaimepas-recall",
      "je n'aime pas le café",
      "I don't like coffee",
      [],
      "recall",
    ),
  ];
}

/** L7 — zero new words: the room, the sides, the tastes — everything so
 *  far doing combined work. */
function lesson7(): LessonStep[] {
  return [
    genderSort({
      id: "fr-m3-7-sort",
      prompt: "Six words, two sides — sort them all.",
      buckets: [
        { id: "m", label: "le (blue-m)" },
        { id: "f", label: "la (pink-f)" },
      ],
      items: [
        { id: "g-chat", surface: "chat", bucketId: "m", meaningEn: "cat" },
        { id: "g-musique", surface: "musique", bucketId: "f", meaningEn: "music" },
        { id: "g-livre", surface: "livre", bucketId: "m", meaningEn: "book" },
        { id: "g-pizza", surface: "pizza", bucketId: "f", meaningEn: "pizza" },
        { id: "g-maison", surface: "maison", bucketId: "f", meaningEn: "house" },
        { id: "g-the", surface: "thé", bucketId: "m", meaningEn: "tea" },
      ],
      endingRule:
        "Still no ending shortcut — the side lives with the word. If you hesitated on one, that's the one to say out loud today.",
    }),
    // TAIL: Chloé's question, from memory (voiced L5).
    speaking(
      "fr-m3-7-speak-tuaimes-recall",
      "tu aimes le cinéma ?",
      "do you like the movies?",
      [],
      "recall",
    ),
    cloze(
      "fr-m3-7-cloze-le",
      "j'aime",
      "chocolat",
      "le",
      ["le", "la"],
      "I like chocolate",
      "j'aime le chocolat",
      "«chocolat» is blue-m — the side holds in every sentence it enters.",
    ),
    {
      id: "fr-m3-7-map-lechiendehugo",
      type: "word_map",
      tokens: ["c'est", "le", "chien", "de", "Hugo"],
      pairs: [
        { en: "it's", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "dog", tokenIndex: 2 },
        { en: "of", tokenIndex: 3 },
        { en: "Hugo", tokenIndex: 4 },
      ],
      audioText: "c'est le chien de Hugo",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "Naming plus owning in one line — «c'est» points, «de» hands it to Hugo.",
    },
    listeningCompSentence({
      id: "fr-m3-7-lc-lechatdelea",
      audioText: "c'est le chat de Léa",
      correctMeaningEn: "It's Léa's cat.",
      distractorsEn: ["It's Léa's dog.", "It's a cat.", "Léa is a student."],
    }),
    build(
      "fr-m3-7-build-lelivredehugo",
      "Build: 'it's Hugo's book'",
      "c'est le livre de Hugo",
      ["c'est", "le", "livre", "de", "Hugo", "la"],
      ["c'est", "le", "livre", "de", "Hugo"],
    ),
    {
      // The hot-drink shelf by ear.
      id: "fr-m3-7-hear-lethe",
      type: "word_image_mcq",
      meaningEn: "le thé",
      options: [
        { id: "correct", word: "le thé", emoji: "🍵" },
        { id: "o1", word: "le café", emoji: "☕" },
        { id: "o2", word: "la glace", emoji: "🍨" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the naming sentence, from memory (voiced L3).
    speaking(
      "fr-m3-7-speak-cestunchat-recall",
      "c'est un chat",
      "it's a cat",
      [],
      "recall",
    ),
    cloze(
      "fr-m3-7-cloze-une",
      "c'est",
      "pizza",
      "une",
      ["une", "un"],
      "it's a pizza",
      "c'est une pizza",
      "Pink-f side, pink-f 'a': «une pizza».",
    ),
    listeningCompSentence({
      // TAIL: m2 by ear — the -e that wakes the t.
      id: "fr-m3-7-lc-etudiante",
      audioText: "elle est étudiante",
      correctMeaningEn: "She is a student.",
      distractorsEn: ["He is a student.", "She likes music.", "She is from Paris."],
    }),
    {
      id: "fr-m3-7-sim-musique",
      type: "dialogue_sim",
      scene: { emoji: "🎵", title: "Inès shares an earbud" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-musique",
          npc: {
            speaker: "Inès",
            kana: "Tu aimes la musique ?",
            audioText: "tu aimes la musique ?",
            gloss: "Do you like music?",
          },
          goal: "You do — agree warmly.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouijaime", text: "oui j'aime la musique" },
              { id: "moiaussi", text: "moi aussi" },
              { id: "comprends", text: "je ne comprends pas" },
            ],
            correctOptionId: "ouijaime",
            audioText: "oui j'aime la musique",
          },
          replyGloss: "Yes, I like music.",
          explanation:
            "«moi aussi» answers a statement — her QUESTION wants your «j'aime». And you understood every word: no escape phrase needed.",
        },
      ],
    },
    {
      id: "fr-m3-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-chien", source: "chien", target: "dog" },
        { id: "p-glace", source: "glace", target: "ice cream" },
        { id: "p-cest", source: "c'est", target: "it's / this is" },
        { id: "p-monsieur", source: "monsieur", target: "sir / Mr." },
        { id: "p-cava", source: "ça va", target: "how's it going?" },
        { id: "p-huit", source: "huit", target: "eight" },
      ],
    },
    // WIN: printed first voicing — the taste you've been building toward.
    speaking("fr-m3-7-speak-jaimelaglace", "j'aime la glace", "I like ice cream", []),
  ];
}

/** L8 — CHECKPOINT (zero new, graded only): both article pairs
 *  discriminated on alternating answers, like/don't-like by ear, the
 *  naming and owning patterns produced. */
function checkpointLesson(): LessonStep[] {
  return [
    {
      id: "fr-m3-8-hear-lechat",
      type: "word_image_mcq",
      meaningEn: "le chat",
      options: [
        { id: "correct", word: "le chat", emoji: "🐱" },
        { id: "o1", word: "le chien", emoji: "🐶" },
        { id: "o2", word: "la maison", emoji: "🏠" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m3-8-cloze-la",
      "",
      "maison",
      "la",
      ["la", "le"],
      "the house",
      "la maison",
      "«maison» is a pink-f word — «la».",
    ),
    speaking("fr-m3-8-speak-cestquoi-recall", "c'est quoi ?", "what is that?", [], "recall"),
    listeningCompSentence({
      id: "fr-m3-8-lc-jenaimepaslapizza",
      audioText: "je n'aime pas la pizza",
      correctMeaningEn: "I don't like pizza.",
      distractorsEn: ["I like pizza.", "I don't like ice cream.", "A pizza, please."],
    }),
    vocabTextMcq("fr-m3-8-mc-cinema", "cinéma", ["musique", "livre", "maison"]),
    build(
      "fr-m3-8-build-jaimelecinema",
      "Build: 'I like the movies'",
      "j'aime le cinéma",
      ["j'aime", "le", "cinéma", "la", "je n'aime pas"],
      ["j'aime", "le", "cinéma"],
    ),
    {
      id: "fr-m3-8-hear-laglace",
      type: "word_image_mcq",
      meaningEn: "la glace",
      options: [
        { id: "correct", word: "la glace", emoji: "🍨" },
        { id: "o1", word: "la pizza", emoji: "🍕" },
        { id: "o2", word: "le thé", emoji: "🍵" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m3-8-cloze-un",
      "c'est",
      "livre",
      "un",
      ["un", "une"],
      "it's a book",
      "c'est un livre",
      "«livre» is blue-m — «un», the counting word doing article work.",
    ),
    speaking("fr-m3-8-speak-lamusique-recall", "la musique", "the music", [], "recall"),
    listeningCompSentence({
      id: "fr-m3-8-lc-tuaimeslechocolat",
      audioText: "tu aimes le chocolat ?",
      correctMeaningEn: "Do you like chocolate?",
      distractorsEn: ["I like chocolate.", "Do you like tea?", "It's a chocolate."],
    }),
    build(
      "fr-m3-8-build-lechatdelea",
      "Build: 'it's Léa's cat'",
      "c'est le chat de Léa",
      ["c'est", "le", "chat", "de", "Léa", "une"],
      ["c'est", "le", "chat", "de", "Léa"],
    ),
    cloze(
      "fr-m3-8-cloze-naime",
      "je",
      "pas le café",
      "n'aime",
      ["n'aime", "aimes"],
      "I don't like coffee",
      "je n'aime pas le café",
      "The je-form with its squeeze: «n'aime». «aimes» is tu's.",
    ),
    {
      id: "fr-m3-8-hear-lechocolat",
      type: "word_image_mcq",
      meaningEn: "le chocolat",
      options: [
        { id: "correct", word: "le chocolat", emoji: "🍫" },
        { id: "o1", word: "le thé", emoji: "🍵" },
        { id: "o2", word: "la pizza", emoji: "🍕" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("fr-m3-8-mc-moiaussi", "moi aussi", ["et toi ?", "c'est quoi ?", "non"]),
    speaking(
      "fr-m3-8-speak-jenaimepas-recall",
      "je n'aime pas le café",
      "I don't like coffee",
      [],
      "recall",
    ),
    {
      id: "fr-m3-8-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-pizza", source: "pizza", target: "pizza" },
        { id: "p-the", source: "thé", target: "tea" },
        { id: "p-cinema", source: "cinéma", target: "the movies" },
        { id: "p-jaime", source: "j'aime", target: "I like / I love" },
        { id: "p-une", source: "une", target: "a (pink-f side)" },
        { id: "p-cestquoi", source: "c'est quoi ?", target: "what is that?" },
      ],
    },
  ];
}

/** L9 — Movie night: the promised conversation, then the retrieval tail
 *  over exactly what it used. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m3-9-sim-soiree",
      type: "dialogue_sim",
      scene: {
        emoji: "🎬",
        title: "Movie night — Chloé's plan",
        setting: "Chloé, Hugo and Emma, outside the cinema.",
      },
      exercisedAtomIds: [],
      explanation:
        "Check-in, tastes, agreement, and a polite order — a whole evening built from three modules.",
      turns: [
        {
          id: "t1-checkin",
          npc: {
            speaker: "Chloé",
            kana: "Salut ! Ça va ?",
            audioText: "ça va",
            gloss: "Hi! How's it going?",
          },
          goal: "Answer — bounce it back.",
          reply: {
            mode: "build",
            tiles: ["ça va", "bien", "et toi ?", "non merci"],
            answer: "ça va bien et toi ?",
            alsoAccepted: ["ça va bien", "ça va et toi ?", "ça va"],
            audioText: "ça va bien et toi ?",
          },
          replyGloss: "Fine — and you?",
        },
        {
          id: "t2-cinema",
          npc: {
            speaker: "Chloé",
            kana: "Tu aimes le cinéma ?",
            audioText: "tu aimes le cinéma ?",
            gloss: "Do you like the movies?",
          },
          goal: "You're here, aren't you?",
          reply: {
            mode: "choice",
            options: [
              { id: "jaime", text: "oui j'aime le cinéma" },
              { id: "tuaimes", text: "oui tu aimes le cinéma" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "jaime",
            audioText: "oui j'aime le cinéma",
          },
          replyGloss: "Yes, I like the movies.",
        },
        {
          id: "t3-pizza",
          npc: {
            speaker: "Hugo",
            kana: "J'aime la pizza !",
            audioText: "j'aime la pizza",
            gloss: "I love pizza!",
          },
          goal: "So do you.",
          reply: {
            mode: "choice",
            options: [
              { id: "moiaussi", text: "moi aussi" },
              { id: "cestquoi", text: "c'est quoi ?" },
              { id: "pardon", text: "pardon" },
            ],
            correctOptionId: "moiaussi",
            audioText: "moi aussi",
          },
          replyGloss: "Me too.",
        },
        {
          id: "t4-dessert",
          npc: {
            speaker: "Emma",
            kana: "Un chocolat ? Ou une glace ?",
            audioText: "un chocolat ? ou une glace ?",
            gloss: "A hot chocolate? Or an ice cream?",
          },
          goal: "Pick one — politely.",
          reply: {
            mode: "build",
            tiles: ["une glace", "un chocolat", "s'il vous plaît", "non merci"],
            answer: "une glace s'il vous plaît",
            alsoAccepted: [
              "un chocolat s'il vous plaît",
              "une glace",
              "un chocolat",
              "non merci",
            ],
            audioText: "une glace s'il vous plaît",
          },
          replyGloss: "An ice cream, please.",
          explanation:
            "Both treats, either article, or a polite pass — every honest build wins here.",
        },
      ],
    },
    build(
      "fr-m3-9-build-tuaimeslapizza",
      "Build: 'do you like pizza?'",
      "tu aimes la pizza ?",
      ["tu aimes", "la", "pizza ?", "j'aime", "le"],
      ["tu aimes", "la", "pizza ?"],
    ),
    listeningCompSentence({
      id: "fr-m3-9-lc-uneglacesvp",
      audioText: "une glace s'il vous plaît",
      correctMeaningEn: "An ice cream, please.",
      distractorsEn: ["A hot chocolate, please.", "No ice cream, thanks.", "It's an ice cream."],
    }),
    // The gift from L3, from memory.
    speaking(
      "fr-m3-9-speak-cestuneglace-recall",
      "c'est une glace",
      "it's an ice cream",
      [],
      "recall",
    ),
    cloze(
      "fr-m3-9-cloze-le",
      "tu aimes",
      "chocolat ?",
      "le",
      ["le", "la"],
      "do you like chocolate?",
      "tu aimes le chocolat ?",
      "«chocolat» rides the blue-m side in questions too.",
    ),
    {
      id: "fr-m3-9-hear-lecinema",
      type: "word_image_mcq",
      meaningEn: "le cinéma",
      options: [
        { id: "correct", word: "le cinéma", emoji: "🎬" },
        { id: "o1", word: "la musique", emoji: "🎵" },
        { id: "o2", word: "le livre", emoji: "📖" },
      ],
      correctOptionId: "correct",
    },
    listeningBuildSentence({
      id: "fr-m3-9-lbuild-jaimelaglace",
      target: "j'aime la glace",
      tiles: ["j'aime", "la", "glace", "le", "chat"],
      correctOrder: ["j'aime", "la", "glace"],
      promptEn: "Build what you hear",
    }),
    vocabTextMcq("fr-m3-9-mc-chien", "chien", ["chat", "maison", "livre"]),
    {
      id: "fr-m3-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-cinema", source: "cinéma", target: "the movies" },
        { id: "p-pizza", source: "pizza", target: "pizza" },
        { id: "p-glace", source: "glace", target: "ice cream" },
        { id: "p-cava", source: "ça va", target: "how's it going?" },
        { id: "p-svp", source: "s'il vous plaît", target: "please" },
        { id: "p-bonjour", source: "bonjour", target: "hello" },
      ],
    },
    // WIN: the night's headline, from memory.
    speaking(
      "fr-m3-9-speak-jaimelecinema-recall",
      "j'aime le cinéma",
      "I like the movies",
      [],
      "recall",
    ),
  ];
}

/** L10 — Mastery. Graded only; every item; ends on Louis, a newcomer —
 *  the naming game and the tastes leave the script. */
function lesson10(): LessonStep[] {
  return [
    {
      id: "fr-m3-10-hear-lamusique",
      type: "word_image_mcq",
      meaningEn: "la musique",
      options: [
        { id: "correct", word: "la musique", emoji: "🎵" },
        { id: "o1", word: "le cinéma", emoji: "🎬" },
        { id: "o2", word: "la glace", emoji: "🍨" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m3-10-build-jenaimepaslechocolat",
      "Build: 'I don't like chocolate'",
      "je n'aime pas le chocolat",
      ["je n'aime pas", "le", "chocolat", "la", "j'aime"],
      ["je n'aime pas", "le", "chocolat"],
    ),
    cloze(
      "fr-m3-10-cloze-la",
      "c'est",
      "maison",
      "la",
      ["la", "le"],
      "it's the house",
      "c'est la maison",
      "«maison» — pink-f, so «la», in any sentence.",
    ),
    listeningCompSentence({
      id: "fr-m3-10-lc-cestunchien",
      audioText: "c'est un chien",
      correctMeaningEn: "It's a dog.",
      distractorsEn: ["It's a cat.", "It's a book.", "He is a student."],
    }),
    speaking("fr-m3-10-speak-lapizza-recall", "la pizza", "the pizza", [], "recall"),
    vocabTextMcq("fr-m3-10-mc-the", "thé", ["café", "chocolat", "glace"]),
    cloze(
      "fr-m3-10-cloze-une",
      "c'est",
      "glace",
      "une",
      ["une", "un"],
      "it's an ice cream",
      "c'est une glace",
      "Pink-f 'a': «une glace».",
    ),
    listeningCompSentence({
      id: "fr-m3-10-lc-tuaimeslethe",
      audioText: "tu aimes le thé ?",
      correctMeaningEn: "Do you like tea?",
      distractorsEn: ["Do you like coffee?", "I like tea.", "What is that?"],
    }),
    build(
      "fr-m3-10-build-lechiendehugo",
      "Build: 'it's Hugo's dog'",
      "c'est le chien de Hugo",
      ["c'est", "le", "chien", "de", "Hugo", "une"],
      ["c'est", "le", "chien", "de", "Hugo"],
    ),
    {
      id: "fr-m3-10-hear-lelivre",
      type: "word_image_mcq",
      meaningEn: "le livre",
      options: [
        { id: "correct", word: "le livre", emoji: "📖" },
        { id: "o1", word: "le chat", emoji: "🐱" },
        { id: "o2", word: "la pizza", emoji: "🍕" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m3-10-speak-moiaussi-recall", "moi aussi", "me too", [], "recall"),
    cloze(
      "fr-m3-10-cloze-naime",
      "je",
      "pas le thé",
      "n'aime",
      ["n'aime", "aimes"],
      "I don't like tea",
      "je n'aime pas le thé",
      "n' before aime, and the je-form — the squeeze never takes a day off.",
    ),
    {
      id: "fr-m3-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-livre", source: "livre", target: "book" },
        { id: "p-maison", source: "maison", target: "house" },
        { id: "p-chocolat", source: "chocolat", target: "chocolate" },
        { id: "p-tuaimes", source: "tu aimes", target: "you like" },
        { id: "p-cestquoi", source: "c'est quoi ?", target: "what is that?" },
        { id: "p-une", source: "une", target: "a (pink-f side)" },
      ],
    },
    {
      // THE MODULE ENDS ON A NEWCOMER.
      id: "fr-m3-10-sim-louis",
      type: "dialogue_sim",
      scene: {
        emoji: "🌙",
        title: "After the movie — Louis",
        setting: "Chloé's friend Louis joins, eyeing your dessert.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module: every noun has a side, «c'est» names the world, and your tastes are yours — in French. Module 4: taking all of it out into the town.",
      turns: [
        {
          id: "t1-cinema",
          npc: {
            speaker: "Louis",
            kana: "Tu aimes le cinéma ?",
            audioText: "tu aimes le cinéma ?",
            gloss: "Do you like the movies?",
          },
          goal: "You just saw one — you do.",
          reply: {
            mode: "choice",
            options: [
              { id: "jaime", text: "oui j'aime le cinéma" },
              { id: "tuaimes", text: "oui tu aimes le cinéma" },
              { id: "comprends", text: "je ne comprends pas" },
            ],
            correctOptionId: "jaime",
            audioText: "oui j'aime le cinéma",
          },
          replyGloss: "Yes, I like the movies.",
        },
        {
          id: "t2-quoi",
          npc: {
            speaker: "Louis",
            kana: "C'est quoi ?",
            audioText: "c'est quoi ?",
            gloss: "What's that?",
          },
          goal: "Your dessert — name it.",
          reply: {
            mode: "build",
            tiles: ["c'est", "une", "glace", "un", "chat"],
            answer: "c'est une glace",
            audioText: "c'est une glace",
          },
          replyGloss: "It's an ice cream.",
        },
        {
          id: "t3-aussi",
          npc: {
            speaker: "Louis",
            kana: "J'aime la glace ! Et toi ?",
            audioText: "j'aime la glace et toi ?",
            gloss: "I love ice cream! And you?",
          },
          goal: "Answer honestly — either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "moiaussi", text: "moi aussi" },
              { id: "naime", text: "je n'aime pas la glace" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "moiaussi",
            alsoCorrectOptionIds: ["naime"],
            audioText: "moi aussi",
          },
          replyGloss: "Me too.",
          explanation:
            "A real taste question has two honest answers — agreeing AND politely not. Both build from this module.",
        },
        {
          id: "t4-nuit",
          npc: {
            speaker: "Léa",
            kana: "Bonne nuit !",
            audioText: "bonne nuit",
            gloss: "Good night!",
          },
          goal: "Send them home.",
          reply: {
            mode: "choice",
            options: [
              { id: "bonnenuit", text: "bonne nuit" },
              { id: "abientot", text: "à bientôt" },
              { id: "merci", text: "merci" },
            ],
            correctOptionId: "bonnenuit",
            alsoCorrectOptionIds: ["abientot"],
            audioText: "bonne nuit",
          },
          replyGloss: "Good night!",
        },
      ],
    },
  ];
}

const FR_M3_1: LessonContent = {
  id: "fr-m3-1",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Everything picks a side",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M3_2: LessonContent = {
  id: "fr-m3-2",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Never learn a side twice",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M3_3: LessonContent = {
  id: "fr-m3-3",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Point and ask",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M3_4: LessonContent = {
  id: "fr-m3-4",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Say what you love",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M3_5: LessonContent = {
  id: "fr-m3-5",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Ask back — moi aussi",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M3_6: LessonContent = {
  id: "fr-m3-6",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Say no nicely",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M3_7: LessonContent = {
  id: "fr-m3-7",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Name it, claim it",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M3_8: LessonContent = {
  id: "fr-m3-8",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for movie night",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M3_9: LessonContent = {
  id: "fr-m3-9",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Movie night",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M3_10: LessonContent = {
  id: "fr-m3-10",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — on a newcomer",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M3_MODULE: FrModuleDef = {
  title: "Les goûts — sides & tastes",
  eyebrow: "Module 3",
  summary:
    "Every noun picks a side. Learn le/la and un/une, name what you see with «c'est», and say what you love — and don't.",
  lessons: [
    FR_M3_1,
    FR_M3_2,
    FR_M3_3,
    FR_M3_4,
    FR_M3_5,
    FR_M3_6,
    FR_M3_7,
    FR_M3_8,
    FR_M3_9,
    FR_M3_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M3_CHECKPOINT_INDEX = 8;

export const FR_M3_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m3-s",
    moduleId: "m3",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m3-s",
        prompt: "Complete: «J'aime ___ chocolat.»",
        correctText: "le",
        distractorsText: ["la", "une", "et"],
      }),
  },
  {
    id: "pt-fr-m3-1",
    moduleId: "m3",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m3-1",
        prompt: "'It's a cat' — pick the French.",
        correctText: "c'est un chat",
        distractorsText: ["c'est une chat", "c'est un chien", "j'aime le chat"],
      }),
  },
  {
    id: "pt-fr-m3-2",
    moduleId: "m3",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m3-2",
        prompt: "Pick the phrase that means 'me too'.",
        correctText: "moi aussi",
        distractorsText: ["et toi ?", "c'est quoi ?", "non merci"],
      }),
  },
  {
    id: "pt-fr-m3-3",
    moduleId: "m3",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m3-3",
        prompt: "'I don't like tea' — pick the French.",
        correctText: "je n'aime pas le thé",
        distractorsText: ["je ne aime pas le thé", "j'aime le thé", "je n'aime pas la thé"],
      }),
  },
  {
    id: "pt-fr-m3-4",
    moduleId: "m3",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m3-4",
        prompt: "Complete: «C'est ___ pizza.»",
        correctText: "une",
        distractorsText: ["un", "le", "et"],
      }),
  },
];
