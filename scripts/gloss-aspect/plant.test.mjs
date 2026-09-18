import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANTED_ROWS, OK_ROWS, runPlantCheck, runOkCheck } from "./plant.mjs";
import { FORMS } from "./forms.mjs";

const FORM_IDS = new Set(FORMS.map((f) => f.id));

test("PLANTED_ROWS has exactly 8 rows, each with a valid house-gloss-table form", () => {
  // 6 original + 2 added by GLOSSFIX (2026-09-18) after softening
  // te-shimau/te-iru's judgeNote, to prove the softening didn't blunt the
  // real defect class for either form.
  assert.equal(PLANTED_ROWS.length, 8);
  for (const r of PLANTED_ROWS) {
    assert.ok(FORM_IDS.has(r.form), `${r.judgeId} has unknown form "${r.form}"`);
    assert.ok(r.ja && r.en, `${r.judgeId} missing ja/en`);
  }
});

test("OK_ROWS has exactly 2 rows (the false-positive class from lane GLOSS's audit), each with a valid form", () => {
  assert.equal(OK_ROWS.length, 2);
  for (const r of OK_ROWS) {
    assert.ok(FORM_IDS.has(r.form), `${r.judgeId} has unknown form "${r.form}"`);
    assert.ok(r.ja && r.en, `${r.judgeId} missing ja/en`);
  }
  assert.ok(OK_ROWS.some((r) => r.form === "te-shimau"), "should cover the te-shimau false-positive");
  assert.ok(OK_ROWS.some((r) => r.form === "te-iru"), "should cover the te-iru false-positive");
});

test("row 1 is the real TestFlight #200/#201 b30 coffee gloss (read, not authored)", () => {
  const row = PLANTED_ROWS[0];
  assert.equal(row.ja, "あつい コーヒーを のもうとした。");
  assert.equal(row.en, "I tried to have the hot coffee");
  assert.equal(row.form, "you-to-suru");
});

test("row 2 is the mirror-image てみた/ようとする confusion Spencer reported", () => {
  const row = PLANTED_ROWS[1];
  assert.equal(row.form, "te-miru");
  assert.match(row.en, /was going to/i, "should use the ようとする avoid-wording on a てみた sentence");
});

test("row_ids are unique", () => {
  const ids = PLANTED_ROWS.map((r) => r.judgeId);
  assert.equal(new Set(ids).size, ids.length);
});

// ---------------------------------------------------------------------------
// runPlantCheck() against a mocked Ollama — proves the pass/fail LOGIC is
// correct without depending on a live local model (CI-safe; the real
// judge-vs-Ollama run is a manual `node scripts/gloss-aspect/plant.mjs`).
// ---------------------------------------------------------------------------

function mockFetchReturning(verdictFor) {
  return async (url, opts) => {
    const body = JSON.parse(opts.body);
    const userMsg = body.messages.find((m) => m.role === "user").content;
    const rowIds = JSON.parse(userMsg.slice(userMsg.indexOf("["))).map((r) => r.row_id);
    const verdicts = rowIds.map((row_id) => {
      const v = verdictFor(row_id);
      return {
        row_id,
        rationale: "mock",
        verdict: v,
        proposed_en: v === "mismatch" ? "mock replacement" : "",
      };
    });
    return {
      ok: true,
      json: async () => ({
        message: { content: JSON.stringify({ verdicts }) },
        eval_count: 1,
        eval_duration: 1,
        prompt_eval_count: 1,
        prompt_eval_duration: 1,
      }),
    };
  };
}

test("runPlantCheck() PASSES when the (mocked) judge catches all 8 planted rows", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReturning(() => "mismatch");
  try {
    const result = await runPlantCheck();
    assert.equal(result.ok, true);
    assert.equal(result.caught, 8);
    assert.equal(result.missed.length, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("runPlantCheck() FAILS and names the missed row(s) when the (mocked) judge misses one", async () => {
  const realFetch = globalThis.fetch;
  const missedId = PLANTED_ROWS[2].judgeId;
  globalThis.fetch = mockFetchReturning((rowId) => (rowId === missedId ? "ok" : "mismatch"));
  try {
    const result = await runPlantCheck();
    assert.equal(result.ok, false);
    assert.equal(result.caught, 7);
    assert.equal(result.missed.length, 1);
    assert.equal(result.missed[0].judgeId, missedId);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("runPlantCheck() FAILS when nothing is caught", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReturning(() => "ok");
  try {
    const result = await runPlantCheck();
    assert.equal(result.ok, false);
    assert.equal(result.caught, 0);
    assert.equal(result.missed.length, 8);
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ---------------------------------------------------------------------------
// runOkCheck() against the same mocked Ollama — the companion check that a
// row must NOT be flagged (proves the te-shimau/te-iru softening actually
// stops the over-fire, not just that it kept catching the planted bad rows).
// ---------------------------------------------------------------------------

test("runOkCheck() PASSES when the (mocked) judge leaves both OK rows alone", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReturning(() => "ok");
  try {
    const result = await runOkCheck();
    assert.equal(result.ok, true);
    assert.equal(result.correct, 2);
    assert.equal(result.falseFired.length, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("runOkCheck() FAILS and names the false-fired row(s) when the (mocked) judge flags one", async () => {
  const realFetch = globalThis.fetch;
  const falseFiredId = OK_ROWS[0].judgeId;
  globalThis.fetch = mockFetchReturning((rowId) => (rowId === falseFiredId ? "mismatch" : "ok"));
  try {
    const result = await runOkCheck();
    assert.equal(result.ok, false);
    assert.equal(result.correct, 1);
    assert.equal(result.falseFired.length, 1);
    assert.equal(result.falseFired[0].judgeId, falseFiredId);
  } finally {
    globalThis.fetch = realFetch;
  }
});
