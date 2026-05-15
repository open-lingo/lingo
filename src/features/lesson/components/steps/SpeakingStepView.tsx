import { useEffect, useMemo, useState } from "react";
import type { SpeakingStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedJa } from "@/shared/japanese";
import { getTtsUrl, playJaAudio, useAutoPlayJaAudio } from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";
import {
  isSpeechFlagEnabled,
  isSpeechRecognitionSupported,
  isUtteranceCorrect,
  useSpeechRecognition,
} from "@/shared/speech";

type Props = {
  step: SpeakingStep;
  onComplete?: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Speaking step.
 *
 * Default (no `?speech=1`): unchanged placeholder card with a "listen,
 * then say it" prompt and an "I said it!" continue button. Matches
 * pre-POC behavior so existing users see no regression.
 *
 * Feature-flagged path (`?speech=1` once per session): wires the Web
 * Speech API for `ja-JP` and grades the utterance with the loose match
 * helper. Listen-back uses the existing TTS pipeline.
 *
 * The flag is read at render time (not via React Context) on purpose —
 * the gate is a dev / preview surface, not a stable user setting.
 */
export function SpeakingStepView({ step, onComplete, onContinue }: Props) {
  const speechFlag = isSpeechFlagEnabled();
  if (speechFlag) {
    return (
      <SpeakingStepRecognized
        step={step}
        onComplete={onComplete}
        onContinue={onContinue}
      />
    );
  }
  return <SpeakingStepPlaceholder step={step} onContinue={onContinue} />;
}

function SpeakingStepPlaceholder({
  step,
  onContinue,
}: {
  step: SpeakingStep;
  onContinue: () => void;
}) {
  const audioUrl = getTtsUrl(step.targetPhrase);
  useAutoPlayJaAudio(step.targetPhrase, `speak-${step.id}`);
  function handlePlay() {
    if (!audioUrl) return;
    playJaAudio(step.targetPhrase);
  }
  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        Speaking practice
      </p>

      <ReferenceCard step={step} onPlay={handlePlay} />

      <div className="rounded-2xl border-[1.5px] border-warning/40 bg-warning/10 px-5 py-4 text-sm text-text-secondary">
        <span className="mr-1.5">🎤</span>
        Speech recognition is not yet available. Practice saying the phrase aloud, then continue.
      </div>

      <ContinueButton onClick={onContinue} label="I said it!" />
    </div>
  );
}

function ReferenceCard({
  step,
  onPlay,
}: {
  step: SpeakingStep;
  onPlay: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border-[1.5px] border-border bg-surface py-10 shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={onPlay}
        className="flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_4px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_5px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_2px_0_0_var(--color-accent-hover)]"
        aria-label="Play audio"
      >
        <Icon name="play" size={28} />
      </button>

      <p className="text-4xl font-extrabold tracking-tight text-text-primary">
        {step.targetAnnotation ? (
          <AnnotatedJa segments={step.targetAnnotation} />
        ) : (
          <AnnotatedJa text={step.targetPhrase} />
        )}
      </p>
      <p className="text-sm text-text-muted">{step.translation}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Speech-recognition path (feature-flagged)                                 */
/* -------------------------------------------------------------------------- */

type Verdict = "idle" | "pass" | "fail";

function SpeakingStepRecognized({
  step,
  onComplete,
  onContinue,
}: {
  step: SpeakingStep;
  onComplete?: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
}) {
  const supported = useMemo(() => isSpeechRecognitionSupported(), []);
  const recog = useSpeechRecognition("ja-JP");
  const [verdict, setVerdict] = useState<Verdict>("idle");
  const [attempts, setAttempts] = useState(0);

  // When recognition finishes, score the final transcript once and
  // surface a pass/fail. The hook resets on the next start(), so each
  // attempt is a clean grade.
  useEffect(() => {
    if (!recog.finished) return;
    if (recog.error) {
      setVerdict("fail");
      return;
    }
    if (!recog.transcript.trim()) {
      // Treat empty results as a soft fail — "try again", don't record.
      setVerdict("fail");
      return;
    }
    const correct = isUtteranceCorrect(step.targetPhrase, recog.transcript);
    setVerdict(correct ? "pass" : "fail");
    if (correct && onComplete) {
      onComplete(step.id, true);
    }
  }, [recog.finished, recog.error, recog.transcript, step.id, step.targetPhrase, onComplete]);

  function handleRecord() {
    setAttempts((n) => n + 1);
    setVerdict("idle");
    recog.start();
  }

  function handleStop() {
    recog.stop();
  }

  function handleListen() {
    playJaAudio(step.targetPhrase);
  }

  function handleSkip() {
    // User opts out (no mic / unsupported browser). Treat as ungraded
    // pass — same shape as the placeholder's "I said it!" CTA so we
    // don't punish learners on Firefox.
    onContinue();
  }

  const helperText = (() => {
    if (!supported) return "Pronunciation isn't supported in this browser.";
    if (recog.error === "no-mic") return "Microphone permission was blocked.";
    if (recog.error === "no-speech") return "Didn't catch that — try again.";
    if (recog.error === "audio-capture") return "Couldn't access your mic.";
    if (recog.error && recog.error !== "aborted")
      return "Speech recognition hit an error — try again.";
    if (recog.listening) return "Listening…";
    if (verdict === "pass") return "Nice!";
    if (verdict === "fail" && attempts > 0) return "Not quite — give it another try.";
    return "Tap the mic and say the phrase aloud.";
  })();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        Speaking practice
      </p>

      <ReferenceCard step={step} onPlay={handleListen} />

      <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface px-5 py-6 shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={recog.listening ? handleStop : handleRecord}
          disabled={!supported}
          className={`flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] text-white shadow-[0_4px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_5px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_2px_0_0_var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40 ${
            recog.listening
              ? "border-red-700 bg-red-500 animate-pulse"
              : "border-accent-hover bg-accent"
          }`}
          aria-label={recog.listening ? "Stop recording" : "Tap to speak"}
        >
          <span className="text-3xl">🎤</span>
        </button>

        <p className="min-h-[1.5rem] text-sm text-text-secondary">{helperText}</p>

        {recog.transcript && (
          <p className="rounded-xl bg-surface-muted px-4 py-2 text-base text-text-primary">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              Heard
            </span>
            {recog.transcript}
          </p>
        )}

        {verdict === "fail" && !recog.listening && (
          <button
            type="button"
            onClick={handleRecord}
            className="rounded-xl border-[1.5px] border-border bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide text-text-secondary transition hover:bg-surface-muted"
          >
            Try again
          </button>
        )}
      </div>

      {verdict === "pass" ? (
        <ContinueButton onClick={onContinue} variant="correct" />
      ) : (
        <button
          type="button"
          onClick={handleSkip}
          className="w-full rounded-xl border-[1.5px] border-border bg-surface px-6 py-3.5 text-base font-bold uppercase tracking-wide text-text-secondary transition hover:bg-surface-muted"
        >
          {supported ? "Skip for now" : "Continue"}
        </button>
      )}
    </div>
  );
}
