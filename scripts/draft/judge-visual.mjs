#!/usr/bin/env node
/**
 * Local visual-judge back-test (corrupted-oracle method, per the m30 run-b
 * accident that became the methodology): feed a vision model real capture
 * PNGs with either the TRUE step contract or a MUTATED one, and measure
 * whether it flags exactly the mutated cases. Recall on mutations is the
 * number that decides whether a local model can replace the haiku screening
 * tier; false positives on clean pairs are cheap (they route to verify) but
 * are counted too.
 *
 * Usage: node judge-backtest.mjs <model> <casefile.json>
 * casefile: [{png, contract, mutated: bool, note}]
 */
import { readFileSync } from "node:fs";

const model = process.argv[2];
const cases = JSON.parse(readFileSync(process.argv[3], "utf8"));

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    violations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          expectation: { type: "string" },
          whatIsWrong: { type: "string" },
        },
        required: ["expectation", "whatIsWrong"],
      },
    },
    pass: { type: "boolean" },
  },
  required: ["violations", "pass"],
};

async function judge(pngPath, contract) {
  const img = readFileSync(pngPath).toString("base64");
  const prompt = `You are a strict visual QA judge for a language-learning app.
Below is the CONTRACT for the lesson step shown in the attached screenshot.
Check every item. "mustShow" strings must be visible verbatim (Japanese text
must match character-for-character — a different kana/kanji word is a
violation). "mustNotShow" strings must be absent. Then check each free-text
expectation.

CONTRACT:
${JSON.stringify(contract, null, 2)}

Report ONLY real, visible violations. pass=true means zero violations.`;
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      format: VERDICT_SCHEMA,
      messages: [{ role: "user", content: prompt, images: [img] }],
      options: { num_ctx: 16384, num_predict: 2048, temperature: 0 },
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const text = body.message?.content ?? "";
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`unparseable verdict (MLX format trap?): ${text.slice(0, 200)}`);
  }
}

let tp = 0, fn = 0, fp = 0, tn = 0;
for (const c of cases) {
  const t0 = Date.now();
  let v;
  try {
    v = await judge(c.png, c.contract);
  } catch (e) {
    console.log(`ERROR ${c.png}: ${e.message}`);
    continue;
  }
  const flagged = !v.pass || (v.violations?.length ?? 0) > 0;
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  let cell;
  if (c.mutated && flagged) { tp++; cell = "TP"; }
  else if (c.mutated && !flagged) { fn++; cell = "FN  ← MISSED INJECTION"; }
  else if (!c.mutated && flagged) { fp++; cell = "FP"; }
  else { tn++; cell = "TN"; }
  console.log(`[${cell}] ${secs}s ${c.note ?? c.png}`);
  for (const viol of v.violations ?? []) {
    console.log(`      · ${viol.expectation}: ${viol.whatIsWrong}`);
  }
}
console.log(`\nrecall on mutations: ${tp}/${tp + fn}   false-positive rate on clean: ${fp}/${fp + tn}`);
