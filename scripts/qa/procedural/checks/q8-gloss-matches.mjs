/**
 * Q8 gloss-matches: reuses `moduleCompiler.ts`'s `diagnoseModule` diagnostics
 * (`gloss-mismatch`, `unknown-grammar-point`, `provenance`) directly against
 * the module's own IR JSON (`ir/<moduleId>.ir.json` — the compiler's INPUT,
 * read-only, never the compiled output). `diagnoseModule` is lesson-scoped,
 * not step-scoped, so — like Q9 — this check runs once per lesson (on its
 * first step) and reports every diagnostic whose `lesson` field matches.
 */
import { loadTs } from "../lib/tsBridge.mjs";
import { loadIr } from "../lib/irLexicon.mjs";

export const id = "Q8";
export const question = "does the module compiler's own gloss/grammar-point diagnostics pass for this lesson?";
export const enforced = true;

export function appliesTo(step, ctx) {
  return ctx.stepIndex === 0 && loadIr(ctx.moduleId) !== null;
}

export async function run(_step, ctx) {
  const ir = loadIr(ctx.moduleId);
  if (!ir) return { answer: "n/a", evidence: ["no ir/<moduleId>.ir.json for this module"] };
  const mod = await loadTs("/src/features/lesson/data/moduleCompiler.ts");
  const diags = mod
    .diagnoseModule(ir)
    .filter((d) => d.lesson === ctx.lessonId)
    .filter((d) => d.kind === "gloss-mismatch" || d.kind === "unknown-grammar-point" || d.kind === "provenance");
  if (diags.length === 0) return { answer: "yes", evidence: ["diagnoseModule: 0 gloss/grammar diagnostics for this lesson"] };
  return { answer: "no", evidence: diags.map((d) => `[${d.kind}] ${d.detail}`) };
}

/**
 * Plant: `diagnoseModule` reads the IR, not the runtime step, so there is
 * no runtime-JSON mutation that reliably trips it (the whole point of the
 * gloss-mismatch guard is IR-authored `derivedFrom` glosses). Prove failure
 * by directly constructing an IR fragment with a mismatched gloss and
 * running `diagnoseModule` on it — done in the test file itself, not here;
 * `plant` is a documented no-op for this one check.
 */
export function plant(step) {
  return step;
}
