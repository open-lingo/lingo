/**
 * Turn logic for the `dialogue_sim` prototype. The interesting cases are all
 * MAX-ACCEPTANCE ones: a simulation that marks a real reply wrong teaches the
 * learner to guess the author instead of to speak, so every rule that widens
 * acceptance gets a test, and so does the listen-first mask's escape hatch
 * (a line with no clip must never be masked).
 */
import { describe, it, expect } from "vitest";
import type { DialogueSimReply, DialogueSimTurn } from "../../../types";
import {
  acceptedChoiceIds,
  isBuildReplyAccepted,
  isChoiceReplyAccepted,
  modelReplyAudioText,
  modelReplyText,
  npcLineRevealed,
  scenarioCorrect,
} from "./simTurnLogic";

type BuildReply = Extract<DialogueSimReply, { mode: "build" }>;
type ChoiceReply = Extract<DialogueSimReply, { mode: "choice" }>;

const buildReply: BuildReply = {
  mode: "build",
  tiles: ["これを", "ください", "あれを", "おねがいします"],
  answer: "これを ください",
  alsoAccepted: ["これを おねがいします"],
  audioText: "これをください",
};

const choiceReply: ChoiceReply = {
  mode: "choice",
  options: [
    { id: "kekkou", text: "いいえ、けっこうです" },
    { id: "daijoubu", text: "だいじょうぶです" },
    { id: "onegai", text: "はい、おねがいします" },
  ],
  correctOptionId: "kekkou",
  alsoCorrectOptionIds: ["daijoubu"],
};

describe("isBuildReplyAccepted", () => {
  it("accepts the canonical answer", () => {
    expect(isBuildReplyAccepted(["これを", "ください"], buildReply)).toBe(true);
  });

  it("accepts an authored alternative rendering (max-acceptance)", () => {
    expect(
      isBuildReplyAccepted(["これを", "おねがいします"], buildReply),
    ).toBe(true);
  });

  it("ignores spacing differences between tiles and the authored answer", () => {
    expect(isBuildReplyAccepted(["これをください"], buildReply)).toBe(true);
  });

  it("rejects a wrong-word reply", () => {
    expect(isBuildReplyAccepted(["あれを", "ください"], buildReply)).toBe(false);
  });

  it("rejects an empty tray", () => {
    expect(isBuildReplyAccepted([], buildReply)).toBe(false);
  });

  it("routes through expandAcceptedAnswers — polite widening of a plain answer", () => {
    // Register is ungraded below REGISTER_GRADED_FROM_MODULE, which is the
    // rule the build/translate views already apply; the sim must not be
    // stricter than they are.
    const plain: BuildReply = {
      mode: "build",
      tiles: ["みずを", "のむ", "のみます"],
      answer: "みずを のむ",
    };
    expect(isBuildReplyAccepted(["みずを", "のみます"], plain, 5)).toBe(true);
  });
});

describe("choice replies", () => {
  it("counts every also-correct option as correct (branching-lite)", () => {
    expect([...acceptedChoiceIds(choiceReply)].sort()).toEqual([
      "daijoubu",
      "kekkou",
    ]);
    expect(isChoiceReplyAccepted("kekkou", choiceReply)).toBe(true);
    expect(isChoiceReplyAccepted("daijoubu", choiceReply)).toBe(true);
  });

  it("rejects a wrong option and an unanswered turn", () => {
    expect(isChoiceReplyAccepted("onegai", choiceReply)).toBe(false);
    expect(isChoiceReplyAccepted(undefined, choiceReply)).toBe(false);
  });
});

describe("npcLineRevealed", () => {
  const base = {
    listenFirst: true,
    hasAudio: true,
    played: false,
    manuallyShown: false,
    committed: false,
  };

  it("shows the line immediately when listen-first is off", () => {
    expect(npcLineRevealed({ ...base, listenFirst: false })).toBe(true);
  });

  it("masks a listen-first line that has not been heard", () => {
    expect(npcLineRevealed(base)).toBe(false);
  });

  it("NEVER masks a line with no clip (an unwinnable silent wall)", () => {
    expect(npcLineRevealed({ ...base, hasAudio: false })).toBe(true);
  });

  it("lifts the mask once the clip has played", () => {
    expect(npcLineRevealed({ ...base, played: true })).toBe(true);
  });

  it("lifts the mask on an explicit show-text tap", () => {
    expect(npcLineRevealed({ ...base, manuallyShown: true })).toBe(true);
  });

  it("lifts the mask once the turn is committed", () => {
    expect(npcLineRevealed({ ...base, committed: true })).toBe(true);
  });
});

describe("scenarioCorrect", () => {
  const turns = [
    { id: "a" },
    { id: "b" },
  ] as unknown as DialogueSimTurn[];

  it("is true only when every turn was answered acceptably", () => {
    expect(scenarioCorrect(turns, { a: true, b: true })).toBe(true);
    expect(scenarioCorrect(turns, { a: true, b: false })).toBe(false);
    expect(scenarioCorrect(turns, { a: true })).toBe(false);
  });

  it("is false for a scenario with no turns (degenerate)", () => {
    expect(scenarioCorrect([], {})).toBe(false);
  });
});

describe("model reply text", () => {
  const buildTurn = {
    id: "t",
    npc: { speaker: "てんいん", kana: "いらっしゃいませ。", gloss: "Welcome!" },
    goal: "Ask for it.",
    reply: buildReply,
  } as unknown as DialogueSimTurn;

  const choiceTurn = {
    id: "t2",
    npc: { speaker: "てんいん", kana: "ふくろは いりますか。", gloss: "Bag?" },
    goal: "Decline.",
    reply: choiceReply,
  } as unknown as DialogueSimTurn;

  it("reads the canonical answer for a build turn, the correct option for a choice", () => {
    expect(modelReplyText(buildTurn)).toBe("これを ください");
    expect(modelReplyText(choiceTurn)).toBe("いいえ、けっこうです");
  });

  it("prefers the authored TTS key when the manifest differs from the display text", () => {
    expect(modelReplyAudioText(buildTurn)).toBe("これをください");
    // No override: falls back to the option text.
    expect(modelReplyAudioText(choiceTurn)).toBe("いいえ、けっこうです");
  });
});
