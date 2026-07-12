import { useState } from "react";
import type { GrammarRuleStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { playSfx } from "@/shared/audio/sfx";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

type Props = {
  step: GrammarRuleStep;
  onContinue: () => void;
  /**
   * `full` (default) = the lesson hero treatment. `compact` = the grammar
   * deck's one-time refresher preface: small pane, title + rule + first
   * example only — a full hero card before a single drill question reads
   * as long-winded (Spencer, 2026-07-06).
   */
  variant?: "full" | "compact";
};

/**
 * Grammar Rule Card — Tae Kim-style explicit teaching.
 *
 * Layout: hero rule pane (gradient, large rule text) → 2 example tiles
 * (kana with romaji ruby, English meaning, play button) → optional
 * anti-pattern in a contrasting red-tinted tile with a "why" line →
 * optional culture note → Continue.
 *
 * NOT a quiz. Exposure card. The drill follows in the next step (usually
 * `particle_cloze` or `multiple_choice`).
 */
export function GrammarRuleStepView({
  step,
  onContinue,
  variant = "full",
}: Props) {
  useLessonKeyboard({
    onEnter: () => {
      playSfx("passive-advance");
      onContinue();
    },
  });

  if (variant === "compact") {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
          Grammar refresher
        </p>

        <div className="rounded-2xl border-2 border-info/40 bg-gradient-to-br from-info/15 via-info/10 to-accent/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <Icon name="fileText" size={24} aria-hidden className="shrink-0 text-info" />
            <h2 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              {step.title}
            </h2>
          </div>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            {step.rule}
          </p>
        </div>

        {step.examples[0] ? <ExampleTile example={step.examples[0]} /> : null}

        {/* Workshop A (2026-07-12): culture is discoverable flavor, never
            required reading — a tap-to-expand chip, one disclosure level. */}
        {step.cultureNote ? <CultureChip note={step.cultureNote} /> : null}

        <div className="mt-auto pt-6">
          <ContinueButton
            onClick={() => {
              playSfx("passive-advance");
              onContinue();
            }}
            label="Got it"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
        Grammar
      </p>

      <div className="relative overflow-hidden rounded-3xl border-2 border-info/40 bg-gradient-to-br from-info/15 via-info/10 to-accent/10 px-7 py-9 shadow-[var(--shadow-card)]">
        <Icon name="fileText" size={48} aria-hidden className="text-info" />
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
          {step.title}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-text-secondary sm:text-xl">
          {step.rule}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {step.examples.map((ex, i) => (
          <ExampleTile key={i} example={ex} />
        ))}
      </div>

      {step.antiPattern ? (
        <div className="rounded-2xl border-2 border-error/40 bg-error/10 px-5 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-error">
            Don't do this
          </p>
          <p className="font-japanese text-lg text-text-primary line-through decoration-error/60 decoration-2">
            <AnnotatedJa text={step.antiPattern.ja} />
          </p>
          <p className="mt-1 text-sm italic text-text-muted" lang="ja-Latn">
            {step.antiPattern.romaji}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {step.antiPattern.en}
          </p>
          <p className="mt-2 text-sm font-medium text-error">
            ← {step.antiPattern.why}
          </p>
        </div>
      ) : null}

      {step.cultureNote ? (
        <p className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-text-secondary">
          {step.cultureNote}
        </p>
      ) : null}

      <div className="mt-auto pt-6">
        <ContinueButton
          onClick={() => {
            // Passive — non-progress chirp + light haptic. See sfx.ts.
            playSfx("passive-advance");
            onContinue();
          }}
          label="Got it"
        />
      </div>
    </div>
  );
}

function ExampleTile({ example }: { example: { ja: string; romaji: string; en: string } }) {
  const hasAudio = getTtsUrl(example.ja) !== null;

  function handlePlay() {
    if (!hasAudio) return;
    playJaAudio(example.ja);
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-border bg-surface px-5 py-4">
      <div className="flex-1">
        <p className="font-japanese text-xl text-text-primary">
          <AnnotatedJa text={example.ja} />
        </p>
        <p className="mt-1 text-sm italic text-text-muted" lang="ja-Latn">
          {example.romaji}
        </p>
        <p className="mt-1 text-sm text-text-secondary">{example.en}</p>
      </div>
      <button
        type="button"
        onClick={handlePlay}
        disabled={!hasAudio}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_var(--color-accent-hover)] transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Play example"
      >
        <Icon name="play" size={14} />
      </button>
    </div>
  );
}

function CultureChip({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-muted transition hover:bg-surface-muted"
      >
        <span aria-hidden>🌸</span>
        Culture note
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <p className="mt-2 rounded-xl border border-border/60 bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary">
          {note}
        </p>
      ) : null}
    </div>
  );
}
