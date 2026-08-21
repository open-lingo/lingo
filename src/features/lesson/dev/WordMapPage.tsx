import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { StepRenderer } from "../components/StepRenderer";
import type { WordMapStep } from "../types";
import { DevStageFrame } from "./DevStageFrame";

/**
 * DEV · Word-map (`word_map`) — prototype driver.
 * Route: `/:lang/qa/word-map`.
 *
 * Spencer, 2026-08-20: "similar to match pairs process of elimination,
 * map all the words to the sentence… it goes 'what is this word',
 * highlights the english/native language word and THEN they get to pick
 * from the word bank, slowly filling in the translations."
 *
 * Three staged examples, easy → interesting:
 *
 *   1. aligned    — a clean 1:1 sentence, orders match
 *   2. crossing   — "black cat" ↔ «gato negro»: the mapping CROSSES, and
 *                   the learner discovers adjective position by mapping it
 *   3. phrase→one — "I have" maps to the single word «tengo»: one English
 *                   phrase, one Spanish verb
 *
 * Every sentence is verbatim m5 shipped text, so every clip exists (the
 * esAudioCoverage ratchet holds at zero). Same lesson-shell frame +
 * overflow readout contract as the other step QA pages.
 *
 * NOT wired into any course lesson: `word_map` is pinned in
 * `UNUSED_STEP_TYPES`; these steps live under `dev/`, invisible to the
 * curriculum, the atom registry and the TTS emitter.
 */

const FRAME_HEIGHTS = [
  { label: "700px viewport (the rule)", px: 596 },
  { label: "640px viewport (short laptop)", px: 536 },
  { label: "900px viewport (roomy)", px: 796 },
] as const;

type Example = { key: string; label: string; cue: string; step: WordMapStep };

const EXAMPLES: Example[] = [
  {
    key: "aligned",
    label: "1 · aligned",
    cue: "Clean 1:1 warm-up — English and Spanish word orders agree, elimination does the rest.",
    step: {
      id: "map-demo-aligned",
      type: "word_map",
      tokens: ["mi", "madre", "es", "muy", "simpática"],
      pairs: [
        { en: "my", tokenIndex: 0 },
        { en: "mother", tokenIndex: 1 },
        { en: "is", tokenIndex: 2 },
        { en: "very", tokenIndex: 3 },
        { en: "kind", tokenIndex: 4 },
      ],
      audioText: "mi madre es muy simpática",
      revealNote:
        "Five for five — and «simpática» wears the feminine -a to match «madre». You'll start seeing that ending everywhere.",
    },
  },
  {
    key: "crossing",
    label: "2 · crossing",
    cue: "The mapping CROSSES: 'black' lands after 'cat' in Spanish. Discovering that by mapping beats being told.",
    step: {
      id: "map-demo-crossing",
      type: "word_map",
      tokens: ["el", "gato", "negro", "es", "muy", "bonito"],
      pairs: [
        { en: "the", tokenIndex: 0 },
        { en: "black", tokenIndex: 2 },
        { en: "cat", tokenIndex: 1 },
        { en: "is", tokenIndex: 3 },
        { en: "very", tokenIndex: 4 },
        { en: "pretty", tokenIndex: 5 },
      ],
      audioText: "el gato negro es muy bonito",
      revealNote:
        "Notice the crossing: Spanish says «gato negro» — the color comes AFTER the noun. You just mapped that with your fingers.",
    },
  },
  {
    key: "phrase",
    label: "3 · phrase→one",
    cue: "One English PHRASE maps to one Spanish word: 'I have' is all inside «tengo». The verb carries its person.",
    step: {
      id: "map-demo-phrase",
      type: "word_map",
      tokens: ["tengo", "una", "familia", "muy", "grande"],
      pairs: [
        { en: "I have", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "very", tokenIndex: 3 },
        { en: "big", tokenIndex: 4 },
        { en: "family", tokenIndex: 2 },
      ],
      audioText: "tengo una familia muy grande",
      revealNote:
        "«tengo» = 'I have' in one word — the ending -o is the 'I'. And 'big family' flipped to «familia … grande» again: adjectives trail their noun.",
    },
  },
];

export default function WordMapPage() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [heightIdx, setHeightIdx] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState<string>("—");
  const [overflow, setOverflow] = useState<string>("—");
  const frameRef = useRef<HTMLDivElement>(null);

  const height = FRAME_HEIGHTS[heightIdx].px;
  const example = EXAMPLES[exampleIdx];

  const step: WordMapStep = useMemo(
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
            DEV · Word-map (prototype)
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">
            🧩 word_map — the interlinear builder
          </h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            The English line is prompted one word at a time — big and
            highlighted — and the learner taps the Spanish word it maps to.
            Solved words lock in with their translation underneath, so an
            interlinear gloss of the whole sentence assembles as they go.
            Match-pairs DNA: the bank shrinks with every mapping, so the tail
            is deducible by elimination even when the words are unknown.
          </p>
          <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-xs text-text-secondary">
            <li>
              <b>Grading:</b> match-pairs conventions — a 3-mistake budget
              (dots below the chips), fail at 3 with the remaining mappings
              revealed muted so the teaching still lands.
            </li>
            <li>
              <b>Order divergence is the point:</b> example 2 makes the
              learner physically map &lsquo;black&rsquo; to the word AFTER
              &lsquo;cat&rsquo; — adjective position, taught by hand.
            </li>
            <li>
              <b>Audio:</b> the sentence autoplays and replays; each solved
              word also plays its own clip when one exists. All three
              sentences are verbatim m5 shipped text.
            </li>
          </ul>
          <p className="m-0 mt-3 text-xs text-text-muted">
            <Link to="../lesson-preview#step-word_map" className="underline">
              previewer fixture
            </Link>
            {" · "}
            <Link to="../qa/gender-color" className="underline">
              gender-color QA
            </Link>
            {" · "}
            <Link to="../qa/tap-word" className="underline">
              tap-the-word QA
            </Link>
            {" · "}
            <Link to="../qa/dialogue-sim" className="underline">
              dialogue-sim QA
            </Link>
            {" · "}
            <Link to="../qa" className="underline">
              QA test-drive
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
