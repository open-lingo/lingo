import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMetrics } from "./kappa.mjs";

function rows(tp, fp, fn, tn) {
  const out = [];
  for (let i = 0; i < tp; i++) out.push({ label: "unnatural", predicted: "unnatural" });
  for (let i = 0; i < fp; i++) out.push({ label: "natural", predicted: "unnatural" });
  for (let i = 0; i < fn; i++) out.push({ label: "unnatural", predicted: "natural" });
  for (let i = 0; i < tn; i++) out.push({ label: "natural", predicted: "natural" });
  return out;
}

test("computeMetrics: known 2x2 table (tp=25 fp=5 fn=15 tn=55, n=100)", () => {
  const m = computeMetrics(rows(25, 5, 15, 55));
  assert.equal(m.tp, 25);
  assert.equal(m.fp, 5);
  assert.equal(m.fn, 15);
  assert.equal(m.tn, 55);
  assert.equal(m.n, 100);
  assert.equal(m.missing, 0);
  // precision = 25/30, recall = 25/40
  assert.ok(Math.abs(m.precision - 25 / 30) < 1e-9, `precision ${m.precision}`);
  assert.ok(Math.abs(m.recall - 25 / 40) < 1e-9, `recall ${m.recall}`);
  // po=0.80, pe=0.54, kappa=(0.80-0.54)/(1-0.54)=0.565217...
  assert.ok(Math.abs(m.po - 0.8) < 1e-9, `po ${m.po}`);
  assert.ok(Math.abs(m.pe - 0.54) < 1e-9, `pe ${m.pe}`);
  assert.ok(Math.abs(m.kappa - 0.5652173913) < 1e-6, `kappa ${m.kappa}`);
});

test("computeMetrics: perfect agreement -> kappa=1, precision=recall=1", () => {
  const m = computeMetrics(rows(10, 0, 0, 20));
  assert.equal(m.kappa, 1);
  assert.equal(m.precision, 1);
  assert.equal(m.recall, 1);
});

test("computeMetrics: judge always says the SAME class as the true majority class -> chance-level kappa near 0", () => {
  // Judge predicts "natural" for every row regardless of the true label:
  // tp=0 (never predicts unnatural), fp=0, fn = all actual-unnatural, tn = all actual-natural.
  const m = computeMetrics(rows(0, 0, 10, 40));
  assert.equal(m.tp, 0);
  assert.equal(m.precision, null, "precision is undefined when the judge never predicts positive");
  assert.equal(m.recall, 0);
  // po = tn/n = 40/50 = 0.8; predPosRate = 0 so pe = actualPosRate*0 + (1-actualPosRate)*1 = 1-actualPosRate = 0.8
  // kappa = (0.8-0.8)/(1-0.8) = 0
  assert.ok(Math.abs(m.kappa - 0) < 1e-9, `kappa ${m.kappa}`);
});

test("computeMetrics: total disagreement -> kappa can be negative", () => {
  // Judge predicts the OPPOSITE of the true label every time.
  const m = computeMetrics(rows(0, 20, 20, 0));
  assert.ok(m.kappa < 0, `expected negative kappa, got ${m.kappa}`);
});

test("computeMetrics: missing predictions are excluded from all counts, not treated as true negatives", () => {
  const scored = [
    { label: "unnatural", predicted: "unnatural" },
    { label: "natural", predicted: "natural" },
    { label: "unnatural", predicted: null }, // model failed to return this row_id
    { label: "natural", predicted: null },
  ];
  const m = computeMetrics(scored);
  assert.equal(m.missing, 2);
  assert.equal(m.n, 2, "the two missing rows must not count toward n");
  assert.equal(m.tp, 1);
  assert.equal(m.tn, 1);
});

test("computeMetrics: empty input -> all null/zero, no throw", () => {
  const m = computeMetrics([]);
  assert.equal(m.n, 0);
  assert.equal(m.precision, null);
  assert.equal(m.recall, null);
  assert.equal(m.kappa, null);
});

test("computeMetrics: pe=1 degenerate case (every row predicted+labelled the same single class) -> kappa=1, not NaN", () => {
  // All rows are natural/natural: actualPosRate=0, predPosRate=0 -> pe = 0*0 + 1*1 = 1, po=1.
  const m = computeMetrics(rows(0, 0, 0, 15));
  assert.equal(m.pe, 1);
  assert.equal(m.kappa, 1);
});
