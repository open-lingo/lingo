import { useEffect, useMemo, useState } from "react";
import type { SpeakingStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedJa, convertToHiragana } from "@/shared/japanese";
import { getTtsUrl, playJaAudio, useAutoPlayJaAudio } from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";
import {
  getSpeechConfig,
  isSpeechFlagEnabled,
  isSpeechRecognitionSupported,
  scoreAlternatives,
  tiersForTarget,
  useSpeechRecognition,
  useWhisperRecognition,
  type MatchResult,
  type SpeechAlternative,
  type UseSpeechRecognitionApi,
  type UseWhisperRecognitionApi,
  type Verdict,
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
 * Speech API for `ja-JP` and grades the utterance with the tiered
 * scorer. Listen-back uses the existing TTS pipeline.
 *
 * Tuning dials (all sessionStorage, set via URL):
 *   ?speech-perfect=0.85   perfect threshold
 *   ?speech-close=0.55     close threshold
 *   ?speech-strict=1       disable normalization (raw char-overlap)
 *   ?speech-alts=5         N-best alternatives requested
 *   ?speech-debug=1        show debug panel under verdict
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

type LocalVerdict = Verdict | "idle";

function SpeakingStepRecognized({
  step,
  onComplete,
  onContinue,
}: {
  step: SpeakingStep;
  onComplete?: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
}) {
  // Read dials once per render. Cheap; dial changes apply on the next
  // recognition session (via the `start` dependency chain).
  const config = useMemo(() => getSpeechConfig(), []);
  const usingWhisper = config.engine === "whisper";
  // Both hooks return a shape compatible with `UseSpeechRecognitionApi`.
  // We always mount one — the engine dial picks which. React's rules of
  // hooks are respected because `usingWhisper` is stable across the
  // lifetime of this mount (sessionStorage-backed, never changes
  // mid-render).
  const webRecog = useSpeechRecognition("ja-JP", {
    maxAlternatives: config.maxAlternatives,
  });
  const whisperRecog: UseWhisperRecognitionApi = useWhisperRecognition("ja");
  const recog: UseSpeechRecognitionApi | UseWhisperRecognitionApi = usingWhisper
    ? whisperRecog
    : webRecog;
  const supported = useMemo(() => {
    if (usingWhisper) {
      return (
        typeof window !== "undefined" &&
        typeof Worker !== "undefined" &&
        typeof AudioContext !== "undefined"
      );
    }
    return isSpeechRecognitionSupported();
  }, [usingWhisper]);
  const whisperLoading =
    usingWhisper &&
    (whisperRecog.status === "loading" || whisperRecog.status === "idle");
  const whisperTranscribing =
    usingWhisper && whisperRecog.status === "transcribing";
  const whisperProgress = usingWhisper ? whisperRecog.downloadProgress : null;
  const [verdict, setVerdict] = useState<LocalVerdict>("idle");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  // Map from raw transcript → kanji→kana converted form for the debug
  // panel. Only populated when conversion actually changed the string.
  const [conversions, setConversions] = useState<Map<string, string>>(
    () => new Map(),
  );

  // When recognition finishes, score all alternatives against the
  // target and surface a tiered verdict. The hook resets on the next
  // start(), so each attempt is a clean grade.
  useEffect(() => {
    if (!recog.finished) return;
    if (recog.error) {
      setVerdict("try-again");
      setMatch(null);
      return;
    }

    // Prefer the explicit N-best list when present; fall back to the
    // top-1 transcript on browsers that don't populate alternatives.
    const rawAlts: SpeechAlternative[] =
      recog.alternatives.length > 0
        ? recog.alternatives
        : recog.transcript.trim()
          ? [{ transcript: recog.transcript }]
          : [];

    if (rawAlts.length === 0) {
      setVerdict("try-again");
      setMatch(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      // Whisper (and sometimes Safari on-device) returns natural-
      // orthography Japanese — kanji included. The scorer normalizes
      // kana but doesn't read kanji, so we convert before scoring.
      // Pure-kana transcripts short-circuit inside convertToHiragana.
      const converted = await Promise.all(
        rawAlts.map(async (a) => ({
          ...a,
          transcript: await convertToHiragana(a.transcript),
        })),
      );
      if (cancelled) return;

      // Key by the converted form (which is what `AlternativeScore.raw`
      // will be after scoring), value = the original Whisper output.
      // Lets the debug panel render "converted ← original-kanji-form".
      const conv = new Map<string, string>();
      for (let i = 0; i < rawAlts.length; i++) {
        const raw = rawAlts[i].transcript;
        const cv = converted[i].transcript;
        if (raw !== cv) conv.set(cv, raw);
      }
      setConversions(conv);

      // Mora-aware thresholds: short utterances (<5 mora) get a much
      // looser perfect bar because Whisper struggles on sub-second audio.
      // Explicit ?speech-perfect / ?speech-close overrides bypass scaling.
      const tiers = tiersForTarget(step.targetPhrase, config);
      const result = scoreAlternatives(step.targetPhrase, converted, tiers);
      setMatch(result);
      setVerdict(result.verdict);

      // Both perfect and close count as completion. try-again does not.
      if (
        (result.verdict === "perfect" || result.verdict === "close") &&
        onComplete
      ) {
        onComplete(step.id, result.verdict === "perfect");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    recog.finished,
    recog.error,
    recog.transcript,
    recog.alternatives,
    step.id,
    step.targetPhrase,
    onComplete,
    config.perfectThreshold,
    config.closeThreshold,
    config.strict,
  ]);

  function handleRecord() {
    setAttempts((n) => n + 1);
    setVerdict("idle");
    setMatch(null);
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

  const bestAltText = match?.bestAlternative?.raw ?? "";

  const helperText = (() => {
    if (!supported) return "Pronunciation isn't supported in this browser.";
    if (whisperLoading) {
      const pct =
        whisperProgress !== null ? Math.round(whisperProgress * 100) : null;
      return pct !== null
        ? `Loading Whisper model (one-time download)… ${pct}%`
        : "Loading Whisper model (one-time download)…";
    }
    if (whisperTranscribing) return "Transcribing…";
    if (recog.error === "no-mic") return "Microphone permission was blocked.";
    if (recog.error === "no-speech") return "Didn't catch that — try again.";
    if (recog.error === "audio-capture") return "Couldn't access your mic.";
    if (recog.error && recog.error !== "aborted")
      return "Speech recognition hit an error — try again.";
    if (recog.listening) return "Listening…";
    if (verdict === "perfect") return "Perfect!";
    if (verdict === "close")
      return bestAltText
        ? `Close — sounded like “${bestAltText}”.`
        : "Close — you can continue.";
    if (verdict === "try-again" && attempts > 0)
      return "Try again — give it another go.";
    return "Tap the mic and say the phrase aloud.";
  })();

  const helperToneClass = (() => {
    if (verdict === "perfect") return "text-success";
    if (verdict === "close") return "text-warning";
    if (verdict === "try-again" && attempts > 0) return "text-danger";
    return "text-text-secondary";
  })();

  const advanceOk = verdict === "perfect" || verdict === "close";

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
          disabled={!supported || whisperLoading || whisperTranscribing}
          className={`flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] text-white shadow-[0_4px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_5px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_2px_0_0_var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40 ${
            recog.listening
              ? "border-red-700 bg-red-500 animate-pulse"
              : "border-accent-hover bg-accent"
          }`}
          aria-label={recog.listening ? "Stop recording" : "Tap to speak"}
        >
          <span className="text-3xl">🎤</span>
        </button>

        <p className={`min-h-[1.5rem] text-sm ${helperToneClass}`}>
          {helperText}
        </p>

        {recog.transcript && verdict === "idle" && (
          <p className="rounded-xl bg-surface-muted px-4 py-2 text-base text-text-primary">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              Heard
            </span>
            {recog.transcript}
          </p>
        )}

        {match && bestAltText && verdict !== "idle" && (
          <p className="rounded-xl bg-surface-muted px-4 py-2 text-base text-text-primary">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              Heard
            </span>
            {bestAltText}
          </p>
        )}

        {verdict === "try-again" && !recog.listening && (
          <button
            type="button"
            onClick={handleRecord}
            className="rounded-xl border-[1.5px] border-border bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide text-text-secondary transition hover:bg-surface-muted"
          >
            Try again
          </button>
        )}

        {config.debug && (
          <SpeechDebugPanel
            target={step.targetPhrase}
            match={match}
            config={config}
            conversions={conversions}
          />
        )}
      </div>

      {advanceOk ? (
        <ContinueButton
          onClick={onContinue}
          variant={verdict === "perfect" ? "correct" : undefined}
          label={verdict === "close" ? "Continue anyway" : undefined}
        />
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

/* -------------------------------------------------------------------------- */
/*  Debug panel (?speech-debug=1)                                             */
/* -------------------------------------------------------------------------- */

function SpeechDebugPanel({
  target,
  match,
  config,
  conversions,
}: {
  target: string;
  match: MatchResult | null;
  config: ReturnType<typeof getSpeechConfig>;
  /** raw transcript → kanji→kana converted form (only when changed). */
  conversions: Map<string, string>;
}) {
  return (
    <div className="mt-2 w-full rounded-xl border border-dashed border-border bg-surface-muted/60 px-3 py-2 text-left text-xs leading-snug text-text-secondary">
      <p className="mb-1 font-bold uppercase tracking-wider text-text-muted">
        Speech debug
      </p>
      <p>
        <span className="text-text-muted">target:</span> {target}
        {match && (
          <>
            {" → "}
            <span className="text-text-muted">norm:</span> {match.targetNormalized || "—"}
          </>
        )}
      </p>
      <p>
        <span className="text-text-muted">
          tiers: perfect ≥ {config.perfectThreshold.toFixed(2)} · close ≥{" "}
          {config.closeThreshold.toFixed(2)}
          {config.strict ? " · strict" : ""}
        </span>
      </p>
      {match && (
        <>
          <p className="mt-1 font-bold text-text-primary">
            verdict: {match.verdict} (score {match.bestScore.toFixed(2)})
          </p>
          <ul className="mt-1 space-y-0.5">
            {match.alternatives.map((alt, i) => {
              const isBest =
                match.bestAlternative !== null &&
                alt === match.bestAlternative;
              const original = conversions.get(alt.raw);
              return (
                <li
                  key={`${i}-${alt.raw}`}
                  className={isBest ? "text-text-primary" : ""}
                >
                  {isBest ? "▸ " : "  "}
                  {i + 1}.{" "}
                  {original ? (
                    <>
                      “{original}” → kana “{alt.raw}”
                    </>
                  ) : (
                    <>“{alt.raw}”</>
                  )}
                  {" → "}
                  “{alt.normalized || "—"}”
                  {" · "}
                  score {alt.score.toFixed(2)}
                  {typeof alt.confidence === "number" && (
                    <> · conf {alt.confidence.toFixed(2)}</>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
