import { describe, it, expect } from "vitest";
import { storyComprehension } from "./_jaGrammarHelpers";

describe("storyComprehension", () => {
  it("composes [dialogue_listen(narrative), build_sentence]", () => {
    const steps = storyComprehension({
      idPrefix: "test-story-1",
      narrative: [
        { kana: "きのう、こうえん に いきました。" },
        { kana: "そして、ともだち を みました。" },
      ],
      comprehensionQuestions: [
        {
          id: "q1",
          prompt: "Where did they go?",
          correctText: "park",
          distractors: ["school", "café", "station"],
        },
      ],
      responseBuild: {
        target: "わたし も こうえん に いきました。",
        tiles: ["わたし", "も", "こうえん", "に", "いきました", "あなた"],
        correctOrder: ["わたし", "も", "こうえん", "に", "いきました"],
        promptEn: "Say: 'I also went to the park.'",
      },
      exercisedAtomKanas: ["こうえん"],
    });

    expect(steps).toHaveLength(2);
    expect(steps[0].type).toBe("dialogue_listen");
    expect(steps[1].type).toBe("build_sentence");
  });

  it("emits the narrative step with format='narrative' and recognition modality", () => {
    const steps = storyComprehension({
      idPrefix: "test-story-2",
      narrative: [{ kana: "きょう は あつい です。" }],
      comprehensionQuestions: [{
        id: "q1", prompt: "What's the weather?",
        correctText: "hot", distractors: ["cold", "rainy", "snowy"],
      }],
      responseBuild: {
        target: "そうですね。",
        tiles: ["そうですね"],
        correctOrder: ["そうですね"],
        promptEn: "Agree: 'That's right.'",
      },
    });

    const story = steps[0];
    if (story.type !== "dialogue_listen") throw new Error("expected dialogue_listen");
    expect(story.format).toBe("narrative");
    expect(story.modality).toBe("recognition");
  });

  it("emits the build step with production modality", () => {
    const steps = storyComprehension({
      idPrefix: "test-story-3",
      narrative: [{ kana: "あした、しごと に いきます。" }],
      comprehensionQuestions: [{
        id: "q1", prompt: "When?",
        correctText: "tomorrow", distractors: ["today", "yesterday", "now"],
      }],
      responseBuild: {
        target: "がんばって ください。",
        tiles: ["がんばって", "ください"],
        correctOrder: ["がんばって", "ください"],
        promptEn: "Say: 'Do your best.'",
      },
    });

    expect(steps[1].modality).toBe("production");
  });

  it("allows speaker-less narrative lines (story prose, not dialogue)", () => {
    expect(() =>
      storyComprehension({
        idPrefix: "test-story-4",
        narrative: [
          { kana: "むかしむかし、ある ところ に..." },
          { kana: "おじいさん が いました。" },
          { kana: "おじいさん は やま に いきました。" },
        ],
        comprehensionQuestions: [{
          id: "q1", prompt: "Who is in the story?",
          correctText: "old man", distractors: ["young man", "old woman", "child"],
        }],
        responseBuild: {
          target: "むかし です ね。",
          tiles: ["むかし", "です", "ね"],
          correctOrder: ["むかし", "です", "ね"],
          promptEn: "Say: 'Long ago, huh.'",
        },
      }),
    ).not.toThrow();
  });

  it("propagates exercisedAtomKanas through both halves", () => {
    const steps = storyComprehension({
      idPrefix: "test-story-5",
      narrative: [{ kana: "ともだち と コーヒー を のみました。" }],
      comprehensionQuestions: [{
        id: "q1", prompt: "What did they drink?",
        correctText: "coffee", distractors: ["tea", "water", "beer"],
      }],
      responseBuild: {
        target: "わたし も コーヒー を のみました。",
        tiles: ["わたし", "も", "コーヒー", "を", "のみました"],
        correctOrder: ["わたし", "も", "コーヒー", "を", "のみました"],
        promptEn: "Say: 'I also drank coffee.'",
      },
      exercisedAtomKanas: ["コーヒー", "ともだち"],
    });

    const story = steps[0];
    const build = steps[1];
    expect(story.exercisedAtoms?.length).toBeGreaterThan(0);
    expect(build.exercisedAtoms?.length).toBeGreaterThan(0);
  });
});
