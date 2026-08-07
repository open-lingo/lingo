/**
 * THE STICKY ACTION BAR, AS A ROLL CALL.
 *
 * `index.css` § "Lesson action bar" pins any `[data-testid="primary-cta"]`
 * inside `[data-lesson-stage]` to the bottom of the stage scroller, so long
 * content scrolls UNDER the CTA instead of pushing it off (Spencer QA
 * 2026-08-05: "the continue button was falling off my screen"). The rule is a
 * no-op on viewports where the step already fits.
 *
 * The catch is that it is OPT-IN, and the 2026-08-05 pass reached 11 of 26
 * step views. The other 15 kept the exact bug the rule exists to fix, silently
 * — `dialogue_listen` surfaced it on 2026-08-06 (options 48px below the fold,
 * CTA 152px below at 900×700) and `conjugation_transform` had it at 560px.
 * Nothing failed; you just had to be on a short enough window to see it.
 *
 * So this is a roll call, not a style rule: a step view that renders a
 * ContinueButton either opts in or is named below with a reason. The list is a
 * RATCHET — it may shrink, never grow.
 *
 * NOT every step should opt in. A read-gated card (`grammar_rule`) puts its
 * CTA at the END of content deliberately: floating it to the bottom edge lets
 * a learner continue without scrolling through the card, which defeats the
 * gate. Those entries are decisions, not debt.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const STEPS_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Step views that render a CTA without the sticky hook.
 *
 * Split by WHY, because the two halves have opposite futures: the first is a
 * deliberate design decision, the second is untriaged debt from the original
 * pass and should shrink to nothing.
 */
const NOT_STICKY = new Set([
  // ── Deliberate: the CTA must sit after the content, not over it. ──
  "GrammarRuleStepView.tsx", // read gate — floating the CTA skips the reading
  "InfoStepView.tsx", // same shape: passive card, read then continue
  "PhraseCardStepView.tsx", // passive card
  "KanjiRevealStepView.tsx", // animation beat, CTA follows the reveal

  // ── Untriaged: never measured at a short viewport. ──
  // 2026-08-06: listening_comprehension, speaking and translate opted in. They
  // were also the step types the `cta-fold` gate was structurally blind on —
  // no `primary-cta` meant no assertion — so they had neither the behaviour nor
  // the check. Both arrive together; see `tests/mobile/stage-fit.mobile.spec.ts`.
  "AgreementClozeStepView.tsx",
  "DialogueSimStepView.tsx",
  "FillBlankStepView.tsx",
  "SymbolIntroStepView.tsx",
  "SymbolProductionStepView.tsx",
  "SymbolTraceStepView.tsx",
]);

function stepViewsWithCta(): string[] {
  return readdirSync(STEPS_DIR)
    .filter((f) => f.endsWith("StepView.tsx") && !f.includes(".test."))
    .filter((f) => readFileSync(join(STEPS_DIR, f), "utf8").includes("ContinueButton"));
}

function isSticky(file: string): boolean {
  return readFileSync(join(STEPS_DIR, file), "utf8").includes('data-testid="primary-cta"');
}

describe("sticky CTA roll call", () => {
  it("every step view with a CTA either opts in or is named", () => {
    const files = stepViewsWithCta();
    // Guard the guard: a rename that breaks the glob must fail loudly rather
    // than silently checking nothing.
    expect(files.length).toBeGreaterThan(20);

    const unaccounted = files.filter((f) => !isSticky(f) && !NOT_STICKY.has(f));
    expect(unaccounted).toEqual([]);
  });

  it("keeps no stale exemptions", () => {
    const files = new Set(stepViewsWithCta());
    const stale = [...NOT_STICKY].filter((f) => !files.has(f) || isSticky(f));
    expect(stale).toEqual([]);
  });
});
