#!/usr/bin/env node
/**
 * surfaces-index.mjs — per-module index of taught surfaces (2026-09-13).
 *
 * PROBLEM this replaces: every ES/FR/KO dispatch brief re-derives "what's
 * already taught" by grepping the compiled curriculum by hand —
 *   grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..35}.ts | sort -u
 * — repeated verbatim in ~20 ES briefs (see docs/es-ir-sources/es-m36-brief.md
 * lines 79-91, 150-160) plus every m*-header.yaml's WHY/REJECTED section.
 * That's "read six mN.ts files + grep m{1..N}" done fresh, by an expensive
 * agent, every single module. This script does the grep once, from the same
 * source of truth, and writes a committed index a brief can just READ.
 *
 * SOURCE OF TRUTH differs by language and this script follows the atom
 * registry, not file layout:
 *   - ES/FR: atoms are declared WITH their module, in
 *     `curriculum/m<N>.ts` (`atom({ surface, fromModule: "m<N>", ... })`).
 *     `courseAtoms.ts` itself declares none (confirmed empirically 2026-09-13
 *     — its own comment says so: "Unlike KO (all atoms inline here), ES
 *     atoms live WITH their module").
 *   - KO: the reverse. `courseAtoms.ts` is the ONE file with every
 *     `atom({...})` call (391 of them, `fromModule` spanning m1-m27 +
 *     sidequest-survival); the curriculum/m*.ts files reference atoms via
 *     `vocabMcq()` but declare none. Grepping curriculum/m*.ts alone for KO
 *     (the naive per-language-identical approach) finds 48 of 391 — an
 *     87% miss that would silently ship a near-empty index. Verified by
 *     direct comparison before writing this script.
 *
 * So: scan BOTH `curriculum/m*.ts` (skipping `_archive/` and `*.test.ts` —
 * see memory "glob-collectors-match-test-files") AND `courseAtoms.ts` for
 * every language, group by each atom's own `fromModule` field (not by
 * which file it was found in), and let whichever file actually has the
 * data populate the index. This is robust to either layout and to a
 * future language choosing either one.
 *
 * Usage:
 *   node scripts/authoring/surfaces-index.mjs --lang es
 *   node scripts/authoring/surfaces-index.mjs --lang fr
 *   node scripts/authoring/surfaces-index.mjs --lang ko
 *
 * Writes:
 *   docs/<lang>-ir-sources/surfaces-index.json  (compact, machine-read)
 *   docs/<lang>-ir-sources/surfaces-index.md    (human-read summary)
 *
 * npm run authoring:surfaces -- --lang es
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

const SUPPORTED_LANGS = ["es", "fr", "ko"];

const rawArgs = process.argv.slice(2);
const langFlagIdx = rawArgs.indexOf("--lang");
const lang = langFlagIdx !== -1 ? rawArgs[langFlagIdx + 1] : undefined;

if (!lang || !SUPPORTED_LANGS.includes(lang)) {
  console.error("Usage: node scripts/authoring/surfaces-index.mjs --lang es|fr|ko");
  process.exit(1);
}

// ── gather candidate source files ───────────────────────────────────────

const curriculumDir = resolve(ROOT, `src/features/languages/${lang}/curriculum`);
const courseAtomsPath = resolve(ROOT, `src/features/languages/${lang}/courseAtoms.ts`);

/** @type {string[]} */
const files = [];

if (existsSync(curriculumDir)) {
  for (const f of readdirSync(curriculumDir)) {
    if (!/^m\d+[\w-]*\.ts$/.test(f)) continue; // m<N>*.ts only
    if (f.endsWith(".test.ts")) continue; // never test files (they match m<N> globs too)
    files.push(resolve(curriculumDir, f));
  }
}
if (existsSync(courseAtomsPath)) files.push(courseAtomsPath);

if (files.length === 0) {
  console.error(`No source files found for --lang ${lang} under ${curriculumDir}`);
  process.exit(1);
}

// ── extract atom({...}) blocks ──────────────────────────────────────────
// Every atom() call is a single-line or multi-line object literal with no
// nested braces (verified across all es/fr curriculum + ko courseAtoms.ts,
// 1140 atom() calls, 0 with a nested "{" in the body) — a non-greedy
// "{...}" match is therefore safe and does not need a real JS parser.

const ATOM_RE = /atom\(\{([\s\S]*?)\}\)/g;
const FIELD = (name) => new RegExp(`${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
const SURFACE_RE = FIELD("surface");
const FROM_MODULE_RE = FIELD("fromModule");
const MEANING_RE = FIELD("meaningEn");
const KIND_RE = FIELD("kind");

/** module id -> Map(surface -> entry) */
const byModule = new Map();
let atomOccurrences = 0;

for (const file of files) {
  const text = readFileSync(file, "utf-8");
  for (const m of text.matchAll(ATOM_RE)) {
    const body = m[1];
    const surfaceM = SURFACE_RE.exec(body);
    if (!surfaceM) continue;
    atomOccurrences++;
    const fromM = FROM_MODULE_RE.exec(body);
    const moduleId = fromM ? fromM[1] : "unknown";
    const meaningM = MEANING_RE.exec(body);
    const kindM = KIND_RE.exec(body);
    const surface = surfaceM[1];

    if (!byModule.has(moduleId)) byModule.set(moduleId, new Map());
    const moduleMap = byModule.get(moduleId);
    // first-write-wins by surface, mirroring the app's own dedup rule
    // (courseAtoms.ts: "Dedup rule mirrors KO: first-write-wins by surface")
    if (!moduleMap.has(surface)) {
      moduleMap.set(surface, {
        id: `${lang}:${surface}`,
        surface,
        ...(meaningM ? { meaningEn: meaningM[1] } : {}),
        ...(kindM ? { kind: kindM[1] } : {}),
      });
    }
  }
}

// ── natural module ordering: m1, m2, …, m10, then any non-numeric ids ──

function moduleSortKey(id) {
  const match = /^m(\d+)$/.exec(id);
  return match ? [0, parseInt(match[1], 10), id] : [1, 0, id];
}
const moduleIds = [...byModule.keys()].sort((a, b) => {
  const ka = moduleSortKey(a);
  const kb = moduleSortKey(b);
  if (ka[0] !== kb[0]) return ka[0] - kb[0];
  if (ka[1] !== kb[1]) return ka[1] - kb[1];
  return ka[2].localeCompare(kb[2]);
});

const modules = {};
let atomCount = 0;
for (const moduleId of moduleIds) {
  const entries = [...byModule.get(moduleId).values()].sort((a, b) =>
    a.surface.localeCompare(b.surface),
  );
  modules[moduleId] = entries;
  atomCount += entries.length;
}

// ── reverse map: surface -> first module it was taught in ──────────────

const surfaceToFirstModule = {};
for (const moduleId of moduleIds) {
  for (const entry of modules[moduleId]) {
    if (!(entry.surface in surfaceToFirstModule)) {
      surfaceToFirstModule[entry.surface] = moduleId;
    }
  }
}

// ── write JSON (compact — this is read by agents, not humans) ──────────

const outDir = resolve(ROOT, `docs/${lang}-ir-sources`);
mkdirSync(outDir, { recursive: true });
const jsonPath = resolve(outDir, "surfaces-index.json");
const mdPath = resolve(outDir, "surfaces-index.md");

const index = {
  lang,
  generatedAt: new Date().toISOString(),
  generatedBy: "scripts/authoring/surfaces-index.mjs",
  sourceFiles: files.map((f) => f.slice(ROOT.length + 1)).sort(),
  moduleCount: moduleIds.length,
  atomCount,
  modules,
  surfaceToFirstModule,
};

writeFileSync(jsonPath, JSON.stringify(index));

// ── write short markdown summary ────────────────────────────────────────

const lines = [];
lines.push(`# ${lang.toUpperCase()} surfaces index`);
lines.push("");
lines.push(
  `Generated ${index.generatedAt} from ${files.length} source file(s) — ` +
    `${moduleIds.length} modules, ${atomCount} unique taught surfaces.`,
);
lines.push("");
lines.push(
  `Regenerate: \`node scripts/authoring/surfaces-index.mjs --lang ${lang}\` ` +
    `(or \`npm run authoring:surfaces -- --lang ${lang}\`).`,
);
lines.push("");
lines.push(
  `**Use this instead of \`grep -o 'surface: "[^"]*"' curriculum/m{1..N}.ts\` ` +
    `or reading compiled modules for "is X already taught" checks — same ` +
    `source of truth, already computed. Full data (with meaning/kind/id and ` +
    `the surface→first-module reverse map) is in ` +
    `\`docs/${lang}-ir-sources/surfaces-index.json\`.**`,
);
lines.push("");
lines.push("| module | surfaces |");
lines.push("|---|---|");
for (const moduleId of moduleIds) {
  const list = modules[moduleId].map((e) => e.surface).join(", ");
  lines.push(`| ${moduleId} | ${list} |`);
}
lines.push("");
writeFileSync(mdPath, lines.join("\n"));

// ── report ───────────────────────────────────────────────────────────────

const jsonBytes = Buffer.byteLength(readFileSync(jsonPath));
console.log(`wrote ${jsonPath.slice(ROOT.length + 1)} (${(jsonBytes / 1024).toFixed(1)} KB)`);
console.log(`wrote ${mdPath.slice(ROOT.length + 1)}`);
console.log(
  `${files.length} source file(s) scanned, ${atomOccurrences} atom() calls seen, ` +
    `${moduleIds.length} modules, ${atomCount} unique surfaces`,
);
if (jsonBytes > 200 * 1024) {
  console.warn(`WARNING: JSON is ${(jsonBytes / 1024).toFixed(1)} KB, over the ~200 KB budget`);
}
