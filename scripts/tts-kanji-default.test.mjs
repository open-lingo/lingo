import test from "node:test";
import assert from "node:assert/strict";
import { resolveKanjiDefaults, withSpeech, MANUAL_KANJI_OVERRIDES } from "./tts-kanji-default.mjs";

// Minimal synthetic courseAtoms.ts stand-in — same single-line object-literal
// shape the real file uses, exercising: an unambiguous kanji atom, a
// particle sharing kana with a real word (particle must be excluded), a
// homophone pair where the "primary" (no-hyphen) id should win even though
// it appears FIRST in source order, and a homophone pair where the
// no-hyphen id appears LAST — proving the pick is id-shape-based, not
// last-wins (which would reverse Spencer's shipped はし → 箸 call) and not
// first-wins either.
const FIXTURE = `
export const JA_COURSE_ATOMS: readonly CourseAtom[] = [
  { id: "hana", kana: "はな", kanji: "花", romaji: "hana", meaningEn: "flower", kind: "vocab" },
  { id: "p-wa", kana: "は", romaji: "wa", meaningEn: "topic marker", kind: "particle" },
  { id: "ha", kana: "は", kanji: "歯", romaji: "ha", meaningEn: "tooth", kind: "vocab" },
  { id: "hashi", kana: "はし", kanji: "箸", romaji: "hashi", meaningEn: "chopsticks", kind: "vocab" },
  { id: "hashi-bridge", kana: "はし", kanji: "橋", romaji: "hashi", meaningEn: "bridge", kind: "vocab" },
  { id: "kaze-wind", kana: "かぜ", kanji: "風", romaji: "kaze", meaningEn: "wind", kind: "vocab" },
  { id: "kaze", kana: "かぜ", kanji: "風邪", romaji: "kaze", meaningEn: "a cold", kind: "vocab" },
  { id: "kawa", kana: "かわ", kanji: "川 / 河", romaji: "kawa", meaningEn: "river", kind: "vocab" },
  { id: "hazu", kana: "はず", romaji: "hazu", meaningEn: "should be", kind: "vocab" },
];
`;

test("unambiguous atom resolves to its kanji", () => {
  const { map } = resolveKanjiDefaults(FIXTURE);
  assert.equal(map.get("はな"), "花");
});

test("particle is excluded even though it shares kana with a real word", () => {
  const { map } = resolveKanjiDefaults(FIXTURE);
  // は has p-wa (particle, no kanji) and ha (歯) — only one non-particle
  // candidate, so it resolves unambiguously despite two atoms sharing は.
  assert.equal(map.get("は"), "歯");
});

test("homophone group: no-hyphen id wins even though it is NOT source-first (matches Spencer's はし → 箸 pick, not last-wins)", () => {
  const { map, report } = resolveKanjiDefaults(FIXTURE);
  assert.equal(map.get("はし"), "箸");
  const entry = report.find((r) => r.kana === "はし");
  assert.ok(entry, "はし should be reported as a resolved homophone group");
  assert.match(entry.picked, /^hashi → 箸$/);
});

test("homophone group: no-hyphen id wins even though it appears SECOND in source order (not first-wins either)", () => {
  const { map, report } = resolveKanjiDefaults(FIXTURE);
  // かぜ: kaze-wind (風) is source-FIRST but has a hyphen; kaze (風邪) is
  // source-second but hyphen-free — hyphen-free must win regardless of
  // position, proving the tie-break is id-shape, not just "earliest".
  assert.equal(map.get("かぜ"), "風邪");
  const entry = report.find((r) => r.kana === "かぜ");
  assert.match(entry.picked, /^kaze → 風邪$/);
});

test("slash-alternated kanji takes the first option", () => {
  const { map } = resolveKanjiDefaults(FIXTURE);
  assert.equal(map.get("かわ"), "川");
});

test("atom with no kanji field resolves to nothing", () => {
  const { map } = resolveKanjiDefaults(FIXTURE);
  assert.equal(map.has("はず"), false);
});

test("manual override applies for words with no courseAtoms kanji field (はなたば)", () => {
  const { map } = resolveKanjiDefaults(FIXTURE);
  assert.equal(map.get("はなたば"), MANUAL_KANJI_OVERRIDES["はなたば"]);
});

test("withSpeech: row shape — front stays the kana hash key, speech carries kanji", () => {
  const { map } = resolveKanjiDefaults(FIXTURE);
  const card = withSpeech({ id: "hira-000-はな", front: "はな" }, map);
  assert.equal(card.front, "はな");
  assert.equal(card.speech, "花");
  assert.equal(card.id, "hira-000-はな");
});

test("withSpeech: no default resolved → card unchanged, no speech key added", () => {
  const { map } = resolveKanjiDefaults(FIXTURE);
  const card = withSpeech({ id: "hira-001-はず", front: "はず" }, map);
  assert.deepEqual(card, { id: "hira-001-はず", front: "はず" });
  assert.equal("speech" in card, false);
});

test("withSpeech: never mutates the input card", () => {
  const { map } = resolveKanjiDefaults(FIXTURE);
  const input = { id: "hira-000-はな", front: "はな" };
  withSpeech(input, map);
  assert.deepEqual(input, { id: "hira-000-はな", front: "はな" });
});
