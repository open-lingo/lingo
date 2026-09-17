#!/usr/bin/env node
/**
 * Whole-course Q2/Q3 measurement, per the lane brief: "Measure: run Q2 and
 * Q3 over ALL JA build/listen steps; report hit counts". Batches every
 * step's sidecar call into ONE process spawn (`tagBatch`) instead of
 * `run.mjs`'s one-lesson-at-a-time per-step calls, which would spawn a
 * fresh `fugashi.Tagger()` per step and take unreasonably long across
 * ~3,500 build/listen steps.
 *
 * Usage: node scripts/qa/procedural/measure.mjs [--out <path>]
 * Writes a JSON report `{ q2: {hits: [...], total}, q3: {hits: [...], total} }`.
 */
import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { loadModuleJson, listModuleIds, moduleNumber } from "./lib/content.mjs";
import { getAtoms } from "./lib/lexicon.mjs";
import { closeTsBridge } from "./lib/tsBridge.mjs";
import { buildKanjiIndex, reconstruct, attributeTokensToTiles, isContentToken } from "./lib/kanjiReconstruct.mjs";
import { wholeLexicon, groupTilesIntoChunks, tokenize } from "./lib/irLexicon.mjs";
import { tagBatch } from "../../lexical/ja/sidecar.mjs";

const { values } = parseArgs({ options: { out: { type: "string" } } });

async function main() {
  const lang = "ja";
  const atoms = await getAtoms(lang);
  const kanjiIndex = buildKanjiIndex(atoms);
  const moduleIds = listModuleIds(lang).filter((id) => /^m\d+$/.test(id));

  const buildSteps = []; // {moduleId, moduleNum, lessonId, step}
  const moduleVocabByModule = new Map();

  for (const moduleId of moduleIds) {
    let moduleJson;
    try {
      ({ json: moduleJson } = loadModuleJson(lang, moduleId));
    } catch {
      continue;
    }
    const moduleVocabApprox = new Set();
    for (const lesson of moduleJson.lessons) {
      for (const step of lesson.steps) {
        if (step.granularity === "character" || step.picker) continue;
        if (Array.isArray(step.tiles)) for (const t of step.tiles) moduleVocabApprox.add(t);
      }
    }
    moduleVocabByModule.set(moduleId, moduleVocabApprox);
    for (const lesson of moduleJson.lessons) {
      for (const step of lesson.steps) {
        if (
          (step.type === "build_sentence" || step.type === "listening_build") &&
          step.granularity !== "character" &&
          !step.picker &&
          Array.isArray(step.tiles) &&
          step.tiles.length > 1
        ) {
          buildSteps.push({ moduleId, moduleNum: moduleNumber(moduleId), lessonId: lesson.id, step });
        }
      }
    }
  }

  console.error(`${buildSteps.length} build/listen steps across ${moduleIds.length} modules`);

  // ---- Q2 (no sidecar needed) ----
  const q2Hits = [];
  let q2Applicable = 0;
  for (const { moduleId, lessonId, step } of buildSteps) {
    const lexicon = wholeLexicon(moduleId);
    const groups = groupTilesIntoChunks(step.targetSentence, step.correctOrder ?? step.tiles);
    if (!groups) continue;
    q2Applicable++;
    const moduleVocab = moduleVocabByModule.get(moduleId);
    const wholeSorted = [...new Set([...moduleVocab, ...lexicon])].sort((a, b) => b.length - a.length);
    let flagged = false;
    const reasons = [];
    for (const { chunk, tiles } of groups) {
      if (tiles.length < 2) continue;
      const whole = tokenize(wholeSorted, chunk);
      if (tiles.join("|") !== whole.join("|")) {
        flagged = true;
        reasons.push(`retok: "${chunk}" ${tiles.join("|")} vs whole-course ${whole.join("|")}`);
      }
    }
    if (flagged) q2Hits.push({ moduleId, lessonId, stepId: step.id, sentence: step.targetSentence, tiles: step.tiles, reasons });
  }

  // ---- Q3 (sidecar, ONE batch call) ----
  const batchItems = buildSteps.map(({ step }, i) => {
    const tiles = step.correctOrder ?? step.tiles;
    const { text } = reconstruct(tiles, kanjiIndex);
    return { id: String(i), text };
  });
  console.error("tagging batch...");
  const tagged = tagBatch(batchItems);
  console.error("tagged.");

  const q3Hits = [];
  buildSteps.forEach(({ moduleId, lessonId, step }, i) => {
    const tiles = step.correctOrder ?? step.tiles;
    const { spans } = reconstruct(tiles, kanjiIndex);
    const tokens = tagged.get(String(i)) ?? [];
    const byTile = attributeTokensToTiles(tokens, spans);
    const reasons = [];
    for (const span of spans) {
      const content = (byTile.get(span.tileIndex) ?? []).filter(isContentToken);
      if (content.length > 1) {
        reasons.push(`tile "${span.tile}" -> ${content.map((t) => `${t.surface}(${t.pos1})`).join(", ")}`);
      }
    }
    if (reasons.length > 0) q3Hits.push({ moduleId, lessonId, stepId: step.id, sentence: step.targetSentence, tiles: step.tiles, reasons });
  });

  const report = {
    totalBuildListenSteps: buildSteps.length,
    q2: { applicable: q2Applicable, hits: q2Hits.length, hitList: q2Hits },
    q3: { applicable: buildSteps.length, hits: q3Hits.length, hitList: q3Hits },
  };
  console.error(`Q2: ${q2Hits.length}/${q2Applicable} hits`);
  console.error(`Q3: ${q3Hits.length}/${buildSteps.length} hits`);

  const out = values.out ?? "/tmp/procedural-qa-measure.json";
  writeFileSync(out, JSON.stringify(report, null, 1), "utf8");
  console.error(`wrote ${out}`);

  await closeTsBridge();
}

main().catch(async (e) => {
  console.error(e);
  await closeTsBridge();
  process.exit(1);
});
