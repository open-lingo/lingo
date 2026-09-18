import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { detectForms } from "./forms.mjs";

// ---------------------------------------------------------------------------
// Form detection on 10 fixture sentences — one per (or covering) a
// house-gloss-table form, plus one negative (no form present).
// ---------------------------------------------------------------------------

const FIXTURES = [
  { ja: "ドアを あけようとした。", expect: ["you-to-suru"] },
  { ja: "この りょうりを たべてみた。", expect: ["te-miru"] },
  { ja: "でんきを けしておいた。", expect: ["te-oku"] },
  { ja: "しゅくだいを わすれてしまった。", expect: ["te-shimau"] },
  { ja: "テレビを みている。", expect: ["te-iru"] },
  { ja: "らいねん にほんに いく つもりだ。", expect: ["tsumori"] },
  { ja: "きょう くるはずだ。", expect: ["hazu"] },
  { ja: "いま かえってきたばかりだ。", expect: ["bakari"] },
  { ja: "まいにち はしることにした。", expect: ["koto-ni-suru"] },
  { ja: "コーヒーを のむ。", expect: [] }, // negative: plain non-past, no form
];

test("detectForms finds the expected house-gloss-table form(s) per fixture sentence", () => {
  for (const { ja, expect } of FIXTURES) {
    const got = detectForms(ja);
    assert.deepEqual(
      got.sort(),
      [...expect].sort(),
      `detectForms(${JSON.stringify(ja)}) => ${JSON.stringify(got)}, expected ${JSON.stringify(expect)}`,
    );
  }
});

test("detectForms can find multiple forms in one sentence", () => {
  // ている + たがる: "the cat is wanting to go outside" (real course shape, m36)
  const got = detectForms("ねこは そとに でたがっている。");
  assert.ok(got.includes("te-iru"), "should detect te-iru");
  assert.ok(got.includes("tagaru"), "should detect tagaru");
});

test("detectForms returns [] for empty/non-string input", () => {
  assert.deepEqual(detectForms(""), []);
  assert.deepEqual(detectForms(null), []);
  assert.deepEqual(detectForms(undefined), []);
});

// ---------------------------------------------------------------------------
// extract.mjs integration: a small synthetic IR yaml file exercising every
// pair shape the extractor handles (flow-map ja/en, particle-cloze,
// listening-comp, multi-line flow map, dialogue line) plus known non-gloss
// shapes that must NOT be extracted (antiPattern, distractors, reply).
// ---------------------------------------------------------------------------

const FIXTURE_YAML = `module: m99
grammarPoints:
  - id: you-to-suru
    rule: "explanation text"
    examples:
      - { ja: "ドアを あけようとした。", en: "I tried to open the door." }
    antiPattern: { ja: "ドアを あけるとした。", why: "wrong — not a gloss pair, must not be extracted" }

lessons:
  - id: m99-neo-1
    beats:
      - { kind: sentence, ja: "この りょうりを たべてみた。", en: "I gave this dish a try." }
      - { kind: particle-cloze, stem: "りょうりを ", tail: "。", answer: "たべてみた", options: ["たべてみた", "たべた"], en: "I gave the dish a try" }
      - { kind: listening-comp, audio: "しゅくだいを はじめようとしたけど、だめだった。", answer: "I tried to start the homework, but it didn't work out", distractors: ["I started the homework and finished it"] }
      - kind: dialogue
        lines:
          - { speaker: "Ken", ja: "コーヒーを のもうとした。", en: "I tried to have a coffee." }
      - { kind: capstone, ja: "きょうは これを たべてみない。",
          en: "I won't try eating this today.",
          exercises: [te-miru] }
`;

test("extract.mjs pulls every gloss-pair shape and skips non-gloss shapes", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gloss-aspect-fixture-"));
  const file = path.join(dir, "m99.ir.yaml");
  fs.writeFileSync(file, FIXTURE_YAML);

  const { extractModule } = await import("./extract.mjs");
  const rows = extractModule("ja", file);
  fs.rmSync(dir, { recursive: true, force: true });

  // 5 real gloss pairs, each carrying >=1 detected form:
  //  1. rule-card example (ようとした)
  //  2. sentence beat (てみた)
  //  3. particle-cloze (stem+answer+tail -> ja, en field -> en) (てみた)
  //  4. listening-comp (audio -> ja, answer -> en) (ようとした)
  //  5. dialogue line (ようとした)
  //  6. capstone (てみない — not a form in the table, expect NOT extracted
  //     since detectForms() must return >=1 match; also proves the
  //     extractor doesn't just grab every ja/en pair blindly)
  assert.equal(rows.length, 5, `expected 5 gloss rows, got ${rows.length}: ${JSON.stringify(rows.map((r) => r.en))}`);

  const ens = rows.map((r) => r.en);
  assert.ok(ens.includes("I tried to open the door."), "rule-card example should be extracted");
  assert.ok(ens.includes("I gave this dish a try."), "sentence beat should be extracted");
  assert.ok(ens.includes("I gave the dish a try"), "particle-cloze should assemble ja from stem+answer+tail and take en from the en field, not the (Japanese) answer field");
  assert.ok(ens.includes("I tried to start the homework, but it didn't work out"), "listening-comp should take ja from audio and en from answer, not from distractors");
  assert.ok(ens.includes("I tried to have a coffee."), "dialogue line should be extracted");
  assert.ok(!ens.includes("I won't try eating this today."), "capstone with no house-gloss-table form present should be skipped");

  // antiPattern's `why` field must never be mistaken for an English gloss.
  assert.ok(!rows.some((r) => r.en.includes("wrong —")), "antiPattern is not a gloss pair and must not be extracted");

  // particle-cloze row's ja must be the assembled stem+answer+tail, not the
  // bare answer alone.
  const clozeRow = rows.find((r) => r.en === "I gave the dish a try");
  assert.equal(clozeRow.ja, "りょうりを たべてみた。");

  // lessonId tracking: rows before the second `lessons:` (card examples)
  // are tagged card:<id>; rows after are the real lesson id.
  const cardRow = rows.find((r) => r.en === "I tried to open the door.");
  assert.equal(cardRow.lessonId, "card:you-to-suru");
  const lessonRow = rows.find((r) => r.en === "I gave this dish a try.");
  assert.equal(lessonRow.lessonId, "m99-neo-1");

  // every emitted row must carry at least one detected form
  for (const r of rows) {
    assert.ok(Array.isArray(r.forms) && r.forms.length > 0, `row ${JSON.stringify(r.en)} has no forms`);
  }
});
