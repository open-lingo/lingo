#!/usr/bin/env node
/**
 * Whole-course Q2/Q3 measurement (v3, dictionary-first — see the checks'
 * own doc comments and `docs/procedural-qa-2026-09-17.md` §3 for what
 * changed from v2). Batches every tile's sidecar call into ONE process
 * spawn up front (pre-warming `sidecar.mjs`'s on-disk cache) instead of
 * letting each step's `decomposeTile` fallback spawn its own `fugashi.Tagger()`
 * — v3 rarely needs the tagger at all (JMdict/atom/deconjugation resolve
 * most tiles directly), but whatever residual calls DO happen should hit
 * a warm cache, not a cold spawn per call.
 *
 * Usage: node scripts/qa/procedural/measure.mjs [--out <path>] [--sample-seed <n>]
 * Writes a JSON report `{ q2: {hits, applicable, hitList}, q3: {...} }`
 * plus a deterministic random SAMPLE of up to 60 hits per question for
 * hand audit (`sampleQ2`/`sampleQ3` in the report).
 */
import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { loadModuleJson, listModuleIds, moduleNumber } from "./lib/content.mjs";
import { getAtoms, getAtomKanaSet } from "./lib/lexicon.mjs";
import { closeTsBridge } from "./lib/tsBridge.mjs";
import { buildKanjiIndex } from "./lib/kanjiReconstruct.mjs";
import { groupTilesIntoChunks, chunkBoundaryHits, wholeLexicon } from "./lib/irLexicon.mjs";
import { isCommonKanaEntry, hasKanaEntry } from "./lib/jmdict.mjs";
import { decomposeTile, buildTileMorphologyCtx } from "./lib/tileMorphology.mjs";
import { tagBatch } from "../../lexical/ja/sidecar.mjs";

const { values } = parseArgs({ options: { out: { type: "string" }, "sample-seed": { type: "string" } } });

// Small deterministic PRNG (mulberry32) so `--sample-seed` reproduces the
// same "random" audit sample across runs — the audit itself is manual
// (a human reads each sampled hit), so reproducibility matters more than
// cryptographic randomness.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(list, n, rng) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

async function main() {
  const lang = "ja";
  const atoms = await getAtoms(lang);
  const atomKanaSet = await getAtomKanaSet(lang);
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

  const morphCtx = buildTileMorphologyCtx({ kanjiIndex, atomKanaSet });

  // ---- Pre-warm the sidecar cache: batch-tag every distinct tile's
  // kanji-reconstructed surface once, up front, so decomposeTile's step-5
  // fallback (tagOne) never spawns a fresh process mid-scan. ----
  const distinctTileTexts = new Set();
  for (const { step } of buildSteps) {
    for (const tile of step.correctOrder ?? step.tiles) {
      distinctTileTexts.add(kanjiIndex.get(tile) ?? tile);
    }
  }
  console.error(`pre-warming sidecar cache for ${distinctTileTexts.size} distinct tile surfaces...`);
  tagBatch([...distinctTileTexts].map((text, i) => ({ id: String(i), text })));
  console.error("pre-warmed.");

  // ---- Q2 v3 ---- ("course atom" = wholeLexicon (IR lexiconKanas, incl.
  // derivedFrom forms like たべすぎた) ∪ this module's own shipped tile
  // vocabulary — see q2-whole-word-tiles.mjs's isQualifyingSpan doc
  // comment for why this is NOT the same set as Q3's atomKanaSet.
  const q2Hits = [];
  let q2Applicable = 0;
  for (const { moduleId, lessonId, step } of buildSteps) {
    const groups = groupTilesIntoChunks(step.targetSentence, step.correctOrder ?? step.tiles);
    if (!groups) continue;
    q2Applicable++;
    const moduleVocabApprox = moduleVocabByModule.get(moduleId);
    const lexicon = wholeLexicon(moduleId);
    const isQualifying = (text) => isCommonKanaEntry(text) || moduleVocabApprox.has(text) || lexicon.has(text);
    // NOT moduleVocabApprox here — see q2-whole-word-tiles.mjs's
    // isIndependentWord doc comment: it's vacuously true for both
    // flanking tiles of every boundary (they're shipped tiles too),
    // which produced 0 hits course-wide when first tried. atomKanaSet IS
    // included (unfiltered course atoms, e.g. the 2-kana ぷん counter
    // atom `wholeLexicon`'s >=3 filter drops) — see the same doc comment.
    const isIndependent = (text) => hasKanaEntry(text) || lexicon.has(text) || atomKanaSet.has(text);
    const reasons = [];
    for (const { chunk, tiles } of groups) {
      if (tiles.length < 2) continue;
      const hits = chunkBoundaryHits(tiles, isQualifying, isIndependent);
      for (const h of hits) {
        reasons.push(
          `chunk "${chunk}": "${h.tileLeft}"|"${h.tileRight}" cut by "${h.merged}" (pieces "${h.pieceLeft}"/"${h.pieceRight}")`,
        );
      }
    }
    if (reasons.length > 0) {
      q2Hits.push({ moduleId, lessonId, stepId: step.id, sentence: step.targetSentence, tiles: step.tiles, reasons });
    }
  }

  // ---- Q3 v3 ---- (courseLexicon is whole-course regardless of moduleId,
  // but buildTileMorphologyCtx wants one to key the IR-file read — cheap,
  // `wholeLexicon` caches by moduleId internally).
  const q3Hits = [];
  for (const { moduleId, lessonId, step } of buildSteps) {
    const stepMorphCtx = { ...morphCtx, courseLexicon: wholeLexicon(moduleId) };
    const tiles = step.correctOrder ?? step.tiles;
    const reasons = [];
    for (const tile of tiles) {
      const { chunks, reason } = decomposeTile(tile, stepMorphCtx);
      if (chunks > 1) reasons.push(`tile "${tile}": ${chunks} content morphemes — ${reason}`);
    }
    if (reasons.length > 0) {
      q3Hits.push({ moduleId, lessonId, stepId: step.id, sentence: step.targetSentence, tiles: step.tiles, reasons });
    }
  }

  const seed = values["sample-seed"] ? Number(values["sample-seed"]) : 20260917;
  const sampleQ2 = q2Hits.length <= 60 ? q2Hits : sample(q2Hits, 60, mulberry32(seed));
  const sampleQ3 = q3Hits.length <= 60 ? q3Hits : sample(q3Hits, 60, mulberry32(seed + 1));

  const report = {
    totalBuildListenSteps: buildSteps.length,
    q2: { applicable: q2Applicable, hits: q2Hits.length, hitList: q2Hits },
    q3: { applicable: buildSteps.length, hits: q3Hits.length, hitList: q3Hits },
    sampleQ2,
    sampleQ3,
    sampleSeed: seed,
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
