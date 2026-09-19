import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";

/**
 * A REGISTER CUE MUST BE GRADED (invariant 48, 2026-07-27).
 *
 * m7 — the module that introduces ます — shipped five `translate` steps
 * prompting "Say politely: I drink water" while explicitly accepting the
 * PLAIN 「みずを のむ。」 as correct. The prompt asked for one register and
 * the grader accepted either, so a learner could type the wrong register for
 * a whole module and never be told.
 *
 * That is the documented L2 failure mode, not a hypothetical: Marriott (1995)
 * found learners "could rarely remember having received negative feedback
 * about their stylistic choice, and several revealed their belief that
 * without any correction they assumed their language behavior was
 * acceptable." The structural reason it cannot self-correct is that the input
 * is NON-RECIPROCAL — a senior speaks plain toward the learner while the
 * learner is expected to speak polite back, so the form the learner must
 * produce is never modelled for their own role. Exposure alone cannot fix it;
 * corrective feedback is the only channel, and silently accepting both
 * registers closes that channel.
 *
 * Max-acceptance grading (accept every correct rendering — scrambled order,
 * optional particles) is still the rule. This is its ONE carve-out: when the
 * prompt names the audience, the register IS the tested variable, and the
 * other register is a wrong answer.
 */
const IR_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../curriculum/ir",
);

/** Final predicate is ですます-marked. Checked on the LAST clause so that
 *  「はい、いきます。」 reads polite and 「うん、いく。」 reads plain. */
// The question particle か may follow any of these (ですか / ますか / ませんか),
// so it is an optional suffix rather than a listed alternative — spelling out
// only `ますか` made 「めがねですか。」 read as PLAIN and produced six false
// positives on m7's own review and challenge lessons.
//
// ましょう ADDED 2026-07-27 (m24, spine tile s21). The volitional is a cell of
// the same ます paradigm as ます / ません / ました — 「いっしょに たべましょう。」
// is unambiguously polite — but it was unreachable before m24 authored one, so
// the detector read every ましょう as PLAIN and flagged three "Say politely:"
// steps that were correct. Widening the POLITE set can only remove FALSE
// positives here: no plain form ends in ましょう, so nothing that used to fail
// legitimately now passes.
//
// よ / ね ADDED 2026-07-27 (m29, spine tile s25 — the register module). The
// regex anchored the ですます marker at the very end of the last clause, so a
// polite sentence carrying a sentence-final particle read as PLAIN. Dumped
// before the edit: m29's 「ごぜんに たまごを かいましたよ。」, prompted "Say
// politely: I bought some eggs this morning", was reported three times (once
// per accepted punctuation variant) as accepting a plain answer — and it is
// not plain, it is 〜ました with よ on the outside, which is exactly what m29's
// yo-emphasis card teaches ("the politeness is decided before よ arrives").
// This is the same widening the ましょう note above describes and it is safe
// for the same reason: no PLAIN form ends in ますよ, ですね, ませんよ or ましたね,
// so admitting an optional よ/ね after the marker can only remove FALSE
// positives. Nothing that used to fail legitimately now passes.
const POLITE = /(です|ます|ません|ました|ましょう|ください|でした)(か)?(よ|ね)?[。？！]?\s*$/;
const isPolite = (ja: string): boolean => {
  const clauses = ja.split(/[。？！]/).filter((c) => c.trim());
  return POLITE.test((clauses.at(-1) ?? ja).trim());
};

/** Interjections carry no ですます marking of their own, so they must not be
 *  read as "plain" — 「はい」 to a teacher is perfectly polite. */
const INTERJECTION_ONLY = /^[はいええうんううんいいえ、。？！\s]*$/;

/**
 * Pure per-file walk — no shared/mutable state. Both `it`s below call this
 * directly instead of one accumulating into a closure variable the other
 * reads: the accumulator version summed `cued` across per-file `it`
 * callbacks into `cuedStepsSeen`, then read it in a final "is not vacuous"
 * `it` that assumed it always runs LAST. That's an execution-order
 * assumption, not a declaration-order one — `--sequence.shuffle` reorders
 * `it` execution (TESTAUDIT lane, 2026-09-18: reproduced with
 * `--maxWorkers=1 --sequence.shuffle --sequence.seed=1`, which ran the
 * vacuity check before some per-file its had populated the counter and
 * failed on a partial count). Recomputing per file here is cheap (a sync
 * JSON read + compile) and makes every `it` — including the vacuity
 * check — independent of what ran before it.
 */
function auditFile(f: string): { violations: string[]; cued: number } {
  const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as ModuleIR;
  const violations: string[] = [];
  let cued = 0;

  for (const lesson of compileModule(ir)) {
    for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
      // READ THE STRUCTURED CUE, NOT THE PROMPT STRING.
      //
      // This used to regex `/say politely/i` over the prompt, which
      // worked only while the cue lived INSIDE the English. The compiler
      // now lifts it into `step.registerCue` and the prompt is the clean
      // gloss (`data/registerCue.ts`), so the old regex could never match
      // again — every step would have hit `continue` and this gate would
      // have reported green while checking nothing. The structured field
      // is also STRICTLY wider: the regex saw two of the eleven authored
      // cue variants, this sees all of them (m7's "Say very politely",
      // m10's "Say to a teacher", m35's "Ask Ken (a friend)" …).
      const cue = step.registerCue as { form?: string } | undefined;
      const wantsPolite = cue?.form === "polite";
      const wantsPlain = cue?.form === "plain";
      if (!wantsPolite && !wantsPlain) continue;
      cued++;
      const prompt = String(step.promptEn ?? step.sourceText ?? step.prompt ?? "");

      const accepted = (step.acceptedAnswers as string[] | undefined) ?? [];
      for (const a of accepted) {
        if (INTERJECTION_ONLY.test(a)) continue;
        const politeAnswer = isPolite(a);
        if ((wantsPolite && !politeAnswer) || (wantsPlain && politeAnswer))
          violations.push(
            `${step.id as string}: prompt "${prompt}" accepts "${a}" ` +
              `(${politeAnswer ? "polite" : "plain"}) — the cue names the ` +
              `audience, so the other register is WRONG, not an alternate ` +
              `rendering`,
          );
      }
    }
  }

  return { violations, cued };
}

describe("a register cue must be graded (invariant 48)", () => {
  const files = readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"));

  for (const f of files) {
    it(`${f}: no step accepts the register its prompt rules out`, () => {
      expect(auditFile(f).violations).toEqual([]);
    });
  }

  it("is not vacuous — the walk actually reaches cued steps", () => {
    // The whole reason the string regex this replaced was able to rot
    // silently is that nothing asserted the loop ever entered its body.
    // Sums a fresh `auditFile` call per file rather than reading a value
    // the per-file its above populated — independent of `it` execution
    // order (see `auditFile`'s doc comment).
    const cuedStepsSeen = files.reduce((sum, f) => sum + auditFile(f).cued, 0);
    expect(cuedStepsSeen, "compiled steps carrying a register cue").toBeGreaterThan(800);
  });
});
