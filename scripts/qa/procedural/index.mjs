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
import * as q11 from "./checks/q11-introduces-exposure.mjs";

export const CHECKS = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11];

/**
 * Run every applicable check against one step. `ctx` carries everything a
 * check needs (see `run.mjs`'s `buildModuleCtx`/`buildStepCtx`).
 * Returns `{ [checkId]: {question, answer, evidence, enforced} }`.
 */
/**
 * A check's `enforced` export is normally a plain boolean, fixed across
 * every language (Q1/Q4/Q5/.../Q10). `export const enforced` STAYS a
 * boolean for those — this resolver only exists for a check whose measured
 * precision genuinely differs by language (Q3: JA's JMdict-first v3
 * clears 0.9 precision — enforced — but KO's Kiwi-tags-only pass measured
 * 0/8 true on a full audit, docs/procedural-qa-2026-09-17.md's Korean
 * section — below the bar, so KO's Q3 answers stay informational even
 * though JA/ES/FR's stay enforced). Such a check exports `enforced` as a
 * FUNCTION `(ctx) => boolean` instead of a plain boolean; this is the one
 * place that distinction is read, so nothing else needs to know about it.
 */
function resolveEnforced(check, ctx) {
  return typeof check.enforced === "function" ? check.enforced(ctx) : check.enforced;
}

export async function runChecks(step, ctx, { enforcedOnly = false } = {}) {
  const out = {};
  for (const check of CHECKS) {
    const enforced = resolveEnforced(check, ctx);
    if (enforcedOnly && !enforced) {
      out[check.id] = { question: check.question, answer: "n/a", evidence: ["skipped: informational-only run"], enforced: false };
      continue;
    }
    if (!check.appliesTo(step, ctx)) {
      // A check may export `naReason(step, ctx)` for a specific n/a
      // explanation (e.g. "Q4/Q10 are JA-only, no KO/ES/FR equivalent") —
      // per `docs/procedural-qa-2026-09-17.md` §1's "n/a means not
      // applicable, never silently skipped, always in the evidence"
      // doctrine, a language-scoped n/a gets a language-scoped reason, not
      // the generic step-shape fallback.
      const reason = check.naReason ? check.naReason(step, ctx) : "not applicable to this step";
      out[check.id] = { question: check.question, answer: "n/a", evidence: [reason], enforced };
      continue;
    }
    const result = await check.run(step, ctx);
    out[check.id] = { question: check.question, enforced, ...result };
  }
  return out;
}
