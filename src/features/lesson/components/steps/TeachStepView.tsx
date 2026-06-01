import type { TeachStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { getTtsUrl, useAutoPlayJaAudio, playJaAudio } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

type Props = {
  step: TeachStep;
  onContinue: () => void;
};

export function TeachStepView({ step, onContinue }: Props) {
  useLessonKeyboard({ onEnter: onContinue });
  const { content } = step;
  const { vocab } = content;
  const ttsUrl = vocab ? getTtsUrl(vocab.term) : null;
  useAutoPlayJaAudio(vocab?.term, `teach-${step.id}`);

  function playTerm() {
    if (!vocab) return;
    void playJaAudio(vocab.term);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-base leading-relaxed text-text-secondary">
        {content.text}
      </p>

      {vocab && (
        <div className="overflow-hidden rounded-2xl border-[1.5px] border-border bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 px-5 py-5">
            <span className="text-3xl font-extrabold tracking-tight text-text-primary">
              {vocab.annotation ? (
                <AnnotatedJa segments={vocab.annotation} />
              ) : (
                <AnnotatedJa text={vocab.term} />
              )}
            </span>
            <span className="text-sm text-text-muted">
              {vocab.translation}
            </span>
            {ttsUrl && (
              <button
                type="button"
                onClick={playTerm}
                className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_3px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]"
                aria-label="Play"
              >
                <Icon name="play" size={16} />
              </button>
            )}
          </div>

          {vocab.breakdown && vocab.breakdown.length > 0 && (
            <div className="border-t border-dashed border-border px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {vocab.breakdown.map((seg, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-xl border-[1.5px] border-border bg-surface-muted px-3 py-1.5 text-sm"
                  >
                    <span className="font-semibold text-accent">
                      {seg.segment}
                    </span>
                    {seg.meaning && (
                      <span className="text-text-muted">
                        {seg.meaning}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {content.note && (
        <div className="rounded-2xl border-[1.5px] border-border bg-surface-muted px-5 py-4 text-sm text-text-secondary">
          <Icon name="lightbulb" size={16} className="mr-1.5 inline-block shrink-0 text-warning" />
          {content.note}
        </div>
      )}

      <ContinueButton onClick={onContinue} />
    </div>
  );
}
