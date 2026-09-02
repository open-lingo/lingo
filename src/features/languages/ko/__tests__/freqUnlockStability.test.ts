/**
 * KO frequency-registry unlock-stability ratchet.
 *
 * The registry (../frequencyAtoms.ts) is GENERATED, and its `unlockModule`
 * values ARE the live optional-vocab drip — a learner mid-course has already
 * seen part of it. Before the freqRank stabilizer (ported from JA's explicit
 * `freqRank` pattern, 2026-09-01), regeneration re-derived dense positional
 * ranks, and the 2026-08-26 homograph-aware re-ingest dry-run moved 562 atoms'
 * unlockModule with ZERO id changes — a silent wholesale reshuffle. The
 * stabilizer (scripts/ingest-ko-frequency.mjs) pins existing ids to their
 * committed frequencyRank; this test is the ratchet that catches a regen that
 * bypassed it (e.g. `--rebase-ranks` run without review, or a stabilizer bug).
 *
 * Fixture: freqRankBaseline.json — id → [frequencyRank, unlockModule],
 * snapshotted from the accepted committed registry. Refresh it ONLY as the
 * deliberate second half of a reviewed drip re-base:
 *   node scripts/ingest-ko-frequency.mjs --write-rank-baseline
 *
 * Mirrors the JA guarantees in ../../frequencyAtoms.test.ts ("explicit, unique
 * freqRank"): rank VALUE drives the bucket, gaps are fine (a removed id
 * retires its rank), new atoms append past the baseline max — they must never
 * displace an existing atom's drip position.
 */
import { describe, it, expect } from "vitest";

import { KO_FREQUENCY_ATOMS } from "../frequencyAtoms";
import baseline from "./freqRankBaseline.json";

const BASELINE = new Map(
  Object.entries(baseline as Record<string, number[]>).map(
    ([id, [rank, module]]) => [id, { rank, module }],
  ),
);

describe("KO frequency unlock stability (regen ratchet)", () => {
  const byId = new Map(KO_FREQUENCY_ATOMS.map((a) => [a.id, a]));

  it("baseline fixture is non-trivial and well-formed", () => {
    expect(BASELINE.size).toBeGreaterThanOrEqual(2998);
    for (const [id, e] of BASELINE) {
      expect(id.startsWith("ko:"), id).toBe(true);
      expect(Number.isInteger(e.rank), `${id} rank`).toBe(true);
      expect(Number.isInteger(e.module), `${id} module`).toBe(true);
    }
  });

  it("every baseline atom is still in the registry (removals are deliberate re-bases)", () => {
    // A frequency atom is an SRS card a learner may hold — dropping one is a
    // conscious act, not regen fallout. If reviewed and intended: refresh the
    // fixture (--write-rank-baseline) in the same change.
    const removed = [...BASELINE.keys()].filter((id) => !byId.has(id));
    expect(removed, `baseline atoms missing from registry: ${removed.slice(0, 10).join(", ")}`)
      .toEqual([]);
  });

  it("existing atoms keep their baseline frequencyRank (the stabilizer's pin)", () => {
    const moved: string[] = [];
    for (const [id, e] of BASELINE) {
      const atom = byId.get(id);
      if (atom && atom.frequencyRank !== e.rank) {
        moved.push(`${id}: rank ${e.rank}→${atom.frequencyRank}`);
      }
    }
    expect(moved, `pinned ranks moved (unreviewed re-base?): ${moved.slice(0, 10).join(", ")}`)
      .toEqual([]);
  });

  it("existing atoms keep their baseline unlockModule (the live drip)", () => {
    // Redundant with rank pinning while gating math is fixed — but a change to
    // frequencyRankToModule / KO_FREQ_LAST_MODULE also moves the drip, and
    // must trip this gate rather than slide through on stable ranks.
    const moved: string[] = [];
    for (const [id, e] of BASELINE) {
      const atom = byId.get(id);
      if (atom && atom.unlockModule !== e.module) {
        moved.push(`${id}: m${e.module}→m${atom.unlockModule}`);
      }
    }
    expect(moved, `unlockModule drip moved: ${moved.slice(0, 10).join(", ")}`).toEqual([]);
  });

  it("new atoms append past the baseline ranks — never displacing existing ones", () => {
    const maxBaselineRank = Math.max(...[...BASELINE.values()].map((e) => e.rank));
    const displaced = KO_FREQUENCY_ATOMS.filter(
      (a) => !BASELINE.has(a.id) && a.frequencyRank <= maxBaselineRank,
    ).map((a) => `${a.id} (rank ${a.frequencyRank})`);
    expect(
      displaced,
      `new atoms slotted inside the pinned range: ${displaced.slice(0, 10).join(", ")}`,
    ).toEqual([]);
  });

  it("frequencyRank stays unique across the registry", () => {
    const ranks = KO_FREQUENCY_ATOMS.map((a) => a.frequencyRank);
    expect(new Set(ranks).size).toBe(ranks.length);
  });
});
