/**
 * bench-thermal.mjs — measure what the governor actually does.
 *   node scripts/draft/bench-thermal.mjs --model qwen3:4b --duty 0.8 --minutes 2
 * Prints tok/s, achieved duty cycle, and the OS thermal record before/after.
 */
import { makeGovernor, thermalState } from "./throttle.mjs";

const flag = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const model = flag("model", "qwen3:4b");
const duty = Number(flag("duty", "1.0"));
const minutes = Number(flag("minutes", "2"));

const PROMPT =
  "List twelve distinct everyday objects found in a kitchen, one per line, " +
  "no numbering, no commentary. /no_think";

const gov = makeGovernor({ duty, label: `${model}@${duty}` });
const before = await thermalState();
const deadline = Date.now() + minutes * 60_000;
let tokens = 0;
let genMs = 0;

console.log(`bench: model=${model} duty=${duty} for ${minutes}min`);
console.log(`thermal before: throttled=${before.throttled}`);

while (Date.now() < deadline) {
  await gov.run(async () => {
    const t0 = Date.now();
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: PROMPT,
        stream: false,
        options: gov.options({ num_ctx: 4096, num_predict: 256, temperature: 0.8 }),
      }),
    });
    if (!res.ok) throw new Error(`ollama ${res.status}: ${await res.text()}`);
    const j = await res.json();
    tokens += j.eval_count ?? 0;
    genMs += Date.now() - t0;
    process.stdout.write(".");
  });
}

const after = await thermalState();
const r = gov.report();
console.log(`\n--- ${model} @ duty ${duty} ---`);
console.log(`calls          ${r.calls}`);
console.log(`wall           ${(r.wallMs / 1000).toFixed(1)}s`);
console.log(`busy           ${(r.busyMs / 1000).toFixed(1)}s`);
console.log(`slept          ${(r.sleptMs / 1000).toFixed(1)}s`);
console.log(`target duty    ${r.targetDuty}`);
console.log(`ACHIEVED duty  ${r.actualDuty}`);
console.log(`gen tokens     ${tokens}`);
console.log(`tok/s (busy)   ${(tokens / (genMs / 1000)).toFixed(1)}`);
console.log(`tok/s (wall)   ${(tokens / (r.wallMs / 1000)).toFixed(1)}`);
console.log(`thermal after  throttled=${after.throttled} ${after.warnings.join("; ")}`);
