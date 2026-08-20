#!/usr/bin/env node
/**
 * bench-models.mjs — A/B local models on the ACTUAL drafting task.
 *
 *   node scripts/draft/bench-models.mjs es-m19:m19 --through m18 \
 *     --models qwen3:4b,gemma4:31b,qwen3.8:27b --duty 0.8
 *
 * Benchmarking a model on a generic prompt tells you nothing about this
 * pipeline, because this pipeline does not ask a model to write Spanish. The
 * frame writes both languages; the model only chooses which taught words
 * combine. So the measurements are the ones that task actually has:
 *
 *   rejected   — picks the frame refused. This is the model failing to respect
 *                a stated constraint, and it is the number that matters most:
 *                every rejection is judgment the pipeline had to supply itself.
 *   cells      — distinct (verb, person) pairs covered. Coverage is what makes
 *                the pool usable; a pool that clusters is a pool the compiler
 *                falls back past.
 *   pairs      — distinct (object, time) combinations. The model's ONLY real
 *                contribution is deciding which complement and which marker
 *                sound natural together, so variety here is the whole value.
 *   seconds    — wall clock at the same duty cycle, so the comparison is fair
 *                to the thermal cap rather than to peak throughput.
 *
 * Costs nothing but time and heat: every model is local.
 */
import { execFile } from "node:child_process";
import { readFile, rename, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const flag = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const target = process.argv[2] ?? "es-m19:m19";
const models = flag("models", "qwen3:4b").split(",");
const duty = flag("duty", "1.0");
const through = flag("through", "m18");
const frameId = `es-${target.split(":")[1]}`;
const poolPath = join(here, "drafts", `${frameId}.json`);
const saved = `${poolPath}.bench-backup`;

await rename(poolPath, saved).catch(() => {});
const rows = [];
try {
  for (const model of models) {
    process.stderr.write(`\n── ${model} ──\n`);
    const t0 = Date.now();
    let ok = true;
    try {
      await run(
        "node",
        [
          join(here, "draft.mjs"), target,
          "--model", model, "--cover", "--duty", duty, "--through", through, "--force",
        ],
        { cwd: join(here, "..", ".."), maxBuffer: 1 << 24 },
      );
    } catch (e) {
      ok = false;
      process.stderr.write(`  FAILED: ${String(e.message).slice(0, 200)}\n`);
    }
    const wall = Math.round((Date.now() - t0) / 1000);
    if (!ok) {
      rows.push({ model, wall, error: true });
      continue;
    }
    const doc = JSON.parse(await readFile(poolPath, "utf8"));
    const cells = new Set(doc.picks.map((p) => `${p.verb}.${p.person}`));
    const pairs = new Set(doc.picks.map((p) => `${p.object ?? "-"}|${p.time ?? "-"}`));
    const tenses = {};
    for (const p of doc.picks) tenses[p.tense ?? "-"] = (tenses[p.tense ?? "-"] ?? 0) + 1;
    rows.push({
      model,
      wall,
      accepted: doc.accepted ?? doc.picks.length,
      rejected: doc.rejected ?? 0,
      cells: cells.size,
      pairs: pairs.size,
      tenses,
    });
    await unlink(poolPath).catch(() => {});
  }
} finally {
  await rename(saved, poolPath).catch(() => {});
}

const pad = (s, n) => String(s).padEnd(n);
console.log(
  `\n${pad("model", 22)}${pad("sec", 6)}${pad("kept", 6)}${pad("rej", 5)}${pad("cells", 7)}${pad("pairs", 7)}tense mix`,
);
for (const r of rows) {
  if (r.error) {
    console.log(`${pad(r.model, 22)}${pad(r.wall, 6)}FAILED`);
    continue;
  }
  const mix = Object.entries(r.tenses).map(([k, v]) => `${k[0]}:${v}`).join(" ");
  console.log(
    `${pad(r.model, 22)}${pad(r.wall, 6)}${pad(r.accepted, 6)}${pad(r.rejected, 5)}${pad(r.cells, 7)}${pad(r.pairs, 7)}${mix}`,
  );
}
