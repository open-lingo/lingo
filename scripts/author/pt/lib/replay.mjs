/**
 * lib/replay.mjs — "emitter replay": run a lesson fragment's steps through
 * the REAL, unmodified `scripts/draft/pt-ir/assemble.mjs` (`makeAssembler`)
 * without going through `compile-ir-pt.mjs`'s whole-module compile. This is
 * the scratch-harness every PTAUTH-L1..L5 lane improvised by hand (see
 * e.g. PTAUTH-L4-report.md: "imported assemble.mjs's makeAssembler and
 * called every one of my 13 steps' A.S.<kind>(...) exactly as
 * compile-ir-pt.mjs's renderFreeStep would") — extracted here once so
 * `check.sh` never needs a lane to hand-roll it again.
 *
 * The `kind -> A.S.<fn>` mapping below is a DELIBERATE, minimal duplicate
 * of `compile-ir-pt.mjs`'s `renderFreeStep` switch (editing the compiler
 * is off-limits for this lane); `check.sh`'s own gate step
 * (`node scripts/compile-ir-pt.mjs m1 --check`, run when a real module
 * header exists) is what actually proves this mapping hasn't drifted —
 * see the PTTOOL report.
 */
import { makeAssembler } from "../../../draft/pt-ir/assemble.mjs";

const KIND_TO_METHOD = {
  info: "info", phrase: "phrase", textMcq: "textMcq", mcq: "mcq", match: "match",
  imageMcq: "vocabMcq", buildLit: "buildLit", translateLit: "translateLit",
  speakLit: "speakLit", listenCompLit: "listenCompLit", listenBuildLit: "listenBuildLit",
  clozeLit: "clozeLit", dialogueLit: "dialogueLit", agreementLit: "agreementLit",
  genderSort: "genderSort", sim: "simLit", map: "mapLit", audioWimcq: "audioWimcq",
  matchLit: "matchLit",
};

/** Replay every step of `lesson.steps` through the real emitters.
 *  Returns `{ ok: true, count }` or `{ ok: false, failures: [{id, kind, error}] }` —
 *  never throws, so `check.sh` can print a full report instead of stopping
 *  at the first bad step. */
export function replayLesson(lesson, moduleId = "m1") {
  const A = makeAssembler({ moduleId });
  const failures = [];
  let count = 0;
  for (const s of lesson.steps ?? []) {
    const method = KIND_TO_METHOD[s.kind];
    const id = `${moduleId}-l${lesson.n}-${s.id}`;
    if (!method || typeof A.S[method] !== "function") {
      failures.push({ id, kind: s.kind, error: `unknown step kind "${s.kind}"` });
      continue;
    }
    try {
      // info/phrase/textMcq/mcq/match take positional args; every literal
      // beat (the vast majority — and everything from-spec.mjs emits)
      // takes (id, stepObject) — see assemble.mjs's own `S` table.
      switch (s.kind) {
        case "info": A.S.info(id, s.title, s.body, s.variant); break;
        case "phrase": A.S.phrase(id, s.meaning, s.text, s.emoji); break;
        case "textMcq": A.S.textMcq(id, s.target, s.distractors, s.prompt); break;
        case "mcq": A.S.mcq(id, s.prompt, s.correct, s.distractors, s.why, s.atoms ?? [s.correct]); break;
        case "match": A.S.match(id, s.surfaces); break;
        case "imageMcq": A.S.vocabMcq(id, s.target, s.distractors); break;
        default: A.S[method](id, s);
      }
      count += 1;
    } catch (e) {
      failures.push({ id, kind: s.kind, error: e.message });
    }
  }
  return failures.length ? { ok: false, failures, count } : { ok: true, count };
}
