/**
 * Content-safety lints over every authored lesson, in every course.
 *
 * Spencer, walking m31 on 2026-08-18, hit the build step
 * 「こどもが すきだから えんぴつを あげる。」 — "I like children, so I'll
 * give him a pencil" — and said: *"i like children or any other suggestive
 * thing should be avoided and made an authoring rule somehow."*
 *
 * ── THE RULE ────────────────────────────────────────────────────────────
 * No sentence may say that someone likes or loves a PERSON.
 *
 * The reason is a fact about Japanese, not squeamishness: 〜が すき spans
 * "like" and "am attracted to" with no morphology separating them, so a
 * human in the liked slot reads as a confession by default. English then
 * flattens it back to a bland "I like X" and the gloss stops warning the
 * author what they wrote. Pair it with a child and a gift — the exact m31
 * sentence — and it reads as grooming.
 *
 * Things, places, food, and nominalized clauses (〜のが/〜ことが すき) are
 * the intended objects and are untouched.
 *
 * ── WHY THIS LINTS THE ENGLISH AND NOT THE JAPANESE ─────────────────────
 * Because 「Xが すきだ」 does not, on its own, say which side X is on.
 * Given a topic earlier in the sentence it means X is the LIKER:
 *
 *   あの みせは たかいけど あねが すきだから よく いく。   (m17 L7)
 *   "That shop is expensive, but my older sister likes it, so we go often."
 *
 * — structurally identical to 「こどもが すきだから…」, opposite meaning. A
 * Japanese-side regex fires on both or neither; the first draft of this
 * lint fired on m17 and was wrong. The English gloss is the disambiguated
 * form, it is what a reviewer actually reacts to, and it is what Spencer
 * reacted to. So the gloss is what gets checked.
 *
 * Prenominal 「Xが すきな Y」 ("the Y that X likes") glosses as "the shop
 * Mika likes" — the verb has no object in the gloss, so it never matches.
 * That construction appears ~20 times across m15/m16 and is fine.
 */
import { describe, it, expect } from "vitest";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";

/**
 * English nouns denoting a person, as they appear in glosses. Recurring
 * cast names included — "I like Mika" is the same defect with a name on it.
 */
const PERSON_WORDS = [
  "child", "children", "kid", "kids", "baby", "babies", "toddler", "toddlers",
  "boy", "boys", "girl", "girls", "man", "men", "woman", "women",
  "person", "people", "guy", "guys", "someone", "somebody",
  "friend", "friends", "teacher", "teachers", "student", "students",
  "doctor", "doctors", "clerk", "clerks", "neighbour", "neighbor",
  "neighbours", "neighbors", "classmate", "classmates",
  "mother", "father", "mom", "dad", "mum", "parent", "parents",
  "sister", "sisters", "brother", "brothers", "son", "daughter",
  "grandmother", "grandfather", "aunt", "uncle", "cousin", "family",
  "Mika", "Ken", "Tom", "Tanaka", "Yamada",
];

/**
 * Pronouns are person words only when they END the clause. "so I like him"
 * is a confession; "she likes them equally" (m26) and "I like her cat" are
 * not — the first "them" is two compared objects, and "her" there is a
 * possessive. Requiring clause-final position is what separates them, and
 * it is why bare he/she/they are absent: a subject pronoun can never land
 * in the liked slot right after the verb.
 */
const PERSON_PRONOUNS = ["him", "her", "them", "you", "me", "us"];

/**
 * <like|love> + optional determiners/adjectives + a person word.
 *
 * The determiner run is bounded to three words so the match stays local:
 * "I like the tea I drink at the coffee shop" must not reach "shop" and
 * must not reach across a clause boundary into an unrelated person.
 */
const LIKES_A_PERSON = new RegExp(
  String.raw`\b(?:like|likes|liked|love|loves|loved)\s+` +
    String.raw`(?:(?:the|a|an|my|your|his|her|their|our|that|this|those|these|little|big|older|younger|old|young|new|other|same|nice|kind)\s+){0,3}` +
      `(?:(?:${PERSON_WORDS.join("|")})\\b(?!['\u2019])` +
    `|(?:${PERSON_PRONOUNS.join("|")})\\b(?=\\s*(?:[.,;!?"']|$)))`,
  "i",
);

/**
 * Sentences that have been read and cleared. Each entry needs a written
 * reason — same contract as WORD_IMAGE_MCQ_BLOCKLIST in grammarHelpers.
 * Empty is the healthy state; adding one is a content decision, not a
 * way to quiet the lint.
 */
const REVIEWED_EXEMPTIONS = new Map<string, string>([
  [
    "がんばろう is the bare will — right for a friend like Mika. がんばります is the same promise in polite dress, for せんせい. がんばる is only the bare dictionary form, with no suggestion in it at all.",
    "m34-neo-10 cloze explanation — a false positive on the PREPOSITION " +
      '"like" ("a friend like Mika" = "a friend such as Mika"), not the verb ' +
      "\"to like\"; nobody in the sentence likes or loves anybody.",
  ],
  [
    "たい is first-person interior — わたし owns the wanting directly. いきたがっている describes someone ELSE's visible wanting-behavior; using it for yourself sounds like you're describing your own behavior from the outside.",
    "m36-neo-5 cloze explanation — a false positive on the VERB-ADJACENT " +
      '"sounds like you\'re" (= "seems as if"), not the verb "to like"; ' +
      "nobody in the sentence likes anybody.",
  ],
]);

/**
 * Every string value anywhere in a step tree, tagged with its lesson.
 *
 * ALL languages, not just JA. The rule is about the gloss, and glosses are
 * English in every course — 좋아하다 and *gustar* carry the same "is this a
 * confession?" ambiguity, and a learner reading "I like children" does not
 * care which course produced it. Widened 2026-08-18 after the JA pass.
 */
function collectStrings(): { lessonId: string; text: string }[] {
  const out: { lessonId: string; text: string }[] = [];
  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson) continue;
    const walk = (v: unknown) => {
      if (typeof v === "string") out.push({ lessonId, text: v });
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.values(v).forEach(walk);
    };
    walk(lesson.steps);
  }
  return out;
}

describe("JA content safety", () => {
  const strings = collectStrings();

  it("collected lesson text (guards against a silently empty scan)", () => {
    // A lint over zero strings passes vacuously, and this file's whole job
    // is to fail when something is wrong. m31 alone contributes hundreds.
    expect(strings.length).toBeGreaterThan(1000);
  });

  it("the lint fires on the sentence that prompted it", () => {
    // Regression guard on the RULE, not just on the corpus: if someone
    // loosens the regex until the corpus passes, this fails.
    expect(LIKES_A_PERSON.test("I like children, so I'll give him a pencil"))
      .toBe(true);
    expect(LIKES_A_PERSON.test("That watch is expensive, but I like my friend"))
      .toBe(true);
    expect(LIKES_A_PERSON.test("I like people who swim in the sea")).toBe(true);
    // …and stays quiet on the constructions that are fine.
    expect(LIKES_A_PERSON.test("My mother likes cars, so she often goes shopping"))
      .toBe(false);
    expect(LIKES_A_PERSON.test("The shop Mika likes is expensive")).toBe(false);
    expect(LIKES_A_PERSON.test("I like the tea I drink at the coffee shop"))
      .toBe(false);
    expect(LIKES_A_PERSON.test("My little sister likes pencils, so I'll give her one"))
      .toBe(false);
    // Pronouns: liked-slot vs. everything else.
    expect(LIKES_A_PERSON.test("The doctor is kind, so I like him")).toBe(true);
    expect(LIKES_A_PERSON.test("She says she likes them equally")).toBe(false);
    expect(LIKES_A_PERSON.test("He doesn't like them and has no time")).toBe(false);
    expect(LIKES_A_PERSON.test("I like her cat")).toBe(false);
    // Possessive: the person MODIFIES the liked thing rather than being it.
    // (es-m10-4 "I like my parents' apples" — the first cross-language hit,
    // and a false positive.)
    expect(LIKES_A_PERSON.test("I like my parents' apples.")).toBe(false);
    expect(LIKES_A_PERSON.test("I like my sister's dog")).toBe(false);
    expect(LIKES_A_PERSON.test("I like my little sister")).toBe(true);
  });

  it("no lesson sentence has a person as the thing liked", () => {
    const hits = strings
      .filter(({ text }) => LIKES_A_PERSON.test(text))
      .filter(({ text }) => !REVIEWED_EXEMPTIONS.has(text));
    expect(
      [...new Set(hits.map((h) => `${h.lessonId}: ${h.text}`))],
      "Saying someone likes a PERSON reads as a confession in Japanese " +
        "(〜が すき does not distinguish liking from attraction), and reads " +
        "far worse when the person is a child. Give the liking a thing, a " +
        "place, or a nominalized clause (〜のが/〜ことが すき).",
    ).toEqual([]);
  });
});
