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
const POLITE = /(です|ます|ません|ました|ましょう|ください|でした)(か)?[。？！]?\s*$/;
const isPolite = (ja: string): boolean => {
  const clauses = ja.split(/[。？！]/).filter((c) => c.trim());
  return POLITE.test((clauses.at(-1) ?? ja).trim());
};

/** Interjections carry no ですます marking of their own, so they must not be
 *  read as "plain" — 「はい」 to a teacher is perfectly polite. */
const INTERJECTION_ONLY = /^[はいええうんううんいいえ、。？！\s]*$/;

describe("a register cue must be graded (invariant 48)", () => {
  const files = readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"));

  for (const f of files) {
    it(`${f}: no step accepts the register its prompt rules out`, () => {
      const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as ModuleIR;
      const violations: string[] = [];

      for (const lesson of compileModule(ir)) {
        for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
          const prompt = String(step.promptEn ?? step.sourceText ?? step.prompt ?? "");
          const wantsPolite = /say politely/i.test(prompt);
          const wantsPlain = /say to a friend/i.test(prompt);
          if (!wantsPolite && !wantsPlain) continue;

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

      expect(violations).toEqual([]);
    });
  }
});
