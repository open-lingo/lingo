/**
 * m10.ts — Les — the §13-doctrine hand-authored module.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LIAISON AUDITION LIST (coordinator ruling, 2026-09-01) — hand this to
 * Spencer for a targeted listen BEFORE promotion. Every liaison-bearing
 * beat in this module draws ONLY from these strings; swapping any of
 * them is a one-step + one-clip edit (enumerated in m10.test.ts).
 *
 *   1. «les chats et les écoles»  — claims: z-link ONLY at les→écoles;
 *      les→chats silent (consonant onset); no link into or out of «et».
 *   2. «les hôtels et les chiens» — claims: z-link ONLY at les→hôtels
 *      (through the mute h); everything after «et» silent.
 *   3. «les écoles et les hôtels» — claims: z-links at les→écoles AND
 *      les→hôtels; junctions around «et» silent.
 *   4. «les écoles» — bare NP: lay-Z-ay-kohl (audible z claimed).
 *   5. «les hôtels» — bare NP: lay-Z-oh-tel (audible z, mute h).
 *
 * Supporting (robust vowel-contrast lane — should survive any voice, but
 * worth one listen): «les chats», «les chiens», «le chat», «le chien»,
 * «les livres».
 * ═══════════════════════════════════════════════════════════════════════
 *
 * AUTHORED 2026-09-01 per the playbook arc (docs/fr-authoring-playbook.md
 * §8): m9's L10 promised «les — the plural door opens». LAST module of
 * this run — the lane pauses after m10 for Spencer's walk before m11's
 * verb machine (ES conjugation checkpoint law).
 *
 * SCOPE DECISIONS (all deliberate):
 *   - THE MODULE'S THESIS: the plural -s is SILENT — «chat» and «chats»
 *     are one sound, so the word you HEAR is the article. The core ear
 *     lane is therefore the ROBUST le/les VOWEL contrast (luh vs lay),
 *     per coordinator ruling #4; the fragile z-liaison beats are
 *     contained to L5 + one L7 revisit, drawing only from the audition
 *     set above, and the CHECKPOINT is liaison-free.
 *   - liaison_listen DEBUTS (pin F1) with exactly 3 items, each carrying
 *     silent junctions on purpose (consonant onsets + the «et»-never-
 *     links law) so over-application is untrainable.
 *   - PLURAL SURFACES REGISTER AS THEIR OWN ATOMS (chats, chiens,
 *     livres, croissants, écoles, hôtels) carrying homophoneKey; the
 *     singular atoms (m3–m6) are NOT retro-edited, so the homophone
 *     guard arms fully only when the noun-plural canon lands — until
 *     then an m10.test pin forbids co-tiling a singular/plural pair in
 *     any LISTENING bank (written builds may — spelling the silent -s
 *     IS the written skill, pin §1).
 *   - «des» = some (existence: «il y a des chats»); «les» after aimer
 *     (French likes ALL of a kind: «j'aime les chats» — the sentence m3
 *     deliberately couldn't build, arc closed). The les/des choice is
 *     drilled as a frame rule, stated once.
 *   - COUNTING UNLOCKS: «j'ai deux chats», «je voudrais deux
 *     croissants» (m1 numbers × m6 ordering). Family counting stays
 *     banned (m7 pin holds — frères/sœurs unregistered).
 *   - NO plural agreement (grands/petites), no «aux», no plural
 *     possessives (mes/tes) — all future beats; plurals of vowel-nouns
 *     never meet withArticle (no factory MCQs on plural atoms — the
 *     articled display would derive «le chats»).
 *   - m10 word_maps carry NO tokenGenders: a plural chain spans both
 *     genders and a wrong tint would teach a false rule.
 *   - The finale plants m11: the shelter volunteer's «Vous aimez les
 *     chats ?» is a GLOSSED vous-form tease, never graded.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   les chats L1 · les chiens L1 · les chats et les chiens L1 ·
 *   j'aime les chats L2 · j'aime les chiens L2 · il y a des chats ici
 *   L3 · j'ai deux chats L3 · il y a des chiens ici L3 · je voudrais
 *   deux croissants L4 · je voudrais deux croissants s'il vous plaît
 *   L4 · les écoles L5 · les hôtels L5 · tu aimes les chats ? L6 ·
 *   tu aimes les chiens ? L6 · il y a des livres ici L7
 *   recalls drawn: elle est très grande L1 (m9) · les chats et les
 *   chiens L2+L9 · j'aime les chats L3+L8 · il y a des chiens ici L4 ·
 *   je voudrais deux croissants s'il vous plaît L5+L8+L10 · j'ai deux
 *   chats L7 · j'aime les chiens L7 · les écoles L6 · les hôtels
 *   L8+L10 · tu aimes les chats ? L9 · il y a des chats ici L8.
 *
 * Cast: Chloé asks the eternal cats-or-dogs question and finds the
 * shelter poster; Hugo learns you have TWO cats; the madame sells
 * croissants by the pair; Inès scouts the shelter; the volunteer
 * madame runs «Le refuge», where the run ends with an adoption.
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
  listeningBuildSentence,
  liaisonListen,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";


export const FR_M10_ATOMS: FrAtom[] = [
  atom({ surface: "les", meaningEn: "the (plural)", partOfSpeech: "particle", fromModule: "m10", kind: "particle", hint: "lay — one article for every plural, both sides" }),
  atom({ surface: "des", meaningEn: "some (plural)", partOfSpeech: "particle", fromModule: "m10", kind: "particle", hint: "day — the plural 'a'; un and une's big sibling" }),
  atom({ surface: "chats", meaningEn: "cats", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", homophoneKey: "ʃa", hint: "shah — the -s is silent; «les» does the talking" }),
  atom({ surface: "chiens", meaningEn: "dogs", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", homophoneKey: "ʃjɛ̃", hint: "shyan — same sound as one dog" }),
  atom({ surface: "livres", meaningEn: "books", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", homophoneKey: "livʁ", hint: "LEE-vruh — the plural hides in the article" }),
  atom({ surface: "croissants", meaningEn: "croissants", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", homophoneKey: "kʁwasɑ̃", hint: "krwa-SAHN — order two, hear no -s" }),
  atom({ surface: "écoles", meaningEn: "schools", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", homophoneKey: "ekɔl", hint: "ay-KOHL — but «les écoles» hides a z between the words" }),
  atom({ surface: "hôtels", meaningEn: "hotels", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", homophoneKey: "otɛl", hint: "oh-TELL — the z links through the silent h" }),
];

/** L1 — «les»: the plural door, and the silent -s thesis. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m10-1-info-les",
      "The plural door",
      "«les» — the plural 'the' (lay), one article for both sides: «les chats» — the cats, «les chiens» — the dogs. The French secret: the plural -s is SILENT — chat and chats are one sound. The word you HEAR is «les». From today, your ears follow the article.",
      "grammar",
    ),
    {
      id: "fr-m10-1-map-leschats",
      type: "word_map",
      tokens: ["les", "chats"],
      pairs: [
        { en: "the (plural)", tokenIndex: 0 },
        { en: "cats", tokenIndex: 1 },
      ],
      audioText: "les chats",
      revealNote:
        "lay shah — the -s wrote itself and said nothing. «les» carries the whole plural.",
    },
    speaking("fr-m10-1-speak-leschats", "les chats", "the cats", []),
    listeningCompSentence({
      // The core ear lane: le vs les by VOWEL (luh vs lay) — robust.
      id: "fr-m10-1-lc-leschats",
      audioText: "les chats",
      correctMeaningEn: "The cats.",
      distractorsEn: ["The cat.", "The dogs.", "Some cats."],
    }),
    cloze(
      "fr-m10-1-cloze-les",
      "",
      "chats",
      "les",
      ["les", "le"],
      "the cats",
      "les chats",
      "The -s you can't hear, you can SEE — plural spelling calls «les».",
    ),
    {
      // TAIL: m9 break, mid-plurals (§13.9 law 9).
      id: "fr-m10-1-sim-chloe",
      type: "dialogue_sim",
      scene: { emoji: "🐱", title: "Chloé, still melted" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-petit",
          npc: {
            speaker: "Chloé",
            kana: "Ton chat est très petit !",
            audioText: "ton chat est très petit !",
            gloss: "Your cat is so little!",
          },
          goal: "He is — proudly.",
          reply: {
            mode: "choice",
            options: [
              { id: "petit", text: "oui c'est mon petit chat" },
              { id: "petite", text: "oui c'est ma petite chat" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "petit",
            audioText: "oui c'est mon petit chat",
          },
          replyGloss: "Yes — that's my little cat.",
        },
      ],
    },
    {
      id: "fr-m10-1-map-leschiens",
      type: "word_map",
      tokens: ["les", "chiens"],
      pairs: [
        { en: "the (plural)", tokenIndex: 0 },
        { en: "dogs", tokenIndex: 1 },
      ],
      audioText: "les chiens",
      revealNote:
        "Same «les», other pets — one plural article for absolutely everything.",
    },
    speaking("fr-m10-1-speak-leschiens", "les chiens", "the dogs", []),
    listeningCompSentence({
      // Alternation: the singular answers this time.
      id: "fr-m10-1-lc-lechat",
      audioText: "le chat",
      correctMeaningEn: "The cat (just one).",
      distractorsEn: ["The cats.", "The dog.", "The little cat."],
    }),
    // TAIL: m9 lane, from memory.
    speaking(
      "fr-m10-1-speak-ellegrande-recall",
      "elle est très grande",
      "she is very tall",
      [],
      "recall",
    ),
    cloze(
      "fr-m10-1-cloze-le",
      "",
      "chat",
      "le",
      ["le", "les"],
      "the cat (just one)",
      "le chat",
      "No -s in sight — one cat, «le», luh.",
    ),
    {
      id: "fr-m10-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-les", source: "les", target: "the (plural)" },
        { id: "p-chats", source: "chats", target: "cats" },
        { id: "p-chiens", source: "chiens", target: "dogs" },
        { id: "p-chat", source: "chat", target: "cat" },
        { id: "p-chien", source: "chien", target: "dog" },
        { id: "p-dix", source: "dix", target: "ten" },
      ],
    },
    // WIN: both herds at once — printed first voicing.
    speaking(
      "fr-m10-1-speak-both",
      "les chats et les chiens",
      "the cats and the dogs",
      [],
    ),
  ];
}

/** L2 — «j'aime les chats»: the sentence m3 couldn't build. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m10-2-info-jaimeles",
      "Liking, at last, in plural",
      "Module 3 taught «j'aime le chocolat» — likes in general. For countable things French likes them ALL: «J'aime les chats» — I like cats (lay shah, no -s to hear, just «les»). The sentence you've been waiting seven modules for.",
      "grammar",
    ),
    {
      id: "fr-m10-2-map-jaimeleschats",
      type: "word_map",
      tokens: ["j'aime", "les", "chats"],
      pairs: [
        { en: "I like", tokenIndex: 0 },
        { en: "(all) the", tokenIndex: 1 },
        { en: "cats", tokenIndex: 2 },
      ],
      audioText: "j'aime les chats",
      revealNote:
        "English drops the article; French likes the whole species — «les» stays on.",
    },
    speaking("fr-m10-2-speak-jaimeleschats", "j'aime les chats", "I like cats", []),
    {
      // The eternal question.
      id: "fr-m10-2-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "🐾",
        title: "Chloé asks THE question",
        setting: "There is only one right answer. Allegedly.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ouou",
          npc: {
            speaker: "Chloé",
            kana: "Tu aimes les chats ou les chiens ?",
            audioText: "tu aimes les chats ou les chiens ?",
            gloss: "Cats or dogs?",
          },
          goal: "Cats — obviously.",
          reply: {
            mode: "choice",
            options: [
              { id: "chats", text: "j'aime les chats" },
              { id: "tuaimes", text: "tu aimes les chats" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "chats",
            audioText: "j'aime les chats",
          },
          replyGloss: "I like cats.",
          explanation:
            "The eternal question — module 1's «ou» making module 10's biggest decision.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m10-2-lc-jaimeleschiens",
      audioText: "j'aime les chiens",
      correctMeaningEn: "I like dogs.",
      distractorsEn: ["I like cats.", "I like the dog.", "I have dogs."],
    }),
    cloze(
      "fr-m10-2-cloze-les",
      "j'aime",
      "chiens",
      "les",
      ["les", "le"],
      "I like dogs",
      "j'aime les chiens",
      "Liking a KIND takes «les» — the whole species at once.",
    ),
    {
      // TAIL: m6 by ear — the singular sets up L4's plural order.
      id: "fr-m10-2-hear-croissant",
      type: "word_image_mcq",
      meaningEn: "le croissant",
      options: [
        { id: "correct", word: "le croissant", emoji: "🥐" },
        { id: "o1", word: "le gâteau", emoji: "🍰" },
        { id: "o2", word: "le sandwich", emoji: "🥪" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L1's win, from memory.
    speaking(
      "fr-m10-2-speak-both-recall",
      "les chats et les chiens",
      "the cats and the dogs",
      [],
      "recall",
    ),
    build(
      "fr-m10-2-build-jaimeleschiens",
      "Build: 'I like dogs'",
      "j'aime les chiens",
      ["j'aime", "les", "chiens", "le", "chien"],
      ["j'aime", "les", "chiens"],
    ),
    listeningCompSentence({
      id: "fr-m10-2-lc-tuaimesleschats",
      audioText: "tu aimes les chats ?",
      correctMeaningEn: "Do you like cats?",
      distractorsEn: ["I like cats.", "Do you like dogs?", "Do you have cats?"],
    }),
    cloze(
      "fr-m10-2-cloze-tuaimes",
      "tu aimes",
      "chats ?",
      "les",
      ["les", "le"],
      "do you like cats?",
      "tu aimes les chats ?",
      "Questions like the species whole too — «les».",
    ),
    {
      id: "fr-m10-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-les", source: "les", target: "the (plural)" },
        { id: "p-chiens", source: "chiens", target: "dogs" },
        { id: "p-jaime", source: "j'aime", target: "I like / I love" },
        { id: "p-ou", source: "ou", target: "or" },
        { id: "p-et", source: "et", target: "and" },
        { id: "p-neuf", source: "neuf", target: "nine" },
      ],
    },
    // WIN: pick a side out loud — printed first voicing.
    speaking("fr-m10-2-speak-jaimeleschiens", "j'aime les chiens", "I like dogs", []),
  ];
}

/** L3 — «des» + counting: some cats, two cats. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m10-3-info-des",
      "Some, and how many",
      "«des» — some, the plural 'a' (day): «Il y a des chats ici» — there are (some) cats here. And your module-1 numbers finally multiply: «deux chats», «trois chiens». The -s appears in writing; «les», «des» and the number do the talking.",
      "grammar",
    ),
    {
      id: "fr-m10-3-map-deschats",
      type: "word_map",
      tokens: ["il y a", "des", "chats", "ici"],
      pairs: [
        { en: "there are", tokenIndex: 0 },
        { en: "some", tokenIndex: 1 },
        { en: "cats", tokenIndex: 2 },
        { en: "here", tokenIndex: 3 },
      ],
      audioText: "il y a des chats ici",
      revealNote:
        "«il y a» never changes; «des» goes plural for it. Existence deals in SOME.",
    },
    speaking("fr-m10-3-speak-deschats", "il y a des chats ici", "there are cats here", []),
    cloze(
      "fr-m10-3-cloze-des",
      "il y a",
      "chiens ici",
      "des",
      ["des", "les"],
      "there are (some) dogs here",
      "il y a des chiens ici",
      "Existence deals in SOME — «des». «les» would claim every dog on earth.",
    ),
    {
      id: "fr-m10-3-sim-hugo",
      type: "dialogue_sim",
      scene: {
        emoji: "🐱",
        title: "Hugo hears two meows",
        setting: "Stereo. From your bag.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-deux",
          npc: {
            speaker: "Hugo",
            kana: "Tu as un chat ?",
            audioText: "tu as un chat ?",
            gloss: "Do you have a cat?",
          },
          goal: "TWO, actually.",
          reply: {
            mode: "choice",
            options: [
              { id: "deux", text: "j'ai deux chats" },
              { id: "sansS", text: "j'ai deux chat" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "deux",
            audioText: "j'ai deux chats",
          },
          replyGloss: "I have two cats.",
          explanation:
            "Two cats, one silent -s — the number says it out loud, the spelling seals it.",
        },
      ],
    },
    speaking("fr-m10-3-speak-deuxchats", "j'ai deux chats", "I have two cats", []),
    listeningCompSentence({
      id: "fr-m10-3-lc-deschats",
      audioText: "il y a des chats ici",
      correctMeaningEn: "There are cats here.",
      distractorsEn: ["There are dogs here.", "The cats are here.", "I have two cats."],
    }),
    {
      // TAIL: m3 by ear — one cat, for contrast.
      id: "fr-m10-3-hear-chat",
      type: "word_image_mcq",
      meaningEn: "le chat",
      options: [
        { id: "correct", word: "le chat", emoji: "🐱" },
        { id: "o1", word: "le chien", emoji: "🐶" },
        { id: "o2", word: "la famille", emoji: "👨‍👩‍👧‍👦" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the species claim, from memory.
    speaking("fr-m10-3-speak-jaimeleschats-recall", "j'aime les chats", "I like cats", [], "recall"),
    cloze(
      "fr-m10-3-cloze-deux",
      "j'ai",
      "chats",
      "deux",
      ["deux", "trois"],
      "I have TWO cats",
      "j'ai deux chats",
      "Two meows, two cats — «deux», with the -s riding silently behind.",
    ),
    build(
      "fr-m10-3-build-deschiens",
      "Build: 'there are dogs here'",
      "il y a des chiens ici",
      ["il y a", "des", "chiens", "ici", "les"],
      ["il y a", "des", "chiens", "ici"],
    ),
    {
      id: "fr-m10-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-des", source: "des", target: "some (plural)" },
        { id: "p-chiens", source: "chiens", target: "dogs" },
        { id: "p-deux", source: "deux", target: "two" },
        { id: "p-trois", source: "trois", target: "three" },
        { id: "p-ilya", source: "il y a", target: "there is / there are" },
        { id: "p-ici", source: "ici", target: "here" },
      ],
    },
    // WIN: some dogs, conjured — printed first voicing.
    speaking(
      "fr-m10-3-speak-deschiens",
      "il y a des chiens ici",
      "there are dogs here",
      [],
    ),
  ];
}

/** L4 — plural ordering: the m6 counter, multiplied. Books join. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m10-4-info-commander",
      "Order by the handful",
      "«Je voudrais deux croissants, s'il vous plaît» — module 6, multiplied. And «les livres» — the books (lay LEE-vruh, the -s asleep as always). Counting works on everything now: deux livres, trois croissants.",
      "grammar",
    ),
    {
      id: "fr-m10-4-map-deuxcroissants",
      type: "word_map",
      tokens: ["je voudrais", "deux", "croissants"],
      pairs: [
        { en: "I would like", tokenIndex: 0 },
        { en: "two", tokenIndex: 1 },
        { en: "croissants", tokenIndex: 2 },
      ],
      audioText: "je voudrais deux croissants",
      revealNote:
        "The counter hears «deux»; the -s just makes the receipt correct.",
    },
    speaking(
      "fr-m10-4-speak-deuxcroissants",
      "je voudrais deux croissants",
      "I would like two croissants",
      [],
    ),
    {
      id: "fr-m10-4-sim-madame",
      type: "dialogue_sim",
      scene: {
        emoji: "🥐",
        title: "The madame, tongs ready",
        setting: "The croissants are fresh. Take two.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-deux",
          npc: {
            speaker: "The madame",
            kana: "Vous désirez ?",
            audioText: "vous désirez ?",
            gloss: "What would you like?",
          },
          goal: "Two croissants — politely.",
          reply: {
            mode: "build",
            tiles: ["je voudrais", "deux", "croissants", "s'il vous plaît", "croissant"],
            answer: "je voudrais deux croissants s'il vous plaît",
            alsoAccepted: [
              "je voudrais deux croissants",
              "deux croissants s'il vous plaît",
              "deux croissants",
            ],
            audioText: "je voudrais deux croissants s'il vous plaît",
          },
          replyGloss: "I'd like two croissants, please.",
          explanation:
            "The bare «croissant» tile was a spelling trap — after «deux», the -s must ride along.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m10-4-lc-troiscroissants",
      audioText: "je voudrais trois croissants",
      correctMeaningEn: "I would like three croissants.",
      distractorsEn: [
        "I would like two croissants.",
        "I would like a croissant.",
        "Three croissants, please.",
      ],
    }),
    cloze(
      "fr-m10-4-cloze-leslivres",
      "j'aime",
      "livres",
      "les",
      ["les", "des"],
      "I like books",
      "j'aime les livres",
      "After «j'aime», French likes them ALL: «les». «des» belongs to il y a.",
    ),
    {
      // TAIL: m4 by ear — the singular école, before L5 pluralizes it.
      id: "fr-m10-4-hear-ecole",
      type: "word_image_mcq",
      meaningEn: "l'école",
      options: [
        { id: "correct", word: "l'école", emoji: "🏫" },
        { id: "o1", word: "l'hôtel", emoji: "🏨" },
        { id: "o2", word: "le musée", emoji: "🏛️" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L3's dogs, from memory.
    speaking(
      "fr-m10-4-speak-deschiens-recall",
      "il y a des chiens ici",
      "there are dogs here",
      [],
      "recall",
    ),
    {
      id: "fr-m10-4-map-deslivres",
      type: "word_map",
      tokens: ["il y a", "des", "livres", "ici"],
      pairs: [
        { en: "there are", tokenIndex: 0 },
        { en: "some", tokenIndex: 1 },
        { en: "books", tokenIndex: 2 },
        { en: "here", tokenIndex: 3 },
      ],
      audioText: "il y a des livres ici",
      revealNote:
        "A shelf appears — «des livres», sounding exactly like one book plus «day».",
    },
    cloze(
      "fr-m10-4-cloze-trois",
      "je voudrais",
      "croissants",
      "trois",
      ["trois", "deux"],
      "I would like THREE croissants",
      "je voudrais trois croissants",
      "Appetite grows — «trois», and the silent -s stretches to fit.",
    ),
    build(
      "fr-m10-4-build-jaimeleslivres",
      "Build: 'I like books'",
      "j'aime les livres",
      ["j'aime", "les", "livres", "des", "livre"],
      ["j'aime", "les", "livres"],
    ),
    {
      id: "fr-m10-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-livres", source: "livres", target: "books" },
        { id: "p-croissants", source: "croissants", target: "croissants" },
        { id: "p-les", source: "les", target: "the (plural)" },
        { id: "p-voudrais", source: "je voudrais", target: "I would like" },
        { id: "p-deux", source: "deux", target: "two" },
        { id: "p-huit", source: "huit", target: "eight" },
      ],
    },
    // WIN: the full plural order — printed first voicing.
    speaking(
      "fr-m10-4-speak-fullorder",
      "je voudrais deux croissants s'il vous plaît",
      "I'd like two croissants, please",
      [],
    ),
  ];
}

/** L5 — THE LIAISON BEAT (pin F1): the hidden z, and the junctions that
 *  refuse it. Draws only from the audition set in the file header. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m10-5-info-liaison",
      "The sound between words",
      "Before a vowel, «les» hands over a hidden z: «les écoles» — lay-Z-ay-kohl. The z isn't written anywhere; it lives between the words. And it's choosy: consonants refuse it («les chats» — no z), and «et» NEVER links. Your ear learns the junctions now.",
      "grammar",
    ),
    {
      id: "fr-m10-5-map-lesecoles",
      type: "word_map",
      tokens: ["les", "écoles"],
      pairs: [
        { en: "the (plural)", tokenIndex: 0 },
        { en: "schools", tokenIndex: 1 },
      ],
      audioText: "les écoles",
      revealNote:
        "lay-Z-ay-kohl — the z the spelling hides. It only appears before a vowel.",
    },
    speaking("fr-m10-5-speak-lesecoles", "les écoles", "the schools", []),
    liaisonListen({
      id: "fr-m10-5-liaison-1",
      words: ["les", "chats", "et", "les", "écoles"],
      linkedJunctions: [3],
      meaningEn: "the cats and the schools",
      audioText: "les chats et les écoles",
      junctionNotes: {
        0: "«chats» starts with a consonant — no link.",
        1: "The -s of «chats» stays silent before «et».",
        2: "«et» never links — ever.",
        3: "les + écoles: the hidden z appears.",
      },
      explanation:
        "One z in the whole phrase — the vowel invited it; nothing else did.",
    }),
    // TAIL: the plural order, from memory.
    speaking(
      "fr-m10-5-speak-fullorder-recall",
      "je voudrais deux croissants s'il vous plaît",
      "I'd like two croissants, please",
      [],
      "recall",
    ),
    {
      id: "fr-m10-5-map-leshotels",
      type: "word_map",
      tokens: ["les", "hôtels"],
      pairs: [
        { en: "the (plural)", tokenIndex: 0 },
        { en: "hotels", tokenIndex: 1 },
      ],
      audioText: "les hôtels",
      revealNote:
        "The silent h steps aside again — lay-Z-oh-tel. The m4 squeeze family, now in plural.",
    },
    listeningCompSentence({
      id: "fr-m10-5-lc-lesecoles",
      audioText: "les écoles",
      correctMeaningEn: "The schools.",
      distractorsEn: ["The school.", "The hotels.", "The cats."],
    }),
    liaisonListen({
      id: "fr-m10-5-liaison-2",
      words: ["les", "hôtels", "et", "les", "chiens"],
      linkedJunctions: [0],
      meaningEn: "the hotels and the dogs",
      audioText: "les hôtels et les chiens",
      junctionNotes: {
        0: "les + hôtels: the z passes straight through the silent h.",
        2: "«et» never links.",
        3: "«chiens» takes no link — consonant start.",
      },
      explanation:
        "The h can't stop the z — mute h counts as a vowel here too.",
    }),
    {
      // TAIL: m4 by ear.
      id: "fr-m10-5-hear-hotel",
      type: "word_image_mcq",
      meaningEn: "l'hôtel",
      options: [
        { id: "correct", word: "l'hôtel", emoji: "🏨" },
        { id: "o1", word: "l'école", emoji: "🏫" },
        { id: "o2", word: "la gare", emoji: "🚉" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m10-5-cloze-les",
      "",
      "écoles",
      "les",
      ["les", "l'"],
      "the schools",
      "les écoles",
      "Plural spelling calls «les» — «l'» only serves the singular squeeze.",
    ),
    {
      id: "fr-m10-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ecoles", source: "écoles", target: "schools" },
        { id: "p-hotels", source: "hôtels", target: "hotels" },
        { id: "p-chats", source: "chats", target: "cats" },
        { id: "p-ecole", source: "école", target: "school" },
        { id: "p-hotel", source: "hôtel", target: "hotel" },
        { id: "p-sept", source: "sept", target: "seven" },
      ],
    },
    // WIN: the z through the h — printed first voicing.
    speaking("fr-m10-5-speak-leshotels", "les hôtels", "the hotels", []),
  ];
}

/** L6 — zero new: the question tour — likes, plural, both directions. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m10-6-sim-louis",
      type: "dialogue_sim",
      scene: {
        emoji: "🐾",
        title: "Louis takes a side",
        setting: "The eternal question, round two.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ouou",
          npc: {
            speaker: "Louis",
            kana: "Tu aimes les chats ou les chiens ?",
            audioText: "tu aimes les chats ou les chiens ?",
            gloss: "Cats or dogs?",
          },
          goal: "Dogs, this time — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "chiens", text: "j'aime les chiens" },
              { id: "chats", text: "j'aime les chats" },
              { id: "tuaimes", text: "tu aimes les chiens" },
            ],
            correctOptionId: "chiens",
            audioText: "j'aime les chiens",
          },
          replyGloss: "I like dogs.",
        },
        {
          id: "t2-aussi",
          npc: {
            speaker: "Louis",
            kana: "Moi aussi !",
            audioText: "moi aussi",
            gloss: "Me too!",
          },
          goal: "Seal it — dog people.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "quoi", text: "c'est quoi ?" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m10-6-lc-tuaimes",
      audioText: "tu aimes les chats ?",
      correctMeaningEn: "Do you like cats?",
      distractorsEn: ["Do you like dogs?", "I like cats.", "Do you have cats?"],
    }),
    // TAIL: the z, from memory (voiced L5).
    speaking("fr-m10-6-speak-lesecoles-recall", "les écoles", "the schools", [], "recall"),
    cloze(
      "fr-m10-6-cloze-des",
      "il y a",
      "chats ici",
      "des",
      ["des", "les"],
      "there are (some) cats here",
      "il y a des chats ici",
      "Still SOME — «des» for existence, «les» for the whole species.",
    ),
    build(
      "fr-m10-6-build-tuaimesleschiens",
      "Build: 'do you like dogs?'",
      "tu aimes les chiens ?",
      ["tu aimes", "les", "chiens ?", "des", "le"],
      ["tu aimes", "les", "chiens ?"],
    ),
    {
      // TAIL: m7 by ear.
      id: "fr-m10-6-hear-famille",
      type: "word_image_mcq",
      meaningEn: "la famille",
      options: [
        { id: "correct", word: "la famille", emoji: "👨‍👩‍👧‍👦" },
        { id: "o1", word: "le frère", emoji: "👦" },
        { id: "o2", word: "la sœur", emoji: "👧" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m10-6-speak-tuaimesleschats", "tu aimes les chats ?", "do you like cats?", []),
    listeningCompSentence({
      id: "fr-m10-6-lc-deuxchats",
      audioText: "j'ai deux chats",
      correctMeaningEn: "I have two cats.",
      distractorsEn: ["I have two dogs.", "I have a cat.", "There are two cats."],
    }),
    vocabTextMcq("fr-m10-6-mc-les", "les", ["des", "le", "la"]),
    {
      id: "fr-m10-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-chats", source: "chats", target: "cats" },
        { id: "p-chiens", source: "chiens", target: "dogs" },
        { id: "p-les", source: "les", target: "the (plural)" },
        { id: "p-des", source: "des", target: "some (plural)" },
        { id: "p-moiaussi", source: "moi aussi", target: "me too" },
        { id: "p-quatre", source: "quatre", target: "four" },
      ],
    },
    // WIN: ask the other side — printed first voicing.
    speaking(
      "fr-m10-6-speak-tuaimesleschiens",
      "tu aimes les chiens ?",
      "do you like dogs?",
      [],
    ),
  ];
}

/** L7 — zero new: consolidation + the third liaison item. */
function lesson7(): LessonStep[] {
  return [
    listeningBuildSentence({
      id: "fr-m10-7-lbuild-jaimeleschats",
      target: "j'aime les chats",
      tiles: ["j'aime", "les", "chats", "le"],
      correctOrder: ["j'aime", "les", "chats"],
      promptEn: "Build what you hear",
    }),
    // The dog side, from memory (voiced L2).
    speaking(
      "fr-m10-7-speak-jaimeleschiens-recall",
      "j'aime les chiens",
      "I like dogs",
      [],
      "recall",
    ),
    liaisonListen({
      id: "fr-m10-7-liaison-3",
      words: ["les", "écoles", "et", "les", "hôtels"],
      linkedJunctions: [0, 3],
      meaningEn: "the schools and the hotels",
      audioText: "les écoles et les hôtels",
      junctionNotes: {
        0: "z into écoles — the vowel invites it.",
        1: "No link into «et».",
        2: "«et» never links.",
        3: "z through the silent h of hôtels.",
      },
      explanation:
        "Two z's this time — both vowels claimed theirs; «et» stayed out of it, as always.",
    }),
    listeningCompSentence({
      id: "fr-m10-7-lc-leshotels",
      audioText: "les hôtels",
      correctMeaningEn: "The hotels.",
      distractorsEn: ["The hotel.", "The schools.", "The dogs."],
    }),
    cloze(
      "fr-m10-7-cloze-des",
      "il y a",
      "livres ici",
      "des",
      ["des", "les"],
      "there are (some) books here",
      "il y a des livres ici",
      "A shelf of SOME — «des». The whole world's books would be «les».",
    ),
    {
      // TAIL: m6 by ear.
      id: "fr-m10-7-hear-sandwich",
      type: "word_image_mcq",
      meaningEn: "le sandwich",
      options: [
        { id: "correct", word: "le sandwich", emoji: "🥪" },
        { id: "o1", word: "le croissant", emoji: "🥐" },
        { id: "o2", word: "le fromage", emoji: "🧀" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the two cats, from memory (voiced L3).
    speaking("fr-m10-7-speak-deuxchats-recall", "j'ai deux chats", "I have two cats", [], "recall"),
    cloze(
      "fr-m10-7-cloze-le",
      "",
      "chien",
      "le",
      ["le", "les"],
      "the dog (just one)",
      "le chien",
      "One dog, no -s — «le», luh.",
    ),
    {
      id: "fr-m10-7-sim-ines",
      type: "dialogue_sim",
      scene: {
        emoji: "🐱",
        title: "Inès found a poster",
        setting: "LE REFUGE, it says. Pictures of cats.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-refuge",
          npc: {
            speaker: "Inès",
            kana: "Il y a des chats ici ?",
            audioText: "il y a des chats ici ?",
            gloss: "There are cats here?",
          },
          goal: "There are — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "oui", text: "il y a des chats ici" },
              { id: "pasde", text: "il n'y a pas de chat" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "oui",
            audioText: "il y a des chats ici",
          },
          replyGloss: "There are cats here.",
          explanation:
            "A shelter full of «des chats» — remember this poster. You'll be back.",
        },
      ],
    },
    listeningCompSentence({
      // TAIL: m9 lane.
      id: "fr-m10-7-lc-pizzabonne",
      audioText: "la pizza est très bonne",
      correctMeaningEn: "The pizza is very good.",
      distractorsEn: ["The cake is very good.", "The pizza is small.", "I like pizza."],
    }),
    {
      id: "fr-m10-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-livres", source: "livres", target: "books" },
        { id: "p-croissants", source: "croissants", target: "croissants" },
        { id: "p-ecole", source: "école", target: "school" },
        { id: "p-croissant", source: "croissant", target: "croissant" },
        { id: "p-tres", source: "très", target: "very" },
        { id: "p-cinq", source: "cinq", target: "five" },
      ],
    },
    // WIN: the shelf, out loud — printed first voicing.
    speaking(
      "fr-m10-7-speak-deslivres",
      "il y a des livres ici",
      "there are books here",
      [],
    ),
  ];
}

/** L8 — CHECKPOINT (zero new, graded only, LIAISON-FREE by ruling):
 *  le/les by vowel, les/des by frame, counts produced. */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m10-8-lc-leschats",
      audioText: "les chats",
      correctMeaningEn: "The cats.",
      distractorsEn: ["The cat.", "The dogs.", "Some cats."],
    }),
    cloze(
      "fr-m10-8-cloze-les",
      "j'aime",
      "chats",
      "les",
      ["les", "le"],
      "I like cats",
      "j'aime les chats",
      "The species whole — «les».",
    ),
    speaking("fr-m10-8-speak-jaimeleschats-recall", "j'aime les chats", "I like cats", [], "recall"),
    vocabTextMcq("fr-m10-8-mc-des", "des", ["les", "deux", "un"]),
    build(
      "fr-m10-8-build-fullorder",
      "Build: 'I'd like two croissants, please'",
      "je voudrais deux croissants s'il vous plaît",
      ["je voudrais", "deux", "croissants", "s'il vous plaît", "croissant"],
      ["je voudrais", "deux", "croissants", "s'il vous plaît"],
    ),
    listeningCompSentence({
      id: "fr-m10-8-lc-lechat",
      audioText: "le chat",
      correctMeaningEn: "The cat (just one).",
      distractorsEn: ["The cats.", "The dog.", "Some cats."],
    }),
    cloze(
      "fr-m10-8-cloze-des",
      "il y a",
      "chiens ici",
      "des",
      ["des", "les"],
      "there are (some) dogs here",
      "il y a des chiens ici",
      "Existence deals in SOME — «des».",
    ),
    speaking("fr-m10-8-speak-leshotels-recall", "les hôtels", "the hotels", [], "recall"),
    listeningCompSentence({
      id: "fr-m10-8-lc-leslivres",
      audioText: "j'aime les livres",
      correctMeaningEn: "I like books.",
      distractorsEn: ["I like the book.", "There are books here.", "I would like a book."],
    }),
    build(
      "fr-m10-8-build-deschats",
      "Build: 'there are cats here'",
      "il y a des chats ici",
      ["il y a", "des", "chats", "ici", "les"],
      ["il y a", "des", "chats", "ici"],
    ),
    cloze(
      "fr-m10-8-cloze-trois",
      "je voudrais",
      "croissants",
      "trois",
      ["trois", "deux"],
      "I would like THREE croissants",
      "je voudrais trois croissants",
      "«trois» — the -s stretches silently to fit.",
    ),
    listeningCompSentence({
      id: "fr-m10-8-lc-leschiens",
      audioText: "les chiens",
      correctMeaningEn: "The dogs.",
      distractorsEn: ["The dog.", "The cats.", "Some dogs."],
    }),
    vocabTextMcq("fr-m10-8-mc-les", "les", ["des", "le", "la"]),
    speaking(
      "fr-m10-8-speak-deschats-recall",
      "il y a des chats ici",
      "there are cats here",
      [],
      "recall",
    ),
    {
      id: "fr-m10-8-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-les", source: "les", target: "the (plural)" },
        { id: "p-des", source: "des", target: "some (plural)" },
        { id: "p-chats", source: "chats", target: "cats" },
        { id: "p-croissants", source: "croissants", target: "croissants" },
        { id: "p-ecoles", source: "écoles", target: "schools" },
        { id: "p-deux", source: "deux", target: "two" },
      ],
    },
  ];
}

/** L9 — «La boulangerie»: plural shopping, and the poster that changes
 *  everything. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m10-9-sim-boulangerie",
      type: "dialogue_sim",
      scene: {
        emoji: "🥐",
        title: "La boulangerie",
        setting: "Warm bread air; Chloé eyeing a poster outside.",
      },
      exercisedAtomIds: [],
      explanation:
        "Two croissants, a cake, and a fateful poster — the plural machine, out shopping.",
      turns: [
        {
          id: "t1-order",
          npc: {
            speaker: "The madame",
            kana: "Vous désirez ?",
            audioText: "vous désirez ?",
            gloss: "What would you like?",
          },
          goal: "Two croissants — politely.",
          reply: {
            mode: "build",
            tiles: ["je voudrais", "deux", "croissants", "s'il vous plaît", "croissant"],
            answer: "je voudrais deux croissants s'il vous plaît",
            alsoAccepted: [
              "je voudrais deux croissants",
              "deux croissants s'il vous plaît",
              "deux croissants",
            ],
            audioText: "je voudrais deux croissants s'il vous plaît",
          },
          replyGloss: "I'd like two croissants, please.",
        },
        {
          id: "t2-dessert",
          npc: {
            speaker: "The madame",
            kana: "Et un gâteau ? Une glace ?",
            audioText: "un gâteau ? une glace ?",
            gloss: "And a cake? An ice cream?",
          },
          goal: "A cake too — or pass.",
          reply: {
            mode: "choice",
            options: [
              { id: "gateau", text: "un gâteau s'il vous plaît" },
              { id: "nonmerci", text: "non merci" },
              { id: "addition", text: "l'addition s'il vous plaît" },
            ],
            correctOptionId: "gateau",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "un gâteau s'il vous plaît",
          },
          replyGloss: "A cake, please.",
        },
        {
          id: "t3-poster",
          npc: {
            speaker: "Chloé",
            kana: "Il y a des chats ici ?",
            audioText: "il y a des chats ici ?",
            gloss: "There are cats here? (the shelter poster)",
          },
          goal: "There are — and you love cats.",
          reply: {
            mode: "choice",
            options: [
              { id: "oui", text: "oui j'aime les chats" },
              { id: "tuaimes", text: "oui tu aimes les chats" },
              { id: "pasde", text: "il n'y a pas de chat" },
            ],
            correctOptionId: "oui",
            audioText: "oui j'aime les chats",
          },
          replyGloss: "Yes — I love cats.",
        },
        {
          id: "t4-onyva",
          npc: {
            speaker: "Chloé",
            kana: "On y va ?",
            audioText: "on y va ?",
            gloss: "Shall we go? (the y is next module's story)",
          },
          goal: "Deal — cats await.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "quand", text: "c'est quand ?" },
              { id: "pardon", text: "pardon" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
      ],
    },
    build(
      "fr-m10-9-build-jaimeleschats",
      "Build: 'I like cats'",
      "j'aime les chats",
      ["j'aime", "les", "chats", "le"],
      ["j'aime", "les", "chats"],
    ),
    listeningCompSentence({
      id: "fr-m10-9-lc-troiscroissants",
      audioText: "je voudrais trois croissants",
      correctMeaningEn: "I would like three croissants.",
      distractorsEn: [
        "I would like two croissants.",
        "Three croissants and a cake.",
        "I like croissants.",
      ],
    }),
    // The question, from memory (voiced L6).
    speaking(
      "fr-m10-9-speak-tuaimesleschats-recall",
      "tu aimes les chats ?",
      "do you like cats?",
      [],
      "recall",
    ),
    cloze(
      "fr-m10-9-cloze-les",
      "tu aimes",
      "chiens ?",
      "les",
      ["les", "des"],
      "do you like dogs?",
      "tu aimes les chiens ?",
      "«aimer» takes «les» — the whole kind, every time.",
    ),
    {
      // TAIL: m6 by ear.
      id: "fr-m10-9-hear-gateau",
      type: "word_image_mcq",
      meaningEn: "le gâteau",
      options: [
        { id: "correct", word: "le gâteau", emoji: "🍰" },
        { id: "o1", word: "le croissant", emoji: "🥐" },
        { id: "o2", word: "la salade", emoji: "🥗" },
      ],
      correctOptionId: "correct",
    },
    listeningBuildSentence({
      id: "fr-m10-9-lbuild-deschiens",
      target: "il y a des chiens ici",
      tiles: ["il y a", "des", "chiens", "ici", "les"],
      correctOrder: ["il y a", "des", "chiens", "ici"],
      promptEn: "Build what you hear",
    }),
    listeningCompSentence({
      id: "fr-m10-9-lc-lesecoles",
      audioText: "les écoles",
      correctMeaningEn: "The schools.",
      distractorsEn: ["The school.", "The hotels.", "The books."],
    }),
    {
      id: "fr-m10-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-gateau", source: "gâteau", target: "cake" },
        { id: "p-croissants", source: "croissants", target: "croissants" },
        { id: "p-chiens", source: "chiens", target: "dogs" },
        { id: "p-les", source: "les", target: "the (plural)" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-six", source: "six", target: "six" },
      ],
    },
    // WIN: both herds, once more with feeling — from memory.
    speaking(
      "fr-m10-9-speak-both-recall",
      "les chats et les chiens",
      "the cats and the dogs",
      [],
      "recall",
    ),
  ];
}

/** L10 — Mastery. Graded only; every item; ends at «Le refuge» — the
 *  run closes with an adoption. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m10-10-lc-jaimeleschiens",
      audioText: "j'aime les chiens",
      correctMeaningEn: "I like dogs.",
      distractorsEn: ["I like cats.", "I like the dog.", "Do you like dogs?"],
    }),
    build(
      "fr-m10-10-build-deslivres",
      "Build: 'there are books here'",
      "il y a des livres ici",
      ["il y a", "des", "livres", "ici", "les"],
      ["il y a", "des", "livres", "ici"],
    ),
    cloze(
      "fr-m10-10-cloze-les",
      "",
      "chats",
      "les",
      ["les", "le"],
      "the cats",
      "les chats",
      "Plural spelling, plural article — «les», lay.",
    ),
    speaking("fr-m10-10-speak-leshotels-recall", "les hôtels", "the hotels", [], "recall"),
    vocabTextMcq("fr-m10-10-mc-des", "des", ["les", "un", "une"]),
    listeningCompSentence({
      id: "fr-m10-10-lc-tuaimesleschiens",
      audioText: "tu aimes les chiens ?",
      correctMeaningEn: "Do you like dogs?",
      distractorsEn: ["Do you like cats?", "I like dogs.", "Do you have dogs?"],
    }),
    cloze(
      "fr-m10-10-cloze-deux",
      "j'ai",
      "chats",
      "deux",
      ["deux", "trois"],
      "I have TWO cats",
      "j'ai deux chats",
      "Two, counted out loud — the -s stays silent.",
    ),
    build(
      "fr-m10-10-build-jaimeleslivres",
      "Build: 'I like books'",
      "j'aime les livres",
      ["j'aime", "les", "livres", "livre", "des"],
      ["j'aime", "les", "livres"],
    ),
    listeningCompSentence({
      id: "fr-m10-10-lc-deschats",
      audioText: "il y a des chats ici",
      correctMeaningEn: "There are cats here.",
      distractorsEn: ["There are dogs here.", "The cats are here.", "There's a cat here."],
    }),
    speaking(
      "fr-m10-10-speak-fullorder-recall",
      "je voudrais deux croissants s'il vous plaît",
      "I'd like two croissants, please",
      [],
      "recall",
    ),
    cloze(
      "fr-m10-10-cloze-lesecoles",
      "",
      "écoles",
      "les",
      ["les", "l'"],
      "the schools",
      "les écoles",
      "«l'» squeezes one school; «les» opens them all.",
    ),
    {
      id: "fr-m10-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-les", source: "les", target: "the (plural)" },
        { id: "p-des", source: "des", target: "some (plural)" },
        { id: "p-chats", source: "chats", target: "cats" },
        { id: "p-chiens", source: "chiens", target: "dogs" },
        { id: "p-livres", source: "livres", target: "books" },
        { id: "p-croissants", source: "croissants", target: "croissants" },
      ],
    },
    {
      // THE RUN ENDS AT LE REFUGE — with an adoption.
      id: "fr-m10-10-sim-refuge",
      type: "dialogue_sim",
      scene: {
        emoji: "🐱",
        title: "Le refuge",
        setting: "Rows of cats. Chloé is already lost to them.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module — and the run: ten modules, one silent -s, and a cat. Module 11 is «La machine à verbes»; the lane pauses here for Spencer's walk before the verb machine starts.",
      turns: [
        {
          id: "t1-vous",
          npc: {
            speaker: "The volunteer",
            kana: "Vous aimez les chats ?",
            audioText: "vous aimez les chats ?",
            gloss: "Do you like cats? (the polite vous-form — module 11 makes it yours)",
          },
          goal: "You love them — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "jaime", text: "j'aime les chats" },
              { id: "tuaimes", text: "tu aimes les chats" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "jaime",
            audioText: "j'aime les chats",
          },
          replyGloss: "I love cats.",
        },
        {
          id: "t2-lesquels",
          npc: {
            speaker: "The volunteer",
            kana: "Il y a des chats et des chiens.",
            audioText: "il y a des chats et des chiens",
            gloss: "There are cats and dogs.",
          },
          goal: "Cats — you came for cats.",
          reply: {
            mode: "choice",
            options: [
              { id: "chats", text: "les chats s'il vous plaît" },
              { id: "chiens", text: "les chiens s'il vous plaît" },
              { id: "addition", text: "l'addition s'il vous plaît" },
            ],
            correctOptionId: "chats",
            audioText: "les chats s'il vous plaît",
          },
          replyGloss: "The cats, please.",
        },
        {
          id: "t3-petit",
          npc: {
            speaker: "Chloé",
            kana: "Il est très petit !",
            audioText: "il est très petit !",
            gloss: "He's so little! (the one in the corner)",
          },
          goal: "He's yours now — claim him.",
          reply: {
            mode: "choice",
            options: [
              { id: "mien", text: "c'est mon petit chat" },
              { id: "mienne", text: "c'est ma petite chat" },
              { id: "grand", text: "il est très grand" },
            ],
            correctOptionId: "mien",
            audioText: "c'est mon petit chat",
          },
          replyGloss: "That's my little cat.",
          explanation:
            "Adopted, agreed, and correctly dressed — «mon petit chat», for real this time.",
        },
        {
          id: "t4-bye",
          npc: {
            speaker: "Chloé",
            kana: "Bonne nuit ! À demain.",
            audioText: "à demain",
            gloss: "Good night! See you tomorrow — both of you.",
          },
          goal: "Send her off.",
          reply: {
            mode: "choice",
            options: [
              { id: "bonnenuit", text: "bonne nuit" },
              { id: "abientot", text: "à bientôt" },
              { id: "quand", text: "c'est quand ?" },
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

const FR_M10_1: LessonContent = {
  id: "fr-m10-1",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The plural door",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M10_2: LessonContent = {
  id: "fr-m10-2",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Liking, at last, in plural",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M10_3: LessonContent = {
  id: "fr-m10-3",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Some, and how many",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M10_4: LessonContent = {
  id: "fr-m10-4",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Order by the handful",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M10_5: LessonContent = {
  id: "fr-m10-5",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The sound between words",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M10_6: LessonContent = {
  id: "fr-m10-6",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The eternal question",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M10_7: LessonContent = {
  id: "fr-m10-7",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Junctions, from memory",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M10_8: LessonContent = {
  id: "fr-m10-8",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for the bakery",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M10_9: LessonContent = {
  id: "fr-m10-9",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La boulangerie",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M10_10: LessonContent = {
  id: "fr-m10-10",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — then adopt the cat",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M10_MODULE: FrModuleDef = {
  title: "Les — the plural door",
  eyebrow: "Module 10",
  summary:
    "The -s is silent; «les» does the talking. Like whole species («j'aime les chats»), count your orders («deux croissants») — and hear the hidden z of «les écoles».",
  lessons: [
    FR_M10_1,
    FR_M10_2,
    FR_M10_3,
    FR_M10_4,
    FR_M10_5,
    FR_M10_6,
    FR_M10_7,
    FR_M10_8,
    FR_M10_9,
    FR_M10_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M10_CHECKPOINT_INDEX = 8;

export const FR_M10_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m10-s",
    moduleId: "m10",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m10-s",
        prompt: "Complete: «J'aime ___ chats.»",
        correctText: "les",
        distractorsText: ["des", "le", "un"],
      }),
  },
  {
    id: "pt-fr-m10-1",
    moduleId: "m10",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m10-1",
        prompt: "'There are (some) dogs here' — pick the French.",
        correctText: "il y a des chiens ici",
        distractorsText: [
          "il y a les chiens ici",
          "il y a un chiens ici",
          "il n'y a pas de chiens",
        ],
      }),
  },
  {
    id: "pt-fr-m10-2",
    moduleId: "m10",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m10-2",
        prompt: "'I'd like two croissants' — pick the French.",
        correctText: "je voudrais deux croissants",
        distractorsText: [
          "je voudrais deux croissant",
          "je voudrais des croissant",
          "j'aime deux croissants",
        ],
      }),
  },
  {
    id: "pt-fr-m10-3",
    moduleId: "m10",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m10-3",
        prompt: "You HEAR a hidden z in one of these. Which?",
        correctText: "les écoles",
        distractorsText: ["les chats", "les chiens", "les livres"],
      }),
  },
  {
    id: "pt-fr-m10-4",
    moduleId: "m10",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m10-4",
        prompt: "Complete: «Il y a ___ livres ici.» (some)",
        correctText: "des",
        distractorsText: ["les", "deux", "le"],
      }),
  },
];
