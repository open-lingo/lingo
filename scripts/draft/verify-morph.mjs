/**
 * verify-morph.mjs — cross-check the drafting morphology against the app's own
 * conjugation tables.
 *
 *   node scripts/draft/verify-morph.mjs
 *
 * The drafting pipeline (morph-es.mjs) and the shipped app
 * (src/features/languages/es/conjugationTables.ts) each hold Spanish verb
 * forms. If they drift, the pipeline drafts sentences the app will later
 * conjugate differently in a ConjugationGrid, and the learner sees the app
 * contradict its own lesson. This script fails loudly on any disagreement.
 *
 * `vosotros` is skipped: the LatAm-neutral course does not drill it, so
 * morph-es.mjs deliberately does not carry it.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { conjugate, PERSONS } from "./morph-es.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const TABLES = resolve(here, "../../src/features/languages/es/conjugationTables.ts");
const whole = await readFile(TABLES, "utf8");

// Slice out ES_VERB_ENTRIES only. The file also holds ES_CONJUGATION_FORM_LABELS,
// whose values ("yo (present)") match the same key pattern — reading past the
// array's closing bracket makes every label look like a mismatched verb form.
// It did exactly that on the first run: 15 false failures, all on the last verb.
const start = whole.indexOf("export const ES_VERB_ENTRIES");
const end = whole.indexOf("\n];", start);
if (start === -1 || end === -1) {
  console.error("FAIL: could not locate the ES_VERB_ENTRIES array — the file shape changed.");
  process.exit(1);
}
const src = whole.slice(start, end);

// The table is a hand-maintained literal with a regular shape, so a scan is
// enough and avoids dragging a TS toolchain into a drafting script.
const entries = [];
for (const block of src.split(/\n  \{\n/).slice(1)) {
  const lemma = block.match(/lemma:\s*"([^"]+)"/)?.[1];
  if (!lemma) continue;
  const forms = {};
  for (const [, key, val] of block.matchAll(/"(\w+\.\w+)":\s*"([^"]+)"/g)) forms[key] = val;
  if (Object.keys(forms).length) entries.push({ lemma, forms });
}

if (entries.length === 0) {
  console.error("FAIL: parsed 0 verbs out of conjugationTables.ts — the file shape changed.");
  console.error("      Fix this parser before trusting any result; a silent 0 looks like a pass.");
  process.exit(1);
}

let checked = 0;
const mismatches = [];
const missing = [];

for (const { lemma, forms } of entries) {
  for (const tense of ["present", "preterite", "imperfect"]) {
    for (const person of PERSONS) {
      const expected = forms[`${tense}.${person}`];
      if (!expected) continue;
      let got;
      try {
        got = conjugate(lemma, person, tense);
      } catch (e) {
        missing.push(`${lemma} ${tense}.${person}: ${e.message}`);
        continue;
      }
      checked += 1;
      if (got !== expected) mismatches.push(`${lemma} ${tense}.${person}: draft="${got}" app="${expected}"`);
    }
  }
}

console.log(`verify-morph: ${entries.length} verbs, ${checked} forms compared (vosotros skipped by design)`);
if (missing.length) {
  console.log(`\n${missing.length} form(s) the drafting layer cannot produce:`);
  for (const m of missing) console.log(`  - ${m}`);
}
if (mismatches.length) {
  console.log(`\n${mismatches.length} DISAGREEMENT(S) between draft morphology and the app:`);
  for (const m of mismatches) console.log(`  - ${m}`);
}
if (!missing.length && !mismatches.length) console.log("PASS — every form agrees.");
process.exit(mismatches.length || missing.length ? 1 : 0);
