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
  if (!result.ok) {
    console.error(`plant.mjs: FAIL — ${result.missed.length} planted row(s) not caught: ${result.missed.map((r) => r.judgeId).join(", ")}`);
    process.exit(1);
  }
  console.log("plant.mjs: PASS — all 6 planted rows caught.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("plant.mjs: fatal", err);
    process.exit(1);
  });
}
