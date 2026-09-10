#!/usr/bin/env node
/**
 * mt-translate-catalog.mjs — local-model MT drafter for KO-source
 * `<moduleId>.ko.json` sidecars (rung 1b §4 of
 * `docs/ko-source-rung1a-2026-09-10.md`, m6-pilot recipe).
 *
 * Reads the extractor's `<lang>/<moduleId>.en.json` (produced by
 * `extract-content-catalog.mjs`) and drafts a Korean translation for every
 * entry via the local Ollama server, batched to keep each call's context
 * manageable. Output is a DRAFT — per the rung-1a recipe this still needs a
 * Sonnet-subagent fidelity review before it's a ship-ready sidecar; this
 * script only produces the candidate file + a parse/count sanity check.
 *
 * Usage:
 *   node scripts/i18n/mt-translate-catalog.mjs ja m6
 *   node scripts/i18n/mt-translate-catalog.mjs ja m6 --model qwen3.5:122b-a10b-q4_K_M --batch 40
 *
 * Model: pinned to the NON-mlx tag explicitly (`local-model-stack.md`'s
 * `ollama/ollama#16563` trap — the `-mlx` variant silently ignores the
 * `format` JSON-schema constraint and returns prose with a 200 OK, which
 * looks like success until something tries to JSON.parse it). Every
 * response is parsed and its length/anchor-set checked against the batch
 * before being accepted; a batch that fails either check is retried once
 * with a smaller batch size, then reported as failed (never silently
 * dropped or silently miscounted).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { makeGovernor } from "../draft/throttle.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const [lang, moduleId] = positional;
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i > -1 && argv[i + 1] ? argv[i + 1] : d;
};
const MODEL = flag("model", "qwen3.5:122b-a10b-q4_K_M");
const BATCH_SIZE = Number(flag("batch", "40"));
const OUT_DIR = resolve(ROOT, flag("out", "src/shared/i18n/content"));

if (!lang || !moduleId) {
  console.error("Usage: node scripts/i18n/mt-translate-catalog.mjs <lang> <moduleId> [--model <tag>] [--batch <n>] [--out <dir>]");
  process.exit(2);
}

const enPath = join(OUT_DIR, lang, `${moduleId}.en.json`);
if (!existsSync(enPath)) {
  console.error(`[mt] no ${enPath} — run extract-content-catalog.mjs first`);
  process.exit(1);
}
const enCatalog = JSON.parse(readFileSync(enPath, "utf-8"));
const entries = enCatalog.entries;

// ── Category guidance (stated in the PROMPT TEXT, not just the schema —
// the memory doc's 08-20 finding: enum-only labeling let this model emit
// consecutive-run garbage; stating categories in prose fixed 81→25 errors). ──
function anchorCategory(anchor) {
  if (anchor.includes("/gp:")) return "grammar-point rule/example";
  if (anchor.includes("/atom:")) return "vocabulary gloss";
  if (/\/[^/]+\/ja:/.test(anchor)) return "step prompt/gloss keyed to a Japanese sentence";
  if (/\/[^/]+\/en:/.test(anchor)) return "generic step text (title, instruction, option, hint)";
  return "other";
}

// Pull the Japanese surface out of an anchor when present, so the model has
// the actual JA sentence/word to translate STRUCTURE-TRUE to, not just the
// (often idiomatically-smoothed) English gloss.
function jaSurfaceFromAnchor(anchor) {
  const exMatch = anchor.match(/\/ex:(.+)$/);
  if (exMatch) return exMatch[1];
  const jaMatch = anchor.match(/\/ja:(.+)$/);
  if (jaMatch) return jaMatch[1];
  const atomMatch = anchor.match(/\/atom:([^/]+)\//);
  if (atomMatch) return atomMatch[1];
  return null;
}

function buildPrompt(batch) {
  const items = batch.map((e) => {
    const ja = jaSurfaceFromAnchor(e.anchor);
    return {
      anchor: e.anchor,
      category: anchorCategory(e.anchor),
      ja: ja ?? undefined,
      en: e.en,
    };
  });
  return `You are translating English learner-facing UI strings from a JAPANESE course into KOREAN, for KOREAN-speaking learners of Japanese.

CRITICAL: translate each "en" string to Korean so it is STRUCTURE-TRUE TO THE JAPANESE ("ja" field, when present), NOT to the English wording. Japanese and Korean share SOV word order and a near 1:1 particle system (が/은/는, を/를, に/에, で/에서, の/의 …), so a structure-true Korean gloss is also natural Korean — do not smooth back toward the loose English phrasing (e.g. English "There's a book" for ほんが ある should become a Korean gloss that mirrors "book-SUBJECT exist(inanimate)", not just a free "책이 있어요" only if that itself is what a Korean speaker would say to parse the JA sentence's structure — prefer the reading that teaches the JA grammar point, matching this course's existing register).

Categories in this batch, and how to handle each:
  - "grammar-point rule/example": explains or exemplifies a JA grammar point (existence verbs ある/いる, negation via ～ない, location questions, spatial relations こ/そ/あ demonstratives). Keep terminology consistent with how a Korean-language JA-grammar course would name these forms. An "en" of exactly "(incorrect)" marks a deliberately WRONG example sentence — translate it as a short Korean equivalent marker (e.g. "(틀림)"), never as a full sentence.
  - "vocabulary gloss": a single word/phrase meaning — keep it short, dictionary-style, matching the English's register (a "shortGloss" entry pairs with a longer "gloss" entry for the same word; keep the short one shorter).
  - "step prompt/gloss keyed to a Japanese sentence": instructional text tied to one JA sentence (e.g. "Build: I won't eat the cucumber." for きゅうりを たべない). Preserve any leading instruction word (e.g. "Build:") translated naturally, then give a structure-true Korean rendering of the meaning.
  - "generic step text": UI chrome (titles, instructions like "Pick the word for X", hints). Translate naturally; these are not grammar-teaching content.

Return ONLY a JSON array, one object per input item, in the SAME ORDER, each shaped exactly {"anchor": "<the input anchor, verbatim>", "text": "<Korean translation>"}. Do not add, drop, reorder, or merge items — the array must have exactly ${items.length} objects, one per input anchor below.

INPUT (${items.length} items):
${JSON.stringify(items, null, 1)}`;
}

const SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      anchor: { type: "string" },
      text: { type: "string" },
    },
    required: ["anchor", "text"],
    additionalProperties: false,
  },
};

async function callModel(prompt, numPredict) {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      think: false,
      format: SCHEMA,
      options: {
        num_ctx: 16384,
        num_predict: numPredict,
        temperature: 0.3,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const j = await res.json();
  return JSON.parse(j.response);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const gov = makeGovernor({ duty: 0.85, label: "mt-translate" });
const batches = chunk(entries, BATCH_SIZE);
console.log(`[mt] ${moduleId} (${lang}): ${entries.length} entries in ${batches.length} batches of up to ${BATCH_SIZE}, model=${MODEL}`);

const byAnchor = new Map();
let failedBatches = 0;

async function translateAttempt(attemptBatch, label) {
  const t0 = Date.now();
  const prompt = buildPrompt(attemptBatch);
  const draft = await gov.run(() => callModel(prompt, Math.max(3500, attemptBatch.length * 90)));
  if (!Array.isArray(draft) || draft.length !== attemptBatch.length) {
    throw new Error(`expected ${attemptBatch.length} items, got ${Array.isArray(draft) ? draft.length : typeof draft}`);
  }
  const inputAnchors = new Set(attemptBatch.map((e) => e.anchor));
  for (const item of draft) {
    if (!inputAnchors.has(item.anchor)) {
      throw new Error(`anchor mismatch: "${item.anchor}" not in input batch`);
    }
  }
  for (const item of draft) byAnchor.set(item.anchor, item.text);
  console.log(`[mt] ${label} (${attemptBatch.length}) ok in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  const label = `batch ${i + 1}/${batches.length}`;
  try {
    await translateAttempt(batch, label);
    continue; // success — do NOT also run the fallback split attempts
  } catch (e) {
    console.error(`[mt] ${label} FAILED whole: ${e.message} — retrying as two half-batches`);
    failedBatches++;
  }
  if (batch.length <= 4) {
    console.error(`[mt] ${label} too small to split further — giving up on this batch`);
    continue;
  }
  const mid = Math.ceil(batch.length / 2);
  for (const half of [batch.slice(0, mid), batch.slice(mid)]) {
    try {
      await translateAttempt(half, `${label} half(${half.length})`);
    } catch (e) {
      console.error(`[mt] ${label} half(${half.length}) FAILED: ${e.message}`);
      failedBatches++;
    }
  }
}

const koEntries = entries
  .filter((e) => byAnchor.has(e.anchor))
  .map((e) => ({ anchor: e.anchor, text: byAnchor.get(e.anchor), enSourceHash: e.enSourceHash }));

const missing = entries.filter((e) => !byAnchor.has(e.anchor)).map((e) => e.anchor);

const koCatalog = {
  schema: 1,
  moduleId,
  lang: "ko",
  generatedAt: new Date().toISOString().slice(0, 10),
  draftedBy: MODEL,
  entryCount: koEntries.length,
  entries: koEntries,
};

const outPath = join(OUT_DIR, lang, `${moduleId}.ko.json`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(koCatalog, null, 2) + "\n");

console.log(`[mt] wrote ${koEntries.length}/${entries.length} entries → ${outPath}`);
if (missing.length) {
  console.log(`[mt] MISSING (${missing.length}):`);
  for (const a of missing) console.log(`  - ${a}`);
  process.exitCode = 1;
}
const r = gov.report();
console.log(`[mt] wall ${(r.wallMs / 1000 / 60).toFixed(1)}min busy ${(r.busyMs / 1000 / 60).toFixed(1)}min`);
