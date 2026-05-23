import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SpeakingStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedJa, convertToHiragana } from "@/shared/japanese";
import { tokenizeJapanese } from "@/shared/japanese/kanaTable";
import { getTtsUrl, playJaAudio, useAutoPlayJaAudio } from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
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
 *    ("I said it!" ungraded continue). Now only used by:
 *      - legacy mock-m1-l1.ts / mock-m1-l2.ts intro lessons
 *      - lessonBuilder's per-kana single-mora "say さ" drills (Whisper
 *        grades sub-second utterances poorly; left ungraded by design)
 *    Whole-word + sentence speaking (all consonant rows, all M3-M7
 *    dialogue closers) route through the recognized path below.
 *  - `step.stubbed === false` AND `?speech=1` flag on (default) →
 *    Whisper-graded flow (see attempt-flow block below).
 *
 * Attempt flow (Spencer 2026-05-18 — retired the attempt-2 auto-pass):
 *  - Any attempt that scores `perfect` or `close` → onComplete(true),
 *    continue immediately.
 *  - Attempt 1 fails → show transcript next to target, "Try again" only.
 *  - Attempt 2+ fails → surface BOTH "Try again" AND "Continue (skip)".
 *    The learner picks: keep at it, or move on without a pass.
 *    "Continue (skip)" calls onComplete(stepId, false) and logs verdict
 *    "continued" so analytics see the explicit opt-out (not silent
 *    auto-grant).
 *  - Persistent-error escape: when recognition can't run at all
 *    (no-mic permission, no audio capture, unsupported browser, or
 *    Whisper hasn't finished loading after WHISPER_LOAD_TIMEOUT_MS), a
 *    "Skip this step" button surfaces immediately — no need to burn 2
 *    fake attempts to reach it.
 *  - Skip without trying is still gated when recognition IS working;
 *    must try at least once before "Continue (skip)" appears.
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
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={false}
      />
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

type LocalVerdict = Verdict | "idle";

/** Whisper load deadline before we surface a "slow load — skip?"
 *  affordance. 30s is generous on cold-cache + slow-connection paths
 *  (the model is ~74MB quantized) but short enough to spot stuck loads. */
const WHISPER_LOAD_TIMEOUT_MS = 30_000;

const CELEBRATE_MS = 1100;

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
  const { t } = useTranslation();
  const silentMode = useSettings().settings.audio.silentMode;
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
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
  /** Cumulative attempts this mount. Unbounded — Spencer 2026-05-18
   *  retired the attempt-2 auto-pass; the learner picks when to bail. */
  const [attempts, setAttempts] = useState<number>(0);
  /** Set to true once `WHISPER_LOAD_TIMEOUT_MS` elapses with Whisper
   *  still loading — surfaces the "slow load — skip?" UI. Resets when
   *  the load completes or the component unmounts. */
  const [slowLoad, setSlowLoad] = useState<boolean>(false);

  // Watchdog: if Whisper hasn't loaded in WHISPER_LOAD_TIMEOUT_MS, flip
  // slowLoad so the helper text + skip button surface. Without this the
  // learner stares at "Loading Whisper model…" forever on stuck CDN /
  // blocked-network paths and never knows they can move on.
  useEffect(() => {
    if (!usingWhisper) return;
    if (whisperRecog.status === "ready" || whisperRecog.status === "error") {
      setSlowLoad(false);
      return;
    }
    if (whisperRecog.status !== "loading" && whisperRecog.status !== "idle") {
      return;
    }
    const t = setTimeout(() => setSlowLoad(true), WHISPER_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [usingWhisper, whisperRecog.status]);
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
      // Recognition errored (no-speech / no-mic / aborted / audio-capture
      // / not-supported / unknown). Count it as an attempt + log the
      // errorCode so a tester report of "mic didn't work" lands a real
      // diagnostic in the session log. Spencer 2026-05-18: no auto-pass.
      setMatch(null);
      setAttempts((prev) => {
        const next = prev + 1;
        setVerdict("try-again");
        pushSpeechLog({
          stepId: step.id,
          targetKana: step.targetPhrase,
          transcriptKana: "",
          attemptNumber: next,
          verdict: "fail",
          timestamp: Date.now(),
          errorCode: recog.error,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        });
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
      // Mic opened, audio captured, but no transcript returned. Common
      // failure mode: silent recording (muted hardware) or sub-200ms
      // utterance. Surface as no-speech in the log.
      setMatch(null);
      setAttempts((prev) => {
        const next = prev + 1;
        setVerdict("try-again");
        pushSpeechLog({
          stepId: step.id,
          targetKana: step.targetPhrase,
          transcriptKana: "",
          attemptNumber: next,
          verdict: "fail",
          timestamp: Date.now(),
          errorCode: "no-speech",
        });
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
        const next = prev + 1;
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
          // Celebrate any pass (perfect OR close) — the speech grader is
          // strict enough that "close" still means the learner produced a
          // recognizable utterance against the target. First-attempt-only
          // (next === 1) to match the MCQ semantics: reward the clean win.
          if (next === 1) {
            setCelebrationText(pickCelebrationText(t));
            setCelebrating(true);
            window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
          }
        } else {
          // Graded miss — no auto-pass at any attempt count. UI surfaces
          // Continue (skip) once attempts >= 2 so the learner picks.
          setVerdict("try-again");
          pushSpeechLog({
            stepId: step.id,
            targetKana: step.targetPhrase,
            transcriptKana: bestTranscript,
            attemptNumber: next,
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
    t,
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
    if (!supported) {
      return "Pronunciation isn't supported in this browser — Chrome, Edge, or Safari recommended.";
    }
    if (whisperLoading) {
      const pct =
        whisperProgress !== null ? Math.round(whisperProgress * 100) : null;
      if (slowLoad) {
        return pct !== null
          ? `Speech model still loading (${pct}%) — slow connection? You can skip this step.`
          : "Speech model still loading — slow connection? You can skip this step.";
      }
      return pct !== null
        ? `Loading speech model (one-time download)… ${pct}%`
        : "Loading speech model (one-time download)…";
    }
    if (whisperTranscribing) return "Transcribing…";
    if (recog.error === "no-mic") {
      return "Microphone access blocked. Tap the mic icon in your browser's address bar, allow it, then try again.";
    }
    if (recog.error === "no-speech") {
      return "We didn't hear anything — speak louder, move closer, or check your mic isn't muted.";
    }
    if (recog.error === "audio-capture") {
      return "Couldn't access your mic — check it isn't being used by another app and try again.";
    }
    if (recog.error === "not-supported") {
      return "Your browser blocked speech recognition. Skip this step or try Chrome / Edge / Safari.";
    }
    if (recog.error && recog.error !== "aborted") {
      return "Speech recognition hit an error. Try again, or skip to keep moving.";
    }
    if (recog.listening) return "Listening…";
    if (verdict === "perfect") return "Perfect!";
    if (verdict === "close") {
      return bestAltText
        ? `Close — sounded like “${bestAltText}”.`
        : "Close — you can continue.";
    }
    if (verdict === "try-again" && attempts >= 2) {
      return "Still not quite — keep trying, or continue if you'd like to move on.";
    }
    if (verdict === "try-again" && attempts > 0) {
      return "Not quite — give it one more go.";
    }
    return "Tap the mic and say the phrase aloud.";
  })();

  const helperToneClass = (() => {
    if (verdict === "perfect") return "text-success";
    if (verdict === "close") return "text-warning";
    if (recog.error && recog.error !== "aborted") return "text-danger";
    if (slowLoad && whisperLoading) return "text-warning";
    if (verdict === "try-again" && attempts > 0) return "text-danger";
    return "text-text-secondary";
  })();

  // Persistent-error escape — surface the skip immediately on these,
  // don't force the learner to burn 2 fake attempts. Per Spencer
  // 2026-05-18 ("anything we can do to gate that?"): the learner
  // shouldn't have to guess whether the issue is fixable.
  const recognitionUnusable =
    !supported ||
    recog.error === "no-mic" ||
    recog.error === "audio-capture" ||
    recog.error === "not-supported" ||
    (whisperLoading && slowLoad);

  // After any pass, Continue is available immediately.
  const passed = verdict === "perfect" || verdict === "close";
  // After 2+ failed attempts OR a persistent error, Continue (skip) is
  // available — the learner chooses to bail or keep trying.
  const canSkipAfterTry =
    !passed && (attempts >= 2 || recognitionUnusable);
  const canContinue = passed || canSkipAfterTry;

  // No mic / unsupported browser → graceful Continue (don't punish
  // Firefox / no-permission flows).
  const fallbackContinue = !supported;

  // Skip-after-fail handler: log the explicit opt-out and complete the
  // step as NOT-passed (false). Distinct from `onContinue` which is the
  // post-pass advance.
  function handleSkip() {
    pushSpeechLog({
      stepId: step.id,
      targetKana: step.targetPhrase,
      transcriptKana: bestAltText,
      attemptNumber: Math.max(attempts, 1),
      verdict: "continued",
      timestamp: Date.now(),
      errorCode: recog.error ?? undefined,
      userAgent: recog.error
        ? typeof navigator !== "undefined"
          ? navigator.userAgent
          : undefined
        : undefined,
    });
    if (onComplete) onComplete(step.id, false);
    onContinue();
  }

  const hasSubmittedWrong = attempts > 0 && !passed;

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
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

      <div className="relative flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface px-5 py-6 shadow-[var(--shadow-card)]">
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

        {/* Try-again button — unbounded; the learner picks when to bail
            (Spencer 2026-05-18). Hidden when recognition is genuinely
            unusable (no-mic / unsupported / slow Whisper) — the Continue
            (skip) button handles those paths. */}
        {verdict === "try-again" &&
          !recog.listening &&
          !whisperLoading &&
          !whisperTranscribing &&
          !recognitionUnusable && (
            <button
              type="button"
              onClick={handleRecord}
              className="rounded-xl border-[1.5px] border-border bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide text-text-secondary transition hover:bg-surface-muted"
            >
              {attempts >= 2 ? "Keep trying" : "Try again"}
            </button>
          )}

        {/* When the error is fixable (mic permission denied) offer an
            explicit retry that re-invokes the mic request — Spencer's
            "anything we can do to gate that?" — surface the action so
            the learner knows they can recover without leaving the
            lesson. */}
        {recog.error === "no-mic" && !recog.listening && (
          <button
            type="button"
            onClick={handleRecord}
            className="rounded-xl border-[1.5px] border-danger/40 bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide text-danger transition hover:bg-danger/10"
          >
            Retry mic permission
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
        {celebrating && <CelebrationToast text={celebrationText} />}
      </div>

      {passed ? (
        celebrating ? (
          <div className="invisible" aria-hidden>
            <ContinueButton onClick={() => {}} />
          </div>
        ) : (
          <ContinueButton
            onClick={onContinue}
            variant={verdict === "perfect" ? "correct" : undefined}
            label={verdict === "close" ? "Continue anyway" : undefined}
          />
        )
      ) : canSkipAfterTry ? (
        // After 2 fails OR a persistent error: explicit opt-out. Not
        // styled as success — uses the secondary surface so the
        // pass/no-pass distinction stays legible. Logs verdict
        // "continued" + the active errorCode for tester triage.
        <button
          type="button"
          onClick={handleSkip}
          className="w-full rounded-xl border-[1.5px] border-border bg-surface px-6 py-3.5 text-base font-bold uppercase tracking-wide text-text-secondary transition hover:bg-surface-muted"
        >
          {recognitionUnusable ? "Skip this step" : "Continue without passing"}
        </button>
      ) : fallbackContinue ? (
        // Unsupported browser → ungraded continue. Distinct from the
        // skip-after-try path (this never logs a "continued" entry —
        // the engine never had a chance).
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
  // After a fail, show the target side-by-side so the learner can compare
  // what they said to what was wanted. ("auto-pass" was retired
  // 2026-05-18 — the only non-passed branch is now "try-again".)
  const showSideBySide = !passed && verdict === "try-again";
  const transcriptRomaji = showRomaji ? kanaToRomajiHint(transcriptKana) : "";
  const targetRomaji = showRomaji ? kanaToRomajiHint(targetKana) : "";

  return (
    <div className="w-full rounded-xl bg-surface-muted px-4 py-3 text-base text-text-primary">
      <div className="flex items-start gap-3">
        <span
          className={`text-lg leading-none ${passed ? "text-success" : "text-danger"}`}
          aria-hidden
        >
          {passed ? "✓" : "✗"}
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
