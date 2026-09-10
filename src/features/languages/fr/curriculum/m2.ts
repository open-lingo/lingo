/**
 * m2.ts — Présentations — the §13-doctrine hand-authored module.
 *
 * PROMOTED 2026-08-21 from `features/lesson/dev/frM2Lessons.ts` after the
 * learner-sim pass and Spencer's walks. Mirrors the ES m2 spine: the «Ça
 * va ?» rescue kit, names, je suis/tu es, il/elle, origins, and the
 * étudiant/étudiante ear drill ("the -e wakes the t up"); the checkpoint
 * ends on a two-turn stranger sim; L9 is the café; L10 is mastery.
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


export const FR_M2_ATOMS: FrAtom[] = [
  atom({ surface: "bien", meaningEn: "well / fine", partOfSpeech: "other", fromModule: "m2", kind: "vocab", emoji: "👍", hint: "byan — nasal ending" }),
  atom({ surface: "et toi ?", meaningEn: "and you?", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "ay TWA — bounces any question back" }),
  atom({ surface: "je m'appelle", meaningEn: "my name is", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "zhuh ma-PELL — literally 'I call myself'" }),
  atom({ surface: "tu t'appelles", meaningEn: "your name is", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "tu ta-PELL — the -s is silent; the t' belongs to YOU" }),
  atom({ surface: "comment", meaningEn: "how / what", partOfSpeech: "other", fromModule: "m2", kind: "vocab", hint: "ko-MAHN — nasal, the t is silent" }),
  atom({ surface: "monsieur", meaningEn: "sir / Mr.", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "m", emoji: "👨", hint: "muh-SYUH — nothing sounds the way it looks" }),
  atom({ surface: "madame", meaningEn: "ma'am / Mrs.", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "f", emoji: "👩", hint: "ma-DAM" }),
  atom({ surface: "je ne comprends pas", meaningEn: "I don't understand", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", emoji: "🤷", hint: "zhuh nuh kom-PRAHN pah — the escape phrase" }),
  atom({ surface: "je", meaningEn: "I", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "zhuh" }),
  atom({ surface: "tu", meaningEn: "you (informal)", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "the French u — say ee with rounded lips" }),
  atom({ surface: "suis", meaningEn: "am", partOfSpeech: "verb", fromModule: "m2", kind: "vocab", hint: "swee — the s's are silent" }),
  atom({ surface: "es", meaningEn: "are (you)", partOfSpeech: "verb", fromModule: "m2", kind: "vocab", hint: "ay" }),
  atom({ surface: "il", meaningEn: "he", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "eel" }),
  atom({ surface: "elle", meaningEn: "she", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "ell" }),
  atom({ surface: "est", meaningEn: "is", partOfSpeech: "verb", fromModule: "m2", kind: "vocab", hint: "ay — same sound as «es»; the letters differ, the ear cannot tell" }),
  atom({ surface: "de", meaningEn: "of / from", partOfSpeech: "particle", fromModule: "m2", kind: "particle", hint: "duh" }),
  atom({ surface: "d'où", meaningEn: "from where", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "doo — de + où squeezed into one word" }),
  atom({ surface: "étudiant", meaningEn: "student (m)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "m", emoji: "🎓", hint: "ay-tu-DYAHN — the t sleeps" }),
  atom({ surface: "étudiante", meaningEn: "student (f)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "f", emoji: "👩‍🎓", hint: "ay-tu-DYAHNT — the -e wakes the t up" }),
];

/** m2 L1 — Keep the conversation going: «Ça va ?» gets a real answer,
 *  and «et toi ?» bounces it back. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m2v2-1-info-kit",
      "Keep the conversation going",
      "Module 1 gave you «Ça va ?» — now own the answer: «ça va bien» — it's going well. And bounce it back: «et toi ?» — and you? (ay TWA).",
      "grammar",
    ),
    {
      id: "fr-m2v2-1-sim-cavabien",
      type: "dialogue_sim",
      scene: { emoji: "👋", title: "Léa spots you", setting: "Day one of week two." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cava",
          npc: {
            speaker: "Léa",
            kana: "Salut ! Ça va ?",
            audioText: "ça va",
            gloss: "Hi! How's it going?",
          },
          goal: "Answer her — fully this time.",
          reply: {
            mode: "choice",
            options: [
              { id: "cavabien", text: "ça va bien" },
              { id: "nonmerci", text: "non merci" },
              { id: "aurevoir", text: "au revoir" },
            ],
            correctOptionId: "cavabien",
            audioText: "ça va bien",
          },
          replyGloss: "It's going well.",
          explanation:
            "«bien» — well. «ça va bien» is the full answer; plain «ça va» still works when you're in a hurry.",
        },
      ],
    },
    speaking("fr-m2v2-1-speak-cavabien", "ça va bien", "it's going well", []),
    {
      id: "fr-m2v2-1-map-cavabien",
      type: "word_map",
      tokens: ["ça va", "bien"],
      pairs: [
        { en: "it's going", tokenIndex: 0 },
        { en: "well", tokenIndex: 1 },
      ],
      audioText: "ça va bien",
      revealNote:
        "«ça va» you already owned — «bien» upgrades it. byan: one smooth nasal.",
    },
    listeningCompSentence({
      id: "fr-m2v2-1-lc-cavabien",
      audioText: "ça va bien",
      correctMeaningEn: "It's going well.",
      distractorsEn: ["No, thank you.", "Yes, please.", "Good evening."],
    }),
    {
      id: "fr-m2v2-1-sim-ettoi",
      type: "dialogue_sim",
      scene: { emoji: "💬", title: "Hugo checks in" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ettoi",
          npc: {
            speaker: "Hugo",
            kana: "Ça va ?",
            audioText: "ça va",
            gloss: "How's it going?",
          },
          goal: "Answer — and ask him back.",
          reply: {
            mode: "choice",
            options: [
              { id: "full", text: "ça va bien et toi ?" },
              { id: "bien", text: "ça va bien" },
              { id: "ouisvp", text: "oui s'il vous plaît" },
            ],
            correctOptionId: "full",
            alsoCorrectOptionIds: ["bien"],
            audioText: "ça va bien et toi ?",
          },
          replyGloss: "Fine — and you?",
          explanation:
            "«et toi ?» — and you? Your m1 «et» plus one small word, and the conversation bounces back instead of dying.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m2v2-1-lc-ettoi",
      audioText: "et toi ?",
      correctMeaningEn: "And you?",
      distractorsEn: ["And him?", "You are.", "My name is…"],
    }),
    {
      // TAIL: m1 lane, by ear.
      id: "fr-m2v2-1-hear-salut",
      type: "word_image_mcq",
      meaningEn: "salut",
      options: [
        { id: "correct", word: "salut", emoji: "👋" },
        { id: "o1", word: "bonjour", emoji: "🙋" },
        { id: "o2", word: "au revoir", emoji: "🚪" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m2v2-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-cava", source: "ça va", target: "how's it going?" },
        { id: "p-bien", source: "bien", target: "well" },
        { id: "p-ettoi", source: "et toi ?", target: "and you?" },
        { id: "p-merci", source: "merci", target: "thank you" },
        { id: "p-bonjour", source: "bonjour", target: "hello" },
        { id: "p-aurevoir", source: "au revoir", target: "goodbye" },
      ],
    },
    // WIN: the full check-in, out loud — printed first voicing.
    speaking(
      "fr-m2v2-1-speak-full",
      "ça va bien et toi ?",
      "fine — and you?",
      [],
    ),
  ];
}

/** m2 L2 — Say your name. je m'appelle / comment tu t'appelles ? */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m2v2-2-info-names",
      "Say your name",
      "«je m'appelle …» — my name is … (zhuh ma-PELL; literally 'I call myself'). The question: «Comment tu t'appelles ?» — what's your name? — ko-MAHN tu ta-PELL, the t of comment silent.",
      "grammar",
    ),
    {
      id: "fr-m2v2-2-map-jemappelle",
      type: "word_map",
      tokens: ["je m'appelle", "Léa"],
      pairs: [
        { en: "my name is", tokenIndex: 0 },
        { en: "Léa", tokenIndex: 1 },
      ],
      audioText: "je m'appelle Léa",
      revealNote:
        "«je m'appelle» works as one piece — drop any name in after it.",
    },
    listeningCompSentence({
      id: "fr-m2v2-2-lc-jemappellehugo",
      audioText: "je m'appelle Hugo",
      correctMeaningEn: "My name is Hugo.",
      distractorsEn: ["How are you, Hugo?", "Nice to meet you.", "I'm from Paris."],
    }),
    speaking("fr-m2v2-2-speak-jemappelle", "je m'appelle", "my name is…", []),
    {
      id: "fr-m2v2-2-sim-tappelles",
      type: "dialogue_sim",
      scene: { emoji: "🪑", title: "Emma again", setting: "She remembers you from the park." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tappelles",
          npc: {
            speaker: "Emma",
            kana: "Salut ! Comment tu t'appelles ?",
            audioText: "comment tu t'appelles ?",
            gloss: "Hi! What's your name?",
          },
          goal: "Tell her your name.",
          reply: {
            mode: "choice",
            options: [
              { id: "jemappelle", text: "je m'appelle Sam" },
              // The trap is the lesson's own contrast: «tu t'appelles»
              // is HER form, not yours.
              { id: "tappelles", text: "tu t'appelles Sam" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "jemappelle",
            audioText: "je m'appelle Sam",
          },
          replyGloss: "My name is Sam.",
          explanation:
            "«je m'appelle» — I call MYSELF. Echoing her «tu t'appelles» back would say 'you call yourself Sam'.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m2v2-2-lc-tappelles",
      audioText: "comment tu t'appelles ?",
      correctMeaningEn: "What's your name?",
      distractorsEn: ["How's it going?", "Where are you from?", "Good evening."],
    }),
    build(
      "fr-m2v2-2-build-jemappelle",
      "Build: 'my name is Léa'",
      "je m'appelle Léa",
      ["je", "m'appelle", "Léa", "tu", "t'appelles"],
      ["je", "m'appelle", "Léa"],
    ),
    // TAIL: yesterday's kit, from memory.
    speaking(
      "fr-m2v2-2-speak-cavabien-recall",
      "ça va bien",
      "it's going well",
      [],
      "recall",
    ),
    build(
      // Production for the QUESTION — the retention walk could answer
      // every question and ask none of them.
      "fr-m2v2-2-build-tappelles",
      "Build: 'what's your name?'",
      "comment tu t'appelles ?",
      ["comment", "tu", "t'appelles ?", "je", "m'appelle"],
      ["comment", "tu", "t'appelles ?"],
    ),
    {
      // TAIL: m1 meeting lane — it belongs in the names lesson.
      id: "fr-m2v2-2-hear-enchante",
      type: "word_image_mcq",
      meaningEn: "enchanté",
      options: [
        { id: "correct", word: "enchanté", emoji: "🤝" },
        { id: "o1", word: "à bientôt", emoji: "🔜" },
        { id: "o2", word: "s'il vous plaît", emoji: "🤲" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m2v2-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jemappelle", source: "je m'appelle", target: "my name is" },
        { id: "p-tappelles", source: "comment tu t'appelles ?", target: "what's your name?" },
        { id: "p-enchante", source: "enchanté", target: "nice to meet you" },
        { id: "p-pardon", source: "pardon", target: "sorry" },
        { id: "p-oui", source: "oui", target: "yes" },
        { id: "p-non", source: "non", target: "no" },
      ],
    },
    // WIN: now YOU can ask — printed first voicing.
    speaking(
      "fr-m2v2-2-speak-tappelles",
      "comment tu t'appelles ?",
      "what's your name?",
      [],
    ),
  ];
}

/** m2 L3 — The escape phrase, and two titles. An incomprehensible line
 *  IS the cue (§13.6) — and the payoff sim proves the phrase works. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m2v2-3-info-escape",
      "The escape phrase",
      "When a sentence flies past you: «je ne comprends pas» — I don't understand (zhuh nuh kom-prahn PAH). It keeps conversations alive — people slow down. Also two titles: «monsieur» (sir, muh-SYUH) and «madame» (ma'am).",
      "grammar",
    ),
    {
      id: "fr-m2v2-3-sim-comprends",
      type: "dialogue_sim",
      scene: { emoji: "🌀", title: "Hugo, at full speed" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-fast",
          npc: {
            speaker: "Hugo",
            kana: "Quelle heure est-il ?",
            audioText: "quelle heure est-il ?",
            gloss: "…something quick you didn't catch.",
          },
          goal: "Be honest.",
          reply: {
            mode: "choice",
            options: [
              { id: "comprends", text: "je ne comprends pas" },
              { id: "ouisvp", text: "oui s'il vous plaît" },
              { id: "cavabien", text: "ça va bien" },
            ],
            correctOptionId: "comprends",
            audioText: "je ne comprends pas",
          },
          replyGloss: "I don't understand.",
          explanation:
            "«je ne comprends pas» — I don't understand. It turns panic into a request. (He asked the time — that's coming in a later module.)",
        },
      ],
    },
    speaking(
      "fr-m2v2-3-speak-comprends",
      "je ne comprends pas",
      "I don't understand",
      [],
    ),
    build(
      // The flagship phrase gets a BUILD before anything asks for it
      // cold (retention walk B1: recognize-only = the useless half).
      "fr-m2v2-3-build-comprends",
      "Build: 'I don't understand'",
      "je ne comprends pas",
      ["je", "ne", "comprends", "pas", "oui"],
      ["je", "ne", "comprends", "pas"],
    ),
    {
      id: "fr-m2v2-3-img-monsieur",
      type: "word_image_mcq",
      meaningEn: "sir / Mr.",
      options: [
        { id: "correct", word: "monsieur", emoji: "👨" },
        { id: "o1", word: "madame", emoji: "👩" },
        { id: "o2", word: "bonjour", emoji: "🙋" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m2v2-3-map-bonjourmonsieur",
      type: "word_map",
      tokens: ["bonjour", "monsieur"],
      pairs: [
        { en: "hello", tokenIndex: 0 },
        { en: "sir", tokenIndex: 1 },
      ],
      audioText: "bonjour monsieur",
      tokenGenders: { 1: "m" },
      revealNote:
        "Add the title and the greeting turns properly polite: «bonjour monsieur». France runs on this. (The blue m again — «monsieur» is a blue-family word, like the pink f on «bonne nuit».)",
    },
    // «monsieur»/«madame» were receptive-only for the whole module — caught
    // by the answer-position pin (ported from ES, 2026-09-06). Printed
    // first voicings; the same fix «señor» got in ES m2.
    speaking("fr-m2v2-3-speak-bonjourmonsieur", "bonjour monsieur", "hello, sir", ["monsieur"]),
    {
      id: "fr-m2v2-3-img-madame",
      type: "word_image_mcq",
      meaningEn: "ma'am / Mrs.",
      options: [
        { id: "correct", word: "madame", emoji: "👩" },
        { id: "o1", word: "monsieur", emoji: "👨" },
        { id: "o2", word: "au revoir", emoji: "🚪" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m2v2-3-speak-bonjourmadame", "bonjour madame", "hello, ma'am", ["madame"]),
    listeningCompSentence({
      id: "fr-m2v2-3-lc-madame",
      audioText: "bonjour madame",
      correctMeaningEn: "Hello, ma'am.",
      distractorsEn: ["Hello, sir.", "Good night, ma'am.", "Thank you, ma'am."],
    }),
    // TAIL: names lane, from memory.
    speaking(
      "fr-m2v2-3-speak-tappelles-recall",
      "comment tu t'appelles ?",
      "what's your name?",
      [],
      "recall",
    ),
    cloze(
      // TAIL: the m1 bon/bonne lane rides into m2 (spaced).
      "fr-m2v2-3-cloze-bonne",
      "bonne",
      "",
      "nuit",
      ["nuit", "soir"],
      "good night",
      "bonne nuit",
      "Still two words for night — and «soir» still belongs to bonsoir.",
    ),
    {
      id: "fr-m2v2-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-comprends", source: "je ne comprends pas", target: "I don't understand" },
        { id: "p-monsieur", source: "monsieur", target: "sir / Mr." },
        { id: "p-madame", source: "madame", target: "ma'am / Mrs." },
        { id: "p-cava", source: "ça va", target: "how's it going?" },
        { id: "p-bien", source: "bien", target: "well" },
        { id: "p-abientot", source: "à bientôt", target: "see you soon" },
      ],
    },
    {
      // THE PAYOFF (win): the phrase works — she slows down, you're in.
      id: "fr-m2v2-3-sim-payoff",
      type: "dialogue_sim",
      scene: { emoji: "🕰️", title: "A madame at the bus stop" },
      exercisedAtomIds: [],
      explanation:
        "That's the trick: «je ne comprends pas» doesn't end conversations — it makes people meet you halfway.",
      turns: [
        {
          id: "t1-fast",
          npc: {
            speaker: "The madame",
            kana: "Vous avez l'heure ?",
            audioText: "vous avez l'heure ?",
            gloss: "…something you didn't catch.",
          },
          goal: "You know what to do.",
          reply: {
            mode: "choice",
            options: [
              { id: "comprends", text: "je ne comprends pas" },
              { id: "jemappelle", text: "je m'appelle Hugo" },
              { id: "abientot", text: "à bientôt" },
            ],
            correctOptionId: "comprends",
            audioText: "je ne comprends pas",
          },
          replyGloss: "I don't understand.",
        },
        {
          id: "t2-slow",
          npc: {
            speaker: "The madame",
            kana: "Ça — va ?",
            audioText: "ça va",
            gloss: "How's — it — going? (slowly, kindly)",
          },
          goal: "NOW you understand. Answer her.",
          reply: {
            mode: "choice",
            options: [
              { id: "cavabien", text: "ça va bien" },
              { id: "comprends", text: "je ne comprends pas" },
              { id: "aurevoir", text: "au revoir" },
            ],
            correctOptionId: "cavabien",
            audioText: "ça va bien",
          },
          replyGloss: "It's going well.",
        },
      ],
    },
  ];
}

/** m2 L4 — I am, you are. French KEEPS its pronouns — the card says it
 *  once, the maps absorb it, the clozes alternate. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m2v2-4-info-etre",
      "I am, you are",
      "«je» = I, «tu» = you. «Je suis Léa» — I am Léa (zhuh SWEE). «Tu es Hugo» — you are Hugo (tu EH). The pronoun always comes along in French — «je suis», never just «suis».",
      "grammar",
    ),
    {
      id: "fr-m2v2-4-map-jesuislea",
      type: "word_map",
      tokens: ["je", "suis", "Léa"],
      pairs: [
        { en: "I", tokenIndex: 0 },
        { en: "am", tokenIndex: 1 },
        { en: "Léa", tokenIndex: 2 },
      ],
      audioText: "je suis Léa",
    },
    listeningCompSentence({
      id: "fr-m2v2-4-lc-jesuishugo",
      audioText: "je suis Hugo",
      correctMeaningEn: "I'm Hugo.",
      distractorsEn: ["You're Hugo.", "My name is Léa.", "He is Hugo."],
    }),
    cloze(
      "fr-m2v2-4-cloze-suis",
      "je",
      "Léa",
      "suis",
      ["suis", "es"],
      "I am Léa",
      "je suis Léa",
      "«je» goes with «suis» — the I-form.",
    ),
    {
      id: "fr-m2v2-4-sim-tues",
      type: "dialogue_sim",
      scene: { emoji: "❓", title: "Léa double-checks" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tues",
          npc: {
            speaker: "Léa",
            kana: "Tu es Sam ?",
            audioText: "tu es Sam ?",
            gloss: "Are you Sam?",
          },
          goal: "You are — confirm it.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouijesuis", text: "oui je suis Sam" },
              // Trap: her verb form, not yours.
              { id: "ouitues", text: "oui tu es Sam" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "ouijesuis",
            audioText: "oui je suis Sam",
          },
          replyGloss: "Yes, I'm Sam.",
          explanation:
            "She asks with «tu es», you answer with «je suis». The flip IS the grammar.",
        },
      ],
    },
    build(
      "fr-m2v2-4-build-jesuislea",
      "Build: 'I am Léa'",
      "je suis Léa",
      ["je", "suis", "Léa", "es", "tu"],
      ["je", "suis", "Léa"],
    ),
    cloze(
      "fr-m2v2-4-cloze-es",
      "tu",
      "Léa",
      "es",
      ["es", "suis"],
      "you are Léa",
      "tu es Léa",
      "«tu» goes with «es» — the you-form.",
    ),
    {
      // TAIL: yesterday's titles, by ear.
      id: "fr-m2v2-4-hear-madame",
      type: "word_image_mcq",
      meaningEn: "madame",
      options: [
        { id: "correct", word: "madame", emoji: "👩" },
        { id: "o1", word: "monsieur", emoji: "👨" },
        { id: "o2", word: "bonjour", emoji: "🙋" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: names lane, from memory.
    speaking(
      "fr-m2v2-4-speak-jemappelle-recall",
      "je m'appelle",
      "my name is…",
      [],
      "recall",
    ),
    {
      id: "fr-m2v2-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-je", source: "je", target: "I" },
        { id: "p-tu", source: "tu", target: "you" },
        { id: "p-suis", source: "suis", target: "am" },
        { id: "p-es", source: "es", target: "are" },
        { id: "p-svp", source: "s'il vous plaît", target: "please" },
        { id: "p-aurevoir", source: "au revoir", target: "goodbye" },
      ],
    },
    // WIN: claim an identity out loud — printed first voicing.
    speaking("fr-m2v2-4-speak-jesuislea", "je suis Léa", "I am Léa", []),
  ];
}

/** m2 L5 — He and she. il/elle carry the tints; «est» sounds like «es»
 *  (same sound, different spelling — noted, not drilled). */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m2v2-5-info-ilelle",
      "He and she",
      "«il» = he (eel), «elle» = she (ell). «est» = he/she is — it SOUNDS exactly like «es»; French spelling keeps score silently. And «étudiant» — student (ay-tu-DYAHN, that final t asleep).",
      "grammar",
    ),
    {
      id: "fr-m2v2-5-img-etudiant",
      type: "word_image_mcq",
      meaningEn: "student",
      options: [
        { id: "correct", word: "étudiant", emoji: "👨‍🎓" },
        { id: "o1", word: "monsieur", emoji: "👨" },
        { id: "o2", word: "madame", emoji: "👩" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m2v2-5-map-ilestetudiant",
      type: "word_map",
      tokens: ["il", "est", "étudiant"],
      pairs: [
        { en: "he", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "student", tokenIndex: 2 },
      ],
      audioText: "il est étudiant",
      // il and étudiant glow blue; est stays neutral — the contrast IS
      // the lesson (§13.4).
      tokenGenders: { 0: "m", 2: "m" },
      revealNote:
        "No 'a' needed: «il est étudiant» — French drops it for jobs and roles.",
    },
    listeningCompSentence({
      // ISOLATED ear beat first — eel vs ell on its own, before any
      // sentence-level trial asks for it (ease walk C6).
      id: "fr-m2v2-5-lc-il",
      audioText: "il",
      correctMeaningEn: "He",
      distractorsEn: ["She", "I", "You"],
    }),
    {
      id: "fr-m2v2-5-map-elleestlea",
      type: "word_map",
      tokens: ["elle", "est", "Léa"],
      pairs: [
        { en: "she", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "Léa", tokenIndex: 2 },
      ],
      audioText: "elle est Léa",
      tokenGenders: { 0: "f" },
    },
    speaking(
      "fr-m2v2-5-speak-ilestetudiant",
      "il est étudiant",
      "he is a student",
      [],
    ),
    cloze(
      "fr-m2v2-5-cloze-elle",
      "",
      "est Léa",
      "elle",
      ["elle", "il"],
      "SHE is Léa",
      "elle est Léa",
      "«elle» — she. «il» would make it 'he is Léa', which Léa disputes.",
    ),
    listeningCompSentence({
      // TAIL: the escape phrase, by ear, away from its source.
      id: "fr-m2v2-5-lc-comprends",
      audioText: "je ne comprends pas",
      correctMeaningEn: "I don't understand.",
      distractorsEn: ["I don't want it.", "I'm not from here.", "No, thank you."],
    }),
    // TAIL: being lane, from memory.
    speaking(
      "fr-m2v2-5-speak-jesuislea-recall",
      "je suis Léa",
      "I am Léa",
      [],
      "recall",
    ),
    {
      id: "fr-m2v2-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-il", source: "il", target: "he" },
        { id: "p-elle", source: "elle", target: "she" },
        { id: "p-est", source: "est", target: "he/she is" },
        { id: "p-etudiant", source: "étudiant", target: "student" },
        { id: "p-bien", source: "bien", target: "well" },
        { id: "p-madame", source: "madame", target: "ma'am / Mrs." },
      ],
    },
    {
      // WIN sim: third person on a real person.
      id: "fr-m2v2-5-sim-ilest",
      type: "dialogue_sim",
      scene: {
        emoji: "🎓",
        title: "Emma nods at Hugo",
        setting: "He's carrying a stack of books.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ilest",
          npc: {
            speaker: "Emma",
            kana: "Il est étudiant ?",
            audioText: "il est étudiant ?",
            gloss: "Is he a student?",
          },
          goal: "He is — confirm it.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouiilest", text: "oui il est étudiant" },
              // Trap: the I-form answers the wrong question about the
              // wrong person.
              { id: "ouijesuis", text: "oui je suis étudiant" },
              { id: "abientot", text: "à bientôt" },
            ],
            correctOptionId: "ouiilest",
            audioText: "oui il est étudiant",
          },
          replyGloss: "Yes, he's a student.",
          explanation:
            "«je ne comprends pas» was RIGHT there — but you DID understand. Progress.",
        },
      ],
    },
  ];
}

/** m2 L6 — Where are you from? Cities, not countries — bare «de», no
 *  article minefield. Landmarks are honest images. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m2v2-6-info-origine",
      "Where are you from?",
      "«Je suis de Paris» — I'm from Paris. «de» = from. The question, the way people actually say it: «Tu es d'où ?» — where are you from? (d'où = de + où, squeezed together: DOO).",
      "grammar",
    ),
    {
      id: "fr-m2v2-6-img-paris",
      type: "word_image_mcq",
      meaningEn: "Paris",
      options: [
        { id: "correct", word: "Paris", emoji: "🗼" },
        { id: "o1", word: "New York", emoji: "🗽" },
        { id: "o2", word: "Montréal", emoji: "🍁" },
      ],
      correctOptionId: "correct",
    },
    {
      // «de» debuts by elimination, prompted LAST (§13.3).
      id: "fr-m2v2-6-map-jesuisdeparis",
      type: "word_map",
      tokens: ["je", "suis", "de", "Paris"],
      pairs: [
        { en: "I", tokenIndex: 0 },
        { en: "am", tokenIndex: 1 },
        { en: "from", tokenIndex: 2 },
        { en: "Paris", tokenIndex: 3 },
      ],
      audioText: "je suis de Paris",
      revealNote:
        "«de» — from (and 'of'). The little words do the connecting; the s in Paris stays silent — pa-REE.",
    },
    {
      id: "fr-m2v2-6-img-newyork",
      type: "word_image_mcq",
      meaningEn: "New York",
      options: [
        { id: "correct", word: "New York", emoji: "🗽" },
        { id: "o1", word: "Paris", emoji: "🗼" },
        { id: "o2", word: "Montréal", emoji: "🍁" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      id: "fr-m2v2-6-lc-newyork",
      audioText: "je suis de New York",
      correctMeaningEn: "I'm from New York.",
      distractorsEn: ["I'm from Paris.", "I'm from Montreal.", "I'm a student."],
    }),
    speaking(
      "fr-m2v2-6-speak-jesuisdeparis",
      "je suis de Paris",
      "I'm from Paris",
      [],
    ),
    {
      id: "fr-m2v2-6-img-montreal",
      type: "word_image_mcq",
      meaningEn: "Montreal",
      options: [
        { id: "correct", word: "Montréal", emoji: "🍁" },
        { id: "o1", word: "Paris", emoji: "🗼" },
        { id: "o2", word: "New York", emoji: "🗽" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m2v2-6-sim-dou",
      type: "dialogue_sim",
      scene: { emoji: "🗺️", title: "Léa is curious" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-dou",
          npc: {
            speaker: "Léa",
            kana: "Tu es d'où ?",
            audioText: "tu es d'où ?",
            gloss: "Where are you from?",
          },
          goal: "Tell her.",
          reply: {
            mode: "build",
            tiles: ["je", "suis", "de", "New York", "m'appelle"],
            answer: "je suis de New York",
            audioText: "je suis de New York",
          },
          replyGloss: "I'm from New York.",
          explanation:
            "«tu es» in the question, «je suis» in the answer — the same flip, every time.",
        },
      ],
    },
    cloze(
      "fr-m2v2-6-cloze-dou",
      "tu es",
      "?",
      "d'où",
      ["d'où", "de", "ou", "et"],
      "where are you from?",
      "tu es d'où ?",
      "«d'où» — de + où squeezed into one sound: DOO. Bare «de» would leave the question half-built.",
    ),
    {
      // TAIL: people lane, by ear.
      id: "fr-m2v2-6-hear-etudiant",
      type: "word_image_mcq",
      meaningEn: "étudiant",
      options: [
        { id: "correct", word: "étudiant", emoji: "👨‍🎓" },
        { id: "o1", word: "monsieur", emoji: "👨" },
        { id: "o2", word: "madame", emoji: "👩" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m2v2-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-de", source: "de", target: "from" },
        { id: "p-paris", source: "Paris", target: "Paris" },
        { id: "p-ny", source: "New York", target: "New York" },
        { id: "p-mtl", source: "Montréal", target: "Montreal" },
        { id: "p-suis", source: "suis", target: "am" },
        { id: "p-dou", source: "tu es d'où ?", target: "where are you from?" },
      ],
    },
    // WIN: now YOU can ask — printed first voicing.
    speaking("fr-m2v2-6-speak-dou", "tu es d'où ?", "where are you from?", []),
  ];
}

/** m2 L7 — Il est étudiant, elle est étudiantE: the silent t WAKES UP.
 *  French gender you can HEAR — drilled by ear, tinted on the maps. */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m2v2-7-info-etudiante",
      "The letter that wakes up",
      "«étudiante» — a woman student. Here's the French secret: étudiant ends in a SILENT t (ay-tu-DYAHN), but the -e of «étudiante» wakes it up — ay-tu-DYAHNT. You can HEAR French gender — and it's the same blue-m / pink-f the chips have been wearing since «bonne nuit». «Il est étudiant. Elle est étudiante.»",
      "grammar",
    ),
    {
      id: "fr-m2v2-7-img-etudiante",
      type: "word_image_mcq",
      meaningEn: "student (woman)",
      options: [
        { id: "correct", word: "étudiante", emoji: "👩‍🎓" },
        { id: "o1", word: "étudiant", emoji: "👨‍🎓" },
        { id: "o2", word: "madame", emoji: "👩" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m2v2-7-map-elleestetudiante",
      type: "word_map",
      tokens: ["elle", "est", "étudiante"],
      pairs: [
        { en: "she", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "student", tokenIndex: 2 },
      ],
      audioText: "elle est étudiante",
      // The pink agreement chain — elle … étudiante; est stays neutral.
      tokenGenders: { 0: "f", 2: "f" },
    },
    listeningCompSentence({
      // EAR TRIAL: il + silent t vs elle + spoken t, in one sentence.
      id: "fr-m2v2-7-lc-ilest",
      audioText: "il est étudiant",
      correctMeaningEn: "He is a student.",
      distractorsEn: ["She is a student.", "I am a student.", "He is from Paris."],
    }),
    cloze(
      // Agreement trial #1 — answer étudiante, étudiant live.
      "fr-m2v2-7-cloze-etudiante",
      "elle est",
      "",
      "étudiante",
      ["étudiante", "étudiant"],
      "she is a student",
      "elle est étudiante",
      "«elle» pulls the -e form with it — and the t wakes up: DYAHNT.",
    ),
    speaking(
      "fr-m2v2-7-speak-elleest",
      "elle est étudiante",
      "she is a student",
      [],
    ),
    {
      // THE t-sound ear trial: DYAHN vs DYAHNT, nothing else to go on.
      id: "fr-m2v2-7-hear-etudiante",
      type: "word_image_mcq",
      meaningEn: "étudiante",
      options: [
        { id: "correct", word: "étudiante", emoji: "👩‍🎓" },
        { id: "o1", word: "étudiant", emoji: "👨‍🎓" },
        { id: "o2", word: "madame", emoji: "👩" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      // Trial #2 — answer étudiant (alternation, R5).
      "fr-m2v2-7-cloze-etudiant",
      "il est",
      "",
      "étudiant",
      ["étudiant", "étudiante"],
      "he is a student",
      "il est étudiant",
      "«il» keeps the t asleep: DYAHN. Blue chain, pink chain — never mixed.",
    ),
    listeningCompSentence({
      // TAIL: names lane, five lessons from its source.
      id: "fr-m2v2-7-lc-jemappelle",
      audioText: "je m'appelle Léa",
      correctMeaningEn: "My name is Léa.",
      distractorsEn: ["She is Léa.", "Are you Léa?", "How are you, Léa?"],
    }),
    // TAIL: origin lane, from memory.
    speaking(
      "fr-m2v2-7-speak-jesuisdeparis-recall",
      "je suis de Paris",
      "I'm from Paris",
      [],
      "recall",
    ),
    {
      id: "fr-m2v2-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-etudiant", source: "étudiant", target: "student (man)" },
        { id: "p-etudiante", source: "étudiante", target: "student (woman)" },
        { id: "p-il", source: "il", target: "he" },
        { id: "p-elle", source: "elle", target: "she" },
        { id: "p-monsieur", source: "monsieur", target: "sir / Mr." },
        { id: "p-paris", source: "Paris", target: "Paris" },
      ],
    },
    {
      // WIN sim: meet her — the m1 formula pays off.
      id: "fr-m2v2-7-sim-intro",
      type: "dialogue_sim",
      scene: {
        emoji: "🏫",
        title: "Hugo introduces someone",
        setting: "A woman with a stack of notes.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-intro",
          npc: {
            speaker: "Hugo",
            kana: "Elle est étudiante.",
            audioText: "elle est étudiante",
            gloss: "She's a student.",
          },
          goal: "Greet her — you know how.",
          reply: {
            mode: "choice",
            options: [
              { id: "enchante", text: "enchanté" },
              { id: "comprends", text: "je ne comprends pas" },
              { id: "aurevoir", text: "au revoir" },
            ],
            correctOptionId: "enchante",
            audioText: "enchanté",
          },
          replyGloss: "Nice to meet you.",
          explanation:
            "«enchanté» from module 1, doing exactly what it was built for.",
        },
      ],
    },
  ];
}

/** m2 CHECKPOINT — zero new, sixteen graded retrievals, every pair
 *  discriminated: suis/es, il/elle, étudiant/étudiante by EAR. */
function checkpointLesson(): LessonStep[] {
  return [
    {
      id: "fr-m2v2-r-hear-madame",
      type: "word_image_mcq",
      meaningEn: "madame",
      options: [
        { id: "correct", word: "madame", emoji: "👩" },
        { id: "o1", word: "monsieur", emoji: "👨" },
        { id: "o2", word: "étudiante", emoji: "👩‍🎓" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m2v2-r-cloze-es",
      "tu",
      "Léa",
      "es",
      ["es", "suis"],
      "you are Léa",
      "tu es Léa",
      "«tu» takes «es» — every time.",
    ),
    speaking(
      "fr-m2v2-r-speak-comprends",
      "je ne comprends pas",
      "I don't understand",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m2v2-r-lc-full",
      audioText: "ça va bien et toi ?",
      correctMeaningEn: "Fine — and you?",
      distractorsEn: ["My name is… and you?", "I don't understand.", "Yes please — and you?"],
    }),
    {
      id: "fr-m2v2-r-mc-etudiante",
      type: "multiple_choice",
      prompt: 'Which word means "student (woman)"?',
      options: [
        { id: "opt-0", text: "étudiant" },
        { id: "correct", text: "étudiante" },
        { id: "opt-2", text: "madame" },
        { id: "opt-3", text: "elle" },
      ],
      correctOptionId: "correct",
      optionsHideRomaji: true,
    },
    build(
      "fr-m2v2-r-build-paris",
      "Build: 'I'm from Paris'",
      "je suis de Paris",
      ["je", "suis", "de", "Paris", "m'appelle"],
      ["je", "suis", "de", "Paris"],
    ),
    listeningCompSentence({
      // il/elle by EAR inside a sentence.
      id: "fr-m2v2-r-lc-elleest",
      audioText: "elle est Léa",
      correctMeaningEn: "She is Léa.",
      distractorsEn: ["He is Léa.", "I am Léa.", "You are Léa."],
    }),
    speaking(
      "fr-m2v2-r-speak-dou",
      "tu es d'où ?",
      "where are you from?",
      [],
      "recall",
    ),
    cloze(
      "fr-m2v2-r-cloze-suis",
      "je",
      "Hugo",
      "suis",
      ["suis", "es"],
      "I am Hugo",
      "je suis Hugo",
      "«je» takes «suis».",
    ),
    listeningCompSentence({
      id: "fr-m2v2-r-lc-tappelles",
      audioText: "comment tu t'appelles ?",
      correctMeaningEn: "What's your name?",
      distractorsEn: ["How's it going?", "Where are you from?", "What time is it?"],
    }),
    build(
      "fr-m2v2-r-build-jemappelle",
      "Build: 'my name is Sam'",
      "je m'appelle Sam",
      ["je", "m'appelle", "Sam", "tu", "t'appelles"],
      ["je", "m'appelle", "Sam"],
    ),
    {
      id: "fr-m2v2-r-hear-paris",
      type: "word_image_mcq",
      meaningEn: "Paris",
      options: [
        { id: "correct", word: "Paris", emoji: "🗼" },
        { id: "o1", word: "New York", emoji: "🗽" },
        { id: "o2", word: "Montréal", emoji: "🍁" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m2v2-r-mc-monsieur",
      type: "multiple_choice",
      prompt: 'Which word means "sir / Mr."?',
      options: [
        { id: "correct", text: "monsieur" },
        { id: "opt-1", text: "madame" },
        { id: "opt-2", text: "étudiant" },
        { id: "opt-3", text: "il" },
      ],
      correctOptionId: "correct",
      optionsHideRomaji: true,
    },
    speaking(
      "fr-m2v2-r-speak-cavabien",
      "ça va bien",
      "it's going well",
      [],
      "recall",
    ),
    cloze(
      "fr-m2v2-r-cloze-elle",
      "",
      "est étudiante",
      "elle",
      ["elle", "il"],
      "SHE is a student",
      "elle est étudiante",
      "The pink chain: elle … étudiante.",
    ),
    {
      id: "fr-m2v2-r-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ettoi", source: "et toi ?", target: "and you?" },
        { id: "p-jemappelle", source: "je m'appelle", target: "my name is" },
        { id: "p-suis", source: "suis", target: "am" },
        { id: "p-de", source: "de", target: "from" },
        { id: "p-madame", source: "madame", target: "ma'am / Mrs." },
        { id: "p-etudiant", source: "étudiant", target: "student (man)" },
      ],
    },
  ];
}

/** m2 L9 — The café conversation, escape payoff included. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m2v2-9-sim-cafe",
      type: "dialogue_sim",
      scene: {
        emoji: "☕",
        title: "Le café — Léa and Emma",
        setting: "Week two. Emma brought her friend Inès along.",
      },
      exercisedAtomIds: [],
      explanation:
        "One real conversation: check-in, names, origins, a wobble rescued by «je ne comprends pas», and coffee. The whole module.",
      turns: [
        {
          id: "t1-checkin",
          npc: {
            speaker: "Léa",
            kana: "Salut ! Ça va ?",
            audioText: "ça va",
            gloss: "Hi! How's it going?",
          },
          goal: "Answer — and bounce it back.",
          reply: {
            mode: "build",
            tiles: ["ça va", "bien", "et toi ?", "non merci"],
            answer: "ça va bien et toi ?",
            alsoAccepted: ["ça va bien"],
            audioText: "ça va bien et toi ?",
          },
          replyGloss: "Fine — and you?",
        },
        {
          id: "t2-nom",
          npc: {
            speaker: "Inès",
            kana: "Comment tu t'appelles ?",
            audioText: "comment tu t'appelles ?",
            gloss: "What's your name?",
          },
          goal: "Tell her.",
          reply: {
            mode: "choice",
            options: [
              { id: "jemappelle", text: "je m'appelle Sam" },
              { id: "tappelles", text: "tu t'appelles Sam" },
              { id: "cavabien", text: "ça va bien" },
            ],
            correctOptionId: "jemappelle",
            audioText: "je m'appelle Sam",
          },
          replyGloss: "My name is Sam.",
        },
        {
          id: "t3-origine",
          npc: {
            speaker: "Inès",
            kana: "Tu es d'où ?",
            audioText: "tu es d'où ?",
            gloss: "Where are you from?",
          },
          goal: "Tell her that too.",
          reply: {
            mode: "build",
            tiles: ["je", "suis", "de", "New York", "m'appelle"],
            answer: "je suis de New York",
            audioText: "je suis de New York",
          },
          replyGloss: "I'm from New York.",
        },
        {
          id: "t4-rapide",
          npc: {
            speaker: "Léa",
            kana: "On va au cinéma demain ?",
            audioText: "on va au cinéma demain ?",
            gloss: "…something fast about… tomorrow?",
          },
          goal: "Don't panic. You have a phrase for this.",
          reply: {
            mode: "choice",
            options: [
              { id: "comprends", text: "je ne comprends pas" },
              { id: "ouijesuis", text: "oui je suis Hugo" },
              { id: "bonnenuit", text: "bonne nuit" },
            ],
            correctOptionId: "comprends",
            audioText: "je ne comprends pas",
          },
          replyGloss: "I don't understand.",
          explanation:
            "She asked about going to the movies tomorrow — module 3 material. The escape phrase just saved the conversation.",
        },
        {
          id: "t5-lent",
          npc: {
            speaker: "Léa",
            kana: "Un café ?",
            audioText: "un café ?",
            gloss: "A coffee? (slower, smiling)",
          },
          goal: "THAT one you know. Either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouisvp", text: "oui s'il vous plaît" },
              { id: "nonmerci", text: "non merci" },
              { id: "comprends", text: "je ne comprends pas" },
            ],
            correctOptionId: "ouisvp",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "oui s'il vous plaît",
          },
          replyGloss: "Yes, please.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m2v2-9-lc-montreal",
      audioText: "je suis de Montréal",
      correctMeaningEn: "I'm from Montreal.",
      distractorsEn: ["I'm from Paris.", "I'm from New York.", "He's from Montreal."],
    }),
    build(
      "fr-m2v2-9-build-full",
      "Build: 'fine — and you?'",
      "ça va bien et toi ?",
      ["ça va", "bien", "et toi ?", "non merci"],
      ["ça va", "bien", "et toi ?"],
    ),
    listeningCompSentence({
      id: "fr-m2v2-9-lc-comprends",
      audioText: "je ne comprends pas",
      correctMeaningEn: "I don't understand.",
      distractorsEn: ["I don't want it.", "I'm not from here.", "No, thank you."],
    }),
    {
      id: "fr-m2v2-9-mc-montreal",
      type: "multiple_choice",
      prompt: 'Which word means "Montreal"?',
      options: [
        { id: "opt-0", text: "Paris" },
        { id: "opt-1", text: "New York" },
        { id: "correct", text: "Montréal" },
        { id: "opt-3", text: "madame" },
      ],
      correctOptionId: "correct",
      optionsHideRomaji: true,
    },
    speaking(
      "fr-m2v2-9-speak-ilest-recall",
      "il est étudiant",
      "he is a student",
      [],
      "recall",
    ),
    cloze(
      "fr-m2v2-9-cloze-dou",
      "tu es",
      "?",
      "d'où",
      ["d'où", "de", "ou", "et"],
      "where are you from?",
      "tu es d'où ?",
      "«d'où» — from where, squeezed into one sound: DOO.",
    ),
    listeningCompSentence({
      id: "fr-m2v2-9-lc-elleest",
      audioText: "elle est étudiante",
      correctMeaningEn: "She is a student.",
      distractorsEn: ["He is a student.", "She is from Paris.", "She is Léa."],
    }),
    {
      id: "fr-m2v2-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-bien", source: "bien", target: "well" },
        { id: "p-ettoi", source: "et toi ?", target: "and you?" },
        { id: "p-comprends", source: "je ne comprends pas", target: "I don't understand" },
        { id: "p-es", source: "es", target: "are" },
        { id: "p-elle", source: "elle", target: "she" },
        { id: "p-ny", source: "New York", target: "New York" },
      ],
    },
    // WIN: the full check-in from memory — recall as the closing beat.
    speaking(
      "fr-m2v2-9-speak-full-recall",
      "ça va bien et toi ?",
      "fine — and you?",
      [],
      "recall",
    ),
  ];
}

/** m2 L10 — Mastery. Graded only; every item; typed production; ends on
 *  Chloé, a stranger — the skills leave the script. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m2v2-10-lc-cava",
      audioText: "ça va",
      correctMeaningEn: "How's it going?",
      distractorsEn: ["What's your name?", "Where are you from?", "Good night."],
    }),
    build(
      "fr-m2v2-10-build-jemappelle",
      "Build: 'my name is Léa'",
      "je m'appelle Léa",
      ["je", "m'appelle", "Léa", "tu", "t'appelles"],
      ["je", "m'appelle", "Léa"],
    ),
    cloze(
      "fr-m2v2-10-cloze-es",
      "tu",
      "Léa",
      "es",
      ["es", "suis"],
      "you are Léa",
      "tu es Léa",
      "«tu» takes «es».",
    ),
    {
      id: "fr-m2v2-10-mc-madame",
      type: "multiple_choice",
      prompt: 'Which word means "ma\'am / Mrs."?',
      options: [
        { id: "opt-0", text: "monsieur" },
        { id: "correct", text: "madame" },
        { id: "opt-2", text: "étudiante" },
        { id: "opt-3", text: "elle" },
      ],
      correctOptionId: "correct",
      optionsHideRomaji: true,
    },
    listeningCompSentence({
      // il/elle final ear trial.
      id: "fr-m2v2-10-lc-elleestlea",
      audioText: "elle est Léa",
      correctMeaningEn: "She is Léa.",
      distractorsEn: ["He is Léa.", "You are Léa.", "I am Léa."],
    }),
    speaking(
      "fr-m2v2-10-speak-elleest-recall",
      "elle est étudiante",
      "she is a student",
      [],
      "recall",
    ),
    cloze(
      "fr-m2v2-10-cloze-etudiant",
      "il est",
      "",
      "étudiant",
      ["étudiant", "étudiante"],
      "he is a student",
      "il est étudiant",
      "«il» keeps the t asleep — DYAHN.",
    ),
    // The typed translate of «je m'appelle Léa» that stood here was CUT,
    // not converted: typed production is banned at beginner tier (Spencer,
    // fr m1 L9 walk 2026-08-21 — spelling isn't taught yet), and this
    // lesson already builds the same sentence from tiles at step 2, so a
    // converted build would be a same-lesson duplicate.
    {
      id: "fr-m2v2-10-map-newyork",
      type: "word_map",
      tokens: ["je", "suis", "de", "New York"],
      pairs: [
        { en: "I", tokenIndex: 0 },
        { en: "am", tokenIndex: 1 },
        { en: "from", tokenIndex: 2 },
        { en: "New York", tokenIndex: 3 },
      ],
      audioText: "je suis de New York",
    },
    {
      id: "fr-m2v2-10-hear-montreal",
      type: "word_image_mcq",
      meaningEn: "Montréal",
      options: [
        { id: "correct", word: "Montréal", emoji: "🍁" },
        { id: "o1", word: "Paris", emoji: "🗼" },
        { id: "o2", word: "New York", emoji: "🗽" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      "fr-m2v2-10-speak-paris-recall",
      "je suis de Paris",
      "I'm from Paris",
      [],
      "recall",
    ),
    cloze(
      "fr-m2v2-10-cloze-je",
      "",
      "suis Hugo",
      "je",
      ["je", "tu", "il", "elle"],
      "I am Hugo",
      "je suis Hugo",
      "«je» — I. The others would need different verb forms.",
    ),
    {
      id: "fr-m2v2-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-monsieur", source: "monsieur", target: "sir / Mr." },
        { id: "p-etudiant", source: "étudiant", target: "student (man)" },
        { id: "p-comprends", source: "je ne comprends pas", target: "I don't understand" },
        { id: "p-tappelles", source: "comment tu t'appelles ?", target: "what's your name?" },
        { id: "p-ettoi", source: "et toi ?", target: "and you?" },
        { id: "p-paris", source: "Paris", target: "Paris" },
      ],
    },
    {
      // THE MODULE ENDS ON A STRANGER.
      id: "fr-m2v2-10-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "🚌",
        title: "A new student on the bus",
        setting: "She sits down next to you. You've never met.",
      },
      exercisedAtomIds: [],
      explanation:
        "A stranger, a full exchange, zero panic — in French. Module 3 gives you the next thing she'll ask about: what you like.",
      turns: [
        {
          id: "t1-nom",
          npc: {
            speaker: "Chloé",
            kana: "Salut ! Comment tu t'appelles ?",
            audioText: "comment tu t'appelles ?",
            gloss: "Hi! What's your name?",
          },
          goal: "Tell her.",
          reply: {
            mode: "choice",
            options: [
              { id: "jemappelle", text: "je m'appelle Sam" },
              { id: "tappelles", text: "tu t'appelles Sam" },
              { id: "aurevoir", text: "au revoir" },
            ],
            correctOptionId: "jemappelle",
            audioText: "je m'appelle Sam",
          },
          replyGloss: "My name is Sam.",
        },
        {
          id: "t2-origine",
          npc: {
            speaker: "Chloé",
            kana: "Enchantée. Tu es d'où ?",
            audioText: "tu es d'où ?",
            gloss: "Nice to meet you. Where are you from?",
          },
          goal: "Tell her that too.",
          reply: {
            mode: "build",
            tiles: ["je", "suis", "de", "New York", "es"],
            answer: "je suis de New York",
            audioText: "je suis de New York",
          },
          replyGloss: "I'm from New York.",
        },
        {
          id: "t3-checkin",
          npc: {
            speaker: "Chloé",
            kana: "Ça va ?",
            audioText: "ça va",
            gloss: "How's it going?",
          },
          goal: "Full answer — bounce it back.",
          reply: {
            mode: "choice",
            options: [
              { id: "full", text: "ça va bien et toi ?" },
              { id: "bien", text: "ça va bien" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "full",
            alsoCorrectOptionIds: ["bien"],
            audioText: "ça va bien et toi ?",
          },
          replyGloss: "Fine — and you?",
        },
      ],
    },
  ];
}

const FR_M2_1: LessonContent = {
  id: "fr-m2-1",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Own the answer to «Ça va ?»",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M2_2: LessonContent = {
  id: "fr-m2-2",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Say your name, ask for theirs",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M2_3: LessonContent = {
  id: "fr-m2-3",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The escape phrase — and monsieur, madame",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M2_4: LessonContent = {
  id: "fr-m2-4",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "I am, you are",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M2_5: LessonContent = {
  id: "fr-m2-5",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "He and she",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M2_6: LessonContent = {
  id: "fr-m2-6",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Say where you're from",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M2_7: LessonContent = {
  id: "fr-m2-7",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The letter that wakes up",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M2_8: LessonContent = {
  id: "fr-m2-8",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for the café",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M2_9: LessonContent = {
  id: "fr-m2-9",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The café conversation",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M2_10: LessonContent = {
  id: "fr-m2-10",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — on a stranger",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M2_MODULE: FrModuleDef = {
  title: "Présentations — introductions",
  eyebrow: "Module 2",
  summary: "Own «Ça va ?», say your name and origin, and survive the café — with an escape phrase that works.",
  lessons: [
    FR_M2_1,
    FR_M2_2,
    FR_M2_3,
    FR_M2_4,
    FR_M2_5,
    FR_M2_6,
    FR_M2_7,
    FR_M2_8,
    FR_M2_9,
    FR_M2_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M2_CHECKPOINT_INDEX = 8;

export const FR_M2_PLACEMENT: PlacementItem[] = [
  {
    id: "pt-fr-m2-s",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m2-s",
        prompt: "Complete: «Je ___ étudiant.»",
        correctText: "suis",
        distractorsText: ["es", "est", "de"],
      }),
  },
  {
    id: "pt-fr-m2-1",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m2-1",
        prompt: "'My name is Léa' — pick the French.",
        correctText: "je m'appelle Léa",
        distractorsText: ["tu t'appelles Léa", "je suis de Léa", "elle est Léa"],
      }),
  },
  {
    id: "pt-fr-m2-2",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m2-2",
        prompt: "Someone asks «Ça va ?» — pick a natural reply.",
        correctText: "ça va bien",
        distractorsText: ["je m'appelle Léa", "au revoir", "oui s'il vous plaît"],
      }),
  },
  {
    id: "pt-fr-m2-3",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m2-3",
        prompt: "'I'm from Paris' — pick the French.",
        correctText: "je suis de Paris",
        distractorsText: ["tu es de Paris", "je suis Paris de", "elle est de je"],
      }),
  },
  {
    id: "pt-fr-m2-4",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m2-4",
        prompt: "'She is a student' — pick the correct form.",
        correctText: "elle est étudiante",
        distractorsText: ["elle est étudiant", "il est étudiante", "elle suis étudiante"],
      }),
  },
];
