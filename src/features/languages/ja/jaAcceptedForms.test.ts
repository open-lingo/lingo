import { describe, expect, it } from "vitest";
import {
  politeSentenceVariants,
  plainSentenceVariant,
  registerPairFor,
  scrambleVariants,
  REGISTER_GRADED_FROM_MODULE,
} from "./jaAcceptedForms";
import { expandAcceptedAnswers } from "@/features/lesson/components/steps/translateVariants";

describe("politeSentenceVariants", () => {
  it("accepts the polite counterpart of a plain predicate", () => {
    // Spencer's actual example (open ruling 1, 2026-07-24).
    expect(politeSentenceVariants("うまが いる")).toContain("うまが います");
    expect(politeSentenceVariants("ほんが ある。")).toContain("ほんが あります。");
    expect(politeSentenceVariants("ごはんを たべない。")).toContain(
      "ごはんを たべません。",
    );
  });

  it("takes the LONGEST plain form so ない doesn't shadow いない/こない", () => {
    // ねこは いない ends with both いない and ない — いません, never ありません.
    expect(politeSentenceVariants("ねこは いない。")).toEqual(["ねこは いません。"]);
    expect(politeSentenceVariants("ミカは こない。")).toEqual(["ミカは きません。"]);
    // ある's own negative IS suppletive ない → ありません.
    expect(politeSentenceVariants("かぎが ない。")).toEqual(["かぎが ありません。"]);
  });

  it("adds か to a polite question", () => {
    expect(politeSentenceVariants("かぎ、ある？")).toEqual(["かぎ、ありますか？"]);
  });

  it("gives a bare nominal the polite copula", () => {
    // The course teaches casual copula-DROP before です exists, so both are
    // the same sentence one register apart.
    expect(politeSentenceVariants("かめは そこ")).toEqual(["かめは そこです"]);
    expect(politeSentenceVariants("ぼうしは どこ？")).toEqual([
      "ぼうしは どこですか？",
    ]);
    expect(plainSentenceVariant("かめは そこです")).toBe("かめは そこ");
  });

  it("never puts です on a verb form", () => {
    // たべないです is not the polite of たべない — たべません is.
    expect(politeSentenceVariants("ごはんを たべない。")).toEqual([
      "ごはんを たべません。",
    ]);
    expect(politeSentenceVariants("ミカは こない。")).not.toContain(
      "ミカは こないです。",
    );
  });

  it("only matches at a phrase boundary", () => {
    // はいる is a real godan verb, so it derives correctly as a whole word —
    // proving the match did NOT split it into は + いる (which would have
    // produced the ichidan-shaped はいます).
    expect(politeSentenceVariants("はいる")).toEqual(["はいります"]);
    // Unspaced input, on the other hand, must not have its tail rewritten:
    // ねこはいる is not a word we can vouch for, so we decline.
    expect(politeSentenceVariants("ねこはいる")).toEqual([]);
  });
});

describe("registerPairFor (the 'show them both' surface)", () => {
  it("returns both renderings whichever register was written", () => {
    expect(registerPairFor("うまが いる")).toEqual({
      plain: "うまが いる",
      polite: "うまが います",
    });
    // …and from the polite side, so a learner who types ます sees the plain.
    expect(registerPairFor("うまが います")).toEqual({
      plain: "うまが いる",
      polite: "うまが います",
    });
  });

  it("round-trips a polite question back to plain, か and all", () => {
    expect(plainSentenceVariant("かぎ、ありますか？")).toBe("かぎ、ある？");
  });

  it("pairs a copula-drop nominal too", () => {
    expect(registerPairFor("かめは そこ")).toEqual({
      plain: "かめは そこ",
      polite: "かめは そこです",
    });
  });

  it("declines when the predicate is a word we don't know", () => {
    // No verb entry, no nominal atom — we say nothing rather than guess.
    expect(registerPairFor("ほげは ふが")).toBeNull();
  });
});

describe("scrambleVariants", () => {
  it("reorders particle-marked phrases and keeps the predicate final", () => {
    // The reorder m6 walk round 6 had to hand-list in alsoAccept.
    const out = scrambleVariants("ミカの かめは いけに いる");
    expect(out).toContain("いけに ミカの かめは いる");
    // ミカの stays glued to かめは — の links, it does not close a phrase.
    expect(out.every((s) => s.endsWith("いる"))).toBe(true);
    expect(out).not.toContain("かめは ミカの いけに いる");
  });

  it("permutes three movable phrases", () => {
    const out = scrambleVariants("きょうは ミカの いえで ごはんを たべない。");
    expect(out).toHaveLength(5); // 3! - 1 (the original)
    expect(out).toContain("ごはんを きょうは ミカの いえで たべない。");
    expect(out.every((s) => s.endsWith("たべない。"))).toBe(true);
  });

  it("scrambles a bare temporal adverb (no particle)", () => {
    expect(scrambleVariants("きょう これを しない。")).toEqual([
      "これを きょう しない。",
    ]);
  });

  it("bails rather than guess", () => {
    expect(scrambleVariants("かめは そこ")).toEqual([]); // too short
    expect(scrambleVariants("かばんの なかに ある。")).toEqual([]); // one movable chunk
  });
});

describe("expandAcceptedAnswers composition", () => {
  it("reaches scrambled AND polite renderings from one authored answer", () => {
    const out = expandAcceptedAnswers(["ミカの かめは いけに いる"]);
    expect(out).toContain("ミカの かめは いけに いる"); // authored
    expect(out).toContain("いけに ミカの かめは いる"); // scrambled
    expect(out).toContain("ミカの かめは いけに います"); // polite
    expect(out).toContain("いけに ミカの かめは います"); // both
  });

  it("accepts either register before module 20, grades it from 20 on", () => {
    // Spencer 2026-07-24: "politeness flag will never be a choice, we will
    // accept either answer, show them both, and then start grading on it
    // later in the course, maybe module 20 or so."
    const early = expandAcceptedAnswers(["うまが いる"], { moduleIndex: 6 });
    expect(early).toContain("うまが います");

    const late = expandAcceptedAnswers(["うまが いる"], {
      moduleIndex: REGISTER_GRADED_FROM_MODULE,
    });
    expect(late).not.toContain("うまが います");
    // Scrambling is unaffected by the register gate — word order stays free.
    expect(
      expandAcceptedAnswers(["ミカの かめは いけに いる"], {
        moduleIndex: REGISTER_GRADED_FROM_MODULE,
      }),
    ).toContain("いけに ミカの かめは いる");

    // Outside a lesson (null module) stays permissive.
    expect(
      expandAcceptedAnswers(["うまが いる"], { moduleIndex: null }),
    ).toContain("うまが います");
  });

  it("stays bounded", () => {
    const out = expandAcceptedAnswers(["きょうは ミカの いえで ごはんを たべない。"]);
    expect(out.length).toBeLessThanOrEqual(600);
    expect(out.length).toBeGreaterThan(5);
  });

  /**
   * A TOPIC IS DROPPABLE BECAUSE IT OPENS A CLAUSE, NOT BECAUSE IT OPENS THE
   * STRING. The temporal-は and first-person-topic rules were both anchored
   * with `^`, so in a two-sentence answer the second clause's topic sat
   * behind a 。 and was unreachable. Spencer built m28's 「うちに かえらなきゃ。
   * あした しごとが あるんだ」 and was marked wrong for the missing は — correct
   * Japanese, and the bare adverb is at least as natural as あしたは.
   *
   * Asserted as the rule (any clause), not as the two sentences that
   * happened to be on screen.
   */
  it("drops a clause-opening topic in ANY sentence, not just the first", () => {
    const authored = "うちに かえらなきゃ。あしたは しごとが あるんだ";
    const out = expandAcceptedAnswers([authored]);
    expect(out).toContain("うちに かえらなきゃ。あした しごとが あるんだ");

    // The first-person topic drops mid-answer on the same grounds.
    expect(
      expandAcceptedAnswers(["いえに いる。わたしは ごはんを たべない"]),
    ).toContain("いえに いる。ごはんを たべない");

    // Still true at the head of the string — the old behaviour is a special
    // case of the new rule, not something it replaced.
    expect(expandAcceptedAnswers(["あしたは しごとが ある"])).toContain(
      "あした しごとが ある",
    );
    expect(expandAcceptedAnswers(["わたしは しゃしんを みない"])).toContain(
      "しゃしんを みない",
    );

    // A は that does NOT open a clause is load-bearing and must survive.
    expect(expandAcceptedAnswers(["しごとは あしたは ない"])).not.toContain(
      "しごと あしたは ない",
    );
  });
});
