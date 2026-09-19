#!/usr/bin/env node
/**
 * tts-strings.mjs — every PT string a real m1 lesson step or flashcard
 * front hands to getTtsUrl. Two sources:
 *  - `src/pub/content/v1/pt/m1.*.json` (from `npm run content:emit`):
 *    simpler than importing the TS curriculum (courseAtoms<->curriculum
 *    import cycle) and it IS what ships. AUDIO_KEYS + kana-shadow rule
 *    mirror the gate-enforced walk in es/esAudioCoverage.test.ts, each
 *    field re-verified per PT step view (PTTTS2-report.md "field set +
 *    evidence"): word_map/word_image_mcq tap-preview + match_pairs
 *    tap-on-select excluded (graceful no-op on a miss; PT's match_pairs
 *    never sets playAudioOnSelect); dialogue_sim reply option text
 *    excluded (view only plays npc.audioText ?? kana).
 *  - PT_M1_ATOMS in curriculum/m1.ts: FlashcardTester.tsx autoplays
 *    `card.front` (= atom.surface, normalizedAtoms.ts's fromPtAtom) on
 *    every RECOGNITION review of a srsEligible card. No atom here sets
 *    `srsEligible: false`, so all 42 surfaces are required.
 */
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const AUDIO_KEYS = new Set([
  "audioText", "audioKey", "targetSentence", "targetPhrase", "promptAudioText", "kana",
]);

function collect(node, into) {
  if (Array.isArray(node)) return node.forEach((n) => collect(n, into));
  if (!node || typeof node !== "object") return;
  const kanaShadowed = typeof node.audioText === "string" && node.audioText.trim().length > 0;
  for (const [key, value] of Object.entries(node)) {
    if (key === "kana" && kanaShadowed) continue;
    if (typeof value === "string" && AUDIO_KEYS.has(key) && value.trim()) into.add(value.trim());
    else collect(value, into);
  }
}

const contentDir = resolve(ROOT, "src/pub/content/v1/pt");
const m1File = readdirSync(contentDir).find((f) => f.startsWith("m1."));
const m1 = JSON.parse(readFileSync(resolve(contentDir, m1File), "utf-8"));
const texts = new Set();
collect(m1.lessons, texts);

const m1ts = readFileSync(resolve(ROOT, "src/features/languages/pt/curriculum/m1.ts"), "utf-8");
const atomsStart = m1ts.indexOf("export const PT_M1_ATOMS");
const atomsBlock = m1ts.slice(atomsStart, m1ts.indexOf("\n];", atomsStart));
const atomLines = atomsBlock.match(/^\s*atom\(\{.*\}\),?\s*$/gm) ?? [];
let atomCount = 0;
for (const line of atomLines) {
  const surface = /surface:\s*"((?:[^"\\]|\\.)*)"/.exec(line)?.[1];
  if (surface && !/srsEligible:\s*false/.test(line)) {
    texts.add(surface);
    atomCount++;
  }
}

const rows = [...texts].sort().map((text) => ({
  text,
  hash: createHash("sha256").update(`pt:${text}`, "utf-8").digest("hex").slice(0, 16),
}));
console.log(`${rows.length} distinct required strings (${atomCount} atom surfaces among them)`);
for (const r of rows) console.log(`${r.hash}\t${r.text}`);
