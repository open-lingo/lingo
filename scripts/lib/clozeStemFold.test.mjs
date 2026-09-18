import test from "node:test";
import assert from "node:assert/strict";
import { findSharedStemSplit, splitSharedClozeStem } from "./clozeStemFold.mjs";

/**
 * A fake JMdict `lookupKana` so these tests don't need the real 19 MB
 * sidecar index on disk. Entries below are copied verbatim (ids omitted) from
 * a real JMdict lookup taken during this rule's development — see
 * `clozeStemFold.mjs`'s header for the full false-positive history each one
 * corresponds to.
 */
function fakeLookup(table) {
  return (text) => table[text] ?? null;
}

const REAL_LOOKUP_SNAPSHOT = {
  // The true positive (TestFlight #192).
  そつぎょう: { pos: ["n", "vs", "vi"], common: true },
  べんきょう: { pos: ["n", "vs", "vt", "vi"], common: true },
  // Verb-stem false positives: a real, but UNRELATED and mostly uncommon,
  // JMdict entry happens to share the kana with a godan verb's stem.
  さが: { pos: ["n", "adj-t", "adv-to"], common: false },
  がんば: { pos: ["int"], common: false },
  あそ: { pos: ["pn"], common: false },
  // いき/こと/かし/はじ are common strings with a dozen homographs each;
  // `lookupKana`'s pos union DOES contain "vs" here (from an unrelated
  // sense), which is why condition 2 (remainder shape) is load-bearing too.
  いき: { pos: ["n", "adj-na", "pref", "n-suf", "adj-no", "vs", "vt"], common: true },
  こと: { pos: ["n", "n-suf", "vs", "vt", "adj-na", "n-pref", "prt"], common: true },
  かし: { pos: ["n", "vs", "vt", "adj-no"], common: true },
  はじ: { pos: ["n", "vs", "vt"], common: true },
  // い-adjective / unrelated-verb false positives: no "vs" tag at all, but
  // the remainder happens to start with し by coincidence.
  おい: { pos: ["int", "pn", "n", "adj-no", "pref"], common: true },
  なく: { pos: ["v5k", "vi", "vt"], common: true },
  おも: { pos: ["adj-na", "n"], common: true },
};

const lookup = fakeLookup(REAL_LOOKUP_SNAPSHOT);

test("findSharedStemSplit: folds a noun+する compound (#192, verbatim m34 case)", () => {
  const options = ["そつぎょうすることになった", "そつぎょうすることにした", "そつぎょうした"];
  assert.equal(findSharedStemSplit(options, lookup), "そつぎょう");
});

test("findSharedStemSplit: folds a shorter noun+する set too", () => {
  const options = ["べんきょうします", "べんきょうした", "べんきょうしない"];
  assert.equal(findSharedStemSplit(options, lookup), "べんきょう");
});

test("findSharedStemSplit: rejects a godan verb's own stem+ending (探す, condition-1 escape)", () => {
  const options = ["さがそうと おもう", "さがすつもりだ", "さがす"];
  assert.equal(findSharedStemSplit(options, lookup), null);
});

test("findSharedStemSplit: rejects an interjection/pronoun homograph coincidence (頑張る/遊ぶ stems)", () => {
  assert.equal(findSharedStemSplit(["がんばろう", "がんばります", "がんばる"], lookup), null);
  assert.equal(findSharedStemSplit(["あそぼう", "あそぶ", "あそんだ"], lookup), null);
});

test("findSharedStemSplit: rejects a verb stem even when the kana ALSO carries a stray vs tag (行く/事/貸す/始まる)", () => {
  // These are the cases that defeated a POS-only check: `いき`/`こと`/`かし`/
  // `はじ` each have an unrelated homograph tagged `vs`, but none of these
  // remainders is a する-conjugation shape, so condition 2 rejects them.
  assert.equal(findSharedStemSplit(["いきたい", "いきたくない", "いきたかった"], lookup), null);
  assert.equal(findSharedStemSplit(["ことが", "ことを", "ことに"], lookup), null);
  assert.equal(findSharedStemSplit(["かしてくれた", "かしてあげた", "かした"], lookup), null);
  assert.equal(findSharedStemSplit(["はじまりそう", "はじまった", "はじまる"], lookup), null);
});

test("findSharedStemSplit: rejects an い-adjective whose internal し coincidentally lines up (美味しい/面白い)", () => {
  assert.equal(
    findSharedStemSplit(["おいしくなかった", "おいしくない", "おいしかった"], lookup),
    null,
  );
  assert.equal(
    findSharedStemSplit(["おもしろいそうだ", "おもしろい", "おもしろそう"], lookup),
    null,
  );
});

test("findSharedStemSplit: rejects a godan す-verb's own て-form (無くす, surface-identical to する's て-form)", () => {
  assert.equal(
    findSharedStemSplit(["なくしてしまった", "なくして", "なくしてしまいたい"], lookup),
    null,
  );
});

test("findSharedStemSplit: rejects when the prefix isn't in JMdict at all", () => {
  assert.equal(findSharedStemSplit(["ぎょうすることになった", "ぎょうすることにした"], lookup), null);
});

test("findSharedStemSplit: rejects a single-mora shared prefix even if it would otherwise pass", () => {
  const single = fakeLookup({ し: { pos: ["vs"], common: true } });
  assert.equal(findSharedStemSplit(["します", "した"], single), null);
});

test("findSharedStemSplit: never returns a prefix that fully consumes an option", () => {
  // そつぎょう itself as a bare option alongside longer ones must not be
  // folded to an empty remainder.
  const options = ["そつぎょう", "そつぎょうします"];
  assert.equal(findSharedStemSplit(options, lookup), null);
});

test("splitSharedClozeStem: rewrites stem/options/answer in place and reports the change", () => {
  const doc = {
    lessons: [
      {
        id: "m34-neo-7",
        beats: [
          { kind: "rule" },
          {
            kind: "particle-cloze",
            stem: "だいがくを ",
            tail: "。",
            answer: "そつぎょうすることになった",
            options: ["そつぎょうすることになった", "そつぎょうすることにした", "そつぎょうした"],
            en: "It's been decided that I'll graduate from university",
          },
        ],
      },
    ],
  };
  const changes = splitSharedClozeStem(doc, lookup);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].prefix, "そつぎょう");
  assert.equal(changes[0].lessonId, "m34-neo-7");

  const beat = doc.lessons[0].beats[1];
  assert.equal(beat.stem, "だいがくを そつぎょう");
  assert.equal(beat.answer, "することになった");
  assert.deepEqual(beat.options, ["することになった", "することにした", "した"]);
  // The answer must still be found among the options after the rewrite.
  assert.ok(beat.options.includes(beat.answer));
  // Full sentence text (stem + answer + tail) is byte-identical to before
  // the fold — audio/grading text must never move.
  assert.equal(`${beat.stem}${beat.answer}${beat.tail}`, "だいがくを そつぎょうすることになった。");
});

test("splitSharedClozeStem: leaves a real single-particle cloze untouched (no shared prefix at all)", () => {
  const doc = {
    lessons: [
      {
        id: "m10-neo-1",
        beats: [
          {
            kind: "particle-cloze",
            stem: "がっこう",
            tail: "いきます。",
            answer: "に",
            options: ["に", "で", "を"],
            en: "go to school",
          },
        ],
      },
    ],
  };
  const changes = splitSharedClozeStem(doc, lookup);
  assert.equal(changes.length, 0);
  assert.deepEqual(doc.lessons[0].beats[0].options, ["に", "で", "を"]);
});

test("splitSharedClozeStem: leaves the false-positive verb-stem cloze (探す) untouched", () => {
  const doc = {
    lessons: [
      {
        id: "m34-neo-5",
        beats: [
          {
            kind: "particle-cloze",
            stem: "かぎを ",
            tail: "。",
            answer: "さがそうと おもう",
            options: ["さがそうと おもう", "さがすつもりだ", "さがす"],
            en: "I think I'll look for the key",
          },
        ],
      },
    ],
  };
  const changes = splitSharedClozeStem(doc, lookup);
  assert.equal(changes.length, 0);
  assert.equal(doc.lessons[0].beats[0].stem, "かぎを ");
});

test("splitSharedClozeStem: skips non-particle-cloze beats and beats with duplicate options", () => {
  const doc = {
    lessons: [
      {
        id: "m1",
        beats: [
          { kind: "sentence", ja: "そつぎょうする。" },
          {
            kind: "particle-cloze",
            stem: "x ",
            tail: "。",
            answer: "そつぎょうした",
            options: ["そつぎょうした", "そつぎょうした"], // duplicate — not this pattern
          },
        ],
      },
    ],
  };
  const changes = splitSharedClozeStem(doc, lookup);
  assert.equal(changes.length, 0);
});
