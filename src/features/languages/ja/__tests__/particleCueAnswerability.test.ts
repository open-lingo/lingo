import { describe, expect, it } from "vitest";

// @ts-expect-error -- plain .mjs tool, no types; the shapes are asserted below.
import { scanParticleCues } from "../../../../../scripts/particle-cue-scan.mjs";

type Finding = {
  lang: string;
  module: string;
  particle: string;
  ja: string;
  en: string;
  mode: string;
  tier: "graded" | "card" | "dialogue";
};

/**
 * Spencer, walking ja m29 (2026-09-01): "it keeps asking for desune but nothing
 * indicates it, we arent having any other acceptible gradings either, this is a
 * miserable failure point when testing out since answers are wrong."
 *
 * An exercise whose target ends in ね/よ needs the ENGLISH to carry that stance,
 * because those particles encode nothing propositional — they aim the sentence
 * at the listener (ね collects agreement, よ hands over news). Without the tag
 * the learner translates exactly what was asked and is marked wrong, with no
 * way to have known better.
 *
 * This is invisible to review: the rule cards for the very same sentences were
 * cued correctly, and only the exercise prompts dropped the tag, so each lesson
 * reads fine in isolation and fails only when somebody answers it. Hence a gate
 * rather than another read-through.
 *
 * Scope note: GRADED only. Dialogue lines are read, not answered — 「いいね。」
 * really is just "Nice." — and forcing a tag onto every one would make the
 * English stilted, which is a worse defect than the one being fixed.
 */
describe("sentence-final particles are cued by the English prompt", () => {
  const { scanned, findings } = scanParticleCues() as {
    scanned: number;
    findings: Finding[];
  };

  it("scans a meaningful number of particle-bearing targets", () => {
    // Guards against the scan silently finding nothing (bad path, renamed dir)
    // and thereby passing green while checking absolutely nothing.
    expect(scanned).toBeGreaterThan(100);
  });

  it("has no graded exercise demanding a particle the English never asks for", () => {
    const unanswerable = findings.filter((f) => f.tier === "graded");
    expect(
      unanswerable.map((f) => `${f.module} [${f.particle}] ${f.ja} — "${f.en}"`),
    ).toEqual([]);
  });

  it("has no rule-card example that glosses the particle away", () => {
    const uncuedCards = findings.filter((f) => f.tier === "card");
    expect(
      uncuedCards.map((f) => `${f.module} [${f.particle}] ${f.ja} — "${f.en}"`),
    ).toEqual([]);
  });
});
