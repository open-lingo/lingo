import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { StepRenderer } from "../components/StepRenderer";
import type { TapTheWordStep } from "../types";
import { DevStageFrame } from "./DevStageFrame";

/**
 * DEV · Tap-the-word (`tap_the_word`) — prototype driver.
 * Route: `/:lang/qa/tap-word`.
 *
 * Spencer, 2026-08-20: "tap the word is perfect as well! we can also lead
 * them through deductive reasoning."
 *
 * Three staged examples form the DEDUCTION LADDER the authoring guidance
 * will encode — each one is answerable without having been taught the
 * word, from a different cue class:
 *
 *   1. cognate      — «inteligente» looks like its English answer
 *   2. morphology   — the feminine -a on «simpática» is visible agreement
 *   3. multi/cognate — find BOTH English giveaways in one sentence
 *
 * Every sentence is verbatim m5 shipped text, so every clip exists (the
 * esAudioCoverage ratchet holds at zero). Same lesson-shell frame +
 * overflow readout contract as the dialogue-sim QA page.
 *
 * NOT wired into any course lesson: `tap_the_word` is pinned in
 * `UNUSED_STEP_TYPES`; these steps live under `dev/`, invisible to the
 * curriculum, the atom registry and the TTS emitter.
 */

const FRAME_HEIGHTS = [
  { label: "700px viewport (the rule)", px: 596 },
  { label: "640px viewport (short laptop)", px: 536 },
  { label: "900px viewport (roomy)", px: 796 },
] as const;

type Example = { key: string; label: string; cue: string; step: TapTheWordStep };

const EXAMPLES: Example[] = [
  {
    key: "cognate",
    label: "1 · cognate",
    cue: "Deducible because «inteligente» resembles its English answer — no teaching required.",
    step: {
      id: "tap-demo-cognate",
      type: "tap_the_word",
      prompt: "Tap the word that means 'intelligent'.",
      tokens: ["mi", "esposa", "es", "muy", "inteligente"],
      correctIndices: [4],
      meaningEn: "My wife is very intelligent.",
      audioText: "mi esposa es muy inteligente",
      revealNote:
        "You didn't need to be taught it — «inteligente» is a cognate. Spanish is full of them; trust the resemblance.",
    },
  },
  {
    key: "morphology",
    label: "2 · morphology",
    cue: "Deducible from VISIBLE grammar: exactly one word wears the feminine -a to match «madre».",
    step: {
      id: "tap-demo-morphology",
      type: "tap_the_word",
      prompt: "One word changed its ending to match «madre» — tap it.",
      tokens: ["mi", "madre", "es", "muy", "simpática"],
      correctIndices: [4],
      meaningEn: "My mother is very kind.",
      audioText: "mi madre es muy simpática",
      revealNote:
        "«simpática» ends in -a because «madre» is feminine — adjectives dress to match their noun. Watch for the -o/-a switch everywhere.",
    },
  },
  {
    key: "multi",
    label: "3 · tap-two",
    cue: "Multi-select + cognates: the chip row states the arity, and both answers are English giveaways.",
    step: {
      id: "tap-demo-multi",
      type: "tap_the_word",
      prompt: "Two of these words English already gave you — tap both.",
      tokens: ["tengo", "una", "familia", "muy", "grande"],
      correctIndices: [2, 4],
      meaningEn: "I have a very big family.",
      audioText: "tengo una familia muy grande",
      revealNote:
        "«familia» → family, «grande» → grand. Cognates again — a big slice of Spanish is free if you look for the resemblance.",
    },
  },
];

export default function TapWordPage() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [heightIdx, setHeightIdx] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState<string>("—");
  const [overflow, setOverflow] = useState<string>("—");
  const frameRef = useRef<HTMLDivElement>(null);

  const height = FRAME_HEIGHTS[heightIdx].px;
  const example = EXAMPLES[exampleIdx];

  const step: TapTheWordStep = useMemo(
    () => ({
      ...example.step,
      // Fresh id per Reset/example switch so autoplay guards re-arm.
      id: `${example.step.id}-r${resetKey}`,
    }),
    [example, resetKey],
  );

  // Overflow readout: measure the STEP CONTAINER, not the window —
  // "measure scrollHeight - clientHeight of the step container, not vibes"
  // (CLAUDE.md).
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
  }, [height, resetKey, exampleIdx]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-5 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            DEV · Tap-the-word (prototype)
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">
            👆 tap_the_word — the deduction ladder
          </h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            A real sentence renders as flowing tappable word chips; the
            learner taps the word(s) matching an English cue. Every example
            here is answerable WITHOUT having been taught the word — that is
            the authoring contract: cognates, visible morphology, the gloss,
            or position always give an honest path to the answer, and the
            reveal names the cue so the strategy sticks.
          </p>
          <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-xs text-text-secondary">
            <li>
              <b>Graded:</b> unlike the guess-safe <code>pretest_mcq</code>,
              this is retrieval — wrong picks go red, missed targets show a
              dashed outline.
            </li>
            <li>
              <b>Arity is stated:</b> multi-target steps say how many to tap
              — the learner deduces WHICH, never HOW MANY.
            </li>
            <li>
              <b>Audio:</b> all three sentences are verbatim m5 shipped text,
              so every clip plays (coverage ratchet holds at zero).
            </li>
          </ul>
          <p className="m-0 mt-3 text-xs text-text-muted">
            <Link to="../lesson-preview#step-tap_the_word" className="underline">
              previewer fixture
            </Link>
            {" · "}
            <Link to="../qa/word-map" className="underline">
              word-map QA
            </Link>
            {" · "}
            <Link to="../qa/dialogue-sim" className="underline">
              dialogue-sim QA
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
          <span className="font-semibold text-text-muted">Example:</span>
          {EXAMPLES.map((ex, i) => (
            <button
              key={ex.key}
              type="button"
              onClick={() => {
                setExampleIdx(i);
                setResetKey((k) => k + 1);
                setLastResult("—");
              }}
              className={`rounded border px-2 py-0.5 ${
                exampleIdx === i
                  ? "border-accent bg-accent-muted text-accent"
                  : "border-border bg-surface"
              }`}
            >
              {ex.label}
            </button>
          ))}
          <span className="ml-2 font-semibold text-text-muted">Frame:</span>
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

        <p className="m-0 mb-3 text-xs italic text-text-muted">{example.cue}</p>

        <DevStageFrame height={height} scrollerRef={frameRef}>
          <LessonModuleProvider moduleIndex={null}>
            <StepRenderer
              key={step.id}
              step={step}
              onComplete={(id, correct) =>
                setLastResult(`onComplete("${id}", ${correct})`)
              }
              onContinue={() =>
                setLastResult("onContinue() — lesson would advance")
              }
            />
          </LessonModuleProvider>
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
