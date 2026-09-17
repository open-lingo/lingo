#!/usr/bin/env node
/**
 * Procedural QA runner — one question at a time, yes/no-graded, every
 * question backed by a tool. See `docs/procedural-qa-2026-09-17.md`.
 *
 * Usage:
 *   node scripts/qa/procedural/run.mjs --lang ja --lesson ja-m34-neo-7
 *   node scripts/qa/procedural/run.mjs --lang ja --module m34
 *   node scripts/qa/procedural/run.mjs --lang ja --module m34 --json
 *
 * Exit 1 if any ENFORCED question answers "no" anywhere in scope.
 */
import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { loadModuleJson, findLesson, moduleNumber, listModuleIds } from "./lib/content.mjs";
import { getAtoms, getAtomKanaSet, getCourseAtomSurfaces, getGate, getStepTaxonomy } from "./lib/lexicon.mjs";
import { closeTsBridge } from "./lib/tsBridge.mjs";
import { buildKanjiIndex } from "./lib/kanjiReconstruct.mjs";
import { CHECKS, runChecks } from "./index.mjs";
import { sidecarAvailable, tagBatch } from "../../lexical/ja/sidecar.mjs";
import { jmdictAvailable } from "./lib/jmdict.mjs";
import { moduleCacheKey, readModuleVerdicts, writeModuleVerdicts } from "./lib/verdictCache.mjs";

const { values } = parseArgs({
  options: {
    lang: { type: "string", default: "ja" },
    lesson: { type: "string" },
    module: { type: "string" },
    json: { type: "boolean", default: false },
    "enforced-only": { type: "boolean", default: false },
    "informational-summary": { type: "boolean", default: false },
    "no-cache": { type: "boolean", default: false },
    out: { type: "string" },
  },
});

function verdictChar(v) {
  if (v === "yes") return "✓";
  if (v === "no") return "✗";
  return "–";
}

async function main() {
  const lang = values.lang;
  const gateMod = await getGate();
  const taxMod = await getStepTaxonomy();
  const atoms = await getAtoms(lang);
  // Q4 mirrors particleTileSeparation.test.ts's OWN atom source exactly —
  // see lib/lexicon.mjs's getCourseAtomSurfaces doc comment for why this is
  // NOT the same set as getNormalizedCourseAtoms's kana-normalized display.
  const atomSurfaceSet = await getCourseAtomSurfaces(lang);
  const atomKanaSet = await getAtomKanaSet(lang);
  const kanjiIndex = buildKanjiIndex(atoms);

  const moduleIds = values.module ? [values.module] : values.lesson ? [inferModuleFromLesson(values.lesson)] : listModuleIds(lang);

  // Pre-warm the JA lexical sidecar's on-disk cache with ONE batched spawn
  // for every distinct tile surface in scope, before Q3 (`decomposeTile`'s
  // step-5 fallback) ever calls `tagOne` one tile at a time. Cost measured
  // 2026-09-17: a cold cache (fresh checkout, CI) with per-tile calls took
  // an enforced-only 46-module run from ~19s to 36s+ (each cache-miss
  // spawns its own `fugashi.Tagger()`, which pays UniDic's load cost
  // every time) — this collapses that to one spawn regardless of scope
  // size. Requirement: `docs/procedural-qa-2026-09-17.md` §5 (keep the
  // vitest ratchet under budget).
  if (lang === "ja" && sidecarAvailable() && jmdictAvailable()) {
    const distinctTileTexts = new Set();
    for (const moduleId of moduleIds) {
      let moduleJson;
      try {
        ({ json: moduleJson } = loadModuleJson(lang, moduleId));
      } catch {
        continue;
      }
      for (const lesson of moduleJson.lessons) {
        for (const step of lesson.steps) {
          if (!Array.isArray(step.tiles)) continue;
          for (const tile of step.correctOrder ?? step.tiles) {
            distinctTileTexts.add(kanjiIndex.get(tile) ?? tile);
          }
        }
      }
    }
    tagBatch([...distinctTileTexts].map((text, i) => ({ id: String(i), text })));
  }

  const rows = [];
  let anyEnforcedFail = false;
  const failsByQuestion = {};

  for (const moduleId of moduleIds) {
    const { json: moduleJson } = loadModuleJson(lang, moduleId);
    const moduleNum = moduleNumber(moduleId);

    // Whole-module tile vocabulary (Q2's `vocabModuleApprox` — see
    // `lib/irLexicon.mjs`'s doc comment).
    const moduleVocabApprox = new Set();
    for (const lesson of moduleJson.lessons) {
      for (const step of lesson.steps) {
        // Character-granularity drills tile individual kana as filler
        // ("distractor kana" for a build-the-word exercise) — including
        // those in the module's word vocabulary contaminates Q2's
        // retokenizer with stray single-kana "known words" (measured;
        // see docs/procedural-qa-2026-09-17.md).
        if (step.granularity === "character" || step.picker) continue;
        if (Array.isArray(step.tiles)) for (const t of step.tiles) moduleVocabApprox.add(t);
      }
    }

    // Per-module verdict cache (docs/procedural-qa-2026-09-17.md §6/§8b):
    // a whole-module `--lesson`-scoped run is a debugging subset, not the
    // module's full verdict set, so it never reads/writes the cache — the
    // cache always stores (and is only trusted for) the FULL module.
    const cacheEligible = !values.lesson && !values["no-cache"];
    const mode = values["enforced-only"] ? "enforced" : "full";
    const cacheKey = cacheEligible ? moduleCacheKey({ lang, moduleId, mode, moduleJson }) : null;
    const cached = cacheKey ? readModuleVerdicts(cacheKey) : null;

    let moduleRows;
    if (cached) {
      moduleRows = cached;
    } else {
      moduleRows = [];
      const lessons = values.lesson ? [findLesson(moduleJson, values.lesson)] : moduleJson.lessons;
      for (const lesson of lessons) {
        for (let stepIndex = 0; stepIndex < lesson.steps.length; stepIndex++) {
          const step = lesson.steps[stepIndex];
          const ctx = {
            lang,
            moduleId,
            moduleNum,
            lessonId: lesson.id,
            stepIndex,
            lessonSteps: lesson.steps,
            jaSurfaces: taxMod.jaSurfaces,
            gateResidual: gateMod.gateResidual,
            selectionTypes: taxMod.SELECTION_TYPES,
            atomSurfaceSet,
            atomKanaSet,
            moduleVocabApprox,
            kanjiIndex,
          };
          const results = await runChecks(step, ctx, { enforcedOnly: values["enforced-only"] });
          moduleRows.push({ lessonId: lesson.id, stepId: step.id, stepType: step.type, results });
        }
      }
      if (cacheKey) writeModuleVerdicts(cacheKey, moduleRows);
    }

    for (const row of moduleRows) {
      rows.push(row);
      for (const [qid, r] of Object.entries(row.results)) {
        if (r.enforced && r.answer === "no") {
          anyEnforcedFail = true;
          (failsByQuestion[qid] ??= []).push({ lessonId: row.lessonId, stepId: row.stepId, evidence: r.evidence });
        }
      }
    }
  }

  if (values.out) {
    writeFileSync(values.out, JSON.stringify({ rows, anyEnforcedFail, failsByQuestion }), "utf8");
  } else if (values.json) {
    console.log(JSON.stringify({ rows, anyEnforcedFail, failsByQuestion }, null, 2));
  } else {
    printTable(rows);
    printFailures(failsByQuestion);
  }

  if (values["informational-summary"]) {
    if (values["enforced-only"]) {
      console.log(
        "\n[informational-summary] skipped — --enforced-only never computes informational questions (run without it for real counts)",
      );
    } else {
      printInformationalSummary(rows);
    }
  }

  await closeTsBridge();
  process.exit(anyEnforcedFail ? 1 : 0);
}

function inferModuleFromLesson(lessonId) {
  const m = /^[a-z]+-(m\d+)/.exec(lessonId);
  if (!m) throw new Error(`cannot infer module from lesson id "${lessonId}"`);
  return m[1];
}

function printTable(rows) {
  const qids = CHECKS.map((c) => c.id);
  const header = ["step".padEnd(38), ...qids].join(" ");
  console.log(header);
  for (const row of rows) {
    const cells = qids.map((qid) => verdictChar(row.results[qid].answer));
    console.log([`${row.lessonId}/${row.stepId}`.slice(0, 38).padEnd(38), ...cells].join(" "));
  }
}

/**
 * `--informational-summary`: aggregate "no" counts for every question the
 * code itself marks `enforced: false` (derived from `CHECKS`, not a
 * hand-maintained list — see `docs/procedural-qa-2026-09-17.md` §1's "n/a
 * means not applicable, never silently skipped" doctrine: this reads the
 * SAME `rows` the table/failures already printed, no separate scan).
 * Replaces the informational report that used to live inside
 * `src/test/proceduralQa.test.ts` (moved out 2026-09-17 — CI already
 * skipped it, and it was the local preflight's long pole; see that file's
 * history and docs/procedural-qa-2026-09-17.md §6).
 */
function printInformationalSummary(rows) {
  const informationalIds = CHECKS.filter((c) => !c.enforced).map((c) => c.id);
  const counts = Object.fromEntries(informationalIds.map((qid) => [qid, 0]));
  for (const row of rows) {
    for (const qid of informationalIds) {
      if (row.results[qid]?.answer === "no") counts[qid] += 1;
    }
  }
  console.log(`\n[informational-summary] ${JSON.stringify(counts)}`);
}

function printFailures(failsByQuestion) {
  const qids = Object.keys(failsByQuestion);
  if (qids.length === 0) {
    console.log("\nno enforced-question failures");
    return;
  }
  console.log("\nenforced-question failures:");
  for (const qid of qids) {
    for (const f of failsByQuestion[qid]) {
      console.log(`  [${qid}] ${f.lessonId}/${f.stepId}`);
      for (const e of f.evidence) console.log(`      ${e}`);
    }
  }
}

main().catch(async (err) => {
  console.error(err);
  await closeTsBridge();
  process.exit(1);
});
