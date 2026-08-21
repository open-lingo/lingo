/**
 * m2.ts — Introductions — the §13-doctrine hand-authored module.
 *
 * PROMOTED 2026-08-21 from `features/lesson/dev/esM2Lessons.ts` after the
 * learner-sim pass and Spencer's walks. The July IR module it replaces is
 * in `_archive/`. Hand-authored, not IR-compiled — see m1.ts header.
 *
 * Spine (10 lessons, checkpoint at position 8): the turn-2 rescue kit
 * (¿cómo estás? / me llamo / no entiendo) leads; soy/eres → él/ella →
 * origins → maestro/maestra; the checkpoint ends on a two-turn stranger
 * sim; L9 is the café conversation; L10 is mastery on a stranger.
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type EsAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import {
  infoStep,
  vocabMcq,
  vocabTextMcq,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

export const ES_M2_ATOMS: EsAtom[] = [
  atom({ surface: "¿cómo estás?", meaningEn: "how are you?", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", emoji: "👋", hint: "KO-mo es-TAS — the answer it wants is «bien»" }),
  atom({ surface: "bien", meaningEn: "well / fine", partOfSpeech: "other", fromModule: "m2", kind: "vocab", emoji: "👍", hint: "byen — one syllable" }),
  atom({ surface: "¿y tú?", meaningEn: "and you?", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "bounces any question back" }),
  atom({ surface: "me llamo", meaningEn: "my name is", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "ll sounds like y: meh YA-mo" }),
  atom({ surface: "te llamas", meaningEn: "your name is", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "the -s belongs to YOU: teh YA-mas" }),
  atom({ surface: "no entiendo", meaningEn: "I don't understand", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", emoji: "🤷", hint: "the escape phrase: no en-TYEN-do" }),
  atom({ surface: "señor", meaningEn: "Mr. / sir", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "m", emoji: "👨", hint: "ñ sounds like ny: seh-NYOR" }),
  atom({ surface: "señora", meaningEn: "Mrs. / ma'am", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "f", emoji: "👩", hint: "ñ sounds like ny: seh-NYO-ra" }),
  atom({ surface: "yo", meaningEn: "I", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "tú", meaningEn: "you (informal)", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "the accent distinguishes tú (you) from tu (your)" }),
  atom({ surface: "soy", meaningEn: "I am", partOfSpeech: "verb", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "eres", meaningEn: "you are", partOfSpeech: "verb", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "él", meaningEn: "he", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "the accent distinguishes él (he) from el (the)" }),
  atom({ surface: "ella", meaningEn: "she", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "ll sounds like y: EH-ya" }),
  atom({ surface: "es", meaningEn: "he/she/it is", partOfSpeech: "verb", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "de", meaningEn: "of / from", partOfSpeech: "particle", fromModule: "m2", kind: "particle" }),
  atom({ surface: "México", meaningEn: "Mexico", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", emoji: "🇲🇽", hint: "this x sounds like an English h: ME-hee-ko" }),
  atom({ surface: "España", meaningEn: "Spain", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", emoji: "🇪🇸", hint: "ñ sounds like ny: es-PA-nya" }),
  atom({ surface: "Estados Unidos", meaningEn: "United States", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", emoji: "🇺🇸" }),
  atom({ surface: "maestro", meaningEn: "teacher (m)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "m", emoji: "👨‍🏫" }),
  atom({ surface: "maestra", meaningEn: "teacher (f)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "f", emoji: "👩‍🏫" }),
  atom({ surface: "estudiante", meaningEn: "student", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", emoji: "🎓" }),
];

/**
 * m2 L1 — Keep the conversation going. The turn-2 rescue kit: the very
 * question that ended the m1 sim-learner's conversation opens this
 * module, and by the close the learner asks it themselves.
 */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "es-m2v2-1-info-kit",
      "Keep the conversation going",
      "Module 1 got you INTO a conversation — this module keeps you in it. The question that opens almost every Spanish exchange: «¿Cómo estás?» — how are you? The answer: «bien» — fine. Return it: «¿y tú?» — and you?",
      "grammar",
    ),
    {
      // The m1 cliff, resolved: Ana asks. Card-fed, self-cueing (the
      // question itself creates the slot).
      id: "es-m2v2-1-sim-comoestas",
      type: "dialogue_sim",
      scene: { emoji: "👋", title: "Ana spots you", setting: "Day one of week two." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-comoestas",
          npc: {
            speaker: "Ana",
            kana: "¡Hola! ¿Cómo estás?",
            audioText: "¿cómo estás?",
            gloss: "Hi! How are you?",
          },
          goal: "Answer her.",
          reply: {
            mode: "choice",
            options: [
              { id: "bien", text: "bien" },
              { id: "nogracias", text: "no gracias" },
              { id: "adios", text: "adiós" },
            ],
            correctOptionId: "bien",
            audioText: "bien",
          },
          replyGloss: "Fine.",
          explanation:
            "«bien» — fine, well. «¿Cómo estás?» will open almost every conversation you ever have in Spanish; now it can't knock you over.",
        },
      ],
    },
    speaking("es-m2v2-1-speak-bien", "bien", "fine / well", []),
    {
      id: "es-m2v2-1-map-biengracias",
      type: "word_map",
      tokens: ["bien", "gracias"],
      pairs: [
        { en: "fine", tokenIndex: 0 },
        { en: "thanks", tokenIndex: 1 },
      ],
      audioText: "bien gracias",
      revealNote:
        "«bien gracias» — fine, thanks. Your m1 gracias just got a new job.",
    },
    listeningCompSentence({
      id: "es-m2v2-1-lc-biengracias",
      audioText: "bien gracias",
      correctMeaningEn: "Fine, thanks.",
      distractorsEn: ["No, thank you.", "Yes, please.", "Good morning."],
    }),
    {
      // Ask it BACK — the full polite loop, card-fed «¿y tú?».
      id: "es-m2v2-1-sim-ytu",
      type: "dialogue_sim",
      scene: { emoji: "💬", title: "Diego checks in" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ytu",
          npc: {
            speaker: "Diego",
            kana: "¿Cómo estás?",
            audioText: "¿cómo estás?",
            gloss: "How are you?",
          },
          goal: "Answer — and ask him back.",
          reply: {
            mode: "choice",
            options: [
              { id: "full", text: "bien gracias ¿y tú?" },
              { id: "bien", text: "bien" },
              { id: "siporfavor", text: "sí por favor" },
            ],
            correctOptionId: "full",
            alsoCorrectOptionIds: ["bien"],
            audioText: "bien gracias ¿y tú?",
          },
          replyGloss: "Fine thanks — and you?",
          explanation:
            "«¿y tú?» — and you? Your m1 «y» plus one new word, and the conversation bounces back instead of dying.",
        },
      ],
    },
    speaking("es-m2v2-1-speak-biengracias", "bien gracias", "fine, thanks", []),
    {
      // TAIL (R1): m1 lane, by ear.
      id: "es-m2v2-1-hear-buenosdias",
      type: "word_image_mcq",
      meaningEn: "buenos días",
      options: [
        { id: "correct", word: "buenos días", emoji: "🌅" },
        { id: "o1", word: "buenas noches", emoji: "🌙" },
        { id: "o2", word: "buenas tardes", emoji: "☀️" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "es-m2v2-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-comoestas", source: "¿cómo estás?", target: "how are you?" },
        { id: "p-bien", source: "bien", target: "fine" },
        { id: "p-ytu", source: "¿y tú?", target: "and you?" },
        { id: "p-gracias", source: "gracias", target: "thank you" },
        { id: "p-hola", source: "hola", target: "hello" },
        { id: "p-adios", source: "adiós", target: "goodbye" },
      ],
    },
    // WIN: now YOU can ask it — first voicing, printed.
    speaking(
      "es-m2v2-1-speak-comoestas",
      "¿cómo estás?",
      "how are you?",
      [],
    ),
  ];
}

/**
 * m2 L2 — Say your name. The formula pair, mapped → heard → built, with
 * the ll=y sound named once and cashed by ear.
 */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "es-m2v2-2-info-names",
      "Say your name",
      "«me llamo …» — my name is … (ll sounds like y: meh YA-mo). And the question: «¿Cómo te llamas?» — what's your name?",
      "grammar",
    ),
    {
      id: "es-m2v2-2-map-mellamo",
      type: "word_map",
      tokens: ["me llamo", "Ana"],
      pairs: [
        { en: "my name is", tokenIndex: 0 },
        { en: "Ana", tokenIndex: 1 },
      ],
      audioText: "me llamo Ana",
      revealNote:
        "«me llamo» works as one piece — drop any name in after it. Literally it's 'I call myself', which is why it doesn't look like 'my name is'.",
    },
    listeningCompSentence({
      // The ll=y card line CASHES here (R6): you HEAR meh-YA-mo.
      id: "es-m2v2-2-lc-mellamodiego",
      audioText: "me llamo Diego",
      correctMeaningEn: "My name is Diego.",
      distractorsEn: ["How are you, Diego?", "Nice to meet you.", "I'm from Mexico."],
    }),
    speaking("es-m2v2-2-speak-mellamo", "me llamo", "my name is…", ["me llamo"]),
    {
      id: "es-m2v2-2-sim-tellamas",
      type: "dialogue_sim",
      scene: {
        emoji: "🪑",
        title: "Sofía again",
        setting: "You met her in the park last week — module 1, the coffee question.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tellamas",
          npc: {
            speaker: "Sofía",
            kana: "¡Hola! ¿Cómo te llamas?",
            audioText: "¿cómo te llamas?",
            gloss: "Hi! What's your name?",
          },
          goal: "Tell her your name.",
          reply: {
            mode: "choice",
            options: [
              { id: "mellamo", text: "me llamo Sam" },
              // The TRAP is the lesson's own contrast (flow-walk fix):
              // «te llamas» is HER form of the verb, not yours.
              { id: "tellamas", text: "te llamas Sam" },
              { id: "nogracias", text: "no gracias" },
            ],
            correctOptionId: "mellamo",
            audioText: "me llamo Sam",
          },
          replyGloss: "My name is Sam.",
          explanation:
            "«me llamo» — I call MYSELF. «te llamas» is the you-form she used in the question; echoing it back would say 'you call yourself Sam'.",
        },
      ],
    },
    listeningCompSentence({
      id: "es-m2v2-2-lc-tellamas",
      audioText: "¿cómo te llamas?",
      correctMeaningEn: "What's your name?",
      distractorsEn: ["How are you?", "Where are you from?", "Good morning."],
    }),
    build(
      // Second encounter of the pattern → build it (§13.3).
      "es-m2v2-2-build-mellamo",
      "Build: 'my name is Ana'",
      "me llamo Ana",
      ["me", "llamo", "Ana", "te", "llamas"],
      ["me", "llamo", "Ana"],
    ),
    // TAIL: yesterday's kit, from memory (2nd voicing of bien gracias).
    speaking(
      "es-m2v2-2-speak-biengracias-recall",
      "bien gracias",
      "fine, thanks",
      [],
      "recall",
    ),
    {
      // TAIL: m1 meeting lane, by ear — it belongs in the names lesson.
      id: "es-m2v2-2-hear-muchogusto",
      type: "word_image_mcq",
      meaningEn: "mucho gusto",
      options: [
        { id: "correct", word: "mucho gusto", emoji: "🤝" },
        { id: "o1", word: "hasta luego", emoji: "🚪" },
        { id: "o2", word: "por favor", emoji: "🤲" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "es-m2v2-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-mellamo", source: "me llamo", target: "my name is" },
        { id: "p-tellamas", source: "¿cómo te llamas?", target: "what's your name?" },
        { id: "p-mg", source: "mucho gusto", target: "nice to meet you" },
        { id: "p-perdon", source: "perdón", target: "sorry" },
        { id: "p-si", source: "sí", target: "yes" },
        { id: "p-no", source: "no", target: "no" },
      ],
    },
    // WIN: now YOU can ask — first voicing, printed.
    speaking(
      "es-m2v2-2-speak-tellamas",
      "¿cómo te llamas?",
      "what's your name?",
      ["¿cómo te llamas?"],
    ),
  ];
}

/**
 * m2 L3 — The escape phrase, and two titles. «no entiendo» debuts inside
 * the situation that DEFINES it: an NPC line the learner genuinely
 * cannot parse (self-cueing in any language — confusion itself is the
 * cue). The lesson ends on the payoff sim: say it, and people slow down.
 */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "es-m2v2-3-info-escape",
      "The escape phrase",
      "Sometimes a whole sentence flies past you. Say «no entiendo» — I don't understand. It keeps the conversation alive: people slow down and try again. Also two titles: «señor» (Mr. / sir), «señora» (Mrs. / ma'am) — ñ sounds like ny.",
      "grammar",
    ),
    {
      id: "es-m2v2-3-sim-noentiendo",
      type: "dialogue_sim",
      scene: { emoji: "🌀", title: "Diego, at full speed" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-fast",
          npc: {
            speaker: "Diego",
            kana: "¿Qué hora es?",
            audioText: "¿qué hora es?",
            gloss: "…something quick you didn't catch.",
          },
          goal: "Be honest.",
          reply: {
            mode: "choice",
            options: [
              { id: "noentiendo", text: "no entiendo" },
              { id: "siporfavor", text: "sí por favor" },
              { id: "bien", text: "bien gracias" },
            ],
            correctOptionId: "noentiendo",
            audioText: "no entiendo",
          },
          replyGloss: "I don't understand.",
          explanation:
            "«no entiendo» — I don't understand. The most useful sentence in the language: it turns panic into a request. (He asked what time it is — you'll learn that soon.)",
        },
      ],
    },
    speaking("es-m2v2-3-speak-noentiendo", "no entiendo", "I don't understand", []),
    vocabMcq(
      "es-m2v2-3-img-senor",
      { surface: "señor", meaningEn: "Mr. / sir", emoji: "👨" },
      [
        { surface: "señora", emoji: "👩" },
        { surface: "hola", emoji: "🙋" },
        { surface: "gracias", emoji: "🙏" },
      ],
    ),
    {
      id: "es-m2v2-3-map-buenosdiassenor",
      type: "word_map",
      tokens: ["buenos días", "señor"],
      pairs: [
        { en: "good morning", tokenIndex: 0 },
        { en: "sir", tokenIndex: 1 },
      ],
      audioText: "buenos días señor",
      tokenGenders: { 1: "m" },
      revealNote:
        "Add the title and the greeting turns formal-friendly: «buenos días, señor». And that blue glow with the tiny m? «señor» is a he-word — the colors will quietly track this from now on.",
    },
    vocabMcq(
      "es-m2v2-3-img-senora",
      { surface: "señora", meaningEn: "Mrs. / ma'am", emoji: "👩" },
      [
        { surface: "señor", emoji: "👨" },
        { surface: "adiós", emoji: "🚶" },
        { surface: "por favor", emoji: "🤲" },
      ],
    ),
    listeningCompSentence({
      id: "es-m2v2-3-lc-senora",
      audioText: "buenos días señora",
      correctMeaningEn: "Good morning, ma'am.",
      distractorsEn: ["Good morning, sir.", "Good night, ma'am.", "Thank you, ma'am."],
    }),
    // señor/señora were receptive-only across the whole module
    // (retention walk B4) — the polite address gets a voice here.
    speaking(
      "es-m2v2-3-speak-senora",
      "buenos días señora",
      "good morning, ma'am",
      [],
    ),
    cloze(
      // TAIL: m1 lane — the buenos/buenas trial rides into m2 (spaced).
      "es-m2v2-3-cloze-buenos",
      "",
      "días",
      "buenos",
      ["buenos", "buenas"],
      "good morning",
      "buenos días",
      "Still «buenos» with días — never «buenas días».",
    ),
    // TAIL: the kit, from memory.
    speaking(
      "es-m2v2-3-speak-comoestas-recall",
      "¿cómo estás?",
      "how are you?",
      [],
      "recall",
    ),
    {
      id: "es-m2v2-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-noentiendo", source: "no entiendo", target: "I don't understand" },
        { id: "p-senor", source: "señor", target: "Mr. / sir" },
        { id: "p-senora", source: "señora", target: "Mrs. / ma'am" },
        { id: "p-comoestas", source: "¿cómo estás?", target: "how are you?" },
        { id: "p-bien", source: "bien", target: "fine" },
        { id: "p-hl", source: "hasta luego", target: "see you later" },
      ],
    },
    {
      // THE PAYOFF (win, R7): the escape phrase WORKS — she slows down,
      // and suddenly you understand. Ends the lesson on its teeth.
      id: "es-m2v2-3-sim-payoff",
      type: "dialogue_sim",
      scene: { emoji: "🕰️", title: "A señora at the bus stop" },
      exercisedAtomIds: [],
      explanation:
        "That's the whole trick: «no entiendo» doesn't end conversations — it makes people meet you halfway.",
      turns: [
        {
          id: "t1-fast",
          npc: {
            speaker: "The señora",
            kana: "¿Tiene la hora?",
            audioText: "¿tiene la hora?",
            gloss: "…something you didn't catch.",
          },
          goal: "You know what to do.",
          reply: {
            mode: "choice",
            options: [
              { id: "noentiendo", text: "no entiendo" },
              { id: "mellamo", text: "me llamo Diego" },
              { id: "hastaluego", text: "hasta luego" },
            ],
            correctOptionId: "noentiendo",
            audioText: "no entiendo",
          },
          replyGloss: "I don't understand.",
        },
        {
          id: "t2-slow",
          npc: {
            speaker: "The señora",
            kana: "¿Có-mo es-tás?",
            audioText: "¿cómo estás?",
            gloss: "How — are — you? (slowly, kindly)",
          },
          goal: "NOW you understand. Answer her.",
          reply: {
            mode: "choice",
            options: [
              { id: "bien", text: "bien gracias" },
              { id: "noentiendo", text: "no entiendo" },
              { id: "adios", text: "adiós" },
            ],
            correctOptionId: "bien",
            audioText: "bien gracias",
          },
          replyGloss: "Fine, thanks.",
        },
      ],
    },
  ];
}

/**
 * m2 L4 — I am, you are. soy/eres met inside real sentences, the
 * pronoun-drop absorbed (never announced as a rule), and the pair
 * discriminated with alternating cloze answers.
 */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "es-m2v2-4-info-ser",
      "I am, you are",
      "«yo» = I, «tú» = you. «Yo soy Ana» — I am Ana. «Tú eres Diego» — you are Diego. Spanish usually drops the pronoun: «soy Ana» says it all — the verb ending carries the who.",
      "grammar",
    ),
    {
      id: "es-m2v2-4-map-yosoyana",
      type: "word_map",
      tokens: ["yo", "soy", "Ana"],
      pairs: [
        { en: "I", tokenIndex: 0 },
        { en: "am", tokenIndex: 1 },
        { en: "Ana", tokenIndex: 2 },
      ],
      audioText: "yo soy Ana",
    },
    listeningCompSentence({
      id: "es-m2v2-4-lc-soydiego",
      audioText: "soy Diego",
      correctMeaningEn: "I'm Diego.",
      distractorsEn: ["You're Diego.", "My name is Ana.", "He is Diego."],
    }),
    cloze(
      // soy/eres trial #1 — answer SOY, eres live.
      "es-m2v2-4-cloze-soy",
      "yo",
      "Ana",
      "soy",
      ["soy", "eres"],
      "I am Ana",
      "yo soy Ana",
      "«yo» goes with «soy» — the I-form.",
    ),
    {
      id: "es-m2v2-4-sim-eres",
      type: "dialogue_sim",
      scene: { emoji: "❓", title: "Ana double-checks" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-eres",
          npc: {
            speaker: "Ana",
            kana: "¿Eres Sam?",
            audioText: "¿eres Sam?",
            gloss: "Are you Sam?",
          },
          goal: "You are — confirm it.",
          reply: {
            mode: "choice",
            options: [
              { id: "sisoy", text: "sí soy Sam" },
              // Trap: her verb form, not yours.
              { id: "sieres", text: "sí eres Sam" },
              { id: "nogracias", text: "no gracias" },
            ],
            correctOptionId: "sisoy",
            audioText: "sí soy Sam",
          },
          replyGloss: "Yes, I'm Sam.",
          explanation:
            "She asks with «eres» (you are); you answer with «soy» (I am). The flip IS the grammar — no table needed.",
        },
      ],
    },
    build(
      "es-m2v2-4-build-yosoyana",
      "Build: 'I am Ana'",
      "yo soy Ana",
      ["yo", "soy", "Ana", "eres", "tú"],
      ["yo", "soy", "Ana"],
    ),
    cloze(
      // Trial #2 — answer ERES, soy live (alternation, R5).
      "es-m2v2-4-cloze-eres",
      "tú",
      "Ana",
      "eres",
      ["eres", "soy"],
      "you are Ana",
      "tú eres Ana",
      "«tú» goes with «eres» — the you-form.",
    ),
    {
      // TAIL: yesterday's titles, by ear.
      id: "es-m2v2-4-hear-senora",
      type: "word_image_mcq",
      meaningEn: "señora",
      options: [
        { id: "correct", word: "señora", emoji: "👩" },
        { id: "o1", word: "señor", emoji: "👨" },
        { id: "o2", word: "hola", emoji: "🙋" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: names lane, from memory.
    speaking(
      "es-m2v2-4-speak-mellamo-recall",
      "me llamo",
      "my name is…",
      ["me llamo"],
      "recall",
    ),
    {
      id: "es-m2v2-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-yo", source: "yo", target: "I" },
        { id: "p-tu", source: "tú", target: "you" },
        { id: "p-soy", source: "soy", target: "I am" },
        { id: "p-eres", source: "eres", target: "you are" },
        { id: "p-porfavor", source: "por favor", target: "please" },
        { id: "p-adios", source: "adiós", target: "goodbye" },
      ],
    },
    // WIN: claim an identity out loud — first voicing of the sentence.
    speaking("es-m2v2-4-speak-yosoyana", "yo soy Ana", "I am Ana", []),
  ];
}

/**
 * m2 L5 — He and she. él/ella carry the module's gender tints onto
 * PRONOUNS; «estudiante» is the epicene contrast (same word for
 * everyone — untinted on purpose).
 */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "es-m2v2-5-info-elella",
      "He and she",
      "«él» = he, «ella» = she (EH-ya — the ll again). «es» = he/she is. And «estudiante» — student: the same word for everyone.",
      "grammar",
    ),
    vocabMcq(
      "es-m2v2-5-img-estudiante",
      { surface: "estudiante", meaningEn: "student", emoji: "🎓" },
      [
        { surface: "señor", emoji: "👨" },
        { surface: "señora", emoji: "👩" },
        { surface: "hola", emoji: "🙋" },
      ],
    ),
    {
      id: "es-m2v2-5-map-elesestudiante",
      type: "word_map",
      tokens: ["él", "es", "estudiante"],
      pairs: [
        { en: "he", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "student", tokenIndex: 2 },
      ],
      audioText: "él es estudiante",
      // él tints blue; es and estudiante stay neutral — the contrast
      // between gendered and invariant words IS the lesson (§13.4).
      tokenGenders: { 0: "m" },
      revealNote:
        "No 'a' needed: «él es estudiante» — Spanish drops it for jobs and roles.",
    },
    listeningCompSentence({
      id: "es-m2v2-5-lc-ella",
      audioText: "ella es estudiante",
      correctMeaningEn: "She is a student.",
      distractorsEn: ["He is a student.", "I am a student.", "You are a student."],
    }),
    {
      id: "es-m2v2-5-map-ellaesana",
      type: "word_map",
      tokens: ["ella", "es", "Ana"],
      pairs: [
        { en: "she", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "Ana", tokenIndex: 2 },
      ],
      audioText: "ella es Ana",
      tokenGenders: { 0: "f" },
    },
    speaking("es-m2v2-5-speak-elesestudiante", "él es estudiante", "he is a student", []),
    cloze(
      // él/ella trial — answer ELLA, él live.
      "es-m2v2-5-cloze-ella",
      "",
      "es Ana",
      "ella",
      ["ella", "él"],
      "SHE is Ana",
      "ella es Ana",
      "«ella» — she. «él» would make it 'he is Ana', which Ana disputes.",
    ),
    listeningCompSentence({
      // TAIL: the m1 NUMBER lane — both walks flagged that m2 dropped
      // the numbers entirely and they'd started to rot.
      id: "es-m2v2-5-lc-seisysiete",
      audioText: "seis y siete",
      correctMeaningEn: "Six and seven",
      distractorsEn: ["Six or seven", "Seven and eight", "Two and three"],
    }),
    // TAIL: names lane.
    speaking(
      "es-m2v2-5-speak-tellamas-recall",
      "¿cómo te llamas?",
      "what's your name?",
      ["¿cómo te llamas?"],
      "recall",
    ),
    {
      id: "es-m2v2-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-el", source: "él", target: "he" },
        { id: "p-ella", source: "ella", target: "she" },
        { id: "p-es", source: "es", target: "he/she is" },
        { id: "p-estudiante", source: "estudiante", target: "student" },
        { id: "p-bien", source: "bien", target: "fine" },
        { id: "p-noentiendo", source: "no entiendo", target: "I don't understand" },
      ],
    },
    {
      // WIN sim: use the third person on a real person.
      id: "es-m2v2-5-sim-esestudiante",
      type: "dialogue_sim",
      scene: {
        emoji: "🎓",
        title: "Sofía nods at Diego",
        setting: "He's carrying a stack of books.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-es",
          npc: {
            speaker: "Sofía",
            kana: "¿Es estudiante?",
            audioText: "¿es estudiante?",
            gloss: "Is he a student?",
          },
          goal: "He is — confirm it.",
          reply: {
            mode: "choice",
            options: [
              { id: "sies", text: "sí es estudiante" },
              // Trap: the I-form — 'yes, I'M a student' answers the
              // wrong question about the wrong person.
              { id: "sisoy", text: "sí soy estudiante" },
              { id: "hastaluego", text: "hasta luego" },
            ],
            correctOptionId: "sies",
            audioText: "sí es estudiante",
          },
          replyGloss: "Yes, he's a student.",
          explanation:
            "«no entiendo» was RIGHT there — but you DID understand this one. Progress.",
        },
      ],
    },
  ];
}

/**
 * m2 L6 — Where are you from? Flags are honest images; «de» debuts by
 * map elimination inside the sentence that needs it.
 */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "es-m2v2-6-info-origen",
      "Where are you from?",
      "«Soy de México» — I'm from Mexico. «de» = from. The question: «¿De dónde eres?» — where are you from?",
      "grammar",
    ),
    {
      // Audio-prompted (the flag under an English prompt was a free
      // tap): hear «México», bind the sound to the place.
      id: "es-m2v2-6-img-mexico",
      type: "word_image_mcq",
      meaningEn: "México",
      options: [
        { id: "correct", word: "México", emoji: "🇲🇽" },
        { id: "o1", word: "España", emoji: "🇪🇸" },
        { id: "o2", word: "Estados Unidos", emoji: "🇺🇸" },
      ],
      correctOptionId: "correct",
    },
    {
      // «de» debuts by elimination, prompted LAST — soy known, México
      // just debuted (§13.3: one new word per map).
      id: "es-m2v2-6-map-soydemexico",
      type: "word_map",
      tokens: ["soy", "de", "México"],
      pairs: [
        { en: "I am", tokenIndex: 0 },
        { en: "from", tokenIndex: 1 },
        { en: "Mexico", tokenIndex: 2 },
      ],
      audioText: "soy de México",
      revealNote:
        "«de» — from. It's also 'of', and it will follow you through the whole language.",
    },
    {
      id: "es-m2v2-6-img-espana",
      type: "word_image_mcq",
      meaningEn: "España",
      options: [
        { id: "correct", word: "España", emoji: "🇪🇸" },
        { id: "o1", word: "México", emoji: "🇲🇽" },
        { id: "o2", word: "Estados Unidos", emoji: "🇺🇸" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      id: "es-m2v2-6-lc-espana",
      audioText: "soy de España",
      correctMeaningEn: "I'm from Spain.",
      distractorsEn: ["I'm from Mexico.", "I'm from the United States.", "I'm a student."],
    }),
    speaking("es-m2v2-6-speak-soydemexico", "soy de México", "I'm from Mexico", []),
    {
      id: "es-m2v2-6-img-eeuu",
      type: "word_image_mcq",
      meaningEn: "Estados Unidos",
      options: [
        { id: "correct", word: "Estados Unidos", emoji: "🇺🇸" },
        { id: "o1", word: "España", emoji: "🇪🇸" },
        { id: "o2", word: "México", emoji: "🇲🇽" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "es-m2v2-6-sim-dedonde",
      type: "dialogue_sim",
      scene: { emoji: "🗺️", title: "Ana is curious" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-dedonde",
          npc: {
            speaker: "Ana",
            kana: "¿De dónde eres?",
            audioText: "¿de dónde eres?",
            gloss: "Where are you from?",
          },
          goal: "Tell her.",
          reply: {
            mode: "build",
            tiles: ["soy", "de", "Estados", "Unidos", "me", "llamo"],
            answer: "soy de Estados Unidos",
            audioText: "soy de Estados Unidos",
          },
          replyGloss: "I'm from the United States.",
          explanation:
            "«eres» in the question, «soy» in the answer — the same flip as ¿eres?/soy. It never changes.",
        },
      ],
    },
    cloze(
      "es-m2v2-6-cloze-de",
      "soy",
      "México",
      "de",
      ["de", "y", "o", "es"],
      "I'm from Mexico",
      "soy de México",
      "«de» — from. The little words do the connecting.",
    ),
    build(
      // Was the typed warm-up (flow walk C5) — typed production grades spelling a
      // beginner hasn't been taught (Spencer, fr m1 L9 walk 2026-08-21:
      // his phonetically-right «si vu plait» failed). A tile build tests
      // the same recall — which words, what order — without the spelling tax.
      "es-m2v2-6-build-soydemexico",
      "Build: 'I'm from Mexico'",
      "soy de México",
      ["soy", "de", "México", "eres", "y"],
      ["soy", "de", "México"],
    ),
    {
      // TAIL: people lane, by ear.
      id: "es-m2v2-6-hear-estudiante",
      type: "word_image_mcq",
      meaningEn: "estudiante",
      options: [
        { id: "correct", word: "estudiante", emoji: "🎓" },
        { id: "o1", word: "señor", emoji: "👨" },
        { id: "o2", word: "señora", emoji: "👩" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "es-m2v2-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-de", source: "de", target: "from" },
        { id: "p-mexico", source: "México", target: "Mexico" },
        { id: "p-espana", source: "España", target: "Spain" },
        { id: "p-eeuu", source: "Estados Unidos", target: "United States" },
        { id: "p-soy", source: "soy", target: "I am" },
        { id: "p-dedonde", source: "¿de dónde eres?", target: "where are you from?" },
      ],
    },
    // WIN: now YOU can ask — first voicing, printed.
    speaking(
      "es-m2v2-6-speak-dedonde",
      "¿de dónde eres?",
      "where are you from?",
      ["¿de dónde eres?"],
    ),
  ];
}

/**
 * m2 L7 — Teachers. maestro/maestra is the -o/-a pair the learner has
 * been HEARING since buenos/buenas — now it lands on people, with
 * alternating agreement trials and gender tints doing the teaching.
 */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "es-m2v2-7-info-maestro",
      "The -o/-a switch, on people",
      "«maestro» — teacher (a man). «maestra» — teacher (a woman). The same dress-code as buenos/buenas: -o for him, -a for her. «Él es maestro. Ella es maestra.»",
      "grammar",
    ),
    vocabMcq(
      "es-m2v2-7-img-maestro",
      { surface: "maestro", meaningEn: "teacher (m)", emoji: "👨‍🏫" },
      [
        { surface: "maestra", emoji: "👩‍🏫" },
        { surface: "estudiante", emoji: "🎓" },
        { surface: "señor", emoji: "👨" },
      ],
    ),
    {
      id: "es-m2v2-7-map-elesmaestro",
      type: "word_map",
      tokens: ["él", "es", "maestro"],
      pairs: [
        { en: "he", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "teacher", tokenIndex: 2 },
      ],
      audioText: "él es maestro",
      // él AND maestro glow blue together; es stays neutral — an
      // agreement chain the learner can SEE (genderColor.ts pedagogy).
      tokenGenders: { 0: "m", 2: "m" },
    },
    speaking("es-m2v2-7-speak-elesmaestro", "él es maestro", "he is a teacher", []),
    {
      // «maestra» debuts BY MAP ELIMINATION (ella and es known, the -a
      // form falls out — §13.3), killing the mcq/map/mcq/map template
      // the flow walk tuned out on.
      id: "es-m2v2-7-map-ellaesmaestra",
      type: "word_map",
      tokens: ["ella", "es", "maestra"],
      pairs: [
        { en: "she", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "teacher", tokenIndex: 2 },
      ],
      audioText: "ella es maestra",
      tokenGenders: { 0: "f", 2: "f" },
    },
    cloze(
      // Agreement trial #1 — answer MAESTRA, maestro live.
      "es-m2v2-7-cloze-maestra",
      "ella es",
      "",
      "maestra",
      ["maestra", "maestro"],
      "she is a teacher",
      "ella es maestra",
      "«ella» pulls the -a form with it — the chain agrees.",
    ),
    listeningCompSentence({
      // TAIL: names lane, separated from its source by five lessons.
      id: "es-m2v2-7-lc-mellamo",
      audioText: "me llamo Ana",
      correctMeaningEn: "My name is Ana.",
      distractorsEn: ["She is Ana.", "Are you Ana?", "How are you, Ana?"],
    }),
    // TAIL: origin lane, from memory.
    speaking(
      "es-m2v2-7-speak-soydemexico-recall",
      "soy de México",
      "I'm from Mexico",
      [],
      "recall",
    ),
    cloze(
      // Agreement trial #2 — answer MAESTRO (alternation, R5).
      "es-m2v2-7-cloze-maestro",
      "él es",
      "",
      "maestro",
      ["maestro", "maestra"],
      "he is a teacher",
      "él es maestro",
      "«él» pulls the -o form. Blue chain, pink chain — never mixed.",
    ),
    {
      id: "es-m2v2-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-maestro", source: "maestro", target: "teacher (m)" },
        { id: "p-maestra", source: "maestra", target: "teacher (f)" },
        { id: "p-estudiante", source: "estudiante", target: "student" },
        { id: "p-el", source: "él", target: "he" },
        { id: "p-ella", source: "ella", target: "she" },
        { id: "p-noentiendo", source: "no entiendo", target: "I don't understand" },
      ],
    },
    {
      // WIN sim: meet the teacher — the m1 formula pays off again.
      id: "es-m2v2-7-sim-lamaestra",
      type: "dialogue_sim",
      scene: {
        emoji: "🏫",
        title: "Diego introduces someone",
        setting: "A woman with a stack of homework.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-intro",
          npc: {
            speaker: "Diego",
            kana: "Ella es maestra.",
            audioText: "ella es maestra",
            gloss: "She's a teacher.",
          },
          goal: "Greet her — you know how.",
          reply: {
            mode: "choice",
            options: [
              { id: "muchogusto", text: "mucho gusto" },
              { id: "noentiendo", text: "no entiendo" },
              { id: "adios", text: "adiós" },
            ],
            correctOptionId: "muchogusto",
            audioText: "mucho gusto",
          },
          replyGloss: "Nice to meet you.",
          explanation:
            "«mucho gusto» from module 1, doing exactly what it was built for.",
        },
      ],
    },
  ];
}

/**
 * m2 CHECKPOINT — zero new, sixteen graded retrievals over the whole
 * module (plus the m1 lane), every confusable discriminated: soy/eres,
 * él/ella, maestro/maestra, señor/señora by ear.
 */
function checkpointLesson(): LessonStep[] {
  return [
    {
      id: "es-m2v2-r-hear-senora",
      type: "word_image_mcq",
      meaningEn: "señora",
      options: [
        { id: "correct", word: "señora", emoji: "👩" },
        { id: "o1", word: "señor", emoji: "👨" },
        { id: "o2", word: "maestra", emoji: "👩‍🏫" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "es-m2v2-r-cloze-eres",
      "tú",
      "Ana",
      "eres",
      ["eres", "soy"],
      "you are Ana",
      "tú eres Ana",
      "«tú» takes «eres» — every time.",
    ),
    speaking(
      "es-m2v2-r-speak-noentiendo",
      "no entiendo",
      "I don't understand",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "es-m2v2-r-lc-biengracias",
      audioText: "bien gracias ¿y tú?",
      correctMeaningEn: "Fine thanks — and you?",
      distractorsEn: ["My name is… and you?", "I don't understand.", "Yes please — and you?"],
    }),
    vocabTextMcq("es-m2v2-r-mc-estudiante", "estudiante", [
      "maestro",
      "maestra",
      "señora",
    ]),
    build(
      "es-m2v2-r-build-soydeespana",
      "Build: 'I'm from Spain'",
      "soy de España",
      ["soy", "de", "España", "México", "eres"],
      ["soy", "de", "España"],
    ),
    listeningCompSentence({
      // él/ella by EAR inside a sentence — el vs EH-ya.
      id: "es-m2v2-r-lc-eles",
      audioText: "él es estudiante",
      correctMeaningEn: "He is a student.",
      distractorsEn: ["She is a student.", "I am a student.", "You are a student."],
    }),
    speaking(
      "es-m2v2-r-speak-dedonde",
      "¿de dónde eres?",
      "where are you from?",
      ["¿de dónde eres?"],
      "recall",
    ),
    cloze(
      // The m1 connectors finally get a POSITIVE use in m2 (both walks:
      // y/o had been demoted to distractor duty).
      "es-m2v2-r-cloze-y",
      "España",
      "México",
      "y",
      ["y", "o", "de", "es"],
      "Spain and Mexico",
      "España y México",
      "«y» joins them — and «de» would make it Spain OF Mexico, which is a different geopolitics.",
    ),
    build(
      "es-m2v2-r-build-mellamosam",
      "Build: 'my name is Sam'",
      "me llamo Sam",
      ["me", "llamo", "Sam", "te", "llamas"],
      ["me", "llamo", "Sam"],
    ),
    {
      id: "es-m2v2-r-hear-mexico",
      type: "word_image_mcq",
      meaningEn: "México",
      options: [
        { id: "correct", word: "México", emoji: "🇲🇽" },
        { id: "o1", word: "España", emoji: "🇪🇸" },
        { id: "o2", word: "Estados Unidos", emoji: "🇺🇸" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("es-m2v2-r-mc-maestro", "maestro", [
      "maestra",
      "estudiante",
      "señor",
    ]),
    speaking(
      // señora gets a RECALL production slot (retention walk B4).
      "es-m2v2-r-speak-senora",
      "buenos días señora",
      "good morning, ma'am",
      [],
      "recall",
    ),
    cloze(
      // Second SOY trial (R5 alternation — eres holds the other two).
      "es-m2v2-r-cloze-soy",
      "yo",
      "Ana",
      "soy",
      ["soy", "eres"],
      "I am Ana",
      "yo soy Ana",
      "«yo» takes «soy».",
    ),
    {
      id: "es-m2v2-r-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-comoestas", source: "¿cómo estás?", target: "how are you?" },
        { id: "p-ytu", source: "¿y tú?", target: "and you?" },
        { id: "p-mellamo", source: "me llamo", target: "my name is" },
        { id: "p-soy", source: "soy", target: "I am" },
        { id: "p-de", source: "de", target: "from" },
        { id: "p-senora", source: "señora", target: "Mrs. / ma'am" },
      ],
    },
    {
      // The checkpoint of a CONVERSATION module ends on a conversation
      // (both walks' top structural finding) — a stranger, using the
      // module's own traps.
      id: "es-m2v2-r-sim-mercado",
      type: "dialogue_sim",
      scene: {
        emoji: "🛒",
        title: "A señor at the market",
        setting: "He's friendly. You've never met.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-nombre",
          npc: {
            speaker: "The señor",
            kana: "Buenos días. ¿Cómo te llamas?",
            audioText: "¿cómo te llamas?",
            gloss: "Good morning. What's your name?",
          },
          goal: "Tell him.",
          reply: {
            mode: "choice",
            options: [
              { id: "mellamo", text: "me llamo Sam" },
              { id: "tellamas", text: "te llamas Sam" },
              { id: "noentiendo", text: "no entiendo" },
            ],
            correctOptionId: "mellamo",
            audioText: "me llamo Sam",
          },
          replyGloss: "My name is Sam.",
        },
        {
          id: "t2-origen",
          npc: {
            speaker: "The señor",
            kana: "¿De dónde eres?",
            audioText: "¿de dónde eres?",
            gloss: "Where are you from?",
          },
          goal: "Tell him that too.",
          reply: {
            mode: "build",
            tiles: ["soy", "de", "Estados", "Unidos", "me"],
            answer: "soy de Estados Unidos",
            audioText: "soy de Estados Unidos",
          },
          replyGloss: "I'm from the United States.",
        },
      ],
    },
  ];
}

/**
 * m2 L9 — Integration: the café conversation. Everything the module
 * taught, in order, including the ESCAPE PAYOFF mid-conversation (a
 * line flies past → «no entiendo» → she slows down → you're back in).
 */
function lesson9(): LessonStep[] {
  return [
    {
      id: "es-m2v2-9-sim-cafe",
      type: "dialogue_sim",
      scene: {
        emoji: "☕",
        title: "El café — Ana and Sofía",
        setting: "Week two. Sofía brought her friend Carmen along.",
      },
      exercisedAtomIds: [],
      explanation:
        "One real conversation: check-in, names, origins, a wobble rescued by «no entiendo», and coffee. That's the whole module.",
      turns: [
        {
          id: "t1-checkin",
          npc: {
            speaker: "Ana",
            kana: "¡Hola! ¿Cómo estás?",
            audioText: "¿cómo estás?",
            gloss: "Hi! How are you?",
          },
          goal: "Answer — and bounce it back.",
          reply: {
            mode: "build",
            tiles: ["bien", "gracias", "¿y tú?", "no", "adiós"],
            answer: "bien gracias ¿y tú?",
            alsoAccepted: ["bien gracias", "bien"],
            audioText: "bien gracias ¿y tú?",
          },
          replyGloss: "Fine thanks — and you?",
        },
        {
          id: "t2-nombre",
          npc: {
            speaker: "Carmen",
            kana: "¿Cómo te llamas?",
            audioText: "¿cómo te llamas?",
            gloss: "What's your name?",
          },
          goal: "Tell her.",
          reply: {
            mode: "choice",
            options: [
              { id: "mellamo", text: "me llamo Sam" },
              { id: "tellamas", text: "te llamas Sam" },
              { id: "bien", text: "bien gracias" },
            ],
            correctOptionId: "mellamo",
            audioText: "me llamo Sam",
          },
          replyGloss: "My name is Sam.",
        },
        {
          id: "t3-origen",
          npc: {
            speaker: "Carmen",
            kana: "¿De dónde eres?",
            audioText: "¿de dónde eres?",
            gloss: "Where are you from?",
          },
          goal: "Tell her that too.",
          reply: {
            mode: "build",
            tiles: ["soy", "de", "Estados", "Unidos", "me", "llamo"],
            answer: "soy de Estados Unidos",
            audioText: "soy de Estados Unidos",
          },
          replyGloss: "I'm from the United States.",
        },
        {
          id: "t4-rapido",
          npc: {
            speaker: "Ana",
            kana: "¿Quieres ir al cine mañana?",
            audioText: "¿quieres ir al cine mañana?",
            gloss: "…something fast about… tomorrow?",
          },
          goal: "Don't panic. You have a phrase for this.",
          reply: {
            mode: "choice",
            options: [
              { id: "noentiendo", text: "no entiendo" },
              { id: "sisoy", text: "sí soy Diego" },
              { id: "buenasnoches", text: "buenas noches" },
            ],
            correctOptionId: "noentiendo",
            audioText: "no entiendo",
          },
          replyGloss: "I don't understand.",
          explanation:
            "She asked if you want to go to the movies tomorrow — module 3 material. «no entiendo» just saved the conversation instead of ending it. (She'll circle back to the movies once you can answer — coffee first.)",
        },
        {
          id: "t5-despacio",
          npc: {
            speaker: "Ana",
            kana: "¿Café?",
            audioText: "¿café?",
            gloss: "Coffee? (slower, smiling)",
          },
          goal: "THAT one you know. Either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "siporfavor", text: "sí por favor" },
              { id: "nogracias", text: "no gracias" },
              { id: "noentiendo", text: "no entiendo" },
            ],
            correctOptionId: "siporfavor",
            alsoCorrectOptionIds: ["nogracias"],
            audioText: "sí por favor",
          },
          replyGloss: "Yes, please.",
        },
      ],
    },
    listeningCompSentence({
      id: "es-m2v2-9-lc-eeuu",
      audioText: "soy de Estados Unidos",
      correctMeaningEn: "I'm from the United States.",
      distractorsEn: ["I'm from Spain.", "I'm from Mexico.", "He's from the United States."],
    }),
    build(
      "es-m2v2-9-build-biengracias",
      "Build: 'fine thanks — and you?'",
      "bien gracias ¿y tú?",
      ["bien", "gracias", "¿y tú?", "no", "sí"],
      ["bien", "gracias", "¿y tú?"],
    ),
    listeningCompSentence({
      id: "es-m2v2-9-lc-noentiendo",
      audioText: "no entiendo",
      correctMeaningEn: "I don't understand.",
      distractorsEn: ["I don't want it.", "I'm not from here.", "No, thank you."],
    }),
    vocabTextMcq("es-m2v2-9-mc-espana", "España", [
      "México",
      "Estados Unidos",
      "señora",
    ]),
    // The m1 NUMBER lane, from memory (both walks: numbers had
    // vanished from m2 entirely).
    speaking(
      "es-m2v2-9-speak-count-recall",
      "seis, siete, ocho, nueve, diez",
      "six, seven, eight, nine, ten",
      [],
      "recall",
    ),
    cloze(
      "es-m2v2-9-cloze-de",
      "¿",
      "dónde eres?",
      "de",
      ["de", "y", "o", "no"],
      "where are you FROM?",
      "¿de dónde eres?",
      "«de» rides at the front of the question — 'from where are you?'",
    ),
    // The people lane, from memory.
    speaking(
      "es-m2v2-9-speak-elesmaestro-recall",
      "él es maestro",
      "he is a teacher",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "es-m2v2-9-lc-ellaesmaestra",
      audioText: "ella es maestra",
      correctMeaningEn: "She is a teacher.",
      distractorsEn: ["He is a teacher.", "She is a student.", "She is from Spain."],
    }),
    {
      id: "es-m2v2-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-bien", source: "bien", target: "fine" },
        { id: "p-ytu", source: "¿y tú?", target: "and you?" },
        { id: "p-noentiendo", source: "no entiendo", target: "I don't understand" },
        { id: "p-eres", source: "eres", target: "you are" },
        { id: "p-ella", source: "ella", target: "she" },
        { id: "p-eeuu", source: "Estados Unidos", target: "United States" },
      ],
    },
    // WIN: the full check-in, out loud — first voicing of the compound.
    speaking(
      "es-m2v2-9-speak-biengraciasytu",
      "bien gracias ¿y tú?",
      "fine thanks — and you?",
      [],
    ),
  ];
}

/**
 * m2 L10 — Mastery. Graded only, no cards; every module item appears;
 * typed production; ends on a sim with a NEW person — proof the skills
 * transfer off the script.
 */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "es-m2v2-10-lc-comoestas",
      audioText: "¿cómo estás?",
      correctMeaningEn: "How are you?",
      distractorsEn: ["What's your name?", "Where are you from?", "How is she?"],
    }),
    build(
      "es-m2v2-10-build-mellamo",
      "Build: 'my name is Ana'",
      "me llamo Ana",
      ["me", "llamo", "Ana", "te", "llamas"],
      ["me", "llamo", "Ana"],
    ),
    cloze(
      // Fresh frame — the verbatim «tú ___ Ana» repeat tested screen
      // memory, not Spanish (retention walk N3).
      "es-m2v2-10-cloze-eres",
      "¿",
      "Sam?",
      "eres",
      ["eres", "soy"],
      "are you Sam?",
      "¿eres Sam?",
      "A question about YOU takes «eres».",
    ),
    vocabTextMcq("es-m2v2-10-mc-senora", "señora", ["señor", "maestra", "ella"]),
    listeningCompSentence({
      // él/ella final ear trial.
      id: "es-m2v2-10-lc-ellaesana",
      audioText: "ella es Ana",
      correctMeaningEn: "She is Ana.",
      distractorsEn: ["He is Ana.", "You are Ana.", "I am Ana."],
    }),
    speaking(
      "es-m2v2-10-speak-comoestas",
      "¿cómo estás?",
      "how are you?",
      [],
      "recall",
    ),
    // The typed translate of «me llamo Ana» that stood here was CUT, not
    // converted: typed production is banned at beginner tier (Spencer,
    // fr m1 L9 walk 2026-08-21 — spelling isn't taught yet), and this
    // lesson already builds the same sentence from tiles at step 2, so a
    // converted build would be a same-lesson duplicate.
    cloze(
      "es-m2v2-10-cloze-maestra",
      "ella es",
      "",
      "maestra",
      ["maestra", "maestro"],
      "she is a teacher",
      "ella es maestra",
      "The chain agrees: ella … maestra.",
    ),
    build(
      // A build, not a word_map — intro scaffolding has no place in a
      // lesson titled 'Prove it' (retention walk N4).
      "es-m2v2-10-build-soydeespana",
      "Build: 'I'm from Spain'",
      "soy de España",
      ["soy", "de", "España", "eres", "me"],
      ["soy", "de", "España"],
    ),
    {
      id: "es-m2v2-10-hear-eeuu",
      type: "word_image_mcq",
      meaningEn: "Estados Unidos",
      options: [
        { id: "correct", word: "Estados Unidos", emoji: "🇺🇸" },
        { id: "o1", word: "México", emoji: "🇲🇽" },
        { id: "o2", word: "España", emoji: "🇪🇸" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      "es-m2v2-10-speak-soydemexico",
      "soy de México",
      "I'm from Mexico",
      [],
      "recall",
    ),
    cloze(
      "es-m2v2-10-cloze-yo",
      "",
      "soy Ana",
      "yo",
      ["yo", "tú", "él", "ella"],
      "I am Ana",
      "yo soy Ana",
      "«yo» — I. The others would need different verb forms.",
    ),
    {
      id: "es-m2v2-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-senor", source: "señor", target: "Mr. / sir" },
        { id: "p-maestro", source: "maestro", target: "teacher (m)" },
        { id: "p-estudiante", source: "estudiante", target: "student" },
        { id: "p-noentiendo", source: "no entiendo", target: "I don't understand" },
        { id: "p-tellamas", source: "¿cómo te llamas?", target: "what's your name?" },
        { id: "p-ytu", source: "¿y tú?", target: "and you?" },
      ],
    },
    {
      // THE MODULE ENDS ON A STRANGER — the skills leave the script.
      id: "es-m2v2-10-sim-maria",
      type: "dialogue_sim",
      scene: {
        emoji: "🚌",
        title: "A new student on the bus",
        setting: "She sits down next to you. You've never met.",
      },
      exercisedAtomIds: [],
      explanation:
        "A stranger, a full exchange, zero panic — and she answered your «¿y tú?» before the bus reached her stop: «Adiós, Sam. Hasta luego.» Module 3 gives you the next thing she'll ask about: what you like.",
      turns: [
        {
          id: "t1-nombre",
          npc: {
            speaker: "María",
            kana: "¡Hola! ¿Cómo te llamas?",
            audioText: "¿cómo te llamas?",
            gloss: "Hi! What's your name?",
          },
          goal: "Tell her.",
          reply: {
            mode: "choice",
            options: [
              { id: "mellamo", text: "me llamo Sam" },
              { id: "tellamas", text: "te llamas Sam" },
              { id: "adios", text: "adiós" },
            ],
            correctOptionId: "mellamo",
            audioText: "me llamo Sam",
          },
          replyGloss: "My name is Sam.",
        },
        {
          id: "t2-checkin",
          npc: {
            speaker: "María",
            kana: "Mucho gusto, Sam. ¿Cómo estás?",
            audioText: "¿cómo estás?",
            gloss: "Nice to meet you, Sam. How are you?",
          },
          goal: "Full answer — bounce it back.",
          reply: {
            mode: "choice",
            options: [
              { id: "full", text: "bien gracias ¿y tú?" },
              { id: "bien", text: "bien" },
              { id: "nogracias", text: "no gracias" },
            ],
            correctOptionId: "full",
            alsoCorrectOptionIds: ["bien"],
            audioText: "bien gracias ¿y tú?",
          },
          replyGloss: "Fine thanks — and you?",
        },
        {
          id: "t3-origen",
          npc: {
            speaker: "María",
            kana: "¡Bien! Soy de España. ¿Y tú? ¿De dónde eres?",
            audioText: "¿de dónde eres?",
            gloss: "Great! I'm from Spain — and you? Where are you from?",
          },
          goal: "Tell her — she answered yours first.",
          reply: {
            mode: "build",
            tiles: ["soy", "de", "Estados", "Unidos", "llamo"],
            answer: "soy de Estados Unidos",
            audioText: "soy de Estados Unidos",
          },
          replyGloss: "I'm from the United States.",
        },
      ],
    },
  ];
}

const ES_M2_1: LessonContent = {
  id: "es-m2-1",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Never get knocked over by '¿Cómo estás?'",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const ES_M2_2: LessonContent = {
  id: "es-m2-2",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Say your name, ask for theirs",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const ES_M2_3: LessonContent = {
  id: "es-m2-3",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "The escape phrase — and señor, señora",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const ES_M2_4: LessonContent = {
  id: "es-m2-4",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "I am, you are",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const ES_M2_5: LessonContent = {
  id: "es-m2-5",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "He and she",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const ES_M2_6: LessonContent = {
  id: "es-m2-6",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Say where you're from",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const ES_M2_7: LessonContent = {
  id: "es-m2-7",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "The -o/-a switch, on people",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const ES_M2_8: LessonContent = {
  id: "es-m2-8",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "✓ Checkpoint · Warm up for the café",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const ES_M2_9: LessonContent = {
  id: "es-m2-9",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "The café conversation",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const ES_M2_10: LessonContent = {
  id: "es-m2-10",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Prove it — on a stranger",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const ES_M2_LESSONS: LessonContent[] = [
  ES_M2_1,
  ES_M2_2,
  ES_M2_3,
  ES_M2_4,
  ES_M2_5,
  ES_M2_6,
  ES_M2_7,
  ES_M2_8,
  ES_M2_9,
  ES_M2_10,
];

/** 1-based position of the zero-new checkpoint lesson. */
export const ES_M2_CHECKPOINT_INDEX = 8;

export const ES_M2_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
  {
    id: "pt-es-screen-m2",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-es-screen-m2",
        prompt: "Complete: 'Yo ___ estudiante.'",
        correctText: "soy",
        distractorsText: ["eres", "es", "de"],
      }),
  },
  ],
  byModule: [
  {
    id: "pt-es-m2-1",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-es-m2-1",
        prompt: "'My name is Ana' — pick the Spanish.",
        correctText: "me llamo Ana",
        distractorsText: ["te llamas Ana", "me llamas Ana", "yo llamo Ana"],
      }),
  },
  {
    id: "pt-es-m2-2",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-es-m2-2",
        prompt: "Someone asks «¿Cómo estás?» — pick a natural reply.",
        correctText: "bien gracias",
        distractorsText: ["me llamo Ana", "adiós", "sí por favor"],
      }),
  },
  {
    id: "pt-es-m2-3",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-es-m2-3",
        prompt: "'I'm from Spain' — pick the Spanish.",
        correctText: "soy de España",
        distractorsText: ["eres de España", "soy y España", "de soy España"],
      }),
  },
  {
    id: "pt-es-m2-4",
    moduleId: "m2",
    build: () =>
      sentenceMcq({
        id: "pt-es-m2-4",
        prompt: "'He is a teacher' — pick the correct form.",
        correctText: "él es maestro",
        distractorsText: ["él es maestra", "ella es maestro", "él soy maestro"],
      }),
  },
  ],
};
