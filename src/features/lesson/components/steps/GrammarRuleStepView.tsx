import type { GrammarRuleStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedJa } from "@/shared/japanese";
import { getTtsUrl, playJaAudio } from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";
import { playSfx } from "@/shared/audio/sfx";

type Props = {
  step: GrammarRuleStep;
  onContinue: () => void;
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
export function GrammarRuleStepView({ step, onContinue }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
        Grammar
      </p>

      <div className="relative overflow-hidden rounded-3xl border-2 border-info/40 bg-gradient-to-br from-info/15 via-info/10 to-accent/10 px-7 py-9 shadow-[var(--shadow-card)]">
        <span className="block text-5xl leading-none" aria-hidden>
          📝
        </span>
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

      <ContinueButton
        onClick={() => {
          // Passive — non-progress chirp + light haptic. See sfx.ts.
          playSfx("passive-advance");
          onContinue();
        }}
        label="Got it"
      />
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
