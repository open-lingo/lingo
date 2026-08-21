import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { StepRenderer } from "../components/StepRenderer";
import type { LessonStep } from "../types";
import { DevStageFrame } from "./DevStageFrame";

/**
 * DEV · the generic prototype-module walker — one sequential runner for
 * every inline-authored module (es m1/m2, fr m1/m2), extracted from the
 * original EsM1L1Page when the custom-author loop grew past one module
 * (Spencer 2026-08-21). Real StepRenderer, real factories, the real
 * stage contract — NOT LessonPage: no XP, no SRS, no course wiring.
 * When a module is approved it becomes IR and ships through the normal
 * pipeline.
 */
export type ProtoModuleConfig = {
  eyebrow: string;
  heading: string;
  blurb: string;
  titles: ReadonlyArray<string>;
  build: (n: number) => Promise<LessonStep[]>;
  completeTitle: string;
  completeBody: string;
};

export function ProtoModuleWalker({ config }: { config: ProtoModuleConfig }) {
  const [lessonN, setLessonN] = useState(1);
  const [steps, setSteps] = useState<LessonStep[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState("—");
  const [overflow, setOverflow] = useState("—");
  const frameRef = useRef<HTMLDivElement>(null);
  const { titles, build } = config;

  useEffect(() => {
    let alive = true;
    setSteps(null);
    void build(lessonN).then((s) => {
      if (alive) setSteps(s);
    });
    return () => {
      alive = false;
    };
  }, [lessonN, build]);

  // Overflow readout: measure the STEP CONTAINER, not the window.
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
  }, [idx, resetKey, lessonN]);

  const done = steps !== null && idx >= steps.length;
  const step = steps !== null && !done ? steps[idx] : null;

  function selectLesson(n: number) {
    setLessonN(n);
    setIdx(0);
    setResetKey((k) => k + 1);
    setLastResult("—");
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-5 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            {config.eyebrow}
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">{config.heading}</h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">{config.blurb}</p>
          <p className="m-0 mt-3 text-xs text-text-muted">
            <Link to="../qa/word-map" className="underline">
              word-map QA
            </Link>
            {" · "}
            <Link to="../qa/gender-color" className="underline">
              gender-color QA
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

        <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
          {titles.map((title, i) => (
            <button
              key={title}
              type="button"
              onClick={() => selectLesson(i + 1)}
              title={title}
              className={`rounded border px-2 py-0.5 ${
                lessonN === i + 1
                  ? "border-accent bg-accent-muted text-accent"
                  : "border-border bg-surface"
              }`}
            >
              {title.startsWith("✓") ? "✓" : `L${i + 1}`}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
          <span className="font-semibold">{titles[lessonN - 1]}</span>
          <span className="font-semibold text-text-muted">
            {steps === null
              ? "loading…"
              : done
                ? "lesson complete"
                : `step ${idx + 1} / ${steps.length}`}
          </span>
          {steps !== null && (
            <div className="flex items-center gap-1">
              {steps.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 w-3 rounded-full ${
                    i < idx
                      ? "bg-accent"
                      : i === idx && !done
                        ? "bg-accent/50"
                        : "bg-border"
                  }`}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => selectLesson(lessonN)}
            className="ml-auto rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
          >
            Restart lesson
          </button>
        </div>

        <DevStageFrame height={596} scrollerRef={frameRef}>
          {done ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="text-4xl">🎉</div>
              <p className="m-0 text-lg font-bold">
                {lessonN === titles.length ? config.completeTitle : "Lesson complete"}
              </p>
              <p className="m-0 max-w-sm text-sm text-text-secondary">
                {lessonN === titles.length
                  ? config.completeBody
                  : "Pick the next one above."}
              </p>
              {lessonN < titles.length && (
                <button
                  type="button"
                  onClick={() => selectLesson(lessonN + 1)}
                  className="rounded-lg border border-accent bg-accent-muted px-4 py-1.5 text-sm font-bold text-accent"
                >
                  Next: {titles[lessonN]}
                </button>
              )}
            </div>
          ) : step !== null ? (
            <LessonModuleProvider moduleIndex={null}>
              <StepRenderer
                key={`${step.id}-r${resetKey}`}
                step={step}
                onComplete={(id, correct) =>
                  setLastResult(`onComplete("${id}", ${correct})`)
                }
                onContinue={() => setIdx((i) => i + 1)}
              />
            </LessonModuleProvider>
          ) : null}
        </DevStageFrame>

        <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-muted">
          <span>frame 596px · {overflow}</span>
          <span>last callback: {lastResult}</span>
        </div>
      </div>
    </div>
  );
}
