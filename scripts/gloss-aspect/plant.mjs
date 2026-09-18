#!/usr/bin/env node
/**
 * Gloss-aspect fidelity sweep — verifier-can-fail check (project doctrine:
 * "prove the verifier can fail" — a check that never fails on a known-bad
 * input is not proven to work).
 *
 * 6 known-bad rows, hand-picked to be unambiguous mismatches under
 * forms.mjs's house-gloss table. Row 1 is the REAL TestFlight #200/#201
 * defect (m34.ir.yaml line 497, read here — never edited): ようとした
 * glossed "I tried to have the hot coffee" instead of the house "was going
 * to have the hot coffee". Row 2 is a synthetic てみた glossed with the
 * ようとする avoid wording, the exact confusion Spencer reported (read
 * "tried to X" for what should read "did X to find out").
 *
 * Runs each row through the same judge.mjs judgeBatch() the real sweep
 * uses (same model, same schema, same prompt) and asserts all 6 come back
 * verdict="mismatch". Exits 1 (and prints which rows the judge missed) if
 * any come back "ok" — this is what proves the tool can catch the defect
 * class it exists for, not just agree with itself.
 *
 * Usage: node scripts/gloss-aspect/plant.mjs
 */
import { buildSchema, judgeBatch, MODEL } from "./judge.mjs";

export const PLANTED_ROWS = [
  {
    judgeId: "plant-1-b30-coffee",
    ja: "あつい コーヒーを のもうとした。",
    en: "I tried to have the hot coffee",
    form: "you-to-suru",
    note:
      "REAL row — src/features/languages/ja/curriculum/ir/m34.ir.yaml:497 (TestFlight #200/#201). Read only, never edited by this lane.",
  },
  {
    judgeId: "plant-2-temita-as-youtosuru",
    ja: "この りょうりを たべてみた。",
    en: "I was going to eat this dish.",
    form: "te-miru",
    note:
      "Synthetic — the mirror-image confusion Spencer reported: てみた (did it, found out) glossed with ようとする's house wording (was going to). The event happened; this gloss says it didn't.",
  },
  {
    judgeId: "plant-3-tsumori-as-future",
    ja: "らいねん にほんに いく つもりだ。",
    en: "I am going to go to Japan next year.",
    form: "tsumori",
    note: "Synthetic — collides intention-only with plain future.",
  },
  {
    judgeId: "plant-4-kotonisuru-wrong-decider",
    ja: "まいにち はしることにした。",
    en: "It was decided that I would run every day.",
    form: "koto-ni-suru",
    note: "Synthetic — ことにした is MY decision; this gloss erases the decider.",
  },
  {
    judgeId: "plant-5-kotoninaru-wrong-decider",
    ja: "らいげつ てんきんすることになった。",
    en: "I decided to transfer next month.",
    form: "koto-ni-naru",
    note: "Synthetic — ことになった deliberately omits the decider; this gloss invents one.",
  },
  {
    judgeId: "plant-6-tagaru-no-observed-frame",
    ja: "こどもは あそびに いきたがっている。",
    en: "The kid wants to go play.",
    form: "tagaru",
    note: "Synthetic — たがる is the observed-from-outside form; this gloss reads as the 1st-person たい.",
  },
  {
    // GLOSSFIX (2026-09-18): planted after softening te-shimau's
    // judgeNote, to prove the softening didn't blunt the real defect
    // class — a voluntary-by-meaning verb whose bare past drops the
    // completion/regret nuance entirely.
    judgeId: "plant-7-teshimau-voluntary-bare-past",
    ja: "ケーキを ぜんぶ たべてしまった。",
    en: "I ate the whole cake.",
    form: "te-shimau",
    note:
      "Synthetic — たべる is voluntary by meaning; the bare-past gloss reads as an ordinary neutral choice and drops the completion/regret nuance the real defect class targets (see forms.mjs te-shimau judgeNote).",
  },
  {
    // GLOSSFIX (2026-09-18): planted after softening te-iru's judgeNote,
    // same reason — a genuine progressive/resultative mismatch that
    // changes what the sentence claims is true right now.
    judgeId: "plant-8-teiru-progressive-resultative-mismatch",
    ja: "くつを はいている。",
    en: "I am putting on my shoes.",
    form: "te-iru",
    note:
      "Synthetic — はいている here is the resultative (shoes already on, wearing them); 'am putting on' is the progressive (mid-action), so this gloss claims the wrong thing is true right now (see forms.mjs te-iru judgeNote).",
  },
];

// ---------------------------------------------------------------------------
// OK rows — the companion check to PLANTED_ROWS: real course sentences that
// must NOT be flagged, both drawn directly from lane GLOSS's 30-row hand
// audit (2 of 24 "mismatch" verdicts disagreed with by a human reader,
// $S/briefs/GLOSS-report.md "Precision" section) as the false-positive
// class that motivated softening te-shimau/te-iru's judgeNote in forms.mjs.
// Proves the softening actually stops the over-fire, not just that it
// still catches PLANTED_ROWS.
// ---------------------------------------------------------------------------

export const OK_ROWS = [
  {
    // Real row — src/features/languages/ja/curriculum/ir/m38.ir.yaml:107.
    // Read only, never edited by this lane. ねる (fall asleep) is
    // involuntary by its own English meaning, so the bare past "fell
    // asleep" does not misread as a deliberate choice.
    judgeId: "ok-1-neteshimau-involuntary",
    ja: "でんしゃの なかで ねてしまった。",
    en: "I fell asleep on the train.",
    form: "te-shimau",
    note: "REAL row — m38.ir.yaml:107. Involuntary-by-meaning verb; must verdict ok after softening.",
  },
  {
    // Real row — src/features/languages/ja/curriculum/ir/m42.ir.yaml:301
    // (also m42:477/553/625, one of the target modules for this lane's
    // fix pass). Read only, never edited by this lane. Reported-speech
    // いっていた rendered as plain "said" doesn't change the sentence's
    // truth value.
    judgeId: "ok-2-itteita-reported-speech",
    ja: "きしゃは じこが あったと いっていた。",
    en: "The reporter said there was an accident.",
    form: "te-iru",
    note: "REAL row — m42.ir.yaml:301. Reporting verb in reported speech; must verdict ok after softening.",
  },
];

export async function runPlantCheck() {
  const schema = buildSchema();
  const stats = { calls: 0, wallMs: 0, evalCount: 0, evalDurationNs: 0, promptEvalCount: 0, promptEvalDurationNs: 0, failedBatches: 0 };
  const result = await judgeBatch(PLANTED_ROWS, schema, stats);
  if (!result.ok) {
    return { ok: false, caught: 0, total: PLANTED_ROWS.length, missed: PLANTED_ROWS, error: result.error };
  }
  const byId = new Map(result.verdicts.map((v) => [v.row_id, v]));
  const missed = PLANTED_ROWS.filter((r) => byId.get(r.judgeId)?.verdict !== "mismatch");
  return {
    ok: missed.length === 0,
    caught: PLANTED_ROWS.length - missed.length,
    total: PLANTED_ROWS.length,
    missed,
    verdicts: result.verdicts,
  };
}

/** Companion to runPlantCheck(): asserts OK_ROWS all come back verdict="ok".
 * Exits (via main()'s caller) nonzero — and names which row(s) false-fired —
 * if the judge flags a row that must not be flagged. This is what proves a
 * judgeNote softening actually stopped the over-fire, not just that it kept
 * catching the planted bad rows. */
export async function runOkCheck() {
  const schema = buildSchema();
  const stats = { calls: 0, wallMs: 0, evalCount: 0, evalDurationNs: 0, promptEvalCount: 0, promptEvalDurationNs: 0, failedBatches: 0 };
  const result = await judgeBatch(OK_ROWS, schema, stats);
  if (!result.ok) {
    return { ok: false, correct: 0, total: OK_ROWS.length, falseFired: OK_ROWS, error: result.error };
  }
  const byId = new Map(result.verdicts.map((v) => [v.row_id, v]));
  const falseFired = OK_ROWS.filter((r) => byId.get(r.judgeId)?.verdict !== "ok");
  return {
    ok: falseFired.length === 0,
    correct: OK_ROWS.length - falseFired.length,
    total: OK_ROWS.length,
    falseFired,
    verdicts: result.verdicts,
  };
}

async function main() {
  console.log(`plant.mjs: judging ${PLANTED_ROWS.length} planted known-bad rows with model ${MODEL}...`);
  const result = await runPlantCheck();
  if (!result.ok && result.error) {
    console.error(`plant.mjs: batch call failed validation: ${result.error}`);
    process.exit(1);
  }
  console.log(`plant.mjs: caught ${result.caught}/${result.total}`);
  for (const v of result.verdicts ?? []) {
    const row = PLANTED_ROWS.find((r) => r.judgeId === v.row_id);
    const mark = v.verdict === "mismatch" ? "CAUGHT" : "MISSED";
    console.log(`  [${mark}] ${v.row_id}: ${row?.ja} -> "${row?.en}" | judge: ${v.verdict} — ${v.rationale}`);
  }

  console.log(`\nplant.mjs: judging ${OK_ROWS.length} OK rows (must NOT be flagged) with model ${MODEL}...`);
  const okResult = await runOkCheck();
  if (!okResult.ok && okResult.error) {
    console.error(`plant.mjs: OK-row batch call failed validation: ${okResult.error}`);
    process.exit(1);
  }
  console.log(`plant.mjs: correctly left alone ${okResult.correct}/${okResult.total}`);
  for (const v of okResult.verdicts ?? []) {
    const row = OK_ROWS.find((r) => r.judgeId === v.row_id);
    const mark = v.verdict === "ok" ? "CORRECT" : "FALSE-FIRE";
    console.log(`  [${mark}] ${v.row_id}: ${row?.ja} -> "${row?.en}" | judge: ${v.verdict} — ${v.rationale}`);
  }

  if (!result.ok) {
    console.error(`plant.mjs: FAIL — ${result.missed.length} planted row(s) not caught: ${result.missed.map((r) => r.judgeId).join(", ")}`);
  }
  if (!okResult.ok) {
    console.error(`plant.mjs: FAIL — ${okResult.falseFired.length} OK row(s) false-fired: ${okResult.falseFired.map((r) => r.judgeId).join(", ")}`);
  }
  if (!result.ok || !okResult.ok) {
    process.exit(1);
  }
  console.log(`plant.mjs: PASS — all ${result.total} planted rows caught, all ${okResult.total} OK rows correctly left alone.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("plant.mjs: fatal", err);
    process.exit(1);
  });
}
