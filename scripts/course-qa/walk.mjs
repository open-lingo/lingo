#!/usr/bin/env node
/**
 * course-qa/walk.mjs — local-model fresh-learner walk of one ES module.
 *
 *   node scripts/course-qa/walk.mjs --module m4 --persona confusion
 *   node scripts/course-qa/walk.mjs --module m4 --persona retention --model qwen3.8:27b
 *
 * Local-grunt/frontier-taste doctrine (mobile-ux-loop): Ollama does the
 * in-character walking; the session model synthesizes across walk reports
 * and decides what is real. Findings land in
 * artifacts/course-qa/<module>-<persona>.md (uncommitted artifacts dir).
 *
 * The persona's "what I already know" list is derived from esReviewPool.ts
 * (regenerated per registration, so it always matches the shipped course):
 * everything from modules EARLIER than the walked module.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? dflt : process.argv[i + 1];
};
const mod = arg("module");
const persona = arg("persona", "confusion");
const model = arg("model", "qwen3.5:122b-a10b-q4_K_M");
if (!/^m\d+$/.test(mod ?? "")) {
  console.error("usage: walk.mjs --module mN [--persona confusion|retention|flow] [--model tag]");
  process.exit(1);
}
const n = Number(mod.slice(1));

// ── known vocabulary from earlier modules (esReviewPool is generated) ──
const pool = readFileSync(
  join(root, "src/features/languages/es/esReviewPool.ts"),
  "utf8",
);
const entries = [...pool.matchAll(
  /\{ surface: "((?:[^"\\]|\\.)*)", gloss: "((?:[^"\\]|\\.)*)", kind: "[^"]*", fromModule: "(m\d+)"/g,
)];
if (!entries.length) {
  console.error("could not parse esReviewPool.ts — regenerate it first");
  process.exit(1);
}
const known = entries
  .filter((m) => Number(m[3].slice(1)) < n)
  .map((m) => `${m[1]} (${m[2]})`);

const view = readFileSync(join(root, `docs/learner-sim/es-${mod}.md`), "utf8");

const PERSONAS = {
  confusion: `THE CONFUSION WALK: at every step ask — do I understand what's being asked? Could I get this right from what I've been taught (this module or the known list), or am I guessing blind? Does anything mislead me or contradict earlier teaching? Could two answers both be right? Do I face a word never taught to me? Flag steps whose answer is reachable only by luck.`,
  retention: `THE RETENTION WALK: track your memory realistically — a word shown once and never retrieved is GONE next lesson. For each NEW item count retrievals after introduction and their spacing. Flag items taught then abandoned, drills where one lazy strategy (always the same answer) scores well, and prior-module items that never come back. End with an honest next-day self-test: cold-produce / recognize-only / gone.`,
  flow: `THE EASE/FLOW WALK: you are tired, on a phone, ten minutes per lesson. Judge reading burden, boredom (same drill repeated, too many similar items in a row), overwhelm and likely quit points, whether dialogues feel like real moments or chores, whether lessons end on a win, and whether the module keeps the promise its first lesson makes.`,
};
const task = PERSONAS[persona];
if (!task) {
  console.error(`unknown persona "${persona}" (have: ${Object.keys(PERSONAS).join(", ")})`);
  process.exit(1);
}

const prompt = `You are a fresh English-only language learner on your phone, NOT a developer or linguist. Stay fully in character. You have completed the earlier modules of this Spanish course; this is EVERYTHING you know (word — meaning):
${known.join(" · ")}

You are now taking MODULE ${n}. Below is the full module, lesson by lesson, exactly as you would see it (answers hidden, options shuffled).

${task}

CALIBRATION (read before judging):
- Words this module itself introduces are EXPECTED to be new — meeting one is not a finding.
- Your known-list is complete for single words but sims/steps may echo full SENTENCES you produced in earlier modules (e.g. «¿cómo te llamas?», «la cuenta por favor») — treat a sentence as known if all its words are on your list.
- Choice options can carry invisible also-correct acceptance the view does not show; if two answers both seem right, report it as a QUESTION to verify, not a blocker — unless the goal text itself misleads.

Report each finding as one line: [BLOCKER|CONFUSING|NIT] Lesson N, step id — what happened, first person. Report your STRONGEST findings first and stop at 25 findings maximum — beyond that, summarize the pattern in one line instead of listing instances. A walk that finds nothing is a failed walk unless the module is genuinely clean. End with a 3-sentence verdict.

THE MODULE:
${view}`;

const res = await fetch("http://localhost:11434/v1/messages", {
  method: "POST",
  headers: { "content-type": "application/json", "x-api-key": "ollama", "anthropic-version": "2023-06-01" },
  body: JSON.stringify({
    model,
    max_tokens: 12000,
    messages: [{ role: "user", content: prompt }],
  }),
});
if (!res.ok) {
  console.error(`ollama ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();
const text = (data.content ?? [])
  .filter((b) => b.type === "text")
  .map((b) => b.text)
  .join("\n");

const outDir = join(root, "artifacts/course-qa");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `es-${mod}-${persona}.md`);
writeFileSync(
  out,
  `# es ${mod} — ${persona} walk (${model}, ${new Date().toISOString().slice(0, 10)})\n\n${text}\n`,
);
console.log(`wrote ${out} (${text.length} chars, in=${data.usage?.input_tokens} out=${data.usage?.output_tokens})`);
