import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MultipleChoiceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import {
  getTtsUrl,
  playJaAudio,
  useAutoPlayJaAudio,
} from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { stepHasSentenceContent } from "../../data/_stepPredicates";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: MultipleChoiceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function MultipleChoiceStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctOptionId;

  useAutoPlayJaAudio(step.promptAudioText, `mc-${step.id}`);

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        setSelected(step.options[n - 1].id);
      }
    },
  });

  function handleSubmit() {
    if (!selected) return;
    const correct = selected === step.correctOptionId;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  function replayPromptAudio() {
    if (step.promptAudioText) playJaAudio(step.promptAudioText);
  }

  const ttsAvailable =
    !!step.promptAudioText && !!getTtsUrl(step.promptAudioText);
  // 2×2 grid when 4 options; single column otherwise. Anchors Continue by
  // sizing the option block with a fixed min-height regardless of layout.
  // `auto-rows-fr` forces both rows to equal heights — without it, a tile
  // whose content is the only 2-mora kana in a translateMcq grid blew up
  // to 5xl + py-9 while its 3-mora neighbors stayed text-xl + py-6
  // (Spencer's 2026-05-17 sizing-inconsistency report).
  const optionsAre4 = step.options.length === 4;
  const gridClasses = optionsAre4
    ? "relative grid grid-cols-2 grid-rows-2 auto-rows-fr gap-3 sm:gap-4"
    : "relative grid gap-3";

  const hasSubmittedWrong = submitted && !isCorrect;
  const showExplain = stepHasSentenceContent(step);

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      {showExplain && (
        <ExplainButton
          explanation={step.explanation}
          hasSubmittedWrong={hasSubmittedWrong}
        />
      )}
      {/* Content cluster centers as one unit in leftover height. */}
      <div className="my-auto flex flex-col gap-6">
      {step.audioOnlyPrompt ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            type="button"
            onClick={replayPromptAudio}
            disabled={!ttsAvailable}
            className="flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_4px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_5px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_2px_0_0_var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={32} />
          </button>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t("lesson.whichKanaStarts", "Which kana starts the word?")}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-text-primary">
            {step.promptAnnotation ? (
              <AnnotatedJa segments={step.promptAnnotation} />
            ) : (
              <AnnotatedJa text={step.prompt} />
            )}
          </h2>
          {ttsAvailable && (
            // Replayable speaker on every MC with a TTS prompt. Auto-play
            // fires once on mount; this lets the learner hear it again
            // without leaving the card. Especially load-bearing on test
            // cards where the romaji ruby is off — audio is the prompt.
            <button
              type="button"
              onClick={replayPromptAudio}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_3px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]"
              aria-label={t("lesson.play", "Play audio")}
            >
              <Icon name="play" size={14} />
            </button>
          )}
        </div>
      )}

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      {/* dvh-driven min-height lets option cards grow on tall windows
          (auto-rows-fr splits the extra height evenly). */}
      <div
        className={gridClasses}
        style={{
          minHeight: optionsAre4
            ? "clamp(320px, 52dvh, 640px)"
            : "clamp(260px, 44dvh, 520px)",
        }}
      >
        {step.options.map((opt, idx) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          const ann = step.optionAnnotations?.[idx];

          // Default + selected-pre-submit + post-submit-correct/wrong.
          // Pre-submit selection uses a lighter "picked, not locked"
          // tint (border-accent + bg-accent-muted + text-accent) so it's
          // clearly distinct from the full accent fill that marks a
          // submitted-correct answer. Pre-fix (2026-05-17 R1.1) both
          // states used the same green fill, which made tap-to-peek
          // look like commit-to-answer.
          let style =
            "border-border bg-surface text-text-primary hover:border-accent";

          if (submitted && isAnswer) {
            style = "border-accent bg-accent text-white";
          } else if (submitted && isSelected && !isAnswer) {
            style = "border-error bg-error/15 text-error";
          } else if (isSelected) {
            style = "border-accent bg-accent-muted text-accent";
          }

          // Layout per option:
          // - translateMcq (reveal-on-select): all 4 options render at
          //   one consistent size regardless of text length. Pre-fix the
          //   isShortGlyph branch fired for 2-mora かぎ and blew it up
          //   to text-5xl while 3-mora siblings stayed text-xl —
          //   tiles looked broken. Spencer 2026-05-17: "set height and
          //   width limits and then fill text". Now uniform mid-size +
          //   min-height; grid auto-rows-fr keeps rows equal.
          // - Regular MC short glyph (≤2 chars, single kana): big-glyph
          //   center layout, classic alphabet drill.
          // - Long text (sentences, English): left-aligned text-xl.
          const isShortGlyph = opt.text.length <= 2;
          const layout = step.optionsRevealRomajiOnSelect
            ? "flex items-center justify-center py-8 px-4 text-3xl sm:text-4xl font-bold min-h-[120px]"
            : isShortGlyph
              ? "flex items-center justify-center py-9 text-5xl sm:text-6xl font-bold"
              : "px-4 py-6 text-left text-xl font-medium leading-snug";

          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              aria-pressed={isSelected}
              onClick={() => setSelected(opt.id)}
              className={`rounded-xl border-2 transition-colors duration-150 ${layout} ${style} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {step.optionsHideRomaji ? (
                // Test/quiz mode — render the kana raw so the romaji
                // helper doesn't broadcast the answer.
                <span className="font-japanese" lang="ja">{opt.text}</span>
              ) : (() => {
                // Reveal-on-select: show romaji only on the currently-
                // selected option (pre-submit). Once submitted, show it
                // on the correct option too so feedback is readable.
                const showRomaji =
                  step.optionsRevealRomajiOnSelect &&
                  (isSelected || (submitted && isAnswer));
                return ann ? (
                  <AnnotatedJa segments={ann} forceShowHelper={showRomaji} />
                ) : (
                  <AnnotatedJa text={opt.text} forceShowHelper={showRomaji} />
                );
              })()}
            </button>
          );
        })}
      </div>
      </div>

      {/* Single bottom-anchored block: wrong-answer banner + CTA together
          so the button never moves on submit. */}
      <div className="relative flex flex-col gap-4">
        {celebrating && <CelebrationToast text={celebrationText} />}
        {submitted && !isCorrect && (
          <Feedback correct={false} explanation={step.explanation} />
        )}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            label="Check"
            disabled={!selected}
          />
        ) : (
          <ContinueButton
            onClick={onContinue}
            variant={isCorrect ? "correct" : "incorrect"}
          />
        )}
      </div>
    </div>
  );
}
