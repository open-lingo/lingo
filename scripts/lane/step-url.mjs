#!/usr/bin/env node
// scripts/lane/step-url.mjs — resolve "the step this screenshot sentence is
// on" to a dev deep-link, in one call. Reads the EMITTED content
// (src/pub/content/v1/, see docs/content-ships-in-the-binary.md) — the only
// place step numbering is reliably 0-indexed and matches `?step=N`. Real
// route is `/:lang/learn/lessons/:lessonId` (the brief's `/ja/lesson/<id>`
// shorthand is not the live path — see src/App.tsx).
//
// Usage:
//   scripts/lane/step-url.mjs "<sentence or lessonId>" --lang ja
//
// If the argument matches a known lesson id exactly, prints every step of
// that lesson. Otherwise treats it as a literal substring and prints one
// dev URL per matching step (0-indexed), across every module of --lang.
import { contentAvailable, findInContent, stepsOfLesson } from "./lib/content-search.mjs";

function usage() {
  console.log(`usage: step-url.mjs "<sentence or lessonId>" --lang ja|ko|es|fr

Prints /:lang/learn/lessons/<id>?step=N&trace-gate=0 for every emitted step
that contains the given text (0-indexed), or every step of the lesson if the
argument is itself a known lesson id. Reads src/pub/content/v1 — run
\`npm run content:emit\` first if it's missing (this script says so too).`);
}

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help") || args.length === 0) {
  usage();
  process.exit(args.length === 0 ? 2 : 0);
}
const langIdx = args.indexOf("--lang");
const lang = langIdx > -1 ? args[langIdx + 1] : null;
const query = args.filter((a, i) => a !== "--lang" && i !== langIdx + 1)[0];

if (!lang || !query) {
  usage();
  process.exit(2);
}

if (!contentAvailable()) {
  console.error(
    "step-url.mjs: src/pub/content/v1/manifest.json is missing — run `npm run content:emit` first, then retry.",
  );
  process.exit(1);
}

function url(lang, lessonId, step) {
  return `/${lang}/learn/lessons/${lessonId}?step=${step}&trace-gate=0`;
}

let exact;
try {
  exact = stepsOfLesson(lang, query);
} catch (err) {
  console.error(`step-url.mjs: ${err.message}`);
  process.exit(1);
}

if (exact) {
  console.log(`lesson "${query}" (${exact.length} steps):`);
  for (const s of exact) console.log(`  ${url(lang, query, s.stepIndex)}  [${s.stepType}]`);
  process.exit(0);
}

const hits = findInContent(lang, query);
if (hits.length === 0) {
  console.log(`no step in ${lang} content contains "${query}"`);
  process.exit(1);
}
for (const h of hits.slice(0, 20)) {
  console.log(`  ${url(lang, h.lessonId, h.stepIndex)}  [${h.stepType}]`);
}
if (hits.length > 20) console.log(`... (${hits.length - 20} more matches omitted)`);
