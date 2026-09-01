/**
 * m9.ts — Grand, grande — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-01 per the playbook arc (docs/fr-authoring-playbook.md
 * §8): m8's L10 promised «describe it all — grand, petite, and the sound
 * of agreement». FR's first adjective module.
 *
 * SCOPE DECISIONS (all deliberate):
 *   - AUDIBLE PAIRS ONLY (pin F1/F5 discipline): grand/grande (the -e
 *     wakes the d), petit/petite (wakes the t), bon/bonne (bohn → bun) —
 *     every taught agreement can be HEARD, so ear steps are honest by
 *     construction and no homophoneKey machinery is needed yet.
 *     Written-only pairs (joli/jolie class) are DEFERRED to a later
 *     adjective wave that ships with the homophone tables.
 *   - ALL THREE ADJECTIVES ARE PRE-NOMINAL (BAGS set, pin F8): «un grand
 *     chat», «ma petite sœur» — so adjective POSITION needs no contrast
 *     yet. The post-nominal default (and position-meaning pairs) is its
 *     own future beat, added to the playbook registry.
 *   - m-form and f-form register as SEPARATE atoms (the m2
 *     étudiant/étudiante precedent) with partOfSpeech "adjective".
 *   - «bonne» completes m1's «bon» — the callback is authored as the
 *     module's emotional beat: the learner has been agreeing an
 *     adjective since «bonne nuit» without knowing. On food, bon/bonne
 *     = delicious (the m6 compliment payoff).
 *   - «très» — very — accent-lenient, agreement-free, glues every
 *     sentence up a notch. Family bonus meanings surfaced in reveals:
 *     «ma petite sœur» = little sister, «mon grand frère» = big brother.
 *   - AGREEMENT_CHAIN DEBUTS HERE (five steps: L4 · L5 · L7 · L8 · L10):
 *     determiner + adjective flexing together on one head noun is
 *     exactly the shape the type was built for. Chains are graded,
 *     not selection-typed, and expose no new words (their whole
 *     inventory is pre-taught) — playbook updated in-pass.
 *   - Only pronoun-adjective sentences with PEOPLE use il/elle («il est
 *     très grand» about your dog's… no — about people and pets already
 *     established as il); elle-for-inanimate-nouns (la maison → elle)
 *     is real French but a new concept — deferred, sentences keep the
 *     noun («la maison est petite»).
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   un grand chat L1 · une grande maison L1 · une grande ville L1 ·
 *   ma petite sœur L2 · mon petit chat L2 · mon grand frère L2 ·
 *   mon frère est très grand L3 · la ville est très grande L3 ·
 *   la pizza est très bonne L4 · le gâteau est très bon L4 ·
 *   il y a un petit café ici L5 · c'est une petite ville L5 ·
 *   la salade est très bonne L6 · elle est très grande L7
 *   recalls drawn: aujourd'hui c'est vendredi L1 (m8) · un grand chat
 *   L2 · ma petite sœur L3+L10 · mon frère est très grand L4+L8 ·
 *   la pizza est très bonne L5 · une grande maison L6 · mon petit chat
 *   L6 · mon grand frère L7 · le gâteau est très bon L7 · une grande
 *   ville L8 · il y a un petit café ici L8 · la salade est très bonne
 *   L9 · c'est une petite ville L9 · la ville est très grande L10.
 *
 * Cast: Chloé and the little cat; Hugo mis-sizes your house; the madame
 * receives the cake verdict; Léa hosts the compliment dinner; Emma
 * doubts your town; Louis meets the big family; Chloé's grand tour
 * closes it.
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
  genderSort,
  agreementChain,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";


export const FR_M9_ATOMS: FrAtom[] = [
  atom({ surface: "grand", meaningEn: "big / tall (m-form)", partOfSpeech: "adjective", fromModule: "m9", kind: "vocab", hint: "grahn — the d sleeps" }),
  atom({ surface: "grande", meaningEn: "big / tall (f-form)", partOfSpeech: "adjective", fromModule: "m9", kind: "vocab", hint: "grahnd — the -e wakes the d, the étudiante trick" }),
  atom({ surface: "petit", meaningEn: "small / little (m-form)", partOfSpeech: "adjective", fromModule: "m9", kind: "vocab", hint: "puh-TEE — the t sleeps" }),
  atom({ surface: "petite", meaningEn: "small / little (f-form)", partOfSpeech: "adjective", fromModule: "m9", kind: "vocab", hint: "puh-TEET — the -e wakes the t" }),
  atom({ surface: "bonne", meaningEn: "good / tasty (f-form)", partOfSpeech: "adjective", fromModule: "m9", kind: "vocab", hint: "bun — bon's other half, worn since «bonne nuit»" }),
  atom({ surface: "très", meaningEn: "very", partOfSpeech: "adverb", fromModule: "m9", kind: "vocab", hint: "treh — the s sleeps; agreement never touches it" }),
];

/** L1 — grand/grande: the wake-up letter goes productive. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m9-1-info-grand",
      "The letter that wakes up, again",
      "«grand» — big, tall (grahn, the d asleep). Add -e and it wakes: «grande» (grahnd). You've heard this trick since «étudiante» — now it works on ANYTHING: «un grand chat», «une grande maison». The adjective dresses to match its noun's side.",
      "grammar",
    ),
    {
      id: "fr-m9-1-map-grandchat",
      type: "word_map",
      tokens: ["un", "grand", "chat"],
      pairs: [
        { en: "a", tokenIndex: 0 },
        { en: "big", tokenIndex: 1 },
        { en: "cat", tokenIndex: 2 },
      ],
      audioText: "un grand chat",
      tokenGenders: { 0: "m", 1: "m", 2: "m" },
      revealNote:
        "Blue across the whole chain — un, grand, chat wear the same uniform.",
    },
    speaking("fr-m9-1-speak-grandchat", "un grand chat", "a big cat", []),
    cloze(
      "fr-m9-1-cloze-grand",
      "un",
      "chat",
      "grand",
      ["grand", "grande"],
      "a big cat",
      "un grand chat",
      "«chat» — blue-m: «grand» stays bare, its d asleep.",
    ),
    {
      id: "fr-m9-1-map-grandemaison",
      type: "word_map",
      tokens: ["une", "grande", "maison"],
      pairs: [
        { en: "a", tokenIndex: 0 },
        { en: "big", tokenIndex: 1 },
        { en: "house", tokenIndex: 2 },
      ],
      audioText: "une grande maison",
      tokenGenders: { 0: "f", 1: "f", 2: "f" },
      revealNote:
        "Pink across the chain — and you can HEAR it: grahnd, the d awake.",
    },
    speaking("fr-m9-1-speak-grandemaison", "une grande maison", "a big house", []),
    listeningCompSentence({
      // Ear trial 1 — answer the F-form.
      id: "fr-m9-1-lc-elleestgrande",
      audioText: "elle est grande",
      correctMeaningEn: "She is tall.",
      distractorsEn: ["He is tall.", "She is small.", "She is a student."],
    }),
    {
      // TAIL: m4 by ear.
      id: "fr-m9-1-hear-maison",
      type: "word_image_mcq",
      meaningEn: "la maison",
      options: [
        { id: "correct", word: "la maison", emoji: "🏠" },
        { id: "o1", word: "la ville", emoji: "🏙️" },
        { id: "o2", word: "l'école", emoji: "🏫" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: m8 calendar lane, from memory.
    speaking(
      "fr-m9-1-speak-vendredi-recall",
      "aujourd'hui c'est vendredi",
      "today is Friday",
      [],
      "recall",
    ),
    cloze(
      "fr-m9-1-cloze-grande",
      "une",
      "ville",
      "grande",
      ["grande", "grand"],
      "a big city",
      "une grande ville",
      "«ville» — pink-f: «grande», dressed to match.",
    ),
    listeningCompSentence({
      // Ear trial 2 — answer the M-form (alternation, §13.9 law 4).
      id: "fr-m9-1-lc-ilestgrand",
      audioText: "il est grand",
      correctMeaningEn: "He is tall.",
      distractorsEn: ["She is tall.", "He is small.", "He is a student."],
    }),
    {
      id: "fr-m9-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-grand", source: "grand", target: "big / tall (m-form)" },
        { id: "p-grande", source: "grande", target: "big / tall (f-form)" },
        { id: "p-chat", source: "chat", target: "cat" },
        { id: "p-maison", source: "maison", target: "house" },
        { id: "p-ville", source: "ville", target: "town / city" },
        { id: "p-merci", source: "merci", target: "thank you" },
      ],
    },
    // WIN: size up the city — printed first voicing.
    speaking("fr-m9-1-speak-grandeville", "une grande ville", "a big city", []),
  ];
}

/** L2 — petit/petite: small, and warm on family. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m9-2-info-petit",
      "Small, and younger",
      "«petit» — small (puh-TEE), «petite» — puh-TEET, the -e waking the t this time. On family it warms up: «ma petite sœur» — my little sister, «mon grand frère» — my big brother. Size words, worn like nicknames.",
      "grammar",
    ),
    {
      id: "fr-m9-2-map-petitesoeur",
      type: "word_map",
      tokens: ["ma", "petite", "sœur"],
      pairs: [
        { en: "my", tokenIndex: 0 },
        { en: "little", tokenIndex: 1 },
        { en: "sister", tokenIndex: 2 },
      ],
      audioText: "ma petite sœur",
      tokenGenders: { 0: "f", 1: "f", 2: "f" },
      revealNote:
        "Pink chain, warm meaning — «petite sœur» is little sister the affectionate way.",
    },
    speaking("fr-m9-2-speak-petitesoeur", "ma petite sœur", "my little sister", []),
    cloze(
      "fr-m9-2-cloze-petit",
      "mon",
      "chat",
      "petit",
      ["petit", "petite"],
      "my little cat",
      "mon petit chat",
      "«chat» — blue-m: «petit», t asleep.",
    ),
    {
      id: "fr-m9-2-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "🐱",
        title: "Chloé melts",
        setting: "Your cat photo strikes again.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-chat",
          npc: {
            speaker: "Chloé",
            kana: "C'est ton chat ?",
            audioText: "c'est ton chat ?",
            gloss: "Is that your cat?",
          },
          goal: "Yes — and he's little.",
          reply: {
            mode: "choice",
            options: [
              { id: "petit", text: "oui c'est mon petit chat" },
              { id: "petite", text: "oui c'est ma petite chat" },
              { id: "tuas", text: "oui tu as un chat" },
            ],
            correctOptionId: "petit",
            audioText: "oui c'est mon petit chat",
          },
          replyGloss: "Yes — that's my little cat.",
          explanation:
            "«chat» is blue-m — mon petit chat. «ma petite» would dress him in the wrong uniform.",
        },
      ],
    },
    speaking("fr-m9-2-speak-petitchat", "mon petit chat", "my little cat", []),
    listeningCompSentence({
      id: "fr-m9-2-lc-elleestpetite",
      audioText: "elle est petite",
      correctMeaningEn: "She is small.",
      distractorsEn: ["He is small.", "She is tall.", "She is my sister."],
    }),
    {
      // TAIL: m7 by ear.
      id: "fr-m9-2-hear-frere",
      type: "word_image_mcq",
      meaningEn: "le frère",
      options: [
        { id: "correct", word: "le frère", emoji: "👦" },
        { id: "o1", word: "la sœur", emoji: "👧" },
        { id: "o2", word: "le père", emoji: "🧔" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L1's chain, from memory.
    speaking("fr-m9-2-speak-grandchat-recall", "un grand chat", "a big cat", [], "recall"),
    cloze(
      "fr-m9-2-cloze-petite",
      "ma",
      "sœur",
      "petite",
      ["petite", "petit"],
      "my little sister",
      "ma petite sœur",
      "«sœur» — pink-f: «petite», the t wide awake.",
    ),
    build(
      "fr-m9-2-build-grandfrere",
      "Build: 'my big brother'",
      "mon grand frère",
      ["mon", "grand", "frère", "grande", "ma"],
      ["mon", "grand", "frère"],
    ),
    {
      id: "fr-m9-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-petit", source: "petit", target: "small (m-form)" },
        { id: "p-petite", source: "petite", target: "small (f-form)" },
        { id: "p-frere", source: "frère", target: "brother" },
        { id: "p-soeur", source: "sœur", target: "sister" },
        { id: "p-grand", source: "grand", target: "big / tall (m-form)" },
        { id: "p-deux", source: "deux", target: "two" },
      ],
    },
    // WIN: the elder claimed — printed first voicing.
    speaking("fr-m9-2-speak-grandfrere", "mon grand frère", "my big brother", []),
  ];
}

/** L3 — «très» + the predicative frame: adjectives after «est». */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m9-3-info-tres",
      "Very — and the verb steps in",
      "«très» — very (treh). And adjectives can follow «est»: «Mon frère est très grand» — my brother is very tall. «La maison est petite» — the house is small. Wherever the adjective stands, the agreement never lets go.",
      "grammar",
    ),
    {
      id: "fr-m9-3-map-frengrand",
      type: "word_map",
      tokens: ["mon", "frère", "est", "très", "grand"],
      pairs: [
        { en: "my", tokenIndex: 0 },
        { en: "brother", tokenIndex: 1 },
        { en: "is", tokenIndex: 2 },
        { en: "very", tokenIndex: 3 },
        { en: "tall", tokenIndex: 4 },
      ],
      audioText: "mon frère est très grand",
      tokenGenders: { 0: "m", 1: "m", 4: "m" },
      revealNote:
        "The chain leaps OVER «est très» — mon and grand still answer to frère.",
    },
    speaking(
      "fr-m9-3-speak-freregrand",
      "mon frère est très grand",
      "my brother is very tall",
      [],
    ),
    cloze(
      "fr-m9-3-cloze-petite",
      "la maison est",
      "",
      "petite",
      ["petite", "petit"],
      "the house is small",
      "la maison est petite",
      "«maison» keeps its -e claim on the adjective, even across «est».",
    ),
    {
      id: "fr-m9-3-sim-hugo",
      type: "dialogue_sim",
      scene: {
        emoji: "🏠",
        title: "Hugo, being generous",
        setting: "Your place. It is not big.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-maison",
          npc: {
            speaker: "Hugo",
            kana: "Ta maison est grande !",
            audioText: "ta maison est grande !",
            gloss: "Your house is big!",
          },
          goal: "It's small — correct him, kindly.",
          reply: {
            mode: "choice",
            options: [
              { id: "petite", text: "la maison est petite" },
              { id: "petit", text: "la maison est petit" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "petite",
            audioText: "la maison est petite",
          },
          replyGloss: "The house is small.",
          explanation:
            "Modest, and correctly dressed — «maison» keeps its -e even in modesty.",
        },
      ],
    },
    // TAIL: the little sister, from memory.
    speaking(
      "fr-m9-3-speak-petitesoeur-recall",
      "ma petite sœur",
      "my little sister",
      [],
      "recall",
    ),
    cloze(
      "fr-m9-3-cloze-grand",
      "mon frère est très",
      "",
      "grand",
      ["grand", "grande"],
      "my brother is very tall",
      "mon frère est très grand",
      "«très» changes the volume, never the agreement — «frère» keeps it bare.",
    ),
    {
      // TAIL: m4 by ear.
      id: "fr-m9-3-hear-ville",
      type: "word_image_mcq",
      meaningEn: "la ville",
      options: [
        { id: "correct", word: "la ville", emoji: "🏙️" },
        { id: "o1", word: "la maison", emoji: "🏠" },
        { id: "o2", word: "la gare", emoji: "🚉" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      id: "fr-m9-3-lc-villegrande",
      audioText: "la ville est très grande",
      correctMeaningEn: "The city is very big.",
      distractorsEn: ["The city is small.", "The house is very big.", "She is very tall."],
    }),
    build(
      "fr-m9-3-build-maisonpetite",
      "Build: 'the house is very small'",
      "la maison est très petite",
      ["la", "maison", "est", "très", "petite", "petit"],
      ["la", "maison", "est", "très", "petite"],
    ),
    listeningCompSentence({
      // TAIL: m5 question lane.
      id: "fr-m9-3-lc-tuvasou",
      audioText: "tu vas où ?",
      correctMeaningEn: "Where are you going?",
      distractorsEn: ["Where are you from?", "When is it?", "How's it going?"],
    }),
    {
      id: "fr-m9-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-tres", source: "très", target: "very" },
        { id: "p-grand", source: "grand", target: "big / tall (m-form)" },
        { id: "p-maison", source: "maison", target: "house" },
        { id: "p-ville", source: "ville", target: "town / city" },
        { id: "p-aujourdhui", source: "aujourd'hui", target: "today" },
        { id: "p-trois", source: "trois", target: "three" },
      ],
    },
    // WIN: brag about the city — printed first voicing.
    speaking(
      "fr-m9-3-speak-villegrande",
      "la ville est très grande",
      "the city is very big",
      [],
    ),
  ];
}

/** L4 — «bonne»: m1's other half arrives, food gets its verdict, and
 *  the agreement_chain debuts. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m9-4-info-bonne",
      "The half you always knew",
      "«bon» has been yours since «bonjour» — meet its -e: «bonne», the one you've worn in «bonne nuit» all along. On food it means delicious: «Le gâteau est très bon», «La pizza est très bonne». Say it to a cook and watch their day improve.",
      "grammar",
    ),
    {
      id: "fr-m9-4-map-pizzabonne",
      type: "word_map",
      tokens: ["la", "pizza", "est", "très", "bonne"],
      pairs: [
        { en: "the", tokenIndex: 0 },
        { en: "pizza", tokenIndex: 1 },
        { en: "is", tokenIndex: 2 },
        { en: "very", tokenIndex: 3 },
        { en: "good", tokenIndex: 4 },
      ],
      audioText: "la pizza est très bonne",
      tokenGenders: { 0: "f", 1: "f", 4: "f" },
      revealNote:
        "bun — «bonne», the sound you've made since module 1's good-night, finally explained.",
    },
    speaking(
      "fr-m9-4-speak-pizzabonne",
      "la pizza est très bonne",
      "the pizza is very good",
      [],
    ),
    cloze(
      "fr-m9-4-cloze-bon",
      "le gâteau est très",
      "",
      "bon",
      ["bon", "bonne"],
      "the cake is very good",
      "le gâteau est très bon",
      "«gâteau» — blue-m: «bon», nasal and bare.",
    ),
    {
      id: "fr-m9-4-sim-madame",
      type: "dialogue_sim",
      scene: {
        emoji: "🍰",
        title: "The madame checks in",
        setting: "Half the cake is already gone.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-verdict",
          npc: {
            speaker: "The madame",
            kana: "Ça va ?",
            audioText: "ça va",
            gloss: "Everything okay? (the server's check-in)",
          },
          goal: "The cake is VERY good — tell her.",
          reply: {
            mode: "choice",
            options: [
              { id: "bon", text: "le gâteau est très bon" },
              { id: "bonne", text: "le gâteau est très bonne" },
              { id: "laddition", text: "l'addition s'il vous plaît" },
            ],
            correctOptionId: "bon",
            audioText: "le gâteau est très bon",
          },
          replyGloss: "The cake is very good.",
          explanation:
            "«gâteau» is blue-m — très bon. The compliment lands harder when it's dressed right.",
        },
      ],
    },
    // TAIL: the tall brother, from memory.
    speaking(
      "fr-m9-4-speak-freregrand-recall",
      "mon frère est très grand",
      "my brother is very tall",
      [],
      "recall",
    ),
    agreementChain({
      id: "fr-m9-4-chain-gateau",
      prompt: "Dress the whole sentence to match «gâteau».",
      head: { surface: "gâteau", meaningEn: "cake", featureLabel: "blue-m" },
      tokens: [
        { kind: "slot", id: "s-art", options: ["le", "la"], correct: "le", roleLabel: "masculine article" },
        { kind: "fixed", text: "gâteau" },
        { kind: "fixed", text: "est" },
        { kind: "fixed", text: "très" },
        { kind: "slot", id: "s-adj", options: ["bon", "bonne"], correct: "bon", roleLabel: "masculine adjective" },
      ],
      meaningEn: "the cake is very good",
      audioText: "le gâteau est très bon",
      ruleNote: "One noun, one side — every slot dresses to match.",
    }),
    {
      // TAIL: m6 by ear.
      id: "fr-m9-4-hear-gateau",
      type: "word_image_mcq",
      meaningEn: "le gâteau",
      options: [
        { id: "correct", word: "le gâteau", emoji: "🍰" },
        { id: "o1", word: "la salade", emoji: "🥗" },
        { id: "o2", word: "le fromage", emoji: "🧀" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      id: "fr-m9-4-lc-pizzabonne",
      audioText: "la pizza est très bonne",
      correctMeaningEn: "The pizza is very good.",
      distractorsEn: ["The cake is very good.", "The pizza is small.", "I like pizza."],
    }),
    cloze(
      "fr-m9-4-cloze-bonne",
      "la salade est très",
      "",
      "bonne",
      ["bonne", "bon"],
      "the salad is very good",
      "la salade est très bonne",
      "«salade» — pink-f: «bonne», bun with the n landing.",
    ),
    build(
      "fr-m9-4-build-cafebon",
      "Build: 'the coffee is very good'",
      "le café est très bon",
      ["le", "café", "est", "très", "bon", "bonne"],
      ["le", "café", "est", "très", "bon"],
    ),
    {
      id: "fr-m9-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-bonne", source: "bonne", target: "good / tasty (f-form)" },
        { id: "p-bon", source: "bon", target: "good (masculine)" },
        { id: "p-gateau", source: "gâteau", target: "cake" },
        { id: "p-pizza", source: "pizza", target: "pizza" },
        { id: "p-tres", source: "très", target: "very" },
        { id: "p-quatre", source: "quatre", target: "four" },
      ],
    },
    // WIN: the verdict, out loud — printed first voicing.
    speaking(
      "fr-m9-4-speak-gateaubon",
      "le gâteau est très bon",
      "the cake is very good",
      [],
    ),
  ];
}

/** L5 — sizes, quality, places: the machine runs everywhere. Zero new. */
function lesson5(): LessonStep[] {
  return [
    {
      id: "fr-m9-5-sim-louis",
      type: "dialogue_sim",
      scene: {
        emoji: "🏛️",
        title: "Louis, impressed",
        setting: "The museum looms.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-musee",
          npc: {
            speaker: "Louis",
            kana: "C'est quoi ?",
            audioText: "c'est quoi ?",
            gloss: "What's that?",
          },
          goal: "The museum — and it's big.",
          reply: {
            mode: "choice",
            options: [
              { id: "grand", text: "c'est un grand musée" },
              { id: "grande", text: "c'est un grande musée" },
              { id: "quand", text: "c'est quand ?" },
            ],
            correctOptionId: "grand",
            audioText: "c'est un grand musée",
          },
          replyGloss: "It's a big museum.",
          explanation:
            "«musée» — blue-m even at size: un grand musée. Its -ée ending lies; its side doesn't.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m9-5-lc-petiteville",
      audioText: "c'est une petite ville",
      correctMeaningEn: "It's a small town.",
      distractorsEn: ["It's a big town.", "It's a small house.", "There's a town."],
    }),
    // TAIL: the pizza verdict, from memory.
    speaking(
      "fr-m9-5-speak-pizzabonne-recall",
      "la pizza est très bonne",
      "the pizza is very good",
      [],
      "recall",
    ),
    cloze(
      "fr-m9-5-cloze-petite",
      "c'est une",
      "ville",
      "petite",
      ["petite", "petit"],
      "it's a small town",
      "c'est une petite ville",
      "«ville» — pink-f: «petite», wherever «c'est» points.",
    ),
    {
      id: "fr-m9-5-map-petitcafe",
      type: "word_map",
      tokens: ["il y a", "un", "petit", "café", "ici"],
      pairs: [
        { en: "there is", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "little", tokenIndex: 2 },
        { en: "café", tokenIndex: 3 },
        { en: "here", tokenIndex: 4 },
      ],
      audioText: "il y a un petit café ici",
      tokenGenders: { 1: "m", 2: "m", 3: "m" },
      revealNote:
        "m4's existence machine takes adjectives now — a little café, conjured in five chips.",
    },
    speaking(
      "fr-m9-5-speak-petitcafe",
      "il y a un petit café ici",
      "there's a little café here",
      [],
    ),
    agreementChain({
      id: "fr-m9-5-chain-maison",
      prompt: "Dress the chain to match «maison».",
      head: { surface: "maison", meaningEn: "house", featureLabel: "pink-f" },
      tokens: [
        { kind: "slot", id: "s-art", options: ["une", "un"], correct: "une", roleLabel: "feminine article" },
        { kind: "slot", id: "s-adj", options: ["grande", "grand"], correct: "grande", roleLabel: "feminine adjective" },
        { kind: "fixed", text: "maison" },
      ],
      meaningEn: "a big house",
      audioText: "une grande maison",
      ruleNote: "Article and adjective flex together — the noun never does.",
    }),
    {
      // TAIL: m4 by ear.
      id: "fr-m9-5-hear-musee",
      type: "word_image_mcq",
      meaningEn: "le musée",
      options: [
        { id: "correct", word: "le musée", emoji: "🏛️" },
        { id: "o1", word: "l'école", emoji: "🏫" },
        { id: "o2", word: "l'hôtel", emoji: "🏨" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      id: "fr-m9-5-lc-chiengrand",
      audioText: "mon chien est très grand",
      correctMeaningEn: "My dog is very big.",
      distractorsEn: ["My dog is very small.", "My cat is very big.", "My brother is very tall."],
    }),
    build(
      "fr-m9-5-build-petitemaison",
      "Build: 'it's a small house'",
      "c'est une petite maison",
      ["c'est", "une", "petite", "maison", "petit", "grand"],
      ["c'est", "une", "petite", "maison"],
    ),
    listeningCompSentence({
      // TAIL: m2 agreement ancestor.
      id: "fr-m9-5-lc-etudiante",
      audioText: "elle est étudiante",
      correctMeaningEn: "She is a student.",
      distractorsEn: ["He is a student.", "She is very tall.", "She is my sister."],
    }),
    {
      id: "fr-m9-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-musee", source: "musée", target: "museum" },
        { id: "p-chien", source: "chien", target: "dog" },
        { id: "p-tres", source: "très", target: "very" },
        { id: "p-bonne", source: "bonne", target: "good / tasty (f-form)" },
        { id: "p-quand", source: "c'est quand ?", target: "when is it?" },
        { id: "p-cinq", source: "cinq", target: "five" },
      ],
    },
    // WIN: the modest town — printed first voicing.
    speaking(
      "fr-m9-5-speak-petiteville",
      "c'est une petite ville",
      "it's a small town",
      [],
    ),
  ];
}

/** L6 — the compliment machine at dinner. Zero new. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m9-6-sim-lea",
      type: "dialogue_sim",
      scene: {
        emoji: "🍽️",
        title: "Dinner at Léa's",
        setting: "Two courses, two verdicts owed.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-pizza",
          npc: {
            speaker: "Léa",
            kana: "Tu aimes la pizza ?",
            audioText: "tu aimes la pizza ?",
            gloss: "Do you like the pizza?",
          },
          goal: "You love it — it's VERY good.",
          reply: {
            mode: "choice",
            options: [
              { id: "bonne", text: "oui la pizza est très bonne" },
              { id: "bon", text: "oui la pizza est très bon" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "bonne",
            audioText: "oui la pizza est très bonne",
          },
          replyGloss: "Yes — the pizza is very good.",
        },
        {
          id: "t2-gateau",
          npc: {
            speaker: "Léa",
            kana: "Et le gâteau ?",
            audioText: "et le gâteau ?",
            gloss: "And the cake?",
          },
          goal: "Also very good — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "bon", text: "le gâteau est très bon" },
              { id: "bonne", text: "le gâteau est très bonne" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "bon",
            audioText: "le gâteau est très bon",
          },
          replyGloss: "The cake is very good.",
          explanation:
            "Two courses, two sides, one rule — the -e follows the noun, not the flavor.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m9-6-lc-cafebon",
      audioText: "le café est très bon",
      correctMeaningEn: "The coffee is very good.",
      distractorsEn: ["The cake is very good.", "The café is small.", "I would like a coffee."],
    }),
    // TAIL: L1's pink chain, from memory.
    speaking(
      "fr-m9-6-speak-grandemaison-recall",
      "une grande maison",
      "a big house",
      [],
      "recall",
    ),
    cloze(
      "fr-m9-6-cloze-grand",
      "mon chien est très",
      "",
      "grand",
      ["grand", "grande"],
      "my dog is very big",
      "mon chien est très grand",
      "«chien» — blue-m: bare «grand», even at full size.",
    ),
    build(
      "fr-m9-6-build-saladebonne",
      "Build: 'the salad is very good'",
      "la salade est très bonne",
      ["la", "salade", "est", "très", "bonne", "bon"],
      ["la", "salade", "est", "très", "bonne"],
    ),
    {
      // TAIL: m3 by ear.
      id: "fr-m9-6-hear-pizza",
      type: "word_image_mcq",
      meaningEn: "la pizza",
      options: [
        { id: "correct", word: "la pizza", emoji: "🍕" },
        { id: "o1", word: "la salade", emoji: "🥗" },
        { id: "o2", word: "le gâteau", emoji: "🍰" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the little cat, from memory.
    speaking("fr-m9-6-speak-petitchat-recall", "mon petit chat", "my little cat", [], "recall"),
    listeningCompSentence({
      id: "fr-m9-6-lc-ellegrande",
      audioText: "elle est très grande",
      correctMeaningEn: "She is very tall.",
      distractorsEn: ["He is very tall.", "She is very small.", "She is my mother."],
    }),
    vocabTextMcq("fr-m9-6-mc-tres", "très", ["bien", "encore", "demain"]),
    {
      id: "fr-m9-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-grand", source: "grand", target: "big / tall (m-form)" },
        { id: "p-grande", source: "grande", target: "big / tall (f-form)" },
        { id: "p-pizza", source: "pizza", target: "pizza" },
        { id: "p-gateau", source: "gâteau", target: "cake" },
        { id: "p-bien", source: "bien", target: "well" },
        { id: "p-six", source: "six", target: "six" },
      ],
    },
    // WIN: compliment the salad — printed first voicing.
    speaking(
      "fr-m9-6-speak-saladebonne",
      "la salade est très bonne",
      "the salad is very good",
      [],
    ),
  ];
}

/** L7 — zero new: the six flexers sorted, chained, and defended. */
function lesson7(): LessonStep[] {
  return [
    genderSort({
      id: "fr-m9-7-sort",
      prompt: "Which form of «grand» would each take? Sort them.",
      buckets: [
        { id: "m", label: "grand (blue-m)" },
        { id: "f", label: "grande (pink-f)" },
      ],
      items: [
        { id: "g-chat", surface: "chat", bucketId: "m", meaningEn: "cat" },
        { id: "g-maison", surface: "maison", bucketId: "f", meaningEn: "house" },
        {
          id: "g-musee",
          surface: "musée",
          bucketId: "m",
          meaningEn: "museum",
          note: "-ée looks pink and lies — blue-m: un grand musée.",
        },
        { id: "g-ville", surface: "ville", bucketId: "f", meaningEn: "town" },
        { id: "g-gateau", surface: "gâteau", bucketId: "m", meaningEn: "cake" },
        { id: "g-pizza", surface: "pizza", bucketId: "f", meaningEn: "pizza" },
        { id: "g-frere", surface: "frère", bucketId: "m", meaningEn: "brother" },
        { id: "g-soeur", surface: "sœur", bucketId: "f", meaningEn: "sister" },
      ],
      endingRule:
        "The adjective reads the noun's side, never its ending — the same two doors since «le chat».",
    }),
    // TAIL: the elder, from memory.
    speaking("fr-m9-7-speak-grandfrere-recall", "mon grand frère", "my big brother", [], "recall"),
    agreementChain({
      id: "fr-m9-7-chain-ville",
      prompt: "Dress the chain to match «ville».",
      head: { surface: "ville", meaningEn: "town / city", featureLabel: "pink-f" },
      tokens: [
        { kind: "slot", id: "s-art", options: ["une", "un"], correct: "une", roleLabel: "feminine article" },
        { kind: "slot", id: "s-adj", options: ["grande", "grand"], correct: "grande", roleLabel: "feminine adjective" },
        { kind: "fixed", text: "ville" },
      ],
      meaningEn: "a big city",
      audioText: "une grande ville",
      ruleNote: "Two slots, one master — «ville» decides both.",
    }),
    listeningCompSentence({
      id: "fr-m9-7-lc-ilestpetit",
      audioText: "il est petit",
      correctMeaningEn: "He is small.",
      distractorsEn: ["She is small.", "He is tall.", "He is my brother."],
    }),
    build(
      "fr-m9-7-build-freregrand",
      "Build: 'my brother is very tall'",
      "mon frère est très grand",
      ["mon", "frère", "est", "très", "grand", "grande"],
      ["mon", "frère", "est", "très", "grand"],
    ),
    {
      // TAIL: m7 by ear.
      id: "fr-m9-7-hear-soeur",
      type: "word_image_mcq",
      meaningEn: "la sœur",
      options: [
        { id: "correct", word: "la sœur", emoji: "👧" },
        { id: "o1", word: "la mère", emoji: "👩‍🦰" },
        { id: "o2", word: "le frère", emoji: "👦" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the cake verdict, from memory.
    speaking(
      "fr-m9-7-speak-gateaubon-recall",
      "le gâteau est très bon",
      "the cake is very good",
      [],
      "recall",
    ),
    cloze(
      "fr-m9-7-cloze-bonne",
      "la pizza est très",
      "",
      "bonne",
      ["bonne", "bon"],
      "the pizza is very good",
      "la pizza est très bonne",
      "«pizza» — pink-f, and the compliment wears the -e.",
    ),
    {
      id: "fr-m9-7-sim-emma",
      type: "dialogue_sim",
      scene: { emoji: "🏙️", title: "Emma, skeptical" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ville",
          npc: {
            speaker: "Emma",
            kana: "Ta ville est petite ?",
            audioText: "ta ville est petite ?",
            gloss: "Is your town small?",
          },
          goal: "It's BIG — set her straight.",
          reply: {
            mode: "choice",
            options: [
              { id: "grande", text: "la ville est très grande" },
              { id: "grand", text: "la ville est très grand" },
              { id: "daccord", text: "d'accord" },
            ],
            correctOptionId: "grande",
            audioText: "la ville est très grande",
          },
          replyGloss: "The city is very big.",
          explanation:
            "Civic pride, correctly dressed — «ville» claims its -e.",
        },
      ],
    },
    listeningCompSentence({
      // TAIL: m6 ordering lane.
      id: "fr-m9-7-lc-croissant",
      audioText: "je voudrais un croissant",
      correctMeaningEn: "I would like a croissant.",
      distractorsEn: ["I would like a cake.", "Another croissant, please.", "The croissant is very good."],
    }),
    {
      id: "fr-m9-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ville", source: "ville", target: "town / city" },
        { id: "p-maison", source: "maison", target: "house" },
        { id: "p-petit", source: "petit", target: "small (m-form)" },
        { id: "p-petite", source: "petite", target: "small (f-form)" },
        { id: "p-cesoir", source: "ce soir", target: "tonight" },
        { id: "p-sept", source: "sept", target: "seven" },
      ],
    },
    // WIN: she is very tall — printed first voicing.
    speaking("fr-m9-7-speak-ellegrande", "elle est très grande", "she is very tall", []),
  ];
}

/** L8 — CHECKPOINT (zero new, graded only): every pair discriminated on
 *  alternating answers, chains produced, verdicts delivered. */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m9-8-lc-grandchat",
      audioText: "un grand chat",
      correctMeaningEn: "A big cat.",
      distractorsEn: ["A small cat.", "A big dog.", "A big house."],
    }),
    cloze(
      "fr-m9-8-cloze-grand",
      "un",
      "musée",
      "grand",
      ["grand", "grande"],
      "a big museum",
      "un grand musée",
      "«musée» — blue-m, whatever its ending claims.",
    ),
    speaking(
      "fr-m9-8-speak-grandeville-recall",
      "une grande ville",
      "a big city",
      [],
      "recall",
    ),
    vocabTextMcq("fr-m9-8-mc-petite", "petite", ["petit", "grande", "bonne"]),
    build(
      "fr-m9-8-build-pizzabonne",
      "Build: 'the pizza is very good'",
      "la pizza est très bonne",
      ["la", "pizza", "est", "très", "bonne", "bon"],
      ["la", "pizza", "est", "très", "bonne"],
    ),
    listeningCompSentence({
      id: "fr-m9-8-lc-petitesoeur",
      audioText: "ma petite sœur",
      correctMeaningEn: "My little sister.",
      distractorsEn: ["My big brother.", "My little brother.", "My sister is small."],
    }),
    cloze(
      "fr-m9-8-cloze-petit",
      "un",
      "chien",
      "petit",
      ["petit", "petite"],
      "a little dog",
      "un petit chien",
      "«chien» — blue-m: «petit», t asleep.",
    ),
    speaking(
      "fr-m9-8-speak-petitcafe-recall",
      "il y a un petit café ici",
      "there's a little café here",
      [],
      "recall",
    ),
    agreementChain({
      id: "fr-m9-8-chain-soeur",
      prompt: "Dress the chain to match «sœur».",
      head: { surface: "sœur", meaningEn: "sister", featureLabel: "pink-f" },
      tokens: [
        { kind: "slot", id: "s-poss", options: ["ma", "mon"], correct: "ma", roleLabel: "feminine possessive" },
        { kind: "slot", id: "s-adj", options: ["petite", "petit"], correct: "petite", roleLabel: "feminine adjective" },
        { kind: "fixed", text: "sœur" },
      ],
      meaningEn: "my little sister",
      audioText: "ma petite sœur",
      ruleNote: "Possessives flex on the same two doors as articles.",
    }),
    listeningCompSentence({
      id: "fr-m9-8-lc-cafepetit",
      audioText: "le café est petit",
      correctMeaningEn: "The café is small.",
      distractorsEn: ["The coffee is very good.", "The house is small.", "The café is big."],
    }),
    build(
      "fr-m9-8-build-grandemaison",
      "Build: 'a big house'",
      "une grande maison",
      ["une", "grande", "maison", "grand", "un"],
      ["une", "grande", "maison"],
    ),
    cloze(
      "fr-m9-8-cloze-bon",
      "le café est très",
      "",
      "bon",
      ["bon", "bonne"],
      "the coffee is very good",
      "le café est très bon",
      "«café» — blue-m: «bon», bare and nasal.",
    ),
    vocabTextMcq("fr-m9-8-mc-tres", "très", ["bien", "encore", "ici"]),
    speaking(
      "fr-m9-8-speak-freregrand-recall",
      "mon frère est très grand",
      "my brother is very tall",
      [],
      "recall",
    ),
    {
      id: "fr-m9-8-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-grand", source: "grand", target: "big / tall (m-form)" },
        { id: "p-grande", source: "grande", target: "big / tall (f-form)" },
        { id: "p-petit", source: "petit", target: "small (m-form)" },
        { id: "p-bonne", source: "bonne", target: "good / tasty (f-form)" },
        { id: "p-tres", source: "très", target: "very" },
        { id: "p-chat", source: "chat", target: "cat" },
      ],
    },
  ];
}

/** L9 — «Le compliment tour»: dinner at yours, verdicts all around. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m9-9-sim-diner",
      type: "dialogue_sim",
      scene: {
        emoji: "🍽️",
        title: "Le compliment tour",
        setting: "Dinner at yours — everyone has opinions.",
      },
      exercisedAtomIds: [],
      explanation:
        "Compliments given, compliments taken, every -e in its place — dinner, described.",
      turns: [
        {
          id: "t1-maison",
          npc: {
            speaker: "Léa",
            kana: "Ta maison est grande !",
            audioText: "ta maison est grande !",
            gloss: "Your house is big!",
          },
          goal: "Take it — or be modest.",
          reply: {
            mode: "choice",
            options: [
              { id: "merci", text: "merci beaucoup" },
              { id: "petite", text: "la maison est petite" },
              { id: "petit", text: "la maison est petit" },
            ],
            correctOptionId: "merci",
            alsoCorrectOptionIds: ["petite"],
            audioText: "merci beaucoup",
          },
          replyGloss: "Thank you very much!",
          explanation:
            "«merci beaucoup» takes the compliment; the modest correction keeps its -e. Both are French.",
        },
        {
          id: "t2-gateau",
          npc: {
            speaker: "Hugo",
            kana: "Le gâteau est très bon !",
            audioText: "le gâteau est très bon !",
            gloss: "The cake is very good!",
          },
          goal: "Your mother made it — thank him.",
          reply: {
            mode: "choice",
            options: [
              { id: "merci", text: "merci beaucoup" },
              { id: "moiaussi", text: "moi aussi" },
              { id: "bonne", text: "le gâteau est très bonne" },
            ],
            correctOptionId: "merci",
            audioText: "merci beaucoup",
          },
          replyGloss: "Thank you so much!",
        },
        {
          id: "t3-chat",
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
              { id: "pasde", text: "il n'y a pas de chat" },
            ],
            correctOptionId: "petit",
            audioText: "oui c'est mon petit chat",
          },
          replyGloss: "Yes — that's my little cat.",
        },
        {
          id: "t4-famille",
          npc: {
            speaker: "Louis",
            kana: "Tu as une grande famille ?",
            audioText: "tu as une grande famille ?",
            gloss: "Do you have a big family?",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "grande", text: "oui j'ai une grande famille" },
              { id: "grand", text: "oui j'ai un grand famille" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "grande",
            audioText: "oui j'ai une grande famille",
          },
          replyGloss: "Yes, I have a big family.",
        },
      ],
    },
    build(
      "fr-m9-9-build-chiengrand",
      "Build: 'my dog is very big'",
      "mon chien est très grand",
      ["mon", "chien", "est", "très", "grand", "petite"],
      ["mon", "chien", "est", "très", "grand"],
    ),
    listeningCompSentence({
      id: "fr-m9-9-lc-ellegrande2",
      audioText: "elle est très grande",
      correctMeaningEn: "She is very tall.",
      distractorsEn: ["He is very tall.", "She is small.", "She is very good."],
    }),
    // The salad verdict, from memory (voiced L6).
    speaking(
      "fr-m9-9-speak-saladebonne-recall",
      "la salade est très bonne",
      "the salad is very good",
      [],
      "recall",
    ),
    cloze(
      "fr-m9-9-cloze-grande",
      "j'ai une",
      "famille",
      "grande",
      ["grande", "grand"],
      "I have a big family",
      "j'ai une grande famille",
      "«famille» — pink-f: «grande», however many of you there are.",
    ),
    {
      // TAIL: m6 by ear.
      id: "fr-m9-9-hear-salade",
      type: "word_image_mcq",
      meaningEn: "la salade",
      options: [
        { id: "correct", word: "la salade", emoji: "🥗" },
        { id: "o1", word: "la pizza", emoji: "🍕" },
        { id: "o2", word: "le fromage", emoji: "🧀" },
      ],
      correctOptionId: "correct",
    },
    listeningBuildSentence({
      id: "fr-m9-9-lbuild-grandchat",
      target: "un grand chat",
      tiles: ["un", "grand", "chat", "grande"],
      correctOrder: ["un", "grand", "chat"],
      promptEn: "Build what you hear",
    }),
    vocabTextMcq("fr-m9-9-mc-bonne", "bonne", ["bon", "grande", "petite"]),
    {
      id: "fr-m9-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-chien", source: "chien", target: "dog" },
        { id: "p-famille", source: "famille", target: "family" },
        { id: "p-grand", source: "grand", target: "big / tall (m-form)" },
        { id: "p-petite", source: "petite", target: "small (f-form)" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-huit", source: "huit", target: "eight" },
      ],
    },
    // WIN: the modest town, from memory.
    speaking(
      "fr-m9-9-speak-petiteville-recall",
      "c'est une petite ville",
      "it's a small town",
      [],
      "recall",
    ),
  ];
}

/** L10 — Mastery. Graded only; every item; ends on Chloé's grand tour. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m9-10-lc-grandemaison",
      audioText: "une grande maison",
      correctMeaningEn: "A big house.",
      distractorsEn: ["A small house.", "A big city.", "The house is big."],
    }),
    build(
      "fr-m9-10-build-gateaubon",
      "Build: 'the cake is very good'",
      "le gâteau est très bon",
      ["le", "gâteau", "est", "très", "bon", "bonne"],
      ["le", "gâteau", "est", "très", "bon"],
    ),
    cloze(
      "fr-m9-10-cloze-grande",
      "la ville est très",
      "",
      "grande",
      ["grande", "grand"],
      "the city is very big",
      "la ville est très grande",
      "«ville» — pink-f to the last: «grande».",
    ),
    speaking(
      "fr-m9-10-speak-petitesoeur-recall",
      "ma petite sœur",
      "my little sister",
      [],
      "recall",
    ),
    vocabTextMcq("fr-m9-10-mc-grand", "grand", ["grande", "petit", "très"]),
    listeningCompSentence({
      id: "fr-m9-10-lc-petitchat",
      audioText: "mon petit chat",
      correctMeaningEn: "My little cat.",
      distractorsEn: ["My big cat.", "My little dog.", "My cat is small."],
    }),
    agreementChain({
      id: "fr-m9-10-chain-chat",
      prompt: "Dress the chain to match «chat».",
      head: { surface: "chat", meaningEn: "cat", featureLabel: "blue-m" },
      tokens: [
        { kind: "slot", id: "s-poss", options: ["mon", "ma"], correct: "mon", roleLabel: "masculine possessive" },
        { kind: "slot", id: "s-adj", options: ["petit", "petite"], correct: "petit", roleLabel: "masculine adjective" },
        { kind: "fixed", text: "chat" },
      ],
      meaningEn: "my little cat",
      audioText: "mon petit chat",
      ruleNote: "The whole chain answers to the cat. As does the household.",
    }),
    build(
      "fr-m9-10-build-ellegrande",
      "Build: 'she is very tall'",
      "elle est très grande",
      ["elle", "est", "très", "grande", "grand"],
      ["elle", "est", "très", "grande"],
    ),
    listeningCompSentence({
      id: "fr-m9-10-lc-maisonpetite",
      audioText: "la maison est petite",
      correctMeaningEn: "The house is small.",
      distractorsEn: ["The house is big.", "The town is small.", "The house is very good."],
    }),
    speaking(
      "fr-m9-10-speak-villegrande-recall",
      "la ville est très grande",
      "the city is very big",
      [],
      "recall",
    ),
    cloze(
      "fr-m9-10-cloze-bonne",
      "la salade est très",
      "",
      "bonne",
      ["bonne", "bon"],
      "the salad is very good",
      "la salade est très bonne",
      "Pink-f verdict: «bonne» — the checkpoint's «bon» flipped back.",
    ),
    {
      id: "fr-m9-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-grand", source: "grand", target: "big / tall (m-form)" },
        { id: "p-grande", source: "grande", target: "big / tall (f-form)" },
        { id: "p-petit", source: "petit", target: "small (m-form)" },
        { id: "p-petite", source: "petite", target: "small (f-form)" },
        { id: "p-bon", source: "bon", target: "good (masculine)" },
        { id: "p-bonne", source: "bonne", target: "good / tasty (f-form)" },
      ],
    },
    {
      // THE MODULE ENDS ON THE GRAND TOUR — your world, described.
      id: "fr-m9-10-sim-tour",
      type: "dialogue_sim",
      scene: {
        emoji: "🏙️",
        title: "Le grand tour",
        setting: "Chloé wants the full picture of your world.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module: adjectives that dress to match, agreement you can HEAR, and compliments that land. Module 10: «les» — the plural door opens.",
      turns: [
        {
          id: "t1-ville",
          npc: {
            speaker: "Chloé",
            kana: "Ta ville est petite ?",
            audioText: "ta ville est petite ?",
            gloss: "Is your town small?",
          },
          goal: "Big — proudly.",
          reply: {
            mode: "choice",
            options: [
              { id: "grande", text: "la ville est très grande" },
              { id: "grand", text: "la ville est très grand" },
              { id: "quand", text: "c'est quand ?" },
            ],
            correctOptionId: "grande",
            audioText: "la ville est très grande",
          },
          replyGloss: "The city is very big.",
        },
        {
          id: "t2-famille",
          npc: {
            speaker: "Chloé",
            kana: "Et ta famille ?",
            audioText: "et ta famille ?",
            gloss: "And your family?",
          },
          goal: "Big too — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "grande", text: "j'ai une grande famille" },
              { id: "grand", text: "j'ai un grand famille" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "grande",
            audioText: "j'ai une grande famille",
          },
          replyGloss: "I have a big family.",
        },
        {
          id: "t3-chien",
          npc: {
            speaker: "Chloé",
            kana: "Ton chien est grand ?",
            audioText: "ton chien est grand ?",
            gloss: "Is your dog big?",
          },
          goal: "Very — brag a little.",
          reply: {
            mode: "choice",
            options: [
              { id: "il", text: "oui il est très grand" },
              { id: "elle", text: "oui elle est très grande" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "il",
            audioText: "oui il est très grand",
          },
          replyGloss: "Yes — he's very big.",
          explanation:
            "«chien» is an il — «elle est très grande» would rename him mid-brag.",
        },
        {
          id: "t4-nuit",
          npc: {
            speaker: "Chloé",
            kana: "Bonne nuit !",
            audioText: "bonne nuit",
            gloss: "Good night!",
          },
          goal: "Send her off.",
          reply: {
            mode: "choice",
            options: [
              { id: "bonnenuit", text: "bonne nuit" },
              { id: "abientot", text: "à bientôt" },
              { id: "quoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "bonnenuit",
            alsoCorrectOptionIds: ["abientot"],
            audioText: "bonne nuit",
          },
          replyGloss: "Good night!",
          explanation:
            "«Bonne nuit» — you've been agreeing an adjective since module 1 and never knew.",
        },
      ],
    },
  ];
}

const FR_M9_1: LessonContent = {
  id: "fr-m9-1",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The letter that wakes up, again",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M9_2: LessonContent = {
  id: "fr-m9-2",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Small, and younger",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M9_3: LessonContent = {
  id: "fr-m9-3",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Very — and the verb steps in",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M9_4: LessonContent = {
  id: "fr-m9-4",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The half you always knew",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M9_5: LessonContent = {
  id: "fr-m9-5",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Size up the town",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M9_6: LessonContent = {
  id: "fr-m9-6",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The compliment machine",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M9_7: LessonContent = {
  id: "fr-m9-7",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Six words that flex",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M9_8: LessonContent = {
  id: "fr-m9-8",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for the tour",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M9_9: LessonContent = {
  id: "fr-m9-9",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le compliment tour",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M9_10: LessonContent = {
  id: "fr-m9-10",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — give the tour",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M9_MODULE: FrModuleDef = {
  title: "Grand, grande — describe it",
  eyebrow: "Module 9",
  summary:
    "Adjectives that dress to match: grand/grande, petit/petite — and «bonne», the half of «bon» you've worn since module 1. Agreement you can hear.",
  lessons: [
    FR_M9_1,
    FR_M9_2,
    FR_M9_3,
    FR_M9_4,
    FR_M9_5,
    FR_M9_6,
    FR_M9_7,
    FR_M9_8,
    FR_M9_9,
    FR_M9_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M9_CHECKPOINT_INDEX = 8;

export const FR_M9_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m9-s",
    moduleId: "m9",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m9-s",
        prompt: "Complete: «une ___ maison»",
        correctText: "grande",
        distractorsText: ["grand", "petit", "bon"],
      }),
  },
  {
    id: "pt-fr-m9-1",
    moduleId: "m9",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m9-1",
        prompt: "'The cake is very good' — pick the French.",
        correctText: "le gâteau est très bon",
        distractorsText: [
          "le gâteau est très bonne",
          "la gâteau est très bon",
          "le gâteau est bon très",
        ],
      }),
  },
  {
    id: "pt-fr-m9-2",
    moduleId: "m9",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m9-2",
        prompt: "'My little sister' — pick the French.",
        correctText: "ma petite sœur",
        distractorsText: ["ma petit sœur", "mon petit sœur", "ma petite frère"],
      }),
  },
  {
    id: "pt-fr-m9-3",
    moduleId: "m9",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m9-3",
        prompt: "Complete: «Mon frère est très ___.»",
        correctText: "grand",
        distractorsText: ["grande", "bonne", "petite"],
      }),
  },
  {
    id: "pt-fr-m9-4",
    moduleId: "m9",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m9-4",
        prompt: "Pick the word that never changes form.",
        correctText: "très",
        distractorsText: ["grand", "petite", "bonne"],
      }),
  },
];
