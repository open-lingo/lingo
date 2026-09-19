import test from "node:test";
import assert from "node:assert/strict";
import { runAllChecks } from "./checkRules.mjs";

const atoms = [{ surface: "eu" }, { surface: "sou" }];

function find(results, name) { return results.find((r) => r.name === name); }

test("checkRules: a word_map's opening sentence does not satisfy intro-capable-first-appearance " +
  "(map is transparent; clozeLit is NOT itself intro-capable per the checklist — the next " +
  "intro-capable step is what must carry the word's real debut)", () => {
  const lesson = {
    steps: [
      { id: "map", kind: "map", tokens: ["Eu", "sou"], pairs: [] }, // prints "eu"/"sou" first — should not count
      { id: "clz", kind: "clozeLit", pt: "Sou eu.", en: "x", blank: "sou", options: ["sou"], atoms: ["eu", "sou"] }, // not intro-capable either
      { id: "spk", kind: "speakLit", pt: "Eu sou.", en: "x", atoms: ["eu", "sou"] }, // eu/sou already printed by the map+cloze above, so this is a no-op for the check
    ],
  };
  const r = runAllChecks(lesson, atoms);
  // "eu"/"sou" first print NON-map on the clozeLit (not intro-capable) -> FAIL.
  assert.equal(find(r, "intro-capable-first-appearance").ok, false);
});

test("checkRules: intro-capable-first-appearance PASSES when the first non-map print is an intro-capable kind", () => {
  const lesson = {
    steps: [
      { id: "map", kind: "map", tokens: ["Eu", "sou"], pairs: [] },
      { id: "spk", kind: "speakLit", pt: "Eu sou.", en: "x", atoms: ["eu", "sou"] },
    ],
  };
  const r = runAllChecks(lesson, atoms);
  assert.equal(find(r, "intro-capable-first-appearance").ok, true);
});

test("checkRules: flags a word whose first NON-map appearance is a non-intro-capable step", () => {
  const lesson = {
    steps: [
      { id: "map", kind: "map", tokens: ["Eu"], pairs: [] },
      { id: "match", kind: "matchLit", pairs: [{ source: "eu", target: "I" }] }, // not intro-capable
      { id: "info", kind: "info", title: "t", body: "b" },
    ],
  };
  const r = runAllChecks(lesson, [{ surface: "eu" }]);
  assert.equal(find(r, "intro-capable-first-appearance").ok, false);
});

test("checkRules: adjacency and selection-run detect real violations", () => {
  const lesson = { steps: [{ id: "a", kind: "clozeLit" }, { id: "b", kind: "clozeLit" }] };
  const r = runAllChecks(lesson, []);
  assert.equal(find(r, "adjacency").ok, false);
});

test("checkRules: match-floor fails under 6 pairs, passes at 6", () => {
  const few = { steps: [{ id: "m", kind: "matchLit", pairs: [{ source: "a", target: "b" }] }] };
  assert.equal(find(runAllChecks(few, []), "match-floor").ok, false);
  const six = { steps: [{ id: "m", kind: "matchLit", pairs: Array.from({ length: 6 }, (_, i) => ({ source: `s${i}`, target: `t${i}` })) }] };
  assert.equal(find(runAllChecks(six, []), "match-floor").ok, true);
});

test("checkRules: tile-floor is informational (ok === null), never a hard failure", () => {
  const lesson = { steps: [{ id: "b", kind: "buildLit", pt: "Oi." }] };
  const r = find(runAllChecks(lesson, []), "tile-floor");
  assert.equal(r.ok, null);
});

// ── round 3 (lane PTTOOL3, rule 1) ───────────────────────────────────────

test("checkRules: dialogue-mandatory FAILS a non-checkpoint lesson with no sim step (R2-L1/L2/L3 shipped none)", () => {
  const lesson = { steps: [{ id: "match", kind: "matchLit", pairs: [] }] };
  const r = find(runAllChecks(lesson, []), "dialogue-mandatory");
  assert.equal(r.ok, false);
});

test("checkRules: dialogue-mandatory PASSES a non-checkpoint lesson that has a sim step", () => {
  const lesson = { steps: [{ id: "sim", kind: "sim", turns: [] }] };
  const r = find(runAllChecks(lesson, []), "dialogue-mandatory");
  assert.equal(r.ok, true);
});

test("checkRules: dialogue-mandatory PASSES a checkpoint lesson with no sim step (checkpoint still needs one at schedule-time, not re-checked here)", () => {
  const lesson = { checkpoint: true, steps: [{ id: "match", kind: "matchLit", pairs: [] }] };
  const r = find(runAllChecks(lesson, []), "dialogue-mandatory");
  assert.equal(r.ok, true);
});

// ── round 3 (lane PTTOOL3, rule 2) ───────────────────────────────────────

const emptyLesson = { steps: [{ id: "sim", kind: "sim", turns: [] }] };

test("checkRules: imageable-nouns FAILS a noun atom with no emoji and no imageable: false (R2-L3)", () => {
  const r = find(runAllChecks(emptyLesson, [{ surface: "casa", partOfSpeech: "noun" }]), "imageable-nouns");
  assert.equal(r.ok, false);
});

test("checkRules: imageable-nouns FAILS imageable: false with no imageableReason", () => {
  const r = find(runAllChecks(emptyLesson, [{ surface: "amor", partOfSpeech: "noun", imageable: false }]), "imageable-nouns");
  assert.equal(r.ok, false);
});

test("checkRules: imageable-nouns PASSES a noun with emoji (no index supplied -> presence-only)", () => {
  const r = find(runAllChecks(emptyLesson, [{ surface: "casa", partOfSpeech: "noun", emoji: "🏠" }]), "imageable-nouns");
  assert.equal(r.ok, true);
});

test("checkRules: imageable-nouns PASSES imageable: false WITH a reason", () => {
  const r = find(runAllChecks(emptyLesson, [{ surface: "amor", partOfSpeech: "noun", imageable: false, imageableReason: "abstract" }]), "imageable-nouns");
  assert.equal(r.ok, true);
});

test("checkRules: imageable-nouns FAILS a noun's emoji when it is not in the supplied vendored index", () => {
  const r = find(runAllChecks(emptyLesson, [{ surface: "casa", partOfSpeech: "noun", emoji: "🏠" }], { emojiIndex: new Set(["🐱"]) }), "imageable-nouns");
  assert.equal(r.ok, false);
});

test("checkRules: imageable-nouns ignores non-noun atoms entirely", () => {
  const r = find(runAllChecks(emptyLesson, [{ surface: "sou", partOfSpeech: "verb" }]), "imageable-nouns");
  assert.equal(r.ok, true);
});

// ── round 3 (lane PTTOOL3, rule 3) ────────────────────────────────────────

test("checkRules: allow-closed-set FAILS a content word (R2-L2 allow-listed capital/paris/rio/grande)", () => {
  const r = find(runAllChecks(emptyLesson, [], { allow: ["capital", "e"] }), "allow-closed-set");
  assert.equal(r.ok, false);
});

test("checkRules: allow-closed-set PASSES a closed-set-only allow list", () => {
  const r = find(runAllChecks(emptyLesson, [], { allow: ["e", "mas"] }), "allow-closed-set");
  assert.equal(r.ok, true);
});

// ── round 3 (lane PTTOOL3, rule 8 — PTGRADE2 #1) ─────────────────────────

test("checkRules: listen-cloze-couplets is informational (ok === null) above the cap of 2, never a hard failure", () => {
  const pt = "Eu sou de aqui.";
  const lesson = {
    steps: Array.from({ length: 3 }, (_, i) => [
      { id: `lst-${i}`, kind: "listenCompLit", pt },
      { id: `clz-${i}`, kind: "clozeLit", pt },
    ]).flat(),
  };
  const r = find(runAllChecks(lesson, []), "listen-cloze-couplets");
  assert.equal(r.ok, null);
});

test("checkRules: listen-cloze-couplets PASSES at or under the cap of 2", () => {
  const pt = "Eu sou de aqui.";
  const lesson = { steps: [{ id: "lst", kind: "listenCompLit", pt }, { id: "clz", kind: "clozeLit", pt }] };
  const r = find(runAllChecks(lesson, []), "listen-cloze-couplets");
  assert.equal(r.ok, true);
});

// ── round 4 (lane PTTOOL4, item 3) ────────────────────────────────────────

test("checkRules: taught-vocab-residual exempts a mid-sentence capitalized token (proper noun) without allow-listing it", () => {
  const lesson = { steps: [{ id: "s1", kind: "speakLit", pt: "Eu estou em São Paulo.", atoms: ["eu", "estou", "em"] }] };
  const priorSurfaces = new Set(["eu", "estou", "em"]);
  const r = find(runAllChecks(lesson, [], { priorSurfaces, allow: [] }), "taught-vocab-residual");
  assert.equal(r.ok, true, r.detail);
});

test("checkRules: taught-vocab-residual still FAILS a genuine untaught lowercase word", () => {
  const lesson = { steps: [{ id: "s1", kind: "speakLit", pt: "Eu gosto de xadrez.", atoms: ["eu", "gosto", "de"] }] };
  const priorSurfaces = new Set(["eu", "gosto", "de"]);
  const r = find(runAllChecks(lesson, [], { priorSurfaces, allow: [] }), "taught-vocab-residual");
  assert.equal(r.ok, false);
  assert.match(r.detail, /xadrez/);
});

test("checkRules: taught-vocab-residual reads allowExtra as known too", () => {
  const lesson = { steps: [{ id: "s1", kind: "speakLit", pt: "Estou cansado hoje.", atoms: ["estou", "cansado"] }] };
  const priorSurfaces = new Set(["estou", "cansado"]);
  const r = find(runAllChecks(lesson, [], { priorSurfaces, allow: [], allowExtra: ["hoje"] }), "taught-vocab-residual");
  assert.equal(r.ok, true, r.detail);
});

test("checkRules: allow-closed-set exempts a capitalized entry (proper noun) even if not in PT_ALLOW_WORDS", () => {
  const r = find(runAllChecks({ steps: [] }, [], { allow: ["São", "Paulo"] }), "allow-closed-set");
  assert.equal(r.ok, true, r.detail);
});

test("checkRules: allow-closed-set still FAILS a lowercase word outside the closed set", () => {
  const r = find(runAllChecks({ steps: [] }, [], { allow: ["capital"] }), "allow-closed-set");
  assert.equal(r.ok, false);
});

test("checkRules: allow-extra-reason FAILS a non-empty allowExtra with no reason", () => {
  const r = find(runAllChecks({ steps: [] }, [], { allowExtra: ["hoje"] }), "allow-extra-reason");
  assert.equal(r.ok, false);
});

test("checkRules: allow-extra-reason is informational (not a hard fail) when a reason is given", () => {
  const r = find(runAllChecks({ steps: [] }, [], { allowExtra: ["hoje"], allowExtraReason: "reserved for pt-m3-3" }), "allow-extra-reason");
  assert.equal(r.ok, null);
});

// ── round 4 (lane PTTOOL4, item 4) ────────────────────────────────────────

test("checkRules: taught-vocab-residual treats a multi-word (chunk/phrase) atom as one phrase, not two loose words", () => {
  const lesson = { steps: [{ id: "s1", kind: "speakLit", pt: "Quero água, por favor.", atoms: ["quero", "água", "por favor"] }] };
  const priorSurfaces = new Set();
  const atoms = [{ surface: "quero" }, { surface: "água" }, { surface: "por favor" }];
  const r = find(runAllChecks(lesson, atoms, { priorSurfaces, allow: [] }), "taught-vocab-residual");
  assert.equal(r.ok, true, r.detail);
});

test("checkRules: taught-vocab-residual still catches an untaught word sitting right next to a known phrase", () => {
  const lesson = { steps: [{ id: "s1", kind: "speakLit", pt: "Quero xadrez, por favor.", atoms: ["quero", "por favor"] }] };
  const priorSurfaces = new Set();
  const atoms = [{ surface: "quero" }, { surface: "por favor" }];
  const r = find(runAllChecks(lesson, atoms, { priorSurfaces, allow: [] }), "taught-vocab-residual");
  assert.equal(r.ok, false);
  assert.match(r.detail, /xadrez/);
});

// 2026-09-19 (m2-l2 lane): plural -s over a known noun is licensed exactly when os/as are known.
test("checkRules: taught-vocab-residual accepts a regular plural of a known noun once os/as are taught, not before", () => {
  const lesson = { steps: [{ id: "bld-1", kind: "buildLit", pt: "Os amigos estão aqui." }] };
  const before = find(runAllChecks(lesson, [], { priorSurfaces: new Set(["amigo", "estão", "aqui", "o", "a"]), allow: [] }), "taught-vocab-residual");
  assert.equal(before.ok, false);
  const after = find(runAllChecks(lesson, [], { priorSurfaces: new Set(["amigo", "estão", "aqui", "o", "a", "os", "as"]), allow: [] }), "taught-vocab-residual");
  assert.equal(after.ok, true, after.detail);
});

// 2026-09-19 (m4-l4 lane): a known phrase is masked only at word boundaries.
test("checkRules: taught-vocab-residual masks a phrase atom only as whole words", () => {
  const lesson = { steps: [{ id: "bld-1", kind: "buildLit", pt: "Eu não quero café." }] };
  const r = find(runAllChecks(lesson, [], { priorSurfaces: new Set(["eu", "não", "quero", "café", "o que"]), allow: [] }), "taught-vocab-residual");
  assert.equal(r.ok, true, r.detail);
});
