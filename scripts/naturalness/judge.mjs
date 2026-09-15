#!/usr/bin/env node
/**
 * Naturalness sweep — Step 2: judge extracted rows with a local Ollama
 * model, constrained to a JSON schema, and let the model propose a
 * replacement gloss (and, when the Japanese itself is the problem, a
 * replacement ja).
 *
 * Usage:
 *   node scripts/naturalness/judge.mjs words
 *   node scripts/naturalness/judge.mjs sentences
 *   node scripts/naturalness/judge.mjs words sentences   (both, sequentially)
 *
 * Reads:  <OUT_DIR>/rows-{words,sentences}.jsonl
 * Writes: <OUT_DIR>/verdicts-{words,sentences}.jsonl (checkpointed, resumable)
 *         <OUT_DIR>/failures-{words,sentences}.jsonl  (batches that never validated)
 *         <OUT_DIR>/ollama-stats-{words,sentences}.json (perf numbers for the report)
 *
 * No repo edits. Reads only scratchpad + the read-only extracted rows.
 */
import fs from "node:fs";
import path from "node:path";

const OUT_DIR =
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/naturalness";

const OLLAMA_URL = "http://localhost:11434";
export const MODEL = process.env.NATURALNESS_MODEL || "gemma4-31b-256k:latest";
const BATCH_SIZE = Number(process.env.NATURALNESS_BATCH_SIZE || 25);
const CONCURRENCY = Number(process.env.NATURALNESS_CONCURRENCY || 4);
const TEMPERATURE = 0.2;
// 2026-09-15 retune (lead's throughput check): with thinking ON, gemma4-31b's
// combination of hidden reasoning + JSON-schema-constrained decoding cost an
// unreported ~150-190s/batch (total_duration far exceeded eval_duration +
// prompt_eval_duration) for no measurable verdict-quality gain — a 25-row
// think:false vs think:on-verdicts comparison agreed 23/25 (92%). Default off;
// override with NATURALNESS_THINK=true to re-enable for a quality re-check.
const THINK = process.env.NATURALNESS_THINK
  ? process.env.NATURALNESS_THINK === "true"
  : false;
// Optional wall-clock budget (ms) for a single runSet() call. When set, the
// worker loop stops handing out NEW batches once the deadline passes (any
// in-flight batch still finishes and checkpoints normally) — used to run a
// bounded, resumable pass instead of blocking for the full corpus. Rows are
// reordered module-round-robin first (see `stratifyByModule`) so a partial
// run still samples every module instead of draining m1 upward in file order.
const MAX_WALL_MS = process.env.NATURALNESS_MAX_MS
  ? Number(process.env.NATURALNESS_MAX_MS)
  : Infinity;

/** Round-robin the row list by `module` so a time-boxed partial run still
 * touches every module roughly proportionally, instead of exhausting the
 * budget on whatever module happens to sort first in the source file. */
function stratifyByModule(rows) {
  const byModule = new Map();
  for (const r of rows) {
    const key = r.module ?? "unknown";
    if (!byModule.has(key)) byModule.set(key, []);
    byModule.get(key).push(r);
  }
  const buckets = [...byModule.values()];
  const out = [];
  let remaining = rows.length;
  let i = 0;
  while (remaining > 0) {
    for (const bucket of buckets) {
      if (i < bucket.length) {
        out.push(bucket[i]);
        remaining--;
      }
    }
    i++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Prompt: product rules (from docs/spencer-product-sentiment.md "Japanese
// content" + past TestFlight verdicts named in the brief) + 6 worked
// examples (5 real past verdicts + 1 pass).
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are grading English glosses in a Japanese course for US English-speaking adults, against these product rules (Spencer's own words, in quotes):

1. Closest 1-to-1 English gloss, US English, no register baked into the answer text. "we need to use the CLOSEST English 1-1 word translation" — "Cheese are bad, chikatetsu is subway" (not "underground" — that's British) — "we just need the plain translation" (don't append a FORMALITY/POLITENESS note like "(casual)" or "(polite)" onto a plain vocab gloss; register commentary belongs in your reason field, never in replacement_en). This rule is narrow: it is about POLITENESS LEVEL ONLY (casual/plain/polite/humble/honorific). It does NOT mean every parenthetical is a violation — a parenthetical that states a grammatical derivation ("potential of X", "-te form of X") or disambiguates word sense (distinguishing two real course atoms, e.g. a time-approximator from an amount-approximator) is not register and must not be flagged as register OR structure; removing it would destroy real distinguishing information. Only flag register when the note is specifically about formality/politeness.
2. Speak like an average 30-year-old. "we ideally want people speaking like your average 30 year old." Primary/most-common verb or word first — e.g. 電話する before かける for "to call [someone]"; 手紙を出す is fine for "to mail a letter."
3. Object-drop is normal Japanese, not a defect. A sentence that omits a subject/object the context makes obvious is correct Japanese; do not flag the ja for that, and do not invent an explicit subject/object in the English gloss that is not implied. This is NOT the same as the です copula: です itself means "is/am/are" and a gloss like "It's coffee." for "コーヒー です" is NOT inventing structure — です already carries that meaning. Never flag a です-sentence gloss for "adding a subject the ja doesn't have"; English requires a subject to be a grammatical sentence and です supplies exactly that meaning.
4. A gloss must not lie about structure. Do not add meaning, tense, or specificity the Japanese does not carry; do not strip meaning the Japanese does carry.
5. Kanji/kana surface choice is not your concern here — judge only whether the EN gloss is the natural, correct, closest translation of the JA as given.

For each row, decide:
- verdict "pass": the gloss already satisfies every rule above.
- verdict "fix": it violates one or more rules.

issue tags: "gloss" (wrong meaning/word sense), "verb-choice" (technically valid but not the primary/common verb), "british" (British English spelling or vocabulary), "register" (register/politeness baked into the gloss text instead of being implicit or explained separately), "structure" (gloss adds or removes structure/meaning the ja doesn't have), "unnatural-ja" (the ja itself is stilted/non-native, not the gloss), "other", or "none" (only valid with verdict=pass).

For every "fix": give a reason (<=200 chars, plain, specific, cite the rule), and replacement_en = your proposed natural gloss (required, non-empty). Only set replacement_ja to a non-empty value if the JAPANESE TEXT ITSELF must change (issue=unnatural-ja); otherwise leave replacement_ja as an empty string. confidence is your 0-1 certainty in this verdict.

For every "pass": issue="none", reason is a short justification, replacement_en="" and replacement_ja="".

Judge every row independently. Use the "neighbours" field (the previous glosses in the same lesson) only as context for register/continuity, never as a reason by itself.`;

const WORKED_EXAMPLES = [
  {
    ja: "ちかてつ",
    en: "underground",
    verdict: "fix",
    issue: "british",
    reason:
      "British English; US English word for this is 'subway'. (real verdict #19)",
    replacement_en: "subway",
  },
  {
    ja: "げんき",
    en: "healthy (casual register)",
    verdict: "fix",
    issue: "register",
    reason:
      "Register note baked into the gloss text; give the plain translation only. (real verdict #15)",
    replacement_en: "healthy",
  },
  {
    ja: "ことば",
    en: "the words",
    verdict: "fix",
    issue: "gloss",
    reason:
      "This atom is 言語 'language', mislabeled as 'the words'. (real verdict #74)",
    replacement_en: "the language",
  },
  {
    ja: "いかが",
    en: "how",
    verdict: "fix",
    issue: "gloss",
    reason:
      "いかが is a polite offer, not a bare 'how'. (real verdict #97)",
    replacement_en: "how about... (polite offer)",
  },
  {
    ja: "かける",
    en: "to hang",
    verdict: "fix",
    issue: "verb-choice",
    reason:
      "In a phone-call context this must gloss the calling sense, and 電話する is the primary verb, not かける alone. (real verdict #98)",
    replacement_en: "to make (a phone call) - 電話をかける",
  },
  {
    ja: "ねこ",
    en: "cat",
    verdict: "pass",
    issue: "none",
    reason: "Closest 1-to-1 translation, no issues.",
    replacement_en: "",
  },
  {
    ja: "およげる",
    en: "can swim (potential of およぐ)",
    verdict: "pass",
    issue: "none",
    reason:
      "This is a CONJUGATION/grammar-point atom (potential form of およぐ) — the derivation note is the grammatical content being taught, not a politeness-register aside. Do NOT flag a parenthetical like '(potential of X)', '(-te form of X)', etc. as register or structure; it is accurate, load-bearing metadata that keeps this atom distinct from an unrelated plain-form atom. Only flag register when a note describes FORMALITY/POLITENESS (casual/polite/humble/honorific), not grammatical derivation.",
    replacement_en: "",
  },
  {
    ja: "コーヒー です",
    en: "It's coffee.",
    verdict: "pass",
    issue: "none",
    reason:
      "です is the copula and genuinely MEANS 'is' — translating it as 'It's coffee.' does not add structure that isn't in the Japanese. The 'object/subject-drop is normal, don't invent one' rule is about Japanese OMITTING a subject/object; it does not mean the English gloss must drop the grammatical subject English requires to be a complete sentence. Do not strip a required English subject from a です-sentence gloss.",
    replacement_en: "",
  },
  {
    ja: "ごろ",
    en: "around (of a point in time)",
    verdict: "pass",
    issue: "none",
    reason:
      "'(of a point in time)' is a SENSE-DISAMBIGUATOR, not a register note — it is what keeps ごろ (approximate TIME, 'around 3 o'clock') distinguishable from its near-synonym ぐらい (approximate AMOUNT, 'about 3 hours'). Stripping a disambiguator that distinguishes two real course atoms from each other would make them collide and is itself a structural lie by omission. Only flag register when a note is about formality/politeness, not when it disambiguates word sense.",
    replacement_en: "",
  },
];

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
            verdict: { type: "string", enum: ["pass", "fix"] },
            issue: {
              type: "string",
              enum: [
                "gloss",
                "verb-choice",
                "british",
                "register",
                "structure",
                "unnatural-ja",
                "other",
                "none",
              ],
            },
            reason: { type: "string", maxLength: 200 },
            replacement_en: { type: "string" },
            replacement_ja: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: [
            "row_id",
            "verdict",
            "issue",
            "reason",
            "replacement_en",
            "replacement_ja",
            "confidence",
          ],
        },
      },
    },
    required: ["verdicts"],
  };
}

export function buildUserMessage(rows, retryError) {
  const compact = rows.map((r) => ({
    row_id: r.id,
    ja: r.ja,
    kana: r.kana ?? undefined,
    en: r.en,
    neighbours: r.neighbours,
  }));
  let msg =
    "Six worked reference verdicts (calibration only — do not emit rows for these):\n" +
    JSON.stringify(WORKED_EXAMPLES) +
    "\n\nNow judge these rows. Return exactly one verdict per row_id below, in the same order, with row_id copied exactly as given:\n" +
    JSON.stringify(compact);
  if (retryError) {
    msg +=
      "\n\nYour previous response failed validation with this error - fix it and return valid output for ALL rows again: " +
      retryError;
  }
  return msg;
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
      options: { temperature: TEMPERATURE },
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
    if (v.verdict === "fix" && (!v.replacement_en || v.replacement_en.trim() === "")) {
      return `row_id ${v.row_id}: verdict=fix requires a non-empty replacement_en`;
    }
    if (
      typeof v.confidence !== "number" ||
      Number.isNaN(v.confidence) ||
      v.confidence < 0 ||
      v.confidence > 1
    ) {
      return `row_id ${v.row_id}: confidence must be a number in [0,1], got ${JSON.stringify(v.confidence)}`;
    }
  }
  return null; // valid
}

async function judgeBatch(rows, schema, stats) {
  const expectedIds = rows.map((r) => r.id);
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
    stats.calls++;
    stats.wallMs += Date.now() - t0;
    stats.evalCount += raw.eval_count || 0;
    stats.evalDurationNs += raw.eval_duration || 0;
    stats.promptEvalCount += raw.prompt_eval_count || 0;
    stats.promptEvalDurationNs += raw.prompt_eval_duration || 0;

    let parsed;
    try {
      parsed = JSON.parse(raw.message.content);
    } catch (err) {
      lastErr = `response was not valid JSON: ${err.message}`;
      continue;
    }
    const err = validate(parsed, expectedIds);
    if (!err) {
      return { ok: true, verdicts: parsed.verdicts };
    }
    lastErr = err;
  }
  return { ok: false, error: lastErr };
}

// ---------------------------------------------------------------------------
// Ollama residency guard — never run two >=27B tags concurrently
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function isValidConfidence(c) {
  return typeof c === "number" && !Number.isNaN(c) && c >= 0 && c <= 1;
}

// Confidence-leak repair (2026-09-15): validate() only rejects a bad
// confidence value for a batch that is ACTUALLY re-judged in this call. Rows
// written by an earlier process that was already resident in memory when the
// validate()/schema range check landed (a Node process doesn't hot-reload an
// edited file — the ~5h sentences run and the original words run both
// straddled that fix landing and kept writing unbounded confidence values
// for their whole lifetime) are sitting in the output file looking "done"
// and are never revisited by a normal resumable run. Before computing what's
// "already judged", evict any row whose confidence is outside [0,1] from the
// output file (keeping a timestamped backup) so it falls out of `done` and
// gets naturally re-asked as part of `remaining` — same code path as every
// other unjudged row, now under the validate() that actually enforces the
// range.
function evictBadConfidenceRows(outFile, setName) {
  if (!fs.existsSync(outFile)) return 0;
  const lines = fs.readFileSync(outFile, "utf8").split("\n").filter((l) => l.trim());
  const keep = [];
  let evicted = 0;
  for (const line of lines) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue; // drop corrupt trailing line
    }
    if (isValidConfidence(parsed.confidence)) {
      keep.push(line);
    } else {
      evicted++;
    }
  }
  if (evicted > 0) {
    const backup = `${outFile}.pre-confidence-repair-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;
    fs.copyFileSync(outFile, backup);
    fs.writeFileSync(outFile, keep.length ? keep.join("\n") + "\n" : "");
    console.log(
      `judge.mjs[${setName}]: confidence-leak repair — evicted ${evicted} row(s) with confidence outside [0,1] (backup: ${backup}); they will be re-asked this run`,
    );
  }
  return evicted;
}

function loadDoneIds(outFile) {
  const done = new Set();
  if (fs.existsSync(outFile)) {
    for (const line of fs.readFileSync(outFile, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        done.add(JSON.parse(line).row_id);
      } catch {
        /* ignore corrupt trailing line */
      }
    }
  }
  return done;
}

async function runSet(setName) {
  const inFile = path.join(OUT_DIR, `rows-${setName}.jsonl`);
  const outFile = path.join(OUT_DIR, `verdicts-${setName}.jsonl`);
  const failFile = path.join(OUT_DIR, `failures-${setName}.jsonl`);
  const statsFile = path.join(OUT_DIR, `ollama-stats-${setName}.json`);

  const allRows = fs
    .readFileSync(inFile, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));

  evictBadConfidenceRows(outFile, setName);
  const done = loadDoneIds(outFile);
  const remaining = stratifyByModule(allRows.filter((r) => !done.has(r.id)));
  console.log(
    `judge.mjs[${setName}]: ${allRows.length} total rows, ${done.size} already judged, ${remaining.length} remaining`,
  );
  if (remaining.length === 0) return;

  const batches = [];
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    batches.push(remaining.slice(i, i + BATCH_SIZE));
  }
  console.log(
    `judge.mjs[${setName}]: ${batches.length} batches of <=${BATCH_SIZE}, concurrency ${CONCURRENCY}, model ${MODEL}`,
  );

  await waitForModelSlot();

  const schema = buildSchema();
  const stats = {
    calls: 0,
    wallMs: 0,
    evalCount: 0,
    evalDurationNs: 0,
    promptEvalCount: 0,
    promptEvalDurationNs: 0,
    failedBatches: 0,
  };
  const runStart = Date.now();

  const deadline = Date.now() + MAX_WALL_MS;
  let stoppedForBudget = false;
  let nextIdx = 0;
  let completed = 0;
  const worker = async () => {
    for (;;) {
      const idx = nextIdx++;
      if (idx >= batches.length) return;
      if (Date.now() > deadline) {
        stoppedForBudget = true;
        return;
      }
      const batch = batches[idx];
      const result = await judgeBatch(batch, schema, stats);
      if (result.ok) {
        const lines = result.verdicts
          .map((v) => JSON.stringify(v))
          .join("\n");
        fs.appendFileSync(outFile, lines + "\n");
      } else {
        stats.failedBatches++;
        fs.appendFileSync(
          failFile,
          JSON.stringify({
            rowIds: batch.map((r) => r.id),
            error: result.error,
          }) + "\n",
        );
        console.error(
          `judge.mjs[${setName}]: batch ${idx} FAILED after retry: ${result.error}`,
        );
      }
      completed++;
      if (completed % 5 === 0 || completed === batches.length) {
        const elapsedS = (Date.now() - runStart) / 1000;
        const rate = completed / elapsedS;
        const etaS = (batches.length - completed) / Math.max(rate, 1e-6);
        console.log(
          `judge.mjs[${setName}]: ${completed}/${batches.length} batches done (${elapsedS.toFixed(0)}s elapsed, ETA ${(etaS / 60).toFixed(1)}m)`,
        );
      }
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  fs.writeFileSync(
    statsFile,
    JSON.stringify(
      {
        setName,
        model: MODEL,
        rowsJudged: remaining.length,
        rowsActuallyCompleted: completed * BATCH_SIZE > remaining.length ? remaining.length : completed,
        batches: batches.length,
        batchesCompleted: completed,
        stoppedForBudget,
        failedBatches: stats.failedBatches,
        wallTimeS: (Date.now() - runStart) / 1000,
        genTokPerSec: stats.evalCount / (stats.evalDurationNs / 1e9),
        promptTokPerSec: stats.promptEvalCount / (stats.promptEvalDurationNs / 1e9),
        totalEvalTokens: stats.evalCount,
        totalPromptTokens: stats.promptEvalCount,
        totalCalls: stats.calls,
      },
      null,
      2,
    ),
  );
  console.log(`judge.mjs[${setName}]: done. Stats -> ${statsFile}`);
}

async function main() {
  const sets = process.argv.slice(2);
  if (sets.length === 0) {
    console.error("usage: node judge.mjs <words|sentences> [words|sentences]");
    process.exit(1);
  }
  for (const s of sets) {
    await runSet(s);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("judge.mjs: fatal", err);
    process.exit(1);
  });
}
