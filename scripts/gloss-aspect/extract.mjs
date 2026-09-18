#!/usr/bin/env node
/**
 * Gloss-aspect fidelity sweep — Step 1: mechanical extraction.
 *
 * Reads (read-only, no repo edits):
 *   src/features/languages/<lang>/curriculum/ir/m*.ir.yaml  (source IR, not
 *   the compiled .ir.json — per lane brief; skips any *.test.* file).
 *
 * Finds every {ja: "...", en: "..."} pair (rule-card examples, sentence/
 * challenge/dialogue-line beats, sim npc turns) plus particle-cloze
 * (stem+answer+tail -> ja, en) and listening-comp (audio -> ja, answer -> en)
 * shapes, tags each with which house-gloss-table form(s) (forms.mjs) the JA
 * text contains, and keeps only rows that match at least one form.
 *
 * Writes: artifacts/gloss-aspect/rows-<lang>.jsonl
 *   {id, lang, module, lessonId, ja, en, forms: [id...], sourceFile, sourceLine}
 *
 * Usage: node scripts/gloss-aspect/extract.mjs ja
 */
import fs from "node:fs";
import path from "node:path";
import { detectForms } from "./forms.mjs";

const REPO_ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(REPO_ROOT, "artifacts/gloss-aspect");

const LANG_IR_DIR = {
  ja: "src/features/languages/ja/curriculum/ir",
};

/** Parse a `--modules m23,m30,m36` style CLI arg into a Set of bare module
 * names ("m23"), or null when absent (meaning "no filter, every module"). */
export function parseModulesArg(argv) {
  const idx = argv.indexOf("--modules");
  if (idx === -1) return null;
  const raw = argv[idx + 1];
  if (!raw) throw new Error("--modules requires a comma-separated list, e.g. --modules m23,m30,m36");
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

function listIrYamlFiles(lang, modules) {
  const dir = LANG_IR_DIR[lang];
  if (!dir) throw new Error(`extract.mjs: no IR dir configured for lang "${lang}"`);
  const abs = path.join(REPO_ROOT, dir);
  let files = fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".ir.yaml") && !f.includes(".test."));
  if (modules) {
    files = files.filter((f) => modules.has(f.replace(/\.ir\.yaml$/, "")));
  }
  return files
    .sort((a, b) => {
      // sort m3, m4, ... m10, m11 numerically, not lexicographically
      const na = Number((a.match(/^m(\d+)/) || [])[1] ?? 0);
      const nb = Number((b.match(/^m(\d+)/) || [])[1] ?? 0);
      return na - nb;
    })
    .map((f) => path.join(abs, f));
}

// A single flow-map object: "{" ... no nested "{" or "}" ... "}". None of
// the shapes this course authors nest a brace inside another brace (arrays
// use [ ] instead), and character classes match newlines by default in JS
// regex, so this also catches maps wrapped across multiple lines (m6-class
// capstone/particle-cloze entries).
const FLOW_MAP_RE = /\{([^{}]*)\}/g;

function unquote(raw) {
  if (raw == null) return null;
  const m = raw.match(/^"((?:[^"\\]|\\.)*)"$/);
  if (!m) return null;
  return m[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
}

function extractField(body, key) {
  // key: "..." (quoted string value only — every ja/en/audio/answer/stem/tail
  // value in this IR is a quoted string)
  const re = new RegExp(`(?:^|[,{\\s])${key}:\\s*("(?:[^"\\\\]|\\\\.)*")`);
  const m = body.match(re);
  return m ? unquote(m[1]) : null;
}

function hasKey(body, key) {
  return new RegExp(`(?:^|[,{\\s])${key}:\\s*`).test(body);
}

/** Pull {ja, en} out of one flow-map body, per the shapes this course uses.
 * Returns null if this map isn't a gloss pair (e.g. a `reply:`/`antiPattern:`
 * map, or an `options:`/`distractors:` foil list has no ja/en of its own). */
function pairFromFlowMap(body) {
  if (hasKey(body, "stem") && hasKey(body, "answer") && !hasKey(body, "audio")) {
    // particle-cloze: ja is assembled from stem + answer(JA) + tail; en is
    // the `en` field (NOT `answer`, which is Japanese here).
    const stem = extractField(body, "stem") ?? "";
    const answer = extractField(body, "answer") ?? "";
    const tail = extractField(body, "tail") ?? "";
    const en = extractField(body, "en");
    if (!answer || !en) return null;
    return { ja: `${stem}${answer}${tail}`, en };
  }
  if (hasKey(body, "audio") && hasKey(body, "answer")) {
    // listening-comp: audio is JA, answer is the EN gloss (distractors are
    // deliberately wrong foils — never extracted as a gloss to audit, per
    // content-change skill's "grade answer positions, not every string").
    const ja = extractField(body, "audio");
    const en = extractField(body, "answer");
    if (!ja || !en) return null;
    return { ja, en };
  }
  const ja = extractField(body, "ja");
  const en = extractField(body, "en");
  if (!ja || !en) return null;
  return { ja, en };
}

function findNearestModule(text) {
  const m = text.match(/^module:\s*(\S+)/m);
  return m ? m[1] : null;
}

/** Every `- id: <x>` occurrence with its character offset, plus the offset
 * of the top-level `lessons:` key (before it, an id belongs to a rule/grammar
 * card; at/after it, an id is a real lesson id). */
function indexIds(text) {
  const ids = [];
  const idRe = /^[ \t]*-\s*id:\s*(\S+)/gm;
  let m;
  while ((m = idRe.exec(text))) {
    ids.push({ index: m.index, id: m[1] });
  }
  const lessonsMatch = text.match(/^lessons:\s*$/m);
  const lessonsIndex = lessonsMatch ? lessonsMatch.index : Infinity;
  return { ids, lessonsIndex };
}

function lessonIdAt(index, idIndex) {
  let best = null;
  for (const entry of idIndex.ids) {
    if (entry.index <= index) best = entry;
    else break;
  }
  if (!best) return null;
  return best.index < idIndex.lessonsIndex ? `card:${best.id}` : best.id;
}

function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

export function extractModule(lang, file) {
  const text = fs.readFileSync(file, "utf8");
  const module = findNearestModule(text) ?? path.basename(file).replace(/\.ir\.yaml$/, "");
  const idIndex = indexIds(text);
  const relFile = path.relative(REPO_ROOT, file);

  const rows = [];
  const seen = new Set();
  let match;
  FLOW_MAP_RE.lastIndex = 0;
  while ((match = FLOW_MAP_RE.exec(text))) {
    const body = match[1];
    const pair = pairFromFlowMap(body);
    if (!pair) continue;
    const forms = detectForms(pair.ja);
    if (forms.length === 0) continue;
    const lessonId = lessonIdAt(match.index, idIndex);
    const sourceLine = lineAt(text, match.index);
    const key = `${lessonId}|${pair.ja}|${pair.en}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      id: `${module}-${sourceLine}`,
      lang,
      module,
      lessonId,
      ja: pair.ja,
      en: pair.en,
      forms,
      sourceFile: relFile,
      sourceLine,
    });
  }
  return rows;
}

export function extractLang(lang, modules) {
  const files = listIrYamlFiles(lang, modules);
  let all = [];
  for (const f of files) {
    all = all.concat(extractModule(lang, f));
  }
  return { files, rows: all };
}

function main() {
  const lang = process.argv[2];
  if (!lang) {
    console.error("usage: node scripts/gloss-aspect/extract.mjs <lang> [--modules m23,m30,m36] [--tag fix]");
    process.exit(1);
  }
  const modules = parseModulesArg(process.argv.slice(3));
  const tagIdx = process.argv.indexOf("--tag");
  const tag = tagIdx !== -1 ? process.argv[tagIdx + 1] : null;
  const { files, rows } = extractLang(lang, modules);
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const outFile = path.join(ARTIFACTS_DIR, `rows-${lang}${tag ? `-${tag}` : ""}.jsonl`);
  fs.writeFileSync(outFile, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
  console.log(`extract.mjs: scanned ${files.length} ${lang} IR files`);
  console.log(`extract.mjs: ${rows.length} rows with >=1 gloss-aspect form -> ${outFile}`);

  const byForm = new Map();
  for (const r of rows) {
    for (const f of r.forms) byForm.set(f, (byForm.get(f) ?? 0) + 1);
  }
  const summary = [...byForm.entries()].sort((a, b) => b[1] - a[1]);
  console.log("extract.mjs: rows per form:");
  for (const [form, count] of summary) console.log(`  ${form}: ${count}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
