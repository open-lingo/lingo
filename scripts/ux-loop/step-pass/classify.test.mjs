// Tests for the confirm/refute classifier — the false-positive killer.
// The DOM measurement is the primary source of truth; the vision model's
// quotes corroborate a measured fact, get refuted (false positive) when they
// name a measurable defect that isn't there, or land in the taste queue when
// they name something no measurement can adjudicate.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizeKind,
  factsFromMeasurement,
  classify,
  MEASURABLE_KINDS,
  TASTE_KINDS,
} from "./classify.mjs";

test("canonicalizeKind maps model synonyms onto the measurable enum", () => {
  assert.equal(canonicalizeKind("edge-bleed"), "edge-bleed");
  assert.equal(canonicalizeKind("clipped"), "clipped");
  assert.equal(canonicalizeKind("tap-target"), "tap-target");
  // free-form the model actually emits
  assert.equal(canonicalizeKind("tap target too small"), "tap-target");
  assert.equal(canonicalizeKind("element cut off by the top edge"), "clipped");
  assert.equal(canonicalizeKind("text truncates"), "truncation");
  assert.equal(canonicalizeKind("CTA below the fold"), "cta-fold");
  assert.equal(canonicalizeKind("flush against the border"), "edge-bleed");
});

test("canonicalizeKind routes unmeasurable claims to a taste kind", () => {
  assert.ok(TASTE_KINDS.includes(canonicalizeKind("weak visual hierarchy")));
  assert.ok(TASTE_KINDS.includes(canonicalizeKind("low contrast")));
  assert.ok(TASTE_KINDS.includes(canonicalizeKind("something vague")));
});

test("factsFromMeasurement turns a raw probe into normalized findings", () => {
  const facts = factsFromMeasurement({
    smallTapTargets: [{ label: "gems pill", w: 20, h: 18 }],
    edgeBleed: [{ label: "streak badge", gap: 0, edge: "right" }],
    clipped: [{ label: "island overlap", overBy: 12 }],
    truncations: [{ label: "prompt text", over: 30 }],
    stageOverflow: 222,
    ctaBelowFold: true,
    reflowOnSubmit: 14, // informational only — not turned into a fact
  });
  const kinds = facts.map((f) => f.kind).sort();
  assert.deepEqual(kinds, [
    "clipped",
    "cta-fold",
    "edge-bleed",
    "overflow",
    "tap-target",
    "truncation",
  ]);
  // every fact carries a label + a numeric-ish severity ordering
  for (const f of facts) {
    assert.ok(typeof f.label === "string");
    assert.ok(["notable", "minor", "polish"].includes(f.severity));
  }
});

test("factsFromMeasurement emits nothing when the probe is clean", () => {
  const facts = factsFromMeasurement({
    smallTapTargets: [],
    edgeBleed: [],
    clipped: [],
    truncations: [],
    stageOverflow: 0,
    ctaBelowFold: false,
    reflowOnSubmit: 0,
  });
  assert.equal(facts.length, 0);
});

test("a model claim that matches a measured fact CONFIRMS it (corroborated)", () => {
  const measurement = {
    smallTapTargets: [{ label: "gems pill", w: 20, h: 18 }],
    edgeBleed: [], clipped: [], truncations: [],
    stageOverflow: 0, ctaBelowFold: false, reflowOnSubmit: 0,
  };
  const claims = [
    { area: "gems pill", issue: "the gems pill tap area looks tiny", claim_kind: "tap-target", severity: "minor" },
  ];
  const r = classify({ claims, measurement });
  assert.equal(r.confirmed.length, 1);
  assert.equal(r.confirmed[0].corroborated, true);
  assert.equal(r.confirmed[0].claim.area, "gems pill");
  assert.equal(r.refuted.length, 0);
  assert.equal(r.stats.falsePositives, 0);
});

test("a measurable model claim with NO matching fact is REFUTED (false positive)", () => {
  const measurement = {
    smallTapTargets: [], edgeBleed: [], clipped: [], truncations: [],
    stageOverflow: 0, ctaBelowFold: false, reflowOnSubmit: 0,
  };
  const claims = [
    { area: "streak badge", issue: "the badge is clipped by the top edge", claim_kind: "clipped", severity: "notable" },
  ];
  const r = classify({ claims, measurement });
  assert.equal(r.confirmed.length, 0);
  assert.equal(r.refuted.length, 1);
  assert.equal(r.refuted[0].area, "streak badge");
  assert.equal(r.stats.falsePositives, 1);
  assert.equal(r.stats.measurableClaims, 1);
  assert.equal(r.stats.falsePositiveRate, 1);
});

test("a measured fact NO model mentioned is still a finding (model miss)", () => {
  const measurement = {
    smallTapTargets: [], edgeBleed: [{ label: "back arrow", gap: 1, edge: "left" }],
    clipped: [], truncations: [], stageOverflow: 0, ctaBelowFold: false, reflowOnSubmit: 0,
  };
  const r = classify({ claims: [], measurement });
  assert.equal(r.confirmed.length, 1);
  assert.equal(r.confirmed[0].corroborated, false); // measured, model missed it
  assert.equal(r.stats.modelMisses, 1);
});

test("taste claims land in the taste queue, never confirmed or refuted", () => {
  const measurement = {
    smallTapTargets: [], edgeBleed: [], clipped: [], truncations: [],
    stageOverflow: 0, ctaBelowFold: false, reflowOnSubmit: 0,
  };
  const claims = [
    { area: "hero card", issue: "primary action is unclear, weak hierarchy", claim_kind: "hierarchy", severity: "notable" },
    { area: "options", issue: "the option text is low contrast on the tile", claim_kind: "contrast", severity: "minor" },
  ];
  const r = classify({ claims, measurement });
  assert.equal(r.taste.length, 2);
  assert.equal(r.refuted.length, 0);
  assert.equal(r.confirmed.length, 0);
  assert.equal(r.stats.falsePositives, 0); // taste never counts against the model
});

test("vacuous claims (reassurances / kind-name dumped in issue) are dropped, not scored", () => {
  const measurement = {
    smallTapTargets: [], edgeBleed: [], clipped: [], truncations: [],
    stageOverflow: 0, ctaBelowFold: false, reflowOnSubmit: 0,
  };
  const claims = [
    { area: "cards", issue: "All cards appear large enough to tap comfortably", claim_kind: "tap-target", severity: "polish" },
    { area: "top bar", issue: "tap-target", claim_kind: "tap-target", severity: "minor" }, // kind dumped in issue
    { area: "x", issue: "", claim_kind: "clipped", severity: "minor" }, // empty
  ];
  const r = classify({ claims, measurement });
  assert.equal(r.refuted.length, 0);
  assert.equal(r.stats.falsePositives, 0);
  assert.equal(r.stats.vacuous, 3);
  assert.equal(r.stats.measurableClaims, 0);
});

test("kind is inferred from issue text when the model omits claim_kind", () => {
  const measurement = {
    smallTapTargets: [], edgeBleed: [], clipped: [], truncations: [],
    stageOverflow: 180, ctaBelowFold: false, reflowOnSubmit: 0,
  };
  const claims = [
    { area: "stage", issue: "the content overflows and the card scrolls vertically", severity: "notable" },
  ];
  const r = classify({ claims, measurement });
  assert.equal(r.confirmed.length, 1);
  assert.equal(r.confirmed[0].corroborated, true);
});
