#!/usr/bin/env node
/**
 * Local visual judge (qwen3.5-122B tier) — two modes:
 *
 * BACK-TEST (corrupted-oracle, per the m30 run-b accident that became the
 * methodology): feed real capture PNGs with either the TRUE step contract
 * or a MUTATED one; recall on mutations is the number that decides whether
 * the local model can screen, FPs on clean pairs are cheap (they route to
 * the paid verify tier) but counted. Measured 2026-08-20 on 16 m32/m33
 * cases: recall 8/8, FP 4/8.
 *
 *   node scripts/draft/judge-visual.mjs <model> <casefile.json>
 *   (casefile: [{png, contract, mutated: bool, note}] —
 *    builder pattern in judge-cases-2026-08-20.json)
 *
 * SHADOW RUN (the gate before any haiku switchover): judge every captured
 * step of a lesson bundle against its real contract, write
 * artifacts/visual-qa/<lesson>/local-verdicts.json, and compare that with
 * the haiku screening verdicts for the same wave. Promote the local judge
 * only if it misses NO defect haiku caught across a full module wave.
 *
 *   node scripts/draft/judge-visual.mjs <model> --lesson ja-m33-neo-1
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "../..");
const model = process.argv[2];
const arg = process.argv[3];
if (!model || !arg) {
  console.error(
    "Usage: judge-visual.mjs <model> <casefile.json | --lesson <lessonId>>",
  );
  process.exit(1);
}

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
violation; kanji with matching furigana counts as showing the kana).
"mustNotShow" strings must be absent. Then check each free-text expectation.
Ignore whitespace-only differences. If a re-count or re-read resolves a
doubt, it is NOT a violation — report only defects you are sure of.

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
    // The MLX tags return 200-and-prose for `format` requests — never pin
    // one for this script. Loud failure beats an empty verdict file.
    throw new Error(`unparseable verdict (MLX format trap?): ${text.slice(0, 200)}`);
  }
}

if (arg === "--lesson") {
  const lessonId = process.argv[4];
  const dir = join(ROOT, "artifacts/visual-qa", lessonId);
  const contracts = JSON.parse(readFileSync(join(dir, "contracts.json"), "utf8"));
  const pngs = new Map();
  for (const f of readdirSync(dir)) {
    const m = f.match(/^step-(\d+)-/);
    if (m && f.endsWith(".png")) pngs.set(Number(m[1]), join(dir, f));
  }
  const verdicts = [];
  for (const step of contracts.steps) {
    const png = pngs.get(step.stepIndex);
    if (!png) continue;
    const t0 = Date.now();
    let v;
    try {
      v = await judge(png, step);
    } catch (e) {
      verdicts.push({ stepIndex: step.stepIndex, stepId: step.stepId, error: e.message });
      console.log(`[ERR] #${step.stepIndex} ${step.stepId}: ${e.message}`);
      continue;
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    verdicts.push({
      stepIndex: step.stepIndex,
      stepId: step.stepId,
      stepType: step.stepType,
      pass: v.pass && (v.violations?.length ?? 0) === 0,
      violations: v.violations ?? [],
    });
    const flag = verdicts.at(-1).pass ? "pass" : "FLAG";
    console.log(`[${flag}] ${secs}s #${step.stepIndex} ${step.stepType} ${step.stepId}`);
    for (const viol of v.violations ?? []) {
      console.log(`      · ${viol.expectation}: ${viol.whatIsWrong}`);
    }
  }
  const outPath = join(dir, "local-verdicts.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      { model, lessonId, judgedAt: new Date().toISOString(), verdicts },
      null,
      1,
    ),
  );
  const flagged = verdicts.filter((v) => v.pass === false).length;
  console.log(`\n${lessonId}: ${verdicts.length} steps judged, ${flagged} flagged → ${outPath}`);
} else {
  // ── back-test mode ──────────────────────────────────────────────────
  const cases = JSON.parse(readFileSync(arg, "utf8"));
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
}
