/**
 * `parseRegisterCue` — the compile-time split of an authored English string
 * into { clean gloss, structured cue }.
 *
 * Every variant present in the JA corpus is exercised below, plus the three
 * cases that decide whether the rule is safe to run over 7,197 authored
 * English fields: a colon that is NOT a cue (m19's clock times), an
 * already-clean sentence, and a cue verb with no colon.
 */
import { describe, it, expect } from "vitest";
import {
  parseRegisterCue,
  registerCuedText,
  stripResolvedCue,
  stripRegisterCue,
  derivePoliteness,
} from "./registerCue";

describe("parseRegisterCue — every corpus variant", () => {
  const cases: [string, string, string, string, string | undefined][] = [
    // authored en, clean gloss, label, form, audience
    ["Say politely: I eat at home", "I eat at home", "Polite", "polite", undefined],
    ["Say to a friend: Yeah, I'll eat", "Yeah, I'll eat", "To a friend", "plain", "friend"],
    ["Say to a teacher: Yes, I'll go", "Yes, I'll go", "To a teacher", "polite", "teacher"],
    ["Ask a friend: How's the rice", "How's the rice", "Ask a friend", "plain", "friend"],
    [
      "Say to your teacher: I'm not free in the afternoon",
      "I'm not free in the afternoon",
      "To your teacher",
      "polite",
      "teacher",
    ],
    [
      "Ask politely: Please don't look at the photo",
      "Please don't look at the photo",
      "Ask politely",
      "polite",
      undefined,
    ],
    ["Say very politely: Tanaka-sama", "Tanaka-sama", "Very polite", "polite", undefined],
    [
      "Ask your teacher: could you take a photo?",
      "could you take a photo?",
      "Ask your teacher",
      "polite",
      "teacher",
    ],
    ["Say to the waiter: One tea please", "One tea please", "To the waiter", "polite", "staff"],
    ["Say to Mika: Let's do our best", "Let's do our best", "To Mika", "plain", "friend"],
    [
      "Ask Ken (a friend): won't you fix my watch?",
      "won't you fix my watch?",
      "Ask Ken (a friend)",
      "plain",
      "friend",
    ],
    ["Say casually: I'm going home", "I'm going home", "Casual", "plain", undefined],
    ["Ask casually: Where's the station?", "Where's the station?", "Ask casually", "plain", undefined],
  ];

  for (const [en, text, label, form, audience] of cases) {
    it(`splits ${JSON.stringify(en)}`, () => {
      const parsed = parseRegisterCue(en);
      expect(parsed.text).toBe(text);
      expect(parsed.cue?.label).toBe(label);
      expect(parsed.cue?.form).toBe(form);
      expect(parsed.cue?.audience).toBe(audience);
    });

    it(`round-trips ${JSON.stringify(en)} byte-for-byte`, () => {
      // The i18n catalogs hash the AUTHORED string; if reconstruction is not
      // exact, 437 Korean rows go stale and silently revert to English.
      const parsed = parseRegisterCue(en);
      expect(registerCuedText(parsed.text, parsed.cue)).toBe(en);
    });
  }

  it("matches the cue case-insensitively but keeps the authored casing in `raw`", () => {
    const parsed = parseRegisterCue("SAY POLITELY: I eat at home");
    expect(parsed.cue?.raw).toBe("SAY POLITELY");
    expect(registerCuedText(parsed.text, parsed.cue)).toBe("SAY POLITELY: I eat at home");
  });

  it("prefers the LONGEST matching prefix", () => {
    // "say to a teacher" must not be shadowed by a shorter entry, and
    // "say politely" must not swallow "say very politely" (different label).
    expect(parseRegisterCue("Say to a teacher: X").cue?.label).toBe("To a teacher");
    expect(parseRegisterCue("Say very politely: X").cue?.label).toBe("Very polite");
  });
});

describe("parseRegisterCue — what it must NOT touch", () => {
  it("leaves a clock time alone (m19 authors 19 of these)", () => {
    for (const en of [
      "The train comes at 8:10",
      "It's 7:05 now",
      "The subway comes at 9:04, so I'm going now",
      "I'm taking the 8:10 train to go and watch a movie",
    ]) {
      const parsed = parseRegisterCue(en);
      expect(parsed.text).toBe(en);
      expect(parsed.cue).toBeUndefined();
    }
  });

  it("leaves an already-clean sentence untouched", () => {
    const parsed = parseRegisterCue("I eat at home");
    expect(parsed.text).toBe("I eat at home");
    expect(parsed.cue).toBeUndefined();
  });

  it("requires the colon — a sentence that MEANS a say-phrase is not a cue", () => {
    expect(parseRegisterCue("Say it one more time.").cue).toBeUndefined();
    expect(parseRegisterCue("Say it one more time.").text).toBe("Say it one more time.");
  });

  it("does not strip a cue over an EMPTY sentence", () => {
    // "Say politely:" with nothing after it is the whole text, not a cue.
    expect(parseRegisterCue("Say politely:").text).toBe("Say politely:");
    expect(parseRegisterCue("Say politely:").cue).toBeUndefined();
  });

  it("leaves an UNKNOWN cue-shaped prefix intact rather than guessing", () => {
    // Fail-closed: an un-badged prompt that still reads correctly beats a
    // gloss chopped at an arbitrary colon. `registerCueInventory.test.ts`
    // is what turns a new variant into a visible failure.
    const parsed = parseRegisterCue("Whisper to the dog: Good boy");
    expect(parsed.text).toBe("Whisper to the dog: Good boy");
    expect(parsed.cue).toBeUndefined();
  });

  it("passes non-Latin text through untouched", () => {
    const ko = "정중하게 말해요: 저는 아홉 시부터 일해요.";
    expect(parseRegisterCue(ko).text).toBe(ko);
    expect(parseRegisterCue(ko).cue).toBeUndefined();
  });

  it("handles empty input", () => {
    expect(parseRegisterCue("").text).toBe("");
    expect(parseRegisterCue("").cue).toBeUndefined();
  });
});

describe("stripResolvedCue", () => {
  const cue = parseRegisterCue("Say to a friend: X").cue;

  it("strips a TRANSLATED cue, which no English regex could match", () => {
    expect(stripResolvedCue("친구에게 말하세요: 응, 먹을게.", cue)).toBe("응, 먹을게.");
    expect(stripResolvedCue("선생님께 말하세요: 네, 가겠습니다.", cue)).toBe("네, 가겠습니다.");
  });

  it("strips the English cue too (the uiLocale === 'en' round trip)", () => {
    expect(stripResolvedCue("Say to a friend: Yeah, I'll eat", cue)).toBe("Yeah, I'll eat");
  });

  it("is a NO-OP without a cue — this is what protects 'Build: …'", () => {
    // The rule is general by design; the cue argument is the licence to use
    // it. Without the guard it would eat the "Build: " framing off every
    // un-cued build prompt in the course.
    expect(stripResolvedCue("Build: I eat at home", undefined)).toBe("Build: I eat at home");
    expect(stripResolvedCue("Translate: The dog is a friend too.", undefined)).toBe(
      "Translate: The dog is a friend too.",
    );
  });

  it("never truncates at sentence-ending punctuation", () => {
    // A mis-keyed catalog row must come back whole, not chopped.
    expect(stripResolvedCue("I ate. Then: I left.", cue)).toBe("I ate. Then: I left.");
  });

  it("never collapses to empty", () => {
    expect(stripResolvedCue("Say to a friend: ", cue)).toBe("Say to a friend: ");
  });
});

describe("stripRegisterCue (the lossy re-use-surface form)", () => {
  it("strips a table cue", () => {
    expect(stripRegisterCue("Say politely: I work from nine.")).toBe("I work from nine.");
  });

  it("stays permissive for the five legacy verbs", () => {
    // Different job, different posture: under-stripping is the bug on a
    // re-use surface (inv 8), over-stripping is harmless.
    expect(stripRegisterCue("Reply: Sounds good.")).toBe("Sounds good.");
    expect(stripRegisterCue("TELL your friend: Let's go.")).toBe("Let's go.");
    expect(stripRegisterCue("answer formally: I am a student.")).toBe("I am a student.");
  });

  it("leaves unprefixed text and non-Latin text alone, and never empties", () => {
    expect(stripRegisterCue("I am a student.")).toBe("I am a student.");
    expect(stripRegisterCue("Say it one more time.")).toBe("Say it one more time.");
    expect(stripRegisterCue("Say:")).toBe("Say:");
    expect(stripRegisterCue("저는 학생입니다.")).toBe("저는 학생입니다.");
  });
});

describe("derivePoliteness", () => {
  it("reads polite endings", () => {
    for (const ja of [
      "いえで たべます。",
      "みずを のみました。",
      "きょうは たべません。",
      "いっしょに いきましょう。",
      "ちゃを いっぱい ください。",
      "たなかさんは せんせいです。",
      "しゃしんを とって くれませんか。",
      "たべますか？",
      "そうですね。",
      "じかんが ありません。",
    ]) {
      expect(derivePoliteness(ja), ja).toBe("polite");
    }
  });

  it("reads plain endings", () => {
    for (const ja of [
      "うん、たべる。",
      "きょう たべた。",
      "あした いかない。",
      "この りょうりは おいしい。",
      "たなかさんは せんせいだ。",
      "いっしょに いこう。",
      "がんばろう",
      "ごはんは どう？",
      "たべるの？",
      "いく よ。",
    ]) {
      expect(derivePoliteness(ja), ja).toBe("plain");
    }
  });

  it("calls a predicate-less target INDETERMINATE, not plain", () => {
    // m7's さま row authors 「たなかさま」 under a "Say very politely" cue. A
    // vocative has no predicate to be polite or plain; calling it plain
    // would manufacture a disagreement out of nothing.
    expect(derivePoliteness("たなかさま")).toBe("indeterminate");
    expect(derivePoliteness("")).toBe("indeterminate");
  });
});
