import { useState } from "react";
import type { ListeningComprehensionStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { AnnotatedJa } from "@/shared/japanese";
import { getTtsUrl } from "@/shared/japanese/tts";

type Props = {
  step: ListeningComprehensionStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function ListeningComprehensionStepView({ step, onComplete, onContinue }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const isCorrect = selected === step.correctOptionId;

  const audioUrl = step.transcript ? getTtsUrl(step.transcript) : null;

  function handlePlay() {
    if (!audioUrl) return;
    new Audio(audioUrl).play().catch(() => {});
  }

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onComplete(step.id, selected === step.correctOptionId);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-800/40 dark:text-emerald-300 dark:hover:bg-emerald-700/40"
          aria-label="Play audio"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Listen and answer
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{step.audioKey}</p>
        </div>
      </div>

      {step.transcript && (
        <div>
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {showTranscript ? "Hide transcript" : "Show transcript"}
          </button>
          {showTranscript && (
            <p className="mt-2 rounded-lg bg-gray-50 px-4 py-2 text-base text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {step.transcriptAnnotation ? (
                <AnnotatedJa segments={step.transcriptAnnotation} />
              ) : (
                <AnnotatedJa text={step.transcript} />
              )}
            </p>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {step.question}
      </h2>

      <div className="grid gap-3">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;

          let style = "border-gray-200 bg-white hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-emerald-600";
          if (submitted && isAnswer) {
            style = "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/30";
          } else if (submitted && isSelected && !isAnswer) {
            style = "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/30";
          } else if (isSelected) {
            style = "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-900/20";
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(opt.id)}
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${style}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {submitted && <Feedback correct={isCorrect} explanation={step.explanation} />}

      {!submitted ? (
        <ContinueButton onClick={handleSubmit} label="Check" disabled={!selected} />
      ) : (
        <ContinueButton onClick={onContinue} variant={isCorrect ? "correct" : "incorrect"} />
      )}
    </div>
  );
}
