import { describe, expect, it } from "vitest";
import {
  politeSentenceVariants,
  plainSentenceVariant,
  registerPairFor,
  scrambleVariants,
  mustFormVariants,
  longMustFormVariants,
  homeReturnVariants,
  copulaVariants,
  teRequestVariants,
  listOrderVariants,
  nDesuVariants,
  dewaVariants,
  plainSentenceVariants,
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
    expect(out.length).toBeLessThanOrEqual(2500);
    expect(out.length).toBeGreaterThan(5);
  });

  /**
   * The cap is spent BREADTH-first. Depth-first exhausted it inside one deep
   * corner of the search — 「じかんが ないから もう かえらなくちゃ」 is a single
   * swap away from the authored sentence and was still being cut, while
   * five-rule permutations of the same sentence survived (m28 walk,
   * 2026-08-05). Every one-rule-away variant must be reachable, whatever the
   * cap is set to.
   */
  it("reaches one-rule-away variants before deep combinations", () => {
    const out = expandAcceptedAnswers(["じかんが ないから もう かえらなきゃ。"], {
      moduleIndex: 28,
    });
    expect(out).toContain("じかんが ないから もう かえらなくちゃ。");
    expect(out).toContain("じかんが ないから もう うちに かえらなきゃ。");
  });
});

/**
 * 〜なきゃ / 〜なくちゃ / 〜なければ ならない are ONE obligation.
 *
 * m28's L2 rule card, verbatim: 「いかなくちゃ」 "means exactly what 「いかなきゃ」
 * means, in exactly the same register. Which one a speaker reaches for is
 * habit, not grammar." The grader used to disagree with the lesson.
 */
describe("mustFormVariants", () => {
  it("treats なきゃ and なくちゃ as the same form", () => {
    expect(mustFormVariants("はたらかなきゃ。")).toContain("はたらかなくちゃ。");
    expect(mustFormVariants("はたらかなくちゃ。")).toContain("はたらかなきゃ。");
  });

  it("also accepts the long form a contraction contracts FROM", () => {
    expect(mustFormVariants("きょうは かえらなきゃ。")).toContain(
      "きょうは かえらなければ ならない。",
    );
    expect(mustFormVariants("いかなくちゃ")).toContain("いかなくては ならない");
  });

  /**
   * ONE-WAY (Spencer, 2026-08-05). m28 L2's teaching target IS the long form,
   * so a long-form answer must not also accept the contraction the learner
   * already knows from L1 — that would let them skip the lesson. Nothing here
   * matches a long form, so the expansion cannot run backwards.
   */
  it("never contracts a long form back down", () => {
    expect(mustFormVariants("あした いかなければ ならない。")).toEqual([]);
    expect(mustFormVariants("あした いかなくては ならない。")).toEqual([]);
  });

  it("leaves the rest of the sentence untouched", () => {
    expect(mustFormVariants("うちに かえらなきゃ。あしたは しごとが あるんだ")).toContain(
      "うちに かえらなくちゃ。あしたは しごとが あるんだ",
    );
  });
});

/**
 * 帰る carries its own destination — it is "go back where you belong", not
 * "return" in the abstract — so saying うちに out loud and leaving it implied
 * are the same sentence (m28 walk, 2026-08-05: 「きょう うちに かえらなきゃ」
 * graded wrong against 「きょうは かえらなきゃ」).
 */
describe("homeReturnVariants", () => {
  it("makes an explicit home destination optional", () => {
    expect(homeReturnVariants("うちに かえらなきゃ。")).toContain("かえらなきゃ。");
    expect(homeReturnVariants("きょうは かえらなきゃ。")).toContain(
      "きょうは うちに かえらなきゃ。",
    );
  });

  it("spells home four ways", () => {
    const out = homeReturnVariants("うちに かえる。");
    expect(out).toEqual(
      expect.arrayContaining(["いえに かえる。", "うちへ かえる。", "いえへ かえる。"]),
    );
  });

  /**
   * Scoped to うち/いえ. 「くにに かえる」 is going back to your COUNTRY, and
   * dropping くに loses the sentence — only the destination the verb already
   * implies is droppable.
   */
  it("never drops a destination that is not home", () => {
    expect(homeReturnVariants("くにに かえる。")).toEqual([]);
  });

  /**
   * One clause gets one destination. Checking only the token in front of the
   * verb read the legal scramble 「くにに わたしは かえらなきゃ」 as
   * destinationless and accepted a double-marked 「くにに わたしは うちに
   * かえらなきゃ」.
   */
  it("never double-marks a destination across a scramble", () => {
    expect(homeReturnVariants("くにに わたしは かえらなきゃ")).toEqual([]);
  });

  it("only ever applies to かえる", () => {
    expect(homeReturnVariants("がっこうに いく。")).toEqual([]);
    expect(homeReturnVariants("うちに いる。")).toEqual([]);
  });
});

describe("m28 nakya walk (Spencer, 2026-08-05)", () => {
  /** The lesson's own translate step: "I have to go home today". */
  const authored = ["きょうは かえらなきゃ。", "きょうは かえらなきゃ", "きょうはかえらなきゃ"];
  const accepted = () => expandAcceptedAnswers(authored, { moduleIndex: 28 });

  it("accepts the destination said out loud, and either must-form", () => {
    const out = accepted();
    for (const answer of [
      "きょう かえらなきゃ", // は dropped (already worked)
      "きょう うちに かえらなきゃ", // destination spelled out
      "きょうは うちに かえらなきゃ",
      "きょうは いえに かえらなきゃ",
      "きょうは うちへ かえらなきゃ",
      "きょうは かえらなくちゃ", // the other contraction
      "きょう うちに かえらなくちゃ", // both at once
      "きょうは かえらなければ ならない", // the long form
    ]) {
      expect(out, answer).toContain(answer);
    }
  });

  /** Leniency must not become "anything passes". */
  it("still rejects a different verb, and a plain negative", () => {
    const out = accepted();
    expect(out).not.toContain("きょうは いかなきゃ");
    expect(out).not.toContain("きょうは かえらない");
  });

  /**
   * The mirror of the temporal-は rule: dropping an authored は was accepted,
   * ADDING one to an authored bare adverb was not.
   */
  it("marks a bare clause-opening temporal", () => {
    expect(
      expandAcceptedAnswers(["あした いかなければ ならない。"], { moduleIndex: 28 }),
    ).toContain("あしたは いかなければ ならない。");
    // はたらく opens with は — testing for a bare "は" character rather than a
    // topic PARTICLE read that as an existing topic and suppressed the rule.
    expect(
      expandAcceptedAnswers(["まいにち はたらかなきゃ。"], { moduleIndex: 28 }),
    ).toContain("まいにちは はたらかなきゃ。");
  });
});

/**
 * The 2026-08-05 sweep. Four independent audits across m3–m30 found ~120
 * correct answers the grader rejected; almost all of them traced to three
 * structural gaps rather than to missing special cases.
 */
describe("register widening covers the whole predicate system", () => {
  /**
   * GAP 1: only the plain→polite half ever ran. `plainSentenceVariant` was
   * written, exported and unit-tested, and the expander never called it — so
   * which register a learner could answer in depended on which one the AUTHOR
   * happened to write.
   */
  it("accepts either register whichever one was authored", () => {
    const politeAuthored = expandAcceptedAnswers(["みずを のみます。"], {
      moduleIndex: 7,
    });
    expect(politeAuthored).toContain("みずを のむ。");

    const plainAuthored = expandAcceptedAnswers(["みずを のむ。"], {
      moduleIndex: 7,
    });
    expect(plainAuthored).toContain("みずを のみます。");
  });

  it("still grades register from module 20", () => {
    expect(
      expandAcceptedAnswers(["みずを のみます。"], {
        moduleIndex: REGISTER_GRADED_FROM_MODULE,
      }),
    ).not.toContain("みずを のむ。");
  });

  /**
   * GAP 2: `buildRegisterMap` read only `VERB_ENTRIES.forms.{dictionary,masu,
   * nai,masu-neg,ta,masu-past}`. `ADJ_ENTRIES` — complete form tables, sitting
   * in the same file — was never imported, and neither was `masu-past-neg` or
   * `tai`. Whole grammatical categories had no polite route at all.
   */
  it("gives conjugated i-adjectives their です", () => {
    expect(politeSentenceVariants("かさは やすかった")).toContain(
      "かさは やすかったです",
    );
    expect(politeSentenceVariants("きのうは よくなかった")).toContain(
      "きのうは よくなかったです",
    );
  });

  it("gives every たい cell its です", () => {
    expect(politeSentenceVariants("みずが のみたい")).toContain(
      "みずが のみたいです",
    );
    expect(politeSentenceVariants("みずが のみたくない")).toContain(
      "みずが のみたくないです",
    );
    expect(politeSentenceVariants("すしが たべたかった")).toContain(
      "すしが たべたかったです",
    );
  });

  it("registers the past-negative cell", () => {
    expect(politeSentenceVariants("きのうは なにも しなかった")).toContain(
      "きのうは なにも しませんでした",
    );
  });

  it("gives na-adjectives both polite negatives", () => {
    const out = politeSentenceVariants("まどは きれいじゃなかった");
    expect(out).toContain("まどは きれいじゃなかったです");
    expect(out).toContain("まどは きれいじゃありませんでした");
  });

  /**
   * GAP 3: the copula is not a separate token, so `finalToken` handed the
   * nominal check "せんせいだ" and nothing matched. 「ははは せんせいだ。」 accepted
   * three variants.
   */
  it("sees a nominal through a fused plain copula", () => {
    expect(politeSentenceVariants("ははは せんせいだ")).toContain(
      "ははは せんせいです",
    );
    expect(plainSentenceVariants("たなかさんは せんせいです")).toEqual(
      expect.arrayContaining(["たなかさんは せんせいだ", "たなかさんは せんせい"]),
    );
  });

  /** A number+counter predicate is a phrase no lexicon holds whole. */
  it("sees a number+counter predicate as nominal", () => {
    expect(politeSentenceVariants("えんぴつは じゅうきゅうえんだ")).toContain(
      "えんぴつは じゅうきゅうえんです",
    );
    expect(politeSentenceVariants("いま しちじ ごふんだ")).toContain(
      "いま しちじ ごふんです",
    );
  });

  /** …but a verb past that merely ends in だ is not one. */
  it("never reads a verb past as a copula", () => {
    expect(politeSentenceVariants("みずを のんだ")).toContain("みずを のみました");
    expect(politeSentenceVariants("みずを のんだ")).not.toContain("みずを のんです");
  });

  it("drops and restores the casual copula", () => {
    expect(copulaVariants("ははは せんせいだ。")).toContain("ははは せんせい。");
    expect(copulaVariants("ははは せんせい。")).toContain("ははは せんせいだ。");
    // からだ is a noun that merely ends in だ — it must survive whole.
    expect(copulaVariants("これは からだ。")).not.toContain("これは から。");
  });
});

describe("spoken contractions", () => {
  /** ん is the spoken contraction of の; m27 authors only the ん spelling. */
  it("restores の in んだ / んです", () => {
    expect(nDesuVariants("ねつが あるんだ。")).toContain("ねつが あるのだ。");
    expect(nDesuVariants("ねつが あるんです。")).toContain("ねつが あるのです。");
    expect(nDesuVariants("びょうきなんだ。")).toContain("びょうきなのだ。");
  });

  /**
   * NOT any trailing の. m30's casual の-question is a different item, and
   * 「…のだ？」 is not how a spoken question ends.
   */
  it("leaves a casual の-question alone", () => {
    expect(nDesuVariants("いま なにしてるの？")).toEqual([]);
  });

  it("swaps じゃ and では in the negative copula", () => {
    expect(dewaVariants("ごごは ひまじゃない。")).toContain("ごごは ひまではない。");
    expect(dewaVariants("ごごは ひまでは ない。")).toContain("ごごは ひまじゃない。");
  });

  it("swaps なければ and なくては in a long must-form", () => {
    expect(longMustFormVariants("あした いかなければ なりません。")).toContain(
      "あした いかなくては なりません。",
    );
  });

  /** より marks a comparison and scrambles like any other case particle. */
  it("scrambles a より comparison", () => {
    expect(scrambleVariants("えきは がっこうより ちかい")).toContain(
      "がっこうより えきは ちかい",
    );
  });

  /** ごご/ばん are bare time-of-day nouns exactly like あさ/よる. */
  it("treats ごご and ばん as temporals", () => {
    expect(expandAcceptedAnswers(["ごごは ひまじゃない。"])).toContain(
      "ごご ひまじゃない。",
    );
    expect(expandAcceptedAnswers(["ばんは とりにくを たべる。"])).toContain(
      "ばん とりにくを たべる。",
    );
  });

  /** です closes a CLAUSE, not only the answer — the topic-は bug again. */
  it("drops です at an interior clause end", () => {
    expect(expandAcceptedAnswers(["やすいです。かいます。"], { moduleIndex: 9 })).toContain(
      "やすい。かいます。",
    );
  });
});

/**
 * Tier 2 of the 2026-08-05 sweep — the structural gaps that needed more than
 * a lookup table.
 */
describe("scrambling survives a chunk it cannot identify", () => {
  /**
   * It used to be all-or-nothing: one unrecognised chunk bailed the whole
   * sentence, so a leading interjection or a bare verb cost the sentence its
   * scrambling entirely.
   */
  it("permutes around a fixed leading interjection", () => {
    expect(scrambleVariants("すみません バスで としょかんに いきますか")).toContain(
      "すみません としょかんに バスで いきますか",
    );
  });

  /**
   * …and never reorders ACROSS the fixed chunk. と is in CASE_PARTICLES and
   * つもりだと looks movable, but here it is quotative and belongs to the
   * predicate complex — permuting the whole span would hoist it to the front.
   */
  it("stops the run at a bare verb instead of tearing the predicate apart", () => {
    const out = scrambleVariants("トムは くうこうに つく つもりだと おもう");
    expect(out).toContain("くうこうに トムは つく つもりだと おもう");
    expect(out.every((s) => s.includes("つく つもりだと おもう"))).toBe(true);
  });

  /** いちばん carries no particle and must stay pinned to the predicate. */
  it("keeps a fixed adverb next to the predicate", () => {
    const out = scrambleVariants("のみものの なかで ちゃが いちばん やすい");
    expect(out).toContain("ちゃが のみものの なかで いちばん やすい");
    expect(out.every((s) => s.includes("いちばん やすい"))).toBe(true);
  });

  it("still declines when there is nothing safe to move", () => {
    expect(scrambleVariants("かめは そこ")).toEqual([]);
    expect(scrambleVariants("かばんの なかに ある。")).toEqual([]);
  });
});

describe("teRequestVariants", () => {
  it("pairs a bare て-request with its てください twin", () => {
    expect(teRequestVariants("みずを のんでください。")).toContain("みずを のんで。");
    expect(teRequestVariants("うたを きいて。")).toContain("うたを きいてください。");
  });

  /**
   * Driven off the lexicon, not a 〜て/〜で suffix match: a godan て-form ends
   * in で, so a suffix rule would read 「いえで」 as one and offer
   * 「いえでください」. きって (a postage stamp) is the same trap.
   */
  it("never reads a で-marked place or a て-final noun as a verb", () => {
    expect(teRequestVariants("いえで。")).toEqual([]);
    expect(teRequestVariants("これは きって。")).toEqual([]);
  });
});

describe("listOrderVariants", () => {
  it("swaps the members of a や list and a たり pair", () => {
    expect(listOrderVariants("いぬや ねこが すきだ。")).toContain(
      "ねこや いぬが すきだ。",
    );
    expect(listOrderVariants("えいがを みたり おんがくを きいたり する。")).toContain(
      "おんがくを きいたり えいがを みたり する。",
    );
  });

  /**
   * と is DELIBERATELY excluded. 「いぬと ねこが いる」 (a list) and
   * 「ミカと えいがを みる」 (と = "with") are structurally identical, and
   * swapping the second says something else entirely.
   */
  it("never reorders a と phrase", () => {
    expect(listOrderVariants("ミカと えいがを みる。")).toEqual([]);
    expect(listOrderVariants("いぬと ねこが いる。")).toEqual([]);
  });
});

describe("register reaches every clause", () => {
  /**
   * Register lives on a predicate and a two-sentence answer has two of them;
   * only the string-final one was ever rewritten.
   */
  it("rewrites an interior clause's register", () => {
    const out = expandAcceptedAnswers(["やすいです。かいます。"], { moduleIndex: 9 });
    expect(out).toContain("やすいです。かう。");
    expect(out).toContain("やすい。かいます。");
  });
});

describe("optional topic marking", () => {
  it("marks a clause-opening demonstrative subject", () => {
    const out = expandAcceptedAnswers(["これ、なに？"], { moduleIndex: 4 });
    expect(out).toContain("これは なに？");
  });

  /** An OBJECT これ must never be topic-marked — これを ください stays put. */
  it("never topic-marks an object これ", () => {
    expect(expandAcceptedAnswers(["これを ください。"], { moduleIndex: 8 })).not.toContain(
      "これは ください。",
    );
  });

  it("marks the superlative's scope phrase, never its winner", () => {
    const out = expandAcceptedAnswers(["のみものの なかで ちゃが いちばん やすい。"], {
      moduleIndex: 26,
    });
    expect(out).toContain("のみものの なかでは ちゃが いちばん やすい。");
    // m26 teaches が on the winner; は there would say something else.
    expect(out).not.toContain("のみものの なかで ちゃは いちばん やすい。");
  });

  it("swaps わたしの and ぼくの in the possessive slot", () => {
    expect(expandAcceptedAnswers(["これは わたしの けいたいだ"], { moduleIndex: 4 })).toContain(
      "これは ぼくの けいたいだ",
    );
  });

  it("puts なん, not なに, in front of the copula", () => {
    expect(politeSentenceVariants("これは なに？")).toContain("これは なんですか？");
  });
});

describe("clause-opening topics", () => {
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
