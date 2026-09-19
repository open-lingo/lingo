#!/usr/bin/env node
/**
 * tts-strings.mjs — every PT string a real lesson step or flashcard front
 * hands to getTtsUrl, across ALL compiled PT modules. Two sources per
 * module N:
 *  - `src/pub/content/v1/pt/mN.*.json` (from `npm run content:emit`):
 *    simpler than importing the TS curriculum (courseAtoms<->curriculum
 *    import cycle) and it IS what ships. AUDIO_KEYS + kana-shadow rule
 *    mirror the gate-enforced walk in es/esAudioCoverage.test.ts, each
 *    field re-verified per PT step view (PTTTS2-report.md "field set +
 *    evidence"): word_map/word_image_mcq tap-preview + match_pairs
 *    tap-on-select excluded (graceful no-op on a miss; PT's match_pairs
 *    never sets playAudioOnSelect); dialogue_sim reply option text
 *    excluded (view only plays npc.audioText ?? kana).
 *  - PT_M<N>_ATOMS in curriculum/mN.ts: FlashcardTester.tsx autoplays
 *    `card.front` (= atom.surface, normalizedAtoms.ts's fromPtAtom) on
 *    every RECOGNITION review of a srsEligible card. Atoms with
 *    `srsEligible: false` are excluded.
 *
 * Usage:
 *   node tts-strings.mjs            # print every required string + hash
 *   node tts-strings.mjs --missing  # print only strings not yet in the
 *                                    # staged manifest (pt.json), same
 *                                    # hash\ttext line shape, count first
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
const curriculumDir = resolve(ROOT, "src/features/languages/pt/curriculum");
const moduleFiles = readdirSync(curriculumDir)
  .filter((f) => /^m\d+\.ts$/.test(f))
  .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

const texts = new Set();
let atomCount = 0;

for (const modFile of moduleFiles) {
  const n = /^m(\d+)\.ts$/.exec(modFile)[1];

  const contentFile = readdirSync(contentDir).find((f) => f.startsWith(`m${n}.`));
  if (!contentFile) {
    console.error(`missing emitted content for m${n} (expected src/pub/content/v1/pt/m${n}.*.json — run npm run content:emit)`);
    process.exit(1);
  }
  const content = JSON.parse(readFileSync(resolve(contentDir, contentFile), "utf-8"));
  collect(content.lessons, texts);

  const src = readFileSync(resolve(curriculumDir, modFile), "utf-8");
  const atomsStart = src.indexOf(`export const PT_M${n}_ATOMS`);
  if (atomsStart === -1) {
    console.error(`missing PT_M${n}_ATOMS in curriculum/${modFile}`);
    process.exit(1);
  }
  const atomsBlock = src.slice(atomsStart, src.indexOf("\n];", atomsStart));
  const atomLines = atomsBlock.match(/^\s*atom\(\{.*\}\),?\s*$/gm) ?? [];
  for (const line of atomLines) {
    const surface = /surface:\s*"((?:[^"\\]|\\.)*)"/.exec(line)?.[1];
    if (surface && !/srsEligible:\s*false/.test(line)) {
      texts.add(surface);
      atomCount++;
    }
  }
}

const rows = [...texts].sort().map((text) => ({
  text,
  hash: createHash("sha256").update(`pt:${text}`, "utf-8").digest("hex").slice(0, 16),
}));

const onlyMissing = process.argv.includes("--missing");
let out = rows;
if (onlyMissing) {
  const manifestPath = resolve(ROOT, "src/shared/tts/manifests/pt.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const staged = new Set();
  for (let i = 0; i < manifest.hashes.length; i += 16) staged.add(manifest.hashes.slice(i, i + 16));
  out = rows.filter((r) => !staged.has(r.hash));
  console.log(`${out.length} missing of ${rows.length} distinct required strings (${atomCount} atom surfaces among them)`);
} else {
  console.log(`${rows.length} distinct required strings (${atomCount} atom surfaces among them)`);
}
for (const r of out) console.log(`${r.hash}\t${r.text}`);
