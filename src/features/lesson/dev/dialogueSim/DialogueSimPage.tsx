import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { StepRenderer } from "../../components/StepRenderer";
import { KONBINI_SIM_STEP } from "./konbiniScenario";
import type { DialogueSimStep } from "../../types";

/**
 * DEV · Simulation dialogue (`dialogue_sim`) — prototype driver.
 * Route: `/:lang/qa/dialogue-sim`.
 *
 * Spencer, 2026-07-29:
 *
 *   "a simulation style dialogue walking you through certain interactions…
 *    a playful 'shopfront emoji' — 'worker says: do you need a bag?' — great
 *    for travel sprint and overall learning, good to not dumb it down too
 *    much. we can even just improve upon the ui/ux for the dialogue lessons."
 *
 * The step renders through the REAL `StepRenderer`, inside a frame the size
 * of the real lesson shell, so what you see is what a lesson would show. The
 * height picker exists because CLAUDE.md requires verifying step layout at
 * ≤700px — the readout under the frame reports whether the step container
 * itself overflows (it must not; only the transcript scrolls).
 *
 * NOT wired into any course lesson: `dialogue_sim` is pinned in
 * `UNUSED_STEP_TYPES`, and the scenario lives under `dev/`, so the curriculum,
 * the atom registry and the TTS emitter never see it.
 */

/** Lesson shell is `h-[calc(100dvh-6.5rem)]`; these are the interesting
 *  viewport heights minus that chrome, plus the two the rules name. */
const FRAME_HEIGHTS = [
  { label: "700px viewport (the rule)", px: 596 },
  { label: "640px viewport (short laptop)", px: 536 },
  { label: "900px viewport (roomy)", px: 796 },
] as const;

export default function DialogueSimPage() {
  const [heightIdx, setHeightIdx] = useState(0);
  const [listenFirst, setListenFirst] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState<string>("—");
  const [overflow, setOverflow] = useState<string>("—");
  const frameRef = useRef<HTMLDivElement>(null);

  const height = FRAME_HEIGHTS[heightIdx].px;

  const step: DialogueSimStep = useMemo(
    () => ({
      ...KONBINI_SIM_STEP,
      // Fresh id per Reset so tile shuffles + autoplay guards re-arm.
      id: `${KONBINI_SIM_STEP.id}-r${resetKey}${listenFirst ? "-lf" : ""}`,
      listenFirst,
    }),
    [resetKey, listenFirst],
  );

  // Overflow readout: measure the STEP CONTAINER (the frame's flex child),
  // not the window — "measure scrollHeight - clientHeight of the step
  // container, not vibes" (CLAUDE.md).
  useEffect(() => {
    const tick = () => {
      const el = frameRef.current;
      if (!el) return;
      const over = el.scrollHeight - el.clientHeight;
      setOverflow(
        over > 1
          ? `⚠️ step container overflows by ${over}px`
          : "✓ no step-container overflow",
      );
    };
    tick();
    const id = window.setInterval(tick, 600);
    return () => window.clearInterval(id);
  }, [height, resetKey, listenFirst]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-5 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            DEV · Simulation dialogue (prototype)
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">
            🏪 dialogue_sim — konbini checkout
          </h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            An NPC speaks one turn at a time and the learner IS the other
            speaker — tile-build or pick a reply, 4 turns, transcript grows as
            you go. Distinct from <code>dialogue_listen</code>, which plays a
            whole exchange and then quizzes you about it.
          </p>
          <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-xs text-text-secondary">
            <li>
              <b>Max-acceptance:</b> turn 1 accepts これを ください <i>and</i>{" "}
              これを おねがいします; turn 2 accepts both けっこうです and
              だいじょうぶです; turn 4 accepts a bare ありがとう.
            </li>
            <li>
              <b>Audio:</b> every clerk line plays from the existing manifest
              except turn 2 (「ふくろは いりますか」 was never generated) — left
              that way on purpose so you can see the degradation: play button
              disabled, listen-first mask lifts itself.
            </li>
            <li>
              <b>Grading:</b> one scenario = one graded step, correct only if
              every turn was right. Writes NO SRS state (no{" "}
              <code>exercisedAtoms</code>).
            </li>
          </ul>
          <p className="m-0 mt-3 text-xs text-text-muted">
            <Link to="../lesson-preview#step-dialogue_sim" className="underline">
              previewer fixture
            </Link>
            {" · "}
            <Link to="../qa" className="underline">
              QA test-drive
            </Link>
            {" · "}
            <Link to="../learn" className="underline">
              Back to Learn
            </Link>
          </p>
        </header>

        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
          <span className="font-semibold text-text-muted">Frame:</span>
          {FRAME_HEIGHTS.map((h, i) => (
            <button
              key={h.px}
              type="button"
              onClick={() => setHeightIdx(i)}
              className={`rounded border px-2 py-0.5 ${
                heightIdx === i
                  ? "border-accent bg-accent-muted text-accent"
                  : "border-border bg-surface"
              }`}
            >
              {h.label}
            </button>
          ))}
          <span className="ml-2 font-semibold text-text-muted">Mode:</span>
          <button
            type="button"
            onClick={() => setListenFirst((v) => !v)}
            className={`rounded border px-2 py-0.5 ${
              listenFirst
                ? "border-accent bg-accent-muted text-accent"
                : "border-border bg-surface"
            }`}
          >
            {listenFirst ? "listen-first ON" : "listen-first off"}
          </button>
          <button
            type="button"
            onClick={() => {
              setResetKey((k) => k + 1);
              setLastResult("—");
            }}
            className="ml-auto rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
          >
            Reset
          </button>
        </div>

        {/* Lesson-shell stand-in: FIXED height, overflow hidden, flex column
            — the same contract LessonPage gives a step view. */}
        <div
          className="overflow-hidden rounded-xl border border-border bg-surface p-4"
          style={{ height }}
        >
          <div ref={frameRef} className="flex h-full flex-col overflow-hidden">
            <LessonModuleProvider moduleIndex={null}>
              <StepRenderer
                key={step.id}
                step={step}
                onComplete={(id, correct) =>
                  setLastResult(
                    `onComplete("${id}", ${correct}) — scenario ${correct ? "clean" : "had a miss"}`,
                  )
                }
                onContinue={() => setLastResult("onContinue() — lesson would advance")}
              />
            </LessonModuleProvider>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-muted">
          <span>
            frame {height}px · {overflow}
          </span>
          <span>last callback: {lastResult}</span>
        </div>
      </div>
    </div>
  );
}
