import { useCallback, useEffect, useMemo, useState } from "react";
import type { SpeakingStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedJa, convertToHiragana } from "@/shared/japanese";
import { tokenizeJapanese } from "@/shared/japanese/kanaTable";
import { getTtsUrl, playJaAudio, useAutoPlayJaAudio } from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";
import { useSettings } from "@/shared/contexts/SettingsContext";
import {
  getSpeechConfig,
  isSpeechFlagEnabled,
  isSpeechRecognitionSupported,
  pushSpeechLog,
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
 * Routing:
 *  - `step.stubbed === true` OR Whisper feature flag off → placeholder
 *    ("I said it!" ungraded continue). Matches pre-POC behavior so
 *    legacy lessons (M1 vowel sa, M1 l1/l2, particles tutor stub, etc.)
 *    don't regress.
 *  - `step.stubbed === false` AND `?speech=1` flag on (default) →
 *    Whisper-graded 2-attempt + reward-the-try flow (R1.3, 2026-05-17).
 *
 * 2-attempt + reward-the-try (R1.3b, Spencer 2026-05-17):
 *  - Attempt 1 passes → onComplete(stepId, true), continue.
 *  - Attempt 1 fails → show transcript next to target, "Try again".
 *  - Attempt 2 passes → onComplete(stepId, true).
 *  - Attempt 2 fails → auto-pass with "Good effort — moving on" framing,
 *    onComplete(stepId, true). Spencer's rule: "can't get it wrong but
 *    must try something." Logged for triage (see speechLog.ts).
 *  - Skip without trying is NOT available when grading is on (must try
 *    something). Falls back to "Continue" only when the browser doesn't
 *    support recognition at all.
 *
 * Tuning dials (sessionStorage, set via URL):
 *   ?speech-perfect=0.85   perfect threshold
 *   ?speech-close=0.55     close threshold
 *   ?speech-strict=1       disable normalization (raw char-overlap)
 *   ?speech-alts=5         N-best alternatives requested
 *   ?speech-debug=1        show debug panel under verdict
 *   ?speech-engine=whisper backend selector (default whisper)
 */
export function SpeakingStepView({ step, onComplete, onContinue }: Props) {
  const speechFlag = isSpeechFlagEnabled();
  // `stubbed: true` always renders the placeholder regardless of flag —
  // legacy stub steps were never wired through the grader. `stubbed:
  // false` only graduates when the speech flag is also on (so the
  // explicit `?speech=0` opt-out still works end-to-end).
  if (speechFlag && !step.stubbed) {
    return (
      <SpeakingStepRecognized
        step={step}
        onComplete={onComplete}
        onContinue={onContinue}
      />
    );
  }
  return (
    <SpeakingStepPlaceholder step={step} onContinue={onContinue} />
  );
}

function SpeakingStepPlaceholder({
  step,
  onContinue,
}: {
  step: SpeakingStep;
  onContinue: () => void;
}) {
  const audioUrl = getTtsUrl(step.targetPhrase);
  const silentMode = useSettings().settings.audio.silentMode;
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

      <ReferenceCard step={step} onPlay={handlePlay} showRomaji={false} />

      {silentMode && <SilentModeNotice />}

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
  showRomaji,
}: {
  step: SpeakingStep;
  onPlay: () => void;
  showRomaji: boolean;
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
          <AnnotatedJa segments={step.targetAnnotation} forceShowHelper={showRomaji} />
        ) : (
          <AnnotatedJa text={step.targetPhrase} forceShowHelper={showRomaji} />
        )}
      </p>
      <p className="text-sm text-text-muted">{step.translation}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Speech-recognition path (Whisper-graded, 2-attempt + reward-the-try)      */
/* -------------------------------------------------------------------------- */

type LocalVerdict = Verdict | "idle" | "auto-pass";

/** sessionStorage key for the "Show romaji" toggle on speaking steps.
 *  Default OFF so confident learners aren't crutched; once a learner
 *  toggles it on, it sticks for the rest of the session. */
const ROMAJI_TOGGLE_KEY = "lingo_speak_show_romaji_v1";

function readRomajiToggle(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(ROMAJI_TOGGLE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeRomajiToggle(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.sessionStorage.setItem(ROMAJI_TOGGLE_KEY, "1");
    else window.sessionStorage.removeItem(ROMAJI_TOGGLE_KEY);
  } catch {
    /* private mode — ignore */
  }
}

/** Format kana → "ka·gi" romaji string for the transcript inline hint.
 *  Uses tokenizeJapanese so yōon merge into one token; non-kana glyphs
 *  (kanji, punctuation) pass through unchanged. */
function kanaToRomajiHint(kana: string): string {
  const tokens = tokenizeJapanese(kana);
  return tokens
    .map((t) => (t.kana && t.romaji ? t.romaji : t.text))
    .join("");
}

function SpeakingStepRecognized({
  step,
  onComplete,
  onContinue,
}: {
  step: SpeakingStep;
  onComplete?: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
}) {
  const silentMode = useSettings().settings.audio.silentMode;
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
  const [attempts, setAttempts] = useState<0 | 1 | 2>(0);
  // Map from raw transcript → kanji→kana converted form for the debug
  // panel. Only populated when conversion actually changed the string.
  const [conversions, setConversions] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [showRomaji, setShowRomajiState] = useState<boolean>(() =>
    readRomajiToggle(),
  );

  const toggleRomaji = useCallback(() => {
    setShowRomajiState((prev) => {
      const next = !prev;
      writeRomajiToggle(next);
      return next;
    });
  }, []);

  // When recognition finishes, score all alternatives against the
  // target and surface a tiered verdict. The hook resets on the next
  // start(), so each attempt is a clean grade.
  useEffect(() => {
    if (!recog.finished) return;
    if (recog.error) {
      // Recognition itself errored (no-speech / no-mic / aborted).
      // Treat as a fail attempt for the 2-attempt cap so we don't trap
      // the learner in an infinite mic loop. The error helper text
      // surfaces what went wrong.
      setMatch(null);
      setAttempts((prev) => {
        const next = (Math.min(prev + 1, 2)) as 1 | 2;
        if (next === 2) {
          // Auto-pass on the second failed attempt — reward-the-try.
          setVerdict("auto-pass");
          pushSpeechLog({
            stepId: step.id,
            targetKana: step.targetPhrase,
            transcriptKana: "",
            attemptNumber: 2,
            verdict: "auto-pass",
            timestamp: Date.now(),
          });
          if (onComplete) onComplete(step.id, true);
        } else {
          setVerdict("try-again");
          pushSpeechLog({
            stepId: step.id,
            targetKana: step.targetPhrase,
            transcriptKana: "",
            attemptNumber: 1,
            verdict: "fail",
            timestamp: Date.now(),
          });
        }
        return next;
      });
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
      setMatch(null);
      setAttempts((prev) => {
        const next = (Math.min(prev + 1, 2)) as 1 | 2;
        if (next === 2) {
          setVerdict("auto-pass");
          pushSpeechLog({
            stepId: step.id,
            targetKana: step.targetPhrase,
            transcriptKana: "",
            attemptNumber: 2,
            verdict: "auto-pass",
            timestamp: Date.now(),
          });
          if (onComplete) onComplete(step.id, true);
        } else {
          setVerdict("try-again");
          pushSpeechLog({
            stepId: step.id,
            targetKana: step.targetPhrase,
            transcriptKana: "",
            attemptNumber: 1,
            verdict: "fail",
            timestamp: Date.now(),
          });
        }
        return next;
      });
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

      const bestTranscript = result.bestAlternative?.raw ?? "";
      const passed =
        result.verdict === "perfect" || result.verdict === "close";

      setAttempts((prev) => {
        const next = (Math.min(prev + 1, 2)) as 1 | 2;
        if (passed) {
          setVerdict(result.verdict);
          pushSpeechLog({
            stepId: step.id,
            targetKana: step.targetPhrase,
            transcriptKana: bestTranscript,
            attemptNumber: next,
            verdict: "pass",
            timestamp: Date.now(),
          });
          if (onComplete) onComplete(step.id, result.verdict === "perfect");
        } else if (next === 2) {
          // Second swing missed — auto-pass with reward-the-try framing.
          setVerdict("auto-pass");
          pushSpeechLog({
            stepId: step.id,
            targetKana: step.targetPhrase,
            transcriptKana: bestTranscript,
            attemptNumber: 2,
            verdict: "auto-pass",
            timestamp: Date.now(),
          });
          if (onComplete) onComplete(step.id, true);
        } else {
          setVerdict("try-again");
          pushSpeechLog({
            stepId: step.id,
            targetKana: step.targetPhrase,
            transcriptKana: bestTranscript,
            attemptNumber: 1,
            verdict: "fail",
            timestamp: Date.now(),
          });
        }
        return next;
      });
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
    config,
  ]);

  function handleRecord() {
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
    if (verdict === "auto-pass") return "Good effort — moving on.";
    if (verdict === "try-again" && attempts > 0)
      return "Not quite — give it one more go.";
    return "Tap the mic and say the phrase aloud.";
  })();

  const helperToneClass = (() => {
    if (verdict === "perfect") return "text-success";
    if (verdict === "close") return "text-warning";
    if (verdict === "auto-pass") return "text-text-secondary";
    if (verdict === "try-again" && attempts > 0) return "text-danger";
    return "text-text-secondary";
  })();

  // After any attempt completes (pass / try-again / auto-pass), Continue
  // is available. Skip-without-trying is gated — must try something.
  const canContinue =
    verdict === "perfect" ||
    verdict === "close" ||
    verdict === "auto-pass";

  // No mic / unsupported browser → graceful Continue (don't punish
  // Firefox / no-permission flows).
  const fallbackContinue = !supported;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Speaking practice
        </p>
        <button
          type="button"
          onClick={toggleRomaji}
          className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-secondary transition hover:bg-surface-muted"
          aria-pressed={showRomaji}
        >
          {showRomaji ? "Hide romaji" : "Show romaji"}
        </button>
      </div>

      <ReferenceCard step={step} onPlay={handleListen} showRomaji={showRomaji} />

      {silentMode && <SilentModeNotice />}

      <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface px-5 py-6 shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={recog.listening ? handleStop : handleRecord}
          disabled={
            !supported ||
            whisperLoading ||
            whisperTranscribing ||
            canContinue
          }
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

        {/* Live "Heard" line while transcribing — replaced by the
            scored block once the verdict lands. */}
        {recog.transcript && verdict === "idle" && (
          <p className="rounded-xl bg-surface-muted px-4 py-2 text-base text-text-primary">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              Heard
            </span>
            <span className="font-japanese" lang="ja">{recog.transcript}</span>
          </p>
        )}

        {bestAltText && verdict !== "idle" && (
          <TranscriptCard
            transcriptKana={bestAltText}
            targetKana={step.targetPhrase}
            verdict={verdict}
            showRomaji={showRomaji}
          />
        )}

        {/* Try-again button — second attempt is the last one. */}
        {verdict === "try-again" && !recog.listening && attempts < 2 && (
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

      {canContinue ? (
        <ContinueButton
          onClick={onContinue}
          variant={verdict === "perfect" ? "correct" : undefined}
          label={
            verdict === "close"
              ? "Continue anyway"
              : verdict === "auto-pass"
                ? "Continue"
                : undefined
          }
        />
      ) : fallbackContinue ? (
        // Unsupported browser → ungraded continue. Never reached when
        // mic + Whisper are both available — the canContinue branch
        // hits first after an attempt.
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl border-[1.5px] border-border bg-surface px-6 py-3.5 text-base font-bold uppercase tracking-wide text-text-secondary transition hover:bg-surface-muted"
        >
          Continue
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Silent-mode disclosure — keeps the learner from wondering why nothing      */
/*  played on mount when audio.silentMode is on. Non-blocking, just a hint.   */
/* -------------------------------------------------------------------------- */

function SilentModeNotice() {
  return (
    <div
      className="rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-xs text-text-secondary"
      role="status"
    >
      <span className="mr-1.5" aria-hidden>🔇</span>
      Audio silenced — tap the speaker to hear it.
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Transcript card — shown after each attempt                                */
/* -------------------------------------------------------------------------- */

function TranscriptCard({
  transcriptKana,
  targetKana,
  verdict,
  showRomaji,
}: {
  transcriptKana: string;
  targetKana: string;
  verdict: LocalVerdict;
  showRomaji: boolean;
}) {
  const passed = verdict === "perfect" || verdict === "close";
  const autoPass = verdict === "auto-pass";
  // After a fail (try-again or auto-pass), show the target side-by-side
  // so the learner can compare what they said to what was wanted.
  const showSideBySide = !passed && (verdict === "try-again" || autoPass);
  const transcriptRomaji = showRomaji ? kanaToRomajiHint(transcriptKana) : "";
  const targetRomaji = showRomaji ? kanaToRomajiHint(targetKana) : "";

  return (
    <div className="w-full rounded-xl bg-surface-muted px-4 py-3 text-base text-text-primary">
      <div className="flex items-start gap-3">
        <span
          className={`text-lg leading-none ${
            passed
              ? "text-success"
              : autoPass
                ? "text-text-muted"
                : "text-danger"
          }`}
          aria-hidden
        >
          {passed ? "✓" : autoPass ? "○" : "✗"}
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            You said
          </p>
          <p className="font-japanese text-xl text-text-primary" lang="ja">
            {transcriptKana || "—"}
          </p>
          {showRomaji && transcriptRomaji && (
            <p className="mt-0.5 text-xs text-text-muted">{transcriptRomaji}</p>
          )}
        </div>
      </div>

      {showSideBySide && (
        <div className="mt-3 flex items-start gap-3 border-t border-border pt-2">
          <span className="text-lg leading-none text-text-muted" aria-hidden>
            🎯
          </span>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Target
            </p>
            <p className="font-japanese text-xl text-text-primary" lang="ja">
              {targetKana}
            </p>
            {showRomaji && targetRomaji && (
              <p className="mt-0.5 text-xs text-text-muted">{targetRomaji}</p>
            )}
          </div>
        </div>
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
