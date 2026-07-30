import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { generatePracticeItems, type PracticeItem } from "@/features/practice/engine";
import { getSpeechRecognitionLang, getTtsLang } from "./data/practiceDataLoader";
import { usePrefetchAudio } from "@/shared/tts/prefetch";
import { scoreAlternativesGeneric } from "@/shared/speech/loose-match";
import { getCardState, setCardState, gradeFromLesson } from "@/features/flashcards/engine";
import { playJaAudio } from "@/shared/tts";
import { recordPracticeResult } from "./practiceStats";

/** How many items make up one speaking session. */
const SESSION_SIZE = 12;

type Verdict = "idle" | "perfect" | "close" | "try-again";

// The DOM SpeechRecognition globals aren't in this project's lib config, so we
// describe the slice we use structurally (mirrors shared/speech/useSpeechRecognition).
type RecognitionAlt = { transcript: string; confidence?: number };
type RecognitionEventLike = {
  results: ArrayLike<ArrayLike<RecognitionAlt>>;
};
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionLike;
  webkitSpeechRecognition?: new () => RecognitionLike;
};

/**
 * Speaking practice — a calm generated session drawn from the words the
 * learner is actually learning (SRS-weighted toward due / struggling vocab).
 *
 * Each item is either an ECHO (say a known word / generated sentence shown on
 * screen) or a RESPONSE (a question is played; the learner answers aloud, the
 * target answer stays hidden until graded). We reuse the exact grading path the
 * lesson SpeakingStepView uses — `scoreAlternativesGeneric` (incl. its Korean-
 * number handling) — and lightly credit the `production` modality for the atoms
 * an item exercises after a correct/close attempt.
 */
export function SpeakingPracticePage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const ttsLang = getTtsLang(langId);
  const speechLang = getSpeechRecognitionLang(langId);

  const speechSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    [],
  );

  // A stable per-session seed → the session is deterministic (won't reshuffle
  // under you) but a fresh one every "New session".
  const [seed, setSeed] = useState<number>(() => Date.now());
  const sessionKey = `${langId}:${seed}`;

  const items = useMemo(
    () => generatePracticeItems(langId, { surface: "speaking", count: SESSION_SIZE, seed }),
    [langId, seed],
  );

  // Warm this session's clips up front (audio is served from the CDN).
  const prefetchTexts = useMemo(
    () => items.map((it) => it.promptAudioText ?? it.target),
    [items],
  );
  usePrefetchAudio(prefetchTexts, ttsLang);

  // Session cursor + running score.
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [completed, setCompleted] = useState(0);

  // Per-item interaction state.
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict>("idle");
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [resolved, setResolved] = useState(false);

  // New session / language switch → full reset.
  useEffect(() => {
    setIndex(0);
    setCorrect(0);
    setCompleted(0);
    setIsRecording(false);
    setTranscript(null);
    setVerdict("idle");
    setAttempts(0);
    setRevealed(false);
    setResolved(false);
  }, [sessionKey]);

  const item = items[index] as PracticeItem | undefined;

  // A response item plays a distinct question and hides the answer until graded;
  // an echo item shows the target and asks the learner to repeat it.
  const isResponse = !!item && !!item.promptAudioText && item.promptAudioText !== item.target;
  const answerHidden = isResponse && verdict === "idle" && !revealed;

  const resetItemState = useCallback(() => {
    setIsRecording(false);
    setTranscript(null);
    setVerdict("idle");
    setAttempts(0);
    setRevealed(false);
    setResolved(false);
  }, []);

  const handlePlay = useCallback(() => {
    if (!item) return;
    void playJaAudio(item.promptAudioText ?? item.target, ttsLang);
  }, [item, ttsLang]);

  /** Lightly credit the production modality for the atoms this item exercised. */
  const creditSrs = useCallback((exercised: readonly string[], retried: boolean) => {
    for (const id of exercised) {
      const state = getCardState(id);
      if (!state) continue; // conservative: only reinforce cards that already have SRS state
      setCardState(id, gradeFromLesson(state, "production", { correct: true, retried }));
    }
  }, []);

  const markCorrect = useCallback(
    (exercised: readonly string[], retried: boolean) => {
      if (resolved) return;
      setResolved(true);
      setCorrect((c) => c + 1);
      creditSrs(exercised, retried);
    },
    [resolved, creditSrs],
  );

  const advance = useCallback(() => {
    setCompleted((c) => c + 1);
    setIndex((i) => i + 1);
    resetItemState();
  }, [resetItemState]);

  const gradeAlternatives = useCallback(
    (alts: { transcript: string; confidence?: number }[]) => {
      if (!item) return;
      const retried = attempts > 0;
      const result = scoreAlternativesGeneric(item.target, alts);
      const passed = result.verdict === "perfect" || result.verdict === "close";
      setAttempts((a) => a + 1);
      setVerdict(result.verdict);
      setTranscript(result.bestAlternative?.raw ?? alts[0]?.transcript ?? "");
      recordPracticeResult("speaking", item.id, passed);
      if (passed) markCorrect(item.exercisedAtomIds, retried);
    },
    [item, attempts, markCorrect],
  );

  const handleRecord = useCallback(() => {
    if (!item) return;
    if (!speechSupported) {
      setRevealed(true);
      return;
    }
    setIsRecording(true);
    setTranscript(null);
    setVerdict("idle");

    const speechWindow = window as SpeechWindow;
    const SpeechRecognitionCtor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsRecording(false);
      setRevealed(true);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: RecognitionEventLike) => {
      const first = event.results[0];
      const alts: { transcript: string; confidence?: number }[] = [];
      for (let i = 0; i < first.length; i++) {
        alts.push({ transcript: first[i].transcript, confidence: first[i].confidence });
      }
      setIsRecording(false);
      gradeAlternatives(alts);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setVerdict("try-again");
      setAttempts((a) => a + 1);
      setTranscript(null);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  }, [item, speechSupported, speechLang, gradeAlternatives]);

  const passed = verdict === "perfect" || verdict === "close";
  const missed = verdict === "try-again";

  // ── Low-vocab / empty session ──────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <SessionHeader t={t} />
        <EmptyState
          icon={<Icon name="mic" size={28} />}
          title={t(
            "practice.speaking.emptyTitle",
            "Keep learning to unlock speaking practice",
          )}
          description={t(
            "practice.speaking.emptyBody",
            "Speaking prompts are built from the words you've learned. Complete a few more lessons and they'll show up here.",
          )}
        />
      </div>
    );
  }

  // ── Session complete ────────────────────────────────────────────────────────
  if (index >= items.length) {
    return (
      <div className="space-y-4">
        <SessionHeader t={t} />
        <Card padding="lg" className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Icon name="check" size={28} strokeWidth={3} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-text-primary">
            {t("practice.speaking.doneTitle", "Nice speaking session")}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t("practice.speaking.doneScore", "You got {{correct}} of {{total}} out loud.", {
              correct,
              total: completed,
            })}
          </p>
          <div className="mt-5 flex items-center justify-center">
            <Button variant="primary" onClick={() => setSeed(Date.now())}>
              <span className="inline-flex items-center gap-2">
                <Icon name="rotateCcw" size={16} aria-hidden />
                {t("practice.speaking.newSession", "New session")}
              </span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const instruction = isResponse
    ? t("practice.speaking.instructionRespond", "Listen, then answer aloud:")
    : t("practice.speaking.instructionRepeat", "Listen, then say it aloud:");

  const helper = (() => {
    if (isRecording) return t("practice.speaking.listening", "Listening…");
    if (verdict === "perfect") return t("practice.speaking.perfect", "Perfect!");
    if (verdict === "close") return t("practice.speaking.closeFeedback", "Close — nicely done.");
    if (missed) return t("practice.speaking.tryAgainFeedback", "Not quite — give it another go.");
    if (revealed)
      return t("practice.speaking.selfRatePrompt", "Say it aloud, then rate yourself.");
    return t("practice.speaking.prompt", "Tap the mic and speak.");
  })();
  const helperTone = passed
    ? "text-success"
    : missed
      ? "text-danger"
      : "text-text-secondary";

  return (
    <div className="space-y-4">
      <SessionHeader t={t} />

      {/* Progress + new session */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">
          {t("practice.speaking.progress", "Item {{current}} of {{total}}", {
            current: index + 1,
            total: items.length,
          })}
        </span>
        <button
          type="button"
          onClick={() => setSeed(Date.now())}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary transition hover:bg-surface-muted"
        >
          <Icon name="rotateCcw" size={13} aria-hidden />
          {t("practice.speaking.newSession", "New session")}
        </button>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted" aria-hidden>
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${((index + (resolved ? 1 : 0)) / items.length) * 100}%` }}
        />
      </div>

      {/* Prompt card */}
      <Card padding="lg" className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {instruction}
        </p>

        {answerHidden ? (
          <p className="mt-4 text-sm text-text-muted">
            {t("practice.speaking.questionHidden", "Play the question, then answer in the target language.")}
          </p>
        ) : (
          <>
            <p className="mt-4 text-2xl font-bold text-text-primary" lang={langId}>
              {item!.target}
            </p>
            {item!.reading && (
              <p className="mt-1 text-sm text-text-secondary">{item!.reading}</p>
            )}
            {item!.translation && (
              <p className="mt-1 text-sm text-text-muted">{item!.translation}</p>
            )}
          </>
        )}

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-muted transition hover:bg-surface"
            aria-label={t("practice.speaking.playAria", "Play audio")}
          >
            <Icon name="volume" size={20} className="text-accent" />
          </button>

          {!passed && (
            <button
              type="button"
              onClick={handleRecord}
              disabled={isRecording}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                isRecording
                  ? "animate-pulse bg-error text-accent-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent-hover"
              }`}
              aria-label={
                speechSupported
                  ? isRecording
                    ? t("practice.speaking.recordingAria", "Recording…")
                    : t("practice.speaking.recordAria", "Tap to speak")
                  : t("practice.speaking.revealAria", "Reveal answer")
              }
            >
              <Icon name={speechSupported ? "mic" : "volume"} size={24} />
            </button>
          )}
        </div>

        <p className={`mt-4 min-h-[1.5rem] text-sm ${helperTone}`}>{helper}</p>

        {transcript && (
          <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2">
            <Icon
              name={passed ? "check" : "close"}
              size={16}
              className={passed ? "text-success" : "text-danger"}
              aria-hidden
            />
            <span className="text-xs text-text-muted">
              {t("practice.speaking.youSaid", "You said")}
            </span>
            <span className="text-sm text-text-primary" lang={langId}>
              {transcript}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {passed ? (
            <Button variant="primary" onClick={advance}>
              <span className="inline-flex items-center gap-1.5">
                {t("practice.speaking.next", "Next")}
                <Icon name="arrowRight" size={16} aria-hidden />
              </span>
            </Button>
          ) : missed ? (
            <>
              <Button variant="secondary" onClick={handleRecord}>
                {t("practice.speaking.tryAgain", "Try again")}
              </Button>
              <Button variant="ghost" onClick={advance}>
                {t("practice.speaking.skip", "Skip")}
              </Button>
            </>
          ) : revealed ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  if (item) markCorrect(item.exercisedAtomIds, false);
                  advance();
                }}
              >
                {t("practice.speaking.gotIt", "I said it")}
              </Button>
              <Button variant="ghost" onClick={advance}>
                {t("practice.speaking.notYet", "Not yet")}
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={advance}
              className="text-xs text-text-muted transition hover:text-text-secondary"
            >
              {t("practice.speaking.skip", "Skip")}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

function SessionHeader({ t }: { t: (key: string, def: string) => string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("practice.speaking.title", "Speaking Practice")}
      </h1>
      <p className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
        <Icon name="sparkles" size={14} className="text-accent" aria-hidden />
        {t("practice.speaking.subtitle", "Built from the words you're learning.")}
      </p>
    </div>
  );
}
