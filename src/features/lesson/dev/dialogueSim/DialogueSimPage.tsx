import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { StepRenderer } from "../../components/StepRenderer";
import { KONBINI_SIM_STEP } from "./konbiniScenario";
import { PARQUE_SIM_STEP_ES, buildParqueQuiz } from "./parqueScenarioEs";
import type { DialogueSimStep, LessonStep } from "../../types";
import { DevStageFrame } from "../DevStageFrame";

/**
 * DEV · Simulation dialogue (`dialogue_sim`) — prototype driver.
 * Route: `/:lang/qa/dialogue-sim`. Scenario follows the active language:
 * ja gets the konbini checkout, es gets the park meeting.
 *
 * Spencer, 2026-07-29:
 *
 *   "a simulation style dialogue walking you through certain interactions…
 *    a playful 'shopfront emoji' — 'worker says: do you need a bag?' — great
 *    for travel sprint and overall learning, good to not dumb it down too
 *    much. we can even just improve upon the ui/ux for the dialogue lessons."
 *
 * Spencer, 2026-08-20 (the es extension this page stages):
 *
 *   "the interaction simulator for japanese but we do spanish with the
 *    english translation below it, and then quiz the words/sentences"
 *
 * The gloss-below-the-line was already the step's contract (every NPC line
 * reveals its English gloss; listen-first masks both until the clip plays).
 * The new beat is the POST-QUIZ: on es, finishing the scenario flows into
 * retrieval steps over exactly the words/sentences it used, built with the
 * real es content factories — the full "participate, then prove it" shape
 * a lesson would ship.
 *
 * The step renders through the REAL `StepRenderer`, inside a frame the size
 * of the real lesson shell, so what you see is what a lesson would show. The
 * height picker exists because CLAUDE.md requires verifying step layout at
 * ≤700px — the readout under the frame reports whether the step container
 * itself overflows (it must not; only the transcript scrolls).
 *
 * NOT wired into any course lesson: `dialogue_sim` is pinned in
 * `UNUSED_STEP_TYPES`, and the scenarios live under `dev/`, so the
 * curriculum, the atom registry and the TTS emitter never see them.
 */

/** Lesson shell is `h-[calc(100dvh-6.5rem)]`; these are the interesting
 *  viewport heights minus that chrome, plus the two the rules name. */
const FRAME_HEIGHTS = [
  { label: "700px viewport (the rule)", px: 596 },
  { label: "640px viewport (short laptop)", px: 536 },
  { label: "900px viewport (roomy)", px: 796 },
] as const;

export default function DialogueSimPage() {
  const languageId = useLanguage().language?.id;
  const isEs = languageId === "es";
  const scenario: DialogueSimStep = isEs ? PARQUE_SIM_STEP_ES : KONBINI_SIM_STEP;

  const [heightIdx, setHeightIdx] = useState(0);
  const [listenFirst, setListenFirst] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState<string>("—");
  const [overflow, setOverflow] = useState<string>("—");
  // Post-quiz flow (es only): null = sim showing; otherwise the quiz steps
  // with `quizIdx` pointing at the live one; done = past the end.
  const [quizSteps, setQuizSteps] = useState<LessonStep[] | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);

  const height = FRAME_HEIGHTS[heightIdx].px;

  const step: DialogueSimStep = useMemo(
    () => ({
      ...scenario,
      // Fresh id per Reset so tile shuffles + autoplay guards re-arm.
      id: `${scenario.id}-r${resetKey}${listenFirst ? "-lf" : ""}`,
      listenFirst,
    }),
    [scenario, resetKey, listenFirst],
  );

  const quizDone = quizSteps !== null && quizIdx >= quizSteps.length;
  const liveStep: LessonStep =
    quizSteps !== null && !quizDone ? quizSteps[quizIdx] : step;

  function reset() {
    setResetKey((k) => k + 1);
    setLastResult("—");
    setQuizSteps(null);
    setQuizIdx(0);
  }

  async function advanceFromSim() {
    if (!isEs) {
      setLastResult("onContinue() — lesson would advance");
      return;
    }
    const steps = await buildParqueQuiz();
    setQuizSteps(steps);
    setQuizIdx(0);
    setLastResult("scenario done — quiz begins");
  }

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
  }, [height, resetKey, listenFirst, quizIdx, quizSteps]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-5 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            DEV · Simulation dialogue (prototype)
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">
            {isEs
              ? "🌳 dialogue_sim — en el parque (+ post-quiz)"
              : "🏪 dialogue_sim — konbini checkout"}
          </h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            An NPC speaks one turn at a time and the learner IS the other
            speaker — tile-build or pick a reply, 4 turns, transcript grows as
            you go. Distinct from <code>dialogue_listen</code>, which plays a
            whole exchange and then quizzes you about it.
          </p>
          <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-xs text-text-secondary">
            {isEs ? (
              <>
                <li>
                  <b>Gloss below:</b> every one of Ana&apos;s lines shows its
                  English translation under the Spanish (masked until the clip
                  plays in listen-first mode).
                </li>
                <li>
                  <b>Post-quiz:</b> finishing the scenario flows into 3
                  retrieval steps over exactly what it used — a listening
                  check, a word MCQ, and a build — made with the real es
                  content factories.
                </li>
                <li>
                  <b>Max-acceptance:</b> turn 4 accepts both{" "}
                  <i>hasta luego</i> and <i>adiós</i>; turn 1 accepts a bare{" "}
                  <i>buenos días</i>.
                </li>
                <li>
                  <b>Audio:</b> every line is verbatim m1/m5 shipped text, so
                  every clip exists (the coverage ratchet holds at zero).
                </li>
              </>
            ) : (
              <>
                <li>
                  <b>Max-acceptance:</b> turn 1 accepts これを ください{" "}
                  <i>and</i> これを おねがいします; turn 2 accepts both
                  けっこうです and だいじょうぶです; turn 4 accepts a bare
                  ありがとう.
                </li>
                <li>
                  <b>Audio:</b> every clerk line plays from the existing
                  manifest except turn 2 (「ふくろは いりますか」 was never
                  generated) — left that way on purpose so you can see the
                  degradation: play button disabled, listen-first mask lifts
                  itself.
                </li>
              </>
            )}
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
          {quizSteps !== null && (
            <span className="font-semibold text-accent">
              {quizDone
                ? "quiz complete ✓"
                : `quiz ${quizIdx + 1}/${quizSteps.length}`}
            </span>
          )}
          <button
            type="button"
            onClick={reset}
            className="ml-auto rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
          >
            Reset
          </button>
        </div>

        <DevStageFrame height={height} scrollerRef={frameRef}>
          {quizDone ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="text-4xl">🎉</div>
                <p className="m-0 text-lg font-bold">
                  Scenario + quiz complete
                </p>
                <p className="m-0 max-w-sm text-sm text-text-secondary">
                  In a real lesson these would be five graded steps in a row:
                  the scenario, then the retrieval tail. Reset to run it
                  again.
                </p>
              </div>
            ) : (
              <LessonModuleProvider moduleIndex={null}>
                <StepRenderer
                  key={liveStep.id}
                  step={liveStep}
                  onComplete={(id, correct) =>
                    setLastResult(
                      `onComplete("${id}", ${correct})${
                        quizSteps === null
                          ? ` — scenario ${correct ? "clean" : "had a miss"}`
                          : ""
                      }`,
                    )
                  }
                  onContinue={() => {
                    if (quizSteps === null) void advanceFromSim();
                    else setQuizIdx((i) => i + 1);
                  }}
                />
              </LessonModuleProvider>
          )}
        </DevStageFrame>

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
