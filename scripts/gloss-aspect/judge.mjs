#!/usr/bin/env node
/**
 * Gloss-aspect fidelity sweep — Step 2: judge extracted rows with a local
 * Ollama model against the house-gloss table (forms.mjs), rationale-first
 * (docs/judge-calibration-2026-09-17.md: rationale-first was the winning
 * variant for JA on both gemma4-31b-256k and qwen3.5-judge-256k; default
 * model gemma4-31b-256k per that doc + project memory).
 *
 * A row with N forms.mjs matches is exploded into N judge rows, one per
 * form, so the model judges one house-gloss-table entry at a time and the
 * output row shape matches the brief: {lessonId, ja, en, form, verdict,
 * rationale, proposed_en}.
 *
 * Usage:
 *   node scripts/gloss-aspect/judge.mjs ja
 *
 * For the planted-known-bad-row self-check, see plant.mjs (imports
 * judgeBatch/buildSchema from here, runs independently of the checkpoint
 * files below).
 *
 * Reads:  artifacts/gloss-aspect/rows-<lang>.jsonl (extract.mjs)
 * Writes: artifacts/gloss-aspect/verdicts-<lang>.jsonl  (checkpoint, resumable)
 *         artifacts/gloss-aspect/failures-<lang>.jsonl  (batches that never validated)
 *         artifacts/gloss-aspect/<lang>-findings.json   (final joined output)
 *         artifacts/gloss-aspect/stats-<lang>.json      (perf numbers)
 *
 * No repo edits. Findings feed a follow-up fix lane; this tool never writes
 * course content.
 */
import fs from "node:fs";
import path from "node:path";
import { FORMS, getForm } from "./forms.mjs";

const REPO_ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(REPO_ROOT, "artifacts/gloss-aspect");
const OLLAMA_URL = "http://localhost:11434";

// docs/judge-calibration-2026-09-17.md default; override with
// GLOSS_ASPECT_MODEL for a re-check.
export const MODEL = process.env.GLOSS_ASPECT_MODEL || "gemma4-31b-256k:latest";
const BATCH_SIZE = Number(process.env.GLOSS_ASPECT_BATCH_SIZE || 20);
// The gemma4-31b-256k tag's server config is `-np 1` (one slot — verified
// 2026-09-18 via `ps aux` on the resident llama-server process): the model
// serializes requests regardless of client concurrency. CONCURRENCY>1 gave
// no measured throughput gain in a 2-batch test (174s/220s, second batch
// just queued behind the first) and a first live run at concurrency=4 hit
// "fetch failed" on all 4 opening batches (root cause not isolated —
// possibly a transient state left by an abruptly-killed prior run, not
// reproduced in two follow-up concurrency tests) — default to 1 for
// reliability over an unproven speed gain.
const CONCURRENCY = Number(process.env.GLOSS_ASPECT_CONCURRENCY || 1);
const TEMPERATURE = 0.1;
// gemma4-31b-256k does better WITH thinking (lane-briefing §6, judge-
// calibration doc) — default on; override with GLOSS_ASPECT_THINK=false.
const THINK = process.env.GLOSS_ASPECT_THINK
  ? process.env.GLOSS_ASPECT_THINK === "true"
  : true;

// ---------------------------------------------------------------------------
// Plain-language product rule + house-gloss table as JSON (lane-briefing §6:
// local models get JSON rows + plain product rules, not code).
// ---------------------------------------------------------------------------

const PRODUCT_RULE = `You are checking English glosses in a Japanese course for adult English speakers.

The product rule: a Japanese grammar form often asserts something specific about whether an event actually happened, is still going on, was reported by someone else, or was merely intended. The English gloss must say that specific thing in its own wording. It must NOT rely on a subtle English grammar trick (like the difference between "tried to go" and "tried going") that a reader skims past without noticing. A gloss that a normal adult native English reader could misread as meaning the opposite of what the Japanese actually says is a MISMATCH, even if the English sentence is technically grammatical.

You will be given, for each row: the Japanese sentence (ja), the current English gloss (en), and which ONE grammar form (form) you are checking it against. You are also given that form's entry in the house-gloss table: what the form asserts, the house English pattern we want, an example of English wording to avoid, and why that wording is misleading.

For each row, decide:
- verdict "ok": the gloss already carries the form's assertion clearly and could not reasonably be misread.
- verdict "mismatch": the gloss uses the avoid wording (or anything similarly misleading), OR a plain adult reader could take it to mean the opposite of what the Japanese asserts.

For every "mismatch", write proposed_en: a natural replacement gloss for the SAME Japanese sentence that fixes the problem, in the house style. For "ok", proposed_en is an empty string.

FIRST write rationale (one plain sentence: what the form asserts, what the gloss actually says, and whether those match), THEN commit to verdict. Do not decide verdict before writing the rationale.

Judge only the ONE form named in each row, not other grammar in the sentence. When a table entry has a "note" field, that note narrows the rule for that form specifically — follow it strictly, including its "do NOT flag" cases.`;

function houseTableJson() {
  return FORMS.map((f) => ({
    form: f.id,
    label: f.label,
    asserts: f.asserts,
    houseEn: f.houseEn,
    avoidEn: f.avoidEn,
    avoidWhy: f.avoidWhy,
    ...(f.judgeNote ? { note: f.judgeNote } : {}),
  }));
}

export const SYSTEM_PROMPT =
  PRODUCT_RULE + "\n\nHouse-gloss table (JSON):\n" + JSON.stringify(houseTableJson());

export function buildSchema() {
  return {
    type: "object",
    properties: {
      verdicts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            row_id: { type: "string" },
            rationale: { type: "string", maxLength: 240 },
            verdict: { type: "string", enum: ["ok", "mismatch"] },
            proposed_en: { type: "string" },
          },
          required: ["row_id", "rationale", "verdict", "proposed_en"],
        },
      },
    },
    required: ["verdicts"],
  };
}

export function buildUserMessage(rows, retryError) {
  const compact = rows.map((r) => ({
    row_id: r.judgeId,
    ja: r.ja,
    en: r.en,
    form: r.form,
  }));
  let msg =
    "Judge these rows. Return exactly one verdict per row_id, in the same order, row_id copied exactly:\n" +
    JSON.stringify(compact);
  if (retryError) {
    msg +=
      "\n\nYour previous response failed validation with this error — fix it and return valid output for ALL rows again: " +
      retryError;
  }
  return msg;
}

// ---------------------------------------------------------------------------
// Explode extracted rows (which may carry multiple forms) into one judge
// row per form, per the brief's singular `form` output shape.
// ---------------------------------------------------------------------------

export function explodeRows(extractedRows) {
  const out = [];
  for (const r of extractedRows) {
    for (const form of r.forms) {
      out.push({
        judgeId: `${r.id}::${form}`,
        sourceRowId: r.id,
        lang: r.lang,
        module: r.module,
        lessonId: r.lessonId,
        ja: r.ja,
        en: r.en,
        form,
        sourceFile: r.sourceFile,
        sourceLine: r.sourceLine,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Ollama call + validation
// ---------------------------------------------------------------------------

export async function ollamaChat(userMessage, schema, extraOptions) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: extraOptions?.model || MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      stream: false,
      format: schema,
      think: extraOptions?.think,
      options: { temperature: TEMPERATURE, num_ctx: 262144 },
    }),
  });
  if (!res.ok) {
    throw new Error(`ollama http ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function validate(parsed, expectedIds) {
  if (!parsed || !Array.isArray(parsed.verdicts)) {
    return "top-level object must have a 'verdicts' array";
  }
  if (parsed.verdicts.length !== expectedIds.length) {
    return `expected ${expectedIds.length} verdicts, got ${parsed.verdicts.length}`;
  }
  const gotIds = parsed.verdicts.map((v) => v.row_id);
  const expectedSet = new Set(expectedIds);
  const gotSet = new Set(gotIds);
  if (expectedSet.size !== gotSet.size || [...expectedSet].some((id) => !gotSet.has(id))) {
    return `row_id set mismatch: expected [${expectedIds.join(",")}] got [${gotIds.join(",")}]`;
  }
  for (const v of parsed.verdicts) {
    if (!["ok", "mismatch"].includes(v.verdict)) {
      return `row_id ${v.row_id}: verdict must be "ok" or "mismatch", got ${JSON.stringify(v.verdict)}`;
    }
    if (v.verdict === "mismatch" && (!v.proposed_en || v.proposed_en.trim() === "")) {
      return `row_id ${v.row_id}: verdict=mismatch requires a non-empty proposed_en`;
    }
  }
  return null;
}

export async function judgeBatch(rows, schema, stats) {
  const expectedIds = rows.map((r) => r.judgeId);
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const userMessage = buildUserMessage(rows, lastErr);
    const t0 = Date.now();
    let raw;
    try {
      raw = await ollamaChat(userMessage, schema, { think: THINK });
    } catch (err) {
      lastErr = String(err);
      continue;
    }
    if (stats) {
      stats.calls++;
      stats.wallMs += Date.now() - t0;
      stats.evalCount += raw.eval_count || 0;
      stats.evalDurationNs += raw.eval_duration || 0;
      stats.promptEvalCount += raw.prompt_eval_count || 0;
      stats.promptEvalDurationNs += raw.prompt_eval_duration || 0;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw.message.content);
    } catch (err) {
      lastErr = `response was not valid JSON: ${err.message}`;
      continue;
    }
    const err = validate(parsed, expectedIds);
    if (!err) return { ok: true, verdicts: parsed.verdicts };
    lastErr = err;
  }
  return { ok: false, error: lastErr };
}

async function waitForModelSlot() {
  for (;;) {
    const res = await fetch(`${OLLAMA_URL}/api/ps`);
    const j = await res.json();
    const models = j.models || [];
    const busy = models.filter((m) => m.name !== MODEL);
    if (busy.length === 0) return;
    console.log(
      `judge.mjs: waiting — ${busy.map((m) => `${m.name} (${(m.size / 1e9).toFixed(1)}GB)`).join(", ")} is resident; not loading a second large model.`,
    );
    await new Promise((r) => setTimeout(r, 15000));
  }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function loadDoneIds(outFile) {
  const done = new Set();
  for (const v of readJsonl(outFile)) done.add(v.row_id);
  return done;
}

export function writeFindings(lang, judgeRows, verdicts, tag) {
  const byId = new Map(verdicts.map((v) => [v.row_id, v]));
  const findings = judgeRows
    .map((r) => {
      const v = byId.get(r.judgeId);
      if (!v) return null;
      return {
        lessonId: r.lessonId,
        ja: r.ja,
        en: r.en,
        form: r.form,
        verdict: v.verdict,
        rationale: v.rationale,
        proposed_en: v.proposed_en || "",
        module: r.module,
        sourceFile: r.sourceFile,
        sourceLine: r.sourceLine,
      };
    })
    .filter(Boolean);
  const outFile = path.join(ARTIFACTS_DIR, `${lang}${tag ? `-${tag}` : ""}-findings.json`);
  fs.writeFileSync(outFile, JSON.stringify(findings, null, 2) + "\n");
  return { outFile, count: findings.length };
}

export async function runLang(lang, tag) {
  const suffix = tag ? `-${tag}` : "";
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const inFile = path.join(ARTIFACTS_DIR, `rows-${lang}${suffix}.jsonl`);
  const outFile = path.join(ARTIFACTS_DIR, `verdicts-${lang}${suffix}.jsonl`);
  const failFile = path.join(ARTIFACTS_DIR, `failures-${lang}${suffix}.jsonl`);
  const statsFile = path.join(ARTIFACTS_DIR, `stats-${lang}${suffix}.json`);

  const extractedRows = readJsonl(inFile);
  const judgeRows = explodeRows(extractedRows);
  console.log(`judge.mjs[${lang}]: ${extractedRows.length} extracted rows -> ${judgeRows.length} per-form judge rows`);

  const done = loadDoneIds(outFile);
  const remaining = judgeRows.filter((r) => !done.has(r.judgeId));
  console.log(`judge.mjs[${lang}]: ${done.size} already judged, ${remaining.length} remaining`);

  if (remaining.length > 0) {
    const batches = [];
    for (let i = 0; i < remaining.length; i += BATCH_SIZE) batches.push(remaining.slice(i, i + BATCH_SIZE));
    console.log(`judge.mjs[${lang}]: ${batches.length} batches of <=${BATCH_SIZE}, concurrency ${CONCURRENCY}, model ${MODEL}, think=${THINK}`);

    await waitForModelSlot();
    const schema = buildSchema();
    const stats = { calls: 0, wallMs: 0, evalCount: 0, evalDurationNs: 0, promptEvalCount: 0, promptEvalDurationNs: 0, failedBatches: 0 };
    const runStart = Date.now();
    let nextIdx = 0;
    let completed = 0;
    const worker = async () => {
      for (;;) {
        const idx = nextIdx++;
        if (idx >= batches.length) return;
        const batch = batches[idx];
        const result = await judgeBatch(batch, schema, stats);
        if (result.ok) {
          fs.appendFileSync(outFile, result.verdicts.map((v) => JSON.stringify(v)).join("\n") + "\n");
        } else {
          stats.failedBatches++;
          fs.appendFileSync(failFile, JSON.stringify({ rowIds: batch.map((r) => r.judgeId), error: result.error }) + "\n");
          console.error(`judge.mjs[${lang}]: batch ${idx} FAILED after retry: ${result.error}`);
        }
        completed++;
        if (completed % 5 === 0 || completed === batches.length) {
          const elapsedS = (Date.now() - runStart) / 1000;
          const rate = completed / elapsedS;
          const etaS = (batches.length - completed) / Math.max(rate, 1e-6);
          console.log(`judge.mjs[${lang}]: ${completed}/${batches.length} batches done (${elapsedS.toFixed(0)}s elapsed, ETA ${(etaS / 60).toFixed(1)}m)`);
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    fs.writeFileSync(
      statsFile,
      JSON.stringify(
        {
          lang,
          model: MODEL,
          think: THINK,
          rowsJudged: remaining.length,
          batches: batches.length,
          failedBatches: stats.failedBatches,
          wallTimeS: (Date.now() - runStart) / 1000,
          genTokPerSec: stats.evalCount / (stats.evalDurationNs / 1e9 || 1),
          promptTokPerSec: stats.promptEvalCount / (stats.promptEvalDurationNs / 1e9 || 1),
          totalCalls: stats.calls,
        },
        null,
        2,
      ),
    );
  }

  const allVerdicts = readJsonl(outFile);
  const { outFile: findingsFile, count } = writeFindings(lang, judgeRows, allVerdicts, tag);
  const mismatches = JSON.parse(fs.readFileSync(findingsFile, "utf8")).filter((f) => f.verdict === "mismatch");
  console.log(`judge.mjs[${lang}]: wrote ${count} findings -> ${findingsFile} (${mismatches.length} mismatch)`);
  return { findingsFile, count, mismatches: mismatches.length };
}

async function main() {
  const lang = process.argv[2];
  if (!lang) {
    console.error("usage: node scripts/gloss-aspect/judge.mjs <lang> [--tag fix]");
    process.exit(1);
  }
  const tagIdx = process.argv.indexOf("--tag");
  const tag = tagIdx !== -1 ? process.argv[tagIdx + 1] : null;
  await runLang(lang, tag);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("judge.mjs: fatal", err);
    process.exit(1);
  });
}
