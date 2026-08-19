import type { SceneSpec } from "@/features/lesson/types";
import { TransferScene } from "./TransferScene";
import { JourneyScene } from "./JourneyScene";
import { TimelineScene } from "./TimelineScene";
import { ScaleScene } from "./ScaleScene";
import { RegisterScene } from "./RegisterScene";

/**
 * One entry point for every drawn rule card.
 *
 * Two surfaces render a scene — the `grammar_rule` step and the `RuleHintCard`
 * a review question can open — and they must render it identically, because
 * they are the same card seen twice. Before this they each carried their own
 * `step.transferDiagram ? <TransferScene/> : null`, which was fine while there
 * was one scene and would have become two diverging switches the moment there
 * were five.
 *
 * `scopeId` is threaded through so a scene's `@keyframes` cannot collide with
 * another card's on the same page — two rule cards can be on screen at once in
 * a review session.
 *
 * The union is exhaustive and the `default` returns null rather than throwing:
 * an unknown `kind` reaching here means the IR shipped a scene this build does
 * not know about, and a learner losing a picture is better than a learner
 * losing the lesson. `sceneVocabGate.test.ts` is what keeps that from
 * happening quietly — it fails on any kind it has no field list for.
 */
export function SceneView({
  spec,
  scopeId,
}: {
  spec: SceneSpec;
  scopeId: string;
}) {
  // Diagrams authored before scenes were a family carry no discriminator, and
  // every one of them is a transfer — which is what the compiler assumed too.
  const kind = spec.kind ?? "transfer";
  switch (kind) {
    case "transfer":
      return <TransferScene spec={spec as never} scopeId={scopeId} />;
    case "journey":
      return <JourneyScene spec={spec as never} scopeId={scopeId} />;
    case "timeline":
      return <TimelineScene spec={spec as never} scopeId={scopeId} />;
    case "scale":
      return <ScaleScene spec={spec as never} scopeId={scopeId} />;
    case "register":
      return <RegisterScene spec={spec as never} scopeId={scopeId} />;
    default:
      return null;
  }
}
