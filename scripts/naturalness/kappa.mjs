#!/usr/bin/env node
/**
 * A5d — judge calibration metric harness.
 *
 * Runs one of the prompt variants (prompts.mjs) over a labelled calibration
 * set (scripts/naturalness/calibration/<lang>.json) with a chosen local
 * Ollama model, and reports precision/recall/Cohen's kappa against the
 * labels, plus per-row disagreements.
 *
 * Usage:
 *   node kappa.mjs --model <ollama-tag> --lang <ja|ko|es|fr> --prompt <variant> [--rows N] [--think true|false]
 *
 * Writes: artifacts/naturalness/kappa-<date>.jsonl (gitignored, appended)
 * Prints: a one-line summary + a disagreement table to stdout.
 *
 * `computeMetrics` (the arithmetic) is exported and unit-tested by
 * kappa.test.mjs against a known 2x2 table — no model calls needed for that
 * test.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getVariant, VARIANT_NAMES } from "./prompts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CALIBRATION_DIR = path.join(__dirname, "calibration");
const ARTIFACTS_DIR = path.join(REPO_ROOT, "artifacts", "naturalness");
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// ---------------------------------------------------------------------------
// Metric arithmetic — pure functions, unit tested.
// ---------------------------------------------------------------------------

/**
 * computeMetrics(rows) where each row is { label: "natural"|"unnatural",
 * predicted: "natural"|"unnatural"|null }. Positive class = "unnatural"
 * (the defect we want the judge to catch), matching the pipeline's
 * existing precision/recall framing (a "fix"/"unnatural" verdict is the
 * positive prediction).
 *
 * Rows with predicted === null (the model failed to return a verdict for
 * that row_id) are EXCLUDED from all counts and reported separately as
 * `missing` — they must never silently count as a true negative.
 *
 * Returns { tp, fp, fn, tn, missing, n, precision, recall, kappa, po, pe }.
 */
export function computeMetrics(rows) {
  let tp = 0,
    fp = 0,
    fn = 0,
    tn = 0,
    missing = 0;
  for (const r of rows) {
    if (r.predicted == null) {
      missing++;
      continue;
    }
    const actualPos = r.label === "unnatural";
    const predPos = r.predicted === "unnatural";
    if (actualPos && predPos) tp++;
    else if (!actualPos && predPos) fp++;
    else if (actualPos && !predPos) fn++;
    else tn++;
  }
  const n = tp + fp + fn + tn;
  const precision = tp + fp === 0 ? null : tp / (tp + fp);
  const recall = tp + fn === 0 ? null : tp / (tp + fn);

  // Cohen's kappa: po = observed agreement, pe = chance agreement, computed
  // from the marginals of the 2x2 confusion matrix (judge vs label, over
  // the n rows actually predicted).
  let kappa = null,
    po = null,
    pe = null;
  if (n > 0) {
    po = (tp + tn) / n;
    const actualPosRate = (tp + fn) / n;
    const predPosRate = (tp + fp) / n;
    const actualNegRate = (fn + tn) / n; // = tn+fn over n... see note below
    const predNegRate = (fn + tn) / n;
    pe =
      actualPosRate * predPosRate +
      (1 - actualPosRate) * (1 - predPosRate);
    kappa = pe === 1 ? (po === 1 ? 1 : 0) : (po - pe) / (1 - pe);
    void actualNegRate;
    void predNegRate;
  }

  return { tp, fp, fn, tn, missing, n, precision, recall, kappa, po, pe };
}

// ---------------------------------------------------------------------------
// Ollama call
// ---------------------------------------------------------------------------

async function ollamaChat({ model, systemPrompt, userMessage, schema, think, numCtx, temperature }) {
  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    stream: false,
    format: schema,
    options: { temperature: temperature ?? 0.1, num_ctx: numCtx ?? 262144 },
  };
  if (think !== undefined) body.think = think;
  const t0 = Date.now();
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const wallMs = Date.now() - t0;
  if (!res.ok) {
    throw new Error(`ollama http ${res.status}: ${await res.text()}`);
  }
  const raw = await res.json();
  return { raw, wallMs };
}

// Per lane-briefing SKILL §6: think is per-model, num_ctx must be explicit
// (never the 4096 default), and the -256k tags carry the full context.
const MODEL_THINK = {
  "qwen3.5-judge-256k:latest": false,
  "qwen3.5-judge-256k": false,
  "gemma4-31b-256k:latest": true,
  "gemma4-31b-256k": true,
  "qwen3.8-27b-256k:latest": true,
  "qwen3.8-27b-256k": true,
};

function resolveThink(model, override) {
  if (override !== undefined) return override;
  if (model in MODEL_THINK) return MODEL_THINK[model];
  console.warn(`kappa.mjs: no known think:setting for model "${model}" — defaulting to false. Pass --think explicitly to silence this.`);
  return false;
}

// ---------------------------------------------------------------------------
// Ollama residency guard (mirrors judge.mjs) — never run two large models
// at once; another lane may be using Ollama.
// ---------------------------------------------------------------------------
async function waitForModelSlot(model) {
  for (;;) {
    const res = await fetch(`${OLLAMA_URL}/api/ps`);
    const j = await res.json();
    const busy = (j.models || []).filter((m) => m.name !== model);
    if (busy.length === 0) return;
    console.log(
      `kappa.mjs: waiting — ${busy.map((m) => `${m.name} (${(m.size / 1e9).toFixed(1)}GB)`).join(", ")} resident; not loading a second model.`,
    );
    await new Promise((r) => setTimeout(r, 10000));
  }
}

// ---------------------------------------------------------------------------
// Run one (model, lang, variant) combo over the calibration set.
// ---------------------------------------------------------------------------

export function loadCalibration(lang, maxRows) {
  const file = path.join(CALIBRATION_DIR, `${lang}.json`);
  const all = JSON.parse(fs.readFileSync(file, "utf8"));
  const rows = all.map((r, i) => ({ id: `${lang}-${i}`, ...r }));
  return maxRows ? rows.slice(0, maxRows) : rows;
}

export async function runJudge({ model, lang, promptVariant, rows, think, batchSize = 50 }) {
  const variant = getVariant(promptVariant);
  const schema = variant.buildSchema(lang);
  const systemPrompt = variant.buildSystemPrompt(lang);
  const resolvedThink = resolveThink(model, think);

  const predictions = new Map(); // row_id -> { predicted, reason, raw }
  let totalWallMs = 0;
  let calls = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const userMessage = variant.buildUserMessage(lang, batch);
    const { raw, wallMs } = await ollamaChat({
      model,
      systemPrompt,
      userMessage,
      schema,
      think: resolvedThink,
    });
    totalWallMs += wallMs;
    calls++;
    let parsed;
    try {
      parsed = JSON.parse(raw.message.content);
    } catch (err) {
      console.error(`kappa.mjs: batch ${i}-${i + batch.length} JSON parse failed: ${err.message}; content head: ${(raw.message?.content ?? "").slice(0, 200)}`);
      continue;
    }
    for (const v of parsed.verdicts ?? []) {
      predictions.set(v.row_id, { predicted: variant.deriveVerdict(v), reason: v.reason, raw: v });
    }
  }

  const scored = rows.map((r) => ({
    ...r,
    predicted: predictions.has(r.id) ? predictions.get(r.id).predicted : null,
    judgeReason: predictions.has(r.id) ? predictions.get(r.id).reason : null,
  }));

  return { scored, totalWallMs, calls };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { batchSize: 50 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--model") out.model = argv[++i];
    else if (a === "--lang") out.lang = argv[++i];
    else if (a === "--prompt") out.prompt = argv[++i];
    else if (a === "--rows") out.rows = Number(argv[++i]);
    else if (a === "--think") out.think = argv[++i] === "true";
    else if (a === "--batch-size") out.batchSize = Number(argv[++i]);
    else if (a === "--quiet") out.quiet = true;
  }
  return out;
}

function fmtPct(x) {
  return x == null ? "n/a" : (x * 100).toFixed(1) + "%";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.model || !args.lang || !args.prompt) {
    console.error(
      "usage: node kappa.mjs --model <ollama-tag> --lang <ja|ko|es|fr> --prompt <" +
        VARIANT_NAMES.join("|") +
        "> [--rows N] [--think true|false] [--batch-size N]",
    );
    process.exit(1);
  }

  const rows = loadCalibration(args.lang, args.rows);
  console.log(
    `kappa.mjs: model=${args.model} lang=${args.lang} prompt=${args.prompt} rows=${rows.length} (${rows.filter((r) => r.kind === "planted").length} planted)`,
  );

  await waitForModelSlot(args.model);

  const t0 = Date.now();
  const { scored, totalWallMs, calls } = await runJudge({
    model: args.model,
    lang: args.lang,
    promptVariant: args.prompt,
    rows,
    think: args.think,
    batchSize: args.batchSize,
  });
  const wallS = (Date.now() - t0) / 1000;

  const metrics = computeMetrics(scored);
  const plantedRows = scored.filter((r) => r.kind === "planted");
  const plantedCaught = plantedRows.filter((r) => r.predicted === "unnatural").length;

  console.log(
    `\n${args.lang} / ${args.model} / ${args.prompt}: precision=${fmtPct(metrics.precision)} recall=${fmtPct(metrics.recall)} kappa=${metrics.kappa == null ? "n/a" : metrics.kappa.toFixed(3)} ` +
      `(tp=${metrics.tp} fp=${metrics.fp} fn=${metrics.fn} tn=${metrics.tn} missing=${metrics.missing}) planted=${plantedCaught}/${plantedRows.length} ` +
      `wall=${wallS.toFixed(1)}s (${calls} call(s), model-reported ${(totalWallMs / 1000).toFixed(1)}s)`,
  );

  const disagreements = scored.filter((r) => r.predicted != null && r.predicted !== r.label);
  if (!args.quiet && disagreements.length) {
    console.log(`\nDisagreements (${disagreements.length}):`);
    for (const d of disagreements) {
      console.log(
        `  [${d.kind}] "${d.sentence}" label=${d.label} judge=${d.predicted} judge_reason="${(d.judgeReason ?? "").slice(0, 140)}"`,
      );
    }
  }
  const missingRows = scored.filter((r) => r.predicted == null);
  if (missingRows.length) {
    console.log(`\nMissing verdicts (${missingRows.length}) — excluded from precision/recall/kappa:`);
    for (const m of missingRows) console.log(`  [${m.kind}] "${m.sentence}"`);
  }

  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const outFile = path.join(ARTIFACTS_DIR, `kappa-${date}.jsonl`);
  const record = {
    ts: new Date().toISOString(),
    model: args.model,
    lang: args.lang,
    prompt: args.prompt,
    rows: rows.length,
    planted: plantedRows.length,
    plantedCaught,
    wallS,
    calls,
    ...metrics,
    disagreements: disagreements.map((d) => ({
      sentence: d.sentence,
      kind: d.kind,
      label: d.label,
      predicted: d.predicted,
      judgeReason: d.judgeReason,
    })),
  };
  fs.appendFileSync(outFile, JSON.stringify(record) + "\n");
  console.log(`\nappended -> ${outFile}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("kappa.mjs: fatal", err);
    process.exit(1);
  });
}
