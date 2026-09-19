/**
 * lib/steps.mjs — spec -> unordered candidate step objects (orchestrator).
 * Each candidate already carries everything `emitFragment.mjs` needs
 * (kind + fields in the exact shape `scripts/draft/pt-ir/assemble.mjs`'s
 * emitters expect) — `lib/schedule.mjs`'s only job is choosing an ORDER
 * for these, never inventing content. Generators live in `lib/stepsCore.mjs`
 * (debuts: map/imageMcq/clozeLit/buildLit) and `lib/stepsClose.mjs`
 * (listenCompLit/agreementLit/sim/matchLit/speakLit-win) — split purely to
 * keep every file under this lane's 150-line budget.
 */
import { buildMap, buildImageMcqs, buildClozeLits, buildBuildLits, resetIds as resetCore } from "./stepsCore.mjs";
import {
  buildListenCompLits, buildAgreementLit, buildSim, buildMatchLit, buildSpeakWin,
  resetIds as resetClose,
} from "./stepsClose.mjs";

export function buildCandidateSteps(spec, priorVocab) {
  resetCore();
  resetClose();
  return {
    map: buildMap(spec),
    imageMcqs: buildImageMcqs(spec, priorVocab),
    clozeLits: buildClozeLits(spec),
    buildLits: buildBuildLits(spec),
    listenCompLits: buildListenCompLits(spec),
    agreementLit: buildAgreementLit(spec),
    sim: buildSim(spec),
    matchLit: buildMatchLit(spec, priorVocab),
    speakWin: buildSpeakWin(spec),
  };
}
