/**
 * m1.ts — Sounds & greetings — the §13-doctrine hand-authored module.
 *
 * PROMOTED 2026-08-21 from the inline "crazy author" prototypes
 * (`features/lesson/dev/esM1Lesson1.ts` + `esM1Lessons.ts`), after the
 * five-agent learner-sim pass and Spencer's own walk of /es/qa/m1-lesson-1.
 * The July IR-compiled module it replaces lives in `_archive/` (spine and
 * word-list reference only). Authored by hand, lesson by lesson, under
 * docs/es-lesson-authoring-guide.md §13 — NOT compiled from IR; the IR
 * emitters for the new step kinds (sim/map/audio-mcq/recall/tints) are the
 * m3+ handoff work.
 *
 * Spine (9 lessons, checkpoint at position 7):
 *   L1–L6 teach; CP is zero-new (16 graded retrievals); L8 is the first
 *   real conversation; L9 is mastery and ends on the Ana goodbye sim.
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
  matchPairs,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

export const ES_M1_ATOMS: EsAtom[] = [
  atom({ surface: "hola", meaningEn: "hello", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🙋", hint: "the h is silent: OH-la" }),
  atom({ surface: "adiós", meaningEn: "goodbye", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🚶", hint: "stress the accented ó: ah-DYOS" }),
  atom({ surface: "gracias", meaningEn: "thank you", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🙏", hint: "ci sounds like 'see': GRA-syas" }),
  atom({ surface: "por favor", meaningEn: "please", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🤲" }),
  atom({ surface: "perdón", meaningEn: "excuse me / sorry", partOfSpeech: "other", fromModule: "m1", kind: "vocab", hint: "stress the accented ó: per-DON" }),
  atom({ surface: "sí", meaningEn: "yes", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "✅", hint: "the accent distinguishes it from 'si' (if)" }),
  atom({ surface: "no", meaningEn: "no", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "❌" }),
  atom({ surface: "buenos días", meaningEn: "good morning", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🌅", hint: "the í carries the stress: DEE-as" }),
  atom({ surface: "buenas tardes", meaningEn: "good afternoon", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🌇" }),
  atom({ surface: "buenas noches", meaningEn: "good evening / good night", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🌙", hint: "ch as in English 'church': NO-ches" }),
  atom({ surface: "hasta luego", meaningEn: "see you later", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🚪", hint: "silent h: AS-ta LWE-go" }),
  atom({ surface: "mucho gusto", meaningEn: "nice to meet you", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🤝" }),
  atom({ surface: "cero", meaningEn: "zero", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "0️⃣", hint: "c before e sounds like s: SE-ro" }),
  atom({ surface: "uno", meaningEn: "one", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "1️⃣" }),
  atom({ surface: "dos", meaningEn: "two", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "2️⃣" }),
  atom({ surface: "tres", meaningEn: "three", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "3️⃣", hint: "tap the r lightly: tress" }),
  atom({ surface: "cuatro", meaningEn: "four", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "4️⃣", hint: "c before u is a hard k: KWA-tro" }),
  atom({ surface: "cinco", meaningEn: "five", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "5️⃣", hint: "soft c then hard c: SEEN-ko" }),
  atom({ surface: "seis", meaningEn: "six", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "6️⃣" }),
  atom({ surface: "siete", meaningEn: "seven", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "7️⃣" }),
  atom({ surface: "ocho", meaningEn: "eight", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "8️⃣" }),
  atom({ surface: "nueve", meaningEn: "nine", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "9️⃣" }),
  atom({ surface: "diez", meaningEn: "ten", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "🔟", hint: "z sounds like s in Latin America: dyess" }),
  atom({ surface: "y", meaningEn: "and", partOfSpeech: "particle", fromModule: "m1", kind: "particle", hint: "sounds like 'ee'" }),
  atom({ surface: "o", meaningEn: "or", partOfSpeech: "particle", fromModule: "m1", kind: "particle" }),
];

/**
 * ES m1 · Lesson 1, re-authored under the interaction doctrine
 * (es-lesson-authoring-guide §13) — the first lesson of the inline
 * "crazy author" loop (Spencer 2026-08-20: hand-author m1 lesson by
 * lesson, checking each against the doctrine, until the normal IR
 * process can take over). L2–L8 live in `esM1Lessons.ts`.
 *
 * PROTOTYPE content, konbini/parque contract: lives under `dev/`,
 * invisible to the course, the atom registry collectors, the TTS emitter
 * and every ratchet.
 *
 * v3 was the cognate correction («no» gets a real image-MCQ debut so no
 * deduction leans on no≈no). v4 was the self-cueing correction (the
 * gracias sim died; L1 ships no sim). v5 is the LEARNER-SIM rework
 * (docs/learner-sim/es-m1-proto-FINDINGS.md):
 *   - R7: the module PROMISE opens the info card; the lesson ends on its
 *     win (speaking «no gracias»), match second-to-last.
 *   - R6: the vowel card is CASHED — a which-do-you-hear check on
 *     «adiós» sits three steps after it, and the sí/no ear check closes
 *     the selection stretch. Phonetics taught = phonetics tested.
 *   - R8: «sí» is retrieved by AUDIO, separated from its debut (the old
 *     lc-sí sat directly under mcq-sí and passed on 10-second memory).
 *
 * THE ARC (15 steps, ~8 min):
 *
 *   1  info        promise + the vowel rule — names «hola» ON PURPOSE
 *   2  image MCQ   hola debuts (tap an option = hear it)
 *   3  speaking    say it immediately (printed — first voicing)
 *   4  image MCQ   adiós debuts — 🚶 + elimination
 *   5  speaking    adiós
 *   6  image MCQ   gracias debuts — 🙏 + elimination
 *   7  speaking    gracias
 *   8  image MCQ   sí debuts — ✅ pure emoji deduction
 *   9  listening   hear «adiós» → meaning. The vowel-card cash-in and a
 *                  retrieval SEPARATED from its debut (R6+R8)
 *  10  image MCQ   no debuts — ❌ + elimination, cognate-free
 *  11  word_map    «no gracias» — the FIRST SENTENCE, met as a map
 *  12  listening   hear the sentence (§13.3: map → hear → speak)
 *  13  audio MCQ   hear «sí» → pick it: the sí/no EAR check
 *  14  match       consolidate all five words
 *  15  speaking    say «no gracias» — the lesson ends on its WIN (R7)
 *
 * FSRS: §13.7 — intro lesson; new-type steps carry no exercisedAtoms.
 */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "es-m1v2-1-info-vowels",
      "Five vowels, five sounds",
      "Eight short lessons from now, you'll hold your first Spanish conversation. The key: Spanish has exactly five vowel sounds, and they never change — a ('ah'), e ('eh'), i ('ee'), o ('oh'), u ('oo'). Know them and you can pronounce almost anything you read. Your first word: «hola» — hello. The h is silent: OH-la.",
      "grammar",
    ),
    vocabMcq(
      "es-m1v2-1-img-hola",
      { surface: "hola", meaningEn: "hello", emoji: "🙋" },
      [
        { surface: "adiós", emoji: "🚶" },
        { surface: "gracias", emoji: "🙏" },
        { surface: "sí", emoji: "✅" },
      ],
    ),
    speaking("es-m1v2-1-speak-hola", "hola", "hello", ["hola"]),
    vocabMcq(
      "es-m1v2-1-img-adios",
      { surface: "adiós", meaningEn: "goodbye", emoji: "🚶" },
      [
        { surface: "hola", emoji: "🙋" },
        { surface: "gracias", emoji: "🙏" },
        { surface: "no", emoji: "❌" },
      ],
    ),
    speaking("es-m1v2-1-speak-adios", "adiós", "goodbye", ["adiós"]),
    vocabMcq(
      // gracias is IMAGEABLE (🙏) — it debuts like every other picture
      // word. The failed hola-sim that stood here is §13.6's origin.
      "es-m1v2-1-img-gracias",
      { surface: "gracias", meaningEn: "thank you", emoji: "🙏" },
      [
        { surface: "hola", emoji: "🙋" },
        { surface: "adiós", emoji: "🚶" },
        { surface: "sí", emoji: "✅" },
      ],
    ),
    speaking("es-m1v2-1-speak-gracias", "gracias", "thank you", ["gracias"]),
    vocabMcq(
      "es-m1v2-1-img-si",
      { surface: "sí", meaningEn: "yes", emoji: "✅" },
      [
        { surface: "no", emoji: "❌" },
        { surface: "gracias", emoji: "🙏" },
        { surface: "adiós", emoji: "🚶" },
      ],
    ),
    listeningCompSentence({
      // The vowel card's CASH-IN (R6): pure ear — the clip is the whole
      // question. Also adiós's first retrieval AWAY from its debut (R8).
      id: "es-m1v2-1-lc-adios",
      audioText: "adiós",
      correctMeaningEn: "Goodbye",
      distractorsEn: ["Thank you", "Hello", "Yes"],
    }),
    vocabMcq(
      // «no» gets a REAL debut (the cognate correction — see header).
      "es-m1v2-1-img-no",
      { surface: "no", meaningEn: "no", emoji: "❌" },
      [
        { surface: "sí", emoji: "✅" },
        { surface: "gracias", emoji: "🙏" },
        { surface: "hola", emoji: "🙋" },
      ],
    ),
    {
      id: "es-m1v2-1-map-nogracias",
      type: "word_map",
      tokens: ["no", "gracias"],
      pairs: [
        { en: "no", tokenIndex: 0 },
        { en: "thank you", tokenIndex: 1 },
      ],
      audioText: "no gracias",
      revealNote:
        "«no gracias» is the polite way to turn anything down. Bonus luck: Spanish «no» happens to be the same word as English — enjoy the freebie.",
    },
    listeningCompSentence({
      id: "es-m1v2-1-lc-nogracias",
      audioText: "no gracias",
      correctMeaningEn: "No, thank you.",
      distractorsEn: ["Yes, please.", "Hello!", "Goodbye!"],
    }),
    {
      // The sí/no EAR check — audio prompt, zero reading. «sí» is
      // retrieved five steps after its debut, by sound (R8), and the
      // pair that matters most is discriminated by ear (R6).
      id: "es-m1v2-1-hear-si",
      type: "word_image_mcq",
      meaningEn: "sí",
      options: [
        { id: "correct", word: "sí", emoji: "✅" },
        { id: "o1", word: "no", emoji: "❌" },
        { id: "o2", word: "gracias", emoji: "🙏" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "es-m1v2-1-match-close",
      type: "match_pairs",
      prompt: "Match everything you just learned.",
      pairs: [
        { id: "p-hola", source: "hola", target: "hello" },
        { id: "p-adios", source: "adiós", target: "goodbye" },
        { id: "p-gracias", source: "gracias", target: "thank you" },
        { id: "p-si", source: "sí", target: "yes" },
        { id: "p-no", source: "no", target: "no" },
      ],
    },
    // The lesson ends on its WIN (R7): producing the first sentence.
    // First voicing of the full phrase — printed form + clip (§13.9).
    speaking("es-m1v2-1-speak-nogracias", "no gracias", "no, thank you", [
      "no",
      "gracias",
    ]),
  ];
}

/**
 * L2 — Courtesy. por favor debuts as a picture word; «sí por favor» is
 * mapped → heard → spoken; two SELF-CUEING sims (§13.6): «¿Café?»
 * demands yes-please/no-thanks (both accepted — and its explanation
 * spends the free ¿ delight beat), and «¡Ay!» debuts perdón (spoken by a
 * STRANGER — Diego's debut belongs to L6; R7 continuity). Tail: hola by
 * ear; the lesson ends recalling «no gracias» from English alone.
 */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "es-m1v2-2-info-courtesy",
      "Two polite tools",
      "«por favor» — please — and «perdón» — sorry / excuse me (per-DON: the accented ó carries the stress). And remember: the h in «hola» is always silent.",
      "grammar",
    ),
    vocabMcq(
      "es-m1v2-2-img-porfavor",
      { surface: "por favor", meaningEn: "please", emoji: "🤲" },
      [
        { surface: "gracias", emoji: "🙏" },
        { surface: "hola", emoji: "🙋" },
        { surface: "adiós", emoji: "🚶" },
      ],
    ),
    speaking("es-m1v2-2-speak-porfavor", "por favor", "please", ["por favor"]),
    {
      // First view of the polite sentence — mapped (§13.3).
      id: "es-m1v2-2-map-siporfavor",
      type: "word_map",
      tokens: ["sí", "por favor"],
      pairs: [
        { en: "yes", tokenIndex: 0 },
        { en: "please", tokenIndex: 1 },
      ],
      audioText: "sí por favor",
      revealNote:
        "«sí por favor» — yes, please. You now own both halves of every polite answer: this one, and «no gracias».",
    },
    listeningCompSentence({
      id: "es-m1v2-2-lc-siporfavor",
      audioText: "sí por favor",
      correctMeaningEn: "Yes, please.",
      distractorsEn: ["No, thank you.", "Sorry!", "Good morning."],
    }),
    {
      // SELF-CUEING sim (§13.6): the OFFER is in the dialogue — «¿Café?»
      // demands yes-please or no-thanks, and BOTH are accepted.
      id: "es-m1v2-2-sim-cafe",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Ana offers you a coffee" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cafe",
          npc: {
            speaker: "Ana",
            kana: "¿Café?",
            audioText: "¿café?",
            gloss: "Coffee?",
          },
          goal: "Answer — either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "siporfavor", text: "sí por favor" },
              { id: "nogracias", text: "no gracias" },
              { id: "hola", text: "hola" },
            ],
            correctOptionId: "siporfavor",
            alsoCorrectOptionIds: ["nogracias"],
            audioText: "sí por favor",
          },
          replyGloss: "Yes, please.",
          explanation:
            "A real offer has two right answers — «sí por favor» and «no gracias» both land. And notice the upside-down ¿ — Spanish warns you a question is coming before you read a word of it.",
        },
      ],
    },
    speaking("es-m1v2-2-speak-siporfavor", "sí por favor", "yes, please", [
      "sí",
      "por favor",
    ]),
    {
      // SELF-CUEING debut: «¡Ay!» demands an apology in ANY language.
      // Spoken by a STRANGER — Diego is properly introduced in L6 (R7).
      id: "es-m1v2-2-sim-perdon",
      type: "dialogue_sim",
      scene: { emoji: "🚇", title: "A crowded platform" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-perdon",
          npc: {
            speaker: "A stranger",
            kana: "¡Ay!",
            audioText: "¡ay!",
            gloss: "Ouch!",
          },
          goal: "Apologize.",
          reply: {
            mode: "choice",
            options: [
              { id: "perdon", text: "perdón" },
              { id: "porfavor", text: "por favor" },
              { id: "gracias", text: "gracias" },
            ],
            correctOptionId: "perdon",
            audioText: "perdón",
          },
          replyGloss: "Sorry!",
          explanation:
            "«perdón» — sorry / excuse me. Stress the ó: per-DON. The ¡ ! bracket works like ¿ ? — Spanish flags the feeling at both ends.",
        },
      ],
    },
    speaking("es-m1v2-2-speak-perdon", "perdón", "sorry", ["perdón"]),
    {
      // TAIL (R1): L1 by ear — zero reading, separated from every debut.
      id: "es-m1v2-2-hear-hola",
      type: "word_image_mcq",
      meaningEn: "hola",
      options: [
        { id: "correct", word: "hola", emoji: "🙋" },
        { id: "o1", word: "adiós", emoji: "🚶" },
        { id: "o2", word: "gracias", emoji: "🙏" },
      ],
      correctOptionId: "correct",
    },
    matchPairs("es-m1v2-2-match", [
      "por favor",
      "perdón",
      "hola",
      "gracias",
      "sí",
      "no",
    ]),
    // WIN (R7): recall the L1 sentence from English alone — the module's
    // first cued-recall production (2nd voicing; first was L1, printed).
    speaking(
      "es-m1v2-2-speak-nogracias-recall",
      "no gracias",
      "no, thank you",
      ["no", "gracias"],
      "recall",
    ),
  ];
}

/**
 * L3 — Greetings around the clock. The card teaches the buenos/buenas
 * PAIRING with the NOT-counterexample (R5); the greetings ramp
 * map → build across the pattern; discrimination trials alternate
 * answers (cloze → buenos, build → buenas, ear → buenos) with both
 * halves live. Tail: perdón's first audio retrieval. Ends speaking
 * «buenos días» — the greeting you'll actually use tomorrow.
 */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "es-m1v2-3-info-clock",
      "Greetings around the clock",
      "Spanish greets by time of day: «buenos días» (good morning — literally 'good days'), «buenas tardes» (good afternoon), «buenas noches» (good evening/night). And 'good' dresses to match its word: buenOS días, but buenAS tardes and buenAS noches. Never «buenas días».",
      "grammar",
    ),
    {
      id: "es-m1v2-3-map-buenosdias",
      type: "word_map",
      tokens: ["buenos", "días"],
      pairs: [
        // Functional gloss — "days" mid-map was a stop-and-reread beat
        // (confirmation walk); the literal lives on the card + reveal.
        { en: "good", tokenIndex: 0 },
        { en: "morning", tokenIndex: 1 },
      ],
      audioText: "buenos días",
      // Gender tint (§13.4 reveal layer): the agreement chain lights up
      // in ONE color as it solves — «día» is masculine despite the -a,
      // and the learner SEES it long before m4 names the rule.
      tokenGenders: { 0: "m", 1: "m" },
      revealNote:
        "Literally 'good days' — both words wear the -s. And the blue glow with the tiny m? «día» is a he-word (despite the -a!) — Spanish sorts words into blue-m and pink-f families, and the colors will quietly track it from here on.",
    },
    listeningCompSentence({
      id: "es-m1v2-3-lc-buenosdias",
      audioText: "buenos días",
      correctMeaningEn: "Good morning.",
      distractorsEn: ["Good night.", "See you later.", "Please."],
    }),
    {
      id: "es-m1v2-3-map-buenastardes",
      type: "word_map",
      tokens: ["buenas", "tardes"],
      pairs: [
        { en: "good", tokenIndex: 0 },
        { en: "afternoon", tokenIndex: 1 },
      ],
      audioText: "buenas tardes",
      tokenGenders: { 0: "f", 1: "f" },
      revealNote:
        "buenOS became buenAS — «tarde» is a different kind of word, and 'good' dressed to match. Module 4 explains why; for now, just hear it.",
    },
    speaking("es-m1v2-3-speak-buenastardes", "buenas tardes", "good afternoon", [
      "buenas tardes",
    ]),
    cloze(
      // Discrimination trial #1 (R5) — answer BUENOS, with buenas live.
      // The old module's only trials both answered "buenas"; a learner
      // could score 100% on the FALSE rule "always buenas".
      "es-m1v2-3-cloze-buenos",
      "",
      "días",
      "buenos",
      ["buenos", "buenas"],
      "good morning",
      "buenos días",
      "«buenos» with días; «buenas» with tardes and noches. Never «buenas días».",
    ),
    build(
      // Trial #2 — answer BUENAS, with buenos live in the bank (§13.3:
      // third of the pattern → build it; noche card-fed).
      "es-m1v2-3-build-buenasnoches",
      "Build: 'good night'",
      "buenas noches",
      ["buenas", "noches", "buenos", "tardes"],
      ["buenas", "noches"],
    ),
    listeningCompSentence({
      id: "es-m1v2-3-lc-buenasnoches",
      audioText: "buenas noches",
      correctMeaningEn: "Good night.",
      distractorsEn: ["Good morning.", "Good afternoon.", "Goodbye."],
    }),
    {
      // Trial #3, by EAR — answer on the buenos side, tardes/noches live.
      id: "es-m1v2-3-hear-buenosdias",
      type: "word_image_mcq",
      meaningEn: "buenos días",
      options: [
        { id: "correct", word: "buenos días", emoji: "🌅" },
        { id: "o1", word: "buenas tardes", emoji: "☀️" },
        { id: "o2", word: "buenas noches", emoji: "🌙" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      // TAIL (R1/R8): perdón's first AUDIO retrieval — it debuted in a
      // sim and would otherwise never play as sound until mastery.
      id: "es-m1v2-3-lc-perdon",
      audioText: "perdón",
      correctMeaningEn: "Sorry!",
      distractorsEn: ["Please.", "Thank you.", "Hello."],
    }),
    matchPairs("es-m1v2-3-match", [
      "buenos días",
      "buenas tardes",
      "buenas noches",
      "hola",
      "adiós",
      "gracias",
    ]),
    // WIN: first voicing of «buenos días» — printed + clip (§13.9).
    speaking("es-m1v2-3-speak-buenosdias", "buenos días", "good morning", [
      "buenos días",
    ]),
  ];
}

/**
 * L4 — Count to four, and a warmer goodbye. Spencer's interleaving law
 * (2026-08-20): "teaching all the numbers at once, in a row, is kind of
 * boring" — so numbers spread 4/4/3 across three lessons, each broken
 * up by unrelated words. Here: uno–cuatro with the hasta-luego sim as
 * the mid-lesson break. Digit debuts are AUDIO-prompted (see the
 * hear-uno note). Tail: L2 courtesy. Ends counting to four.
 */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "es-m1v2-4-info-count4",
      "One to four — and a warmer goodbye",
      "«uno, dos, tres, cuatro» — one to four. And a goodbye for people you'll see again: «hasta luego» — see you later (silent h, like «hola»: AS-ta LWE-go).",
      "grammar",
    ),
    {
      // AUDIO-PROMPTED debut (confirmation-walk fix): the old
      // English-prompt MCQ printed the answer next to the answer —
      // "1️⃣ is a perfect printed translation", eight free taps across
      // the number lessons. Now the clip is the question: the learner
      // matches the SOUND to a digit (tap any option to hear its word —
      // the matching path is language-agnostic), encoding sound↔meaning.
      id: "es-m1v2-4-hear-uno",
      type: "word_image_mcq",
      meaningEn: "uno",
      options: [
        { id: "correct", word: "uno", emoji: "1️⃣" },
        { id: "o1", word: "dos", emoji: "2️⃣" },
        { id: "o2", word: "tres", emoji: "3️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking("es-m1v2-4-speak-uno", "uno", "one", ["uno"]),
    {
      id: "es-m1v2-4-hear-dos",
      type: "word_image_mcq",
      meaningEn: "dos",
      options: [
        { id: "correct", word: "dos", emoji: "2️⃣" },
        { id: "o1", word: "uno", emoji: "1️⃣" },
        { id: "o2", word: "tres", emoji: "3️⃣" },
      ],
      correctOptionId: "correct",
    },
    {
      // Counting map — debuts «tres» by elimination, prompted LAST.
      id: "es-m1v2-4-map-unodostres",
      type: "word_map",
      tokens: ["uno", "dos", "tres"],
      pairs: [
        { en: "one", tokenIndex: 0 },
        { en: "two", tokenIndex: 1 },
        { en: "three", tokenIndex: 2 },
      ],
      audioText: "uno, dos, tres",
      revealNote:
        "«tres» arrived free: you knew the other two, so the last mapping solved itself. One more: cuatro.",
    },
    {
      // The INTERLEAVE break: a person, mid-numbers. hasta luego debuts
      // here (card-fed) instead of headlining a same-shaped lesson.
      id: "es-m1v2-4-sim-hastaluego",
      type: "dialogue_sim",
      scene: {
        emoji: "🚪",
        title: "Ana heads out",
        setting: "She'll be back tomorrow.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-hastaluego",
          npc: { speaker: "Ana", kana: "¡Adiós!", audioText: "adiós", gloss: "Bye!" },
          goal: "Send her off — she's back tomorrow.",
          reply: {
            mode: "choice",
            options: [
              { id: "hastaluego", text: "hasta luego" },
              { id: "nogracias", text: "no gracias" },
              { id: "buenosdias", text: "buenos días" },
            ],
            correctOptionId: "hastaluego",
            audioText: "hasta luego",
          },
          replyGloss: "See you later.",
          explanation:
            "«hasta luego» — see you later, for people you'll see again. Silent h, like «hola»: AS-ta LWE-go.",
        },
      ],
    },
    speaking("es-m1v2-4-speak-hastaluego", "hasta luego", "see you later", [
      "hasta luego",
    ]),
    {
      id: "es-m1v2-4-hear-cuatro",
      type: "word_image_mcq",
      meaningEn: "cuatro",
      options: [
        { id: "correct", word: "cuatro", emoji: "4️⃣" },
        { id: "o1", word: "tres", emoji: "3️⃣" },
        { id: "o2", word: "uno", emoji: "1️⃣" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq(
      // Word→meaning with NO digit crutch (R4): the Spanish words alone.
      "es-m1v2-4-mc-tres",
      "tres",
      ["dos", "uno", "cuatro"],
    ),
    // TAIL (R1): L2 courtesy — cued recall, 2nd voicing of por favor.
    speaking(
      "es-m1v2-4-speak-porfavor-recall",
      "por favor",
      "please",
      ["por favor"],
      "recall",
    ),
    matchPairs("es-m1v2-4-match", [
      "uno",
      "tres",
      "hasta luego",
      "hola",
      "perdón",
      "no",
    ]),
    // WIN: count to four, out loud — first voicing of the run, printed.
    speaking(
      "es-m1v2-4-speak-count",
      "uno, dos, tres, cuatro",
      "one, two, three, four",
      ["uno", "dos", "tres", "cuatro"],
    ),
  ];
}

/**
 * L5 — Zero, five, six, seven — nice to meet you. The soft-c card
 * cashes IMMEDIATELY (hear «cero», R6); the mucho-gusto MIRROR sim is
 * the interleave break. Tail: L3 + L4. Ends counting to five — the run
 * now owns «cinco».
 */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "es-m1v2-5-info-softc",
      "Four more numbers, and the soft c",
      "«cero, cinco, seis, siete» — zero, five, six, seven. One sound rule: before e or i, c is soft like 's' — «cero» (SE-ro), «cinco» (SEEN-ko).",
      "grammar",
    ),
    listeningCompSentence({
      // The card CASHES immediately (R6): hear the soft c it just
      // taught. Card-fed, so it's answerable — cero's debut by EAR.
      id: "es-m1v2-5-lc-cero",
      audioText: "cero",
      correctMeaningEn: "Zero",
      distractorsEn: ["Five", "Four", "Two"],
    }),
    {
      // SE-ro vs SEEN-ko — the pair the card itself raised.
      id: "es-m1v2-5-hear-cinco",
      type: "word_image_mcq",
      meaningEn: "cinco",
      options: [
        { id: "correct", word: "cinco", emoji: "5️⃣" },
        { id: "o1", word: "cero", emoji: "0️⃣" },
        { id: "o2", word: "cuatro", emoji: "4️⃣" },
      ],
      correctOptionId: "correct",
    },
    {
      // «cero» and «cinco» consolidate with L4's tres — NATURAL order.
      id: "es-m1v2-5-map-cerotrescinco",
      type: "word_map",
      tokens: ["cero", "tres", "cinco"],
      pairs: [
        { en: "zero", tokenIndex: 0 },
        { en: "three", tokenIndex: 1 },
        { en: "five", tokenIndex: 2 },
      ],
      audioText: "cero, tres, cinco",
      revealNote:
        "«cero» — the soft c from the card: SE-ro. You just read a phone number's worth of Spanish digits.",
    },
    {
      // The INTERLEAVE break — and a MIRROR exchange (§13.6): «mucho
      // gusto» is answered with itself in real Spanish. The line IS the
      // cue; no card needed.
      id: "es-m1v2-5-sim-muchogusto",
      type: "dialogue_sim",
      scene: {
        emoji: "🤝",
        title: "A friend of Ana's",
        setting: "You're introduced for the first time.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-muchogusto",
          npc: {
            speaker: "Diego",
            kana: "Mucho gusto.",
            audioText: "mucho gusto",
            gloss: "Nice to meet you.",
          },
          goal: "Say it back.",
          reply: {
            mode: "choice",
            options: [
              { id: "muchogusto", text: "mucho gusto" },
              { id: "hastaluego", text: "hasta luego" },
              { id: "porfavor", text: "por favor" },
            ],
            correctOptionId: "muchogusto",
            audioText: "mucho gusto",
          },
          replyGloss: "Nice to meet you.",
          explanation:
            "«mucho gusto» — literally 'much pleasure'. The other two you know, and neither fits a first hello.",
        },
      ],
    },
    speaking("es-m1v2-5-speak-muchogusto", "mucho gusto", "nice to meet you", [
      "mucho gusto",
    ]),
    {
      id: "es-m1v2-5-hear-seis",
      type: "word_image_mcq",
      meaningEn: "seis",
      options: [
        { id: "correct", word: "seis", emoji: "6️⃣" },
        { id: "o1", word: "siete", emoji: "7️⃣" },
        { id: "o2", word: "cinco", emoji: "5️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking("es-m1v2-5-speak-seis", "seis", "six", ["seis"]),
    {
      id: "es-m1v2-5-hear-siete",
      type: "word_image_mcq",
      meaningEn: "siete",
      options: [
        { id: "correct", word: "siete", emoji: "7️⃣" },
        { id: "o1", word: "seis", emoji: "6️⃣" },
        { id: "o2", word: "cinco", emoji: "5️⃣" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq(
      // TAIL: L4 lane, no digit crutch.
      "es-m1v2-5-mc-cuatro",
      "cuatro",
      ["cinco", "dos", "tres"],
    ),
    // TAIL (R1): L3 — cued recall of buenas tardes (2nd voicing).
    speaking(
      "es-m1v2-5-speak-buenastardes-recall",
      "buenas tardes",
      "good afternoon",
      ["buenas tardes"],
      "recall",
    ),
    matchPairs("es-m1v2-5-match", [
      "cero",
      "seis",
      "mucho gusto",
      "adiós",
      "gracias",
      "dos",
    ]),
    // WIN: the counting run grows to five — printed, first voicing.
    speaking(
      "es-m1v2-5-speak-count",
      "uno, dos, tres, cuatro, cinco",
      "one, two, three, four, five",
      ["uno", "dos", "tres", "cuatro", "cinco"],
    ),
  ];
}

/**
 * L6 — Eight, nine, ten; and, or. The last three numbers plus both
 * connectors, met inside sentences: «y» debuts in the seis-y-siete map
 * (both numbers known from L5), «nueve» by map elimination, «o» in
 * cuatro-o-cinco. Tail: hasta luego by ear + buenos días recall. Ends
 * counting six to ten.
 */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "es-m1v2-6-info-count10",
      "Eight, nine, ten — and the two smallest words",
      "«ocho, nueve, diez» — eight, nine, ten. Plus the two smallest words in Spanish: «y» means 'and' (said 'ee'), «o» means 'or'.",
      "grammar",
    ),
    {
      id: "es-m1v2-6-hear-ocho",
      type: "word_image_mcq",
      meaningEn: "ocho",
      options: [
        { id: "correct", word: "ocho", emoji: "8️⃣" },
        { id: "o1", word: "nueve", emoji: "9️⃣" },
        { id: "o2", word: "diez", emoji: "🔟" },
      ],
      correctOptionId: "correct",
    },
    speaking("es-m1v2-6-speak-ocho", "ocho", "eight", ["ocho"]),
    {
      // «y» debuts by elimination between two L5 numbers (card-fed).
      id: "es-m1v2-6-map-seisysiete",
      type: "word_map",
      tokens: ["seis", "y", "siete"],
      pairs: [
        { en: "six", tokenIndex: 0 },
        { en: "and", tokenIndex: 1 },
        { en: "seven", tokenIndex: 2 },
      ],
      audioText: "seis y siete",
      revealNote:
        "«y» — 'and', a whole word in one letter. It sounds like 'ee', exactly the vowel rule from lesson 1.",
    },
    listeningCompSentence({
      id: "es-m1v2-6-lc-seisysiete",
      audioText: "seis y siete",
      correctMeaningEn: "Six and seven",
      distractorsEn: ["Six or seven", "Seven and eight", "Six and six"],
    }),
    {
      // «nueve» debuts by MAP elimination, prompted LAST — ocho known,
      // y known, so nine falls out free (R4: one debut step fewer).
      id: "es-m1v2-6-map-ochoynueve",
      type: "word_map",
      tokens: ["ocho", "y", "nueve"],
      pairs: [
        { en: "eight", tokenIndex: 0 },
        { en: "and", tokenIndex: 1 },
        { en: "nine", tokenIndex: 2 },
      ],
      audioText: "ocho y nueve",
      revealNote:
        "«nueve» arrived by elimination — nine. One number to go: diez.",
    },
    {
      id: "es-m1v2-6-hear-diez",
      type: "word_image_mcq",
      meaningEn: "diez",
      options: [
        { id: "correct", word: "diez", emoji: "🔟" },
        { id: "o1", word: "nueve", emoji: "9️⃣" },
        { id: "o2", word: "ocho", emoji: "8️⃣" },
      ],
      correctOptionId: "correct",
    },
    // «diez» gets a PRINTED voicing (confirmation walk: it was never
    // produced in any form) — L8 recalls it from English.
    speaking("es-m1v2-6-speak-diez", "diez", "ten", ["diez"]),
    {
      // «o» debuts by elimination between two taught numbers — the same
      // structural path «y» took.
      id: "es-m1v2-6-map-cuatroocinco",
      type: "word_map",
      tokens: ["cuatro", "o", "cinco"],
      pairs: [
        { en: "four", tokenIndex: 0 },
        { en: "or", tokenIndex: 1 },
        { en: "five", tokenIndex: 2 },
      ],
      audioText: "cuatro o cinco",
      revealNote:
        "«o» — 'or'. So «y» joins and «o» chooses: seis y siete, cuatro o cinco.",
    },
    listeningCompSentence({
      id: "es-m1v2-6-lc-cuatroocinco",
      audioText: "cuatro o cinco",
      correctMeaningEn: "Four or five",
      distractorsEn: ["Four and five", "Four or four", "Five or six"],
    }),
    cloze(
      // y/o trial answering O, y live — on a FRESH sentence, not the one
      // a map just solved.
      "es-m1v2-6-cloze-o",
      "ocho",
      "nueve",
      "o",
      ["o", "y", "sí", "no"],
      "eight or nine",
      "ocho o nueve",
      "«y» joins ('and'); «o» chooses ('or'). This one is a choice.",
      ["o"],
    ),
    {
      // TAIL: hasta luego by EAR — taught back in L4, retrieved here.
      id: "es-m1v2-6-hear-hastaluego",
      type: "word_image_mcq",
      meaningEn: "hasta luego",
      options: [
        { id: "correct", word: "hasta luego", emoji: "🚪" },
        { id: "o1", word: "mucho gusto", emoji: "🤝" },
        { id: "o2", word: "buenos días", emoji: "🌅" },
      ],
      correctOptionId: "correct",
    },
    // TAIL (R1): L3 lane — 3rd voicing of buenos días, recall.
    speaking(
      "es-m1v2-6-speak-buenosdias-recall",
      "buenos días",
      "good morning",
      ["buenos días"],
      "recall",
    ),
    matchPairs("es-m1v2-6-match", [
      "diez",
      "y",
      "o",
      "siete",
      "hola",
      "perdón",
    ]),
    // WIN: count six to ten out loud — printed, first voicing of the run.
    speaking(
      "es-m1v2-6-speak-count",
      "seis, siete, ocho, nueve, diez",
      "six, seven, eight, nine, ten",
      ["seis", "siete", "ocho", "nueve", "diez"],
    ),
  ];
}

/**
 * CHECKPOINT (after L5) — the dedicated zero-new review lesson the JA
 * rhythm has and this module lacked (R2). Sixteen graded retrievals over
 * L1-L5, every confusable pair discriminated with both halves live,
 * every modality the module uses, no cards, no digit crutches.
 */
function checkpointLesson(): LessonStep[] {
  return [
    {
      // seis/siete by EAR — the coin-flip pair, first discrimination.
      id: "es-m1v2-r-hear-seis",
      type: "word_image_mcq",
      meaningEn: "seis",
      options: [
        { id: "correct", word: "seis", emoji: "6️⃣" },
        { id: "o1", word: "siete", emoji: "7️⃣" },
        { id: "o2", word: "nueve", emoji: "9️⃣" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      // buenos/buenas — answer BUENAS here (L3's cloze answered buenos;
      // alternation is the point, R5).
      "es-m1v2-r-cloze-buenas",
      "",
      "tardes",
      "buenas",
      ["buenas", "buenos"],
      "good afternoon",
      "buenas tardes",
      "«buenas» with tardes and noches; «buenos» only with días.",
    ),
    // Recall a NUMBER, not gracias (confirmation walk: the easiest word
    // in Spanish held a production slot while six numbers had none).
    speaking("es-m1v2-r-speak-ocho", "ocho", "eight", ["ocho"], "recall"),
    listeningCompSentence({
      id: "es-m1v2-r-lc-siporfavor",
      audioText: "sí por favor",
      correctMeaningEn: "Yes, please.",
      distractorsEn: ["No, thank you.", "Sorry!", "Good morning."],
    }),
    vocabTextMcq("es-m1v2-r-mc-nueve", "nueve", ["diez", "dos", "seis"]),
    build(
      // buenos/buenas trial — answer BUENOS, buenas live in the bank.
      "es-m1v2-r-build-buenosdias",
      "Build: 'good morning'",
      "buenos días",
      ["buenos", "días", "buenas", "noches"],
      ["buenos", "días"],
    ),
    {
      // cero/cinco by EAR — the pair the soft-c card itself raised.
      id: "es-m1v2-r-hear-cero",
      type: "word_image_mcq",
      meaningEn: "cero",
      options: [
        { id: "correct", word: "cero", emoji: "0️⃣" },
        { id: "o1", word: "cinco", emoji: "5️⃣" },
        { id: "o2", word: "seis", emoji: "6️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      "es-m1v2-r-speak-siporfavor",
      "sí por favor",
      "yes, please",
      ["sí", "por favor"],
      "recall",
    ),
    cloze(
      "es-m1v2-r-cloze-y",
      "seis",
      "siete",
      "y",
      ["y", "o", "no", "sí"],
      "six and seven",
      "seis y siete",
      "«y» joins — 'and'.",
      ["y"],
    ),
    listeningCompSentence({
      id: "es-m1v2-r-lc-perdon",
      audioText: "perdón",
      correctMeaningEn: "Sorry!",
      distractorsEn: ["Yes.", "Please.", "Good night."],
    }),
    build(
      "es-m1v2-r-build-nogracias",
      "Build: 'no, thank you'",
      "no gracias",
      ["no", "gracias", "sí", "por", "favor"],
      ["no", "gracias"],
    ),
    {
      // tardes/noches by EAR — answer on the noches side (L3's ear trial
      // answered buenos días; alternation).
      id: "es-m1v2-r-hear-noches",
      type: "word_image_mcq",
      meaningEn: "buenas noches",
      options: [
        { id: "correct", word: "buenas noches", emoji: "🌙" },
        { id: "o1", word: "buenas tardes", emoji: "☀️" },
        { id: "o2", word: "buenos días", emoji: "🌅" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("es-m1v2-r-mc-siete", "siete", ["seis", "ocho", "nueve"]),
    speaking(
      "es-m1v2-r-speak-count",
      "uno, dos, tres, cuatro, cinco",
      "one, two, three, four, five",
      ["uno", "dos", "tres", "cuatro", "cinco"],
      "recall",
    ),
    {
      // dos/diez by EAR — the d-word pair.
      id: "es-m1v2-r-hear-diez",
      type: "word_image_mcq",
      meaningEn: "diez",
      options: [
        { id: "correct", word: "diez", emoji: "🔟" },
        { id: "o1", word: "dos", emoji: "2️⃣" },
        { id: "o2", word: "cero", emoji: "0️⃣" },
      ],
      correctOptionId: "correct",
    },
    matchPairs("es-m1v2-r-match", [
      "perdón",
      "sí",
      "no",
      "uno",
      "ocho",
      "buenas noches",
    ]),
  ];
}

/**
 * L7 — Your first real conversation. The full sim: Ana greets, SOFÍA —
 * someone you genuinely haven't met (R7) — says mucho gusto, the offer
 * is a REAL question («¿Café? ¿Sí o no?»), and the goodbye takes either
 * answer. Then a retrieval tail over exactly what it used, plus the
 * spaced confusable trials that land here (siete by ear, y by text,
 * tardes by ear). Ends speaking the greeting that opened it.
 */
function lesson7(): LessonStep[] {
  return [
    {
      id: "es-m1v2-7-sim-parque",
      type: "dialogue_sim",
      scene: {
        emoji: "🌳",
        title: "En el parque — Ana again",
        setting: "She waves you over — she's brought a friend.",
      },
      exercisedAtomIds: [],
      explanation:
        "A whole first conversation: greeting, meeting, a real offer, a warm goodbye — every line from this module.",
      turns: [
        {
          id: "t1-saludo",
          npc: {
            speaker: "Ana",
            kana: "¡Hola! Buenos días.",
            audioText: "hola buenos días",
            gloss: "Hi! Good morning.",
          },
          goal: "Greet her back.",
          reply: {
            mode: "build",
            tiles: ["hola", "buenos", "días", "adiós", "gracias"],
            answer: "hola buenos días",
            // A greeting is complete at ONE word — «hola» alone must
            // pass (confirmation walk: tile-count guessing, and a wrong
            // mark on a correct greeting at the module's high point).
            alsoAccepted: ["buenos días", "hola"],
            audioText: "hola buenos días",
          },
          replyGloss: "Hi, good morning.",
        },
        {
          id: "t2-gusto",
          npc: {
            speaker: "Sofía",
            kana: "Mucho gusto.",
            audioText: "mucho gusto",
            gloss: "Nice to meet you.",
          },
          goal: "Say it back.",
          reply: {
            mode: "choice",
            options: [
              { id: "gusto", text: "mucho gusto" },
              { id: "luego", text: "hasta luego" },
              { id: "nogracias", text: "no gracias" },
            ],
            correctOptionId: "gusto",
            audioText: "mucho gusto",
          },
          replyGloss: "Nice to meet you too.",
        },
        {
          id: "t3-oferta",
          npc: {
            speaker: "Ana",
            kana: "¿Café? ¿Sí o no?",
            audioText: "¿café? ¿sí o no?",
            gloss: "Coffee? Yes or no?",
          },
          goal: "Answer her — either way.",
          reply: {
            mode: "build",
            tiles: ["no", "gracias", "sí", "por", "favor"],
            answer: "no gracias",
            // Max-acceptance: a real offer has two right answers, and
            // both are buildable from this bank.
            alsoAccepted: ["sí por favor"],
            audioText: "no gracias",
          },
          replyGloss: "No, thank you.",
          explanation:
            "«no gracias» — the polite no from lesson 1, produced from scratch. «sí por favor» lands just as well.",
        },
        {
          id: "t4-despedida",
          npc: { speaker: "Ana", kana: "Adiós.", audioText: "adiós", gloss: "Goodbye." },
          goal: "Say goodbye — either way works.",
          reply: {
            mode: "choice",
            options: [
              { id: "luego", text: "hasta luego" },
              { id: "adios", text: "adiós" },
              { id: "porfavor", text: "por favor" },
            ],
            correctOptionId: "luego",
            alsoCorrectOptionIds: ["adios"],
            audioText: "hasta luego",
          },
          replyGloss: "See you later.",
        },
      ],
    },
    listeningCompSentence({
      id: "es-m1v2-7-lc-holabuenosdias",
      audioText: "hola buenos días",
      correctMeaningEn: "Hi, good morning.",
      distractorsEn: ["Bye, good night.", "Yes, please.", "Nice to meet you."],
    }),
    build(
      // Second encounter of the polite yes → build it (§13.3).
      "es-m1v2-7-build-siporfavor",
      "Build: 'yes, please'",
      "sí por favor",
      ["sí", "por", "favor", "no", "gracias"],
      ["sí", "por", "favor"],
    ),
    {
      id: "es-m1v2-7-hear-muchogusto",
      type: "word_image_mcq",
      meaningEn: "mucho gusto",
      options: [
        { id: "correct", word: "mucho gusto", emoji: "🤝" },
        { id: "o1", word: "hasta luego", emoji: "🚪" },
        { id: "o2", word: "gracias", emoji: "🙏" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "es-m1v2-7-cloze-no",
      "",
      "gracias",
      "no",
      ["no", "sí", "o", "y"],
      "no, thank you",
      "no gracias",
      "The polite no: «no gracias». («sí» would need «por favor».)",
      ["no"],
    ),
    vocabTextMcq(
      // y/o by TEXT, answering O (lane: L6 o → checkpoint y → here o →
      // L8 both) — both halves live in every trial.
      "es-m1v2-7-mc-o",
      "o",
      ["y", "sí", "no"],
    ),
    speaking("es-m1v2-7-speak-perdon-recall", "perdón", "sorry", ["perdón"], "recall"),
    {
      // seis/siete by EAR, answering SIETE (checkpoint answered seis).
      id: "es-m1v2-7-hear-siete",
      type: "word_image_mcq",
      meaningEn: "siete",
      options: [
        { id: "correct", word: "siete", emoji: "7️⃣" },
        { id: "o1", word: "seis", emoji: "6️⃣" },
        { id: "o2", word: "ocho", emoji: "8️⃣" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      // tardes/noches by ear — answering TARDES (checkpoint: noches).
      id: "es-m1v2-7-lc-buenastardes",
      audioText: "buenas tardes",
      correctMeaningEn: "Good afternoon.",
      distractorsEn: ["Good morning.", "Good night.", "See you later."],
    }),
    vocabTextMcq("es-m1v2-7-mc-cero", "cero", ["cinco", "uno", "dos"]),
    matchPairs("es-m1v2-7-match", [
      "gracias",
      "sí",
      "no",
      "cuatro",
      "seis",
      "buenos días",
    ]),
    // WIN: speak the line that opened the conversation — first voicing
    // of the full greeting, printed (§13.9).
    speaking(
      "es-m1v2-7-speak-holabuenosdias",
      "hola buenos días",
      "hi, good morning",
      ["hola", "buenos días"],
    ),
  ];
}

/**
 * L8 — Mastery. Graded steps only, no cards, no digit crutches (R4);
 * EVERY module item appears (R2 — the old mastery never tested gracias,
 * sí, no, the polite sentences, or most numbers). The module's first
 * TYPED production (translate, R8). Ends on a two-turn Ana goodbye —
 * the module closes on a conversation, not a grid (R7).
 */
function lesson8(): LessonStep[] {
  return [
    {
      id: "es-m1v2-8-hear-buenasnoches",
      type: "word_image_mcq",
      meaningEn: "buenas noches",
      options: [
        { id: "correct", word: "buenas noches", emoji: "🌙" },
        { id: "o1", word: "buenos días", emoji: "🌅" },
        { id: "o2", word: "buenas tardes", emoji: "☀️" },
      ],
      correctOptionId: "correct",
    },
    build(
      "es-m1v2-8-build-buenastardes",
      "Build: 'good afternoon'",
      "buenas tardes",
      ["buenas", "tardes", "buenos", "días"],
      ["buenas", "tardes"],
    ),
    cloze(
      // buenos/buenas in mastery — answer BUENOS (the build above
      // answered buenas). Fresh frame: L3's cloze was bare «___ días»,
      // and a verbatim repeat tests screen-memory, not Spanish.
      "es-m1v2-8-cloze-buenos",
      "hola,",
      "días",
      "buenos",
      ["buenos", "buenas"],
      "hi, good morning",
      "hola buenos días",
      "«buenos» with días — never «buenas días».",
    ),
    vocabTextMcq("es-m1v2-8-mc-ocho", "ocho", ["nueve", "dos", "diez"]),
    {
      id: "es-m1v2-8-hear-dos",
      type: "word_image_mcq",
      meaningEn: "dos",
      options: [
        { id: "correct", word: "dos", emoji: "2️⃣" },
        { id: "o1", word: "diez", emoji: "🔟" },
        { id: "o2", word: "cero", emoji: "0️⃣" },
      ],
      correctOptionId: "correct",
    },
    // «mucho gusto» summoned from English for the FIRST time — before
    // this it was only ever echoed back at someone who just said it.
    speaking(
      "es-m1v2-8-speak-muchogusto",
      "mucho gusto",
      "nice to meet you",
      ["mucho gusto"],
      "recall",
    ),
    cloze(
      "es-m1v2-8-cloze-o",
      "cuatro",
      "cinco",
      "o",
      ["o", "y", "no", "sí"],
      "four or five",
      "cuatro o cinco",
      "A choice between numbers takes «o» — «y» would add them together.",
      ["o"],
    ),
    listeningCompSentence({
      id: "es-m1v2-8-lc-nogracias",
      audioText: "no gracias",
      correctMeaningEn: "No, thank you.",
      distractorsEn: ["Yes, please.", "Sorry!", "Good night."],
    }),
    build(
      // Was the module's typed translate (R8) — typed production grades spelling a
      // beginner hasn't been taught (Spencer, fr m1 L9 walk 2026-08-21:
      // his phonetically-right «si vu plait» failed). A tile build tests
      // the same recall — which words, what order — without the spelling tax.
      "es-m1v2-8-build-siporfavor",
      "Build: 'yes, please'",
      "sí por favor",
      ["sí", "por", "favor", "no", "gracias"],
      ["sí", "por", "favor"],
    ),
    {
      id: "es-m1v2-8-map-holabuenosdias",
      type: "word_map",
      tokens: ["hola", "buenos", "días"],
      pairs: [
        { en: "hello", tokenIndex: 0 },
        { en: "good", tokenIndex: 1 },
        { en: "morning", tokenIndex: 2 },
      ],
      audioText: "hola buenos días",
      // «hola» stays untinted on purpose — the contrast between the
      // blue agreement chain and the neutral word IS the lesson.
      tokenGenders: { 1: "m", 2: "m" },
    },
    {
      // seis/siete final ear trial — answer SEIS (L7 answered siete).
      id: "es-m1v2-8-hear-seis",
      type: "word_image_mcq",
      meaningEn: "seis",
      options: [
        { id: "correct", word: "seis", emoji: "6️⃣" },
        { id: "o1", word: "siete", emoji: "7️⃣" },
        { id: "o2", word: "nueve", emoji: "9️⃣" },
      ],
      correctOptionId: "correct",
    },
    speaking("es-m1v2-8-speak-diez", "diez", "ten", ["diez"], "recall"),
    cloze(
      "es-m1v2-8-cloze-y",
      "ocho",
      "nueve",
      "y",
      ["y", "o", "no", "sí"],
      "eight and nine",
      "ocho y nueve",
      "«y» joins them — eight AND nine.",
      ["y"],
    ),
    matchPairs("es-m1v2-8-match", [
      "perdón",
      "por favor",
      "mucho gusto",
      "uno",
      "tres",
      "sí",
    ]),
    {
      // THE MODULE ENDS ON ANA (R7) — two turns, every line known, both
      // mirrors accepted. Not a grid.
      id: "es-m1v2-8-sim-goodbye",
      type: "dialogue_sim",
      scene: {
        emoji: "🌆",
        title: "Ana heads home",
        setting: "End of your first week.",
      },
      exercisedAtomIds: [],
      explanation:
        "That was the module: greet, meet, count, take an offer, and say goodnight — all of it in Spanish. Module 2 keeps the conversation going.",
      turns: [
        {
          id: "t1-noches",
          npc: {
            speaker: "Ana",
            kana: "Buenas noches.",
            audioText: "buenas noches",
            gloss: "Good night.",
          },
          goal: "Wish her a good night back.",
          reply: {
            mode: "choice",
            options: [
              { id: "noches", text: "buenas noches" },
              { id: "dias", text: "buenos días" },
              { id: "gracias", text: "gracias" },
            ],
            correctOptionId: "noches",
            audioText: "buenas noches",
          },
          replyGloss: "Good night.",
        },
        {
          id: "t2-despedida",
          npc: {
            speaker: "Ana",
            kana: "Adiós. Hasta luego.",
            audioText: "adiós hasta luego",
            gloss: "Bye — see you later.",
          },
          goal: "Send her off — either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "luego", text: "hasta luego" },
              { id: "adios", text: "adiós" },
              { id: "nogracias", text: "no gracias" },
            ],
            correctOptionId: "luego",
            alsoCorrectOptionIds: ["adios"],
            audioText: "hasta luego",
          },
          replyGloss: "See you later!",
        },
      ],
    },
  ];
}

const ES_M1_1: LessonContent = {
  id: "es-m1-1",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Say hello — and no, politely",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const ES_M1_2: LessonContent = {
  id: "es-m1-2",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Ask nicely, apologize smoothly",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const ES_M1_3: LessonContent = {
  id: "es-m1-3",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Greet anyone, any time of day",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const ES_M1_4: LessonContent = {
  id: "es-m1-4",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Count to four — and a warmer goodbye",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const ES_M1_5: LessonContent = {
  id: "es-m1-5",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Five, six, seven — nice to meet you",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const ES_M1_6: LessonContent = {
  id: "es-m1-6",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Eight, nine, ten — and, or",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const ES_M1_7: LessonContent = {
  id: "es-m1-7",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "✓ Checkpoint · Prove the first six",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const ES_M1_8: LessonContent = {
  id: "es-m1-8",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Your first real conversation",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const ES_M1_9: LessonContent = {
  id: "es-m1-9",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Prove it — then say goodnight",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson8(),
};

export const ES_M1_LESSONS: LessonContent[] = [
  ES_M1_1,
  ES_M1_2,
  ES_M1_3,
  ES_M1_4,
  ES_M1_5,
  ES_M1_6,
  ES_M1_7,
  ES_M1_8,
  ES_M1_9,
];

/** 1-based position of the zero-new checkpoint lesson. */
export const ES_M1_CHECKPOINT_INDEX = 7;

export const ES_M1_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
  {
    id: "pt-es-screen-m1",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-es-screen-m1",
        prompt: "'Thank you' — which is correct?",
        correctText: "gracias",
        distractorsText: ["hola", "adiós", "por favor"],
      }),
  },
  ],
  byModule: [
  {
    id: "pt-es-m1-1",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-es-m1-1",
        prompt: "'Hello' — which is correct?",
        correctText: "hola",
        distractorsText: ["adiós", "gracias", "perdón"],
      }),
  },
  {
    id: "pt-es-m1-2",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-es-m1-2",
        prompt: "It's late at night. Which greeting fits?",
        correctText: "buenas noches",
        distractorsText: ["buenos días", "buenas tardes", "hasta luego"],
      }),
  },
  {
    id: "pt-es-m1-3",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-es-m1-3",
        prompt: "'Seven' — which is correct?",
        correctText: "siete",
        distractorsText: ["seis", "nueve", "cinco"],
      }),
  },
  {
    id: "pt-es-m1-4",
    moduleId: "m1",
    build: () =>
      sentenceMcq({
        id: "pt-es-m1-4",
        prompt: "'four and five' — pick the Spanish.",
        correctText: "cuatro y cinco",
        distractorsText: ["cuatro o cinco", "cuatro no cinco", "cuatro sí cinco"],
      }),
  },
  ],
};
