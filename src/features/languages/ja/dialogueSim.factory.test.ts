/**
 * `dialogueSim` factory guards (2026-08-24, built for the m34+ wave).
 *
 * The factory is the JA course's only door into `dialogue_sim`, and its
 * validations are compile-time promises the sim view relies on: a build
 * reply whose answer can't be assembled from its tiles is a step the
 * learner cannot pass; a goal that quotes the answer is a leak; a choice
 * answer missing from options never grades. Each throws at module build,
 * never in front of a learner.
 */
import { describe, expect, it } from "vitest";
import { dialogueSim } from "./grammarHelpers";

const SCENE = { emoji: "🍜", title: "Test scene" };

describe("dialogueSim factory", () => {
  it("compiles a build-mode turn with the canonical shape", () => {
    const step = dialogueSim({
      id: "t-sim",
      scene: SCENE,
      turns: [
        {
          npc: { speaker: "Ken", kana: "なにを たべる？", gloss: "What'll you eat?" },
          goal: "Suggest eating ramen together.",
          reply: {
            mode: "build",
            tiles: ["ラーメン", "を", "たべよう", "たべたい"],
            answer: "ラーメンを たべよう。",
          },
          replyGloss: "Let's eat ramen.",
        },
      ],
    });
    expect(step.type).toBe("dialogue_sim");
    expect(step.modality).toBe("production");
    expect(step.turns[0].id).toBe("t1");
    expect(step.turns[0].npc.speaker).toBe("Ken");
  });

  it("throws when the answer is not buildable from the tiles", () => {
    expect(() =>
      dialogueSim({
        id: "t-sim",
        scene: SCENE,
        turns: [
          {
            npc: { speaker: "Ken", kana: "なに？", gloss: "What?" },
            goal: "Answer.",
            reply: { mode: "build", tiles: ["ラーメン", "を"], answer: "ラーメンを たべよう。" },
          },
        ],
      }),
    ).toThrow(/answer not assemblable from tiles: たべよう/);
  });

  it("throws when the goal leaks the answer", () => {
    expect(() =>
      dialogueSim({
        id: "t-sim",
        scene: SCENE,
        turns: [
          {
            npc: { speaker: "Ken", kana: "なに？", gloss: "What?" },
            goal: "Say ラーメンを たべよう to him.",
            reply: { mode: "build", tiles: ["ラーメン", "を", "たべよう"], answer: "ラーメンを たべよう" },
          },
        ],
      }),
    ).toThrow(/goal leaks the answer/);
  });

  it("choice mode: rotates options, keeps id 'correct', validates membership", () => {
    const step = dialogueSim({
      id: "t-sim-choice",
      scene: SCENE,
      turns: [
        {
          npc: { speaker: "Mika", kana: "いく？", gloss: "Going?" },
          goal: "Agree — let's go.",
          reply: { mode: "choice", options: ["いこう", "いかない", "いった"], answer: "いこう" },
        },
      ],
    });
    const reply = step.turns[0].reply;
    if (reply.mode !== "choice") throw new Error("expected choice reply");
    expect(reply.correctOptionId).toBe("correct");
    expect(reply.options.find((o) => o.id === "correct")?.text).toBe("いこう");
    expect(reply.options.map((o) => o.text).sort()).toEqual(
      ["いかない", "いこう", "いった"].sort(),
    );

    expect(() =>
      dialogueSim({
        id: "t-sim-choice-bad",
        scene: SCENE,
        turns: [
          {
            npc: { speaker: "Mika", kana: "いく？", gloss: "Going?" },
            goal: "Agree.",
            reply: { mode: "choice", options: ["いかない", "いった"], answer: "いこう" },
          },
        ],
      }),
    ).toThrow(/not one of the options/);
  });
});
