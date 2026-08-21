/**
 * The Spanish `dialogue_sim` demo scenario — meeting Ana in the park,
 * 4 turns, plus the POST-QUIZ that Spencer's 2026-08-20 spec adds to the
 * shape ("the interaction simulator … with the english translation below
 * it, and then quiz the words/sentences"):
 *
 *   1. sim scenario (participation — the learner IS the second speaker,
 *      every NPC line shows its English gloss below, listen-first mode
 *      masks it until the clip has played), then
 *   2. `buildParqueQuiz()` — retrieval steps over EXACTLY the words and
 *      sentences the scenario used, via the real es content factories,
 *      so shapes/validation match shipped lessons one-for-one.
 *
 * PROTOTYPE content, same contract as `konbiniScenario.ts`: lives under
 * `dev/`, invisible to the course, the atom registry collectors, the TTS
 * emitter and every content ratchet. Nothing routes a learner here.
 *
 * VOCAB DISCIPLINE: every Spanish line is verbatim m1/m5 shipped-content
 * text. That does two things — the learner-facing demo only uses taught
 * words (m1 greetings + m5 family/age), and every line already has a clip
 * (the esAudioCoverage ratchet holds at zero, so shipped text ⇒ clip).
 * No deliberate degradation line here; the konbini demo covers that path.
 *
 * VOICES: es/module.ts defines no `dialogueVoices` roster yet, so every
 * speaker plays the single course voice. Fine for one female NPC (Ana);
 * a male-speaker scenario needs the roster + a second voice corpus first
 * (follow-up recorded in the session state doc).
 */
import type { DialogueSimStep, LessonStep } from "../../types";

export const PARQUE_SIM_STEP_ES: DialogueSimStep = {
  id: "dialogue-sim-parque-es",
  type: "dialogue_sim",
  scene: {
    emoji: "🌳",
    title: "En el parque — meeting Ana",
    setting: "Ana walks up to you with a smile. She starts.",
  },
  // Exposure only — writes no FSRS state (see `_stepPredicates.ts`).
  exercisedAtomIds: [],
  explanation:
    "A first meeting is four beats: the greeting, 'nice to meet you', one small question, the goodbye. Every line here is a set phrase you can carry into any first conversation.",
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
        alsoAccepted: ["buenos días"],
        audioText: "hola buenos días",
      },
      replyGloss: "Hi, good morning.",
      explanation:
        "«Buenos días» alone is fine too — greetings mirror each other in Spanish just like in English.",
    },
    {
      id: "t2-gusto",
      npc: {
        speaker: "Ana",
        kana: "Mucho gusto.",
        audioText: "mucho gusto",
        gloss: "Nice to meet you.",
      },
      goal: "Say it's nice to meet her too.",
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
      explanation:
        "«Mucho gusto» is answered with «mucho gusto» — both sides say it, like a handshake.",
    },
    {
      id: "t3-anos",
      npc: {
        speaker: "Ana",
        kana: "¿Cuántos años tienes?",
        audioText: "¿cuántos años tienes?",
        gloss: "How old are you?",
      },
      goal: "Tell her you're nine.",
      reply: {
        mode: "build",
        tiles: ["tengo", "nueve", "años", "tienes", "diez"],
        answer: "tengo nueve años",
        audioText: "tengo nueve años",
      },
      replyGloss: "I'm nine years old.",
      explanation:
        "Spanish HAS an age rather than being one: «tengo nueve años», literally 'I have nine years'.",
    },
    {
      id: "t4-despedida",
      npc: {
        speaker: "Ana",
        kana: "Adiós.",
        audioText: "adiós",
        gloss: "Goodbye.",
      },
      goal: "Say goodbye — either way people actually say it works.",
      reply: {
        mode: "choice",
        options: [
          { id: "luego", text: "hasta luego" },
          { id: "adios", text: "adiós" },
          { id: "porfavor", text: "por favor" },
        ],
        correctOptionId: "luego",
        // Max-acceptance: «adiós» back is just as right as «hasta luego».
        alsoCorrectOptionIds: ["adios"],
        audioText: "hasta luego",
      },
      replyGloss: "See you later.",
    },
  ],
};

/**
 * The post-quiz: retrieval over exactly what the scenario used. Built
 * lazily (not at module scope) so importing this file never races the es
 * atom registry — by render time `mockLessons` has loaded everything.
 */
export async function buildParqueQuiz(): Promise<LessonStep[]> {
  // Registry-order shield, same trick the module test files use.
  await import("@/features/languages/es/courseAtoms");
  const { listeningCompSentence, vocabTextMcq, build } = await import(
    "@/features/languages/es/grammarHelpers"
  );
  return [
    listeningCompSentence({
      id: "parque-quiz-listen",
      audioText: "¿cuántos años tienes?",
      correctMeaningEn: "How old are you?",
      distractorsEn: ["Who is she?", "How are you?", "Where do you live?"],
    }),
    vocabTextMcq("parque-quiz-gusto", "mucho gusto", [
      "hasta luego",
      "por favor",
      "gracias",
    ]),
    build(
      "parque-quiz-build",
      "Build: 'I am nine years old'",
      "tengo nueve años",
      ["tengo", "nueve", "años", "tienes", "diez"],
      ["tengo", "nueve", "años"],
    ),
  ];
}
