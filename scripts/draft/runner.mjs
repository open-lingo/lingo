/**
 * runner.mjs — detached, resumable, thermally-governed drafting queue.
 *
 *   node scripts/draft/runner.mjs jobs.json --duty 0.8
 *   nohup node scripts/draft/runner.mjs jobs.json > run.log 2>&1 &
 *
 * A job file is `{ "out": "<dir>", "jobs": [ {id, lang, module, model, rounds, per}, ... ] }`.
 * Each job writes `<out>/<id>.json` on success and `<out>/<id>.error.json` on
 * failure. On restart, jobs whose success file already exists are SKIPPED — so
 * a run killed by a closed lid resumes where it stopped instead of re-burning
 * the GPU on work already done.
 *
 * Every job goes through the governor (see throttle.mjs), so the queue holds
 * the duty cycle across the whole run, not just within one job.
 */
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { makeGovernor, thermalState } from "./throttle.mjs";

const flag = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const jobsPath = process.argv[2];
if (!jobsPath) {
  console.error("usage: runner.mjs <jobs.json> [--duty 0.8] [--force]");
  process.exit(2);
}
const duty = Number(flag("duty", "1.0"));
const force = process.argv.includes("--force");

const spec = JSON.parse(await readFile(jobsPath, "utf8"));
const outDir = spec.out ?? "drafts";
await mkdir(outDir, { recursive: true });

const exists = async (p) => access(p).then(() => true).catch(() => false);
const ts = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const log = (m) => console.log(`[${ts()}] ${m}`);

const gov = makeGovernor({ duty, label: "runner" });
const before = await thermalState();
log(`runner start: ${spec.jobs.length} jobs, duty=${duty}, out=${outDir}`);
log(`thermal before: throttled=${before.throttled}`);

let done = 0, skipped = 0, failed = 0;

for (const job of spec.jobs) {
  const outPath = join(outDir, `${job.id}.json`);
  if (!force && (await exists(outPath))) {
    skipped += 1;
    log(`skip  ${job.id} (already drafted)`);
    continue;
  }
  try {
    const result = await gov.run(() => runJob(job, gov));
    await writeFile(outPath, JSON.stringify(result, null, 2));
    done += 1;
    log(`ok    ${job.id} (${result.items?.length ?? 0} items)`);
  } catch (e) {
    failed += 1;
    await writeFile(
      join(outDir, `${job.id}.error.json`),
      JSON.stringify({ id: job.id, error: String(e?.message ?? e) }, null, 2),
    );
    log(`FAIL  ${job.id}: ${e?.message ?? e}`);
  }
}

const after = await thermalState();
const r = gov.report();
log(`runner done: ${done} drafted, ${skipped} skipped, ${failed} failed`);
log(`wall ${(r.wallMs / 1000 / 60).toFixed(1)}min · busy ${(r.busyMs / 1000 / 60).toFixed(1)}min · achieved duty ${r.actualDuty} (target ${r.targetDuty})`);
log(`thermal after: throttled=${after.throttled} ${after.warnings.join("; ")}`);
if (after.throttled) {
  log(`NOTE: the OS throttled during this run. Lower --duty and re-run; the`);
  log(`      completed jobs are on disk and will be skipped.`);
}

/**
 * One job = one call to the local model. The grammar comes from the frame, so
 * the model only ever returns slot CHOICES — never target-language text.
 * See README for why that split is the whole trick.
 */
async function runJob(job, gov) {
  const t0 = Date.now();
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: job.model,
      prompt: job.prompt,
      stream: false,
      // Reasoning models route schema-constrained output into `thinking` and
      // return an EMPTY `response` unless this is set at the API level.
      // `/no_think` in the prompt is not sufficient — it looks like a broken
      // endpoint rather than a truncation, which costs a debugging round.
      think: false,
      format: job.schema ?? undefined,
      // num_ctx MUST be explicit — Ollama defaults to 4096 regardless of what
      // the model advertises, and silently truncates a longer prompt.
      options: gov.options({
        num_ctx: job.numCtx ?? 16384,
        num_predict: job.numPredict ?? 1536,
        temperature: job.temperature ?? 0.9,
      }),
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  let items = null;
  try {
    items = JSON.parse(j.response);
  } catch {
    /* leave raw; the verify tier will reject it */
  }
  return {
    id: job.id,
    lang: job.lang,
    module: job.module,
    model: job.model,
    ms: Date.now() - t0,
    promptTokens: j.prompt_eval_count ?? null,
    genTokens: j.eval_count ?? null,
    items: Array.isArray(items) ? items : items ? [items] : [],
    raw: items ? undefined : j.response,
  };
}
