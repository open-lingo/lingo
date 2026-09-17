/**
 * For every question Q1..Q10: a REAL step (pulled from the shipped m34
 * runtime JSON) answers "yes" (or a defensible "n/a"), and the SAME step
 * run through the check's own `plant()` answers "no". Proves the
 * checklist can say NO, per the lane brief.
 *
 * `node --test scripts/qa/procedural/checks.test.mjs`
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { loadModuleJson, findLesson } from "./lib/content.mjs";
import { getAtoms, getCourseAtomSurfaces, getGate, getStepTaxonomy } from "./lib/lexicon.mjs";
import { closeTsBridge } from "./lib/tsBridge.mjs";
import { buildKanjiIndex } from "./lib/kanjiReconstruct.mjs";
import * as q1 from "./checks/q1-known-words.mjs";
import * as q2 from "./checks/q2-whole-word-tiles.mjs";
import * as q3 from "./checks/q3-one-content-word-per-chunk.mjs";
import * as q4 from "./checks/q4-particle-own-tile.mjs";
import * as q5 from "./checks/q5-distractor-not-correct.mjs";
import * as q6 from "./checks/q6-coverage-95.mjs";
import * as q7 from "./checks/q7-audio-exists.mjs";
import * as q8 from "./checks/q8-gloss-matches.mjs";
import * as q9 from "./checks/q9-step-variety.mjs";
import * as q10 from "./checks/q10-no-kanji-before-intro.mjs";

const LANG = "ja";
const MODULE_ID = "m34";

let ctxBase;
let lessons; // Map<lessonId, steps[]>

before(async () => {
  const { json: moduleJson } = loadModuleJson(LANG, MODULE_ID);
  const gateMod = await getGate();
  const taxMod = await getStepTaxonomy();
  const atoms = await getAtoms(LANG);
  const kanjiIndex = buildKanjiIndex(atoms);
  const moduleVocabApprox = new Set();
  for (const lesson of moduleJson.lessons) {
    for (const step of lesson.steps) {
      if (step.granularity === "character" || step.picker) continue;
      if (Array.isArray(step.tiles)) for (const t of step.tiles) moduleVocabApprox.add(t);
    }
  }
  ctxBase = {
    lang: LANG,
    moduleId: MODULE_ID,
    moduleNum: 34,
    jaSurfaces: taxMod.jaSurfaces,
    gateResidual: gateMod.gateResidual,
    selectionTypes: taxMod.SELECTION_TYPES,
    atomSurfaceSet: await getCourseAtomSurfaces(LANG),
    moduleVocabApprox,
    kanjiIndex,
  };
  lessons = new Map(moduleJson.lessons.map((l) => [l.id, l]));
});

after(async () => {
  await closeTsBridge();
});

function ctxFor(lessonId, stepId) {
  const lesson = findLessonLocal(lessonId);
  const stepIndex = lesson.steps.findIndex((s) => s.id === stepId);
  assert.ok(stepIndex >= 0, `fixture step ${stepId} not found in ${lessonId}`);
  return {
    ...ctxBase,
    lessonId,
    stepIndex,
    lessonSteps: lesson.steps,
  };
}

function findLessonLocal(lessonId) {
  const l = lessons.get(lessonId);
  assert.ok(l, `fixture lesson ${lessonId} not found`);
  return l;
}

function stepFrom(lessonId, stepId) {
  const lesson = findLessonLocal(lessonId);
  const step = lesson.steps.find((s) => s.id === stepId);
  assert.ok(step, `fixture step ${stepId} not found in ${lessonId}`);
  return step;
}

/** Run `check` on the real step, assert it is NOT "no" (yes or n/a is
 *  acceptable — some questions are legitimately n/a on a given real step),
 *  then run it on `check.plant(step, ctx)` and assert it flips to "no". */
async function assertCanSayNo(check, lessonId, stepId) {
  const real = stepFrom(lessonId, stepId);
  const ctx = ctxFor(lessonId, stepId);
  assert.ok(check.appliesTo(real, ctx), `${check.id} should apply to its own fixture step`);
  const before = await check.run(real, ctx);
  assert.notEqual(before.answer, "no", `${check.id} real fixture should not fail: ${JSON.stringify(before.evidence)}`);

  const planted = check.plant(real, ctx);
  assert.ok(check.appliesTo(planted, ctx), `${check.id} should still apply after planting`);
  const after = await check.run(planted, ctx);
  assert.equal(after.answer, "no", `${check.id} planted defect should fail: ${JSON.stringify(after.evidence)}`);
}

test("Q1 known-words", async () => {
  // tf-0's answer (のもう) IS a conjugated form gate.ts can't parse — use a
  // step whose answer is a bare, already-taught noun instead so the "real"
  // half of the assertion holds; Q1's own conjugation blind spot is
  // documented (informational) and exercised separately below.
  await assertCanSayNo(q1, "ja-m34-neo-1", "ja-m34-neo-1-rev-match-review");
});

test("Q1 known-words — documented conjugation/distractor false-positive class", async () => {
  // Real, measured limitation (see the check's own doc comment): tf-1's
  // answer いこう (volitional of いく) fails because gate.ts models
  // vocabulary, not conjugation morphology — informational, not a runner
  // bug. Asserted here so the limitation stays pinned and visible, not
  // silently rediscovered.
  const real = stepFrom("ja-m34-neo-1", "ja-m34-neo-1-tf-1");
  const ctx = ctxFor("ja-m34-neo-1", "ja-m34-neo-1-tf-1");
  const before = await q1.run(real, ctx);
  assert.equal(before.answer, "no", "if this starts passing, re-check whether Q1's conjugation gap is still real before re-enforcing it");
});

test("Q2 whole-word-tiles", async () => {
  await assertCanSayNo(q2, "ja-m34-neo-1", "ja-m34-neo-1-s-0");
});

test("Q3 one-content-word-per-chunk", async (t) => {
  const { sidecarAvailable } = await import("../../lexical/ja/sidecar.mjs");
  if (!sidecarAvailable()) {
    t.skip(
      "JA lexical sidecar not installed (cd scripts/lexical/ja && uv venv .venv --python 3.11 && uv pip install --python .venv/bin/python fugashi unidic-lite)",
    );
    return;
  }
  await assertCanSayNo(q3, "ja-m34-neo-1", "ja-m34-neo-1-s-0");
});

test("Q4 particle-own-tile", async () => {
  await assertCanSayNo(q4, "ja-m34-neo-1", "ja-m34-neo-1-s-0");
});

test("Q5 distractor-not-correct — particle_cloze", async () => {
  await assertCanSayNo(q5, "ja-m34-neo-1", "ja-m34-neo-1-cloze-1");
});

test("Q6 coverage-95", async () => {
  const real = stepFrom("ja-m34-neo-1", "ja-m34-neo-1-lc-5");
  const ctx = ctxFor("ja-m34-neo-1", "ja-m34-neo-1-lc-5");
  const planted = q6.plant(real, ctx);
  const after = await q6.run(planted, ctx);
  assert.equal(after.answer, "no", JSON.stringify(after.evidence));
  // Real-fixture "not no" is not asserted here — lc-5 already carries the
  // same documented gate.ts conjugation gap as Q1 (informational).
});

test("Q7 audio-exists", async () => {
  await assertCanSayNo(q7, "ja-m34-neo-1", "ja-m34-neo-1-s-0");
});

test("Q8 gloss-matches", async () => {
  const real = stepFrom("ja-m34-neo-1", "ja-m34-neo-1-rule-volitional-shape-u");
  const ctx = ctxFor("ja-m34-neo-1", "ja-m34-neo-1-rule-volitional-shape-u");
  ctx.stepIndex = 0; // Q8 only applies to a lesson's first step
  const before = await q8.run(real, ctx);
  assert.notEqual(before.answer, "no");

  // diagnoseModule reads IR, not the runtime step (see q8's own doc
  // comment) — prove failure by constructing a bad IR fragment directly.
  const { loadTs } = await import("./lib/tsBridge.mjs");
  const mod = await loadTs("/src/features/lesson/data/moduleCompiler.ts");
  const badIr = {
    module: "m34",
    lessons: [
      {
        id: "ja-m34-neo-1",
        beats: [],
      },
    ],
    newAtoms: [
      {
        kana: "たべなきゃ",
        derivedFrom: "たべる",
        kind: "verb-form",
        shortGloss: "the sky is blue",
      },
    ],
  };
  const diags = mod.diagnoseModule(badIr).filter((d) => d.kind === "gloss-mismatch");
  assert.ok(diags.length > 0, "diagnoseModule should flag a gloss with no content word in common with its base");
});

test("Q9 step-variety", async () => {
  const real = stepFrom("ja-m34-neo-1", "ja-m34-neo-1-rule-volitional-shape-u");
  const ctx = ctxFor("ja-m34-neo-1", "ja-m34-neo-1-rule-volitional-shape-u");
  const before = await q9.run(real, ctx);
  assert.notEqual(before.answer, "no", JSON.stringify(before.evidence));

  const plantedCtx = { ...ctx, lessonSteps: [...ctx.lessonSteps] };
  q9.plant(real, plantedCtx);
  const after = await q9.run(real, plantedCtx);
  assert.equal(after.answer, "no", JSON.stringify(after.evidence));
});

test("Q10 no-kanji-before-intro", async () => {
  await assertCanSayNo(q10, "ja-m34-neo-1", "ja-m34-neo-1-s-0");
});
