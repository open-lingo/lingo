/**
 * The `dialogue_sim` demo scenario — a konbini checkout, 4 turns.
 * PROTOTYPE content (2026-07-29): this lives under `dev/`, NOT under
 * `languages/ja/curriculum/`, so it is reachable from the dev preview
 * surfaces and invisible to the course, the atom registry, the TTS emitter
 * and every content ratchet. Nothing routes a learner here.
 *
 * The shape Spencer described: いらっしゃいませ → buy the thing → the bag
 * question → payment → ありがとうございました.
 *
 * REGISTER (the one real content tension — open question for Spencer):
 *  - The clerk speaks shop keigo (いらっしゃいませ / ございます). Under pinned
 *    invariant 7 (dict-form-first) that is fine: polite forms may appear as
 *    RECOGNITION material, never as a production target.
 *  - The learner's replies are polite too, which invariant 7 reserves for
 *    after the (still unset) ます boundary. They are kept to FIXED PHRASES —
 *    ください / おねがいします / けっこうです / いいですか / ございます — i.e.
 *    lexical items, not ます-conjugation of a taught verb, so nothing here
 *    asks the learner to derive polite morphology. A travel scenario cannot
 *    honestly be transacted in plain form (だ at a till is wrong Japanese),
 *    which is why Travel Sprint may need an explicit register carve-out.
 *
 * AUDIO: every line below was checked against `src/pub/tts/manifest.json`
 * (2026-07-29) and plays EXCEPT `ふくろは いりますか` — deliberately left
 * un-generated so the graceful-degradation path is visible in the demo (play
 * button disabled, listen-first mask auto-lifts). Generate it with the emit +
 * generate pair in CLAUDE.md §TTS when this becomes real content.
 */
import type { DialogueSimStep } from "../../types";

export const KONBINI_SIM_STEP: DialogueSimStep = {
  id: "dialogue-sim-konbini",
  type: "dialogue_sim",
  scene: {
    emoji: "🏪",
    title: "コンビニ — the register",
    setting: "You are buying one drink. The clerk starts.",
  },
  // Exposure only — NOT `exercisedAtoms`, so this scenario writes no FSRS
  // state (see the grading note in `_stepPredicates.ts`). Left empty in the
  // prototype because attributing atoms is an authoring decision that
  // belongs with real Travel Sprint content.
  exercisedAtomIds: [],
  explanation:
    "A konbini transaction is four beats: greeting, what you want, the bag question, paying. The clerk's lines are set phrases — you only ever have to recognise them.",
  turns: [
    {
      id: "t1-greeting",
      npc: {
        speaker: "てんいん",
        kana: "いらっしゃいませ。",
        audioText: "いらっしゃいませ",
        gloss: "Welcome!",
      },
      goal: "Put your drink on the counter — say “this one, please.”",
      reply: {
        mode: "build",
        tiles: ["これを", "ください", "あれを", "おねがいします"],
        answer: "これを ください",
        // Max-acceptance: both are what people actually say at a till.
        alsoAccepted: ["これを おねがいします"],
        audioText: "これをください",
      },
      replyGloss: "This one, please.",
      explanation:
        "これ is the one in your hand; あれ is over there, out of reach. ください and おねがいします are both right here.",
    },
    {
      id: "t2-bag",
      npc: {
        speaker: "てんいん",
        // No clip in the manifest — this is the degradation demo. Everything
        // still works: the play button disables and the mask lifts on its own.
        kana: "ふくろは いりますか。",
        gloss: "Do you need a bag?",
      },
      goal: "You brought your own bag. Turn it down.",
      reply: {
        mode: "choice",
        options: [
          { id: "kekkou", text: "いいえ、けっこうです" },
          { id: "daijoubu", text: "だいじょうぶです" },
          { id: "onegai", text: "はい、おねがいします" },
          { id: "kudasai", text: "ふくろを ください" },
        ],
        correctOptionId: "kekkou",
        // Branching-lite: a second genuinely-correct move, accepted with no
        // correction. Declining with だいじょうぶです is at least as common.
        alsoCorrectOptionIds: ["daijoubu"],
        audioText: "いいえ、けっこうです",
      },
      replyGloss: "No, I'm fine.",
      explanation:
        "けっこうです and だいじょうぶです both decline politely. はい、おねがいします accepts the bag, and ふくろを ください asks for one.",
    },
    {
      id: "t3-pay",
      npc: {
        speaker: "てんいん",
        kana: "さんびゃくえんです。",
        audioText: "さんびゃくえんです",
        gloss: "That's 300 yen.",
      },
      goal: "You want to pay by card. Ask whether that's OK.",
      reply: {
        mode: "build",
        tiles: ["カードで", "いいですか", "ください", "いくらですか"],
        answer: "カードで いいですか",
        audioText: "カードでいいですか",
      },
      replyGloss: "Is card OK?",
      explanation:
        "で marks the means: カードで = “by card”. いくらですか asks the price again — she just told you.",
    },
    {
      id: "t4-thanks",
      npc: {
        speaker: "てんいん",
        // Two sentences on purpose: playback chains them per-sentence with a
        // gap (playLineAudio), which is how the real clerk cadence sounds.
        kana: "はい。ありがとうございます。",
        gloss: "Sure. Thank you very much.",
      },
      goal: "Thank them and take your drink.",
      reply: {
        mode: "build",
        tiles: ["ありがとう", "ございます", "ください", "おねがいします"],
        answer: "ありがとう ございます",
        // A bare ありがとう is right too — friendlier, slightly more casual.
        alsoAccepted: ["ありがとう"],
        audioText: "ありがとうございます",
      },
      replyGloss: "Thank you very much.",
      explanation:
        "ございます is the polite tail. ありがとう alone is also correct — just warmer and less formal.",
    },
  ],
};

/** Listen-first variant of the same scenario (Pimsleur mode): the clerk's
 *  text stays masked until you have heard the line. Same content, different
 *  `id` so tile shuffles and per-step state don't collide in the previewer. */
export const KONBINI_SIM_LISTEN_FIRST: DialogueSimStep = {
  ...KONBINI_SIM_STEP,
  id: "dialogue-sim-konbini-listen",
  listenFirst: true,
};
