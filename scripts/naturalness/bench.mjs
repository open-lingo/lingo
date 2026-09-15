#!/usr/bin/env node
// Ad-hoc throughput/quality bench for the naturalness judge, per lead's
// retune request. Not part of the pipeline; scratchpad diagnostic only.
import fs from "node:fs";
import path from "node:path";
import {
  buildSchema,
  buildUserMessage,
  ollamaChat,
} from "./judge.mjs";

const OUT_DIR =
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/naturalness";

const rows = fs
  .readFileSync(path.join(OUT_DIR, "rows-words.jsonl"), "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

const existingVerdicts = fs
  .readFileSync(path.join(OUT_DIR, "verdicts-words.jsonl"), "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

function fmtStats(label, raw, wallS) {
  const genTokS = (raw.eval_count || 0) / ((raw.eval_duration || 1) / 1e9);
  const promptTokS =
    (raw.prompt_eval_count || 0) / ((raw.prompt_eval_duration || 1) / 1e9);
  console.log(
    `[${label}] wall=${wallS.toFixed(1)}s total_duration=${(raw.total_duration / 1e9).toFixed(1)}s ` +
      `load=${(raw.load_duration / 1e9).toFixed(2)}s prompt_eval=${raw.prompt_eval_count}tok/${(raw.prompt_eval_duration / 1e9).toFixed(2)}s(${promptTokS.toFixed(0)}tok/s) ` +
      `eval=${raw.eval_count}tok/${(raw.eval_duration / 1e9).toFixed(2)}s(${genTokS.toFixed(1)}tok/s)`,
  );
  return { genTokS, promptTokS, wallS, evalCount: raw.eval_count, promptEvalCount: raw.prompt_eval_count };
}

async function timedCall(label, rowsBatch, opts) {
  const schema = buildSchema();
  const msg = buildUserMessage(rowsBatch);
  const t0 = Date.now();
  const raw = await ollamaChat(msg, schema, opts);
  const wallS = (Date.now() - t0) / 1000;
  const stats = fmtStats(label, raw, wallS);
  const parsed = JSON.parse(raw.message.content);
  return { stats, verdicts: parsed.verdicts };
}

async function main() {
  const mode = process.argv[2];

  if (mode === "think-compare") {
    // Batch A: rows 1-25 (already judged with default/thinking) re-run with think:false.
    const batch = rows.slice(0, 25);
    const { verdicts: newVerdicts } = await timedCall("think:false batch1-25", batch, {
      think: false,
    });
    const byId = new Map(existingVerdicts.map((v) => [v.row_id, v]));
    let agree = 0;
    let total = 0;
    for (const v of newVerdicts) {
      const old = byId.get(v.row_id);
      if (!old) continue;
      total++;
      if (old.verdict === v.verdict) agree++;
      else
        console.log(
          `  DISAGREE ${v.row_id}: thinking-on=${old.verdict}/${old.issue} thinking-off=${v.verdict}/${v.issue}`,
        );
    }
    console.log(
      `think-compare: ${agree}/${total} verdict agreement (${((agree / total) * 100).toFixed(1)}%)`,
    );
  } else if (mode === "batch-concurrency") {
    // rows 51-70 (20 fresh rows): compare batch=10/concurrency=1 (sequential) vs concurrency=2 (parallel)
    const pool = rows.slice(50, 70); // 20 rows, not yet judged
    const b1 = pool.slice(0, 10);
    const b2 = pool.slice(10, 20);

    console.log("--- sequential: batch10 x2, one after another ---");
    const seqStart = Date.now();
    const r1 = await timedCall("seq-batch1(10)", b1, { think: false });
    const r2 = await timedCall("seq-batch2(10)", b2, { think: false });
    const seqWall = (Date.now() - seqStart) / 1000;
    const seqTokTotal = r1.stats.evalCount + r2.stats.evalCount;
    console.log(
      `sequential total: wall=${seqWall.toFixed(1)}s tokens=${seqTokTotal} aggregate=${(seqTokTotal / seqWall).toFixed(1)}tok/s`,
    );

    console.log("--- parallel: batch10 x2 concurrent ---");
    const parStart = Date.now();
    const [p1, p2] = await Promise.all([
      timedCall("par-batch1(10)", b1, { think: false }),
      timedCall("par-batch2(10)", b2, { think: false }),
    ]);
    const parWall = (Date.now() - parStart) / 1000;
    const parTokTotal = p1.stats.evalCount + p2.stats.evalCount;
    console.log(
      `parallel total: wall=${parWall.toFixed(1)}s tokens=${parTokTotal} aggregate=${(parTokTotal / parWall).toFixed(1)}tok/s`,
    );
  } else {
    console.error("usage: node bench.mjs <think-compare|batch-concurrency>");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("bench.mjs fatal", e);
  process.exit(1);
});
