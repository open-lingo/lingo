/**
 * m1.ts — Sons et salutations — the §13-doctrine hand-authored module.
 *
 * PROMOTED 2026-08-21 from `features/lesson/dev/frM1Lessons.ts` after the
 * zero-French learner-sim pass and Spencer's own walk (which doubled as the
 * Denise voice audition — passed). The 2026-08-19 IR module it replaces is
 * in `_archive/`. Mirrors the ES m1 spine; French sound debt paid inline
 * (silent finals, oi=wah, the French u, nasal respellings).
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
  matchPairs,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";


export const FR_M1_ATOMS: FrAtom[] = [
  atom({ surface: "bonjour", meaningEn: "hello / good day", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🙋", hint: "bohn-ZHOOR — the on is nasal, the n is not spoken" }),
  atom({ surface: "salut", meaningEn: "hi / bye (casual)", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "👋", hint: "the final t is silent: sa-LU" }),
  atom({ surface: "ça va", meaningEn: "how's it going? / it's going fine", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "💬", hint: "sa VA — the same two words ask and answer" }),
  atom({ surface: "merci", meaningEn: "thank you", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🙏", hint: "mehr-SEE" }),
  atom({ surface: "merci beaucoup", meaningEn: "thank you very much", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "💐", hint: "beaucoup = boh-KOO — eau says oh, ou says oo, the p is silent" }),
  atom({ surface: "s'il vous plaît", meaningEn: "please", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🤲", hint: "seel voo PLEH — s'il is si + il squeezed into one word" }),
  atom({ surface: "pardon", meaningEn: "excuse me / sorry", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🙇", hint: "par-DOHN — nasal ending, the n is not spoken" }),
  atom({ surface: "oui", meaningEn: "yes", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "✅", hint: "sounds like 'we'" }),
  atom({ surface: "non", meaningEn: "no", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "❌", hint: "nohn — nasal, the n is not spoken" }),
  atom({ surface: "au revoir", meaningEn: "goodbye", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🚶", hint: "oh ruh-VWAR" }),
  atom({ surface: "à bientôt", meaningEn: "see you soon", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🔜", hint: "ah byan-TOH — en is nasal, the final t is silent" }),
  atom({ surface: "bonsoir", meaningEn: "good evening", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🌆", hint: "bohn-SWAR — oi says wah" }),
  atom({ surface: "bonne nuit", meaningEn: "good night", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🌙", hint: "bun NWEE — ui glides like wee, the t is silent" }),
  atom({ surface: "enchanté", meaningEn: "nice to meet you", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🤝", hint: "on-shon-TAY — both n's are nasal vowels" }),
  atom({ surface: "zéro", meaningEn: "zero", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "0️⃣", hint: "zay-RO" }),
  atom({ surface: "un", meaningEn: "one", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "1️⃣", hint: "one nasal sound: uh(n)" }),
  atom({ surface: "deux", meaningEn: "two", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "2️⃣", hint: "duh — the x is silent" }),
  atom({ surface: "trois", meaningEn: "three", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "3️⃣", hint: "trwah — oi says wah, the s is silent" }),
  atom({ surface: "quatre", meaningEn: "four", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "4️⃣", hint: "KAT-ruh" }),
  atom({ surface: "cinq", meaningEn: "five", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "5️⃣", hint: "sank — the q IS spoken" }),
  atom({ surface: "six", meaningEn: "six", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "6️⃣", hint: "seess — the final x sounds like s" }),
  atom({ surface: "sept", meaningEn: "seven", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "7️⃣", hint: "set — the p is silent, the t is spoken" }),
  atom({ surface: "huit", meaningEn: "eight", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "8️⃣", hint: "weet — the h is silent", consonantOnset: true }),
  atom({ surface: "neuf", meaningEn: "nine", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "9️⃣", hint: "nuhf — the f is spoken" }),
  atom({ surface: "dix", meaningEn: "ten", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🔟", hint: "deess — the final x sounds like s" }),
  atom({ surface: "et", meaningEn: "and", partOfSpeech: "particle", fromModule: "m1", kind: "particle", hint: "ay — the t never sounds, ever" }),
  atom({ surface: "ou", meaningEn: "or", partOfSpeech: "particle", fromModule: "m1", kind: "particle", hint: "oo" }),
  atom({ surface: "bon", meaningEn: "good (masculine)", partOfSpeech: "other", fromModule: "m1", kind: "vocab", hint: "bohn — the half that builds bonjour and bonsoir; «bonne» is its feminine" }),
  atom({ surface: "soir", meaningEn: "evening", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", gender: "m", hint: "swar — the half inside bonsoir" }),
  atom({ surface: "et", meaningEn: "and", partOfSpeech: "particle", fromModule: "m1", kind: "particle", hint: "ay — the t is silent" }),
  atom({ surface: "ou", meaningEn: "or", partOfSpeech: "particle", fromModule: "m1", kind: "particle", hint: "oo" }),
  atom({ surface: "café", meaningEn: "coffee", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", gender: "m", emoji: "☕", hint: "ka-FAY" }),
];

/** L1 — Say hello, and no politely. Five debuts, the silent-letter
 *  promise cashed by ear, first sentence mapped→heard→spoken, ends on
 *  the win. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m1v2-1-info-silent",
      "French hides its letters",
      "Nine short lessons from now, you'll hold your first French conversation. The secret that unlocks the sound of French: spelling hides sounds — final letters often go quiet, and you'll HEAR which ones as you go. First word: «bonjour» — hello — bohn-ZHOOR. (In our sound-spellings, CAPITALS mark the stressed part.)",
      "grammar",
    ),
    vocabMcq(
      "fr-m1v2-1-img-bonjour",
      { surface: "bonjour", meaningEn: "hello", emoji: "🙋" },
      [
        { surface: "au revoir", emoji: "🚪" },
        { surface: "merci", emoji: "🙏" },
        { surface: "oui", emoji: "✅" },
      ],
    ),
    speaking("fr-m1v2-1-speak-bonjour", "bonjour", "hello", ["bonjour"]),
    vocabMcq(
      "fr-m1v2-1-img-aurevoir",
      { surface: "au revoir", meaningEn: "goodbye", emoji: "🚪" },
      [
        { surface: "bonjour", emoji: "🙋" },
        { surface: "merci", emoji: "🙏" },
        { surface: "non", emoji: "❌" },
      ],
    ),
    speaking("fr-m1v2-1-speak-aurevoir", "au revoir", "goodbye", ["au revoir"]),
    vocabMcq(
      "fr-m1v2-1-img-merci",
      { surface: "merci", meaningEn: "thank you", emoji: "🙏" },
      [
        { surface: "bonjour", emoji: "🙋" },
        { surface: "au revoir", emoji: "🚪" },
        { surface: "oui", emoji: "✅" },
      ],
    ),
    speaking("fr-m1v2-1-speak-merci", "merci", "thank you", ["merci"]),
    vocabMcq(
      "fr-m1v2-1-img-oui",
      { surface: "oui", meaningEn: "yes", emoji: "✅" },
      [
        { surface: "non", emoji: "❌" },
        { surface: "merci", emoji: "🙏" },
        { surface: "au revoir", emoji: "🚪" },
      ],
    ),
    listeningCompSentence({
      // The silent-letter card CASHES here (R6): oh ruh-VWAR, pure ear,
      // and a retrieval separated from its debut (R8).
      id: "fr-m1v2-1-lc-aurevoir",
      audioText: "au revoir",
      correctMeaningEn: "Goodbye",
      distractorsEn: ["Thank you", "Hello", "Yes"],
    }),
    vocabMcq(
      // «non» gets a real debut — no cognate is load-bearing (§13.5).
      "fr-m1v2-1-img-non",
      { surface: "non", meaningEn: "no", emoji: "❌" },
      [
        { surface: "oui", emoji: "✅" },
        { surface: "merci", emoji: "🙏" },
        { surface: "bonjour", emoji: "🙋" },
      ],
    ),
    {
      id: "fr-m1v2-1-map-nonmerci",
      type: "word_map",
      tokens: ["non", "merci"],
      pairs: [
        { en: "no", tokenIndex: 0 },
        { en: "thank you", tokenIndex: 1 },
      ],
      audioText: "non merci",
      revealNote:
        "«non merci» — the polite way to turn anything down. Nohn mehr-SEE: both final letters quieter than English would make them.",
    },
    listeningCompSentence({
      id: "fr-m1v2-1-lc-nonmerci",
      audioText: "non merci",
      correctMeaningEn: "No, thank you.",
      distractorsEn: ["Yes, please.", "Hello!", "Goodbye!"],
    }),
    {
      // The oui/non EAR check — audio prompt, zero reading.
      id: "fr-m1v2-1-hear-oui",
      type: "word_image_mcq",
      meaningEn: "oui",
      options: [
        { id: "correct", word: "oui", emoji: "✅" },
        { id: "o1", word: "non", emoji: "❌" },
        { id: "o2", word: "merci", emoji: "🙏" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m1v2-1-match-close",
      type: "match_pairs",
      prompt: "Match everything you just learned.",
      pairs: [
        { id: "p-bonjour", source: "bonjour", target: "hello" },
        { id: "p-aurevoir", source: "au revoir", target: "goodbye" },
        { id: "p-merci", source: "merci", target: "thank you" },
        { id: "p-oui", source: "oui", target: "yes" },
        { id: "p-non", source: "non", target: "no" },
      ],
    },
    // WIN: produce the first sentence — printed first voicing (§13.9).
    speaking("fr-m1v2-1-speak-nonmerci", "non merci", "no, thank you", [
      "non",
      "merci",
    ]),
  ];
}

/** L2 — Ask nicely, apologize smoothly. Both sims self-cueing; beaucoup
 *  debuts by map elimination; ends recalling «non merci». */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m1v2-2-info-courtesy",
      "Two polite tools",
      "«s'il vous plaît» — please (seel voo PLEH, three words that behave like one) — and «pardon» — sorry / excuse me (par-DOHN, the n hiding in the vowel again).",
      "grammar",
    ),
    vocabMcq(
      "fr-m1v2-2-img-svp",
      { surface: "s'il vous plaît", meaningEn: "please", emoji: "🤲" },
      [
        { surface: "merci", emoji: "🙏" },
        { surface: "bonjour", emoji: "🙋" },
        { surface: "au revoir", emoji: "🚪" },
      ],
    ),
    speaking("fr-m1v2-2-speak-svp", "s'il vous plaît", "please", [
      "s'il vous plaît",
    ]),
    {
      id: "fr-m1v2-2-map-ouisvp",
      type: "word_map",
      tokens: ["oui", "s'il vous plaît"],
      pairs: [
        { en: "yes", tokenIndex: 0 },
        { en: "please", tokenIndex: 1 },
      ],
      audioText: "oui s'il vous plaît",
      revealNote:
        "«oui s'il vous plaît» — yes, please. You now own both polite answers: this one and «non merci».",
    },
    listeningCompSentence({
      id: "fr-m1v2-2-lc-ouisvp",
      audioText: "oui s'il vous plaît",
      correctMeaningEn: "Yes, please.",
      distractorsEn: ["No, thank you.", "Sorry!", "Good evening."],
    }),
    {
      // Self-cueing offer (§13.6) — and «un» plants next lesson's seed.
      id: "fr-m1v2-2-sim-cafe",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Léa offers you a coffee" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cafe",
          npc: {
            speaker: "Léa",
            kana: "Un café ?",
            audioText: "un café ?",
            gloss: "A coffee?",
          },
          goal: "Answer — either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouisvp", text: "oui s'il vous plaît" },
              { id: "nonmerci", text: "non merci" },
              { id: "bonjour", text: "bonjour" },
            ],
            correctOptionId: "ouisvp",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "oui s'il vous plaît",
          },
          replyGloss: "Yes, please.",
          explanation:
            "A real offer has two right answers. And «un café» is literally 'ONE coffee' — you'll meet «un» again in two lessons.",
        },
      ],
    },
    speaking("fr-m1v2-2-speak-ouisvp", "oui s'il vous plaît", "yes, please", [
      "oui",
      "s'il vous plaît",
    ]),
    {
      // «Aïe !» demands an apology in any language — pardon's honest
      // self-cueing debut (spoken by a stranger; Hugo debuts later).
      id: "fr-m1v2-2-sim-pardon",
      type: "dialogue_sim",
      scene: { emoji: "🚇", title: "A crowded platform" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-pardon",
          npc: {
            speaker: "A stranger",
            kana: "Aïe !",
            audioText: "aïe",
            gloss: "Ouch!",
          },
          goal: "Apologize.",
          reply: {
            mode: "choice",
            options: [
              { id: "pardon", text: "pardon" },
              { id: "svp", text: "s'il vous plaît" },
              { id: "merci", text: "merci" },
            ],
            correctOptionId: "pardon",
            audioText: "pardon",
          },
          replyGloss: "Sorry!",
          explanation:
            "«pardon» — sorry / excuse me. par-DOHN. It also works to get someone's attention or slip through a crowd.",
        },
      ],
    },
    speaking("fr-m1v2-2-speak-pardon", "pardon", "sorry", ["pardon"]),
    {
      // «beaucoup» debuts by elimination, prompted LAST — merci known.
      id: "fr-m1v2-2-map-mercibeaucoup",
      type: "word_map",
      tokens: ["merci", "beaucoup"],
      pairs: [
        { en: "thank you", tokenIndex: 0 },
        { en: "very much", tokenIndex: 1 },
      ],
      audioText: "merci beaucoup",
      revealNote:
        "«merci beaucoup» — thanks a lot. boh-KOO: eau says 'oh', ou says 'oo', and the p is (of course) silent.",
    },
    {
      // TAIL: L1 by ear.
      id: "fr-m1v2-2-hear-bonjour",
      type: "word_image_mcq",
      meaningEn: "bonjour",
      options: [
        { id: "correct", word: "bonjour", emoji: "🙋" },
        { id: "o1", word: "au revoir", emoji: "🚪" },
        { id: "o2", word: "merci", emoji: "🙏" },
      ],
      correctOptionId: "correct",
    },
    matchPairs("fr-m1v2-2", [
      "s'il vous plaît",
      "pardon",
      "merci beaucoup",
      "bonjour",
      "oui",
      "non",
    ]),
    // WIN: recall the L1 sentence from English alone (2nd voicing).
    speaking(
      "fr-m1v2-2-speak-nonmerci-recall",
      "non merci",
      "no, thank you",
      ["non", "merci"],
      "recall",
    ),
  ];
}

/** L3 — Evening, night, and the word that goes both ways. bon/bonne met
 *  as fused-vs-separate; «never bon nuit» is the counterexample. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m1v2-3-info-soir",
      "Evening, night — and salut",
      "«bonsoir» — good evening — bon + «soir» (evening), said bohn-SWAR: oi says 'wah' (it does in «au revoir» too — oh ruh-VWAR). «bonne nuit» — good night. The shapes: bonJOUR and bonSOIR are ONE word each, but night takes TWO — «bonne nuit», never «bon nuit». And «salut» — hi or bye, casual, coming AND going: sa-LU, with the famous French u — say 'ee' and round your lips.",
      "grammar",
    ),
    vocabMcq(
      "fr-m1v2-3-img-bonsoir",
      { surface: "bonsoir", meaningEn: "good evening", emoji: "🌆" },
      [
        { surface: "bonne nuit", emoji: "🌙" },
        { surface: "salut", emoji: "👋" },
        { surface: "bonjour", emoji: "🙋" },
      ],
    ),
    listeningCompSentence({
      id: "fr-m1v2-3-lc-bonsoir",
      audioText: "bonsoir",
      correctMeaningEn: "Good evening.",
      distractorsEn: ["Good night.", "Hi.", "Goodbye."],
    }),
    {
      id: "fr-m1v2-3-map-bonnenuit",
      type: "word_map",
      tokens: ["bonne", "nuit"],
      pairs: [
        { en: "good", tokenIndex: 0 },
        { en: "night", tokenIndex: 1 },
      ],
      audioText: "bonne nuit",
      // The agreement chain in pink — «nuit» is feminine, and «bonne»
      // dressed to match (§13.4: seen, not announced).
      tokenGenders: { 0: "f", 1: "f" },
      revealNote:
        "«nuit» is a she-word, and 'good' dressed to match: bonne — bun NWEE. That's why both chips glow pink with a little f: French sorts words into pink-f and blue-m families, and the colors will quietly track it from here on.",
    },
    speaking("fr-m1v2-3-speak-bonnenuit", "bonne nuit", "good night", [
      "bonne nuit",
    ]),
    cloze(
      // bon/bonne trial — «soir» live: picking it means «bon nuit»-style
      // thinking, and the explanation names the counterexample.
      "fr-m1v2-3-cloze-nuit",
      "bonne",
      "",
      "nuit",
      ["nuit", "soir"],
      "good night",
      "bonne nuit",
      "«soir» would need «bon» — and fuses into one word: bonsoir. Night keeps its two: «bonne nuit», never «bon nuit».",
    ),
    vocabMcq(
      "fr-m1v2-3-img-salut",
      { surface: "salut", meaningEn: "hi / bye (casual)", emoji: "👋" },
      [
        { surface: "bonjour", emoji: "🙋" },
        { surface: "au revoir", emoji: "🚪" },
        { surface: "merci", emoji: "🙏" },
      ],
    ),
    speaking("fr-m1v2-3-speak-salut", "salut", "hi (casual)", ["salut"]),
    {
      // Evening pair by EAR — bonsoir live.
      id: "fr-m1v2-3-hear-bonnenuit",
      type: "word_image_mcq",
      meaningEn: "bonne nuit",
      options: [
        { id: "correct", word: "bonne nuit", emoji: "🌙" },
        { id: "o1", word: "bonsoir", emoji: "🌆" },
        { id: "o2", word: "bonjour", emoji: "🙋" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      // TAIL: pardon's first audio retrieval (R8).
      id: "fr-m1v2-3-lc-pardon",
      audioText: "pardon",
      correctMeaningEn: "Sorry!",
      distractorsEn: ["Please.", "Thank you.", "Hello."],
    }),
    matchPairs("fr-m1v2-3", [
      "bonsoir",
      "bonne nuit",
      "salut",
      "bonjour",
      "au revoir",
      "merci",
    ]),
    // WIN: the greeting you'll use tonight — printed first voicing.
    speaking("fr-m1v2-3-speak-bonsoir", "bonsoir", "good evening", ["bonsoir"]),
  ];
}

/** L4 — Count to four, and see you soon. Audio-prompted digit debuts
 *  (the m1v2 law — never a digit under an English prompt); the
 *  à-bientôt sim is the interleave break. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m1v2-4-info-count4",
      "One to four — and a warmer goodbye",
      "«un, deux, trois, quatre» — one to four (uh(n), duh, trwah, KAT-ruh — those quiet last letters again). And a goodbye for people you'll see again: «à bientôt» — see you soon — ah byan-TOH.",
      "grammar",
    ),
    {
      // Audio-prompted debut: the clip is the question; tap options to
      // hear their words and match the sound (language-agnostic).
      id: "fr-m1v2-4-hear-un",
      type: "word_image_mcq",
      meaningEn: "un",
      options: [
        { id: "correct", word: "un", emoji: "1️⃣" },
        { id: "o1", word: "deux", emoji: "2️⃣" },
        { id: "o2", word: "trois", emoji: "3️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m1v2-4-speak-un", "un", "one", ["un"]),
    {
      id: "fr-m1v2-4-hear-deux",
      type: "word_image_mcq",
      meaningEn: "deux",
      options: [
        { id: "correct", word: "deux", emoji: "2️⃣" },
        { id: "o1", word: "un", emoji: "1️⃣" },
        { id: "o2", word: "trois", emoji: "3️⃣" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m1v2-4-map-undeuxtrois",
      type: "word_map",
      tokens: ["un", "deux", "trois"],
      pairs: [
        { en: "one", tokenIndex: 0 },
        { en: "two", tokenIndex: 1 },
        { en: "three", tokenIndex: 2 },
      ],
      audioText: "un, deux, trois",
      revealNote:
        "«trois» arrived free — you knew the other two. One more: quatre.",
    },
    {
      // The interleave break: a person, mid-numbers (§13.9 law 9).
      id: "fr-m1v2-4-sim-abientot",
      type: "dialogue_sim",
      scene: {
        emoji: "🚪",
        title: "Léa heads out",
        setting: "She'll be back tomorrow.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-abientot",
          npc: {
            speaker: "Léa",
            kana: "Au revoir !",
            audioText: "au revoir",
            gloss: "Bye!",
          },
          goal: "Send her off — she's back tomorrow.",
          reply: {
            mode: "choice",
            options: [
              { id: "abientot", text: "à bientôt" },
              { id: "nonmerci", text: "non merci" },
              { id: "bonjour", text: "bonjour" },
            ],
            correctOptionId: "abientot",
            audioText: "à bientôt",
          },
          replyGloss: "See you soon.",
          explanation:
            "«à bientôt» — see you soon, for people who'll be back. ah byan-TOH: nasal middle, silent t.",
        },
      ],
    },
    speaking("fr-m1v2-4-speak-abientot", "à bientôt", "see you soon", [
      "à bientôt",
    ]),
    {
      id: "fr-m1v2-4-hear-quatre",
      type: "word_image_mcq",
      meaningEn: "quatre",
      options: [
        { id: "correct", word: "quatre", emoji: "4️⃣" },
        { id: "o1", word: "trois", emoji: "3️⃣" },
        { id: "o2", word: "un", emoji: "1️⃣" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("fr-m1v2-4-mc-trois", "trois", ["deux", "un", "quatre"]),
    // TAIL: L2 courtesy — cued recall, 2nd voicing.
    speaking(
      "fr-m1v2-4-speak-svp-recall",
      "s'il vous plaît",
      "please",
      ["s'il vous plaît"],
      "recall",
    ),
    matchPairs("fr-m1v2-4", [
      "un",
      "trois",
      "à bientôt",
      "bonjour",
      "pardon",
      "non",
    ]),
    // WIN: count to four out loud — printed first voicing of the run.
    speaking(
      "fr-m1v2-4-speak-count",
      "un, deux, trois, quatre",
      "one, two, three, four",
      ["un", "deux", "trois", "quatre"],
    ),
  ];
}

/** L5 — Zero, five, six, seven — nice to meet you. The card cashes on
 *  «zéro»; the enchanté MIRROR sim is the interleave break. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m1v2-5-info-sounds",
      "Four more numbers — say what you see? Never.",
      "«zéro, cinq, six, sept» — zero, five, six, seven: zay-RO, sank (the q speaks!), seess, set (the p hides). Numbers are the LOUD exception to the quiet-letter habit. And when someone says «enchanté» — nice to meet you, on-shon-TAY — you say it right back.",
      "grammar",
    ),
    listeningCompSentence({
      // The card CASHES immediately: hear «zéro», card-fed.
      id: "fr-m1v2-5-lc-zero",
      audioText: "zéro",
      correctMeaningEn: "Zero",
      distractorsEn: ["Five", "Four", "Two"],
    }),
    {
      id: "fr-m1v2-5-hear-cinq",
      type: "word_image_mcq",
      meaningEn: "cinq",
      options: [
        { id: "correct", word: "cinq", emoji: "5️⃣" },
        { id: "o1", word: "zéro", emoji: "0️⃣" },
        { id: "o2", word: "quatre", emoji: "4️⃣" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m1v2-5-map-zerotroiscinq",
      type: "word_map",
      tokens: ["zéro", "trois", "cinq"],
      pairs: [
        { en: "zero", tokenIndex: 0 },
        { en: "three", tokenIndex: 1 },
        { en: "five", tokenIndex: 2 },
      ],
      audioText: "zéro, trois, cinq",
      revealNote:
        "A phone number's worth of French digits, read with your own eyes.",
    },
    {
      // Interleave break — a MIRROR exchange (§13.6): «enchanté» is
      // answered with itself. Hugo's proper debut.
      id: "fr-m1v2-5-sim-enchante",
      type: "dialogue_sim",
      scene: {
        emoji: "🤝",
        title: "A friend of Léa's",
        setting: "You're introduced for the first time.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-enchante",
          npc: {
            speaker: "Hugo",
            kana: "Enchanté.",
            audioText: "enchanté",
            gloss: "Nice to meet you.",
          },
          goal: "Say it back.",
          reply: {
            mode: "choice",
            options: [
              { id: "enchante", text: "enchanté" },
              { id: "abientot", text: "à bientôt" },
              { id: "svp", text: "s'il vous plaît" },
            ],
            correctOptionId: "enchante",
            audioText: "enchanté",
          },
          replyGloss: "Nice to meet you.",
          explanation:
            "«enchanté» — literally 'enchanted'. on-shon-TAY, both n's melting into the vowels. Said right back, every time.",
        },
      ],
    },
    speaking("fr-m1v2-5-speak-enchante", "enchanté", "nice to meet you", [
      "enchanté",
    ]),
    {
      id: "fr-m1v2-5-hear-six",
      type: "word_image_mcq",
      meaningEn: "six",
      options: [
        { id: "correct", word: "six", emoji: "6️⃣" },
        { id: "o1", word: "sept", emoji: "7️⃣" },
        { id: "o2", word: "cinq", emoji: "5️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m1v2-5-speak-six", "six", "six", ["six"]),
    {
      id: "fr-m1v2-5-hear-sept",
      type: "word_image_mcq",
      meaningEn: "sept",
      options: [
        { id: "correct", word: "sept", emoji: "7️⃣" },
        { id: "o1", word: "six", emoji: "6️⃣" },
        { id: "o2", word: "cinq", emoji: "5️⃣" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("fr-m1v2-5-mc-quatre", "quatre", ["cinq", "deux", "trois"]),
    // TAIL: L3 — cued recall (2nd voicing of bonsoir).
    speaking(
      "fr-m1v2-5-speak-bonsoir-recall",
      "bonsoir",
      "good evening",
      ["bonsoir"],
      "recall",
    ),
    matchPairs("fr-m1v2-5", [
      "zéro",
      "six",
      "enchanté",
      "au revoir",
      "merci",
      "deux",
    ]),
    // WIN: the counting run grows to five — printed first voicing.
    speaking(
      "fr-m1v2-5-speak-count",
      "un, deux, trois, quatre, cinq",
      "one, two, three, four, five",
      ["un", "deux", "trois", "quatre", "cinq"],
    ),
  ];
}

/** L6 — Eight, nine, ten; and, or — with the ça-va mirror as the break.
 *  «et» and «ou» debut inside sentences; «neuf» by map elimination. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m1v2-6-info-count10",
      "Eight, nine, ten — and the two smallest words",
      "«huit, neuf, dix» — eight, nine, ten (weet — the h is silent; nuhf; deess). The two smallest words in French: «et» — 'and', said 'ay', its t NEVER sounds — and «ou» — 'or', said 'oo'. Plus the daily check-in: «Ça va ?» — how's it going? — sa VA. The SAME two words answer it.",
      "grammar",
    ),
    {
      id: "fr-m1v2-6-hear-huit",
      type: "word_image_mcq",
      meaningEn: "huit",
      options: [
        { id: "correct", word: "huit", emoji: "8️⃣" },
        { id: "o1", word: "neuf", emoji: "9️⃣" },
        { id: "o2", word: "dix", emoji: "🔟" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m1v2-6-speak-huit", "huit", "eight", ["huit"]),
    {
      // «et» debuts by elimination between two L5 numbers.
      id: "fr-m1v2-6-map-sixetsept",
      type: "word_map",
      tokens: ["six", "et", "sept"],
      pairs: [
        { en: "six", tokenIndex: 0 },
        { en: "and", tokenIndex: 1 },
        { en: "seven", tokenIndex: 2 },
      ],
      audioText: "six et sept",
      revealNote:
        "«et» — 'and', said 'ay'. Its t is the quietest letter in France: it NEVER sounds.",
    },
    listeningCompSentence({
      id: "fr-m1v2-6-lc-sixetsept",
      audioText: "six et sept",
      correctMeaningEn: "Six and seven",
      distractorsEn: ["Six or seven", "Seven and eight", "Six and six"],
    }),
    {
      // «neuf» debuts by MAP elimination, prompted last.
      id: "fr-m1v2-6-map-huitetneuf",
      type: "word_map",
      tokens: ["huit", "et", "neuf"],
      pairs: [
        { en: "eight", tokenIndex: 0 },
        { en: "and", tokenIndex: 1 },
        { en: "nine", tokenIndex: 2 },
      ],
      audioText: "huit et neuf",
      revealNote: "«neuf» arrived by elimination — nine. One to go: dix.",
    },
    {
      id: "fr-m1v2-6-hear-dix",
      type: "word_image_mcq",
      meaningEn: "dix",
      options: [
        { id: "correct", word: "dix", emoji: "🔟" },
        { id: "o1", word: "neuf", emoji: "9️⃣" },
        { id: "o2", word: "huit", emoji: "8️⃣" },
      ],
      correctOptionId: "correct",
    },
    // «dix» gets a printed voicing — mastery recalls it from English.
    speaking("fr-m1v2-6-speak-dix", "dix", "ten", ["dix"]),
    {
      // The interleave break — and French's friendliest trick: the same
      // two words ask AND answer.
      id: "fr-m1v2-6-sim-cava",
      type: "dialogue_sim",
      scene: { emoji: "💬", title: "Léa checks in" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cava",
          npc: {
            speaker: "Léa",
            kana: "Ça va ?",
            audioText: "ça va",
            gloss: "How's it going?",
          },
          goal: "Answer her.",
          reply: {
            mode: "choice",
            options: [
              { id: "cava", text: "ça va" },
              { id: "nonmerci", text: "non merci" },
              { id: "aurevoir", text: "au revoir" },
            ],
            correctOptionId: "cava",
            audioText: "ça va",
          },
          replyGloss: "It's going fine.",
          explanation:
            "«ça va» asks the question AND answers it — same two words, sa VA. The friendliest trick in French.",
        },
      ],
    },
    {
      // «ou» debuts by elimination — the same path «et» took.
      id: "fr-m1v2-6-map-quatreoucinq",
      type: "word_map",
      tokens: ["quatre", "ou", "cinq"],
      pairs: [
        { en: "four", tokenIndex: 0 },
        { en: "or", tokenIndex: 1 },
        { en: "five", tokenIndex: 2 },
      ],
      audioText: "quatre ou cinq",
      revealNote:
        "«ou» — 'or'. So «et» joins and «ou» chooses: six et sept, quatre ou cinq.",
    },
    listeningCompSentence({
      id: "fr-m1v2-6-lc-quatreoucinq",
      audioText: "quatre ou cinq",
      correctMeaningEn: "Four or five",
      distractorsEn: ["Four and five", "Four or four", "Five or six"],
    }),
    cloze(
      "fr-m1v2-6-cloze-ou",
      "huit",
      "neuf",
      "ou",
      ["ou", "et", "oui", "non"],
      "eight or nine",
      "huit ou neuf",
      "«et» joins ('and'); «ou» chooses ('or'). This one is a choice.",
      ["ou"],
    ),
    {
      // TAIL: à bientôt by ear — taught in L4, retrieved here.
      id: "fr-m1v2-6-hear-abientot",
      type: "word_image_mcq",
      meaningEn: "à bientôt",
      options: [
        { id: "correct", word: "à bientôt", emoji: "🔜" },
        { id: "o1", word: "enchanté", emoji: "🤝" },
        { id: "o2", word: "bonjour", emoji: "🙋" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L3 lane, from memory.
    speaking(
      "fr-m1v2-6-speak-salut-recall",
      "salut",
      "hi (casual)",
      ["salut"],
      "recall",
    ),
    matchPairs("fr-m1v2-6", ["dix", "et", "ou", "sept", "bonjour", "pardon"]),
    // WIN: count six to ten — printed first voicing of the run.
    speaking(
      "fr-m1v2-6-speak-count",
      "six, sept, huit, neuf, dix",
      "six, seven, eight, nine, ten",
      ["six", "sept", "huit", "neuf", "dix"],
    ),
  ];
}

/** CHECKPOINT — zero new, sixteen graded retrievals, every French
 *  confusable discriminated by ear: six/dix, un/non, bonsoir/bonne nuit. */
function checkpointLesson(): LessonStep[] {
  return [
    {
      id: "fr-m1v2-r-hear-six",
      type: "word_image_mcq",
      meaningEn: "six",
      options: [
        { id: "correct", word: "six", emoji: "6️⃣" },
        { id: "o1", word: "sept", emoji: "7️⃣" },
        { id: "o2", word: "deux", emoji: "2️⃣" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m1v2-r-cloze-bonne",
      "",
      "nuit",
      "bonne",
      ["bonne", "bon"],
      "good night",
      "bonne nuit",
      "Two words for night — «bonne nuit», never «bon nuit».",
    ),
    speaking("fr-m1v2-r-speak-huit", "huit", "eight", ["huit"], "recall"),
    listeningCompSentence({
      id: "fr-m1v2-r-lc-ouisvp",
      audioText: "oui s'il vous plaît",
      correctMeaningEn: "Yes, please.",
      distractorsEn: ["No, thank you.", "Sorry!", "Good evening."],
    }),
    vocabTextMcq("fr-m1v2-r-mc-neuf", "neuf", ["dix", "deux", "six"]),
    build(
      "fr-m1v2-r-build-bonnenuit",
      "Build: 'good night'",
      "bonne nuit",
      ["bonne", "nuit", "bon", "soir"],
      ["bonne", "nuit"],
    ),
    {
      // THE French ear trial: six vs dix — seess vs deess.
      id: "fr-m1v2-r-hear-dix",
      type: "word_image_mcq",
      meaningEn: "dix",
      options: [
        { id: "correct", word: "dix", emoji: "🔟" },
        { id: "o1", word: "six", emoji: "6️⃣" },
        { id: "o2", word: "deux", emoji: "2️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      // beaucoup had NO voicing anywhere (retention walk) — and the old
      // recall here duplicated L9's translate phrase.
      "fr-m1v2-r-speak-mercibeaucoup",
      "merci beaucoup",
      "thank you very much",
      ["merci beaucoup"],
    ),
    cloze(
      "fr-m1v2-r-cloze-et",
      "six",
      "sept",
      "et",
      ["et", "ou", "oui", "non"],
      "six and seven",
      "six et sept",
      "«et» joins — 'and'.",
      ["et"],
    ),
    listeningCompSentence({
      id: "fr-m1v2-r-lc-abientot",
      audioText: "à bientôt",
      correctMeaningEn: "See you soon.",
      distractorsEn: ["Good night.", "Nice to meet you.", "Please."],
    }),
    build(
      "fr-m1v2-r-build-nonmerci",
      "Build: 'no, thank you'",
      "non merci",
      ["non", "merci", "oui", "pardon"],
      ["non", "merci"],
    ),
    {
      // Evening pair by ear — answer BONSOIR (L3's trial answered bonne
      // nuit; alternation).
      id: "fr-m1v2-r-hear-bonsoir",
      type: "word_image_mcq",
      meaningEn: "bonsoir",
      options: [
        { id: "correct", word: "bonsoir", emoji: "🌆" },
        { id: "o1", word: "bonne nuit", emoji: "🌙" },
        { id: "o2", word: "bonjour", emoji: "🙋" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("fr-m1v2-r-mc-sept", "sept", ["six", "huit", "neuf"]),
    speaking(
      "fr-m1v2-r-speak-count",
      "un, deux, trois, quatre, cinq",
      "one, two, three, four, five",
      ["un", "deux", "trois", "quatre", "cinq"],
      "recall",
    ),
    {
      // The nasal pair: un vs non — uh(n) vs nohn.
      id: "fr-m1v2-r-hear-un",
      type: "word_image_mcq",
      meaningEn: "un",
      options: [
        { id: "correct", word: "un", emoji: "1️⃣" },
        { id: "o1", word: "non", emoji: "❌" },
        { id: "o2", word: "neuf", emoji: "9️⃣" },
      ],
      correctOptionId: "correct",
    },
    matchPairs("fr-m1v2-r", ["pardon", "oui", "non", "un", "huit", "bonne nuit"]),
  ];
}

/** L8 — Your first real conversation, then the retrieval tail over
 *  exactly what it used. */
function lesson8(): LessonStep[] {
  return [
    {
      id: "fr-m1v2-8-sim-parc",
      type: "dialogue_sim",
      scene: {
        emoji: "🌳",
        title: "Au parc — Léa again",
        setting: "She waves you over — she's brought a friend.",
      },
      exercisedAtomIds: [],
      explanation:
        "A whole first conversation: greeting, meeting, a real offer, a warm goodbye — every line from this module.",
      turns: [
        {
          id: "t1-salut",
          npc: {
            speaker: "Léa",
            kana: "Bonjour !",
            audioText: "bonjour",
            gloss: "Hello!",
          },
          goal: "Greet her back.",
          reply: {
            mode: "choice",
            options: [
              { id: "bonjour", text: "bonjour" },
              { id: "nonmerci", text: "non merci" },
              { id: "aurevoir", text: "au revoir" },
            ],
            correctOptionId: "bonjour",
            audioText: "bonjour",
          },
          replyGloss: "Hello!",
        },
        {
          id: "t2-enchante",
          npc: {
            speaker: "Emma",
            kana: "Enchantée.",
            audioText: "enchanté",
            gloss: "Nice to meet you.",
          },
          goal: "Say it back.",
          reply: {
            mode: "choice",
            options: [
              { id: "enchante", text: "enchanté" },
              { id: "abientot", text: "à bientôt" },
              { id: "svp", text: "s'il vous plaît" },
            ],
            correctOptionId: "enchante",
            audioText: "enchanté",
          },
          replyGloss: "Nice to meet you.",
        },
        {
          id: "t3-cafe",
          npc: {
            speaker: "Léa",
            kana: "Un café ? Ou deux ?",
            audioText: "un café ? ou deux ?",
            gloss: "One coffee? Or two?",
          },
          goal: "Answer — either way (or order two!).",
          reply: {
            mode: "build",
            tiles: ["oui", "s'il vous plaît", "non", "merci", "deux"],
            answer: "oui s'il vous plaît",
            // Max-acceptance: every natural reply this bank can build is
            // right (Spencer built «oui deux s'il vous plaît» on his walk
            // and was marked wrong — doctrine: a known natural reply must
            // never be wrong). Bare «merci» stays out: as an answer to an
            // offer it often means polite REFUSAL, a nuance L8 can't grade.
            alsoAccepted: [
              "non merci",
              "deux s'il vous plaît",
              "oui deux s'il vous plaît",
              "oui deux",
              "oui merci",
              "deux",
            ],
            audioText: "oui s'il vous plaît",
          },
          replyGloss: "Yes, please.",
          explanation:
            "Almost any polite answer builds from this bank — «oui», «non merci», or ordering TWO. Your numbers just entered a conversation.",
        },
        {
          id: "t4-aurevoir",
          npc: {
            speaker: "Léa",
            kana: "Au revoir.",
            audioText: "au revoir",
            gloss: "Goodbye.",
          },
          goal: "Say goodbye — either way works.",
          reply: {
            mode: "choice",
            options: [
              { id: "abientot", text: "à bientôt" },
              { id: "aurevoir", text: "au revoir" },
              { id: "svp", text: "s'il vous plaît" },
            ],
            correctOptionId: "abientot",
            alsoCorrectOptionIds: ["aurevoir"],
            audioText: "à bientôt",
          },
          replyGloss: "See you soon.",
        },
      ],
    },
    build(
      "fr-m1v2-8-build-ouisvp",
      "Build: 'yes, please'",
      "oui s'il vous plaît",
      ["oui", "s'il vous plaît", "non", "merci"],
      ["oui", "s'il vous plaît"],
    ),
    {
      id: "fr-m1v2-8-hear-enchante",
      type: "word_image_mcq",
      meaningEn: "enchanté",
      options: [
        { id: "correct", word: "enchanté", emoji: "🤝" },
        { id: "o1", word: "à bientôt", emoji: "🔜" },
        { id: "o2", word: "merci", emoji: "🙏" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m1v2-8-cloze-non",
      "",
      "merci",
      "non",
      ["non", "oui", "et", "ou"],
      "no, thank you",
      "non merci",
      "The polite no: «non merci». («oui» would need «s'il vous plaît».)",
      ["non"],
    ),
    vocabTextMcq("fr-m1v2-8-mc-ou", "ou", ["et", "oui", "non"]),
    speaking("fr-m1v2-8-speak-pardon-recall", "pardon", "sorry", ["pardon"], "recall"),
    {
      // six/dix — THE French ear pair, second trial (seess vs deess).
      id: "fr-m1v2-8-hear-dix",
      type: "word_image_mcq",
      meaningEn: "dix",
      options: [
        { id: "correct", word: "dix", emoji: "🔟" },
        { id: "o1", word: "six", emoji: "6️⃣" },
        { id: "o2", word: "sept", emoji: "7️⃣" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      id: "fr-m1v2-8-lc-bonsoir",
      audioText: "bonsoir",
      correctMeaningEn: "Good evening.",
      distractorsEn: ["Good night.", "Goodbye.", "See you soon."],
    }),
    vocabTextMcq("fr-m1v2-8-mc-zero", "zéro", ["cinq", "deux", "dix"]),
    matchPairs("fr-m1v2-8", ["merci", "oui", "non", "quatre", "six", "bonjour"]),
    // WIN: first voicing of «ça va» — the two words you'll use most.
    speaking("fr-m1v2-8-speak-cava", "ça va", "how's it going? / it's going fine", [
      "ça va",
    ]),
  ];
}

/** L9 — Mastery. Graded only; every item present; typed production;
 *  ends on the Léa goodbye sim. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m1v2-9-hear-bonnenuit",
      type: "word_image_mcq",
      meaningEn: "bonne nuit",
      options: [
        { id: "correct", word: "bonne nuit", emoji: "🌙" },
        { id: "o1", word: "bonsoir", emoji: "🌆" },
        { id: "o2", word: "bonjour", emoji: "🙋" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m1v2-9-build-mercibeaucoup",
      "Build: 'thanks a lot'",
      "merci beaucoup",
      ["merci", "beaucoup", "non", "oui"],
      ["merci", "beaucoup"],
    ),
    cloze(
      "fr-m1v2-9-cloze-bonne",
      "bonne",
      "",
      "nuit",
      ["nuit", "soir"],
      "good night",
      "bonne nuit",
      "«soir» fuses with bon into ONE word — bonsoir. Night keeps two.",
    ),
    vocabTextMcq("fr-m1v2-9-mc-huit", "huit", ["neuf", "six", "dix"]),
    {
      id: "fr-m1v2-9-hear-deux",
      type: "word_image_mcq",
      meaningEn: "deux",
      options: [
        { id: "correct", word: "deux", emoji: "2️⃣" },
        { id: "o1", word: "dix", emoji: "🔟" },
        { id: "o2", word: "zéro", emoji: "0️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      "fr-m1v2-9-speak-enchante",
      "enchanté",
      "nice to meet you",
      ["enchanté"],
      "recall",
    ),
    cloze(
      "fr-m1v2-9-cloze-ou",
      "quatre",
      "cinq",
      "ou",
      ["ou", "et", "non", "oui"],
      "four or five",
      "quatre ou cinq",
      "A choice between numbers takes «ou».",
      ["ou"],
    ),
    listeningCompSentence({
      id: "fr-m1v2-9-lc-nonmerci",
      audioText: "non merci",
      correctMeaningEn: "No, thank you.",
      distractorsEn: ["Yes, please.", "Sorry!", "Good night."],
    }),
    build(
      // Was the typed translate that failed Spencer's walk — typed production grades spelling a
      // beginner hasn't been taught (Spencer, fr m1 L9 walk 2026-08-21:
      // his phonetically-right «si vu plait» failed). A tile build tests
      // the same recall — which words, what order — without the spelling tax.
      "fr-m1v2-9-build-ouisvp",
      "Build: 'yes, please'",
      "oui s'il vous plaît",
      ["oui", "s'il vous plaît", "non", "merci"],
      ["oui", "s'il vous plaît"],
    ),
    {
      id: "fr-m1v2-9-map-ouisvp",
      type: "word_map",
      tokens: ["oui", "s'il vous plaît"],
      pairs: [
        { en: "yes", tokenIndex: 0 },
        { en: "please", tokenIndex: 1 },
      ],
      audioText: "oui s'il vous plaît",
    },
    {
      // six/dix — answer SIX this time (the checkpoint answered dix).
      id: "fr-m1v2-9-hear-six",
      type: "word_image_mcq",
      meaningEn: "six",
      options: [
        { id: "correct", word: "six", emoji: "6️⃣" },
        { id: "o1", word: "dix", emoji: "🔟" },
        { id: "o2", word: "cinq", emoji: "5️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m1v2-9-speak-dix", "dix", "ten", ["dix"], "recall"),
    cloze(
      // Flipped frame: same sentence shape as L6's cloze, opposite
      // answer — forces a real read, not screen memory.
      "fr-m1v2-9-cloze-et",
      "huit",
      "neuf",
      "et",
      ["et", "ou", "non", "oui"],
      "eight and nine",
      "huit et neuf",
      "«et» joins them — eight AND nine.",
      ["et"],
    ),
    matchPairs("fr-m1v2-9", [
      "pardon",
      "s'il vous plaît",
      "enchanté",
      "un",
      "trois",
      "oui",
    ]),
    {
      // THE MODULE ENDS ON LÉA — not a grid.
      id: "fr-m1v2-9-sim-goodbye",
      type: "dialogue_sim",
      scene: {
        emoji: "🌆",
        title: "Léa heads home",
        setting: "End of your first French week.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module: greet, meet, count, take an offer, and say goodnight — in French. Module 2: say who you are.",
      turns: [
        {
          id: "t1-nuit",
          npc: {
            speaker: "Léa",
            kana: "Bonne nuit.",
            audioText: "bonne nuit",
            gloss: "Good night.",
          },
          goal: "Wish her a good night back.",
          reply: {
            mode: "choice",
            options: [
              { id: "bonnenuit", text: "bonne nuit" },
              { id: "bonjour", text: "bonjour" },
              { id: "merci", text: "merci" },
            ],
            correctOptionId: "bonnenuit",
            audioText: "bonne nuit",
          },
          replyGloss: "Good night.",
        },
        {
          id: "t2-aurevoir",
          npc: {
            speaker: "Léa",
            kana: "Au revoir. À bientôt.",
            audioText: "au revoir à bientôt",
            gloss: "Bye — see you soon.",
          },
          goal: "Send her off — either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "abientot", text: "à bientôt" },
              { id: "aurevoir", text: "au revoir" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "abientot",
            alsoCorrectOptionIds: ["aurevoir"],
            audioText: "à bientôt",
          },
          replyGloss: "See you soon!",
        },
      ],
    },
  ];
}

const FR_M1_1: LessonContent = {
  id: "fr-m1-1",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Say hello — and no, politely",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M1_2: LessonContent = {
  id: "fr-m1-2",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Ask nicely, apologize smoothly",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M1_3: LessonContent = {
  id: "fr-m1-3",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Evening, night — and salut",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M1_4: LessonContent = {
  id: "fr-m1-4",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Count to four — and a warmer goodbye",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M1_5: LessonContent = {
  id: "fr-m1-5",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Five, six, seven — nice to meet you",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M1_6: LessonContent = {
  id: "fr-m1-6",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Eight, nine, ten — and, or",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M1_7: LessonContent = {
  id: "fr-m1-7",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for the big one",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M1_8: LessonContent = {
  id: "fr-m1-8",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Your first real conversation",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson8(),
};

const FR_M1_9: LessonContent = {
  id: "fr-m1-9",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — then say goodnight",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

export const FR_M1_MODULE: FrModuleDef = {
  title: "Sons et salutations — sounds & first words",
  eyebrow: "Module 1",
  summary: "French ends quietly: the social survival kit, real conversations, and the numbers 0–10.",
  lessons: [
    FR_M1_1,
    FR_M1_2,
    FR_M1_3,
    FR_M1_4,
    FR_M1_5,
    FR_M1_6,
    FR_M1_7,
    FR_M1_8,
    FR_M1_9,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M1_CHECKPOINT_INDEX = 7;

export const FR_M1_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m1-s",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m1-s",
        prompt: "Pick the phrase that means 'thank you very much'.",
        correctText: "merci beaucoup",
        distractorsText: ["s'il vous plaît", "bonne nuit", "au revoir"],
      }),
  },
  {
    id: "pt-fr-m1-1",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m1-1",
        prompt: "'Hello' — which is correct?",
        correctText: "bonjour",
        distractorsText: ["au revoir", "merci", "pardon"],
      }),
  },
  {
    id: "pt-fr-m1-2",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m1-2",
        prompt: "It's late at night. Which fits?",
        correctText: "bonne nuit",
        distractorsText: ["bonjour", "bonsoir", "à bientôt"],
      }),
  },
  {
    id: "pt-fr-m1-3",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m1-3",
        prompt: "'Seven' — which is correct?",
        correctText: "sept",
        distractorsText: ["six", "neuf", "cinq"],
      }),
  },
  {
    id: "pt-fr-m1-4",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m1-4",
        prompt: "'four and five' — pick the French.",
        correctText: "quatre et cinq",
        distractorsText: ["quatre ou cinq", "quatre non cinq", "quatre oui cinq"],
      }),
  },
];
