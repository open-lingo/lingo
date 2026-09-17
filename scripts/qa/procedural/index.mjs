/**
 * The procedural QA question registry — Q1..Q10, in the lead's design
 * order. Import this (not the individual check files directly) from a
 * runner or test so the set stays one place.
 */
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

export const CHECKS = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10];

/**
 * Run every applicable check against one step. `ctx` carries everything a
 * check needs (see `run.mjs`'s `buildModuleCtx`/`buildStepCtx`).
 * Returns `{ [checkId]: {question, answer, evidence, enforced} }`.
 */
export async function runChecks(step, ctx, { enforcedOnly = false } = {}) {
  const out = {};
  for (const check of CHECKS) {
    if (enforcedOnly && !check.enforced) {
      out[check.id] = { question: check.question, answer: "n/a", evidence: ["skipped: informational-only run"], enforced: false };
      continue;
    }
    if (!check.appliesTo(step, ctx)) {
      out[check.id] = { question: check.question, answer: "n/a", evidence: ["not applicable to this step"], enforced: check.enforced };
      continue;
    }
    const result = await check.run(step, ctx);
    out[check.id] = { question: check.question, enforced: check.enforced, ...result };
  }
  return out;
}
