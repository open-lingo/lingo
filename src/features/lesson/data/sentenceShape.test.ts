import { describe, expect, it } from "vitest";
import {
  classifyEnShape,
  classifyJaShape,
  classifySentenceShape,
} from "./sentenceShape";

// TestFlight #150 (Spencer: "We need better English sentence authoring here
// no?") — 友達がわたしにプレゼントをくれる (present) sat next to three
// past-tense English distractors. These are the exact four strings.
const CORRECT_EN = "My friend gives me a present";
const CORRECT_JA = "友達がわたしにプレゼントをくれる。";
const DISTRACTOR_EN_1 = "I got a watch from my father for my birthday";
const DISTRACTOR_JA_1 = "誕生日に父から時計をもらいました。";
const DISTRACTOR_EN_2 = "My friend gave me a cell phone";
const DISTRACTOR_JA_2 = "友達が携帯電話をくれました。";
const DISTRACTOR_EN_3 = "I borrowed an umbrella from my friend";
const DISTRACTOR_JA_3 = "友達から傘を借りました。";

describe("classifyEnShape — English surface heuristic (20 hand-picked cases)", () => {
  const cases: Array<[string, ReturnType<typeof classifyEnShape>["tense"], ReturnType<typeof classifyEnShape>["person"], boolean]> = [
    // [en, tense, person, question]
    [CORRECT_EN, "present", "third", false],
    [DISTRACTOR_EN_1, "past", "I", false],
    [DISTRACTOR_EN_2, "past", "third", false],
    [DISTRACTOR_EN_3, "past", "I", false],
    ["She eats breakfast every morning", "present", "third", false],
    ["We will go to the park tomorrow", "future", "third", false],
    ["I am going to call you later", "future", "I", false],
    ["I'll see you tomorrow", "future", "I", false],
    ["He walked to school yesterday", "past", "third", false],
    ["They played soccer on Sunday", "past", "third", false],
    ["I need a new umbrella", "present", "I", false],
    ["You speak Japanese very well", "present", "you", false],
    ["Did you finish your homework?", "past", "you", true],
    ["Were you at the party last night?", "past", "you", true],
    ["What time is it?", "present", "third", true],
    ["Where did you go yesterday?", "past", "you", true],
    ["I was tired after the trip", "past", "I", false],
    ["The train arrives at 8:10", "present", "third", false],
    ["She will study English next year", "future", "third", false],
    ["I ate breakfast this morning", "past", "I", false],
  ];

  it.each(cases)("classifies %j → tense=%s person=%s question=%s", (en, tense, person, question) => {
    const shape = classifyEnShape(en);
    expect(shape.tense).toBe(tense);
    expect(shape.person).toBe(person);
    expect(shape.question).toBe(question);
  });
});

describe("classifyJaShape — Japanese ending heuristic (20 hand-picked cases)", () => {
  const cases: Array<[string, ReturnType<typeof classifyJaShape>["tense"], boolean]> = [
    // [ja, tense, question]
    [CORRECT_JA, "present", false],
    [DISTRACTOR_JA_1, "past", false],
    [DISTRACTOR_JA_2, "past", false],
    [DISTRACTOR_JA_3, "past", false],
    ["わたしはパンを食べます。", "present", false], // polite non-past
    ["わたしはパンを食べました。", "past", false], // ました = past
    ["きのう えいがを みました。", "past", false],
    ["あした がっこうへ いきます。", "present", false], // masu-form is non-past
    ["いっしょに いきましょう。", "future", false], // volitional ましょう
    ["いっしょに たべよう。", "future", false], // plain volitional よう
    ["にほんごを べんきょうしよう。", "future", false], // suru volitional
    ["あの みせは たかかった。", "past", false], // い-adj past
    ["きょうは あついです。", "present", false],
    ["これは わたしの ほんです。", "present", false], // copula です present
    ["それは わたしの ほんでした。", "past", false], // copula でした past
    ["げんきだ。", "present", false], // plain copula, present
    ["げんきだった。", "past", false], // plain copula, past
    ["ほんを よみましたか。", "past", true], // ました + か
    ["がっこうへ いきますか。", "present", true], // ます + か
    ["これは なんですか。", "present", true],
  ];

  it.each(cases)("classifies %j → tense=%s question=%s", (ja, tense, question) => {
    const shape = classifyJaShape(ja);
    expect(shape.tense).toBe(tense);
    expect(shape.question).toBe(question);
  });
});

describe("classifySentenceShape — JA preferred over EN fallback", () => {
  it("uses the JA ending for tense even when EN alone would be ambiguous", () => {
    // "I read books" is tenseless-ambiguous in English surface form (present
    // "read" and past "read" are spelled the same) — the JA source resolves it.
    const shape = classifySentenceShape("I read books", "ほんを よみました。");
    expect(shape.tense).toBe("past");
  });

  it("falls back to the EN heuristic when no JA text is supplied", () => {
    const shape = classifySentenceShape(DISTRACTOR_EN_1);
    expect(shape.tense).toBe("past");
  });

  it("still reads person off English even when JA drives tense", () => {
    const shape = classifySentenceShape(DISTRACTOR_EN_1, DISTRACTOR_JA_1);
    expect(shape.tense).toBe("past");
    expect(shape.person).toBe("I");
  });
});
